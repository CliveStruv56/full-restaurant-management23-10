# LandingPageSettings Component - Test Documentation

## Overview
This document describes the test scenarios for the LandingPageSettings component. These tests would be implemented once the project has testing infrastructure (Jest + React Testing Library).

## Test Suite: LandingPageSettings Component

### Test 1: Render LandingPageSettings component
**Purpose:** Verify the component renders all required sections and form fields

**Steps:**
1. Render the LandingPageSettings component with mock settings
2. Check if main heading "Landing Page Settings" is displayed
3. Verify "Branding" section header is rendered
4. Verify "Content" section header is rendered
5. Confirm all form fields are present:
   - Logo Image file input
   - Hero Image file input
   - Primary Brand Color picker
   - Tagline text input
   - Address textarea
   - Phone tel input
   - Email email input

**Expected Result:** All sections and form fields render correctly

---

### Test 2: Upload logo image successfully
**Purpose:** Verify logo image upload workflow

**Setup:**
- Mock `uploadBrandingImage()` to return a test URL
- Mock `updateLandingPageSettings()` to resolve successfully

**Steps:**
1. Render the component
2. Select a logo image file (PNG, < 5MB)
3. Verify preview image updates
4. Click "Save Settings" button
5. Wait for upload to complete

**Expected Result:**
- `uploadBrandingImage()` called with correct parameters: `(tenantId, file, 'logo')`
- `updateLandingPageSettings()` called with new logo URL
- Success toast appears: "Settings saved!"

---

### Test 3: Color picker updates primaryColor
**Purpose:** Verify the color picker updates the primary color state

**Steps:**
1. Render the component with initial color #3498db
2. Find the color picker input
3. Change color to #e74c3c
4. Verify the input value updates to #e74c3c
5. Verify the hex text input also shows #e74c3c

**Expected Result:** Both color picker and text input show the updated color

---

### Test 4: Save settings and show success toast
**Purpose:** Verify save functionality and success feedback

**Setup:**
- Mock `updateLandingPageSettings()` to resolve successfully

**Steps:**
1. Render the component
2. Change the tagline to "New tagline for testing"
3. Click "Save Settings" button
4. Wait for save operation

**Expected Result:**
- `updateLandingPageSettings()` called with updated settings including new tagline
- Success message "Settings saved!" appears
- Success message disappears after 3 seconds

---

### Test 5: Tagline character counter
**Purpose:** Verify character counter updates and enforces max length

**Steps:**
1. Render the component with tagline "Welcome to our restaurant!" (30 chars)
2. Verify character counter shows "30/200"
3. Change tagline to 150 'A' characters
4. Verify counter shows "150/200"
5. Attempt to type beyond 200 characters
6. Verify input stops at 200 characters

**Expected Result:**
- Character counter updates in real-time
- Counter turns red when approaching limit
- maxLength attribute prevents exceeding 200 characters

---

### Test 6: Preview button opens modal
**Purpose:** Verify preview functionality shows landing page preview

**Steps:**
1. Render the component with complete settings
2. Click the "Preview" button
3. Verify modal overlay appears
4. Check modal title "Landing Page Preview" is displayed
5. Verify preview shows:
   - Logo image (if set)
   - Hero image background
   - Business name in heading
   - Tagline
   - Address and contact info
   - "Continue to Order" button with primary color

**Expected Result:** Preview modal displays with accurate rendering of current settings

---

## Manual Testing Checklist

Since automated tests are not yet implemented, perform these manual tests:

### Image Upload Tests
- [ ] Upload logo image < 5MB - succeeds
- [ ] Upload logo image > 5MB - shows error
- [ ] Upload non-image file - shows error
- [ ] Upload hero image < 5MB - succeeds
- [ ] Preview updates immediately after file selection
- [ ] Save uploads both images and updates Firestore

### Form Validation Tests
- [ ] Tagline limited to 200 characters
- [ ] Character counter updates correctly
- [ ] Email field validates email format (HTML5)
- [ ] Phone field accepts tel format
- [ ] All optional fields can be empty

### State Management Tests
- [ ] Unsaved changes badge appears when form modified
- [ ] Floating save button appears with unsaved changes
- [ ] Save button disabled when no changes
- [ ] Loading state shows "Saving..." during upload
- [ ] Form resets after successful save
- [ ] Browser warning when leaving page with unsaved changes

### Preview Tests
- [ ] Preview button opens modal
- [ ] Preview shows current form values (not saved values)
- [ ] Preview updates when form changes
- [ ] Close button dismisses preview modal
- [ ] Modal overlay clickable to close

### Integration Tests
- [ ] Component accessible from AdminPanel "Landing Page" tab
- [ ] Settings persist to Firestore correctly
- [ ] Images upload to Storage at correct path: `tenants/{tenantId}/branding/`
- [ ] Multiple tenants have isolated settings
- [ ] Page loads existing settings correctly

---

## Test Data

### Mock Settings Object
```typescript
{
  landingPage: {
    logoUrl: 'https://example.com/logo.png',
    heroImageUrl: 'https://example.com/hero.jpg',
    primaryColor: '#3498db',
    tagline: 'Welcome to our restaurant!',
    address: '123 Main St, City, State',
    phone: '+1 (555) 123-4567',
    email: 'info@restaurant.com',
  }
}
```

### Mock Tenant
```typescript
{
  id: 'test-tenant',
  businessName: 'Test Restaurant',
  subdomain: 'test-restaurant'
}
```

---

## Notes for Future Test Implementation

When adding Jest + React Testing Library:

1. Install dependencies:
   ```bash
   npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest @types/jest
   ```

2. Mock Firebase functions in `__mocks__` directory

3. Mock TenantContext with `jest.mock('../../contexts/TenantContext')`

4. Use `waitFor` for async operations (upload, save)

5. Use `fireEvent` or `userEvent` for user interactions

6. Test file location: `components/admin/LandingPageSettings.test.tsx`

---

**Test Documentation Status:** Complete
**Date:** October 26, 2025
**Component Status:** Implemented and ready for testing
