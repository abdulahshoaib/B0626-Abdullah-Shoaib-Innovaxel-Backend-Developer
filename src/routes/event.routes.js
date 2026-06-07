import express from "express";
import {
  createEvents,
  getEvents,
  getEventDetails,
} from "../controllers/event.controller.js";

const router = express.Router();

router.post("/", createEvents);
router.get("/", getEvents);
router.get("/:eventID", getEventDetails);

export default router;
