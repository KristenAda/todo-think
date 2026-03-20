-- ==========================================
-- Todo-Think 系统测试数据 SQL 脚本
-- ==========================================
-- 包含：部门、角色、菜单、用户的完整测试数据
-- 执行顺序：部门 -> 角色 -> 菜单 -> 用户 -> 用户角色关联
-- ==========================================

-- ==========================================
-- 1. 部门数据 (Department)
-- ==========================================
INSERT INTO `Department` (`id`, `parentId`, `ancestors`, `name`, `sort`, `leader`, `phone`, `email`, `status`, `createdAt`, `updatedAt`, `deletedAt`, `userId`) VALUES
(1, NULL, '0', '总公司', 0, '张三', '010-12345678', 'admin@company.com', 1, NOW(), NOW(), NULL, NULL),
(2, 1, '0,1', '技术部', 1, '李四', '010-87654321', 'tech@company.com', 1, NOW(), NOW(), NULL, NULL),
(3, 1, '0,1', '产品部', 2, '王五', '010-11111111', 'product@company.com', 1, NOW(), NOW(), NULL, NULL),
(4, 1, '0,1', '运营部', 3, '赵六', '010-22222222', 'operation@company.com', 1, NOW(), NOW(), NULL, NULL),
(5, 2, '0,1,2', '后端团队', 1, '孙七', '010-33333333', 'backend@company.com', 1, NOW(), NOW(), NULL, NULL),
(6, 2, '0,1,2', '前端团队', 2, '周八', '010-44444444', 'frontend@company.com', 1, NOW(), NOW(), NULL, NULL),
(7, 3, '0,1,3', '产品设计', 1, '吴九', '010-55555555', 'design@company.com', 1, NOW(), NOW(), NULL, NULL),
(8, 4, '0,1,4', '市场推广', 1, '郑十', '010-66666666', 'market@company.com', 1, NOW(), NOW(), NULL, NULL);

-- ==========================================
-- 2. 角色数据 (Role)
-- ==========================================
INSERT INTO `Role` (`id`, `roleName`, `roleKey`, `sort`, `status`, `dataScope`, `remark`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, '超级管理员', 'admin', 1, 1, 1, '系统超级管理员，拥有所有权限', NOW(), NOW(), NULL),
(2, '普通管理员', 'manager', 2, 1, 3, '普通管理员，拥有本部门及以下数据权限', NOW(), NOW(), NULL),
(3, '部门主管', 'supervisor', 3, 1, 3, '部门主管，拥有本部门及以下数据权限', NOW(), NOW(), NULL),
(4, '普通员工', 'user', 4, 1, 5, '普通员工，仅拥有本人数据权限', NOW(), NOW(), NULL),
(5, '访客', 'guest', 5, 1, 5, '访客用户，仅拥有查看权限', NOW(), NOW(), NULL);

-- ==========================================
-- 3. 菜单数据 (Menu)
-- ==========================================
-- 一级菜单（目录）
INSERT INTO `Menu` (`id`, `parentId`, `title`, `path`, `component`, `perms`, `icon`, `type`, `sort`, `visible`, `isCache`, `isFrame`, `createdAt`, `updatedAt`) VALUES
(1, NULL, '系统管理', '/system', NULL, NULL, 'Setting', 1, 1, 1, 1, 0, NOW(), NOW()),
(2, NULL, '业务管理', '/business', NULL, NULL, 'Management', 1, 2, 1, 1, 0, NOW(), NOW()),
(3, NULL, '数据分析', '/analysis', NULL, NULL, 'DataAnalysis', 1, 3, 1, 1, 0, NOW(), NOW()),
(4, NULL, '个人中心', '/profile', NULL, NULL, 'User', 1, 4, 1, 1, 0, NOW(), NOW());

-- 二级菜单（系统管理下）
INSERT INTO `Menu` (`id`, `parentId`, `title`, `path`, `component`, `perms`, `icon`, `type`, `sort`, `visible`, `isCache`, `isFrame`, `createdAt`, `updatedAt`) VALUES
(10, 1, '用户管理', '/system/user', 'system/user/index', NULL, 'User', 2, 1, 1, 1, 0, NOW(), NOW()),
(11, 1, '角色管理', '/system/role', 'system/role/index', NULL, 'UserFilled', 2, 2, 1, 1, 0, NOW(), NOW()),
(12, 1, '菜单管理', '/system/menu', 'system/menu/index', NULL, 'Menu', 2, 3, 1, 1, 0, NOW(), NOW()),
(13, 1, '部门管理', '/system/dept', 'system/dept/index', NULL, 'Organization', 2, 4, 1, 1, 0, NOW(), NOW());

-- 二级菜单（业务管理下）
INSERT INTO `Menu` (`id`, `parentId`, `title`, `path`, `component`, `perms`, `icon`, `type`, `sort`, `visible`, `isCache`, `isFrame`, `createdAt`, `updatedAt`) VALUES
(20, 2, '任务管理', '/business/task', 'business/task/index', NULL, 'List', 2, 1, 1, 1, 0, NOW(), NOW()),
(21, 2, '项目管理', '/business/project', 'business/project/index', NULL, 'Briefcase', 2, 2, 1, 1, 0, NOW(), NOW()),
(22, 2, '团队管理', '/business/team', 'business/team/index', NULL, 'People', 2, 3, 1, 1, 0, NOW(), NOW());

-- 二级菜单（数据分析下）
INSERT INTO `Menu` (`id`, `parentId`, `title`, `path`, `component`, `perms`, `icon`, `type`, `sort`, `visible`, `isCache`, `isFrame`, `createdAt`, `updatedAt`) VALUES
(30, 3, '数据概览', '/analysis/overview', 'analysis/overview/index', NULL, 'DataAnalysis', 2, 1, 1, 1, 0, NOW(), NOW()),
(31, 3, '报表统计', '/analysis/report', 'analysis/report/index', NULL, 'PieChart', 2, 2, 1, 1, 0, NOW(), NOW());

-- 二级菜单（个人中心下）
INSERT INTO `Menu` (`id`, `parentId`, `title`, `path`, `component`, `perms`, `icon`, `type`, `sort`, `visible`, `isCache`, `isFrame`, `createdAt`, `updatedAt`) VALUES
(40, 4, '个人信息', '/profile/info', 'profile/info/index', NULL, 'User', 2, 1, 1, 1, 0, NOW(), NOW()),
(41, 4, '修改密码', '/profile/password', 'profile/password/index', NULL, 'Lock', 2, 2, 1, 1, 0, NOW(), NOW());

-- 按钮权限（用户管理下）
INSERT INTO `Menu` (`id`, `parentId`, `title`, `path`, `component`, `perms`, `icon`, `type`, `sort`, `visible`, `isCache`, `isFrame`, `createdAt`, `updatedAt`) VALUES
(100, 10, '新增用户', NULL, NULL, 'sys:user:add', NULL, 3, 1, 1, 1, 0, NOW(), NOW()),
(101, 10, '编辑用户', NULL, NULL, 'sys:user:edit', NULL, 3, 2, 1, 1, 0, NOW(), NOW()),
(102, 10, '删除用户', NULL, NULL, 'sys:user:delete', NULL, 3, 3, 1, 1, 0, NOW(), NOW()),
(103, 10, '查看用户', NULL, NULL, 'sys:user:view', NULL, 3, 4, 1, 1, 0, NOW(), NOW());

-- 按钮权限（角色管理下）
INSERT INTO `Menu` (`id`, `parentId`, `title`, `path`, `component`, `perms`, `icon`, `type`, `sort`, `visible`, `isCache`, `isFrame`, `createdAt`, `updatedAt`) VALUES
(110, 11, '新增角色', NULL, NULL, 'sys:role:add', NULL, 3, 1, 1, 1, 0, NOW(), NOW()),
(111, 11, '编辑角色', NULL, NULL, 'sys:role:edit', NULL, 3, 2, 1, 1, 0, NOW(), NOW()),
(112, 11, '删除角色', NULL, NULL, 'sys:role:delete', NULL, 3, 3, 1, 1, 0, NOW(), NOW()),
(113, 11, '查看角色', NULL, NULL, 'sys:role:view', NULL, 3, 4, 1, 1, 0, NOW(), NOW());

-- 按钮权限（菜单管理下）
INSERT INTO `Menu` (`id`, `parentId`, `title`, `path`, `component`, `perms`, `icon`, `type`, `sort`, `visible`, `isCache`, `isFrame`, `createdAt`, `updatedAt`) VALUES
(120, 12, '新增菜单', NULL, NULL, 'sys:menu:add', NULL, 3, 1, 1, 1, 0, NOW(), NOW()),
(121, 12, '编辑菜单', NULL, NULL, 'sys:menu:edit', NULL, 3, 2, 1, 1, 0, NOW(), NOW()),
(122, 12, '删除菜单', NULL, NULL, 'sys:menu:delete', NULL, 3, 3, 1, 1, 0, NOW(), NOW()),
(123, 12, '查看菜单', NULL, NULL, 'sys:menu:view', NULL, 3, 4, 1, 1, 0, NOW(), NOW());

-- 按钮权限（部门管理下）
INSERT INTO `Menu` (`id`, `parentId`, `title`, `path`, `component`, `perms`, `icon`, `type`, `sort`, `visible`, `isCache`, `isFrame`, `createdAt`, `updatedAt`) VALUES
(130, 13, '新增部门', NULL, NULL, 'sys:dept:add', NULL, 3, 1, 1, 1, 0, NOW(), NOW()),
(131, 13, '编辑部门', NULL, NULL, 'sys:dept:edit', NULL, 3, 2, 1, 1, 0, NOW(), NOW()),
(132, 13, '删除部门', NULL, NULL, 'sys:dept:delete', NULL, 3, 3, 1, 1, 0, NOW(), NOW()),
(133, 13, '查看部门', NULL, NULL, 'sys:dept:view', NULL, 3, 4, 1, 1, 0, NOW(), NOW());

-- 按钮权限（任务管理下）
INSERT INTO `Menu` (`id`, `parentId`, `title`, `path`, `component`, `perms`, `icon`, `type`, `sort`, `visible`, `isCache`, `isFrame`, `createdAt`, `updatedAt`) VALUES
(200, 20, '新增任务', NULL, NULL, 'biz:task:add', NULL, 3, 1, 1, 1, 0, NOW(), NOW()),
(201, 20, '编辑任务', NULL, NULL, 'biz:task:edit', NULL, 3, 2, 1, 1, 0, NOW(), NOW()),
(202, 20, '删除任务', NULL, NULL, 'biz:task:delete', NULL, 3, 3, 1, 1, 0, NOW(), NOW()),
(203, 20, '查看任务', NULL, NULL, 'biz:task:view', NULL, 3, 4, 1, 1, 0, NOW(), NOW());

-- ==========================================
-- 4. 角色菜单关联 (Role_Menu)
-- ==========================================
-- 超级管理员：拥有所有菜单权限
INSERT INTO `_MenuToRole` (`A`, `B`) VALUES
(1, 1), (2, 1), (3, 1), (4, 1),
(10, 1), (11, 1), (12, 1), (13, 1),
(20, 1), (21, 1), (22, 1),
(30, 1), (31, 1),
(40, 1), (41, 1),
(100, 1), (101, 1), (102, 1), (103, 1),
(110, 1), (111, 1), (112, 1), (113, 1),
(120, 1), (121, 1), (122, 1), (123, 1),
(130, 1), (131, 1), (132, 1), (133, 1),
(200, 1), (201, 1), (202, 1), (203, 1);

-- 普通管理员：系统管理、业务管理、个人中心
INSERT INTO `_MenuToRole` (`A`, `B`) VALUES
(1, 2), (2, 2), (4, 2),
(10, 2), (11, 2), (12, 2), (13, 2),
(20, 2), (21, 2), (22, 2),
(40, 2), (41, 2),
(100, 2), (101, 2), (102, 2), (103, 2),
(110, 2), (111, 2), (112, 2), (113, 2),
(120, 2), (121, 2), (122, 2), (123, 2),
(130, 2), (131, 2), (132, 2), (133, 2),
(200, 2), (201, 2), (202, 2), (203, 2);

-- 部门主管：业务管理、个人中心
INSERT INTO `_MenuToRole` (`A`, `B`) VALUES
(2, 3), (4, 3),
(20, 3), (21, 3), (22, 3),
(40, 3), (41, 3),
(200, 3), (201, 3), (202, 3), (203, 3);

-- 普通员工：业务管理、个人中心（仅查看权限）
INSERT INTO `_MenuToRole` (`A`, `B`) VALUES
(2, 4), (4, 4),
(20, 4), (21, 4), (22, 4),
(40, 4), (41, 4),
(203, 4);

-- 访客：个人中心（仅查看权限）
INSERT INTO `_MenuToRole` (`A`, `B`) VALUES
(4, 5),
(40, 5), (41, 5);

-- ==========================================
-- 5. 用户数据 (User)
-- ==========================================
-- 密码都是 123456 (bcrypt 加密后)
-- bcrypt hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm
INSERT INTO `User` (`id`, `username`, `password`, `nickname`, `phone`, `email`, `avatar`, `status`, `remark`, `deptId`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', '超级管理员', '13800000001', 'admin@company.com', NULL, 1, '系统超级管理员', 1, NOW(), NOW(), NULL),
(2, 'manager', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', '普通管理员', '13800000002', 'manager@company.com', NULL, 1, '普通管理员', 1, NOW(), NOW(), NULL),
(3, 'supervisor', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', '技术部主管', '13800000003', 'supervisor@company.com', NULL, 1, '技术部主管', 2, NOW(), NOW(), NULL),
(4, 'backend_dev', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', '后端开发', '13800000004', 'backend@company.com', NULL, 1, '后端开发工程师', 5, NOW(), NOW(), NULL),
(5, 'frontend_dev', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', '前端开发', '13800000005', 'frontend@company.com', NULL, 1, '前端开发工程师', 6, NOW(), NOW(), NULL),
(6, 'product_manager', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', '产品经理', '13800000006', 'product@company.com', NULL, 1, '产品经理', 7, NOW(), NOW(), NULL),
(7, 'operation_staff', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', '运营专员', '13800000007', 'operation@company.com', NULL, 1, '运营专员', 8, NOW(), NOW(), NULL),
(8, 'guest', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', '访客用户', '13800000008', 'guest@company.com', NULL, 1, '访客用户', 1, NOW(), NOW(), NULL);

-- ==========================================
-- 6. 用户角色关联 (_UserToRole)
-- ==========================================
INSERT INTO `_UserToRole` (`A`, `B`) VALUES
(1, 1),  -- admin 用户 -> 超级管理员角色
(2, 2),  -- manager 用户 -> 普通管理员角色
(3, 3),  -- supervisor 用户 -> 部门主管角色
(4, 4),  -- backend_dev 用户 -> 普通员工角色
(5, 4),  -- frontend_dev 用户 -> 普通员工角色
(6, 4),  -- product_manager 用户 -> 普通员工角色
(7, 4),  -- operation_staff 用户 -> 普通员工角色
(8, 5);  -- guest 用户 -> 访客角色

-- ==========================================
-- 7. 角色部门关联 (_DepartmentToRole) - 自定数据权限
-- ==========================================
-- 普通管理员：可管理技术部及其下属部门
INSERT INTO `_DepartmentToRole` (`A`, `B`) VALUES
(2, 2), (5, 2), (6, 2);

-- 部门主管：可管理技术部及其下属部门
INSERT INTO `_DepartmentToRole` (`A`, `B`) VALUES
(2, 3), (5, 3), (6, 3);

-- ==========================================
-- 测试数据说明
-- ==========================================
-- 用户登录凭证：
-- 1. admin / 123456 (超级管理员 - 全部权限)
-- 2. manager / 123456 (普通管理员 - 系统管理权限)
-- 3. supervisor / 123456 (部门主管 - 业务管理权限)
-- 4. backend_dev / 123456 (普通员工 - 有限权限)
-- 5. guest / 123456 (访客 - 仅查看权限)
--
-- 部门结构：
-- 总公司 (1)
--   ├─ 技术部 (2)
--   │   ├─ 后端团队 (5)
--   │   └─ 前端团队 (6)
--   ├─ 产品部 (3)
--   │   └─ 产品设计 (7)
--   ├─ 运营部 (4)
--   │   └─ 市场推广 (8)
--
-- 角色权限：
-- 1. 超级管理员 - 全部数据权限，所有菜单和按钮
-- 2. 普通管理员 - 本部门及以下数据权限，系统管理和业务管理
-- 3. 部门主管 - 本部门及以下数据权限，业务管理
-- 4. 普通员工 - 仅本人数据权限，业务管理（查看）
-- 5. 访客 - 仅本人数据权限，个人中心
-- ==========================================
