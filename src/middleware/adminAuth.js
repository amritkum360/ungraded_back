import { verifyToken } from "../utils/jwt.js";

export function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: "Admin login required" });
    }
    const payload = verifyToken(token);
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }
    req.admin = { email: payload.sub };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
