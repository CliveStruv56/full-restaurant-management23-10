import React, { useState, useEffect } from 'react';
import { AppSettings, DaySetting } from '../../types';
import { styles } from '../../styles';
import { useTenant } from '../../contexts/TenantContext';
import { updateSettings } from '../../firebase/api-multitenant';

interface SettingsManagerProps {
    settings: AppSettings;
}

const ToggleSwitch = ({ isChecked, onChange }: { isChecked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => {
    const sliderStyle: React.CSSProperties = {
        ...styles.settingsToggleSlider,
        backgroundColor: isChecked ? '#2ecc71' : '#ccc',
    };
    
    const sliderBeforeStyle: React.CSSProperties = {
        position: 'absolute',
        content: '""',
        height: '20px',
        width: '20px',
        left: '4px',
        bottom: '4px',
        backgroundColor: 'white',
        transition: '.4s',
        borderRadius: '50%',
        transform: isChecked ? 'translateX(22px)' : 'translateX(0)',
    };

    return (
        <label style={styles.settingsToggleSwitch}>
            <input type="checkbox" checked={isChecked} onChange={onChange} style={styles.settingsToggleInput} />
            <span style={sliderStyle}>
                <span style={sliderBeforeStyle}></span>
            </span>
        </label>
    );
};

export const SettingsManager: React.FC<SettingsManagerProps> = ({ settings }) => {
    const { tenant } = useTenant();
    const tenantId = tenant?.id;
    const [formData, setFormData] = useState(settings);
    const [showSuccess, setShowSuccess] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const currencySymbols = { USD: '$', GBP: '£', EUR: '€' };

    useEffect(() => {
        setFormData(settings);
        setHasUnsavedChanges(false);
    }, [settings]);

    // Detect unsaved changes
    useEffect(() => {
        const isDifferent = JSON.stringify(formData) !== JSON.stringify(settings);
        setHasUnsavedChanges(isDifferent);
    }, [formData, settings]);

    // Warn before leaving page with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const handleDailyChange = (day: keyof AppSettings['weekSchedule'], field: keyof DaySetting, value: number | boolean) => {
        setFormData(prev => ({
            ...prev,
            weekSchedule: {
                ...prev.weekSchedule,
                [day]: {
                    ...prev.weekSchedule[day],
                    [field]: value,
                }
            }
        }));
    };
    
    const handleGlobalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            const numericFields = ['slotDuration', 'maxOrdersPerSlot', 'minLeadTimeMinutes', 'maxDaysInAdvance', 'openingBufferMinutes', 'closingBufferMinutes', 'pointsPerDollar', 'pointsToReward'];
            if (numericFields.includes(name)) {
                setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
            } else {
                setFormData(prev => ({ ...prev, [name]: value as any }));
            }
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!tenantId) {
            console.error('Unable to save: Tenant not loaded');
            return;
        }
        await updateSettings(tenantId, formData);
        setHasUnsavedChanges(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const dayOrder: (keyof AppSettings['weekSchedule'])[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return (
        <>
            <h2 style={styles.adminHeader}>Shop Settings</h2>
            <form onSubmit={handleSubmit}>
                <div style={styles.adminFormCard}>
                    <h3 style={styles.adminModalTitle}>General</h3>
                    <div style={styles.adminFormGroup}>
                        <label style={styles.adminLabel} htmlFor="currency">Shop Currency</label>
                        <select style={styles.adminFormInput} name="currency" id="currency" value={formData.currency} onChange={handleGlobalChange}>
                            <option value="USD">USD ($)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="EUR">EUR (€)</option>
                        </select>
                    </div>
                </div>
                
                <div style={styles.adminFormCard}>
                    <h3 style={styles.adminModalTitle}>Loyalty Program</h3>
                     <div style={{...styles.adminFormGroup, ...styles.settingsMasterToggle, paddingTop: 0, borderTop: 'none', marginTop: 0, marginBottom: '20px'}}>
                        <div style={styles.settingsToggle}>
                             <span style={styles.settingsToggleLabel}>Program Disabled</span>
                             <ToggleSwitch isChecked={formData.loyaltyEnabled} onChange={(e) => setFormData(prev => ({ ...prev, loyaltyEnabled: e.target.checked}))} />
                             <span style={styles.settingsToggleLabel}>Program Enabled</span>
                        </div>
                    </div>
                     <div style={{...styles.adminFormGroupGrid, opacity: formData.loyaltyEnabled ? 1 : 0.5}}>
                        <div style={styles.adminFormGroup}>
                            <label style={styles.adminLabel} htmlFor="pointsPerDollar">Points per {currencySymbols[formData.currency]}1 Spent</label>
                            <input style={styles.adminFormInput} type="number" name="pointsPerDollar" id="pointsPerDollar" value={formData.pointsPerDollar} onChange={handleGlobalChange} min="0" required disabled={!formData.loyaltyEnabled} />
                        </div>
                         <div style={styles.adminFormGroup}>
                            <label style={styles.adminLabel} htmlFor="pointsToReward">Points for Free Drink</label>
                            <input style={styles.adminFormInput} type="number" name="pointsToReward" id="pointsToReward" value={formData.pointsToReward} onChange={handleGlobalChange} min="1" required disabled={!formData.loyaltyEnabled} />
                        </div>
                     </div>
                </div>

                 <div style={styles.adminFormCard}>
                    <h3 style={styles.adminModalTitle}>Opening Hours & Schedule</h3>
                    <p style={styles.settingsHelperText}>Set your weekly opening hours. The master toggle below can temporarily close the store without altering these hours.</p>

                    <div style={styles.adminTableContainer}>
                         <table style={styles.settingsTable}>
                            <thead>
                                <tr>
                                    <th style={styles.settingsTh}>Day</th>
                                    <th style={styles.settingsTh}>Status</th>
                                    <th style={styles.settingsTh}>Opening Time</th>
                                    <th style={styles.settingsTh}>Closing Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dayOrder.map(day => (
                                    <tr key={day}>
                                        <td style={styles.settingsTd}><span style={styles.settingsDayName}>{day}</span></td>
                                        <td style={styles.settingsTd}>
                                            <ToggleSwitch isChecked={formData.weekSchedule[day].isOpen} onChange={(e) => handleDailyChange(day, 'isOpen', e.target.checked)} />
                                        </td>
                                        <td style={styles.settingsTd}>
                                            <select style={styles.adminFormInput} value={formData.weekSchedule[day].openingHour} onChange={(e) => handleDailyChange(day, 'openingHour', parseInt(e.target.value))} disabled={!formData.weekSchedule[day].isOpen}>
                                                {Array.from({length: 24}, (_, i) => <option key={i} value={i}>{`${i.toString().padStart(2, '0')}:00`}</option>)}
                                            </select>
                                        </td>
                                        <td style={styles.settingsTd}>
                                            <select style={styles.adminFormInput} value={formData.weekSchedule[day].closingHour} onChange={(e) => handleDailyChange(day, 'closingHour', parseInt(e.target.value))} disabled={!formData.weekSchedule[day].isOpen}>
                                                {Array.from({length: 24}, (_, i) => <option key={i} value={i}>{`${i.toString().padStart(2, '0')}:00`}</option>)}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div style={{...styles.adminFormGroup, ...styles.settingsMasterToggle}}>
                        <div style={styles.settingsToggle}>
                             <span style={styles.settingsToggleLabel}>Store Closed</span>
                             <ToggleSwitch isChecked={formData.storeOpen} onChange={(e) => setFormData(prev => ({ ...prev, storeOpen: e.target.checked}))} />
                             <span style={styles.settingsToggleLabel}>Store Open</span>
                        </div>
                    </div>
                 </div>

                 <div style={styles.adminFormCard}>
                     <h3 style={styles.adminModalTitle}>Order & Collection Slot Settings</h3>
                     <p style={styles.settingsHelperText}>Fine-tune how and when customers can place orders for collection.</p>
                     <div style={styles.adminFormGroupGrid}>
                         <div style={styles.adminFormGroup}>
                            <label style={styles.adminLabel} htmlFor="slotDuration">Slot Duration (minutes)</label>
                            <input style={styles.adminFormInput} type="number" name="slotDuration" id="slotDuration" value={formData.slotDuration} onChange={handleGlobalChange} min="5" required />
                        </div>
                        <div style={styles.adminFormGroup}>
                            <label style={styles.adminLabel} htmlFor="maxOrdersPerSlot">Max Orders per Slot</label>
                            <input style={styles.adminFormInput} type="number" name="maxOrdersPerSlot" id="maxOrdersPerSlot" value={formData.maxOrdersPerSlot} onChange={handleGlobalChange} min="1" required />
                        </div>
                        <div style={styles.adminFormGroup}>
                            <label style={styles.adminLabel} htmlFor="minLeadTimeMinutes">Minimum Lead Time (minutes)</label>
                            <input style={styles.adminFormInput} type="number" name="minLeadTimeMinutes" id="minLeadTimeMinutes" value={formData.minLeadTimeMinutes} onChange={handleGlobalChange} min="0" required />
                        </div>
                         <div style={styles.adminFormGroup}>
                            <label style={styles.adminLabel} htmlFor="maxDaysInAdvance">Bookable Days in Advance</label>
                            <input style={styles.adminFormInput} type="number" name="maxDaysInAdvance" id="maxDaysInAdvance" value={formData.maxDaysInAdvance} onChange={handleGlobalChange} min="1" max="14" required />
                        </div>
                        <div style={styles.adminFormGroup}>
                            <label style={styles.adminLabel} htmlFor="openingBufferMinutes">Opening Buffer (minutes)</label>
                            <input style={styles.adminFormInput} type="number" name="openingBufferMinutes" id="openingBufferMinutes" value={formData.openingBufferMinutes} onChange={handleGlobalChange} min="0" required />
                        </div>
                        <div style={styles.adminFormGroup}>
                            <label style={styles.adminLabel} htmlFor="closingBufferMinutes">Closing Buffer (minutes)</label>
                            <input style={styles.adminFormInput} type="number" name="closingBufferMinutes" id="closingBufferMinutes" value={formData.closingBufferMinutes} onChange={handleGlobalChange} min="0" required />
                        </div>
                     </div>
                 </div>

                <div style={styles.adminFormActions}>
                    <button type="submit" style={styles.adminButtonPrimary}>Save All Settings</button>
                    {showSuccess && <span style={styles.success}>Settings saved!</span>}
                </div>
            </form>

            {/* Floating Save Button */}
            {hasUnsavedChanges && (
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
        </>
    );
};
