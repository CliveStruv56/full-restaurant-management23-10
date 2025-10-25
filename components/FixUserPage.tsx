import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Emergency Fix Page - Add TenantId to User
 *
 * This page allows the logged-in user to add tenantId to their document.
 * Navigate to /fix-user to access this page.
 */
export const FixUserPage: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Auto-check on mount if user already has tenantId
  React.useEffect(() => {
    const checkUserTenantId = async () => {
      if (!user) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.tenantId) {
            setStatus(`✅ User already has tenantId: ${userData.tenantId}\n\nYou can close this page. If you were redirected here, please refresh the browser.`);
          }
        }
      } catch (error) {
        console.error('Error checking tenantId:', error);
      }
    };

    checkUserTenantId();
  }, [user]);

  const fixUser = async () => {
    if (!user) {
      setStatus('❌ No user logged in');
      return;
    }

    setLoading(true);
    setStatus('🔄 Updating user document...');

    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setStatus('❌ User document not found');
        setLoading(false);
        return;
      }

      const userData = userSnap.data();

      if (userData.tenantId) {
        setStatus(`✅ User already has tenantId: ${userData.tenantId}\n\nRefreshing page...`);
        setLoading(false);
        // Refresh page after 2 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }

      // Update with tenantId
      await updateDoc(userRef, {
        tenantId: 'demo-tenant'
      });

      setStatus('✅ Successfully added tenantId! Refreshing page...');

      // Refresh page after 2 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (error: any) {
      console.error('Fix failed:', error);
      setStatus(`❌ Update failed: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🔧 Fix User TenantId</h1>

      {user ? (
        <div>
          <p><strong>Current User:</strong> {user.email}</p>
          <p><strong>UID:</strong> {user.uid}</p>
          <p><strong>Current TenantId:</strong> {user.tenantId || 'MISSING'}</p>

          <button
            onClick={fixUser}
            disabled={loading}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: loading ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Updating...' : 'Add TenantId'}
          </button>

          {status && (
            <div style={{
              marginTop: '20px',
              padding: '10px',
              backgroundColor: '#f0f0f0',
              borderRadius: '4px',
              whiteSpace: 'pre-wrap'
            }}>
              {status}
            </div>
          )}
        </div>
      ) : (
        <p>Please log in first.</p>
      )}
    </div>
  );
};
