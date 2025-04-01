import os
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
import re
from bridge.openai_bridge import OpenAIBridge
from config.prompt import WRITER_PROMPT
from database import BookGeneration,GeneratedChapter, async_session


from bridge.gemini_bridge import GeminiBridge
            
           


           



def split_into_chapters(content: str) -> List[str]:
    """将生成的内容分割成章节"""
    chapters = []
    current_chapter = []
    
    for line in content.split('\n'):
        # 匹配纯数字章节标题
        stripped_line = line.strip()
        try:
            # 尝试将行转换为整数,如果成功则说明是章节标题
            int(stripped_line)
            if current_chapter:
                chapters.append('\n'.join(current_chapter))
                current_chapter = []
        except ValueError:
            pass
        current_chapter.append(line)
        
    if current_chapter:
        chapters.append('\n'.join(current_chapter))
        
    return chapters

async def write_novel_free(api_key: str, base_url: str, user_id: int, options: dict) -> bool:
    """自由写作模式"""
    try:
        async with async_session() as session:
                # 如果不存在处理中的记录，创建新记录
            novel = BookGeneration(
                user_id=user_id,
                title="临时标题",  # 后续更新
                model_id=options["model"],
                status="processing",
                total_chapters=10,
                progress=0
            )
            novel_type = options["novel_type"]
            novel_category = options["novel_category"]
            novel_theme = options["novel_theme"]

            
            novel.prompt = f"我想要写一篇类型为{novel_type}的小说，这其中要融入这些元素：{novel_category}，并且，我想要加入一个剧情凝结核：{novel_theme}。请先写5章，等我的指令再继续写剩下的5章。"
            
            session.add(novel)
            await session.commit()
            await session.refresh(novel)

            
            # 更新进度
            novel.progress = 20
            print("当前进度："+str(novel.progress)+"%")
            await session.commit()         
            # 获取随机种子和提示词
            novel.progress = 40
            print("当前进度："+str(novel.progress)+"%")
            await session.commit()
            # 生成内容
            # first_prompt = f"\n请你启动你的角色身份，并根据每一个条目，还有伦理相关的热点新闻，台词，心理活动，以及第三方视角的讲述互相交织，并形成一个极端情绪的故事。在剧情创作中，请加入这些元素："+options["seed_content"]
            
            bridge = None
            # print(options)
            if(options["provider_name"] == "OpenAI"):
                bridge = OpenAIBridge()
            # elif(options["provider_name"] == "Claude"):
            #     bridge = bridge.claude_bridge.claude_bridge
            elif(options["provider_name"] == "Gemini"):
                bridge = GeminiBridge()
            bridge.init({
                "api_key": api_key,
                "base_url": base_url
            })
            
            messages = []
            if(options["provider_name"]=="OpenAI"):
                messages=[{"role": "system", "content": options["system_prompt"]},{"role": "user", "content": novel.prompt}]
            elif(options["provider_name"]=="Gemini"):
                messages=[{"role": "assistant", "content": options["system_prompt"]},{"role": "user", "content": novel.prompt}]

            response = await bridge.chat(
                messages=messages,
                options={
                    "model": options["model"],
                    "stream": False
                }
            )
            
            # 解析返回的内容，提取标题和章节
            generated_content_1 = response["choices"][0]["message"]["content"]

            novel.progress = 50
            print("当前进度："+str(novel.progress)+"%")
            await session.commit()

            response_2 = await bridge.chat(
                messages=[{"role": "system", "content": options["system_prompt"] if "system_prompt" in options else WRITER_PROMPT},{"role": "user","content" :novel.prompt},{"role":"assistant","content":generated_content_1},{"role":"user","content":"请先仔细读读前半部分，然后继续写后半部分，确保前后逻辑一致、连贯"}],
                options={
                    "model": options["model"],
                    "stream": False
                }
            )

            novel.progress = 80
            await session.commit()

            generated_content_2 = response_2["choices"][0]["message"]["content"]
            generated_content = generated_content_1 + generated_content_2

            print(generated_content)

            title = extract_title(generated_content)
            chapters = split_into_chapters(generated_content)

            print(chapters)
            
            # 更新小说标题和进度
            novel.title = title if title else "未命名小说"
            novel.completed_chapters = len(chapters)
            novel.progress = 50  # 完成前半部分
            
            # 保存章节
            for i, chapter_content in enumerate(chapters, 1):
                if i == 1:
                    chapter = GeneratedChapter(
                        book_id=novel.id,
                        chapter_number=0,
                        title=f"导语",
                        content=chapter_content
                    )
                else:
                    chapter = GeneratedChapter(
                        book_id=novel.id,
                        chapter_number=i-1,
                        title=f"第{i-1}章",
                        content=chapter_content
                    )
                session.add(chapter)
            
            novel.progress = 100
            novel.status = "completed"
            await session.commit()
            
            return True, {"novel_id": novel.id, "title": novel.title}

    except Exception as e:
        print(f"写作小说时发生错误: {str(e)}")
        # 更新错误状态
        if 'novel' in locals():
            async with async_session() as session:
                novel.status = "failed"
                novel.error_message = str(e)
                await session.commit()
        return False, None


# def read_file_with_encoding(file_path: str) -> str:
#     """尝试使用不同的编码读取文件"""
#     encodings = ['utf-8', 'gbk', 'gb2312', 'gb18030', 'big5']
    
#     for encoding in encodings:
#         try:
#             with open(file_path, 'r', encoding=encoding) as f:
#                 return f.read()
#         except UnicodeDecodeError:
#             continue
    
#     raise UnicodeDecodeError(f"无法使用已知编码格式读取文件: {file_path}")

def extract_title(content: str) -> str:
    """从内容中提取《》包裹的标题"""
    pattern = r'《(.*?)》'
    matches = re.findall(pattern, content)
    if matches:
        return matches[0]  # 返回第一个匹配的标题
    return None

# def process_single_novel(filename: str):
#     """处理单个小说文件"""
#     try:
#         # 读取原始内
#         # 先用临时文件名保存

#         # 生成小说前半部分
#         success_part1, chat_util = write_novel_part1(content)
#         if not success_part1 or chat_util is None:
#             print(f"生成小说前半部分失败: {filename}")
#             return
            
#         print(f"成功生成小说前半部分: {filename}")
        
#         # 生成小说后半部分
#         if write_novel_part2(temp_output_path):
#             print(f"成功生成完整小说: {filename}")
            
#             # 读取生成的内容
#             generated_content = read_file_with_encoding(temp_output_path)
            
#             # 提取标题并重命名
#             title = extract_title(generated_content)
#             if title:
#                 new_filename = f"{title}.txt"
#                 new_output_path = os.path.join(output_dir, new_filename)
                
#                 # 如果存在同名文件，添加数字后缀
#                 counter = 1
#                 while os.path.exists(new_output_path):
#                     new_filename = f"{title}_{counter}.txt"
#                     new_output_path = os.path.join(output_dir, new_filename)
#                     counter += 1
                
#                 os.rename(temp_output_path, new_output_path)
#                 print(f"文件已重命名为: {new_filename}")
#             else:
#                 print(f"未找到标题，保持原文件名: {filename}")
#         else:
#             print(f"生成小说后半部分失败: {filename}")
                
#     except Exception as e:
#         print(f"处理文件 {filename} 时发生错误: {str(e)}")

def process_novels_parallel(novel_edit_path: str, novel_output_path: str):
    """并行处理所有小说文件"""
    # 确保输出目录存在
    Path(novel_output_path).mkdir(parents=True, exist_ok=True)
    
    # 获取所有小说文件
    novel_files = [f for f in os.listdir(novel_edit_path) if f.endswith('.txt')]
    print("开始写小说。。。")
    # 使用线程池并行处理文件
    with ThreadPoolExecutor(max_workers=int(os.getenv("WRITER_THREAD_NUM"))) as executor:
        futures = []
        for novel_file in novel_files:
            print(f"[写手] 开始写这本: {novel_file}")
            input_path = os.path.join(novel_edit_path, novel_file)
            futures.append(
                executor.submit(
                    write_novel_free,
                    input_path,
                    novel_output_path,
                    novel_file
                )
            )
    
        # 等待所有任务完成
        for future in as_completed(futures):
            try:
                future.result()
            except Exception as e:
                print(f"处理任务时发生错误: {str(e)}") 

def write_novels_free_parallel(output_dir: str, num_novels: int = 3):
    """并行执行多个自由写作任务
    
    Args:
        output_dir: 输出目录
        num_novels: 要同时写作的小说数量
    """
    print(f"\n[写作器] 开始并行写作 {num_novels} 本小说...")
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    def write_single_novel(novel_index: int):
        try:
            print(f"[写作器-{novel_index}] 开始写作...")
            # 为每个任务创建独立的输出子目录
            task_dir = os.path.join(output_dir, f"task_{novel_index}")
            Path(task_dir).mkdir(parents=True, exist_ok=True)
            
            success = write_novel_free(task_dir)
            if success:
                # 如果写作成功，将文件移动到主输出目录
                for file in os.listdir(task_dir):
                    if file.endswith('.txt'):
                        src_path = os.path.join(task_dir, file)
                        dst_path = os.path.join(output_dir, file)
                        
                        # 处理文件名冲突
                        counter = 1
                        while os.path.exists(dst_path):
                            name, ext = os.path.splitext(file)
                            dst_path = os.path.join(output_dir, f"{name}_{counter}{ext}")
                            counter += 1
                            
                        os.rename(src_path, dst_path)
                # 删除临时目录
                os.rmdir(task_dir)
                print(f"[写作器-{novel_index}] 写作完成并移动到主目录")
            else:
                print(f"[写作器-{novel_index}] 写作失败")
                
        except Exception as e:
            print(f"[写作器-{novel_index}] 发生错误: {str(e)}")
    
    # 使用线程池并行执行写作任务
    with ThreadPoolExecutor(max_workers=int(os.getenv("WRITER_THREAD_NUM", num_novels))) as executor:
        futures = []
        for i in range(num_novels):
            futures.append(executor.submit(write_single_novel, i))
        
        # 等待所有任务完成
        for future in as_completed(futures):
            try:
                future.result()
            except Exception as e:
                print(f"[写作器] 任务执行出错: {str(e)}")
    
    print("[写作器] 所有并行写作任务已完成") 