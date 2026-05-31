import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Number, required: true, index: true },
    courseTitle: String,
    headerTitle: String,
    courseType: String,
    studentName: { type: String, required: true },
    email: { type: String, default: "" },
    city: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    paymentMethod: { type: String, default: "free" },
    useEmi: { type: Boolean, default: false },
    orderId: { type: String, required: true, unique: true },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    paymentStatus: { type: String, default: "paid" },
    enrolledAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

enrollmentSchema.index({ user: 1, courseId: 1 }, { unique: true });

export default mongoose.model("Enrollment", enrollmentSchema);
