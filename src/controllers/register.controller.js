import {
  cancelRegistrationService,
  registerToEventService,
} from "../services/register.service.js";

export function registerToEvent(req, res) {
  try {
    const register = registerToEventService(req.params.event_id, req.body);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: register,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
}

export function cancelRegistration(req, res) {
  try {
    const cancel = cancelRegistrationService(req.params.reg_id);

    return res.status(200).json({
      success: true,
      message: "Registration cancelled successfully",
      data: cancel,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
}
