-- Run inside a read-only repeatable-read transaction with UTC timezone.
-- Only counts and digests leave the database. No customer data is emitted.
SELECT format(
  'SELECT %L AS table_name, count(*) AS rows, md5(coalesce(string_agg(row_hash, '''' ORDER BY row_hash COLLATE "C"), '''')) AS digest FROM (SELECT md5(row_to_json(t)::text) AS row_hash FROM %I.%I t) hashed;',
  tablename, schemaname, tablename
)
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename COLLATE "C"
\gexec
