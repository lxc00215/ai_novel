import json
import os
import tempfile
from typing import Optional
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import httpx
from schemas import GenerateImageRequest, ImageResponse
import dotenv
from bridge.openai_bridge import OpenAIBridge, get_bridge

dotenv.load_dotenv()

openai_bridge = OpenAIBridge()
openai_bridge.init({
    "api_key": os.getenv("OPENAI_API_KEY"),
    "base_url": os.getenv("OPENAI_BASE_URL"),
})

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/generate_images", response_model=ImageResponse)
async def generate_images(request: GenerateImageRequest):
    bridge = OpenAIBridge()
    bridge.init({
        "api_key": os.getenv("OPENAI_API_KEY"),
        "base_url": os.getenv("OPENAI_BASE_URL"),
    })
    result = bridge.generate_image(request.prompt,request)
    res = await transfer_image(result['images'][0]['url'])

    return ImageResponse(image=res['image_url'], timings=result['timings'], seed=result['seed'])

async def download_image(url: str, save_path: str) -> bool:
    """
    下载图片并保存到本地
    
    Args:
        url: 图片URL
        save_path: 保存路径
        
    Returns:
        bool: 下载是否成功
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Referer': url
        }
        
        async with httpx.AsyncClient(follow_redirects=True) as client:  # 允许跟随重定向
            response = await client.get(
                url,
                headers=headers,
                timeout=30.0  # 设置超时时间
            )
            
            # 打印状态码和响应头，用于调试
            print(f"Download status code: {response.status_code}")
            print(f"Download headers: {response.headers}")
            
            response.raise_for_status()
            
            # 检查内容类型
            content_type = response.headers.get('content-type', '').lower()
            if not (content_type.startswith('image/') or 'image' in content_type):
                print(f"Invalid content type: {content_type}")
                return False
            
            # 保存图片
            async with aiofiles.open(save_path, 'wb') as f:
                await f.write(response.content)
                
            # 验证文件是否成功保存
            if os.path.exists(save_path) and os.path.getsize(save_path) > 0:
                return True
            return False
            
    except httpx.HTTPStatusError as e:
        print(f"HTTP error occurred: {e.response.status_code} - {e.response.text}")
        return False
    except httpx.RequestError as e:
        print(f"Request error occurred: {e}")
        return False
    except Exception as e:
        print(f"Download image error: {e}")
        return False

import logging
import traceback

# 设置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

async def upload_image(file_path: str) -> Optional[str]:
    """上传图片到服务器"""
    try:
        upload_url = "https://img.leebay.cyou/upload?authCode=root"
        
        # 检查文件是否存在
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            return None
            
        # 记录文件信息
        logger.info(f"Uploading file: {file_path}")
        logger.info(f"File size: {os.path.getsize(file_path)} bytes")
        
        async with aiofiles.open(file_path, 'rb') as f:
            file_content = await f.read()
            logger.info(f"File content length: {len(file_content)} bytes")
            
        files = {
            'file': (
                os.path.basename(file_path),
                file_content,
                'multipart/form-data'
            )
        }
        
        headers = {
            'User-Agent': 'Apifox/1.0.0 (https://apifox.com)',
            'Accept': '*/*',
            'Host': 'img.leebay.cyou',
            'Connection': 'keep-alive'
        }
        
        logger.info("Sending request to upload server...")
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    upload_url,
                    files=files,
                    headers=headers,
                    timeout=30.0
                )
                
                # 记录响应信息
                logger.info(f"Response status code: {response.status_code}")
                logger.info(f"Response headers: {response.headers}")
                logger.info(f"Response content: {response.text}")
                
                response.raise_for_status()
                result = response.json()
                
                if isinstance(result, list) and result:
                    return result[0].get('src')
                else:
                    logger.error(f"Unexpected response format: {result}")
                    return None
                    
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP error: {e.response.status_code} - {e.response.text}")
                return None
            except httpx.RequestError as e:
                logger.error(f"Request error: {str(e)}")
                return None
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error: {str(e)}")
                logger.error(f"Raw response: {response.text}")
                return None
            
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return None
    

# @router.post("/test")
# async def test(bridge:OpenAIBridge = Depends(get_bridge)):
#     result = bridge.chat_stream([{"role":"user","content":"写一个冒泡排序算法"}])
#     return StreamingResponse(result, media_type="text/event-stream")

@router.post("/transfer-image")
async def transfer_image(image_url: str):
    """转存图片：下载并重新上传"""
    try:
        logger.info(f"Processing image URL: {image_url}")
        
        # 创建临时文件
        temp_dir = tempfile.gettempdir()
        temp_filename = f"{uuid.uuid4()}.jpg"
        temp_path = os.path.join(temp_dir, temp_filename)
        logger.info(f"Temporary file path: {temp_path}")
        
        try:
            # 下载图片
            logger.info("Downloading image...")
            download_success = await download_image(image_url, temp_path)
            if not download_success:
                logger.error("Failed to download image")
                raise HTTPException(status_code=400, detail="Failed to download image")
            
            # 验证下载的文件
            file_size = os.path.getsize(temp_path)
            logger.info(f"Downloaded file size: {file_size} bytes")
            
            # 上传图片
            logger.info("Uploading image...")
            new_url = await upload_image(temp_path)
            logger.info(f"Upload result URL: {new_url}")
            
            if not new_url:
                logger.error("Failed to upload image")
                raise HTTPException(status_code=400, detail="Failed to upload image")
            
            full_url = f"https://img.leebay.cyou{new_url}"
            logger.info(f"Final URL: {full_url}")
            return {"image_url": full_url}
            
        except Exception as e:
            logger.error(f"Error in transfer process: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
        finally:
            # 清理临时文件
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                    logger.info("Temporary file cleaned up")
                except Exception as e:
                    logger.error(f"Failed to clean up temporary file: {str(e)}")
                
    except Exception as e:
        logger.error(f"Transfer image error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

