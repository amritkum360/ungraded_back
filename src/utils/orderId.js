export function generateOrderId() {
  const suffix = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `UG-${suffix}-${rand}`;
}
