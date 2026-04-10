-- 修复：旧种子里的 bcrypt 占位符与「SHA256(123456)」不匹配，导致登录永远密码错误
-- 执行后：所有下列用户可用密码 123456 登录（与前端 hashPassword 一致）
-- 表名按 Prisma 默认为 `User`；若你库为小写 `user` 请改表名

USE `todo_think_db`;

UPDATE `User`
SET
  `password` = '$2b$10$D9VaXd.QuBfhfGIYPIkUGOw50GxIvLS2BK.IVbjadIUtllWTpzs9q',
  `updateTime` = NOW()
WHERE `userName` IN (
  'admin',
  'manager',
  'supervisor',
  'backend_dev',
  'frontend_dev',
  'product_manager',
  'operation_staff',
  'guest'
);

-- 若只想修 admin：
-- UPDATE `User` SET `password` = '$2b$10$D9VaXd.QuBfhfGIYPIkUGOw50GxIvLS2BK.IVbjadIUtllWTpzs9q', `updateTime` = NOW() WHERE `userName` = 'admin';
