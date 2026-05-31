import mongoose from "mongoose";

const heroSettingSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, default: "/icon5.jpg" },
    imageAlt: { type: String, default: "UNGRADED learning" },
  },
  { timestamps: true },
);

const HeroSetting = mongoose.model("HeroSetting", heroSettingSchema);

export async function getHeroSettings() {
  let doc = await HeroSetting.findOne();
  if (!doc) {
    doc = await HeroSetting.create({
      imageUrl: "/icon5.jpg",
      imageAlt: "UNGRADED learning",
    });
  }
  return doc;
}

export default HeroSetting;
