// Synthetic native D1: individual inventory, category inheritance and old aggregate links.
const fs = require('node:fs'), assert = require('node:assert/strict'), { randomUUID } = require('node:crypto'), { createRequire } = require('node:module');
const runtime = createRequire(fs.realpathSync(require.resolve('wrangler/package.json')));
const { Miniflare, convertV4MiniflareOptions } = runtime('miniflare');
const { NextRequest } = require('next/server');
(async () => {
 const mf = new Miniflare(convertV4MiniflareOptions({ modules:true, script:'export default {fetch(){return new Response("isolated")}}', d1Databases:{DB:'numbered-cabins-isolated'}, compatibilityDate:'2026-10-30' }));
 try {
  const db = await mf.getD1Database('DB'); await require('./lib/isolated-d1-integrity.cjs')(db);
  const context = { env:{DB:db,JWT_SECRET:'isolated-only-secret'},ctx:{} };
  const api = await require('./helpers/load-d1-test-bundle.cjs')(`export {POST} from './src/app/api/cabins/route'; export {PATCH} from './src/app/api/cabins/[id]/route'; export {GET as availability} from './src/app/api/reservations/availability/route'; export {generateToken} from './src/lib/auth'; export {createBooking,readBookingContext} from './src/lib/reservation-booking'; export {prisma} from './src/lib/db';`, context);
  await db.prepare('INSERT INTO User(id,email,name,role,passwordHash,updatedAt) VALUES(?,?,?,?,?,?)').bind('admin','admin@example.invalid','Synthetic','ADMIN','unused','2026-11-04T00:00:00+00:00').run();
  const token = api.generateToken({id:'admin',email:'admin@example.invalid',name:'Synthetic',role:'ADMIN'});
  const call = async (data,id,auth=token) => { context.ctx={}; const r=new NextRequest('http://localhost/api/cabins'+(id?'/'+id:''),{method:id?'PATCH':'POST',headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+auth}:{})},body:JSON.stringify(data)}); const response=id?await api.PATCH(r,{params:Promise.resolve({id})}):await api.POST(r); return {status:response.status,body:await response.json()}; };
  const cabins=[];
  for(let i=1;i<=6;i++) {
   const result=await call({name:`Bangalô Lateral - ${i}`,capacity:5,units:1,pricePerHour:600,description:`Descrição sintética ${i}`,galleryImages:[{imageUrl:`/isolated-${i}.avif`,caption:`Vista ${i}`}]});
   assert.equal(result.status,201,JSON.stringify(result.body)); assert.equal(result.body.data.slug,`bangalo-lateral-${i}`); cabins.push(result.body.data);
  }
  assert.equal((await call({name:'Bangalô Lateral 1',capacity:5,pricePerHour:600})).status,409);
  assert.equal((await call({name:'Bangalô Lateral',capacity:5,units:6,pricePerHour:600})).status,409);
  assert.equal((await call({name:'Bangalô Piscina 1',capacity:5,units:2,pricePerHour:600})).status,400);
  assert.equal((await call({units:2},cabins[0].id)).status,400);
  assert.equal((await call({description:'Forbidden'},cabins[0].id,null)).status,403);
  const before=(await db.prepare('SELECT * FROM Cabin ORDER BY id').all()).results;
  assert.equal((await call({description:'Nova descrição da unidade 2',galleryImages:[{imageUrl:'/isolated-other.avif',caption:'Vista própria'}]},cabins[1].id)).status,200);
  const after=(await db.prepare('SELECT * FROM Cabin ORDER BY id').all()).results;
  assert.deepEqual(after.filter(c=>c.id!==cabins[1].id),before.filter(c=>c.id!==cabins[1].id));
  assert.equal(after.filter(c=>c.isActive).reduce((n,c)=>n+c.units,0),6);
  await db.prepare('INSERT INTO ReservationGlobalConfig(id,reservableItems,priceOverrides,commercialConditions,updatedAt) VALUES(?,?,?,?,?)').bind('default','{"bangalos":true}',JSON.stringify({'bangalo-lateral':{price:650,consumable:500}}),JSON.stringify({'bangalo-lateral':{text:'Condição da categoria',maxParticipants:5}}),'2026-11-04T00:00:00+00:00').run();
  const quote=async(key,date='2027-02-03')=>{context.ctx={};return (await api.readBookingContext(api.prisma,key,date,2)).quote};
  for(const c of cabins) { const q=await quote(c.slug);assert.equal(q.spaceName,c.name);assert.equal(q.available,1);assert.equal(q.unitPrice,650);assert.equal(q.unitConsumable,500);assert.equal(q.condition.text,'Condição da categoria'); }
  assert.equal((await quote('bangalo-lateral')).available,6);
  await db.prepare('INSERT INTO ReservationDayConfig(id,date,status,reservationsEnabled,reservableItems,priceOverrides,commercialConditions,updatedAt) VALUES(?,?,?,?,?,?,?,?)').bind(randomUUID(),'2027-02-04T12:00:00.000+00:00','NORMAL',1,'{"bangalos":true}',JSON.stringify({'bangalo-lateral':{price:750,consumable:550}}),JSON.stringify({'bangalo-lateral':{text:'Condição da data'}}),'2026-11-04T00:00:00+00:00').run();
  assert.equal((await quote(cabins[0].slug,'2027-02-04')).unitPrice,750);assert.equal((await quote(cabins[5].slug,'2027-02-04')).condition.text,'Condição da data');
  const input=(key,date='2027-02-03')=>({cabinId:key,customerName:'Synthetic',customerEmail:'test@example.invalid',customerPhone:'00000000000',checkIn:date+'T13:00:00Z',checkOut:date+'T21:00:00Z',participantCount:2,source:'ONLINE',policyAccepted:true,requestId:randomUUID()});
  const first=input(cabins[0].slug), booking=await api.createBooking(first,null);assert.equal(booking.cabinId,cabins[0].id);assert.equal(booking.unitNumber,1);
  assert.equal((await api.createBooking(first,null)).id,booking.id);await assert.rejects(api.createBooking({...first,cabinId: cabins[1].slug},null),{status:409});
  await assert.rejects(api.createBooking(input(cabins[0].slug),null),{status:409});assert.equal((await quote(cabins[1].slug)).available,1);
  const availability=async(query)=>{context.ctx={};const r=await api.availability(new NextRequest('http://localhost/api/reservations/availability?'+query));assert.equal(r.status,200);return(await r.json()).data};
  const daily=await availability('date=2027-02-03');assert.equal(daily[cabins[0].slug],0);assert.equal(daily[cabins[1].slug],1);assert.equal(daily['bangalo-lateral'],5);
  assert.equal((await availability('cabinId='+cabins[0].slug+'&year=2027&month=2')).find(x=>x.date==='2027-02-03').available,false);
  assert.equal((await availability('cabinId=bangalo-lateral&year=2027&month=2')).find(x=>x.date==='2027-02-03').available,true);
  assert.ok((await availability('cabinId='+cabins[0].slug+'&date=2027-02-03')).slots.every(x=>x.isOccupied));
  const generic=input('bangalo-lateral');const genericBooking=await api.createBooking(generic,null);assert.notEqual(genericBooking.cabinId,cabins[0].id);assert.equal((await api.createBooking(generic,null)).id,genericBooking.id);
  // A generic request and a selected-unit request share one guarded inventory.
  let arrived=0,release;const barrier=new Promise(r=>release=r);
  context.env.DB={prepare:s=>db.prepare(s),batch:async stmts=>{if(++arrived===7)release();await barrier;return db.batch(stmts)}};
  const raceInputs=[...cabins.map(c=>input(c.slug,'2027-02-05')),input('bangalo-lateral','2027-02-05')];
  const race=await Promise.allSettled(raceInputs.map(x=>api.createBooking(x,null)));context.env.DB=db;context.ctx={};
  const wins=race.filter(x=>x.status==='fulfilled');if(wins.length!==6)console.error(race.map(x=>x.status==='fulfilled'?{cabin:x.value.cabinId}:{error:x.reason?.message,status:x.reason?.status}));assert.equal(wins.length,6);assert.equal(new Set(wins.map(x=>x.value.cabinId)).size,6);assert.ok(race.filter(x=>x.status==='rejected').every(x=>x.reason.status===409));
  assert.deepEqual((await db.prepare('PRAGMA foreign_key_check').all()).results,[]);assert.equal((await db.prepare('SELECT count(*) n FROM _aysu_atomic_read_guard').first()).n,0);
  console.log('PASS six individual cabins: native create/edit, independent photos/descriptions, quantity and duplicate guards, permissions, category/date prices, exact-unit booking, idempotency, daily/monthly/hourly availability, legacy links and competing aggregate/individual bookings. Synthetic only.');
 } finally {await mf.dispose()}
})().catch(e=>{console.error(e);process.exitCode=1});
