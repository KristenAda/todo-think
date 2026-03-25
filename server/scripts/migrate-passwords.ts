/**
 * 密码迁移脚本
 * 将数据库中所有用户密码重置为 bcrypt(sha256("123456"))
 * 原因：前端登录改为传输 sha256(明文)，旧密码格式 bcrypt(明文) 无法兼容
 *
 * 执行方式：npx tsx scripts/migrate-passwords.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "123456";

async function main() {
  // sha256(明文) 再 bcrypt
  const sha256 = createHash("sha256").update(DEFAULT_PASSWORD).digest("hex");
  const newHash = bcrypt.hashSync(sha256, 10);

  const users = await prisma.user.findMany({ select: { id: true, userName: true } });
  console.log(`共找到 ${users.length} 个用户，开始重置密码...`);

  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: newHash },
    });
    console.log(`  ✓ 用户 [${user.userName}] 密码已重置为 ${DEFAULT_PASSWORD}`);
  }

  console.log("\n迁移完成！所有用户密码已重置为：" + DEFAULT_PASSWORD);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
