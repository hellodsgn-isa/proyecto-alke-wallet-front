/* ==========================================================
   ALKE WALLET — deposit.js
   Maneja depósito y retiro en la misma pantalla (dos pestañas).
   ========================================================== */

$(function () {

  requireAuth();
  let user = getCurrentUser();
  if (!user) return;

  let modo = 'deposito'; // 'deposito' | 'retiro'

  function actualizarSaldoEnPantalla() {
    user = getCurrentUser();
    $('#fund-balance').text(formatCLP(user.saldo));
  }

  function setModo(nuevoModo) {
    modo = nuevoModo;
    $('#fund-alert').addClass('d-none');
    $('#fund-amount').val('');

    if (modo === 'deposito') {
      $('#tab-deposit').addClass('active');
      $('#tab-withdraw').removeClass('active');
      $('#page-title').text('Depositar');
      $('#fund-label').text('Monto a depositar (CLP)');
      $('#fund-submit').text('Realizar depósito');
      $('#fund-tip').show();
    } else {
      $('#tab-withdraw').addClass('active');
      $('#tab-deposit').removeClass('active');
      $('#page-title').text('Retirar');
      $('#fund-label').text('Monto a retirar (CLP)');
      $('#fund-submit').text('Retirar fondos');
      $('#fund-tip').hide();
    }
  }

  // Si venimos desde el botón "Retirar" del menú (?retiro=1)
  if (new URLSearchParams(window.location.search).get('retiro') === '1') {
    setModo('retiro');
  }

  actualizarSaldoEnPantalla();

  $('#tab-deposit').on('click', () => setModo('deposito'));
  $('#tab-withdraw').on('click', () => setModo('retiro'));

  $('#form-fund').on('submit', function (e) {
    e.preventDefault();
    const monto = parseInt($('#fund-amount').val(), 10);

    if (!monto || monto <= 0) {
      $('#fund-alert').removeClass('d-none').text('Ingresa un monto válido.');
      return;
    }

    if (modo === 'deposito') {
      realizarDeposito(monto);
      $('#fund-alert').addClass('d-none');
      this.reset();
      actualizarSaldoEnPantalla();
      flashMessage('#flash-container', 'Depósito de ' + formatCLP(monto) + ' realizado con éxito.', 'success');
    } else {
      const resultado = realizarRetiro(monto);
      if (!resultado.ok) {
        $('#fund-alert').removeClass('d-none').text(resultado.error);
        return;
      }
      $('#fund-alert').addClass('d-none');
      this.reset();
      actualizarSaldoEnPantalla();
      flashMessage('#flash-container', 'Retiraste ' + formatCLP(monto) + ' de tu cuenta.', 'success');
    }
  });

});
