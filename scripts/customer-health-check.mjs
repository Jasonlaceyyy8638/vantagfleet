#!/usr/bin/env node
/**
 * Customer-side health check: hits main customer routes and ensures none return 500.
 * Usage: node scripts/customer-health-check.mjs [BASE_URL]
 * Example: BASE_URL=https://vantagfleet.com node scripts/customer-health-check.mjs
 */

const BASE = process.env.BASE_URL || process.argv[2] || 'http://localhost:3000';
const baseUrl = BASE.replace(/\/$/, '');

const routes = [
  { path: '/', name: 'Landing', expectStatus: [200] },
  { path: '/login', name: 'Login', expectStatus: [200] },
  { path: '/signup', name: 'Sign up', expectStatus: [200] },
  { path: '/pricing', name: 'Pricing', expectStatus: [200] },
  { path: '/invite', name: 'Invite (no token)', expectStatus: [200] },
  // Protected: should redirect to login (302/307), not 500
  { path: '/dashboard', name: 'Dashboard (auth required)', expectStatus: [302, 307, 200] },
  { path: '/drivers', name: 'Drivers (auth required)', expectStatus: [302, 307, 200] },
  { path: '/loads', name: 'Loads (auth required)', expectStatus: [302, 307, 200] },
  { path: '/settings', name: 'Settings (auth required)', expectStatus: [302, 307, 200] },
];

async function check(path, name, expectStatus) {
  const url = `${baseUrl}${path}`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      headers: { 'User-Agent': 'VantagFleet-HealthCheck/1.0' },
    });
    const ok = expectStatus.includes(res.status);
    const statusLabel = res.status === 500 ? '500 (ERROR)' : res.status;
    return {
      name,
      path,
      status: res.status,
      ok,
      error: res.status === 500 ? (await res.text().catch(() => '')).slice(0, 200) : null,
    };
  } catch (err) {
    return { name, path, status: null, ok: false, error: err.message };
  }
}

async function main() {
  console.log('Customer health check');
  console.log('Base URL:', baseUrl);
  console.log('');

  const results = [];
  for (const r of routes) {
    const result = await check(r.path, r.name, r.expectStatus);
    results.push(result);
    const icon = result.ok ? '✓' : '✗';
    const status = result.status ?? 'ERR';
    console.log(`  ${icon} ${result.name.padEnd(28)} ${status}`);
    if (result.error) console.log(`      ${result.error}`);
  }

  const failed = results.filter((r) => !r.ok);
  console.log('');
  if (failed.length === 0) {
    console.log('All customer routes OK.');
    process.exit(0);
  }
  console.log('Failed:', failed.length);
  failed.forEach((r) => console.log(`  - ${r.name} (${r.path}): ${r.status ?? r.error}`));
  process.exit(1);
}

main();
