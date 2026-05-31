import User from "../models/User.js";
import { verifyToken } from "../utils/jwt.js";

/** Sets req.user when valid token present; does not fail if missing */
export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      req.user = null;
      return next();
    }
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    req.user = user || null;
    next();
  } catch {
    req.user = null;
    next();
  }
}
