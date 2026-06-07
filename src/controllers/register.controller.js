import { registerToEventService } from "../services/register.service.js";

export function registerToEvent(req, res) {
  try {
    const register = registerToEventService(req.params.eventID, req.body);

    return res.status(201).json({
      success: true,
      message: "Registered for event Successfully",
      data: register,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
}
