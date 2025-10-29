const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { authenticateJWT, authorizeRole } = require('../middleware/authenticateJWT');

// Listar (público)
router.get("/", async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) { next(err); }
});

// Crear (solo admin)
router.post("/", authenticateJWT, authorizeRole('admin'), async (req, res, next) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) { next(err); }
});

// Actualizar (solo admin)
router.put("/:id", authenticateJWT, authorizeRole('admin'), async (req, res, next) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(updated);
  } catch (err) { next(err); }
});

// Eliminar (solo admin)
router.delete("/:id", authenticateJWT, authorizeRole('admin'), async (req, res, next) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Producto no encontrado" });
    res.json({ message: "Producto eliminado" });
  } catch (err) { next(err); }
});

module.exports = router;
