# FastAPI 示例

from fastapi import APIRouter, Depends
from requests import session
from sqlalchemy import delete, select
from auth import get_current_user
from database import  Character, ChatMessage, ChatSession, User, get_db
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from routes.feature_routes import get_feature_by_name
from schemas import ChatMessageRequest, ChatSessionRequest
from openai import AsyncOpenAI  # 确保导入异步客户端
from sqlalchemy.orm import joinedload,selectinload
router = APIRouter(prefix="/chat")
    
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

async def get_chat_sessions(db: AsyncSession, sessions: list):
    sessions_with_messages = []
    for session in sessions:
        # 使用异步上下文管理器来执行查询
        query = select(ChatMessage).where(
            ChatMessage.session_id == session.id
        ).order_by(
            ChatMessage.created_at.asc()
        ).limit(50)
        
        # 确保在异步会话中执行查询
        result = await db.execute(query)
        messages = result.scalars().all()

        if len(messages) > 0:
            # 最后一条消息
            session.last_message = messages[-1].content
            session.last_message_time = messages[-1].created_at
        
        # 创建包含会话和消息的字典
        session_data = {
            "session": session,
            "messages": messages
        }
        sessions_with_messages.append(session_data)
    
    return sessions_with_messages

@router.get("/sessions/recent")
async def get_user_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 首先获取会话列表
    sessions_query = select(ChatSession).options(
        selectinload(ChatSession.messages),
        joinedload(ChatSession.character),
        joinedload(ChatSession.user)
    ).where(ChatSession.user_id == current_user.id).order_by(ChatSession.updated_at.desc()).limit(1)
    result = await db.execute(sessions_query)
    sessions = result.scalars().all()
    
    return sessions

# 在路由处理函数中使用
@router.get("/sessions")
async def get_user_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 只查最近7天的会话
    # 首先获取会话列表
    sessions_query = select(ChatSession).where(ChatSession.user_id == current_user.id).where(ChatSession.updated_at >= datetime.now() - timedelta(days=1))
    result = await db.execute(sessions_query)
    sessions = result.scalars().all()
    
    # 然后获取每个会话的消息
    sessions_with_messages = await get_chat_sessions(db, sessions)
    
    return sessions_with_messages

@router.get("/history/{session_id}")
async def get_chat_history(session_id: int,db: AsyncSession = Depends(get_db)):
    """获取特定会话的聊天历史"""
    query = select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).limit(50)
    messages = await db.execute(query)
    messages = messages.scalars().all()
    
    return messages

# 清除该会话下的全部消息
@router.post("/session/{sessionId}/clear")
async def clear_session(sessionId: int,db: AsyncSession = Depends(get_db)):
    """清除该会话下的全部消息"""
    query = delete(ChatMessage).where(ChatMessage.session_id == sessionId)
    # 清除session的last_message和last_message_time
    session_query = select(ChatSession).where(ChatSession.id == sessionId)
    session = await db.execute(session_query)
    session = session.scalar_one_or_none()
    session.last_message = None
    session.last_message_time = None
    session.updated_at = datetime.now()
    await db.commit()
    return {"message": "Session messages cleared successfully"}


# @router.post("/session")
# async def get_or_create_session(
#     request: ChatSessionRequest,
#     db: AsyncSession = Depends(get_db)
# ):
#     """创建或获取会话"""
#     # 查询现有会话
#     query = select(ChatSession).where(
#         ChatSession.user_id == request.user_id,
#         ChatSession.character_id == request.character_id
#     )
#     result = await db.execute(query)
#     existing_session = result.scalar_one_or_none()

#     # 查询角色
#     character_query = select(Character).where(Character.id == request.character_id)
#     character = await db.execute(character_query)
#     character = character.scalar_one_or_none()

#     # 如果角色不存在，则创建角色
#     if not character:
#         raise HTTPException(status_code=404, detail="Character not found")
#     # 查询用户
#     user_query = select(User).where(User.id == request.user_id)
#     user = await db.execute(user_query)
#     user = user.scalar_one_or_none()

#     # 如果用户不存在，则创建用户
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
    
#     # 如果会话不存在，创建新会话
#     if not existing_session:
#         new_session = ChatSession(
#             user_id=request.user_id,
#             character_id=request.character_id,
#             created_at=datetime.now(),
#             updated_at=datetime.now()
#         )
#         db.add(new_session)
#         await db.commit()
#         await db.refresh(new_session)
#         return new_session
#     # 构建返回对象

#     data = {
#         "id": existing_session.id,
#         "created_at": existing_session.created_at,
#         "updated_at": existing_session.updated_at,
#         "character": character,
#         "user": user,
#         "last_message": existing_session.last_message
#     }
#     return data


@router.post("/session")
async def get_or_create_session(
    request: ChatSessionRequest,
    db: AsyncSession = Depends(get_db)
):
    """创建或获取会话"""
    # 查询现有会话
    query = select(ChatSession).where(
        ChatSession.user_id == request.user_id,
        ChatSession.character_id == request.character_id
    )
    result = await db.execute(query)
    existing_session = result.scalar_one_or_none()

    # 查询角色
    character_query = select(Character).where(Character.id == request.character_id)
    character = await db.execute(character_query)
    character = character.scalar_one_or_none()

    # 如果角色不存在，则创建角色
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    # 查询用户
    user_query = select(User).where(User.id == request.user_id)
    user = await db.execute(user_query)
    user = user.scalar_one_or_none()

    # 如果用户不存在，则创建用户
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 如果会话不存在，创建新会话
    if not existing_session:
        new_session = ChatSession(
            user_id=request.user_id,
            character_id=request.character_id,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        db.add(new_session)
        await db.commit()
        await db.refresh(new_session)
        return new_session
    
    # 获取会话的历史消息
    messages_query = select(ChatMessage).where(
        ChatMessage.session_id == existing_session.id
    ).order_by(
        ChatMessage.created_at.asc()
    ).limit(50)
    
    messages_result = await db.execute(messages_query)
    messages = messages_result.scalars().all()
    
    # 构建返回对象，包含历史消息
    data = {
        "id": existing_session.id,
        "created_at": existing_session.created_at,
        "updated_at": existing_session.updated_at,
        "character": character,
        "user": user,
        "last_message": existing_session.last_message,
        "messages": messages  # 添加历史消息
    }
    return data



from fastapi import Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from typing import AsyncGenerator

@router.post("/session/{session_id}/message")
async def send_message(
    session_id: int, 
    message: ChatMessageRequest,  # 使用 Pydantic 模型接收消息
    db: AsyncSession = Depends(get_db),
):
    """发送消息并获取 AI 响应"""
    try:
        # 1. 获取会话信息（包括角色设定）
        session_query = select(ChatSession).where(ChatSession.id == session_id)
        result = await db.execute(session_query)
        session = result.scalar_one_or_none()
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # 2. 获取角色信息
        character_query = select(Character).where(Character.id == session.character_id)
        character = await db.execute(character_query)
        character = character.scalar_one_or_none()
        
        if not character:
            raise HTTPException(status_code=404, detail="Character not found")
            
        # 3. 保存用户消息
        user_message = ChatMessage(
            session_id=session_id,
            content=message.content,
            sender_type="user",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        db.add(user_message)
        
        # 4. 更新会话时间
        session.updated_at = datetime.now()
        await db.commit()
        
        # 5. 获取历史消息
        history_query = select(ChatMessage).where(
            ChatMessage.session_id == session_id
        ).order_by(
            ChatMessage.created_at.desc()
        ).limit(10)
        
        history = await db.execute(history_query)
        history_messages = history.scalars().all()
        
        print(character.prompt,"character.prompt")
        # 6. 准备消息格式
        messages = [
            {"role": "system", "content": character.prompt}  # 使用角色的 prompt
        ]
        
        for hist_msg in reversed(history_messages):
            role = "assistant" if hist_msg.sender_type == "character" else "user"
            messages.append({"role": role, "content": hist_msg.content})
        
        messages.append({"role": "user", "content": message.content})

        # 7. 创建流式响应
        return StreamingResponse(
            generate_response(messages, session_id, db),
            media_type='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        )

    except Exception as e:
        print(f"Error in send_message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def generate_response(
    messages: list,
    session_id: int,
    db: AsyncSession
) -> AsyncGenerator[str, None]:
    """生成 AI 响应的流式生成器"""
    try:
        # 创建新的数据库会话

        feature_config = get_feature_by_name("聊天")
        client = AsyncOpenAI()
        accumulated_message = ""
        stream = await client.chat.completions.create(
                model=feature_config["model"],
                messages=messages,
                stream=True
            )
    
        async for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                content = chunk.choices[0].delta.content
                accumulated_message += content
                
                # 更新数据库中的消息
             
                
                # 返回流式内容
                yield f"data: {content}\n\n"
            # 等全部流式内容返回后，更新数据库内容

        async with AsyncSession(db.bind) as new_db:
            # 创建新的 AI 消息记录
            ai_message = ChatMessage(
                session_id=session_id,
                content=accumulated_message,
                sender_type="character",
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            new_db.add(ai_message)
            await new_db.commit()
            await new_db.refresh(ai_message)
            
            # 更新会话ID为当前会话ID的最后一条消息
            session_query = select(ChatSession).where(ChatSession.id == session_id)
            result = await new_db.execute(session_query)
            session = result.scalar_one_or_none()
            session.last_message = accumulated_message
            session.last_message_time = datetime.now()
            await new_db.commit()

            # await new_db.refresh(session)
            
            yield "data:\n\n"
            
    except Exception as e:
        print(f"Error in generate_response: {str(e)}")
        yield f"data: Error: {str(e)}\n\n"
        
