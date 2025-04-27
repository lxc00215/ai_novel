import sys
import asyncio
from contextlib import asynccontextmanager

from fastapi.staticfiles import StaticFiles
from routes import alipay_routes, book_generation_routes, feature_routes, alipay_routes
sys.path.append("routes")
from sqlalchemy.orm import configure_mappers
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import ai_routes, chapter_routes, character_routes, chat_routes, spirate_routes, user_routes, novel_routes, auth_routes, task_routes
from my_filter.sesitive_filter import SensitiveWordMiddleware, get_filter
from util.mcpHub import MCPClient

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

@app.get("/")
async def root():
    return {"message": "Welcome to AI Novel Management System"}


