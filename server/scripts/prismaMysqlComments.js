/**
 * Prisma -> MySQL 注释补丁脚本
 *
 * 背景：
 * - Prisma schema 中的 `///` 文档注释不会自动写入 MySQL 的 COMMENT
 * - 该脚本会读取 `prisma/schema/<modules>/*.prisma` 的 `///` 注释（示例：prisma/schema/system/message.prisma）
 * - 自动给最新 migration 的 `migration.sql` 的表/字段补上 COMMENT
 *
 * 使用方式（推荐）：
 * 1) prisma migrate dev --create-only
 * 2) node scripts/prismaMysqlComments.js
 * 3) prisma migrate dev
 */
const fs = require('fs');
const path = require('path');

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
    const raw = lines[i];
    const line = raw.trim();
    if (line.startsWith('///')) {
      pendingDocs.push(line.replace(/^\/\/\/\s?/, '').trim());
      continue;
    }
    if (line === '' || line.startsWith('//')) {
      continue;
    }

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

function findLatestMigrationSql(migrationsDir) {
  const dirs = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  /** @type {{file: string, mtime: number}[]} */
  const candidates = [];
  for (const dir of dirs) {
    const file = path.join(migrationsDir, dir, 'migration.sql');
    if (!fs.existsSync(file)) continue;
    const stat = fs.statSync(file);
    candidates.push({ file, mtime: stat.mtimeMs });
  }
  candidates.sort((a, b) => b.mtime - a.mtime);
  return candidates[0]?.file || null;
}

function patchMigrationSql(sqlText, tablesMeta) {
  const lines = sqlText.split(/\r?\n/);
  /** @type {string[]} */
  const patched = [];

  let currentTable = null;
  let inCreate = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const createMatch = line.match(/^CREATE TABLE `([^`]+)` \($/);
    if (createMatch) {
      currentTable = createMatch[1];
      inCreate = true;
      patched.push(line);
      continue;
    }

    if (inCreate && currentTable) {
      const colMatch = line.match(/^\s*`([^`]+)`\s+(.+?)(,?)\s*$/);
      if (colMatch) {
        const col = colMatch[1];
        const suffixComma = colMatch[3] || '';
        const meta = tablesMeta.get(currentTable);
        const comment = meta?.columns?.get(col);
        if (comment && !/COMMENT\s+'/.test(line)) {
          const escaped = escapeSqlComment(comment);
          const beforeComma = line.replace(/,?\s*$/, '');
          patched.push(`${beforeComma} COMMENT '${escaped}'${suffixComma}`);
          continue;
        }
      }

      const endMatch = line.match(/^\)\s+(.*);\s*$/);
      if (endMatch) {
        const meta = tablesMeta.get(currentTable);
        const tableComment = meta?.tableComment;
        if (tableComment && !/COMMENT=/.test(line)) {
          const escaped = escapeSqlComment(tableComment);
          const body = endMatch[1];
          patched.push(`) ${body} COMMENT='${escaped}';`);
        } else {
          patched.push(line);
        }
        inCreate = false;
        currentTable = null;
        continue;
      }
    }

    patched.push(line);
  }

  return patched.join('\n');
}

function main() {
  const serverRoot = path.resolve(__dirname, '..');
  const schemaDir = path.join(serverRoot, 'prisma', 'schema');
  const migrationsDir = path.join(schemaDir, 'migrations');

  const latestMigration = findLatestMigrationSql(migrationsDir);
  if (!latestMigration) {
    console.error('[prismaMysqlComments] 未找到 migration.sql，请先生成迁移（--create-only）');
    process.exit(1);
  }

  const prismaFiles = readAllPrismaSchemaFiles(schemaDir);
  const mergedMeta = new Map();
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

  const sql = fs.readFileSync(latestMigration, 'utf8');
  const patched = patchMigrationSql(sql, mergedMeta);
  if (patched === sql) {
    console.log('[prismaMysqlComments] 未发现可补充的 COMMENT（可能已补过或 schema 无 /// 注释）');
    return;
  }

  fs.writeFileSync(latestMigration, patched, 'utf8');
  console.log(`[prismaMysqlComments] 已补丁写入：${latestMigration}`);
}

main();

