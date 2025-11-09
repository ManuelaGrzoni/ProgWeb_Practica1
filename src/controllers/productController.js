import mongoose from 'mongoose';
import Product from '../models/Product.js';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// GET /api/products  (público o restringido: decide en rutas)
// ?q=teclado&min=10&max=50&page=1&limit=10&sort=-createdAt
export async function listProducts(req, res) {
  const {
    q = '',
    min,
    max,
    page = 1,
    limit = 10,
    sort = '-createdAt'
  } = req.query;

  const filter = {};
  if (q) filter.$text = { $search: q };
  if (min != null || max != null) {
    filter.price = {};
    if (min != null) filter.price.$gte = Number(min);
    if (max != null) filter.price.$lte = Number(max);
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize),
    Product.countDocuments(filter)
  ]);

  res.json({
    items,
    page: pageNum,
    limit: pageSize,
    total,
    pages: Math.ceil(total / pageSize)
  });
}

export async function getProduct(req, res) {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });
  const p = await Product.findById(id);
  if (!p) return res.status(404).json({ message: 'No encontrado' });
  res.json(p);
}

export async function createProduct(req, res) {
  const { name, price, description, imageUrl } = req.body;
  if (!name || price == null) {
    return res.status(400).json({ message: 'name y price son obligatorios' });
  }
  const created = await Product.create({ name, price, description, imageUrl });
  res.status(201).json(created);
}

export async function updateProduct(req, res) {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });
  const updated = await Product.findByIdAndUpdate(id, req.body, { new: true });
  if (!updated) return res.status(404).json({ message: 'No encontrado' });
  res.json(updated);
}

export async function deleteProduct(req, res) {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });
  const deleted = await Product.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: 'No encontrado' });
  res.json({ ok: true });
}
