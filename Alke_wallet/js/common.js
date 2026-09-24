/* ==========================================================
   ALKE WALLET — common.js
   Funciones y datos compartidos por TODAS las páginas.
   Se incluye siempre antes del script propio de cada pantalla.
   ----------------------------------------------------------
   "Base de datos" simulada con localStorage:
     - alke_users    -> arreglo con todos los usuarios registrados
     - alke_session  -> email del usuario logueado actualmente
   ========================================================== */

const STORAGE_USERS   = 'alke_users';
const STORAGE_SESSION = 'alke_session';

/* ---------- Persistencia ---------- */

function loadUsers() {
  const data = localStorage.getItem(STORAGE_USERS);
  return data ? JSON.parse(data) : [];
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function getSessionEmail() {
  return localStorage.getItem(STORAGE_SESSION);
}

function setSessionEmail(email) {
  localStorage.setItem(STORAGE_SESSION, email);
}

function clearSession() {
  localStorage.removeItem(STORAGE_SESSION);
}

function findUserByEmail(email) {
  return loadUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

function updateUser(updatedUser) {
  const users = loadUsers();
  const idx = users.findIndex(u => u.email === updatedUser.email);
  if (idx !== -1) {
    users[idx] = updatedUser;
    saveUsers(users);
  }
}

function getCurrentUser() {
  const email = getSessionEmail();
  return email ? findUserByEmail(email) : null;
}

/* Redirige a login.html si no hay sesión activa.
   Se llama al inicio de cada página protegida (menu, deposit, sendmoney, transactions). */
function requireAuth() {
  if (!getCurrentUser()) {
    window.location.href = 'login.html';
  }
}

/* ---------- Registro de usuario nuevo ---------- */

function registrarUsuario(nombre, email, password) {
  const users = loadUsers();

  // Validar correo duplicado (incluye los demo)
  const existe = users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (existe) {
    return { ok: false, error: 'Ese correo ya está registrado.' };
  }

  const nuevoUsuario = {
    nombre: nombre.trim(),
    email: email.trim().toLowerCase(),
    password: password,
    alias: generarAlias(nombre),
    cuenta: generarCuenta(),
    saldo: 0,
    movimientos: [],
    contactos: []
  };

  users.push(nuevoUsuario);
  saveUsers(users);
  return { ok: true, user: nuevoUsuario };
}

/* ---------- Datos demo (solo se crean la primera vez) ---------- */

function seedDemoData() {
  if (loadUsers().length > 0) return;

  const demoUsers = [
    {
      nombre: 'Isabella Alarcón',
      email: 'isabella@alke.cl',
      password: '1234',
      alias: 'isabella.alke',
      cuenta: '1234-5678-0001',
      saldo: 60000,
      movimientos: [movimiento('deposito', 'Depósito inicial', 60000, 60000)],
      contactos: [
        { nombre: 'Ana García', cuenta: '1234-5678-9012' },
        { nombre: 'Carlos Pérez', cuenta: '9876-5432-1098' }
      ]
    },
    {
      nombre: 'Ana García',
      email: 'ana@correo.com',
      password: '1234',
      alias: 'ana.garcia',
      cuenta: '1234-5678-9012',
      saldo: 30000,
      movimientos: [movimiento('deposito', 'Depósito inicial', 30000, 30000)],
      contactos: []
    },
    {
      nombre: 'Carlos Pérez',
      email: 'carlos@correo.com',
      password: '1234',
      alias: 'carlos.perez',
      cuenta: '9876-5432-1098',
      saldo: 15000,
      movimientos: [movimiento('deposito', 'Depósito inicial', 15000, 15000)],
      contactos: []
    }
  ];

  saveUsers(demoUsers);
}

function movimiento(tipo, detalle, monto, saldoResultante) {
  return {
    id: 'm_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    tipo,               // 'deposito' | 'retiro' | 'envio' | 'recepcion'
    detalle,
    monto,
    fecha: new Date().toISOString(),
    saldoResultante
  };
}

function generarCuenta() {
  const bloque = () => Math.floor(1000 + Math.random() * 9000);
  return `${bloque()}-${bloque()}-${bloque()}`;
}

function generarAlias(nombre) {
  const base = nombre.trim().toLowerCase().split(' ')[0];
  return `${base}.${Math.floor(Math.random() * 900 + 100)}`;
}

/* ---------- Formato ---------- */

function formatCLP(numero) {
  return '$' + Number(numero).toLocaleString('es-CL');
}

function formatFecha(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' }) +
    ', ' + d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

function iconoPorTipo(tipo) {
  switch (tipo) {
    case 'deposito':  return '<i class="bi bi-plus-lg" style="color:var(--green)"></i>';
    case 'retiro':    return '<i class="bi bi-dash-lg" style="color:var(--danger)"></i>';
    case 'envio':     return '<i class="bi bi-arrow-up-right" style="color:var(--danger)"></i>';
    case 'recepcion': return '<i class="bi bi-arrow-down-left" style="color:var(--green)"></i>';
    default:          return '<i class="bi bi-circle"></i>';
  }
}

/* Genera el HTML de una fila de movimiento (usado en menu.js y transactions.js) */
function renderMovRow(mov) {
  const esPositivo = mov.tipo === 'deposito' || mov.tipo === 'recepcion';
  const signo = esPositivo ? '+' : '–';
  const claseMonto = esPositivo ? 'amt-pos' : 'amt-neg';

  return `
    <div class="move-row">
      <div class="who">
        <div class="move-icon">${iconoPorTipo(mov.tipo)}</div>
        <div>
          <div class="move-title">${mov.detalle}</div>
          <div class="move-date">${formatFecha(mov.fecha)}</div>
        </div>
      </div>
      <div class="${claseMonto}">${signo} ${formatCLP(mov.monto)}</div>
    </div>`;
}

/* ---------- Operaciones financieras ---------- */

function realizarDeposito(monto) {
  const user = getCurrentUser();
  user.saldo += monto;
  user.movimientos.push(movimiento('deposito', 'Depósito', monto, user.saldo));
  updateUser(user);
  return user;
}

function realizarRetiro(monto) {
  const user = getCurrentUser();
  if (monto > user.saldo) {
    return { ok: false, error: 'No tienes saldo suficiente para retirar ese monto.' };
  }
  user.saldo -= monto;
  user.movimientos.push(movimiento('retiro', 'Retiro de fondos', monto, user.saldo));
  updateUser(user);
  return { ok: true, user };
}

/* Transferencia por número de cuenta.
   Si la cuenta pertenece a un usuario real del sistema, se le acredita el
   dinero de verdad. Si es un contacto ficticio (agregado a mano), la
   transferencia se simula: se descuenta el saldo del emisor y queda
   registrada en su historial, sin necesidad de que la cuenta exista. */
function realizarTransferencia(cuentaDestino, monto, nota, nombreDestino) {
  const emisor = getCurrentUser();
  const receptor = loadUsers().find(u => u.cuenta === cuentaDestino);

  if (receptor && receptor.email === emisor.email) {
    return { ok: false, error: 'No puedes transferirte a ti misma.' };
  }
  if (monto > emisor.saldo) {
    return { ok: false, error: 'No tienes saldo suficiente para esa transferencia.' };
  }

  const nombreParaDetalle = receptor ? receptor.nombre : (nombreDestino || 'un contacto');
  const detalleEnvio = nota ? `Transferencia a ${nombreParaDetalle} — ${nota}` : `Transferencia a ${nombreParaDetalle}`;

  emisor.saldo -= monto;
  emisor.movimientos.push(movimiento('envio', detalleEnvio, monto, emisor.saldo));
  updateUser(emisor);

  // Si la cuenta pertenece a un usuario real del sistema, se le acredita el dinero.
  if (receptor) {
    const detalleRecepcion = nota ? `Transferencia de ${emisor.nombre} — ${nota}` : `Transferencia de ${emisor.nombre}`;
    receptor.saldo += monto;
    receptor.movimientos.push(movimiento('recepcion', detalleRecepcion, monto, receptor.saldo));
    updateUser(receptor);
  }

  return { ok: true };
}

function agregarContacto(nombre, cuenta) {
  const user = getCurrentUser();

  if (!nombre || !cuenta) {
    return { ok: false, error: 'Completa el nombre y el número de cuenta.' };
  }
  if (user.contactos.some(c => c.cuenta === cuenta)) {
    return { ok: false, error: 'Ese contacto ya está en tu agenda.' };
  }

  user.contactos.push({ nombre, cuenta });
  updateUser(user);
  return { ok: true, user };
}

/* ---------- Mensaje flotante reutilizable ---------- */

function flashMessage(containerSelector, texto, tipo = 'success') {
  const $box = $(containerSelector);
  $box.html(`<div class="alert alert-${tipo} py-2 small flash-msg mb-3">${texto}</div>`);
  setTimeout(() => {
    $box.find('.flash-msg').addClass('fade-out');
    setTimeout(() => $box.empty(), 400);
  }, 2200);
}

/* ---------- Logout (compartido por el header de cada página protegida) ---------- */

$(function () {
  $(document).on('click', '#btn-logout', function () {
    clearSession();
    window.location.href = 'login.html';
  });
});