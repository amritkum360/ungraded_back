export function mapCourseList(course) {
  return {
    id: course.courseId,
    courseId: course.courseId,
    headerTitle: course.headerTitle,
    title: course.title,
    teacherName: course.teacherName || "",
    category: course.category,
    language: course.language,
    type: course.type,
    startsOn: course.startsOn,
    price: course.price,
    priceLabel: course.priceLabel,
    headerBg: course.headerBg,
    thumbnailUrl: course.thumbnailUrl || "",
    status: course.status,
  };
}

export function mapCourseDetail(course) {
  const duration =
    course.category === "Full Track"
      ? "6 Months"
      : course.category === "Bootcamp"
        ? "8 Weeks"
        : "4 Weeks";

  const quickInfo =
    course.quickInfo?.length > 0
      ? course.quickInfo
      : [
          { label: duration, sub: "Program Length" },
          { label: "Online", sub: "Mode", accent: true },
          { label: "EMI", sub: "Fee Option", accent: true },
        ];

  const classes = (course.classes || []).map((c, i) => ({
    ...c.toObject?.() || c,
    title: i === 0 ? `Welcome to ${course.headerTitle}` : c.title,
  }));

  return {
    ...mapCourseList(course),
    displayName: course.headerTitle,
    bannerBg: course.bannerBg || "bg-violet-600",
    thumbnailUrl: course.thumbnailUrl || "",
    introVideoUrl: course.introVideoUrl || "",
    highlights: course.highlights || [],
    whyLabel: course.whyLabel || "WHY THIS COURSE?",
    whyTitle: course.whyTitle || "Career Outcomes You Can Actually Count On",
    whyFeatures: course.whyFeatures || [],
    quickInfo,
    eligibility: course.eligibility || [],
    classes,
    specializationTitle:
      course.specializationTitle || `What You'll Master in ${course.headerTitle}`,
    specializationItems: course.specializationItems || [],
  };
}

export function mapEnrollment(enrollment) {
  return {
    courseId: enrollment.courseId,
    courseTitle: enrollment.courseTitle,
    headerTitle: enrollment.headerTitle,
    courseType: enrollment.courseType,
    studentName: enrollment.studentName,
    email: enrollment.email,
    city: enrollment.city,
    amount: enrollment.amount,
    paymentMethod: enrollment.paymentMethod,
    paymentStatus: enrollment.paymentStatus,
    useEmi: enrollment.useEmi,
    orderId: enrollment.orderId,
    razorpayOrderId: enrollment.razorpayOrderId || "",
    razorpayPaymentId: enrollment.razorpayPaymentId || "",
    enrolledAt: enrollment.enrolledAt,
  };
}

/** Merges enrollment with live course data for dashboard cards */
export function mapEnrollmentWithCourse(enrollment, course) {
  return {
    ...mapEnrollment(enrollment),
    id: enrollment.courseId,
    headerTitle: course?.headerTitle || enrollment.headerTitle,
    title: course?.title || enrollment.courseTitle,
    teacherName: course?.teacherName || "",
    courseType: course?.type || enrollment.courseType,
    category: course?.category || "",
    language: course?.language || "",
    type: course?.type || enrollment.courseType,
    startsOn: course?.startsOn || "",
    headerBg: course?.headerBg || "bg-violet-600",
    thumbnailUrl: course?.thumbnailUrl || "",
    priceLabel: course?.priceLabel || "",
    status: course?.status || "live",
  };
}
