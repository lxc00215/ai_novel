# routes/payment_routes.py
import asyncio
from typing import Dict, Optional, Any
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from grpc import Status
from pydantic import BaseModel, Field

# 导入MCP客户端 
from util.mcpHub import MCPClient

router = APIRouter(prefix="/alipay", tags=["alipay"])


mcp_client: Optional[MCPClient] = None
is_initializing = False
async def background_init_mcp_client():
    global mcp_client
    try:
        client = MCPClient()
        await client.load_servers_from_config("mcp_servers.json")
        mcp_client = client
    except Exception as e:
        print(f"后台初始化MCP客户端失败: {str(e)}")

# 初始化客户端的异步函数
async def initialize_mcp_client():
    global mcp_client, is_initializing
    
    if mcp_client is not None:
        return mcp_client
    
    if is_initializing:
        # 等待初始化完成
        for _ in range(300):  # 最多等待30秒
            await asyncio.sleep(0.1)
            if mcp_client is not None:
                return mcp_client
        raise HTTPException(status_code=503, detail="MCP客户端初始化超时")
        
    try:
        is_initializing = True
        client = MCPClient()
        await client.load_servers_from_config("mcp_servers.json")
        mcp_client = client
        is_initializing = False
        return mcp_client
    except Exception as e:
        is_initializing = False
        raise HTTPException(status_code=500, detail=f"MCP客户端初始化失败: {str(e)}")


# 请求模型
class PaymentRequest(BaseModel):
    amount: str = Field(description="充值金额，范围1-100000元")
    description: Optional[str] = "充值"

class OrderCheckRequest(BaseModel):
    order_info: str = Field(..., description="订单信息，包含订单号等详情")

# 依赖函数，用于在端点中获取MCP客户端
async def get_mcp_client():
    if mcp_client is None:
        raise HTTPException(status_code=503, detail="支付服务暂不可用，请稍后重试")
    return mcp_client

# API端点 - 生成支付链接
@router.post("/create", response_model=Dict[str, Any])
async def create_payment(
    request: PaymentRequest,
    mcp: MCPClient = Depends(get_mcp_client)
):
    """
    创建支付订单并生成支付链接
    
    Args:
        request: 包含金额和描述的请求体
    """
    try:
        # 调用MCP生成支付链接
        result = await mcp.generate_link(request.amount)
        
        # 返回结果
        return {
            "link": result["link"],
            "amount": request.amount,
            "description": request.description,
            "order_info": result["raw_args"]  # 包含订单信息，用于后续查询
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"生成支付链接失败: {str(e)}"
        )

# API端点 - 查询订单状态
@router.post("/check", response_model=Dict[str, Any])
async def check_payment(
    request: OrderCheckRequest,
    mcp: MCPClient = Depends(get_mcp_client)
):
    """
    查询订单支付状态
    
    Args:
        request: 包含订单信息的请求体
    """
    try:
        # 调用MCP查询订单状态

        # request 转 字符串
        
        result = await mcp.checkOrder(request.order_info)
        
        # 检查结果中是否包含SUCCESS
        is_success = "SUCCESS" in result
        
        return {
            "status": "success" if is_success else "pending",
            "message": result,
            "paid": is_success
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"查询订单状态失败: {str(e)}"
        )

    

@router.get("/status")
async def check_mcp_status():
    """
    检查MCP客户端状态
    """
    global mcp_client, is_initializing
    
    if mcp_client is not None:
        return {"status": "ready", "message": "MCP客户端已初始化"}
    elif is_initializing:
        return {"status": "initializing", "message": "MCP客户端正在初始化"}
    else:
        return {"status": "not_initialized", "message": "MCP客户端未初始化"}

    
@router.post("/initialize")
async def force_initialize_mcp(background_tasks: BackgroundTasks):
    """
    强制初始化MCP客户端
    """
    global mcp_client, is_initializing
    
    if mcp_client is not None:
        return {"message": "MCP客户端已初始化"}
    
    if is_initializing:
        return {"message": "MCP客户端正在初始化"}
    
    # 在后台任务中初始化MCP客户端
    background_tasks.add_task(background_init_mcp_client)
    
    return {"message": "MCP客户端初始化任务已启动"}