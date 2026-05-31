import mongoose from "mongoose";

const communitySignupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    source: { type: String, default: "homepage" },
  },
  { timestamps: true },
);

communitySignupSchema.index({ email: 1 });
communitySignupSchema.index({ phone: 1 });
communitySignupSchema.index({ user: 1 });

export default mongoose.model("CommunitySignup", communitySignupSchema);
