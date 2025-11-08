import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './config.js';

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Token requerido'));
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    socket.user = payload; // { id, username, role }
    next();
  } catch {
    next(new Error('Token inválido'));
  }
});

io.on('connection', (socket) => {
  const { username } = socket.user;

  socket.broadcast.emit('chat:system', `${username} se unió al chat`);

  socket.on('chat:message', (text) => {
    if (!text || !text.trim()) return;
    io.emit('chat:message', {
      username,
      text: text.trim(),
      createdAt: new Date().toISOString()
    });
  });

  socket.on('chat:typing', (isTyping) => {
    socket.broadcast.emit('chat:typing', { username, isTyping: !!isTyping });
  });

  socket.on('disconnect', () => {
    socket.broadcast.emit('chat:system', `${username} salió del chat`);
  });
});
