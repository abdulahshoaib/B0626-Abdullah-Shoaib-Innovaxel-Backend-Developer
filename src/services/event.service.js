import db from "../db/database.js";

export function createEventService(data) {
  const { name, total_seats, event_date } = data;

  // malformed event name
  if (!name || name.trim() === "") {
    const error = new Error("Event Name is required");
    error.statusCode = 400;
    throw error;
  }

  if (!total_seats || total_seats <= 0) {
    const error = new Error("Total seats must be greater than 0");
    error.statusCode = 400;
    throw error;
  }

  if (!event_date) {
    const error = new Error("Event date is required");
    error.statusCode = 400;
    throw error;
  }

  const eventDate = new Date(event_date);
  const now = new Date();

  if (Number.isNaN(eventDate.getTime())) {
    const error = new Error("Invalid event date");
    error.statusCode = 400;
    throw error;
  }
  if (eventDate <= now) {
    const error = new Error("Event date must be in the future");
    error.statusCode = 400;
    throw error;
  }

  const existingEvent = db
    .prepare("SELECT id FROM events WHERE name = ?")
    .get(name.trim());

  if (existingEvent) {
    const error = new Error("Event name must be unique");
    error.statusCode = 409;
    throw error;
  }
  const result = db
    .prepare(
      ` INSERT INTO events (name, total_seats, event_date)
      VALUES (?, ?, ?) `,
    )
    .run(name.trim(), total_seats, event_date);
  let sql = `SELECT id, name, total_seats, event_date, created_at
      FROM events
      WHERE id = ? `;

  return db.prepare(sql).get(result.lastInsertRowid);
}

export function getEventsService(query) {
  const { sort, upcoming } = query;

  let sql = `
    SELECT
      e.id,
      e.name,
      e.total_seats,
      e.event_date,
      e.created_at,
      COUNT(r.id) AS total_registrations,
      e.total_seats - COUNT(r.id) AS available_seats
    FROM events e
    LEFT JOIN registrations r
      ON e.id = r.event_id
      AND r.status = 'active' `;

  const params = [];

  if (upcoming === "true") {
    sql += ` WHERE datetime(e.event_date) > datetime('now') `;
  }

  sql += ` GROUP BY e.id `;

  if (sort === "date") {
    sql += ` ORDER BY datetime(e.event_date) ASC `;
  } else {
    sql += ` ORDER BY e.id DESC `;
  }

  return db.prepare(sql).all(...params);
}
