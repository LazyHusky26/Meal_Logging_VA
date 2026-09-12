import mongoose from "mongoose";

export async function connectDB(uri) {
  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
}
