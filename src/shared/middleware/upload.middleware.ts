/**
 * File Upload Middleware (Multer)
 * Handles avatar image uploads with size/type validation
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.memoryStorage(); // Store in memory for sharp processing

// File filter — images only
const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }
};

// Avatar upload middleware (single file, max 5MB)
export const avatarUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
}).single('avatar');

export { UPLOAD_DIR };
