# 获取用户的所有拆书记录
from asyncio.log import logger
import traceback
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from auth import get_current_user
from database import BookBreakdown, File as FileModel, User, get_db, AsyncSession
from schemas import BookBreakdownResponse

router = APIRouter(prefix="/analysis", tags=["analysis"])
@router.get("/get-analysis-history", response_model=List[BookBreakdownResponse])
async def get_user_book_breakdowns(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取用户的所有拆书记录
    
    Args:
        user_id: 用户ID（可选）
        db: 数据库会话
    """
    try:
        # 构建查询，使用 selectinload 预加载关联的 file
        query = select(BookBreakdown).options(selectinload(BookBreakdown.file))
        
        # 如果提供了用户ID，则筛选该用户的拆书记录
        if current_user.id:
            query = query.join(FileModel).where(FileModel.user_id == current_user.id)
            
        # 执行查询，使用 await
        result = await db.execute(query)
        breakdowns = result.scalars().all()

        if not breakdowns:
            return []  # 返回空列表而不是抛出404错误
        
        # 将结果转换为响应模型
        response_items = []
        for breakdown in breakdowns:
            response_item = BookBreakdownResponse(
                id=breakdown.id,
                file_id=breakdown.file_id,
                title=breakdown.title,
                analysis_content=breakdown.analysis_content,
                analysis_type=breakdown.analysis_type,
                created_at=breakdown.created_at,
                updated_at=breakdown.updated_at
            )
            response_items.append(response_item)
            
        return response_items
        
    except Exception as e:
        logger.error(f"获取拆书记录错误: {str(e)}")
        logger.error(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"获取拆书记录失败: {str(e)}")


# 获取拆书详情
@router.get("/{breakdown_id}", response_model=BookBreakdownResponse)
async def get_book_breakdown(
    breakdown_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    获取拆书详情
    
    Args:
        breakdown_id: 拆书记录ID
        db: 数据库会话
    """

    try:
        # 使用 selectinload 预加载文件信息
        query = select(BookBreakdown).options(
            selectinload(BookBreakdown.file)
        ).where(BookBreakdown.id == breakdown_id)
        
        # 执行查询
        result = await db.execute(query)
        breakdown = result.scalar_one_or_none()
        
        if not breakdown:
            raise HTTPException(status_code=404, detail="拆书记录未找到")
        
        # 手动构建响应对象，避免自动尝试加载关系
        return BookBreakdownResponse(
            id=breakdown.id,
            file_id=breakdown.file_id,
            title=breakdown.title,
            analysis_content=breakdown.analysis_content,
            analysis_type=breakdown.analysis_type,
            created_at=breakdown.created_at,
            updated_at=breakdown.updated_at
        )
        
    except Exception as e:
        logger.error(f"获取拆书详情错误: {str(e)}")
        logger.error(f"错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"获取拆书详情失败: {str(e)}")