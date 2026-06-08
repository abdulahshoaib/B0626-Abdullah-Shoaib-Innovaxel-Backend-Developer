import db from "../db/database.js";

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const registerTransaction = db.transaction((eventID, userName) => {
  let sql = `SELECT 1 FROM events WHERE event_id = ?`;
  const eventExists = db.prepare(sql).get(eventID);
  if (!eventExists) {
    throw createServiceError("event_id is Invalid", 400);
  }

  sql = `SELECT COUNT(*) as registered_count FROM registrations WHERE event_id = ? AND status = 'active'`;
  const { registered_count } = db.prepare(sql).get(eventID);

  sql = `SELECT total_seats FROM events WHERE event_id = ?`;
  const { total_seats } = db.prepare(sql).get(eventID);

  if (registered_count >= total_seats) {
    throw createServiceError("Event is fully booked", 400);
  }

  sql = `
    SELECT 1
    FROM registrations
    WHERE user_name = ?
      AND event_id = ?
      AND status = 'active'
  `;
  const usernameExists = db.prepare(sql).get(userName, eventID);
  if (usernameExists) {
    throw createServiceError("User is already registered for this event", 400);
  }

  sql = `INSERT INTO registrations (user_name, event_id) VALUES (?, ?)`;
  const result = db.prepare(sql).run(userName, eventID);

  sql = `SELECT reg_id, event_id, user_name, status, registered_at, cancelled_at
      FROM registrations WHERE reg_id = ?`;

  return db.prepare(sql).get(result.lastInsertRowid);
});

export function registerToEventService(param, data) {
  const eventID = param;
  const { user_name } = data;

  //check if user_name is provided
  if (!user_name) {
    throw createServiceError("user_name is required for registration", 400);
  }

  //check if user_name is valid
  const valid_username = /^[a-zA-Z0-9_]+$/.test(user_name);
  if (!valid_username) {
    throw createServiceError(
      "user_name can only contain letters, numbers, and underscores",
      400,
    );
  }

  return registerTransaction.immediate(eventID, user_name);
}

export function cancelRegistrationService(param) {
  const regID = param;

  let sql = `SELECT reg_id, event_id, user_name, status, registered_at, cancelled_at
      FROM registrations WHERE reg_id = ?`;
  const registration = db.prepare(sql).get(regID);

  // check if registration exists
  if (!registration) {
    const error = new Error("Registration not found");
    error.statusCode = 404;
    throw error;
  }

  // check if registration is already cancelled
  if (registration.status === "cancelled") {
    const error = new Error("Registration is already cancelled");
    error.statusCode = 400;
    throw error;
  }

  sql = `
    UPDATE registrations
    SET status = 'cancelled',
        cancelled_at = CURRENT_TIMESTAMP
    WHERE reg_id = ?
  `;
  db.prepare(sql).run(regID);

  // return updated registration
  sql = `SELECT reg_id, event_id, user_name, status, registered_at, cancelled_at
      FROM registrations WHERE reg_id = ?`;
  const cancel = db.prepare(sql).get(regID);

  return cancel;
}
