# from typing import Dict, List, Optional
# from pydantic import BaseModel
# from datetime import datetime
# from sqlalchemy.ext.asyncio import AsyncSession
# from database import BookGeneration, NovelChapter, Model
# import re

# class NovelGenerationConfig(BaseModel):
#     """小说生成配置"""
#     chapter_num: int = 10  # 章节数
#     temperature: float = 0.7  # 温度
#     top_k: int = 10  # 取样数
#     max_tokens: int = 8000  # 最大token数
#     novel_type: str = "女频"  # 小说类型
#     model_id: int  # 使用的模型ID

# async def write_short_story(
#     db: AsyncSession,
#     user_id: int,
#     config: NovelGenerationConfig,
#     novel_out_path: Optional[str] = None
# ) -> Dict:
#     """
#     生成短篇小说
    
#     Args:
#         db: 数据库会话
#         user_id: 用户ID
#         config: 小说生成配置
#         novel_out_path: 可选的输出路径
    
#     Returns:
#         Dict: 包含生成结果的字典
#     """
#     try:
#         # 获取模型信息
#         model = await db.get(Model, config.model_id)
#         if not model:
#             return {"success": False, "error": "Model not found"}

#         # 创建生成任务记录
#         novel = BookGeneration(
#             user_id=user_id,
#             title="临时标题",  # 后续会更新
#             prompt=get_outline_prompt(config),
#             model_id=config.model_id,
#             total_chapters=config.chapter_num,
#             status="processing"
#         )
#         db.add(novel)
#         await db.commit()

#         # 获取大纲
#         outline = await generate_chapter_outlines(model, config)
        
#         # 提取标题
#         title = extract_title(outline)
#         if title:
#             novel.title = title
#             await db.commit()

#         # 提取章节大纲
#         chapter_outlines = extract_chapter_outlines(outline, config.chapter_num)
        
#         # 逐章生成内容
#         for i, chapter_outline in enumerate(chapter_outlines, 1):
#             try:
#                 # 生成章节内容
#                 chapter_content = await expand_chapter(
#                     model=model,
#                     outline=chapter_outline,
#                     chapter_num=i,
#                     config=config
#                 )
                
#                 # 保存章节
#                 chapter = NovelChapter(
#                     novel_id=novel.id,
#                     chapter_number=i,
#                     title=f"第{i}章",
#                     content=chapter_content
#                 )
#                 db.add(chapter)
                
#                 # 更新进度
#                 novel.completed_chapters = i
#                 novel.progress = int((i / config.chapter_num) * 100)
#                 await db.commit()
                
#                 # 提取关键信息
#                 await extract_key_details(
#                     db=db,
#                     chapter_content=chapter_content,
#                     chapter_num=i,
#                     novel_id=novel.id
#                 )
                
#             except Exception as e:
#                 novel.error_message = f"Chapter {i} generation failed: {str(e)}"
#                 novel.status = "failed"
#                 await db.commit()
#                 return {"success": False, "error": str(e)}

#         # 完成生成
#         novel.status = "completed"
#         await db.commit()
        
#         return {
#             "success": True,
#             "novel_id": novel.id,
#             "title": novel.title,
#             "chapters": config.chapter_num
#         }

#     except Exception as e:
#         if novel:
#             novel.status = "failed"
#             novel.error_message = str(e)
#             await db.commit()
#         return {"success": False, "error": str(e)}

# async def generate_chapter_outlines(
#         model: Model,
#         config: NovelGenerationConfig,
#         prompt: str
#         ) -> str:
#     """生成章节大纲"""

#     import bridge.openai_bridge

#     bridge = bridge.openai_bridge.OpenAIBridge()
#     bridge.init({
#         "api_key": model.provider.api_key,
#         "base_url": model.provider.base_url
#     })
    
#     # 使用模型生成大纲
#     chat_util = bridge.chat(
#         messages=[{"role": "user", "content": prompt}],
#         options={
#             "model": model.name,
#             "stream": False
#         }
#     )
#     return chat_util

# async def expand_chapter(
#     model: Model,
#     outline: str,
#     chapter_num: int,
#     config: NovelGenerationConfig,
#     global_key: str = ""
# ) -> str:
#     """扩写单个章节"""
#     prompt = EXPAND_PROMPT.format(
#         i=chapter_num-1,
#         outline=outline,
#         global_knowledge=global_key if global_key else "暂无历史信息"
#     )
    
#     import bridge.openai_bridge

#     bridge = bridge.openai_bridge.OpenAIBridge()
#     bridge.init({
#         "api_key": model.provider.api_key,
#         "base_url": model.provider.base_url
#     })
#     chat_util = bridge.chat(
#         messages=[{"role": "user", "content": prompt}],
#     )
#     return await chat_util.send_message(prompt)

# async def extract_key_details(
#     db: AsyncSession,
#     chapter_content: str,
#     chapter_num: int,
#     novel_id: int
# ) -> None:
#     """提取章节关键信息"""
#     # TODO: 实现关键信息提取和保存
#     pass

# def extract_title(outline: str) -> Optional[str]:
#     """从大纲中提取小说标题"""
#     title_match = re.search(r'《(.*?)》', outline)
#     return title_match.group(1) if title_match else None

# def extract_chapter_outlines(outline: str,chapter_num: int) -> list:
#     print(outline)
    
#     # 获取预期的章节数
    
#     # 按换行符分割文本
#     lines = outline.strip().split('\n')
    
#     # 存储每章内容
#     chapter_contents = []
#     current_chapter = []
#     current_num = 1
    
#     # 跳过标题和导语
#     start_found = False
    
#     for line in lines:
#         line = line.strip()
#         if not line:
#             continue
            
#         # 找到第1章的开始
#         if line == '1' and not start_found:
#             start_found = True
#             continue
            
#         # 如果还没找到第1章，继续跳过
#         if not start_found:
#             continue
            
#         # 如果是章节号，保存上一章内容并开始新的一章
#         if line == str(current_num + 1) and current_num < chapter_num:
#             if current_chapter:
#                 chapter_contents.append('\n'.join(current_chapter).strip())
#                 current_chapter = []
#                 current_num += 1
#             continue
            
#         # 收集当前章节的内容
#         current_chapter.append(line)
    
#     # 保存最后一章的内容
#     if current_chapter:
#         chapter_contents.append('\n'.join(current_chapter).strip())
    
#     # 验证章节数量
#     if len(chapter_contents) != chapter_num:
#         raise ValueError(f"章节数量不正确，应该为{chapter_num}章，当前为{len(chapter_contents)}章")
    
#     # 验证每章内容不为空
#     for i, content in enumerate(chapter_contents, 1):
#         if not content.strip():
#             raise ValueError(f"第{i}章内容为空")
    
#     return chapter_contents
