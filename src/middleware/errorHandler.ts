import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export function errorHandler(error: any, req: Request, res: any, next: NextFunction) {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'File too large. Maximum size is 5MB.' });
    }
  }
  return res.status(500).json({ success: false, error: error.message });
}
