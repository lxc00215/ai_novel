from datetime import datetime
from typing import List
from fastapi import APIRouter, File, HTTPException, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from database import Character, ChatSession, get_db, User
from schemas import CharacterRequest, UserResponse, UserProfileUpdate, CharacterResponse, CharacterCreate
from auth import get_current_user
import os

router = APIRouter(prefix="/character", tags=["character"])

@router.get("/{user_id}")
async def get_characters(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    # 查询该用户创建的所有角色 is_used=True
    query = select(Character).where(Character.user_id == user_id, Character.is_used == True)
    result = await db.execute(query)
    characters = result.scalars().all()
    # 将User_id 与 character_id 对应的 session_id 插入到 characters 中
    for character in characters:
        query = select(ChatSession).where(ChatSession.user_id == user_id, ChatSession.character_id == character.id)
        result = await db.execute(query)
        session = result.scalar_one_or_none()
    return characters

# 更新角色
@router.put("/{id}")
async def update_character(
    character_request: CharacterRequest,
    # current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    print(character_request)
    query = select(Character).where(Character.id == character_request.id)
    result = await db.execute(query)
    existing_character = result.scalar_one_or_none()

    if not existing_character:
        raise HTTPException(status_code=404, detail="角色不存在")
    if character_request.prompt:
        existing_character.prompt = character_request.prompt
    if character_request.name:
        existing_character.name = character_request.name
    if character_request.description:
        existing_character.description = character_request.description
    if character_request.image_url:
        existing_character.image_url = character_request.image_url
    if character_request.is_used:
        existing_character.is_used = character_request.is_used
    
    query = update(Character).where(Character.id == character_request.id).values(
        name=existing_character.name,
        description=existing_character.description,
        image_url=existing_character.image_url,
        is_used=existing_character.is_used,
        prompt=existing_character.prompt
    )
    try: 
        await db.execute(query)
        await db.commit()
        return existing_character
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# 创建角色
@router.post("/", response_model=CharacterResponse)
async def create_character(
    character: CharacterCreate,
    db: AsyncSession = Depends(get_db)
):
    db_character = Character(
        name=character.name,
        description=character.description,
        image_url=character.image_url,
        is_used=character.is_used,
        prompt=character.prompt
    )
    db.add(db_character)
    await db.commit()
    await db.refresh(db_character)
    
    return CharacterResponse.model_validate(db_character)

# 删除角色

@router.get("/{character_id}", response_model=CharacterResponse)
async def get_character(
    character_id: int, 
    db: AsyncSession = Depends(get_db)
):
    query = select(Character).where(Character.id == character_id)
    result = await db.execute(query)
    character = result.scalar_one_or_none()
    
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # 将 SQLAlchemy 模型转换为字典
    return CharacterResponse.model_validate(character)

@router.get("/", response_model=List[CharacterResponse])
async def get_characters(
    skip: int = 0, 
    limit: int = 10, 
    db: AsyncSession = Depends(get_db)
):
    query = select(Character).offset(skip).limit(limit)
    result = await db.execute(query)
    characters = result.scalars().all()
    
    # 转换每个角色对象
    return [CharacterResponse.model_validate(char) for char in characters]
