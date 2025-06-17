import express from 'express';
import cors from 'cors';
import path from 'path';

import connectDB from './config/db';
import upload from './middleware/upload';

import { createProperty, getAllProperties, getPropertyById } from './controllers/propertyController';
import { getSearchLogs, searchProperties } from './controllers/searchController';
import { errorHandler } from './middleware/errorHandler';
import dotenv from "dotenv";
dotenv.config();
const app = express();

// Connect to DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.post('/api/properties', upload.array('images', 10), createProperty);
app.get('/api/properties', getAllProperties);
app.get('/api/properties/:id', getPropertyById);

app.post('/api/search', searchProperties);
app.get('/api/search-logs', getSearchLogs);

// Error handler
app.use(errorHandler);

export default app;
