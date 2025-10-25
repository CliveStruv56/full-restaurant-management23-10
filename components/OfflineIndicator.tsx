import React, { useState, useEffect } from 'react';
import { setupOnlineListeners, isOnline } from '../firebase/offlineCache';

/**
 * OfflineIndicator Component
 *
 * Displays a visual indicator when the device goes offline.
 * Uses browser's online/offline events to detect connectivity changes.
 */
export const OfflineIndicator: React.FC = () => {
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    // Set up listeners for online/offline events
    const cleanup = setupOnlineListeners(
      () => {
        console.log('📶 Connection restored');
        setOnline(true);
      },
      () => {
        console.log('📵 Connection lost - running in offline mode');
        setOnline(false);
      }
    );

    // Cleanup listeners on unmount
    return cleanup;
  }, []);

  // Don't render anything when online
  if (online) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.indicator}>
        <div style={styles.iconContainer}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="1" y1="1" x2="23" y2="23"></line>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
            <line x1="12" y1="20" x2="12.01" y2="20"></line>
          </svg>
        </div>
        <div style={styles.content}>
          <div style={styles.title}>Offline Mode</div>
          <div style={styles.message}>
            You're working offline. Changes will sync when connection is restored.
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 9999,
    animation: 'slideUp 0.3s ease-out',
  },
  indicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#1f2937',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    maxWidth: '400px',
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    backgroundColor: '#374151',
    borderRadius: '8px',
    flexShrink: 0,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  title: {
    fontWeight: 600,
    fontSize: '14px',
  },
  message: {
    fontSize: '12px',
    color: '#d1d5db',
    lineHeight: '1.4',
  },
};

// Add keyframe animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideUp {
    from {
      transform: translateX(-50%) translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(styleSheet);
