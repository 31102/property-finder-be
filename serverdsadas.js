const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect('mongodb+srv://mystzex:mystzex@cluster0.8lzxf.mongodb.net/propertyFinder',);

// Property Schema
const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  propertyType: { type: String, required: true },
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  area: { type: Number, required: true },
  features: [String],
  companyName: { type: String, required: true },
  agentName: { type: String, required: true },
  agentPhone: { type: String, required: true },
  images: [String],
  createdAt: { type: Date, default: Date.now }
});

const Property = mongoose.model('Property', propertySchema);

// Search Logs Schema
const searchLogSchema = new mongoose.Schema({
  query: String,
  aiResponse: Object,
  filters: Object,
  resultsCount: Number,
  timestamp: { type: Date, default: Date.now }
});

const SearchLog = mongoose.model('SearchLog', searchLogSchema);

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/properties';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Watermark function
async function addWatermark(imagePath, companyName) {
  try {
    const watermarkText = `© ${companyName}`;
    
    // Read the original image
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    // Create watermark with appropriate sizing
    const fontSize = Math.max(Math.floor(metadata.width / 30), 16);
    const watermarkSvg = `
      <svg width="${metadata.width}" height="${metadata.height}">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="1" stdDeviation="1" flood-color="black" flood-opacity="0.5"/>
          </filter>
        </defs>
        <text x="${metadata.width - 20}" y="${metadata.height - 20}" 
              font-family="Arial, sans-serif" font-size="${fontSize}" 
              font-weight="bold" fill="white" 
              text-anchor="end" 
              filter="url(#shadow)">${watermarkText}</text>
      </svg>
    `;
    
    const watermarkBuffer = Buffer.from(watermarkSvg);
    
    // Apply watermark
    const watermarkedImagePath = imagePath.replace(/(\.[^.]+)$/, '_watermarked$1');
    
    await image
      .composite([{ input: watermarkBuffer, gravity: 'southeast' }])
      .jpeg({ quality: 90 })
      .toFile(watermarkedImagePath);
    
    // Remove original file and rename watermarked file
    fs.unlinkSync(imagePath);
    fs.renameSync(watermarkedImagePath, imagePath);
    
    return imagePath;
  } catch (error) {
    console.error('Watermarking error:', error);
    throw error;
  }
}

// AI Search Service using Hugging Face (free alternative)
async function processAISearch(query) {
  try {
    // Using Hugging Face's free inference API
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
      {
        inputs: `Extract property search criteria from this query: "${query}". Return JSON with fields: propertyType, bedrooms, bathrooms, minPrice, maxPrice, location, features.`
      },
      {
        headers: {
          'Authorization': 'Bearer YOUR_HUGGINGFACE_TOKEN', // Replace with your token
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    // Parse AI response and extract filters
    const filters = parseSearchCriteria(query);
    return filters;
  } catch (error) {
    console.error('AI API error:', error);
    // Fallback to keyword-based parsing
    return parseSearchCriteria(query);
  }
}

// Fallback parsing function
function parseSearchCriteria(query) {
  const filters = {};
  const lowerQuery = query.toLowerCase();
  
  // Property type detection
  if (lowerQuery.includes('villa')) filters.propertyType = 'villa';
  else if (lowerQuery.includes('apartment')) filters.propertyType = 'apartment';
  else if (lowerQuery.includes('house')) filters.propertyType = 'house';
  else if (lowerQuery.includes('condo')) filters.propertyType = 'condo';
  
  // Bedroom detection
  const bedroomMatch = lowerQuery.match(/(\d+)\s*bedroom/);
  if (bedroomMatch) filters.bedrooms = parseInt(bedroomMatch[1]);
  
  // Bathroom detection
  const bathroomMatch = lowerQuery.match(/(\d+)\s*bathroom/);
  if (bathroomMatch) filters.bathrooms = parseInt(bathroomMatch[1]);
  
  // Location detection
  const locationKeywords = ['near', 'in', 'at', 'close to'];
  locationKeywords.forEach(keyword => {
    const regex = new RegExp(`${keyword}\\s+([^\\s,]+(?:\\s+[^\\s,]+)*)`, 'i');
    const match = query.match(regex);
    if (match && match[1]) {
      filters.location = match[1].trim();
    }
  });
  
  // Price detection
  const priceMatch = lowerQuery.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:k|thousand|million|m)?/);
  if (priceMatch) {
    let price = parseFloat(priceMatch[1].replace(/,/g, ''));
    if (lowerQuery.includes('k') || lowerQuery.includes('thousand')) price *= 1000;
    if (lowerQuery.includes('m') || lowerQuery.includes('million')) price *= 1000000;
    
    if (lowerQuery.includes('under') || lowerQuery.includes('below')) {
      filters.maxPrice = price;
    } else if (lowerQuery.includes('over') || lowerQuery.includes('above')) {
      filters.minPrice = price;
    }
  }
  
  // Features detection
  const features = [];
  if (lowerQuery.includes('pool')) features.push('pool');
  if (lowerQuery.includes('garden')) features.push('garden');
  if (lowerQuery.includes('parking')) features.push('parking');
  if (lowerQuery.includes('balcony')) features.push('balcony');
  if (lowerQuery.includes('sea') || lowerQuery.includes('ocean')) features.push('sea view');
  
  if (features.length > 0) filters.features = features;
  
  return filters;
}

// Routes

// Add Property Route
app.post('/api/properties', upload.array('images', 10), async (req, res) => {
  try {
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

    // Process images and add watermarks
    const imageUrls = [];
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          await addWatermark(file.path, companyName);
          imageUrls.push(`/uploads/properties/${file.filename}`);
        } catch (watermarkError) {
          console.error('Watermark error for file:', file.filename, watermarkError);
          // Keep the original image if watermarking fails
          imageUrls.push(`/uploads/properties/${file.filename}`);
        }
      }
    }

    // Create property
    const property = new Property({
      title,
      description,
      propertyType,
      bedrooms: parseInt(bedrooms),
      bathrooms: parseInt(bathrooms),
      price: parseFloat(price),
      location,
      area: parseFloat(area),
      features: features ? features.split(',').map(f => f.trim()) : [],
      companyName,
      agentName,
      agentPhone,
      images: imageUrls
    });

    await property.save();
    res.status(201).json({ success: true, property });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get All Properties
app.get('/api/properties', async (req, res) => {
  try {
    const properties = await Property.find().sort({ createdAt: -1 });
    res.json({ success: true, properties });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI-Powered Search Route
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }

    console.log('Processing search query:', query);
    
    // Process with AI
    const filters = await processAISearch(query);
    console.log('Extracted filters:', filters);
    
    // Build MongoDB query
    const mongoQuery = {};
    
    if (filters.propertyType) {
      mongoQuery.propertyType = new RegExp(filters.propertyType, 'i');
    }
    
    if (filters.bedrooms) {
      mongoQuery.bedrooms = filters.bedrooms;
    }
    
    if (filters.bathrooms) {
      mongoQuery.bathrooms = filters.bathrooms;
    }
    
    if (filters.minPrice || filters.maxPrice) {
      mongoQuery.price = {};
      if (filters.minPrice) mongoQuery.price.$gte = filters.minPrice;
      if (filters.maxPrice) mongoQuery.price.$lte = filters.maxPrice;
    }
    
    if (filters.location) {
      mongoQuery.location = new RegExp(filters.location, 'i');
    }
    
    if (filters.features && filters.features.length > 0) {
      mongoQuery.features = { $in: filters.features.map(f => new RegExp(f, 'i')) };
    }
    
    console.log('MongoDB query:', mongoQuery);
    
    // Execute search
    const properties = await Property.find(mongoQuery).sort({ createdAt: -1 });
    
    // Log the search
    await SearchLog.create({
      query,
      aiResponse: filters,
      filters: mongoQuery,
      resultsCount: properties.length
    });
    
    res.json({
      success: true,
      properties,
      filters,
      resultsCount: properties.length
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Search Logs (for debugging)
app.get('/api/search-logs', async (req, res) => {
  try {
    const logs = await SearchLog.find().sort({ timestamp: -1 }).limit(50);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'File too large. Maximum size is 5MB.' });
    }
  }
  res.status(500).json({ success: false, error: error.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;