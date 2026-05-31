import "dotenv/config";
import express from "express";
import cors from "cors";
import { UPLOAD_ROOT } from "./middleware/upload.js";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import coursesRoutes from "./routes/courses.routes.js";
import enrollmentsRoutes from "./routes/enrollments.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";
import resourcesRoutes from "./routes/resources.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import bannersRoutes from "./routes/banners.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import communityRoutes from "./routes/community.routes.js";
import Course from "./models/Course.js";
import Resource from "./models/Resource.js";
import Banner from "./models/Banner.js";
import { buildCourseDocuments } from "./seed/coursesData.js";
import { buildAllResourceDocuments } from "./seed/resourcesData.js";
import { buildBannerDocuments } from "./seed/bannersData.js";
import { getHeroSettings } from "./models/HeroSetting.js";

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const ADMIN_URL = process.env.ADMIN_URL || "http://localhost:5174";

app.use(
  cors({
    origin: [
      CLIENT_URL,
      ADMIN_URL,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
      "https://ungraded-three.vercel.app/"
    ],
    credentials: true,
  }),
);
app.use(express.json());

app.use("/uploads", express.static(UPLOAD_ROOT));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "ungraded-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/enrollments", enrollmentsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/resources", resourcesRoutes);
app.use("/api/banners", bannersRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/admin", adminRoutes);

async function ensureCoursesSeeded() {
  const count = await Course.countDocuments();
  if (count > 0) return;
  const docs = buildCourseDocuments();
  await Course.insertMany(docs);
  console.log(`Auto-seeded ${docs.length} courses`);
}

async function ensureResourcesSeeded() {
  const count = await Resource.countDocuments();
  if (count > 0) return;
  const courseCount = await Course.countDocuments();
  if (courseCount === 0) await ensureCoursesSeeded();
  const docs = await buildAllResourceDocuments(Course);
  if (docs.length === 0) return;
  await Resource.insertMany(docs);
  console.log(`Auto-seeded ${docs.length} resources`);
}

async function ensureBannersSeeded() {
  const count = await Banner.countDocuments();
  if (count > 0) return;
  const docs = buildBannerDocuments();
  await Banner.insertMany(docs);
  console.log(`Auto-seeded ${docs.length} homepage banners`);
}

async function start() {
  if (!process.env.JWT_SECRET) {
    console.warn("Warning: JWT_SECRET not set — using dev fallback");
    process.env.JWT_SECRET = "ungraded-dev-secret-change-in-production";
  }

  await connectDB();
  await ensureCoursesSeeded();
  await ensureResourcesSeeded();
  await ensureBannersSeeded();
  await getHeroSettings();

  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
