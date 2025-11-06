// src/server.js
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { PORT, MONGO_URI } from './config.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Middlewares
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.static('src/public'));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/chat', chatRoutes);

// Ruta simple para comprobar vida
app.get('/health', (_req, res) => res.json({ ok: true }));

// Socket.IO (demo)
io.on('connection', (socket) => {
  console.log('Cliente conectado', socket.id);
  socket.on('chat:message', (msg) => io.emit('chat:message', msg));
  socket.on('disconnect', () => console.log('Cliente desconectado', socket.id));
});

// Conexión Mongo y arranque
async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB conectado');
    server.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Error al conectar a MongoDB', err);
    process.exit(1);
  }
}
start();
