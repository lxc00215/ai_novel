# routes/feature_routes.py
import asyncio
import json
import os
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from database import get_db, Feature
from schemas import FeatureCreate, FeatureUpdate, FeatureResponse

router = APIRouter(prefix="/features", tags=["features"])

# Path to the JSON file where features will be stored
FEATURES_JSON_PATH = "static/data/features.json"

# Ensure directory exists
os.makedirs(os.path.dirname(FEATURES_JSON_PATH), exist_ok=True)

async def sync_features_to_json(db: AsyncSession):
    """Synchronize features from database to JSON file"""
    # Get all features from database
    result = await db.execute(select(Feature))
    features = result.scalars().all()
    
    # Convert to dictionary with feature name as key
    features_dict = {
        feature.name: {
            "id": feature.id,
            "name": feature.name,
            "model": feature.model,
            "prompt": feature.prompt,
            "base_url": feature.base_url,
            "parameters": feature.parameters,
            "is_active": feature.is_active,
            "created_at": feature.created_at.isoformat() if feature.created_at else None,
            "updated_at": feature.updated_at.isoformat() if feature.updated_at else None,
            "api_key": feature.api_key,
            "description": feature.description
        }
        for feature in features
    }
    
    # Write to JSON file
    with open(FEATURES_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(features_dict, f, ensure_ascii=False, indent=2)

@router.get("", response_model=List[FeatureResponse])
async def get_all_features(
    db: AsyncSession = Depends(get_db)
):
    """
    Get all features
    """
    result = await db.execute(select(Feature))
    features = result.scalars().all()
    return features

@router.get("/{feature_id}", response_model=FeatureResponse)
async def get_feature(
    feature_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get feature by ID
    """
    result = await db.execute(select(Feature).where(Feature.id == feature_id))
    feature = result.scalar_one_or_none()
    
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
        
    return feature

@router.post("", response_model=FeatureResponse, status_code=status.HTTP_201_CREATED)
async def create_feature(
    feature_data: FeatureCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new feature
    """
    # Check if feature name already exists
    result = await db.execute(select(Feature).where(Feature.name == feature_data.name))
    existing_feature = result.scalar_one_or_none()
    
    if existing_feature:
        raise HTTPException(
            status_code=400,
            detail=f"Feature with name '{feature_data.name}' already exists"
        )
    
    # Create new feature
    new_feature = Feature(**feature_data.model_dump())
    db.add(new_feature)
    await db.commit()
    await db.refresh(new_feature)
    
    # Sync to JSON
    await sync_features_to_json(db)
    
    return new_feature

@router.put("/{feature_id}", response_model=FeatureResponse)
async def update_feature(
    feature_id: int,
    feature_data: FeatureUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update a feature
    """
    # Get feature by ID
    result = await db.execute(select(Feature).where(Feature.id == feature_id))
    feature = result.scalar_one_or_none()
    
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
    
    # Filter out None values
    update_data = {k: v for k, v in feature_data.model_dump().items() if v is not None}
    
    if not update_data:
        return feature
    
    # If name is being updated, check for duplicates
    if "name" in update_data and update_data["name"] != feature.name:
        name_check = await db.execute(
            select(Feature).where(Feature.name == update_data["name"])
        )
        if name_check.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail=f"Feature with name '{update_data['name']}' already exists"
            )
    
    # Update feature
    await db.execute(
        update(Feature)
        .where(Feature.id == feature_id)
        .values(**update_data)
    )
    await db.commit()
    await db.refresh(feature)
    
    # Sync to JSON
    await sync_features_to_json(db)
    
    return feature

@router.delete("/{feature_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_feature(
    feature_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a feature
    """
    # Check if feature exists
    result = await db.execute(select(Feature).where(Feature.id == feature_id))
    feature = result.scalar_one_or_none()
    
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
    
    # Delete feature
    await db.execute(delete(Feature).where(Feature.id == feature_id))
    await db.commit()
    
    # Sync to JSON
    await sync_features_to_json(db)
    
    return None

# Utility function to load features from JSON
def load_features_from_json() -> Dict[str, Any]:
    """
    Load features from JSON file
    
    Returns:
        Dict mapping feature names to their configurations
    """
    try:
        if os.path.exists(FEATURES_JSON_PATH):
            with open(FEATURES_JSON_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}
    except Exception as e:
        print(f"Error loading features from JSON: {e}")
        return {}

# Function to get feature by name
def get_feature_by_name(name: str) -> Dict[str, Any]:
    """
    Get feature configuration by name
    
    Args:
        name: Feature name
    
    Returns:
        Feature configuration or empty dict if not found
    """
    features = load_features_from_json()
    return features.get(name, {})



    # routes/feature_routes.py (update the sync_features_to_json function)
async def sync_features_to_json(db: AsyncSession):
    """Synchronize features from database to JSON file"""
    # Get all features from database
    result = await db.execute(select(Feature))
    features = result.scalars().all()
    
    # Convert to dictionary with feature name as key
    features_dict = {
        feature.name: {
            "id": feature.id,
            "name": feature.name,
            "model": feature.model,
            "prompt": feature.prompt,
            "base_url": feature.base_url,
            "temperature": feature.temperature,
            "top_k": feature.top_k,
            "top_p": feature.top_p,
            "max_tokens": feature.max_tokens,
            "frequency_penalty": feature.frequency_penalty,
            "presence_penalty": feature.presence_penalty,
            "is_active": feature.is_active,
            "api_key": feature.api_key,
            "description": feature.description,
            "created_at": feature.created_at.isoformat() if feature.created_at else None,
            "updated_at": feature.updated_at.isoformat() if feature.updated_at else None
        }
        for feature in features
    }
    
    # Write to JSON file
    with open(FEATURES_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(features_dict, f, ensure_ascii=False, indent=2)


# 更新一下json文件

@router.post("/update_json", status_code=status.HTTP_204_NO_CONTENT)
async def update_json(
    db: AsyncSession = Depends(get_db)
):
    """
    Update the JSON file
    """
    await sync_features_to_json(db)
    return None


# main

if __name__ == "__main__":
    asyncio.run(update_json())

