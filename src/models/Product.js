import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true, index: true },
    price:       { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
    imageUrl:    { type: String, default: '' }
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Product', productSchema);
