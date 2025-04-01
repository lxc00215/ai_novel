from fastapi import APIRouter, HTTPException
import httpx
import os
import aiofiles
import uuid
from typing import Optional
import tempfile

router = APIRouter(prefix="/utils", tags=["utils"])

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

async def upload_image(file_path: str) -> Optional[str]:
    """
    上传图片到服务器
    
    Args:
        file_path: 本地文件路径
        
    Returns:
        Optional[str]: 上传成功返回新的URL，失败返回None
    """
    try:
        upload_url = "https://img.leebay.cyou/upload?authCode=root"
        
        # 获取文件名和扩展名
        file_name = os.path.basename(file_path)
        print("file_name", file_name)
        content_type = 'form-data'
        
        async with aiofiles.open(file_path, 'rb') as f:
            file_content = await f.read()
            
        # 构建文件上传数据
        files = {
            'file': (
                file_name,  # 使用原始文件名
                file_content,
                content_type  # 根据文件扩展名设置正确的content type
            )
        }
        
        # 设置完整的headers
        headers = {
            'User-Agent': 'Apifox/1.0.0 (https://apifox.com)',
            'Accept': '*/*',
            'Host': 'img.leebay.cyou',
            'Connection': 'keep-alive'
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                upload_url,
                files=files,
                headers=headers
            )
            response.raise_for_status()
            result = response.json()
            
            # 打印响应内容，用于调试
            print(f"Upload response: {response.text}")
            
            # 从响应中获取URL
            if isinstance(result, list):
                return result[0].get('src')
            elif isinstance(result, str):
                return result  # 如果响应直接是URL字符串
            return None
            
    except Exception as e:
        print(f"Upload image error: {e}")
        return None

@router.post("/transfer-image")
async def transfer_image(image_url: str):
    """
    转存图片：下载并重新上传
    
    Args:
        image_url: 原图片URL
        auth_code: 上传认证码
    """
    try:
        # 创建临时文件
        temp_dir = tempfile.gettempdir()
        temp_filename = f"{uuid.uuid4()}.jpg"
        temp_path = os.path.join(temp_dir, temp_filename)
        
        try:
            # 下载图片
            download_success = await download_image(image_url, temp_path)
            if not download_success:
                raise HTTPException(status_code=400, detail="Failed to download image")
            
            # 上传图片
            new_url = await upload_image(temp_path)
            print("new_url", new_url)
            if not new_url:
                raise HTTPException(status_code=400, detail="Failed to upload image")
            
            return {"image_url":f"https://img.leebay.cyou{new_url}"}
            
        finally:
            pass
        #     # 清理临时文件
        #     if os.path.exists(temp_path):
        #         os.remove(temp_path)
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
