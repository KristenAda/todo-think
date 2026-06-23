-- 新建测试库（在 MySQL 客户端以有足够权限的账号执行一次即可）
-- 库名可按团队规范修改；若改名请同步修改 .env.test 里的 DATABASE_URL。
-- 建库后在 server 目录：npm run db:test:fresh（清空并重灌最小种子）；含场景演示：npm run db:test:full

CREATE DATABASE IF NOT EXISTS `todo_think_test_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
