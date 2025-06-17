import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer storage settings
const storage = multer.diskStorage({
  // Set destination folder for uploaded files
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/properties';
    // Create folder if it doesn't exist (recursive for nested folders)
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    // Pass the destination folder to multer
    cb(null, uploadPath);
  },

  // Generate unique filename for each uploaded file
  filename: (req, file, cb) => {
    // Create a unique suffix using current timestamp and a random number
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Construct filename: fieldname + unique suffix + original extension
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Create multer middleware instance with:
// - storage configuration
// - file filter to accept only image files
// - file size limit of 10MB (10 * 1024 * 1024 bytes)
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Accept only files with MIME type starting with 'image/'
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      // Reject non-image files with an error message
      cb('Only image files are allowed!' as any, false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // Max file size: 10MB
});

export default upload;
