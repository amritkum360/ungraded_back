import { Router } from "express";
import Resource from "../models/Resource.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import { mapResource } from "../utils/resourceMapper.js";
import { optionalAuth } from "../middleware/optionalAuth.js";

const router = Router();

router.get("/course/:courseId", optionalAuth, async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const course = await Course.findOne({ courseId });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const { type, tag } = req.query;
    const filter = { courseId, isPublished: true };

    if (type) filter.type = String(type).toLowerCase();
    if (tag) filter.tags = String(tag).toLowerCase();

    let resources = await Resource.find(filter).sort({ order: 1, createdAt: 1 });

    let isEnrolledInCourse = false;
    if (req.user) {
      const enrollment = await Enrollment.findOne({
        user: req.user._id,
        courseId,
      });
      isEnrolledInCourse = Boolean(enrollment);
    }

    resources = resources.filter((r) => {
      if (!r.requiresEnrollment) return true;
      return isEnrolledInCourse;
    });

    res.json({
      courseId,
      resources: resources.map(mapResource),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch resources" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource || !resource.isPublished) {
      return res.status(404).json({ message: "Resource not found" });
    }
    res.json({ resource: mapResource(resource) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch resource" });
  }
});

export default router;
