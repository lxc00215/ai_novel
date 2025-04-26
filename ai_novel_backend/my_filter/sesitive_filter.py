# sensitive_filter.py
import ahocorasick
import os
from functools import lru_cache
# import pybloomfilter
from fastapi import FastAPI, Request, Depends
from typing import Set, Dict, List, Optional
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import json
import re

from fastapi import Request
from fastapi.responses import JSONResponse
from typing import List
import json

class SensitiveWordFilter:
    """敏感词过滤器实现，集成Trie树(AC自动机)和布隆过滤器"""
    
    def __init__(self, sensitive_words_file: str):
        self.words_file = sensitive_words_file
        self.sensitive_words: Set[str] = set()
        # 布隆过滤器，预估词汇量为100k，错误率0.001
        self.bloom_filter = SimpleBloomFilter()
        # AC自动机实现
        self.ac = ahocorasick.Automaton()
        # 加载敏感词
        self._load_words()
        
    def _load_words(self):
        """从文件加载敏感词"""
        if not os.path.exists(self.words_file):
            raise FileNotFoundError(f"敏感词文件 {self.words_file} 不存在")
            
        with open(self.words_file, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f):
                word = line.strip()
                if word:
                    self.sensitive_words.add(word)
                    self.bloom_filter.add(word)
                    self.ac.add_word(word, (i, word))
        
        # 构建自动机
        self.ac.make_automaton()
        print(f"已加载 {len(self.sensitive_words)} 个敏感词")
    
    @lru_cache(maxsize=10000)
    def contains_sensitive_word(self, text: str) -> bool:
        """检查文本是否包含敏感词(使用布隆过滤器快速判断)"""
        # 先用布隆过滤器进行快速检查
        for i in range(len(text)):
            for j in range(i + 1, min(i + 20, len(text) + 1)):  # 限制敏感词最大长度为20
                if text[i:j] in self.bloom_filter:
                    # 布隆过滤器可能有误报，使用精确集合再次验证
                    if text[i:j] in self.sensitive_words:
                        return True
        return False
    
    def filter_text(self, text: str, replacement: str = '*') -> str:
        """过滤文本中的敏感词"""
        if not text:
            return text
            
        # 使用布隆过滤器快速检查，如果不包含敏感词，直接返回原文本
        words_to_check = set()
        for i in range(len(text)):
            for j in range(i + 1, min(i + 20, len(text) + 1)):
                sub = text[i:j]
                if sub in self.bloom_filter:
                    words_to_check.add(sub)
        
        # 如果没有可疑词语，直接返回
        if not words_to_check:
            return text
        
        # 精确过滤
        result = list(text)
        for match in self.ac.iter(text):
            end_index = match[0]
            original_word = match[1][1]
            start_index = end_index - len(original_word) + 1
            for i in range(start_index, end_index + 1):
                result[i] = replacement
                
        return ''.join(result)

# 单例模式，确保只加载一次
_filter_instance = None

def get_filter():
    global _filter_instance
    if _filter_instance is None:
        sensitive_words_file = "./my_filter/sensitive_words.txt"  # 你的敏感词文件路径
        _filter_instance = SensitiveWordFilter(sensitive_words_file)
    return _filter_instance

# FastAPI依赖项，用于获取过滤器
async def get_word_filter():
    return get_filter()

# FastAPI中间件实现


# 排除对某些接口的敏感词过滤
EXCLUDE_PATHS = [
    "http://localhost:8000/ai/generate_images",
    r"http://127.0.0.1:8000/character/\d+",
    r"http://127.0.0.1:8000/spirate/\d+",
    r"http://127.0.0.1:8000/chat/session/\d+",
    r"http://127.0.0.1:8000/chat/session/\d+/clear",
    r"http://127.0.0.1:8000/character/",
    "http://127.0.0.1:8000/spirate/update",
    # 使用正则表达式匹配任意数字
]

def is_excluded_path(path: str) -> bool:
    """
    检查路径是否在排除列表中，支持正则表达式匹配
    
    Args:
        path: 请求路径
        
    Returns:
        bool: 如果路径应该被排除则返回True，否则返回False
    """
    print("path", path)
    for pattern in EXCLUDE_PATHS:
        if pattern.endswith(r'\d+'):
            # 将模式转换为正则表达式
            regex_pattern = pattern.replace(r'\d+', r'\d+')
            if re.match(regex_pattern, str(path)):
                print(f"Matched exclude pattern: {pattern} for path: {path}")
                return True
        elif str(path) == pattern:
            print(f"Exact match exclude pattern: {pattern}")
            return True
    return False

# 导入必要的依赖


class SensitiveWordMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, word_filter: SensitiveWordFilter):
        super().__init__(app)
        self.word_filter = word_filter
    
    async def dispatch(self, request: Request, call_next):
        # 仅处理POST/PUT/PATCH请求
        if request.method in ["POST", "PUT", "PATCH"]:
            if is_excluded_path(request.url):
                print("排除敏感词过滤", json.loads(await request.body()))
                return await call_next(request)
            try:
                body = await request.body()
                if body:
                    # 解析请求体
                    json_body = json.loads(body)
                    print("敏感词过滤", json_body)
                    # 检查是否包含敏感词
                    sensitive_words = self._check_sensitive_content(json_body)
                    print("敏感词:", sensitive_words)
                    if sensitive_words:
                        # 如果发现敏感词，立即返回错误响应
                        return JSONResponse(
                            status_code=400,
                            content={
                                "error": "内容包含敏感词",
                                "detail": f"请检查并修改内容",
                                "found_words": sensitive_words  # 可选：返回找到的敏感词
                            }
                        )
                    # 如果没有敏感词，继续处理请求
                    request._body = json.dumps(json_body).encode()
                    
            except Exception as e:
                print(f"敏感词过滤异常: {str(e)}")
                pass
                
        response = await call_next(request)
        return response
    
    def _check_sensitive_content(self, data) -> List[str]:
        """递归检查数据结构中的所有字符串，返回找到的敏感词列表"""
        found_words = set()
        def check_value(value):
            if isinstance(value, str):
                # 检查字符串是否包含敏感词
                for match in self.word_filter.ac.iter(value):
                    found_words.add(match[1][1])  # 添加找到的敏感词
            elif isinstance(value, dict):
                for v in value.values():
                    check_value(v)
            elif isinstance(value, list):
                for item in value:
                    check_value(item)
        
        check_value(data)
        return list(found_words)

# 使用Python内置集合代替布隆过滤器的简化版本
class SimpleBloomFilter:
    def __init__(self):
        self.words = set()
        
    def add(self, word):
        self.words.add(word)
        
    def __contains__(self, word):
        return word in self.words