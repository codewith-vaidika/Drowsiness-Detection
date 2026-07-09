/**
 * Alert Routes
 * ============
 * Maps HTTP verbs + paths to the corresponding controller handlers.
 * Mounted at `/api/alerts` by the main server module.
 */

const express = require("express");
const router = express.Router();

const { createAlert, getAlerts } = require("../controllers/alertController");

// POST /api/alerts — Log a new drowsiness alert from the edge device.
router.post("/", createAlert);

// GET  /api/alerts — Fetch all alerts for the dashboard (newest first).
router.get("/", getAlerts);

module.exports = router;
