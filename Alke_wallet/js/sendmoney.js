/* ==========================================================
   ALKE WALLET — sendmoney.js
   Agenda de contactos + autocompletar (jQuery) + transferencia.
   ========================================================== */

$(function () {

  requireAuth();
  let user = getCurrentUser();
  if (!user) return;

  let contactoActual = null; // contacto elegido para transferir en el modal

  /* ---------- Render de la agenda ---------- */

  function renderContactos(lista) {
    if (lista.length === 0) {
      $('#contacts-list').html('<p class="empty-state">Todavía no agregaste contactos.</p>');
      return;
    }

    $('#contacts-list').html(lista.map(c => `
      <div class="contact-row">
        <div class="who">
          <div class="contact-avatar"></div>
          <div>
            <div class="contact-name">${c.nombre}</div>
            <div class="contact-sub">${c.cuenta}</div>
          </div>
        </div>
        <button class="pill-btn btn-send-to" data-cuenta="${c.cuenta}" data-nombre="${c.nombre}">Enviar</button>
      </div>
    `).join('')).hide().fadeIn(200);
  }

  renderContactos(user.contactos);

  /* ---------- Autocompletar con jQuery (Lección 6) ---------- */

  $('#contact-search').on('input', function () {
    const q = $(this).val().trim().toLowerCase();
    const $box = $('#autocomplete-box');

    if (q.length === 0) {
      $box.addClass('d-none').empty();
      renderContactos(user.contactos);
      return;
    }

    const coincidencias = user.contactos.filter(c =>
      c.nombre.toLowerCase().includes(q) || c.cuenta.includes(q)
    );

    renderContactos(coincidencias);

    if (coincidencias.length > 0) {
      $box.removeClass('d-none').html(
        coincidencias.map(c => `<div class="autocomplete-item" data-cuenta="${c.cuenta}">${c.nombre} · ${c.cuenta}</div>`).join('')
      );
    } else {
      $box.addClass('d-none').empty();
    }
  });

  // Al elegir una sugerencia del autocompletar
  $(document).on('click', '.autocomplete-item', function () {
    $('#contact-search').val($(this).text());
    $('#autocomplete-box').addClass('d-none').empty();
  });

  // Cerrar el listado de sugerencias al hacer click afuera
  $(document).on('click', function (e) {
    if (!$(e.target).closest('.search-wrap').length) {
      $('#autocomplete-box').addClass('d-none');
    }
  });

  /* ---------- Agregar contacto ---------- */

  $('#form-add-contact').on('submit', function (e) {
    e.preventDefault();
    const nombre = $('#add-contact-name').val().trim();
    const cuenta = $('#add-contact-account').val().trim();

    const resultado = agregarContacto(nombre, cuenta);
    if (!resultado.ok) {
      $('#add-contact-alert').removeClass('d-none').text(resultado.error);
      return;
    }

    user = resultado.user;
    $('#add-contact-alert').addClass('d-none');
    this.reset();
    bootstrap.Modal.getInstance(document.getElementById('modalAddContact')).hide();
    renderContactos(user.contactos);
    flashMessage('#flash-container', 'Agregaste a ' + nombre + ' a tu agenda.', 'success');
  });

  /* ---------- Abrir modal de transferencia ---------- */

  $(document).on('click', '.btn-send-to', function () {
    contactoActual = { cuenta: $(this).data('cuenta'), nombre: $(this).data('nombre') };

    $('#transfer-target-name').text(contactoActual.nombre);
    $('#transfer-target-sub').text(contactoActual.cuenta);
    $('#transfer-amount').val('');
    $('#transfer-note').val('');
    $('#transfer-alert').addClass('d-none');

    new bootstrap.Modal(document.getElementById('modalTransfer')).show();
  });

  /* ---------- Confirmar transferencia ---------- */

  $('#btn-confirm-transfer').on('click', function () {
    const monto = parseInt($('#transfer-amount').val(), 10);
    const nota = $('#transfer-note').val().trim();

    if (!contactoActual) return;
    if (!monto || monto <= 0) {
      $('#transfer-alert').removeClass('d-none').text('Ingresa un monto válido.');
      return;
    }

    const resultado = realizarTransferencia(contactoActual.cuenta, monto, nota, contactoActual.nombre);
    if (!resultado.ok) {
      $('#transfer-alert').removeClass('d-none').text(resultado.error);
      return;
    }

    bootstrap.Modal.getInstance(document.getElementById('modalTransfer')).hide();
    flashMessage('#flash-container', 'Enviaste ' + formatCLP(monto) + ' a ' + contactoActual.nombre + '.', 'success');
    contactoActual = null;
  });

});