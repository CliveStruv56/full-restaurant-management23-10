# IntentSelection Component - Test Documentation

**Component:** IntentSelection.tsx
**Task Group:** 5.1 - Intent and Order Type Selection Tests
**Date:** October 26, 2025

## Overview

This document describes the test cases for the IntentSelection component. Since the project currently lacks test infrastructure (no Jest/Vitest configuration), these tests serve as documentation for future implementation and manual testing validation.

---

## Test Cases

### Test 1: IntentSelection renders two buttons

**Purpose:** Verify component renders with correct structure

**Test Code (Future Implementation):**
```typescript
import { render, screen } from '@testing-library/react';
import { IntentSelection } from './IntentSelection';

test('IntentSelection renders two buttons', () => {
  const mockCallback = jest.fn();
  render(<IntentSelection onSelectIntent={mockCallback} />);

  // Check heading
  expect(screen.getByText('How can we serve you today?')).toBeInTheDocument();

  // Check "Here Now" button
  expect(screen.getByText("I'm Here Now")).toBeInTheDocument();
  expect(screen.getByText('Order for pickup or dine-in')).toBeInTheDocument();

  // Check "Book Later" button
  expect(screen.getByText('Book for Later')).toBeInTheDocument();
  expect(screen.getByText('Reserve a table')).toBeInTheDocument();
});
```

**Manual Testing:**
1. Open browser to landing page
2. Click "Continue to Order"
3. Verify two large buttons are displayed:
   - "I'm Here Now" (green, clock emoji 🕐)
   - "Book for Later" (blue, calendar emoji 📅)
4. Verify heading text: "How can we serve you today?"
5. Verify sub-text under each button

**Expected Result:**
- Component renders with centered layout
- Two buttons visible with proper styling
- Heading and sub-text clearly readable

---

### Test 2: Clicking "Here Now" calls onSelectIntent('now')

**Purpose:** Verify "Here Now" button triggers correct callback

**Test Code (Future Implementation):**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { IntentSelection } from './IntentSelection';

test('Clicking "Here Now" calls onSelectIntent with "now"', () => {
  const mockCallback = jest.fn();
  render(<IntentSelection onSelectIntent={mockCallback} />);

  // Click "Here Now" button
  const nowButton = screen.getByText("I'm Here Now");
  fireEvent.click(nowButton);

  // Verify callback called with correct argument
  expect(mockCallback).toHaveBeenCalledTimes(1);
  expect(mockCallback).toHaveBeenCalledWith('now');
});
```

**Manual Testing:**
1. Navigate to IntentSelection screen
2. Click "I'm Here Now" button
3. Verify navigation to OrderTypeSelection screen
4. Check browser console or debug state to confirm `customerIntent` set to 'now'

**Expected Result:**
- Callback fired with argument 'now'
- Navigation proceeds to next screen (OrderTypeSelection)

---

### Test 3: Clicking "Book Later" calls onSelectIntent('later')

**Purpose:** Verify "Book Later" button triggers correct callback

**Test Code (Future Implementation):**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { IntentSelection } from './IntentSelection';

test('Clicking "Book Later" calls onSelectIntent with "later"', () => {
  const mockCallback = jest.fn();
  render(<IntentSelection onSelectIntent={mockCallback} />);

  // Click "Book Later" button
  const laterButton = screen.getByText('Book for Later');
  fireEvent.click(laterButton);

  // Verify callback called with correct argument
  expect(mockCallback).toHaveBeenCalledTimes(1);
  expect(mockCallback).toHaveBeenCalledWith('later');
});
```

**Manual Testing:**
1. Navigate to IntentSelection screen
2. Click "Book for Later" button
3. Verify navigation to ReservationForm screen (or placeholder)
4. Check browser console or debug state to confirm `customerIntent` set to 'later'

**Expected Result:**
- Callback fired with argument 'later'
- Navigation proceeds to reservation flow

---

### Test 4: Buttons have correct hover effects

**Purpose:** Verify interactive hover states work correctly

**Test Code (Future Implementation):**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { IntentSelection } from './IntentSelection';

test('Buttons show hover effects', () => {
  const mockCallback = jest.fn();
  render(<IntentSelection onSelectIntent={mockCallback} />);

  const nowButton = screen.getByText("I'm Here Now");

  // Get initial styles
  const initialTransform = window.getComputedStyle(nowButton).transform;

  // Simulate hover
  fireEvent.mouseEnter(nowButton);

  // Check transform applied (scale effect)
  const hoverTransform = window.getComputedStyle(nowButton).transform;
  expect(hoverTransform).not.toBe(initialTransform);
});
```

**Manual Testing:**
1. Navigate to IntentSelection screen
2. Hover mouse over "I'm Here Now" button
3. Verify button scales up slightly (1.05x)
4. Verify shadow becomes more prominent
5. Move mouse away, verify button returns to normal
6. Repeat for "Book Later" button

**Expected Result:**
- Buttons scale up on hover (transform: scale(1.05))
- Box shadow increases on hover
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

### Test 7: Full flow from landing to intent selection

**Purpose:** Verify navigation from LandingPage to IntentSelection

**Manual Testing:**
1. Start at landing page (/)
2. Click "Continue to Order" button
3. Verify IntentSelection renders
4. Click "I'm Here Now"
5. Verify OrderTypeSelection renders
6. Verify journey state updates correctly

**Expected Result:**
- Smooth navigation between screens
- No errors in console
- State managed correctly by CustomerJourneyContext

---

## Performance Tests

### Test 8: Component renders quickly

**Manual Testing:**
1. Open Chrome DevTools Performance tab
2. Record page load with IntentSelection
3. Check render time

**Expected Result:**
- Component renders in <100ms
- No layout shifts
- Smooth animation transitions

---

## Accessibility Tests

### Test 9: Keyboard navigation works

**Manual Testing:**
1. Navigate to IntentSelection
2. Press Tab key to focus on first button
3. Press Enter to activate
4. Verify callback fires

**Expected Result:**
- Buttons focusable via keyboard
- Enter key triggers onClick
- Visible focus indicators

---

## Summary

**Total Tests Defined:** 9 tests
**Tests Required:** 2-6 tests (per spec)
**Core Tests (Minimum):** Tests 1-4
**Additional Tests:** Tests 5-9 (manual/integration/accessibility)

**Status:** Test documentation complete. Manual testing required until test infrastructure is set up.

**Next Steps:**
1. Manual testing in browser
2. Set up Jest/Vitest when test infrastructure is added
3. Implement automated tests based on this documentation
