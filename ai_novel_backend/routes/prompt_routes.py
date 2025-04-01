from fastapi import APIRouter, HTTPException, Depends
from typing import List
from database import get_db
from schemas import PromptCreate, PromptUpdate, PromptResponse

router = APIRouter(prefix="/prompt", tags=["prompts"])

@router.post("/", response_model=PromptResponse)
async def create_prompt(prompt: PromptCreate, user_id: int, db=Depends(get_db)):
    async with db as cur:
        await cur.execute(
            """
            INSERT INTO prompts (user_id, title, content, category, is_public)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (user_id, prompt.title, prompt.content, prompt.category, prompt.is_public)
        )
        prompt_id = cur.lastrowid
        
        await cur.execute("SELECT * FROM prompts WHERE id = %s", (prompt_id,))
        return await cur.fetchone()

@router.get("/public", response_model=List[PromptResponse])
async def get_public_prompts(db=Depends(get_db)):
    async with db as cur:
        await cur.execute("SELECT * FROM prompts WHERE is_public = TRUE")
        return await cur.fetchall()

@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt(prompt_id: int, db=Depends(get_db)):
    async with db as cur:
        await cur.execute("SELECT * FROM prompts WHERE id = %s", (prompt_id,))
        prompt = await cur.fetchone()
        if not prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")
        return prompt 
    

