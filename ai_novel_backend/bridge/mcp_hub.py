


import asyncio
import copy
import os
import json
from typing import Optional, Dict
from contextlib import AsyncExitStack
import logging


from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler("mcp_client.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("MCPClient")

class MCPClient:

    # 单例模式
    _instance = None
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    # 如何创建 MCPClient 实例？
    # 1. 使用单例模式


    
    def __init__(self, model: str = None):
        self.exit_stack = AsyncExitStack()
        self.session: Optional[ClientSession] = None
        self.conversation_history = []
        # 初始化OpenAI客户端
        self.clients = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_BASE_URL")
        )
        self.aviliable_tools = [] 
        # 默认模型
        self.model = model or "gemini-2.0-pro-exp-02-05"
        
    async def load_servers_from_config(self, config_path: str):
        """从配置文件加载多个MCP服务器"""
        logger.info(f"正在从配置文件加载MCP服务器: {config_path}")
        
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        for server_name, server_config in config.items():
            if server_config.get("disabled", False):
                logger.info(f"跳过已禁用的服务器: {server_name}")
                continue  
            logger.info(f"正在连接到服务器: {server_name}")
            try:
                await self.connect_to_server(server_name, server_config)
                logger.info(f"成功连接到服务器: {server_name}")
            except Exception as e:
                logger.error(f"连接到服务器 {server_name} 失败: {str(e)}")
                continue

    async def connect_to_server(self, server_name: str, server_config: Dict):
        """连接到单个MCP服务器"""
        if server_config.get("transportType") != "stdio":
            logger.warning(f"暂不支持非stdio类型的服务器: {server_name}")
            return
        
        import shutil
        cmd_path = shutil.which(server_config["command"])
        logger.info(f"命令路径: {cmd_path}")
        
        if not cmd_path:
            logger.error(f"命令 '{server_config['command']}' 不存在或不在PATH中")
            return
        server_params = StdioServerParameters(
            command=server_config["command"],
            args=server_config["args"],
            env=server_config.get("env", {})
        )

        print(server_params)




        stdio_transport = await self.exit_stack.enter_async_context(stdio_client(server_params))
        logger.info(f"服务器 {server_name} 连接成功，获取stdio_transport")
        stdio, write = stdio_transport
        logger.info(f"成功解析stdio_transport")
            
        self.session = await self.exit_stack.enter_async_context(ClientSession(stdio, write))
        logger.info(f"成功创建ClientSession")
        await self.session.initialize()
        logger.info(f"成功初始化ClientSession")
        
        # 获取可用工具列表
        response = await self.session.list_tools()

        available_tools = [{ 
                "type":"function",
                "function":{
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.inputSchema
            }
        } for tool in response.tools]
        processed_tools = prepare_tools_for_model(available_tools, self.model)

        self.aviliable_tools = self.aviliable_tools.append(processed_tools)
        # logger.info(f"服务器 {server_name} 可用工具: {[tool['name'] for tool in self.aviliable_tools]}")

    async def call_tool(self,prompt:str,is_raw_args:bool=False):
        response = self.clients.chat.completions.create(
            model=self.model,
            max_tokens=8000,
            messages=[{"role":"system","content":prompt}],
            tools=self.aviliable_tools,
            tool_choice="auto"
        )

        final_text = []

        for choice in response.choices:
            message = choice.message
            is_function_call = message.tool_calls
            if not is_function_call:
                final_text.append(message.content)
                # Add assistant's response to conversation history
                self.conversation_history.append({
                    "role": "assistant",
                    "content": message.content
                })
            else:
                tool_id = message.tool_calls[0].id
                tool_name = message.tool_calls[0].function.name
                print(message.tool_calls[0].function.arguments)
                raw_args = message.tool_calls[0].function.arguments
                print(f"原始参数: {raw_args}")
                tool_args = {}
        # 如果参数已经是字典类型，直接使用
                if isinstance(raw_args, dict):
                    tool_args = raw_args
                else:
                    # 尝试使用ast.literal_eval安全解析Python字典
                    import ast
                    try:
                        tool_args = ast.literal_eval(raw_args)
                    except (SyntaxError, ValueError):
                        # 如果literal_eval失败，尝试JSON解析
                        tool_args = json.loads(raw_args)

                # Execute tool call
                result = await self.session.call_tool(tool_name, tool_args)
                print(f"Tool call result: {result.content}\n")
                final_text.append(f"[Calling tool {tool_name} with args {tool_args}]")

                # Add the tool response to conversation history
                tool_content = result.content
                if isinstance(tool_content, list) and hasattr(tool_content[0], 'text'):
                    # TextContent对象列表处理
                    tool_content = "".join([item.text for item in tool_content if hasattr(item, 'text')])
                    
                self.conversation_history.append({
                    "role": "tool",
                    "tool_call_id": tool_id,
                    "content": str(tool_content)  # 确保是字符串
})
                if is_raw_args:
                    return {
                        "link":tool_content,
                        "raw_args":raw_args
                    }
                else:
                    return tool_content[0].text

    async def generate_link(self,money:int) -> str:
        # 构建提示词
        user_prompt = f"用户想要在web网页充值{money}元,请立刻为其生成支付链接（订单号是结合情境与时间生成，金额在1元-100000元之间，订单标题为“充值”即可），渲染给用户，并引导其完成付款。"
        return await self.call_tool(user_prompt,True)

    # 检查用户是否支付
    async def checkOrder(self,raw_args:str):
        prompt = f"我已支付,请查询订单状态,订单信息（包括订单号）在里面：{raw_args}"
        return await self.call_tool(prompt)
    
    async def cleanup(self):
        await self.exit_stack.aclose()
        print("MCP客户端已关闭")
    
    
async def main():
    print("启动多MCP客户端...")
    
    config_path = sys.argv[1]
    
    # 创建客户端
    client = MCPClient()
    try:
        await client.load_servers_from_config(config_path)
        obj = await client.generate_link(10)
        obj["link"]
        raw_args = obj["raw_args"]
        is_pay = input("是否支付？(y/n)")
        if is_pay == "y":
            result = await client.checkOrder(raw_args)
            if(result.contains("SUCCESS")):
                print("支付成功")
            else:
                print("支付失败")
    finally:
        await client.cleanup()

def prepare_tools_for_model(tools, model_name):
       """根据模型准备工具定义"""
       if "gemini" in model_name.lower():
           # Gemini兼容的工具定义
           gemini_tools = []
           print(tools)
           for tool in tools:
               # 复制工具定义
               gemini_tool = {
                   "type":"function",
                   "function": {}}
               gemini_tool["function"]["name"] = tool["function"]["name"]
               gemini_tool["function"]["description"] = tool["function"]["description"]
               # 处理参数，移除不兼容属性
               if "parameters" in tool["function"]:
                   params = copy.deepcopy(tool["function"]["parameters"])
                   clean_schema_for_gemini(params)
                   gemini_tool["function"]["parameters"] = params
               gemini_tools.append(gemini_tool)
           return gemini_tools
       else:
           # 其他模型使用原始工具定义
           return tools
       
def clean_schema_for_gemini(schema):
    """递归清理JSON Schema，移除Gemini不支持的属性"""
    # 移除顶层不支持的属性
    unsupported_props = ["multipleOf", "exclusiveMinimum", "exclusiveMaximum", 
                        "additionalProperties", "patternProperties", "dependencies"]
    for prop in unsupported_props:
        if prop in schema:
            del schema[prop]
    
    # 处理嵌套属性
    if "properties" in schema:
        for prop_name, prop_schema in schema["properties"].items():
            if isinstance(prop_schema, dict):
                clean_schema_for_gemini(prop_schema)
    
    # 处理数组项
    if "items" in schema and isinstance(schema["items"], dict):
        clean_schema_for_gemini(schema["items"])
        
    return schema


    # 根据支付金额生成支付链接 1、5、10元

if __name__ == "__main__":
    import sys
    asyncio.run(main())
        
