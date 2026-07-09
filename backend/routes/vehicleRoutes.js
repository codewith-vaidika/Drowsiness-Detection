const express = require("express");
const { registerVehicle, getVehicles } = require("../controllers/vehicleController");

const router = express.Router();

router.post("/register", registerVehicle);
router.get("/", getVehicles);

module.exports = router;
