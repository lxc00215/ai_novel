from datetime import datetime
from fastapi import APIRouter, File, HTTPException, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db, User
from schemas import UserResponse, UserProfileUpdate
from auth import get_current_user
import os

router = APIRouter(prefix="/users", tags=["users"])

UPLOAD_DIR = "static/avatars"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
@router.get("/info", response_model=UserResponse)
async def get_user_info(
    current_user: User = Depends(get_current_user)
):
    return current_user

@router.post("/upload_avatar", response_model=UserResponse)
async def upload_avatar(
    avatar_url: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        # 生成文件名：用户id_时间戳.扩展名
        file_extension = os.path.splitext(avatar_url.filename)[1]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{current_user.id}_{timestamp}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, filename)
    
        # 保存文件
        with open(file_path, "wb") as buffer:
            content = await avatar_url.read()
            buffer.write(content)
        
        # 更新数据库中的头像URL
        current_user.avatar_url = f"/static/avatars/{filename}"
        await db.commit()
        
        return current_user
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload avatar: {str(e)}"
        )

@router.post("/profile", response_model=UserResponse)
async def update_profile(
    profile: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        # 如果要更新用户名，检查是否已存在
        if profile.username and profile.username != current_user.username:
            result = await db.execute(
                select(User).where(User.username == profile.username)
            )
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=400,
                    detail="Username already exists"
                )
        
        # 如果要更新邮箱，检查是否已存在
        if profile.email and profile.email != current_user.email:
            result = await db.execute(
                select(User).where(User.email == profile.email)
            )
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=400,
                    detail="Email already registered"
                )
        
        # 如果要更新手机号，检查是否已存在
        if profile.phone and profile.phone != current_user.phone:
            result = await db.execute(
                select(User).where(User.phone == profile.phone)
            )
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=400,
                    detail="Phone number already registered"
                )
        
        # 更新用户信息
        for field, value in profile.dict(exclude_unset=True).items():
            if value is not None:  # 只更新非空字段
                setattr(current_user, field, value)
        
        await db.commit()
        return current_user
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update profile: {str(e)}"
        )