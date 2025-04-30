from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db, User

# 配置
SECRET_KEY = "lxczuishuai"  # 请使用安全的密钥
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# 更新tokenUrl以匹配auth_routes.py中的登录路由
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: AsyncSession = Depends(get_db)
):
    # 正确的认证头格式
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # 打印接收到的token（仅用于调试）
        print(f"Received token: {token[:10]}...")
        
        # 解码JWT令牌
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            print(f"Decoded payload: {payload}")
        except Exception as decode_error:
            print(f"Token decode error: {str(decode_error)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token解析失败: {str(decode_error)}",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # 从payload中获取用户ID
        user_id = payload.get("sub")
        if user_id is None:
            print("No user_id (sub) found in token payload")
            raise credentials_exception
            
        # 确保user_id是整数
        try:
            user_id = int(user_id)
        except ValueError:
            print(f"Invalid user_id format: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user ID format in token",
                headers={"WWW-Authenticate": "Bearer"}
            )
            
    except JWTError as jwt_error:
        print(f"JWT Error: {str(jwt_error)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"JWT验证失败: {str(jwt_error)}",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # 从数据库获取用户
    try:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if user is None:
            print(f"User with ID {user_id} not found in database")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"}
            )
            
        print(f"Successfully authenticated user: {user.id}")
        return user
        
    except Exception as db_error:
        print(f"Database error: {str(db_error)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error during authentication"
        )