import os
from httpx import request
import openai
from typing import Dict, List, Optional, Any
import json
import requests

from schemas import GenerateImageRequest


# 单例模式
class OpenAIBridge:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(OpenAIBridge, cls).__new__(cls, *args, **kwargs)
        return cls._instance
    
    def __init__(self):
        self.base_url = ''
        self.api_key = ''

    def init(self, config: Dict[str, str]):
        """初始化配置"""
        self.base_url = config.get('base_url')
        self.api_key = config.get('api_key')


class OpenAIBridge:
    def __init__(self):
        self.base_url = ''
        self.api_key = ''
        
    def init(self, config: Dict[str, str]):
        """初始化配置"""
        self.base_url = config.get('base_url')
        self.api_key = config.get('api_key')


    def chat(self, messages: List[Dict], options: Dict = {}) -> Dict:
        """基础聊天请求"""
        data = {
            "model": options.get('model', 'gpt-4o-mini'),
            "temperature": options.get('temperature', 0.7),
            "max_tokens": options.get('max_tokens', 4096),
            "top_p": options.get('top_p', 1),
            "stream":  False,
            "frequency_penalty": options.get('frequency_penalty', 0),
            "presence_penalty": options.get('presence_penalty', 0),
            "stop": options.get('stop', []),
        }

        if options.get('model')!= 'deepseek-reasoner':
            data["tools"] = options.get('tools', [])
        if options.get('tools'):
            data["tools"] = options.get('tools', [])
            data["tool_choice"] = "auto"

        """基础聊天请求"""
        try:
            
            data["messages"] = [
                {
                    'role': msg['role'],
                    'content': msg['content']
                }
                for msg in messages
            ]

            response = openai.chat.completions.create(

                model=options.get('model', 'gpt-4o-mini'),
                messages=data["messages"],
                stream=False,
            )
            if not response:
                    error_data = response.json()
                    print('API Error:', error_data)
                    raise Exception(error_data.get('message', '请求失败'))
            else:
                    return response.choices[0].message.content
        except Exception as e:
            print('OpenAI chat error:', str(e))
            raise e

        
        
    async def chat_stream(self, messages: List[Dict], options: Dict = {}) -> Dict:

   
        """基础聊天请求"""
        try:
           
            
            messages = [
                {
                    'role': msg['role'],
                    'content': msg['content']
                }
                for msg in messages
            ]

            api_response = openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                stream=True,
                temperature=0.7,
            )

            response = request.response(content_type="text/event-stream")

            print(api_response,"api_response")

            answer = ""

            for part in api_response:
                finish_reason = part.choices[0].finish_reason
                if "content" in part.choices[0].delta:
                    content = part.choices[0].delta.content
                    answer += content
                    await response.send(f"data: {content}\n\n")
                    yield content
                elif finish_reason:
                    await response.send(f"event: finish\ndata: {answer}\n\n")
    
        except Exception as e:
            print('OpenAI chat error:', str(e))
            raise e
        
            
    def generate_image(self, prompt: str, options: GenerateImageRequest = {}) -> Dict:
        """图像生成"""
        try:
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'prompt': prompt,
                'model':  'Kwai-Kolors/Kolors',
                'batch_size':  1,
                'seed':  42,
                'guidance_scale':  7.5,
                'num_inference_steps':  20,
                'size': '1024x1024',
                'negative_prompt': '',
            }
            
            response = requests.post(
                f"{self.base_url}/images/generations",
                headers=headers,
                json=data
            )
            
            if response.status_code == 200:
                return response.json()
                
            raise Exception('图像生成请求失败')
            
        except Exception as e:
            print('OpenAI image generation error:', str(e))
            raise e
            
    def function_call(self, messages: List[Dict], tools: List[Dict], options: Dict = {}) -> Dict:
        """函数调用"""
        try:
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'model': options.get('model', 'gpt-4o-mini'),
                'messages': messages,
                'tools': tools,
                'tool_choice': options.get('tool_choice', 'auto'),
                **options
            }
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=data
            )
            
            if response.status_code == 200:
                return response.json()
                
            raise Exception('函数调用请求失败')
            
        except Exception as e:
            print('OpenAI function call error:', str(e))
            raise e
            
    def list_models(self) -> Dict:
        """获取模型列表"""
        try:
            headers = {
                'Authorization': f'Bearer {self.api_key}'
            }
            
            response = requests.get(
                f"{self.base_url}/models",
                headers=headers
            )
            
            if response.status_code == 200:
                return response.json()
                
            raise Exception('获取模型列表失败')
            
        except Exception as e:
            print('OpenAI list models error:', str(e))
            raise e

# 创建单例实例
openai_bridge = OpenAIBridge()
