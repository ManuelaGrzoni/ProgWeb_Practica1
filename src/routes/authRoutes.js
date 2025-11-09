import { Router } from 'express';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: 'username, email y password son obligatorios' });

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(409).json({ message: 'Usuario o email ya existe' });

    const user = await User.create({ username, email, password, role: role === 'admin' ? 'admin' : 'user' });

    const token = signToken({ id: user._id, username: user.username, role: user.role });
    return res.status(201).json({
      user: { id: user._id, username: user.username, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password)
      return res.status(400).json({ message: 'emailOrUsername y password requeridos' });

    const user = await User.findOne({
      $or: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername }]
    });

    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });

    const token = signToken({ id: user._id, username: user.username, role: user.role });
    return res.json({
      user: { id: user._id, username: user.username, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user }); 
});

export default router;
