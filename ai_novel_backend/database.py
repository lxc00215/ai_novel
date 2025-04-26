import uuid
from pydantic import ConfigDict
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy import Column, Float, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON, Enum
from datetime import datetime

from models import TaskTypeEnum



# 数据库URL
DATABASE_URL = "mysql+aiomysql://root:shiyunlai123@localhost/novel"

# 创建异步引擎
engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    pool_size=5,  # 连接池大小
    max_overflow=10,  # 超过 pool_size 后最多可以创建的连接数
    pool_timeout=30,  # 连接池获取连接的超时时间
    pool_recycle=1800,  # 连接在池中重用的时间限制（秒）
    pool_pre_ping=True  # 每次连接前ping一下数据库，确保连接有效
)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# 创建基类
Base = declarative_base()




# 获取数据库会话
async def get_db():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()




class Task(Base):
    __tablename__ = 'tasks'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    completion_percentage = Column(Integer, nullable=False)
    prompt = Column(Text, nullable=False)
    task_type = Column(Enum(TaskTypeEnum), nullable=False)
    status = Column(Enum('pending', 'processing', 'completed', 'failed', name='task_status'), nullable=False, default='pending')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    result_id = Column(Integer)
    result_type = Column(Enum(TaskTypeEnum), nullable=False)

    user = relationship("User", back_populates="tasks")

    async def get_specific_result(self, session: AsyncSession):
        """获取任务结果并转换为字典格式"""
        if self.result_type == TaskTypeEnum.INSPIRATION:
            result = await session.get(InspirationResult, self.result_id)
            if result:
                return {
                    "id": result.id,
                    "title": result.title,
                    "characters": result.characters,
                    "prompt": result.prompt,
                    "content": result.content,
                    "story_direction": result.story_direction,
                    "created_at": result.created_at,
                    "updated_at": result.updated_at
                }
        elif self.result_type == TaskTypeEnum.CRAZY_WALK:
            result = await session.get(CrazyWalkResult, self.result_id)
            if result:
                return {
                    "id": result.id,
                    "title": result.title,
                    "content": result.content,
                    "created_at": result.created_at,
                    "updated_at": result.updated_at
                }
        elif self.result_type == TaskTypeEnum.CRAZY_WALK_2:
            result = await session.get(CrazyWalk2Result, self.result_id)
            if result:
                return {
                    "id": result.id,
                    "title": result.title,
                    "content": result.content,
                    "additional_info": result.additional_info,
                    "created_at": result.created_at,
                    "updated_at": result.updated_at
                }
        elif self.result_type == TaskTypeEnum.BOOK_BREAKDOWN:
            result = await session.get(BookBreakdownResult, self.result_id)
            if result:
                return {
                    "id": result.id,
                    "book_title": result.book_title,
                    "analysis": result.analysis,
                    "key_points": result.key_points,
                    "summary": result.summary,
                    "created_at": result.created_at,
                    "updated_at": result.updated_at
                }
        return None


# database.py (update the Feature class)
class Feature(Base):
    __tablename__ = "features"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    model = Column(String(100))
    prompt = Column(Text)
    base_url = Column(String(255))

    api_key = Column(String(255))

    description = Column(Text)
    
    # Model parameters as separate columns
    temperature = Column(Float, default=0.7)
    top_k = Column(Integer, default=50)
    top_p = Column(Float, default=0.9)
    max_tokens = Column(Integer, default=2048)
    frequency_penalty = Column(Float, default=0.0)
    presence_penalty = Column(Float, default=0.0)

    
    # Tracking fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)


# 模型定义
class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    account = Column(String(50), unique=True, nullable=False)
    email = Column(String(120), unique=True)
    password_hash = Column(String(255), nullable=False)
    avatar_url = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    story_count = Column(Integer, default=0)  # 创作故事数量
    total_words = Column(Integer, default=0)  # 创作总字数
    writing_days = Column(Integer, default=0)  # 创作天数
    bio = Column(Text)  # 个人简介

    # 确保关系定义完整
    prompts = relationship("Prompt", back_populates="user")
    novels = relationship("Novels", back_populates="user")
    book_analyses = relationship("BookAnalysis", back_populates="user")
    tasks = relationship("Task", back_populates="user")

    # 添加新的关系
    characters = relationship("Character", back_populates="user")
    chat_sessions = relationship("ChatSession", back_populates="user")

# class ChatSession(Base):
#     __tablename__ = 'chat_sessions'

#     id = Column(Integer, primary_key=True)
#     user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
#     character_id = Column(Integer, ForeignKey('characters.id'), nullable=False)
#     created_at = Column(DateTime, default=datetime.now())
#     updated_at = Column(DateTime, default=datetime.now(), onupdate=datetime.now())
#     last_message_time = Column(DateTime, default=datetime.now())
#     last_message = Column(Text, nullable=True)


class Prompt(Base):
    __tablename__ = 'prompts'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    title = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50))
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # 添加关系定义
    user = relationship("User", back_populates="prompts")

class Provider(Base):
    __tablename__ = 'providers'

    id = Column(Integer, primary_key=True)
    com_name = Column(String(100), nullable=False)  # 公司名称
    avatar_url = Column(String(255))  # 头像URL
    is_active = Column(Boolean, default=True)  # 是否可用
    base_url = Column(String(255), nullable=False)  # 基础URL
    
    # 修改关系定义
    models = relationship("Model", back_populates="provider", lazy="selectin")

class Model(Base):
    __tablename__ = 'models'

    id = Column(String(100), primary_key=True,default=lambda: str(uuid.uuid4()))
    provider_id = Column(Integer, ForeignKey('providers.id'))
    name = Column(String(100), nullable=False)  # 模型名称
    label = Column(String(100), nullable=False)  # 标签 可选(LLM,TEXT EMBEDDING,RERANK,SPEECH2TEXT,TEXT2SPEECH)
    top_k = Column(Integer, default=10)  # 返回结果数量
    temperature = Column(Float, default=0.5)  # 温度
    max_tokens = Column(Integer, default=8000)  # 最大tokens
    created_at = Column(DateTime, default=datetime.utcnow)
    input_token_limit = Column(Integer, default=0)  # 输入token限制
    output_token_limit = Column(Integer, default=0)  # 输出token限制
    description = Column(Text, default="")  # 描述

    provider = relationship("Provider", back_populates="models", lazy="selectin")

class BookAnalysis(Base):
    __tablename__ = 'book_analysis'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    book_title = Column(String(255), nullable=False)
    book_content = Column(Text, nullable=False)
    prompt = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=False)
    model_id = Column(String(100), ForeignKey('models.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="book_analyses")
    model = relationship("Model")


class Novels(Base):
    __tablename__ = 'novels'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String(255), nullable=False)
    chapters = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    description = Column(Text, nullable=True)
    is_top = Column(Boolean, default=False)
    is_archive = Column(Boolean, default=False)
    user = relationship("User", back_populates="novels")
    # 一对多
    chapters = relationship("GeneratedChapter", back_populates="book", cascade="all, delete-orphan")

class GeneratedChapter(Base):
    __tablename__ = 'generated_chapters'
    
    id = Column(Integer, primary_key=True)
    book_id = Column(Integer, ForeignKey('novels.id', ondelete='CASCADE'), nullable=False)
    order = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    summary = Column(Text, nullable=False)

    book = relationship("Novels", back_populates="chapters")

class Character(Base):
    __tablename__ = 'characters'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    image_url = Column(String(255))
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    is_used = Column(Boolean, default=False)
    prompt = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    user = relationship("User", back_populates="characters")
    chat_sessions = relationship("ChatSession", back_populates="character")

class ChatSession(Base):
    __tablename__ = 'chat_sessions'
    
    id = Column(Integer, primary_key=True)

    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    character_id = Column(Integer, ForeignKey('characters.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.now())
    updated_at = Column(DateTime, default=datetime.now(), onupdate=datetime.now())
    last_message_time = Column(DateTime, default=datetime.now())
    last_message = Column(Text, nullable=True)

    # 关系
    user = relationship("User", back_populates="chat_sessions")
    character = relationship("Character", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = 'chat_messages'
    
    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey('chat_sessions.id'), nullable=False)
    sender_type = Column(Enum('user', 'character', name='sender_type'), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.now())
    updated_at = Column(DateTime, default=datetime.now(), onupdate=datetime.now())
    # 关系
    session = relationship("ChatSession", back_populates="messages")

class InspirationResult(Base):
    __tablename__ = 'inspiration_results'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=True)
    characters = Column(JSON, nullable=True)
    prompt = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    story_direction = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.now())
    updated_at = Column(DateTime, default=datetime.now(), onupdate=datetime.now())
    cover_image = Column(String(255), nullable=True)


    async def get_characters(self, session: AsyncSession):
        """获取角色详细信息"""
        from sqlalchemy import select
        from database import Character  # 在方法内部导入避免循环引用
        character_ids = self.characters
        if not character_ids:
            return []
        
        query = select(Character).where(Character.id.in_(character_ids))
        result = await session.execute(query)
        characters = result.scalars().all()
        
        return [
            {
                "id": char.id,
                "name": char.name,
                "description": char.description,
                "image_url": char.image_url
            }
            for char in characters
        ]

class CrazyWalkResult(Base):
    __tablename__ = 'crazy_walk_results'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.now())
    updated_at = Column(DateTime, default=datetime.now(), onupdate=datetime.now())

class CrazyWalk2Result(Base):
    __tablename__ = 'crazy_walk_2_results'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    additional_info = Column(JSON)
    created_at = Column(DateTime, default=datetime.now())
    updated_at = Column(DateTime, default=datetime.now(), onupdate=datetime.now())

class BookBreakdownResult(Base):
    __tablename__ = 'book_breakdown_results'
    
    id = Column(Integer, primary_key=True)
    book_title = Column(String(255), nullable=False)
    analysis = Column(Text, nullable=False)
    key_points = Column(JSON)
    summary = Column(Text)
    created_at = Column(DateTime, default=datetime.now())
    updated_at = Column(DateTime, default=datetime.now(), onupdate=datetime.now())


# 文件表模型
class File(Base):
    __tablename__ = "files"

    file_id = Column(String(36), primary_key=True, index=True)  # UUID作为主键
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(255), nullable=False)
    content_type = Column(String(100))
    file_size = Column(Integer)
    upload_date = Column(DateTime, default=datetime.now())
    user_id = Column(Integer, nullable=True)  # 用户ID（如果需要关联上传用户）
    
    # 与拆书表建立关系
    book_breakdowns = relationship("BookBreakdown", back_populates="file")

# 拆书表模型
class BookBreakdown(Base):
    __tablename__ = "book_breakdowns"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(String(36), ForeignKey("files.file_id"), nullable=False)
    title = Column(String(255), nullable=False)  # 拆书标题
    analysis_content = Column(Text, nullable=False)  # 分析内容
    analysis_type = Column(String(100))  # 分析类型
    created_at = Column(DateTime, default=datetime.now())
    updated_at = Column(DateTime, default=datetime.now(), onupdate=datetime.now())
    
    # 关联文件表
    file = relationship("File", back_populates="book_breakdowns")