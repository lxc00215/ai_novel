import sys
import asyncio
from contextlib import asynccontextmanager

from fastapi.staticfiles import StaticFiles
from routes import alipay_routes, book_generation_routes, crazy_routes, feature_routes, alipay_routes, util_routes
sys.path.append("routes")
from sqlalchemy.orm import configure_mappers
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from routes import ai_routes, chapter_routes, character_routes, chat_routes, spirate_routes, user_routes, novel_routes, auth_routes, task_routes
from my_filter.sesitive_filter import SensitiveWordMiddleware, get_filter
from util.mcpHub import MCPClient
from auth import get_current_user
from database import User

# 全局变量引用
mcp_client = None
mcp_config_path = "mcp_servers.json"

# 应用生命周期管理
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时执行
    global mcp_client
    try:
        print("正在初始化MCP客户端...")
        client = MCPClient()
        await client.load_servers_from_config("mcp_servers.json")
        mcp_client = client
        print("MCP客户端初始化完成")
        # 将客户端实例赋值给路由模块中的全局变量
        alipay_routes.mcp_client = mcp_client
    except Exception as e:
        print(f"MCP客户端初始化失败: {str(e)}")
    yield
    
    # 关闭时执行
    if mcp_client:
        print("正在关闭MCP客户端...")
        await mcp_client.cleanup()
        print("MCP客户端已关闭")

app = FastAPI(title="AI Novel Management System", lifespan=lifespan)

# CORS配置
# origins = [
#     "http://localhost:3000",
#     "http://127.0.0.1:3000",
#     "http://localhost",
#     "http://localhost:5173",  # Vite开发服务器默认端口
#     "http://192.168.0.1:3000",  # 局域网IP，根据实际调整
#     # 添加其他前端域名，如需要
# ]

# # 优先应用CORS中间件
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_origin_regex=r"https?://.*\.yourdomain\.com",  # 如果有自定义域名，可以使用正则匹配
#     allow_credentials=True,
#     allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
#     allow_headers=["*"],
#     expose_headers=["*"],
#     max_age=600,  # 预检请求的缓存时间（秒）
# )

@app.on_event("startup")
async def startup_event():
       # 在后台任务中初始化
       asyncio.create_task(initialize_mcp())

async def initialize_mcp():
    try:
        client = MCPClient()
        await client.load_servers_from_config("mcp_servers.json")
        alipay_routes.mcp_client = client
    except Exception as e:
        print(f"MCP初始化失败: {e}")

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth_routes.router)
app.include_router(user_routes.router)
app.include_router(novel_routes.router)
app.include_router(alipay_routes.router)
app.include_router(book_generation_routes.router)
app.include_router(chapter_routes.router)
app.include_router(task_routes.router)
app.include_router(ai_routes.router)
app.include_router(spirate_routes.router)
app.include_router(character_routes.router)
app.include_router(chat_routes.router)
app.include_router(feature_routes.router)
app.include_router(alipay_routes.router)
app.include_router(crazy_routes.router)
app.include_router(util_routes.router)

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

# 添加一个测试的受保护API路由
@app.get("/protected")
async def protected_route(current_user: User = Depends(get_current_user)):
    """
    测试需要认证的路由。
    只有登录用户才能访问此路由。
    """
    return {
        "message": "你已通过身份验证",
        "user_id": current_user.id,
        "account": current_user.account
    }

@app.get("/")
async def root():
    return {"message": "Welcome to AI Novel Management System"}


