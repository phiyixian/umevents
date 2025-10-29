import { storage } from '../config/firebase.js';
import multer from 'multer';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Multer middleware for single file upload
export const uploadSingle = upload.single('image');

// Upload club logo/profile picture
export const uploadClubLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const userId = req.user.uid;
    const bucket = storage.bucket();
    const fileName = `club_logos/${userId}_${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(fileName);

    // Upload file to Firebase Storage
    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
        metadata: {
          uploadedBy: userId,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    stream.on('error', (error) => {
      console.error('Upload error:', error);
      return res.status(500).json({ error: 'Failed to upload image' });
    });

    stream.on('finish', async () => {
      try {
        // Make file publicly accessible
        await file.makePublic();

        // Get public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        res.status(200).json({
          message: 'Image uploaded successfully',
          imageUrl: publicUrl,
          fileName
        });
      } catch (error) {
        console.error('Error making file public:', error);
        res.status(500).json({ error: 'Failed to get image URL' });
      }
    });

    stream.end(req.file.buffer);
  } catch (error) {
    console.error('Upload controller error:', error);
    next(error);
  }
};

// Upload event images
export const uploadEventImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const userId = req.user.uid;
    const bucket = storage.bucket();
    const uploadPromises = req.files.map(async (file) => {
      const fileName = `event_images/${userId}/${Date.now()}_${file.originalname}`;
      const storageFile = bucket.file(fileName);

      // Upload file
      await storageFile.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            uploadedBy: userId,
            uploadedAt: new Date().toISOString()
          }
        }
      });

      // Make file publicly accessible
      await storageFile.makePublic();

      // Get public URL
      return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    });

    const imageUrls = await Promise.all(uploadPromises);

    res.status(200).json({
      message: 'Images uploaded successfully',
      imageUrls
    });
  } catch (error) {
    console.error('Event images upload error:', error);
    next(error);
  }
};

export default {
  uploadClubLogo,
  uploadEventImages,
  uploadSingle
};

