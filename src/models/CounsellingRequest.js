import mongoose from "mongoose";

const counsellingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Number, required: true },
    courseTitle: String,
    studentName: { type: String, required: true },
    phone: String,
    alternatePhone: String,
    email: String,
    city: String,
    topic: String,
    message: String,
    preferredDate: String,
    preferredTimeSlot: {
      type: String,
      enum: ["morning", "afternoon", "evening", "flexible", ""],
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "contacted", "closed"],
      default: "pending",
    },
    adminNotes: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("CounsellingRequest", counsellingSchema);
