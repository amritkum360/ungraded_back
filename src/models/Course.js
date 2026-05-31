import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    id: Number,
    title: String,
    duration: String,
    status: String,
    scheduledAt: String,
    meetingLink: String,
    platform: { type: String, enum: ["zoom", "meet", ""], default: "" },
    notes: String,
  },
  { _id: false },
);

const courseSchema = new mongoose.Schema(
  {
    courseId: { type: Number, required: true, unique: true },
    headerTitle: String,
    title: String,
    teacherName: String,
    category: String,
    language: String,
    type: String,
    startsOn: String,
    price: String,
    priceLabel: String,
    headerBg: String,
    thumbnailUrl: String,
    status: String,
    bannerBg: { type: String, default: "bg-violet-600" },
    introVideoUrl: String,
    highlights: [String],
    whyLabel: String,
    whyTitle: String,
    whyFeatures: [{ title: String, desc: String, icon: String }],
    quickInfo: [{ label: String, sub: String, accent: Boolean }],
    eligibility: [{ eligible: Boolean, title: String, desc: String }],
    classes: [classSchema],
    specializationTitle: String,
    specializationItems: [String],
  },
  { timestamps: true },
);

export default mongoose.model("Course", courseSchema);
