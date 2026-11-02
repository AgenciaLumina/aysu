-- Empty coordination table. Guard rows only exist inside their native batch.
CREATE TABLE _aysu_atomic_read_guard (
  id TEXT PRIMARY KEY NOT NULL,
  valid INTEGER NOT NULL CONSTRAINT _aysu_atomic_read_guard CHECK (valid = 1)
);
