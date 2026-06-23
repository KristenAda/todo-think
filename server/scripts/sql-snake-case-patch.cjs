/**
 * 将 SQL 文本中的表名/列名替换为 snake_case
 */
const map = require("./snake-case-db-map.cjs");

function patchSql(content) {
  let s = content;

  for (const [oldName, newName] of map.tableRenames) {
    const patterns = [
      new RegExp(`\`${oldName}\``, "g"),
      new RegExp(`INSERT INTO ${oldName}\\b`, "gi"),
      new RegExp(`FROM ${oldName}\\b`, "gi"),
      new RegExp(`INTO ${oldName}\\b`, "gi"),
      new RegExp(`TABLE ${oldName}\\b`, "gi"),
      new RegExp(`REFERENCES \`${oldName}\``, "g"),
      new RegExp(`UPDATE ${oldName}\\b`, "gi"),
      new RegExp(`DELETE FROM ${oldName}\\b`, "gi"),
    ];
    for (const re of patterns) {
      s = s.replace(re, (m) => m.replace(oldName, newName));
    }
  }

  const colPairs = [...map.globalColumnReplacements].sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [oldCol, newCol] of colPairs) {
    s = s.replace(new RegExp(`\`${oldCol}\``, "g"), `\`${newCol}\``);
  }

  return s;
}

module.exports = { patchSql };
