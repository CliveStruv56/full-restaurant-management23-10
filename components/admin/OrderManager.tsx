import React from 'react';
import { Order, AppSettings } from '../../types';
import { styles } from '../../styles';
import { formatCurrency } from '../../utils';
import { useTenant } from '../../contexts/TenantContext';
import { updateOrderStatus } from '../../firebase/api-multitenant';

interface OrderManagerProps {
    orders: Order[];
    settings: AppSettings;
}

const formatDisplayTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const OrderManager: React.FC<OrderManagerProps> = ({ orders, settings }) => {
    const { tenant } = useTenant();
    const tenantId = tenant?.id;

    const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
        if (!tenantId) return;
        await updateOrderStatus(tenantId, orderId, newStatus);
    };
    
    const getStatusStyle = (status: Order['status']): React.CSSProperties => {
        switch (status) {
            case 'Placed': return styles.adminOrderStatusPlaced;
            case 'Preparing': return styles.adminOrderStatusPreparing;
            case 'Ready for Collection': return styles.adminOrderStatusReady;
            default: return {};
        }
    };

    const getActionForStatus = (order: Order) => {
        switch (order.status) {
            case 'Placed':
                return <button style={styles.adminButtonPrimary} onClick={() => handleStatusChange(order.id, 'Preparing')}>Mark as Preparing</button>;
            case 'Preparing':
                return <button style={{...styles.adminButtonPrimary, backgroundColor: '#2ecc71'}} onClick={() => handleStatusChange(order.id, 'Ready for Collection')}>Mark as Ready</button>;
            case 'Ready for Collection':
                 return <button style={styles.adminButtonSecondary} onClick={() => handleStatusChange(order.id, 'Completed')}>Mark as Completed</button>;
            case 'Completed':
                return <span style={{color: 'var(--light-text-color)'}}>Completed</span>;
            default:
                return null;
        }
    };

    const sortedOrders = [...orders].sort((a, b) => new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime());

    return (
        <>
            <h2 style={styles.adminHeader}>Manage Orders</h2>
            <div style={styles.adminTableContainer}>
                {sortedOrders.length > 0 ? (
                    <table style={styles.adminTable}>
                        <thead>
                            <tr>
                                <th style={styles.adminTh}>Order ID</th>
                                <th style={styles.adminTh}>Customer</th>
                                <th style={styles.adminTh}>Collection Time</th>
                                <th style={styles.adminTh}>Items</th>
                                <th style={styles.adminTh}>Total</th>
                                <th style={styles.adminTh}>Status</th>
                                <th style={styles.adminTh}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedOrders.map(order => (
                                <tr key={order.id}>
                                    <td style={{...styles.adminTd, verticalAlign: 'top'}}>#{order.id.slice(-6)}</td>
                                    <td style={{...styles.adminTd, verticalAlign: 'top', fontWeight: 600}}>{order.customerName || 'Guest'}</td>
                                    <td style={{...styles.adminTd, verticalAlign: 'top'}}>{formatDisplayTime(order.collectionTime)}</td>
                                    <td style={styles.adminTd}>
                                        {order.items.map(item => (
                                            <div key={item.cartItemId} style={{marginBottom: '5px'}}>
                                                <strong>{item.name} (x{item.quantity})</strong>
                                                {item.selectedOptions.length > 0 && (
                                                    <ul style={{...styles.cartItemOptions, paddingLeft: '15px', margin: '2px 0 0 0'}}>
                                                        {item.selectedOptions.map(opt => <li key={opt.name}>{opt.name}</li>)}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                    </td>
                                    <td style={{...styles.adminTd, verticalAlign: 'top'}}>
                                        {formatCurrency(order.total, settings.currency)}
                                        {order.rewardApplied && (
                                            <span style={{...styles.adminOrderStatus, backgroundColor: 'var(--accent-color)', marginLeft: '10px', fontSize: '0.75em'}}>
                                                Reward
                                            </span>
                                        )}
                                    </td>
                                    <td style={{...styles.adminTd, verticalAlign: 'top'}}>
                                        <span style={{...styles.adminOrderStatus, ...getStatusStyle(order.status)}}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td style={{...styles.adminTd, verticalAlign: 'top'}}>
                                        {getActionForStatus(order)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--light-text-color)'}}>
                        No active orders.
                    </div>
                )}
            </div>
        </>
    );
};