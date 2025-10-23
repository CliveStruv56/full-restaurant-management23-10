import React from 'react';
import { Order, Product, Category, AppSettings } from '../../types';
import { styles } from '../../styles';
import { ProductManager } from './ProductManager';
import { SettingsManager } from './SettingsManager';
import { OrderManager } from './OrderManager';
import { CategoryManager } from './CategoryManager';
import { DashboardIcon, ProductsIcon, OrdersIcon, SettingsIcon, CategoryIcon, KitchenIcon } from '../Icons';
import { useAuth } from '../../contexts/AuthContext';
import { streamCategories, streamOrders, streamProducts, streamSettings } from '../../firebase/api';

interface AdminPanelProps {
    activePage: string;
    setActivePage: React.Dispatch<React.SetStateAction<string>>;
}

const SidebarButton: React.FC<{
    page: string;
    label: string;
    icon: React.ReactNode;
    activePage: string;
    setActivePage: (page: string) => void;
}> = ({ page, label, icon, activePage, setActivePage }) => {
    const isActive = activePage === page;
    const className = `sidebar-button ${isActive ? 'active' : ''}`;
    
    return (
        <button 
            onClick={() => setActivePage(page)} 
            style={styles.adminSidebarButton} // Keep base styles
            className={className.trim()}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
};


export const AdminPanel: React.FC<AdminPanelProps> = ({ activePage, setActivePage }) => {
    const { logout } = useAuth();

    // Data fetching has been moved to the parent App component to be passed down
    // This simplifies the AdminPanel and centralizes data management.
    const [products, setProducts] = React.useState<Product[]>([]);
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [settings, setSettings] = React.useState<AppSettings | null>(null);
    const [orders, setOrders] = React.useState<Order[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const unsubProducts = streamProducts(setProducts);
        const unsubCategories = streamCategories(setCategories);
        const unsubOrders = streamOrders(setOrders);
        const unsubSettings = streamSettings((settingsData) => {
            setSettings(settingsData);
            setLoading(false); 
        });

        return () => {
            unsubProducts();
            unsubCategories();
            unsubOrders();
            unsubSettings();
        };
    }, []);
    
    const renderContent = () => {
        if (loading || !settings) {
            return <div style={styles.adminContentPlaceholder}>Loading admin data...</div>;
        }

        switch (activePage) {
            case 'products':
                return <ProductManager products={products} categories={categories} settings={settings} />;
            case 'categories':
                return <CategoryManager categories={categories} settings={settings} />;
            case 'orders':
                return <OrderManager orders={orders} settings={settings} />;
            case 'settings':
                 return <SettingsManager settings={settings} />;
            default:
                return (
                    <div>
                        <h2 style={styles.adminHeader}>Welcome, Admin!</h2>
                        <div style={styles.adminContentPlaceholder}>
                             <p>Select a category from the sidebar to manage your shop.</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div style={styles.adminContainer}>
             {/* Simple style block for reliable hover effects */}
            <style>{`
                .sidebar-button.active {
                    background-color: #495057;
                    color: white;
                }
                .sidebar-button:not(.active):hover {
                    background-color: #495057;
                    color: #dee2e6;
                }
                .logout-button:hover {
                    background-color: #dc3545;
                    color: white;
                }
                .preview-customer-button:hover {
                    background-color: #238276 !important;
                }
            `}</style>
            <aside style={styles.adminSidebar}>
                <h1 style={styles.adminSidebarTitle}>Admin Panel</h1>
                <nav style={styles.adminSidebarNav}>
                    <SidebarButton page="dashboard" label="Dashboard" icon={<DashboardIcon />} activePage={activePage} setActivePage={setActivePage} />
                    <SidebarButton page="kitchen" label="Kitchen View" icon={<KitchenIcon />} activePage={activePage} setActivePage={setActivePage} />
                    <SidebarButton page="categories" label="Categories" icon={<CategoryIcon />} activePage={activePage} setActivePage={setActivePage} />
                    <SidebarButton page="products" label="Products" icon={<ProductsIcon />} activePage={activePage} setActivePage={setActivePage} />
                    <SidebarButton page="orders" label="Orders" icon={<OrdersIcon />} activePage={activePage} setActivePage={setActivePage} />
                    <SidebarButton page="settings" label="Settings" icon={<SettingsIcon />} activePage={activePage} setActivePage={setActivePage} />
                </nav>
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                        style={{
                            ...styles.adminButtonSecondary,
                            width: '100%',
                            backgroundColor: '#2a9d8f',
                            color: 'white',
                            border: 'none',
                        }}
                        onClick={() => setActivePage('customer')}
                        className="preview-customer-button"
                    >
                        🛒 Preview Customer Menu
                    </button>
                    <button
                        style={styles.adminLogoutButton}
                        onClick={logout}
                        className="logout-button"
                    >
                        Logout
                    </button>
                </div>
            </aside>
            <main style={styles.adminMain}>
                {renderContent()}
            </main>
        </div>
    );
};