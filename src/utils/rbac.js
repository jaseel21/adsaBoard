/**
 * ADSA T-Board Role-Based Access Control (RBAC) System
 * Provides multi-tier permission evaluation, role definitions, and route-mapping helpers.
 */

export const ROLES = {
  SUPER_ADMIN: 'developer', // Canonical Super Admin identifier matching Firestore rules
  DEVELOPER: 'developer',
  CENTRAL_COMMITTEE: 'central_committee',
  CANTEEN_COMMITTEE: 'canteen_committee',
  COOK: 'cook',
  STUDENT: 'student',
};

export const ROLE_LABELS = {
  [ROLES.DEVELOPER]: 'Super Admin / Developer',
  [ROLES.CENTRAL_COMMITTEE]: 'ADSA Central Committee',
  [ROLES.CANTEEN_COMMITTEE]: 'Canteen Sub-Committee',
  [ROLES.COOK]: 'Kitchen Staff / Cook',
  [ROLES.STUDENT]: 'Student',
};

export const ROLE_BADGES = {
  [ROLES.DEVELOPER]: {
    label: 'Super Admin',
    fullLabel: 'System Architect & Super Admin',
    color: 'purple',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-600/40',
  },
  [ROLES.CENTRAL_COMMITTEE]: {
    label: 'Central Admin',
    fullLabel: 'ADSA Central Committee',
    color: 'emerald',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-600/40',
  },
  [ROLES.CANTEEN_COMMITTEE]: {
    label: 'Canteen Officer',
    fullLabel: 'Canteen Sub-Committee',
    color: 'blue',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-600/40',
  },
  [ROLES.COOK]: {
    label: 'Kitchen Chef',
    fullLabel: 'Canteen Kitchen Staff',
    color: 'amber',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-600/40',
  },
  [ROLES.STUDENT]: {
    label: 'Student',
    fullLabel: 'Student Dining Member',
    color: 'teal',
    badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border-teal-300 dark:border-teal-600/40',
  },
};

export const PERMISSIONS = {
  // Student Data
  MANAGE_STUDENTS: 'manage_students',
  DELETE_STUDENTS: 'delete_students',
  RESET_PASSWORDS: 'reset_passwords',
  CSV_IMPORT_EXPORT: 'csv_import_export',

  // Board & System Control
  MANAGE_LOCKS: 'manage_locks',
  EMERGENCY_OVERRIDE: 'emergency_override',
  MANAGE_STAFF: 'manage_staff',
  VIEW_AUDIT_LOGS: 'view_audit_logs',

  // Menu & Catering
  MANAGE_MENU: 'manage_menu',
  MANAGE_DIETARY: 'manage_dietary',
  VIEW_KITCHEN_KDS: 'view_kitchen_kds',
  PRINT_KITCHEN_SHEET: 'print_kitchen_sheet',

  // Canteen Operational Token Controls
  VIEW_TOKENS: 'view_tokens',
  MANAGE_CANTEEN_TOKENS: 'manage_canteen_tokens',
  BLOCK_TOKENS: 'block_tokens',

  // Student Self-Service
  UPDATE_OWN_TOKEN: 'update_own_token',
};

// Role to Permission Matrix
const ROLE_PERMISSIONS = {
  [ROLES.DEVELOPER]: Object.values(PERMISSIONS),

  [ROLES.CENTRAL_COMMITTEE]: [
    PERMISSIONS.MANAGE_STUDENTS,
    PERMISSIONS.DELETE_STUDENTS,
    PERMISSIONS.RESET_PASSWORDS,
    PERMISSIONS.CSV_IMPORT_EXPORT,
    PERMISSIONS.MANAGE_LOCKS,
    PERMISSIONS.EMERGENCY_OVERRIDE,
    PERMISSIONS.MANAGE_STAFF,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.MANAGE_MENU,
    PERMISSIONS.MANAGE_DIETARY,
    PERMISSIONS.VIEW_KITCHEN_KDS,
    PERMISSIONS.PRINT_KITCHEN_SHEET,
    PERMISSIONS.VIEW_TOKENS,
    PERMISSIONS.MANAGE_CANTEEN_TOKENS,
    PERMISSIONS.BLOCK_TOKENS,
  ],

  [ROLES.CANTEEN_COMMITTEE]: [
    PERMISSIONS.VIEW_TOKENS,
    PERMISSIONS.MANAGE_CANTEEN_TOKENS,
    PERMISSIONS.BLOCK_TOKENS,
    PERMISSIONS.MANAGE_MENU,
    PERMISSIONS.MANAGE_DIETARY,
    PERMISSIONS.VIEW_KITCHEN_KDS,
    PERMISSIONS.PRINT_KITCHEN_SHEET,
  ],

  [ROLES.COOK]: [
    PERMISSIONS.VIEW_KITCHEN_KDS,
    PERMISSIONS.PRINT_KITCHEN_SHEET,
  ],

  [ROLES.STUDENT]: [
    PERMISSIONS.UPDATE_OWN_TOKEN,
  ],
};

/**
 * Check if a role possesses a specific permission
 */
export function hasPermission(role, permission) {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a user's role satisfies any of the required allowed roles
 */
export function hasRole(userRole, allowedRoles = []) {
  if (!userRole) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  // Developers always satisfy any staff role check
  if (userRole === ROLES.DEVELOPER) return true;
  return allowedRoles.includes(userRole);
}

/**
 * Get primary landing/home route for a given role
 */
export function getRoleHomeRoute(role) {
  switch (role) {
    case ROLES.COOK:
      return '/kitchen';
    case ROLES.CANTEEN_COMMITTEE:
    case ROLES.CENTRAL_COMMITTEE:
    case ROLES.DEVELOPER:
      return '/admin';
    case ROLES.STUDENT:
      return '/student';
    default:
      return null;
  }
}

/**
 * Get role badge styling and label
 */
export function getRoleBadgeInfo(role) {
  return (
    ROLE_BADGES[role] || {
      label: role || 'Staff',
      fullLabel: 'Authorized Staff',
      color: 'gray',
      badgeClass: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300 border-gray-300 dark:border-white/20',
    }
  );
}

/**
 * Check if a given role is Super Admin / Developer
 */
export function isSuperAdminRole(role) {
  return role === ROLES.DEVELOPER || role === ROLES.SUPER_ADMIN;
}

/**
 * Fallback default role assignment for unprovisioned staff accounts.
 * Returns null to enforce a strict fail-secure security model.
 * (All authentic role resolution is loaded dynamically from Firestore staff_users)
 */
export function resolveDefaultRoleByEmail() {
  return null;
}
