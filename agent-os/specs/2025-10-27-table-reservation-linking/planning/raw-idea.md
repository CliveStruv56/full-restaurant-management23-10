# Table-Reservation Linking & Double-Booking Prevention (Phase 3A)

**Spec Name**: table-reservation-linking
**Date**: 2025-10-27
**Phase**: 3A

## Raw Idea / Problem Statement

Restaurant managers are experiencing double-bookings because the current reservation system doesn't link reservations to actual tables or check for time conflicts. Multiple customers can book the same table at the same time. Tables have a status field ('available' | 'occupied' | 'reserved') but it's not connected to the reservation system. When a reservation is confirmed, the table status doesn't update automatically.

## User Stories

- As Marcus (Restaurant Manager), I want reservations to be automatically linked to specific tables so that I prevent double-bookings
- As a customer, I want to see only tables that are available for my selected date and time when making a reservation
- As staff, I want table status to automatically update when reservations are confirmed/completed so that the floor plan shows accurate real-time availability
- As an admin, I want to manually assign tables to existing pending reservations that were created before this feature existed

## Core Requirements

1. Extend Reservation interface with assignedTableId and assignedTableNumber fields
2. Create time-based availability checking function that prevents conflicts
3. Automatic table assignment when reservation is created/confirmed
4. Table status lifecycle: confirmed reservation → table 'reserved', completed → table 'available'
5. FloorPlanDisplay filters tables by selected date/time (only show available)
6. ReservationManager UI shows assigned table and allows manual assignment for pending reservations

## Success Criteria

- MUST prevent two reservations from being assigned to the same table at overlapping times
- MUST automatically assign an available table when reservation is confirmed
- MUST update table status to 'reserved' when reservation confirmed
- MUST update table status to 'available' when reservation completed/cancelled
- MUST allow admin to manually assign tables to existing reservations

## Technical Constraints

- Must work with existing multi-tenant Firestore structure (tenants/{tenantId}/tables, tenants/{tenantId}/reservations)
- Must integrate with existing streamTables() and streamReservations() real-time listeners
- Must use existing Table and Reservation interfaces (extend, don't break)
- Must handle reservation duration (use tableOccupation settings from AppSettings or default to 90 minutes)

## Out of Scope (defer to Phase 3B-E)

- ServicePeriod configuration UI (use simple defaults for now)
- SittingTimeRule complex calculations (use fixed duration)
- Walk-in booking processing (focus on reservations only)
- Smart auto-assignment algorithm with scoring (use simple "first available" logic)
- AvailabilityCache for performance optimization
- Table merging for large parties
