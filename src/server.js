import express from 'express';
import http from 'http';
import morgan from "morgan";
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { PORT, MONGO_URI } from './config.js';
import { seedAdmin } from './utils/seedAdmin.js';
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config.js";
import Message from "./models/Message.js";

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Middlewares
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(morgan('dev'));

app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/chat', chatRoutes);

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta simple para comprobar vida
app.get('/health', (_req, res) => res.json({ ok: true }));



io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Token requerido'));

  try {
    const payload = jwt.verify(token, JWT_SECRET); // { id, username, role }
    socket.user = payload; // Guardamos los datos del usuario en el socket
    next();
  } catch (err) {
    next(new Error('Token inválido'));
  }
});

io.on('connection', (socket) => {
  const { username } = socket.user;
  console.log(`🟢 ${username} conectado (${socket.id})`);

  // Notificar a los demás usuarios que alguien se conectó
  socket.broadcast.emit('chat:system', `${username} se unió al chat`);

  // Recibir y reenviar mensajes
  socket.on('chat:message', (text) => {
    if (!text || !text.trim()) return;
    const msg = {
      username,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    io.emit('chat:message', msg);
  });

  // Indicador de escritura
  socket.on('chat:typing', (isTyping) => {
    socket.broadcast.emit('chat:typing', { username, isTyping });
  });

  socket.on('disconnect', () => {
    console.log(`🔴 ${username} desconectado (${socket.id})`);
    socket.broadcast.emit('chat:system', `${username} salió del chat`);
  });
});

//Manejador de errores
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

// Conexión Mongo y arranque
async function start() {
  try {

    await mongoose.connect(MONGO_URI);
    console.log('MongoDB conectado');
    await seedAdmin();
    server.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Error al conectar a MongoDB', err);
    process.exit(1);
  }
}
start();
