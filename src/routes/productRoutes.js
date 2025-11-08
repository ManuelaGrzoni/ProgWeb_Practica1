// src/routes/productRoutes.js
import { Router } from 'express';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// 👉 Elige si GET es público o restringido.
// Público:
router.get('/', listProducts);
router.get('/:id', getProduct);

// Solo ADMIN para crear/editar/eliminar
router.post('/', authenticate, authorize('admin'), createProduct);
router.put('/:id', authenticate, authorize('admin'), updateProduct);
router.delete('/:id', authenticate, authorize('admin'), deleteProduct);

export default router;
