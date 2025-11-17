/**
 * Storage Keys Constants
 *
 * Centralized, type-safe constants for localStorage and sessionStorage keys.
 * This prevents typos and makes it easier to track what's stored where.
 */

/**
 * SessionStorage Keys
 *
 * Used for tab-specific data that should not persist across browser restarts.
 */
export const SESSION_STORAGE_KEYS = {
  /**
   * Flag indicating a super admin is explicitly viewing a tenant
   * Set via URL parameter ?superAdminViewing=true
   * Cleared when tab closes
   */
  SUPER_ADMIN_VIEWING: 'superAdminViewingTenant',
} as const;

/**
 * LocalStorage Keys
 *
 * Used for persistent data that should survive browser restarts.
 */
export const LOCAL_STORAGE_KEYS = {
  /**
   * User preference for theme (light/dark mode)
   */
  THEME: 'theme',

  /**
   * Last selected tenant for multi-tenant users
   */
  LAST_TENANT: 'lastTenantId',
} as const;

/**
 * Helper type to ensure type safety when accessing storage
 */
export type SessionStorageKey = typeof SESSION_STORAGE_KEYS[keyof typeof SESSION_STORAGE_KEYS];
export type LocalStorageKey = typeof LOCAL_STORAGE_KEYS[keyof typeof LOCAL_STORAGE_KEYS];
