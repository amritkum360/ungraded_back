import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_ROOT = path.join(__dirname, "../../uploads");

export const UPLOAD_FOLDERS = ["posters", "hero", "courses"];

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function resolveFolder(req) {
  const folder = String(req.query.folder || req.body?.folder || "posters");
  return UPLOAD_FOLDERS.includes(folder) ? folder : "posters";
}

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const folder = resolveFolder(req);
    const dir = path.join(UPLOAD_ROOT, folder);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 48);
    cb(null, `${Date.now()}-${base || "image"}${ext}`);
  },
});

export const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("Only JPG, PNG, WebP, and GIF images are allowed"));
  },
});

export function getPublicUploadUrl(folder, filename) {
  return `/uploads/${folder}/${filename}`;
}
