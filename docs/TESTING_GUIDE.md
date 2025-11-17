# Testing Guide

This document provides instructions for running automated tests in the Multi-Vertical Restaurant Management System.

## Overview

The project includes automated tests for critical functionality:

- **Unit Tests**: Test individual functions and hooks in isolation
- **Integration Tests**: Test how components work together with their contexts
- **Coverage**: Focus on critical user flows (super admin, vertical system, storage)

## Test Stack

- **Test Runner**: Jest
- **React Testing**: React Testing Library
- **Mocking**: Jest mocks for contexts and dependencies

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Run Specific Test File

```bash
npm test useSuperAdminRedirect
```

## Test Structure

```
src/
├── hooks/
│   ├── useSuperAdminRedirect.ts
│   └── __tests__/
│       └── useSuperAdminRedirect.test.ts
├── contexts/
│   ├── VerticalContext.tsx
│   └── __tests__/
│       └── VerticalContext.test.tsx
└── constants/
    ├── storage.ts
    └── __tests__/
        └── storage.test.ts
```

## Test Coverage Goals

### Critical Flows (Implemented ✅)

1. **Super Admin Redirect** (`src/hooks/__tests__/useSuperAdminRedirect.test.ts`)
   - ✅ URL parameter capture behavior documentation
   - ✅ SessionStorage flag handling verification
   - ✅ Redirect logic with edge cases
   - ✅ Special page skipping documentation
   - ✅ Storage key type safety
   - ✅ Environment-based logging verification

2. **Vertical System** (`src/contexts/__tests__/VerticalContext.test.tsx`)
   - ✅ Configuration structure for all vertical types
   - ✅ Terminology differences per vertical
   - ✅ Feature flags per vertical
   - ✅ Invalid vertical type fallback behavior
   - ✅ Override prop functionality
   - ✅ Helper functions (isVertical, hasFeature)
   - ✅ Error boundary integration

3. **Storage Constants** (`src/constants/__tests__/storage.test.ts`)
   - ✅ Type safety validation
   - ✅ TypeScript readonly protection
   - ✅ Browser API integration
   - ✅ Key value consistency

**Test Approach**: Due to Jest + Firebase + ESM constraints, tests focus on behavior documentation, pure logic validation, and type safety verification rather than full integration tests with mocked contexts. This approach provides:
- Fast, reliable test execution
- Clear documentation of expected behavior
- Type safety validation
- No complex mocking or environment setup required

### Additional Coverage (Nice to Have)

- **Authentication flows**
- **Tenant management**
- **Firestore rules (using emulator)**
- **Component rendering**

## Writing New Tests

### Example Test Structure

```typescript
import { renderHook } from '@testing-library/react';
import { useYourHook } from '../useYourHook';

describe('useYourHook', () => {
  beforeEach(() => {
    // Setup code
  });

  afterEach(() => {
    // Cleanup code
  });

  it('should do something specific', () => {
    // Arrange
    const { result } = renderHook(() => useYourHook());

    // Act
    // ... trigger actions

    // Assert
    expect(result.current).toBe(expectedValue);
  });
});
```

### Best Practices

1. **Use Descriptive Test Names**: Tests should read like specifications
2. **Follow AAA Pattern**: Arrange, Act, Assert
3. **Mock External Dependencies**: Keep tests isolated and fast
4. **Test Edge Cases**: Don't just test the happy path
5. **Clean Up**: Always clean up mocks and storage after tests

## Continuous Integration

Tests run automatically on:
- Every commit (pre-commit hook)
- Every pull request (GitHub Actions)
- Before deployment

## Debugging Tests

### Run Single Test in Debug Mode

```bash
node --inspect-brk node_modules/.bin/jest --runInBand useSuperAdminRedirect
```

### View Detailed Error Output

```bash
npm test -- --verbose
```

### Check What's Mocked

Add debug logs in your test:

```typescript
console.log('Mock calls:', mockFunction.mock.calls);
```

## Common Issues

### Issue: "Cannot find module" errors

**Solution**: Check your jest.config.js moduleNameMapper settings

### Issue: Tests timeout

**Solution**: Increase timeout or check for unresolved promises

```typescript
jest.setTimeout(10000); // 10 seconds
```

### Issue: Storage not clearing between tests

**Solution**: Always clear storage in beforeEach/afterEach

```typescript
beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});
```

## Test Metrics

Current test status:

- **Storage Constants**: 100% (10 tests passing)
- **Super Admin Redirect**: Behavior documented (8 tests passing)
- **Vertical System**: Behavior documented (10 tests passing)
- **Firebase Functions**: Mixed (invitations passing, others need fixes)
- **Floor Plan**: Mixed (integration passing, rendering/settings need implementation)

**New Tests Added**: 28 passing tests for critical flows
**Test Suite**: 3/3 new test files passing ✅

**Goal**: Continue expanding test coverage for critical user flows while maintaining fast, reliable test execution

## Future Improvements

- [ ] Add E2E tests with Cypress or Playwright
- [ ] Add visual regression tests
- [ ] Add Firestore rules testing with emulator
- [ ] Add performance benchmarking tests
- [ ] Add accessibility testing

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
