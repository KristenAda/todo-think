#!/usr/bin/env node
/**
 * 生成 snake_case 迁移 SQL（RENAME TABLE + CHANGE COLUMN）
 * 用法: node scripts/generate-snake-case-migration.cjs
 */
const fs = require("fs");
const path = require("path");
const map = require("./snake-case-db-map.cjs");

const outDir = path.join(__dirname, "../prisma/schema/migrations/20260623120000_snake_case_columns");
const outFile = path.join(outDir, "migration.sql");

const lines = [
  "-- 全库物理表/列统一 snake_case（保留 Prisma 隐式 M:N 表 _RoleToUser 等）",
  "SET FOREIGN_KEY_CHECKS = 0;",
  "",
];

for (const [oldName, newName] of map.tableRenames) {
  lines.push(`RENAME TABLE \`${oldName}\` TO \`${newName}\`;`);
}
lines.push("");

for (const [table, cols] of Object.entries(map.columnRenamesByTable)) {
  for (const [oldCol, newCol] of Object.entries(cols)) {
    if (oldCol === newCol) continue;
    lines.push(
      `ALTER TABLE \`${table}\` CHANGE COLUMN \`${oldCol}\` \`${newCol}\` ${getColumnTypePlaceholder(table, oldCol)};`,
    );
  }
}

lines.push("");
lines.push("SET FOREIGN_KEY_CHECKS = 1;");

/** MySQL CHANGE COLUMN 需要完整类型；用 SHOW CREATE 不现实，迁移用 MODIFY 仅改名在 8.0+ 可用 RENAME COLUMN */
function getColumnTypePlaceholder(table, col) {
  // MySQL 8.0+ 支持 RENAME COLUMN - simpler!
  return null;
}

// Rewrite using RENAME COLUMN (MySQL 8.0+)
const lines2 = [
  "-- 全库物理表/列统一 snake_case",
  "SET FOREIGN_KEY_CHECKS = 0;",
  "",
];

for (const [oldName, newName] of map.tableRenames) {
  lines2.push(`RENAME TABLE \`${oldName}\` TO \`${newName}\`;`);
}
lines2.push("");

for (const [table, cols] of Object.entries(map.columnRenamesByTable)) {
  for (const [oldCol, newCol] of Object.entries(cols)) {
    if (oldCol === newCol) continue;
    lines2.push(`ALTER TABLE \`${table}\` RENAME COLUMN \`${oldCol}\` TO \`${newCol}\`;`);
  }
}

lines2.push("");
lines2.push("SET FOREIGN_KEY_CHECKS = 1;");

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, lines2.join("\n") + "\n", "utf8");
console.log("Wrote", outFile);
