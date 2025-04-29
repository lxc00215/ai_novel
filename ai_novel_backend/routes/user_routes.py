from datetime import datetime, timedelta
from fastapi import APIRouter, File, HTTPException, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db, User
from schemas import UserResponse, UserProfileUpdate
from auth import get_current_user
import os
from typing import Optional
from pydantic import BaseModel

router = APIRouter(prefix="/users", tags=["users"])

UPLOAD_DIR = "static/avatars"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

class VipUpdate(BaseModel):
    subscription_type: str
    duration_months: int

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

@router.post("/update_vip", response_model=UserResponse)
async def update_vip_status(
    vip_update: VipUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        # 计算会员过期时间
        if current_user.subscription_end_date and current_user.subscription_end_date > datetime.now():
            # 如果当前是会员，在现有过期时间基础上增加
            new_end_date = current_user.subscription_end_date + timedelta(days=30 * vip_update.duration_months)
        else:
            # 如果不是会员或已过期，从当前时间开始计算
            new_end_date = datetime.now() + timedelta(days=30 * vip_update.duration_months)
        
        # 更新用户会员状态
        current_user.subscription_type = vip_update.subscription_type
        current_user.subscription_start_date = datetime.now()
        current_user.subscription_end_date = new_end_date
        
        # 根据会员类型设置配额
        if vip_update.subscription_type == 'basic':
            current_user.remaining_chapters = 50
            current_user.remaining_books = 3
            current_user.remaining_outlines = 1
            current_user.remaining_inspirations = 10
        elif vip_update.subscription_type == 'professional':
            current_user.remaining_chapters = 150
            current_user.remaining_books = 10
            current_user.remaining_outlines = 3
            current_user.remaining_inspirations = 30
        
        current_user.last_quota_reset_date = datetime.now()
        
        await db.commit()
        await db.refresh(current_user)
        
        return current_user
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update subscription status: {str(e)}"
        )