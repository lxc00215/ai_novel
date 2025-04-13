import os
from fastapi import Depends
from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional, List, Union, Dict
from datetime import datetime
from database import BookBreakdownResult, Character, CrazyWalk2Result, CrazyWalkResult, InspirationResult, Task, get_db
from models import TaskTypeEnum
from sqlalchemy.ext.asyncio import AsyncSession

class BaseResultSchema(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,  # 允许从ORM模型创建
        arbitrary_types_allowed=True  # 允许任意类型
    )
    
    id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None



# User schemas
class UserCreate(BaseResultSchema):
    account: str
    email: Optional[EmailStr] = None
    password: str

    def validate_login_field(self):
        if not (self.email or self.account):
            raise ValueError("Either email or account must be provided")

class UserResponse(BaseResultSchema):
    account: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None  # 个人简介
    total_words: Optional[int] = 0
    writing_days: Optional[int] = 0
    store_count: Optional[int] = 0

# class UserUpdate(BaseResultSchema):
#     avatar_url: Optional[str] = None
#     username: Optional[str] = None

class UserProfileUpdate(BaseResultSchema):
    username: Optional[str] = None
    bio: Optional[str] = None  # 个人简介
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

class ChapterBase(BaseResultSchema):
    order: int
    title: str
    content: str


class ChapterCreate(ChapterBase):
    order: int
    title: str
    content: str
    summary: Optional[str] = None
    updated_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

# Novel schemas
class NovelCreate(BaseResultSchema):
    title: str
    description: str

class NovelUpdate(BaseResultSchema):
    title: Optional[str] = None
    description: Optional[str] = None
    is_top: Optional[bool] = None
    is_archive: Optional[bool] = None
    chapters: Optional[List[ChapterCreate]] = None



class UserLogin(BaseResultSchema):
    # account 和 email 至少有一个
    account: Optional[str] = None  # 用户名
    email: Optional[EmailStr] = None
    password: str

class NovelResponse(BaseResultSchema):
    id: int
    user_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_top: Optional[bool] = False
    is_archive: Optional[bool] = False
    
    class Config:
        orm_mode = True  # This tells Pydantic to read data from ORM objects
# Prompt schemas
class PromptCreate(BaseResultSchema):
    title: str
    content: str
    category: Optional[str] = None
    is_public: bool = False

class PromptUpdate(BaseResultSchema):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    is_public: Optional[bool] = None

class PromptResponse(BaseResultSchema):
    title: str
    content: str
    category: Optional[str]
    is_public: bool
   

class Token(BaseResultSchema):
    access_token: str
    token_type: str

class TokenData(BaseResultSchema):
    user_id: int
    username: str



# 添加分页响应模型
class PaginatedResponse(BaseResultSchema):
    total: int
    page: int
    size: int
    items: list

class ModelBase(BaseResultSchema):
    name: str
    label: str
    top_k: int
    description: str
    temperature: float
    input_token_limit: int
    output_token_limit: int
    max_tokens: int

class ModelResponse(ModelBase):
    provider_id: int

    class Config:
        orm_mode = True

class ProviderBase(BaseResultSchema):
    com_name: str
    avatar_url: Optional[str] = None
    base_url: str
    is_active: bool

class ProviderResponse(ProviderBase):
    models: List[ModelResponse]
    class Config:
        orm_mode = True 





class GeneratedChapterBase(BaseResultSchema):
    chapter_number: int
    title: str
    content: str

class GeneratedChapterCreate(GeneratedChapterBase):
    book_id: int



class ChatHistoryBase(BaseResultSchema):
    title: Optional[str] = None
    model_id: str

class ChatHistoryCreate(ChatHistoryBase):
    user_id: int

class ChatHistoryResponse(ChatHistoryBase):
    messages: List["ChatMessageResponse"]

    class Config:
        orm_mode = True

class ChatMessageBase(BaseResultSchema):
    role: str  # 'user' 或 'assistant'
    content: str

class ChatMessageCreate(ChatMessageBase):
    chat_id: int

class ChatMessageResponse(ChatMessageBase):
    pass

class BookAnalysisBase(BaseResultSchema):
    book_title: str
    book_content: str
    prompt: str
    ai_response: str
    model_id: str

class BookAnalysisCreate(BookAnalysisBase):
    user_id: int

class BookAnalysisResponse(BookAnalysisBase):
    

    class Config:
        orm_mode = True

# class BookGenerationBase(BaseResultSchema):
#     title: str
#     prompt: str
#     model_id: str
#     status: str
#     progress: int
#     total_chapters: int
#     completed_chapters: int = 0
#     error_message: Optional[str] = None

class BookGenerationCreate(BaseResultSchema):
    user_id: Optional[str]
    description: Optional[str]
    title: str

# class BookGenerationResponse(BookGenerationBase):
  

#     class Config:
#         orm_mode = True

# # 更新 BookGenerationResponse 的前向引用
# BookGenerationResponse.model_rebuild()
# # 更新 ChatHistoryResponse 的前向引用
ChatHistoryResponse.model_rebuild()

class CrazyNovelCreate(BaseResultSchema):
    model: str
    system_prompt: Optional[str] = None
    provider_name: str
    api_key: str
    base_url: str
    novel_type: str
    novel_category: Optional[str] = None
    novel_theme: Optional[str] = None



# class BookGenerationResonseByPage(BaseResultSchema):
#     items: List[BookGenerationResponse]
#     total: int
#     page: int
#     size: int
#     pages: int





class ChapterUpdate(BaseResultSchema):
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    order: Optional[int] = None




class ChapterResponse(NovelResponse):
    chapters: List[ChapterBase]
    class Config:
        orm_mode = True



# Task schemas
class TaskBase(BaseResultSchema):
    task_type: TaskTypeEnum
    prompt: str

class TaskCreate(TaskBase):
    user_id: int


# {
#   "images": [
#     {
#       "url": "<string>"
#     }
#   ],
#   "timings": {
#     "inference": 123
#   },
#   "seed": 123
# }

class Image(BaseResultSchema):
    url: str

class ImageResponse(BaseResultSchema):
    image: str
    timings: Dict[str, float]
    seed: int

class TaskUpdate(BaseResultSchema):
    completion_percentage: Optional[int] = None
    status: Optional[str] = None
    result_id: Optional[int] = None
    result_type: Optional[str] = None
    result_data: Optional[str] = None

class TaskResponse(TaskBase):
    user_id: int
    completion_percentage: int
    status: str
    result_id: Optional[int] = None
    result_type: Optional[str] = None


# 定义一个结果，这个结果是根据result_type来决定的，可以为灵感，拆书，暴走，暴走2.0的结果
    result: Optional[Union[
        InspirationResult,
        CrazyWalkResult,
        CrazyWalk2Result,
        BookBreakdownResult
    ]] = None


class SampleTaskResponse(BaseModel):
    task_id: int
    message: str

class SampleTaskRequest(BaseResultSchema):
    task_id: int
    user_id: int
    is_continue: bool
    prompt: str

class CharacterRequest(BaseResultSchema):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    prompt: Optional[str] = None
    is_used: bool = False
    user_id: int

class InspirationUpdate(BaseModel):
    id: int
    characters: Optional[List[int]] = None
    title: Optional[str] = None
    content: Optional[str] = None
    story_direction: Optional[List] = None
    cover_image: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# 任务分页响应
class TaskResponseByPage(BaseResultSchema):
    items: List[TaskResponse]
    total: int
    page: int
    size: int
    pages: int


class GenerateImageRequest(BaseResultSchema):
    prompt: str
    model: Optional[str] = os.getenv("IMAGE_MODEL")
    batch_size: Optional[int] = 1
    seed: Optional[int] = 42
    guidance_scale: Optional[float] = 7.5
    num_inference_steps: Optional[int] = 20
    size: Optional[str] = '1024x1024'
    negative_prompt: Optional[str] = None
    user_id: int

# @classmethod
# async def from_orm_with_result(cls, task: "Task", session: AsyncSession) -> "TaskSchema":
#     """创建包含结果的任务模式实例"""
#     # 创建基础任务模式实例
#     task_dict = {
#         "id": task.id,
#         "user_id": task.user_id,
#         "completion_percentage": task.completion_percentage,
#         "prompt": task.prompt,
#         "task_type": task.task_type,
#         "status": task.status,
#         "created_at": task.created_at,
#         "updated_at": task.updated_at,
#         "result_id": task.result_id,
#         "result_type": task.result_type,
#         "result": None
#     }
    
#     # 获取对应的结果
#     result_dict = await task.get_specific_result(session)
#     if result_dict:
#         # 根据结果类型选择正确的模式类
#         result_schema_map = {
#             TaskTypeEnum.INSPIRATION: InspirationResult,
#             TaskTypeEnum.CRAZY_WALK: CrazyWalkResult,
#             TaskTypeEnum.CRAZY_WALK_2: CrazyWalk2Result,
#             TaskTypeEnum.BOOK_BREAKDOWN: BookBreakdownResult
#         }
        
#         schema_cls = result_schema_map.get(task.result_type)
#         if schema_cls:
#             task_dict["result"] = schema_cls(**result_dict)
    
#     return cls(**task_dict)

# 基础模型配置
class BaseSchema(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        arbitrary_types_allowed=True
    )

# 角色响应模型
class CharacterResponse(BaseSchema):
    id: int
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    user_id: Optional[int] = None
    prompt: Optional[str] = None
    is_used: Optional[bool] = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ContinueSpirateRequest(BaseSchema):
    choice: str



class SpirateResponse(BaseSchema):
    id: int
    title: Optional[str] = None
    characters: List[CharacterResponse]
    prompt: Optional[str] = None
    content: Optional[str] = None
    cover_image: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    story_direction: Optional[List[str]] = None
    # user对象
    user: UserResponse
# 创建角色的请求模型
class CharacterCreate(BaseSchema):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_used: bool = False

class ChatMessageRequest(BaseModel):
    content: str

class ChatSessionRequest(BaseModel):
    user_id: int
    character_id: int

# schemas.py additions:

class ChapterGenerationInput(BaseResultSchema):
    """Input for AI generation of a chapter"""
    book_id: int
    chapter_number: int
    title: Optional[str] = None
    model_id: Optional[str] = None  # If None, use default model
    
    # Generation guidance options
    plot_outline: Optional[str] = None  # Brief outline of the chapter plot
    character_descriptions: Optional[str] = None  # Key characters in this chapter
    tone: Optional[str] = None  # e.g., "humorous", "serious", "mysterious"
    setting_description: Optional[str] = None  # Where this chapter takes place
    word_count_target: Optional[int] = 2000  # Target word count for generation
    special_instructions: Optional[str] = None  # Any additional instructions

class ChapterGenerationResponse(BaseResultSchema):
    """Response for AI generation of a chapter"""
    book_id: int
    chapter_number: int
    title: str
    content: str
    word_count: int
    model_id: str
    generation_time: float  # Time taken to generate in seconds

# schemas.py additions (continued)

class ChapterTemplate(BaseResultSchema):
    """Template for chapter structure"""
    name: str
    description: str
    structure: Dict[str, Dict]  # Contains sections like intro, conflict, resolution, etc.
    example: Optional[str] = None

class ChapterTemplateResponse(BaseResultSchema):
    """Response containing available chapter templates"""
    templates: List[ChapterTemplate]