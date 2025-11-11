import React, { useState } from 'react';
import { useSuperAdmin } from '../../contexts/SuperAdminContext';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { formatDistance } from 'date-fns';
import { db } from '../../firebase/config';
import { collection, addDoc, updateDoc, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth } from '../../firebase/config';
import toast from 'react-hot-toast';
import type { Tenant, VerticalType } from '../../types';
import { getVerticalConfig } from '../../src/config/verticals';

export const SuperAdminPanel: React.FC = () => {
  const {
    filteredTenants,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    refreshTenants,
  } = useSuperAdmin();

  // Tab state
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  // Form states for creating tenant
  const [newTenant, setNewTenant] = useState({
    businessName: '',
    subdomain: '',
    verticalType: 'restaurant' as VerticalType,
    contactEmail: '',
    enabledModules: {
      base: true,
      tableManagement: false,
      management: false,
      delivery: false,
    }
  });

  // Form state for editing modules
  const [editModules, setEditModules] = useState({
    base: true,
    tableManagement: false,
    management: false,
    delivery: false,
  });

  const handleCreateTenant = async () => {
    try {
      // Validate subdomain
      const subdomainRegex = /^[a-z0-9-]+$/;
      if (!subdomainRegex.test(newTenant.subdomain)) {
        toast.error('Subdomain can only contain lowercase letters, numbers, and hyphens');
        return;
      }

      const tenantData = {
        businessName: newTenant.businessName,
        subdomain: newTenant.subdomain,
        verticalType: newTenant.verticalType,
        contactEmail: newTenant.contactEmail,
        enabledModules: newTenant.enabledModules,
        subscription: {
          plan: 'trial',
          modules: Object.entries(newTenant.enabledModules)
            .filter(([_, enabled]) => enabled)
            .map(([module]) => module),
        },
        paymentGateway: {
          provider: 'none',
        },
        tenantStatus: {
          status: 'trial',
          statusChangedAt: new Date().toISOString(),
          statusChangedBy: 'super-admin',
        },
        usageMetrics: {
          totalOrders: 0,
          totalUsers: 0,
          totalStaff: 0,
          lastActivityAt: new Date().toISOString(),
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Use subdomain as document ID for easy querying
      await setDoc(doc(db, 'tenantMetadata', newTenant.subdomain), tenantData);

      // Auto-add the creating super-admin as an admin member of this tenant
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const currentMemberships = userDoc.data().tenantMemberships || {};

          // Add new tenant membership
          await updateDoc(userDocRef, {
            [`tenantMemberships.${newTenant.subdomain}`]: {
              role: 'admin',
              joinedAt: new Date().toISOString(),
              isActive: true,
            },
            updatedAt: serverTimestamp(),
          });

          console.log(`✅ Added super-admin as admin member of tenant: ${newTenant.subdomain}`);
        }
      }

      toast.success('Tenant created successfully!');
      setCreateDialogOpen(false);
      setNewTenant({
        businessName: '',
        subdomain: '',
        verticalType: 'restaurant',
        contactEmail: '',
        enabledModules: {
          base: true,
          tableManagement: false,
          management: false,
          delivery: false,
        }
      });
      refreshTenants();
    } catch (err: any) {
      console.error('Error creating tenant:', err);
      toast.error(err.message || 'Failed to create tenant');
    }
  };

  const handleEditModules = async () => {
    if (!selectedTenant) return;

    try {
      const tenantRef = doc(db, 'tenantMetadata', selectedTenant.id);
      await updateDoc(tenantRef, {
        enabledModules: editModules,
        'subscription.modules': Object.entries(editModules)
          .filter(([_, enabled]) => enabled)
          .map(([module]) => module),
        updatedAt: serverTimestamp(),
      });

      toast.success('Modules updated successfully!');
      setEditDialogOpen(false);
      setSelectedTenant(null);
      refreshTenants();
    } catch (err: any) {
      console.error('Error updating modules:', err);
      toast.error(err.message || 'Failed to update modules');
    }
  };

  const openEditDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setEditModules(tenant.enabledModules);
    setEditDialogOpen(true);
  };

  const handleApproveTenant = async (approve: boolean) => {
    if (!selectedTenant) return;

    try {
      const tenantRef = doc(db, 'tenantMetadata', selectedTenant.id);

      // Calculate trial end date (14 days from now)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      await updateDoc(tenantRef, {
        tenantStatus: {
          status: approve ? 'trial' : 'cancelled',
          statusChangedAt: new Date().toISOString(),
          statusChangedBy: 'super-admin',
          statusReason: approve
            ? `Approved${approvalNotes ? ': ' + approvalNotes : ''}`
            : `Rejected${approvalNotes ? ': ' + approvalNotes : ''}`,
          approvedBy: approve ? 'super-admin' : undefined,
          approvedAt: approve ? new Date().toISOString() : undefined
        },
        'subscription.plan': approve ? 'trial' : 'cancelled',
        'subscription.trialEndsAt': approve ? trialEndsAt.toISOString() : null,
        updatedAt: serverTimestamp(),
      });

      toast.success(`Tenant ${approve ? 'approved' : 'rejected'} successfully!`);
      setApproveDialogOpen(false);
      setSelectedTenant(null);
      setApprovalNotes('');
      refreshTenants();

      // TODO: Send email notification to tenant
    } catch (err: any) {
      console.error('Error updating tenant status:', err);
      toast.error(err.message || 'Failed to update tenant status');
    }
  };

  const openApproveDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setApprovalNotes('');
    setApproveDialogOpen(true);
  };

  // Computed values
  const pendingTenants = filteredTenants.filter(
    t => t.tenantStatus?.status === 'pending-approval'
  );
  const pendingCount = pendingTenants.length;

  const getStatusConfig = (status?: string) => {
    switch (status) {
      case 'active':
        return { color: 'bg-emerald-500 text-white', label: 'Active', icon: '✓' };
      case 'trial':
        return { color: 'bg-blue-500 text-white', label: 'Trial', icon: '⏱' };
      case 'pending-approval':
        return { color: 'bg-amber-500 text-white', label: 'Pending', icon: '⏳' };
      case 'suspended':
        return { color: 'bg-red-500 text-white', label: 'Suspended', icon: '⚠' };
      case 'cancelled':
        return { color: 'bg-gray-500 text-white', label: 'Cancelled', icon: '✕' };
      default:
        return { color: 'bg-gray-400 text-white', label: 'Unknown', icon: '?' };
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistance(date, new Date(), { addSuffix: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-3" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-600 mb-3">Error Loading Tenants</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Super Admin Portal</h1>
              <p className="text-indigo-100 text-lg">Manage all tenants across the platform</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 text-center">
                <div className="text-3xl font-bold">{filteredTenants.length}</div>
                <div className="text-xs text-indigo-100">Total Tenants</div>
              </div>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-white text-indigo-600 hover:bg-indigo-50 font-semibold"
              >
                + Create Tenant
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 rounded-t-lg font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-indigo-600'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              All Tenants
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 rounded-t-lg font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'bg-white text-indigo-600'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Pending Approvals
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
        {activeTab === 'all' ? (
          <>
            {/* Filters Card */}
            <Card className="mb-6 shadow-md">
              <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-12">
                  {/* Search */}
                  <div className="md:col-span-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Tenants
                    </label>
                    <input
                      type="text"
                      placeholder="Search by name, subdomain, or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status Filter
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="trial">Trial</option>
                      <option value="pending-approval">Pending</option>
                      <option value="suspended">Suspended</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Sort By */}
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                    >
                      <option value="createdAt">Created Date</option>
                      <option value="businessName">Business Name</option>
                      <option value="lastActivity">Last Activity</option>
                      <option value="totalOrders">Total Orders</option>
                    </select>
                  </div>

                  {/* Sort Direction */}
                  <div className="md:col-span-1 flex items-end">
                    <Button
                      onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                      variant="outline"
                      className="w-full h-[42px] border-gray-300 hover:bg-gray-50"
                      title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                    >
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tenant List */}
            {filteredTenants.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-16 text-center">
              <div className="text-7xl mb-4">🔍</div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Tenants Found</h3>
              <p className="text-gray-500 text-lg">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No tenants have been created yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredTenants.map((tenant) => {
              const statusConfig = getStatusConfig(tenant.tenantStatus?.status);

              return (
                <Card key={tenant.id} className="hover:shadow-xl transition-all duration-200 border-l-4 border-l-indigo-500">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                      {/* Left Side - Main Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4 mb-4">
                          {/* Icon/Avatar */}
                          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                            {tenant.businessName.charAt(0).toUpperCase()}
                          </div>

                          {/* Business Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900 truncate">
                                {tenant.businessName}
                              </h3>
                              <Badge className={`${statusConfig.color} font-semibold`}>
                                {statusConfig.icon} {statusConfig.label}
                              </Badge>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="text-gray-400">🌐</span>
                                <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                                  {tenant.subdomain}.localhost:3000
                                </code>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="text-gray-400">✉️</span>
                                <span>{tenant.contactEmail || 'No email'}</span>
                              </div>

                              {/* Enabled Modules */}
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="text-gray-400">📦</span>
                                <div className="flex gap-1 flex-wrap">
                                  {tenant.enabledModules.base && (
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">Base</span>
                                  )}
                                  {tenant.enabledModules.tableManagement && (
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">Tables</span>
                                  )}
                                  {tenant.enabledModules.management && (
                                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">Management</span>
                                  )}
                                  {tenant.enabledModules.delivery && (
                                    <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-medium">Delivery</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Timestamps */}
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500 pl-[72px]">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">📅</span>
                            <span>Created {formatDate(tenant.createdAt)}</span>
                          </div>
                          {tenant.usageMetrics?.lastActivityAt && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-400">⚡</span>
                              <span>Active {formatDate(tenant.usageMetrics.lastActivityAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Side - Metrics & Actions */}
                      <div className="flex flex-row lg:flex-col items-center lg:items-end gap-4 lg:gap-3 border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-6">
                        {/* Orders Metric */}
                        <div className="text-center lg:text-right">
                          <div className="text-4xl font-bold text-indigo-600">
                            {tenant.usageMetrics?.totalOrders || 0}
                          </div>
                          <div className="text-xs text-gray-500 font-medium">Total Orders</div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(tenant)}
                          >
                            ⚙️ Modules
                          </Button>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                            onClick={() => {
                              // Use URL parameter instead of localStorage since localStorage is origin-specific
                              // superadmin.localhost and some-good.localhost have different localStorage!
                              const port = window.location.port;
                              const url = `http://${tenant.subdomain}.localhost${port ? ':' + port : ''}?superAdminViewing=true`;
                              console.log('🔗 View Site clicked - Opening with flag:', url);
                              window.open(url, '_blank');
                            }}
                          >
                            🔗 View Site
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

            {/* Footer Summary */}
            {filteredTenants.length > 0 && (
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredTenants.length}</span> tenant{filteredTenants.length === 1 ? '' : 's'}
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Pending Approvals View */}
            <div className="mb-6">
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Pending Approvals</h2>
                      <p className="text-gray-600 mt-1">Review and approve new tenant signups</p>
                    </div>
                    <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg font-semibold">
                      {pendingCount} {pendingCount === 1 ? 'Tenant' : 'Tenants'} Awaiting Review
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {pendingTenants.length === 0 ? (
              <Card className="shadow-md">
                <CardContent className="p-16 text-center">
                  <div className="text-7xl mb-4">✅</div>
                  <h3 className="text-2xl font-semibold text-gray-700 mb-2">All Caught Up!</h3>
                  <p className="text-gray-500 text-lg">
                    No pending tenant approvals at this time
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingTenants.map((tenant) => {
                  const statusConfig = getStatusConfig(tenant.tenantStatus?.status);

                  return (
                    <Card key={tenant.id} className="hover:shadow-xl transition-all duration-200 border-l-4 border-l-amber-500">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                          {/* Left Side - Main Info */}
                          <div className="flex-1">
                            <div className="flex items-start gap-4 mb-4">
                              {/* Icon/Avatar */}
                              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                                {tenant.businessName.charAt(0).toUpperCase()}
                              </div>

                              {/* Business Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-xl font-bold text-gray-900 truncate">
                                    {tenant.businessName}
                                  </h3>
                                  <Badge className={`${statusConfig.color} font-semibold`}>
                                    {statusConfig.icon} {statusConfig.label}
                                  </Badge>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="text-gray-400">🏢</span>
                                    <span>{getVerticalConfig(tenant.verticalType || 'restaurant').name}</span>
                                  </div>

                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="text-gray-400">🌐</span>
                                    <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                                      {tenant.subdomain}.restaurantos.com
                                    </code>
                                  </div>

                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="text-gray-400">✉️</span>
                                    <span>{tenant.contactEmail || 'No email'}</span>
                                  </div>

                                  {tenant.contactPhone && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <span className="text-gray-400">📞</span>
                                      <span>{tenant.contactPhone}</span>
                                    </div>
                                  )}

                                  {/* Requested Modules */}
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="text-gray-400">📦 Requested:</span>
                                    <div className="flex gap-1 flex-wrap">
                                      {tenant.enabledModules.base && (
                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">Base</span>
                                      )}
                                      {tenant.enabledModules.tableManagement && (
                                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">Tables</span>
                                      )}
                                      {tenant.enabledModules.management && (
                                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">Management</span>
                                      )}
                                      {tenant.enabledModules.delivery && (
                                        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-medium">Delivery</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Subscription Plan */}
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="text-gray-400">💳</span>
                                    <span className="capitalize font-medium">{tenant.subscription?.plan || 'Trial'} Plan</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Timestamps */}
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500 pl-[72px]">
                              <div className="flex items-center gap-1">
                                <span className="text-gray-400">📅</span>
                                <span>Signed up {formatDate(tenant.createdAt)}</span>
                              </div>
                            </div>

                            {/* Status Reason */}
                            {tenant.tenantStatus?.statusReason && (
                              <div className="mt-4 ml-[72px] bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-sm text-gray-700">
                                  <span className="font-semibold text-amber-800">Note:</span> {tenant.tenantStatus.statusReason}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Right Side - Actions */}
                          <div className="flex flex-col gap-3 border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-6 lg:min-w-[200px]">
                            <Button
                              onClick={() => openApproveDialog(tenant)}
                              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-6 shadow-lg"
                            >
                              ✅ Approve & Activate
                            </Button>

                            <Button
                              variant="outline"
                              onClick={() => openEditDialog(tenant)}
                              className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold py-6"
                            >
                              ⚙️ Edit Modules
                            </Button>

                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedTenant(tenant);
                                setApprovalNotes('');
                                setApproveDialogOpen(true);
                              }}
                              className="border-2 border-red-600 text-red-600 hover:bg-red-50 font-semibold py-6"
                            >
                              ❌ Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Tenant Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Create New Tenant</DialogTitle>
            <DialogDescription className="text-gray-600">
              Add a new tenant to the platform. They will start with a trial status.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="businessName" className="text-gray-700 font-medium">Business Name *</Label>
              <Input
                id="businessName"
                value={newTenant.businessName}
                onChange={(e) => setNewTenant({ ...newTenant, businessName: e.target.value })}
                placeholder="e.g., Joe's Coffee Shop"
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subdomain" className="text-gray-700 font-medium">Subdomain *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="subdomain"
                  value={newTenant.subdomain}
                  onChange={(e) => setNewTenant({ ...newTenant, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="e.g., joes-coffee"
                  className="flex-1 bg-white border-gray-300 text-gray-900"
                />
                <span className="text-sm text-gray-600 whitespace-nowrap">.localhost:3000</span>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="verticalType" className="text-gray-700 font-medium">Business Type *</Label>
              <Select value={newTenant.verticalType} onValueChange={(value: VerticalType) => setNewTenant({ ...newTenant, verticalType: value })}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="restaurant" className="text-gray-900">Restaurant & Cafe</SelectItem>
                  <SelectItem value="auto-shop" className="text-gray-900">Auto Shop & Mechanic</SelectItem>
                  <SelectItem value="salon" className="text-gray-900">Salon & Spa</SelectItem>
                  <SelectItem value="hotel" className="text-gray-900">Hotel & Hospitality</SelectItem>
                  <SelectItem value="retail" className="text-gray-900">Retail Store</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactEmail" className="text-gray-700 font-medium">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={newTenant.contactEmail}
                onChange={(e) => setNewTenant({ ...newTenant, contactEmail: e.target.value })}
                placeholder="contact@business.com"
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
            <div className="grid gap-3 pt-4 border-t-2 border-gray-200 mt-2">
              <Label className="text-gray-900 font-semibold text-base">Enabled Modules</Label>
              <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border-2 border-blue-200 hover:border-blue-300 transition-colors">
                <div>
                  <Label htmlFor="module-base" className="font-semibold text-gray-900 cursor-pointer">Base Module</Label>
                  <p className="text-xs text-gray-600 mt-0.5">Core ordering and menu features</p>
                </div>
                <Switch
                  id="module-base"
                  checked={newTenant.enabledModules.base}
                  onCheckedChange={(checked) => setNewTenant({ ...newTenant, enabledModules: { ...newTenant.enabledModules, base: checked } })}
                />
              </div>
              <div className="flex items-center justify-between bg-green-50 p-4 rounded-lg border-2 border-green-200 hover:border-green-300 transition-colors">
                <div>
                  <Label htmlFor="module-tables" className="font-semibold text-gray-900 cursor-pointer">Table Management</Label>
                  <p className="text-xs text-gray-600 mt-0.5">Dine-in table reservations and floor plans</p>
                </div>
                <Switch
                  id="module-tables"
                  checked={newTenant.enabledModules.tableManagement}
                  onCheckedChange={(checked) => setNewTenant({ ...newTenant, enabledModules: { ...newTenant.enabledModules, tableManagement: checked } })}
                />
              </div>
              <div className="flex items-center justify-between bg-purple-50 p-4 rounded-lg border-2 border-purple-200 hover:border-purple-300 transition-colors">
                <div>
                  <Label htmlFor="module-management" className="font-semibold text-gray-900 cursor-pointer">Management Module</Label>
                  <p className="text-xs text-gray-600 mt-0.5">Analytics, reports, and staff management</p>
                </div>
                <Switch
                  id="module-management"
                  checked={newTenant.enabledModules.management}
                  onCheckedChange={(checked) => setNewTenant({ ...newTenant, enabledModules: { ...newTenant.enabledModules, management: checked } })}
                />
              </div>
              <div className="flex items-center justify-between bg-orange-50 p-4 rounded-lg border-2 border-orange-200 hover:border-orange-300 transition-colors">
                <div>
                  <Label htmlFor="module-delivery" className="font-semibold text-gray-900 cursor-pointer">Delivery Module</Label>
                  <p className="text-xs text-gray-600 mt-0.5">Delivery tracking and order management</p>
                </div>
                <Switch
                  id="module-delivery"
                  checked={newTenant.enabledModules.delivery}
                  onCheckedChange={(checked) => setNewTenant({ ...newTenant, enabledModules: { ...newTenant.enabledModules, delivery: checked } })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-3 pt-6 border-t-2 border-gray-200">
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              className="border-2 border-gray-400 text-gray-900 hover:bg-gray-100 font-semibold px-6 py-5 text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTenant}
              disabled={!newTenant.businessName || !newTenant.subdomain}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-8 py-5 text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✨ Create Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modules Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Edit Modules</DialogTitle>
            <DialogDescription className="text-gray-600">
              Enable or disable modules for {selectedTenant?.businessName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border-2 border-blue-200 hover:border-blue-300 transition-colors">
              <div>
                <Label htmlFor="edit-module-base" className="font-semibold text-gray-900 cursor-pointer">Base Module</Label>
                <p className="text-xs text-gray-600 mt-0.5">Core ordering and menu features</p>
              </div>
              <Switch
                id="edit-module-base"
                checked={editModules.base}
                onCheckedChange={(checked) => setEditModules({ ...editModules, base: checked })}
              />
            </div>
            <div className="flex items-center justify-between bg-green-50 p-4 rounded-lg border-2 border-green-200 hover:border-green-300 transition-colors">
              <div>
                <Label htmlFor="edit-module-tables" className="font-semibold text-gray-900 cursor-pointer">Table Management</Label>
                <p className="text-xs text-gray-600 mt-0.5">Dine-in table reservations and floor plans</p>
              </div>
              <Switch
                id="edit-module-tables"
                checked={editModules.tableManagement}
                onCheckedChange={(checked) => setEditModules({ ...editModules, tableManagement: checked })}
              />
            </div>
            <div className="flex items-center justify-between bg-purple-50 p-4 rounded-lg border-2 border-purple-200 hover:border-purple-300 transition-colors">
              <div>
                <Label htmlFor="edit-module-management" className="font-semibold text-gray-900 cursor-pointer">Management Module</Label>
                <p className="text-xs text-gray-600 mt-0.5">Analytics, reports, and staff management</p>
              </div>
              <Switch
                id="edit-module-management"
                checked={editModules.management}
                onCheckedChange={(checked) => setEditModules({ ...editModules, management: checked })}
              />
            </div>
            <div className="flex items-center justify-between bg-orange-50 p-4 rounded-lg border-2 border-orange-200 hover:border-orange-300 transition-colors">
              <div>
                <Label htmlFor="edit-module-delivery" className="font-semibold text-gray-900 cursor-pointer">Delivery Module</Label>
                <p className="text-xs text-gray-600 mt-0.5">Delivery tracking and order management</p>
              </div>
              <Switch
                id="edit-module-delivery"
                checked={editModules.delivery}
                onCheckedChange={(checked) => setEditModules({ ...editModules, delivery: checked })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-3 pt-6 border-t-2 border-gray-200">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="border-2 border-gray-400 text-gray-900 hover:bg-gray-100 font-semibold px-6 py-5 text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditModules}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-8 py-5 text-base shadow-lg"
            >
              💾 Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Tenant Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Review Tenant Application</DialogTitle>
            <DialogDescription className="text-gray-600">
              Approve or reject the signup request for {selectedTenant?.businessName}
            </DialogDescription>
          </DialogHeader>

          {selectedTenant && (
            <div className="py-4 space-y-4">
              {/* Tenant Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 font-medium">Business:</span>
                  <span className="text-gray-900 font-semibold">{selectedTenant.businessName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 font-medium">Subdomain:</span>
                  <code className="bg-white px-2 py-1 rounded text-sm font-mono text-indigo-600">
                    {selectedTenant.subdomain}.restaurantos.com
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 font-medium">Email:</span>
                  <span className="text-gray-900">{selectedTenant.contactEmail}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-600 font-medium">Modules:</span>
                  <div className="flex gap-1 flex-wrap">
                    {selectedTenant.enabledModules.base && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">Base</span>
                    )}
                    {selectedTenant.enabledModules.tableManagement && (
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">Tables</span>
                    )}
                    {selectedTenant.enabledModules.management && (
                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">Management</span>
                    )}
                    {selectedTenant.enabledModules.delivery && (
                      <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-medium">Delivery</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Optional Notes */}
              <div className="space-y-2">
                <Label htmlFor="approvalNotes" className="text-gray-700 font-medium">
                  Notes (Optional)
                </Label>
                <Input
                  id="approvalNotes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add any notes about this approval/rejection..."
                  className="bg-white border-gray-300 text-gray-900"
                />
                <p className="text-xs text-gray-500">
                  These notes will be saved in the tenant record for reference
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong className="text-blue-800">Approving</strong> will activate the tenant with a 14-day trial
                  and send them a welcome email. <strong className="text-blue-800">Rejecting</strong> will
                  cancel their signup.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-3 pt-6 border-t-2 border-gray-200">
            <Button
              variant="outline"
              onClick={() => handleApproveTenant(false)}
              className="border-2 border-red-600 text-red-600 hover:bg-red-50 font-semibold px-6 py-5 text-base"
            >
              ❌ Reject
            </Button>
            <Button
              onClick={() => handleApproveTenant(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-8 py-5 text-base shadow-lg"
            >
              ✅ Approve & Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
