import React from 'react';
import { Table } from '../../types';

interface TableShapeRendererProps {
  table: Table;
  isSelected?: boolean;
  onClick?: () => void;
}

/**
 * TableShapeRenderer - SVG rendering component for individual table shapes
 *
 * Renders circle, square, or rectangle tables with appropriate sizes based on capacity.
 * Applies status colors and hover/selected states.
 *
 * Size calculation:
 * - Capacity 1-2: 60px (small)
 * - Capacity 3-4: 80px (medium)
 * - Capacity 5+: 100px (large)
 *
 * Status colors (from TableManager lines 70-72):
 * - Available: #10b981 (green)
 * - Occupied: #ef4444 (red)
 * - Reserved: #f59e0b (orange)
 */
export const TableShapeRenderer: React.FC<TableShapeRendererProps> = ({
  table,
  isSelected = false,
  onClick
}) => {
  // Calculate size based on capacity
  const getTableSize = (capacity: number): number => {
    if (capacity <= 2) return 60; // Small
    if (capacity <= 4) return 80; // Medium
    return 100; // Large (5+)
  };

  // Get status color (reuse existing color scheme from TableManager)
  const getStatusColor = (status: Table['status']): string => {
    const colors = {
      available: '#10b981',
      occupied: '#ef4444',
      reserved: '#f59e0b'
    };
    return colors[status];
  };

  const size = getTableSize(table.capacity);
  const fillColor = getStatusColor(table.status);
  const { x, y } = table.position;

  // Selected/hover state: blue border (#2563eb)
  const strokeColor = isSelected ? '#2563eb' : 'transparent';
  const strokeWidth = isSelected ? 4 : 0;

  // ARIA label for accessibility
  const ariaLabel = `Table ${table.number}, ${table.status}, capacity ${table.capacity}`;

  // Common SVG props with enhanced hover effect
  const commonProps = {
    fill: fillColor,
    stroke: strokeColor,
    strokeWidth: strokeWidth,
    cursor: onClick ? 'pointer' : 'default',
    onClick: onClick,
    'aria-label': ariaLabel,
    role: onClick ? 'button' : undefined,
    tabIndex: onClick ? 0 : undefined,
    style: {
      transition: 'all 0.2s ease',
      filter: isSelected ? 'drop-shadow(0 0 8px rgba(37, 99, 235, 0.5))' : undefined
    },
    onMouseEnter: (e: React.MouseEvent<SVGElement>) => {
      if (onClick && !isSelected) {
        e.currentTarget.style.filter = 'brightness(1.1) drop-shadow(0 2px 4px rgba(0,0,0,0.2))';
      }
    },
    onMouseLeave: (e: React.MouseEvent<SVGElement>) => {
      if (onClick && !isSelected) {
        e.currentTarget.style.filter = '';
      }
    }
  };

  // Render shape based on table.shape
  if (table.shape === 'circle') {
    const radius = size / 2;
    return (
      <g>
        <circle
          cx={x}
          cy={y}
          r={radius}
          {...commonProps}
        />
        {/* Table number label */}
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize="18"
          fontWeight="700"
          pointerEvents="none"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
        >
          {table.number}
        </text>
      </g>
    );
  }

  if (table.shape === 'square') {
    // Square: width === height
    const rectX = x - size / 2;
    const rectY = y - size / 2;
    return (
      <g>
        <rect
          x={rectX}
          y={rectY}
          width={size}
          height={size}
          rx={4} // Slightly rounded corners
          {...commonProps}
        />
        {/* Table number label */}
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize="18"
          fontWeight="700"
          pointerEvents="none"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
        >
          {table.number}
        </text>
      </g>
    );
  }

  if (table.shape === 'rectangle') {
    // Rectangle: width = 1.5 * height
    const width = size * 1.5;
    const height = size;
    const rectX = x - width / 2;
    const rectY = y - height / 2;
    return (
      <g>
        <rect
          x={rectX}
          y={rectY}
          width={width}
          height={height}
          rx={4} // Slightly rounded corners
          {...commonProps}
        />
        {/* Table number label */}
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize="18"
          fontWeight="700"
          pointerEvents="none"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
        >
          {table.number}
        </text>
      </g>
    );
  }

  // Fallback (should never reach here with proper types)
  return null;
};
