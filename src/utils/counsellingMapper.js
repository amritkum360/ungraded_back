export const COUNSELLING_STATUSES = ["pending", "contacted", "closed"];
export const TIME_SLOTS = [
  { value: "morning", label: "Morning (10 AM – 12 PM)" },
  { value: "afternoon", label: "Afternoon (2 PM – 5 PM)" },
  { value: "evening", label: "Evening (6 PM – 9 PM)" },
  { value: "flexible", label: "Flexible — any time works" },
];

export function mapCounsellingRequest(row) {
  return {
    id: row._id.toString(),
    courseId: row.courseId,
    courseTitle: row.courseTitle || "",
    studentName: row.studentName,
    phone: row.phone || "",
    alternatePhone: row.alternatePhone || "",
    email: row.email || "",
    city: row.city || "",
    topic: row.topic || "",
    message: row.message || "",
    preferredDate: row.preferredDate || "",
    preferredTimeSlot: row.preferredTimeSlot || "",
    status: row.status,
    adminNotes: row.adminNotes || "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    user:
      row.user && typeof row.user === "object" && row.user.phone
        ? { id: row.user._id?.toString(), phone: row.user.phone, name: row.user.name || "" }
        : null,
  };
}
