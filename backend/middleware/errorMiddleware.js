/**
 * Error Middleware
 * ================
 * Standardizes error responses sent to the client.
 */

const errorHandler = (err, req, res, next) => {
  console.error(`❌  [Error] ${err.message}`);
  
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, error: messages });
  }

  // Duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({ success: false, error: "Duplicate field value entered" });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || "Server Error",
  });
};

module.exports = errorHandler;
