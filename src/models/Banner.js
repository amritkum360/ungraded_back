import mongoose from "mongoose";

const LAYOUTS = ["split", "full"];

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, default: "Poster" },
    subtitle: { type: String, default: "" },
    priceText: { type: String, default: "" },
    ctaLabel: { type: String, default: "Enroll Now" },
    ctaLink: { type: String, default: "/batches" },
    imageUrl: { type: String, required: true },
    backgroundColor: { type: String, default: "#0f172a" },
    textColor: { type: String, default: "#ffffff" },
    layout: { type: String, enum: LAYOUTS, default: "split" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

bannerSchema.index({ isActive: 1, order: 1 });

export { LAYOUTS };
export default mongoose.model("Banner", bannerSchema);
