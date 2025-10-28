# ReservationForm Component - Test Documentation

**Component:** `ReservationForm.tsx`
**Task Group:** 9
**Test Count:** 6 comprehensive tests

## Overview
This document outlines the test cases for the ReservationForm component. The component is a customer-facing reservation form with 8 form fields (Date, Time, Party Size, Contact Name, Phone, Email, Table Preference, Special Requests) with comprehensive validation.

---

## Test 1: Form Renders with All Required Fields

**Description:** Verify that the ReservationForm component renders correctly with all 8 form fields visible.

**Test Code:**
```typescript
import { render, screen } from '@testing-library/react';
import ReservationForm from './ReservationForm';

test('renders reservation form with all required fields', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const availableTables = [1, 2, 3, 4, 5];

  render(
    <ReservationForm
      onSubmit={mockOnSubmit}
      onCancel={mockOnCancel}
      availableTables={availableTables}
    />
  );

  // Check for all form fields
  expect(screen.getByLabelText(/reservation date/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/reservation time/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/party size/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/table preference/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/special requests/i)).toBeInTheDocument();

  // Check for buttons
  expect(screen.getByRole('button', { name: /submit reservation/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
});
```

**Manual Test:**
1. Open browser and navigate to reservation form
2. Verify all 8 fields are visible: Date, Time, Party Size, Name, Phone, Email, Table Preference, Special Requests
3. Verify Submit and Cancel buttons are visible
4. Check responsive layout on mobile (320px width)

---

## Test 2: Date Validation (Future Dates Only)

**Description:** Verify that the date picker only allows future dates and shows error for past dates.

**Test Code:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import ReservationForm from './ReservationForm';

test('shows error for past date selection', async () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  render(
    <ReservationForm
      onSubmit={mockOnSubmit}
      onCancel={mockOnCancel}
      availableTables={[1, 2, 3]}
    />
  );

  // Try to enter a past date
  const dateInput = screen.getByLabelText(/reservation date/i);
  const pastDate = '2024-01-01'; // Past date

  fireEvent.change(dateInput, { target: { value: pastDate } });
  fireEvent.blur(dateInput);

  // Check for error message
  expect(await screen.findByText(/date must be today or in the future/i)).toBeInTheDocument();

  // Try a future date
  const today = new Date();
  const futureDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  const futureDateString = futureDate.toISOString().split('T')[0];

  fireEvent.change(dateInput, { target: { value: futureDateString } });
  fireEvent.blur(dateInput);

  // Error should disappear
  expect(screen.queryByText(/date must be today or in the future/i)).not.toBeInTheDocument();
});
```

**Manual Test:**
1. Click on date field
2. Try to select yesterday's date - verify error appears
3. Try to select today's date - verify no error
4. Try to select a future date (e.g., next week) - verify no error
5. Verify date picker blocks dates outside min/max range

---

## Test 3: Phone Number Validation (E.164 Format)

**Description:** Verify that the phone number field validates E.164 format (+1234567890).

**Test Code:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import ReservationForm from './ReservationForm';

test('validates phone number format', async () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  render(
    <ReservationForm
      onSubmit={mockOnSubmit}
      onCancel={mockOnCancel}
      availableTables={[1, 2, 3]}
    />
  );

  const phoneInput = screen.getByLabelText(/phone number/i);

  // Test invalid formats
  const invalidNumbers = ['123', 'abcd', '555-1234', '(555) 123-4567'];

  for (const invalidNumber of invalidNumbers) {
    fireEvent.change(phoneInput, { target: { value: invalidNumber } });
    fireEvent.blur(phoneInput);
    expect(await screen.findByText(/invalid phone number/i)).toBeInTheDocument();
  }

  // Test valid E.164 format
  fireEvent.change(phoneInput, { target: { value: '+12345678901' } });
  fireEvent.blur(phoneInput);
  expect(screen.queryByText(/invalid phone number/i)).not.toBeInTheDocument();
});
```

**Manual Test:**
1. Enter invalid phone: "123" - verify error shows
2. Enter invalid phone: "abcd" - verify error shows
3. Enter valid E.164: "+12345678901" - verify no error
4. Enter valid E.164: "+442071234567" - verify no error
5. Test with libphonenumber-js formatting if available

---

## Test 4: Email Validation (Valid Email Format)

**Description:** Verify that the email field validates email format.

**Test Code:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import ReservationForm from './ReservationForm';

test('validates email address format', async () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  render(
    <ReservationForm
      onSubmit={mockOnSubmit}
      onCancel={mockOnCancel}
      availableTables={[1, 2, 3]}
    />
  );

  const emailInput = screen.getByLabelText(/email address/i);

  // Test invalid emails
  const invalidEmails = ['invalid', 'test@', '@example.com', 'test @example.com'];

  for (const invalidEmail of invalidEmails) {
    fireEvent.change(emailInput, { target: { value: invalidEmail } });
    fireEvent.blur(emailInput);
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  }

  // Test valid email
  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.blur(emailInput);
  expect(screen.queryByText(/invalid email/i)).not.toBeInTheDocument();
});
```

**Manual Test:**
1. Enter invalid email: "invalid" - verify error shows
2. Enter invalid email: "test@" - verify error shows
3. Enter invalid email: "@example.com" - verify error shows
4. Enter valid email: "test@example.com" - verify no error
5. Enter valid email: "user+tag@domain.co.uk" - verify no error

---

## Test 5: Party Size Validation (1-20)

**Description:** Verify that party size must be between 1 and 20.

**Test Code:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import ReservationForm from './ReservationForm';

test('validates party size range', async () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  render(
    <ReservationForm
      onSubmit={mockOnSubmit}
      onCancel={mockOnCancel}
      availableTables={[1, 2, 3]}
    />
  );

  const partySizeInput = screen.getByLabelText(/party size/i) as HTMLInputElement;

  // Test too small
  fireEvent.change(partySizeInput, { target: { value: '0' } });
  fireEvent.blur(partySizeInput);
  expect(await screen.findByText(/party size must be at least 1/i)).toBeInTheDocument();

  // Test too large
  fireEvent.change(partySizeInput, { target: { value: '25' } });
  fireEvent.blur(partySizeInput);
  expect(await screen.findByText(/party size cannot exceed 20/i)).toBeInTheDocument();

  // Test valid range
  fireEvent.change(partySizeInput, { target: { value: '4' } });
  fireEvent.blur(partySizeInput);
  expect(screen.queryByText(/party size/i)).not.toBeInTheDocument(); // No error
});
```

**Manual Test:**
1. Enter party size: 0 - verify error "must be at least 1"
2. Enter party size: 25 - verify error "cannot exceed 20"
3. Enter party size: 1 - verify no error
4. Enter party size: 10 - verify no error
5. Enter party size: 20 - verify no error

---

## Test 6: Submit Reservation Successfully

**Description:** Verify that valid form data submits successfully and calls onSubmit prop.

**Test Code:**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReservationForm from './ReservationForm';

test('submits valid reservation data', async () => {
  const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
  const mockOnCancel = jest.fn();

  render(
    <ReservationForm
      onSubmit={mockOnSubmit}
      onCancel={mockOnCancel}
      availableTables={[1, 2, 3, 4, 5]}
    />
  );

  // Fill out form with valid data
  const today = new Date();
  const futureDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const futureDateString = futureDate.toISOString().split('T')[0];

  fireEvent.change(screen.getByLabelText(/reservation date/i), {
    target: { value: futureDateString }
  });

  fireEvent.change(screen.getByLabelText(/reservation time/i), {
    target: { value: '19:00' }
  });

  fireEvent.change(screen.getByLabelText(/party size/i), {
    target: { value: '4' }
  });

  fireEvent.change(screen.getByLabelText(/your name/i), {
    target: { value: 'John Doe' }
  });

  fireEvent.change(screen.getByLabelText(/phone number/i), {
    target: { value: '+12345678901' }
  });

  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: 'john@example.com' }
  });

  fireEvent.change(screen.getByLabelText(/table preference/i), {
    target: { value: '3' }
  });

  fireEvent.change(screen.getByLabelText(/special requests/i), {
    target: { value: 'Window seat please' }
  });

  // Submit form
  const submitButton = screen.getByRole('button', { name: /submit reservation/i });
  fireEvent.click(submitButton);

  // Wait for submission
  await waitFor(() => {
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  // Verify submitted data
  expect(mockOnSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      date: futureDateString,
      time: '19:00',
      partySize: 4,
      contactName: 'John Doe',
      contactPhone: '+12345678901',
      contactEmail: 'john@example.com',
      tablePreference: 3,
      specialRequests: 'Window seat please',
    })
  );
});
```

**Manual Test:**
1. Fill out form with all valid data:
   - Date: Next week
   - Time: 19:00
   - Party Size: 4
   - Name: John Doe
   - Phone: +12345678901
   - Email: john@example.com
   - Table: 3
   - Special Requests: "Window seat please"
2. Click Submit button
3. Verify loading state shows (button disabled, spinner visible)
4. Verify success (navigate to confirmation or toast message)
5. Check Firestore to confirm reservation document created

---

## Test Execution Notes

**Project Constraint:** This project lacks test infrastructure (Jest/React Testing Library not configured).

**Test Approach:**
1. **Test Documentation Complete:** All 6 tests documented above with code examples
2. **Manual Testing Required:** Each test must be verified manually in browser
3. **Future Work:** Set up proper test infrastructure for automated testing

**Manual Test Checklist:**
- [ ] Test 1: All fields render correctly
- [ ] Test 2: Date validation works (past/future)
- [ ] Test 3: Phone validation works (E.164 format)
- [ ] Test 4: Email validation works (RFC 5322)
- [ ] Test 5: Party size validation works (1-20 range)
- [ ] Test 6: Form submits successfully with valid data

**Performance Notes:**
- Form should render in <500ms
- Validation should be instant (<100ms)
- Submission should complete in <1 second
- Mobile responsive (tested at 320px, 768px, 1024px)

---

## Acceptance Criteria

- [x] 6 comprehensive tests documented
- [ ] All tests pass manual verification
- [ ] Form renders with all 8 fields
- [ ] All validation rules work correctly
- [ ] Form submits successfully with valid data
- [ ] Errors display inline below fields
- [ ] Mobile-responsive layout works

**Status:** Test documentation complete. Manual testing required.

**Last Updated:** October 26, 2025
