// Actual public booking handler, isolated D1. No payments, emails or messages.
const fs=require('node:fs'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto'),{createRequire}=require('node:module');
const runtime=createRequire(fs.realpathSync(require.resolve('wrangler/package.json'))),{Miniflare,convertV4MiniflareOptions}=runtime('miniflare');
const {NextRequest}=require('next/server');
(async()=>{
 const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("isolated")}}',d1Databases:{DB:'two-step-isolated'},compatibilityDate:'2026-10-30'}));
 try{
 const db=await mf.getD1Database('DB');await require('./lib/isolated-d1-integrity.cjs')(db);
 const context={env:{DB:db},ctx:{}}; const api=await require('./helpers/load-d1-test-bundle.cjs')(`export {POST} from './src/app/api/reservations/route'; export {getReservationReceipt,canPayReservation} from './src/lib/reservation-receipt';export {readBookingContext,updateBooking} from './src/lib/reservation-booking';export {prisma} from './src/lib/db';`,context);
 const cabin=randomUUID();await db.prepare('INSERT INTO Cabin(id,name,slug,capacity,units,pricePerHour,updatedAt) VALUES(?,?,?,?,?,?,?)').bind(cabin,'Synthetic reservation','sunbed-casal',2,1,1000,'2026-11-04T00:00:00+00:00').run();
 const input={cabinId:cabin,customerName:'Synthetic only',customerEmail:'test@example.invalid',customerPhone:'',checkIn:'2027-02-03T13:00:00Z',checkOut:'2027-02-03T21:00:00Z',participantCount:2,source:'ONLINE',policyAccepted:true,requestId:randomUUID()};
 const call=async(body)=>{context.ctx={};const r=await api.POST(new NextRequest('http://localhost/api/reservations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));return{status:r.status,body:await r.json()}};
 assert.equal((await call({...input,policyAccepted:false})).status,400);assert.equal((await db.prepare('SELECT count(*) n FROM Reservation').first()).n,0);
 assert.equal(await api.getReservationReceipt('bad'),null);assert.equal(await api.getReservationReceipt(randomUUID()),null);assert.equal(api.canPayReservation(null),false);
 const response=await call(input);assert.equal(response.status,201,JSON.stringify(response.body));const saved=response.body.data;
 assert.equal((await db.prepare('SELECT status FROM Reservation WHERE id=?').bind(saved.id).first()).status,'PENDING');
 const receipt=await api.getReservationReceipt(saved.receiptToken);assert.equal(api.canPayReservation(receipt),true);assert(!('customerEmail' in receipt));assert(!('customerName' in receipt));
 await assert.rejects(api.readBookingContext(api.prisma,cabin,'2027-02-03',2),{status:409});
 assert.equal((await call(input)).body.data.id,saved.id);assert.equal((await call({...input,requestId:randomUUID()})).status,409);
 assert.equal((await db.prepare('SELECT count(*) n FROM Reservation').first()).n,1);
 await api.updateBooking(saved.id,{status:'CANCELLED'});assert.equal(api.canPayReservation(await api.getReservationReceipt(saved.receiptToken)),false);
 assert.equal(api.canPayReservation({...receipt,status:'CONFIRMED'}),false);assert.equal(api.canPayReservation({...receipt,checkOut:new Date('2020-01-01')}),false);
 const pending=process.env.PENDING_HOLD_MINUTES;process.env.PENDING_HOLD_MINUTES='15';assert.equal(api.canPayReservation({...receipt,createdAt:new Date(Date.now()-16*60*1000)}),false);if(pending===undefined)delete process.env.PENDING_HOLD_MINUTES;else process.env.PENDING_HOLD_MINUTES=pending;
 let lost=true;context.env.DB={prepare:s=>db.prepare(s),batch:async stmts=>{const result=await db.batch(stmts);if(lost){lost=false;throw Error('isolated lost reply')}return result}};
 const retry={...input,requestId:randomUUID()};assert.equal((await call(retry)).status,503);context.env.DB=db;
 const resumed=await call(retry);assert.equal(resumed.status,201);assert.equal(api.canPayReservation(await api.getReservationReceipt(resumed.body.data.receiptToken)),true);
 assert.equal((await db.prepare('SELECT count(*) n FROM Reservation WHERE requestId=?').bind(retry.requestId).first()).n,1);
 assert.deepEqual((await db.prepare('PRAGMA foreign_key_check').all()).results,[]);
 console.log('PASS two-step: terms before hold, committed PENDING before payment, capacity occupied before receipt, duplicate/retry/lost response safe, invalid/cancelled/expired receipts hide Pix, no PII in receipt. Synthetic only.');
 }finally{await mf.dispose()}
})().catch(e=>{console.error(e);process.exitCode=1});
