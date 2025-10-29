import express from 'express';
import { uploadClubLogo, uploadEventImages, uploadSingle } from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();

// All routes are protected
router.use(authenticate);

// Configure multer for multiple files
const uploadMultiple = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
}).array('images', 10); // Max 10 images

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Upload club logo (single file)
router.post('/club-logo', authorize('club'), uploadSingle, handleMulterError, uploadClubLogo);

// Upload event images (multiple files)
router.post('/event-images', authorize('club'), uploadMultiple, handleMulterError, uploadEventImages);

export default router;

