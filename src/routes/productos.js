const API = '/api/products';

const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user') || 'null');
const isAdmin = user?.role === 'admin';

const REQUIRE_AUTH_FOR_GET = false; 

const $ = (s) => document.querySelector(s);
const tbody = $('#lista tbody') || $('#list tbody') || document.querySelector('tbody'); 
const form = document.getElementById('form') || document.querySelector('form#form');
const nameEl = document.getElementById('name') || document.getElementById('nombre');
const priceEl = document.getElementById('price') || document.getElementById('precio');
const descEl = document.getElementById('description') || document.getElementById('descripcion');
const searchBtn = document.getElementById('searchBtn') || document.querySelector('button#searchBtn');
const searchInput = document.getElementById('q') || document.querySelector('input#q');

function authHeaders(includeForGet = false) {
  if (!token) return {};
  if (!includeForGet && !REQUIRE_AUTH_FOR_GET) return {};
  return { Authorization: `Bearer ${token}` };
}

function assertAuthForWrite() {
  if (!token) throw new Error('Debes iniciar sesión.');
  if (!isAdmin) throw new Error('No tienes permisos (solo admin).');
}

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

async function load() {
  try {
    const q = searchInput?.value?.trim() || '';
    const url = q ? `${API}?q=${encodeURIComponent(q)}` : API;
    const items = await fetchJSON(url, { headers: { ...authHeaders(true) } });
    render(Array.isArray(items) ? items : items.items || []);
  } catch (err) {
    showError('Error al cargar productos: ' + err.message);
  }
}

function render(items) {
  if (!tbody) return;
  tbody.innerHTML = '';
  items.forEach((p) => {
    const tr = document.createElement('tr');
    const name = p.name ?? p.nombre;
    const price = p.price ?? p.precio;
    const description = p.description ?? p.descripcion ?? '';

    const adminActions = isAdmin
      ? `<button data-del="${p._id}">Eliminar</button>`
      : '';

    tr.innerHTML = `
      <td>${name}</td>
      <td>${Number(price).toFixed(2)}</td>
      <td>${description}</td>
      <td>${adminActions}</td>
    `;
    tbody.appendChild(tr);
  });
}

function showError(msg) {
  const err = document.getElementById('error') || document.createElement('div');
  err.id = 'error';
  err.style.color = 'crimson';
  err.textContent = msg;
  (form?.parentElement || document.body).insertBefore(err, (form || document.body).nextSibling);
}

// Crear producto
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    assertAuthForWrite();

    const body = {
      name: nameEl?.value?.trim(),
      price: Number(priceEl?.value),
      description: descEl?.value?.trim()
    };

    if (!('name' in body) || !body.name) {
      const nombre = document.getElementById('nombre')?.value?.trim();
      const precio = Number(document.getElementById('precio')?.value);
      const descripcion = document.getElementById('descripcion')?.value?.trim();
      Object.assign(body, { name: nombre, price: precio, description: descripcion });
    }

    if (!body.name || Number.isNaN(body.price)) {
      throw new Error('Nombre y precio son obligatorios');
    }

    await fetchJSON(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(true) },
      body: JSON.stringify(body)
    });

    form.reset();
    await load();
  } catch (err) {
    showError('Error al añadir producto: ' + err.message);
  }
});

// Eliminar
tbody?.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-del]');
  if (!btn) return;
  try {
    assertAuthForWrite();
    const id = btn.getAttribute('data-del');
    await fetchJSON(`${API}/${id}`, {
      method: 'DELETE',
      headers: { ...authHeaders(true) }
    });
    await load();
  } catch (err) {
    showError('Error al eliminar: ' + err.message);
  }
});

// Buscar
searchBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  load();
});

// Carga inicial
load();
