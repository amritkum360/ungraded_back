export function parsePriceAmount(priceLabel) {
  if (!priceLabel || priceLabel === "Free") return 0;
  const digits = String(priceLabel).replace(/[^\d]/g, "");
  return Number(digits) || 0;
}

export function amountToPaise(amount) {
  return Math.round(Number(amount) * 100);
}
