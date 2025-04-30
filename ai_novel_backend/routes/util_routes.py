from fastapi import APIRouter, File, UploadFile, HTTPException
import httpx
import os
from typing import Optional, Dict, Any


router = APIRouter(prefix="/utils", tags=["utils"])


@router.post("/upload-image")
async def upload_image(file: UploadFile) -> Dict[str, Any]:
    """
    上传图片到服务器
    
    Args:
        file: 上传的文件
        
    Returns:
        Dict[str, Any]: 包含上传结果的字典，成功时包含图片URL
    """
    try:
        # 验证文件是否为图片
        content_type = file.content_type or ""
        if not content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="只能上传图片文件")
            
        upload_url = "https://img.leebay.cyou/upload?authCode=root"
        
        # 获取文件名
        file_name = os.path.basename(file.filename)
        
        # 直接读取文件内容
        file_content = await file.read()
        
        # 构建multipart/form-data请求
        files = {
            'file': (
                file_name,
                file_content,
                content_type
            )
        }
        
        # 设置请求头
        headers = {
            'User-Agent': 'Apifox/1.0.0 (https://apifox.com)',
            'Accept': '*/*',
            'Host': 'img.leebay.cyou',
            'Connection': 'keep-alive'
        }
        
        # 发送请求
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                upload_url,
                files=files,
                headers=headers
            )
            
            # 检查响应状态码
            if response.status_code != 200:
                return {
                    "success": False,
                    "message": f"上传失败，服务器返回状态码: {response.status_code}",
                    "data": None
                }
            
            # 解析响应内容
            try:
                result = response.json()
            except Exception as json_error:
                return {
                    "success": False,
                    "message": f"解析响应失败: {str(json_error)}",
                    "data": None
                }
            
            # 提取图片URL
            image_url = None
            if isinstance(result, list) and len(result) > 0:
                image_url = result[0].get('src')
            elif isinstance(result, dict):
                image_url = result.get('src') or result.get('url') or result.get('data', {}).get('url')
            elif isinstance(result, str):
                image_url = result
            
            if image_url:
                
                return {
                    "success": True,
                    "message": "上传成功",
                    "data": {"url": f"https://img.leebay.cyou{image_url}"}
                }
            else:
                return {
                    "success": False,
                    "message": "无法从响应中获取图片URL",
                    "data": result
                }
            
    except HTTPException as he:
        # 重新抛出HTTP异常
        raise he
    except Exception as e:
        # 捕获其他所有异常
        return {
            "success": False,
            "message": f"上传失败: {str(e)}",
            "data": None
        }


@router.post("/upload-file")
async def upload_file(file: UploadFile) -> Dict[str, Any]:
    """
    上传任意文件到服务器
    
    Args:
        file: 上传的文件
        
    Returns:
        Dict[str, Any]: 包含上传结果的字典，成功时包含文件URL
    """
    try:
        upload_url = "https://img.leebay.cyou/upload?authCode=root"
        
        # 获取文件名
        file_name = os.path.basename(file.filename)
        
        # 获取内容类型
        content_type = file.content_type or "application/octet-stream"
        
        # 直接读取文件内容
        file_content = await file.read()
        
        # 构建multipart/form-data请求
        files = {
            'file': (
                file_name,
                file_content,
                content_type
            )
        }
        
        # 设置请求头
        headers = {
            'User-Agent': 'FastAPI/1.0',
            'Accept': '*/*',
            'Host': 'img.leebay.cyou',
            'Connection': 'keep-alive'
        }
        
        # 发送请求
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                upload_url,
                files=files,
                headers=headers
            )
            
            # 检查响应状态码
            if response.status_code != 200:
                return {
                    "success": False,
                    "message": f"上传失败，服务器返回状态码: {response.status_code}",
                    "data": None
                }
            
            # 解析响应内容
            try:
                result = response.json()
            except Exception as json_error:
                return {
                    "success": False,
                    "message": f"解析响应失败: {str(json_error)}",
                    "data": None
                }
            
            # 提取文件URL
            file_url = None
            if isinstance(result, list) and len(result) > 0:
                file_url = result[0].get('src')
            elif isinstance(result, dict):
                file_url = result.get('src') or result.get('url') or result.get('data', {}).get('url')
            elif isinstance(result, str):
                file_url = result
            
            if file_url:
                return {
                    "success": True,
                    "message": "上传成功",
                    "data": {"url": file_url}
                }
            else:
                return {
                    "success": False,
                    "message": "无法从响应中获取文件URL",
                    "data": result
                }
            
    except Exception as e:
        return {
            "success": False,
            "message": f"上传失败: {str(e)}",
            "data": None
        }
