import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { SESSION_STORAGE_KEYS } from '../constants/storage';

interface UseSuperAdminRedirectOptions {
  isPublicSignup: boolean;
  isSignupPending: boolean;
  isInvitationSignup: boolean;
  isSelfRegister: boolean;
  isFixUserPage: boolean;
  isMarketingPage: boolean;
}

/**
 * useSuperAdminRedirect Hook
 *
 * Manages auto-redirect logic for super admins:
 * 1. Captures URL parameter ?superAdminViewing=true
 * 2. Stores flag in sessionStorage
 * 3. Auto-redirects super admins to Super Admin Portal unless explicitly viewing a tenant
 *
 * This hook solves the cross-origin localStorage problem by using URL parameters
 * that work across different subdomains (superadmin.localhost vs tenant.localhost).
 */
export const useSuperAdminRedirect = (options: UseSuperAdminRedirectOptions) => {
  const { userRole, loading: authLoading } = useAuth();
  const { isSuperAdminPortal } = useTenant();

  const {
    isPublicSignup,
    isSignupPending,
    isInvitationSignup,
    isSelfRegister,
    isFixUserPage,
    isMarketingPage,
  } = options;

  // Effect 1: Capture URL parameter and store in sessionStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const superAdminViewing = urlParams.get('superAdminViewing');

    if (superAdminViewing === 'true') {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Detected superAdminViewing URL parameter - storing in sessionStorage');
      }
      sessionStorage.setItem(SESSION_STORAGE_KEYS.SUPER_ADMIN_VIEWING, 'true');

      // Clean the URL by removing the parameter
      urlParams.delete('superAdminViewing');
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, '', newUrl);

      if (process.env.NODE_ENV === 'development') {
        console.log('🧹 Cleaned URL parameter, sessionStorage flag set');
      }
    }
  }, []);

  // Effect 2: Handle redirect logic
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Super Admin Redirect Effect Running:', {
        authLoading,
        userRole,
        isSuperAdminPortal,
        hostname: window.location.hostname,
      });
    }

    // Only redirect if user is loaded and is a super admin
    if (!authLoading && userRole === 'super-admin' && !isSuperAdminPortal) {
      // Don't redirect if on special pages
      if (
        isPublicSignup ||
        isSignupPending ||
        isInvitationSignup ||
        isSelfRegister ||
        isFixUserPage ||
        isMarketingPage
      ) {
        if (process.env.NODE_ENV === 'development') {
          console.log('⏭️  Skipping redirect - on special page');
        }
        return;
      }

      // Check if super admin is explicitly viewing this tenant via sessionStorage flag
      const viewingFlag = sessionStorage.getItem(SESSION_STORAGE_KEYS.SUPER_ADMIN_VIEWING);

      if (process.env.NODE_ENV === 'development') {
        console.log('📦 sessionStorage flag:', viewingFlag);
      }

      if (viewingFlag === 'true') {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Super admin explicitly viewing tenant - SKIPPING REDIRECT');
        }
        return; // Don't redirect
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ No sessionStorage flag - will redirect to super admin portal');
        }
      }

      // Redirect to super admin portal
      // Extract base domain dynamically (e.g., "localhost", "orderflow.app", etc.)
      const currentHostname = window.location.hostname;
      const parts = currentHostname.split('.');
      const baseDomain = parts.slice(1).join('.') || 'localhost'; // Remove subdomain, fallback to localhost

      const port = window.location.port;
      const portStr = port ? ':' + port : '';
      const superAdminUrl = `${window.location.protocol}//superadmin.${baseDomain}${portStr}`;

      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Redirecting super admin to Super Admin Portal:', superAdminUrl);
      }
      window.location.href = superAdminUrl;
    }
  }, [
    authLoading,
    userRole,
    isSuperAdminPortal,
    isPublicSignup,
    isSignupPending,
    isInvitationSignup,
    isSelfRegister,
    isFixUserPage,
    isMarketingPage,
  ]);
};
