// One reviewed inventory conversion. Existing Cabin IDs and all Reservation rows are retained.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const categoryWhere = "(slug='bangalo-lateral' OR slug LIKE 'bangalo-lateral-%' OR name LIKE 'Bangalô Lateral%') AND deletedAt IS NULL";
const endDate = "CASE WHEN typeof(r.checkOut) IN ('integer','real') OR CAST(r.checkOut AS TEXT) NOT GLOB '*[^0-9]*' THEN julianday(r.checkOut/1000.0,'unixepoch') ELSE julianday(r.checkOut) END";
const futureQuery = `SELECT COUNT(*) n FROM Reservation r JOIN Cabin c ON c.id=r.cabinId WHERE c.id IN (SELECT id FROM Cabin WHERE ${categoryWhere}) AND r.status IN ('PENDING','CONFIRMED','CHECKED_IN','IN_PROGRESS') AND (${endDate} IS NULL OR ${endDate} >= julianday(?))`;
function plan(rows, today) {
 assert.equal(rows.length,6,'Expected exactly six existing lateral records');
 const parent=rows.find(r=>r.slug==='bangalo-lateral');assert.ok(parent);assert.equal(parent.units,6);assert.equal(parent.isActive,1);assert.equal(parent.deletedAt,null);
 const ordered=[parent,...Array.from({length:5},(_,i)=>rows.find(r=>r.name===`Bangalô Lateral ${i+2}`))];assert.ok(ordered.every(Boolean));assert.equal(new Set(ordered.map(r=>r.id)).size,6);
 for(const row of ordered.slice(1)){assert.equal(row.isActive,0);assert.equal(row.units,1);assert.equal(row.slug,null);}
 const now=new Date().toISOString();
 const targets=ordered.map((row,i)=>({...row,name:`Bangalô Lateral ${i+1}`,slug:`bangalo-lateral-${i+1}`,units:1,isActive:1,visibilityStatus:parent.visibilityStatus,capacity:parent.capacity,pricePerHour:parent.pricePerHour,category:parent.category,description:parent.description,updatedAt:now}));
 return {before:ordered,after:targets,today,statements:guardedStatements(ordered,targets,today)};
}
function guardedStatements(before,after,today) {
 const op='split:'+randomUUID();const statements=[];
 const guard=(sql,params,expected)=>statements.push({sql:`INSERT INTO _aysu_atomic_read_guard(id,valid) SELECT ?,CASE WHEN (${sql})=? THEN 1 ELSE 0 END`,params:[op+':'+statements.length,...params,expected]});
 guard(`SELECT COUNT(*) FROM Cabin WHERE ${categoryWhere}`,[],6);
 guard(futureQuery,[today],0);
 for(const row of before){const columns=Object.keys(row);guard(`SELECT COUNT(*) FROM Cabin WHERE ${columns.map(k=>`"${k}" IS ?`).join(' AND ')}`,columns.map(k=>row[k]),1);}
 for(const target of after){const previous=before.find(r=>r.id===target.id);const entries=Object.entries(target).filter(([k,v])=>k!=='id'&&previous[k]!==v);if(entries.length)statements.push({sql:`UPDATE Cabin SET ${entries.map(([k])=>`"${k}"=?`).join(',')} WHERE id=?`,params:[...entries.map(([,v])=>v),target.id]});}
 statements.push({sql:'DELETE FROM _aysu_atomic_read_guard WHERE id LIKE ?',params:[op+':%']});return statements;
}
module.exports={plan,guardedStatements,categoryWhere,futureQuery};
