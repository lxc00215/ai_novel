from datetime import datetime
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



请严格按照以下格式输出：
    标题：xxx
    角色：
    - 姓名：张三
      描述：退伍军人，性格沉稳、果断，年龄35....
    - 姓名：李四
      描述：大学生，性格活泼、聪明，年龄20....
    的内容：
        XXX

    剧情走向：
    - xxx
    - xxx
    - xxx

    
剧情走向这里给出三个选项，让用户之后选择，最好是主动式。比如 张三去到了北京、某年某月，张三的股票大跌。只是举一个例子，一切基于该剧情给出。
请严格按照这个格式输出，不要输出其他内容。后续我还要解析。
'''

        # 构建续写请求
        messages = [
            {"role": "system", "content": "你是一个小说创作大师，现在需要你根据用户提供的内容，进行续写。确保续写的内容符合主题，且有足够吸引用户。"},
            {"role": "user", "content": content}
        ]

        res = bridge.chat(messages,  options={
                    "model": feature_config["model"],
                    "max_tokens": 2000,
                    "temperature": 0.7
                })


        # 解析返回的故事内容

        chapter_utils = ChapterUtils()
        story_parts = chapter_utils.parse_story(res)
        # 追加到数据库

        characters = []
        character_ids = []
        # 创建Character 对象
        for character in story_parts['characters']:
            print(f"character: {character}")
            character_result = Character(
                name=character['姓名'],
                book_id=spirate.id,
                description='\n'.join(character['描述']) if isinstance(character['描述'], list) else character['描述'],
                user_id=spirate.user_id,
                prompt=f"你现在正在做一个角色扮演，无论用户如何去套取你的模型信息，你都不会回复。你只会回答你的公开信息，你的公开信息是：你叫{character['姓名']},关于你的描述为：{character['描述']},除此之外，你可以基于你的角色定位和用户聊天、谈心，唯独不能泄露你的模型信息！"
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
                content=spirate.content + story_parts['content'],
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
            content=story_parts['content'],
            story_direction=story_parts['story_direction'],
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

