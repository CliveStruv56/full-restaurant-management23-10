import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Table, AppSettings } from '../../types';
import { FloorPlanCanvas } from '../shared/FloorPlanCanvas';
import { useTenant } from '../../contexts/TenantContext';
import { streamTables, checkTableAvailability } from '../../firebase/api-multitenant';

interface FloorPlanDisplayProps {
  onTableSelect: (tableNumber: number) => void;
  settings: AppSettings;
  showAllStatuses?: boolean; // If true, show occupied tables too (for staff view)
  filterByDateTime?: {
    date: string;      // YYYY-MM-DD
    time: string;      // HH:mm
    duration: number;  // minutes
    partySize: number;
  };
}

/**
 * FloorPlanDisplay - Customer-facing read-only floor plan view
 *
 * Features:
 * - Read-only floor plan (editable=false)
 * - Real-time table status updates
 * - Visual table selection with blue highlight
 * - Legend showing color meanings
 * - Mobile responsive
 * - Filters to show only available/reserved tables by default
 * - Date/time filtering to show only available tables for specific reservation
 * - Confirm button to pass tableNumber to parent
 */
export const FloorPlanDisplay: React.FC<FloorPlanDisplayProps> = ({
  onTableSelect,
  settings,
  showAllStatuses = false,
  filterByDateTime
}) => {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tableAvailability, setTableAvailability] = useState<Map<string, boolean>>(new Map());
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Real-time table updates via streamTables
  useEffect(() => {
    if (!tenantId) return;

    const unsubscribe = streamTables(tenantId, (updatedTables) => {
      setTables(updatedTables);
      setIsLoading(false);

      // Auto-deselect if selected table becomes occupied
      if (selectedTableId) {
        const selectedTable = updatedTables.find(t => t.id === selectedTableId);
        if (selectedTable && selectedTable.status === 'occupied') {
          setSelectedTableId(null);
          toast.error('Selected table is no longer available', {
            icon: '⚠️',
            duration: 3000
          });
        }
      }
    });

    return () => unsubscribe();
  }, [tenantId, selectedTableId]);

  // Check availability for all tables when date/time changes
  useEffect(() => {
    if (!tenantId || !filterByDateTime || tables.length === 0) {
      setTableAvailability(new Map());
      setIsCheckingAvailability(false);
      return;
    }

    const checkAvailability = async () => {
      setIsCheckingAvailability(true);
      const availabilityMap = new Map<string, boolean>();

      try {
        // Check availability for each table
        await Promise.all(
          tables.map(async (table) => {
            // Filter by party size capacity first
            if (table.capacity < filterByDateTime.partySize) {
              availabilityMap.set(table.id, false);
              return;
            }

            const isAvailable = await checkTableAvailability(
              tenantId,
              table.id,
              filterByDateTime.date,
              filterByDateTime.time,
              filterByDateTime.duration
            );
            availabilityMap.set(table.id, isAvailable);
          })
        );

        setTableAvailability(availabilityMap);
      } catch (error) {
        console.error('Error checking table availability:', error);
        toast.error('Failed to check table availability', {
          icon: '❌',
          duration: 3000
        });
        // Fall back to showing all tables
        setTableAvailability(new Map());
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    checkAvailability();
  }, [tenantId, filterByDateTime, tables]);

  // Filter tables based on showAllStatuses and availability
  const visibleTables = React.useMemo(() => {
    let filtered = showAllStatuses
      ? tables
      : tables.filter(t => t.status === 'available' || t.status === 'reserved');

    // If date/time filtering is enabled, further filter by availability
    if (filterByDateTime && tableAvailability.size > 0) {
      filtered = filtered.filter(t => {
        const isAvailable = tableAvailability.get(t.id);
        return isAvailable === true;
      });
    }

    return filtered;
  }, [tables, showAllStatuses, filterByDateTime, tableAvailability]);

  // Handle table click
  const handleTableClick = (tableId: string) => {
    // Toggle selection
    if (selectedTableId === tableId) {
      setSelectedTableId(null);
    } else {
      // Check if table is available
      const table = tables.find(t => t.id === tableId);

      // If date/time filtering is active, check availability
      if (filterByDateTime && tableAvailability.size > 0) {
        const isAvailable = tableAvailability.get(tableId);
        if (!isAvailable) {
          toast.error('This table is not available for the selected time', { icon: '🚫' });
          return;
        }
      }

      if (table && table.status === 'available') {
        setSelectedTableId(tableId);
      } else if (table && table.status === 'reserved') {
        toast.error('This table is reserved', { icon: '🔒' });
      } else if (table && table.status === 'occupied') {
        toast.error('This table is currently occupied', { icon: '🚫' });
      }
    }
  };

  // Handle confirm selection
  const handleConfirmSelection = () => {
    if (!selectedTableId) return;

    const selectedTable = tables.find(t => t.id === selectedTableId);
    if (!selectedTable) return;

    onTableSelect(selectedTable.number);
  };

  // Get selected table details
  const selectedTable = selectedTableId
    ? tables.find(t => t.id === selectedTableId)
    : null;

  // Canvas dimensions from settings
  const canvasWidth = settings.floorPlanCanvas?.width || 800;
  const canvasHeight = settings.floorPlanCanvas?.height || 600;

  // Count available tables
  const availableTablesCount = visibleTables.length;

  // Loading state
  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSkeleton}>
          <div style={styles.skeletonPulse}></div>
          <p style={styles.loadingText}>Loading floor plan...</p>
        </div>
      </div>
    );
  }

  // Checking availability state
  if (isCheckingAvailability) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSkeleton}>
          <div style={styles.skeletonPulse}></div>
          <p style={styles.loadingText}>Checking table availability...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (visibleTables.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.emptyStateIcon}>🪑</p>
        {filterByDateTime ? (
          <>
            <p style={styles.emptyStateText}>No tables available for this time</p>
            <p style={styles.emptyStateSubtext}>
              Try selecting a different date or time for your reservation
            </p>
          </>
        ) : (
          <>
            <p style={styles.emptyStateText}>No tables available at the moment</p>
            <p style={styles.emptyStateSubtext}>Please check back later or contact staff</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.heading}>Select Your Table</h3>
        <p style={styles.subtitle}>👆 Click or tap any green table to select it</p>
        {filterByDateTime && (
          <div style={styles.filterIndicator}>
            <span style={styles.filterIcon}>📅</span>
            <span style={styles.filterText}>
              Showing {availableTablesCount} table{availableTablesCount !== 1 ? 's' : ''} available for{' '}
              {new Date(filterByDateTime.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })} at {filterByDateTime.time}
            </span>
          </div>
        )}
      </div>

      {/* Legend - Moved to top for better visibility */}
      <div style={styles.legendTop}>
        <div style={styles.legendItems}>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, backgroundColor: '#10b981' }}></div>
            <span style={styles.legendLabel}>Available</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, backgroundColor: '#f59e0b' }}></div>
            <span style={styles.legendLabel}>Reserved</span>
          </div>
          {showAllStatuses && (
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendColor, backgroundColor: '#ef4444' }}></div>
              <span style={styles.legendLabel}>Occupied</span>
            </div>
          )}
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, backgroundColor: '#fff', border: '3px solid #2563eb' }}></div>
            <span style={styles.legendLabel}>Your Selection</span>
          </div>
        </div>
      </div>

      {/* Floor Plan Canvas */}
      <div style={styles.canvasContainer}>
        <FloorPlanCanvas
          tables={visibleTables}
          selectedTableId={selectedTableId}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          editable={false}
          showGrid={false}
          gridSnapping={false}
          onTableClick={handleTableClick}
        />

        {/* Selected table highlight overlay (rendered on top of canvas) */}
        {selectedTableId && (
          <div style={styles.selectionOverlay}>
            {/* This is handled by FloorPlanCanvas's click state */}
          </div>
        )}
      </div>
      {/* Selected Table Details */}
      <AnimatePresence>
        {selectedTable && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            style={styles.selectedTableCard}
          >
            <div style={styles.selectedTableInfo}>
              <div style={styles.selectedTableIcon}>✓</div>
              <div>
                <p style={styles.selectedTableTitle}>Selected Table</p>
                <p style={styles.selectedTableDetails}>
                  Table {selectedTable.number}, Capacity {selectedTable.capacity}
                </p>
                {selectedTable.description && (
                  <p style={styles.selectedTableDescription}>
                    {selectedTable.description}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleConfirmSelection}
              style={styles.confirmButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
            >
              Confirm Selection
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: '#f9fafb',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  header: {
    textAlign: 'center',
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  heading: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
    fontWeight: '500',
  },
  filterIndicator: {
    marginTop: '12px',
    padding: '10px 12px',
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    border: '1px solid #bfdbfe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  filterIcon: {
    fontSize: '16px',
  },
  filterText: {
    fontSize: '14px',
    color: '#1e40af',
    fontWeight: '600',
  },
  legendTop: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '12px 16px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  canvasContainer: {
    position: 'relative',
    width: '100%',
    maxHeight: '400px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    overflow: 'auto',
    padding: '12px',
  },
  selectionOverlay: {
    // Placeholder - selection handled by canvas
  },
  selectedTableCard: {
    backgroundColor: '#eff6ff',
    borderRadius: '12px',
    padding: '16px',
    border: '2px solid #2563eb',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
  },
  selectedTableInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  selectedTableIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  selectedTableTitle: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '0 0 3px 0',
    fontWeight: '500',
  },
  selectedTableDetails: {
    fontSize: '16px',
    color: '#1f2937',
    margin: 0,
    fontWeight: '600',
  },
  selectedTableDescription: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '3px 0 0 0',
    fontStyle: 'italic',
  },
  confirmButton: {
    padding: '12px 20px',
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    width: '100%',
  },
  legendItems: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 6px',
    borderRadius: '6px',
    backgroundColor: '#f9fafb',
  },
  legendColor: {
    width: '20px',
    height: '20px',
    borderRadius: '6px',
    flexShrink: 0,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  },
  legendLabel: {
    fontSize: '13px',
    color: '#374151',
    fontWeight: '500',
  },
  loadingContainer: {
    width: '100%',
    padding: '40px 16px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  loadingSkeleton: {
    textAlign: 'center',
  },
  skeletonPulse: {
    width: '180px',
    height: '180px',
    margin: '0 auto 16px',
    borderRadius: '16px',
    backgroundColor: '#e5e7eb',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },
  loadingText: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
    fontWeight: '500',
  },
  emptyState: {
    textAlign: 'center',
    padding: '50px 16px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  emptyStateIcon: {
    fontSize: '56px',
    margin: '0 0 16px 0',
  },
  emptyStateText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 10px 0',
  },
  emptyStateSubtext: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
};

// Mobile responsive styles (applied via media queries in global CSS or inline)
// For widths < 768px:
// - Stack layout vertically
// - Increase touch target sizes
// - Reduce padding

// Add pulse animation keyframes
const styleSheet = document.styleSheets[0];
try {
  styleSheet.insertRule(`
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  `, styleSheet.cssRules.length);
} catch (e) {
  // Animation already exists or can't be added
}
