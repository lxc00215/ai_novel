# util/chapter_utils.py

from typing import Dict, List, Optional
import re


class ChapterUtils:

    # 单例模式
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(ChapterUtils, cls).__new__(cls, *args, **kwargs)
        return cls._instance
    
    # 怎么用？
    # chapter_utils = ChapterUtils()

    def extract_chapter_sections(content: str) -> List[Dict]:
        """
    将章节内容分成多个段落部分，方便用户选择特定部分进行编辑或AI生成
    
    Args:
        content: 完整章节内容
        
    Returns:
        List of sections with start and end indices
    """
    # 识别段落分隔（空行）
        paragraphs = re.split(r'\n\s*\n', content)
        
        sections = []
        current_position = 0
        
        for i, paragraph in enumerate(paragraphs):
            # 对于每个段落，创建一个section
            paragraph_length = len(paragraph)
            
            # 如果不是第一个段落，考虑段落间的分隔符长度
            if i > 0:
                # 加上段落分隔符的长度("\n\n")
                current_position += 2
            
            section = {
                "id": i,
                "start": current_position,
                "end": current_position + paragraph_length,
                "content": paragraph,
                "type": "paragraph"
            }
            
            sections.append(section)
            
            # 更新当前位置
            current_position += paragraph_length
        
            return sections

    def analyze_chapter_structure(content: str) -> Dict:
        """
        分析章节结构，识别开场、发展和结尾部分
        
        Args:
            content: 完整章节内容
            
        Returns:
            Dict with structure analysis
        """
        # 识别段落
        paragraphs = re.split(r'\n\s*\n', content)
        total_paragraphs = len(paragraphs)
        
        # 简单地将章节分为三部分：开始，中间和结尾
        intro_size = max(1, total_paragraphs // 5)  # 约20%的段落作为开场
        ending_size = max(1, total_paragraphs // 5)  # 约20%的段落作为结尾
        middle_size = total_paragraphs - intro_size - ending_size
        
        intro = "\n\n".join(paragraphs[:intro_size])
        middle = "\n\n".join(paragraphs[intro_size:intro_size + middle_size])
        ending = "\n\n".join(paragraphs[intro_size + middle_size:])
        
        return {
            "intro": {
                "content": intro,
                "start": 0,
                "end": len(intro),
                "paragraph_count": intro_size
            },
            "middle": {
                "content": middle,
                "start": len(intro) + 2,  # +2 for the newline separator
                "end": len(intro) + 2 + len(middle),
                "paragraph_count": middle_size
            },
            "ending": {
                "content": ending,
                "start": len(intro) + 2 + len(middle) + 2,  # +2 for the newline separator
                "end": len(content),
                "paragraph_count": ending_size
            }
        }

    def generate_chapter_outline(book_prompt: str, chapter_number: int, previous_chapters_summary: Optional[str] = None) -> str:
        """
        生成章节的大纲，基于书籍整体设定和之前的章节
        
        这个函数应该调用AI来生成大纲，但此处只返回示例实现
        实际实现需要调用OpenAI Bridge
        """
        # 这是一个占位实现，实际使用中需要使用AI生成
        return f"这是第{chapter_number}章的大纲，基于'{book_prompt}'设定"

    def parse_story(self,text: str) -> dict:
            """
            解析故事文本，提取标题、角色、内容和剧情走向
            """
            # 处理文本中的 \n 字符串，将其转换为实际的换行符
            text = text.replace('\\n', '\n')
            
            result = {
                "title": "",
                "characters": [],
                "content": "",
                "story_direction": []
            }
            
            current_section = None
            current_character = None
            lines = text.split('\n')
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                if line.startswith('标题：'):
                    current_section = 'title'
                    result['title'] = line[3:].strip()
                    
                elif line.startswith('角色：'):
                    current_section = 'characters'
                    
                elif line.startswith('内容：'):
                    current_section = 'content'
                    print(f"current_section: {current_section}")
                    if current_character:
                        
                        result['characters'].append(current_character)
                        current_character = None
                        
                elif line.startswith('剧情走向') or line.startswith('剧情发展走向'):
                    current_section = 'story_direction'
                    
                elif current_section == 'characters':
                    if line.startswith('-'):
                        if current_character:
                            result['characters'].append(current_character)
                        current_character = {}
                        if '：' in line:
                            name_part = line[line.index('：')+1:].strip()
                            current_character['姓名'] = name_part
                    elif current_character is not None and '：' in line:
                        key, value = line.split('：', 1)
                        key = key.strip()
                        value = value.strip()
                        
                        if '、' in value:
                            value = [v.strip() for v in value.split('、')]
                        elif '，' in value:
                            value = [v.strip() for v in value.split('，')]
                        
                        current_character[key] = value
                        
                elif current_section == 'content':
                        # 替换中间的句号为句号+换行符
                    processed_line = line.replace('。', '。\n')
                    if result['content']:
                        result['content'] += '\n'
                    result['content'] += processed_line
                    
                elif current_section == 'story_direction':
                    if line.startswith('-'):
                        direction = line[1:].strip()
                        if direction:
                            result['story_direction'].append(direction)
            
            # 确保最后一个角色被添加
            if current_character:
                result['characters'].append(current_character)
            
            return result