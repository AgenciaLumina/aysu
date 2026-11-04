// Isolated R2 only: never connects to Cloudflare, production DBs or credentials.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const { createRequire } = require('node:module')
const runtime = createRequire(fs.realpathSync(require.resolve('wrangler/package.json')))
const { Miniflare, convertV4MiniflareOptions } = runtime('miniflare')
const sharp = require('sharp')
;(async () => {
    const options = { modules: true, script: 'export default { fetch(){ return new Response("isolated") } }', r2Buckets: ['MEDIA_BUCKET'], compatibilityDate: '2026-10-30' }
    const mf = new Miniflare(convertV4MiniflareOptions ? convertV4MiniflareOptions(options) : options)
    try {
        const bucket = await mf.getR2Bucket('MEDIA_BUCKET')
        const context = { env: { MEDIA_BUCKET: bucket, JWT_SECRET: 'synthetic-upload-only-secret' }, ctx: {} }
        const api = await require('./helpers/load-d1-test-bundle.cjs')(`
            export { POST } from './src/app/api/upload/route';
            export { GET } from './src/app/api/admin/media/route';
            export { DELETE } from './src/app/api/admin/media/delete/route';
            export { generateToken } from './src/lib/auth';
            export { inspectAvif } from './src/lib/image-upload';
            export { fetchMediaFiles } from './src/lib/media-client';`, context)
        const token = api.generateToken({ id: 'synthetic', email: 'synthetic@example.invalid', role: 'ADMIN' })
        const { NextRequest } = require('next/server')
        const request = (body, auth = true) => new NextRequest('http://localhost/api/upload', { method: 'POST', headers: auth ? { Authorization: `Bearer ${token}` } : {}, body })
        function form(bytes, type = 'image/avif', filename = 'synthetic.avif') {
            const f = new FormData(); f.set('file', new File([bytes], filename, { type })); f.set('folder', 'isolated-upload-test'); return f
        }
        const source = sharp({ create: { width: 80, height: 64, channels: 4, background: { r: 20, g: 50, b: 90, alpha: 0.5 } } })
        const avif = await source.clone().avif().toBuffer(), png = await source.clone().png().toBuffer(), jpeg = await source.clone().jpeg().toBuffer()
        assert.deepEqual(api.inspectAvif(avif), { width: 80, height: 64 })
        assert.equal((await api.POST(request(form(avif), false))).status, 403)
        assert.equal((await api.POST(request(form(png)))).status, 400, 'PNG mislabeled AVIF must fail')
        assert.equal((await api.POST(request(form(jpeg, 'image/jpeg', 'photo.jpg')))).status, 400)
        assert.equal((await api.POST(request(form(avif.subarray(0, avif.length - 3))))).status, 400)
        const noFile = new FormData(); noFile.set('file', 'not a file')
        assert.equal((await api.POST(request(noFile))).status, 400)
        assert.equal((await api.POST(request(form(Buffer.alloc(4 * 1024 * 1024 + 1))))).status, 413)
        assert.equal((await bucket.list()).objects.length, 0, 'Invalid requests must never write')
        const saved = await api.POST(request(form(avif)))
        assert.equal(saved.status, 200); const body = await saved.json()
        assert.equal(body.success, true); assert.match(body.data.key, /^isolated-upload-test\/[\w-]+\.avif$/)
        const object = await bucket.get(body.data.key)
        assert.equal(object.httpMetadata.contentType, 'image/avif'); assert.deepEqual(Buffer.from(await object.arrayBuffer()), avif)
        const listRequest = new NextRequest('http://localhost/api/admin/media?folder=isolated-upload-test&limit=bad', { headers: { Authorization: `Bearer ${token}` } })
        const listed = await (await api.GET(listRequest)).json(); assert.equal(listed.data.count, 1); assert.equal(listed.data.files[0].key, body.data.key)
        const deletion = new NextRequest('http://localhost/api/admin/media/delete', { method: 'DELETE', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ key: body.data.key }) })
        assert.equal((await api.DELETE(deletion)).status, 200); assert.equal((await bucket.list()).objects.length, 0)
        // Reproduce the real incident: a new image sorts beyond the first 200 keys.
        await Promise.all(Array.from({ length: 203 }, (_, i) => bucket.put(`visibility/old-${String(i).padStart(3, '0')}.avif`, avif)))
        const latestKey = 'visibility/zzzz-new-upload.avif'
        await bucket.put(latestKey, avif)
        await bucket.put('unrelated/keep.avif', avif)
        const authHeaders = { Authorization: `Bearer ${token}` }
        const firstPage = await api.GET(new NextRequest('http://localhost/api/admin/media?folder=visibility/', { headers: authHeaders }))
        assert.match(firstPage.headers.get('cache-control'), /no-store/)
        const firstData = (await firstPage.json()).data
        assert.equal(firstData.files.length, 200); assert.equal(firstData.hasMore, true); assert.ok(firstData.nextCursor)
        assert(!firstData.files.some(file => file.key === latestKey), 'Fixture must reproduce the old hidden upload')
        const actualFetch = global.fetch
        const pageRequests = []
        try {
            global.fetch = async (url, options) => {
                if (typeof url === 'string' && url.startsWith('/api/admin/media?')) {
                    pageRequests.push(url)
                    assert.equal(options.cache, 'no-store')
                    return api.GET(new NextRequest('http://localhost' + url, { headers: authHeaders, signal: options.signal }))
                }
                return actualFetch(url, options)
            }
            const all = await api.fetchMediaFiles('visibility/')
            assert.equal(all.length, 204); assert.equal(new Set(all.map(file => file.key)).size, 204)
            assert.equal(all[0].key, latestKey, 'Newest upload must be first, even from a later R2 page')
            assert.equal(pageRequests.length, 2); assert(new URL(pageRequests[1], 'http://localhost').searchParams.get('cursor'))
            assert(all.every(file => file.key.startsWith('visibility/')), 'Folder isolation must hold on every page')
            const filtered = await api.fetchMediaFiles('visibility/zzzz')
            assert.equal(filtered.length, 1); assert.equal(filtered[0].key, latestKey)
            global.fetch = async () => Response.json({ success: true, data: { files: [], hasMore: true } })
            await assert.rejects(() => api.fetchMediaFiles(''), /por completo/)
            global.fetch = async () => Response.json({ success: true, data: { files: [], hasMore: true, nextCursor: 'repeated' } })
            await assert.rejects(() => api.fetchMediaFiles(''), /por completo/)
            global.fetch = async () => Response.json({ success: false, error: 'Acesso negado' }, { status: 403 })
            await assert.rejects(() => api.fetchMediaFiles(''), /Acesso negado/)
        } finally { global.fetch = actualFetch }
        assert.equal((await api.GET(new NextRequest('http://localhost/api/admin/media'))).status, 403)
        console.log('PASS media visibility: 204 objects over two native R2 pages, newest-first ordering, folder filtering, no duplicates/cache, incomplete-page and auth errors.')
        context.env.MEDIA_BUCKET = undefined
        assert.equal((await api.POST(request(form(avif)))).status, 500)
        console.log('PASS isolated upload: auth, genuine AVIF, mislabeled/corrupt/oversize rejection, no invalid writes, native R2 bytes/metadata, list/delete and missing binding. No production resources used.')
    } finally { await mf.dispose() }
})().catch(error => { console.error(error); process.exitCode = 1 })
