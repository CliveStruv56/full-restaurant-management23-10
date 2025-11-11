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
import { placeOrder, getCart, getLiveOrdersForUser, streamCategories, streamProducts, streamSettings, updateCart, seedDatabaseIfNeeded, forceSeedDatabase, linkGuestOrders } from './firebase/api-multitenant';
import { useTenant } from './contexts/TenantContext';
import { CustomerJourneyProvider, useCustomerJourney } from './contexts/CustomerJourneyContext';
import { KitchenDisplaySystem } from './components/admin/KitchenDisplaySystem';
import { useDailySpecial } from './hooks/useDailySpecial';
import { ToastProvider } from './components/ToastProvider';
import { FixUserPage } from './components/FixUserPage';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LandingPage } from './components/LandingPage';
import { IntentSelection } from './components/IntentSelection';
import { OrderTypeSelection } from './components/OrderTypeSelection';
import { ReservationFlow } from './components/ReservationFlow';
import { AccountCreationPrompt } from './components/AccountCreationPrompt';
import { SuperAdminProvider } from './contexts/SuperAdminContext';
import { SuperAdminPanel } from './components/admin/SuperAdminPanel';
import MarketingLandingPage from './components/MarketingLandingPage';
import SignupFlow from './components/signup/SignupFlow';
import SignupPending from './components/signup/SignupPending';

const CustomerApp = () => {
    const { user } = useAuth();
    const { tenant } = useTenant();
    const tenantId = tenant?.id;
    const { journey } = useCustomerJourney();

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

    // Account creation prompt state (for guest checkout)
    const [showAccountPrompt, setShowAccountPrompt] = useState(false);
    const [guestInfoForPrompt, setGuestInfoForPrompt] = useState<{ email?: string; phone?: string } | null>(null);

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

    // Filter products based on order type (dine-in vs takeaway)
    const filteredProducts = useMemo(() => {
        // If no order type selected yet, show all products
        if (!journey.orderType) {
            return products;
        }

        return products.filter(product => {
            // If product has no availability restriction, show it for all order types (backward compatibility)
            if (!product.availableFor || product.availableFor === 'both') {
                return true;
            }

            // Otherwise, only show if it matches the current order type
            return product.availableFor === journey.orderType;
        });
    }, [products, journey.orderType]);

    // Custom Hook - Use filtered products for daily special
    const { dailySpecial, isSpecialLoading } = useDailySpecial(filteredProducts);

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

    const handlePlaceOrder = useCallback(async (
        collectionTime: string,
        finalTotal: number,
        orderType: 'takeaway' | 'dine-in' | 'delivery',
        tableNumber?: number,
        guestCount?: number,
        rewardItem?: { name: string, price: number },
        guestInfo?: { name: string; email?: string; phone?: string }
    ) => {
        if (!user) return;

        if (!tenantId) {
            console.error('Cannot place order: tenantId is undefined');
            toast.error('Unable to place order. Please refresh the page and try again.');
            return;
        }

        const loadingToast = toast.loading('Placing your order...');

        try {
            await placeOrder(tenantId, user.uid, cart, finalTotal, collectionTime, orderType, tableNumber, guestCount, rewardItem, guestInfo);
            toast.success('Order placed successfully!', { id: loadingToast });
            setCart([]);
            setIsCartVisible(false);
            setActiveScreen('order');
            setIsRewardApplied(false);

            // Show account creation prompt for anonymous/guest users
            const isAnonymousUser = user && 'isAnonymous' in user && (user as any).isAnonymous;
            if (isAnonymousUser && guestInfo) {
                // Store guest info for the prompt
                setGuestInfoForPrompt({
                    email: guestInfo.email,
                    phone: guestInfo.phone
                });
                // Show the account creation prompt after a brief delay
                setTimeout(() => {
                    setShowAccountPrompt(true);
                }, 1000);
            }
        } catch (error) {
            toast.error('Failed to place order. Please try again.', { id: loadingToast });
            console.error('Order placement error:', error);
        }
    }, [cart, user, tenantId]);

    const categoryForProductWithOptions = useMemo(() => {
        if (!productForOptions) return null;
        return categories.find(c => c.id === productForOptions.categoryId) || null;
    }, [productForOptions, categories]);

    // Handle account creation from prompt
    const handleAccountCreationComplete = async () => {
        if (!user || !tenantId) return;

        try {
            // Link any guest orders to the newly created account
            const linkedCount = await linkGuestOrders(tenantId, user.uid);
            if (linkedCount > 0) {
                toast.success(`${linkedCount} order(s) linked to your account!`);
            }
        } catch (error) {
            console.error('Error linking guest orders:', error);
            // Don't show error to user - account was still created successfully
        } finally {
            setShowAccountPrompt(false);
            setGuestInfoForPrompt(null);
        }
    };

    const handleAccountCreationSkip = () => {
        setShowAccountPrompt(false);
        setGuestInfoForPrompt(null);
    };

    if (!settings) {
        return <div>Loading shop...</div>;
    }

    const renderScreen = () => {
        switch (activeScreen) {
            case 'menu':
                return <MenuScreen products={filteredProducts} onAddToCart={handleAddToCart} categories={categories} settings={settings} dailySpecial={dailySpecial} isSpecialLoading={isSpecialLoading} />;
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
                tableNumber={journey.tableNumber}
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
                initialOrderType={journey.orderType}
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
            {showAccountPrompt && (
                <AccountCreationPrompt
                    guestEmail={guestInfoForPrompt?.email}
                    guestPhone={guestInfoForPrompt?.phone}
                    onComplete={handleAccountCreationComplete}
                    onSkip={handleAccountCreationSkip}
                />
            )}
            <BottomNav active={activeScreen} onNavClick={setActiveScreen} />
        </>
    );
};

/**
 * CustomerFlowRouter Component
 *
 * Routes the customer through the correct flow based on their journey state:
 * 1. QR code entry -> Skip to menu (dine-in, table pre-filled)
 * 2. No intent -> Show landing page
 * 3. Intent "later" -> Show reservation flow (placeholder for now)
 * 4. Intent "now" but no order type -> Show order type selection
 * 5. Order type selected -> Show menu
 */
const CustomerFlowRouter: React.FC = () => {
    const { journey, setIntent, setOrderType, resetJourney } = useCustomerJourney();
    const { user } = useAuth();

    // Reset journey when user logs in/out to show landing page
    React.useEffect(() => {
        // Skip reset if entering via QR code
        if (journey.entryPoint !== 'qr-code') {
            resetJourney();
        }
    }, [user?.uid]); // Trigger on user change (login/logout)

    // QR code entry: Skip directly to menu
    if (journey.entryPoint === 'qr-code') {
        return <CustomerApp />;
    }

    // No intent selected yet: Show landing page with three options
    if (!journey.customerIntent) {
        return (
            <LandingPage
                onOrderNow={(type) => {
                    setIntent('now');
                    setOrderType(type);
                }}
                onMakeReservation={() => setIntent('later')}
            />
        );
    }

    // Intent is "later": Show reservation flow
    if (journey.customerIntent === 'later') {
        return <ReservationFlow />;
    }

    // Intent is "now" and order type selected: Show menu
    if (journey.orderType) {
        return <CustomerApp />;
    }

    // Fallback: Should not reach here, but reset if something goes wrong
    resetJourney();
    return null;
};

const App = () => {
    const { user, userRole, tenantMemberships, loading: authLoading } = useAuth();
    const { tenant, isSuperAdminPortal } = useTenant();
    const tenantId = tenant?.id;
    const [adminPage, setAdminPage] = useState('dashboard');
    const [isSeeding, setIsSeeding] = useState(true);
    const [needsUserFix, setNeedsUserFix] = useState(false);

    // Check URL path for special routes
    const path = window.location.pathname;
    const isPublicSignup = path === '/signup';
    const isSignupPending = path === '/signup/pending';
    const isInvitationSignup = path.startsWith('/signup/') && path !== '/signup' && path !== '/signup/pending';
    const isSelfRegister = path === '/register';
    const isFixUserPage = path === '/fix-user';
    const isMarketingPage = path === '/' && !tenant && !isSuperAdminPortal;

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
        !isFixUserPage &&
        !isPublicSignup &&
        !isSignupPending &&
        !isMarketingPage;

    // Check if we should show the fix user page
    useEffect(() => {
        if (isFixUserPage) {
            setNeedsUserFix(true);
            setIsSeeding(false);
        }
    }, [isFixUserPage]);

    // Auto-redirect super admins to Super Admin Portal (unless explicitly viewing a tenant)
    useEffect(() => {
        console.log('🔍 Super Admin Redirect Effect Running:', {
            authLoading,
            userRole,
            isSuperAdminPortal,
            hostname: window.location.hostname
        });

        // Only redirect if user is loaded and is a super admin
        if (!authLoading && userRole === 'super-admin' && !isSuperAdminPortal) {
            // Don't redirect if on special pages
            if (isPublicSignup || isSignupPending || isInvitationSignup || isSelfRegister || isFixUserPage || isMarketingPage) {
                console.log('⏭️  Skipping redirect - on special page');
                return;
            }

            // Check if super admin is explicitly viewing this tenant
            // Use localStorage (not sessionStorage) so it works across tabs
            try {
                const viewingFlag = localStorage.getItem('superAdminViewingTenant');
                console.log('📦 localStorage flag:', viewingFlag);

                if (viewingFlag) {
                    const { enabled, tenantId, timestamp } = JSON.parse(viewingFlag);
                    const oneHour = 60 * 60 * 1000;
                    const isExpired = Date.now() - timestamp > oneHour;

                    // Extract current tenant ID from URL (don't wait for tenant to load)
                    const hostname = window.location.hostname;
                    const parts = hostname.split('.');
                    const currentTenantId = parts.length === 2 && parts[1] === 'localhost'
                        ? parts[0]
                        : (parts.length >= 3 ? parts[0] : null);

                    console.log('🔍 Redirect Check:', {
                        enabled,
                        tenantId,
                        currentTenantId,
                        isExpired,
                        timestamp: new Date(timestamp).toLocaleString(),
                        willSkipRedirect: enabled && !isExpired && tenantId === currentTenantId
                    });

                    if (enabled && !isExpired && tenantId === currentTenantId) {
                        console.log('✅ Super admin explicitly viewing tenant:', currentTenantId, '- SKIPPING REDIRECT');
                        return; // Don't redirect
                    } else {
                        console.log('❌ Redirect check FAILED - will redirect to super admin portal');
                    }
                } else {
                    console.log('❌ No localStorage flag found - will redirect to super admin portal');
                }
            } catch (e) {
                // Invalid JSON, clear the flag
                console.error('❌ Error parsing localStorage flag:', e);
                localStorage.removeItem('superAdminViewingTenant');
            }

            // Redirect to super admin portal
            const superAdminUrl = window.location.protocol + '//superadmin.localhost:' + window.location.port;
            console.log('🔄 Redirecting super admin to Super Admin Portal:', superAdminUrl);
            window.location.href = superAdminUrl;
        }
    }, [authLoading, userRole, isSuperAdminPortal, tenant?.id, isPublicSignup, isSignupPending, isInvitationSignup, isSelfRegister, isFixUserPage, isMarketingPage]);

    // Effect to run the seeding logic on initial app load
    useEffect(() => {
        if (needsUserFix || isInvitationSignup || isSelfRegister || isPublicSignup || isSignupPending || isMarketingPage) {
            setIsSeeding(false);
            return; // Skip seeding for special pages
        }

        // Don't seed if no tenant ID (tenant still loading)
        if (!tenantId) {
            setIsSeeding(false);
            return;
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

    // Handle marketing landing page (public, no auth required)
    if (isMarketingPage) {
        return (
            <ToastProvider>
                <MarketingLandingPage />
            </ToastProvider>
        );
    }

    // Handle public signup flow (public, no auth required)
    if (isPublicSignup) {
        return (
            <ToastProvider>
                <SignupFlow />
            </ToastProvider>
        );
    }

    // Handle signup pending page (public, no auth required)
    if (isSignupPending) {
        return (
            <ToastProvider>
                <SignupPending />
            </ToastProvider>
        );
    }

    // Handle Super Admin Portal
    if (isSuperAdminPortal) {
        // Show loading state while auth is loading
        if (authLoading) {
            return <div style={{textAlign: 'center', padding: '50px'}}>Loading...</div>;
        }

        // Require authentication
        if (!user) {
            return (
                <ToastProvider>
                    <AuthPage />
                </ToastProvider>
            );
        }

        // Require super-admin role
        if (userRole !== 'super-admin') {
            return (
                <ToastProvider>
                    <div className="min-h-screen flex items-center justify-center bg-gray-50">
                        <div className="max-w-md w-full text-center p-8">
                            <div className="text-6xl mb-6">🔒</div>
                            <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
                            <p className="text-gray-700 mb-6">
                                Super admin access required to view this page.
                            </p>
                            <p className="text-sm text-gray-600">
                                Current role: <code className="bg-gray-100 px-2 py-1 rounded">{userRole || 'none'}</code>
                            </p>
                        </div>
                    </div>
                </ToastProvider>
            );
        }

        // Show Super Admin Panel
        return (
            <ToastProvider>
                <SuperAdminProvider>
                    <SuperAdminPanel />
                </SuperAdminProvider>
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
            <CustomerJourneyProvider>
                <QRCodeEntryHandler />
                {!user ? (
                    <AuthPage />
                ) : userRole === 'staff' ? (
                    <KitchenDisplaySystem />
                ) : (userRole === 'admin' || userRole === 'super-admin') ? (
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
                                Back to Admin
                            </button>
                        </>
                    ) : (
                        <AdminPanel activePage={adminPage} setActivePage={setAdminPage} />
                    )
                ) : (
                    <CustomerFlowRouter />
                )}
                <OfflineIndicator />
            </CustomerJourneyProvider>
        </ToastProvider>
    );
};

/**
 * QRCodeEntryHandler Component
 *
 * Parses URL query parameters on mount to detect QR code table entries.
 * If ?table={number} is present, it automatically sets the journey state
 * to skip navigation screens and go directly to the menu.
 */
const QRCodeEntryHandler: React.FC = () => {
    const { setTableNumber } = useCustomerJourney();

    useEffect(() => {
        // Parse URL query parameters
        const params = new URLSearchParams(window.location.search);
        const tableParam = params.get('table');

        if (tableParam) {
            const tableNumber = parseInt(tableParam, 10);
            if (!isNaN(tableNumber) && tableNumber > 0) {
                console.log(`QR code entry detected: Table ${tableNumber}`);
                setTableNumber(tableNumber);
            } else {
                console.warn(`Invalid table number in URL: ${tableParam}`);
            }
        }
    }, []); // Run only once on mount

    return null; // This component doesn't render anything
};

export default App;
