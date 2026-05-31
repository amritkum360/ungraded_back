import Razorpay from "razorpay";

let instance = null;

export function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys are not configured");
  }

  if (!instance) {
    instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  return instance;
}

export function getRazorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID || "";
}
