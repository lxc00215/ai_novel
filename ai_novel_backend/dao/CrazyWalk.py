from datetime import datetime
import os
from typing import Callable
import asyncio
import json

from sqlalchemy import select, update

from database import CrazyWalkResult, GeneratedChapter, Novels, Task,async_session
from bridge.openai_bridge import OpenAIBridge, openai_bridge
from models import TaskTypeEnum


# 定义不同类型小说的提示词模板
NOVEL_TEMPLATES = {
    "male": {
        "玄幻": "这是一本男频玄幻小说，世界观宏大，主角拥有逆天资质，一路修炼成长，击败各路强敌，最终成为至高存在。",
        "仙侠": "这是一本男频仙侠小说，主角从凡人修炼成仙，经历诸多磨难与奇遇，见证仙魔大战，最终踏入仙道巅峰。",
        "都市": "这是一本男频都市小说，主角白手起家，从一无所有到商业帝国的崛起，同时周旋于各色美女之间，都市生活多姿多彩。",
        "科幻": "这是一本男频科幻小说，设定了未来科技文明与星际探索，主角是一位天才科学家或战士，引领人类征服宇宙。",
        "历史": "这是一本男频历史小说，背景设定在特定历史时期，主角凭借超前智慧与谋略，改变历史走向，成就霸业。"
    },
    "female": {
        "言情": "这是一本女频言情小说，讲述女主与男主相遇相知相爱的过程，感情细腻，情节曲折，最终获得圆满结局。",
        "古言": "这是一本女频古代言情小说，女主穿越或重生到古代，在宫廷或江湖中邂逅男主，经历重重考验最终收获真爱。",
        "现言": "这是一本女频现代言情小说，讲述都市女性与优质男性相识相爱的故事，情感描写细腻，关注女性成长。",
        "玄幻": "这是一本女频玄幻小说，女主拥有特殊能力或血脉，在修真世界中历练成长，遇到各种男性角色，最终找到真爱并变强。",
        "仙侠": "这是一本女频仙侠小说，女主修炼成仙，在仙界中游历，期间遇到性格各异的仙界男子，最终修成正果并收获真情。"
    }
}

bridge = OpenAIBridge()

class CrazyWalkService:
    def __init__(self):
        self.bridge = openai_bridge
        bridge.init({
            "base_url": os.getenv("OPENAI_BASE_URL"),
            "api_key": os.getenv("OPENAI_API_KEY")
        })


    async def generate_novel_in_background(
        self,
        task_id: int,
        task_data: dict,
        update_progress: Callable[[int, int], None],
):
        """后台异步生成小说内容"""
        try:
            # 更新任务状态为处理中
            
            # 1. 生成小说整体规划
            novel_template = NOVEL_TEMPLATES.get(task_data['type'], {}).get(task_data['category'], "")
            if not novel_template:
                novel_template = "这是一本精彩的小说，情节跌宕起伏，人物刻画深刻。"
            outline_prompt = f"""
            你是一位专业的小说策划，需要规划一部完整的{task_data['type']}向{task_data['category']}小说。
            
            小说基本设定：{novel_template}
            
            故事核心概念：{task_data['seeds']}
            
            请完成以下任务：
            1. 为小说创作一个吸引人的标题
            2. 设计主要角色（包括主角、配角、反派等）的姓名与性格特点
            3. 构思小说的世界观背景和核心冲突
            4. 规划小说的总体架构，详细列出{task_data['chapter_count']}章的章节名和每章内容概要（每章概要200-300字）
            """ 
            last_prompt = """
            输出格式：
            {{"title": "小说标题", 
            "characters": [{"name": "角色名", "description": "角色描述"}], 
            "background": "世界观和背景设定", 
            "chapters": [{"title": "第一章 章节名", "summary": "章节概要"}]}}
            
            确保输出是有效的JSON格式，以便于系统自动处理。
            """
            
            outline_response = openai_bridge.chat([
                {"role": "system", "content": "你是一位专业的小说策划，擅长构思和规划小说情节。"},
                {"role": "user", "content": outline_prompt+last_prompt}
            ], {"model": "gemini-2.0-flash-lite-preview-02-05", "temperature": 0.8})

            # 规划完了就是 10% 的进度
            await update_progress(task_id,10)

            print(outline_response)
            print("------------------------------------")
            try:
                # 解析响应中的JSON (处理可能的格式问题)
                outline_data = ""
                json_start = outline_response.find('{')
                json_end = outline_response.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    outline_json_str = outline_response[json_start:json_end]
                    outline_data = json.loads(outline_json_str)
                else:
                    # 尝试更宽松的解析
                    import re
                    json_pattern = r'({.*})'
                    match = re.search(json_pattern, outline_response, re.DOTALL)
                    if match:
                        outline_json_str = match.group(1)
                        outline_data = json.loads(outline_json_str)
                    else:
                        raise ValueError("无法从响应中提取JSON数据")
                    
                # 提取章节规划
                novel_title = outline_data.get("title", "未命名小说")
                chapters_data = outline_data.get("chapters", [])
                background = outline_data.get("background","啥也没有")
                # 创建一本小说
                res_id = 0
                async with async_session() as db:
                    result = CrazyWalkResult(
                        title=novel_title,
                        novel_type=task_data['type'],
                        category=task_data['category'],
                        seeds=task_data['seeds'],
                        chapter_count=task_data['chapter_count'],
                        description=background
                    )
                    db.add(result)
                    await db.commit()
                    res_id = result.id
                # 2. 开始逐章生成内容
                previous_chapter_content = ""
                chapter_ids = []
                for index, chapter in enumerate(chapters_data):
                    chapter_title = chapter.get("title", f"第{index+1}章")
                    chapter_summary = chapter.get("summary", "")
                    
                    # 构建章节生成提示词
                    if index == 0:
                        chapter_prompt = f"""
                        你是一位专业的小说作家，请根据以下信息创作小说章节：
                        
                        小说标题：{novel_title}
                        小说类型：{task_data['type']}向{task_data['category']}
                        章节标题：{chapter_title}
                        章节概要：{chapter_summary}
                        
                        要求：
                        1. 字数不少于1500字
                        2. 文笔流畅，符合{task_data['type']}向{task_data['category']}小说的风格
                        3. 段落适当分隔，对话格式规范
                        4. 情节符合章节概要的要求
                        
                        请直接给出章节内容，不要包含任何额外解释。
                        """
                    else:
                        # 后续章节需要考虑上一章内容
                        chapter_prompt = f"""
                        你是一位专业的小说作家，请根据以下信息创作小说章节：
                        
                        小说标题：{novel_title}
                        小说类型：{task_data['type']}向{task_data['category']}
                        章节标题：{chapter_title}
                        章节概要：{chapter_summary}
                        
                        上一章内容：
                        {previous_chapter_content[:2000]}...（内容省略）
                        
                        要求：
                        1. 字数不少于1500字
                        2. 文笔流畅，符合{task_data['type']}向{task_data['category']}小说的风格
                        3. 段落适当分隔，对话格式规范
                        4. 情节符合章节概要的要求
                        5. 与上一章内容保持连贯性
                        
                        请直接给出章节内容，不要包含任何额外解释。
                        """

                    
                    # 生成章节内容
                    chapter_content = openai_bridge.chat([
                        {"role": "system", "content": f"你是一位专业的{task_data['type']}向{task_data['category']}小说作家，擅长创作引人入胜的情节和塑造生动的人物。"},
                        {"role": "user", "content": chapter_prompt}
                    ], {"model": "gemini-2.0-flash-lite-preview-02-05", "temperature": 0.7, "max_tokens": 3000})
                    # 创建章节
                    chapter = GeneratedChapter(
                        book_id=res_id,
                        order=index+1,
                        title=chapter_title,
                        content=chapter_content,
                        created_at=datetime.now(),
                        updated_at=datetime.now(),
                        book_type=TaskTypeEnum.CRAZY_WALK
                    )

                    async with async_session() as db:
                        db.add(chapter)
                        await db.commit()
                        await db.refresh(chapter)
                        chapter_ids.append(chapter.id)

                    # 更新任务进度
                    await update_progress(task_id,10 + int(90 * (index + 1) / len(chapters_data)))

                    # 更新上一章内容（用于下一章生成）
                    previous_chapter_content = previous_chapter_content+chapter_content
                    
                    # 更新任务进度
                    await update_progress(task_id,10 + int(90 * (index + 1) / len(chapters_data)))
                    
                    # 暂停一下，避免API限流
                    await asyncio.sleep(1)
                print("res_id",res_id)

                return res_id
                

            except Exception as e:
                print(f"Error generating novel: {str(e)}")

        except Exception as e:
            print(f"Error generating novel: {str(e)}")
            raise e
    