const fs=require('node:fs'),assert=require('node:assert/strict'),{createRequire}=require('node:module');const runtime=createRequire(fs.realpathSync(require.resolve('wrangler/package.json'))),{Miniflare,convertV4MiniflareOptions}=runtime('miniflare');const {plan,guardedStatements}=require('./lib/individualize-lateral.cjs');
(async()=>{const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("isolated")}}',d1Databases:{DB:'individualize-test'},compatibilityDate:'2026-10-30'}));try{
const db=await mf.getD1Database('DB');await require('./lib/isolated-d1-integrity.cjs')(db);
for(let i=1;i<=6;i++)await db.prepare('INSERT INTO Cabin(id,name,slug,units,isActive,capacity,pricePerHour,updatedAt) VALUES(?,?,?,?,?,?,?,?)').bind('c'+i,i===1?'Bangalô Lateral':`Bangalô Lateral ${i}`,i===1?'bangalo-lateral':null,i===1?6:1,i===1?1:0,5,i===1?600:166.67,'2026-11-04T00:00:00+00:00').run();
const read=async()=>(await db.prepare('SELECT * FROM Cabin ORDER BY id').all()).results;
const before=await read(), p=plan(before,'2026-11-04T03:00:00Z');
await db.prepare("INSERT INTO Reservation(id,cabinId,customerName,customerEmail,customerPhone,checkIn,checkOut,hoursBooked,totalPrice,status,updatedAt,bookingConditions) VALUES('history','c1','Synthetic','test@example.invalid','000','2026-02-03T13:00:00Z','2026-02-03T21:00:00Z',8,600,'CONFIRMED','2026-02-01T00:00:00Z','{\"preserve\":true}')").run();
const history=await db.prepare('SELECT * FROM Reservation').first();const batch=ss=>db.batch(ss.map(s=>db.prepare(s.sql).bind(...s.params)));
await db.prepare("UPDATE Cabin SET description='Concurrent edit' WHERE id='c2'").run();await assert.rejects(batch(p.statements));assert.equal((await read())[0].units,6);await db.prepare("UPDATE Cabin SET description=NULL WHERE id='c2'").run();
// A newly committed future booking stops the entire conversion, including numeric date storage.
await db.prepare("UPDATE Reservation SET checkOut=? WHERE id='history'").bind(Date.parse('2027-02-03T21:00:00Z')).run();await assert.rejects(batch(p.statements));assert.deepEqual(await read(),before);await db.prepare("UPDATE Reservation SET checkOut=? WHERE id='history'").bind(history.checkOut).run();
await db.prepare("CREATE TRIGGER fail_split BEFORE UPDATE ON Cabin WHEN NEW.id='c6' BEGIN SELECT RAISE(ABORT,'synthetic failure'); END").run();await assert.rejects(batch(p.statements));assert.deepEqual(await read(),before);await db.prepare('DROP TRIGGER fail_split').run();
await batch(p.statements);const after=await read();assert.equal(after.filter(c=>c.isActive).length,6);assert.equal(after.reduce((n,c)=>n+c.units,0),6);assert.deepEqual(await db.prepare('SELECT * FROM Reservation').first(),history);
await batch(guardedStatements(after,before,p.today));assert.deepEqual(await read(),before);assert.deepEqual((await db.prepare('PRAGMA foreign_key_check').all()).results,[]);
console.log('PASS split/revert native atomic batch: six retained IDs and slots, untouched reservation snapshot, concurrent edit/future booking guards, late failure rollback. Synthetic only.');
}finally{await mf.dispose()}})().catch(e=>{console.error(e);process.exitCode=1});
