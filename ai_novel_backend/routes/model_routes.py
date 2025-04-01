import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List, Optional
from database import get_db, Provider, Model
from schemas import ProviderResponse, ModelResponse
from sqlalchemy.orm import selectinload
router = APIRouter(prefix="/ai", tags=["ai"])

@router.get("/providers", response_model=List[ProviderResponse])
async def get_all_providers(db: AsyncSession = Depends(get_db)):
    """
    获取所有AI服务提供商及其模型信息
    """
    # 使用 selectinload 预加载关系
    query = select(Provider).options(selectinload(Provider.models))
    result = await db.execute(query)
    providers = result.scalars().all()
    return providers

@router.get("/models", response_model=List[ModelResponse])
async def get_all_models(
    provider_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    获取所有模型信息，可选按提供商筛选
    """
    query = select(Model)
    if provider_id:
        query = query.where(Model.provider_id == provider_id)
    result = await db.execute(query)
    models = result.scalars().all()
    return models

@router.get("/providers/{provider_id}", response_model=ModelResponse)
async def get_model_detail(
    provider_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    获取特定模型的详细信息
    """
    result = await db.execute(
        select(Provider).where(Provider.id == provider_id)
    )
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Model not found")
    return provider

@router.post("/providers/{provider_id}/status")
async def update_model_status(
    provider_id: int,
    is_active: bool,
    db: AsyncSession = Depends(get_db)
):
    """
    更新模型状态
    """
    try:
        # 更新模型状态
        query = update(Provider).where(Provider.id == provider_id).values(is_active=is_active)
        await db.execute(query)
        await db.commit()
        
        # 返回更新后的模型信息
        result = await db.execute(select(Provider).where(Provider.id == provider_id))
        provider = result.scalar_one_or_none()
        
        if not provider:
            raise HTTPException(status_code=404, detail="Provider not found")
            
        return {"message": "Provider status updated successfully", "provider": provider}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/active-providers", response_model=List[ProviderResponse])
async def get_active_providers(db: AsyncSession = Depends(get_db)):
    """
    获取所有活跃的AI服务提供商及其模型信息
    """
    # 构建查询：选择 is_active=True 的供应商及其模型
    query = (
        select(Provider)
        .where(Provider.is_active == True)  # 只选择活跃的供应商
        .options(selectinload(Provider.models))  # 预加载模型关系
    )
    
    result = await db.execute(query)
    providers = result.scalars().all()
    return providers

@router.get("/models/active", response_model=List[ModelResponse])
async def get_active_models(
    provider_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    获取活跃供应商的所有模型信息，可选按提供商筛选
    """
    # 基础查询
    query = (
        select(Model)
        .join(Provider)  # 连接 Provider 表
        .where(Provider.is_active == True)  # 只选择活跃供应商的模型
    )
    
    # 如果指定了供应商ID，添加筛选条件
    if provider_id:
        query = query.where(Model.provider_id == provider_id)
    
    result = await db.execute(query)
    models = result.scalars().all()
    return models
