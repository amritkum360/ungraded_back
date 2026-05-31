import { Router } from "express";
import crypto from "crypto";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import { requireAuth } from "../middleware/auth.js";
import { mapEnrollmentWithCourse } from "../utils/courseMapper.js";
import { generateOrderId } from "../utils/orderId.js";
import { amountToPaise, parsePriceAmount } from "../utils/price.js";
import { getRazorpay, getRazorpayKeyId } from "../services/razorpay.js";

const router = Router();

router.use(requireAuth);

router.post("/razorpay/order", async (req, res) => {
  try {
    const { courseId, studentName, email, city } = req.body;
    const id = Number(courseId);

    const course = await Course.findOne({ courseId: id });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const amount = parsePriceAmount(course.priceLabel || course.price);
    if (amount <= 0) {
      return res.status(400).json({ message: "This course is free. Enroll without payment." });
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

    const razorpay = getRazorpay();
    const receipt = `UG-${id}-${Date.now()}`;

    const order = await razorpay.orders.create({
      amount: amountToPaise(amount),
      currency: "INR",
      receipt,
      notes: {
        courseId: String(id),
        userId: String(req.user._id),
        studentName: name,
      },
    });

    res.json({
      keyId: getRazorpayKeyId(),
      orderId: order.id,
      amount,
      currency: order.currency,
      course: {
        id: course.courseId,
        title: course.headerTitle || course.title,
      },
    });
  } catch (err) {
    console.error(err);
    if (err.message === "Razorpay keys are not configured") {
      return res.status(503).json({ message: "Payment gateway is not configured" });
    }
    res.status(500).json({ message: "Failed to create payment order" });
  }
});

router.post("/razorpay/verify", async (req, res) => {
  try {
    const {
      courseId,
      studentName,
      email,
      city,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: "Payment details are incomplete" });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(503).json({ message: "Payment gateway is not configured" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const id = Number(courseId);
    const course = await Course.findOne({ courseId: id });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const amount = parsePriceAmount(course.priceLabel || course.price);
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

    const enrollment = await Enrollment.create({
      user: req.user._id,
      courseId: id,
      courseTitle: course.title,
      headerTitle: course.headerTitle,
      courseType: course.type,
      studentName: name,
      email: String(email || "").trim(),
      city: String(city || "").trim(),
      amount,
      paymentMethod: "razorpay",
      useEmi: false,
      orderId: generateOrderId(),
      razorpayOrderId,
      razorpayPaymentId,
      paymentStatus: "paid",
    });

    res.status(201).json({
      enrollment: mapEnrollmentWithCourse(enrollment, course),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Payment verification failed" });
  }
});

export default router;
