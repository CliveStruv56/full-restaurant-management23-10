# Visual Floor Plan Builder - Raw Idea

## Feature Overview
Visual Floor Plan Builder - An optional add-on module (part of the £29/month Table Management Module) that allows restaurant managers to create visual floor plans by arranging tables in their specific restaurant layout. This is a HIGH PRIORITY feature - blocker for beta customer launch.

## Core Requirements Gathered

### MVP Must-Have Features:
1. **Admin Floor Plan Editor**
   - Drag-and-drop interface with grid snapping (combination approach)
   - Configurable canvas dimensions based on restaurant size
   - Tables positioned by x/y coordinates only (no rotation in MVP)
   - Different visual sizes for different table shapes (square/rectangle/circle)
   - Real-time updates across admin sessions via existing streamTables()

2. **Customer Floor Plan View**
   - Read-only floor plan display showing real-time table availability
   - Color-coded status (available/occupied/reserved)
   - Customers can click/select tables visually when booking/ordering
   - Integration with dine-in order flow

3. **Table Merging**
   - Merged tables visually represented as connected on floor plan
   - Preferably create "merged table entity" (or auto-merge if simpler)
   - Support large party reservations

4. **Module Enablement**
   - Toggle via settings.floorPlanEnabled (boolean in AppSettings)
   - Designed to be easily upgradeable to subscription system later
   - Graceful fallback: when disabled, show existing TableManager list view only

### Future Enhancements (Not MVP):
- Table rotation on canvas
- Background floor plan image upload (blueprint/photo)
- Walls, sections, zones (kitchen, bar, patio areas)

## Technical Context

### Existing Infrastructure:
- **Table Interface** already has: position: {x: number, y: number}, mergeable: string[]
- **Existing Components**: TableManager.tsx (CRUD with list view), AdminPanel.tsx (routing)
- **Real-time Updates**: streamTables() function provides Firestore real-time sync
- **Tech Stack**: React + TypeScript + inline styles, Firebase/Firestore, multi-tenant (tenantId scoping)

### Integration Points:
- Must integrate with existing TableManager component (add view toggle)
- Must work with existing Table CRUD operations (addTable, updateTable, deleteTable, streamTables)
- Must maintain multi-tenant architecture
- Must add floorPlanEnabled to AppSettings interface

### Target User:
Marcus - Restaurant Manager, 30-40 years old, manages 8 tables in 30-seat restaurant, needs to optimize table utilization and improve staff coordination

## Implementation Approach Preference:
Technical implementation choice (Canvas API, React library, or SVG) left to my judgment based on:
- Best fit with existing codebase architecture
- Performance for real-time updates
- Mobile responsiveness for customer view
- Development speed (high priority deadline)

## Business Context:
- Part of Table Management Module pricing tier (£29/month)
- Module must be optional - base app works without it
- High priority: blocker for beta customer launch
