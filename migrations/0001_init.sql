CREATE TABLE IF NOT EXISTS students (
  username   TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  student    TEXT NOT NULL,
  event_type TEXT NOT NULL,
  unit       TEXT,
  word       TEXT,
  correct    INTEGER,
  meta       TEXT,
  ts         INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_student ON quiz_events(student);
CREATE INDEX IF NOT EXISTS idx_student_unit ON quiz_events(student, unit);
CREATE INDEX IF NOT EXISTS idx_student_event ON quiz_events(student, event_type);
