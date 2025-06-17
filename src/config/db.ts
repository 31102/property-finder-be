import mongoose from "mongoose";

/**
 * Connect to MongoDB using Mongoose.
 * This function establishes a connection to the MongoDB database
 * and logs the connection status.
 */
const connectDB = async () => {
  const dbURI = process.env.MONGODB_URI || "mongodb+srv://mystzex:mystzex@cluster0.8lzxf.mongodb.net/propertyFinder";
  try {
    // Connect to MongoDB using the provided connection string
    await mongoose.connect(dbURI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

export default connectDB;
