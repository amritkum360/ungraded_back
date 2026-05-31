import mongoose from "mongoose";

const FILTER_TYPES = [
  "all",
  "status",
  "category",
  "type",
  "language",
  "priceFree",
  "pricePaid",
];

const filterOptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    filterType: { type: String, enum: FILTER_TYPES, default: "all" },
    value: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

const batchFiltersSchema = new mongoose.Schema(
  {
    filters: [filterOptionSchema],
  },
  { timestamps: true },
);

const BatchFiltersSetting = mongoose.model("BatchFiltersSetting", batchFiltersSchema);

export const DEFAULT_BATCH_FILTERS = [
  { id: "all", label: "All", filterType: "all", value: "", order: 0, isActive: true },
  { id: "live", label: "Live", filterType: "status", value: "live", order: 1, isActive: true },
  {
    id: "bootcamp",
    label: "Bootcamp",
    filterType: "category",
    value: "Bootcamp",
    order: 2,
    isActive: true,
  },
  { id: "free", label: "Free", filterType: "priceFree", value: "", order: 3, isActive: true },
];

export function normalizeBatchFilters(filters) {
  if (!Array.isArray(filters) || filters.length === 0) {
    return DEFAULT_BATCH_FILTERS.map((f) => ({ ...f }));
  }

  return filters
    .map((f, index) => ({
      id: String(f.id || `filter-${index}`).trim(),
      label: String(f.label || "").trim(),
      filterType: FILTER_TYPES.includes(f.filterType) ? f.filterType : "all",
      value: String(f.value ?? "").trim(),
      order: Number.isFinite(Number(f.order)) ? Number(f.order) : index,
      isActive: f.isActive !== false,
    }))
    .filter((f) => f.id && f.label)
    .sort((a, b) => a.order - b.order);
}

export function mapBatchFiltersResponse(doc) {
  const filters = normalizeBatchFilters(doc?.filters);
  return {
    filters: filters.filter((f) => f.isActive),
    allFilters: filters,
  };
}

export async function getBatchFiltersSettings() {
  let doc = await BatchFiltersSetting.findOne();
  if (!doc) {
    doc = await BatchFiltersSetting.create({ filters: DEFAULT_BATCH_FILTERS });
  }
  return doc;
}

export { FILTER_TYPES };
export default BatchFiltersSetting;
