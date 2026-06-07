import {
  createEventService,
  getEventsService,
} from "../services/event.service.js";

export function createEvents(req, res) {
  try {
    const event = createEventService(req.body);

    return res.status(201).json({
      success: true,
      message: "Event created Successfully",
      data: event,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
}

export function getEvents(req, res) {
  try {
    const events = getEventsService(req.query);

    return res.status(200).json({
      success: true,
      message: "Events fetched successfully",
      data: events,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
