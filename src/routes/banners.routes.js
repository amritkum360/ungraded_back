import { Router } from "express";
import Banner from "../models/Banner.js";
import { mapBanner } from "../utils/bannerMapper.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const banners = await Banner.find({
      isActive: true,
      imageUrl: { $exists: true, $ne: "" },
    }).sort({ order: 1, createdAt: 1 });
    res.json({ banners: banners.map(mapBanner) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch banners" });
  }
});

export default router;
