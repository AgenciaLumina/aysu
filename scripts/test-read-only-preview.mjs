// Requires a local app configured with APP_READ_ONLY_MODE=1 and an isolated copy.
// Bodies are deliberately invalid even if the middleware is misconfigured.
import assert from 'node:assert/strict'

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:13107'
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Requires localhost app')
const checks = [
    ['GET', '/api/health', 200],
    ['GET', '/api/ready', 200],
    ['GET', '/api/cabins', 200],
    ['GET', '/api/day-configs/default', 200],
    ['GET', '/api/site-content', 200],
    ['GET', '/api/event-galleries', 200],
    ['GET', '/api/event-galleries/nonexistent-preparation-fixture', 404],
    ['GET', '/api/reservations/availability?date=2026-12-27', 200],
    ['GET', '/api/reservations', 401],
    ['GET', '/api/reservations/nonexistent-preparation-fixture', 401],
    ['GET', '/api/admin/reservations', 403],
    ['GET', '/admin', 307],
    ['POST', '/api/reservations', 423],
    ['POST', '/api/contact', 423],
    ['POST', '/api/payments/create', 423],
    ['POST', '/api/upload', 423],
]

for (const [method, path, status] of checks) {
    const response = await fetch(base + path, {
        method,
        redirect: 'manual',
        signal: AbortSignal.timeout(30000),
        ...(method === 'POST' ? { headers: { 'Content-Type': 'application/json' }, body: '{}' } : {}),
    })
    assert.equal(response.status, status, `${method} ${path}`)
    if (path === '/api/ready') {
        assert.equal((await response.json()).database, 'connected')
        assert.match(response.headers.get('cache-control'), /no-store/)
    }
    console.log(`PASS ${method} ${path}: ${status}`)
}
console.log(`${checks.length} checks passed; read-only preview; no customer data emitted.`)
