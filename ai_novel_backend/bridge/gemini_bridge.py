import httpx
from typing import Dict, List, Optional, Any
import json

class GeminiBridge:
    def __init__(self):
        self.api_key = ''
        self.base_url = 'https://generativelanguage.googleapis.com'
        
    def init(self, config: Dict[str, str]):
        """初始化配置"""
        self.api_key = config.get('api_key')
        self.base_url = config.get('base_url', self.base_url)
        
    async def chat(self, messages: List[Dict], options: Dict = {}) -> Dict:
        """基础聊天请求"""
        headers = {
            "Content-Type": "application/json"
        }
        print(messages)
        contents = [
            {
                "role": "model" if msg["role"] == "assistant" else "user",
                "parts": [{"text": msg["content"]}]
            }
            for msg in messages
        ]
        print(contents)
        
        data = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": options.get("max_tokens"),
                "topP": options.get("top_p")
            }
        }
        
        model = options.get("model", "gemini-pro")
        url = f"{self.base_url}/v1beta/models/{model}:generateContent?key={self.api_key}"
        print(url)
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=data, headers=headers)
                response_data = response.json()
                print(response_data)
                if "error" in response_data:
                    raise Exception(f"Gemini API Error:{response_data['error']}")
                return {
                    "choices": [{
                        "message": {
                            "role": "assistant",
                            "content": response_data["candidates"][0]["content"]["parts"][0]["text"]
                        }
                    }]
                }
        except Exception as e:
            print('Gemini chat error:', str(e))
            raise e
            
    async def stream_chat(self, messages: List[Dict], callback: Any, options: Dict = {}) -> None:
        """流式响应"""
        try:
            headers = {
                "Content-Type": "application/json"
            }
            
            # 转换所有历史消息
            contents = [
                {
                    "role": "model" if msg["role"] == "assistant" else "user",
                    "parts": [{"text": msg["content"]}]
                }
                for msg in messages
            ]
            
            data = {
                "contents": contents,
                "generationConfig": {
                    "temperature": options.get("temperature"),
                    "maxOutputTokens": options.get("max_tokens"),
                    "topP": options.get("top_p")
                }
            }
            
            model = options.get("model", "gemini-pro")
            url = f"{self.base_url}/v1beta/models/{model}:streamGenerateContent?key={self.api_key}"
            
            async with httpx.AsyncClient() as client:
                async with client.stream('POST', url, json=data, headers=headers) as response:
                    buffer = ''
                    
                    async for chunk in response.aiter_bytes():
                        buffer += chunk.decode('utf-8')
                        boundary = buffer.find('\n')
                        
                        while boundary != -1:
                            line = buffer[:boundary].strip()
                            buffer = buffer[boundary + 1:]
                            
                            if line.startswith('"text":'):
                                try:
                                    # 去掉第一个和最后一个字符
                                    text = line[9:].strip()[:-1]
                                    
                                    if text:
                                        await callback({
                                            "choices": [{
                                                "delta": {"content": text},
                                                "finish_reason": None
                                            }]
                                        })
                                except Exception as e:
                                    print('Error parsing stream data:', str(e), "Partial data:", line)
                                    buffer = line + buffer
                                    break
                                    
                            boundary = buffer.find('\n')
                    
                    # 发送完成标记
                    await callback({
                        "choices": [{
                            "delta": {},
                            "finish_reason": "stop"
                        }]
                    })
                    
        except Exception as e:
            print('Gemini stream chat error:', str(e))
            raise e
            
    async def list_models(self) -> Dict:
        """获取模型列表"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/v1beta/models?key={self.api_key}")
                
                if response.status_code != 200:
                    raise Exception('获取模型列表失败')
                
                data = response.json()
                return {
                    "data": [
                        {
                            "id": model["name"],
                            "name": model["displayName"],
                            "description": model["description"],
                            "inputTokenLimit": model["inputTokenLimit"],
                            "outputTokenLimit": model["outputTokenLimit"],
                            "supportedGenerationMethods": model["supportedGenerationMethods"]
                        }
                        for model in data["models"]
                    ]
                }
        except Exception as e:
            print('Gemini list models error:', str(e))
            raise e

# 创建单例实例
gemini_bridge = GeminiBridge()
