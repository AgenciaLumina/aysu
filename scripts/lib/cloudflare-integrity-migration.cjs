const assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const{buildForeignKeyPlan}=require('./d1-integrity-plan.cjs');
const guard={type:'table',name:'_IntegrationGuard',table:'_IntegrationGuard',sql:'CREATE TABLE "_IntegrationGuard" ("id" TEXT NOT NULL PRIMARY KEY, "ok" INTEGER NOT NULL CHECK ("ok" = 1))'};
const migrationId='20261102_native_relational_integrity';
function withGuard(fixture){assert.ok(!fixture.schema.some(o=>o.name===guard.name),'Review an existing integration guard before rebuilding');return {...fixture,schema:[...fixture.schema,guard]}}
function buildMigration(fixture,{expectedSchema,rollback=false}={}){
 const prepared=withGuard(fixture);const expected=expectedSchema||(rollback?undefined:prepared.schema);assert.ok(expected);
 const core=buildForeignKeyPlan(prepared,{rollback,expectedSchema:expected});
 const statements=rollback?core.statements:[guard.sql.replace('CREATE TABLE','CREATE TABLE IF NOT EXISTS'),...core.statements];
 statements.push('CREATE TABLE IF NOT EXISTS "_CloudflareSchemaMigrations" ("id" TEXT NOT NULL PRIMARY KEY, "planHash" TEXT NOT NULL, "appliedAt" TEXT NOT NULL, "revertedAt" TEXT)');
 const planHash=createHash('sha256').update(JSON.stringify({migrationId,rollback,statements})).digest('hex');
 if(rollback)statements.push(`UPDATE "_CloudflareSchemaMigrations" SET "revertedAt"=strftime('%Y-%m-%dT%H:%M:%f+00:00','now') WHERE id='${migrationId}'`);
 else statements.push(`INSERT INTO "_CloudflareSchemaMigrations"(id,planHash,appliedAt) VALUES('${migrationId}','${planHash}',strftime('%Y-%m-%dT%H:%M:%f+00:00','now'))`);
 const executionHash=createHash('sha256').update(JSON.stringify(statements)).digest('hex');
 return {...core,statements,migrationId,planHash,executionHash};
}
module.exports={guard,withGuard,buildMigration,migrationId};
