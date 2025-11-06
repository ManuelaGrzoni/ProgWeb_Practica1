// src/middleware/authenticateJWT.js
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

export function authenticateJWT(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) return res.status(401).json({ message: 'Token requerido' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, username, role }
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
}
