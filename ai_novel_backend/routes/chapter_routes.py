from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import BookGeneration, GeneratedChapter, User, get_db
from schemas import ChapterCreate, ChapterUpdate, ChapterResponse

router = APIRouter(prefix="/chapters", tags=["chapters"])

# 获取某本书的所有章节
@router.get("/{book_id}", response_model=List[ChapterResponse])
async def get_book_chapters(
    book_id: int = Path(..., description="书籍ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 验证书籍所有权
    book_query = select(BookGeneration).where(
        BookGeneration.id == book_id,
        BookGeneration.user_id == current_user.id
    )
    book = await db.execute(book_query)
    book = book.scalar_one_or_none()
    
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在或无权访问")
    
    # 获取所有章节
    chapters_query = select(GeneratedChapter).where(
        GeneratedChapter.book_id == book_id
    ).order_by(GeneratedChapter.chapter_number)
    
    chapters = await db.execute(chapters_query)
    return chapters.scalars().all()

# 获取单个章节
@router.get("/{book_id}/{chapter_number}", response_model=ChapterResponse)
async def get_chapter(
    book_id: int = Path(..., description="书籍ID"),
    chapter_number: int = Path(..., description="章节编号"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 验证书籍所有权
    book_query = select(BookGeneration).where(
        BookGeneration.id == book_id,
        BookGeneration.user_id == current_user.id
    )
    book = await db.execute(book_query)
    book = book.scalar_one_or_none()
    
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在或无权访问")
    
    # 获取章节
    chapter_query = select(GeneratedChapter).where(
        GeneratedChapter.book_id == book_id,
        GeneratedChapter.chapter_number == chapter_number
    )
    
    chapter = await db.execute(chapter_query)
    chapter = chapter.scalar_one_or_none()
    
    if not chapter:
        raise HTTPException(status_code=404, detail="章节不存在")
    
    return chapter

# 创建新章节
@router.post("/{book_id}", response_model=ChapterResponse)
async def create_chapter(
    chapter: ChapterCreate,
    book_id: int = Path(..., description="书籍ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 验证书籍所有权
    book_query = select(BookGeneration).where(
        BookGeneration.id == book_id,
        BookGeneration.user_id == current_user.id
    )
    book = await db.execute(book_query)
    book = book.scalar_one_or_none()
    
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在或无权访问")
    
    # 检查章节编号是否已存在
    existing_query = select(GeneratedChapter).where(
        GeneratedChapter.book_id == book_id,
        GeneratedChapter.chapter_number == chapter.chapter_number
    )
    existing = await db.execute(existing_query)
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="该章节编号已存在")
    
    # 创建新章节
    new_chapter = GeneratedChapter(
        book_id=book_id,
        chapter_number=chapter.chapter_number,
        title=chapter.title,
        content=chapter.content
    )
    
    db.add(new_chapter)
    
    # 更新书籍的已完成章节数
    book.completed_chapters += 1
    
    await db.commit()
    await db.refresh(new_chapter)
    
    return new_chapter

# 更新章节
@router.put("/{book_id}/{chapter_number}", response_model=ChapterResponse)
async def update_chapter(
    chapter_update: ChapterUpdate,
    book_id: int = Path(..., description="书籍ID"),
    chapter_number: int = Path(..., description="章节编号"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 验证书籍所有权
    book_query = select(BookGeneration).where(
        BookGeneration.id == book_id,
        BookGeneration.user_id == current_user.id
    )
    book = await db.execute(book_query)
    book = book.scalar_one_or_none()
    
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在或无权访问")
    
    # 获取章节
    chapter_query = select(GeneratedChapter).where(
        GeneratedChapter.book_id == book_id,
        GeneratedChapter.chapter_number == chapter_number
    )
    
    chapter = await db.execute(chapter_query)
    chapter = chapter.scalar_one_or_none()
    
    if not chapter:
        raise HTTPException(status_code=404, detail="章节不存在")
    
    # 更新章节
    update_data = chapter_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(chapter, key, value)
    
    await db.commit()
    await db.refresh(chapter)

    print(chapter)
    
    return chapter

# 删除章节
@router.delete("/{book_id}/{chapter_number}", status_code=204)
async def delete_chapter(
    book_id: int = Path(..., description="书籍ID"),
    chapter_number: int = Path(..., description="章节编号"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 验证书籍所有权
    book_query = select(BookGeneration).where(
        BookGeneration.id == book_id,
        BookGeneration.user_id == current_user.id
    )
    book = await db.execute(book_query)
    book = book.scalar_one_or_none()
    
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在或无权访问")
    
    # 获取章节
    chapter_query = select(GeneratedChapter).where(
        GeneratedChapter.book_id == book_id,
        GeneratedChapter.chapter_number == chapter_number
    )
    
    chapter = await db.execute(chapter_query)
    chapter = chapter.scalar_one_or_none()
    
    if not chapter:
        raise HTTPException(status_code=404, detail="章节不存在")
    
    # 删除章节
    await db.delete(chapter)
    
    # 更新书籍的已完成章节数
    if book.completed_chapters > 0:
        book.completed_chapters -= 1
    
    await db.commit()
    
    return None 