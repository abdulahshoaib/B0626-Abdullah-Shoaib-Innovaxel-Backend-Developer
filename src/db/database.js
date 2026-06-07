import Database from "better-sqlite3";

const dbFile =
  process.env.DB_FILE ||
  (process.env.NODE_ENV === "test" ? "test.sqlite" : "database.sqlite");

const db = new Database(dbFile);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      event_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      total_seats INTEGER NOT NULL CHECK (total_seats > 0),
      event_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS registrations (
      reg_id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active'
      CHECK (status IN ('active', 'cancelled')),
      registered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      cancelled_at TEXT,
      FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_registrations_event_id
    ON registrations(event_id);
    `);
} catch (error) {
  throw new Error("Error initializing database: " + error.message);
}

export default db;
