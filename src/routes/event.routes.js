import express from "express";
import { createEvents, getEvents } from "../controllers/event.controller.js";

const router = express.Router();

router.post("/", createEvents);
router.get("/", getEvents);

export default router;
