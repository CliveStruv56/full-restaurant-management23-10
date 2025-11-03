/**
 * Test Runner for Floor Plan Rendering Tests
 *
 * Executes the rendering tests in a Node.js environment.
 * This is a temporary solution until Jest is fully integrated.
 *
 * Usage:
 * node __tests__/run-rendering-tests.js
 */

// Import the test suite
import { runFloorPlanRenderingTests } from './floorPlan.rendering.test.ts';

console.log('============================================');
console.log('  Floor Plan Rendering Test Suite');
console.log('============================================\n');

try {
  // Run all rendering tests
  runFloorPlanRenderingTests();

  console.log('============================================');
  console.log('  Test Suite: SUCCESS ✅');
  console.log('============================================');
  process.exit(0);
} catch (error) {
  console.error('============================================');
  console.error('  Test Suite: FAILED ❌');
  console.error('============================================');
  console.error('\nError Details:');
  console.error(error);
  process.exit(1);
}
