import express from "express";
import {
  cancelRegistration,
  registerToEvent,
} from "../controllers/register.controller.js";

const router = express.Router();

router.post("/:event_id", registerToEvent);
router.delete("/:reg_id", cancelRegistration);

export default router;
