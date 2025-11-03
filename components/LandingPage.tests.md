# LandingPage Component - Test Documentation

**Component:** `LandingPage.tsx`
**Location:** `/Users/clivestruver/Projects/restaurant-management-system/components/LandingPage.tsx`
**Date:** October 26, 2025
**Status:** Test documentation complete (project lacks test infrastructure)

---

## Overview

This document describes the focused tests that should be implemented for the `LandingPage` component once the project has test infrastructure in place. The component is customer-facing and serves as the entry point for the ordering flow.

---

## Test Suite: LandingPage Component (3.1)

### Test 1: Render LandingPage with default settings

**Purpose:** Verify that the component renders correctly when settings are missing or not configured.

**Setup:**
- Mock TenantContext with basic tenant data (no landing page settings)
- Mock Firestore to return null or empty landingPage settings
- Render LandingPage component

**Assertions:**
- Component renders without errors
- Business name displays from tenant metadata
- Default primary color (#3498db) is applied to hero section
- Default tagline displays: "Welcome to [businessName]!"
- CTA button renders with text "Continue to Order"
- No logo or hero image displays (graceful degradation)
- Operating hours display (from weekSchedule)

**Code Sketch:**
```typescript
test('renders LandingPage with default settings', async () => {
    const mockTenant = {
        id: 'test-tenant',
        businessName: 'Test Cafe',
    };

    const mockSettings = {
        weekSchedule: {
            monday: { isOpen: true, openingHour: 8, closingHour: 17 },
            // ... other days
        },
        // No landingPage field
    };

    mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockSettings
    });

    const { getByText, queryByAltText } = render(
        <TenantContext.Provider value={{ tenant: mockTenant }}>
            <LandingPage onContinue={mockOnContinue} />
        </TenantContext.Provider>
    );

    await waitFor(() => {
        expect(getByText('Test Cafe')).toBeInTheDocument();
        expect(getByText(/Welcome to Test Cafe/i)).toBeInTheDocument();
        expect(getByText('Continue to Order')).toBeInTheDocument();
        expect(queryByAltText(/logo/i)).not.toBeInTheDocument();
    });
});
```

---

### Test 2: Display custom logo and hero image

**Purpose:** Verify that custom branding images display correctly when configured.

**Setup:**
- Mock TenantContext with tenant data
- Mock Firestore to return settings with landingPage.logoUrl and heroImageUrl
- Render LandingPage component

**Assertions:**
- Logo image renders with correct src attribute
- Logo has alt text with business name
- Hero section has background image from heroImageUrl
- Hero overlay renders for better text readability
- Images have lazy loading attribute

**Code Sketch:**
```typescript
test('displays custom logo and hero image', async () => {
    const mockTenant = {
        id: 'test-tenant',
        businessName: 'Test Restaurant',
    };

    const mockSettings = {
        landingPage: {
            logoUrl: 'https://example.com/logo.png',
            heroImageUrl: 'https://example.com/hero.jpg',
            primaryColor: '#e74c3c',
            tagline: 'Best food in town!',
        },
        weekSchedule: { /* ... */ },
    };

    mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockSettings
    });

    const { getByAltText, container } = render(
        <TenantContext.Provider value={{ tenant: mockTenant }}>
            <LandingPage onContinue={mockOnContinue} />
        </TenantContext.Provider>
    );

    await waitFor(() => {
        const logo = getByAltText(/Test Restaurant logo/i);
        expect(logo).toHaveAttribute('src', 'https://example.com/logo.png');
        expect(logo).toHaveAttribute('loading', 'lazy');

        const heroSection = container.querySelector('section');
        expect(heroSection).toHaveStyle({
            backgroundImage: 'url(https://example.com/hero.jpg)',
        });
    });
});
```

---

### Test 3: "Continue to Order" button navigation

**Purpose:** Verify that the CTA button calls the onContinue callback when clicked.

**Setup:**
- Mock TenantContext
- Mock Firestore to return basic settings
- Mock onContinue callback function
- Render LandingPage component

**Assertions:**
- CTA button is clickable
- onContinue callback is called exactly once when clicked
- Button has appropriate hover effects (tested via style changes)

**Code Sketch:**
```typescript
test('Continue to Order button triggers navigation', async () => {
    const mockOnContinue = jest.fn();
    const mockTenant = { id: 'test-tenant', businessName: 'Test Cafe' };
    const mockSettings = { weekSchedule: { /* ... */ } };

    mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockSettings
    });

    const { getByText } = render(
        <TenantContext.Provider value={{ tenant: mockTenant }}>
            <LandingPage onContinue={mockOnContinue} />
        </TenantContext.Provider>
    );

    await waitFor(() => {
        const button = getByText('Continue to Order');
        expect(button).toBeInTheDocument();
    });

    const button = getByText('Continue to Order');
    fireEvent.click(button);

    expect(mockOnContinue).toHaveBeenCalledTimes(1);
});
```

---

### Test 4: Mobile responsive layout

**Purpose:** Verify that the component is mobile-responsive and displays correctly on different screen sizes.

**Setup:**
- Mock TenantContext and Firestore
- Render LandingPage component
- Change viewport size to mobile, tablet, desktop

**Assertions:**
- On mobile (320px):
  - Hero section is full-screen (100vh)
  - Info cards stack vertically (1 column)
  - Logo max height is 80px
  - Font sizes are appropriate (24px tagline)
- On tablet (768px):
  - Info cards display in auto-fit grid
  - Logo max height is 100px
  - Font sizes increase (28px tagline)
- On desktop (1024px):
  - Info section shows 3 columns
  - Hero section has auto height with padding
  - Logo max height is 120px
  - Font sizes are largest (32px tagline)

**Code Sketch:**
```typescript
test('renders responsively on different screen sizes', async () => {
    const mockTenant = { id: 'test-tenant', businessName: 'Test Restaurant' };
    const mockSettings = {
        landingPage: {
            logoUrl: 'https://example.com/logo.png',
            tagline: 'Best food in town!',
        },
        weekSchedule: { /* ... */ },
    };

    mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockSettings
    });

    // Mobile view
    global.innerWidth = 375;
    global.innerHeight = 667;
    global.dispatchEvent(new Event('resize'));

    const { container, rerender, getByAltText } = render(
        <TenantContext.Provider value={{ tenant: mockTenant }}>
            <LandingPage onContinue={mockOnContinue} />
        </TenantContext.Provider>
    );

    await waitFor(() => {
        const logo = getByAltText(/logo/i);
        const computedStyle = window.getComputedStyle(logo);
        expect(parseInt(computedStyle.maxHeight)).toBeLessThanOrEqual(80);
    });

    // Desktop view
    global.innerWidth = 1920;
    global.innerHeight = 1080;
    global.dispatchEvent(new Event('resize'));

    rerender(
        <TenantContext.Provider value={{ tenant: mockTenant }}>
            <LandingPage onContinue={mockOnContinue} />
        </TenantContext.Provider>
    );

    // Check for 3-column layout on desktop
    const infoSection = container.querySelector('[style*="grid-template-columns"]');
    expect(infoSection).toBeInTheDocument();
});
```

---

## Additional Test Scenarios

### Test 5: Format operating hours correctly

**Purpose:** Verify that the formatOperatingHours function correctly formats weekSchedule data.

**Test Cases:**
- Single day open: "Mon: 8:00 - 17:00"
- Consecutive days with same hours: "Mon-Fri: 8:00 - 17:00"
- Multiple ranges: "Mon-Fri: 8:00 - 17:00 • Sat-Sun: 9:00 - 15:00"
- All days closed: "Closed"
- Mixed open days: "Mon: 8:00 - 17:00 • Wed: 10:00 - 14:00 • Fri: 8:00 - 20:00"

---

### Test 6: Handle missing contact information gracefully

**Purpose:** Verify that contact cards only display when data is available.

**Assertions:**
- If address is null/undefined, location card does not render
- If phone and email are both null/undefined, contact card does not render
- If only phone is provided, contact card shows phone only
- If only email is provided, contact card shows email only

---

### Test 7: Loading state displays skeleton

**Purpose:** Verify that a loading skeleton displays while fetching settings.

**Assertions:**
- Skeleton hero section renders
- Skeleton info cards render (3 cards)
- No actual content displays during loading
- Loading state clears after data fetch completes

---

### Test 8: Error handling for Firestore fetch failure

**Purpose:** Verify that component handles Firestore errors gracefully.

**Setup:**
- Mock Firestore to throw an error
- Render LandingPage component

**Assertions:**
- Component renders without crashing
- Default values display
- Error is logged to console
- User sees functional landing page despite error

---

## Manual Testing Checklist

Since automated tests are not yet implemented, perform the following manual tests:

### Visual Tests
- [ ] Landing page displays correctly on iPhone (Safari)
- [ ] Landing page displays correctly on Android (Chrome)
- [ ] Landing page displays correctly on iPad (Safari)
- [ ] Landing page displays correctly on Desktop (Chrome, Firefox)
- [ ] Logo displays at correct size on all devices
- [ ] Hero image covers section without distortion
- [ ] Text is readable over hero image (overlay works)
- [ ] Info cards are properly aligned and spaced
- [ ] CTA button is centered and prominent

### Functional Tests
- [ ] "Continue to Order" button triggers navigation
- [ ] Hover effect on CTA button works smoothly
- [ ] Operating hours display correctly formatted
- [ ] Contact information displays (if configured)
- [ ] Component loads in under 2 seconds
- [ ] Images load correctly (or gracefully skip if missing)
- [ ] Component works without landingPage settings (defaults)

### Responsive Tests
- [ ] At 320px width: Single column layout, full-screen hero
- [ ] At 768px width: Multi-column info section, larger fonts
- [ ] At 1024px width: 3-column info section, largest fonts
- [ ] Smooth transitions between breakpoints
- [ ] Text remains readable at all sizes
- [ ] Button remains touch-friendly (min 44x44px)

### Accessibility Tests
- [ ] Logo has appropriate alt text
- [ ] Button is keyboard-accessible (can tab to it)
- [ ] Color contrast ratio ≥4.5:1 for all text
- [ ] Screen reader announces content correctly
- [ ] Focus indicators are visible

---

## Performance Benchmarks

Target metrics:
- **Initial Load Time:** <2 seconds on 3G
- **Time to Interactive:** <3 seconds
- **Largest Contentful Paint:** <2.5 seconds
- **Cumulative Layout Shift:** <0.1
- **Hero Image Size:** <500KB (optimize before upload)
- **Logo Image Size:** <100KB (optimize before upload)

---

## Implementation Notes

**Dependencies:**
- TenantContext for tenant metadata
- Firebase Firestore for settings data
- React hooks (useState, useEffect)

**Key Features:**
- Lazy loading for images
- Skeleton loading state
- Graceful degradation for missing data
- Mobile-first responsive design
- Hover effects on CTA button
- Dynamic color theming

**Data Flow:**
1. Component mounts
2. Fetches tenant settings from Firestore
3. Displays loading skeleton
4. Renders landing page with settings or defaults
5. User clicks "Continue to Order"
6. onContinue callback triggers navigation

---

## Status

**Test Documentation:** ✅ Complete
**Test Implementation:** ⏳ Pending (awaiting test infrastructure)
**Component Implementation:** ✅ Complete
**Manual Testing:** ⏳ Required before deployment

---

## Next Steps

1. Set up test infrastructure (Jest, React Testing Library)
2. Implement tests from this document
3. Run manual tests on multiple devices
4. Verify performance benchmarks
5. Test with real tenant data in staging environment

---

**Document Author:** Claude Agent
**Last Updated:** October 26, 2025
**Related Files:**
- Component: `/Users/clivestruver/Projects/restaurant-management-system/components/LandingPage.tsx`
- Types: `/Users/clivestruver/Projects/restaurant-management-system/types.ts`
- Context: `/Users/clivestruver/Projects/restaurant-management-system/contexts/TenantContext.tsx`
