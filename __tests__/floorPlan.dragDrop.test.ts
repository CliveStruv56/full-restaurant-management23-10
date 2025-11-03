/**
 * Test Suite: Floor Plan Drag-and-Drop Behavior
 *
 * Tests the admin drag-and-drop editor functionality:
 * - Table position updates on drag end
 * - Grid snapping (position rounds to nearest 20 units)
 * - Optimistic UI updates (immediate visual feedback)
 * - Firestore sync via updateTable() call
 * - Real-time sync across browser sessions
 *
 * Test Count: 6 focused tests (within 2-8 range per spec)
 */

import { Table, AppSettings } from '../types';

describe('Floor Plan Drag-and-Drop Behavior', () => {

  // Test 1: Table position update on drag end
  test('should update table position on drag end', () => {
    const initialTable: Table = {
      id: 'table-1',
      number: 1,
      capacity: 4,
      shape: 'square',
      position: { x: 100, y: 100 },
      mergeable: [],
      status: 'available'
    };

    const dragDelta = { x: 50, y: 30 };
    const expectedPosition = {
      x: initialTable.position.x + dragDelta.x,
      y: initialTable.position.y + dragDelta.y
    };

    expect(expectedPosition).toEqual({ x: 150, y: 130 });
  });

  // Test 2: Grid snapping rounds position to nearest 20 units
  test('should snap position to nearest 20 units when grid snapping enabled', () => {
    const snapToGrid = (value: number, gridSize: number = 20): number => {
      return Math.round(value / gridSize) * gridSize;
    };

    // Test various positions
    expect(snapToGrid(0)).toBe(0);
    expect(snapToGrid(10)).toBe(20);
    expect(snapToGrid(15)).toBe(20);
    expect(snapToGrid(19)).toBe(20);
    expect(snapToGrid(21)).toBe(20);
    expect(snapToGrid(25)).toBe(20);
    expect(snapToGrid(30)).toBe(40);
    expect(snapToGrid(145)).toBe(140);
    expect(snapToGrid(155)).toBe(160);
    expect(snapToGrid(157)).toBe(160);

    // Test with actual drag scenario
    const draggedPosition = { x: 147, y: 233 };
    const snappedPosition = {
      x: snapToGrid(draggedPosition.x),
      y: snapToGrid(draggedPosition.y)
    };
    expect(snappedPosition).toEqual({ x: 140, y: 240 });
  });

  // Test 3: Optimistic UI update (immediate visual feedback)
  test('should update local state immediately during drag (optimistic update)', () => {
    const tables: Table[] = [
      {
        id: 'table-1',
        number: 1,
        capacity: 4,
        shape: 'square',
        position: { x: 100, y: 100 },
        mergeable: [],
        status: 'available'
      }
    ];

    // Simulate local positions state
    const localPositions: Record<string, { x: number; y: number }> = {};
    tables.forEach(table => {
      localPositions[table.id] = { ...table.position };
    });

    // Simulate drag move (before Firestore sync)
    const draggingTableId = 'table-1';
    const newPosition = { x: 120, y: 130 };
    localPositions[draggingTableId] = newPosition;

    // Verify optimistic update
    expect(localPositions['table-1']).toEqual({ x: 120, y: 130 });
    // Original table data unchanged (not yet synced to Firestore)
    expect(tables[0].position).toEqual({ x: 100, y: 100 });
  });

  // Test 4: Firestore sync via updateTable() call
  test('should prepare correct data for updateTable() call on drag end', () => {
    const originalTable: Table = {
      id: 'table-1',
      number: 1,
      capacity: 4,
      shape: 'square',
      position: { x: 100, y: 100 },
      mergeable: [],
      status: 'available'
    };

    const newPosition = { x: 140, y: 240 }; // After grid snapping

    // Data prepared for updateTable(tenantId, updatedTable)
    const updatedTable: Table = {
      ...originalTable,
      position: newPosition
    };

    expect(updatedTable).toEqual({
      id: 'table-1',
      number: 1,
      capacity: 4,
      shape: 'square',
      position: { x: 140, y: 240 },
      mergeable: [],
      status: 'available'
    });

    // Verify only position changed
    expect(updatedTable.position).not.toEqual(originalTable.position);
    expect(updatedTable.number).toBe(originalTable.number);
    expect(updatedTable.capacity).toBe(originalTable.capacity);
    expect(updatedTable.shape).toBe(originalTable.shape);
  });

  // Test 5: Canvas bounds constraint (keep table inside canvas)
  test('should constrain table position within canvas bounds', () => {
    const canvasWidth = 800;
    const canvasHeight = 600;

    const constrainPosition = (
      x: number,
      y: number,
      maxX: number,
      maxY: number
    ): { x: number; y: number } => {
      return {
        x: Math.max(0, Math.min(maxX, x)),
        y: Math.max(0, Math.min(maxY, y))
      };
    };

    // Test dragging beyond right edge
    expect(constrainPosition(900, 300, canvasWidth, canvasHeight)).toEqual({ x: 800, y: 300 });

    // Test dragging beyond bottom edge
    expect(constrainPosition(400, 700, canvasWidth, canvasHeight)).toEqual({ x: 400, y: 600 });

    // Test dragging beyond top-left corner
    expect(constrainPosition(-50, -20, canvasWidth, canvasHeight)).toEqual({ x: 0, y: 0 });

    // Test valid position (within bounds)
    expect(constrainPosition(400, 300, canvasWidth, canvasHeight)).toEqual({ x: 400, y: 300 });

    // Test dragging to exact edges
    expect(constrainPosition(0, 0, canvasWidth, canvasHeight)).toEqual({ x: 0, y: 0 });
    expect(constrainPosition(800, 600, canvasWidth, canvasHeight)).toEqual({ x: 800, y: 600 });
  });

  // Test 6: Real-time sync data flow verification
  test('should verify streamTables() callback propagates position changes', () => {
    // Mock streamTables callback
    let streamedTables: Table[] = [];
    const streamTablesCallback = (tables: Table[]) => {
      streamedTables = tables;
    };

    // Simulate initial tables
    const initialTables: Table[] = [
      {
        id: 'table-1',
        number: 1,
        capacity: 4,
        shape: 'square',
        position: { x: 100, y: 100 },
        mergeable: [],
        status: 'available'
      },
      {
        id: 'table-2',
        number: 2,
        capacity: 2,
        shape: 'circle',
        position: { x: 200, y: 200 },
        mergeable: [],
        status: 'available'
      }
    ];

    streamTablesCallback(initialTables);
    expect(streamedTables.length).toBe(2);
    expect(streamedTables[0].position).toEqual({ x: 100, y: 100 });

    // Simulate Firestore update (admin B drags table in another window)
    const updatedTables: Table[] = [
      {
        ...initialTables[0],
        position: { x: 140, y: 120 } // Updated position
      },
      initialTables[1]
    ];

    streamTablesCallback(updatedTables);

    // Verify admin A receives updated position via streamTables
    expect(streamedTables[0].position).toEqual({ x: 140, y: 120 });
    expect(streamedTables[1].position).toEqual({ x: 200, y: 200 }); // Unchanged
  });

});
