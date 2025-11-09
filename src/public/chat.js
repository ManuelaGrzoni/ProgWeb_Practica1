// Token del login + datos del usuario
const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user') || 'null');
if (!token || !user) {
  alert('Debes iniciar sesión para usar el chat');
  location.href = '/';
}

// Elements
const messages = document.getElementById('messages');
const typingEl = document.getElementById('typing');
const countEl  = document.getElementById('userCount');
const form     = document.getElementById('form');
const input    = document.getElementById('input');
const joinForm = document.getElementById('joinForm');
const nameEl   = document.getElementById('name');
const colorEl  = document.getElementById('color');
const ding     = document.getElementById('ding');

// Nombre/color persistidos (opcional)
const savedName = localStorage.getItem('chatName');
const savedColor = localStorage.getItem('chatColor');
nameEl.value = (savedName || user.username || '').slice(0, 40);
if (savedColor) colorEl.value = savedColor;

// Conexión con JWT
const socket = io({ auth: { token } });

// Al conectar, mandar join con nombre/color
socket.on('connect', () => {
  socket.emit('chat:join', {
    name: nameEl.value.trim(),
    color: colorEl.value
  });
});

socket.on('user:count', ({ count }) => updateCount(count));
socket.on('userCount', (count) => updateCount(count));
function updateCount(n){
  if (countEl) countEl.textContent = `Usuarios conectados: ${typeof n === 'number' ? n : (n?.count ?? 0)}`;
}

socket.on('chat:message', (msg) => addMessage(msg, false, true));


socket.on('chat:system', onSystem);
socket.on('system', onSystem);
function onSystem(msg){
  const { type, username, user: legacyName, color, at } = msg || {};
  const name = username || legacyName || 'alguien';
  const li = document.createElement('li');
  li.className = 'sys pop';
  const dotClass = type === 'join' ? 'green' : 'red';
  const when = at ? ` • ${new Date(at).toLocaleTimeString()}` : '';
  li.innerHTML = `<span class="dot ${dotClass}"></span>${escapeHtml(name)} ${type === 'join' ? 'se ha unido al chat' : 'ha salido del chat'}<span class="meta">${when}</span>`;
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
}

let typingTimeout = null;
socket.on('chat:typing', ({ username, isTyping }) => showTyping(username, isTyping));
socket.on('typing', (name) => showTyping(name, true));
function showTyping(name, isTyping){
  typingEl.textContent = isTyping ? `${name} está escribiendo…` : '';
  if (isTyping) {
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => (typingEl.textContent = ''), 1500);
  }
}

// Enviar mensaje
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  socket.emit('chat:message', text);
  addMessage({ username: nameEl.value.trim() || user.username, color: colorEl.value, text, at: new Date().toISOString() }, true);
  input.value = '';
});

// Avisar que estoy escribiendo (emite ambos, por compatibilidad)
let lastEmit = 0;
input.addEventListener('input', () => {
  const now = Date.now();
  if (now - lastEmit > 300) {
    socket.emit('chat:typing', true);
    socket.emit('typing'); // compat
    lastEmit = now;
    setTimeout(() => socket.emit('chat:typing', false), 800);
  }
});

// Entrar/Cambiar nombre y color (submit de tu botón)
joinForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nameEl.value.trim().slice(0, 40);
  const color = colorEl.value;
  localStorage.setItem('chatName', name);
  localStorage.setItem('chatColor', color);
  socket.emit('chat:join', { name, color });
});

// Render helpers
function addMessage({ username, color, text, at }, mine = false, playSound = false) {
  const li = document.createElement('li');
  li.className = `pop${mine ? ' me' : ''}`;
  const when = at ? ` <span class="meta">• ${new Date(at).toLocaleTimeString()}</span>` : '';
  li.innerHTML = `<span class="name" style="color:${color || '#fff'}">${escapeHtml(username)}</span>${when}: ${escapeHtml(text)}`;
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;

  if (playSound && ding && !mine) {
    try { ding.currentTime = 0; ding.play().catch(()=>{}); } catch {}
  }
}

function escapeHtml(s=''){ return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])) }
