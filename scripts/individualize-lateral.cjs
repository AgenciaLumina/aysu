// Operator-only. Read-only plan by default; no public maintenance endpoint.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {getPlatformProxy}=require('wrangler');const {plan,categoryWhere,futureQuery}=require('./lib/individualize-lateral.cjs');
const hash=x=>createHash('sha256').update(x).digest('hex'),save=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2),{mode:0o600});
const sorted=x=>[...x].sort((a,b)=>a.id.localeCompare(b.id));
(async()=>{
 const args=Object.fromEntries(process.argv.slice(2).map(a=>{const i=a.indexOf('=');assert.ok(a.startsWith('--')&&i>2);return[a.slice(2,i),a.slice(i+1)]}));
 assert.ok(args.config&&args.plan&&args.output);const mode=args.mode||'plan';assert.ok(['plan','apply'].includes(mode));
 const config=JSON.parse(fs.readFileSync(args.config));assert.equal(config.account_id,'082470a50b13e1a72fb29987889950ea');assert.equal(config.d1_databases.length,1);assert.equal(config.d1_databases[0].database_id,'a2a3b8a6-3811-4a7d-ba68-38d52c9f1e89');assert.equal(config.d1_databases[0].remote,true);assert.equal(config.routes,undefined);
 const proxy=await getPlatformProxy({configPath:path.resolve(args.config),envFiles:[],persist:false,remoteBindings:true});
 try {
  const db=proxy.env.DB,read=async()=>(await db.prepare(`SELECT * FROM Cabin WHERE ${categoryWhere} ORDER BY id`).all()).results;
  if(mode==='plan'){
   const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())+'T00:00:00-03:00';
   assert.equal((await db.prepare(futureQuery).bind(today).first()).n,0,'Future bookings require an allocation review before conversion');
   const p=plan(await read(),today);save(args.plan,p);save(args.output,{mode,plannedCabins:6,totalSlots:6,reservationWrites:0,planSha256:hash(fs.readFileSync(args.plan))});console.log('Plan saved: six existing IDs, six slots, no reservation writes.');return;
  }
  assert.equal(hash(fs.readFileSync(args.plan)),args.sha256,'Reviewed plan hash required');
  const backup=JSON.parse(fs.readFileSync(args.backup));assert.equal(backup.quickCheck,'ok');assert.equal(backup.foreignKeyErrors,0);assert.equal(hash(fs.readFileSync(args['backup-sql'])),backup.sha256);assert.ok(Date.now()-new Date(backup.at).getTime()<30*60_000,'Fresh restored backup required');
  const p=JSON.parse(fs.readFileSync(args.plan));assert.deepEqual(sorted(await read()),sorted(p.before));
  const reservationFingerprint=async()=>hash(JSON.stringify((await db.prepare('SELECT * FROM Reservation ORDER BY id').all()).results));const beforeHash=await reservationFingerprint();
  let reconciled=false;
  try{await db.batch(p.statements.map(s=>db.prepare(s.sql).bind(...s.params)))}catch(error){if(JSON.stringify(sorted(await read()))!==JSON.stringify(sorted(p.after)))throw error;reconciled=true;}
  assert.deepEqual(sorted(await read()),sorted(p.after));assert.deepEqual((await db.prepare('PRAGMA foreign_key_check').all()).results,[]);
  const afterHash=await reservationFingerprint();const result={at:new Date().toISOString(),applied:true,cabins:6,totalSlots:6,reservationWrites:0,reservationsByteEqual:beforeHash===afterHash,reconciled,foreignKeyErrors:0};save(args.output,result);console.log(JSON.stringify(result));
 }finally{await proxy.dispose()}
})().catch(e=>{console.error(e.message);process.exitCode=1});
