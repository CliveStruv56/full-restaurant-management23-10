# Specification: Visual Floor Plan Builder

## Goal
Enable restaurant managers to visually arrange tables on a drag-and-drop floor plan canvas, with real-time availability display for customers. This is an optional module within the Table Management package that enhances table visualization and customer experience without breaking base functionality.

## User Stories
- As Marcus (Restaurant Manager), I want to arrange my 8 tables visually on a floor plan so that I can optimize seating layout and see my restaurant at a glance
- As an admin, I want to drag tables to their physical positions with grid snapping so that alignment is easy and consistent
- As a customer, I want to see a visual floor plan with real-time table availability (green/red/orange) so that I can quickly understand which tables are free
- As a customer, I want to click on available tables in the floor plan so that I can select my preferred seating when making a reservation or dine-in order
- As a restaurant owner, I want to enable/disable the floor plan module via settings so that I only pay for features I use
- As staff, I want to see merged tables visually connected on the floor plan so that I understand which tables are grouped for large parties

## Core Requirements

### Admin Floor Plan Editor
- Drag-and-drop interface for positioning tables on canvas
- Optional grid snapping to assist with alignment (combination of free-drag and snap-to-grid)
- Configurable canvas dimensions to support different restaurant sizes
- Three table shapes rendered with different visual sizes:
  - Circle tables (rendered as SVG circles)
  - Square tables (rendered as SVG rectangles with equal width/height)
  - Rectangle tables (rendered as SVG rectangles with width > height)
- Visual representation of merged tables (connected appearance)
- Real-time position sync across all admin sessions
- Table property editing from floor plan (number, capacity, shape, status)
- View toggle: switch between floor plan view and existing list view
- Position updates saved to existing Table.position field

### Customer Floor Plan View
- Read-only visual display of restaurant layout
- Real-time table status updates:
  - Available: green (#10b981)
  - Occupied: red (#ef4444)
  - Reserved: orange/amber (#f59e0b)
- Visual table selection (click to select for reservation/order)
- Responsive design for mobile devices
- Integration with existing order/reservation flow
- Graceful loading states while fetching table data

### Module Enablement
- Boolean toggle in AppSettings: `floorPlanEnabled?: boolean`
- When disabled: show only existing TableManager list view
- When enabled: default to floor plan view with option to toggle to list
- No breaking changes to base application
- Architecture designed for future upgrade to subscription-based gating

### Data Persistence
- Leverage existing `Table.position: { x: number; y: number }` field
- Add optional `floorPlanCanvas?: { width: number; height: number }` to AppSettings
- All updates use existing CRUD operations (addTable, updateTable, deleteTable)
- Real-time sync via existing streamTables() Firestore listener
- Multi-tenant isolation enforced (tenantId scoping)

## Visual Design

No mockups provided. Design will follow existing application patterns:

### Color Scheme (Reuse Existing)
- Available tables: #10b981 (green) - matches existing status badge
- Occupied tables: #ef4444 (red) - matches existing status badge
- Reserved tables: #f59e0b (orange) - matches existing status badge
- Selected table: #2563eb (blue) - matches existing primary color
- Grid lines: #e5e7eb (light gray)
- Canvas background: #f9fafb (very light gray)

### Responsive Breakpoints
- Desktop (>= 1024px): Full canvas with sidebar controls
- Tablet (768px - 1023px): Stacked layout, canvas above controls
- Mobile (< 768px): Single column, simplified touch controls

### Table Size Rendering
- Small tables (capacity 1-2): 60px diameter/width
- Medium tables (capacity 3-4): 80px diameter/width
- Large tables (capacity 5+): 100px diameter/width
- Rectangle tables: 1.5x aspect ratio (width = 1.5 * height)

## Reusable Components

### Existing Code to Leverage

**Data Model:**
- `Table` interface (types.ts lines 274-282) - already has position {x,y} and mergeable[] fields
- `AppSettings` interface (types.ts lines 142-190) - will add floorPlanEnabled and floorPlanCanvas fields
- Table.status already supports 'available' | 'occupied' | 'reserved'

**Backend API (firebase/api-multitenant.ts):**
- `streamTables(tenantId, callback)` (lines 607-621) - real-time table updates
- `addTable(tenantId, tableData)` (lines 626-634) - create tables
- `updateTable(tenantId, table)` (lines 639-644) - update positions/properties
- `deleteTable(tenantId, tableId)` (lines 649-653) - remove tables
- All operations are multi-tenant scoped and ready to use

**UI Components:**
- `TableManager` component (components/admin/TableManager.tsx) - existing list view to extend
- `TableForm` component (lines 164-342) - already has position inputs (lines 289-328)
- Status badge styling (lines 68-88) - color scheme to reuse
- `useTenant()` hook from TenantContext - for tenant isolation
- Framer Motion (already in package.json) - for modal animations

**Styling Patterns:**
- Inline styles via styles.ts object
- React Hot Toast for notifications
- Modal overlay pattern from TableForm (adminModalOverlay, adminModalContent)

### New Components Required

**FloorPlanEditor** (admin view)
- Cannot reuse existing components - new drag-and-drop canvas needed
- Why: No existing drag-and-drop table positioning interface
- Will integrate with existing TableManager via view toggle

**FloorPlanCanvas** (shared canvas rendering)
- Cannot reuse - new SVG-based rendering engine needed
- Why: Visual table representation doesn't exist
- Will use existing Table data structure

**FloorPlanDisplay** (customer view)
- Cannot reuse - new read-only customer interface needed
- Why: Customer-facing floor plan view doesn't exist
- Will reuse FloorPlanCanvas for rendering logic

**TableShapeRenderer** (SVG rendering utility)
- Cannot reuse - new shape drawing logic needed
- Why: Visual table shapes don't exist
- Will render circle/square/rectangle based on Table.shape

## Technical Approach

### Implementation Choice: SVG with React State

**Decision: Use SVG (Scalable Vector Graphics) with React state management**

**Rationale:**
1. **Performance with real-time updates**: SVG integrates seamlessly with React's virtual DOM. When Firestore streams table updates, React efficiently re-renders only changed SVG elements
2. **Mobile responsiveness**: SVG is inherently responsive (viewBox attribute scales to any viewport). Critical for customer mobile experience
3. **Development speed**: No external drag-and-drop library needed. Use native React onMouseDown/onMouseMove/onMouseUp events. Faster than learning Canvas API
4. **Integration with inline styles**: SVG elements accept React style objects, matching existing codebase pattern
5. **Grid snapping**: Simple math with SVG coordinates (round to nearest grid unit)
6. **Accessibility**: SVG supports ARIA labels and semantic markup (important for customer view)

**Alternative approaches rejected:**
- Canvas API: Requires manual redrawing on every update, harder to integrate with React state
- react-dnd library: Additional dependency, overkill for simple drag-drop, slower to implement
- Third-party floor plan library: Not found in existing dependencies, would increase bundle size

### Drag-and-Drop Implementation

**Admin Editor Approach:**
```
1. Table selection: onMouseDown captures table ID, stores in React state
2. Dragging: onMouseMove calculates delta from initial position, updates position state
3. Grid snapping: If enabled, round position.x and position.y to nearest grid unit (e.g., 20px)
4. Drop: onMouseUp calls updateTable(tenantId, updatedTable) to persist to Firestore
5. Optimistic UI: Update local state immediately, sync to Firestore on mouseup
6. Real-time sync: streamTables() broadcasts changes to all admin sessions
```

**Touch Support (Mobile Admin):**
- Use onTouchStart/onTouchMove/onTouchEnd for mobile drag
- Prevent default touch behaviors to avoid scroll conflicts
- Larger touch targets (minimum 44x44px) for accessibility

### Real-time Synchronization Strategy

**Firestore Integration:**
- Leverage existing `streamTables(tenantId, callback)` listener
- On table position update: updateTable() writes to Firestore, triggers onSnapshot callbacks
- All connected admin sessions receive position changes instantly
- Customer views receive status changes (available/occupied/reserved) in real-time
- Offline support: Firestore offline persistence already enabled (firebase/config.ts)

**Optimistic Updates:**
- Admin drag: Update local state immediately for 60fps responsiveness
- Sync to Firestore on drag end (not on every mousemove)
- If Firestore write fails, revert to previous position with toast error

**Conflict Resolution:**
- Last-write-wins (Firestore default)
- Acceptable for MVP (unlikely two admins drag same table simultaneously)
- Future: Add version field or server-side timestamp for conflict detection

### Canvas Dimensions and Scaling

**Configurable Canvas:**
- Store `floorPlanCanvas: { width: number; height: number }` in AppSettings
- Default: { width: 800, height: 600 } (grid units, not pixels)
- Admin can configure via settings form (Small: 600x400, Medium: 800x600, Large: 1200x800)

**SVG ViewBox Scaling:**
```xml
<svg viewBox="0 0 {width} {height}" width="100%" height="auto">
  <!-- Tables rendered here -->
</svg>
```
- ViewBox defines logical coordinate system (matches stored position values)
- width="100%" makes canvas responsive to container width
- Maintains aspect ratio automatically

**Grid Rendering:**
- Optional grid overlay (dashed lines every 20 units)
- Toggle in admin view, hidden in customer view
- Rendered as SVG lines with stroke-dasharray

### Merged Table Visualization

**Approach: Visual Connection Lines**
- If Table.mergeable array contains other table IDs, draw connecting line between centers
- Line style: dashed stroke, same color as table status
- Hover tooltip: "Merged with Table X, Table Y"

**MVP Decision:**
- Do NOT implement merged table entity booking logic in MVP
- Visual representation only (show which tables can merge)
- Future enhancement: Auto-merge logic when customer selects adjacent mergeable tables

### Module Toggle Implementation

**AppSettings Extension:**
```typescript
export interface AppSettings {
  // ... existing fields ...
  floorPlanEnabled?: boolean;
  floorPlanCanvas?: {
    width: number;
    height: number;
  };
}
```

**TableManager View Toggle:**
- Add tab navigation: "List View" | "Floor Plan View"
- If floorPlanEnabled is false: hide Floor Plan tab, show only List View
- If floorPlanEnabled is true: default to Floor Plan, allow toggle to List View
- Store user preference in localStorage for session persistence

**SettingsManager Integration:**
- Add checkbox in SettingsManager: "Enable Floor Plan Module (£29/month)"
- On toggle: updateSettings(tenantId, { ...settings, floorPlanEnabled: true/false })
- Show warning modal: "Disabling floor plan will hide it from customers. Table positions will be preserved."

## Out of Scope

### Not in MVP (Future Enhancements)
- **Table rotation**: Tables are positioned by x/y only, no rotation angle
- **Background floor plan images**: No upload of restaurant blueprint/photo
- **Walls, sections, zones**: No kitchen area, bar, patio zone markers
- **Advanced merged table booking**: Auto-merge logic for customer reservations (manual merge only in MVP)
- **Subscription-based module gating**: Use simple boolean toggle for now, not Stripe subscription
- **Undo/redo for table moves**: No history tracking in MVP
- **Collision detection**: Tables can overlap (admin responsible for avoiding)
- **Table templates**: No predefined layouts (e.g., "Cafe Setup", "Fine Dining")
- **Multi-floor support**: Single floor plan per restaurant only

### Explicitly Excluded
- Integration with external reservation systems (OpenTable, Resy)
- Waitlist management from floor plan
- Server assignment to table sections
- Table-specific notes or customer preferences

## Success Criteria

### Measurable Outcomes
- **Admin efficiency**: Restaurant manager can position 8 tables in under 2 minutes
- **Customer engagement**: 60%+ of reservations use visual table selection (vs. dropdown)
- **Performance**: Floor plan loads in < 2 seconds on 3G connection
- **Real-time sync**: Status changes appear in customer view within 200ms (Firestore streaming latency)
- **Mobile usability**: Floor plan renders correctly on iPhone SE (smallest common viewport)

### User Experience Goals
- **Admin confidence**: Manager understands floor plan immediately, no training needed
- **Visual clarity**: Customer can distinguish available vs. occupied tables at a glance
- **Zero downtime**: Module can be disabled without breaking existing table management
- **Consistent branding**: Floor plan colors match existing status badge scheme

### Technical Quality
- **Code reuse**: 80%+ of backend logic reused (streamTables, updateTable, existing CRUD)
- **Type safety**: Full TypeScript coverage, no 'any' types in new components
- **Accessibility**: ARIA labels on all interactive elements, keyboard navigation support
- **Test coverage**: Manual smoke test checklist (automated tests not required for MVP)

### Launch Readiness
- **Beta customer approval**: Marcus (restaurant manager persona) successfully uses floor plan for 1 week without issues
- **Module toggle works**: Can enable/disable without data loss or UI breaks
- **Multi-tenant isolation**: Verified table positions don't leak across tenants
- **Rollback plan**: Can deploy with floorPlanEnabled=false for all tenants, enable selectively

## Implementation Strategy

### Development Approach (High Priority Timeline)

**Phase 1: Foundation (Days 1-2)**
- Extend AppSettings interface with floorPlanEnabled and floorPlanCanvas
- Create FloorPlanCanvas component (SVG rendering, no drag-and-drop yet)
- Render static tables from existing Table data (test with demo-tenant)
- Add view toggle to TableManager (list/floor plan tabs)

**Phase 2: Admin Drag-and-Drop (Days 3-4)**
- Implement drag-and-drop logic (onMouseDown/Move/Up handlers)
- Add grid snapping toggle
- Connect to updateTable API for position persistence
- Test real-time sync between two admin browser windows
- Add canvas dimension configuration in SettingsManager

**Phase 3: Customer View (Day 5)**
- Create FloorPlanDisplay component (read-only version of FloorPlanCanvas)
- Add visual table selection (click handler)
- Integrate with existing reservation/order flow (pass selected tableNumber)
- Test on mobile devices (iPhone, Android)

**Phase 4: Polish & Launch (Day 6)**
- Add merged table connection lines
- Implement module toggle in SettingsManager
- Add loading states and error handling
- Smoke test with beta customer scenario (8 tables, 30-seat restaurant)
- Deploy with floorPlanEnabled=false default, enable for beta customer

### Testing Strategy

**Manual Smoke Tests:**
1. **Admin drag test**: Move table, refresh page, verify position persisted
2. **Real-time sync test**: Two admin browsers, drag in one, verify other updates
3. **Customer view test**: Change table status in admin, verify customer view updates color
4. **Table selection test**: Customer clicks table, verify tableNumber passed to reservation form
5. **Module toggle test**: Disable floor plan, verify list view appears, re-enable, verify floor plan restores
6. **Mobile test**: Open on iPhone, verify tables are tappable and canvas scales correctly
7. **Multi-tenant test**: Switch between two tenants, verify table positions don't mix

**Performance Validation:**
- Test with 100 tables (edge case) - verify no lag in rendering
- Test on throttled 3G connection (Chrome DevTools) - verify 2-second load time
- Test real-time updates with 5 concurrent users - verify no sync delays

### Rollout Plan

**Phased Rollout:**
1. **Internal testing** (Day 7): Enable for demo-tenant, test all flows
2. **Beta customer** (Week 2): Enable floorPlanEnabled for beta customer tenant only
3. **Feedback iteration** (Week 2): Fix bugs, adjust based on Marcus's feedback
4. **Soft launch** (Week 3): Enable for 5 early adopter tenants, monitor Firestore logs
5. **General availability** (Week 4): Add floor plan toggle to all tenants with Table Management module

**Rollback Strategy:**
- If critical bug found: Set floorPlanEnabled=false for affected tenant(s)
- Table positions preserved in database, can re-enable after fix
- List view always available as fallback
- No data migration needed for rollback

**Monitoring:**
- Firestore read/write counts (watch for cost spikes from real-time listeners)
- Error logs in browser console (track unhandled exceptions)
- Customer support tickets (watch for confusion or usability issues)
- Beta customer feedback (weekly check-in with Marcus)

### Key Risks and Mitigations

**Risk 1: Performance with many tables**
- Mitigation: Test with 100 tables, optimize SVG rendering if needed (virtualization)
- Fallback: Recommend max 50 tables per floor plan

**Risk 2: Mobile drag-and-drop UX**
- Mitigation: Implement touch handlers early, test on real devices
- Fallback: Admin can use desktop for floor plan setup, mobile for monitoring only

**Risk 3: Real-time sync conflicts**
- Mitigation: Optimistic updates with last-write-wins
- Fallback: Add visual indicator if sync fails, manual refresh button

**Risk 4: Customer confusion with table selection**
- Mitigation: Clear visual feedback (highlight selected table, show table number)
- Fallback: Keep existing table dropdown as alternative option

**Risk 5: Scope creep (rotation, backgrounds, zones)**
- Mitigation: Strict MVP scope enforcement, defer enhancements to backlog
- Fallback: Ship MVP, gather usage data before adding complexity
