import os
from typing import Dict, Any, Optional
import httpx
import dotenv


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
            
            # 解析返回的故事内容
            generated_text = result['choices'][0]['message']['content']
            print(f"generated_text: {generated_text}")
            story_parts = self.parse_story(generated_text)
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
    
        

def parse_story(text: str) -> dict:
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
            # 如果行尾是句号，不需要额外添加换行符
            if line.endswith('。'):
                processed_line = line
            else:
                # 替换中间的句号为句号+换行符
                processed_line = line.replace('。', '。\n')
            
            # 检查是否包含不匹配的方括号内容
            if '[' in processed_line and ']' in processed_line:
                # 提取方括号中的内容进行处理
                start_idx = processed_line.find('[')
                end_idx = processed_line.find(']')
                if start_idx < end_idx:  # 确保方括号是正确的顺序
                    bracket_content = processed_line[start_idx:end_idx+1]
                    # 这里可以添加你的方括号内容处理逻辑
                    print(f"Found bracket content: {bracket_content}")
                    
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

    
if __name__ == "__main__":

   

    result = parse_story(text="""
    标题：浮动的字母\n\n角色：\n- 姓名：林远\n  背景：职业探险家，专注于探索神秘遗迹和未知领域\n  性格：冷静、好奇心强、独立\n  年龄：32\n  备 注：对历史文献和古迹有浓厚兴趣，擅长解读古文和图案，随身携带一本笔记本和一把多功能工具 刀。\n\n- 姓名：沈黎\n  背景：文献修复师，被雇佣协助林远的探索\n  性格：细心、敏锐、偶 尔有些固执\n  年龄：29\n  备注：对古籍有极高的敏感度，精通多种语言和古文字，随身携带修 复工具和放大镜。\n\n内容：\n林远轻轻推开那扇摇摇欲坠的木门，厚重的灰尘像一层薄雾弥漫在 空气中，阳光透过破碎的窗户洒在地面上，勾勒出一条条细碎的光柱。地板因岁月的侵蚀而嘎吱作 响，四周的书架上堆满了腐朽的书籍，许多已经破损不堪，散发出淡淡的霉味。\n\n沈黎紧随其后 ，手里拿着一盏便携式灯。她抬头环顾四周，眼中既有敬畏又有疑虑，"这里保存得比我想象中要差，但也许还能找到一些有价值的东西。""\n\n林远不置可否，只是点了点头。他径直走向一张布满灰尘的长桌，桌上赫然摆放着一本厚重的古书。书的封面已经斑驳不堪，但隐约还能看见一些奇异的 符号。他伸出手，用手套轻轻拂去灰尘。沈黎在一旁屏息凝视，似乎生怕他一个不小心就会破坏这 件珍贵的文物。\n\n当林远将书翻开时，奇迹发生了。书页上的字母开始微微发光，随即悬浮在空 中，像是脱离了纸张的束缚。那些字母在空气中旋转，形成一个复杂的符号阵列，围绕着林远跃动 。\n\n沈黎惊呆了，手中的灯几乎掉落在地。她喃喃道："这……这是怎么回事？这些文字似乎是某种古老的语言，但它们……它们怎么会动？""\n\n林远伸出手，试图触碰那些漂浮的字母，但字母却灵巧地避开了他的指尖。他皱起眉头，低声说道："看起来，这本书不仅仅是一件古籍，它可能是某种机关，或者说……某种钥匙。""\n\n沈黎迅速掏出放大镜，试图仔细观察那些字母的形状和排列，""这些 符号……我好像在某些古代铭文中见过类似的，它们似乎在传递某种信息。""\n\n突然，书页开始翻动，自行停留在一页上。浮动的字母迅速排列成一行句子，它们闪烁着微光，仿佛在等待两人的解读 。 \n\n""你看得懂吗？""林远问道，声音里透着一丝紧张。\n\n沈黎眯起眼睛，仔细辨认着那些古老的文字，""这是一种非常古老的语言，拼凑起来大概是——'通过试炼者，开启真理之门'。""\n\n林远 若有所思地看着她，""真理之门？听起来不像是普通的谜语，更像是一种警告，或者邀请。""\n\n就 在这时，地板下方传来一阵低沉的震动，仿佛回应着书中的字母。两人对视了一眼，意识到这次的 探索可能远比他们预想的复杂和危险。\n\n（故事未完待续……）  """)
    print(result)
    


