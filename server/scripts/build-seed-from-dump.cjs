/**
 * 从 Navicat 全库导出（prisma/seed/todo_think_db.sql）提取 INSERT，生成 prisma/seed.sql
 *
 * - 排除：_prisma_migrations、message、upload_session（运行时/噪声或体积）
 * - user 行：去掉 data:image... base64，改为 NULL，避免种子文件过大
 * - 菜单：修正一级「系统管理」type=1、工作台 path=/dashboard、积分记录 component 与迁移表名一致（Menu/User/...）
 *
 * 用法：在 server 目录执行
 *   node scripts/build-seed-from-dump.cjs
 */

const fs = require("fs");
const readline = require("readline");
const path = require("path");

const SERVER_ROOT = path.resolve(__dirname, "..");
const DUMP_PATH = path.join(SERVER_ROOT, "prisma", "seed", "todo_think_db.sql");
const OUT_PATH = path.join(SERVER_ROOT, "prisma", "seed.sql");

/** 导出里小写表名 -> Prisma 迁移中的表名（与 FK 一致） */
const TABLE_RENAME = {
  department: "Department",
  deptmember: "DeptMember",
  deptmanager: "DeptManager",
  menu: "Menu",
  role: "Role",
  user: "User",
  _menutorole: "_MenuToRole",
  _roletouser: "_RoleToUser",
};

const SKIP_TABLES = new Set([
  "_prisma_migrations",
  "message",
  "upload_session",
]);

/** 按依赖大致排序（FK_CHECKS=0 仍建议有序） */
const TABLE_ORDER = [
  "department",
  "role",
  "menu",
  "user",
  "deptmanager",
  "deptmember",
  "_menutorole",
  "_roletouser",
  "attachment",
  "project",
  "project_task_rule",
  "rule_set",
  "rule_set_version",
  "rule_variable",
  "rule_execution",
  "task",
  "task_attachment",
  "task_co_assignee",
  "task_comment",
  "task_comment_attachment",
  "task_timeline",
  "test_case",
  "todo",
  "points_account",
  "points_ledger_entry",
  "perf_settlement",
  "perf_item",
  "work_log",
  "work_log_attachment",
];

function renameTableInInsert(line) {
  const m = line.match(/^INSERT INTO `([^`]+)`/i);
  if (!m) return line;
  const low = m[1].toLowerCase();
  const mapped = TABLE_RENAME[low];
  if (!mapped) return line;
  return line.replace(/^INSERT INTO `[^`]+`/i, `INSERT INTO \`${mapped}\``);
}

/**
 * 将 `,'data:image...'` / `, 'data:image...'` 整段替换为 ,NULL（兼容 '' 转义）
 */
function nullOutDataImageFields(sql) {
  let i = 0;
  let out = "";
  const re = /,\s*'data:image/g;
  while (i < sql.length) {
    re.lastIndex = i;
    const m = re.exec(sql);
    if (!m) {
      out += sql.slice(i);
      break;
    }
    out += sql.slice(i, m.index + 1);
    let j = m.index + m[0].length;
    while (j < sql.length) {
      const ch = sql[j];
      if (ch === "'") {
        if (sql[j + 1] === "'") {
          j += 2;
          continue;
        }
        j += 1;
        break;
      }
      j += 1;
    }
    out += " NULL";
    i = j;
  }
  return out;
}

function sanitizeUserLine(line) {
  if (!/^INSERT INTO `user`/i.test(line)) return line;
  let s = nullOutDataImageFields(line);
  s = s.replace(/INSERT INTO `user`/i, "INSERT INTO `User`");
  return s;
}

function sanitizeMenuLine(line) {
  if (!/^INSERT INTO `menu`/i.test(line)) return line;
  let s = line.replace(/^INSERT INTO `menu`/i, "INSERT INTO `Menu`");
  // 系统管理一级：type 应为 1（目录）；图标与现网一致
  s = s.replace(
    /\(1, NULL, 'System', '系统管理', '\/system', '\/index\/index', 'ri:user-3-line', 2,/,
    "(1, NULL, 'System', '系统管理', '/system', '/index/index', 'ri:settings-3-line', 1,",
  );
  // 工作台：与前端 /dashboard 一致；一级目录 type=1
  s = s.replace(
    /\(3, NULL, 'Analysis', '数据分析', '\/analysis',/,
    "(3, NULL, 'Dashboard', '工作台', '/dashboard',",
  );
  s = s.replace(
    /\(3, NULL, 'Dashboard', '工作台', '\/dashboard', '\/index\/index', 'mdi:chart-box-outline', 2,/,
    "(3, NULL, 'Dashboard', '工作台', '/dashboard', '/index/index', 'ri:pie-chart-line', 1,",
  );
  // 积分记录组件路径（与其它菜单一致，无前导 /）
  s = s.replace(
    /'\/system\/points-ledger\/index'/,
    "'system/points-ledger/index'",
  );
  return s;
}

async function main() {
  if (!fs.existsSync(DUMP_PATH)) {
    console.error(`[build-seed] 找不到导出文件: ${DUMP_PATH}`);
    process.exit(1);
  }

  const buckets = Object.fromEntries(TABLE_ORDER.map((k) => [k, []]));

  const rl = readline.createInterface({
    input: fs.createReadStream(DUMP_PATH, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("INSERT INTO `")) continue;
    const m = trimmed.match(/^INSERT INTO `([^`]+)`/i);
    if (!m) continue;
    const tLower = m[1].toLowerCase();
    if (SKIP_TABLES.has(tLower)) continue;
    if (!TABLE_ORDER.includes(tLower)) continue;

    let out = trimmed;
    if (tLower === "user") out = sanitizeUserLine(out);
    else if (tLower === "menu") out = sanitizeMenuLine(out);
    else out = renameTableInInsert(out);

    buckets[tLower].push(out);
  }

  const parts = [];
  parts.push(
    "-- ==========================================",
    "-- Todo-Think 种子数据（由 scripts/build-seed-from-dump.cjs 从 prisma/seed/todo_think_db.sql 生成）",
    "-- 重新生成：npm run db -- seed-build（在 server 目录）",
    "-- 说明：admin~guest（id 1~8）密码与 AuthUtil 一致（明文 123456）；perfadmin01/rulesadmin01/lenglin 为导出时密码",
    "-- 排除：站内 message、upload_session、_prisma_migrations；User.avatar 大图片已置 NULL",
    "-- ==========================================",
    "",
    "SET NAMES utf8mb4;",
    "SET FOREIGN_KEY_CHECKS = 0;",
    "",
  );

  for (const t of TABLE_ORDER) {
    const rows = buckets[t];
    if (!rows.length) continue;
    parts.push(`-- ---------- ${TABLE_RENAME[t] || t} ----------`);
    parts.push(...rows);
    parts.push("");
  }

  parts.push("SET FOREIGN_KEY_CHECKS = 1;", "");

  fs.writeFileSync(OUT_PATH, parts.join("\n"), "utf8");
  console.log(
    `[build-seed] 已写入 ${OUT_PATH}（表块数: ${TABLE_ORDER.filter((t) => buckets[t].length).length}）`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
