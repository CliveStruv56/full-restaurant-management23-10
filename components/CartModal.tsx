import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CartItem, AppSettings, Order, TimeSlot } from '../types';
import { styles } from '../styles';
import { formatCurrency, generateAvailableSlots } from '../utils';
import { ShoppingCartIcon } from './Icons';
import { DateSlotsModal } from './DateSlotsModal';

interface CartModalProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
    onPlaceOrder: (collectionTime: string, finalTotal: number, rewardItem?: { name: string, price: number }) => void;
    settings: AppSettings;
    orders: Order[];
    loyaltyPoints: number;
    isRewardApplied: boolean;
    onRewardToggle: (isApplied: boolean) => void;
}

const TimeSlotPicker = ({ settings, orders, selectedTime, onSelectTime }: { settings: AppSettings, orders: Order[], selectedTime: string, onSelectTime: (time: string) => void }) => {
    const [viewingDate, setViewingDate] = useState<string | null>(null);
    const timeSlots = useMemo(() => generateAvailableSlots(settings, orders), [settings, orders]);
    
    useEffect(() => {
        if (timeSlots.length > 0 && !selectedTime) {
            onSelectTime(timeSlots[0].value);
        }
        if (timeSlots.length === 0 && selectedTime) {
            onSelectTime('');
        }
    }, [timeSlots, selectedTime, onSelectTime]);

    const groupedSlots = useMemo(() => {
        return timeSlots.reduce((acc, slot) => {
            (acc[slot.group] = acc[slot.group] || []).push(slot);
            return acc;
        }, {} as Record<string, TimeSlot[]>);
    }, [timeSlots]);

    const groupOrder = useMemo(() => {
        return Object.keys(groupedSlots).sort((a, b) => {
            if (a === 'Today') return -1;
            if (b === 'Today') return 1;
            if (a === 'Tomorrow') return -1;
            if (b === 'Tomorrow') return 1;
            // A simple date sort isn't feasible, but this order is good enough
            return 0; 
        });
    }, [groupedSlots]);
    
    const selectedDateGroup = useMemo(() => {
        if (!selectedTime) return null;
        const slot = timeSlots.find(s => s.value === selectedTime);
        return slot ? slot.group : null;
    }, [selectedTime, timeSlots]);

    if (timeSlots.length === 0) {
        return <p style={{textAlign: 'center', color: 'var(--light-text-color)'}}>No collection slots available right now.</p>;
    }

    return (
        <div>
            <label style={styles.adminLabel}>Select Collection Time</label>
            {groupOrder.map(groupName => {
                if (groupName === 'Today') {
                    return (
                        <div key={groupName}>
                            <h4 style={styles.timeSlotGroupHeader}>{groupName}</h4>
                            <div style={styles.timeSlotGrid}>
                                {groupedSlots[groupName].map(slot => (
                                    <button 
                                        key={slot.value} 
                                        style={selectedTime === slot.value ? {...styles.timeSlotButton, ...styles.timeSlotButtonActive} : styles.timeSlotButton}
                                        onClick={() => onSelectTime(slot.value)}
                                    >
                                        {slot.time}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                } else {
                    return (
                        <div key={groupName} style={{marginTop: groupName === 'Tomorrow' ? '20px' : 0 }}>
                            <button
                                style={selectedDateGroup === groupName ? {...styles.datePickerButton, ...styles.datePickerButtonActive} : styles.datePickerButton}
                                onClick={() => setViewingDate(groupName)}
                            >
                                {groupName} {selectedDateGroup === groupName && `- ${new Date(selectedTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                            </button>
                        </div>
                    )
                }
            })}

            {viewingDate && groupedSlots[viewingDate] && (
                 <DateSlotsModal
                    isOpen={!!viewingDate}
                    onClose={() => setViewingDate(null)}
                    dateLabel={viewingDate}
                    slots={groupedSlots[viewingDate]}
                    selectedTime={selectedTime}
                    onSelectTime={onSelectTime}
                />
            )}
        </div>
    );
};


export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose, cart, onUpdateQuantity, onPlaceOrder, settings, orders, loyaltyPoints, isRewardApplied, onRewardToggle }) => {
    const [selectedTime, setSelectedTime] = useState('');
    
    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
    
    const rewardEligibleItem = useMemo(() => {
        if (!settings.loyaltyEnabled || loyaltyPoints < settings.pointsToReward) return null;
        // Find the most expensive drink
        const drinks = cart.filter(item => item.categoryId.includes('drink'));
        if (drinks.length === 0) return null;
        return drinks.reduce((mostExpensive, current) => current.price > mostExpensive.price ? current : mostExpensive);
    }, [cart, settings, loyaltyPoints]);

    const discount = isRewardApplied && rewardEligibleItem ? rewardEligibleItem.price : 0;
    const finalTotal = subtotal - discount;

    const handlePlaceOrderClick = () => {
        if (!selectedTime) {
            toast.error("Please select a collection time.");
            return;
        }
        if (cart.length === 0) return;

        const reward = isRewardApplied && rewardEligibleItem ? { name: rewardEligibleItem.name, price: rewardEligibleItem.price } : undefined;
        onPlaceOrder(selectedTime, finalTotal, reward);
    };

    if (!isOpen) return null;

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={{...styles.optionsModalContent, maxWidth: '600px'}} onClick={e => e.stopPropagation()}>
                <header style={styles.modalHeader}>
                    <h2 style={styles.modalTitle}>Your Order</h2>
                    <button style={styles.closeButton} onClick={onClose} aria-label="Close cart">&times;</button>
                </header>
                <div style={styles.modalBody}>
                    {cart.length === 0 ? (
                        <div style={styles.emptyMessage}>
                            <ShoppingCartIcon />
                            <p>Your cart is empty.</p>
                        </div>
                    ) : (
                        <>
                            <ul style={styles.cartList}>
                                {cart.map(item => (
                                    <li key={item.cartItemId} style={styles.cartItem}>
                                        <img src={item.imageUrl} alt={item.name} style={styles.cartItemImage} />
                                        <div style={styles.cartItemInfo}>
                                            <p style={styles.cartItemName}>{item.name}</p>
                                            {item.selectedOptions && item.selectedOptions.length > 0 && (
                                                <ul style={styles.cartItemOptions}>
                                                    {item.selectedOptions.map(opt => <li key={opt.name}>{opt.name}</li>)}
                                                </ul>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <button onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}>-</button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}>+</button>
                                        </div>
                                        <p style={{...styles.cartItemPrice, width: '80px', textAlign: 'right'}}>{formatCurrency(item.price * item.quantity, settings.currency)}</p>
                                    </li>
                                ))}
                            </ul>
                            
                            <div style={{marginTop: '20px'}}>
                                <div style={styles.summaryRow}>
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal, settings.currency)}</span>
                                </div>
                                {rewardEligibleItem && (
                                    <div style={{...styles.summaryRow, alignItems: 'center', ...styles.success}}>
                                        <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                                            <input type="checkbox" checked={isRewardApplied} onChange={e => onRewardToggle(e.target.checked)} style={{marginRight: '8px'}} />
                                            Apply Reward ({rewardEligibleItem.name})
                                        </label>
                                        <span>-{formatCurrency(rewardEligibleItem.price, settings.currency)}</span>
                                    </div>
                                )}
                                <div style={styles.cartTotal}>
                                    <span>Total</span>
                                    <span>{formatCurrency(finalTotal, settings.currency)}</span>
                                </div>
                            </div>
                            
                            <div style={{marginTop: '20px'}}>
                                <TimeSlotPicker 
                                    settings={settings} 
                                    orders={orders}
                                    selectedTime={selectedTime}
                                    onSelectTime={setSelectedTime}
                                />
                            </div>
                        </>
                    )}
                </div>
                <footer style={styles.optionsModalFooter}>
                    <button style={styles.adminButtonSecondary} onClick={onClose}>Continue Shopping</button>
                    <button 
                        style={styles.optionsModalButton} 
                        onClick={handlePlaceOrderClick}
                        disabled={cart.length === 0 || !selectedTime}
                    >
                        Place Order
                    </button>
                </footer>
            </div>
        </div>
    );
};