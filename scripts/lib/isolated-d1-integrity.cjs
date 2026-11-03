// Test-only: complete production schema and reviewed native constraints, no remote bindings.
const assert=require('node:assert/strict');
const fixture=require('../fixtures/d1-integrity.json');
const {buildMigration}=require('./cloudflare-integrity-migration.cjs');
module.exports=async function initializeIsolatedIntegrity(db){
 const objects=[...fixture.schema].sort((a,b)=>(a.type==='table'?0:1)-(b.type==='table'?0:1));
 for(let i=0;i<objects.length;i+=40)await db.batch(objects.slice(i,i+40).map(o=>db.prepare(o.sql)));
 const plan=buildMigration(fixture);
 await db.batch(plan.statements.map(sql=>db.prepare(sql)));
 assert.deepEqual((await db.prepare('PRAGMA foreign_key_check').all()).results,[]);
};
