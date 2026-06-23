#!/usr/bin/env node
/**
 * 批量将 seed SQL 中的表名/列名替换为 snake_case
 * 用法: node scripts/patch-seed-snake-case.cjs
 */
const fs = require("fs");
const path = require("path");
const { patchSql } = require("./sql-snake-case-patch.cjs");

const SEED_FILES = [
  "prisma/seed.sql",
  "prisma/seed/todo_think_db.sql",
  "prisma/seed/todo_think_test_seed.sql",
  "prisma/seed/menu_seed.sql",
  "prisma/seed/fix_password_123456.sql",
  "prisma/seed/attachment_tables.sql",
];

const root = path.join(__dirname, "..");
let count = 0;
for (const rel of SEED_FILES) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    console.warn("skip (missing):", rel);
    continue;
  }
  const before = fs.readFileSync(file, "utf8");
  const after = patchSql(before);
  if (before !== after) {
    fs.writeFileSync(file, after, "utf8");
    count++;
    console.log("patched:", rel);
  } else {
    console.log("unchanged:", rel);
  }
}

console.log(`Done. ${count} file(s) updated.`);
