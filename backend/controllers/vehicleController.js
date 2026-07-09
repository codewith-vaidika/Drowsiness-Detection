const Vehicle = require("../models/Vehicle");

/**
 * @desc    Register a new vehicle
 * @route   POST /api/vehicles/register
 * @access  Public
 */
const registerVehicle = async (req, res, next) => {
  try {
    const { vehicleName, ownerName, licensePlate } = req.body;

    if (!vehicleName || !ownerName || !licensePlate) {
      return res.status(400).json({
        success: false,
        error: "vehicleName, ownerName, and licensePlate are required.",
      });
    }

    const existingVehicle = await Vehicle.findOne({ licensePlate: licensePlate.trim().toUpperCase() });
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        error: "Vehicle with this license plate already exists.",
      });
    }

    const vehicle = await Vehicle.create({
      vehicleName: vehicleName.trim(),
      ownerName: ownerName.trim(),
      licensePlate: licensePlate.trim().toUpperCase(),
    });

    return res.status(201).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all vehicles with total alerts count
 * @route   GET /api/vehicles
 * @access  Public
 */
const getVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.aggregate([
      {
        $lookup: {
          from: "alerts",
          localField: "_id",
          foreignField: "vehicle",
          as: "alertsList",
        },
      },
      {
        $project: {
          vehicleName: 1,
          ownerName: 1,
          licensePlate: 1,
          apiKey: 1,
          createdAt: 1,
          totalAlerts: { $size: "$alertsList" },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerVehicle,
  getVehicles,
};
