const mongoose = require("mongoose");
const crypto = require("crypto");

const vehicleSchema = new mongoose.Schema(
  {
    vehicleName: {
      type: String,
      required: [true, "vehicleName is required"],
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, "ownerName is required"],
      trim: true,
    },
    licensePlate: {
      type: String,
      required: [true, "licensePlate is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    apiKey: {
      type: String,
      unique: true,
      default: () => crypto.randomUUID(),
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
