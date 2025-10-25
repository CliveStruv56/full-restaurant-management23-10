import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { primeOfflineCache } from '../firebase/offlineCache';

// Tenant interface
export interface Tenant {
  id: string;
  businessName: string;
  businessType: 'cafe' | 'restaurant' | 'pub' | 'quick-service';
  subdomain: string;
  customDomain?: string;
  enabledModules: {
    base: boolean;
    tableManagement: boolean;
    management: boolean;
    delivery: boolean;
  };
  subscription: {
    plan: 'trial' | 'active' | 'cancelled';
    trialEndsAt?: string;
    modules: string[];
  };
  paymentGateway: {
    provider: 'stripe' | 'square' | 'custom' | 'none';
    config?: any;
  };
  branding?: {
    primaryColor?: string;
    logo?: string;
    favicon?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  refetchTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get tenant ID from current request
   *
   * Logic:
   * - localhost → 'demo-tenant'
   * - subdomain.yourapp.com → 'subdomain'
   * - customdomain.com → lookup in Firestore (future)
   */
  const getTenantIdFromRequest = (): string => {
    const hostname = window.location.hostname;

    // Development: localhost → use demo tenant
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'demo-tenant';
    }

    // Production subdomain: client1.yourapp.com → 'client1'
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      return parts[0]; // subdomain is first part
    }

    // Custom domain: Check Firestore for domain mapping
    // TODO: Implement custom domain lookup in Phase 2
    // For now, fallback to demo
    console.warn(`Could not determine tenant from hostname: ${hostname}. Using demo-tenant.`);
    return 'demo-tenant';
  };

  const loadTenant = async () => {
    try {
      setLoading(true);
      setError(null);

      const tenantId = getTenantIdFromRequest();
      console.log(`Loading tenant: ${tenantId}`);

      const tenantDoc = await getDoc(doc(db, 'tenantMetadata', tenantId));

      if (tenantDoc.exists()) {
        const tenantData = { id: tenantDoc.id, ...tenantDoc.data() } as Tenant;
        setTenant(tenantData);
        console.log(`✅ Tenant loaded: ${tenantData.businessName}`);

        // Prime offline cache with tenant data
        primeOfflineCache(tenantId);
      } else {
        console.error(`❌ Tenant not found: ${tenantId}`);
        setError(`Tenant not found: ${tenantId}`);
        setTenant(null);
      }
    } catch (err: any) {
      console.error('Error loading tenant:', err);
      setError(err.message);
      setTenant(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenant();
  }, []);

  const refetchTenant = async () => {
    await loadTenant();
  };

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#6b7280' }}>Loading tenant...</p>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // Error state
  if (error || !tenant) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '100px auto'
      }}>
        <h1 style={{ color: '#dc2626', marginBottom: '20px' }}>Tenant Not Found</h1>
        <p style={{ color: '#6b7280', marginBottom: '10px' }}>
          {error || 'This subdomain is not configured.'}
        </p>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>
          Current hostname: {window.location.hostname}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={{ tenant, loading, refetchTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

/**
 * Hook to access tenant context
 *
 * Usage:
 * const { tenant, loading, refetchTenant } = useTenant();
 */
export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
