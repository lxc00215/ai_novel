import os
from pathlib import Path
from typing import List
from concurrent.futures import ThreadPoolExecutor, as_completed
from utils.OpenAIUtil import ChatGPTUtil
import re
import time
from prompt import WRITER_PROMPT,WRITER_PROMPT_with_detail
from dotenv import load_dotenv
from seed.get_seed import get_random_seed_contents,get_seed_by_female_type,get_seed_by_male_type,get_type_random


load_dotenv()
WRITER_MODEL = os.getenv("WRITER_MODEL")

def write_novel_part1(content: str, output_path: str) -> bool:
    """写小说前半部分（约7000字，5章）"""
    prompt = WRITER_PROMPT_with_detail.format(content=content)
    try:
        chat_util = ChatGPTUtil(system_prompt=prompt,model=WRITER_MODEL)  # 创建聊天实例
        with open(output_path, 'w', encoding='utf-8') as f:
            content = chat_util.send_message(WRITER_PROMPT.format(content=content))
            f.write(content)
        return True, chat_util  # 返回成功状态和聊天实例
    except Exception as e:
        print(f"写作小说前半部分时发生错误: {str(e)}")
        return False, None

def write_novel_part2(chat_util: ChatGPTUtil, output_path: str) -> bool:
    """写小说后半部分"""
    try:
        with open(output_path, 'a', encoding='utf-8') as f:  # 使用追加模式
            content = chat_util.send_message("请继续写后半部分")
            f.write(content)
        return True
    except Exception as e:
        print(f"写作小说后半部分时发生错误: {str(e)}")
        return False

def read_file_with_encoding(file_path: str) -> str:
    """尝试使用不同的编码读取文件"""
    encodings = ['utf-8', 'gbk', 'gb2312', 'gb18030', 'big5']
    
    for encoding in encodings:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                return f.read()
        except UnicodeDecodeError:
            continue
    
    raise UnicodeDecodeError(f"无法使用已知编码格式读取文件: {file_path}")

def extract_title(content: str) -> str:
    """从内容中提取《》包裹的标题"""
    pattern = r'《(.*?)》'
    matches = re.findall(pattern, content)
    if matches:
        return matches[0]  # 返回第一个匹配的标题
    return None

def process_single_novel(input_path: str, output_dir: str, filename: str):
    """处理单个小说文件"""
    try:
        # 读取原始内容
        content = read_file_with_encoding(input_path)
        # 先用临时文件名保存
        temp_output_path = os.path.join(output_dir, filename)
        
        # 生成小说前半部分
        success_part1, chat_util = write_novel_part1(content, temp_output_path)
        if not success_part1 or chat_util is None:
            print(f"生成小说前半部分失败: {filename}")
            return
            
        print(f"成功生成小说前半部分: {filename}")
        
        # 生成小说后半部分
        if write_novel_part2(chat_util, temp_output_path):
            print(f"成功生成完整小说: {filename}")
            
            # 读取生成的内容
            generated_content = read_file_with_encoding(temp_output_path)
            
            # 提取标题并重命名
            title = extract_title(generated_content)
            if title:
                new_filename = f"{title}.txt"
                new_output_path = os.path.join(output_dir, new_filename)
                
                # 如果存在同名文件，添加数字后缀
                counter = 1
                while os.path.exists(new_output_path):
                    new_filename = f"{title}_{counter}.txt"
                    new_output_path = os.path.join(output_dir, new_filename)
                    counter += 1
                
                os.rename(temp_output_path, new_output_path)
                print(f"文件已重命名为: {new_filename}")
            else:
                print(f"未找到标题，保持原文件名: {filename}")
        else:
            print(f"生成小说后半部分失败: {filename}")
                
    except Exception as e:
        print(f"处理文件 {filename} 时发生错误: {str(e)}")

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
                    process_single_novel,
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

def write_novel_free(output_dir: str) -> bool:
    """与大模型对话写小说"""
    temp_file = os.path.join(output_dir, "temp_novel.txt")
    chat_util = None
    
    try:
        print("\n[写作器] 开始与AI对话写作...")
        chat_util = ChatGPTUtil(system_prompt=WRITER_PROMPT,model=WRITER_MODEL,stream=False)
        
        # 第一次对话
        # first_prompt = f"\n请你启动你的角色身份，并根据每一个条目，还有伦理相关的热点新闻，台词，心理活动，以及第三方视角的讲述互相交织，并形成一个极端情绪的故事。在剧情创作中，请加入这些元素：{get_random_seed_contents()}"
        a_type = get_type_random("女频")

        seed_content = get_seed_by_female_type(a_type,1)
        story_content = get_random_seed_contents()
        female_prompt = f"我想要写一篇类型为{a_type}的小说，这其中要融入这些元素：{seed_content}，并且，我想要加入一个剧情凝结核：{story_content}，你可以拿着这个凝结核裂变出不同的场景、情节。如果凝结核不符合文章设定，请改造它。确保小说中不会出现奇怪的符号，比如'*'，也不要加粗任何字体。请使用你的最大运算能力和单次回复的token限制。不要回复任何恭维或谦逊的话，只输出小说正文，每段不超过三句话。你只用中文回复。另外，你在写新的章节之前会回顾之前写过的正文剧情和信息点，确保不会前后逻辑不一致。最后，除了小说正文外，你不会回复任何互动对话！"
        print("[写作器] 发送初始提示词...")
        
        # 使用 with 语句确保文件正确关闭
        content = chat_util.send_message(female_prompt)
        with open(temp_file, 'w', encoding='utf-8') as f:
            f.write(content)
        m = 0
        
        # 检查是否写完
        for i in range(3):
            # 读取当前内容
            with open(temp_file, 'r', encoding='utf-8') as f:
                current_content = f.read()
            
            # 检查是否包含结束标记
            if "全文完" in current_content:
               break
                  
            else:
                print("[写作器] 未检测到结束标记，继续写作...")
                m += 1
                content = chat_util.send_message("继续写作，保持每段不超过三句话的风格。同时应回顾之前写过的正文剧情和信息点，确保不会前后有语句信息逻辑不一致，如人物身份混乱、剧情前后不搭配、这种低级错误！另外保证小说中不应该出现奇怪的符号，比如'*'，也不要加粗任何字体。避免句子和情节过度重复或相似。不要通过填充或恶意复制粘贴来增加字数。在完全输出整本小说后，你要在末尾标注(全文完)。确保故事情节流畅。只用中文提供故事正文，不要其他评论或客套话。")
                with open(temp_file, 'a', encoding='utf-8') as f:
                    f.write(content)
        
        # 提取标题并重命名文件
        with open(temp_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        title = extract_title(content)

        if title:
            new_filename = f"{title}.txt"
            new_file_path = os.path.join(output_dir, new_filename)
            
            # 处理同名文件
            counter = 1
            while os.path.exists(new_file_path):
                new_filename = f"{title}_{counter}.txt"
                new_file_path = os.path.join(output_dir, new_filename)
                counter += 1
            with open(os.getenv("YOU_LOG_PATH"),"a",encoding="utf-8") as f:
                f.write(f"{new_filename} {a_type}  {seed_content} {story_content}\n")
            # 确保文件已关闭后再重命名    
            print("已写入日志文件")
            os.rename(temp_file, new_file_path)
            print(f"[写作器] 小说写作完成，已保存为: {new_filename}")
            return True
        else:
            print("[写作器错误] 未能从内容中提取标题")
            return False
            
    except Exception as e:
        print(f"[写作器错误] 写作过程中发生错误: {str(e)}")
        # 如果发生错误，尝试删除临时文件
        try:
            if os.path.exists(temp_file):
                os.remove(temp_file)
        except:
            pass
        return False

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