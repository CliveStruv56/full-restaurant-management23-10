import React, { CSSProperties } from 'react';

interface SkeletonLoaderProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    style?: CSSProperties;
    className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    width = '100%',
    height = '20px',
    borderRadius = '4px',
    style = {},
    className = ''
}) => {
    const skeletonStyle: CSSProperties = {
        width,
        height,
        borderRadius,
        backgroundColor: '#e0e0e0',
        backgroundImage: 'linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
        ...style,
    };

    return (
        <>
            <style>{`
                @keyframes shimmer {
                    0% {
                        background-position: 200% 0;
                    }
                    100% {
                        background-position: -200% 0;
                    }
                }
            `}</style>
            <div className={className} style={skeletonStyle} aria-hidden="true" />
        </>
    );
};

// Product Card Skeleton
export const ProductCardSkeleton: React.FC = () => {
    return (
        <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <SkeletonLoader height="150px" borderRadius="0" />
            <div style={{ padding: '12px' }}>
                <SkeletonLoader height="16px" width="80%" style={{ marginBottom: '8px' }} />
                <SkeletonLoader height="20px" width="40%" style={{ marginBottom: '12px' }} />
                <SkeletonLoader height="36px" borderRadius="8px" />
            </div>
        </div>
    );
};

// Daily Special Skeleton
export const DailySpecialSkeleton: React.FC = () => {
    return (
        <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}>
            <SkeletonLoader height="24px" width="150px" style={{ marginBottom: '15px' }} />
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ display: 'flex', position: 'relative', width: '120px', height: '80px' }}>
                    <SkeletonLoader width="80px" height="80px" borderRadius="8px" />
                    <div style={{ position: 'absolute', left: '40px' }}>
                        <SkeletonLoader width="80px" height="80px" borderRadius="8px" />
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <SkeletonLoader height="16px" width="90%" style={{ marginBottom: '8px' }} />
                    <SkeletonLoader height="16px" width="70%" style={{ marginBottom: '15px' }} />
                    <SkeletonLoader height="20px" width="50%" style={{ marginBottom: '15px' }} />
                    <SkeletonLoader height="44px" width="180px" borderRadius="8px" />
                </div>
            </div>
        </div>
    );
};
