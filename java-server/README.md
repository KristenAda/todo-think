# Todo-Think Java Server

Spring Boot 2.7 + JDK 8 后端，与 Node `server/` 共用 MySQL 与 API 契约。**Node 源码保持不动**，可切换为默认后端。

## 环境要求

- JDK 8（`D:\Jdk`）
- Maven 3.9+（`D:\maven`）
- MySQL `todo_think_db`

## 配置

编辑 `src/main/resources/application-dev.yml`：

- `spring.datasource.*` 对齐 `server/.env` 的 `DATABASE_URL`
- `app.jwt.secret` 对齐 `server/.env` 的 `JWT_SECRET`
- `app.upload.root` 附件根目录（默认 `../server/uploads`，与 Node 共用）

## 启动

```powershell
cd D:\Code\todo-think\java-server
npm run dev
```

服务监听 **http://localhost:3000**，与前端 `VITE_API_PROXY_URL` 一致。

## 已实现接口（87 条 HTTP + WebSocket）

| 模块 | 前缀 | 路由数 |
|------|------|--------|
| auth | `/auth` | 3 |
| user | `/user` | 9 |
| role | `/role` | 7 |
| menu | `/menu` | 5 |
| organization | `/departments` | 8 |
| attachment | `/attachments` | 7 |
| message | `/messages` | 5 |
| project | `/projects` | 11 |
| task | `/tasks` | 13 |
| performance 规则 | `/rule-sets` 等 | 12 |
| performance 查询 | `/performance` | 6 |
| dashboard | `/dashboard` | 1 |

**基础设施**：`ws://localhost:3000/ws?token=JWT`（ping/pong）、逾期提醒定时任务、绩效结算定时任务。

接口用例见 [`test.http`](test.http)。

## 契约对照（与 Node 对齐）

| 项 | 约定 |
|----|------|
| 响应体 | `{ code, message, data }`，成功 `code=200` |
| 分页 | `data: { list, total, page, pageSize, totalPage }` |
| 鉴权 | `Authorization: Bearer <JWT>` |
| JWT payload | `{ id, userName, roles }`，24h |
| 密码 | 前端 SHA-256 → 后端 BCrypt 比对 |
| 日期 | `yyyy-MM-dd HH:mm:ss` |

## 包结构

```
com.todothink
├── core/           # JWT、Security、Result、Upload、WebSocket
├── modules/
│   ├── auth/
│   ├── system/     # user / role / menu / organization
│   ├── attachment/
│   ├── message/
│   ├── task/       # project + task + overdue job
│   ├── performance/# rules + settlement + ledger
│   └── dashboard/
```
