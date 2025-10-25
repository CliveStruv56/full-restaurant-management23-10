import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

interface TenantOption {
    tenantId: string;
    businessName: string;
    role: 'admin' | 'staff' | 'customer';
    isLastSelected: boolean;
}

export const TenantSelector: React.FC = () => {
    const { user, tenantMemberships, currentTenantId, switchTenant } = useAuth();
    const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [switching, setSwitching] = useState(false);

    // Load tenant metadata for display
    useEffect(() => {
        const loadTenantOptions = async () => {
            if (!tenantMemberships || Object.keys(tenantMemberships).length === 0) {
                setLoading(false);
                return;
            }

            const options: TenantOption[] = [];

            for (const [tenantId, membership] of Object.entries(tenantMemberships)) {
                if (!membership.isActive) continue;

                try {
                    const tenantDoc = await getDoc(doc(db, 'tenantMetadata', tenantId));
                    let businessName = tenantId; // Fallback to ID

                    if (tenantDoc.exists()) {
                        businessName = tenantDoc.data()?.businessName || tenantId;
                    }

                    options.push({
                        tenantId,
                        businessName,
                        role: membership.role,
                        isLastSelected: tenantId === currentTenantId,
                    });
                } catch (error) {
                    console.error(`Error loading tenant ${tenantId}:`, error);
                }
            }

            setTenantOptions(options);
            setLoading(false);
        };

        loadTenantOptions();
    }, [tenantMemberships, currentTenantId]);

    const handleSelectTenant = async (tenantId: string) => {
        setSwitching(true);
        try {
            await switchTenant(tenantId);
            // Page will reload after switching
        } catch (error) {
            console.error('Error switching tenant:', error);
            setSwitching(false);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin':
                return { bg: '#dc3545', text: '#fff' };
            case 'staff':
                return { bg: '#ffc107', text: '#000' };
            case 'customer':
                return { bg: '#6c757d', text: '#fff' };
            default:
                return { bg: '#6c757d', text: '#fff' };
        }
    };

    if (loading) {
        return (
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10000,
                }}
            >
                <div
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '40px',
                        textAlign: 'center',
                    }}
                >
                    <div
                        style={{
                            width: '50px',
                            height: '50px',
                            border: '4px solid #e9ecef',
                            borderTop: '4px solid #2a9d8f',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto',
                        }}
                    />
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                    <p style={{ marginTop: '20px', color: '#6c757d' }}>Loading workspaces...</p>
                </div>
            </div>
        );
    }

    // Don't show selector if user only has one tenant
    if (tenantOptions.length <= 1) {
        return null;
    }

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10000,
            }}
        >
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '40px',
                    maxWidth: '600px',
                    width: '90%',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                }}
            >
                <h2
                    style={{
                        margin: '0 0 10px 0',
                        fontSize: '2em',
                        color: '#343a40',
                        textAlign: 'center',
                    }}
                >
                    Select Your Workspace
                </h2>
                <p
                    style={{
                        textAlign: 'center',
                        color: '#6c757d',
                        marginBottom: '30px',
                    }}
                >
                    You have access to multiple restaurants. Choose which one to access:
                </p>

                <div
                    style={{
                        display: 'grid',
                        gap: '15px',
                    }}
                >
                    {tenantOptions.map((option) => {
                        const roleBadgeColors = getRoleBadgeColor(option.role);

                        return (
                            <div
                                key={option.tenantId}
                                style={{
                                    border: option.isLastSelected
                                        ? '2px solid #2a9d8f'
                                        : '2px solid #e9ecef',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    cursor: switching ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    backgroundColor: option.isLastSelected ? '#f0fdf4' : 'white',
                                    opacity: switching ? 0.7 : 1,
                                }}
                                onClick={() => !switching && handleSelectTenant(option.tenantId)}
                                onMouseEnter={(e) => {
                                    if (!switching) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <h3
                                            style={{
                                                margin: '0 0 8px 0',
                                                fontSize: '1.3em',
                                                color: '#343a40',
                                            }}
                                        >
                                            {option.businessName}
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span
                                                style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.85em',
                                                    fontWeight: 600,
                                                    textTransform: 'capitalize',
                                                    backgroundColor: roleBadgeColors.bg,
                                                    color: roleBadgeColors.text,
                                                }}
                                            >
                                                {option.role}
                                            </span>
                                            {option.isLastSelected && (
                                                <span
                                                    style={{
                                                        fontSize: '0.85em',
                                                        color: '#2a9d8f',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    ✓ Last used
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: option.isLastSelected ? '#2a9d8f' : '#343a40',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '0.95em',
                                            fontWeight: 600,
                                            cursor: switching ? 'not-allowed' : 'pointer',
                                            opacity: switching ? 0.7 : 1,
                                        }}
                                        disabled={switching}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            !switching && handleSelectTenant(option.tenantId);
                                        }}
                                    >
                                        {switching && currentTenantId === option.tenantId
                                            ? 'Switching...'
                                            : 'Select'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {switching && (
                    <div
                        style={{
                            marginTop: '20px',
                            padding: '15px',
                            backgroundColor: '#fff3cd',
                            borderRadius: '8px',
                            textAlign: 'center',
                            color: '#856404',
                            fontWeight: 600,
                        }}
                    >
                        Switching workspace, please wait...
                    </div>
                )}
            </div>
        </div>
    );
};
