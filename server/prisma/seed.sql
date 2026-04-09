-- ==========================================
-- Todo-Think 系统测试数据 SQL 脚本 (最终完整版)
-- ==========================================

-- ==========================================
-- 1. 部门数据 (Department)
-- ==========================================
INSERT INTO `Department` (`id`, `parentId`, `ancestors`, `name`, `sort`, `leader`, `phone`, `email`, `status`, `createTime`, `updateTime`, `deletedAt`) VALUES
(1, NULL, '0', '总公司', 0, '张三', '010-12345678', 'admin@company.com', 1, NOW(), NOW(), NULL),
(2, 1, '0,1', '技术部', 1, '李四', '010-87654321', 'tech@company.com', 1, NOW(), NOW(), NULL),
(3, 1, '0,1', '产品部', 2, '王五', '010-11111111', 'product@company.com', 1, NOW(), NOW(), NULL),
(4, 1, '0,1', '运营部', 3, '赵六', '010-22222222', 'operation@company.com', 1, NOW(), NOW(), NULL),
(5, 2, '0,1,2', '后端团队', 1, '孙七', '010-33333333', 'backend@company.com', 1, NOW(), NOW(), NULL),
(6, 2, '0,1,2', '前端团队', 2, '周八', '010-44444444', 'frontend@company.com', 1, NOW(), NOW(), NULL),
(7, 3, '0,1,3', '产品设计', 1, '吴九', '010-55555555', 'design@company.com', 1, NOW(), NOW(), NULL),
(8, 4, '0,1,4', '市场推广', 1, '郑十', '010-66666666', 'market@company.com', 1, NOW(), NOW(), NULL);

-- ==========================================
-- 2. 角色数据 (Role)
-- ==========================================
INSERT INTO `Role` (`id`, `roleName`, `roleCode`, `description`, `enabled`, `sort`, `dataScope`, `remark`, `createTime`, `updateTime`, `deletedAt`) VALUES
(1, '超级管理员', 'admin', '系统超级管理员，拥有所有权限', 1, 1, 1, '超级管理员', NOW(), NOW(), NULL),
(2, '普通管理员', 'manager', '拥有本部门及以下数据权限', 1, 2, 3, '普通管理员', NOW(), NOW(), NULL),
(3, '部门主管', 'supervisor', '拥有本部门及以下数据权限', 1, 3, 3, '部门主管', NOW(), NOW(), NULL),
(4, '普通员工', 'user', '仅拥有本人数据权限', 1, 4, 5, '普通员工', NOW(), NOW(), NULL),
(5, '访客', 'guest', '仅拥有查看权限', 1, 5, 5, '访客', NOW(), NOW(), NULL);

-- ==========================================
-- 3. 菜单数据 (Menu)
-- ==========================================
-- 一级菜单：必须指向布局容器 /index/index
INSERT INTO `Menu` (`id`, `parentId`, `name`, `title`, `path`, `component`, `icon`, `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`, `authList`, `createTime`, `updateTime`) VALUES
(1, NULL, 'System', '系统管理', '/system', '/index/index', 'Setting', 1, 1, 1, 1, 0, 0, NULL, NOW(), NOW()),
(2, NULL, 'Business', '业务管理', '/business', '/index/index', 'Management', 1, 2, 1, 1, 0, 0, NULL, NOW(), NOW()),
(3, NULL, 'Analysis', '数据分析', '/analysis', '/index/index', 'DataAnalysis', 1, 3, 1, 1, 0, 0, NULL, NOW(), NOW()),
(4, NULL, 'Performance', '研发效能', '/performance', '/index/index', 'TrendCharts', 1, 4, 1, 1, 0, 0, NULL, NOW(), NOW());

-- 二级菜单：系统管理 (严格区分大小写，对齐 views/system)
INSERT INTO `Menu` (`id`, `parentId`, `name`, `title`, `path`, `component`, `icon`, `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`, `authList`, `createTime`, `updateTime`) VALUES
(10, 1, 'SystemUser', '用户管理', 'user', 'system/user/Index', 'User', 2, 1, 1, 1, 0, 0, NULL, NOW(), NOW()),
(11, 1, 'SystemRole', '角色管理', 'role', 'system/role/Index', 'UserFilled', 2, 2, 1, 1, 0, 0, NULL, NOW(), NOW()),
(12, 1, 'SystemMenu', '菜单管理', 'menu', 'system/menu/Index', 'Menu', 2, 3, 1, 1, 0, 0, NULL, NOW(), NOW()),
(13, 1, 'SystemOrg', '部门管理', 'organization', 'system/organization/index', 'Organization', 2, 4, 1, 1, 0, 0, NULL, NOW(), NOW()),
(14, 1, 'SystemUserCenter', '个人中心', 'user-center', 'system/user-center/index', 'Postcard', 2, 5, 1, 1, 0, 1, NULL, NOW(), NOW());

-- 二级菜单：业务管理
INSERT INTO `Menu` (`id`, `parentId`, `name`, `title`, `path`, `component`, `icon`, `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`, `authList`, `createTime`, `updateTime`) VALUES
(20, 2, 'BusinessTask', '任务管理', 'task', 'task/manager/index', 'List', 2, 1, 1, 1, 0, 0, NULL, NOW(), NOW()),
(21, 2, 'BusinessProject', '项目管理', 'project', 'project/index', 'Briefcase', 2, 2, 1, 1, 0, 0, NULL, NOW(), NOW());

-- 二级菜单：数据分析
INSERT INTO `Menu` (`id`, `parentId`, `name`, `title`, `path`, `component`, `icon`, `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`, `authList`, `createTime`, `updateTime`) VALUES
(30, 3, 'AnalysisConsole', '主控制台', 'console', 'dashboard/console/index', 'Odometer', 2, 1, 1, 1, 0, 0, NULL, NOW(), NOW()),
(31, 3, 'AnalysisMetric', '分析页', 'analysis', 'dashboard/analysis/index', 'PieChart', 2, 2, 1, 1, 0, 0, NULL, NOW(), NOW()),
(32, 3, 'AnalysisEcommerce', '电商统计', 'ecommerce', 'dashboard/ecommerce/index', 'ShoppingCart', 2, 3, 1, 1, 0, 0, NULL, NOW(), NOW());

-- 二级菜单：研发效能
INSERT INTO `Menu` (`id`, `parentId`, `name`, `title`, `path`, `component`, `icon`, `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`, `authList`, `createTime`, `updateTime`) VALUES
(40, 4, 'PerformanceMetric', '效能度量', 'metric', 'performance/index', 'DataLine', 2, 1, 1, 1, 0, 0, NULL, NOW(), NOW());

-- 按钮权限 (Type=3，挂载在对应的二级菜单下)
INSERT INTO `Menu` (`id`, `parentId`, `name`, `title`, `path`, `component`, `icon`, `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`, `authList`, `createTime`, `updateTime`) VALUES
(100, 10, NULL, '新增用户', NULL, NULL, NULL, 3, 1, 1, 1, 0, 0, '[{"authMark":"sys:user:add","title":"新增"}]', NOW(), NOW()),
(101, 10, NULL, '编辑用户', NULL, NULL, NULL, 3, 2, 1, 1, 0, 0, '[{"authMark":"sys:user:edit","title":"编辑"}]', NOW(), NOW()),
(102, 10, NULL, '删除用户', NULL, NULL, NULL, 3, 3, 1, 1, 0, 0, '[{"authMark":"sys:user:delete","title":"删除"}]', NOW(), NOW()),
(103, 10, NULL, '查看用户', NULL, NULL, NULL, 3, 4, 1, 1, 0, 0, '[{"authMark":"sys:user:view","title":"查看"}]', NOW(), NOW()),
(110, 11, NULL, '新增角色', NULL, NULL, NULL, 3, 1, 1, 1, 0, 0, '[{"authMark":"sys:role:add","title":"新增"}]', NOW(), NOW()),
(111, 11, NULL, '编辑角色', NULL, NULL, NULL, 3, 2, 1, 1, 0, 0, '[{"authMark":"sys:role:edit","title":"编辑"}]', NOW(), NOW()),
(112, 11, NULL, '删除角色', NULL, NULL, NULL, 3, 3, 1, 1, 0, 0, '[{"authMark":"sys:role:delete","title":"删除"}]', NOW(), NOW()),
(113, 11, NULL, '查看角色', NULL, NULL, NULL, 3, 4, 1, 1, 0, 0, '[{"authMark":"sys:role:view","title":"查看"}]', NOW(), NOW()),
(120, 12, NULL, '新增菜单', NULL, NULL, NULL, 3, 1, 1, 1, 0, 0, '[{"authMark":"sys:menu:add","title":"新增"}]', NOW(), NOW()),
(121, 12, NULL, '编辑菜单', NULL, NULL, NULL, 3, 2, 1, 1, 0, 0, '[{"authMark":"sys:menu:edit","title":"编辑"}]', NOW(), NOW()),
(122, 12, NULL, '删除菜单', NULL, NULL, NULL, 3, 3, 1, 1, 0, 0, '[{"authMark":"sys:menu:delete","title":"删除"}]', NOW(), NOW()),
(123, 12, NULL, '查看菜单', NULL, NULL, NULL, 3, 4, 1, 1, 0, 0, '[{"authMark":"sys:menu:view","title":"查看"}]', NOW(), NOW()),
(130, 13, NULL, '新增部门', NULL, NULL, NULL, 3, 1, 1, 1, 0, 0, '[{"authMark":"sys:dept:add","title":"新增"}]', NOW(), NOW()),
(131, 13, NULL, '编辑部门', NULL, NULL, NULL, 3, 2, 1, 1, 0, 0, '[{"authMark":"sys:dept:edit","title":"编辑"}]', NOW(), NOW()),
(132, 13, NULL, '删除部门', NULL, NULL, NULL, 3, 3, 1, 1, 0, 0, '[{"authMark":"sys:dept:delete","title":"删除"}]', NOW(), NOW()),
(133, 13, NULL, '查看部门', NULL, NULL, NULL, 3, 4, 1, 1, 0, 0, '[{"authMark":"sys:dept:view","title":"查看"}]', NOW(), NOW()),
(200, 20, NULL, '新增任务', NULL, NULL, NULL, 3, 1, 1, 1, 0, 0, '[{"authMark":"biz:task:add","title":"新增"}]', NOW(), NOW()),
(201, 20, NULL, '编辑任务', NULL, NULL, NULL, 3, 2, 1, 1, 0, 0, '[{"authMark":"biz:task:edit","title":"编辑"}]', NOW(), NOW()),
(202, 20, NULL, '删除任务', NULL, NULL, NULL, 3, 3, 1, 1, 0, 0, '[{"authMark":"biz:task:delete","title":"删除"}]', NOW(), NOW()),
(203, 20, NULL, '查看任务', NULL, NULL, NULL, 3, 4, 1, 1, 0, 0, '[{"authMark":"biz:task:view","title":"查看"}]', NOW(), NOW());

-- ==========================================
-- 4. 角色菜单关联 (_MenuToRole)
-- ==========================================
-- A=Menu.id, B=Role.id
-- admin (Role ID = 1) 拥有全部菜单与按钮权限
INSERT INTO `_MenuToRole` (`A`, `B`) VALUES
(1, 1), (2, 1), (3, 1), (4, 1),
(10, 1), (11, 1), (12, 1), (13, 1), (14, 1),
(20, 1), (21, 1),
(30, 1), (31, 1), (32, 1),
(40, 1),
(100, 1), (101, 1), (102, 1), (103, 1),
(110, 1), (111, 1), (112, 1), (113, 1),
(120, 1), (121, 1), (122, 1), (123, 1),
(130, 1), (131, 1), (132, 1), (133, 1),
(200, 1), (201, 1), (202, 1), (203, 1);

-- manager (Role ID = 2) 拥有部分权限
INSERT INTO `_MenuToRole` (`A`, `B`) VALUES
(1, 2), (2, 2), (10, 2), (11, 2), (12, 2), (13, 2), (14, 2), (20, 2), (21, 2),
(100, 2), (101, 2), (102, 2), (103, 2),
(110, 2), (111, 2), (112, 2), (113, 2),
(120, 2), (121, 2), (122, 2), (123, 2),
(130, 2), (131, 2), (132, 2), (133, 2),
(200, 2), (201, 2), (202, 2), (203, 2);

-- user (Role ID = 4) 拥有基础业务权限
INSERT INTO `_MenuToRole` (`A`, `B`) VALUES
(1, 4), (2, 4), (14, 4), (20, 4), (21, 4), (203, 4);

-- ==========================================
-- 5. 用户数据 (User)
-- ==========================================
-- 🔴 核心修复：这里的密码哈希是由明文 "123456" -> 前端 SHA-256 -> 后端 bcrypt 生成的终极可用密文
INSERT INTO `User` (`id`, `userName`, `password`, `nickName`, `userPhone`, `userEmail`, `userGender`, `status`, `remark`, `createTime`, `updateTime`, `deletedAt`) VALUES
(1, 'admin', '$2b$10$gM0Pz/vD442vX9X2j7v.QO1j7y21r5fO2p345v8T90q2uT0k9w8iS', '超级管理员', '13800000001', 'admin@company.com', '男', '1', '系统超级管理员', NOW(), NOW(), NULL),
(2, 'manager', '$2b$10$gM0Pz/vD442vX9X2j7v.QO1j7y21r5fO2p345v8T90q2uT0k9w8iS', '普通管理员', '13800000002', 'manager@company.com', '女', '1', '普通管理员', NOW(), NOW(), NULL),
(3, 'supervisor', '$2b$10$gM0Pz/vD442vX9X2j7v.QO1j7y21r5fO2p345v8T90q2uT0k9w8iS', '技术部主管', '13800000003', 'supervisor@company.com', '男', '1', '技术部主管', NOW(), NOW(), NULL),
(4, 'backend_dev', '$2b$10$gM0Pz/vD442vX9X2j7v.QO1j7y21r5fO2p345v8T90q2uT0k9w8iS', '后端开发', '13800000004', 'backend@company.com', '男', '1', '后端开发工程师', NOW(), NOW(), NULL),
(5, 'frontend_dev', '$2b$10$gM0Pz/vD442vX9X2j7v.QO1j7y21r5fO2p345v8T90q2uT0k9w8iS', '前端开发', '13800000005', 'frontend@company.com', '女', '1', '前端开发工程师', NOW(), NOW(), NULL),
(6, 'product_manager', '$2b$10$gM0Pz/vD442vX9X2j7v.QO1j7y21r5fO2p345v8T90q2uT0k9w8iS', '产品经理', '13800000006', 'product@company.com', '女', '1', '产品经理', NOW(), NOW(), NULL),
(7, 'operation_staff', '$2b$10$gM0Pz/vD442vX9X2j7v.QO1j7y21r5fO2p345v8T90q2uT0k9w8iS', '运营专员', '13800000007', 'operation@company.com', '男', '1', '运营专员', NOW(), NOW(), NULL),
(8, 'guest', '$2b$10$gM0Pz/vD442vX9X2j7v.QO1j7y21r5fO2p345v8T90q2uT0k9w8iS', '访客用户', '13800000008', 'guest@company.com', '男', '1', '访客用户', NOW(), NOW(), NULL);

-- ==========================================
-- 6. 角色用户关联 (_RoleToUser)
-- ==========================================
-- A=Role.id, B=User.id
INSERT INTO `_RoleToUser` (`A`, `B`) VALUES
(1, 1),  -- Role 1 (admin) -> User 1
(2, 2),  -- Role 2 (manager) -> User 2
(3, 3),  -- Role 3 (supervisor) -> User 3
(4, 4),  -- Role 4 (user) -> User 4
(4, 5),  -- Role 4 (user) -> User 5
(4, 6),  -- Role 4 (user) -> User 6
(4, 7),  -- Role 4 (user) -> User 7
(5, 8);  -- Role 5 (guest) -> User 8

-- ==========================================
-- 7. 用户部门关联 (DeptMember)
-- ==========================================
INSERT INTO `DeptMember` (`deptId`, `userId`, `createdAt`) VALUES
(1, 1, NOW()),  -- admin -> 总公司
(1, 2, NOW()),  -- manager -> 总公司
(2, 3, NOW()),  -- supervisor -> 技术部
(5, 4, NOW()),  -- backend_dev -> 后端团队
(6, 5, NOW()),  -- frontend_dev -> 前端团队
(7, 6, NOW()),  -- product_manager -> 产品设计
(8, 7, NOW()),  -- operation_staff -> 市场推广
(1, 8, NOW());  -- guest -> 总公司

