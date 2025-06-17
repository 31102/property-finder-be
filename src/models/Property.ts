import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
  title: string;
  description: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  price: number;
  location: string;
  area: number;
  features: string[];
  companyName: string;
  agentName: string;
  agentPhone: string;
  images: string[];
  createdAt: Date;
}

const propertySchema = new Schema<IProperty>({
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

const Property = mongoose.model<IProperty>('Property', propertySchema);
export default Property;
