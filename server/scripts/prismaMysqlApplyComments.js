/**
 * Prisma `///` 注释 -> MySQL COMMENT 同步脚本（直接应用到现有数据库）
 *
 * 适用场景：
 * - 仅补充/修改 Prisma schema 的 `///` 文档注释，但没有任何 model/字段结构变化
 * - 希望把注释真正写入 MySQL 的 TABLE/COLUMN COMMENT
 *
 * 快捷调用：npm run comments:apply（或 npm run db -- comments-apply）
 *
 * 原理：
 * - 解析 `prisma/schema/<modules>/*.prisma`（跳过 migrations）中的 model/字段 `///` 注释（示例：prisma/schema/system/message.prisma）
 * - 读取 information_schema 获取当前列定义（column_type、null/default/extra）
 * - 生成并执行：
 *   - ALTER TABLE `t` MODIFY COLUMN `c` <原列定义> COMMENT '...';
 *   - ALTER TABLE `t` COMMENT='...';
 *
 * 注意：
 * - 需要环境变量 DATABASE_URL（与 Prisma datasource 一致）
 * - 仅对存在于数据库中的表/列生效；不存在会跳过并提示
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv/config');

function escapeSqlComment(text) {
  return String(text || '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/'/g, "''");
}

function readAllPrismaSchemaFiles(schemaDir) {
  /** @type {string[]} */
  const files = [];
  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === 'migrations') continue;
        walk(p);
      } else if (e.isFile() && e.name.endsWith('.prisma')) {
        files.push(p);
      }
    }
  };
  walk(schemaDir);
  return files;
}

function parsePrismaDocs(schemaText) {
  const tables = new Map();
  const lines = schemaText.split(/\r?\n/);

  /** @type {string[]} */
  let pendingDocs = [];
  let currentModel = null;
  let inModel = false;

  const flushPendingDoc = () => {
    if (pendingDocs.length === 0) return '';
    const doc = pendingDocs.join(' ').trim();
    pendingDocs = [];
    return doc;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('///')) {
      pendingDocs.push(line.replace(/^\/\/\/\s?/, '').trim());
      continue;
    }
    if (line === '' || line.startsWith('//')) continue;

    const modelMatch = line.match(/^model\s+([A-Za-z0-9_]+)\s*\{\s*$/);
    if (modelMatch) {
      const modelName = modelMatch[1];
      const tableComment = flushPendingDoc();
      currentModel = {
        modelName,
        tableName: null,
        tableComment: tableComment || undefined,
        columns: new Map()
      };
      inModel = true;
      continue;
    }

    if (inModel && line.startsWith('@@map(')) {
      const m = line.match(/^@@map\("([^"]+)"\)/);
      if (m && currentModel) currentModel.tableName = m[1];
      continue;
    }

    if (inModel && line.startsWith('}')) {
      if (currentModel) {
        const tableName = currentModel.tableName || currentModel.modelName;
        const existing = tables.get(tableName) || { columns: new Map() };
        if (currentModel.tableComment) existing.tableComment = currentModel.tableComment;
        for (const [k, v] of currentModel.columns.entries()) {
          if (v) existing.columns.set(k, v);
        }
        tables.set(tableName, existing);
      }
      currentModel = null;
      inModel = false;
      pendingDocs = [];
      continue;
    }

    if (inModel && currentModel) {
      const fieldMatch = line.match(/^([A-Za-z0-9_]+)\s+([A-Za-z0-9_]+)(\??)\s*(.*)$/);
      if (!fieldMatch) continue;
      const fieldName = fieldMatch[1];
      const rest = fieldMatch[4] || '';
      // 关系字段不对应真实列（例如：sender User? @relation(...)）
      if (rest.includes('@relation')) {
        flushPendingDoc();
        continue;
      }
      const colMap = rest.match(/@map\("([^"]+)"\)/);
      const columnName = colMap ? colMap[1] : fieldName;
      const colComment = flushPendingDoc();
      if (colComment) currentModel.columns.set(columnName, colComment);
      continue;
    }

    pendingDocs = [];
  }

  return { tables };
}

function parseDatabaseUrl(databaseUrl) {
  const u = new URL(databaseUrl);
  const user = decodeURIComponent(u.username || '');
  const password = decodeURIComponent(u.password || '');
  const host = u.hostname;
  const port = u.port ? Number(u.port) : 3306;
  const database = u.pathname.replace(/^\//, '');
  return { user, password, host, port, database };
}

function normalizeExtraSql(extraRaw) {
  const extra = String(extraRaw || '').trim();
  if (!extra) return '';

  // MySQL information_schema.EXTRA 可能包含 DEFAULT_GENERATED 等内部标记，不能直接拼进 DDL
  // 我们只保留 DDL 里合法且常见的 extra 片段
  const lower = extra.toLowerCase();

  if (lower.includes('auto_increment')) return 'AUTO_INCREMENT';

  // 兼容 ON UPDATE CURRENT_TIMESTAMP(3)
  if (lower.startsWith('on update')) return extra;

  // 生成列等复杂场景（generated）需要更完整定义，这里保守不处理，避免改坏列
  if (lower.includes('generated')) return '';

  return '';
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[prismaMysqlApplyComments] 缺少 DATABASE_URL，请先配置后再执行');
    process.exit(1);
  }

  const serverRoot = path.resolve(__dirname, '..');
  const schemaDir = path.join(serverRoot, 'prisma', 'schema');
  const prismaFiles = readAllPrismaSchemaFiles(schemaDir);

  const mergedMeta = new Map(); // tableName -> { tableComment, columns(Map) }
  for (const f of prismaFiles) {
    const text = fs.readFileSync(f, 'utf8');
    const { tables } = parsePrismaDocs(text);
    for (const [tableName, meta] of tables.entries()) {
      const existing = mergedMeta.get(tableName) || { columns: new Map() };
      if (meta.tableComment) existing.tableComment = meta.tableComment;
      for (const [col, cmt] of meta.columns.entries()) existing.columns.set(col, cmt);
      mergedMeta.set(tableName, existing);
    }
  }

  const connInfo = parseDatabaseUrl(databaseUrl);
  const connection = await mysql.createConnection({
    host: connInfo.host,
    port: connInfo.port,
    user: connInfo.user,
    password: connInfo.password,
    database: connInfo.database,
    multipleStatements: false
  });

  let changedTableCount = 0;
  let changedColumnCount = 0;

  try {
    for (const [tableName, meta] of mergedMeta.entries()) {
      // 1) 表注释
      if (meta.tableComment) {
        const [rows] = await connection.execute(
          `
          SELECT TABLE_COMMENT AS tableComment
          FROM information_schema.TABLES
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
          `,
          [connInfo.database, tableName]
        );
        const current = rows && rows[0] ? String(rows[0].tableComment ?? '') : null;
        if (current == null) {
          console.warn(`[prismaMysqlApplyComments] 表不存在，跳过：${tableName}`);
        } else {
          const desired = meta.tableComment;
          if (desired && desired !== current) {
            const escaped = escapeSqlComment(desired);
            await connection.execute(`ALTER TABLE \`${tableName}\` COMMENT='${escaped}'`);
            changedTableCount += 1;
          }
        }
      }

      // 2) 列注释
      for (const [columnName, comment] of meta.columns.entries()) {
        if (!comment) continue;
        const [colRows] = await connection.execute(
          `
          SELECT
            COLUMN_TYPE AS columnType,
            IS_NULLABLE AS isNullable,
            COLUMN_DEFAULT AS columnDefault,
            EXTRA AS extra,
            COLUMN_COMMENT AS columnComment
          FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
          `,
          [connInfo.database, tableName, columnName]
        );
        if (!colRows || !colRows[0]) {
          console.warn(
            `[prismaMysqlApplyComments] 列不存在，跳过：${tableName}.${columnName}`
          );
          continue;
        }

        const row = colRows[0];
        const currentComment = String(row.columnComment ?? '');
        if (currentComment === comment) continue;

        const columnType = String(row.columnType);
        const isNullable = String(row.isNullable) === 'YES';
        const extraSql = normalizeExtraSql(row.extra);

        // 默认值拼接：注意 CURRENT_TIMESTAMP / 数字 / 字符串
        let defaultSql = '';
        if (row.columnDefault !== null && row.columnDefault !== undefined) {
          const def = row.columnDefault;
          const defStr = String(def);
          const upper = defStr.toUpperCase();
          const isFuncLike =
            upper.includes('CURRENT_TIMESTAMP') || upper.includes('NOW()') || upper.includes('UUID(');
          const isNumber = /^-?\d+(\.\d+)?$/.test(defStr);
          if (isFuncLike || isNumber) {
            defaultSql = ` DEFAULT ${defStr}`;
          } else {
            defaultSql = ` DEFAULT '${escapeSqlComment(defStr)}'`;
          }
        }

        const nullSql = isNullable ? ' NULL' : ' NOT NULL';
        const escapedComment = escapeSqlComment(comment);

        // MODIFY COLUMN 需要完整列定义
        const alterSql =
          `ALTER TABLE \`${tableName}\` ` +
          `MODIFY COLUMN \`${columnName}\` ${columnType}${nullSql}${defaultSql}${extraSql} ` +
          `COMMENT '${escapedComment}'`;

        await connection.execute(alterSql);
        changedColumnCount += 1;
      }
    }
  } finally {
    await connection.end();
  }

  console.log(
    `[prismaMysqlApplyComments] 完成：更新表注释 ${changedTableCount} 个，更新列注释 ${changedColumnCount} 个`
  );
}

main().catch((e) => {
  console.error('[prismaMysqlApplyComments] 执行失败：', e);
  process.exit(1);
});

