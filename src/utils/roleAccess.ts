// utils/roleAccess.ts
import { supabase } from "@/lib/supabase";

export type UserRole =
  | "super_admin"
  | "admin"
  | "driver"
  | "employee"
  | "supplier"
  | "customer"
  | "viewer"
  | "warehouse_manager"
  | "accounting_manager"
  | "customs_specialist"
  | "accounting_staff"
  | "warehouse_staff";

export interface RolePermissions {
  canViewUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canVerifyDocuments: boolean;
  canViewAuditLogs: boolean;
  canManageRoles: boolean;
  canAccessAdminPanel: boolean;
}

const rolePermissionsMap: Record<string, RolePermissions> = {
  super_admin: {
    canViewUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canVerifyDocuments: true,
    canViewAuditLogs: true,
    canManageRoles: true,
    canAccessAdminPanel: true,
  },
  admin: {
    canViewUsers: true,
    canEditUsers: true,
    canDeleteUsers: false,
    canVerifyDocuments: true,
    canViewAuditLogs: true,
    canManageRoles: false,
    canAccessAdminPanel: true,
  },
  warehouse_manager: {
    canViewUsers: true,
    canEditUsers: true,
    canDeleteUsers: false,
    canVerifyDocuments: false,
    canViewAuditLogs: false,
    canManageRoles: false,
    canAccessAdminPanel: false,
  },
  accounting_manager: {
    canViewUsers: true,
    canEditUsers: true,
    canDeleteUsers: false,
    canVerifyDocuments: false,
    canViewAuditLogs: false,
    canManageRoles: false,
    canAccessAdminPanel: false,
  },
  driver: {
    canViewUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canVerifyDocuments: false,
    canViewAuditLogs: false,
    canManageRoles: false,
    canAccessAdminPanel: false,
  },
  employee: {
    canViewUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canVerifyDocuments: false,
    canViewAuditLogs: false,
    canManageRoles: false,
    canAccessAdminPanel: false,
  },
  supplier: {
    canViewUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canVerifyDocuments: false,
    canViewAuditLogs: false,
    canManageRoles: false,
    canAccessAdminPanel: false,
  },
  customer: {
    canViewUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canVerifyDocuments: false,
    canViewAuditLogs: false,
    canManageRoles: false,
    canAccessAdminPanel: false,
  },
  viewer: {
    canViewUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canVerifyDocuments: false,
    canViewAuditLogs: false,
    canManageRoles: false,
    canAccessAdminPanel: false,
  },
};

/**
 * Get permissions for a specific role
 */
export const getRolePermissions = (role: string): RolePermissions => {
  return rolePermissionsMap[role] || rolePermissionsMap.viewer;
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (
  role: string,
  permission: keyof RolePermissions,
): boolean => {
  const permissions = getRolePermissions(role);
  return permissions[permission];
};

/**
 * Check if user is admin (super_admin or admin)
 */
export const isAdmin = (role: string): boolean => {
  return role === "super_admin" || role === "admin";
};

/**
 * Get current user's role from database
 */
export const getCurrentUserRole = async (): Promise<string | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || !data) return null;
    return data.role;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
};

/**
 * Check if current user can access admin panel
 */
export const canAccessAdminPanel = async (): Promise<boolean> => {
  const role = await getCurrentUserRole();
  if (!role) return false;
  return getRolePermissions(role).canAccessAdminPanel;
};

/**
 * Require admin access (throws error if not admin)
 */
export const requireAdmin = async (): Promise<void> => {
  const role = await getCurrentUserRole();
  if (!role || !isAdmin(role)) {
    throw new Error("Unauthorized: Admin access required");
  }
};

/**
 * Log audit event
 */
export const logAuditEvent = async (
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, any>,
): Promise<void> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
    });
  } catch (error) {
    console.error("Error logging audit event:", error);
  }
};

// Legacy exports for backward compatibility
export const CAN_EDIT_ROLES = [
  "super_admin",
  "warehouse_manager",
  "accounting_manager",
  "accounting_staff",
];

export const CAN_DELETE_ROLES = [
  "super_admin",
  "warehouse_manager",
  "accounting_manager",
];

export const CAN_VIEW_ROLES = [
  "super_admin",
  "warehouse_manager",
  "accounting_staff",
];

export function canEdit(role: string | null) {
  return CAN_EDIT_ROLES.includes(role || "");
}

export function canDelete(role: string | null) {
  return CAN_DELETE_ROLES.includes(role || "");
}

export function canView(role: string | null) {
  return CAN_VIEW_ROLES.includes(role || "");
}

export const CAN_CLICK_ROLES = [
  "super_admin",
  "warehouse_manager",
  "accounting_manager",
  "customs_specialist",
  "accounting_staff",
  "warehouse_staff",
];

export function canClick(role: string | null) {
  return CAN_CLICK_ROLES.includes(role || "");
}

// Roles yang bisa approve purchase request
export const CAN_APPROVE_PR_ROLES = [
  "super_admin",
  "accounting_manager",
  "warehouse_manager",
];

export function canApprovePR(role: string | null) {
  return CAN_APPROVE_PR_ROLES.includes(role || "");
}

// Roles yang bisa complete purchase request
export const CAN_COMPLETE_PR_ROLES = [
  "super_admin",
  "warehouse_manager",
  "warehouse_staff",
];

export function canCompletePR(role: string | null) {
  return CAN_COMPLETE_PR_ROLES.includes(role || "");
}
