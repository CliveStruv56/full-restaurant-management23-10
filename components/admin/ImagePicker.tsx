import React, { useState, useEffect } from 'react';
import { listProductImages, StorageImage } from '../../firebase/storage';
import { styles } from '../../styles';
import { colors, shadows } from '../../theme';

interface ImagePickerProps {
    onSelect: (imageUrl: string) => void;
    onClose: () => void;
    currentImageUrl?: string;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({ onSelect, onClose, currentImageUrl }) => {
    const [images, setImages] = useState<StorageImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUrl, setSelectedUrl] = useState<string | null>(currentImageUrl || null);

    useEffect(() => {
        loadImages();
    }, []);

    const loadImages = async () => {
        setLoading(true);
        const imageList = await listProductImages();
        setImages(imageList);
        setLoading(false);
    };

    const handleSelect = () => {
        if (selectedUrl) {
            onSelect(selectedUrl);
            onClose();
        }
    };

    return (
        <div style={{ ...styles.adminModalOverlay, zIndex: 10001 }}>
            <div style={{ ...styles.adminModalContent, maxWidth: '800px', maxHeight: '80vh', zIndex: 10002 }}>
                <header style={styles.adminModalHeader}>
                    <h3 style={styles.adminModalTitle}>Choose Existing Image</h3>
                    <button style={styles.closeButton} onClick={onClose}>&times;</button>
                </header>

                <div style={{ padding: '20px', overflowY: 'auto', maxHeight: 'calc(80vh - 160px)' }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', color: colors.text.secondary }}>Loading images...</p>
                    ) : images.length === 0 ? (
                        <p style={{ textAlign: 'center', color: colors.text.secondary }}>
                            No uploaded images found. Upload your first image to get started.
                        </p>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                            gap: '16px',
                        }}>
                            {images.map((image) => (
                                <div
                                    key={image.fullPath}
                                    onClick={() => setSelectedUrl(image.url)}
                                    style={{
                                        cursor: 'pointer',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        border: selectedUrl === image.url
                                            ? `3px solid ${colors.primary[600]}`
                                            : `2px solid ${colors.border.light}`,
                                        transition: 'all 0.2s',
                                        boxShadow: selectedUrl === image.url ? shadows.md : shadows.sm,
                                    }}
                                >
                                    <img
                                        src={image.url}
                                        alt={image.name}
                                        style={{
                                            width: '100%',
                                            height: '150px',
                                            objectFit: 'cover',
                                        }}
                                    />
                                    <div style={{
                                        padding: '8px',
                                        backgroundColor: colors.background.secondary,
                                        fontSize: '11px',
                                        color: colors.text.secondary,
                                        textOverflow: 'ellipsis',
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {image.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={styles.adminFormActions}>
                    <button type="button" style={styles.adminButtonSecondary} onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        style={{
                            ...styles.adminButtonPrimary,
                            opacity: selectedUrl ? 1 : 0.5,
                            cursor: selectedUrl ? 'pointer' : 'not-allowed',
                        }}
                        onClick={handleSelect}
                        disabled={!selectedUrl}
                    >
                        Use Selected Image
                    </button>
                </div>
            </div>
        </div>
    );
};
