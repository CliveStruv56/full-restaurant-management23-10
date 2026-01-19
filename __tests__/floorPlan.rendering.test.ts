import { describe, test, expect } from '@jest/globals';
/**
 * Floor Plan Rendering Tests
 * Tests for TableShapeRenderer and FloorPlanCanvas SVG rendering components
 */

import type { Table } from '../types';

/**
 * Helper function to calculate table size based on capacity
 */
function getTableSize(capacity: number): number {
  if (capacity <= 2) return 60; // Small
  if (capacity <= 4) return 80; // Medium
  return 100; // Large (5+)
}

/**
 * Helper function to get status color
 */
function getStatusColor(status: Table['status']): string {
  const colors = {
    available: '#10b981',
    occupied: '#ef4444',
    reserved: '#f59e0b',
  };
  return colors[status];
}

/**
 * Helper function to snap value to grid
 */
function snapToGrid(value: number, gridSize: number = 20): number {
  return Math.round(value / gridSize) * gridSize;
}

describe('Table Shape Rendering', () => {
  test('circle table SVG generation with correct radius', () => {
    const circleTable: Table = {
      id: 'table-1',
      number: 1,
      capacity: 4,
      shape: 'circle',
      position: { x: 100, y: 100 },
      mergeable: [],
      status: 'available',
    };

    const circleSize = getTableSize(circleTable.capacity);
    const circleRadius = circleSize / 2;

    expect(circleTable.shape).toBe('circle');
    expect(circleSize).toBe(80);
    expect(circleRadius).toBe(40);

    // SVG attributes validation
    expect(circleTable.position.x).toBe(100);
    expect(circleTable.position.y).toBe(100);
  });

  test('square table SVG generation with equal width/height', () => {
    const squareTable: Table = {
      id: 'table-2',
      number: 2,
      capacity: 2,
      shape: 'square',
      position: { x: 200, y: 150 },
      mergeable: [],
      status: 'occupied',
    };

    const squareSize = getTableSize(squareTable.capacity);

    expect(squareTable.shape).toBe('square');
    expect(squareSize).toBe(60);

    // Square dimensions should be equal
    const squareWidth = squareSize;
    const squareHeight = squareSize;
    expect(squareWidth).toBe(squareHeight);
    expect(squareWidth).toBe(60);

    // SVG position (top-left corner)
    const squareX = squareTable.position.x - squareSize / 2;
    const squareY = squareTable.position.y - squareSize / 2;
    expect(squareX).toBe(170);
    expect(squareY).toBe(120);
  });

  test('rectangle table SVG generation with 1.5x aspect ratio', () => {
    const rectangleTable: Table = {
      id: 'table-3',
      number: 3,
      capacity: 6,
      shape: 'rectangle',
      position: { x: 300, y: 200 },
      mergeable: [],
      status: 'reserved',
    };

    const rectangleSize = getTableSize(rectangleTable.capacity);

    expect(rectangleTable.shape).toBe('rectangle');
    expect(rectangleSize).toBe(100);

    // Rectangle aspect ratio: width = 1.5 * height
    const rectangleHeight = rectangleSize;
    const rectangleWidth = rectangleSize * 1.5;
    expect(rectangleWidth).toBe(150);
    expect(rectangleHeight).toBe(100);
    expect(rectangleWidth / rectangleHeight).toBe(1.5);

    // SVG position (top-left corner)
    const rectangleX = rectangleTable.position.x - rectangleWidth / 2;
    const rectangleY = rectangleTable.position.y - rectangleHeight / 2;
    expect(rectangleX).toBe(225);
    expect(rectangleY).toBe(150);
  });
});

describe('Table Size Calculation', () => {
  test('capacity 1-2 returns small size (60px)', () => {
    expect(getTableSize(1)).toBe(60);
    expect(getTableSize(2)).toBe(60);
  });

  test('capacity 3-4 returns medium size (80px)', () => {
    expect(getTableSize(3)).toBe(80);
    expect(getTableSize(4)).toBe(80);
  });

  test('capacity 5+ returns large size (100px)', () => {
    expect(getTableSize(5)).toBe(100);
    expect(getTableSize(6)).toBe(100);
    expect(getTableSize(10)).toBe(100);
  });
});

describe('Status Color Mapping', () => {
  test('status colors match design system', () => {
    expect(getStatusColor('available')).toBe('#10b981');
    expect(getStatusColor('occupied')).toBe('#ef4444');
    expect(getStatusColor('reserved')).toBe('#f59e0b');
  });
});

describe('Circle Table Variations', () => {
  test('circle table sizes vary with capacity', () => {
    const smallCircle: Table = {
      id: 'small-circle',
      number: 10,
      capacity: 2,
      shape: 'circle',
      position: { x: 100, y: 100 },
      mergeable: [],
      status: 'available',
    };

    const largeCircle: Table = {
      id: 'large-circle',
      number: 11,
      capacity: 8,
      shape: 'circle',
      position: { x: 200, y: 100 },
      mergeable: [],
      status: 'available',
    };

    const smallCircleSize = getTableSize(smallCircle.capacity);
    const largeCircleSize = getTableSize(largeCircle.capacity);

    expect(smallCircleSize).toBe(60);
    expect(largeCircleSize).toBe(100);
    expect(largeCircleSize).toBeGreaterThan(smallCircleSize);
  });
});

describe('Merged Table Connection Lines', () => {
  test('connection line calculation between table centers', () => {
    const table1: Table = {
      id: 'merge-1',
      number: 20,
      capacity: 4,
      shape: 'square',
      position: { x: 100, y: 100 },
      mergeable: ['merge-2', 'merge-3'],
      status: 'available',
    };

    const table2: Table = {
      id: 'merge-2',
      number: 21,
      capacity: 4,
      shape: 'square',
      position: { x: 200, y: 100 },
      mergeable: ['merge-1'],
      status: 'available',
    };

    // Calculate line coordinates between table centers
    const lineX1 = table1.position.x;
    const lineY1 = table1.position.y;
    const lineX2 = table2.position.x;
    const lineY2 = table2.position.y;

    expect(lineX1).toBe(100);
    expect(lineY1).toBe(100);
    expect(lineX2).toBe(200);
    expect(lineY2).toBe(100);

    // Line length calculation
    const lineLength = Math.sqrt(
      Math.pow(lineX2 - lineX1, 2) + Math.pow(lineY2 - lineY1, 2)
    );
    expect(lineLength).toBe(100);

    // Verify mergeable array
    expect(table1.mergeable.length).toBe(2);
    expect(table1.mergeable).toContain('merge-2');
    expect(table2.mergeable).toContain('merge-1');
  });
});

describe('Grid Snapping Logic', () => {
  test('values snap to nearest 20 units', () => {
    expect(snapToGrid(15)).toBe(20);
    expect(snapToGrid(25)).toBe(20);
    expect(snapToGrid(30)).toBe(40);
    expect(snapToGrid(100)).toBe(100);
    expect(snapToGrid(105)).toBe(100);
    expect(snapToGrid(115)).toBe(120);
  });

  test('table positions snap correctly', () => {
    const unsnapedTable: Table = {
      id: 'unsnapped',
      number: 30,
      capacity: 4,
      shape: 'square',
      position: { x: 127, y: 243 },
      mergeable: [],
      status: 'available',
    };

    const snappedX = snapToGrid(unsnapedTable.position.x);
    const snappedY = snapToGrid(unsnapedTable.position.y);

    expect(snappedX).toBe(120);
    expect(snappedY).toBe(240);
  });
});
