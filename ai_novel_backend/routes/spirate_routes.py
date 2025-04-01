import math
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from database import Character, InspirationResult, User, get_db
from schemas import  InspirationUpdate, SpirateResponse


router = APIRouter(prefix="/spirate", tags=["spirate"])

@router.put("/update")
async def update_spirate(request: InspirationUpdate, db: AsyncSession = Depends(get_db)):
    # 更新
    print("request", request)
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

@router.get("/{id}")
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
@router.get("/user/{user_id}")
async def get_spirate_by_user_id(user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    spirate = await db.execute(select(InspirationResult).where(InspirationResult.user_id == user_id).order_by(InspirationResult.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
    spirate = spirate.scalars().all()

    total = await db.execute(select(func.count()).where(InspirationResult.user_id == user_id))
    total = total.scalar_one_or_none()
    current_page = page
    total_pages = math.ceil(total / page_size)
    return {
        "data": spirate,
        "total": total,
        "current_page": current_page,
        "total_pages": total_pages
    }

