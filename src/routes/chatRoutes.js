// src/routes/chatRoutes.js
import { Router } from 'express';
const router = Router();

// Página simple para probar que existe ruta
router.get('/', (_req, res) => res.sendFile('chat.html', { root: 'src/public' }));

export default router;
