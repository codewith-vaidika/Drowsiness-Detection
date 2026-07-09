const Alert = require("../models/Alert");
const Vehicle = require("../models/Vehicle");

/**
 * @desc    Get dashboard analytics
 * @route   GET /api/analytics
 * @access  Public
 */
const getAnalytics = async (req, res, next) => {
  try {
    const totalVehicles = await Vehicle.countDocuments();
    const totalAlerts = await Alert.countDocuments();

    // Group alerts by hour of day
    const alertsByHour = await Alert.aggregate([
      {
        $group: {
          _id: { $hour: "$timestamp" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id": 1 },
      },
    ]);

    // Format output for charts
    const hourlyData = alertsByHour.map((item) => ({
      hour: item._id,
      count: item.count,
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalVehicles,
        totalAlerts,
        hourlyData,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics,
};
