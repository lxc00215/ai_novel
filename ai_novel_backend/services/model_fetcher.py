import asyncio
from fastapi import Depends, HTTPException
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select,delete
from app import routes
from database import Model, Provider,async_session
from database import get_db
import json
import requests
from typing import Dict, List
from bridge import gemini_bridge

async def fetch_openai_models(db: AsyncSession, provider: Provider, api_key: str) -> Dict:
    """
    获取 OpenAI 模型列表并保存到数据库
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.openai.com/v1/models",
                headers={"Authorization": f"Bearer {api_key}"}
            )
            print(response.json())
            if response.status_code == 200:
                models_data = response.json()["data"]
                
                # 过滤并整理模型数据
                for model_data in models_data:
                    model = Model(
                        id=model_data["id"],
                        provider_id=provider.id,
                        name=model_data["id"],
                        label="LLM" if "gpt" in model_data["id"] else "TEXT EMBEDDING" if "text-embedding" in model_data["id"] else "TEXT2SPEECH" if "text2speech" in model_data["id"] else "SPEECH2TEXT" if "speech2text" in model_data["id"] else "RERANK" if "rerank" in model_data["id"] else "LLM",
                        top_k=10,
                        temperature=0.7,
                        max_tokens=8192 if "gpt-4" in model_data["id"] else 4096
                    )
                    db.add(model)
                
                await db.commit()
                return {"success": True, "message": "OpenAI models updated successfully"}
            else:
                return {
                    "success": False, 
                    "error": f"Failed to fetch OpenAI models: {response.status_code}"
                }
                
    except Exception as e:
        return {"success": False, "error": f"Error fetching OpenAI models: {str(e)}"}

async def fetch_anthropic_models(db: AsyncSession, provider: Provider, api_key: str) -> Dict:
    """
    获取 Anthropic 模型列表并保存到数据库
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{provider.base_url}/models",
                headers={"x-api-key": api_key}
            )
            
            if response.status_code == 200:
                models_data = response.json()["models"]
                print(response.json())
                for model_data in models_data:
                    model = Model(
                        id=model_data["id"],
                        provider_id=provider.id,
                        name=model_data["name"],
                        label="LLM",
                        top_k=10,
                        temperature=0.7,
                        max_tokens=model_data.get("max_tokens", 100000)
                    )
                    db.add(model)
                
                await db.commit()
                return {"success": True, "message": "Anthropic models updated successfully"}
            else:
                return {
                    "success": False, 
                    "error": f"Failed to fetch Anthropic models: {response.status_code}"
                }
                
    except Exception as e:
        return {"success": False, "error": f"Error fetching Anthropic models: {str(e)}"}

async def fetch_google_models(db: AsyncSession, provider: Provider,api_key:str):
    """
    获取 Google AI 模型列表
    API: https://generativelanguage.googleapis.com/v1/models
    Method: GET
    """
    bridge = gemini_bridge.GeminiBridge()
    bridge.init({
        "api_key": api_key,
        "base_url": "https://generativelanguage.googleapis.com"
    })

    response =  bridge.list_models();
    
    models = response["data"]
    for model in models:
        model = Model(
            id=model["id"],
            provider_id=provider.id,
            name=model["name"],
            label="LLM",
            description=model["description"],
            input_token_limit=model["inputTokenLimit"],
            output_token_limit=model["outputTokenLimit"],
            max_tokens=404,
        )
        db.add(model)
    await db.commit()
    return {"message": "Google models fetched successfully"}

async def fetch_deepseek_models(db: AsyncSession, provider: Provider, api_key: str) -> Dict:
    

    url = "https://api.deepseek.com/models"

    print(api_key)

    payload={}
    headers = {
    'Accept': 'application/json',
    'Authorization': 'Bearer ' + api_key
    }

    response = requests.request("GET", url, headers=headers, data=payload)
    print(response.text)
    models = response.json()["data"]
    for model in models:
        model = Model(
            id=model["id"],
            provider_id=provider.id,
            name=model["id"],
            label="LLM"

        )
        db.add(model)
    await db.commit()
    return {"message": "DeepSeek models fetched successfully"}


async def fetch_all_provider_models(db: AsyncSession, api_keys: Dict[str, str]) -> List[Dict]:
    """
    获取所有供应商的模型列表
    
    api_keys 格式:
    {
        "OpenAI": "sk-...",
        "Anthropic": "sk-ant-...",
        ...
    }
    """
    results = []
    
    # 获取所有供应商
    result = await db.execute(select(Provider))
    providers = result.scalars().all()
    
    # 为每个供应商获取模型
    for provider in providers:
        api_key = api_keys.get(provider.com_name)
        if not api_key:
            results.append({
                "provider": provider.com_name,
                "success": False,
                "error": "API key not provided"
            })
            continue
            
        # 根据供应商选择对应的获取方法
        fetch_functions = {
            "OpenAI": fetch_openai_models,
            "Claude": fetch_anthropic_models,
            "Gemini": fetch_google_models,
            "DeepSeek": fetch_deepseek_models,
            # 可以添加其他供应商的获取方法
        }
        
        fetch_func = fetch_functions.get(provider.com_name)
        if not fetch_func:
            results.append({
                "provider": provider.com_name,
                "success": False,
                "error": "Fetch method not implemented"
            })
            continue
            
        result = await fetch_func(db, provider, api_key)
        results.append({
            "provider": provider.com_name,
            **result
        })
    
    return results



if __name__ == "__main__":
    api_keys = {
        # "OpenAI": "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",
        # "Gemini": "AIzaSyBH0aIjNw_MtnjnkiYoR5OkI-LEc4im5FI",
        "DeepSeek": "sk-94f7f2366c574e538fefd7cc51066a3e",
        # "Claude": "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",
        # "Kimi": "sk-AXcP2hI7SfhfLZ7fBuLTQNV4J6t0qu0foTdJF1S1AthTPk5m",

        # 添加其他供应商的 API key
    }

    # 清空数据库
    
    async def test_fetch_models():
        async with async_session() as db:
            await db.execute(delete(Model))
            await db.commit()
            results = await fetch_all_provider_models(db, api_keys)
            print(json.dumps(results, indent=2))
    asyncio.run(test_fetch_models())
