import { storage } from '../config/firebase.js';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

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
    
    // Get bucket - prefer explicit bucket name, but fallback to default from app
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || undefined;
    let bucket;
    try {
      // Get the default bucket from the app, or use explicit name
      if (bucketName) {
        bucket = storage.bucket(bucketName);
        console.log(`Uploading to explicit bucket: ${bucketName}`);
      } else {
        // Use default bucket from app initialization
        bucket = storage.bucket();
        console.log(`Uploading to default bucket: ${bucket.name}`);
      }
    } catch (bucketError) {
      console.error('Error getting storage bucket:', bucketError);
      console.error('FIREBASE_STORAGE_BUCKET env var:', bucketName);
      return res.status(500).json({ 
        error: 'Storage bucket not available',
        details: bucketError.message || 'Please ensure Firebase Storage is enabled and FIREBASE_STORAGE_BUCKET is set correctly'
      });
    }
    
    if (!bucket) {
      console.error('Firebase Storage bucket not available');
      return res.status(500).json({ error: 'Storage bucket not configured' });
    }
    
    console.log(`Uploading club logo to bucket: ${bucket.name}`);
    const fileName = `club_logos/${userId}_${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(fileName);

    // Use Promise-based upload - upload first, then make public
    try {
      // Upload file first
      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype,
          metadata: {
            uploadedBy: userId,
            uploadedAt: new Date().toISOString()
          }
        }
      });

      // Make file publicly accessible after upload
      await file.makePublic();

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      res.status(200).json({
        message: 'Image uploaded successfully',
        imageUrl: publicUrl,
        fileName
      });
    } catch (uploadError) {
      console.error('File upload error:', uploadError);
      console.error('Error details:', {
        message: uploadError.message,
        code: uploadError.code,
        stack: uploadError.stack
      });
      return res.status(500).json({ 
        error: 'Failed to upload image',
        details: uploadError.message 
      });
    }
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
    
    // Get bucket - use explicit bucket name if available, otherwise use default
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    let bucket;
    try {
      bucket = bucketName ? storage.bucket(bucketName) : storage.bucket();
    } catch (bucketError) {
      console.error('Error getting storage bucket:', bucketError);
      return res.status(500).json({ 
        error: 'Storage bucket not available',
        details: bucketError.message 
      });
    }
    
    if (!bucket) {
      console.error('Firebase Storage bucket not available');
      return res.status(500).json({ error: 'Storage bucket not configured' });
    }
    
    const uploadPromises = req.files.map(async (file) => {
      const fileName = `event_images/${userId}/${Date.now()}_${file.originalname}`;
      const storageFile = bucket.file(fileName);

      // Upload file first
      await storageFile.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            uploadedBy: userId,
            uploadedAt: new Date().toISOString()
          }
        }
      });

      // Make file publicly accessible after upload
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

// Upload QR code for manual payment (single file)
export const uploadQRCode = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const userId = req.user.uid;
    
    // Get bucket - prefer explicit bucket name, but fallback to default from app
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || undefined;
    let bucket;
    try {
      if (bucketName) {
        bucket = storage.bucket(bucketName);
        console.log(`Uploading QR code to explicit bucket: ${bucketName}`);
      } else {
        bucket = storage.bucket();
        console.log(`Uploading QR code to default bucket: ${bucket.name}`);
      }
    } catch (bucketError) {
      console.error('Error getting storage bucket:', bucketError);
      return res.status(500).json({ 
        error: 'Storage bucket not available',
        details: bucketError.message 
      });
    }
    
    if (!bucket) {
      return res.status(500).json({ error: 'Storage bucket not configured' });
    }
    
    console.log(`Uploading QR code to bucket: ${bucket.name}`);
    const fileName = `qr_codes/${userId}_${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(fileName);

    // Upload file first
    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
        metadata: {
          uploadedBy: userId,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    // Make file publicly accessible after upload
    await file.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    res.status(200).json({
      message: 'QR code uploaded successfully',
      imageUrl: publicUrl,
      fileName
    });
  } catch (error) {
    console.error('QR code upload error:', error);
    next(error);
  }
};

// Delete image from Firebase Storage
export const deleteImage = async (req, res, next) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'No image URL provided' });
    }

    // Extract file path from Firebase Storage URL
    // URLs can be:
    // 1. https://storage.googleapis.com/{bucket}/{filePath}
    // 2. https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media
    let filePath = '';
    try {
      const url = new URL(imageUrl);
      
      // Handle firebasestorage.googleapis.com format
      if (url.hostname.includes('firebasestorage.googleapis.com')) {
        // Path format: /v0/b/{bucket}/o/{encodedPath}
        const pathParts = url.pathname.split('/');
        const oIndex = pathParts.findIndex(p => p === 'o');
        if (oIndex >= 0 && oIndex < pathParts.length - 1) {
          // Decode the path (URL encoded)
          filePath = decodeURIComponent(pathParts[oIndex + 1]);
        }
      } 
      // Handle storage.googleapis.com format
      else if (url.hostname.includes('storage.googleapis.com')) {
        const pathParts = url.pathname.split('/').filter(p => p);
        // First part is bucket name, rest is file path
        if (pathParts.length > 1) {
          // Find 'events', 'event_images', or 'club_logos' in path
          const keyIndex = pathParts.findIndex(p => 
            p === 'events' || 
            p === 'event_images' || 
            p === 'club_logos'
          );
          if (keyIndex >= 0) {
            filePath = pathParts.slice(keyIndex).join('/');
          } else {
            // Use everything after bucket name
            filePath = pathParts.slice(1).join('/');
          }
        }
      }
      
      // Fallback: try to extract from pathname directly
      if (!filePath) {
        const pathParts = url.pathname.split('/').filter(p => p);
        const keyIndex = pathParts.findIndex(p => 
          p === 'events' || 
          p === 'event_images' || 
          p === 'club_logos'
        );
        if (keyIndex >= 0) {
          filePath = pathParts.slice(keyIndex).join('/');
        }
      }
    } catch (urlError) {
      console.error('Error parsing image URL:', urlError);
      return res.status(400).json({ error: 'Invalid image URL format' });
    }

    if (!filePath) {
      return res.status(400).json({ error: 'Could not extract file path from URL' });
    }

    // Get bucket
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    let bucket;
    try {
      bucket = bucketName ? storage.bucket(bucketName) : storage.bucket();
    } catch (bucketError) {
      console.error('Error getting storage bucket:', bucketError);
      return res.status(500).json({ 
        error: 'Storage bucket not available',
        details: bucketError.message 
      });
    }

    if (!bucket) {
      return res.status(500).json({ error: 'Storage bucket not configured' });
    }

    const file = bucket.file(filePath);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      console.warn(`File does not exist: ${filePath}`);
      // Return success even if file doesn't exist (might have been deleted already)
      return res.status(200).json({ message: 'Image deleted successfully (file not found)' });
    }

    // Delete the file
    await file.delete();

    res.status(200).json({
      message: 'Image deleted successfully',
      deletedPath: filePath
    });
  } catch (error) {
    console.error('Delete image error:', error);
    next(error);
  }
};

export default {
  uploadClubLogo,
  uploadEventImages,
  uploadQRCode,
  uploadSingle,
  deleteImage
};

