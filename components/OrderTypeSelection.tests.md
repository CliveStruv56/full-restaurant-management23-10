# OrderTypeSelection Component - Test Documentation

**Component:** OrderTypeSelection.tsx
**Task Group:** 5.1 - Intent and Order Type Selection Tests
**Date:** October 26, 2025

## Overview

This document describes the test cases for the OrderTypeSelection component. Since the project currently lacks test infrastructure (no Jest/Vitest configuration), these tests serve as documentation for future implementation and manual testing validation.

---

## Test Cases

### Test 1: OrderTypeSelection renders two buttons

**Purpose:** Verify component renders with correct structure

**Test Code (Future Implementation):**
```typescript
import { render, screen } from '@testing-library/react';
import { OrderTypeSelection } from './OrderTypeSelection';

test('OrderTypeSelection renders two buttons', () => {
  const mockCallback = jest.fn();
  render(<OrderTypeSelection onSelectType={mockCallback} />);

  // Check heading
  expect(screen.getByText('Will you be dining with us or taking away?')).toBeInTheDocument();

  // Check "Eat In" button
  expect(screen.getByText('Eat In')).toBeInTheDocument();
  expect(screen.getByText('Dine at our restaurant')).toBeInTheDocument();

  // Check "Take Away" button
  expect(screen.getByText('Take Away')).toBeInTheDocument();
  expect(screen.getByText('Order for pickup')).toBeInTheDocument();
});
```

**Manual Testing:**
1. Navigate to IntentSelection screen
2. Click "I'm Here Now"
3. Verify OrderTypeSelection renders
4. Verify two large buttons are displayed:
   - "Eat In" (blue, plate emoji 🍽️)
   - "Take Away" (orange, box emoji 📦)
5. Verify heading text: "Will you be dining with us or taking away?"
6. Verify sub-text under each button

**Expected Result:**
- Component renders with centered layout
- Two buttons visible with proper styling
- Heading and sub-text clearly readable

---

### Test 2: Clicking "Eat In" calls onSelectType('dine-in')

**Purpose:** Verify "Eat In" button triggers correct callback

**Test Code (Future Implementation):**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { OrderTypeSelection } from './OrderTypeSelection';

test('Clicking "Eat In" calls onSelectType with "dine-in"', () => {
  const mockCallback = jest.fn();
  render(<OrderTypeSelection onSelectType={mockCallback} />);

  // Click "Eat In" button
  const eatInButton = screen.getByText('Eat In');
  fireEvent.click(eatInButton);

  // Verify callback called with correct argument
  expect(mockCallback).toHaveBeenCalledTimes(1);
  expect(mockCallback).toHaveBeenCalledWith('dine-in');
});
```

**Manual Testing:**
1. Navigate to OrderTypeSelection screen
2. Click "Eat In" button
3. Verify navigation to menu screen (CustomerApp)
4. Check browser console or debug state to confirm `orderType` set to 'dine-in'
5. Verify menu shows dine-in products only

**Expected Result:**
- Callback fired with argument 'dine-in'
- Navigation proceeds to menu
- CustomerJourneyContext updated correctly

---

### Test 3: Clicking "Take Away" calls onSelectType('takeaway')

**Purpose:** Verify "Take Away" button triggers correct callback

**Test Code (Future Implementation):**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { OrderTypeSelection } from './OrderTypeSelection';

test('Clicking "Take Away" calls onSelectType with "takeaway"', () => {
  const mockCallback = jest.fn();
  render(<OrderTypeSelection onSelectType={mockCallback} />);

  // Click "Take Away" button
  const takeawayButton = screen.getByText('Take Away');
  fireEvent.click(takeawayButton);

  // Verify callback called with correct argument
  expect(mockCallback).toHaveBeenCalledTimes(1);
  expect(mockCallback).toHaveBeenCalledWith('takeaway');
});
```

**Manual Testing:**
1. Navigate to OrderTypeSelection screen
2. Click "Take Away" button
3. Verify navigation to menu screen (CustomerApp)
4. Check browser console or debug state to confirm `orderType` set to 'takeaway'
5. Verify menu shows takeaway products only

**Expected Result:**
- Callback fired with argument 'takeaway'
- Navigation proceeds to menu
- CustomerJourneyContext updated correctly

---

### Test 4: Buttons have correct hover effects

**Purpose:** Verify interactive hover states work correctly

**Test Code (Future Implementation):**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { OrderTypeSelection } from './OrderTypeSelection';

test('Buttons show hover effects', () => {
  const mockCallback = jest.fn();
  render(<OrderTypeSelection onSelectType={mockCallback} />);

  const eatInButton = screen.getByText('Eat In');

  // Get initial styles
  const initialTransform = window.getComputedStyle(eatInButton).transform;

  // Simulate hover
  fireEvent.mouseEnter(eatInButton);

  // Check transform applied (scale effect)
  const hoverTransform = window.getComputedStyle(eatInButton).transform;
  expect(hoverTransform).not.toBe(initialTransform);
});
```

**Manual Testing:**
1. Navigate to OrderTypeSelection screen
2. Hover mouse over "Eat In" button
3. Verify button scales up slightly (1.05x)
4. Verify shadow becomes more prominent (blue glow)
5. Move mouse away, verify button returns to normal
6. Hover over "Take Away" button
7. Verify button scales up with orange glow
8. Move mouse away, verify return to normal

**Expected Result:**
- Buttons scale up on hover (transform: scale(1.05))
- "Eat In": Blue shadow (rgba(52, 152, 219, 0.4))
- "Take Away": Orange shadow (rgba(230, 126, 34, 0.4))
- Smooth transition animation (0.3s)

---

### Test 5: Mobile responsive layout works

**Purpose:** Verify component adapts to mobile screens

**Manual Testing:**
1. Open browser DevTools
2. Toggle device emulation
3. Test on multiple viewports:
   - iPhone SE (320px width)
   - iPhone 12 Pro (390px width)
   - iPad (768px width)
   - Desktop (1024px+ width)

**Expected Results by Breakpoint:**

**Mobile (320px - 767px):**
- Buttons stacked vertically
- Heading font size: 24px
- Button min height: 120px
- Icon size: 40px
- Text size: 20px
- Sub-text size: 14px
- Proper spacing between buttons (20px gap)

**Tablet (768px - 1023px):**
- Buttons side-by-side (flex-direction: row)
- Heading font size: 28px
- Gap between buttons: 24px
- Icons and text at default sizes

**Desktop (1024px+):**
- Buttons side-by-side
- Heading font size: 32px
- Icon size: 56px
- Text size: 26px
- Maximum container width: 600px centered

---

### Test 6: Touch targets meet accessibility standards

**Purpose:** Verify buttons meet WCAG 2.1 touch target size requirements (min 44x44px)

**Manual Testing:**
1. Open on mobile device or touch-enabled device
2. Attempt to tap buttons with finger
3. Measure button heights using DevTools

**Expected Result:**
- Button min-height: 140px (far exceeds 44px requirement)
- Button min-width: 280px (exceeds requirement)
- Buttons easily tappable on touch devices
- No accidental mis-taps

---

## Integration Tests

### Test 7: Full flow from intent to order type to menu

**Purpose:** Verify complete navigation flow

**Manual Testing:**
1. Start at landing page (/)
2. Click "Continue to Order"
3. Click "I'm Here Now"
4. Verify OrderTypeSelection renders
5. Click "Eat In"
6. Verify menu renders with dine-in products
7. Go back to start
8. Repeat with "Take Away"
9. Verify menu renders with takeaway products

**Expected Result:**
- Smooth navigation between screens
- No errors in console
- Correct products filtered in menu
- State managed correctly by CustomerJourneyContext

---

### Test 8: QR code entry skips OrderTypeSelection

**Purpose:** Verify QR code flow bypasses order type selection

**Manual Testing:**
1. Navigate to `/order?table=5` (simulating QR code scan)
2. Verify app skips directly to menu
3. Verify orderType set to 'dine-in' automatically
4. Verify table number displayed in header
5. Verify no OrderTypeSelection screen shown

**Expected Result:**
- OrderTypeSelection completely skipped
- Menu displays immediately
- Table badge shows "Table 5"
- Only dine-in products visible

---

## Color Contrast & Accessibility Tests

### Test 9: Button colors meet WCAG contrast requirements

**Purpose:** Verify text on buttons is readable (WCAG AA: 4.5:1 ratio)

**Manual Testing:**
1. Navigate to OrderTypeSelection
2. Use Chrome DevTools or online contrast checker
3. Check contrast ratios:
   - "Eat In" button: White text (#ffffff) on Blue background (#3498db)
   - "Take Away" button: White text (#ffffff) on Orange background (#e67e22)

**Expected Result:**
- Both buttons have contrast ratio > 4.5:1
- Text clearly readable on both buttons
- Emoji icons clearly visible

---

### Test 10: Keyboard navigation works

**Purpose:** Verify keyboard accessibility

**Manual Testing:**
1. Navigate to OrderTypeSelection
2. Press Tab key to focus on first button
3. Press Tab again to focus on second button
4. Press Enter on focused button
5. Verify callback fires and navigation occurs

**Expected Result:**
- Buttons focusable via Tab key
- Enter key triggers onClick
- Visible focus indicators (browser default outline)
- Shift+Tab moves focus backwards

---

## Button Press Effects

### Test 11: Press effect on mousedown

**Purpose:** Verify button provides tactile feedback on press

**Manual Testing:**
1. Navigate to OrderTypeSelection
2. Click and hold "Eat In" button
3. Verify button scales down slightly (0.98x) while pressed
4. Release mouse
5. Verify button scales back to hover state (1.05x)
6. Repeat for "Take Away" button

**Expected Result:**
- Button scales down on mousedown (0.98x)
- Button scales back up on mouseup (1.05x)
- Smooth transition provides tactile feedback

---

## Summary

**Total Tests Defined:** 11 tests
**Tests Required:** 2-6 tests (per spec)
**Core Tests (Minimum):** Tests 1-4
**Additional Tests:** Tests 5-11 (manual/integration/accessibility)

**Status:** Test documentation complete. Manual testing required until test infrastructure is set up.

**Next Steps:**
1. Manual testing in browser
2. Set up Jest/Vitest when test infrastructure is added
3. Implement automated tests based on this documentation

---

## Notes

- Component follows same design patterns as IntentSelection for consistency
- Orange color (#e67e22) chosen for "Take Away" to differentiate from "Eat In" (blue)
- Both buttons have min 140px height for excellent touch accessibility
- Responsive breakpoints match LandingPage and IntentSelection components
