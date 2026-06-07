import request from "supertest";
import app from "../src/app.js";
import db from "../src/db/database.js";

const defaultEvent = {
  name: "Tech Conference",
  total_seats: 100,
  event_date: "2099-01-01T10:00:00.000Z",
};

async function createEvent(overrides = {}) {
  return request(app)
    .post("/events")
    .send({
      ...defaultEvent,
      ...overrides,
    });
}

async function registerUser(eventId, userName) {
  return request(app).post(`/events/reg/${eventId}`).send({
    user_name: userName,
  });
}

describe("Event Registration System API", () => {
  beforeEach(() => {
    db.exec(`
      DELETE FROM registrations;
      DELETE FROM events;
      DELETE FROM sqlite_sequence
      WHERE name IN ('events', 'registrations');
    `);
  });

  afterAll(() => {
    db.close();
  });

  describe("POST /events", () => {
    test("creates an event", async () => {
      const res = await createEvent();

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({
        success: true,
        message: "Event created Successfully",
        data: expect.objectContaining({
          event_id: 1,
          name: "Tech Conference",
          total_seats: 100,
          event_date: "2099-01-01T10:00:00.000Z",
          created_at: expect.any(String),
        }),
      });
    });

    test.each([
      ["missing name", { name: undefined }, "Event Name is required"],
      ["blank name", { name: "   " }, "Event Name is required"],
      ["zero seats", { total_seats: 0 }, "Total seats must be greater than 0"],
      [
        "negative seats",
        { total_seats: -1 },
        "Total seats must be greater than 0",
      ],
      ["missing date", { event_date: undefined }, "Event date is required"],
      ["invalid date", { event_date: "not-a-date" }, "Invalid event date"],
      [
        "past date",
        { event_date: "2000-01-01T10:00:00.000Z" },
        "Event date must be in the future",
      ],
    ])("rejects %s", async (_, overrides, message) => {
      const res = await createEvent(overrides);

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message,
      });
    });

    test("rejects duplicate event names", async () => {
      await createEvent();

      const res = await createEvent();

      expect(res.statusCode).toBe(409);
      expect(res.body).toEqual({
        success: false,
        message: "Event name must be unique",
      });
    });
  });

  describe("POST /events/reg/:event_id", () => {
    test("registers a user for an event", async () => {
      const event = await createEvent({ total_seats: 2 });

      const res = await registerUser(event.body.data.event_id, "keanu_reeves");

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({
        success: true,
        message: "User registered successfully",
        data: expect.objectContaining({
          reg_id: 1,
          event_id: event.body.data.event_id,
          user_name: "keanu_reeves",
          status: "active",
          registered_at: expect.any(String),
          cancelled_at: null,
        }),
      });
    });

    test.each([
      ["missing user_name", {}, "user_name is required for registration"],
      [
        "spaces",
        { user_name: "keanu reeves" },
        "user_name can only contain letters, numbers, and underscores",
      ],
      [
        "symbols",
        { user_name: "keanu-reeves" },
        "user_name can only contain letters, numbers, and underscores",
      ],
    ])("rejects %s", async (_, payload, message) => {
      const event = await createEvent();

      const res = await request(app)
        .post(`/events/reg/${event.body.data.event_id}`)
        .send(payload);

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message,
      });
    });

    test("rejects an invalid event id", async () => {
      const res = await registerUser(999, "keanu_reeves");

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: "event_id is Invalid",
      });
    });

    test("rejects duplicate active registration for the same event", async () => {
      const event = await createEvent();
      const eventId = event.body.data.event_id;

      await registerUser(eventId, "keanu_reeves");
      const res = await registerUser(eventId, "keanu_reeves");

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: "User is already registered for this event",
      });
    });

    test("rejects registration when the event is full", async () => {
      const event = await createEvent({ total_seats: 1 });
      const eventId = event.body.data.event_id;

      await registerUser(eventId, "first_user");
      const res = await registerUser(eventId, "second_user");

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: "Event is fully booked",
      });

      const events = await request(app).get("/events");
      expect(events.body.data[0]).toEqual(
        expect.objectContaining({
          event_id: eventId,
          total_registrations: 1,
          available_seats: 0,
        }),
      );
    });

    test("allows same user to register after cancellation", async () => {
      const event = await createEvent({ total_seats: 1 });
      const eventId = event.body.data.event_id;

      const registration = await registerUser(eventId, "keanu_reeves");
      const deletion = await request(app).delete(
        `/events/reg/${registration.body.data.reg_id}`,
      );
      expect(deletion.statusCode).toBe(200);
      const res = await registerUser(eventId, "keanu_reeves");

      expect(res.statusCode).toBe(201);
      expect(res.body.data.user_name).toBe("keanu_reeves");
      expect(res.body.data.status).toBe("active");
    });

    test("does not overbook concurrent registration requests", async () => {
      const event = await createEvent({ total_seats: 1 });
      const eventId = event.body.data.event_id;

      const responses = await Promise.all([
        registerUser(eventId, "first_user"),
        registerUser(eventId, "second_user"),
      ]);

      const created = responses.filter((res) => res.statusCode === 201);
      const rejected = responses.filter((res) => res.statusCode === 400);

      expect(created).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0].body.message).toBe("Event is fully booked");
    });
  });

  describe("GET /events", () => {
    test("returns available seats and active registration counts", async () => {
      const event = await createEvent({ total_seats: 3 });
      const eventId = event.body.data.event_id;

      await registerUser(eventId, "first_user");
      await registerUser(eventId, "second_user");

      const res = await request(app).get("/events");

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toEqual(
        expect.objectContaining({
          event_id: eventId,
          total_registrations: 2,
          available_seats: 1,
        }),
      );
    });

    test("sorts events by date", async () => {
      await createEvent({
        name: "Later Event",
        event_date: "2099-12-01T10:00:00.000Z",
      });
      await createEvent({
        name: "Earlier Event",
        event_date: "2099-01-01T10:00:00.000Z",
      });

      const res = await request(app).get("/events?sort=date");

      expect(res.statusCode).toBe(200);
      expect(res.body.data.map((event) => event.name)).toEqual([
        "Earlier Event",
        "Later Event",
      ]);
    });

    test("filters upcoming events only", async () => {
      db.prepare(
        `INSERT INTO events (name, total_seats, event_date)
         VALUES (?, ?, ?)`,
      ).run("Past Event", 10, "2000-01-01T10:00:00.000Z");

      await createEvent({
        name: "Future Event",
        event_date: "2099-01-01T10:00:00.000Z",
      });

      const res = await request(app).get("/events?upcoming=true");

      expect(res.statusCode).toBe(200);
      expect(res.body.data.map((event) => event.name)).toEqual([
        "Future Event",
      ]);
    });
  });

  describe("DELETE /events/reg/:reg_id", () => {
    test("cancels a registration and frees the seat", async () => {
      const event = await createEvent({ total_seats: 1 });
      const eventId = event.body.data.event_id;
      const registration = await registerUser(eventId, "keanu_reeves");

      const res = await request(app).delete(
        `/events/reg/${registration.body.data.reg_id}`,
      );

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: "Registration cancelled successfully",
        data: expect.objectContaining({
          reg_id: registration.body.data.reg_id,
          event_id: eventId,
          user_name: "keanu_reeves",
          status: "cancelled",
          registered_at: expect.any(String),
          cancelled_at: expect.any(String),
        }),
      });

      const events = await request(app).get("/events");
      expect(events.body.data[0]).toEqual(
        expect.objectContaining({
          total_registrations: 0,
          available_seats: 1,
        }),
      );
    });

    test("rejects cancellation for an unknown registration", async () => {
      const res = await request(app).delete("/events/reg/999");

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({
        success: false,
        message: "Registration not found",
      });
    });

    test("rejects cancellation when registration is already cancelled", async () => {
      const event = await createEvent();
      const registration = await registerUser(
        event.body.data.event_id,
        "keanu_reeves",
      );

      await request(app).delete(`/events/reg/${registration.body.data.reg_id}`);
      const res = await request(app).delete(
        `/events/reg/${registration.body.data.reg_id}`,
      );

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: "Registration is already cancelled",
      });
    });
  });
});
