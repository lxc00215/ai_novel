from concurrent.futures import ThreadPoolExecutor
import os
import time
from utils.OpenAIUtil import ChatGPTUtil
from seed.get_seed import get_random_seed_contents,get_type_random,get_seed_by_female_type
import re
from dotenv import load_dotenv
from prompt import EXPAND_PROMPT,get_outline_prompt,GET_KEY_CONTENT_PROMPT,GET_GLOBAL_KEY_CONTENT_PROMPT

# 加载环境变量
load_dotenv()

def write_short_story(novel_out_path: str):
    # 初始化 ChatGPT 工具
    chat_util = ChatGPTUtil(model=os.getenv("OUTLINE_MODEL"))
    
    # 获取10章的细纲
    outline = generate_chapter_outlines(chat_util)
    key_file_path = os.path.join(novel_out_path, "key.txt")
    global_key_path = os.path.join(novel_out_path, "global_key.txt")
    
    with open(key_file_path, 'w', encoding='utf-8') as f:
        f.write("")
    with open(global_key_path, 'w', encoding='utf-8') as f:
        f.write("")

    # 保存原始细纲到临时文件
    temp_outline_path = os.path.join(novel_out_path, "outline.txt")
    with open(temp_outline_path, 'w', encoding='utf-8') as f:
        f.write(outline)
    print(f"已保存原始细纲到：{temp_outline_path}")


  
    # 提取细纲
    chapter_outlines = extract_chapter_outlines(outline)
    
    # 创建小说文件并写入初始内容
    temp_novel_path = os.path.join(novel_out_path, "temp_novel.txt")
    with open(temp_novel_path, 'w', encoding='utf-8') as f:
        f.write(outline)
    
    # 逐章扩写并实时更新文件
    expand_chapters_with_realtime_update(temp_novel_path, chapter_outlines,key_file_path,global_key_path)
    
    # 获取小说标题
    title_match = re.search(r'《(.*?)》', outline)
    if title_match:
        title = title_match.group(1)
        # 将临时文件移动到最终位置并重命名
        final_path = os.path.join("novel", f"{title}.txt")
        os.makedirs(os.path.dirname(final_path), exist_ok=True)
        with open(temp_novel_path, 'r', encoding='utf-8') as src, \
             open(final_path, 'w', encoding='utf-8') as dst:
            dst.write(src.read())
        print(f"已完成小说《{title}》的写作，保存于：{final_path}")
    else:
        print("未找到小说标题，保存失败")

def generate_chapter_outlines(chat_util: ChatGPTUtil) -> str:
    a_type = get_type_random("女频")
    a_seed = get_seed_by_female_type(a_type)
    prompt = get_outline_prompt(a_seed)
 
    return chat_util.send_message(prompt)

def extract_chapter_outlines(outline: str) -> list:
    print(outline)
    
    # 获取预期的章节数
    chapter_num = int(os.getenv("CHAPTER_NUM", 10))  # 默认为10章
    
    # 按换行符分割文本
    lines = outline.strip().split('\n')
    
    # 存储每章内容
    chapter_contents = []
    current_chapter = []
    current_num = 1
    
    # 跳过标题和导语
    start_found = False
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # 找到第1章的开始
        if line == '1' and not start_found:
            start_found = True
            continue
            
        # 如果还没找到第1章，继续跳过
        if not start_found:
            continue
            
        # 如果是章节号，保存上一章内容并开始新的一章
        if line == str(current_num + 1) and current_num < chapter_num:
            if current_chapter:
                chapter_contents.append('\n'.join(current_chapter).strip())
                current_chapter = []
                current_num += 1
            continue
            
        # 收集当前章节的内容
        current_chapter.append(line)
    
    # 保存最后一章的内容
    if current_chapter:
        chapter_contents.append('\n'.join(current_chapter).strip())
    
    # 验证章节数量
    if len(chapter_contents) != chapter_num:
        raise ValueError(f"章节数量不正确，应该为{chapter_num}章，当前为{len(chapter_contents)}章")
    
    # 验证每章内容不为空
    for i, content in enumerate(chapter_contents, 1):
        if not content.strip():
            raise ValueError(f"第{i}章内容为空")
    
    return chapter_contents

def extract_key_details(chapter_content: str, chapter_num: int, key_file_path: str, global_key_path: str) -> None:
    """
    提取章节关键细节并追加到key.txt和global_key.txt文件
    """
    chat_util = ChatGPTUtil(base_url="http://39.101.179.14:8001/v1", api_key="sk-keycdc", model="gemini-2.0-flash-exp")
    prompt = GET_KEY_CONTENT_PROMPT.format(chapter_content=chapter_content)
    
    key_details = chat_util.send_message(prompt)
    chapter_key = f"\n第{chapter_num}章关键信息：\n{key_details}\n"
    
    # 追加到key.txt（完整历史）
    with open(key_file_path, 'a', encoding='utf-8') as f:
        f.write(chapter_key)
    
    # 更新global_key.txt（仅保留最近3章）
    update_global_knowledge(global_key_path, chapter_num, chapter_key)
    
    print(f"已提取第{chapter_num}章关键信息")

def update_global_knowledge(global_key_path: str, current_chapter: int, new_content: str) -> None:
    """
    更新全局知识库，只保留当前章节的前2章信息（总共3章）
    """
    # 如果是第1章，直接写入
    if current_chapter == 1:
        with open(global_key_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return
        
    # 读取现有内容
    with open(global_key_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 按章节分割内容
    chapters = content.split('\n第')
    chapters = [c for c in chapters if c.strip()]  # 移除空行
    
    # 如果有"第"开头的章节，加回"第"
    chapters = ['第' + c if not c.startswith('第') else c for c in chapters]
    
    # 只保留最近的2章（加上新章节总共3章）
    start_chapter = max(1, current_chapter - 2)  # 改为减2
    relevant_chapters = []
    
    # 从现有内容中筛选需要保留的章节
    for chapter in chapters:
        chapter_num = int(chapter.split('章')[0].strip('第'))
        if start_chapter <= chapter_num < current_chapter:
            relevant_chapters.append(chapter)
    
    # 添加新章节
    relevant_chapters.append(new_content.strip())
    
    # 写回文件
    with open(global_key_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(relevant_chapters))

def expand_chapters_with_realtime_update(novel_path: str, chapter_outlines: list, key_file_path: str, global_key_path: str) -> None:
    chapter_num = int(os.getenv("CHAPTER_NUM", 10))
    
    for i in range(len(chapter_outlines)):
        print(f"正在扩写第{i+1}章...")
        
        # 读取全局知识库内容（如果存在）
        global_knowledge = ""
        if os.path.exists(global_key_path):
            with open(global_key_path, 'r', encoding='utf-8') as f:
                global_knowledge = f.read().strip()
        
        # 构建提示词，加入全局知识
        prompt = EXPAND_PROMPT.format(
            i=i,
            outline=chapter_outlines[i],
            global_knowledge=global_knowledge if global_knowledge else "暂无历史信息"
        )
        
        chat_util = ChatGPTUtil(model=os.getenv("EXPAND_MODEL"))
        expanded_content = chat_util.send_message(prompt)
        
        # 更新文件内容
        with open(novel_path, 'r', encoding='utf-8') as f:
            current_content = f.read()
        
        if i < chapter_num - 1:
            pattern = fr'{i+1}\n(.*?)\n{i+2}\n'
            replacement = f'{i+1}\n{expanded_content}\n{i+2}\n'
        else:
            pattern = fr'{chapter_num}\n(.*)'
            replacement = f'{chapter_num}\n{expanded_content}'
        
        updated_content = re.sub(pattern, replacement, current_content, flags=re.DOTALL)
        
        with open(novel_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        # 提取关键细节并更新知识库
        extract_key_details(expanded_content, i+1, key_file_path, global_key_path)
        
        print(f"第{i+1}章扩写完成并已更新到文件")

def write_novels_with_threads(novel_out_path: str,book_num: int = 3):
    """
    使用多线程并发写作小说
    
    Args:
        thread_num: 并发线程数，默认为3
    """
    print(f"开始{book_num}线程并发写作小说...")
    
    # 创建线程池
    with ThreadPoolExecutor(max_workers=int(os.getenv("WRITER_THREAD_NUM", 3))) as executor:
        # 为每个线程创建独立的输出目录
        futures = []
        for i in range(book_num):
            # 创建独立的输出目录
            task_dir = os.path.join(novel_out_path, f"task_{i}")
            os.makedirs(task_dir, exist_ok=True)
            
            # 提交任务到线程池
            future = executor.submit(write_short_story, task_dir)
            futures.append(future)
            
            # 添加短暂延迟，避免同时创建太多请求
            time.sleep(1)
        
        # 等待所有任务完成
        for future in futures:
            try:
                future.result()
            except Exception as e:
                print(f"写作任务发生错误: {str(e)}")
    
    print("所有小说写作任务已完成！")


   

