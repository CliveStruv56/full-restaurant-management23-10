# Tech Stack

This document defines the complete technical stack for the Restaurant Management System SaaS platform. All technology choices are optimized for rapid development, scalability, and cost-effectiveness for a multi-tenant architecture.

## Framework & Runtime
- **Application Framework:** Vite 5.x - Modern build tool providing fast HMR and optimized production builds
- **Language/Runtime:** TypeScript 5.x - Type-safe JavaScript with excellent IDE support
- **Package Manager:** npm - Standard Node.js package manager

## Frontend

### Core Framework
- **JavaScript Framework:** React 18.2.0 - Component-based UI framework with hooks and concurrent features
- **Type System:** TypeScript - Full type coverage across components, contexts, and API functions

### UI & Styling
- **CSS Framework:** Custom CSS with CSS Variables - Scoped styles defined in `styles.ts` and applied inline
- **Animation Library:** Framer Motion - Declarative animations for modals, transitions, and micro-interactions
- **UI Component Library:** Custom components - Purpose-built for restaurant/cafe workflows

### Forms & User Input
- **Form Management:** React Hook Form - Performant form handling with validation
- **Notifications:** React Hot Toast - Toast notification system for user feedback

## Backend & Database

### Database
- **Primary Database:** Firebase Firestore - Serverless NoSQL cloud database with real-time sync
- **Database Architecture:** Multi-tenant with subdomain-based routing
- **Data Structure:**
  - `/tenantMetadata/{tenantId}` - Tenant configuration and subscription info
  - `/tenants/{tenantId}/*` - Tenant-scoped collections (products, categories, orders, settings)
  - `/users/{userId}` - Global user collection with tenantId reference
- **Caching:** Firestore offline persistence with intelligent cache priming

### Authentication & Authorization
- **Auth Provider:** Firebase Authentication - Supports email/password, social providers
- **Authorization Model:** Role-based access control (customer, staff, admin)
- **Tenant Isolation:** Security rules enforce cross-tenant data boundaries

### File Storage
- **Storage Backend:** Firebase Storage - Scalable object storage for product images
- **Storage Structure:** `/tenants/{tenantId}/product-images/{imageId}` - Tenant-scoped image paths
- **Access Control:** Storage security rules linked to Firestore tenant permissions

### Serverless Functions
- **Functions Platform:** Firebase Cloud Functions - Serverless Node.js runtime for backend logic
- **Use Cases:**
  - User invitation email sending
  - Payment processing (Stripe/Square integration)
  - Scheduled tasks (e.g., daily special generation)
  - Webhook receivers (payment confirmations, delivery integrations)

## Third-Party Services

### AI & Machine Learning
- **AI Provider:** Google Generative AI (@google/genai) - Gemini API for content generation
- **Use Case:** Daily Special generation with structured JSON output

### Payment Processing
- **Payment Gateways:**
  - Stripe - Primary payment processor for card payments
  - Square - Alternative processor for merchants with existing Square hardware
- **Integration Architecture:** Pluggable gateway abstraction layer in TypeScript
- **PCI Compliance:** Tokenization handled by gateway SDKs (no card data stored)

### Email Services
- **Email Provider:** SendGrid or Mailgun (to be configured)
- **Use Cases:**
  - User invitation emails
  - Reservation confirmations
  - Order receipts
  - Marketing campaigns (future)

### SMS Services (Optional)
- **SMS Provider:** Twilio
- **Use Cases:**
  - Reservation reminders
  - Order ready notifications

## Testing & Quality

### Testing Framework
- **Unit Testing:** Vitest - Fast Vite-native test runner
- **Component Testing:** React Testing Library - User-centric component tests
- **Security Testing:** Firebase Emulator Suite - Local testing of security rules

### Code Quality
- **Linting:** ESLint (to be configured)
- **Formatting:** Prettier (to be configured)
- **Type Checking:** TypeScript compiler in strict mode

## Deployment & Infrastructure

### Hosting
- **Frontend Hosting:** Firebase Hosting - CDN-backed static site hosting with custom domain support
- **Subdomain Routing:** Configured via Firebase Hosting rewrites and tenant detection logic
- **SSL/TLS:** Automatic via Firebase Hosting

### CI/CD
- **Pipeline Platform:** GitHub Actions (to be configured)
- **Workflow:**
  - Automated tests on PR
  - Staging deployment on merge to `staging` branch
  - Production deployment on merge to `main` branch
- **Environments:**
  - **Staging:** `*.staging.orderflow.app` - Firebase project: `restaurant-mgmt-staging`
  - **Production:** `*.orderflow.app` - Firebase project: `restaurant-mgmt-prod`

### Monitoring & Observability
- **Error Tracking:** Sentry (to be configured) - Real-time error monitoring with session replay
- **Performance Monitoring:** Firebase Performance Monitoring - Page load times, custom traces
- **Analytics:** Firebase Analytics - User behavior and conversion tracking
- **Uptime Monitoring:** Firebase status dashboard

## Development Tools

### Development Environment
- **Dev Server:** Vite dev server with HMR on port 5173
- **Local Testing:** Firebase Emulator Suite for Firestore, Auth, Functions, Storage
- **Browser Support:** Modern browsers (Chrome, Firefox, Safari, Edge) with ES2020+ support

### Version Control
- **Repository Hosting:** GitHub
- **Branching Strategy:**
  - `main` - Production branch
  - `staging` - Pre-production testing branch
  - `feature/*` - Feature development branches
- **Commit Standards:** Conventional Commits format

### IDEs & Extensions
- **Recommended IDE:** VS Code
- **Key Extensions:**
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Firebase Explorer
  - GitLens

## Architecture Decisions

### Multi-Tenancy Approach
- **Model:** Subdomain-based (e.g., `client1.orderflow.app`, `client2.orderflow.app`)
- **Data Isolation:** Firestore collections scoped to `tenantId`
- **Security:** Security rules enforce tenant boundaries at database level
- **Scalability:** Supports 100+ tenants on shared infrastructure

### Offline-First Strategy
- **Cache Priming:** Critical data (menu, settings, today's orders) loaded on app start
- **Offline Writes:** Firestore queues mutations and syncs when online
- **UI Indicators:** Offline status banner, optimistic UI updates
- **Limitations:** Payment processing requires online connectivity

### Modular Architecture
- **Base Module:** Core ordering system (products, orders, KDS, loyalty)
- **Table Module:** Floor plans, reservations, availability algorithm
- **Management Module:** Analytics, reporting, export functions
- **Payment Processing:** Included in base, but gateway-agnostic
- **Future Modules:** Delivery, Staff Management, Accounting Integrations

## Security Considerations

### Data Protection
- **Encryption at Rest:** Firestore and Storage provide automatic encryption
- **Encryption in Transit:** All connections use HTTPS/TLS 1.3
- **Secrets Management:** Environment variables, Firebase secret manager for Cloud Functions
- **Payment Data:** Never stored in Firestore; tokenization via gateway SDKs

### Authentication Security
- **Password Policy:** Minimum 8 characters, Firebase Auth enforces complexity
- **Session Management:** Firebase Auth JWT tokens with automatic refresh
- **Role Verification:** Security rules verify user role on every request
- **Audit Logging:** Admin actions logged to Firestore for compliance

### Compliance
- **GDPR:** Data export and deletion capabilities for EU customers
- **PCI DSS:** Payment processing via compliant gateways (Stripe, Square)
- **Data Retention:** Configurable retention policies per tenant

## Performance Targets

### Frontend Performance
- **Page Load Time:** < 2 seconds on 3G connection
- **Time to Interactive:** < 3 seconds
- **First Contentful Paint:** < 1.5 seconds
- **Lighthouse Score:** > 90 (Performance, Accessibility, Best Practices)

### Backend Performance
- **API Response Time:** < 500ms (p95)
- **Real-Time Sync Latency:** < 200ms (Firestore streaming)
- **Payment Processing:** < 2 seconds (end-to-end)
- **Database Query Time:** < 100ms (p95) with proper indexing

### Scalability Targets
- **Concurrent Users:** 1,000+ per tenant during peak hours
- **Total Tenants:** 100+ on shared Firebase project
- **Orders per Day:** 10,000+ across all tenants
- **Database Reads:** <1M per day (within free tier initially)

## Cost Structure (Estimated)

### Firebase Costs (per month)
- **Firestore:** ~£25 for 1M reads, 300K writes (typical for 20 tenants)
- **Hosting:** Free (within 10GB/month bandwidth limit)
- **Storage:** ~£5 for 50GB of product images
- **Functions:** ~£10 for 1M invocations
- **Authentication:** Free (within 10K MAU limit)
- **Total Firebase:** ~£40/month for 20 active tenants

### Third-Party Service Costs
- **Gemini API:** ~£5/month for daily special generation
- **Email (SendGrid):** ~£15/month for 40K emails
- **Sentry:** ~£26/month (team plan)
- **Total Third-Party:** ~£46/month

### Total Infrastructure Cost: ~£86/month for 20 tenants (£4.30 per tenant)

### Revenue vs. Cost at Scale
- **20 Tenants at £78 average MRR:** £1,560 monthly revenue
- **Infrastructure Cost:** £86/month
- **Gross Margin:** ~94.5%

---

**Document Version:** 1.0
**Last Updated:** October 25, 2025
**Maintained By:** Product & Engineering Team
**Next Review:** January 2026
