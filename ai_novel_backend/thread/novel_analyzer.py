import os
from pathlib import Path
from typing import Dict, Tuple
from utils.OpenAIUtil import ChatGPTUtil
from concurrent.futures import ThreadPoolExecutor, as_completed
from prompt import ANALYZER_PROMPT
from dotenv import load_dotenv

load_dotenv()
ANALYZER_MODEL = os.getenv("ANALYZER_MODEL")

def analyze_novel(novel_content: str) -> Tuple[str, Dict]:
    """使用大模型分析小说内容，返回分析结果和类型信息"""
    try:
        # 获取生成器的所有内容并拼接
        print("[分析器] 开始分析小说内容...")
        response_generator = ChatGPTUtil(system_prompt=ANALYZER_PROMPT,model=ANALYZER_MODEL,stream=False).send_message(ANALYZER_PROMPT.format(content=novel_content))
        analysis_result = ''.join(response_generator)
        print(f"[分析器] 分析完成，结果长度: {len(analysis_result)}")
        return analysis_result
    except Exception as e:
        print(f"分析小说时发生错误: {str(e)}")
        return None, None

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

def process_single_novel(input_path: str, output_dir: str, filename: str) -> Dict:
    """处理单个小说文件，返回分析结果和种子信息"""
    try:
        # 读取小说内容
        content = read_file_with_encoding(input_path)
        
        # 分析小说
        analysis_result = analyze_novel(content)
        
        if analysis_result:
            # 保存分析结果
            output_path = os.path.join(output_dir, filename)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(analysis_result)
            print(f"成功处理小说: {filename}")

        else:
            print(f"分析小说失败: {filename}")
            return None
                
    except Exception as e:
        print(f"处理文件 {filename} 时发生错误: {str(e)}")
        return None

def process_novels(novel_ref_path: str, novel_sum_path: str) -> Dict:
    """并行处理所有小说文件，返回所有小说的类型和种子信息"""
    # 确保输出目录存在
    Path(novel_sum_path).mkdir(parents=True, exist_ok=True)
    
    results = {}
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = []
        
        # 遍历小说文件
        for novel_file in os.listdir(novel_ref_path):
            if not novel_file.endswith('.txt'):
                continue   
            input_path = os.path.join(novel_ref_path, novel_file)
            futures.append(
                executor.submit(
                    process_single_novel,
                    input_path,
                    novel_sum_path,
                    novel_file
                )
            )
        
        # 等待所有任务完成并收集结果
        for future in as_completed(futures):
            try:
                result = future.result()
                if result:
                    results[novel_file] = result
            except Exception as e:
                print(f"处理任务时发生错误: {str(e)}")
    
    print("拆书分析完成...")
    return results 