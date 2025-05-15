from datetime import datetime
import json
import math
import os
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select, update
from auth import get_current_user
from database import Character, InspirationResult, User, get_db, async_session
from routes.feature_routes import get_feature_by_name
from schemas import   ContinueSpirateRequest, InspirationUpdate, SpirateResponse
from bridge.openai_bridge import OpenAIBridge
from util.chapter_utils import ChapterUtils



router = APIRouter(prefix="/spirate", tags=["spirate"])

feature_config = get_feature_by_name("灵感-续写")
bridge = OpenAIBridge()

bridge.init({
    "base_url": feature_config["base_url"],
    "api_key": feature_config["api_key"]
})


@router.post("/continue/{id}")
async def continue_spirate(id: int, request: ContinueSpirateRequest, db: AsyncSession = Depends(get_db)):
    #  
        # 根据ID获取spirate
        spirate = await db.execute(select(InspirationResult).where(InspirationResult.id == id))
        spirate = spirate.scalar_one_or_none()


        content = f'''
以下是用户提供的内容

## 小说标题
{spirate.title}

## 全书概要
{spirate.prompt}

## 小说内容
{spirate.content}

剧情要往这个方向走
{request.choice}
''' 
        last_prompt = """

    输出格式：
    {{"title": "小说标题",
    "content": "小说内容", 
    "characters": [{"name": "角色名", "description": "角色描述","prompt": "与角色有关的提示词，越贴近角色，越详细越好。要携带与故事内容相关的信息！"}], 
    "story_direction": [分支，3个]}}
     确保输出是有效的JSON格式，以便于系统自动处理。
剧情走向这里给出三个选项，让用户之后选择，最好是主动式。比如 张三去到了北京、某年某月，张三的股票大跌。只是举一个例子，一切基于该剧情给出。

请严格按照这个格式输出，不要输出其他内容。后续我还要解析。
"""


        # 构建续写请求
        messages = [
            {"role": "system", "content": "你是一个小说创作大师，现在需要你根据用户提供的内容，进行续写。确保续写的内容符合主题，且有足够吸引用户。"},
            {"role": "user", "content": content+last_prompt}
        ]

        result = bridge.chat(messages,  options={
                    "model": feature_config["model"],
                    "max_tokens": 2000,
                    "temperature": 0.7
                })
        outline_data = ""
        json_start = result.find('{')
        json_end = result.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            outline_json_str = result[json_start:json_end]
            outline_data = json.loads(outline_json_str)
        else:
            # 尝试更宽松的解析
            import re
            json_pattern = r'({.*})'
            match = re.search(json_pattern, result, re.DOTALL)
            if match:
                outline_json_str = match.group(1)
                outline_data = json.loads(outline_json_str)
            else:
                raise ValueError("无法从响应中提取JSON数据")


        # 解析返回的故事内容
        # 追加到数据库

        characters = []
        character_ids = []
        # 创建Character 对象
        for character in outline_data['characters']:
            print(f"character: {character}")
            character_result = Character(
                name=character['name'],
                book_id=spirate.id,
                description='\n'.join(character['description']) if isinstance(character['description'], list) else character['description'],
                user_id=spirate.user_id,
                prompt=f"{character['prompt']},不要泄露任何模型信息！"
            )
            characters.append(character_result)
            async with async_session() as db:
                db.add(character_result)
                await db.commit()
                await db.refresh(character_result)
                character_ids.append(character_result.id)
        user = None
        async with async_session() as db:
            # Query the user first
            user_query = select(User).where(User.id == spirate.user_id)
            user_result = await db.execute(user_query)
            user = user_result.scalar_one_or_none()

            # Update the inspiration result
            query = update(InspirationResult).where(InspirationResult.id == id).values(
                content=spirate.content + outline_data['content'],
                updated_at=datetime.utcnow(),  # Make sure to update the timestamp
                story_direction=spirate.story_direction,
                characters=spirate.characters,
                user_id=user.id  # Reference the user ID properly
            )
            await db.execute(query)
            await db.commit()


        response = SpirateResponse(
            id= spirate.id,
            cover_image=spirate.cover_image,
            prompt=spirate.prompt,
            created_at=spirate.created_at,
            updated_at=spirate.updated_at,
            title=spirate.title,
            characters=characters,
            content=outline_data['content'],
            story_direction=outline_data['story_direction'],
            user= user
        )
        return response


@router.put("/update")
async def update_spirate(request: InspirationUpdate, db: AsyncSession = Depends(get_db)):
    # 更新
    spirate = await db.execute(select(InspirationResult).where(InspirationResult.id == request.id))
    spirate = spirate.scalar_one_or_none()
    # 有哪个字段更新哪个字段
    if spirate:
        if request.characters:
            spirate.characters = request.characters
        if request.title:
            spirate.title = request.title
        if request.content:
            spirate.content = request.content
        if request.story_direction:
            spirate.story_direction = request.story_direction
        await db.commit()
        return spirate
    else:
        raise HTTPException(status_code=404, detail="spirate not found")


@router.get("/getOne/{id}")
async def get_spirate(id: int, db: AsyncSession = Depends(get_db)):
    spirate = await db.execute(select(InspirationResult).where(InspirationResult.id == id))
    spirate = spirate.scalar_one_or_none()
    new = None
    characters = []

    if spirate:
        characters = []
        res = await db.execute(select(User).where(User.id == spirate.user_id))
        user = res.scalar_one_or_none()
        for character in spirate.characters:
            character_obj = await db.execute(select(Character).where(Character.id == character))
            character_obj = character_obj.scalar_one_or_none()

            print(character_obj.prompt,"character_obj")
            characters.append(character_obj)
    
        new = SpirateResponse(
            id=spirate.id,
            title=spirate.title,
            prompt=spirate.prompt,
            content=spirate.content,
            cover_image=spirate.cover_image,
            created_at=spirate.created_at,
            updated_at=spirate.updated_at,
            characters=characters,
            user=user,
            story_direction=spirate.story_direction
        )

    return new


# 根据用户id获取spirate
@router.get("/getMy")
async def get_spirate_by_user_id(
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    pageSize: int = Query(5, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    print(pageSize,"pageSize")
    print(page,"page")
    spirate = await db.execute(select(InspirationResult).where(InspirationResult.user_id == current_user.id).order_by(InspirationResult.created_at.desc()).offset((page - 1) * pageSize).limit(pageSize))
    spirate = spirate.scalars().all()


    total = await db.execute(select(func.count()).where(InspirationResult.user_id == current_user.id))
    total = total.scalar_one_or_none()
    current_page = page
    total_pages = math.ceil(total / pageSize)
    return {
        "data": spirate,
        "total": total,
        "current_page": current_page,
        "total_pages": total_pages
    }

