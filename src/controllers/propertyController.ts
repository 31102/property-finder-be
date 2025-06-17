import { Request, Response } from 'express';
import Property from '../models/Property';
import { addWatermark } from '../services/watermarkService';

/**
 * Create a new property listing
 */
export const createProperty = async (req: Request, res: Response) => {
  try {
    // Destructure property data from the request body
    const {
      title,
      description,
      propertyType,
      bedrooms,
      bathrooms,
      price,
      location,
      area,
      features,
      companyName,
      agentName,
      agentPhone
    } = req.body;

    const imageUrls: string[] = [];

    // If images are uploaded, apply watermark and store file paths
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files as Express.Multer.File[]) {
        try {
          // Add watermark to the image using company name
          await addWatermark(file.path, companyName);
          imageUrls.push(`/uploads/properties/${file.filename}`);
        } catch (watermarkError) {
          // Even if watermarking fails, include the original image
          console.error('Watermark error for file:', file.filename, watermarkError);
          imageUrls.push(`/uploads/properties/${file.filename}`);
        }
      }
    }

    // Create a new property document
    const property = new Property({
      title,
      description,
      propertyType,
      bedrooms: parseInt(bedrooms),
      bathrooms: parseInt(bathrooms),
      price: parseFloat(price),
      location,
      area: parseFloat(area),
      // Split features string into an array
      features: features ? features.split(',').map((f: string) => f.trim()) : [],
      companyName,
      agentName,
      agentPhone,
      images: imageUrls
    });

    // Save the property to the database
    await property.save();

    // Return success response with created property
    res.status(201).json({ success: true, property });

  } catch (error: any) {
    console.error('Error creating property:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Fetch all property listings from the database
 */
export const getAllProperties = async (req: Request, res: Response) => {
  try {
    // Get all properties sorted by newest first
    const properties = await Property.find().sort({ createdAt: -1 });
    res.json({ success: true, properties });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get a single property by its ID
 */
export const getPropertyById = async (req: Request, res: any) => {
  try {
    // Find property by MongoDB ObjectId
    const property = await Property.findById(req.params.id);

    // If not found, return 404
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    // Return the property
    res.json({ success: true, property });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
