import sys

from fastapi.staticfiles import StaticFiles

from my_filter.sesitive_filter import SensitiveWordFilter, get_word_filter
sys.path.append("routes")
from sqlalchemy.orm import configure_mappers
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import ai_routes, chapter_routes, character_routes, chat_routes, history, spirate_routes, user_routes, novel_routes, prompt_routes, auth_routes, model_routes, task_routes, util_routes
from my_filter.sesitive_filter import SensitiveWordMiddleware, get_filter
app = FastAPI(title="AI Novel Management System")

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth_routes.router)
app.include_router(user_routes.router)
app.include_router(novel_routes.router)
app.include_router(prompt_routes.router)
app.include_router(model_routes.router)
app.include_router(history.router)
app.include_router(chapter_routes.router)
app.include_router(task_routes.router)
app.include_router(ai_routes.router)
app.include_router(spirate_routes.router)
app.include_router(character_routes.router)
app.include_router(util_routes.router)
app.include_router(chat_routes.router)
configure_mappers()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的域名，而不是 "*"
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法
    allow_headers=["*"],  # 允许所有请求头
)


# 初始化过滤器并添加中间件
filter_instance = get_filter()
app.add_middleware(SensitiveWordMiddleware, word_filter=filter_instance)
# @app.post("/check_content")
# async def check_content(
#     request_data: dict, 
#     word_filter: SensitiveWordFilter = Depends(get_word_filter)
# ):
#     """检查内容是否包含敏感词"""
#     if "content" in request_data:
#         content = request_data["content"]
#         contains_sensitive = word_filter.contains_sensitive_word(content)
#         filtered_content = word_filter.filter_text(content)
        
#         return {
#             "original": content,
#             "contains_sensitive": contains_sensitive,
#             "filtered": filtered_content
#         }
#     return {"error": "No content provided"}

@app.get("/")
async def root():
    return {"message": "Welcome to AI Novel Management System"}


