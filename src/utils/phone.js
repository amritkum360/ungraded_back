export function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (String(phone).startsWith("+91") && digits.length === 12) return `+${digits}`;
  return null;
}

export function isValidIndianMobile(phone) {
  const normalized = normalizePhone(phone);
  return Boolean(normalized && /^\+91[6-9]\d{9}$/.test(normalized));
}
