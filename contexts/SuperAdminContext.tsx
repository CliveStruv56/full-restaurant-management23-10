import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Tenant } from '../types';
import { useAuth } from './AuthContext';
import { collection, query, where, orderBy, onSnapshot, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../firebase/config';

interface SuperAdminContextType {
  allTenants: Tenant[];
  filteredTenants: Tenant[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  statusFilter: 'all' | 'pending-approval' | 'trial' | 'active' | 'suspended' | 'cancelled';
  sortBy: 'createdAt' | 'businessName' | 'lastActivity' | 'totalOrders';
  sortDirection: 'asc' | 'desc';
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: 'all' | 'pending-approval' | 'trial' | 'active' | 'suspended' | 'cancelled') => void;
  setSortBy: (field: 'createdAt' | 'businessName' | 'lastActivity' | 'totalOrders') => void;
  setSortDirection: (direction: 'asc' | 'desc') => void;
  refreshTenants: () => void;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

export const SuperAdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, userRole } = useAuth();
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending-approval' | 'trial' | 'active' | 'suspended' | 'cancelled'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'businessName' | 'lastActivity' | 'totalOrders'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check if user is super admin
  const isSuperAdmin = user && userRole === 'super-admin';

  // Load all tenants (only if super admin)
  useEffect(() => {
    if (!isSuperAdmin) {
      setLoading(false);
      setError('Unauthorized: Super admin access required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Stream all tenant metadata
      const tenantsRef = collection(db, 'tenantMetadata');
      const q = query(tenantsRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const tenants: Tenant[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Tenant));

          setAllTenants(tenants);
          setLoading(false);
          console.log(`✅ Loaded ${tenants.length} tenants for super admin`);
        },
        (err) => {
          console.error('Error loading tenants:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error('Error setting up tenants listener:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [isSuperAdmin, refreshTrigger]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...allTenants];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tenant =>
        tenant.businessName.toLowerCase().includes(query) ||
        tenant.subdomain.toLowerCase().includes(query) ||
        tenant.id.toLowerCase().includes(query) ||
        tenant.contactEmail?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tenant =>
        tenant.tenantStatus?.status === statusFilter
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'businessName':
          aValue = a.businessName.toLowerCase();
          bValue = b.businessName.toLowerCase();
          break;
        case 'lastActivity':
          aValue = a.usageMetrics?.lastActivityAt || a.createdAt;
          bValue = b.usageMetrics?.lastActivityAt || b.createdAt;
          break;
        case 'totalOrders':
          aValue = a.usageMetrics?.totalOrders || 0;
          bValue = b.usageMetrics?.totalOrders || 0;
          break;
        case 'createdAt':
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredTenants(filtered);
  }, [allTenants, searchQuery, statusFilter, sortBy, sortDirection]);

  const refreshTenants = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <SuperAdminContext.Provider
      value={{
        allTenants,
        filteredTenants,
        loading,
        error,
        searchQuery,
        statusFilter,
        sortBy,
        sortDirection,
        setSearchQuery,
        setStatusFilter,
        setSortBy,
        setSortDirection,
        refreshTenants,
      }}
    >
      {children}
    </SuperAdminContext.Provider>
  );
};

export const useSuperAdmin = (): SuperAdminContextType => {
  const context = useContext(SuperAdminContext);
  if (context === undefined) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
};
