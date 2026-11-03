const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const req=createRequire(require('node:fs').realpathSync(require.resolve('wrangler/package.json',{paths:[require('node:path').join(__dirname,'../apps/storefront')]})));
const { Miniflare, convertV4MiniflareOptions } = req('miniflare');
const {withGuard}=require('./lib/cloudflare-integrity-migration.cjs');
const fixture = withGuard(require('./fixtures/d1-integrity.json'));
const firstRelation=fixture.foreignKeys[0];
const { buildForeignKeyPlan, quote, schemaQuery } = require('./lib/d1-integrity-plan.cjs');

async function main() {
  const mf = new Miniflare(convertV4MiniflareOptions({ modules:true,script:'export default {fetch(){return new Response("isolated")}}',d1Databases:{DB:'aysu-integrity-isolated'},compatibilityDate:'2026-10-30' }));
  try {
    const db=await mf.getD1Database('DB');
    const ordered=[...fixture.schema].sort((a,b)=>(a.type==='table'?0:1)-(b.type==='table'?0:1));
    for(let start=0;start<ordered.length;start+=40) await db.batch(ordered.slice(start,start+40).map(object=>db.prepare(object.sql)));
    const info=new Map();let sequence=0;
    for(const item of fixture.schema.filter(item=>item.type==='table')) info.set(item.name,(await db.prepare(`PRAGMA table_info(${quote(item.name)})`).all()).results);
    async function seed(table, overrides={}) {
      const columns=info.get(table), data={...overrides}; const unique=++sequence;
      for(const relation of fixture.foreignKeys.filter(relation=>relation.table===table)) {
        assert.equal(relation.columns.length,1);assert.deepEqual(relation.parentColumns,['id']);
        const name=relation.columns[0];const column=columns.find(column=>column.name===name);
        if(!(name in data) && column.notnull) data[name]=(await seed(relation.parent)).id;
      }
      for(const column of columns) {
        if(column.name in data || column.dflt_value!==null)continue;
        if(!column.notnull && !column.pk)continue;
        const domain=fixture.enumDomains.find(item=>item.table===table&&item.column===column.name);
        data[column.name]=domain?domain.values[0]:/INT|REAL|FLOAT|DOUBLE|NUMERIC/i.test(column.type)?(column.pk?unique:1):/DATE|TIME/i.test(column.type)?'2026-11-02T00:00:00.000+00:00':`synthetic_${table}_${column.name}_${unique}`;
      }
      const fields=Object.keys(data);
      return db.prepare(`INSERT INTO ${quote(table)} (${fields.map(quote).join(',')}) VALUES (${fields.map(()=>'?').join(',')}) RETURNING *`).bind(...fields.map(field=>data[field])).first();
    }
    const cases=[];
    for(const relation of fixture.foreignKeys) {
      const parent=await seed(relation.parent), child=await seed(relation.table,{[relation.columns[0]]:parent.id});
      cases.push({relation,parent,child});
    }
    const readRow=async(table,row)=>{
      const pk=info.get(table).filter(column=>column.pk).sort((a,b)=>a.pk-b.pk).map(column=>column.name);
      return db.prepare(`SELECT * FROM ${quote(table)} WHERE ${pk.map(column=>quote(column)+' IS ?').join(' AND ')}`).bind(...pk.map(column=>row[column])).first();
    };
    const rowWhere=(table,row)=>{
      const pk=info.get(table).filter(column=>column.pk).sort((a,b)=>a.pk-b.pk).map(column=>column.name);
      return {sql:pk.map(column=>quote(column)+' IS ?').join(' AND '),params:pk.map(column=>row[column])};
    };
    const snapshot=async()=>{
      const result={};
      for(const table of info.keys())result[table]=(await db.prepare(`SELECT * FROM ${quote(table)}`).all()).results.map(row=>JSON.stringify(row)).sort();
      return result;
    };
    const schemaBefore=(await db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY type,name").all()).results;
    const expectedSchema=(await db.prepare(schemaQuery).all()).results;
    const plan=buildForeignKeyPlan(fixture,{expectedSchema});
    await db.exec('CREATE TABLE UnexpectedSchema (id TEXT PRIMARY KEY)');
    await assert.rejects(db.batch(plan.statements.map(sql=>db.prepare(sql))),/CHECK constraint failed/);
    assert.equal((await db.prepare('PRAGMA foreign_key_list('+quote(firstRelation.table)+')').all()).results.length,0);
    await db.exec('DROP TABLE UnexpectedSchema');
    const orphan=await seed(firstRelation.table,{[firstRelation.columns[0]]:'missing_parent'});
    const withOrphan=await snapshot();
    await assert.rejects(db.batch(plan.statements.map(sql=>db.prepare(sql))),/CHECK constraint failed|FOREIGN KEY constraint failed/);
    assert.deepEqual(await snapshot(),withOrphan,'Existing orphan must abort and preserve the original database');
    assert.equal((await db.prepare('PRAGMA foreign_key_list('+quote(firstRelation.table)+')').all()).results.length,0);
    const orphanWhere=rowWhere(firstRelation.table,orphan);await db.prepare('DELETE FROM '+quote(firstRelation.table)+' WHERE '+orphanWhere.sql).bind(...orphanWhere.params).run();
    const dataBefore=await snapshot();
    assert.equal(plan.foreignKeyCount,fixture.foreignKeys.length);assert.equal(plan.tables.length,fixture.rebuildTables.length);
    await assert.rejects(db.batch([...plan.statements.map(sql=>db.prepare(sql)),db.prepare('INSERT INTO "_IntegrationGuard" (id,ok) VALUES (?,0)').bind('rollback-fixture')]),/CHECK constraint failed/);
    assert.deepEqual(await snapshot(),dataBefore,'Late failure must restore every original row');
    assert.deepEqual((await db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY type,name").all()).results,schemaBefore,'Late failure must restore original table/index definitions');
    const migrated=await db.batch(plan.statements.map(sql=>db.prepare(sql)));
    assert.deepEqual(migrated.at(-1).results,[]);assert.deepEqual(await snapshot(),dataBefore,'Successful migration preserves every value');
    let foreignKeys=0;
    for(const table of plan.tables)foreignKeys+=(await db.prepare(`PRAGMA foreign_key_list(${quote(table)})`).all()).results.length;
    assert.equal(foreignKeys,fixture.foreignKeys.length);
    assert.equal((await db.prepare("SELECT count(*) n FROM sqlite_master WHERE name LIKE '__d1_integrity_%'").first()).n,0);
    const originalIndexes=fixture.schema.filter(item=>item.type==='index').map(item=>item.name).sort();
    const actualIndexes=(await db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND sql IS NOT NULL").all()).results.map(row=>row.name).sort();
    assert.deepEqual(actualIndexes,originalIndexes);

    for(const {relation,parent,child} of cases) {
      const column=relation.columns[0];
      await assert.rejects(seed(relation.table,{[column]:'missing_parent'}),/FOREIGN KEY constraint failed/,relation.name+' insert');
      const where=rowWhere(relation.table,child);
      await assert.rejects(db.prepare(`UPDATE ${quote(relation.table)} SET ${quote(column)}=? WHERE ${where.sql}`).bind('missing_parent',...where.params).run(),/FOREIGN KEY constraint failed/,relation.name+' update');
      assert.deepEqual(await readRow(relation.table,child),child);
      const renamed=typeof parent.id==='number'?parent.id+10_000_000:parent.id+'_renamed';
      await db.prepare(`UPDATE ${quote(relation.parent)} SET id=? WHERE id=?`).bind(renamed,parent.id).run();
      const renamedChild={...child,[column]:renamed};
      assert.equal((await readRow(relation.table,renamedChild))[column],renamed,relation.name+' update cascade');
      if(relation.onDelete==='RESTRICT') {
        await assert.rejects(db.prepare(`DELETE FROM ${quote(relation.parent)} WHERE id=?`).bind(renamed).run(),/FOREIGN KEY constraint failed/);
        assert.ok(await readRow(relation.table,renamedChild));
      } else {
        await db.prepare(`DELETE FROM ${quote(relation.parent)} WHERE id=?`).bind(renamed).run();
        const remaining=await readRow(relation.table,renamedChild);
        if(relation.onDelete==='CASCADE')assert.equal(remaining,null,relation.name+' delete cascade');
        else assert.equal(remaining[column],null,relation.name+' set null');
      }
    }
    assert.deepEqual((await db.prepare('PRAGMA foreign_key_check').all()).results,[]);
    assert.deepEqual((await db.prepare('PRAGMA quick_check').all()).results,[{quick_check:'ok'}]);
    // Native FKs allow a child before its parent inside one multirow statement.
    // A row trigger cannot reproduce this statement-level guarantee.
    await db.prepare('CREATE TABLE native_probe(id TEXT PRIMARY KEY,parentId TEXT REFERENCES native_probe(id))').run();
    await db.prepare("INSERT INTO native_probe(id,parentId) VALUES ('child','parent'),('parent',NULL)").run();
    await db.prepare('CREATE TABLE trigger_probe(id TEXT PRIMARY KEY,parentId TEXT)').run();
    await db.prepare("CREATE TRIGGER trigger_probe_fk AFTER INSERT ON trigger_probe WHEN NEW.parentId IS NOT NULL AND NOT EXISTS(SELECT 1 FROM trigger_probe WHERE id=NEW.parentId) BEGIN SELECT RAISE(ABORT,'row trigger limitation'); END").run();
    await assert.rejects(db.prepare("INSERT INTO trigger_probe(id,parentId) VALUES ('child','parent'),('parent',NULL)").run(),/row trigger limitation/);
    for(const domain of fixture.enumDomains){
      const row=await seed(domain.table),where=rowWhere(domain.table,row);
      await assert.rejects(db.prepare(`UPDATE ${quote(domain.table)} SET ${quote(domain.column)}=? WHERE ${where.sql}`).bind('SYNTHETIC_INVALID_DOMAIN',...where.params).run(),/CHECK constraint failed/);
      assert.deepEqual(await readRow(domain.table,row),row);
    }
    for(const required of fixture.requiredColumns){
      const row=await seed(required.table),where=rowWhere(required.table,row);
      await assert.rejects(db.prepare(`UPDATE ${quote(required.table)} SET ${quote(required.column)}=NULL WHERE ${where.sql}`).bind(...where.params).run(),/NOT NULL constraint failed/);
      assert.deepEqual(await readRow(required.table,row),row);
    }
    console.log(JSON.stringify({status:'passed',nativeForeignKeys:foreignKeys,nativeEnumDomains:fixture.enumDomains.length,restoredNotNullColumns:fixture.requiredColumns.length,rebuiltTables:plan.tables.length,batchStatements:plan.statements.length,exactRowPreservation:true,lateFailureRestoresSchemaAndRows:true,perRelationInsertUpdateDeleteChecks:cases.length,logicalOrphans:0,triggerEquivalenceRejected:true,productionWrites:0}));
  } finally {await mf.dispose();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
