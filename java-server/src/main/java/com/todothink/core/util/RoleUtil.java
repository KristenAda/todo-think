package com.todothink.core.util;

import java.util.Arrays;
import java.util.List;

/**
 * 对齐 server/src/utils/role.util.ts
 */
public final class RoleUtil {

    private static final List<String> SUPER_ADMIN_CODES = Arrays.asList("admin", "R_SUPER", "R_ADMIN");

    private RoleUtil() {
    }

    public static boolean isSuperAdminRoles(List<String> roles) {
        if (roles == null || roles.isEmpty()) {
            return false;
        }
        for (String role : roles) {
            if (SUPER_ADMIN_CODES.contains(role)) {
                return true;
            }
        }
        return false;
    }
}
