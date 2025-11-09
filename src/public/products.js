const API = '/api/products';

const token = localStorage.getItem('token'); // guardado tras login
const user  = JSON.parse(localStorage.getItem('user') || 'null');

const isAdmin = user?.role === 'admin';
const adminBox = document.getElementById('adminBox');
if (isAdmin) adminBox.style.display = 'block';

const tbody = document.querySelector('#list tbody');
const form = document.getElementById('form');
const pid = document.getElementById('pid');
const nameEl = document.getElementById('name');
const priceEl = document.getElementById('price');
const descEl = document.getElementById('description');
const imgEl = document.getElementById('imageUrl');
const cancelBtn = document.getElementById('cancelBtn');

const searchForm = document.getElementById('search');
const qEl = document.getElementById('q');
const minEl = document.getElementById('min');
const maxEl = document.getElementById('max');

function authHeaders() {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${API}${query ? `?${query}` : ''}`;
  const res = await fetch(url, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('Error al cargar productos');
  const data = await res.json();
  return Array.isArray(data) ? data : data.items;
}

function renderRows(items) {
  tbody.innerHTML = '';
  for (const p of items) {
    const tr = document.createElement('tr');
    const actions =
      isAdmin
        ? `<button data-edit="${p._id}">✏️</button>
           <button data-del="${p._id}">🗑️</button>`
        : `<a href="/product.html?id=${p._id}">Ver</a>`;
    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${p.price.toFixed(2)} €</td>
      <td>${actions}</td>
    `;
    tbody.appendChild(tr);
  }
}

async function load() {
  const items = await fetchProducts({
    q: qEl.value,
    min: minEl.value,
    max: maxEl.value
  });
  renderRows(items);
}
load();

searchForm.addEventListener('submit', e => {
  e.preventDefault();
  load();
});

tbody.addEventListener('click', async (e) => {
  const editId = e.target.getAttribute('data-edit');
  const delId  = e.target.getAttribute('data-del');
  if (editId) {
    // cargar datos para edición
    const res = await fetch(`${API}/${editId}`, { headers: { ...authHeaders() } });
    const p = await res.json();
    pid.value = p._id;
    nameEl.value = p.name;
    priceEl.value = p.price;
    descEl.value = p.description || '';
    imgEl.value = p.imageUrl || '';
  }
  if (delId) {
    if (!confirm('¿Eliminar?')) return;
    const res = await fetch(`${API}/${delId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders() }
    });
    if (res.ok) load();
    else alert('No se pudo eliminar');
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    name: nameEl.value.trim(),
    price: Number(priceEl.value),
    description: descEl.value.trim(),
    imageUrl: imgEl.value.trim()
  };

  const id = pid.value;
  const url = id ? `${API}/${id}` : API;
  const method = id ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });

  if (res.ok) {
    pid.value = '';
    form.reset();
    load();
  } else {
    const err = await res.json().catch(() => ({}));
    alert(err.message || 'Error al guardar');
  }
});

cancelBtn.addEventListener('click', () => {
  pid.value = '';
  form.reset();
});
