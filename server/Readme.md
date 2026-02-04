Todo-Think 📝
Todo-Think 是一个基于 Vue 3 和 Node.js (Koa2) 的现代化全栈管理系统。 本项目采用 Monorepo 结构管理前后端代码，后端采用严谨的 Java/RPC 风格 架构设计，配合 Prisma 6 进行数据管理；前端采用 Element Plus 打造企业级交互体验。

🛠 技术栈 (Tech Stack)
🎨 前端 (Client)
Core: Vue 3 (Script Setup) + TypeScript + Vite

UI Framework: Element Plus

State Management: Pinia

Routing: Vue Router

HTTP: Axios (深度封装适配 RPC 风格)

⚙️ 后端 (Server)
Runtime: Node.js + TypeScript (tsx 运行)

Framework: Koa 2

ORM: Prisma 6.x (Latest Stable, Multi-Schema Enabled)

Database: MySQL 8.0

Auth: JWT (JsonWebToken) + BCrypt + RBAC 权限模型

📂 项目结构 (Directory Structure)
Plaintext

todo-think/
├── .vscode/ # VS Code 配置文件
├── client/ # 前端项目 (Vue 3)
│ ├── src/
│ │ ├── api/ # API 层 (与后端路由一一对应)
│ │ └── views/ # 页面视图
│ └── package.json
├── server/ # 后端项目 (Koa 2)
│ ├── prisma/
│ │ ├── schema/ # Prisma 多文件 Schema (base, user, system...)
│ │ └── schema.prisma # 入口文件
│ ├── src/
│ │ ├── modules/ # 业务模块 (自动路由扫描)
│ │ └── middleware/ # 中间件 (Auth, Perm, ErrorHandler)
│ └── package.json
├── todo-think.code-workspace # VS Code 多根工作区配置 (核心)
└── README.md
🚀 核心架构规范 (Architecture Standards)
本项目后端严格遵守 RPC (Remote Procedure Call) 风格，而非 RESTful。

1. API 接口规范
   通信协议: 统一使用 POST 方法 (99% 场景)。

URL 命名: /模块/实体/动作

✅ /sys/user/add

✅ /sys/dept/tree

❌ /users/1 (禁止)

参数传递: 禁止在 URL 中传递 ID，所有参数（包括主键 ID）必须封装在 JSON Body 中传输。

2. 权限体系 (RBAC)
   系统内置基于 用户-角色-菜单 的 RBAC 权限控制：

User: 用户账号 (归属部门)

Role: 角色 (关联菜单权限)

Menu: 资源/按钮权限 (如 sys:user:delete)

Department: 树形组织架构

3. 数据库管理
   使用 Prisma 6 的 prismaSchemaFolder 特性，按业务域拆分 Schema 文件 (user.prisma, system.prisma)，便于大型项目维护。

⚡️ 开发指南 (Development)
本项目针对 VS Code 进行了深度优化，支持一键启动前后端。

1. 环境准备
   Node.js > 18

MySQL 8.0

VS Code (推荐安装 Prisma, Vue - Official 插件)

2. 初始化
   Bash

# 1. 根目录无 package.json，需分别安装依赖

cd server && npm install
cd client && npm install

# 2. 配置数据库

# 在 server 目录下创建 .env 文件，配置 DATABASE_URL

# cd server && npx prisma db push

3. 启动项目 (推荐)
   本项目配置了 VS Code 工作区任务。

双击打开 todo-think.code-workspace 进入工作区模式。

按下快捷键 Ctrl + Shift + B (Run Build Task)。

VS Code 将自动分屏，左侧运行后端，右侧运行前端。
