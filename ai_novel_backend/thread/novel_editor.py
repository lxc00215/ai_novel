import os
from pathlib import Path
from typing import List, Dict
from concurrent.futures import ThreadPoolExecutor, as_completed
from utils.OpenAIUtil import ChatGPTUtil
import re
from prompt import EDITOR_PROMPT
from seed.get_seed import get_random_seed_contents
from dotenv import load_dotenv

load_dotenv()
EDITOR_MODEL = os.getenv("EDITOR_MODEL")


def edit_novel(content: str) -> str:
    """使用大模型魔改小说内容"""
    # 获取种子
    # seeds = type_info.get("seeds", [])
    
    # 将种子加入提示词
    prompt = EDITOR_PROMPT.format(
        content=content,
        seeds=get_random_seed_contents(2, 5)
    )
    print(f"[编辑器] 开始魔改小说内容...")
    try:
        response_generator = ChatGPTUtil(system_prompt=prompt,model=EDITOR_MODEL,stream=False).send_message(prompt)
        response = ''.join(response_generator)
        print(f"[编辑器] 魔改完成，结果长度: {len(response)}")
        return response
    except Exception as e:
        print(f"编辑小说时发生错误: {str(e)}")
        return None

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

def process_single_novel(input_path: str, output_dir: str, num_versions: int, filename: str):
    """处理单个小说文件，生成多个魔改版本"""
    try:
        # 读取原始内容
        content = read_file_with_encoding(input_path)
        
        # 生成多个版本
        for i in range(num_versions):
            # 魔改内容
            edited_content = edit_novel(content)
            
            if edited_content:
                # 直接使用原文件名+序号
                output_filename = f"{os.path.splitext(filename)[0]}_{i+1}.txt"
                
                # 保存魔改后的内容
                output_path = os.path.join(output_dir, output_filename)
                with open(output_path, 'w', encoding='utf-8') as f:
                    f.write(edited_content)
                print(f"成功生成魔改版本: {output_filename}")
            else:
                print(f"生成魔改版本失败: {filename}_{i+1}")
                
    except Exception as e:
        print(f"处理文件 {filename} 时发生错误: {str(e)}")

def process_novels_parallel(novel_ref_path: str, novel_edit_path: str, num_versions: int):
    """并行处理所有小说文件"""
    # 确保输出目录存在
    Path(novel_edit_path).mkdir(parents=True, exist_ok=True)
    
    # 获取所有小说文件
    novel_files = [f for f in os.listdir(novel_ref_path) if f.endswith('.txt')]
    
    # 使用线程池并行处理文件
    with ThreadPoolExecutor(max_workers=int(os.getenv("EDITOR_THREAD_NUM"))) as executor:
        futures = []
        for novel_file in novel_files:
            print(f"[编辑器] 开始处理文件: {novel_file}")
            input_path = os.path.join(novel_ref_path, novel_file)
            futures.append(
                executor.submit(
                    process_single_novel,
                    input_path,
                    novel_edit_path,
                    num_versions,
                    novel_file
                )
            )
        
        # 等待所有任务完成
        for future in as_completed(futures):
            try:
                future.result()
            except Exception as e:
                print(f"处理任务时发生错误: {str(e)}") 