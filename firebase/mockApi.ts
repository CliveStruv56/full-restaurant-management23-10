import { Product, AppSettings, Category, Order, CartItem, User, UserRole } from '../types';
import { PRODUCTS, CATEGORIES, DEFAULT_SETTINGS } from '../data';

// --- DATABASE SIMULATION ---

let db = {
    products: [...PRODUCTS],
    categories: [...CATEGORIES],
    settings: { ...DEFAULT_SETTINGS },
    orders: [] as Order[],
    users: {
        'admin@test.com': {
            uid: 'admin-user-id',
            email: 'admin@test.com',
            displayName: 'Admin User',
            role: 'admin' as UserRole,
            loyaltyPoints: 0,
            cart: [] as CartItem[],
        },
        'staff@test.com': {
            uid: 'staff-user-id',
            email: 'staff@test.com',
            displayName: 'Staff Member',
            role: 'staff' as UserRole,
            loyaltyPoints: 0,
            cart: [] as CartItem[],
        },
        'customer@test.com': {
            uid: 'customer-user-id',
            email: 'customer@test.com',
            displayName: 'John Doe',
            role: 'customer' as UserRole,
            loyaltyPoints: 350,
            cart: [] as CartItem[],
        }
    } as Record<string, Omit<User, 'password'> & { cart: CartItem[] }>,
};

// --- REAL-TIME LISTENER SIMULATION ---

type Listener<T> = (data: T) => void;

const listeners = {
    products: [] as Listener<Product[]>[],
    categories: [] as Listener<Category[]>[],
    settings: [] as Listener<AppSettings>[],
    orders: [] as Listener<Order[]>[],
    userOrders: {} as Record<string, Listener<Order | null>[]>,
};

const notify = <T extends keyof typeof listeners>(channel: T, data: any) => {
    // @ts-ignore
    (listeners[channel] || []).forEach(listener => listener(data));
};

const notifyUserOrder = (userId: string, order: Order | null) => {
    (listeners.userOrders[userId] || []).forEach(listener => listener(order));
};


// --- MOCK API FUNCTIONS ---

// Read/Stream Data
export const mockStreamProducts = (callback: Listener<Product[]>) => {
    listeners.products.push(callback);
    callback(db.products);
    return () => { listeners.products = listeners.products.filter(l => l !== callback) };
};

export const mockStreamCategories = (callback: Listener<Category[]>) => {
    listeners.categories.push(callback);
    callback(db.categories);
    return () => { listeners.categories = listeners.categories.filter(l => l !== callback) };
};

export const mockStreamSettings = (callback: Listener<AppSettings>) => {
    listeners.settings.push(callback);
    callback(db.settings);
    return () => { listeners.settings = listeners.settings.filter(l => l !== callback) };
};

export const mockStreamOrders = (callback: Listener<Order[]>) => {
    listeners.orders.push(callback);
    callback(db.orders);
    return () => { listeners.orders = listeners.orders.filter(l => l !== callback) };
};

export const mockGetLiveOrdersForUser = (userId: string, callback: Listener<Order | null>) => {
    if (!listeners.userOrders[userId]) {
        listeners.userOrders[userId] = [];
    }
    listeners.userOrders[userId].push(callback);
    
    const userOrder = db.orders.find(o => o.userId === userId && o.status !== 'Completed') || null;
    callback(userOrder);

    return () => {
        if(listeners.userOrders[userId]) {
           listeners.userOrders[userId] = listeners.userOrders[userId].filter(l => l !== callback);
        }
    };
};

export const mockGetCart = async (userId: string): Promise<CartItem[]> => {
    const user = Object.values(db.users).find(u => u.uid === userId);
    return Promise.resolve(user?.cart || []);
};


// Write/Update Data
export const mockUpdateCart = async (userId: string, cart: CartItem[]): Promise<void> => {
     const user = Object.values(db.users).find(u => u.uid === userId);
     if (user) {
         user.cart = cart;
     }
     return Promise.resolve();
};

export const mockPlaceOrder = async (userId: string, cart: CartItem[], total: number, collectionTime: string, rewardApplied?: { name: string, price: number }) => {
    const user = Object.values(db.users).find(u => u.uid === userId);
    if (!user) throw new Error("User not found");

    const newOrder: Order = {
        id: `ORDER-${Date.now()}`,
        userId,
        items: cart,
        total,
        status: 'Placed',
        collectionTime,
        orderTime: new Date().toISOString(),
        rewardApplied: rewardApplied ? { itemName: rewardApplied.name, discountAmount: rewardApplied.price } : undefined,
    };
    db.orders.push(newOrder);

    // Update loyalty points
    if (db.settings.loyaltyEnabled) {
        if (rewardApplied) {
            user.loyaltyPoints -= db.settings.pointsToReward;
        }
        user.loyaltyPoints += Math.floor(total * db.settings.pointsPerDollar);
    }
    
    // Clear cart
    user.cart = [];

    // Notify listeners
    notify('orders', db.orders);
    notifyUserOrder(userId, newOrder);

    return newOrder;
};


// --- ADMIN FUNCTIONS ---

export const mockUpdateProduct = async (product: Product): Promise<void> => {
    const index = db.products.findIndex(p => p.id === product.id);
    if (index > -1) {
        db.products[index] = product;
    }
    notify('products', db.products);
};

// FIX: Changed product ID generation from a number (Date.now()) to a string to match the Product type.
export const mockAddProduct = async (productData: Omit<Product, 'id'>): Promise<void> => {
    const newProduct: Product = { ...productData, id: `prod-${Date.now()}` };
    db.products.push(newProduct);
    notify('products', db.products);
};

// FIX: Changed productId parameter from number to string to match the Product ID type for correct comparison.
export const mockDeleteProduct = async (productId: string): Promise<void> => {
    db.products = db.products.filter(p => p.id !== productId);
    notify('products', db.products);
};


export const mockUpdateCategory = async (category: Category): Promise<void> => {
    const index = db.categories.findIndex(c => c.id === category.id);
    if (index > -1) {
        db.categories[index] = category;
    }
    notify('categories', db.categories);
};

export const mockAddCategory = async (categoryData: Omit<Category, 'id'>): Promise<void> => {
    const newCategory: Category = { ...categoryData, id: `cat-${Date.now()}` };
    db.categories.push(newCategory);
    notify('categories', db.categories);
};

export const mockDeleteCategory = async (categoryId: string): Promise<void> => {
    db.categories = db.categories.filter(c => c.id !== categoryId);
    notify('categories', db.categories);
};

export const mockUpdateOrderStatus = async (orderId: string, status: Order['status']): Promise<void> => {
    const order = db.orders.find(o => o.id === orderId);
    if (order) {
        order.status = status;
        // By creating a new array reference, we ensure React's state update is triggered.
        notify('orders', [...db.orders]);

        // Find the current live order for the user AFTER the status update.
        const currentLiveOrder = db.orders.find(o => o.userId === order.userId && o.status !== 'Completed') || null;
        notifyUserOrder(order.userId, currentLiveOrder);
    }
};

export const mockUpdateSettings = async (settings: AppSettings): Promise<void> => {
    db.settings = settings;
    notify('settings', db.settings);
};

// This is a special function to add a completed order for testing the KDS
const addCompletedOrder = () => {
     if (db.orders.length > 5) return;
    const user = db.users['customer@test.com'];
    const completedOrder: Order = {
        id: `ORDER-OLD`,
        userId: user.uid,
        items: [
            {...db.products[1], cartItemId: '2-Oat-Milk', quantity: 1, selectedOptions: [{name: 'Oat Milk', price: 0.75}], price: 4.25 },
            {...db.products[5], cartItemId: '6-', quantity: 1, selectedOptions: [], price: 2.75 },
        ],
        total: 7.00,
        status: 'Completed',
        collectionTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        orderTime: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
    };
    db.orders.push(completedOrder);
};
addCompletedOrder();

// --- AUTH SIMULATION ---
export const mockLogin = async (email: string): Promise<User> => {
    const user = db.users[email];
    if (user) {
        return Promise.resolve(user);
    }
    return Promise.reject(new Error("User not found"));
};

export const mockSignup = async (displayName: string, email: string): Promise<User> => {
    if (db.users[email]) {
        return Promise.reject(new Error("User already exists"));
    }
    const newUser: Omit<User, 'password'> & { cart: CartItem[] } = {
        uid: `user-${Date.now()}`,
        email,
        displayName,
        role: 'customer',
        loyaltyPoints: 0,
        cart: [],
    };
    db.users[email] = newUser;
    return Promise.resolve(newUser);
};