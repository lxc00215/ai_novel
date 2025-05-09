import json
import os
import tempfile
from typing import AsyncGenerator, Optional
import uuid
import aiofiles
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
import httpx
from openai import AsyncOpenAI
from requests import Session
from sqlalchemy import select
from database import BookBreakdown, File as FileModel, get_db
from routes.feature_routes import get_feature_by_name
from schemas import AIAnalysisRequest, AIExpandRequest, BookBreakdownResponse, FileResponse, GenerateImageRequest, ImageResponse
from bridge.openai_bridge import OpenAIBridge

router = APIRouter(prefix="/ai", tags=["ai"])

UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload-file")
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        # 生成唯一文件ID
        file_id = str(uuid.uuid4())
        
        # 获取文件扩展名
        _, file_ext = os.path.splitext(file.filename)
        
        # 创建保存路径
        file_path = f"{UPLOAD_DIR}/{file_id}{file_ext}"
        
        # 保存上传的文件
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # 记录文件信息到数据库或缓存中
        file_data = {
            "file_id": file_id,
            "original_filename": file.filename,
            "file_path": file_path,
            "content_type": file.content_type,
            "file_size": len(content),
            "user_id": 4
        }
        # 保存文件信息到数据库

        new_file = FileModel(**file_data)
        db.add(new_file)
        await db.commit()

        # 这里可以添加保存文件信息到数据库或缓存中的逻辑
        return FileResponse(
            file_id=file_id,
            original_filename=file.filename,
            content_type=file.content_type,
            file_size=len(content),
            user_id=4,
            upload_date=new_file.upload_date
        )
        
    except Exception as e:
        logger.error(f"文件上传错误: {str(e)}")
        logger.error(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"文件上传失败: {str(e)}")


@router.post("/analyze-file",response_model=BookBreakdownResponse)
async def analyze_file(
    request: AIAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    分析已上传的文件
    
    Args:
        file_id: 上传文件时返回的文件ID
        analysis_type: 分析类型
        additional_instructions: 额外的分析指令
    """
    try:
        # 根据file_id查找文件信息
        # 这里应该从数据库或缓存中获取文件信息
        # 为了简化，这里直接在上传目录中查找
        title = ''
        # 查找文件路径
        result = await db.execute(select(FileModel).where(FileModel.file_id == request.file_id))
        file_record = result.scalar_one_or_none()
       
        if not file_record:
            raise HTTPException(status_code=404, detail="文件未找到")
        file_path = file_record.file_path
        file_name = file_record.original_filename
        
        if not file_path or not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="文件未找到")
       
        file_ext = os.path.splitext(file_name)[1].lower()
        
        # 根据扩展名判断内容类型
        content_type = ""
        if file_ext in ['.jpg', '.jpeg', '.png', '.gif']:
            content_type = f"image/{file_ext[1:]}"
        elif file_ext in ['.txt', '.md']:
            content_type = "text/plain"
        elif file_ext == '.pdf':
            content_type = "application/pdf"
        elif file_ext == '.docx':
            content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        else:
            content_type = "application/octet-stream"
        
        # 获取特性配置
        feature_config = get_feature_by_name("AI分析")
        
        # 准备文件信息
        user_message = ""
        
        # 构建用户消息
        if request.additional_instructions:
            user_message += f"\n\n额外说明: {request.additional_instructions}"
         # 初始化OpenAI桥接
        bridge = OpenAIBridge()
        bridge.init({
            "api_key": feature_config["api_key"],
            "base_url": feature_config["base_url"],
        })
        
        # 根据文件类型确定处理方法
        if content_type.startswith("image/"):
            # 处理图片：首先上传到图片服务器
            img_url = await upload_image(file_path)
            if not img_url:
                raise HTTPException(status_code=400, detail="图片上传失败")
            
            full_img_url = f"https://img.leebay.cyou{img_url}"
            user_message += f"\n\n图片链接: {full_img_url}"
            
            # 使用视觉模型进行分析
            if feature_config.get("supports_vision", False):
                result = bridge.chat([{
                    "role": "user", 
                    "content": [
                        {"type": "text", "text": user_message},
                        {"type": "image_url", "image_url": {"url": full_img_url}}
                    ]
                }], options={"model": feature_config["model"]})
            else:
                # 使用常规模型，只提供图片URL
                result = bridge.chat([{
                    "role": "user",
                    "content": "请尝试分析这个文件，提炼其中的爆点"
                }], options={"model": feature_config["model"]})

        elif content_type.startswith(("text/", "application/")):
            # 处理文本或文档文件：如果可能，读取内容
            with open(file_path, "rb") as f:
                content = f.read()
            if len(content) <= feature_config.get("max_content_size", 100000):  # 默认最大100KB
                try:
                    file_content = content.decode("utf-8", errors="replace")
                    user_message += f"\n\n文件内容:\n{file_content}"
                except Exception as e:
                    user_message += f"\n\n文件内容无法解码: {str(e)}"
            
            # 发送请求与文件内容
            result = bridge.chat([{
                "role": "system", 
                "content": feature_config["prompt"]
            }, {
                "role": "user",
                "content": user_message
            }], options={"model": feature_config["model"]})
        else:
             # 对于不支持的文件，仅提供元数据
            result = bridge.chat([{
                "role": "system", 
                "content": feature_config["prompt"]
            }, {
                "role": "user",
                "content": user_message + "\n\n请注意: 此文件类型不支持直接读取内容分析。"
            }], options={"model": feature_config["model"]})
         # 提取分析结果
        analysis_content = result["content"] if "content" in result else str(result)
        
        # 设置拆书标题
        if not title:
            title = f"{file_record.original_filename}"
        
        # 创建拆书记录
        breakdown_data = {
            "file_id": request.file_id,
            "title": title,
            "analysis_content": analysis_content,
            "analysis_type": "AI分析"
        }
        
        # 保存到数据库
        new_breakdown = BookBreakdown(**breakdown_data)
        db.add(new_breakdown)
        await db.commit()
        await db.refresh(new_breakdown)
        return BookBreakdownResponse(
            id=new_breakdown.id,
            file_id=request.file_id,
            title=title,
            analysis_content=analysis_content,
            analysis_type="AI分析",
            created_at=new_breakdown.created_at,
            updated_at=new_breakdown.updated_at
        )
            
    except Exception as e:
        logger.error(f"文件分析错误: {str(e)}")
        logger.error(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"分析失败: {str(e)}")

@router.post("/generate_images", response_model=ImageResponse)
async def generate_images(request: GenerateImageRequest):
    bridge = OpenAIBridge()
    feature_config = get_feature_by_name("绘画")
    bridge.init({
        "api_key": feature_config["api_key"],
        "base_url": feature_config["base_url"],
    })
    result = bridge.generate_image(request.prompt)
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
    


@router.post("/expand")
async def ai_expand(request: AIExpandRequest):

    feature_config = get_feature_by_name("AI扩写")
    content = request.content
    context = request.context

    if request.is_stream:

        # 构建消息
       

        messages = [
            {"role": "system", "content": feature_config["prompt"]},
            {"role": "user", "content": "上下文："+context+"\n\n 内容："+content+"请根据上下文扩写内容，不要超过1000字"}
        ]
        return StreamingResponse(generate_response(messages, feature_config["model"]), media_type="text/event-stream",headers={"Cache-Control": "no-cache", "Connection": "keep-alive"})

    else:
        feature_config = get_feature_by_name("AI扩写")
        bridge = OpenAIBridge()
        bridge.init({
        "api_key": feature_config["api_key"],
        "base_url": feature_config["base_url"],
    })
   
        result = bridge.chat([{"role":"user","content":"上下文："+context+"\n\n 内容："+content+"请根据上下文扩写内容，不要超过1000字"}],options={"model":feature_config["model"]})
        return result

# AI 润色

@router.post("/polish")
async def ai_polish(request: AIExpandRequest):
    content = request.content
    context = request.context
    feature_config = get_feature_by_name("AI润色")
    if request.is_stream:
        messages = [
            {"role": "system", "content": feature_config["prompt"]},
            {"role": "user", "content": "上下文："+context+"\n\n 内容："+content+"请根据上下文润色内容，不要超过1000字"}
        ]
        return StreamingResponse(generate_response(messages, feature_config["model"]), media_type="text/event-stream",headers={"Cache-Control": "no-cache", "Connection": "keep-alive"})
    else:
        bridge = OpenAIBridge()
        bridge.init({
            "api_key": feature_config["api_key"],
            "base_url": feature_config["base_url"],
        })
        result = bridge.chat([{"role":"user","content":"上下文："+context+"\n\n 内容："+content+"请根据上下文润色内容，不要超过1000字"}],options={"model":feature_config["model"]})
        return result
# AI改写

@router.post("/rewrite")
async def ai_rewrite(request: AIExpandRequest):

    feature_config = get_feature_by_name("AI改写")
    content = request.content
    context = request.context

    if request.is_stream:
        messages = [
            {"role": "system", "content": feature_config["prompt"]},
            {"role": "user", "content": "上下文："+context+"\n\n 内容："+content+"请根据上下文改写内容，不要超过1000字"}
        ]
        return StreamingResponse(generate_response(messages, feature_config["model"]), media_type="text/event-stream",headers={"Cache-Control": "no-cache", "Connection": "keep-alive"})
    else:
        feature_config = get_feature_by_name("AI改写")
        bridge = OpenAIBridge()
        bridge.init({
            "api_key": feature_config["api_key"],
            "base_url": feature_config["base_url"],
        })
        result = bridge.chat([{"role":"user","content":"上下文："+context+"\n\n 内容："+content+"请根据上下文改写内容，不要超过1000字"}],options={"model":feature_config["model"]})
        return result

async def generate_response(
    messages: list,
    model:str
) -> AsyncGenerator[str, None]:
    """生成 AI 响应的流式生成器"""
    try:
        # 创建新的数据库会话

        client = AsyncOpenAI()
        accumulated_message = ""
        stream = await client.chat.completions.create(
                model=model,
                messages=messages,
                stream=True
            )
    
        async for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                content = chunk.choices[0].delta.content
                accumulated_message += content
                
                # 更新数据库中的消息
             
                
                # 返回流式内容
                yield f"data: {content}\n\n"
            # 等全部流式内容返回后，更新数据库内容            
            # yield "data: [DONE]\n\n"
            
    except Exception as e:
        print(f"Error in generate_response: {str(e)}")
        yield f"data: Error: {str(e)}\n\n"

