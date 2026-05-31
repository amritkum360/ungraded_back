export function mapResource(doc) {
  return {
    id: doc._id.toString(),
    courseId: doc.courseId,
    title: doc.title,
    description: doc.description || "",
    type: doc.type,
    meta: doc.meta || "",
    fileUrl: doc.fileUrl || "",
    externalUrl: doc.externalUrl || "",
    order: doc.order ?? 0,
    isPublished: doc.isPublished !== false,
    requiresEnrollment: Boolean(doc.requiresEnrollment),
    tags: doc.tags || [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
