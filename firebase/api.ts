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
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Product, Category, AppSettings, Order, CartItem } from '../types';
import { DEFAULT_SETTINGS, CATEGORIES, PRODUCTS } from '../data';

// --- Real-time Data Streaming ---

export const streamProducts = (callback: (data: Product[]) => void) => {
    const productsCollection = collection(db, 'products');
    return onSnapshot(productsCollection, snapshot => {
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        callback(products);
    });
};

export const streamCategories = (callback: (data: Category[]) => void) => {
    const categoriesCollection = collection(db, 'categories');
    return onSnapshot(categoriesCollection, snapshot => {
        const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        callback(categories);
    });
};

export const streamSettings = (callback: (data: AppSettings | null) => void) => {
    const settingsDoc = doc(db, 'app', 'settings');
    return onSnapshot(settingsDoc, snapshot => {
        if (snapshot.exists()) {
            callback(snapshot.data() as AppSettings);
        } else {
            console.warn("Settings document does not exist!");
            callback(null);
        }
    });
};

export const streamOrders = (callback: (data: Order[]) => void) => {
    const ordersCollection = collection(db, 'orders');
    return onSnapshot(ordersCollection, snapshot => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        callback(orders);
    });
};

export const getLiveOrdersForUser = (userId: string, callback: (order: Order | null) => void) => {
    const ordersCollection = collection(db, 'orders');
    // Query for all orders belonging to the user. This query does not require a special index.
    const q = query(
        ordersCollection, 
        where('userId', '==', userId)
    );
    
    return onSnapshot(q, snapshot => {
        const userOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        
        // Filter for active orders on the client and sort to find the most recent one.
        // This offloads the complex query from Firestore, avoiding the need for an index.
        const activeOrder = userOrders
            .filter(o => o.status !== 'Completed')
            .sort((a, b) => new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime())[0] || null;
        
        callback(activeOrder);
    });
};


// --- User & Cart Management ---

export const getCart = async (userId: string): Promise<CartItem[]> => {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
        return userDocSnap.data().cart || [];
    }
    return [];
};

export const updateCart = async (userId: string, cart: CartItem[]): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, { cart });
};


// --- Order Placement ---

export const placeOrder = async (userId: string, cart: CartItem[], total: number, collectionTime: string, rewardItem?: { name: string, price: number }) => {
    const userDocRef = doc(db, 'users', userId);
    const settingsDocRef = doc(db, 'app', 'settings');
    
    const [userDoc, settingsDoc] = await Promise.all([
        getDoc(userDocRef),
        getDoc(settingsDocRef)
    ]);
    
    if (!userDoc.exists() || !settingsDoc.exists()) {
        throw new Error("User or settings not found!");
    }

    const userData = userDoc.data();
    const settings = settingsDoc.data() as AppSettings;
    
    // Use a batch write for atomicity
    const batch = writeBatch(db);

    const newOrderRef = doc(collection(db, 'orders'));
    const newOrderData: any = {
        userId,
        items: cart,
        total,
        status: 'Placed',
        collectionTime,
        orderTime: new Date().toISOString(),
    };

    // Only add rewardApplied if it exists (Firestore doesn't allow undefined values)
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

// --- Admin: Product Management ---

export const uploadProductImage = (file: File, onProgress: (progress: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
        const fileExtension = file.name.split('.').pop();
        const fileName = `product-images/${Date.now()}.${fileExtension}`;
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

export const addProduct = async (productData: Omit<Product, 'id'>) => {
    await addDoc(collection(db, 'products'), productData);
};

export const bulkAddProducts = async (products: Omit<Product, 'id'>[]) => {
    const batch = writeBatch(db);
    const productsCollection = collection(db, 'products');
    
    products.forEach(productData => {
        const newProductRef = doc(productsCollection);
        batch.set(newProductRef, productData);
    });

    await batch.commit();
};

export const updateProduct = async (product: Product) => {
    const productDoc = doc(db, 'products', product.id);
    const { id, ...productData } = product; // Don't save the id inside the document
    await updateDoc(productDoc, productData);
};

export const deleteProduct = async (productId: string) => {
    await deleteDoc(doc(db, 'products', productId));
};


// --- Admin: Category Management ---

export const addCategory = async (categoryData: Omit<Category, 'id'>) => {
    await addDoc(collection(db, 'categories'), categoryData);
};

export const updateCategory = async (category: Category) => {
    const categoryDoc = doc(db, 'categories', category.id);
    const { id, ...categoryData } = category; // Don't save the id inside the document
    await updateDoc(categoryDoc, categoryData);
};

export const deleteCategory = async (categoryId: string) => {
    await deleteDoc(doc(db, 'categories', categoryId));
};


// --- Admin: Order Management ---

export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const orderDoc = doc(db, 'orders', orderId);
    await updateDoc(orderDoc, { status });
};


// --- Admin: Settings Management ---

export const updateSettings = async (settings: AppSettings) => {
    // There is only one settings document
    const settingsDoc = doc(db, 'app', 'settings');
    // FIX: The original file content was cut off here. This completes the function call.
    await setDoc(settingsDoc, settings);
};

// --- Database Seeding ---

// ⚠️ WARNING: This function overwrites ALL data including products and their images!
// Only used internally for initial database setup when app is first launched.
// NOT exported - should never be called from UI components.
const seedDatabaseInternal = async () => {
    console.log("🔄 Initial database seeding...");
    const batch = writeBatch(db);

    // 1. Set default settings
    const settingsDocRef = doc(db, 'app', 'settings');
    batch.set(settingsDocRef, DEFAULT_SETTINGS);

    // 2. Add categories (with cup size options)
    const categoriesCollection = collection(db, 'categories');
    CATEGORIES.forEach(category => {
        const categoryDocRef = doc(categoriesCollection, category.id);
        const { id, ...categoryData } = category;
        batch.set(categoryDocRef, categoryData);
    });

    // 3. Add initial products (only for first-time setup)
    const productsCollection = collection(db, 'products');
    PRODUCTS.forEach(product => {
        const productDocRef = doc(productsCollection, product.id);
        const { id, ...productData } = product;
        batch.set(productDocRef, productData);
    });

    await batch.commit();
    console.log("✅ Initial database setup complete!");
};

// SAFE: Only seeds database on first launch when it's empty.
// This function checks if the database has been initialized with default data.
// If the settings document doesn't exist, it populates the database with
// products, categories, and default settings from `data.ts`.
export const seedDatabaseIfNeeded = async () => {
    const settingsDocRef = doc(db, 'app', 'settings');
    const settingsSnap = await getDoc(settingsDocRef);

    if (!settingsSnap.exists()) {
        console.log("First-time setup detected: Seeding database with initial data...");
        await seedDatabaseInternal();
    }
};