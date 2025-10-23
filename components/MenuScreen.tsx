import React, { useMemo } from 'react';
import { Product, DailySpecial, Category, AppSettings } from '../types';
import { styles } from '../styles';
import { DailySpecialCard } from './DailySpecialCard';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './SkeletonLoader';

interface MenuScreenProps {
    products: Product[];
    categories: Category[];
    onAddToCart: (product: Product) => void;
    dailySpecial: DailySpecial | null;
    isSpecialLoading: boolean;
    settings: AppSettings;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ products, categories, onAddToCart, dailySpecial, isSpecialLoading, settings }) => {
    
    const productsByCategory = useMemo(() => {
        const grouped: Record<string, Product[]> = {};
        for (const product of products) {
            if (!grouped[product.categoryId]) {
                grouped[product.categoryId] = [];
            }
            grouped[product.categoryId].push(product);
        }
        return grouped;
    }, [products]);

    const handleSpecialAddToCart = (items: Product[]) => {
        items.forEach(item => onAddToCart(item));
    };

    const categoryOrder = useMemo(() => {
        return categories.map(c => c.id).filter(id => productsByCategory[id]?.length > 0);
    }, [categories, productsByCategory]);

    return (
        <div style={styles.screen}>
            {settings.loyaltyEnabled && <DailySpecialCard special={dailySpecial} isLoading={isSpecialLoading} onAddToCart={handleSpecialAddToCart} settings={settings} />}

            {products.length === 0 ? (
                // Show skeleton loaders while products are loading
                <>
                    <h2 style={styles.categoryTitle}>Loading menu...</h2>
                    <div style={styles.productGrid}>
                        {[...Array(6)].map((_, index) => (
                            <ProductCardSkeleton key={index} />
                        ))}
                    </div>
                </>
            ) : (
                categoryOrder.map((categoryId) => {
                    const category = categories.find(c => c.id === categoryId);
                    const categoryProducts = productsByCategory[categoryId];
                    if (!category || !categoryProducts) return null;

                    return (
                        <div key={categoryId}>
                            <h2 style={styles.categoryTitle}>{category.name}</h2>
                            <div style={styles.productGrid}>
                                {categoryProducts.map(product => (
                                    <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} settings={settings} />
                                ))}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};
