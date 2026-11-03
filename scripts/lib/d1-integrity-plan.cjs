// Preparation only. This module never connects to production or executes SQL.
const quote = value => '"' + value.replaceAll('"', '""') + '"';
const literal = value => "'" + value.replaceAll("'", "''") + "'";
const schemaQuery = "SELECT type,name,tbl_name AS 'table',sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY type,name";
function buildForeignKeyPlan(fixture, options = {}) {
  const relations = fixture.foreignKeys;
  const tables = [...new Set([...relations.flatMap(relation => [relation.table, relation.parent]), ...(fixture.rebuildTables || [])])].sort();
  const tableSet = new Set(tables);
  const temporary = name => '__d1_integrity_' + name;
  const statements = ['PRAGMA defer_foreign_keys=ON'];
  // The executor supplies the reviewed, freshly read schema. Recheck it inside
  // the same transaction as the copy, so an intervening DDL change aborts safely.
  if (options.expectedSchema) {
    const expected = options.expectedSchema;
    statements.push(`INSERT INTO "_IntegrationGuard" (id,ok) SELECT 'd1-integrity-schema-count',COUNT(*)=${expected.length} FROM (${schemaQuery})`);
    expected.forEach((object, index) => {
      statements.push(`INSERT INTO "_IntegrationGuard" (id,ok) SELECT 'd1-integrity-schema-${index}',EXISTS(SELECT 1 FROM sqlite_master WHERE type=${literal(object.type)} AND name=${literal(object.name)} AND tbl_name=${literal(object.table)} AND sql=${literal(object.sql)})`);
    });
    statements.push(`DELETE FROM "_IntegrationGuard" WHERE id LIKE 'd1-integrity-schema-%'`);
  }
  for (const table of tables) {
    const definitions = options.rollback ? fixture.schema : (fixture.targetSchema || fixture.schema);
    const ddl = definitions.find(item => item.type === 'table' && item.name === table)?.sql;
    if (!ddl || /\bREFERENCES\b/i.test(ddl)) throw new Error('Expected the exact migrated schema without existing foreign keys: ' + table);
    const prefix = /^CREATE TABLE\s+(?:"[^"]+"|\w+)\s*\(/i;
    if (!prefix.test(ddl) || !ddl.trimEnd().endsWith(')')) throw new Error('Unsupported source DDL: ' + table);
    const constraints = (options.rollback ? [] : relations.filter(relation => relation.table === table)).map(relation => {
      if (![relation.onDelete, relation.onUpdate].every(action => ['CASCADE','SET NULL','RESTRICT','NO ACTION'].includes(action))) throw new Error('Unsupported action');
      return `CONSTRAINT ${quote(relation.name)} FOREIGN KEY (${relation.columns.map(quote).join(',')}) REFERENCES ${quote(temporary(relation.parent))}(${relation.parentColumns.map(quote).join(',')}) ON UPDATE ${relation.onUpdate} ON DELETE ${relation.onDelete}`;
    });
    statements.push(ddl.replace(prefix, `CREATE TABLE ${quote(temporary(table))} (`).trimEnd().slice(0,-1) + (constraints.length ? ',\n'+constraints.join(',\n') : '') + '\n)');
  }
  for (const table of tables) statements.push(`INSERT INTO ${quote(temporary(table))} SELECT * FROM ${quote(table)}`);
  // Compare every column of both sets before any original table is removed.
  // The count check also protects multiplicity if a future table allows duplicates.
  for (const table of tables) statements.push(`INSERT INTO "_IntegrationGuard" (id,ok) SELECT ${literal('d1-integrity-copy-' + table)},(SELECT COUNT(*) FROM ${quote(table)})=(SELECT COUNT(*) FROM ${quote(temporary(table))}) AND NOT EXISTS(SELECT * FROM ${quote(table)} EXCEPT SELECT * FROM ${quote(temporary(table))}) AND NOT EXISTS(SELECT * FROM ${quote(temporary(table))} EXCEPT SELECT * FROM ${quote(table)})`);
  statements.push(`DELETE FROM "_IntegrationGuard" WHERE id LIKE 'd1-integrity-copy-%'`);
  // New tables reference only other new tables, so dropping the original tables
  // cannot cascade into the copies. The caller must verify zero pre-existing FKs.
  const dropOrder = options.rollback ? childFirstOrder(tables, relations) : tables;
  for (const table of dropOrder) statements.push(`DROP TABLE ${quote(table)}`);
  for (const table of tables) statements.push(`ALTER TABLE ${quote(temporary(table))} RENAME TO ${quote(table)}`);
  if (!options.rollback) {
    for (const serial of fixture.serialFloors || []) {
      if (!Number.isSafeInteger(serial.floor) || serial.floor < 0 || !tableSet.has(serial.table)) throw new Error('Invalid reviewed sequence floor');
      statements.push(`INSERT INTO sqlite_sequence(name,seq) SELECT ${literal(serial.table)},${serial.floor} WHERE NOT EXISTS(SELECT 1 FROM sqlite_sequence WHERE name=${literal(serial.table)})`);
      statements.push(`UPDATE sqlite_sequence SET seq=MAX(seq,${serial.floor}) WHERE name=${literal(serial.table)}`);
    }
  }
  for (const object of fixture.schema) {
    if (object.type === 'index' && tableSet.has(object.table)) statements.push(object.sql);
    if (object.type === 'trigger' && tableSet.has(object.table)) {
      const hash=require('node:crypto').createHash('sha256').update(object.sql).digest('hex');
      if (!(fixture.reviewedTriggers || []).some(t=>t.name===object.name&&t.sha256===hash)) throw new Error('Existing trigger requires explicit review: '+object.name);
      statements.push(object.sql);
    }
    if (object.type === 'view') throw new Error('Existing view requires explicit review: ' + object.name);
  }
  statements.push('PRAGMA foreign_key_check');
  // Fail the batch before ending deferral if any row is invalid. SQLite can
  // otherwise clear deferred counters when deferral is switched off.
  statements.push(`INSERT INTO "_IntegrationGuard" (id,ok) SELECT 'd1-integrity-rebuild-check',NOT EXISTS(SELECT 1 FROM pragma_foreign_key_check)`);
  statements.push(`DELETE FROM "_IntegrationGuard" WHERE id='d1-integrity-rebuild-check'`);
  statements.push('PRAGMA defer_foreign_keys=OFF');
  return { tables, statements, foreignKeyCount: options.rollback ? 0 : relations.length };
}
function childFirstOrder(tables, relations) {
  const remaining = new Set(tables), ordered = [];
  while (remaining.size) {
    const ready = [...remaining].filter(table => !relations.some(relation => relation.parent === table && relation.table !== table && remaining.has(relation.table)));
    if (!ready.length) throw new Error('Cyclic foreign keys require a separately reviewed rollback plan');
    for (const table of ready) { ordered.push(table); remaining.delete(table); }
  }
  return ordered;
}
module.exports = { buildForeignKeyPlan, childFirstOrder, quote, schemaQuery };
