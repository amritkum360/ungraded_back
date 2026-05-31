import { Router } from "express";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import { isValidIndianMobile, normalizePhone } from "../utils/phone.js";
import { signToken } from "../utils/jwt.js";
import { requireAuth } from "../middleware/auth.js";
import {
  isFirebaseAdminConfigured,
  verifyFirebaseIdToken,
} from "../services/firebaseAdmin.js";

const router = Router();
const DEMO_OTP = () => process.env.DEMO_OTP || "123456";
const OTP_TTL_MS = 10 * 60 * 1000;

function mapUser(user) {
  return {
    id: user._id.toString(),
    phone: user.phone,
    name: user.name || "",
  };
}

router.post("/firebase", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: "Firebase token required" });
    }
    if (!isFirebaseAdminConfigured()) {
      return res.status(503).json({ message: "Firebase Admin is not configured on the server" });
    }

    const decoded = await verifyFirebaseIdToken(idToken);
    const phone = normalizePhone(decoded.phone_number);
    if (!phone) {
      return res.status(400).json({ message: "Valid phone number not found in Firebase token" });
    }

    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone, name: "" });
    }

    const token = signToken(user._id.toString());

    res.json({
      token,
      user: mapUser(user),
      needsName: !user.name?.trim() || user.name.trim().length < 2,
    });
  } catch (err) {
  console.error("FIREBASE ERROR:", err);

  res.status(401).json({
    message: err.message,
    code: err.code
    
  });
}
});

router.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!isValidIndianMobile(phone)) {
      return res.status(400).json({ message: "Valid 10-digit Indian mobile number required" });
    }

    const normalized = normalizePhone(phone);
    const code = DEMO_OTP();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await Otp.deleteMany({ phone: normalized });
    await Otp.create({ phone: normalized, code, expiresAt });

    res.json({
      message: "OTP sent",
      demoOtp: process.env.NODE_ENV !== "production" ? code : undefined,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!isValidIndianMobile(phone)) {
      return res.status(400).json({ message: "Valid phone number required" });
    }
    if (!otp || String(otp).length < 6) {
      return res.status(400).json({ message: "6-digit OTP required" });
    }

    const normalized = normalizePhone(phone);
    const record = await Otp.findOne({ phone: normalized }).sort({ createdAt: -1 });

    if (!record || record.code !== String(otp)) {
      return res.status(400).json({ message: `Invalid OTP. Demo OTP: ${DEMO_OTP()}` });
    }
    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired. Request a new one." });
    }

    await Otp.deleteMany({ phone: normalized });

    let user = await User.findOne({ phone: normalized });
    if (!user) {
      user = await User.create({ phone: normalized, name: "" });
    }

    const token = signToken(user._id.toString());

    res.json({
      token,
      user: mapUser(user),
      needsName: !user.name?.trim() || user.name.trim().length < 2,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Verification failed" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({
    user: mapUser(req.user),
    needsName: !req.user.name?.trim() || req.user.name.trim().length < 2,
  });
});

router.patch("/profile", requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    const trimmed = String(name || "").trim();
    if (trimmed.length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters" });
    }

    req.user.name = trimmed;
    await req.user.save();

    res.json({ user: mapUser(req.user), needsName: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

export default router;
