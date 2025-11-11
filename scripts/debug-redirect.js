// DEBUG SUPER ADMIN REDIRECT ISSUE
// Run this in browser console at http://superadmin.localhost:3000
// AFTER clicking "View Site" button

console.log('=== Super Admin Redirect Debug ===\n');

// 1. Check localStorage flag
const flag = localStorage.getItem('superAdminViewingTenant');
console.log('1. localStorage flag:', flag);

if (flag) {
  try {
    const parsed = JSON.parse(flag);
    console.log('   Parsed:', parsed);
    console.log('   - enabled:', parsed.enabled);
    console.log('   - tenantId:', parsed.tenantId);
    console.log('   - timestamp:', new Date(parsed.timestamp).toLocaleString());
    console.log('   - isExpired:', (Date.now() - parsed.timestamp) > (60 * 60 * 1000));
  } catch (e) {
    console.error('   ERROR parsing flag:', e.message);
  }
} else {
  console.log('   ❌ No flag found in localStorage');
  console.log('   This is the problem! Flag should exist after clicking "View Site"');
}

// 2. Check what tenant ID would be extracted from URL
console.log('\n2. If you were at some-good.localhost:3000:');
const testHostname = 'some-good.localhost';
const parts = testHostname.split('.');
const extractedTenantId = parts.length === 2 && parts[1] === 'localhost'
  ? parts[0]
  : (parts.length >= 3 ? parts[0] : null);
console.log('   Extracted tenant ID:', extractedTenantId);

// 3. Would the check pass?
if (flag && extractedTenantId) {
  try {
    const { enabled, tenantId, timestamp } = JSON.parse(flag);
    const isExpired = (Date.now() - timestamp) > (60 * 60 * 1000);
    const wouldPass = enabled && !isExpired && tenantId === extractedTenantId;

    console.log('\n3. Would redirect check pass?');
    console.log('   enabled:', enabled);
    console.log('   !isExpired:', !isExpired);
    console.log('   tenantId === extractedTenantId:', tenantId === extractedTenantId);
    console.log('   Result:', wouldPass ? '✅ PASS (no redirect)' : '❌ FAIL (redirect happens)');
  } catch (e) {
    console.log('\n3. ❌ Check would fail due to parse error');
  }
} else {
  console.log('\n3. ❌ Check would fail (missing flag or tenant ID)');
}

console.log('\n=== End Debug ===');
