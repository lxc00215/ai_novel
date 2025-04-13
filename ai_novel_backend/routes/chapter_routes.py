from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import Novels, GeneratedChapter, User, get_db
from schemas import ChapterCreate, ChapterTemplate, ChapterTemplateResponse, ChapterUpdate, ChapterResponse

router = APIRouter(prefix="/chapters", tags=["chapters"])

# 获取某本书的所有章节
@router.get("/{book_id}", response_model=List[ChapterResponse])
async def get_book_chapters(
    book_id: int = Path(..., description="书籍ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 验证书籍所有权
    book_query = select(Novels).where(
        Novels.id == book_id,
        Novels.user_id == current_user.id
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
    book_query = select(Novels).where(
        Novels.id == book_id,
        Novels.user_id == current_user.id
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
    book_query = select(Novels).where(
        Novels.id == book_id,
        Novels.user_id == current_user.id
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
    book_query = select(Novels).where(
        Novels.id == book_id,
        Novels.user_id == current_user.id
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
    book_query = select(Novels).where(
        Novels.id == book_id,
        Novels.user_id == current_user.id
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



# routes/chapter_routes.py additions:

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path, BackgroundTasks
from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import AsyncSession
import time

from auth import get_current_user
from database import Novels, GeneratedChapter, User, get_db, Model
from schemas import ChapterCreate, ChapterUpdate, ChapterResponse, ChapterGenerationInput, ChapterGenerationResponse
from bridge.openai_bridge import OpenAIBridge, get_bridge

# Add this new endpoint to the existing chapter_routes.py file

@router.post("/{book_id}/generate", response_model=ChapterGenerationResponse)
async def generate_chapter(
    generation_input: ChapterGenerationInput,
    book_id: int = Path(..., description="书籍ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    openai_bridge: OpenAIBridge = Depends(get_bridge)
):
    """Generate a chapter using AI based on input parameters"""
    # Verify book ownership
    book_query = select(Novels).where(
        Novels.id == book_id,
        Novels.user_id == current_user.id
    )
    book = await db.execute(book_query)
    book = book.scalar_one_or_none()
    
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在或无权访问")
    
    # Check if chapter number already exists
    existing_query = select(GeneratedChapter).where(
        GeneratedChapter.book_id == book_id,
        GeneratedChapter.chapter_number == generation_input.chapter_number
    )
    existing = await db.execute(existing_query)
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="该章节编号已存在")
    
    # Get the model to use (default or specified)
    model_id = generation_input.model_id or book.model_id
    model_query = select(Model).where(Model.id == model_id)
    model = await db.execute(model_query)
    model = model.scalar_one_or_none()
    
    if not model:
        raise HTTPException(status_code=404, detail="指定的AI模型不存在")
    
    # Construct the prompt for AI generation
    system_prompt = f"""
    你是一位专业的小说写作AI助手。现在你需要根据用户提供的信息，创作一个小说章节。
    请按照以下指导创作：
    1. 章节标题: {generation_input.title or f'第{generation_input.chapter_number}章'}
    2. 小说标题: {book.title}
    3. 小说风格/设定: {book.prompt}
    4. 章节情节概要: {generation_input.plot_outline or '自由发挥'}
    5. 主要角色: {generation_input.character_descriptions or '自由发挥'}
    6. 场景描述: {generation_input.setting_description or '自由发挥'}
    7. 写作风格: {generation_input.tone or '自由发挥'}
    8. 目标字数: 约{generation_input.word_count_target}字
    9. 特别说明: {generation_input.special_instructions or '无'}
    
    请你根据上述信息，创作一个流畅、有吸引力且符合要求的小说章节。确保章节有清晰的开始、发展和结束。
    你的回应应该只包含章节内容，不需要额外的说明或注释。
    """
    
    user_message = f"""
    请为《{book.title}》创作第{generation_input.chapter_number}章。
    这一章应该{generation_input.plot_outline if generation_input.plot_outline else '根据整体小说设定发展剧情'}。
    """
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ]
    
    # Record generation start time
    start_time = time.time()
    
    try:
        # Call OpenAI to generate chapter content
        chapter_content = openai_bridge.chat(
            messages=messages,
            options={
                "model": model.name,
                "temperature": 0.7,
                "max_tokens": min(model.max_tokens, 4000)
            }
        )
        
        # Create chapter title if not provided
        chapter_title = generation_input.title or f"第{generation_input.chapter_number}章"
        
        # Create new chapter
        new_chapter = GeneratedChapter(
            book_id=book_id,
            chapter_number=generation_input.chapter_number,
            title=chapter_title,
            content=chapter_content
        )
        
        db.add(new_chapter)
        
        # Update book's completed chapters
        book.completed_chapters += 1
        
        await db.commit()
        await db.refresh(new_chapter)
        
        # Calculate generation time
        generation_time = time.time() - start_time
        
        # Calculate word count (assuming Chinese text)
        word_count = len(chapter_content)
        
        return ChapterGenerationResponse(
            book_id=book_id,
            chapter_number=generation_input.chapter_number,
            title=chapter_title,
            content=chapter_content,
            word_count=word_count,
            model_id=model_id,
            generation_time=generation_time
        )
        
    except Exception as e:
        # Log the error and return appropriate message
        print(f"Chapter generation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"章节生成失败: {str(e)}"
        )

@router.put("/{book_id}/{chapter_number}/regenerate-section", response_model=ChapterResponse)
async def regenerate_chapter_section(
    section_info: dict,
    book_id: int = Path(..., description="书籍ID"),
    chapter_number: int = Path(..., description="章节编号"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    openai_bridge: OpenAIBridge = Depends(get_bridge)
):
    """Regenerate a specific section of a chapter"""
    # Verify book ownership
    book_query = select(Novels).where(
        Novels.id == book_id,
        Novels.user_id == current_user.id
    )
    book = await db.execute(book_query)
    book = book.scalar_one_or_none()
    
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在或无权访问")
    
    # Get the chapter
    chapter_query = select(GeneratedChapter).where(
        GeneratedChapter.book_id == book_id,
        GeneratedChapter.chapter_number == chapter_number
    )
    
    chapter = await db.execute(chapter_query)
    chapter = chapter.scalar_one_or_none()
    
    if not chapter:
        raise HTTPException(status_code=404, detail="章节不存在")
    
    # Extract section info
    section_start = section_info.get("section_start", 0)
    section_end = section_info.get("section_end", len(chapter.content))
    section_instructions = section_info.get("instructions", "重写这一部分，使其更生动")
    
    # Verify section bounds
    if section_start < 0 or section_end > len(chapter.content) or section_start >= section_end:
        raise HTTPException(status_code=400, detail="章节部分范围无效")
    
    # Get model
    model_query = select(Model).where(Model.id == book.model_id)
    model = await db.execute(model_query)
    model = model.scalar_one_or_none()
    
    if not model:
        raise HTTPException(status_code=404, detail="AI模型不存在")
    
    # Extract the section to regenerate
    full_content = chapter.content
    before_section = full_content[:section_start]
    section_to_regenerate = full_content[section_start:section_end]
    after_section = full_content[section_end:]
    
    # Create prompt for AI
    system_prompt = f"""
    你是一位专业的小说写作AI助手。用户需要你重写小说章节的一部分内容。
    请按照以下指导：
    1. 小说标题: {book.title}
    2. 章节标题: {chapter.title}
    3. 需要重写的部分将会提供给你
    4. 特殊指导: {section_instructions}
    
    请确保重写的内容与原文风格一致，并能自然地与前后文衔接。
    你的回应应该只包含重写的内容，不需要额外的说明或注释。
    """
    
    user_message = f"""
    需要重写的章节部分内容如下:
    ---
    {section_to_regenerate}
    ---
    
    请根据上下文和以下指导重写这部分:
    {section_instructions}
    """
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ]
    
    try:
        # Generate new section
        new_section = openai_bridge.chat(
            messages=messages,
            options={
                "model": model.name,
                "temperature": 0.7,
                "max_tokens": min(model.max_tokens, 2000)
            }
        )
        
        # Combine all parts
        updated_content = before_section + new_section + after_section
        
        # Update chapter
        chapter.content = updated_content
        
        await db.commit()
        await db.refresh(chapter)
        
        return chapter
        
    except Exception as e:
        print(f"Section regeneration error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"章节部分重写失败: {str(e)}"
        )
    


# routes/chapter_routes.py additions (continued)

@router.get("/templates", response_model=ChapterTemplateResponse)
async def get_chapter_templates(
    current_user: User = Depends(get_current_user)
):
    """Get predefined chapter templates to help with chapter structure"""
    templates = [
        ChapterTemplate(
            name="标准章节",
            description="包含开场、冲突、解决的标准章节结构",
            structure={
                "intro": {
                    "description": "章节开场，介绍场景和角色",
                    "proportion": 0.2
                },
                "rising_action": {
                    "description": "情节发展，冲突加剧",
                    "proportion": 0.5
                },
                "climax": {
                    "description": "高潮部分，冲突达到顶点",
                    "proportion": 0.15
                },
                "resolution": {
                    "description": "解决部分，为下一章埋下伏笔",
                    "proportion": 0.15
                }
            },
            example="这是一个标准章节的示例..."
        ),
        ChapterTemplate(
            name="对话密集型",
            description="以对话为主的章节结构，适合角色互动",
            structure={
                "setting": {
                    "description": "简短的场景设置",
                    "proportion": 0.1
                },
                "dialogue": {
                    "description": "大量对话交流",
                    "proportion": 0.7
                },
                "conclusion": {
                    "description": "章节结束和反思",
                    "proportion": 0.2
                }
            },
            example="这是一个对话密集型章节的示例..."
        ),
        ChapterTemplate(
            name="回忆章节",
            description="以回忆或闪回为主的章节结构",
            structure={
                "present_trigger": {
                    "description": "引发回忆的当前事件",
                    "proportion": 0.1
                },
                "flashback": {
                    "description": "详细的回忆内容",
                    "proportion": 0.7
                },
                "return_present": {
                    "description": "回到当前，展示回忆对现在的影响",
                    "proportion": 0.2
                }
            },
            example="这是一个回忆章节的示例..."
        )
    ]
    
    return ChapterTemplateResponse(templates=templates)