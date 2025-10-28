# Customer Flow Redesign - Raw Idea

**Date:** October 26, 2025
**Phase:** Phase 3
**Priority:** High
**Effort:** XL (3-4 weeks)

---

## The Big Idea

Transform the customer ordering experience from a generic menu app into a branded, context-aware journey that adapts to customer intent (dining now vs. booking later) and order type (eat-in vs. takeaway).

---

## Core Problem

Current system assumes all customers have the same intent: order food now for takeaway. This doesn't match real-world restaurant scenarios where customers might:
- Want to book a table for later
- Be sitting at a table ordering via QR code
- Want different menu options for dine-in vs. takeaway
- Prefer guest checkout without account hassle

**Result:** Confusing, generic experience that lacks professional polish and misses key use cases.

---

## Proposed Solution

### 1. Tenant-Branded Landing Pages
Each restaurant gets a customizable landing page with their logo, hero image, brand colors, operating hours, and location. Creates a professional first impression.

### 2. Intent-Based Flow
Ask customers upfront: "Are you here now or booking for later?"
- **Here Now:** Proceed to order type selection → menu
- **Book Later:** Reservation form → confirmation

### 3. QR Code Table Ordering
Generate unique QR codes for each table. When scanned:
- Bypass landing page
- Auto-select "Dine In" order type
- Pre-fill table number
- Go straight to menu

Fastest path for seated customers.

### 4. Reservation System
Simple booking form capturing:
- Date, time, party size
- Contact details (name, phone, email)
- Optional table preference and special requests
- Auto-cancel no-shows after 15 minutes
- Admin view to manage reservations

**Important:** Reservations are bookings only, not pre-orders. Customers order when they arrive.

### 5. Order Type-Specific Menus
Products can be configured as:
- Dine-in only (e.g., ceramic mug coffee, hot soup)
- Takeaway only (e.g., disposable cup drinks)
- Both

Menu automatically filters based on customer's selected order type.

### 6. Guest Checkout
No forced account creation. Customers can place orders as guests with just name and phone. After first order, prompt (optional) to create account for loyalty benefits.

---

## Business Value

**For Customers:**
- Professional, branded experience builds trust
- Clear, intuitive flow reduces confusion
- QR codes enable instant ordering from table
- Reservations don't require phone calls
- Guest checkout removes friction

**For Restaurant Owners:**
- Branded landing page differentiates from competitors
- QR codes reduce staff workload for table orders
- Reservations captured digitally, no phone tag
- Order type distinction improves kitchen workflow
- Higher conversion from reduced friction

**For the Platform:**
- More professional product positioning
- Feature parity with expensive POS systems
- Foundation for future enhancements (table management, waitlist)
- Competitive differentiation

---

## High-Level Approach

### Phase 3A: Landing & Intent (Week 1-2)
- Build landing page component with branding
- Create intent selection screen
- Add order type selection
- Admin UI for branding configuration

### Phase 3B: QR Codes (Week 2)
- QR code generation system
- Download/print functionality
- URL routing with table detection
- Auto-population logic

### Phase 3C: Reservations (Week 2-3)
- Reservation form with validation
- Backend reservation storage
- Admin reservation management
- Auto-cancellation Cloud Function

### Phase 3D: Menu Differentiation & Auth (Week 3-4)
- Product availability configuration
- Menu filtering by order type
- Guest checkout implementation
- Optional account creation flow

---

## Success Metrics

- 30% faster time-to-order for walk-ins
- 50% increase in QR code ordering adoption
- <10% reservation no-show rate
- >80% guest checkout conversion
- Professional landing page for all tenants

---

## Technical Considerations

**New Components:**
- `LandingPage.tsx` - Tenant-branded entry point
- `IntentSelection.tsx` - "Now" vs "Later" choice
- `ReservationForm.tsx` - Booking form
- `QRCodeManager.tsx` - Admin QR generation

**Database Changes:**
- `settings.branding` - Landing page config
- `reservations` collection - Booking data
- `products.availableFor` - Menu availability

**External Dependencies:**
- `qrcode.react` - QR generation library
- Date picker library (e.g., `react-datepicker`)
- Phone validation library

**Cloud Functions:**
- `autoCleanupReservations` - Scheduled function to cancel no-shows

---

## Risks & Mitigations

**Risk:** Scope creep into complex table management
**Mitigation:** Strict scope boundary. Phase 3 = customer flow only. Advanced table features deferred to Phase 4+.

**Risk:** QR codes printed and can't be changed
**Mitigation:** QR encodes tenant subdomain + table number (stable). Backend handles routing logic changes.

**Risk:** Guest checkout reduces account creation
**Mitigation:** Strategic post-order prompts with clear loyalty benefits. Long-term retention > short-term signups.

**Risk:** Reservation system creates expectations for real-time availability
**Mitigation:** Clear messaging: "We'll confirm your reservation shortly." Manual admin confirmation required initially.

---

## Dependencies

- Phase 2 complete ✅
- Multi-tenant architecture ✅
- Firebase Auth, Storage, Functions ✅

---

## Next Steps

1. ✅ Requirements documented (see [requirements.md](requirements.md))
2. ⏳ Generate comprehensive spec (`/write-spec`)
3. ⏳ Generate task breakdown (`/create-tasks`)
4. ⏳ Begin Milestone 1: Landing Page & Branding

---

**Status:** Idea validated, requirements captured, ready for specification writing
**Owner:** Development Team
**Stakeholder Approval:** Required before implementation begins
