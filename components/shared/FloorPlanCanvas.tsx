import React, { useState, useRef, useEffect } from 'react';
import { Table } from '../../types';
import { TableShapeRenderer } from './TableShapeRenderer';

interface FloorPlanCanvasProps {
  tables: Table[];
  canvasWidth: number;
  canvasHeight: number;
  editable: boolean;
  showGrid?: boolean;
  gridSnapping?: boolean;
  selectedTableId?: string; // NEW: For customer view selection highlight
  onTableClick?: (tableId: string) => void;
  onTableDragEnd?: (tableId: string, position: { x: number; y: number }) => void;
}

/**
 * FloorPlanCanvas - SVG-based floor plan rendering component
 *
 * Features:
 * - Renders tables using TableShapeRenderer
 * - Optional grid overlay (dashed lines every 20 units)
 * - Drag-and-drop support when editable=true
 * - Grid snapping logic (round to nearest 20 units)
 * - Touch events for mobile
 * - Merged table connection lines
 * - Responsive viewBox scaling
 * - Selection highlight support for customer view
 *
 * Canvas background: #f9fafb
 * Grid color: #e5e7eb
 */
export const FloorPlanCanvas: React.FC<FloorPlanCanvasProps> = ({
  tables,
  canvasWidth,
  canvasHeight,
  editable,
  showGrid = true,
  gridSnapping = true,
  selectedTableId,
  onTableClick,
  onTableDragEnd
}) => {
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [localTablePositions, setLocalTablePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Initialize local table positions
  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    tables.forEach(table => {
      positions[table.id] = { ...table.position };
    });
    setLocalTablePositions(positions);
  }, [tables]);

  // Grid snapping helper
  const snapToGrid = (value: number, gridSize: number = 20): number => {
    return Math.round(value / gridSize) * gridSize;
  };

  // Convert client coordinates to SVG coordinates
  const clientToSVGCoords = (clientX: number, clientY: number): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // Simple click handler for customer view (non-editable)
  const handleSimpleClick = (tableId: string, event: React.MouseEvent) => {
    if (editable) return; // Only for customer view
    event.preventDefault();
    event.stopPropagation();

    if (onTableClick) {
      onTableClick(tableId);
    }
  };

  // Mouse down handler (start drag)
  const handleMouseDown = (tableId: string, event: React.MouseEvent) => {
    if (!editable) {
      // In customer view, just handle click
      handleSimpleClick(tableId, event);
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const svgCoords = clientToSVGCoords(event.clientX, event.clientY);
    setDraggingTableId(tableId);
    setIsDragging(false); // Reset, will be set to true on first move
    setDragOffset({
      x: svgCoords.x - table.position.x,
      y: svgCoords.y - table.position.y
    });
  };

  // Mouse move handler (dragging)
  const handleMouseMove = (event: React.MouseEvent) => {
    if (!draggingTableId || !editable) return;
    event.preventDefault();

    setIsDragging(true); // Mark as dragging

    const svgCoords = clientToSVGCoords(event.clientX, event.clientY);
    let newX = svgCoords.x - dragOffset.x;
    let newY = svgCoords.y - dragOffset.y;

    // Keep table within canvas bounds
    newX = Math.max(0, Math.min(canvasWidth, newX));
    newY = Math.max(0, Math.min(canvasHeight, newY));

    // Optimistic UI update
    setLocalTablePositions(prev => ({
      ...prev,
      [draggingTableId]: { x: newX, y: newY }
    }));
  };

  // Mouse up handler (end drag)
  const handleMouseUp = (event: React.MouseEvent) => {
    if (!draggingTableId || !editable) return;
    event.preventDefault();

    const currentPosition = localTablePositions[draggingTableId];
    if (!currentPosition) return;

    let finalX = currentPosition.x;
    let finalY = currentPosition.y;

    // Apply grid snapping if enabled
    if (gridSnapping) {
      finalX = snapToGrid(finalX);
      finalY = snapToGrid(finalY);
    }

    // Update local state with snapped position
    setLocalTablePositions(prev => ({
      ...prev,
      [draggingTableId]: { x: finalX, y: finalY }
    }));

    // If it was a drag (not just a click), don't trigger click handler
    if (isDragging) {
      // Call callback to persist to Firestore
      if (onTableDragEnd) {
        onTableDragEnd(draggingTableId, { x: finalX, y: finalY });
      }
    } else {
      // It was a click, not a drag - trigger click handler
      if (onTableClick) {
        onTableClick(draggingTableId);
      }
    }

    setDraggingTableId(null);
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
  };

  // Touch start handler (mobile)
  const handleTouchStart = (tableId: string, event: React.TouchEvent) => {
    if (!editable) {
      // In customer view, just handle tap as click
      event.preventDefault();
      if (onTableClick) {
        onTableClick(tableId);
      }
      return;
    }
    event.preventDefault();

    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const touch = event.touches[0];
    const svgCoords = clientToSVGCoords(touch.clientX, touch.clientY);
    setDraggingTableId(tableId);
    setIsDragging(false); // Reset
    setDragOffset({
      x: svgCoords.x - table.position.x,
      y: svgCoords.y - table.position.y
    });
  };

  // Touch move handler (mobile)
  const handleTouchMove = (event: React.TouchEvent) => {
    if (!draggingTableId || !editable) return;
    event.preventDefault();

    setIsDragging(true); // Mark as dragging

    const touch = event.touches[0];
    const svgCoords = clientToSVGCoords(touch.clientX, touch.clientY);
    let newX = svgCoords.x - dragOffset.x;
    let newY = svgCoords.y - dragOffset.y;

    // Keep table within canvas bounds
    newX = Math.max(0, Math.min(canvasWidth, newX));
    newY = Math.max(0, Math.min(canvasHeight, newY));

    // Optimistic UI update
    setLocalTablePositions(prev => ({
      ...prev,
      [draggingTableId]: { x: newX, y: newY }
    }));
  };

  // Touch end handler (mobile)
  const handleTouchEnd = (event: React.TouchEvent) => {
    if (!draggingTableId || !editable) return;
    event.preventDefault();

    const currentPosition = localTablePositions[draggingTableId];
    if (!currentPosition) return;

    let finalX = currentPosition.x;
    let finalY = currentPosition.y;

    // Apply grid snapping if enabled
    if (gridSnapping) {
      finalX = snapToGrid(finalX);
      finalY = snapToGrid(finalY);
    }

    // Update local state with snapped position
    setLocalTablePositions(prev => ({
      ...prev,
      [draggingTableId]: { x: finalX, y: finalY }
    }));

    // If it was a drag (not just a tap), don't trigger click handler
    if (isDragging) {
      // Call callback to persist to Firestore
      if (onTableDragEnd) {
        onTableDragEnd(draggingTableId, { x: finalX, y: finalY });
      }
    } else {
      // It was a tap, not a drag - trigger click handler
      if (onTableClick) {
        onTableClick(draggingTableId);
      }
    }

    setDraggingTableId(null);
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
  };

  // Render grid overlay
  const renderGrid = () => {
    if (!showGrid) return null;

    const gridSize = 20;
    const verticalLines: React.ReactElement[] = [];
    const horizontalLines: React.ReactElement[] = [];

    // Vertical lines
    for (let x = 0; x <= canvasWidth; x += gridSize) {
      verticalLines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={canvasHeight}
          stroke="#e5e7eb"
          strokeWidth="1"
          strokeDasharray="5,5"
        />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= canvasHeight; y += gridSize) {
      horizontalLines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={canvasWidth}
          y2={y}
          stroke="#e5e7eb"
          strokeWidth="1"
          strokeDasharray="5,5"
        />
      );
    }

    return (
      <g id="grid-overlay">
        {verticalLines}
        {horizontalLines}
      </g>
    );
  };

  // Render merged table connection lines
  const renderConnectionLines = () => {
    const lines: React.ReactElement[] = [];
    const processedPairs = new Set<string>();

    tables.forEach(table => {
      if (table.mergeable.length === 0) return;

      table.mergeable.forEach(mergeableId => {
        // Avoid duplicate lines (only draw A->B, not B->A)
        const pairKey = [table.id, mergeableId].sort().join('-');
        if (processedPairs.has(pairKey)) return;
        processedPairs.add(pairKey);

        const mergedTable = tables.find(t => t.id === mergeableId);
        if (!mergedTable) return;

        // Get current positions (use local positions if dragging)
        const pos1 = localTablePositions[table.id] || table.position;
        const pos2 = localTablePositions[mergeableId] || mergedTable.position;

        // Get status color (same as table status)
        const statusColor = {
          available: '#10b981',
          occupied: '#ef4444',
          reserved: '#f59e0b'
        }[table.status];

        // Find other mergeable table numbers for tooltip
        const otherTableNumbers = table.mergeable
          .map(id => tables.find(t => t.id === id)?.number)
          .filter(Boolean)
          .join(', ');

        lines.push(
          <line
            key={pairKey}
            x1={pos1.x}
            y1={pos1.y}
            x2={pos2.x}
            y2={pos2.y}
            stroke={statusColor}
            strokeWidth="2"
            strokeDasharray="5,5"
            opacity="0.6"
          >
            <title>Merged with Table {otherTableNumbers}</title>
          </line>
        );
      });
    });

    return <g id="connection-lines">{lines}</g>;
  };

  // Get table with current position (local or original)
  const getTableWithPosition = (table: Table): Table => {
    const position = localTablePositions[table.id] || table.position;
    return { ...table, position };
  };

  return (
    <div
      style={{
        width: '100%',
        height: 'auto',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        touchAction: editable ? 'none' : 'auto' // Prevent scroll on mobile when dragging
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{
          display: 'block',
          userSelect: 'none',
          minHeight: '400px',
          maxHeight: '600px',
          height: 'auto'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Grid overlay (rendered first, below everything) */}
        {renderGrid()}

        {/* Connection lines (rendered before tables, so tables appear on top) */}
        {renderConnectionLines()}

        {/* Tables */}
        <g id="tables">
          {tables.map(table => {
            const tableWithPosition = getTableWithPosition(table);
            const isSelected = selectedTableId === table.id;
            return (
              <g
                key={table.id}
                onMouseDown={(e) => handleMouseDown(table.id, e)}
                onTouchStart={(e) => handleTouchStart(table.id, e)}
                style={{ cursor: editable ? 'move' : 'pointer' }}
              >
                <TableShapeRenderer
                  table={tableWithPosition}
                  isSelected={isSelected}
                  onClick={undefined} // Click handled by mouseDown/mouseUp in canvas
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
