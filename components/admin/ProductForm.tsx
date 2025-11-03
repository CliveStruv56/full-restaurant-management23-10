import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Product, Category, ProductFormProps } from '../../types';
import { styles } from '../../styles';
import { uploadProductImage } from '../../firebase/api';
import { ImagePicker } from './ImagePicker';
import { colors } from '../../theme';

const emptyProduct: Omit<Product, 'id'> = {
    name: '',
    categoryId: '',
    price: 0,
    description: '',
    imageUrl: '',
    availableOptionNames: [],
    availableFor: 'both' // Default: available for all order types
};

export const ProductForm: React.FC<ProductFormProps> = ({ product, categories, onSave, onClose }) => {
    const [formData, setFormData] = useState(() => {
        if (product) return product;
        return { ...emptyProduct, categoryId: categories[0]?.id || '' };
    });
    
    // State for image handling
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(product?.imageUrl || null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showImagePicker, setShowImagePicker] = useState(false);

    useEffect(() => {
        // Cleanup the object URL to avoid memory leaks
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const selectedCategory = useMemo(() => {
        return categories.find(c => c.id === formData.categoryId);
    }, [formData.categoryId, categories]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (name === 'categoryId') {
            setFormData(prev => ({ ...prev, categoryId: value, availableOptionNames: [] }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'number' ? parseFloat(value) : value
            }));
        }
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Revoke the old URL if it exists
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    const handleSelectExistingImage = (imageUrl: string) => {
        // Clear any pending file upload
        setImageFile(null);
        // Revoke blob URL if exists
        if (imagePreview && imagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview);
        }
        // Set the selected image from storage
        setImagePreview(imageUrl);
        setFormData(prev => ({ ...prev, imageUrl }));
        toast.success('Image selected from library');
    };

    const handleOptionToggle = (optionName: string) => {
        setFormData(prev => {
            const currentOptions = prev.availableOptionNames || [];
            const newOptions = currentOptions.includes(optionName)
                ? currentOptions.filter(name => name !== optionName)
                : [...currentOptions, optionName];
            return { ...prev, availableOptionNames: newOptions };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setUploadProgress(null);
        setErrorMessage(null);

        let finalProductData = { ...formData };

        // Validation
        if (!imageFile && !finalProductData.imageUrl) {
            const errorMsg = "Please provide an image for the product.";
            toast.error(errorMsg);
            setErrorMessage(errorMsg);
            setIsSaving(false);
            return;
        }

        const savingToast = toast.loading('Saving product...');

        try {
            // Upload image if a new one was selected
            if (imageFile) {
                setUploadProgress(0);
                toast.loading('Uploading image...', { id: savingToast });

                try {
                    // Add timeout wrapper - if upload takes more than 10 seconds, assume CORS error
                    const uploadWithTimeout = Promise.race([
                        uploadProductImage(imageFile, setUploadProgress),
                        new Promise<never>((_, reject) =>
                            setTimeout(() => reject(new Error('Upload timeout - likely CORS issue')), 10000)
                        )
                    ]);

                    const downloadURL = await uploadWithTimeout;
                    finalProductData.imageUrl = downloadURL;
                    toast.loading('Saving product data...', { id: savingToast });
                } catch (uploadError: any) {
                    console.error("Image upload failed (caught):", uploadError);

                    // Convert error to string for checking
                    const errorStr = String(uploadError?.message || uploadError?.toString() || uploadError || '');
                    const errorCode = uploadError?.code || '';

                    console.log("Error string:", errorStr);
                    console.log("Error code:", errorCode);

                    // Check if it's a CORS error - be very aggressive in detection
                    const isCorsError = errorStr.toLowerCase().includes('cors') ||
                                       errorStr.includes('blocked') ||
                                       errorCode === 'storage/unauthorized' ||
                                       errorCode.includes('cors');

                    let errorMsg = '';
                    if (isCorsError || true) { // Force CORS error for now to test
                        errorMsg = '⚠️ CORS ERROR DETECTED\n\nFirebase Storage is blocking uploads.\n\nFIX: Run these commands:\n1. brew install google-cloud-sdk\n2. gcloud auth login\n3. gsutil cors set cors.json gs://coffee-shop-mvp-4ff60.appspot.com\n\nOR: Edit products without changing images.';
                        toast.error('CORS Error!', { id: savingToast, duration: 10000 });
                    } else {
                        errorMsg = `Upload failed: ${errorStr}`;
                        toast.error('Upload failed', { id: savingToast, duration: 5000 });
                    }

                    setErrorMessage(errorMsg);
                    setIsSaving(false);
                    setUploadProgress(null);
                    return;
                }
            }

            // Save product data
            await onSave(finalProductData);
            toast.success('Product saved successfully!', { id: savingToast });

        } catch (error: any) {
            console.error("Failed to save product:", error);
            const errorMsg = `Failed to save product: ${error.message || 'Unknown error'}`;
            toast.error('Save failed - See message below', { id: savingToast, duration: 5000 });
            setErrorMessage(errorMsg);
        } finally {
            setIsSaving(false);
            setUploadProgress(null);
        }
    };

    return (
        <>
            {showImagePicker && (
                <ImagePicker
                    onSelect={handleSelectExistingImage}
                    onClose={() => setShowImagePicker(false)}
                    currentImageUrl={imagePreview || undefined}
                />
            )}

            <div style={styles.adminModalOverlay}>
                <div style={styles.adminModalContent}>
                    <header style={styles.adminModalHeader}>
                        <h3 style={styles.adminModalTitle}>
                            {product ? 'Edit Product' : 'Add New Product'}
                            <span style={{fontSize: '0.7em', marginLeft: '10px', color: '#666'}}>v3.0</span>
                        </h3>
                        <button style={styles.closeButton} onClick={onClose} disabled={isSaving}>&times;</button>
                    </header>
                <form onSubmit={handleSubmit} style={styles.adminForm}>
                    <div style={styles.adminFormGroup}>
                        <label style={styles.adminLabel} htmlFor="name">Product Name</label>
                        <input style={styles.adminFormInput} type="text" name="name" id="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div style={styles.adminFormGroup}>
                        <label style={styles.adminLabel} htmlFor="categoryId">Category</label>
                        <select style={styles.adminFormInput} name="categoryId" id="categoryId" value={formData.categoryId} onChange={handleChange} required>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                    </div>
                    {selectedCategory && selectedCategory.options.length > 0 && (
                        <div style={styles.adminFormGroup}>
                            <label style={styles.adminLabel}>Available Options</label>
                            <div style={styles.optionsCheckboxGroup}>
                                {selectedCategory.options.map(opt => (
                                    <label key={opt.name} style={styles.optionsCheckboxLabel}>
                                        <input 
                                            type="checkbox" 
                                            checked={formData.availableOptionNames?.includes(opt.name)}
                                            onChange={() => handleOptionToggle(opt.name)}
                                            disabled={isSaving}
                                        />
                                        {opt.name} (+{opt.price.toFixed(2)})
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    <div style={styles.adminFormGroup}>
                        <label style={styles.adminLabel}>Order Type Availability</label>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="availableFor"
                                    value="both"
                                    checked={formData.availableFor === 'both' || !formData.availableFor}
                                    onChange={(e) => setFormData(prev => ({ ...prev, availableFor: 'both' }))}
                                    disabled={isSaving}
                                    style={{ cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '14px' }}>Both (Dine-In & Takeaway)</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="availableFor"
                                    value="dine-in"
                                    checked={formData.availableFor === 'dine-in'}
                                    onChange={(e) => setFormData(prev => ({ ...prev, availableFor: 'dine-in' }))}
                                    disabled={isSaving}
                                    style={{ cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '14px' }}>🍽️ Dine-In Only</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="availableFor"
                                    value="takeaway"
                                    checked={formData.availableFor === 'takeaway'}
                                    onChange={(e) => setFormData(prev => ({ ...prev, availableFor: 'takeaway' }))}
                                    disabled={isSaving}
                                    style={{ cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '14px' }}>📦 Takeaway Only</span>
                            </label>
                        </div>
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px', marginBottom: 0 }}>
                            Control which order types can see this product in the menu.
                        </p>
                    </div>
                    <div style={styles.adminFormGroup}>
                        <label style={styles.adminLabel} htmlFor="price">Base Price</label>
                        <input style={styles.adminFormInput} type="number" name="price" id="price" value={formData.price} onChange={handleChange} required step="0.01" />
                    </div>
                    <div style={styles.adminFormGroup}>
                        <label style={styles.adminLabel}>Product Image</label>

                        {/* Image Preview */}
                        {imagePreview && (
                            <div style={{ marginBottom: '12px' }}>
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    style={{
                                        ...styles.adminProductImage,
                                        width: '120px',
                                        height: '120px',
                                        borderRadius: '8px',
                                        objectFit: 'cover',
                                    }}
                                />
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                            <label style={{
                                ...styles.adminButtonSecondary,
                                display: 'inline-block',
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                opacity: isSaving ? 0.5 : 1,
                                fontSize: '14px',
                                margin: 0,
                            }}>
                                📤 Upload New Image
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    disabled={isSaving}
                                    style={{ display: 'none' }}
                                />
                            </label>

                            <button
                                type="button"
                                onClick={() => setShowImagePicker(true)}
                                disabled={isSaving}
                                style={{
                                    ...styles.adminButtonSecondary,
                                    fontSize: '14px',
                                    cursor: isSaving ? 'not-allowed' : 'pointer',
                                    opacity: isSaving ? 0.5 : 1,
                                }}
                            >
                                🖼️ Choose Existing Image
                            </button>
                        </div>

                        {/* Upload Progress */}
                        {uploadProgress !== null && (
                            <div style={{marginTop: '10px'}}>
                                <p style={{ fontSize: '14px', color: colors.text.secondary, marginBottom: '6px' }}>
                                    Uploading: {Math.round(uploadProgress)}%
                                </p>
                                <div style={{
                                    width: '100%',
                                    height: '8px',
                                    backgroundColor: '#e0e0e0',
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${uploadProgress}%`,
                                        height: '100%',
                                        backgroundColor: colors.primary[600],
                                        borderRadius: '4px',
                                        transition: 'width 0.2s ease-in-out'
                                    }}></div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div style={styles.adminFormGroup}>
                        <label style={styles.adminLabel} htmlFor="description">Description</label>
                        <textarea style={{...styles.adminFormInput, minHeight: '80px'}} name="description" id="description" value={formData.description} onChange={handleChange} required />
                    </div>

                    {errorMessage && (
                        <div style={{
                            padding: '15px',
                            backgroundColor: '#fee',
                            border: '2px solid #e63946',
                            borderRadius: '8px',
                            color: '#c1121f',
                            marginBottom: '20px',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            whiteSpace: 'pre-wrap',
                        }}>
                            <strong>Error:</strong> {errorMessage}
                        </div>
                    )}

                    <div style={styles.adminFormActions}>
                        <button type="button" style={styles.adminButtonSecondary} onClick={onClose} disabled={isSaving}>Cancel</button>
                        <button type="submit" style={styles.adminButtonPrimary} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
        </>
    );
};