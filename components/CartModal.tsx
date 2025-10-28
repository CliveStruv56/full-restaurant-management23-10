import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CartItem, AppSettings, Order, TimeSlot } from '../types';
import { styles } from '../styles';
import { formatCurrency, generateAvailableSlots } from '../utils';
import { ShoppingCartIcon } from './Icons';
import { DateSlotsModal } from './DateSlotsModal';
import { FloorPlanDisplay } from './customer/FloorPlanDisplay';

interface CartModalProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
    onPlaceOrder: (
        collectionTime: string,
        finalTotal: number,
        orderType: 'takeaway' | 'dine-in' | 'delivery',
        tableNumber?: number,
        guestCount?: number,
        rewardItem?: { name: string, price: number }
    ) => void;
    settings: AppSettings;
    orders: Order[];
    loyaltyPoints: number;
    isRewardApplied: boolean;
    onRewardToggle: (isApplied: boolean) => void;
    initialOrderType?: 'takeaway' | 'dine-in' | 'delivery';
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


export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose, cart, onUpdateQuantity, onPlaceOrder, settings, orders, loyaltyPoints, isRewardApplied, onRewardToggle, initialOrderType }) => {
    const [selectedTime, setSelectedTime] = useState('');
    const [orderType, setOrderType] = useState<'takeaway' | 'dine-in' | 'delivery'>(initialOrderType || 'takeaway');
    const [tableNumber, setTableNumber] = useState<number | undefined>(undefined);
    const [guestCount, setGuestCount] = useState<number>(2);
    const [showFloorPlan, setShowFloorPlan] = useState(false);

    // Update orderType if initialOrderType changes (when user navigates from landing page)
    useEffect(() => {
        if (initialOrderType) {
            setOrderType(initialOrderType);
        }
    }, [initialOrderType]);

    // Auto-set time for dine-in orders (already in restaurant)
    useEffect(() => {
        if (orderType === 'dine-in' && !selectedTime) {
            // Set to current time for dine-in
            const now = new Date();
            const isoString = now.toISOString();
            setSelectedTime(isoString);
        }
    }, [orderType, selectedTime]);
    
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

    const handleTableSelectFromFloorPlan = (selectedTableNumber: number) => {
        setTableNumber(selectedTableNumber);
        setShowFloorPlan(false);
        toast.success(`Table ${selectedTableNumber} selected`);
    };

    const handlePlaceOrderClick = () => {
        // For takeaway orders, time selection is required
        if (orderType === 'takeaway' && !selectedTime) {
            toast.error("Please select a collection time.");
            return;
        }
        // For dine-in, time is auto-set
        if (orderType === 'dine-in' && !selectedTime) {
            const now = new Date();
            setSelectedTime(now.toISOString());
        }
        if (cart.length === 0) return;

        // Validate dine-in specific fields
        if (orderType === 'dine-in') {
            if (tableNumber === undefined || tableNumber === null) {
                toast.error("Please select a table number for dine-in orders.");
                return;
            }
            if (!guestCount || guestCount < 1) {
                toast.error("Please enter the number of guests.");
                return;
            }
        }

        const reward = isRewardApplied && rewardEligibleItem ? { name: rewardEligibleItem.name, price: rewardEligibleItem.price } : undefined;
        onPlaceOrder(
            selectedTime,
            finalTotal,
            orderType,
            orderType === 'dine-in' ? tableNumber : undefined,
            orderType === 'dine-in' ? guestCount : undefined,
            reward
        );
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

                            {/* Order Type Selection - Locked if initialOrderType is provided */}
                            <div style={{marginTop: '20px'}}>
                                <label style={styles.adminLabel}>Order Type {initialOrderType && <span style={{fontSize: '12px', color: '#6b7280', fontWeight: 'normal'}}>(Selected from menu)</span>}</label>
                                <div style={{display: 'flex', gap: '10px', marginTop: '8px'}}>
                                    <button
                                        onClick={() => !initialOrderType && setOrderType('takeaway')}
                                        disabled={!!initialOrderType}
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            backgroundColor: orderType === 'takeaway' ? '#10b981' : '#f3f4f6',
                                            color: orderType === 'takeaway' ? 'white' : '#374151',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: initialOrderType ? 'not-allowed' : 'pointer',
                                            fontWeight: 600,
                                            fontSize: '14px',
                                            opacity: initialOrderType && orderType !== 'takeaway' ? 0.5 : 1,
                                        }}
                                    >
                                        🛍️ Takeaway
                                    </button>
                                    <button
                                        onClick={() => !initialOrderType && setOrderType('dine-in')}
                                        disabled={!!initialOrderType}
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            backgroundColor: orderType === 'dine-in' ? '#10b981' : '#f3f4f6',
                                            color: orderType === 'dine-in' ? 'white' : '#374151',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: initialOrderType ? 'not-allowed' : 'pointer',
                                            fontWeight: 600,
                                            fontSize: '14px',
                                            opacity: initialOrderType && orderType !== 'dine-in' ? 0.5 : 1,
                                        }}
                                    >
                                        🍽️ Dine-In
                                    </button>
                                </div>
                            </div>

                            {/* Dine-In Specific Fields */}
                            {orderType === 'dine-in' && (
                                <div style={{marginTop: '20px'}}>
                                    <div style={{display: 'flex', gap: '15px'}}>
                                        <div style={{flex: 1}}>
                                            <label style={styles.adminLabel}>Table Number</label>
                                            <select
                                                value={tableNumber ?? ''}
                                                onChange={(e) => setTableNumber(e.target.value ? Number(e.target.value) : undefined)}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    marginTop: '5px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '6px',
                                                    fontSize: '14px',
                                                }}
                                            >
                                                <option value="">Select table...</option>
                                                {(settings.availableTables || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).map(table => (
                                                    <option key={table} value={table}>Table {table}</option>
                                                ))}
                                            </select>
                                            {/* Floor Plan Button */}
                                            {settings.floorPlanEnabled && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowFloorPlan(true)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        marginTop: '8px',
                                                        backgroundColor: '#eff6ff',
                                                        color: '#2563eb',
                                                        border: '1px solid #2563eb',
                                                        borderRadius: '6px',
                                                        fontSize: '13px',
                                                        fontWeight: '500',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    📍 View Floor Plan
                                                </button>
                                            )}
                                        </div>
                                        <div style={{flex: 1}}>
                                            <label style={styles.adminLabel}>Number of Guests</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="20"
                                                value={guestCount}
                                                onChange={(e) => setGuestCount(Number(e.target.value))}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    marginTop: '5px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '6px',
                                                    fontSize: '14px',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Time Slot Picker - Only show for takeaway orders */}
                            {orderType === 'takeaway' && (
                                <div style={{marginTop: '20px'}}>
                                    <TimeSlotPicker
                                        settings={settings}
                                        orders={orders}
                                        selectedTime={selectedTime}
                                        onSelectTime={setSelectedTime}
                                    />
                                </div>
                            )}

                            {/* Dine-in info message */}
                            {orderType === 'dine-in' && (
                                <div style={{
                                    marginTop: '20px',
                                    padding: '12px',
                                    backgroundColor: '#eff6ff',
                                    borderRadius: '8px',
                                    border: '1px solid #bfdbfe',
                                }}>
                                    <p style={{margin: 0, fontSize: '14px', color: '#1e40af'}}>
                                        ℹ️ Your order will be prepared immediately for dine-in service.
                                    </p>
                                </div>
                            )}
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

            {/* Floor Plan Modal */}
            {showFloorPlan && settings.floorPlanEnabled && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                }} onClick={() => setShowFloorPlan(false)}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        maxWidth: '90vw',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        position: 'relative',
                    }} onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setShowFloorPlan(false)}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                border: 'none',
                                backgroundColor: '#f3f4f6',
                                color: '#374151',
                                fontSize: '20px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1,
                            }}
                            aria-label="Close"
                        >
                            ✕
                        </button>
                        <FloorPlanDisplay
                            onTableSelect={handleTableSelectFromFloorPlan}
                            settings={settings}
                            showAllStatuses={false}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};