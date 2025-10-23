import React from 'react';
import { Order, AppSettings } from '../types';
import { styles } from '../styles';
import { formatCurrency } from '../utils';
import { ClipboardIcon } from './Icons';

const formatDisplayTime = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    const isTomorrow = date.getDate() === tomorrow.getDate() && date.getMonth() === tomorrow.getMonth() && date.getFullYear() === tomorrow.getFullYear();

    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Today at ${time}`;
    if (isTomorrow) return `Tomorrow at ${time}`;
    return `${date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at ${time}`;
};

const LoyaltyCard = ({ points, settings }: { points: number, settings: AppSettings }) => {
    if (!settings.loyaltyEnabled) return null;
    
    const progress = settings.pointsToReward > 0 ? (points / settings.pointsToReward) * 100 : 0;

    return (
        <div style={styles.loyaltyCard}>
            <p style={{margin: '0 0 5px 0', opacity: 0.8}}>Your Reward Points</p>
            <p style={styles.loyaltyPoints}>{points}</p>
            <div style={styles.loyaltyProgressContainer}>
                <div style={{...styles.loyaltyProgressBar, width: `${progress}%` }}></div>
            </div>
            <p style={{margin: '10px 0 0 0', fontSize: '0.9em', opacity: 0.8}}>
                {settings.pointsToReward - points > 0 
                    ? `${settings.pointsToReward - points} points until your next free drink!`
                    : "You have a reward available!"}
            </p>
        </div>
    );
};

export const OrderScreen = ({ order, loyaltyPoints, settings }: { order: Order | null; loyaltyPoints: number; settings: AppSettings; }) => {
    if (!order) {
        return (
            <div style={{...styles.screen, flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
                 {settings.loyaltyEnabled && <LoyaltyCard points={loyaltyPoints} settings={settings} />}
                <div style={styles.emptyMessage}>
                    <ClipboardIcon />
                    <p>You have no active orders.</p>
                    <p style={{fontSize: '0.9em'}}>Your placed orders will appear here.</p>
                </div>
            </div>
        );
    }
    
    const statusStyle = {
        ...styles.orderStatus,
        ...(order.status === 'Placed' && styles.orderStatusPlaced),
        ...(order.status === 'Preparing' && styles.orderStatusPreparing),
        ...(order.status === 'Ready for Collection' && styles.orderStatusReady),
    };

    return (
        <div style={styles.screen}>
            {settings.loyaltyEnabled && <LoyaltyCard points={loyaltyPoints} settings={settings} />}
            <h2 style={styles.categoryTitle}>Your Order</h2>
            <div style={styles.orderCard}>
                <div style={styles.orderHeader}>
                    <span style={styles.orderId}>Order #{order.id}</span>
                    <span style={statusStyle}>{order.status}</span>
                </div>
                <p style={styles.orderTime}>Collection: <strong>{formatDisplayTime(order.collectionTime)}</strong></p>
                <ul style={{...styles.cartList, marginBottom: '15px' }}>
                     {order.items.map(item => (
                        <li key={item.cartItemId} style={{...styles.cartItem, border: 'none', paddingBottom: 0, marginBottom: '10px'}}>
                            <img src={item.imageUrl} alt={item.name} style={{...styles.cartItemImage, width: '40px', height: '40px'}} />
                            <div style={styles.cartItemInfo}>
                                <p style={{...styles.cartItemName, margin: 0}}>{item.name} <span style={styles.cartItemPrice}>(x{item.quantity})</span></p>
                                {item.selectedOptions && item.selectedOptions.length > 0 && (
                                     <ul style={{...styles.cartItemOptions, paddingLeft: '10px', margin: '2px 0 0 0'}}>
                                        {item.selectedOptions.map(opt => <li key={opt.name}>{opt.name}</li>)}
                                    </ul>
                                )}
                            </div>
                            <p style={styles.cartItemPrice}>{formatCurrency(item.price * item.quantity, settings.currency)}</p>
                        </li>
                    ))}
                </ul>
                 {order.rewardApplied && (
                    <div style={{...styles.summaryRow, color: 'var(--accent-color)', padding: '10px 0'}}>
                        <span>Reward Redeemed ({order.rewardApplied.itemName})</span>
                        <span>-{formatCurrency(order.rewardApplied.discountAmount, settings.currency)}</span>
                    </div>
                 )}
                <p style={styles.orderTotal}>Total: {formatCurrency(order.total, settings.currency)}</p>
            </div>
        </div>
    );
};