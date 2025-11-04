import React from 'react';
import { useVertical, useTerminology } from '../../contexts/VerticalContext';
import { useTenant } from '../../../contexts/TenantContext';

/**
 * Vertical System Test Component
 *
 * Temporary component to verify vertical system is working correctly.
 *
 * Usage:
 * 1. Import in AdminPanel.tsx:
 *    import { VerticalSystemTest } from './test/VerticalSystemTest';
 *
 * 2. Add to render (temporarily):
 *    <VerticalSystemTest />
 *
 * 3. Navigate to Admin Panel and verify output
 *
 * 4. Remove after testing
 */
export const VerticalSystemTest: React.FC = () => {
  const { tenant } = useTenant();
  const { config, features, isVertical, hasFeature } = useVertical();
  const terminology = useTerminology();

  const styles = {
    container: {
      padding: '20px',
      margin: '20px',
      background: '#f8f9fa',
      border: '2px solid #dee2e6',
      borderRadius: '8px',
      fontFamily: 'monospace',
    },
    section: {
      marginBottom: '20px',
      paddingBottom: '15px',
      borderBottom: '1px solid #dee2e6',
    },
    heading: {
      margin: '0 0 10px 0',
      color: '#495057',
      fontSize: '16px',
      fontWeight: 'bold',
    },
    list: {
      listStyle: 'none',
      padding: '0',
      margin: '0',
    },
    listItem: {
      padding: '4px 0',
      fontSize: '14px',
    },
    label: {
      fontWeight: 'bold',
      color: '#6c757d',
      minWidth: '180px',
      display: 'inline-block',
    },
    value: {
      color: '#212529',
    },
    badge: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold',
      marginLeft: '8px',
    },
    success: {
      background: '#d4edda',
      color: '#155724',
    },
    danger: {
      background: '#f8d7da',
      color: '#721c24',
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={{ margin: '0 0 20px 0', color: '#212529' }}>
        🧪 Vertical System Test
      </h2>

      {/* Tenant Info */}
      <div style={styles.section}>
        <h3 style={styles.heading}>Tenant Information</h3>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            <span style={styles.label}>Tenant ID:</span>
            <span style={styles.value}>{tenant?.id || 'N/A'}</span>
          </li>
          <li style={styles.listItem}>
            <span style={styles.label}>Business Name:</span>
            <span style={styles.value}>{tenant?.businessName || 'N/A'}</span>
          </li>
          <li style={styles.listItem}>
            <span style={styles.label}>Vertical Type:</span>
            <span style={styles.value}>{tenant?.verticalType || 'N/A'}</span>
            {tenant?.verticalType && (
              <span style={{ ...styles.badge, ...styles.success }}>
                ✓ Set
              </span>
            )}
          </li>
        </ul>
      </div>

      {/* Vertical Configuration */}
      <div style={styles.section}>
        <h3 style={styles.heading}>Vertical Configuration</h3>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            <span style={styles.label}>Vertical ID:</span>
            <span style={styles.value}>{config.id}</span>
          </li>
          <li style={styles.listItem}>
            <span style={styles.label}>Vertical Name:</span>
            <span style={styles.value}>{config.name}</span>
          </li>
          <li style={styles.listItem}>
            <span style={styles.label}>Description:</span>
            <span style={styles.value}>{config.description}</span>
          </li>
        </ul>
      </div>

      {/* Terminology */}
      <div style={styles.section}>
        <h3 style={styles.heading}>Terminology</h3>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            <span style={styles.label}>Item (singular):</span>
            <span style={styles.value}>{terminology.item}</span>
          </li>
          <li style={styles.listItem}>
            <span style={styles.label}>Item (plural):</span>
            <span style={styles.value}>{terminology.itemPlural}</span>
          </li>
          <li style={styles.listItem}>
            <span style={styles.label}>Item Group:</span>
            <span style={styles.value}>{terminology.itemGroup}</span>
          </li>
          <li style={styles.listItem}>
            <span style={styles.label}>Transaction:</span>
            <span style={styles.value}>{terminology.transaction}</span>
          </li>
          <li style={styles.listItem}>
            <span style={styles.label}>Location:</span>
            <span style={styles.value}>{terminology.location}</span>
          </li>
          <li style={styles.listItem}>
            <span style={styles.label}>Staff:</span>
            <span style={styles.value}>{terminology.staff}</span>
          </li>
        </ul>
      </div>

      {/* Vertical Type Checks */}
      <div style={styles.section}>
        <h3 style={styles.heading}>Vertical Type Checks</h3>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            <span style={styles.label}>Is Restaurant:</span>
            <span style={styles.value}>
              {isVertical('restaurant') ? 'Yes' : 'No'}
            </span>
            {isVertical('restaurant') && (
              <span style={{ ...styles.badge, ...styles.success }}>✓</span>
            )}
          </li>
          <li style={styles.listItem}>
            <span style={styles.label}>Is Auto Shop:</span>
            <span style={styles.value}>
              {isVertical('auto-shop') ? 'Yes' : 'No'}
            </span>
            {!isVertical('auto-shop') && (
              <span style={{ ...styles.badge, ...styles.danger }}>✗</span>
            )}
          </li>
          <li style={styles.listItem}>
            <span style={styles.label}>Is Salon:</span>
            <span style={styles.value}>
              {isVertical('salon') ? 'Yes' : 'No'}
            </span>
          </li>
          <li style={styles.listItem}>
            <span style={styles.label}>Is Hotel:</span>
            <span style={styles.value}>
              {isVertical('hotel') ? 'Yes' : 'No'}
            </span>
          </li>
          <li style={styles.listItem}>
            <span style={styles.label}>Is Retail:</span>
            <span style={styles.value}>
              {isVertical('retail') ? 'Yes' : 'No'}
            </span>
          </li>
        </ul>
      </div>

      {/* Feature Flags */}
      <div style={styles.section}>
        <h3 style={styles.heading}>Feature Flags</h3>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            <span style={styles.label}>Has Inventory:</span>
            <span style={styles.value}>
              {hasFeature('hasInventory') ? 'Enabled' : 'Disabled'}
            </span>
            {hasFeature('hasInventory') && (
              <span style={{ ...styles.badge, ...styles.success }}>✓</span>
            )}
          </li>
          <li style={styles.listItem}>
            <span style={styles.label}>Has Table Management:</span>
            <span style={styles.value}>
              {hasFeature('hasTableManagement') ? 'Enabled' : 'Disabled'}
            </span>
            {hasFeature('hasTableManagement') && (
              <span style={{ ...styles.badge, ...styles.success }}>✓</span>
            )}
          </li>
          <li style={styles.listItem}>
            <span style={styles.label}>Has Scheduling:</span>
            <span style={styles.value}>
              {hasFeature('hasScheduling') ? 'Enabled' : 'Disabled'}
            </span>
            {hasFeature('hasScheduling') && (
              <span style={{ ...styles.badge, ...styles.success }}>✓</span>
            )}
          </li>
          <li style={styles.listItem}>
            <span style={styles.label}>Allows Tipping:</span>
            <span style={styles.value}>
              {hasFeature('allowsTipping') ? 'Enabled' : 'Disabled'}
            </span>
            {hasFeature('allowsTipping') && (
              <span style={{ ...styles.badge, ...styles.success }}>✓</span>
            )}
          </li>
          <li style={styles.listItem}>
            <span style={styles.label}>Has Inspections:</span>
            <span style={styles.value}>
              {hasFeature('hasInspections') ? 'Enabled' : 'Disabled'}
            </span>
          </li>
          <li style={styles.listItem}>
            <span style={styles.label}>Has Kitchen Display:</span>
            <span style={styles.value}>
              {hasFeature('hasKitchenDisplay') ? 'Enabled' : 'Disabled'}
            </span>
          </li>
        </ul>
      </div>

      {/* Collection Mappings */}
      <div style={styles.section}>
        <h3 style={styles.heading}>Collection Mappings</h3>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            <span style={styles.label}>Items Collection:</span>
            <span style={styles.value}>
              {config.collections?.items || 'items (default)'}
            </span>
          </li>
          <li style={styles.listItem}>
            <span style={styles.label}>Item Groups Collection:</span>
            <span style={styles.value}>
              {config.collections?.itemGroups || 'categories (default)'}
            </span>
          </li>
          <li style={styles.listItem}>
            <span style={styles.label}>Transactions Collection:</span>
            <span style={styles.value}>
              {config.collections?.transactions || 'orders (default)'}
            </span>
          </li>
          <li style={styles.listItem}>
            <span style={styles.label}>Locations Collection:</span>
            <span style={styles.value}>
              {config.collections?.locations || 'tables (default)'}
            </span>
          </li>
        </ul>
      </div>

      {/* Test Results Summary */}
      <div style={{ marginTop: '20px', padding: '15px', background: '#d4edda', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#155724', fontSize: '16px' }}>
          ✅ Test Results
        </h3>
        <ul style={styles.list}>
          <li style={{ ...styles.listItem, color: '#155724' }}>
            ✓ VerticalContext loaded successfully
          </li>
          <li style={{ ...styles.listItem, color: '#155724' }}>
            ✓ Terminology available: {terminology.item}, {terminology.itemPlural}
          </li>
          <li style={{ ...styles.listItem, color: '#155724' }}>
            ✓ Features configured: {Object.keys(features).length} features
          </li>
          <li style={{ ...styles.listItem, color: '#155724' }}>
            ✓ Vertical type: {config.id}
          </li>
        </ul>
      </div>

      <p style={{ marginTop: '15px', fontSize: '12px', color: '#6c757d', fontStyle: 'italic' }}>
        💡 This component can be removed after testing. See{' '}
        <a href="/docs/TESTING_VERTICAL_SYSTEM.md" style={{ color: '#007bff' }}>
          TESTING_VERTICAL_SYSTEM.md
        </a>{' '}
        for full testing guide.
      </p>
    </div>
  );
};
