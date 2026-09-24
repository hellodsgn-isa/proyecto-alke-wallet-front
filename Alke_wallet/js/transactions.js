/* ==========================================================
   ALKE WALLET — transactions.js
   Lista el historial completo, con filtro por tipo.
   ========================================================== */

$(function () {

  requireAuth();
  const user = getCurrentUser();
  if (!user) return;

  $('#history-balance').text(formatCLP(user.saldo));

  const movimientos = [...user.movimientos].reverse();

  function pintar(filtro) {
    const lista = filtro === 'todos'
      ? movimientos
      : movimientos.filter(m => m.tipo === filtro);

    $('#history-list').html(
      lista.map(renderMovRow).join('') ||
      '<p class="empty-state">No hay movimientos en esta categoría.</p>'
    ).hide().fadeIn(200);
  }

  pintar('todos');

  $('#filter-tabs .nav-link').on('click', function () {
    $('#filter-tabs .nav-link').removeClass('active');
    $(this).addClass('active');
    pintar($(this).data('filter'));
  });

});
