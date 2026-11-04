// Synthetic only: exercise actual route handlers and native D1 constraints.
const fs = require('node:fs'), assert = require('node:assert/strict'), { createRequire } = require('node:module');
const runtime = createRequire(fs.realpathSync(require.resolve('wrangler/package.json')));
const { Miniflare, convertV4MiniflareOptions } = runtime('miniflare');
const { NextRequest } = require('next/server');
(async () => {
 const mf = new Miniflare(convertV4MiniflareOptions({ modules:true, script:'export default {fetch(){return new Response("isolated")}}', d1Databases:{ DB:'cabin-gallery-isolated' }, compatibilityDate:'2026-10-30' }));
 try {
  const db = await mf.getD1Database('DB'); await require('./lib/isolated-d1-integrity.cjs')(db);
  const context = { env:{ DB:db, JWT_SECRET:'isolated-not-a-production-secret' }, ctx:{} };
  const api = await require('./helpers/load-d1-test-bundle.cjs')(`export { PATCH } from './src/app/api/cabins/[id]/route'; export { POST } from './src/app/api/cabins/route'; export {generateToken} from './src/lib/auth'; export { getCabinGallery } from './src/lib/cabin-gallery';`,context);
  for (const [id,role,active] of [['admin','ADMIN',1],['manager','MANAGER',1],['staff','STAFF',1],['inactive','ADMIN',0]]) await db.prepare('INSERT INTO User (id,email,name,passwordHash,role,isActive,updatedAt) VALUES(?,?,?,?,?,?,?)').bind(id,`${id}@example.invalid`,'Synthetic','not-a-password',role,active,'2026-11-04T00:00:00+00:00').run();
  const tokens=Object.fromEntries(['admin','manager','staff','inactive'].map(id=>[id,api.generateToken({id,email:`${id}@example.invalid`,name:'Synthetic',role:id==='staff'?'STAFF':id==='manager'?'MANAGER':'ADMIN'})]));
  const insert=async(id,slug,units=1)=>db.prepare('INSERT INTO Cabin(id,name,slug,capacity,units,pricePerHour,category,isActive,visibilityStatus,updatedAt,imageUrl) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(id,id,slug,4,units,123,'CABANA',1,'AVAILABLE','2026-11-04T00:00:00+00:00','/espacos/bangalo-lateral.jpg').run();
  await insert('one','bangalo-lateral',2);await insert('sibling','bangalo-lateral',1);await insert('other','bangalo-piscina');
  const read=id=>db.prepare('SELECT * FROM Cabin WHERE id=?').bind(id).first();
  const call=async(payload,token=tokens.admin,id='one',method='PATCH')=>{
   context.ctx={}; const request=new NextRequest(`http://localhost/api/cabins/${id}`,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(payload)});
   const response=method==='POST'?await api.POST(request):await api.PATCH(request,{params:Promise.resolve({id})});return{status:response.status,body:await response.json()};
  };
  const before=await read('one'), sibling=await read('sibling'), other=await read('other');
  for(const token of [null,tokens.staff,tokens.inactive]) assert.equal((await call({imageUrl:'/new.avif'},token)).status,403);
  assert.equal((await call({imageUrl:'/new.avif'},tokens.admin,'missing')).status,404);
  for(const galleryImages of [[{imageUrl:'javascript:bad'}],[{imageUrl:'/a'},{imageUrl:'/a'}],Array.from({length:21},(_,i)=>({imageUrl:`/${i}`}))])assert.equal((await call({galleryImages})).status,400);
  const photos=[{imageUrl:'/espacos/bangalo-lateral.jpg',caption:'Mobiliário'},{imageUrl:'/espacos/bangalo-frente-mar.jpg',caption:'Vista'}];
  let r=await call({galleryImages:photos},tokens.manager);assert.equal(r.status,200,JSON.stringify(r.body));assert.deepEqual(r.body.data.galleryImages,photos);assert.equal(r.body.data.imageUrl,photos[0].imageUrl);
  const after=await read('one');for(const key of Object.keys(before).filter(k=>!['imageUrl','galleryImages','updatedAt'].includes(k)))assert.deepEqual(after[key],before[key],key);
  assert.deepEqual(await read('sibling'),sibling);assert.deepEqual(await read('other'),other);
  r=await call({galleryImages:[photos[1],photos[0]]});assert.equal(r.status,200);assert.equal((await read('one')).imageUrl,photos[1].imageUrl);
  r=await call({galleryImages:[photos[0]]});assert.equal(r.status,200);assert.deepEqual(JSON.parse((await read('one')).galleryImages),[photos[0]]);
  assert.equal((await call({imageUrl:'/legacy.avif'})).status,200);assert.equal(JSON.parse((await read('one')).galleryImages)[0].imageUrl,'/legacy.avif');
  assert.deepEqual(api.getCabinGallery([],before.imageUrl),[{imageUrl:before.imageUrl,caption:''}]);
  const rollback=await read('one');await db.prepare("CREATE TRIGGER isolated_gallery_fail BEFORE UPDATE ON Cabin BEGIN SELECT RAISE(ABORT,'isolated failure'); END").run();
  assert.equal((await call({galleryImages:photos})).status,500);assert.deepEqual(await read('one'),rollback);await db.prepare('DROP TRIGGER isolated_gallery_fail').run();
  let once=true;context.env.DB={prepare:s=>db.prepare(s),batch:async stmts=>{if(once){once=false;await db.prepare("UPDATE User SET isActive=0 WHERE id='admin'").run()}return db.batch(stmts)}};
  assert.equal((await call({galleryImages:photos})).status,403);assert.deepEqual(await read('one'),rollback);
  context.env.DB=db;await db.prepare("UPDATE User SET isActive=1 WHERE id='admin'").run();
  once=true;context.env.DB={prepare:s=>db.prepare(s),batch:async stmts=>{const result=await db.batch(stmts);if(once){once=false;throw Error('isolated lost acknowledgement')}return result}};
  assert.equal((await call({galleryImages:photos})).status,200);context.env.DB=db;
  assert.equal((await call({name:'one',units:3,pricePerHour:125})).status,200);assert.equal((await read('one')).units,3);assert.equal((await read('sibling')).isActive,0);assert.deepEqual(await read('other'),other);
  r=await call({name:'Synthetic new',slug:'synthetic-new',capacity:2,pricePerHour:75,galleryImages:photos},tokens.admin,'','POST');assert.equal(r.status,201,JSON.stringify(r.body));assert.deepEqual(r.body.data.galleryImages,photos);
  assert.equal((await db.prepare('SELECT count(*) n FROM Reservation').first()).n,0);
  assert.deepEqual((await db.prepare('PRAGMA foreign_key_check').all()).results,[]);
  assert.equal((await db.prepare('SELECT count(*) n FROM _aysu_atomic_read_guard').first()).n,0);
  console.log('PASS native D1 cabins: authenticated create/edit, ordered gallery and cover, unchanged inventory for photo-only edits, legacy cover, invalid inputs, rollback, concurrent permission revocation, lost reply, group rules, no real data.');
 } finally { await mf.dispose() }
})().catch(error=>{console.error(error);process.exitCode=1});
