import React from 'react';
import { DailySpecial, Product, AppSettings } from '../types';
import { styles } from '../styles';
import { formatCurrency } from '../utils';
import { DailySpecialSkeleton } from './SkeletonLoader';

export const DailySpecialCard = ({ special, isLoading, onAddToCart, settings }: { special: DailySpecial | null; isLoading: boolean; onAddToCart: (items: Product[]) => void; settings: AppSettings; }) => {
    if (isLoading) {
        return <DailySpecialSkeleton />;
    }

    if (!special) return null;
    
    const totalPrice = special.drink.price + special.pastry.price;

    return (
        <div style={styles.specialCard}>
            <div style={styles.specialHeader}>
                <h2 style={styles.specialTitle}>✨ Daily Special</h2>
            </div>
            <div style={styles.specialBody}>
                <div style={styles.specialImages}>
                    <img src={special.drink.imageUrl} alt={special.drink.name} style={styles.specialImage} />
                    <img src={special.pastry.imageUrl} alt={special.pastry.name} style={{...styles.specialImage, ...styles.specialImageOverlap}} />
                </div>
                <div style={styles.specialInfo}>
                    <p style={styles.specialDescription}>{special.description}</p>
                    <div style={styles.specialPriceContainer}>
                        <span style={styles.specialPriceItem}>{special.drink.name}: {formatCurrency(special.drink.price, settings.currency)}</span>
                        <span style={styles.specialPriceItem}>+ {special.pastry.name}: {formatCurrency(special.pastry.price, settings.currency)}</span>
                        <span style={styles.specialPriceTotal}>Total: {formatCurrency(totalPrice, settings.currency)}</span>
                    </div>
                    <button style={styles.specialButton} onClick={() => onAddToCart([special.drink, special.pastry])}>
                        Add Pairing to Order
                    </button>
                </div>
            </div>
        </div>
    );
};