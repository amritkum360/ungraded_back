export function mapBanner(doc) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    subtitle: doc.subtitle || "",
    priceText: doc.priceText || "",
    ctaLabel: doc.ctaLabel || "Enroll Now",
    ctaLink: doc.ctaLink || "/batches",
    imageUrl: doc.imageUrl || "",
    backgroundColor: doc.backgroundColor || "#0f172a",
    textColor: doc.textColor || "#ffffff",
    layout: doc.layout || "split",
    order: doc.order ?? 0,
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
