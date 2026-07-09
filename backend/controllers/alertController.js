/**
 * Alert Controller
 * ================
 * Contains the business logic for creating and retrieving driver
 * sleep-detection alerts.  Each handler follows the async/await
 * pattern with explicit try/catch error handling.
 */

const Alert = require("../models/Alert");
const Vehicle = require("../models/Vehicle");

/**
 * @desc    Create a new alert record
 * @route   POST /api/alerts
 * @access  Public (edge device → API)
 *
 * Expects a JSON body with at least `vehicleId` (string) and
 * `alertDuration` (number).  Returns the saved document with a
 * 201 Created status.
 */
const createAlert = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Missing x-api-key header.",
      });
    }

    const vehicle = await Vehicle.findOne({ apiKey });
    if (!vehicle) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Invalid API key.",
      });
    }

    const { alertDuration } = req.body;

    if (alertDuration === undefined || alertDuration === null) {
      return res.status(400).json({
        success: false,
        error: "alertDuration (number of seconds) is required.",
      });
    }

    if (typeof alertDuration !== "number" || alertDuration < 0) {
      return res.status(400).json({
        success: false,
        error: "alertDuration must be a non-negative number.",
      });
    }

    // ── Persist to MongoDB ───────────────────────────────────────────
    const alert = await Alert.create({
      vehicle: vehicle._id,
      alertDuration,
    });

    console.log(
      `📥  Alert saved — vehicle: ${vehicle.vehicleName}, duration: ${alert.alertDuration}s`
    );

    return res.status(201).json({
      success: true,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Retrieve all alert records, newest first
 * @route   GET /api/alerts
 * @access  Public (frontend dashboard)
 *
 * Returns every alert document sorted by `timestamp` descending so
 * the most recent events appear at the top of the dashboard.
 */
const getAlerts = async (req, res, next) => {
  try {
    const alerts = await Alert.find()
      .populate("vehicle", "vehicleName ownerName licensePlate")
      .sort({ timestamp: -1 });

    console.log(`📤  Fetched ${alerts.length} alert(s)`);

    return res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createAlert, getAlerts };
