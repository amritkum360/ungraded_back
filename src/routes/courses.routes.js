import { Router } from "express";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import { mapCourseDetail, mapCourseList } from "../utils/courseMapper.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const courses = await Course.find().sort({ courseId: 1 });
    const courseIds = courses.map((c) => c.courseId);

    const enrollmentAgg =
      courseIds.length > 0
        ? await Enrollment.aggregate([
            { $match: { courseId: { $in: courseIds } } },
            { $group: { _id: "$courseId", enrollmentCount: { $sum: 1 } } },
          ])
        : [];

    const countByCourse = Object.fromEntries(
      enrollmentAgg.map((row) => [row._id, row.enrollmentCount]),
    );

    res.json({
      courses: courses.map((c) => ({
        ...mapCourseList(c),
        enrollmentCount: countByCourse[c.courseId] || 0,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
});

router.get("/:courseId", async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const course = await Course.findOne({ courseId });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json({ course: mapCourseDetail(course) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch course" });
  }
});

export default router;
