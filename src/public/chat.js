const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user') || 'null');

if (!token || !user) {
  alert('Debes iniciar sesión para usar el chat');
  location.href = '/'; // o tu página de login
}

document.getElementById('who').textContent = `${user.username} (${user.role})`;

const socket = io({
  auth: { token } 
});

const form = document.getElementById('form');
const input = document.getElementById('input');
const list  = document.getElementById('messages');
const typingEl = document.getElementById('typing');

function addMessage({ username, text, createdAt }) {
  const li = document.createElement('li');
  const mine = username === user.username;
  const when = createdAt ? new Date(createdAt).toLocaleTimeString() : '';
  li.innerHTML = `<span class="${mine ? 'me' : ''}">[${when}] ${username}:</span> ${text}`;
  list.appendChild(li);
  list.scrollTop = list.scrollHeight;
}

// (opcional) si habilitaste historial desde socket:
socket.on('chat:history', (items) => {
  for (const m of items) addMessage(m);
});

// Mensajes
socket.on('chat:message', (msg) => addMessage(msg));

// Mensajes del sistema (entradas/salidas)
socket.on('chat:system', (msg) => {
  const li = document.createElement('li');
  li.className = 'sys';
  li.textContent = msg.text;
  list.appendChild(li);
});

// Indicador "está escribiendo..."
let typingTimeout = null;
socket.on('chat:typing', ({ username: u, isTyping }) => {
  if (u === user.username) return; // no me muestres a mí
  typingEl.textContent = isTyping ? `${u} está escribiendo…` : '';
  if (isTyping) {
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => (typingEl.textContent = ''), 1500);
  }
});

// Envío
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  socket.emit('chat:message', text);
  input.value = '';
});

// Avisar "escribiendo"
let lastEmit = 0;
input.addEventListener('input', () => {
  const now = Date.now();
  if (now - lastEmit > 300) {
    socket.emit('chat:typing', true);
    lastEmit = now;
    setTimeout(() => socket.emit('chat:typing', false), 800);
  }
});
