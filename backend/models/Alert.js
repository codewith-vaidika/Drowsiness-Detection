/**
 * Alert Model
 * ===========
 * Mongoose schema and model for driver sleep-detection alert records.
 *
 * Each document represents a single drowsiness event logged by the
 * edge Python script running inside a vehicle.
 */

const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    /**
     * Reference to the Vehicle that generated the alert.
     */
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle reference is required"],
    },

    /**
     * UTC timestamp of when the alert was generated.
     * Defaults to the moment the document is created.
     */
    timestamp: {
      type: Date,
      default: Date.now,
    },

    /**
     * Duration (in seconds) that the driver's eyes remained closed
     * before the alarm fired. Sent by the Python edge script.
     */
    alertDuration: {
      type: Number,
      required: [true, "alertDuration (seconds) is required"],
      min: [0, "alertDuration cannot be negative"],
    },
  },
  {
    // Adds createdAt and updatedAt fields automatically.
    timestamps: true,
  }
);

module.exports = mongoose.model("Alert", alertSchema);
