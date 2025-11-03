import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Product, AppSettings } from '../types';
import { formatCurrency } from '../utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
    settings: AppSettings;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, settings }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileTap={{ scale: 0.98 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            <Card className={`overflow-hidden transition-all ${isHovered ? 'shadow-xl -translate-y-1' : 'shadow-md'}`}>
                {/* Image Container */}
                <div className="relative w-full h-40 overflow-hidden bg-gray-100">
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className={`w-full h-full object-cover transition-all duration-300 ${
                            imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                        }`}
                        onLoad={() => setImageLoaded(true)}
                        loading="lazy"
                    />
                    {!imageLoaded && (
                        <div className="absolute inset-0">
                            <Skeleton className="w-full h-full" />
                        </div>
                    )}
                    {/* Description overlay on hover */}
                    {product.description && (
                        <div
                            className={`absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent text-white text-xs transition-opacity ${
                                isHovered ? 'opacity-100' : 'opacity-0'
                            }`}
                        >
                            {product.description}
                        </div>
                    )}
                </div>

                {/* Content */}
                <CardContent className="p-4 flex flex-col gap-2 flex-grow">
                    <h3 className="text-base font-semibold text-gray-900 leading-tight line-clamp-2 flex-grow min-h-[2.6rem]">
                        {product.name}
                    </h3>
                    <p className="text-lg font-bold text-primary tracking-tight">
                        {formatCurrency(product.price, settings.currency)}
                    </p>
                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(product);
                        }}
                        className="w-full"
                        size="sm"
                        aria-label={`Add ${product.name} to cart`}
                    >
                        Add to Cart
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
};