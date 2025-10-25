import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { AppSettings, CartItem, Category, Order, Product, ProductOption } from './types';
import { Header } from './components/Header';
import { MenuScreen } from './components/MenuScreen';
import { OrderScreen } from './components/OrderScreen';
import { AccountScreen } from './components/AccountScreen';
import { CartModal } from './components/CartModal';
import { BottomNav } from './components/BottomNav';
import { AdminPanel } from './components/admin/AdminPanel';
import { ProductOptionsModal } from './components/ProductOptionsModal';
import { InvitationSignup } from './components/InvitationSignup';
import { SelfRegister } from './components/SelfRegister';
import { TenantSelector } from './components/TenantSelector';
import { useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { placeOrder, getCart, getLiveOrdersForUser, streamCategories, streamProducts, streamSettings, updateCart, seedDatabaseIfNeeded, forceSeedDatabase } from './firebase/api-multitenant';
import { useTenant } from './contexts/TenantContext';
import { KitchenDisplaySystem } from './components/admin/KitchenDisplaySystem';
import { useDailySpecial } from './hooks/useDailySpecial';
import { ToastProvider } from './components/ToastProvider';
import { FixUserPage } from './components/FixUserPage';

const CustomerApp = () => {
    const { user } = useAuth();
    const { tenant } = useTenant();
    const tenantId = tenant?.id;

    // Debug: Log tenantId
    React.useEffect(() => {
        console.log('CustomerApp tenant:', tenant);
        console.log('CustomerApp tenantId:', tenantId);
    }, [tenant, tenantId]);

    // Data state
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [currentUserOrder, setCurrentUserOrder] = useState<Order | null>(null);

    // UI State
    const [activeScreen, setActiveScreen] = useState<'menu' | 'order' | 'account'>('menu');
    const [isCartVisible, setIsCartVisible] = useState(false);
    const [productForOptions, setProductForOptions] = useState<Product | null>(null);
    const [isRewardApplied, setIsRewardApplied] = useState(false);

    // Custom Hook
    const { dailySpecial, isSpecialLoading } = useDailySpecial(products);

    const isInitialMount = useRef(true);

    // Fetch all data on mount
    useEffect(() => {
        if (!tenantId) return;

        const unsubProducts = streamProducts(tenantId, setProducts);
        const unsubCategories = streamCategories(tenantId, setCategories);
        const unsubSettings = streamSettings(tenantId, setSettings);

        let unsubUserOrder: (() => void) | undefined;
        if (user) {
            getCart(user.uid).then(setCart);
            unsubUserOrder = getLiveOrdersForUser(tenantId, user.uid, setCurrentUserOrder);
        }

        return () => {
            unsubProducts();
            unsubCategories();
            unsubSettings();
            if (unsubUserOrder) unsubUserOrder();
        };
    }, [user, tenantId]);

    // Update cart in DB when local cart changes
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (user && tenantId) {
            updateCart(user.uid, cart);
        }
    }, [cart, user, tenantId]);

    const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

    const handleAddToCart = useCallback((product: Product) => {
        if (!settings?.storeOpen) {
            toast.error("Sorry, we're currently closed and not accepting new orders.");
            return;
        }

        // Find the category for this product
        const productCategory = categories.find(c => c.id === product.categoryId);

        // Force modal if: 1) product has options OR 2) category has sizes
        const shouldShowModal = (product.availableOptionNames && product.availableOptionNames.length > 0) ||
                               (productCategory?.hasSizes);

        if (shouldShowModal) {
            setProductForOptions(product);
        } else {
            setCart(prevCart => {
                const cartItemId = `${product.id}-`;
                const existingItem = prevCart.find(item => item.cartItemId === cartItemId);
                if (existingItem) {
                    toast.success(`${product.name} quantity updated!`);
                    return prevCart.map(item => item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item);
                }
                const newItem: CartItem = { ...product, cartItemId, quantity: 1, selectedOptions: [] };
                toast.success(`${product.name} added to cart!`);
                return [...prevCart, newItem];
            });
        }
    }, [settings, categories]);

    const handleAddToCartWithOptions = useCallback((product: Product, selectedOptions: ProductOption[]) => {
        const finalPrice = product.price + selectedOptions.reduce((sum, opt) => sum + opt.price, 0);
        const optionIdentifier = selectedOptions.map(o => o.name).sort().join('-');
        const cartItemId = `${product.id}-${optionIdentifier}`;

        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.cartItemId === cartItemId);
            if (existingItem) {
                toast.success(`${product.name} quantity updated!`);
                return prevCart.map(item => item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item);
            }
            const newItem: CartItem = { ...product, price: finalPrice, cartItemId, quantity: 1, selectedOptions };
            toast.success(`${product.name} added to cart!`);
            return [...prevCart, newItem];
        });
        setProductForOptions(null);
    }, []);

    const handleUpdateQuantity = useCallback((cartItemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            setCart(prevCart => prevCart.filter(item => item.cartItemId !== cartItemId));
        } else {
            setCart(prevCart => prevCart.map(item => item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item));
        }
    }, []);

    const handlePlaceOrder = useCallback(async (collectionTime: string, finalTotal: number, rewardItem?: { name: string, price: number }) => {
        if (!user) return;

        if (!tenantId) {
            console.error('Cannot place order: tenantId is undefined');
            toast.error('Unable to place order. Please refresh the page and try again.');
            return;
        }

        const loadingToast = toast.loading('Placing your order...');

        try {
            await placeOrder(tenantId, user.uid, cart, finalTotal, collectionTime, rewardItem);
            toast.success('Order placed successfully!', { id: loadingToast });
            setCart([]);
            setIsCartVisible(false);
            setActiveScreen('order');
            setIsRewardApplied(false);
        } catch (error) {
            toast.error('Failed to place order. Please try again.', { id: loadingToast });
            console.error('Order placement error:', error);
        }
    }, [cart, user, tenantId]);

    const categoryForProductWithOptions = useMemo(() => {
        if (!productForOptions) return null;
        return categories.find(c => c.id === productForOptions.categoryId) || null;
    }, [productForOptions, categories]);

    if (!settings) {
        return <div>Loading shop...</div>;
    }

    const renderScreen = () => {
        switch (activeScreen) {
            case 'menu':
                return <MenuScreen products={products} onAddToCart={handleAddToCart} categories={categories} settings={settings} dailySpecial={dailySpecial} isSpecialLoading={isSpecialLoading} />;
            case 'order':
                return <OrderScreen order={currentUserOrder} loyaltyPoints={user?.loyaltyPoints ?? 0} settings={settings} />;
            case 'account':
                return <AccountScreen />;
            default:
                return null;
        }
    }


    return (
        <>
            <Header
                cartCount={cartCount}
                onCartClick={() => setIsCartVisible(true)}
                onTitleClick={() => setActiveScreen('menu')}
            />
            <main>
                {renderScreen()}
            </main>
            <CartModal
                isOpen={isCartVisible}
                onClose={() => setIsCartVisible(false)}
                cart={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onPlaceOrder={handlePlaceOrder}
                settings={settings}
                orders={[]}
                loyaltyPoints={user?.loyaltyPoints ?? 0}
                isRewardApplied={isRewardApplied}
                onRewardToggle={setIsRewardApplied}
            />
            {productForOptions && categoryForProductWithOptions && (
                <ProductOptionsModal
                    product={productForOptions}
                    category={categoryForProductWithOptions}
                    onClose={() => setProductForOptions(null)}
                    onAddToCart={handleAddToCartWithOptions}
                    settings={settings}
                />
            )}
            <BottomNav active={activeScreen} onNavClick={setActiveScreen} />
        </>
    );
};

const App = () => {
    const { user, userRole, tenantMemberships, loading: authLoading } = useAuth();
    const { tenant } = useTenant();
    const tenantId = tenant?.id;
    const [adminPage, setAdminPage] = useState('dashboard');
    const [isSeeding, setIsSeeding] = useState(true);
    const [needsUserFix, setNeedsUserFix] = useState(false);

    // Check URL path for special routes
    const path = window.location.pathname;
    const isInvitationSignup = path.startsWith('/signup/');
    const isSelfRegister = path === '/register';
    const isFixUserPage = path === '/fix-user';

    // Extract invitation token from URL if on signup page
    const invitationToken = isInvitationSignup ? path.split('/signup/')[1] : null;

    // Show tenant selector if user has multiple tenants and is logged in
    const shouldShowTenantSelector =
        !authLoading &&
        user &&
        tenantMemberships &&
        Object.keys(tenantMemberships).length > 1 &&
        !isInvitationSignup &&
        !isSelfRegister &&
        !isFixUserPage;

    // Check if we should show the fix user page
    useEffect(() => {
        if (isFixUserPage) {
            setNeedsUserFix(true);
            setIsSeeding(false);
        }
    }, [isFixUserPage]);

    // Effect to run the seeding logic on initial app load
    useEffect(() => {
        if (needsUserFix || isInvitationSignup || isSelfRegister) {
            setIsSeeding(false);
            return; // Skip seeding for special pages
        }

        const initializeApp = async () => {
            try {
                await seedDatabaseIfNeeded(tenantId);
            } catch (error: any) {
                console.error("Failed to initialize app:", error);

                // Check if error is permission-related AND user doesn't have tenantId
                // If user has tenantId but still getting permission error, it's likely they need admin role
                if (error?.message?.includes('permission') || error?.code === 'permission-denied') {
                    // Only show fix page if user doesn't have tenantId
                    if (user && !user.tenantId) {
                        console.log('Permission error detected - user missing tenantId');
                        setNeedsUserFix(true);
                    } else {
                        console.log('Permission error but user has tenantId - likely needs admin role for seeding');
                        // Continue anyway - the app can work without seeding if data exists
                    }
                }
            } finally {
                setIsSeeding(false);
            }
        };
        initializeApp();
    }, [tenantId, needsUserFix, user, isInvitationSignup, isSelfRegister]); // Re-run if tenant or user changes

    useEffect(() => {
        const rootElement = document.getElementById('root');
        if (rootElement) {
            if (userRole === 'admin' || (userRole === 'staff' && adminPage === 'kitchen')) {
                rootElement.style.paddingTop = '0';
                rootElement.style.paddingBottom = '0';
            } else {
                rootElement.style.paddingTop = '60px';
                rootElement.style.paddingBottom = '70px';
            }
        }
    }, [userRole, adminPage]);

    // Handle invitation signup page (public, no auth required)
    if (isInvitationSignup && invitationToken) {
        return (
            <ToastProvider>
                <InvitationSignup token={invitationToken} />
            </ToastProvider>
        );
    }

    // Handle self-registration page (public, no auth required)
    if (isSelfRegister) {
        return (
            <ToastProvider>
                <SelfRegister />
            </ToastProvider>
        );
    }

    if (authLoading || isSeeding) {
        return <div style={{textAlign: 'center', padding: '50px'}}>Initializing Shop...</div>;
    }

    // Show fix user page if needed (only if user is logged in)
    if (needsUserFix && user) {
        return <FixUserPage />;
    }

    // Show tenant selector if user has multiple tenants
    if (shouldShowTenantSelector) {
        return (
            <ToastProvider>
                <TenantSelector />
            </ToastProvider>
        );
    }

    return (
        <ToastProvider>
            {!user ? (
                <AuthPage />
            ) : userRole === 'staff' ? (
                <KitchenDisplaySystem />
            ) : userRole === 'admin' ? (
                adminPage === 'kitchen' ? (
                    <KitchenDisplaySystem onBackToAdmin={() => setAdminPage('dashboard')} />
                ) : adminPage === 'customer' ? (
                    <>
                        <CustomerApp />
                        {/* Floating back to admin button */}
                        <button
                            onClick={() => setAdminPage('dashboard')}
                            style={{
                                position: 'fixed',
                                bottom: '90px',
                                right: '20px',
                                zIndex: 10000,
                                padding: '12px 20px',
                                backgroundColor: '#343a40',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 600,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            }}
                        >
                            ← Back to Admin
                        </button>
                    </>
                ) : (
                    <AdminPanel activePage={adminPage} setActivePage={setAdminPage} />
                )
            ) : (
                <CustomerApp />
            )}
        </ToastProvider>
    );
};

export default App;
