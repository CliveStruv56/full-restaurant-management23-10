/**
 * Firebase API - Multi-Tenant Version
 *
 * All functions now require tenantId parameter for data isolation.
 * This file will replace api.ts after migration is complete.
 */

import { db, storage } from './config';
import {
    collection,
    onSnapshot,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    setDoc,
    query,
    where,
    writeBatch
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Product, Category, AppSettings, Order, CartItem } from '../types';
import { DEFAULT_SETTINGS, CATEGORIES, PRODUCTS } from '../data';

// ============================================================================
// REAL-TIME DATA STREAMING (TENANT-SCOPED)
// ============================================================================

/**
 * Stream products for a specific tenant
 */
export const streamProducts = (tenantId: string, callback: (data: Product[]) => void) => {
    const productsCollection = collection(db, `tenants/${tenantId}/products`);
    return onSnapshot(productsCollection, snapshot => {
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        callback(products);
    });
};

/**
 * Stream categories for a specific tenant
 */
export const streamCategories = (tenantId: string, callback: (data: Category[]) => void) => {
    const categoriesCollection = collection(db, `tenants/${tenantId}/categories`);
    return onSnapshot(categoriesCollection, snapshot => {
        const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        callback(categories);
    });
};

/**
 * Stream settings for a specific tenant
 */
export const streamSettings = (tenantId: string, callback: (data: AppSettings | null) => void) => {
    const settingsDoc = doc(db, `tenants/${tenantId}/settings`, 'settings');
    return onSnapshot(settingsDoc, snapshot => {
        if (snapshot.exists()) {
            callback(snapshot.data() as AppSettings);
        } else {
            console.warn(`Settings document does not exist for tenant: ${tenantId}`);
            callback(null);
        }
    });
};

/**
 * Stream all orders for a specific tenant
 */
export const streamOrders = (tenantId: string, callback: (data: Order[]) => void) => {
    const ordersCollection = collection(db, `tenants/${tenantId}/orders`);
    return onSnapshot(ordersCollection, snapshot => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        callback(orders);
    });
};

/**
 * Get live orders for a specific user in a tenant
 */
export const getLiveOrdersForUser = (
    tenantId: string,
    userId: string,
    callback: (order: Order | null) => void
) => {
    const ordersCollection = collection(db, `tenants/${tenantId}/orders`);
    const q = query(
        ordersCollection,
        where('userId', '==', userId)
    );

    return onSnapshot(q, snapshot => {
        const userOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));

        // Filter for active orders and get most recent
        const activeOrder = userOrders
            .filter(o => o.status !== 'Completed')
            .sort((a, b) => new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime())[0] || null;

        callback(activeOrder);
    });
};

// ============================================================================
// USER & CART MANAGEMENT
// ============================================================================

/**
 * Get user's cart (cart stored in user document, not tenant-scoped)
 */
export const getCart = async (userId: string): Promise<CartItem[]> => {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
        return userDocSnap.data().cart || [];
    }
    return [];
};

/**
 * Update user's cart
 */
export const updateCart = async (userId: string, cart: CartItem[]): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, { cart });
};

// ============================================================================
// ORDER PLACEMENT
// ============================================================================

/**
 * Place an order (tenant-scoped)
 */
export const placeOrder = async (
    tenantId: string,
    userId: string,
    cart: CartItem[],
    total: number,
    collectionTime: string,
    orderType: 'takeaway' | 'dine-in' | 'delivery' = 'takeaway',
    tableNumber?: number,
    guestCount?: number,
    rewardItem?: { name: string, price: number }
) => {
    console.log('placeOrder called with tenantId:', tenantId, 'userId:', userId);
    const userDocRef = doc(db, 'users', userId);
    const settingsDocRef = doc(db, `tenants/${tenantId}/settings`, 'settings');

    const [userDoc, settingsDoc] = await Promise.all([
        getDoc(userDocRef),
        getDoc(settingsDocRef)
    ]);

    if (!userDoc.exists() || !settingsDoc.exists()) {
        throw new Error("User or settings not found!");
    }

    const userData = userDoc.data();
    const settings = settingsDoc.data() as AppSettings;

    // Verify user belongs to this tenant (with fallback for legacy users)
    const userTenantId = userData.tenantId || 'demo-tenant';
    if (userTenantId !== tenantId) {
        throw new Error(`User belongs to tenant '${userTenantId}' but trying to place order in '${tenantId}'`);
    }

    // Auto-update user document with tenantId if missing (for legacy users)
    if (!userData.tenantId) {
        console.log('Auto-updating user document with tenantId:', tenantId);
        await updateDoc(userDocRef, { tenantId });
    }

    // Use a batch write for atomicity
    const batch = writeBatch(db);

    const newOrderRef = doc(collection(db, `tenants/${tenantId}/orders`));
    const newOrderData: any = {
        userId,
        customerName: userData.displayName || 'Guest', // Add customer name for display
        tenantId,
        items: cart,
        total,
        status: 'Placed',
        orderType,
        collectionTime,
        orderTime: new Date().toISOString(),
    };

    // Add optional fields
    if (tableNumber !== undefined) {
        newOrderData.tableNumber = tableNumber;
    }
    if (guestCount !== undefined) {
        newOrderData.guestCount = guestCount;
    }
    if (rewardItem) {
        newOrderData.rewardApplied = { itemName: rewardItem.name, discountAmount: rewardItem.price };
    }

    batch.set(newOrderRef, newOrderData);

    // Update loyalty points and clear cart
    let newLoyaltyPoints = userData.loyaltyPoints || 0;
    if (settings.loyaltyEnabled) {
        if (rewardItem) {
            newLoyaltyPoints -= settings.pointsToReward;
        }
        newLoyaltyPoints += Math.floor(total * settings.pointsPerDollar);
    }
    batch.update(userDocRef, {
        cart: [],
        loyaltyPoints: newLoyaltyPoints
    });

    await batch.commit();
    return { id: newOrderRef.id, ...newOrderData };
};

// ============================================================================
// ADMIN: PRODUCT MANAGEMENT
// ============================================================================

/**
 * Upload product image (tenant-scoped path)
 */
export const uploadProductImage = (
    tenantId: string,
    file: File,
    onProgress: (progress: number) => void
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const fileExtension = file.name.split('.').pop();
        const fileName = `tenants/${tenantId}/product-images/${Date.now()}.${fileExtension}`;
        const storageRef = ref(storage, fileName);

        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress(progress);
            },
            (error) => {
                console.error("Image upload failed:", error);
                reject(error);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    resolve(downloadURL);
                });
            }
        );
    });
};

/**
 * Add a new product
 */
export const addProduct = async (tenantId: string, productData: Omit<Product, 'id'>) => {
    await addDoc(collection(db, `tenants/${tenantId}/products`), productData);
};

/**
 * Bulk add products
 */
export const bulkAddProducts = async (tenantId: string, products: Omit<Product, 'id'>[]) => {
    const batch = writeBatch(db);
    const productsCollection = collection(db, `tenants/${tenantId}/products`);

    products.forEach(productData => {
        const newProductRef = doc(productsCollection);
        batch.set(newProductRef, productData);
    });

    await batch.commit();
};

/**
 * Update a product
 */
export const updateProduct = async (tenantId: string, product: Product) => {
    console.log('updateProduct called with tenantId:', tenantId, 'product:', product);
    const productDoc = doc(db, `tenants/${tenantId}/products`, product.id);
    const { id, ...productData } = product;
    console.log('Updating product document:', `tenants/${tenantId}/products/${product.id}`);
    await updateDoc(productDoc, productData);
    console.log('Product updated successfully');
};

/**
 * Delete a product
 */
export const deleteProduct = async (tenantId: string, productId: string) => {
    await deleteDoc(doc(db, `tenants/${tenantId}/products`, productId));
};

// ============================================================================
// ADMIN: CATEGORY MANAGEMENT
// ============================================================================

/**
 * Add a new category
 */
export const addCategory = async (tenantId: string, categoryData: Omit<Category, 'id'>) => {
    await addDoc(collection(db, `tenants/${tenantId}/categories`), categoryData);
};

/**
 * Update a category
 */
export const updateCategory = async (tenantId: string, category: Category) => {
    const categoryDoc = doc(db, `tenants/${tenantId}/categories`, category.id);
    const { id, ...categoryData } = category;
    await updateDoc(categoryDoc, categoryData);
};

/**
 * Delete a category
 */
export const deleteCategory = async (tenantId: string, categoryId: string) => {
    await deleteDoc(doc(db, `tenants/${tenantId}/categories`, categoryId));
};

// ============================================================================
// ADMIN: ORDER MANAGEMENT
// ============================================================================

/**
 * Update order status
 */
export const updateOrderStatus = async (
    tenantId: string,
    orderId: string,
    status: Order['status']
) => {
    const orderDoc = doc(db, `tenants/${tenantId}/orders`, orderId);
    await updateDoc(orderDoc, { status });
};

// ============================================================================
// ADMIN: SETTINGS MANAGEMENT
// ============================================================================

/**
 * Update tenant settings
 */
export const updateSettings = async (tenantId: string, settings: AppSettings) => {
    console.log('updateSettings called with tenantId:', tenantId);
    console.log('Settings data:', settings);
    const settingsDoc = doc(db, `tenants/${tenantId}/settings`, 'settings');
    console.log('Updating settings document:', `tenants/${tenantId}/settings/settings`);
    await setDoc(settingsDoc, settings);
    console.log('Settings updated successfully');
};

// ============================================================================
// DATABASE SEEDING (TENANT-SCOPED)
// ============================================================================

/**
 * Seed database for a new tenant
 */
const seedTenantDatabase = async (tenantId: string) => {
    console.log(`🔄 Seeding database for tenant: ${tenantId}...`);
    const batch = writeBatch(db);

    // 1. Set default settings
    const settingsDocRef = doc(db, `tenants/${tenantId}/settings`, 'settings');
    batch.set(settingsDocRef, DEFAULT_SETTINGS);

    // 2. Add categories
    const categoriesCollection = collection(db, `tenants/${tenantId}/categories`);
    CATEGORIES.forEach(category => {
        const categoryDocRef = doc(categoriesCollection, category.id);
        const { id, ...categoryData } = category;
        batch.set(categoryDocRef, categoryData);
    });

    // 3. Add initial products
    const productsCollection = collection(db, `tenants/${tenantId}/products`);
    PRODUCTS.forEach(product => {
        const productDocRef = doc(productsCollection, product.id);
        const { id, ...productData } = product;
        batch.set(productDocRef, productData);
    });

    await batch.commit();
    console.log(`✅ Database seeded for tenant: ${tenantId}`);
};

/**
 * Seed database if tenant has no settings
 */
export const seedDatabaseIfNeeded = async (tenantId: string) => {
    const settingsDocRef = doc(db, `tenants/${tenantId}/settings`, 'settings');
    const settingsSnap = await getDoc(settingsDocRef);

    if (!settingsSnap.exists()) {
        console.log(`First-time setup detected for tenant ${tenantId}: Seeding database...`);
        await seedTenantDatabase(tenantId);
    }
};

/**
 * Force seed database (for testing)
 * WARNING: This will overwrite existing data!
 */
export const forceSeedDatabase = async (tenantId: string) => {
    console.warn(`⚠️  Force seeding database for tenant: ${tenantId}`);
    await seedTenantDatabase(tenantId);
};
