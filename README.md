# Event Registration System API

# 1. Create Event

## POST /events

create new event

### Request body

```json
{
  "name": "Tech Conference",
  "total_seats": 100,
  "event_date": "2026-12-20T10:00:00.000Z"
}
```

### Success Response

```json
{
    "success": true,
    "message": "Event created successfully",
    "data": {
        "event_id": 1,
        "name": "Tech Conference",
        "total_seats": 100,
        "event_date": "2026-12-20T10:00:00.000Z"
        "created_at": "2026-06-07 10:30:00"
    }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Event name is required"
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
  "message": "Event date must be in the future"
}
```

```json
{
  "success": false,
  "message": "Event name must be unique"
}
```

# 2. Register User to Event

## POST /events/:eventID/register

register user for an event

> ```http
> POST /events/1/register
> ```

### Request Body

```json
{
  "user_name": "keanu_reeves"
}
```

### Success Response

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

### Error Response

```json
{
  "success": false,
  "message": "User name is required"
}
```

```json
{
  "success": false,
  "message": "Username should not have spaces"
}
```

```json
{
  "success": false,
  "message": "Event not found"
}
```

```json
{
  "success": false,
  "message": "Event is full"
}
```

```json
{
  "success": false,
  "message": "User is already registered for this event"
}
```

# 3. View Events

## GET /events

returns all events with available seats and total registerations.

### Query Params

```http
GET /events?sort=date
GET /events?upcoming=true
GET /events?sort=date&upcoming=true
```

### Success Response

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

# 4. Cancel Registration

## DELETE /register/:regID

cancel an active registeration

> ```http
> DELETE /register/1
> ```

### Success Response

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

### Error Response

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
