import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  SESSION_STORAGE_KEYS,
  LOCAL_STORAGE_KEYS,
  SessionStorageKey,
  LocalStorageKey,
} from '../storage';

// Mock browser storage APIs for Node environment
const createStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
};

global.sessionStorage = createStorageMock() as Storage;
global.localStorage = createStorageMock() as Storage;

describe('Storage Constants', () => {
  describe('SESSION_STORAGE_KEYS', () => {
    it('should have SUPER_ADMIN_VIEWING key', () => {
      expect(SESSION_STORAGE_KEYS.SUPER_ADMIN_VIEWING).toBe('superAdminViewingTenant');
    });

    it('should have consistent key names across codebase', () => {
      // This test ensures we don't accidentally change the key value
      // which would break existing storage data
      const expectedKeys = {
        SUPER_ADMIN_VIEWING: 'superAdminViewingTenant',
      };

      expect(SESSION_STORAGE_KEYS).toEqual(expectedKeys);
    });

    it('should provide TypeScript readonly protection', () => {
      // TypeScript 'as const' provides compile-time type safety
      // The following would fail at compile time:
      // SESSION_STORAGE_KEYS.SUPER_ADMIN_VIEWING = 'new-value'; // TS Error: Cannot assign to 'SUPER_ADMIN_VIEWING' because it is a read-only property

      // Runtime verification that the constant exists and has expected value
      expect(SESSION_STORAGE_KEYS).toHaveProperty('SUPER_ADMIN_VIEWING', 'superAdminViewingTenant');
    });
  });

  describe('LOCAL_STORAGE_KEYS', () => {
    it('should have THEME key', () => {
      expect(LOCAL_STORAGE_KEYS.THEME).toBe('theme');
    });

    it('should have LAST_TENANT key', () => {
      expect(LOCAL_STORAGE_KEYS.LAST_TENANT).toBe('lastTenantId');
    });

    it('should provide TypeScript readonly protection', () => {
      // TypeScript 'as const' provides compile-time type safety
      // The following would fail at compile time:
      // LOCAL_STORAGE_KEYS.THEME = 'new-value'; // TS Error: Cannot assign to 'THEME' because it is a read-only property

      // Runtime verification that constants exist with expected values
      expect(LOCAL_STORAGE_KEYS).toHaveProperty('THEME', 'theme');
      expect(LOCAL_STORAGE_KEYS).toHaveProperty('LAST_TENANT', 'lastTenantId');
    });
  });

  describe('Type Safety', () => {
    it('should provide type-safe SessionStorageKey type', () => {
      const validKey: SessionStorageKey = 'superAdminViewingTenant';
      expect(validKey).toBe(SESSION_STORAGE_KEYS.SUPER_ADMIN_VIEWING);

      // TypeScript would prevent this at compile time:
      // const invalidKey: SessionStorageKey = 'invalid-key'; // Type error
    });

    it('should provide type-safe LocalStorageKey type', () => {
      const validKeys: LocalStorageKey[] = ['theme', 'lastTenantId'];
      expect(validKeys).toContain(LOCAL_STORAGE_KEYS.THEME);
      expect(validKeys).toContain(LOCAL_STORAGE_KEYS.LAST_TENANT);
    });
  });

  describe('Integration with Browser Storage APIs', () => {
    beforeEach(() => {
      sessionStorage.clear();
      localStorage.clear();
    });

    afterEach(() => {
      sessionStorage.clear();
      localStorage.clear();
    });

    it('should work with sessionStorage API', () => {
      const testValue = 'true';
      sessionStorage.setItem(SESSION_STORAGE_KEYS.SUPER_ADMIN_VIEWING, testValue);

      const retrieved = sessionStorage.getItem(SESSION_STORAGE_KEYS.SUPER_ADMIN_VIEWING);
      expect(retrieved).toBe(testValue);
    });

    it('should work with localStorage API', () => {
      const testValue = 'dark';
      localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, testValue);

      const retrieved = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME);
      expect(retrieved).toBe(testValue);
    });
  });
});
