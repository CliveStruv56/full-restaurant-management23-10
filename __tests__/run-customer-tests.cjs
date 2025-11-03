#!/usr/bin/env node

/**
 * Test Runner for Customer Floor Plan Display Tests
 *
 * Runs the customer view tests created in Task Group 4.1
 * Focus: Read-only rendering, status colors, table selection, integration, real-time updates, module toggle
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('========================================');
console.log('Customer Floor Plan Display Test Suite');
console.log('========================================\n');

try {
  const testFile = path.join(__dirname, 'floorPlan.customer.test.ts');

  console.log('Running customer floor plan tests...\n');

  // Run the tests using ts-node
  execSync(`npx ts-node ${testFile}`, {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test' }
  });

  console.log('\n========================================');
  console.log('✓ All customer floor plan tests passed!');
  console.log('========================================\n');

  process.exit(0);
} catch (error) {
  console.error('\n========================================');
  console.error('✗ Some tests failed');
  console.error('========================================\n');
  process.exit(1);
}
