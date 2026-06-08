# Event Registration System API

## 1. Create Event

### POST /events

Create a new event.

#### Request Body

```json
{
  "name": "Tech Conference",
  "total_seats": 100,
  "event_date": "2026-12-20T10:00:00.000Z"
}
```

#### Success Response

```json
{
  "success": true,
  "message": "Event created Successfully",
  "data": {
    "event_id": 1,
    "name": "Tech Conference",
    "total_seats": 100,
    "event_date": "2026-12-20T10:00:00.000Z",
    "created_at": "2026-06-07 10:30:00"
  }
}
```

#### Error Responses

```json
{
  "success": false,
  "message": "Event Name is required"
}
```

```json
{
  "success": false,
  "message": "Total seats must be greater than 0"
}
```

```json
{
  "success": false,
  "message": "Event date is required"
}
```

```json
{
  "success": false,
  "message": "Invalid event date"
}
```

```json
{
  "success": false,
  "message": "Event date must be in the future"
}
```

```json
{
  "success": false,
  "message": "Event name must be unique"
}
```

## 2. Register User To Event

### POST /events/reg/:event_id

Register a user for an event.

```http
POST /events/reg/1
```

#### Request Body

```json
{
  "user_name": "keanu_reeves"
}
```

#### Success Response

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "reg_id": 1,
    "event_id": 1,
    "user_name": "keanu_reeves",
    "status": "active",
    "registered_at": "2026-06-07 10:35:00",
    "cancelled_at": null
  }
}
```

#### Error Responses

```json
{
  "success": false,
  "message": "user_name is required for registration"
}
```

```json
{
  "success": false,
  "message": "user_name can only contain letters, numbers, and underscores"
}
```

```json
{
  "success": false,
  "message": "event_id is Invalid"
}
```

```json
{
  "success": false,
  "message": "Event is fully booked"
}
```

```json
{
  "success": false,
  "message": "User is already registered for this event"
}
```

## 3. View Events

### GET /events

Return all events with active registration counts and available seats.

#### Query Params

```http
GET /events?sort=date
GET /events?upcoming=true
GET /events?sort=date&upcoming=true
```

#### Success Response

```json
{
  "success": true,
  "message": "Events fetched successfully",
  "data": [
    {
      "event_id": 1,
      "name": "Tech Conference",
      "total_seats": 100,
      "total_registrations": 25,
      "available_seats": 75,
      "event_date": "2026-12-20T10:00:00.000Z",
      "created_at": "2026-06-07 10:30:00"
    }
  ]
}
```

## 4. Cancel Registration

### DELETE /events/reg/:reg_id

Cancel an active registration.

```http
DELETE /events/reg/1
```

#### Success Response

```json
{
  "success": true,
  "message": "Registration cancelled successfully",
  "data": {
    "reg_id": 1,
    "event_id": 1,
    "user_name": "Abdullah Shoaib",
    "status": "cancelled",
    "registered_at": "2026-06-07 10:35:00",
    "cancelled_at": "2026-06-07 10:40:00"
  }
}
```

#### Error Responses

```json
{
  "success": false,
  "message": "Registration not found"
}
```

```json
{
  "success": false,
  "message": "Registration is already cancelled"
}
```

## Terminal UI

Start the API server in one terminal:

```bash
npm start
```

Run the TUI client in another terminal:

```bash
npm run tui
```

By default, the TUI connects to `http://localhost:1234`. To use another API URL:

```bash
API_URL=http://localhost:1234 npm run tui
```
