// src/routes/authRoutes.js
import { Router } from 'express';
const router = Router();

// TODO: implementaremos register/login en el Paso 2
router.get('/status', (_req, res) => res.json({ ok: true, area: 'auth' }));

export default router;
