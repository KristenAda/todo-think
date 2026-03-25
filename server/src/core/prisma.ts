import { PrismaClient } from "@prisma/client";

// 全局单例，防止开发热重载时创建多余连接
const prisma = new PrismaClient();

export default prisma;
