import React, { useState, useEffect } from 'react';
import { AppSettings } from '../../types';
import { styles } from '../../styles';
import { useTenant } from '../../contexts/TenantContext';
import { uploadBrandingImage, updateLandingPageSettings } from '../../firebase/api-multitenant';

interface LandingPageSettingsProps {
    settings: AppSettings;
}

export const LandingPageSettings: React.FC<LandingPageSettingsProps> = ({ settings }) => {
    const { tenant } = useTenant();
    const tenantId = tenant?.id;

    // Initialize form data with existing settings or defaults
    const [formData, setFormData] = useState({
        logoUrl: settings.landingPage?.logoUrl || '',
        heroImageUrl: settings.landingPage?.heroImageUrl || '',
        primaryColor: settings.landingPage?.primaryColor || '#3498db',
        tagline: settings.landingPage?.tagline || '',
        address: settings.landingPage?.address || '',
        phone: settings.landingPage?.phone || '',
        email: settings.landingPage?.email || '',
    });

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [heroFile, setHeroFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>(formData.logoUrl);
    const [heroPreview, setHeroPreview] = useState<string>(formData.heroImageUrl);
    const [isUploading, setIsUploading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Update form when settings change
    useEffect(() => {
        setFormData({
            logoUrl: settings.landingPage?.logoUrl || '',
            heroImageUrl: settings.landingPage?.heroImageUrl || '',
            primaryColor: settings.landingPage?.primaryColor || '#3498db',
            tagline: settings.landingPage?.tagline || '',
            address: settings.landingPage?.address || '',
            phone: settings.landingPage?.phone || '',
            email: settings.landingPage?.email || '',
        });
        setLogoPreview(settings.landingPage?.logoUrl || '');
        setHeroPreview(settings.landingPage?.heroImageUrl || '');
        setHasUnsavedChanges(false);
    }, [settings]);

    // Detect unsaved changes
    useEffect(() => {
        const currentSettings = {
            logoUrl: settings.landingPage?.logoUrl || '',
            heroImageUrl: settings.landingPage?.heroImageUrl || '',
            primaryColor: settings.landingPage?.primaryColor || '#3498db',
            tagline: settings.landingPage?.tagline || '',
            address: settings.landingPage?.address || '',
            phone: settings.landingPage?.phone || '',
            email: settings.landingPage?.email || '',
        };
        const isDifferent = JSON.stringify(formData) !== JSON.stringify(currentSettings) || logoFile !== null || heroFile !== null;
        setHasUnsavedChanges(isDifferent);
    }, [formData, logoFile, heroFile, settings]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                alert('Logo file size must be less than 5MB');
                return;
            }
            setLogoFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleHeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                alert('Hero image file size must be less than 5MB');
                return;
            }
            setHeroFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setHeroPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!tenantId) {
            console.error('Unable to save: Tenant not loaded');
            alert('Unable to save: Tenant not loaded');
            return;
        }

        setIsUploading(true);
        try {
            let logoUrl = formData.logoUrl;
            let heroImageUrl = formData.heroImageUrl;

            // Upload logo if new file selected
            if (logoFile) {
                logoUrl = await uploadBrandingImage(tenantId, logoFile, 'logo');
            }

            // Upload hero image if new file selected
            if (heroFile) {
                heroImageUrl = await uploadBrandingImage(tenantId, heroFile, 'hero');
            }

            // Update settings with image URLs
            const landingPageSettings: AppSettings['landingPage'] = {
                logoUrl,
                heroImageUrl,
                primaryColor: formData.primaryColor,
                tagline: formData.tagline,
                address: formData.address,
                phone: formData.phone,
                email: formData.email,
            };

            await updateLandingPageSettings(tenantId, landingPageSettings);

            // Clear file selections
            setLogoFile(null);
            setHeroFile(null);
            setHasUnsavedChanges(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving landing page settings:', error);
            alert('Error saving settings. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const taglineCharCount = formData.tagline.length;
    const maxTaglineLength = 200;

    return (
        <>
            <h2 style={styles.adminHeader}>Landing Page Settings</h2>
            <p style={{ ...styles.settingsHelperText, marginBottom: '20px' }}>
                Customize your tenant's landing page with branding, images, and contact information.
            </p>

            <form onSubmit={handleSubmit}>
                {/* Branding Section */}
                <div style={styles.adminFormCard}>
                    <h3 style={styles.adminModalTitle}>Branding</h3>

                    {/* Logo Upload */}
                    <div style={styles.adminFormGroup}>
                        <label style={styles.adminLabel}>Logo Image</label>
                        {logoPreview && (
                            <div style={{ marginBottom: '10px' }}>
                                <img
                                    src={logoPreview}
                                    alt="Logo preview"
                                    style={{
                                        maxWidth: '200px',
                                        maxHeight: '80px',
                                        objectFit: 'contain',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        padding: '8px',
                                        backgroundColor: '#f8f9fa',
                                    }}
                                />
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            style={{
                                ...styles.adminFormInput,
                                padding: '8px',
                            }}
                        />
                        <small style={{ color: '#6c757d', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                            Max 5MB. Recommended size: 400x120px
                        </small>
                    </div>

                    {/* Hero Image Upload */}
                    <div style={styles.adminFormGroup}>
                        <label style={styles.adminLabel}>Hero Image</label>
                        {heroPreview && (
                            <div style={{ marginBottom: '10px' }}>
                                <img
                                    src={heroPreview}
                                    alt="Hero image preview"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '200px',
                                        objectFit: 'cover',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                    }}
                                />
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleHeroChange}
                            style={{
                                ...styles.adminFormInput,
                                padding: '8px',
                            }}
                        />
                        <small style={{ color: '#6c757d', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                            Max 5MB. Recommended size: 1920x600px
                        </small>
                    </div>

                    {/* Primary Color Picker */}
                    <div style={styles.adminFormGroup}>
                        <label style={styles.adminLabel} htmlFor="primaryColor">Primary Brand Color</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                                type="color"
                                id="primaryColor"
                                name="primaryColor"
                                value={formData.primaryColor}
                                onChange={handleInputChange}
                                style={{
                                    width: '80px',
                                    height: '40px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }}
                            />
                            <input
                                type="text"
                                value={formData.primaryColor}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Validate hex color format
                                    if (/^#[0-9A-Fa-f]{6}$/.test(value) || value === '') {
                                        setFormData(prev => ({ ...prev, primaryColor: value }));
                                    }
                                }}
                                placeholder="#3498db"
                                style={{
                                    ...styles.adminFormInput,
                                    flex: 1,
                                    maxWidth: '200px',
                                }}
                            />
                        </div>
                        <small style={{ color: '#6c757d', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                            Used for buttons and accents on the landing page
                        </small>
                    </div>
                </div>

                {/* Content Section */}
                <div style={styles.adminFormCard}>
                    <h3 style={styles.adminModalTitle}>Content</h3>

                    {/* Tagline */}
                    <div style={styles.adminFormGroup}>
                        <label style={styles.adminLabel} htmlFor="tagline">
                            Tagline
                            <span style={{ float: 'right', fontSize: '12px', color: taglineCharCount > maxTaglineLength ? '#dc3545' : '#6c757d' }}>
                                {taglineCharCount}/{maxTaglineLength}
                            </span>
                        </label>
                        <input
                            type="text"
                            id="tagline"
                            name="tagline"
                            value={formData.tagline}
                            onChange={handleInputChange}
                            maxLength={maxTaglineLength}
                            placeholder="Welcome to our restaurant!"
                            style={styles.adminFormInput}
                        />
                    </div>

                    {/* Address */}
                    <div style={styles.adminFormGroup}>
                        <label style={styles.adminLabel} htmlFor="address">Address (optional)</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="123 Main Street, City, State 12345"
                            rows={3}
                            style={{
                                ...styles.adminFormInput,
                                resize: 'vertical',
                                fontFamily: 'inherit',
                            }}
                        />
                    </div>

                    {/* Phone */}
                    <div style={styles.adminFormGroup}>
                        <label style={styles.adminLabel} htmlFor="phone">Phone (optional)</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="+1 (555) 123-4567"
                            style={styles.adminFormInput}
                        />
                    </div>

                    {/* Email */}
                    <div style={styles.adminFormGroup}>
                        <label style={styles.adminLabel} htmlFor="email">Email (optional)</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="info@restaurant.com"
                            style={styles.adminFormInput}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={styles.adminFormActions}>
                    <button
                        type="button"
                        onClick={() => setShowPreview(true)}
                        style={{
                            ...styles.adminButtonSecondary,
                            marginRight: '10px',
                        }}
                    >
                        Preview
                    </button>
                    <button
                        type="submit"
                        disabled={isUploading || !hasUnsavedChanges}
                        style={{
                            ...styles.adminButtonPrimary,
                            opacity: isUploading || !hasUnsavedChanges ? 0.5 : 1,
                            cursor: isUploading || !hasUnsavedChanges ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {isUploading ? 'Saving...' : 'Save Settings'}
                    </button>
                    {showSuccess && <span style={styles.success}>Settings saved!</span>}
                </div>
            </form>

            {/* Floating Save Button (appears when unsaved changes exist) */}
            {hasUnsavedChanges && !isUploading && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        right: '20px',
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '10px',
                    }}
                >
                    {/* Unsaved Changes Badge */}
                    <div
                        style={{
                            backgroundColor: '#ffc107',
                            color: '#000',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 600,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <span style={{ fontSize: '18px' }}>⚠️</span>
                        Unsaved Changes
                    </div>

                    {/* Floating Save Button */}
                    <button
                        onClick={() => handleSubmit()}
                        style={{
                            padding: '16px 32px',
                            fontSize: '16px',
                            fontWeight: 700,
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50px',
                            cursor: 'pointer',
                            boxShadow: '0 6px 20px rgba(40, 167, 69, 0.4)',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(40, 167, 69, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                        }}
                    >
                        <span style={{ fontSize: '20px' }}>💾</span>
                        Save Settings
                    </button>

                    {/* Success Indicator */}
                    {showSuccess && (
                        <div
                            style={{
                                backgroundColor: '#28a745',
                                color: 'white',
                                padding: '12px 20px',
                                borderRadius: '20px',
                                fontSize: '14px',
                                fontWeight: 600,
                                boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
                                animation: 'fadeIn 0.3s ease-in-out',
                            }}
                        >
                            ✓ Saved Successfully!
                        </div>
                    )}
                </div>
            )}

            {/* Preview Modal */}
            {showPreview && (
                <div style={styles.adminModalOverlay}>
                    <div style={{ ...styles.adminModalContent, maxWidth: '900px', maxHeight: '90vh' }}>
                        <header style={styles.adminModalHeader}>
                            <h3 style={styles.adminModalTitle}>Landing Page Preview</h3>
                            <button style={styles.closeButton} onClick={() => setShowPreview(false)}>&times;</button>
                        </header>

                        <div style={{ padding: '20px', overflowY: 'auto', maxHeight: 'calc(90vh - 100px)' }}>
                            {/* Simple landing page preview */}
                            <div style={{
                                backgroundColor: '#fff',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            }}>
                                {/* Hero Section */}
                                <div style={{
                                    position: 'relative',
                                    backgroundColor: formData.primaryColor,
                                    color: 'white',
                                    padding: '60px 20px',
                                    textAlign: 'center',
                                    backgroundImage: heroPreview ? `url(${heroPreview})` : undefined,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}>
                                    {heroPreview && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            backgroundColor: 'rgba(0,0,0,0.4)',
                                        }} />
                                    )}
                                    <div style={{ position: 'relative', zIndex: 1 }}>
                                        {logoPreview && (
                                            <img
                                                src={logoPreview}
                                                alt="Logo"
                                                style={{
                                                    maxWidth: '200px',
                                                    maxHeight: '80px',
                                                    marginBottom: '20px',
                                                    objectFit: 'contain',
                                                }}
                                            />
                                        )}
                                        <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>
                                            Welcome to {tenant?.businessName || 'Our Restaurant'}!
                                        </h1>
                                        {formData.tagline && (
                                            <p style={{ fontSize: '18px', margin: 0 }}>{formData.tagline}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Info Section */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: '20px',
                                    padding: '40px 20px',
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <h3 style={{ marginBottom: '10px' }}>Location</h3>
                                        <p style={{ color: '#6c757d', margin: 0 }}>
                                            {formData.address || 'Address not set'}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <h3 style={{ marginBottom: '10px' }}>Contact</h3>
                                        <p style={{ color: '#6c757d', margin: 0 }}>
                                            {formData.phone || 'Phone not set'}<br />
                                            {formData.email || 'Email not set'}
                                        </p>
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <div style={{ padding: '20px', textAlign: 'center' }}>
                                    <button style={{
                                        backgroundColor: formData.primaryColor,
                                        color: 'white',
                                        border: 'none',
                                        padding: '16px 48px',
                                        fontSize: '18px',
                                        borderRadius: '50px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                    }}>
                                        Continue to Order
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style={styles.adminFormActions}>
                            <button
                                type="button"
                                style={styles.adminButtonSecondary}
                                onClick={() => setShowPreview(false)}
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
