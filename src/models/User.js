import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
