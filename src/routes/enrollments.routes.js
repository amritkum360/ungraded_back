import { Router } from "express";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import CounsellingRequest from "../models/CounsellingRequest.js";
import { requireAuth } from "../middleware/auth.js";
import { mapEnrollment, mapEnrollmentWithCourse } from "../utils/courseMapper.js";
import { mapCounsellingRequest } from "../utils/counsellingMapper.js";
import { generateOrderId } from "../utils/orderId.js";
import { parsePriceAmount } from "../utils/price.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const list = await Enrollment.find({ user: req.user._id }).sort({ enrolledAt: -1 });
    const courseIds = [...new Set(list.map((e) => e.courseId))];
    const courses = await Course.find({ courseId: { $in: courseIds } });
    const courseById = Object.fromEntries(courses.map((c) => [c.courseId, c]));

    res.json({
      enrollments: list.map((e) =>
        mapEnrollmentWithCourse(e, courseById[e.courseId]),
      ),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch enrollments" });
  }
});

router.get("/check/:courseId", async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const existing = await Enrollment.findOne({ user: req.user._id, courseId });
    res.json({ enrolled: Boolean(existing) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to check enrollment" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      courseId,
      studentName,
      email,
      city,
      paymentMethod,
      useEmi,
    } = req.body;

    const id = Number(courseId);
    const course = await Course.findOne({ courseId: id });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const name = String(studentName || req.user.name || "").trim();
    if (name.length < 2) {
      return res.status(400).json({ message: "Student name is required" });
    }

    const existing = await Enrollment.findOne({ user: req.user._id, courseId: id });
    if (existing) {
      return res.status(409).json({
        message: "Already enrolled in this course",
        enrollment: mapEnrollmentWithCourse(existing, course),
      });
    }

    const courseAmount = parsePriceAmount(course.priceLabel || course.price);
    if (courseAmount > 0) {
      return res.status(400).json({ message: "Payment required. Complete Razorpay checkout." });
    }

    const enrollment = await Enrollment.create({
      user: req.user._id,
      courseId: id,
      courseTitle: course.title,
      headerTitle: course.headerTitle,
      courseType: course.type,
      studentName: name,
      email: String(email || "").trim(),
      city: String(city || "").trim(),
      amount: 0,
      paymentMethod: paymentMethod || "free",
      useEmi: Boolean(useEmi),
      orderId: generateOrderId(),
      paymentStatus: "free",
    });

    res.status(201).json({
      enrollment: mapEnrollmentWithCourse(enrollment, course),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Enrollment failed" });
  }
});

router.get("/counselling", async (req, res) => {
  try {
    const rows = await CounsellingRequest.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ requests: rows.map(mapCounsellingRequest) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch counselling requests" });
  }
});

router.post("/counselling", async (req, res) => {
  try {
    const {
      courseId,
      studentName,
      email,
      city,
      alternatePhone,
      topic,
      message,
      preferredDate,
      preferredTimeSlot,
    } = req.body;

    const id = Number(courseId);
    const course = await Course.findOne({ courseId: id });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const name = String(studentName || req.user.name || "").trim();
    if (name.length < 2) {
      return res.status(400).json({ message: "Name is required" });
    }

    const slot = String(preferredTimeSlot || "").trim();
    const validSlots = ["morning", "afternoon", "evening", "flexible"];
    if (!slot || !validSlots.includes(slot)) {
      return res.status(400).json({ message: "Please select a preferred call time" });
    }

    const dateStr = String(preferredDate || "").trim();
    if (!dateStr) {
      return res.status(400).json({ message: "Please select a preferred date" });
    }

    const row = await CounsellingRequest.create({
      user: req.user._id,
      courseId: id,
      courseTitle: course.headerTitle || course.title,
      studentName: name,
      phone: req.user.phone,
      alternatePhone: String(alternatePhone || "").trim(),
      email: String(email || "").trim(),
      city: String(city || "").trim(),
      topic: String(topic || "").trim(),
      message: String(message || "").trim(),
      preferredDate: dateStr,
      preferredTimeSlot: slot,
    });

    res.status(201).json({
      message: "Counselling request received",
      request: mapCounsellingRequest(row),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit counselling request" });
  }
});

export default router;
