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
    writeBatch,
    orderBy,
    serverTimestamp,
    getDocs
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Product, Category, AppSettings, Order, CartItem, Reservation, Table } from '../types';
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
            .sort((a, b) => new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime())[0];

        callback(activeOrder || null);
    });
};

// ============================================================================
// PRODUCTS (TENANT-SCOPED)
// ============================================================================

/**
 * Add a new product for a tenant
 */
export const addProduct = async (tenantId: string, product: Omit<Product, 'id'>): Promise<string> => {
    const productsCollection = collection(db, `tenants/${tenantId}/products`);
    const docRef = await addDoc(productsCollection, {
        ...product,
        tenantId // Include tenantId for additional filtering if needed
    });
    console.log('Product added with ID:', docRef.id);
    return docRef.id;
};

/**
 * Update an existing product
 */
export const updateProduct = async (tenantId: string, product: Product): Promise<void> => {
    const productDoc = doc(db, `tenants/${tenantId}/products`, product.id);
    const { id, ...productData } = product;
    await updateDoc(productDoc, productData);
    console.log('Product updated:', product.id);
};

/**
 * Delete a product
 */
export const deleteProduct = async (tenantId: string, productId: string): Promise<void> => {
    const productDoc = doc(db, `tenants/${tenantId}/products`, productId);
    await deleteDoc(productDoc);
    console.log('Product deleted:', productId);
};

/**
 * Upload product image to Firebase Storage
 */
export const uploadProductImage = (
    tenantId: string,
    file: File
): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            reject(new Error('File must be an image'));
            return;
        }

        // Validate file size (2MB max)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            reject(new Error('File size must be less than 2MB'));
            return;
        }

        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `tenants/${tenantId}/products/${timestamp}.${fileExtension}`;
        const storageRef = ref(storage, fileName);

        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log(`Upload is ${progress}% done`);
            },
            (error) => {
                console.error('Product image upload failed:', error);
                reject(error);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                } catch (error) {
                    reject(error);
                }
            }
        );
    });
};

// ============================================================================
// CATEGORIES (TENANT-SCOPED)
// ============================================================================

/**
 * Add a new category for a tenant
 */
export const addCategory = async (tenantId: string, category: Omit<Category, 'id'>): Promise<string> => {
    const categoriesCollection = collection(db, `tenants/${tenantId}/categories`);
    const docRef = await addDoc(categoriesCollection, {
        ...category,
        tenantId
    });
    console.log('Category added with ID:', docRef.id);
    return docRef.id;
};

/**
 * Update an existing category
 */
export const updateCategory = async (tenantId: string, category: Category): Promise<void> => {
    const categoryDoc = doc(db, `tenants/${tenantId}/categories`, category.id);
    const { id, ...categoryData } = category;
    await updateDoc(categoryDoc, categoryData);
    console.log('Category updated:', category.id);
};

/**
 * Delete a category
 */
export const deleteCategory = async (tenantId: string, categoryId: string): Promise<void> => {
    const categoryDoc = doc(db, `tenants/${tenantId}/categories`, categoryId);
    await deleteDoc(categoryDoc);
    console.log('Category deleted:', categoryId);
};

// ============================================================================
// ORDERS (TENANT-SCOPED)
// ============================================================================

/**
 * Place a new order for a tenant
 */
export const placeOrder = async (
    tenantId: string,
    userId: string,
    cart: CartItem[],
    total: number,
    collectionTime: string,
    orderType: 'takeaway' | 'dine-in' | 'delivery',
    tableNumber?: number,
    guestCount?: number,
    rewardItem?: { name: string; price: number },
    guestInfo?: { name: string; email?: string; phone?: string }
): Promise<string> => {
    console.log('Placing order for tenant:', tenantId);

    // Get user data for customer name
    const userDocRef = doc(db, `tenants/${tenantId}/users`, userId);
    const userDoc = await getDoc(userDocRef);

    let customerName = 'Guest';
    if (userDoc.exists()) {
        const userData = userDoc.data();
        customerName = userData.displayName || userData.email || 'Guest';
    } else if (guestInfo?.name) {
        customerName = guestInfo.name;
    }

    // Construct order object
    const orderData: Omit<Order, 'id'> = {
        tenantId,
        userId,
        customerName,
        items: cart,
        total,
        status: 'Placed',
        orderType,
        collectionTime,
        orderTime: new Date().toISOString(),
        // Optional fields
        ...(tableNumber && { tableNumber }),
        ...(guestCount && { guestCount }),
        ...(rewardItem && { rewardApplied: { itemName: rewardItem.name, discount: rewardItem.price } }),
        ...(guestInfo?.email && { guestEmail: guestInfo.email }),
        ...(guestInfo?.phone && { guestPhone: guestInfo.phone }),
        ...(!userDoc.exists() && { isGuestOrder: true })
    };

    const ordersCollection = collection(db, `tenants/${tenantId}/orders`);
    const docRef = await addDoc(ordersCollection, orderData);

    console.log('Order placed successfully with ID:', docRef.id);
    return docRef.id;
};

/**
 * Update an order's status
 */
export const updateOrderStatus = async (tenantId: string, orderId: string, status: Order['status']) => {
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

/**
 * Get tenant settings (for internal use)
 */
export const getSettings = async (tenantId: string): Promise<AppSettings | null> => {
    const settingsDoc = doc(db, `tenants/${tenantId}/settings`, 'settings');
    const snapshot = await getDoc(settingsDoc);

    if (snapshot.exists()) {
        return snapshot.data() as AppSettings;
    }

    return null;
};

// ============================================================================
// LANDING PAGE & BRANDING
// ============================================================================

/**
 * Upload branding image (logo or hero) to Firebase Storage
 */
export const uploadBrandingImage = (
    tenantId: string,
    file: File,
    type: 'logo' | 'hero'
): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            reject(new Error('File must be an image'));
            return;
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            reject(new Error('File size must be less than 5MB'));
            return;
        }

        const fileExtension = file.name.split('.').pop();
        const fileName = `tenants/${tenantId}/branding/${type}.${fileExtension}`;
        const storageRef = ref(storage, fileName);

        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log(`Upload is ${progress}% done`);
            },
            (error) => {
                console.error(`${type} image upload failed:`, error);
                reject(error);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                } catch (error) {
                    reject(error);
                }
            }
        );
    });
};

/**
 * Update landing page settings
 */
export const updateLandingPageSettings = async (
    tenantId: string,
    settings: AppSettings['landingPage']
): Promise<void> => {
    const settingsRef = doc(db, `tenants/${tenantId}/settings`, 'settings');

    // Use updateDoc to merge with existing settings
    await updateDoc(settingsRef, {
        landingPage: settings
    });

    console.log('Landing page settings updated for tenant:', tenantId);
};

// ============================================================================
// RESERVATIONS (TENANT-SCOPED)
// ============================================================================

/**
 * Create a new reservation
 * Phase 3A: Calculate duration and store, but do NOT auto-assign table
 * Table assignment happens when status changes to 'confirmed'
 */
export const createReservation = async (
    tenantId: string,
    reservationData: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'tenantId' | 'duration'>
): Promise<string> => {
    // 1. Get settings to calculate duration
    const settings = await getSettings(tenantId);

    // 2. Calculate reservation duration
    const duration = calculateReservationDuration(
        reservationData.time,
        settings?.tableOccupation
    );

    // 3. Create reservation with duration
    const reservationsCollection = collection(db, `tenants/${tenantId}/reservations`);
    const docRef = await addDoc(reservationsCollection, {
        ...reservationData,
        tenantId,
        status: 'pending', // Start as pending
        duration, // NEW: Store calculated duration
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // assignedTableId and assignedTableNumber not set yet
    });

    console.log('Reservation created with ID:', docRef.id);
    return docRef.id;
};

/**
 * Get a single reservation by ID
 */
export const getReservation = async (
    tenantId: string,
    reservationId: string
): Promise<Reservation | null> => {
    const reservationRef = doc(db, `tenants/${tenantId}/reservations`, reservationId);
    const reservationSnap = await getDoc(reservationRef);

    if (reservationSnap.exists()) {
        return { id: reservationSnap.id, ...reservationSnap.data() } as Reservation;
    }

    return null;
};

/**
 * Stream reservations in real-time with optional filters
 */
export const streamReservations = (
    tenantId: string,
    filters: { date?: string; status?: string },
    callback: (reservations: Reservation[]) => void
): (() => void) => {
    const reservationsRef = collection(db, `tenants/${tenantId}/reservations`);

    // Build query with filters
    let q = query(reservationsRef, where('tenantId', '==', tenantId));

    if (filters.date) {
        q = query(q, where('date', '==', filters.date));
    }

    if (filters.status) {
        q = query(q, where('status', '==', filters.status));
    }

    // Order by date descending, then time ascending
    q = query(q, orderBy('date', 'desc'), orderBy('time', 'asc'));

    // Return unsubscribe function
    return onSnapshot(q, (snapshot) => {
        const reservations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Reservation[];

        callback(reservations);
    }, (error) => {
        console.error('Error streaming reservations:', error);
    });
};

// ============================================================================
// TABLE MANAGEMENT (TENANT-SCOPED)
// ============================================================================

/**
 * Stream tables for a tenant (real-time updates)
 */
export const streamTables = (tenantId: string, callback: (data: Table[]) => void) => {
    const tablesRef = collection(db, `tenants/${tenantId}/tables`);
    const q = query(tablesRef, orderBy('number', 'asc'));

    return onSnapshot(q, (snapshot) => {
        const tables = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Table[];

        callback(tables);
    }, (error) => {
        console.error('Error streaming tables:', error);
    });
};

/**
 * Get a single table by ID
 */
export const getTable = async (
    tenantId: string,
    tableId: string
): Promise<Table | null> => {
    const tableRef = doc(db, `tenants/${tenantId}/tables`, tableId);
    const tableSnap = await getDoc(tableRef);

    if (tableSnap.exists()) {
        return { id: tableSnap.id, ...tableSnap.data() } as Table;
    }

    return null;
};

/**
 * Add a new table
 */
export const addTable = async (tenantId: string, tableData: Omit<Table, 'id'>): Promise<string> => {
    const tablesCollection = collection(db, `tenants/${tenantId}/tables`);
    const docRef = await addDoc(tablesCollection, {
        ...tableData,
        tenantId,
    });
    console.log('Table added with ID:', docRef.id);
    return docRef.id;
};

/**
 * Update an existing table
 */
export const updateTable = async (tenantId: string, table: Table): Promise<void> => {
    const tableDocRef = doc(db, `tenants/${tenantId}/tables`, table.id);
    const { id, ...tableData } = table;
    await updateDoc(tableDocRef, tableData);
    console.log('Table updated:', table.id);
};

/**
 * Delete a table
 */
export const deleteTable = async (tenantId: string, tableId: string): Promise<void> => {
    const tableDocRef = doc(db, `tenants/${tenantId}/tables`, tableId);
    await deleteDoc(tableDocRef);
    console.log('Table deleted:', tableId);
};

/**
 * Seed tenant database with default settings, categories, and products
 */
export const seedTenantDatabase = async (tenantId: string): Promise<void> => {
    console.log(`Seeding database for tenant: ${tenantId}`);

    const batch = writeBatch(db);

    // 1. Add default settings
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

// ============================================================================
// RESERVATION DURATION CALCULATION (Phase 3A)
// ============================================================================

/**
 * Calculate reservation duration based on time and settings
 *
 * Uses AppSettings.tableOccupation.servicePeriods to determine duration:
 * - Breakfast (06:00-11:00): Default 45 minutes
 * - Lunch (11:00-15:00): Default 60 minutes
 * - Dinner (15:00-22:00): Default 90 minutes
 *
 * If tableOccupation settings not configured, defaults to 90 minutes.
 *
 * @param time - Reservation time in HH:mm format (24-hour)
 * @param tableOccupation - Optional table occupation settings from AppSettings
 * @returns Duration in minutes
 *
 * @example
 * calculateReservationDuration('09:00', settings.tableOccupation) // returns 45 (breakfast)
 * calculateReservationDuration('13:00', settings.tableOccupation) // returns 60 (lunch)
 * calculateReservationDuration('19:00', settings.tableOccupation) // returns 90 (dinner)
 * calculateReservationDuration('13:00', undefined) // returns 90 (default)
 */
export function calculateReservationDuration(
    time: string,
    tableOccupation?: AppSettings['tableOccupation']
): number {
    // Default to 90 minutes if no settings configured
    if (!tableOccupation || !tableOccupation.servicePeriods) {
        return 90;
    }

    // Parse time to extract hour (HH:mm format)
    const [hourStr] = time.split(':');
    const hour = parseInt(hourStr, 10);

    // Determine service period based on hour
    // Breakfast: 06:00-11:00 (hour >= 6 && hour < 11)
    // Lunch: 11:00-15:00 (hour >= 11 && hour < 15)
    // Dinner: 15:00-22:00 (hour >= 15)
    if (hour >= 6 && hour < 11) {
        return tableOccupation.servicePeriods.breakfast || 45;
    } else if (hour >= 11 && hour < 15) {
        return tableOccupation.servicePeriods.lunch || 60;
    } else {
        return tableOccupation.servicePeriods.dinner || 90;
    }
}

// ============================================================================
// TABLE AVAILABILITY CHECKING (Phase 3A)
// ============================================================================

/**
 * Check if a table is available for a specific date/time window
 *
 * Prevents double-bookings by checking for time conflicts with existing reservations.
 * Only checks reservations with status 'confirmed' or 'seated' (active reservations).
 *
 * Time overlap detection:
 * Two time windows overlap if: requestedStart < existingEnd AND existingStart < requestedEnd
 *
 * @param tenantId - Tenant ID for data isolation
 * @param tableId - Table ID to check availability for
 * @param date - Reservation date in YYYY-MM-DD format
 * @param startTime - Reservation start time in HH:mm format (24-hour)
 * @param duration - Reservation duration in minutes
 * @param excludeReservationId - Optional: Skip this reservation ID (for editing existing reservations)
 * @returns Promise<boolean> - true if table is available, false if conflicts exist
 *
 * @example
 * // Check if Table 1 is available on Nov 15 at 19:00 for 90 minutes
 * const isAvailable = await checkTableAvailability('tenant-123', 'table-1', '2025-11-15', '19:00', 90);
 *
 * // Check availability while excluding current reservation (for editing)
 * const isAvailable = await checkTableAvailability('tenant-123', 'table-1', '2025-11-15', '19:00', 90, 'res-456');
 */
export async function checkTableAvailability(
    tenantId: string,
    tableId: string,
    date: string,
    startTime: string,
    duration: number,
    excludeReservationId?: string
): Promise<boolean> {
    // 1. Parse requested time window
    const requestedStart = new Date(`${date}T${startTime}:00`);
    const requestedEnd = new Date(requestedStart.getTime() + duration * 60000);

    // 2. Query Firestore for reservations on this table for this date
    const reservationsRef = collection(db, `tenants/${tenantId}/reservations`);
    const q = query(
        reservationsRef,
        where('assignedTableId', '==', tableId),
        where('date', '==', date),
        where('status', 'in', ['confirmed', 'seated'])
    );

    const snapshot = await getDocs(q);

    // 3. Check each reservation for time conflicts
    for (const docSnapshot of snapshot.docs) {
        const reservation = { id: docSnapshot.id, ...docSnapshot.data() } as Reservation;

        // Skip the reservation being edited
        if (excludeReservationId && reservation.id === excludeReservationId) {
            continue;
        }

        // Calculate existing reservation's time window
        const existingStart = new Date(`${reservation.date}T${reservation.time}:00`);
        const existingDuration = reservation.duration || 90; // Default to 90 if not set
        const existingEnd = new Date(existingStart.getTime() + existingDuration * 60000);

        // Check for time overlap
        // Overlap condition: requestedStart < existingEnd AND existingStart < requestedEnd
        if (requestedStart < existingEnd && existingStart < requestedEnd) {
            console.log(`Conflict detected: Table ${tableId} has overlapping reservation ${reservation.id}`);
            console.log(`  Existing: ${existingStart.toISOString()} - ${existingEnd.toISOString()}`);
            console.log(`  Requested: ${requestedStart.toISOString()} - ${requestedEnd.toISOString()}`);
            return false; // Conflict found - table not available
        }
    }

    // No conflicts found - table is available
    return true;
}

// ============================================================================
// TABLE ASSIGNMENT LOGIC (Phase 3A)
// ============================================================================

/**
 * Assign a table to a reservation
 *
 * Two modes of operation:
 * 1. Auto-assignment (tableId not provided): Finds first available table by capacity and availability
 * 2. Manual assignment (tableId provided): Validates specific table and assigns if available
 *
 * Updates both reservation and table documents atomically using Firestore batch.
 *
 * @param tenantId - Tenant ID for data isolation
 * @param reservationId - Reservation ID to assign table to
 * @param tableId - Optional: Specific table ID for manual assignment
 * @throws Error if reservation not found, table not available, or capacity insufficient
 *
 * @example
 * // Auto-assignment: Find first available table
 * await assignTableToReservation('tenant-123', 'res-456');
 *
 * // Manual assignment: Assign specific table
 * await assignTableToReservation('tenant-123', 'res-456', 'table-789');
 */
export async function assignTableToReservation(
    tenantId: string,
    reservationId: string,
    tableId?: string
): Promise<void> {
    // 1. Get reservation
    const reservation = await getReservation(tenantId, reservationId);

    if (!reservation) {
        throw new Error('Reservation not found');
    }

    // 2. Ensure duration is set (use existing or default to 90)
    const duration = reservation.duration || 90;

    // 3. Manual assignment: Validate specific table
    if (tableId) {
        const table = await getTable(tenantId, tableId);

        if (!table) {
            throw new Error('Table not found');
        }

        // Validate capacity
        if (table.capacity < reservation.partySize) {
            throw new Error(
                `Table ${table.number} has capacity ${table.capacity}, but party size is ${reservation.partySize}`
            );
        }

        // Check availability
        const isAvailable = await checkTableAvailability(
            tenantId,
            tableId,
            reservation.date,
            reservation.time,
            duration,
            reservationId // Exclude current reservation when checking
        );

        if (!isAvailable) {
            throw new Error(`Table ${table.number} is not available for the selected time slot`);
        }

        // Assign the specific table
        await assignTable(tenantId, reservationId, table, duration);
        return;
    }

    // 4. Auto-assignment: Find first available table
    const tablesRef = collection(db, `tenants/${tenantId}/tables`);
    const tablesQuery = query(tablesRef, orderBy('number', 'asc'));
    const tablesSnapshot = await getDocs(tablesQuery);

    for (const docSnapshot of tablesSnapshot.docs) {
        const table = { id: docSnapshot.id, ...docSnapshot.data() } as Table;

        // Check capacity
        if (table.capacity < reservation.partySize) {
            continue;
        }

        // Check availability
        const isAvailable = await checkTableAvailability(
            tenantId,
            table.id,
            reservation.date,
            reservation.time,
            duration,
            reservationId
        );

        if (isAvailable) {
            await assignTable(tenantId, reservationId, table, duration);
            console.log(`Auto-assigned Table ${table.number} to reservation ${reservationId}`);
            return; // Success
        }
    }

    // No tables available
    throw new Error('No tables available for this party size and time slot');
}

/**
 * Helper function to perform atomic table assignment
 *
 * Updates both reservation and table documents in a single Firestore batch.
 * This ensures data consistency - either both updates succeed or both fail.
 *
 * @param tenantId - Tenant ID
 * @param reservationId - Reservation ID
 * @param table - Table to assign
 * @param duration - Reservation duration in minutes
 */
async function assignTable(
    tenantId: string,
    reservationId: string,
    table: Table,
    duration: number
): Promise<void> {
    const batch = writeBatch(db);

    // Update reservation with assignment details
    const reservationRef = doc(db, `tenants/${tenantId}/reservations`, reservationId);
    batch.update(reservationRef, {
        assignedTableId: table.id,
        assignedTableNumber: table.number,
        duration,
        updatedAt: new Date().toISOString(),
    });

    // Update table status to 'reserved'
    const tableRef = doc(db, `tenants/${tenantId}/tables`, table.id);
    batch.update(tableRef, {
        status: 'reserved',
    });

    await batch.commit();
    console.log(`Table ${table.number} assigned to reservation ${reservationId}`);
}

// ============================================================================
// RESERVATION STATUS MANAGEMENT (Phase 3A)
// ============================================================================

/**
 * Update reservation status with automatic table status synchronization
 *
 * Phase 3A: Handles status lifecycle and table assignment:
 * - pending → confirmed: Auto-assigns table if not already assigned
 * - confirmed → seated: Changes table status to 'occupied'
 * - seated → completed: Changes table status to 'available'
 * - confirmed → cancelled: Changes table status to 'available', clears assignment
 * - confirmed → no-show: Changes table status to 'available', keeps assignment for records
 *
 * Uses Firestore batched writes to ensure atomic updates of reservation + table.
 *
 * @param tenantId - Tenant ID for data isolation
 * @param reservationId - Reservation ID to update
 * @param status - New reservation status
 * @param adminNotes - Optional admin notes to add
 * @throws Error if reservation not found
 *
 * @example
 * // Confirm pending reservation (triggers auto-assignment)
 * await updateReservationStatus('tenant-123', 'res-456', 'confirmed');
 *
 * // Mark as seated (updates table to occupied)
 * await updateReservationStatus('tenant-123', 'res-456', 'seated');
 *
 * // Complete reservation with notes
 * await updateReservationStatus('tenant-123', 'res-456', 'completed', 'Customer was very satisfied');
 */
export async function updateReservationStatus(
    tenantId: string,
    reservationId: string,
    status: Reservation['status'],
    adminNotes?: string
): Promise<void> {
    // 1. Get current reservation
    const reservation = await getReservation(tenantId, reservationId);

    if (!reservation) {
        throw new Error('Reservation not found');
    }

    // 2. Handle auto-assignment for confirmed reservations without table
    if (status === 'confirmed' && !reservation.assignedTableId) {
        // Auto-assign table when confirming
        // Note: This is done OUTSIDE batch to handle errors gracefully
        await assignTableToReservation(tenantId, reservationId);
        return; // assignTableToReservation already updates reservation with status
    }

    // 3. Prepare batch update
    const batch = writeBatch(db);
    const reservationRef = doc(db, `tenants/${tenantId}/reservations`, reservationId);

    // Build update data for reservation
    const updateData: any = {
        status,
        updatedAt: new Date().toISOString(),
    };

    if (adminNotes !== undefined) {
        updateData.adminNotes = adminNotes;
    }

    // 4. Handle table status updates based on status transition
    if (reservation.assignedTableId) {
        const tableRef = doc(db, `tenants/${tenantId}/tables`, reservation.assignedTableId);

        switch (status) {
            case 'seated':
                // Customer arrived and seated
                batch.update(tableRef, { status: 'occupied' });
                break;

            case 'completed':
                // Reservation finished successfully
                batch.update(tableRef, { status: 'available' });
                break;

            case 'cancelled':
                // Reservation cancelled - free up table and clear assignment
                batch.update(tableRef, { status: 'available' });
                updateData.assignedTableId = null;
                updateData.assignedTableNumber = null;
                break;

            case 'no-show':
                // Customer didn't show up - free table but keep assignment for records
                batch.update(tableRef, { status: 'available' });
                break;

            // 'confirmed' and 'pending' don't change table status
            // (already 'reserved' or unassigned)
        }
    }

    // 5. Commit batch update
    batch.update(reservationRef, updateData);
    await batch.commit();

    console.log(`Reservation ${reservationId} status updated to ${status}`);
}

// ============================================================================
// CART MANAGEMENT (TEMPORARY STUBS - Need proper implementation)
// ============================================================================

/**
 * Get cart for a user (temporary stub)
 * TODO: Implement proper cart storage
 */
export const getCart = async (tenantId: string, userId: string): Promise<CartItem[]> => {
    // Temporary: Return empty cart
    // In production, this should fetch from localStorage or Firestore
    return [];
};

/**
 * Update cart for a user (temporary stub)
 * TODO: Implement proper cart storage
 */
export const updateCart = async (tenantId: string, userId: string, cart: CartItem[]): Promise<void> => {
    // Temporary: No-op
    // In production, this should save to localStorage or Firestore
    console.log('updateCart called (stub) - cart not persisted');
};

/**
 * Link guest orders to a user account (temporary stub)
 * TODO: Implement proper guest order linking
 */
export const linkGuestOrders = async (tenantId: string, userId: string, guestId: string): Promise<void> => {
    // Temporary: No-op
    // In production, this should update orders from guestId to userId
    console.log('linkGuestOrders called (stub) - orders not linked');
};
