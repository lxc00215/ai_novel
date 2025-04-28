



from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from dao.CrazyWalk import CrazyWalkService
from database import CrazyWalkResult, GeneratedChapter, Task,async_session
from models import TaskTypeEnum


router = APIRouter(prefix="/crazy",tags=["crazy"])

# 获取crazy_walk 任务
@router.get("/{id}")
async def get_crazy_walk_by_user(id: int):
    print(id)
    # 这里传来的应该为task的id
    
    async with async_session() as db:
        query = select(Task).where(Task.id == id)
        result = await db.execute(query)
        task = result.scalar_one_or_none()

        if task is None:
            raise HTTPException(status_code=404, detail="Book not found")
        query = select(CrazyWalkResult).where(CrazyWalkResult.id == task.result_id)
        result = await db.execute(query)
        book = result.scalar_one_or_none()
        if book is None:
            raise HTTPException(status_code=404, detail="Book not found")
        # 获取对应的chapters
        query = select(GeneratedChapter).where(GeneratedChapter.book_id == task.result_id,GeneratedChapter.book_type == TaskTypeEnum.CRAZY_WALK)
        result = await db.execute(query)
        chapters = result.scalars().all()

        # 按照其格式返回一整本书

        return {
            "title":book.title,
            "description":book.description,
            "chapters":chapters
        }



