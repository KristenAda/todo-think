import { useAuthorityStore } from '@/stores/authority';

/**
 * 检查权限
 * @param code 操作code
 * @returns
 */
export const checkMenuPermission = <T>(code: T) => {
  const useAuthority = useAuthorityStore();

  const userPermission = useAuthority.originalFunctionList.some(
    (f) => f.menuCode === code,
  );
  return userPermission;
};
