import mongoose from "mongoose";

const mealLogSchema = new mongoose.Schema(
  {
    foodId: { type: String, required: true },
    foodName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    grams: { type: Number, required: true, min: 0 },
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fat: { type: Number, required: true },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack", "other"],
      default: "other",
    },
    // when the meal was eaten (can be backdated); createdAt (below) is when it was logged
    loggedAt: { type: Date, required: true, default: Date.now },
    rawTranscript: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("MealLog", mealLogSchema);
