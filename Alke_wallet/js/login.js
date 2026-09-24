/* ==========================================================
   ALKE WALLET — login.js
   Valida credenciales contra localStorage y abre sesión.
   También permite crear una cuenta nueva (modal).
   ========================================================== */

$(function () {

  seedDemoData();

  // Si ya hay una sesión activa, saltar directo al menú
  if (getCurrentUser()) {
    window.location.href = 'menu.html';
    return;
  }

  // Mostrar / ocultar contraseña
  $('#btn-toggle-password').on('click', function () {
    const $input = $('#login-password');
    const $icon = $(this).find('i');
    const esPassword = $input.attr('type') === 'password';

    $input.attr('type', esPassword ? 'text' : 'password');
    $icon.toggleClass('bi-eye-fill bi-eye-slash-fill');
  });

  // Iniciar sesión
  $('#form-login').on('submit', function (e) {
    e.preventDefault();

    const email = $('#login-email').val().trim();
    const password = $('#login-password').val();
    const user = findUserByEmail(email);

    if (!user || user.password !== password) {
      $('#login-alert').removeClass('d-none alert-success')
                       .addClass('alert-danger')
                       .text('Correo o contraseña incorrectos.');
      return;
    }

    setSessionEmail(user.email);
    window.location.href = 'menu.html';
  });

  // Crear cuenta
  $('#btn-guardar-cuenta').on('click', function () {
    const nombre   = $('#reg-nombre').val().trim();
    const email    = $('#reg-email').val().trim();
    const password = $('#reg-password').val();
    const $alert   = $('#reg-alert');

    $alert.addClass('d-none').text('');

    if (!nombre || !email || !password) {
      $alert.removeClass('d-none').text('Completa todos los campos.');
      return;
    }
    if (password.length < 4) {
      $alert.removeClass('d-none').text('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    const res = registrarUsuario(nombre, email, password);

    if (!res.ok) {
      $alert.removeClass('d-none').text(res.error);
      return;
    }

    // Cierra el modal y limpia el formulario de registro
    bootstrap.Modal.getInstance(document.getElementById('modal-registro')).hide();
    $('#reg-nombre, #reg-email, #reg-password').val('');

    // Autocompleta el login para facilitar la prueba
    $('#login-email').val(res.user.email);
    $('#login-password').val('').trigger('focus');

    // Muestra aviso verde en el login
    $('#login-alert')
      .removeClass('d-none alert-danger')
      .addClass('alert-success')
      .text('¡Cuenta creada! Ahora inicia sesión.');
  });

});