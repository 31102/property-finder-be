import { Request, Response } from "express";
import Property from "../models/Property";
import SearchLog from "../models/SearchLog";
import { processAISearch } from "../services/aiSearchService";

// Controller function to handle AI-assisted property search
export const searchProperties = async (req: Request, res: any) => {
  try {
    const { query } = req.body;

    // Validate input: query must be provided
    if (!query) {
      return res
        .status(400)
        .json({ success: false, error: "Query is required" });
    }

    // Process the user's query using AI to extract structured search filters
    const filters = await processAISearch(query);

    // Initialize MongoDB query object
    const mongoQuery: any = {};

    // Apply filters to the MongoDB query based on AI results
    if (filters.propertyType)
      mongoQuery.propertyType = new RegExp(filters.propertyType, "i");
    if (filters.bedrooms) mongoQuery.bedrooms = filters.bedrooms;
    if (filters.bathrooms) mongoQuery.bathrooms = filters.bathrooms;

    // Handle price range filtering
    if (filters.minPrice || filters.maxPrice) {
      mongoQuery.price = {};
      if (filters.minPrice) mongoQuery.price.$gte = filters.minPrice;
      if (filters.maxPrice) mongoQuery.price.$lte = filters.maxPrice;
    }

    // Apply location filter using a case-insensitive regex
    if (filters.location)
      mongoQuery.location = new RegExp(filters.location, "i");

    // Match any of the provided features using case-insensitive regex
    if (filters.features && filters.features.length > 0) {
      mongoQuery.features = {
        $in: filters.features.map((f: string) => new RegExp(f, "i")),
      };
    }

    // Fetch matching properties from the database, sorted by newest first
    const properties = await Property.find(mongoQuery).sort({ createdAt: -1 });

    // Log the search query, AI interpretation, applied filters, and result count
    await SearchLog.create({
      query,
      aiResponse: filters,
      filters: mongoQuery,
      resultsCount: properties.length,
      timestamp: new Date(),
    });

    // Send the matched properties and filters back to the client
    res.json({
      success: true,
      properties,
      filters,
      resultsCount: properties.length,
    });
  } catch (error: any) {
    console.error("Search error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Controller function to fetch the latest search logs
export const getSearchLogs = async (req: Request, res: Response) => {
  try {
    // Retrieve the 50 most recent search logs, sorted by time (newest first)
    const logs = await SearchLog.find().sort({ timestamp: -1 }).limit(50);
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
