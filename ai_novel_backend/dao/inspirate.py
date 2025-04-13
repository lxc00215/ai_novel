import os
from typing import Dict, Any, Optional
import httpx
import dotenv

from util.chapter_utils import ChapterUtils


dotenv.load_dotenv()

from bridge.openai_bridge import OpenAIBridge

bridge = OpenAIBridge()

class StoryCharacter:
    """故事角色设定类"""
    def __init__(self, name: str, background: str, age: int, personality: str, memo: Optional[str] = None):
        self.name = name
        self.background = background
        self.age = age
        self.personality = personality
        self.memo = memo

class InspirationService:
    """灵感服务，处理故事生成和续写任务"""
    
    def __init__(self):
        print(f"OPENAI_BASE_URL: {os.getenv('OPENAI_BASE_URL')}")
        print(f"OPENAI_API_KEY: {os.getenv('OPENAI_API_KEY')}")
        bridge.init({
            "base_url": os.getenv("OPENAI_BASE_URL"),
            "api_key": os.getenv("OPENAI_API_KEY")
        })
        self.headers = {"Content-Type": "application/json"}
        self.headers["Authorization"] = f"Bearer {os.getenv('OPENAI_API_KEY')}"
    
    async def generate_complete_story(self,
                                    prompt: str,
                                     ) -> Dict[str, Any]:
        """
        生成完整故事，包含标题、内容和角色设定
        
        Args:
            prompt: 用户提供的提示词
            
        Returns:
            包含生成故事的字典
        """
        
        try:
            # 构建完整故事的提示词
            enhanced_prompt = f"""
            基于用户的创意，创作一个不完整的故事，确保故事必要的场景描写等等，然后我的目标是该故事应当可以无限延伸，请不要一次性写完。
            对于角色的信息，我觉得可以更详细一些。我只是给了一些参考。更多的信息可以加入到备注中，务必通过这些信息使角色更加立体、饱满。
            另外，不要加Markdown格式的字符！我之后还要提取文本，严格按照模板要求来。总字数不超过300字，每行均不低于15字，均以句号结尾。
            另外，故事里面需要插图，你需要帮我筛选出可以配图的场景。故事正常写，但在需要配图的那一行的前面加一个 【插图】,我再详细说一下，一定要以故事为主，不要因为插图而影响故事，插图只是辅助，不要喧宾夺主。且【插图】的位置一定要在某一行的开头，后面跟故事内容，然后换行。方便我后续提取。
            请提供如下格式的回复：
            
            格式要求：
    标题：xxx
    角色：
    - 姓名：张三
      描述：退伍军人，性格沉稳、果断，年龄35....
    - 姓名：李四
      描述：大学生，性格活泼、聪明，年龄20....
    内容：
        XXX

    剧情走向：
    - xxx
    - xxx
    - xxx
            """

            
            # 调用大模型API
            response =  bridge.chat(
                messages=[
                    {"role": "system", "content": enhanced_prompt},
                    {"role": "user", "content": prompt}
                ],

                options={
                    "model": os.getenv("LLM_MODEL"),
                    "max_tokens": 2000,
                    "temperature": 0.7
                }
            )

            print(f"response: {prompt}")

            
            # 解析返回的故事内容
            response = bridge.chat(
                messages=[
                    {"role": "system", "content": enhanced_prompt},
                    {"role": "user", "content": prompt}
                ],
                options={
                    "model": os.getenv("LLM_MODEL"),
                }
            )
            result = response

            print(f"result: {result}")

            chapter_utils = ChapterUtils()
            story_parts = chapter_utils.parse_story(result)
            print(f"story_parts: {story_parts}")
            return story_parts
        except Exception as e:
            raise e
    
    async def continue_story(self, 
                             prompt: str) -> Dict[str, Any]:
        """
        根据提示词续写故事
        
        Args:
            prompt: 用户提供的提示词
            
        Returns:
            包含续写内容的字典
        """
        
        try:
            # 构建续写故事的提示词
            enhanced_prompt = f"""
            基于以下提示词，继续编写故事:
            
            {prompt}
            
            请直接续写故事内容。续写的内容应当自然衔接，保持一致的风格和情节发展。
            """
            
            # 调用大模型API
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    os.getenv("OPENAI_API_URL"),
                    headers=self.headers,
                    json={
                        "model": os.getenv("LLM_MODEL"),
                        "prompt": enhanced_prompt,
                        "max_tokens": 1500,
                        "temperature": 0.7
                    },
                    timeout=60.0
                )
                
                response.raise_for_status()
                result = response.json()
                
                # 获取生成的内容
                generated_text = result.get("choices", [{}])[0].get("text", "").strip()
                
                print(f"generated_text: {generated_text}")
                return generated_text
          
        except Exception as e:
            raise e
    
