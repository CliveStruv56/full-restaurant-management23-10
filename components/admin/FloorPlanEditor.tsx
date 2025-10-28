import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Table, AppSettings } from '../../types';
import { styles } from '../../styles';
import { useTenant } from '../../contexts/TenantContext';
import { streamTables, updateTable } from '../../firebase/api-multitenant';
import { FloorPlanCanvas } from '../shared/FloorPlanCanvas';

interface FloorPlanEditorProps {
  settings: AppSettings;
  onEditTable?: (table: Table) => void;
}

/**
 * FloorPlanEditor - Admin drag-and-drop floor plan editor
 *
 * Features:
 * - Real-time table data via streamTables()
 * - Drag-and-drop table positioning (editable=true)
 * - Grid snapping toggle (default: enabled)
 * - Canvas dimension display
 * - Toast notifications for save success/failure
 * - Loading state while initializing
 * - Double-click to edit table properties (opens TableForm modal)
 * - Touch support for mobile admin (handled in FloorPlanCanvas)
 *
 * Integration:
 * - Uses useTenant() for tenantId context
 * - Uses streamTables() for real-time sync
 * - Uses updateTable() to persist position changes
 * - Integrates with TableForm modal via onEditTable callback
 */
export const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({ settings, onEditTable }) => {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [gridSnapping, setGridSnapping] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [lastClickedTableId, setLastClickedTableId] = useState<string | null>(null);

  // Get canvas dimensions from settings (with defaults)
  const canvasWidth = settings.floorPlanCanvas?.width || 800;
  const canvasHeight = settings.floorPlanCanvas?.height || 600;

  // Real-time table data stream
  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    const unsubscribe = streamTables(tenantId, (streamedTables) => {
      setTables(streamedTables);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [tenantId]);

  // Handle drag end - persist position to Firestore
  const handleTableDragEnd = async (tableId: string, newPosition: { x: number; y: number }) => {
    if (!tenantId) {
      toast.error('Unable to save: Tenant not loaded');
      return;
    }

    const table = tables.find(t => t.id === tableId);
    if (!table) {
      toast.error('Table not found');
      return;
    }

    // Optimistic update already happened in FloorPlanCanvas
    // Now persist to Firestore
    const updatedTable: Table = {
      ...table,
      position: newPosition
    };

    try {
      await updateTable(tenantId, updatedTable);
      // Success toast is subtle - only show on error to reduce noise
    } catch (error) {
      console.error('Error updating table position:', error);
      toast.error('Failed to save table position. Please try again.');

      // Revert optimistic update by triggering re-fetch
      // streamTables will automatically restore previous position
    }
  };

  // Handle table click - detect double-click for edit
  const handleTableClick = (tableId: string) => {
    const currentTime = Date.now();
    const doubleClickThreshold = 300; // milliseconds

    if (
      lastClickedTableId === tableId &&
      currentTime - lastClickTime < doubleClickThreshold
    ) {
      // Double-click detected - open edit modal
      const table = tables.find(t => t.id === tableId);
      if (table && onEditTable) {
        onEditTable(table);
      }
    } else {
      // Single click - just select
      setSelectedTableId(tableId);
    }

    setLastClickTime(currentTime);
    setLastClickedTableId(tableId);
  };

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 20px',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#6b7280', margin: 0 }}>Loading floor plan...</p>
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

  // Empty state
  if (tables.length === 0) {
    return (
      <div style={{
        padding: '60px 20px',
        textAlign: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ color: '#374151', marginBottom: '12px' }}>No Tables Configured</h3>
        <p style={{ color: '#6b7280', marginBottom: '0' }}>
          Add tables in the List View to see them on the floor plan.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Controls Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '16px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        {/* Canvas Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '14px', color: '#374151' }}>
            <strong>Canvas:</strong> {canvasWidth} x {canvasHeight}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            {tables.length} {tables.length === 1 ? 'table' : 'tables'}
          </div>
        </div>

        {/* Toggle Controls */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* Grid Snapping Toggle */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#374151',
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={gridSnapping}
              onChange={(e) => setGridSnapping(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Grid Snapping</span>
          </label>

          {/* Show Grid Toggle */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#374151',
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Show Grid</span>
          </label>
        </div>
      </div>

      {/* Help Text */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#eff6ff',
        borderRadius: '8px',
        border: '1px solid #bfdbfe',
        fontSize: '14px',
        color: '#1e40af'
      }}>
        <strong>Tip:</strong> Drag tables to reposition them. Double-click a table to edit its properties. {gridSnapping ? 'Grid snapping is enabled (20px grid).' : 'Grid snapping is disabled (free positioning).'} Changes save automatically.
      </div>

      {/* Floor Plan Canvas */}
      <FloorPlanCanvas
        tables={tables}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        editable={true}
        showGrid={showGrid}
        gridSnapping={gridSnapping}
        onTableDragEnd={handleTableDragEnd}
        onTableClick={handleTableClick}
      />

      {/* Footer Info */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        fontSize: '13px',
        color: '#6b7280',
        textAlign: 'center'
      }}>
        Real-time sync enabled. Changes appear instantly across all admin sessions.
      </div>
    </div>
  );
};
