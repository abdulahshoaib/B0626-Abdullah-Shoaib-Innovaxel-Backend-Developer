import express from "express";
import { createEvents, getEvents } from "../controllers/event.controller.js";
import { registerToEvent } from "../controllers/register.controller.js";

const router = express.Router();

router.post("/", createEvents);
router.get("/", getEvents);

router.post("/:eventID/register", registerToEvent);

export default router;
