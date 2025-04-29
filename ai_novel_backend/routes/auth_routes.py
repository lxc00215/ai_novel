import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from database import get_db, User
from schemas import UserCreate, UserLogin, Token, UserResponse
from auth import verify_password, create_access_token
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["auth"])


# 检查用户名是否可用（注册时）
@router.post("/check_username_available/{username}")
async def check_username_available(
    username: str,
    db: AsyncSession = Depends(get_db)
):
    # 检查用户名是否已存在
    query = select(User).where(User.account == username)
    result = await db.execute(query)
    if result.scalar_one_or_none():
        return {"message": "Username already exists","success": False}
    
    return {"message": "Username available","success": True}

# 检查邮箱是否已存在
@router.post("/check_email_available/{email}")
async def check_email_available(
    email: str,
    db: AsyncSession = Depends(get_db)
):
    # 检查邮箱是否已存在
    query = select(User).where(User.email == email)
    result = await db.execute(query)
    if result.scalar_one_or_none():
        return {"message": "Email already registered","success": False}
    
    return {"message": "Email available","success": True}


@router.post("/login")
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    # 通过邮箱或账号查询用户
    query = select(User).where(
        or_(
            User.email == user_data.account,
            User.account == user_data.account
        )
    )
    print(f"query: {user_data.account} {user_data.email}")
    result = await db.execute(query)
    print(f"result: {result}")
    user = result.scalar_one_or_none()
    print(f"user: {user}")
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect account or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=30)
    )
    print(user.id)
    # 构建返回对象
    
    
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.post("/register", response_model=UserResponse)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    # 验证必填字段
    user.validate_login_field()
    
    # 检查用户名、邮箱或手机号是否已存在
    query = select(User).where(
        or_(
            User.account == user.account,
            User.email == user.email
        )
    )
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Username, email or phone already registered"
        )
    
    # 创建新用户
    hashed_password = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt())
    new_user = User(
        account=user.account,
        email=user.email,
        password_hash=hashed_password
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user
