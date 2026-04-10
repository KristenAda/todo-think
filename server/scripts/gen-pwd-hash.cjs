/**
 * 生成与登录一致的密码存库哈希：bcrypt( SHA256(明文) 的 hex )
 * 用法：node scripts/gen-pwd-hash.cjs
 */
const bcrypt = require("bcryptjs");
const sha256Of123456 =
  "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92";
const h = bcrypt.hashSync(sha256Of123456, 10);
console.log("hash:", h);
console.log("ok:", bcrypt.compareSync(sha256Of123456, h));
