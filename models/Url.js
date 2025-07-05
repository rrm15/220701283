import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema({
  longUrl: { type: String, required: true },
  shortCode: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  clicks: [
    {
      timestamp: { type: Date },
      referrer: { type: String }
    }
  ]
});

export default mongoose.model('Url', urlSchema);
