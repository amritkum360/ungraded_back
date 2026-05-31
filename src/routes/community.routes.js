import { Router } from "express";
import CommunitySignup from "../models/CommunitySignup.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import { isValidIndianMobile, normalizePhone } from "../utils/phone.js";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function findExistingSignup({ userId, phone, email }) {
  const or = [];
  if (userId) or.push({ user: userId });
  if (phone) or.push({ phone });
  if (email) or.push({ email: email.toLowerCase() });
  if (or.length === 0) return null;
  return CommunitySignup.findOne({ $or: or }).sort({ createdAt: -1 });
}

function mapSignup(signup) {
  return {
    id: signup._id.toString(),
    name: signup.name,
    email: signup.email,
    phone: signup.phone,
    createdAt: signup.createdAt,
  };
}

router.get("/status", optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ requested: false });
    }

    const existing = await findExistingSignup({
      userId: req.user._id,
      phone: req.user.phone || null,
      email: req.user.email || null,
    });

    res.json({
      requested: Boolean(existing),
      signup: existing ? mapSignup(existing) : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not check community status" });
  }
});

router.post("/", optionalAuth, async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const phoneRaw = String(req.body?.phone || "").trim();

    if (name.length < 2) {
      return res.status(400).json({ message: "Please enter your full name" });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }
    if (!isValidIndianMobile(phoneRaw)) {
      return res.status(400).json({ message: "Please enter a valid 10-digit mobile number" });
    }

    const phone = normalizePhone(phoneRaw);

    const existing = await findExistingSignup({
      userId: req.user?._id,
      phone,
      email,
    });
    if (existing) {
      return res.status(409).json({
        message: "You have already requested to join the community.",
        requested: true,
        signup: mapSignup(existing),
      });
    }

    const signup = await CommunitySignup.create({
      name,
      email,
      phone,
      user: req.user?._id || null,
      source: String(req.body?.source || "homepage").trim() || "homepage",
    });

    res.status(201).json({
      message: "You're on the list! We'll reach out soon.",
      requested: true,
      signup: mapSignup(signup),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not submit your request. Please try again." });
  }
});

export default router;
