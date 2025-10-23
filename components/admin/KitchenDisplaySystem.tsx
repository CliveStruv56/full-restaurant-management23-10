import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Order } from '../../types';
import { styles } from '../../styles';
import { streamOrders, updateOrderStatus } from '../../firebase/api';
import { useAuth } from '../../contexts/AuthContext';

// --- PROPS INTERFACE ---
interface KDSProps {
    onBackToAdmin?: () => void;
}

// --- HELPER FUNCTIONS ---
const formatElapsedTime = (orderTime: string, currentTime: Date): string => {
    const diffMs = currentTime.getTime() - new Date(orderTime).getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
    }

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m ago`;
};

const isOrderOverdue = (orderTime: string, collectionTime: string, currentTime: Date, status: Order['status']): boolean => {
    // Only check if order is in "New" or "Preparing" status
    if (status === 'Ready for Collection' || status === 'Completed') {
        return false;
    }

    const orderDate = new Date(orderTime);
    const collectionDate = new Date(collectionTime);
    const timeSinceOrder = currentTime.getTime() - orderDate.getTime();
    const timeUntilCollection = collectionDate.getTime() - currentTime.getTime();

    // Order is overdue if:
    // 1. It's been in the system for more than 15 minutes AND still in "New" status
    // 2. OR collection time is in less than 5 minutes and still "New"
    // 3. OR collection time has passed
    if (status === 'Placed' && timeSinceOrder > 15 * 60000) {
        return true; // Been sitting for 15+ minutes
    }
    if (timeUntilCollection < 5 * 60000 && status === 'Placed') {
        return true; // Collection soon but not started
    }
    if (timeUntilCollection < 0) {
        return true; // Collection time passed
    }

    return false;
};

const formatCollectionTime = (collectionTime: string) => {
    return new Date(collectionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// --- SUB-COMPONENTS ---
const OrderCard: React.FC<{
    order: Order;
    onUpdateStatus: (id: string, status: Order['status']) => void;
    currentTime: Date;
    stage: 'new' | 'preparing' | 'ready';
}> = ({ order, onUpdateStatus, currentTime, stage }) => {

    const collectionDate = useMemo(() => new Date(order.collectionTime), [order.collectionTime]);
    const tenMinutesFromNow = useMemo(() => new Date(currentTime.getTime() + 10 * 60000), [currentTime]);
    const fiveMinutesFromNow = useMemo(() => new Date(currentTime.getTime() + 5 * 60000), [currentTime]);

    const isOverdue = useMemo(() =>
        isOrderOverdue(order.orderTime, order.collectionTime, currentTime, order.status),
        [order.orderTime, order.collectionTime, currentTime, order.status]
    );

    const cardStyle = useMemo(() => {
        let borderColor = 'transparent';
        let backgroundColor = '#ffffff';

        // Overdue orders get red background and border
        if (isOverdue) {
            borderColor = '#dc2626'; // Dark red
            backgroundColor = '#fee2e2'; // Light red background
        } else if (collectionDate < currentTime) {
            borderColor = '#ef4444'; // Red for late
        } else if (collectionDate < fiveMinutesFromNow) {
            borderColor = '#f97316'; // Orange for very soon
        } else if (collectionDate < tenMinutesFromNow) {
            borderColor = '#eab308'; // Yellow for soon
        }

        return {
            ...styles.kdsCard,
            borderTop: `5px solid ${borderColor}`,
            backgroundColor: backgroundColor,
            border: isOverdue ? `3px solid ${borderColor}` : styles.kdsCard.border,
        };
    }, [collectionDate, currentTime, fiveMinutesFromNow, tenMinutesFromNow, isOverdue]);

    const actionButton = useMemo(() => {
        switch (stage) {
            case 'new':
                return <button style={styles.kdsActionButton} onClick={() => onUpdateStatus(order.id, 'Preparing')}>Start Preparing</button>;
            case 'preparing':
                return <button style={{...styles.kdsActionButton, ...styles.kdsActionButtonReady}} onClick={() => onUpdateStatus(order.id, 'Ready for Collection')}>Mark as Ready</button>;
            case 'ready':
                return <button style={styles.adminButtonSecondary} onClick={() => onUpdateStatus(order.id, 'Completed')}>Complete Order</button>;
            default:
                return null;
        }
    }, [stage, order.id, onUpdateStatus]);

    return (
        <div style={{...cardStyle, color: isOverdue ? '#1f2937' : cardStyle.color}}>
            <div style={styles.kdsCardHeader}>
                <span style={{...styles.kdsOrderId, color: isOverdue ? '#1f2937' : styles.kdsOrderId.color}}>
                    #{order.id.slice(-6)}
                </span>
                <span style={{...styles.kdsOrderTime, color: isOverdue ? '#4b5563' : styles.kdsOrderTime.color}}>
                    {formatElapsedTime(order.orderTime, currentTime)}
                </span>
            </div>
            {isOverdue && (
                <div style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    textAlign: 'center',
                    marginBottom: '12px',
                    letterSpacing: '0.5px',
                }}>
                    ⚠️ OVERDUE
                </div>
            )}
            <p style={{...styles.kdsCollectionTime, color: isOverdue ? '#1f2937' : styles.kdsCollectionTime.color}}>
                For: <strong>{formatCollectionTime(order.collectionTime)}</strong>
            </p>
            <ul style={styles.kdsItemList}>
                {order.items.map(item => (
                    <li key={item.cartItemId} style={styles.kdsItem}>
                        <span style={{...styles.kdsItemQuantity, color: isOverdue ? '#1f2937' : styles.kdsItemQuantity.color}}>
                            {item.quantity}x
                        </span>
                        <div style={styles.kdsItemInfo}>
                            <p style={{...styles.kdsItemName, margin: 0, color: isOverdue ? '#1f2937' : styles.kdsItemName.color}}>
                                {item.name}
                            </p>
                            {item.selectedOptions.length > 0 && (
                                <ul style={{...styles.kdsItemOptions, color: isOverdue ? '#4b5563' : styles.kdsItemOptions.color}}>
                                    {item.selectedOptions.map(opt => <li key={opt.name}>{opt.name}</li>)}
                                </ul>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
            {actionButton}
        </div>
    );
};

const ArchiveModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    orders: Order[];
}> = ({ isOpen, onClose, orders }) => {
    if (!isOpen) return null;

    return (
        <div style={styles.adminModalOverlay} onClick={onClose}>
            <div style={{...styles.adminModalContent, backgroundColor: '#374151', color: '#f9fafb'}} onClick={e => e.stopPropagation()}>
                <header style={styles.adminModalHeader}>
                    <h3 style={styles.adminModalTitle}>Completed Order Archive</h3>
                    <button style={{...styles.closeButton, color: '#f9fafb'}} onClick={onClose}>&times;</button>
                </header>
                <div style={{...styles.adminForm, padding: '10px'}}>
                    {orders.length === 0 ? (
                        <p style={{textAlign: 'center', color: '#d1d5db'}}>No completed orders to show.</p>
                    ) : (
                         <div style={styles.adminTableContainer}>
                            <table style={{...styles.adminTable, backgroundColor: '#4b5563'}}>
                                <thead>
                                    <tr>
                                        <th style={{...styles.adminTh, color: 'white'}}>Order</th>
                                        <th style={{...styles.adminTh, color: 'white'}}>Collected At</th>
                                        <th style={{...styles.adminTh, color: 'white'}}>Items</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order.id}>
                                            <td style={{...styles.adminTd, color: 'white'}}>#{order.id.slice(-6)}</td>
                                            <td style={{...styles.adminTd, color: 'white'}}>{formatCollectionTime(order.collectionTime)}</td>
                                            <td style={{...styles.adminTd, color: 'white'}}>
                                                {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- MAIN COMPONENT ---
export const KitchenDisplaySystem: React.FC<KDSProps> = ({ onBackToAdmin }) => {
    const { logout } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isArchiveVisible, setIsArchiveVisible] = useState(false);

    // Subscribe to orders stream
    useEffect(() => {
        const unsubscribe = streamOrders(setOrders);
        return () => unsubscribe();
    }, []);

    // Update current time every 10 seconds to refresh elapsed times and urgency
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 10000);
        return () => clearInterval(timer);
    }, []);

    const handleUpdateStatus = (orderId: string, newStatus: Order['status']) => {
        updateOrderStatus(orderId, newStatus);
    };

    const { newOrders, preparingOrders, readyOrders, archivedOrders } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const active = orders.filter(o => o.status !== 'Completed');
        const archived = orders.filter(o => o.status === 'Completed').sort((a,b) => new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime());

        const relevantOrders = active
            .filter(order => {
                const collectionDate = new Date(order.collectionTime);
                // Only show orders for today
                return collectionDate.toDateString() === today.toDateString();
            })
            .sort((a, b) => new Date(a.collectionTime).getTime() - new Date(b.collectionTime).getTime());

        return {
            newOrders: relevantOrders.filter(o => o.status === 'Placed'),
            preparingOrders: relevantOrders.filter(o => o.status === 'Preparing'),
            readyOrders: relevantOrders.filter(o => o.status === 'Ready for Collection'),
            archivedOrders: archived
        };
    }, [orders]);


    return (
        <div style={styles.kdsContainer}>
            <header style={styles.kdsHeader}>
                <h1 style={styles.kdsTitle}>Kitchen Display</h1>
                <div style={{display: 'flex', gap: '15px'}}>
                    <button style={styles.adminButtonSecondary} onClick={() => setIsArchiveVisible(true)}>View Archive</button>
                    {onBackToAdmin && <button style={styles.kdsBackButton} onClick={onBackToAdmin}>Back to Admin</button>}
                    <button style={{...styles.adminButtonSecondary, backgroundColor: '#dc3545', color: 'white'}} onClick={logout}>Logout</button>
                </div>
            </header>
            <div style={styles.kdsColumnsContainer}>
                {/* New Orders Column */}
                <div style={styles.kdsColumn}>
                    <h2 style={styles.kdsColumnTitle}>New ({newOrders.length})</h2>
                    <div style={styles.kdsColumnContent}>
                        {newOrders.map(order => <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} currentTime={currentTime} stage="new" />)}
                    </div>
                </div>
                {/* Preparing Column */}
                <div style={styles.kdsColumn}>
                    <h2 style={styles.kdsColumnTitle}>Preparing ({preparingOrders.length})</h2>
                    <div style={styles.kdsColumnContent}>
                        {preparingOrders.map(order => <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} currentTime={currentTime} stage="preparing" />)}
                    </div>
                </div>
                {/* Ready for Collection Column */}
                <div style={styles.kdsColumn}>
                    <h2 style={styles.kdsColumnTitle}>Ready ({readyOrders.length})</h2>
                    <div style={styles.kdsColumnContent}>
                        {readyOrders.map(order => <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} currentTime={currentTime} stage="ready" />)}
                    </div>
                </div>
            </div>
            <ArchiveModal isOpen={isArchiveVisible} onClose={() => setIsArchiveVisible(false)} orders={archivedOrders} />
        </div>
    );
};
