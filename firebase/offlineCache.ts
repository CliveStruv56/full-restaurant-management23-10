/**
 * Offline Cache Utilities
 *
 * Primes Firestore offline cache with critical queries for tenant.
 * This ensures data is available when user goes offline.
 */

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './config';

/**
 * Prime offline cache with essential data for a tenant
 *
 * This runs queries to populate Firestore's IndexedDB cache
 * so data is available offline.
 */
export const primeOfflineCache = async (tenantId: string) => {
  console.log(`🔄 Priming offline cache for tenant: ${tenantId}...`);

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Cache today's orders (critical for KDS)
    const todayOrdersQuery = query(
      collection(db, `tenants/${tenantId}/orders`),
      where('collectionTime', '>=', today.toISOString()),
      where('collectionTime', '<', tomorrow.toISOString())
    );

    // Cache all products (for menu)
    const productsQuery = collection(db, `tenants/${tenantId}/products`);

    // Cache all categories
    const categoriesQuery = collection(db, `tenants/${tenantId}/categories`);

    // Cache settings
    const settingsQuery = collection(db, `tenants/${tenantId}/settings`);

    // Execute all queries in parallel to cache them
    const [ordersSnap, productsSnap, categoriesSnap, settingsSnap] = await Promise.all([
      getDocs(todayOrdersQuery),
      getDocs(productsQuery),
      getDocs(categoriesQuery),
      getDocs(settingsQuery),
    ]);

    console.log(`✅ Offline cache primed successfully:`);
    console.log(`   - ${ordersSnap.size} orders (today)`);
    console.log(`   - ${productsSnap.size} products`);
    console.log(`   - ${categoriesSnap.size} categories`);
    console.log(`   - ${settingsSnap.size} settings`);
  } catch (error) {
    console.error('❌ Error priming offline cache:', error);
    // Don't throw - offline cache is a nice-to-have, not critical
  }
};

/**
 * Check if device is currently online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Set up online/offline event listeners
 */
export const setupOnlineListeners = (
  onOnline: () => void,
  onOffline: () => void
) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};
