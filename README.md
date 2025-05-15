# 《AI-Novel》 - 你的智能小说创作助手

《AI-Novel》（NonRealAI）是一个专业的AI驱动平台，旨在点亮您的创作灵感，并简化从初步构思到最终成稿的整个小说创作流程。它利用尖端的人工智能技术，在创作的每个阶段为写作者提供支持，并提供多种模式以满足不同的创作需求。

<!-- 播放视频 -->

<video src="./video/演示视频.mp4" controls></video>

## ✨核心功能

平台提供多种独特模式，助力您的创作之旅：

1.  **灵感模式:**
    *   **AI故事生成:** 只需提供简单的提示，即可让AI生成初步的情节点或场景，快速启动您的故事。
    *   **互动式故事分支:** 通过选择AI建议的故事分支来引导叙事，创建动态且不断发展的故事情节。
    *   **AI图像生成:** 根据故事文本，通过集成的AI图像生成功能将关键场景或角色可视化。
    *   **角色聊天:** 通过AI驱动的聊天界面与您的故事角色（例如“张三”、“李四”）互动，深入探索他们的个性和动机。

2.  **精细模式:**
    *   **专属作品管理:** 系统化管理您的小说、章节、已归档作品和回收站。
    *   **逐章精细写作:** 在功能丰富的文本编辑器中，专注于每一章节的细节撰写。
    *   **AI写作辅助工具栏:**
        *   **AI写作:** 根据给定提示或大纲为新章节生成内容。
        *   **AI续写:** 让AI从您最后一句或一段话开始继续写作。
        *   **AI润色:** 改进现有文本的风格、语法和流畅度。
        *   **AI起名:** 为角色或地点名称提供建议。
        *   **AI扩写:** 扩展选定文本以增加更多细节。
    *   **语音输入:** 使用语音转文本功能口述您的想法或章节内容。

3.  **拆书模式:**
    *   **文档上传:** 上传现有手稿或文本（支持 `.txt`, `.docx`, `.pdf` 格式）。
    *   **AI驱动分析:** AI解构上传的文本，提供详细分析，包括：
        *   摘要
        *   核心解读
        *   痛点识别与分析
        *   爽点解析
        *   叙事结构剖析
        *   人物建构解析
        *   场景魅力与氛围
        *   核心技巧总结
        *   可复制创作模式
    *   **导出分析:** 复制或下载生成的分析报告。

4.  **暴走模式:**
    *   **快速小说大纲生成:** 迅速生成多章节的小说骨架。
    *   **题材与分类选择:** 从男频、女频等类型以及玄幻、武侠、科幻等分类中进行选择。
    *   **故事种子定制:** 使用“故事种子”定义核心元素：
        *   角色
        *   背景
        *   剧情
        *   冲突
    *   **章节数量:** 指定期望的章节数。
    *   **后台生成:** AI在后台生成小说，您可以追踪进度。
    *   **审阅与编辑:** 查看、编辑和优化AI生成的章节。
    *   **导出小说:** 导出生成的小说。

5.  **用户管理:**
    *   安全的用户注册和登录系统。

## 🛠️技术栈

*   **前端:**
    *   **Next.js:** 用于服务器端渲染和静态站点生成的 React 框架。
    *   **TypeScript:** 用于类型安全。
    *   **Tailwind CSS :** 用于样式设计。
*   **后端:**
    *   **FastAPI (Python):** 用于构建API的高性能Python Web框架。
    *   **SQLAlchemy:** 用于数据库交互。
    *   **MySQL:** 关系型数据库。

## 🚀启动指南

请遵循以下说明在本地搭建并运行项目，以进行开发和测试。

### 先决条件

*   **Node.js 和 npm/yarn:** 用于 Next.js 前端。（建议 Node.js >= 18.x）
*   **Python 和 pip:** 用于 FastAPI 后端。（建议 Python >= 3.8）


### 后端搭建 (FastAPI)

1.  **克隆代码仓库:**
    ```bash
    git clone https://your-repository-url.git
    cd your-repository-url/backend # 导航到您的后端目录
    ```

2.  **创建并激活虚拟环境:**
    ```bash
    python -m venv venv
    # Windows 系统
    # venv\Scripts\activate
    # macOS/Linux 系统
    source venv/bin/activate
    ```

3.  **安装依赖:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **配置环境变量:**
    在 `backend` 目录下创建一个 `.env` 文件，并添加您的配置。示例：
    ```env
    DATABASE_URL="mysql+mysqlconnector://user:password@host:port/database_name"
    # 或者使用异步驱动，例如：
    # DATABASE_URL="mysql+aiomysql://user:password@host:port/database_name"
    OPENAI_API_KEY="your_openai_api_key"
    # 添加其他必要的环境变量，如 AI 服务、JWT 密钥等。
    ```

6.  **运行后端服务:**
    FastAPI 通常使用 Uvicorn 作为 ASGI 服务器。
    ```bash
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```
    后端 API 现在应该运行在 `http://localhost:8000`。

### 前端搭建 (Next.js)

1.  **导航到前端目录:**
    ```bash
    cd ../frontend # 或者从根目录导航到您的前端目录路径
    ```

2.  **安装依赖:**
    使用 npm:
    ```bash
    npm install
    ```
    或者使用 yarn:
    ```bash
    yarn install
    ```

3.  **配置环境变量:**
    在 `frontend` 目录下创建一个 `.env.local` 文件。此文件用于 Next.js 加载的环境变量。
    ```env
    NEXT_PUBLIC_API_URL="http://localhost:8000" 
    ```
    `NEXT_PUBLIC_` 前缀使变量可在浏览器中访问。

4.  **运行前端开发服务器:**
    使用 npm:
    ```bash
    npm run dev
    ```
    或者使用 yarn:
    ```bash
    yarn dev
    ```
    前端应用现在应该运行在 `http://localhost:3000`。

### 访问应用

打开您的网络浏览器并导航到 `http://localhost:3000`。您应该能看到《AI-Novel》应用。

## 🤝参与贡献

欢迎各种形式的贡献！如果您想为项目做出贡献，请遵循以下步骤：
1. Fork 本项目
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 📄许可证

本项目采用 MIT 许可证 - 详情请参阅 `LICENSE` 文件 (如果您添加了该文件)。

## 💡鸣谢

我们要特别感谢以下研究工作，它们为本项目在长文本生成方面的实现提供了重要的思路和启发：

*   **"Long-Context Large Language Models for Efficient Text Generation"** (或论文的实际中文标题，如果知道的话): 这篇论文 (https://arxiv.org/abs/2408.07055) 中探讨的大模型长文本输出方式，为我们优化AI生成内容的连贯性和深度方面提供了宝贵的参考。

感谢所有为开源社区和人工智能领域做出贡献的研究者和开发者。

## 📧联系方式

李信成 / NonReal - 1677507428@qq.com

项目链接: [https://gitee.com/lang-jun/novel-project](https://gitee.com/lang-jun/novel-project)
```