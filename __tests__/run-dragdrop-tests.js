#!/usr/bin/env node

/**
 * Test Runner: Floor Plan Drag-and-Drop Tests
 *
 * Runs ONLY the drag-and-drop behavior tests for Task Group 3.
 * This ensures we test focused functionality without running the entire test suite.
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n==============================================');
console.log('Running Floor Plan Drag-and-Drop Tests');
console.log('==============================================\n');

try {
  // Run only the drag-drop test file
  const testPath = join(__dirname, 'floorPlan.dragDrop.test.ts');

  execSync(
    `npx jest "${testPath}" --verbose --no-coverage`,
    {
      stdio: 'inherit',
      cwd: join(__dirname, '..')
    }
  );

  console.log('\n==============================================');
  console.log('✅ All Drag-and-Drop Tests Passed!');
  console.log('==============================================\n');

} catch (error) {
  console.error('\n==============================================');
  console.error('❌ Drag-and-Drop Tests Failed');
  console.error('==============================================\n');
  process.exit(1);
}
