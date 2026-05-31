import mongoose from "mongoose";

const RESOURCE_TYPES = ["pdf", "dpp", "video", "link", "assignment", "sheet", "other"];

const resourceSchema = new mongoose.Schema(
  {
    courseId: { type: Number, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    type: {
      type: String,
      enum: RESOURCE_TYPES,
      default: "pdf",
      index: true,
    },
    meta: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    externalUrl: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true, index: true },
    requiresEnrollment: { type: Boolean, default: false },
    tags: [{ type: String }],
  },
  { timestamps: true },
);

resourceSchema.index({ courseId: 1, order: 1 });
resourceSchema.index({ courseId: 1, type: 1 });

export { RESOURCE_TYPES };
export default mongoose.model("Resource", resourceSchema);
