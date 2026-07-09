/**
 * Server Entry Point
 * ==================
 * Bootstraps the Express application:
 *   1. Loads environment variables from .env
 *   2. Connects to MongoDB Atlas
 *   3. Registers middleware and API routes
 *   4. Starts listening on the configured PORT
 */

const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const alertRoutes = require("./routes/alertRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const errorHandler = require("./middleware/errorMiddleware");

// ─── Load Environment Variables ─────────────────────────────────────────────
dotenv.config();

// ─── Initialise Express ─────────────────────────────────────────────────────
const app = express();

// ─── Built-in Middleware ────────────────────────────────────────────────────
// Parse incoming JSON request bodies (no need for body-parser).
app.json = app.use(express.json());

// ─── Health-Check Endpoint ──────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.status(200).json({
    service: "Sleep Detection Alert API",
    status: "running",
    version: "1.0.0",
  });
});

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use("/api/alerts", alertRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/analytics", analyticsRoutes);

// ─── 404 Catch-All ──────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found.",
  });
});

// ─── Error Handling Middleware ──────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to MongoDB first — the process exits on failure (see config/db.js).
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀  Express server running on http://localhost:${PORT}`);
    console.log(`📡  API endpoint: http://localhost:${PORT}/api/alerts`);
  });
};

startServer();
