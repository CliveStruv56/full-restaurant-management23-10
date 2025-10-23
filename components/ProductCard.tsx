import React, { useState, CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { Product, AppSettings } from '../types';
import { formatCurrency } from '../utils';
import { colors, shadows, borderRadius, transitions, spacing } from '../theme';

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
    settings: AppSettings;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, settings }) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    const cardStyle: CSSProperties = {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        boxShadow: shadows.elevated,
        display: 'flex',
        flexDirection: 'column',
        transition: transitions.all,
        cursor: 'pointer',
        position: 'relative',
    };

    const imageContainerStyle: CSSProperties = {
        width: '100%',
        height: '160px',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: colors.gray[100],
    };

    const imageStyle: CSSProperties = {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transition: transitions.transform,
        opacity: imageLoaded ? 1 : 0,
        transform: imageLoaded ? 'scale(1)' : 'scale(1.05)',
    };

    const contentStyle: CSSProperties = {
        padding: spacing[4],
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[2],
    };

    const nameStyle: CSSProperties = {
        margin: 0,
        fontSize: '0.95rem',
        fontWeight: 600,
        color: colors.text.primary,
        lineHeight: 1.3,
        flexGrow: 1,
        minHeight: '40px',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
    };

    const priceStyle: CSSProperties = {
        margin: 0,
        fontSize: '1.1rem',
        fontWeight: 700,
        color: colors.primary[600],
        letterSpacing: '-0.02em',
    };

    const buttonStyle: CSSProperties = {
        padding: `${spacing[2]} ${spacing[3]}`,
        border: 'none',
        borderRadius: borderRadius.lg,
        backgroundColor: colors.primary[600],
        color: colors.text.inverse,
        fontSize: '0.875rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: transitions.colors,
        boxShadow: shadows.sm,
        width: '100%',
    };

    const buttonHoverStyle: CSSProperties = {
        backgroundColor: colors.primary[700],
        boxShadow: shadows.md,
        transform: 'translateY(-1px)',
    };

    const [isHovered, setIsHovered] = useState(false);
    const [isButtonHovered, setIsButtonHovered] = useState(false);

    return (
        <motion.div
            style={{
                ...cardStyle,
                ...(isHovered ? { boxShadow: shadows.elevatedHover, transform: 'translateY(-4px)' } : {}),
            }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div style={imageContainerStyle}>
                <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={imageStyle}
                    onLoad={() => setImageLoaded(true)}
                    loading="lazy"
                />
                {!imageLoaded && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: colors.gray[100],
                        backgroundImage: 'linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s ease-in-out infinite',
                    }} />
                )}
                {product.description && (
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: spacing[2],
                        background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                        color: colors.text.inverse,
                        fontSize: '0.75rem',
                        opacity: isHovered ? 1 : 0,
                        transition: transitions.opacity,
                    }}>
                        {product.description}
                    </div>
                )}
            </div>
            <div style={contentStyle}>
                <h3 style={nameStyle}>{product.name}</h3>
                <p style={priceStyle}>{formatCurrency(product.price, settings.currency)}</p>
                <button
                    style={{
                        ...buttonStyle,
                        ...(isButtonHovered ? buttonHoverStyle : {}),
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(product);
                    }}
                    onMouseEnter={() => setIsButtonHovered(true)}
                    onMouseLeave={() => setIsButtonHovered(false)}
                    aria-label={`Add ${product.name} to cart`}
                >
                    Add to Cart
                </button>
            </div>
        </motion.div>
    );
};