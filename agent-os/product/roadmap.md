# Product Roadmap

## Phase 1: Multi-Tenant Foundation (COMPLETED - Week 1-2)

1. [x] Multi-Tenant Architecture - Complete data isolation with subdomain-based routing, tenant metadata management, and security rules enforcing cross-tenant boundaries. All core features (products, categories, orders, settings) scoped to tenantId. `COMPLETED`

## Phase 2: User Management & Offline Support (Weeks 3-6)

2. [x] User Invitation System - Cloud Functions-based invitation flow where tenant admins can invite staff and customers via email. Invited users receive temporary credentials, set their password, and are automatically assigned to the correct tenant with appropriate role permissions. **Implementation COMPLETE (Phases 1-4 + Bug Fixes). All features working end-to-end. Pending email service configuration (SendGrid/Mailgun) for staging deployment.** `COMPLETED`

3. [x] Offline Persistence - Enable Firestore offline cache with intelligent priming for critical data (today's orders, menu items, settings). Offline indicator UI shows connection status. Orders created offline queue automatically and sync when connectivity returns. **Implementation COMPLETE. Firestore offline persistence enabled, cache priming integrated, OfflineIndicator component deployed.** `COMPLETED`

4. [x] Dine-In Order Types - Extend order placement to support order type selection (Takeaway, Dine-In). For dine-in orders, capture table number and guest count. KDS displays table numbers prominently. Admin can configure available table numbers via base module settings. **Implementation COMPLETE. Order type selection in CartModal, table/guest inputs for dine-in, prominent KDS badges.** `COMPLETED`

## Phase 3: Table Management Module (Weeks 7-14)

5. [ ] Visual Floor Plan Builder - Grid-based drag-and-drop editor for creating restaurant layouts. Admin defines tables with properties (number, capacity, shape, position). Tables can be marked as mergeable for large parties. Floor plans save to Firestore and display in both admin and customer views. `L`

6. [ ] Basic Reservation System - Customer-facing reservation form captures date, time, party size, and contact details. Admin views list of reservations, manually assigns tables, and updates status (pending, confirmed, seated, completed, cancelled). Reservations stored in tenant-scoped Firestore collection. `M`

7. [ ] Smart Availability Algorithm - Real-time calculation of available booking slots based on service period configuration (lunch, dinner), table capacity, existing reservations, and turn time rules. Auto-assignment finds best table(s) for party size, including merged table options for large groups. `L`

8. [ ] Reservation Notifications - Email confirmations sent when reservation is created and confirmed. Optional SMS reminders via Twilio integration 24 hours before reservation time. Admin receives notification when new reservations are submitted. `M`

## Phase 4: Management & Analytics Module (Weeks 15-18)

9. [ ] Sales Analytics Dashboard - Interactive charts (Recharts) showing revenue trends by day/week/month, average order value, and order type breakdown. Top 10 selling products table with quantity and revenue. Date range picker for custom reporting periods. Export all data to CSV format. `M`

10. [ ] Visitor Tracking & Peak Hours - Customer count aggregation from order guest counts, peak hours heat map (day of week vs. hour of day), table occupancy rates (for table module users), and repeat customer identification based on user authentication. Helps optimize staffing and menu planning. `M`

## Phase 5: Payment Processing (Weeks 19-20)

11. [ ] Payment Gateway Abstraction - TypeScript interface defining payment operations (create, confirm, refund, status check). Implementations for Stripe and Square gateways. Cloud Function routes payment requests to correct gateway based on tenant configuration. Payment records stored in Firestore. `L`

12. [ ] Payment Checkout UI - Customer-facing payment modal supporting Stripe Elements and Square Web SDK. Admin settings panel for configuring payment gateway (select provider, enter API keys, toggle test mode). Receipt generation and email delivery. Admin payment history view with refund capability. `M`

## Phase 6: Production Readiness & Launch (Weeks 21-24)

13. [ ] Security Hardening - Tighten Firestore security rules with role-based access control. Security rule unit tests via Firebase emulator. Encrypt sensitive tenant configuration (payment gateway credentials). Implement audit logging for admin operations (user invitations, settings changes, refunds). `M`

14. [ ] CI/CD Pipeline - GitHub Actions workflow with automated testing, staging deployment (on merge to staging branch), and production deployment (on merge to main). Separate Firebase projects for staging and production. Environment-specific configuration via secrets. `S`

15. [ ] Error Monitoring & Analytics - Sentry integration for real-time error tracking with stack traces and session replay. Firebase Performance Monitoring for page load times and custom trace measurements (order placement duration, payment processing time). Alert thresholds for critical errors. `S`

16. [ ] Onboarding & Documentation - White-glove onboarding workflow for new tenants: subdomain selection, branding configuration (logo, colors), initial menu setup, payment gateway connection. Video tutorials and help documentation embedded in admin panel. Customer support email integration. `M`

## Future Enhancements (Post-Launch)

17. [ ] Delivery Module - Integration with third-party delivery platforms (Uber Eats, Deliveroo, Just Eat) via webhook APIs. In-house delivery driver assignment, real-time tracking with Google Maps integration, delivery radius and fee configuration. Customer delivery status updates. Packaged as £29/month add-on module. `XL`

18. [ ] Staff Management Module - Shift scheduling calendar, clock-in/clock-out time tracking, role-based permissions management, staff performance metrics (orders processed, average prep time). Labor cost analytics overlaid on sales data. Packaged as £39/month add-on module. `XL`

19. [ ] Accounting Integrations - Direct sync with QuickBooks, Xero, and Sage accounting platforms. Automated revenue reconciliation, expense categorization, VAT reporting for UK businesses. Packaged as £19/month add-on module. `L`

20. [ ] Mobile Native Apps - React Native iOS and Android apps for improved offline performance and push notification support. Native KDS app optimized for kitchen tablet display. Customer app with order history and loyalty program dashboard. `XL`

> Notes
> - Roadmap is ordered by technical dependencies and business priority
> - Each feature is end-to-end functional (frontend + backend + testing)
> - Phase 1 (Multi-Tenant Architecture) COMPLETED as of October 24, 2025
> - Phase 2, Item 2 (User Invitation System) COMPLETED as of October 25, 2025
>   - All features working end-to-end (create, send, validate, accept, cancel)
>   - Auto-login and redirect working
>   - Multi-tenant support implemented
>   - Ready for email service configuration and staging deployment
> - Phase 2, Item 3 (Offline Persistence) COMPLETED as of October 25, 2025
>   - Firestore offline persistence enabled with IndexedDB
>   - Intelligent cache priming on tenant load
>   - OfflineIndicator component with connection status
>   - Orders and menu data available offline
> - Phase 2, Item 4 (Dine-In Order Types) COMPLETED as of October 25, 2025
>   - Order type selection (Takeaway/Dine-In) in CartModal
>   - Table number and guest count inputs for dine-in
>   - Prominent KDS display with table badges
>   - Validation and error handling
> - **Phase 2 FULLY COMPLETE** - Moving to Phase 3 (Table Management Module)
> - Phase 2-5 align with 20-week implementation plan to £556 MRR target
> - Future enhancements are revenue-generating modules for post-launch growth
> - Effort estimates: XS (1 day), S (2-3 days), M (1 week), L (2 weeks), XL (3+ weeks)
