# Spec Requirements: Visual Floor Plan Builder

## Initial Description

Visual Floor Plan Builder - An optional add-on module (part of the £29/month Table Management Module) that allows restaurant managers to create visual floor plans by arranging tables in their specific restaurant layout. This is a HIGH PRIORITY feature - blocker for beta customer launch.

The feature enables:
1. Admin drag-and-drop editor for positioning tables on a visual canvas
2. Customer-facing view showing real-time table availability
3. Visual table selection for reservations and dine-in orders
4. Support for merged tables for large parties
5. Configurable canvas dimensions based on restaurant size

## Requirements Discussion

### First Round Questions

**Q1.1 - Editor Interface:** How would you like admins to arrange tables on the floor plan?

**Answer:** **C) Combination** - Drag-and-drop with optional grid snapping
- Tables can be freely dragged
- Optional grid snapping for easier alignment

**Q1.2 - Environmental Elements:** Should the floor plan support additional elements beyond tables?

**Answer:** **Walls, sections, zones** (kitchen area, bar, patio, etc.) - BUT this is **NOT MVP**, can wait for future enhancement

**Q1.3 - Table Rotation:** Should tables be rotatable on the canvas?

**Answer:** **No rotation in MVP** - Just positioned by x/y coordinates

**Q1.4 - Background Image:** Should admins be able to upload a background floor plan image?

**Answer:** **Not at this time** - No background floor plan image upload in MVP

**Q1.5 - Canvas Size:** Should the canvas be a fixed size or configurable?

**Answer:** **Configurable dimensions based on restaurant size** - "if possible and not too complex"
- Should allow different restaurant sizes
- Keep implementation reasonable for MVP timeline

**Q2.1 - Customer Visibility:** Should customers see the floor plan, or just admins?

**Answer:** **YES, they see real-time table availability status on the floor plan**
- Customers DO see the floor plan
- Real-time availability display (color-coded available/occupied/reserved)

**Q2.2 - Table Selection:** Can customers select tables visually from the floor plan?

**Answer:** **Yes** - Customers can select tables visually from the floor plan when making reservations/orders

**Q3.1 - Merged Tables:** How should merged tables be handled?

**Answer:**
- **Visual representation**: Merged tables should be visually represented as connected on the floor plan
- **Booking approach**: "Preferably, create a merged table entity, but the auto-merged would be OK, whatever is more user friendly and achievable"
- Priority on user-friendliness and feasibility

**Q3.2 - Table Sizes:** Should different table shapes have different visual sizes on the canvas?

**Answer:** **Different visual sizes** - Different table shapes (square/rectangle/circle) should have different visual sizes on the canvas

**Q4.1 - Storage Method:** How should the floor plan module enablement be stored?

**Answer:** **A) Simple boolean in settings.floorPlanEnabled** - "For now I'll implement option A, but design to be easily upgradeable"
- Store as settings.floorPlanEnabled: boolean
- Architecture should allow future upgrade to subscription system

**Q4.2 - Disabled Behavior:** What should users see when floor plan is disabled?

**Answer:** **Show only the current list view in TableManager (existing)**
- When disabled: hide all floor plan UI
- Fall back to existing table list view

**Q5.1 - Priority:** What is the priority level for this feature?

**Answer:** **High priority - blocker for beta customer launch**
- This is a launch blocker
- Timeline is urgent

**Q5.2 - MVP Scope:** What must be in MVP vs. what can wait?

**Answer:**

**MUST HAVE (MVP):**
- ✅ Basic table positioning
- ✅ Admin view
- ✅ Real-time updates
- ✅ Customer view

**CAN WAIT (Future):**
- ⏸️ Table rotation
- ⏸️ Background images
- ⏸️ Walls/zones

**Q6.1 - Implementation Choice:** Do you have a preference for implementation approach (Canvas API, React library, SVG)?

**Answer:** **D) Leave it to my judgment**
- User trusts my technical decision
- Consider: "rest of the application and the added value of the saas application"
- Choose based on: performance, real-time updates, mobile responsiveness, development speed

### Existing Code to Reference

**Similar Features Identified:**

The user has provided detailed context about existing infrastructure that will be integrated with this feature:

**Table Data Model** - Already implemented in `types.ts`:
```typescript
interface Table {
  id: string;
  number: number;
  capacity: number;
  shape: 'square' | 'rectangle' | 'circle';
  position: { x: number; y: number }; // Already exists!
  mergeable: string[]; // Already exists!
  status: 'available' | 'occupied' | 'reserved';
}
```

**Existing Components to Integrate With:**
- `components/admin/TableManager.tsx` - Current CRUD list view for tables
  - Already has addTable, updateTable, deleteTable operations
  - Uses multi-tenant context (useTenant hook)
  - Has TableForm component with position inputs (lines 289-328)
  - Displays table status badges with color coding
- `components/admin/AdminPanel.tsx` - Admin routing/navigation

**Real-time Data Sync:**
- `streamTables()` function provides Firestore live updates
- Already implemented for real-time table status across sessions

**Tech Stack:**
- React 18.2.0 + TypeScript
- Inline styles via `styles.ts`
- Framer Motion for animations
- Firebase Firestore with offline persistence
- Multi-tenant architecture with subdomain-based routing

**Backend API Functions** (from `firebase/api-multitenant.ts`):
- `addTable(tenantId, tableData)`
- `updateTable(tenantId, tableData)`
- `deleteTable(tenantId, tableId)`
- `streamTables(tenantId, callback)` - Real-time listener

### Follow-up Questions

No follow-up questions were needed. All requirements were clarified in the first round.

## Visual Assets

### Files Provided:

**Bash check result:** No visual files found

The visual assets folder was checked via bash command, and no image files were present at the time of requirements gathering.

### Visual Insights:

No visual assets provided.

## Requirements Summary

### Functional Requirements

**Admin Floor Plan Editor:**
- Drag-and-drop interface for positioning tables on a canvas
- Optional grid snapping for easier alignment (combination approach)
- Tables positioned by x/y coordinates only (no rotation in MVP)
- Configurable canvas dimensions to support different restaurant sizes
- Support for three table shapes with different visual sizes:
  - Square tables
  - Rectangle tables
  - Circle tables
- Visual representation of merged tables (connected/grouped appearance)
- Real-time updates across admin sessions
- Integration with existing TableManager CRUD operations
- Ability to edit table properties (number, capacity, shape, position) from floor plan

**Customer Floor Plan View:**
- Read-only floor plan display for customers
- Real-time table availability status:
  - Available (green)
  - Occupied (red)
  - Reserved (orange/amber)
- Visual table selection for reservations and dine-in orders
- Responsive design for mobile customers
- Integration with existing reservation/order flow

**Table Merging:**
- Visual representation of merged tables as connected entities
- Preferably create a "merged table entity" for bookings
- Alternative: Auto-merge approach if more user-friendly
- Support for large party reservations
- Use existing `mergeable: string[]` field from Table interface

**Module Enablement:**
- Boolean toggle: `settings.floorPlanEnabled`
- Add field to AppSettings interface in types.ts
- When disabled: show only existing TableManager list view
- When enabled: show floor plan view with option to toggle to list view
- Architecture designed to be easily upgradeable to subscription system

**Real-time Synchronization:**
- Leverage existing `streamTables()` Firestore real-time updates
- Table positions sync instantly across all admin sessions
- Table status updates reflect immediately in customer view
- Maintain offline-first architecture with Firestore persistence

### Reusability Opportunities

**Existing Data Model:**
- Table interface already has `position: { x: number, y: number }` - ready to use
- Table interface already has `mergeable: string[]` - ready to use
- Table.status already supports 'available' | 'occupied' | 'reserved' - maps directly to visual colors

**Existing Components to Extend:**
- TableManager.tsx - Add view toggle (list view vs. floor plan view)
- TableForm already has position inputs (lines 289-328) - can be enhanced with visual position picker
- Status badge styling already implemented (lines 68-88) - reuse color scheme

**Existing Backend:**
- All CRUD operations already implemented (addTable, updateTable, deleteTable)
- Real-time streaming already working (streamTables)
- Multi-tenant isolation already enforced
- No new Firestore collections needed - just update existing tables

**Existing Styling Patterns:**
- Inline styles via styles.ts object
- Framer Motion for modal animations
- React Hot Toast for user feedback
- Color scheme already defined for table statuses

### Scope Boundaries

**In Scope (MVP):**
- Drag-and-drop table positioning with optional grid snapping
- Configurable canvas dimensions
- Three table shapes (square, rectangle, circle) with appropriate visual sizes
- Admin floor plan editor view
- Customer floor plan view with real-time availability
- Visual table selection for customers
- Color-coded status display (available/occupied/reserved)
- Merged table visual representation
- Integration with existing TableManager component (view toggle)
- Module enablement via settings.floorPlanEnabled boolean
- Real-time updates via existing streamTables() function
- Multi-tenant support (tenantId scoping)
- Mobile responsive design for customer view

**Out of Scope (Future Enhancements):**
- Table rotation on canvas
- Background floor plan image upload (blueprint/photo)
- Walls, sections, zones (kitchen, bar, patio areas)
- Advanced merged table entity booking logic (if simple auto-merge is sufficient)
- Subscription-based module gating (use simple boolean for now)

### Technical Considerations

**Integration Points:**
- Extend AppSettings interface to add `floorPlanEnabled?: boolean`
- Add view toggle UI to TableManager component (switch between list/floor plan)
- Create new FloorPlanEditor component for admin
- Create new FloorPlanView component for customers
- Integrate with existing table CRUD operations (no new backend needed)
- Use existing streamTables() for real-time sync
- Maintain existing multi-tenant context pattern (useTenant hook)

**Implementation Approach Decision:**
- Choose between Canvas API, SVG, or React drag-and-drop library
- Consider factors:
  - Performance with real-time Firestore updates
  - Mobile responsiveness for customer view
  - Development speed (high priority deadline)
  - Integration with existing inline styles approach
  - Support for grid snapping and drag-and-drop
  - Ability to render different table shapes with visual size differences

**Data Model Updates:**
- No changes to Table interface needed (position and mergeable already exist)
- Add `floorPlanEnabled?: boolean` to AppSettings interface
- Optionally add canvas dimensions to AppSettings:
  ```typescript
  floorPlanCanvas?: {
    width: number;  // in grid units or pixels
    height: number; // in grid units or pixels
  }
  ```

**Real-time Architecture:**
- Use existing Firestore offline persistence
- streamTables() already provides real-time updates
- Optimistic UI updates for drag operations
- Sync position changes to Firestore on drag end

**User Experience:**
- Admin can switch between list view and floor plan view
- Customer sees floor plan by default (if enabled)
- Table selection highlights table before confirmation
- Visual feedback during drag operations
- Toast notifications for save/error states
- Loading states during initial data fetch

**Target User Context:**
- Primary user: Marcus (Restaurant Manager, 30-40)
- Manages 8 tables in 30-seat restaurant
- Needs visual representation to optimize seating
- Staff coordination via real-time status updates
- Customer experience: visual table selection reduces friction

**Business Context:**
- Part of Table Management Module (£29/month)
- Optional add-on - base app must work without it
- High priority - beta launch blocker
- Must maintain cost-effective infrastructure (multi-tenant)
- Success metric: Improves table utilization and reduces wait times

**Performance Targets:**
- Page load: < 2 seconds on 3G
- Real-time sync latency: < 200ms (Firestore streaming)
- Drag operation responsiveness: < 16ms (60fps)
- Mobile responsiveness: Works on phones/tablets
- Supports 100+ tables on single floor plan (edge case)

**Security Considerations:**
- Admin-only editing (enforce via role-based access)
- Customers can only view, not edit
- All updates must verify tenantId matching
- Maintain existing Firestore security rules structure
- Floor plan data scoped to tenant (no cross-tenant visibility)
