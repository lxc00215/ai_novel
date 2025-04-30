# from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException, Query
# from sqlalchemy import func, select

# from auth import get_current_user
# from database import BookGeneration, GeneratedChapter, User, get_db
# from sqlalchemy.ext.asyncio import AsyncSession

# # from schemas import BookGenerationResonseByPage


router = APIRouter(prefix="/history", tags=["history"])

# @router.get("/generations", response_model=BookGenerationResonseByPage)
# async def list_novel_generations(
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db),
#     page: int = Query(1, ge=1, description="页码"),
#     limit: int = Query(20, ge=1, le=100, description="每页数量")
# ):
#     # 计算总数
#     count_query = select(func.count()).select_from(BookGeneration).where(
#         BookGeneration.user_id == current_user.id
#     )
#     total_count = await db.scalar(count_query)
    
#     # 构建分页查询
#     query = (
#         select(
#             BookGeneration,
#         )
#         .where(BookGeneration.user_id == current_user.id)
#         .order_by(BookGeneration.created_at.desc())
#         .offset((page - 1) * limit)
#         .limit(limit)
#     )
    
#     result = await db.execute(query)
#     novels = []
    
    
#     for row in result:
#         novel = row[0]  # 只取第一个元素，因为没有使用 func.group_concat
        
#         # 构建基本响应
#         novel_data = {
#             "id": novel.id,
#             "prompt": novel.prompt,
#             "model_id": novel.model_id,
#             "title": novel.title,
#             "status": novel.status,
#             "progress": novel.progress,
#             "created_at": novel.created_at,
#             "updated_at": novel.updated_at,
#             "total_chapters": novel.total_chapters,
#             "completed_chapters": novel.completed_chapters,
#             "error_message": novel.error_message
#         }
        
#         # # 根据参数决定是否合并章节内容
#         # if combine_chapters and all_content:
#         #     novel_data["content"] = all_content
#         # else:
#         #     # 获取单独的章节
#         #     chapters_query = select(GeneratedChapter).where(
#         #         GeneratedChapter.book_id == novel.id
#         #     ).order_by(GeneratedChapter.chapter_number)
#         #     chapters_result = await db.execute(chapters_query)
#         #     chapters = chapters_result.scalars().all()
            
#         #     novel_data["chapters"] = [
#         #         {
#         #             "chapter_number": chapter.chapter_number,
#         #             "title": chapter.title,
#         #             "content": chapter.content
#         #         }
#         #         for chapter in chapters
#         #     ]
        
#         novels.append(novel_data)
    
#     # 返回带分页信息的响应
#     return {
#         "items": novels,
#         "total": total_count,
#         "page": page,
#         "size": limit,
#         "pages": (total_count + limit - 1)  # 总页数
#     }

# # 获取单本小说的详细信息
# @router.get("/generations/{novel_id}")
# async def get_novel_generation(
#     novel_id: int,
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db)
# ):
#     # 获取小说基本信息
#     query = select(BookGeneration).where(
#         BookGeneration.id == novel_id,
#         BookGeneration.user_id == current_user.id
#     )
#     result = await db.execute(query)
#     novel = result.scalar_one_or_none()
    
#     if not novel:
#         raise HTTPException(status_code=404, detail="Novel not found")
    
#     # 构建响应数据
#     response = {
#         "id": novel.id,
#         "title": novel.title,
#         "status": novel.status,
#         "progress": novel.progress,
#         "created_at": novel.created_at,
#         "updated_at": novel.updated_at,
#         "total_chapters": novel.total_chapters,
#         "completed_chapters": novel.completed_chapters
#     }
    
#     # 获取章节内容
#     chapters_query = select(GeneratedChapter).where(
#         GeneratedChapter.book_id == novel.id
#     ).order_by(GeneratedChapter.chapter_number)
#     chapters_result = await db.execute(chapters_query)
#     chapters = chapters_result.scalars().all()

#         # 返回单独的章节
#     response["chapters"] = [
#         {
#             "chapter_number": chapter.chapter_number,
#             "title": chapter.title,
#             "content": chapter.content
#         }
#         for chapter in chapters
#     ]
    
#     return response
