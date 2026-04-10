/**
 * 与登录 JWT 中 roles 字段一致：来自 Role.roleCode（如 admin），
 * 兼容模板里使用的 R_SUPER / R_ADMIN 等标识。
 */
export function isSuperAdminRoles(roles: string[] | undefined | null): boolean {
  if (!roles?.length) return false;
  return (
    roles.includes("admin") ||
    roles.includes("R_SUPER") ||
    roles.includes("R_ADMIN")
  );
}
