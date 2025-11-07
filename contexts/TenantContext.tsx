import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { primeOfflineCache } from '../firebase/offlineCache';
import { Tenant } from '../types';

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  isSuperAdminPortal: boolean; // True if accessing super admin portal
  isPublicPage: boolean; // True if on public marketing/signup pages
  refetchTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuperAdminPortal, setIsSuperAdminPortal] = useState(false);
  const [isPublicPage, setIsPublicPage] = useState(false);

  /**
   * Check if current hostname is the super admin portal
   */
  const checkIsSuperAdminPortal = (): boolean => {
    const hostname = window.location.hostname;

    // Development: superadmin.localhost → super admin portal
    if (hostname === 'superadmin.localhost' || hostname === 'superadmin.127.0.0.1') {
      return true;
    }

    // Production: admin.orderflow.app → super admin portal
    if (hostname === 'admin.orderflow.app' || hostname.startsWith('admin.')) {
      return true;
    }

    return false;
  };

  /**
   * Get tenant ID from current request
   *
   * Logic:
   * - superadmin.localhost / admin.orderflow.app → null (super admin portal)
   * - Public pages (/, /signup, /signup/pending, /register) → null (no tenant needed)
   * - localhost → 'demo-tenant'
   * - subdomain.yourapp.com → 'subdomain'
   * - customdomain.com → lookup in Firestore (future)
   */
  const getTenantIdFromRequest = (): string | null => {
    const hostname = window.location.hostname;
    const path = window.location.pathname;

    // Check if super admin portal
    if (checkIsSuperAdminPortal()) {
      return null; // No tenant for super admin portal
    }

    // Check if public marketing/signup pages - don't load tenant
    const isPublicPage = path === '/' ||
                         path === '/signup' ||
                         path === '/signup/pending' ||
                         path === '/register' ||
                         path === '/login';

    if (isPublicPage && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      return null; // No tenant for public pages on localhost
    }

    // Subdomain parsing: Extract tenant ID from hostname
    const parts = hostname.split('.');

    // Development: subdomain.localhost → 'subdomain'
    // Example: some-good.localhost → 'some-good'
    if (parts.length === 2 && (parts[1] === 'localhost' || parts[1] === '127')) {
      return parts[0]; // Return subdomain as tenant ID
    }

    // Production subdomain: subdomain.domain.com → 'subdomain'
    // Example: some-good.orderflow.app → 'some-good'
    if (parts.length >= 3) {
      return parts[0]; // subdomain is first part
    }

    // Plain localhost → use demo tenant
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'demo-tenant';
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

      const isSuperAdmin = checkIsSuperAdminPortal();
      setIsSuperAdminPortal(isSuperAdmin);

      // Super admin portal doesn't need tenant data
      if (isSuperAdmin) {
        console.log('🔑 Super admin portal detected - skipping tenant load');
        setTenant(null);
        setLoading(false);
        return;
      }

      const tenantId = getTenantIdFromRequest();
      console.log(`Loading tenant: ${tenantId}`);

      // Check if this is a public page (no tenant needed)
      const path = window.location.pathname;
      const isPublic = path === '/' ||
                       path === '/signup' ||
                       path === '/signup/pending' ||
                       path === '/register' ||
                       path === '/login';
      setIsPublicPage(isPublic);

      if (!tenantId) {
        // If no tenant ID and it's a public page, that's okay
        if (isPublic) {
          console.log('📄 Public page detected - no tenant needed');
          setTenant(null);
          setLoading(false);
          return;
        }

        console.error('❌ No tenant ID determined');
        setError('Could not determine tenant');
        setTenant(null);
        setLoading(false);
        return;
      }

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

  // Error state (only for non-super admin portals and non-public pages)
  if ((error || !tenant) && !isSuperAdminPortal && !isPublicPage) {
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
    <TenantContext.Provider value={{ tenant, loading, isSuperAdminPortal, isPublicPage, refetchTenant }}>
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
