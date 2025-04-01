import httpx
import asyncio
import time

from bridge.gemini_bridge import GeminiBridge

async def make_request_with_retry(url, data, headers, max_retries=3, retry_delay=5):
    bridge = GeminiBridge()
    bridge.init({
        "api_key": "AIzaSyCMmlRoQWhtBNMtEmbSKJIntB8SO5WGTBY",
    })
    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt in range(max_retries):
            try:
                
                response = await bridge.chat(data, {})
                return response
            except httpx.ReadTimeout:
                print(f"请求超时 (第 {attempt + 1}/{max_retries} 次尝试)")
                if attempt < max_retries - 1:
                    print(f"等待 {retry_delay} 秒后重试...")
                    await asyncio.sleep(retry_delay)
                else:
                    print("达到最大重试次数，放弃请求")
                    return None # Or raise the exception
            except httpx.RequestError as e: # Catch other potential errors
                print(f"请求错误: {e}")
                return None

async def main():
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyCMmlRoQWhtBNMtEmbSKJIntB8SO5WGTBY"
    data = [{"role": "user", "content": "Hello"}]
    headers = {"Content-Type": "application/json"}
    result = await make_request_with_retry(url, data, headers)
    if result:
        print(result)

asyncio.run(main())

