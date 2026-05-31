import { Router } from "express";
import { getHeroSettings } from "../models/HeroSetting.js";
import {
  getBatchFiltersSettings,
  mapBatchFiltersResponse,
} from "../models/BatchFiltersSetting.js";

const router = Router();

router.get("/hero", async (_req, res) => {
  try {
    const hero = await getHeroSettings();
    res.json({
      hero: {
        imageUrl: hero.imageUrl || "/icon5.jpg",
        imageAlt: hero.imageAlt || "UNGRADED learning",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch hero settings" });
  }
});

router.get("/batch-filters", async (_req, res) => {
  try {
    const doc = await getBatchFiltersSettings();
    res.json(mapBatchFiltersResponse(doc));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch batch filters" });
  }
});

export default router;
