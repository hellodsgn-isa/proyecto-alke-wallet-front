/* ==========================================================
   ALKE WALLET — menu.js
   Muestra el saldo, la tarjeta y los últimos 3 movimientos.
   ========================================================== */

$(function () {

  requireAuth();
  const user = getCurrentUser();
  if (!user) return;

  $('#user-greeting').text('Hola, ' + user.nombre.split(' ')[0]);
  $('#dash-balance').text(formatCLP(user.saldo));
  $('#dash-account').text('•••• ' + user.cuenta.slice(-4));

  const ultimos = [...user.movimientos].reverse().slice(0, 3);

  $('#dash-movs-preview').html(
    ultimos.map(renderMovRow).join('') ||
    '<p class="empty-state">Todavía no tienes movimientos.</p>'
  ).hide().fadeIn(200); // pequeña transición con jQuery

});
