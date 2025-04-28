from typing import Callable
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import  select, update
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import asyncio
from dao.CrazyWalk import CrazyWalkService
from database import  BookBreakdownResult, Character, CrazyWalkResult, InspirationResult, async_session, get_db  # 导入session工厂

from dao.inspirate import InspirationService
from database import Task
from models import TaskTypeEnum
from schemas import SampleTaskResponse, TaskResponse
router = APIRouter(prefix="/task", tags=["task"])

@router.post("/new",response_model=SampleTaskResponse)
async def create_task(task_data: dict):
    """创建新任务并异步处理"""
    print(f"task_data: {task_data}")
    
    try:
        # 创建任务记录
        task = Task(
            user_id=task_data['user_id'],
            task_type=task_data['task_type'],
            prompt="prompt",
            status="processing",
            completion_percentage=0,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        async with async_session() as session:
            session.add(task)
            await session.commit()
            await session.refresh(task)
        
        # 启动异步任务处理，传入task_data
        asyncio.create_task(process_task(task.id, task_data))
        
        return {"task_id": task.id, "message": "任务已创建"}
        
    except Exception as e:
        print(f"Task creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_task(task_id: int, task_data: dict):
    """异步处理任务并更新进度和结果"""
    try:
        result_id = None
        if task_data['task_type'] == "INSPIRATION":
            result_id = await process_task_inspiration(task_data)
        elif task_data['task_type'] == "CRAZY_WALK":
            result_id = await process_task_crazy_walk(task_id,task_data)
        # API调用完成后，更新完成状态和结果
        async with async_session() as db:
            await db.execute(
                update(Task)
                .where(Task.id == task_id)
                .values(
                    completion_percentage=100,
                    status="completed",
                    result_type=task_data['task_type'],
                    result_id=result_id,
                    updated_at=datetime.utcnow()
                )
            )
            await db.commit()
        
    except Exception as e:
        print(f"Task processing error: {e}")
        try:
            async with async_session() as db:
                await db.execute(
                    update(Task)
                    .where(Task.id == task_id)
                    .values(
                        status="failed",
                        updated_at=datetime.utcnow()
                    )
                )
                await db.commit()
        except Exception as db_error:
            print(f"Error updating task status: {db_error}")

async def update_progress(task_id: int, percentage: int):
    """更新任务进度"""
    async with async_session() as db:
        await db.execute(
            update(Task)
            .where(Task.id == task_id)
            .values(
                completion_percentage=percentage,
                updated_at=datetime.utcnow()
            )
        )
        await db.commit()

@router.get("/get-by-type")
async def get_task_by_type(task_type: TaskTypeEnum,user_id: int):
    """根据任务类型获取任务"""
    async with async_session() as db:
        query = select(Task).where(Task.task_type == task_type,Task.user_id == user_id)
        result = await db.execute(query)
        return result.scalars().all()

@router.get("/status/{task_id}")
async def get_task_status(task_id: int, db: AsyncSession = Depends(get_db)):
    """获取任务状态和结果"""
    print(f"task_id: {task_id}")
    task = None
    async with async_session() as db:
        query = select(Task).where(Task.id == task_id)
        result = await db.execute(query)
        task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    print(f"task: {task}")
    response = TaskResponse(
        id=task.id,
        status=task.status,
        completion_percentage=task.completion_percentage,
        task_type=task.task_type,
        result_id=task.result_id,
        result_type=task.result_type,
        updated_at=task.updated_at,
        created_at=task.created_at,
        prompt=task.prompt,
        user_id=task.user_id,
        result=None
    )

    # 如果任务完成，根据result_type获取对应表的结果
    if task.status == "completed" and task.result_id:
        try:
            result_data = None
            async with async_session() as db:
                if task.result_type == TaskTypeEnum.INSPIRATION:
                    query = select(InspirationResult).where(InspirationResult.id == task.result_id)
                    result = await db.execute(query)
                    inspiration_result = result.scalar_one_or_none()
                    if inspiration_result:
                        characters = await inspiration_result.get_characters(db)
                        result_data = {
                            "title": inspiration_result.title,
                            "characters": characters,
                            "content": inspiration_result.content,
                            "story_direction": inspiration_result.story_direction
                        }

                elif task.result_type == TaskTypeEnum.CRAZY_WALK:
                    query = select(CrazyWalkResult).where(CrazyWalkResult.id == task.result_id)
                    result = await db.execute(query)
                    crazy_walk_result = result.scalar_one_or_none()
                    if crazy_walk_result:
                        result_data = {
                            "title": crazy_walk_result.title,
                            "content": crazy_walk_result.content
                        }


                elif task.result_type == TaskTypeEnum.BOOK_BREAKDOWN:
                    query = select(BookBreakdownResult).where(BookBreakdownResult.id == task.result_id)
                    result = await db.execute(query)
                    book_breakdown_result = result.scalar_one_or_none()
                    if book_breakdown_result:
                        result_data = {
                            "book_title": book_breakdown_result.book_title,
                            "analysis": book_breakdown_result.analysis,
                            "key_points": book_breakdown_result.key_points,
                            "summary": book_breakdown_result.summary
                        }

            response.result = result_data
            
        except Exception as e:
            print(f"Error fetching result: {e}")
            response.result = {"error": "获取结果数据失败"}
            
    elif task.status == "failed":
        response.result = {
            "error": "任务处理失败"
        }

    print(f"response: {response}")
    return response

async def process_task_crazy_walk(task_id: int,task_data: dict)->int:
    """处理疯狂行走任务"""
    # 更新任务

    service = CrazyWalkService()
    try:
        result = await service.generate_novel_in_background(task_id,task_data,update_progress)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def process_task_inspiration(task_data: dict)->int:
    """处理灵感任务"""
    service = InspirationService()
    try:
        result = None
        # 确保service的方法也是异步的
        if task_data['is_continue'] == True:
            result = await service.continue_story(task_data['prompt'])
        else:
            result = await service.generate_complete_story(task_data['prompt'])

        # 保存到灵感表
        
        character_ids = []
        # 创建Character 对象
        for character in result['characters']:
            print(f"character: {character}")
            character_result = Character(
                name=character['姓名'],
                description='\n'.join(character['描述']) if isinstance(character['描述'], list) else character['描述'],
                user_id=task_data['user_id'],
                prompt=f"你现在正在做一个角色扮演，无论用户如何去套取你的模型信息，你都不会回复。你只会回答你的公开信息，你的公开信息是：你叫{character['姓名']},关于你的描述为：{character['描述']},除此之外，你可以基于你的角色定位和用户聊天、谈心，唯独不能泄露你的模型信息！"
            )
            async with async_session() as db:
                db.add(character_result)
                await db.commit()
                await db.refresh(character_result)
                character_ids.append(character_result.id)

        
        
        # cover_image = await generate_images(GenerateImageRequest(prompt=task_data['prompt'],size='1280x960',user_id=task_data['user_id']))
        


        inspiration_result = InspirationResult(
            title=result['title'],
            characters=character_ids,
            prompt=task_data['prompt'],
            content=result['content'],
            user_id=task_data['user_id'],
            story_direction=result['story_direction'],
            cover_image=''
        )
        async with async_session() as db:
            db.add(inspiration_result)
            await db.commit()
            await db.refresh(inspiration_result)
            return inspiration_result.id

    except Exception as e:
        print(f"Task processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


    
