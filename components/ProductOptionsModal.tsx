import React, { useState, useMemo, useEffect } from 'react';
import { Product, Category, ProductOption, SizeOption, AppSettings } from '../types';
import { styles } from '../styles';
import { formatCurrency } from '../utils';
import { colors } from '../theme';

interface ProductOptionsModalProps {
    product: Product;
    category: Category;
    onClose: () => void;
    onAddToCart: (product: Product, selectedOptions: ProductOption[]) => void;
    settings: AppSettings;
}

export const ProductOptionsModal: React.FC<ProductOptionsModalProps> = ({ product, category, onClose, onAddToCart, settings }) => {
    const [selectedOptions, setSelectedOptions] = useState<ProductOption[]>([]);
    const [selectedSize, setSelectedSize] = useState<SizeOption | null>(null);

    // Auto-select Medium size on mount if category has sizes
    useEffect(() => {
        if (category.hasSizes && category.sizeOptions) {
            const mediumSize = category.sizeOptions.find(s => s.name === 'Medium');
            if (mediumSize) {
                setSelectedSize(mediumSize);
            }
        }
    }, [category]);

    const availableOptions = useMemo(() => {
        if (!product.availableOptionNames) return [];
        return category.options.filter(opt => product.availableOptionNames?.includes(opt.name));
    }, [product, category]);

    const handleOptionToggle = (option: ProductOption) => {
        setSelectedOptions(prev => {
            const isSelected = prev.some(o => o.name === option.name);
            if (isSelected) {
                return prev.filter(o => o.name !== option.name);
            }
            return [...prev, option];
        });
    };

    const totalPrice = useMemo(() => {
        // If category has sizes, use selected size price as base, otherwise use product price
        const basePrice = category.hasSizes && selectedSize
            ? product.price + selectedSize.price
            : product.price;

        const optionsPrice = selectedOptions.reduce((sum, opt) => sum + opt.price, 0);
        return basePrice + optionsPrice;
    }, [product, selectedOptions, selectedSize, category]);

    const handleAddToCartClick = () => {
        // Combine size (as ProductOption) with other options
        const allOptions = [...selectedOptions];

        // Add size to options if category has sizes
        if (category.hasSizes && selectedSize) {
            allOptions.unshift({ name: selectedSize.name, price: selectedSize.price });
        }

        onAddToCart(product, allOptions);
    };

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.optionsModalContent} onClick={e => e.stopPropagation()}>
                <header style={styles.modalHeader}>
                    <h2 style={styles.modalTitle}>Customize {product.name}</h2>
                    <button style={styles.closeButton} onClick={onClose} aria-label="Close customization">&times;</button>
                </header>
                <div style={styles.modalBody}>
                    {/* Size Selection (if category has sizes) */}
                    {category.hasSizes && category.sizeOptions && (
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{
                                fontSize: '16px',
                                fontWeight: 600,
                                marginBottom: '12px',
                                color: colors.text.primary,
                            }}>
                                Choose Size
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '12px',
                            }}>
                                {category.sizeOptions.map(size => (
                                    <label
                                        key={size.name}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            padding: '12px',
                                            border: selectedSize?.name === size.name
                                                ? `2px solid ${colors.primary[600]}`
                                                : `2px solid ${colors.border.light}`,
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            backgroundColor: selectedSize?.name === size.name
                                                ? colors.primary[50]
                                                : colors.background.secondary,
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="size"
                                            checked={selectedSize?.name === size.name}
                                            onChange={() => setSelectedSize(size)}
                                            style={{ display: 'none' }}
                                        />
                                        <span style={{
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            color: colors.text.primary,
                                            marginBottom: '4px',
                                        }}>
                                            {size.name}
                                        </span>
                                        <span style={{
                                            fontSize: '11px',
                                            color: colors.text.secondary,
                                            marginBottom: '4px',
                                        }}>
                                            {size.volume}
                                        </span>
                                        <span style={{
                                            fontSize: '12px',
                                            color: colors.primary[600],
                                            fontWeight: 500,
                                        }}>
                                            {size.price === 0
                                                ? formatCurrency(product.price, settings.currency)
                                                : `+${formatCurrency(size.price, settings.currency)}`
                                            }
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add-ons (existing options) */}
                    {availableOptions.length > 0 && (
                        <>
                            <h3 style={{
                                fontSize: '16px',
                                fontWeight: 600,
                                marginBottom: '12px',
                                color: colors.text.primary,
                            }}>
                                Add-ons (Optional)
                            </h3>
                            <ul style={styles.optionsList}>
                                {availableOptions.map(option => (
                                    <li key={option.name} style={styles.optionsItem}>
                                        <label style={styles.optionsLabel}>
                                            <input
                                                type="checkbox"
                                                style={styles.optionsCheckbox}
                                                checked={selectedOptions.some(o => o.name === option.name)}
                                                onChange={() => handleOptionToggle(option)}
                                            />
                                            {option.name}
                                        </label>
                                        <span style={styles.optionsPrice}>
                                            +{formatCurrency(option.price, settings.currency)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
                <footer style={styles.optionsModalFooter}>
                    <span style={styles.optionsModalPrice}>Total: {formatCurrency(totalPrice, settings.currency)}</span>
                    <button style={styles.optionsModalButton} onClick={handleAddToCartClick}>
                        Add to Order
                    </button>
                </footer>
            </div>
        </div>
    );
};