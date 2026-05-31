import { Router } from "express";
import Course from "../models/Course.js";
import Resource from "../models/Resource.js";
import User from "../models/User.js";
import Enrollment from "../models/Enrollment.js";
import CounsellingRequest from "../models/CounsellingRequest.js";
import Banner from "../models/Banner.js";
import { getHeroSettings } from "../models/HeroSetting.js";
import {
  DEFAULT_BATCH_FILTERS,
  FILTER_TYPES,
  getBatchFiltersSettings,
  mapBatchFiltersResponse,
  normalizeBatchFilters,
} from "../models/BatchFiltersSetting.js";
import { LAYOUTS } from "../models/Banner.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { imageUpload, getPublicUploadUrl, UPLOAD_FOLDERS } from "../middleware/upload.js";
import { signAdminToken } from "../utils/jwt.js";
import { mapCourseDetail, mapCourseList } from "../utils/courseMapper.js";
import { mapResource } from "../utils/resourceMapper.js";
import { mapBanner } from "../utils/bannerMapper.js";
import { mapCounsellingRequest, COUNSELLING_STATUSES } from "../utils/counsellingMapper.js";
import { RESOURCE_TYPES } from "../models/Resource.js";

const router = Router();

function mapAdminEnrollment(e) {
  return {
    id: e._id.toString(),
    courseId: e.courseId,
    courseTitle: e.courseTitle,
    headerTitle: e.headerTitle,
    studentName: e.studentName,
    email: e.email,
    city: e.city,
    amount: e.amount,
    paymentMethod: e.paymentMethod,
    paymentStatus: e.paymentStatus,
    orderId: e.orderId,
    razorpayOrderId: e.razorpayOrderId || "",
    razorpayPaymentId: e.razorpayPaymentId || "",
    enrolledAt: e.enrolledAt,
    user: e.user
      ? { phone: e.user.phone, name: e.user.name || "" }
      : null,
  };
}

function getAdminCredentials() {
  const email = process.env.ADMIN_EMAIL || "admin@ungraded.app";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  return { email, password };
}

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  const creds = getAdminCredentials();
  if (email !== creds.email || password !== creds.password) {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }
  const token = signAdminToken(email);
  res.json({ token, admin: { email } });
});

router.use(requireAdmin);

router.post("/upload", (req, res) => {
  imageUpload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Upload failed" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    const folder = UPLOAD_FOLDERS.includes(String(req.query.folder))
      ? String(req.query.folder)
      : "posters";
    const url = getPublicUploadUrl(folder, req.file.filename);
    res.status(201).json({ url, filename: req.file.filename, folder });
  });
});

router.get("/stats", async (_req, res) => {
  try {
    const [users, courses, resources, enrollments, counselling, banners, revenueAgg] =
      await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Resource.countDocuments(),
      Enrollment.countDocuments(),
      CounsellingRequest.countDocuments({ status: "pending" }),
      Banner.countDocuments({ isActive: true }),
      Enrollment.aggregate([
        { $match: { paymentMethod: "razorpay", paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ]);

    const revenue = revenueAgg[0] || { total: 0, count: 0 };

    res.json({
      users,
      courses,
      resources,
      enrollments,
      banners,
      counsellingPending: counselling,
      payments: revenue.count,
      totalRevenue: revenue.total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load stats" });
  }
});

// ——— Courses ———
router.get("/courses", async (_req, res) => {
  try {
    const courses = await Course.find().sort({ courseId: 1 });
    res.json({ courses: courses.map(mapCourseList) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
});

router.get("/courses/:courseId", async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const course = await Course.findOne({ courseId });
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({ course: mapCourseDetail(course) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch course" });
  }
});

router.post("/courses", async (req, res) => {
  try {
    const body = req.body || {};
    let courseId = body.courseId;
    if (!courseId) {
      const last = await Course.findOne().sort({ courseId: -1 });
      courseId = last ? last.courseId + 1 : 1;
    }
    const existing = await Course.findOne({ courseId: Number(courseId) });
    if (existing) {
      return res.status(409).json({ message: "Course ID already exists" });
    }
    const course = await Course.create({ ...body, courseId: Number(courseId) });
    res.status(201).json({ course: mapCourseDetail(course) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create course" });
  }
});

router.patch("/courses/:courseId", async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const course = await Course.findOneAndUpdate(
      { courseId },
      { $set: req.body },
      { new: true, runValidators: true },
    );
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({ course: mapCourseDetail(course) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update course" });
  }
});

router.delete("/courses/:courseId", async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const course = await Course.findOneAndDelete({ courseId });
    if (!course) return res.status(404).json({ message: "Course not found" });
    await Resource.deleteMany({ courseId });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete course" });
  }
});

// ——— Resources ———
router.get("/resources", async (req, res) => {
  try {
    const filter = {};
    if (req.query.courseId) filter.courseId = Number(req.query.courseId);
    const resources = await Resource.find(filter).sort({ courseId: 1, order: 1 });
    res.json({ resources: resources.map(mapResource) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch resources" });
  }
});

router.post("/resources", async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.courseId || !body.title) {
      return res.status(400).json({ message: "courseId and title are required" });
    }
    if (body.type && !RESOURCE_TYPES.includes(body.type)) {
      return res.status(400).json({ message: `type must be one of: ${RESOURCE_TYPES.join(", ")}` });
    }
    const resource = await Resource.create(body);
    res.status(201).json({ resource: mapResource(resource) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create resource" });
  }
});

router.patch("/resources/:id", async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    );
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    res.json({ resource: mapResource(resource) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update resource" });
  }
});

router.delete("/resources/:id", async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete resource" });
  }
});

// ——— Users ———
router.get("/users", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const skip = Number(req.query.skip) || 0;
    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(),
    ]);
    res.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        phone: u.phone,
        name: u.name || "",
        createdAt: u.createdAt,
      })),
      total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// ——— Enrollments ———
router.get("/enrollments", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const skip = Number(req.query.skip) || 0;
    const filter = {};
    if (req.query.courseId) filter.courseId = Number(req.query.courseId);

    const [rows, total] = await Promise.all([
      Enrollment.find(filter)
        .populate("user", "phone name")
        .sort({ enrolledAt: -1 })
        .skip(skip)
        .limit(limit),
      Enrollment.countDocuments(filter),
    ]);

    res.json({
      enrollments: rows.map(mapAdminEnrollment),
      total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch enrollments" });
  }
});

router.get("/payments", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const skip = Number(req.query.skip) || 0;
    const filter = { paymentMethod: "razorpay", paymentStatus: "paid" };
    if (req.query.courseId) filter.courseId = Number(req.query.courseId);

    const [rows, total, revenueAgg] = await Promise.all([
      Enrollment.find(filter)
        .populate("user", "phone name")
        .sort({ enrolledAt: -1 })
        .skip(skip)
        .limit(limit),
      Enrollment.countDocuments(filter),
      Enrollment.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ]);

    const summary = revenueAgg[0] || { total: 0, count: 0 };

    res.json({
      payments: rows.map(mapAdminEnrollment),
      total,
      summary: {
        totalRevenue: summary.total,
        paidCount: summary.count,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
});

// ——— Counselling ———
router.get("/counselling", async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const rows = await CounsellingRequest.find(filter)
      .populate("user", "phone name")
      .sort({ createdAt: -1 });
    res.json({
      requests: rows.map(mapCounsellingRequest),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch counselling requests" });
  }
});

router.patch("/counselling/:id", async (req, res) => {
  try {
    const { status, adminNotes } = req.body || {};
    const updates = {};

    if (status !== undefined) {
      if (!COUNSELLING_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      updates.status = status;
    }

    if (adminNotes !== undefined) {
      updates.adminNotes = String(adminNotes).trim();
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "No updates provided" });
    }

    const row = await CounsellingRequest.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    }).populate("user", "phone name");

    if (!row) return res.status(404).json({ message: "Request not found" });
    res.json({ request: mapCounsellingRequest(row) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update request" });
  }
});

// ——— Hero section image ———
router.get("/hero", async (_req, res) => {
  try {
    const hero = await getHeroSettings();
    res.json({
      hero: {
        imageUrl: hero.imageUrl || "/icon5.jpg",
        imageAlt: hero.imageAlt || "UNGRADED learning",
        updatedAt: hero.updatedAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch hero settings" });
  }
});

// ——— Batches page filters ———
router.get("/batch-filters", async (_req, res) => {
  try {
    const doc = await getBatchFiltersSettings();
    res.json(mapBatchFiltersResponse(doc));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch batch filters" });
  }
});

router.patch("/batch-filters", async (req, res) => {
  try {
    const { filters } = req.body || {};
    if (!Array.isArray(filters)) {
      return res.status(400).json({ message: "filters array is required" });
    }

    const normalized = normalizeBatchFilters(filters);
    const hasAll = normalized.some((f) => f.filterType === "all");
    if (!hasAll) {
      return res.status(400).json({ message: 'At least one filter with type "all" is required' });
    }

    for (const f of normalized) {
      if (!FILTER_TYPES.includes(f.filterType)) {
        return res.status(400).json({ message: `Invalid filter type: ${f.filterType}` });
      }
      if (
        ["status", "category", "type", "language"].includes(f.filterType) &&
        !f.value
      ) {
        return res.status(400).json({
          message: `"${f.label}" needs a value for filter type ${f.filterType}`,
        });
      }
    }

    const doc = await getBatchFiltersSettings();
    doc.filters = normalized.length ? normalized : DEFAULT_BATCH_FILTERS;
    await doc.save();
    res.json(mapBatchFiltersResponse(doc));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update batch filters" });
  }
});

router.patch("/hero", async (req, res) => {
  try {
    const { imageUrl, imageAlt } = req.body || {};
    if (imageUrl !== undefined && !String(imageUrl).trim()) {
      return res.status(400).json({ message: "imageUrl cannot be empty" });
    }
    const hero = await getHeroSettings();
    if (imageUrl !== undefined) hero.imageUrl = String(imageUrl).trim();
    if (imageAlt !== undefined) hero.imageAlt = String(imageAlt).trim();
    await hero.save();
    res.json({
      hero: {
        imageUrl: hero.imageUrl,
        imageAlt: hero.imageAlt,
        updatedAt: hero.updatedAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update hero settings" });
  }
});

// ——— Homepage banners (posters) ———
router.get("/banners", async (_req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: 1 });
    res.json({ banners: banners.map(mapBanner) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch banners" });
  }
});

router.post("/banners", async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.imageUrl?.trim()) {
      return res.status(400).json({ message: "Poster image URL is required" });
    }
    if (body.layout && !LAYOUTS.includes(body.layout)) {
      return res.status(400).json({ message: `layout must be: ${LAYOUTS.join(", ")}` });
    }
    const banner = await Banner.create({
      layout: "full",
      title: body.title?.trim() || "Poster",
      ...body,
    });
    res.status(201).json({ banner: mapBanner(banner) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create banner" });
  }
});

router.patch("/banners/:id", async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    );
    if (!banner) return res.status(404).json({ message: "Banner not found" });
    res.json({ banner: mapBanner(banner) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update banner" });
  }
});

router.delete("/banners/:id", async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete banner" });
  }
});

export default router;
