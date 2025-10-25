# Product Mission

## Pitch
OrderFlow is a modular, multi-tenant SaaS platform that helps small to medium restaurants and coffee shops streamline their entire operation - from customer ordering to kitchen management and business analytics - by providing an affordable, all-in-one system that replaces expensive legacy POS solutions with a flexible, cloud-based approach that grows with their business.

## Users

### Primary Customers
- **Independent Coffee Shops**: Single-location cafes and mobile coffee vendors seeking to modernize their ordering and payment systems
- **Small Restaurants**: Sit-down restaurants (2-50 seats) looking for table management, reservations, and streamlined kitchen operations
- **Multi-Unit Operators**: Restaurant and cafe chains with 2-5 locations requiring centralized management and consistent branding
- **Takeaway Specialists**: Food businesses focused on collection and delivery orders without dine-in service

### User Personas

**Sarah - Mobile Cafe Owner** (35-45)
- **Role:** Owner/Operator of a mobile coffee cart
- **Context:** Operates from 2-3 locations per week (markets, events, office parks)
- **Pain Points:** Managing orders during rush periods, tracking inventory across locations, processing payments efficiently, building customer loyalty
- **Goals:** Reduce order errors, speed up service, encourage repeat customers, simplify end-of-day reconciliation

**Marcus - Restaurant Manager** (30-40)
- **Role:** General Manager of a 30-seat neighborhood restaurant
- **Context:** Manages 8 tables, handles reservations, coordinates kitchen and front-of-house staff
- **Pain Points:** Double-bookings, inefficient table turnover, lack of real-time kitchen visibility, poor sales analytics
- **Goals:** Optimize table utilization, reduce customer wait times, improve staff coordination, understand peak hours and popular dishes

**Lisa - Finance-Conscious Owner** (40-55)
- **Role:** Owner of 3 cafe locations
- **Context:** Previously spent £400+/month on legacy POS systems and separate tools
- **Pain Points:** High software costs, incompatible systems across locations, difficult to get consolidated reports, expensive to add new features
- **Goals:** Reduce monthly software costs by 60%, centralize management, scale affordably, access business intelligence without hiring analysts

## The Problem

### Expensive Legacy POS Systems Lock Small Businesses Into Rigid, Costly Solutions
Traditional POS systems charge £150-300 per location per month, require expensive hardware purchases (£1,000-3,000 upfront), and force businesses to pay for features they don't need. Adding capabilities like table management, delivery integration, or analytics requires purchasing additional modules at premium prices or subscribing to entirely separate services. Small businesses end up spending £300-500/month across multiple disconnected tools, with no integration between them.

**Our Solution:** A modular SaaS architecture starting at just £49/month for core ordering functionality, with optional add-on modules (£29-39/month each) that businesses only pay for when they need them. Everything is cloud-based - no expensive hardware required. A typical restaurant saves £2,400-4,800 annually compared to legacy solutions.

### Inefficient Operations Lead to Lost Revenue and Poor Customer Experience
Without real-time coordination between front-of-house and kitchen staff, orders get lost, preparation times are unpredictable, and customers wait unnecessarily. Manual reservation systems lead to double-bookings and poor table utilization. Lack of inventory visibility results in selling items that are out of stock. Staff spend time on administrative tasks instead of serving customers.

**Our Solution:** Real-time Kitchen Display System ensures instant order communication. Smart table management algorithms optimize seating and prevent conflicts. Automated slot availability prevents overbooking during peak hours. Offline-first architecture ensures the system works even when internet is unreliable, critical for restaurants with spotty WiFi.

### No Actionable Business Intelligence
Most small business owners operate on gut feel rather than data. They don't know which menu items are profitable, when their true peak hours are, or which customers are their most valuable. Legacy systems either don't provide analytics, or hide them behind complex dashboards that require training to understand.

**Our Solution:** Simple, visual analytics dashboard showing revenue trends, top-selling products, peak hours, and customer loyalty metrics. Exportable reports in CSV format for accounting integration. Mobile-optimized so owners can check performance from anywhere.

## Differentiators

### Modular Pricing - Pay Only For What You Need
Unlike competitors who force you into expensive all-in-one packages, we offer a base ordering system (£49/month) with optional add-on modules. A mobile cafe only needs the base module. A restaurant adds Table Management (£29/month) for reservations and floor plans. Growing businesses add the Management Module (£39/month) for analytics when they're ready. This approach makes us accessible to the smallest businesses while scaling with them as they grow.

This results in 40-60% cost savings compared to traditional POS systems, with the flexibility to add capabilities without switching platforms.

### True Multi-Tenant Architecture Built for Independent Brands
Most "white-label" solutions are actually single-tenant systems with cosmetic customization. We've built multi-tenancy from the ground up, with complete data isolation, subdomain-based deployment (clientname.orderflow.app), and full branding control (colors, logos, custom landing pages). Each tenant operates as if they have their own dedicated system, while benefiting from shared infrastructure that keeps costs low.

This results in enterprise-grade isolation and customization at SMB prices, with the ability to deploy a new client in minutes rather than days.

### Offline-First Architecture for Real-World Restaurant Environments
Restaurant WiFi is notoriously unreliable. Competitors fail when the connection drops, leading to lost orders and frustrated staff. Our system uses intelligent cache priming and Firestore offline persistence to ensure critical operations (viewing menus, taking orders, updating order status) work even when offline. Changes sync automatically when connectivity returns.

This results in 99.9%+ operational uptime from the staff perspective, eliminating "the system is down" as an excuse for poor service.

### Pluggable Payment Gateway Architecture
Most systems lock you into a single payment processor (often with unfavorable rates). We've built an abstraction layer that supports Stripe, Square, and custom integrations. Tenants choose their preferred gateway and configure it via admin settings. If they negotiate better rates with a different processor, they can switch without our involvement.

This results in payment processing flexibility that can save businesses 0.3-0.5% in transaction fees (£300-500 annually for a £100k/year business).

## Key Features

### Core Features (Base Module - £49/month)
- **Real-Time Menu Management:** Admin creates categories, products, and customization options (sizes, add-ons). Changes appear instantly on customer-facing app. Supports image uploads to Firebase Storage.
- **Smart Ordering System:** Customers browse menu, customize items, add to cart. Collection time slots calculated in real-time based on store hours, lead times, and order capacity. Prevents overbooking.
- **Kitchen Display System (KDS):** Real-time order board with three columns (New, Preparing, Ready). Visual priority cues for time-sensitive orders. One-click status updates that sync instantly to customer view.
- **Customer Loyalty Program:** Configurable points system. Customers earn points per purchase and redeem for free items. Admin sets earning rate and redemption thresholds.
- **AI-Powered Daily Specials:** Google Gemini API generates unique daily drink and pastry pairings with creative descriptions, adding a "wow factor" to the customer experience.
- **Multi-Tenant Foundation:** Subdomain-based routing, complete data isolation, tenant-specific branding and settings.

### Table Management Features (Table Module - £29/month)
- **Visual Floor Plan Builder:** Drag-and-drop interface for creating restaurant layouts. Support for different table shapes, capacities, and mergeable table configurations for large parties.
- **Reservation System:** Customer-facing booking form with date/time/party size selection. Real-time availability calculation based on service periods and table turnover times.
- **Auto-Assignment Algorithm:** Intelligently assigns tables based on party size, existing reservations, and table merging rules. Prevents double-bookings and optimizes seating.
- **Dine-In Order Tracking:** Links orders to specific tables. KDS displays table numbers prominently. Waitstaff can track which tables have orders in progress.
- **Service Period Configuration:** Define lunch and dinner periods with different operating hours, slot intervals, and turn times by day of week.

### Analytics & Reporting Features (Management Module - £39/month)
- **Sales Dashboard:** Revenue trending (daily, weekly, monthly) with interactive charts. Average order value, order type breakdown (dine-in vs. takeaway), top 10 selling products.
- **Visitor Tracking:** Customer count by service period, peak hours heat map, average party size, table occupancy rates (for table module users).
- **Customer Retention Metrics:** Repeat customer identification, loyalty program engagement rates, customer lifetime value estimates.
- **Exportable Reports:** CSV export of all data for accounting software integration (QuickBooks, Xero).

### Payment & Security Features (Included in Base Module)
- **Pluggable Payment Gateway:** Abstraction layer supporting Stripe, Square, and custom integrations. Admin configures via settings panel with API keys stored securely.
- **Secure Multi-Tenant Isolation:** Firestore security rules enforce tenant boundaries. Role-based access control (customer, staff, admin). Audit logs for sensitive operations.
- **Offline Resilience:** Intelligent cache priming ensures menus, orders, and settings are available offline. Queued mutations sync when connectivity returns.

## Future Modules & Expansion

### Delivery Module (Planned - £29/month)
- Integration with third-party delivery platforms (Uber Eats, Deliveroo, Just Eat)
- In-house delivery driver assignment and tracking
- Delivery radius and fee configuration
- Real-time delivery status updates for customers

### Staff Management Module (Planned - £39/month)
- Shift scheduling and time tracking
- Role-based permissions management
- Staff performance metrics (orders processed, average preparation time)
- Labor cost analytics integrated with sales data

### Accounting Integrations (Planned - £19/month)
- Direct sync with QuickBooks, Xero, and Sage
- Automated revenue reconciliation
- Expense categorization
- Tax reporting support for VAT and other regional requirements

## Success Criteria

We will know we've succeeded when:

1. **Customer Adoption:** 10+ paying tenants by Month 6, 30+ by Month 12, with less than 10% monthly churn
2. **Cost Savings:** Customers report average savings of £200+/month compared to previous solutions
3. **Operational Efficiency:** Restaurants report 20%+ reduction in order processing time and 15%+ improvement in table turnover (for table module users)
4. **Customer Satisfaction:** Net Promoter Score (NPS) above 50, with 80%+ of customers rating the system "easy to use"
5. **Revenue Growth:** £517 MRR by Month 5, £780 MRR by Month 6, scaling to £2,000+ MRR by Month 12
6. **Feature Validation:** 60%+ of base module users upgrade to at least one additional module within 6 months

## Geographic Focus

**Initial Market:** United Kingdom
- Pricing in GBP (£)
- Payment gateway support for UK merchants
- Business hours and date formats optimized for UK conventions
- Initial customer acquisition focused on London and Southeast England

**Expansion Markets (Year 2):**
- Ireland, Netherlands, Germany (EUR pricing)
- United States (USD pricing, state tax handling)
- Australia, New Zealand (AUD/NZD pricing)
