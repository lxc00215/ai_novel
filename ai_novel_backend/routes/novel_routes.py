# from typing import Optional, List, Dict
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy import select, func, update

from database import Novels, User,async_session
from sqlalchemy.ext.asyncio import AsyncSession
# from config.prompt import WRITER_PROMPT
from database import get_db, User, Novels, GeneratedChapter
from schemas import BookGenerationCreate, ChapterCreate, ChapterResponse, ChapterUpdate, NovelResponse, NovelUpdate
# from schemas import CrazyNovelCreate, NovelCreate, NovelUpdate, NovelResponse, PaginatedResponse
from auth import get_current_user  # 导入获取当前用户的函数
# from datetime import datetime
# from dao.crazy1novel import write_novel_free
# import asyncio
# from fastapi import WebSocketDisconnect
# from fastapi.concurrency import run_in_threadpool

router = APIRouter(prefix="/novels", tags=["novels"])



# 创建小说
@router.post("/create", response_model=None)
async def create_novel(
    request: BookGenerationCreate,
    # current_user: User = Depends(get_current_user),  # 获取当前登录用户
):
   async with async_session() as db:

    # 创建一本什么都没的空小说
        novel = Novels(
            user_id=request.user_id,  # 使用当前登录用户的ID
            title=request.title,
            description=request.description,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    
        db.add(novel)
        await db.commit()
        await db.refresh(novel)

        # 创建一本什么都没的空小说
        chapter = GeneratedChapter(
            book_id=novel.id,
            order=0,
            title="新建章节",
            content="",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        db.add(chapter)
        await db.commit()
        # 章节已经通过 book_id 关联到小说
        await db.refresh(novel)
        return novel
   
# 获取某一本小说
@router.get("/{novel_id}", response_model=None)
async def get_novel(novel_id:int):
    async with async_session() as db:
        query = select(Novels).where(
            Novels.id == novel_id
        )
        result = await db.execute(query)
        novel = result.scalars().first()
        if not novel:
            raise HTTPException(status_code=404, detail=f"未找到书籍ID为{novel_id}的小说")
        return novel
    
# 获取该用户的全部小说
@router.get("/{user_id}/novel", response_model=None)
async def get_all_novel(user_id:int):
    async with async_session() as db:
        query = select(Novels).where(
            Novels.user_id == user_id
        )
        result = await db.execute(query)
        novels = result.scalars().all()

        if not novels:
            raise HTTPException(status_code=404, detail=f"未找到该用户的小说")
       
        return novels




# 更新小说
@router.put("/{novel_id}/updateNovel", response_model=None)
async def update_novel(novel_id:int, new_novel:NovelUpdate):
    async with async_session() as db:
        query = select(Novels).where(
            Novels.id == novel_id
        )
        result = await db.execute(query)
        novel = result.scalars().first()
        if not novel:
            raise HTTPException(status_code=404, detail=f"未找到书籍ID为{novel_id}的小说")
        
        if new_novel.title:
            novel.title = new_novel.title
        
        if new_novel.description:
            novel.description = new_novel.description
        if new_novel.is_top:
            novel.is_top = new_novel.is_top
        elif new_novel.is_top == False:
            novel.is_top = False

        if new_novel.is_archive:
            novel.is_archive = new_novel.is_archive
        elif new_novel.is_archive == False:
            novel.is_archive = False


        # 更新章节到chapter表
        if new_novel.chapters:
            for chapter in new_novel.chapters:
                # 直接更新
                query = update(GeneratedChapter).where(
                    GeneratedChapter.book_id == novel.id,
                    GeneratedChapter.order == chapter.order
                ).values(
                    title=chapter.title,
                    content=chapter.content,
                    summary=chapter.summary
                )
                await db.execute(query)

        novel.updated_at = datetime.now()

        await db.commit()
        await db.refresh(novel)
        return novel
    
# 添加章节
@router.post("/{id}/chapters", response_model=None)
async def add_chapter(id:int, new_chapter:ChapterCreate):
    async with async_session() as db:
        query = select(Novels).where(
            Novels.id == id
        )
        result = await db.execute(query)
        novel = result.scalars().first()
        if not novel:
            raise HTTPException(status_code=404, detail=f"未找到书籍ID为{id}的小说")
        
        # 创建新章节
        new_chapter = GeneratedChapter(
            book_id=id,
            order=new_chapter.order,
            title=new_chapter.title,
            content=new_chapter.content,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        db.add(new_chapter)
        await db.commit()
        await db.refresh(new_chapter)

        return new_chapter

# 更新章节
@router.put("/{id}/chapters/{order}", response_model=None)
async def update_chapter(id:int, order:int, new_chapter:ChapterUpdate):
    async with async_session() as db:
        query = select(GeneratedChapter).where(
            GeneratedChapter.book_id == id,
            GeneratedChapter.order == order
        )
        result = await db.execute(query)
        chapter = result.scalars().first()
        if not chapter:
            raise HTTPException(status_code=404, detail=f"未找到第{order}章的小说")
        if new_chapter.title:
            chapter.title = new_chapter.title
        
        if new_chapter.content:
            chapter.content = new_chapter.content
        
        if new_chapter.summary:
            chapter.summary = new_chapter.summary
        chapter.updated_at = datetime.now()

        await db.commit()
        await db.refresh(chapter)
        return chapter
    


    

#  查询全部小说id为 的章节

@router.get("/{novel_id}/chapters", response_model=ChapterResponse)
async def get_novel_chapters(novel_id: int):
    """
    获取特定小说的所有章节
    """
    async with async_session() as db:
        # 查询指定book_id的全部章节
        query = select(GeneratedChapter).where(
            GeneratedChapter.book_id == novel_id
        ).order_by(GeneratedChapter.order)
        
        result = await db.execute(query)
        chapters = result.scalars().all()
        
        if not chapters:
            raise HTTPException(status_code=404, detail=f"未找到书籍ID为{novel_id}的章节")
        
        # 查询小说
        query = select(Novels).where(
            Novels.id == novel_id
        )
        result = await db.execute(query)
        novel = result.scalars().first()
        


        # 准备返回数据
        response_chapters = []
        for chapter in chapters:
            response_chapters.append({
                "id": chapter.id,
                "book_id": chapter.book_id,
                "order": chapter.order,  # 将order映射为chapter_number
                "title": chapter.title,
                "content": chapter.content,
                "created_at": chapter.created_at,
                "updated_at": chapter.updated_at
            })

        # 小说和章节一起返回
        response_novel = {
            "id": novel.id,
            "title": novel.title,
            "is_top": novel.is_top,
            "is_archive": novel.is_archive,
            "description": novel.description,
            "chapters": response_chapters
        }
            
        return response_novel


# 删除小说
@router.delete("/{novel_id}/delete", response_model=None)
async def delete_novel(novel_id:int):
    async with async_session() as db:
        query = select(Novels).where(
            Novels.id == novel_id
        )
        result = await db.execute(query)
        novel = result.scalars().first()

        if not novel:
            raise HTTPException(status_code=404, detail=f"未找到书籍ID为{novel_id}的小说")
        
        await db.delete(novel)
        await db.commit()
        return {"message": "小说删除成功"}

