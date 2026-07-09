/**
 * Database Configuration
 * ======================
 * Establishes and manages the MongoDB Atlas connection via Mongoose.
 * Exports a single `connectDB` function consumed by the server entry point.
 */

const mongoose = require("mongoose");

/**
 * Connect to MongoDB Atlas using the URI stored in the MONGO_URI
 * environment variable.
 *
 * Mongoose 8.x uses the new connection-string parser and unified topology
 * by default, so no additional options are needed.
 *
 * @returns {Promise<void>} Resolves once the connection is established.
 * @throws  Will terminate the process with exit code 1 on failure.
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    // 1. Check if the URI is completely missing
    if (!uri) {
      console.error(
        "\n❌ FATAL ERROR: MONGO_URI is not defined in the environment variables.\n" +
        "   Please create a .env file in the backend directory with your MongoDB Atlas connection string.\n"
      );
      process.exit(1);
    }

    // 2. Check if the URI still contains placeholder text from the setup guide
    if (uri.includes("<cluster-url>") || uri.includes("<password>") || uri.includes("<username>")) {
      console.error(
        "\n❌ FATAL ERROR: MONGO_URI contains placeholder text.\n" +
        "   You must replace '<cluster-url>', '<username>', and '<password>' with your actual MongoDB Atlas credentials.\n" +
        "   Example: mongodb+srv://admin:securepassword123@cluster0.abc12.mongodb.net/sleep_detection_db?retryWrites=true&w=majority\n"
      );
      process.exit(1);
    }

    const conn = await mongoose.connect(uri);

    console.log(
      `✅  MongoDB Atlas connected: ${conn.connection.host} — db: ${conn.connection.name}`
    );
  } catch (error) {
    console.error(`\n❌  MongoDB connection failed: ${error.message}\n   Double check that your IP is whitelisted in MongoDB Atlas Network Access.`);
    process.exit(1);
  }
};

module.exports = connectDB;
