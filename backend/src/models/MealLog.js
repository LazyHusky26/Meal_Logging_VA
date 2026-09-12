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
    // when the meal was actually eaten (can be backdated, e.g. "this morning")
    loggedAt: { type: Date, required: true, default: Date.now },
    // raw phrase this entry was parsed from, useful for debugging voice parsing
    rawTranscript: { type: String },
  },
  { timestamps: true } // createdAt = when the row was written, used to resolve "that"/"make that three rotis"
);

export default mongoose.model("MealLog", mealLogSchema);
