import mongoose, { Schema, Document } from 'mongoose';

export interface ISearchLog extends Document {
  query: string;
  aiResponse: any;
  filters: any;
  resultsCount: number;
  timestamp: Date;
}

const searchLogSchema = new Schema<ISearchLog>({
  query: String,
  aiResponse: Object,
  filters: Object,
  resultsCount: Number,
  timestamp: { type: Date, default: Date.now }
});

const SearchLog = mongoose.model<ISearchLog>('SearchLog', searchLogSchema);
export default SearchLog;
