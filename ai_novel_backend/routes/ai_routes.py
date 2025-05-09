import json
import os
import tempfile
from typing import AsyncGenerator, Optional
import uuid
import aiofiles
from fastapi import APIRouter, Body, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
import httpx
from openai import AsyncOpenAI
from requests import Session
from sqlalchemy import select
from database import BookBreakdown, File as FileModel, get_db, User, Character, async_session
from routes.feature_routes import get_feature_by_name
from schemas import AIAnalysisRequest, AIExpandRequest, BookBreakdownResponse, FileResponse, GenerateImageRequest, ImageResponse
from bridge.openai_bridge import OpenAIBridge
from auth import get_current_user  # 导入获取当前用户的函数

router = APIRouter(prefix="/ai", tags=["ai"])

UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload-file")
async def upload_file(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # 获取当前登录用户
):
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
            "user_id": current_user.id  # 使用当前登录用户的ID
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
            user_id=current_user.id,  # 使用当前登录用户的ID
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
    

@router.post("/generate_image_from_spirate")
async def generate_image_from_spirate(request: GenerateImageRequest):
    # 检查数据库中是否存在一个人物
       
    async with async_session() as db:
        query = select(Character).where(Character.name == request.name,Character.book_id==request.book_id)
        character = await db.execute(query)
        character = character.scalar_one_or_none()
        if character:
            # 如果找到匹配的角色，直接返回其image_url
            return ImageResponse(image=character.image_url, timings={"cache_hit": 0}, seed=0)
        else:
            return await generate_images(request)

@router.post("/generate_images", response_model=ImageResponse)
async def generate_images(request: GenerateImageRequest):
    
    # 使用数据库会话查询
    async with async_session() as db:
        try:
            # 通过description字段精确匹配查询
            query = select(Character).where(Character.description == request.prompt)
            result = await db.execute(query)
            character = result.scalar_one_or_none()
            
            # 如果找到角色且有图片URL
            if character and character.image_url:
                logger.info(f"Found existing character with matching description and image_url: {character.image_url}")
                # 直接返回已有的图片URL
                return ImageResponse(image=character.image_url, timings={"cache_hit": 0}, seed=0)
                
            # 如果没找到精确匹配，尝试模糊匹配
            if not character:
                logger.info("No exact match found, trying fuzzy match")
                fuzzy_query = select(Character).where(Character.description.like(f"%{request.prompt}%"))
                fuzzy_result = await db.execute(fuzzy_query)
                characters = fuzzy_result.scalars().all()
                # 找到第一个有图片URL的角色
                for char in characters:
                    if char.image_url:
                        logger.info(f"Found fuzzy match with image_url: {char.image_url}")
                        return ImageResponse(image=char.image_url, timings={"cache_hit": 0}, seed=0)
                        
        except Exception as e:
            logger.error(f"Error checking database for existing image: {str(e)}")
            # 继续执行生成流程，不中断
    
    # 2. 如果数据库中没有，则调用AI服务生成新图片
    logger.info("No matching image found in database, generating new image")
    bridge = OpenAIBridge()
    feature_config = get_feature_by_name("绘画")
    bridge.init({
        "api_key": feature_config["api_key"],
        "base_url": feature_config["base_url"],
    })
    
    result = bridge.generate_image(request.prompt)
    print(result)
    
    # 3. 转存图片并更新数据库
    res = await transfer_image(result['images'][0]['url'], request.prompt)

    print(res,"resss")
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
        file_size = os.path.getsize(file_path)
        logger.info(f"File size: {file_size} bytes")
        
        if file_size == 0:
            logger.error("File is empty")
            return None
        
        # 检测文件类型
        import imghdr
        file_type = imghdr.what(file_path)
        if not file_type:
            logger.error("Not a valid image file")
            return None
            
        # 使用二进制模式读取文件
        with open(file_path, 'rb') as f:
            file_content = f.read()
            
        # 根据文件类型设置正确的content-type
        content_type = f"image/{file_type}"
        logger.info(f"Detected image type: {content_type}")
        
        # 使用正确的文件名和内容类型
        file_name = os.path.basename(file_path)
        
        # 构建multipart表单数据
        from aiohttp import FormData
        form = FormData()
        form.add_field('file', 
                      file_content, 
                      filename=file_name,
                      content_type=content_type)
        
        # 使用aiohttp客户端
        import aiohttp
        async with aiohttp.ClientSession() as session:
            try:
                headers = {
                    'User-Agent': 'Apifox/1.0.0 (https://apifox.com)',
                    'Accept': '*/*',
                    'Host': 'img.leebay.cyou',
                    'Connection': 'keep-alive'
                }
                
                logger.info("Sending request to upload server...")
                async with session.post(upload_url, data=form, headers=headers, timeout=60) as response:
                    # 检查状态码
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"HTTP error: {response.status} - {error_text}")
                        return None
                    
                    # 解析响应
                    try:
                        result = await response.json()
                        logger.info(f"Response: {result}")
                        
                        if isinstance(result, list) and result:
                            src = result[0].get('src')
                            if src:
                                return src
                        elif isinstance(result, dict):
                            return result.get('src') or result.get('url')
                            
                        logger.error(f"Unexpected response format: {result}")
                        return None
                    except Exception as e:
                        logger.error(f"Error parsing response: {str(e)}")
                        response_text = await response.text()
                        logger.error(f"Raw response: {response_text}")
                        return None
            except Exception as e:
                logger.error(f"Request error: {str(e)}")
                return None
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return None
    


@router.post("/transfer-image")
async def transfer_image(image_url: str, prompt: Optional[str] = None):
    """转存图片：下载并重新上传"""
    print("开始处理图片转存")
    logger.info(f"Processing image URL: {image_url}")
    
    # 创建临时目录
    temp_dir = "static/temp_images"
    os.makedirs(temp_dir, exist_ok=True)
    
    temp_filename = f"{uuid.uuid4()}.jpg"
    temp_path = os.path.join(os.path.abspath(temp_dir), temp_filename)
    logger.info(f"Temporary file path: {temp_path}")
    
    try:
        # 下载图片
        logger.info("Downloading image...")
        import requests
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        }
        
        response = requests.get(image_url, headers=headers, timeout=30.0, stream=True)
        
        # 检查下载状态
        if response.status_code != 200:
            logger.error(f"Download failed with status code: {response.status_code}")
            return {"success": False, "message": f"Download failed with status code: {response.status_code}"}
        
        # 检查内容类型
        content_type = response.headers.get('content-type', '').lower()
        if not (content_type.startswith('image/') or 'image' in content_type):
            logger.error(f"Invalid content type: {content_type}")
            return {"success": False, "message": f"Not an image (content-type: {content_type})"}
        
        # 保存图片到本地
        with open(temp_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        
        # 验证下载的文件
        if not os.path.exists(temp_path) or os.path.getsize(temp_path) == 0:
            logger.error("Downloaded file is empty or doesn't exist")
            return {"success": False, "message": "Download resulted in empty file"}
        
        # 上传图片
        logger.info("Uploading image...")
        new_url = await upload_image(temp_path)
        
        if not new_url:
            logger.error("Failed to upload image")
            return {"success": False, "message": "Image upload failed"}
        
        full_url = f"https://img.leebay.cyou{new_url}" if not new_url.startswith('http') else new_url
        logger.info(f"Final URL: {full_url}")
        
        # 更新Character（如果需要）
        if prompt:
            try:
                from sqlalchemy import select, update
                from database import Character, async_session
                
                async with async_session() as db:
                    query = select(Character).where(Character.description == prompt)
                    result = await db.execute(query)
                    character = result.scalar_one_or_none()
                    
                    if character:
                        logger.info(f"Updating character {character.id} image_url")
                        update_query = update(Character).where(Character.id == character.id).values(
                            image_url=full_url)
                        await db.execute(update_query)
                        await db.commit()
                    else:
                        logger.warning(f"No character found with description: {prompt}")
            except Exception as e:
                logger.error(f"Error updating character: {str(e)}")
                # 不阻止返回URL
        
        return {"success": True, "image_url": full_url}
    
    except Exception as e:
        logger.error(f"Transfer image error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return {"success": False, "message": str(e)}
    
    finally:
        # 清理临时文件
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
                logger.info("Temporary file cleaned up")
            except Exception as e:
                logger.error(f"Failed to clean up temporary file: {str(e)}")


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
            {"role": "system", "content": "(所生成的文字，应当进行分段，在每个分段处加上两个换行符\n\n,这两个换行符应当是直接以文本形式添加在文章中的)"+feature_config["prompt"]},
            {"role": "user", "content": "上下文："+context+"\n\n 内容："+content+"请根据上下文润色内容，不要超过1000字(每处分段处加上两个换行符)"}
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

@router.post("/generate")
async def generate_content(request: dict = Body(...)):
    """
    生成小说内容
    """
    try:
        # 获取AI写作特性配置
        feature_config = get_feature_by_name("AI写作")
        
        # 获取请求数据
        prompt = request.get("prompt", "")
        model = request.get("model", feature_config["model"])
        
        # 写作风格和要求
        writing_style = request.get("writing_style", "")
        requirements = request.get("requirements", "")
        
        # 构建提示词
        system_prompt = feature_config["prompt"]
        user_message = f"""
        请根据以下信息创作小说内容:
        
        剧情/提纲: {prompt}
        
        写作风格: {writing_style}
        
        写作要求: {requirements}
        """
        
        # 调用AI生成内容
        bridge = OpenAIBridge()
        bridge.init({
            "api_key": feature_config["api_key"],
            "base_url": feature_config["base_url"],
        })
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
        
        result = bridge.chat(
            messages=messages,
            options={
                "model": model,
                "temperature": feature_config.get("temperature", 0.7),
                "max_tokens": feature_config.get("max_tokens", 2000)
            }
        )
        
        return {"data": result, "success": True}
    except Exception as e:
        print(f"内容生成错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"生成失败: {str(e)}")

