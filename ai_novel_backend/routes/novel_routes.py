from typing import Optional, List, Dict
from fastapi import APIRouter, HTTPException, Depends, Query, WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from config.prompt import WRITER_PROMPT
from database import get_db, Novel, User, BookGeneration, GeneratedChapter
from schemas import CrazyNovelCreate, NovelCreate, NovelUpdate, NovelResponse, PaginatedResponse
from auth import get_current_user
from datetime import datetime
from dao.crazy1novel import write_novel_free
import asyncio
from fastapi import WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool

router = APIRouter(prefix="/novels", tags=["novels"])

@router.post("/create", response_model=NovelResponse)
async def create_novel(
    novel: NovelCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    word_count = len(novel.content.split())
    new_novel = Novel(
        user_id=current_user.id,
        title=novel.title,
        content=novel.content,
        word_count=word_count
    )
    
    db.add(new_novel)
    current_user.story_count += 1
    current_user.total_words += word_count

    # 计算创作天数
    today = datetime.now().date()
    if current_user.last_writing_date != today:
        current_user.writing_days += 1
        current_user.last_writing_date = today

    await db.commit()
    await db.refresh(new_novel)
    return new_novel

@router.get("/", response_model=PaginatedResponse)
async def list_novels(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 获取总数
    total_query = select(func.count()).select_from(Novel).where(
        Novel.user_id == current_user.id
    )
    total = await db.scalar(total_query)
    
    # 获取分页数据
    query = select(Novel).where(
        Novel.user_id == current_user.id
    ).order_by(Novel.created_at.desc()).offset((page - 1) * size).limit(size)
    
    result = await db.execute(query)
    novels = result.scalars().all()
    
    return {
        "total": total,
        "page": page,
        "size": size,
        "items": novels
    }

@router.get("/{novel_id}", response_model=NovelResponse)
async def get_novel(
    novel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Novel).where(
        Novel.id == novel_id,
        Novel.user_id == current_user.id
    )
    result = await db.execute(query)
    novel = result.scalar_one_or_none()
    
    if not novel:
        raise HTTPException(status_code=404, detail="Novel not found")
    return novel

@router.put("/{novel_id}", response_model=NovelResponse)
async def update_novel(
    novel_id: int,
    novel_update: NovelUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Novel).where(
        Novel.id == novel_id,
        Novel.user_id == current_user.id
    )
    result = await db.execute(query)
    novel = result.scalar_one_or_none()
    
    if not novel:
        raise HTTPException(status_code=404, detail="Novel not found")
    if novel_update.content:
        new_word_count = len(novel_update.content.split())
        word_count_diff = new_word_count - novel.word_count
        current_user.total_words += word_count_diff
        novel.word_count = new_word_count

        now = datetime.utcnow()
        if not current_user.last_write_time or (now.date() - current_user.last_write_time.date()).days > 0:
            current_user.writing_days += 1

    # 更新字段
    for field, value in novel_update.dict(exclude_unset=True).items():
        setattr(novel, field, value)
        if field == 'content':
            novel.word_count = len(value.split())
    
    await db.commit()
    return novel

@router.websocket("/ws/novel_progress/{user_id}")
async def websocket_novel_progress(websocket: WebSocket, user_id: int):
    await websocket.accept()
    try:
        while True:
            # 每秒检查一次进度
            async with get_db() as session:
                query = select(BookGeneration).where(
                    BookGeneration.user_id == user_id,
                    BookGeneration.status == "processing"
                ).order_by(BookGeneration.created_at.desc())
                result = await session.execute(query)
                novel = result.scalar_one_or_none()
                
                if novel:
                    await websocket.send_json({
                        "progress": novel.progress,
                        "status": novel.status,
                        "error": novel.error_message
                    })
                    
                    # 如果小说已完成或失败，结束 WebSocket 连接
                    if novel.status in ["completed", "failed"]:
                        break
                        
            await asyncio.sleep(1)  # 等待1秒
    except WebSocketDisconnect:
        print("Client disconnected")

@router.post("/crazy/short")
async def crazy_generate_novel(
    crazy_novel: CrazyNovelCreate,
    current_user: User = Depends(get_current_user),
):
    try:
        # 启动异步任务
        asyncio.create_task(
            write_novel_free(
                api_key=crazy_novel.api_key,
                base_url=crazy_novel.base_url,
                user_id=current_user.id,
                options={
                    "novel_type": crazy_novel.novel_type,
                    "novel_category": crazy_novel.novel_category,
                    "novel_theme": crazy_novel.novel_theme,
                    "model": crazy_novel.model,
                    "system_prompt": crazy_novel.system_prompt if crazy_novel.system_prompt else WRITER_PROMPT,
                    "provider_name": crazy_novel.provider_name
                },
            )
        )
    
        return {
            "message": "Novel generation started",
            "user_id": current_user.id,
            "status": "pending"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start novel generation: {str(e)}"
        )


