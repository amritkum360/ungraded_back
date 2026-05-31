/** Default resources per course — used by seed & auto-seed on startup */
export function buildResourcesForCourse(courseId, headerTitle) {
  const name = headerTitle || `Course ${courseId}`;
  return [
    {
      courseId,
      title: `${name} — Batch Notes`,
      description: "Complete lecture notes for all modules",
      type: "pdf",
      meta: "2.4 MB",
      fileUrl: "",
      order: 1,
      isPublished: true,
      requiresEnrollment: true,
      tags: ["notes", "pdf"],
    },
    {
      courseId,
      title: "Practice Assignments (DPP)",
      description: "Daily practice problems with solutions",
      type: "dpp",
      meta: "Week 1–4",
      fileUrl: "",
      order: 2,
      isPublished: true,
      requiresEnrollment: true,
      tags: ["dpp", "practice"],
    },
    {
      courseId,
      title: "Recorded Lectures",
      description: "Watch all live class recordings anytime",
      type: "video",
      meta: "All modules",
      externalUrl: "",
      order: 3,
      isPublished: true,
      requiresEnrollment: true,
      tags: ["video", "recordings"],
    },
    {
      courseId,
      title: "Career Roadmap & Templates",
      description: "Resume, portfolio and monetization templates",
      type: "sheet",
      meta: "1.1 MB",
      fileUrl: "",
      order: 4,
      isPublished: true,
      requiresEnrollment: false,
      tags: ["career", "templates"],
    },
    {
      courseId,
      title: "Syllabus & Important Links",
      description: "Official syllabus and reference links",
      type: "link",
      meta: "Free preview",
      externalUrl: "https://getungraded.com",
      order: 0,
      isPublished: true,
      requiresEnrollment: false,
      tags: ["syllabus", "free"],
    },
  ];
}

export async function buildAllResourceDocuments(Course) {
  const courses = await Course.find().select("courseId headerTitle").lean();
  return courses.flatMap((c) =>
    buildResourcesForCourse(c.courseId, c.headerTitle),
  );
}
