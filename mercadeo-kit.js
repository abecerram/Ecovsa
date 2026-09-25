/* ═══════════════════════════════════════════════════════════════════
   ECOVSA · Mercadeo (CRM) · kit común de las pantallas
   ───────────────────────────────────────────────────────────────────
   Cada pantalla de mercadeo:
     <head>
       <script>window.PUENTE_CONFIG={sinCopia:/./,indicador:'oculto',enSupabase:/^api_(?!optimizarRuta$)/,
         escritura:/^api_(crm(Guardar|Completar|Anular|Captura|Mover|Reasignar|Borrar|Subir|Usar)|guardar|marcar|abrir|cerrar|registrar|borrar|eliminar|crear|actualizar|enviar|corregir|dar|anular|confirmar|aprobar|rechazar|subir|asignar|mover|cambiar|agregar|nuevo|editar|reabrir|emitir|pasar|pedir)/i};</script>
       <script src="puente.js"></script>
       <link rel="stylesheet" href="mercadeo-kit.css">
       <script src="mercadeo-kit.js"></script>
     </head>
     <body class="mk">
       <div id="sysbar"></div>
       <div class="shell"><nav class="mnav" id="mnav"></nav><main class="main" id="main"> … </main></div>
       <script> MK.iniciar('inicio', function(base){ … }); </script>

   Lo que da MK:
     MK.api(fn, ...args) → Promise con la respuesta del servidor.
        Si el PIN ya no vale, vuelve a la entrada. Si responde {ok:false},
        la promesa se resuelve igual (la pantalla decide qué decir).
     MK.base (api_crmBase), MK.usuario, MK.hoy, MK.pin
     MK.esc, MK.dinero, MK.num, MK.fecha, MK.fechaLarga, MK.hora, MK.dias,
     MK.masDias, MK.lunes, MK.param(nombre), MK.ic(nombre, tam), MK.ini(nombre)
     MK.aviso(texto)                    mensaje corto abajo
     MK.hoja(html, {ancha}) / MK.cerrarHoja()
     MK.lado(html) / MK.cerrarLado()
     MK.confirmar(texto, alAceptar, {boton, peligro})
     MK.captura({empresa})             captura rápida de oportunidad (tecla N)
     MK.actividad({ref, refTipo, cuenta, tipo, tareaId, texto})
     MK.completar(tarea)               cerrar una tarea: qué pasó + la siguiente
     MK.tarea({ref, refTipo, cuenta, fecha, hora, …})  crear / editar tarea
     MK.mensaje({canal, telefono, correo, ref, refTipo, cuenta, contacto, momento, vars})
     MK.irOportunidad(cod) / MK.irCliente(id)
     MK.cambio()                       avisa a la pantalla que algo se guardó
                                       (window 'mk:cambio'); cada pantalla
                                       recarga lo suyo al oírlo.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  var K_PIN = 'ecovsa_pin';
  var MK = window.MK = { pin: '', base: null, usuario: null, hoy: '' };

  var PAGINAS = [
    { g: 'COMERCIAL' },
    { id: 'inicio', n: 'Mi día comercial', i: 'casa', f: 'Mercadeo.html' },
    { id: 'oportunidades', n: 'Oportunidades', i: 'embudo', f: 'MerOportunidades.html', b: 'oportunidades', bg: true },
    { id: 'oportunidad', n: 'Ficha de oportunidad', i: 'documento', f: 'MerOportunidad.html', oculto: true },
    { id: 'nueva', n: 'Nueva oportunidad', i: 'mas', accion: 'captura' },
    { id: 'agenda', n: 'Agenda y actividades', i: 'calendario', f: 'MerAgenda.html', b: 'agenda' },
    { g: 'CLIENTES' },
    { id: 'clientes', n: 'Clientes', i: 'edificio', f: 'MerClientes.html' },
    { id: 'cliente', n: 'Ficha del cliente', i: 'persona', f: 'MerCliente.html', oculto: true },
    { id: 'documentos', n: 'Propuestas y contratos', i: 'contrato', f: 'MerDocumentos.html' },
    { id: 'entregables', n: 'Certificados y distintivos', i: 'sello', f: 'MerEntregables.html' },
    { g: 'ADMINISTRATIVO' },
    { id: 'compras', n: 'Solicitudes de compra', i: 'carrito', f: 'MerCompras.html', b: 'compras', bg: true },
    { g: 'ANÁLISIS' },
    { id: 'reportes', n: 'Reportes', i: 'grafico', f: 'MerReportes.html' },
    { id: 'ajustes', n: 'Plantillas y ajustes', i: 'ajustes', f: 'MerAjustes.html' }
  ];
  MK.PAGINAS = PAGINAS;

  var ICONOS = {
    casa: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    embudo: '<path d="M3 4h18l-7 8v6l-4 2v-8z"/>',
    persona: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    personas: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5"/><circle cx="17" cy="7" r="2.8"/><path d="M16 12.8c2.7.2 4.6 2 5.5 5"/>',
    edificio: '<rect x="4" y="3" width="11" height="18" rx="1"/><path d="M15 9h5v12h-5"/><path d="M8 7h3M8 11h3M8 15h3"/>',
    calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    tarea: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l3 3 5-6"/>',
    telefono: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    llamada: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    whatsapp: '<path d="M4 20l1.3-3.8A8 8 0 1 1 8 19z"/><path d="M9 9.5c.5 2 2.3 4 4.5 4.8l1.2-1.2 2 1-.5 1.5c-3.5.3-7.7-3.6-7.6-7.2l1.4-.6 1 2z"/>',
    correo: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    visita: '<path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
    reunion: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5"/><circle cx="17" cy="7" r="2.8"/><path d="M16 12.8c2.7.2 4.6 2 5.5 5"/>',
    nota: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    sistema: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    documento: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
    contrato: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 17c1.5-2 2.5-2 3 0s1.5 1 3-1"/>',
    sello: '<circle cx="12" cy="9" r="5.5"/><path d="M9 13.8 7.5 21l4.5-2.4 4.5 2.4-1.5-7.2"/><path d="M10 9l1.5 1.5L14 7.5"/>',
    qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v7M14 20h3"/>',
    carrito: '<circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2l2.4 11h11l2-8H6.5"/>',
    billete: '<rect x="2.5" y="6" width="19" height="12" rx="2.2"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9.5v5M18 9.5v5"/>',
    caja: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M3 13h18"/>',
    grafico: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    tendencia: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    ajustes: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    plantilla: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/>',
    campana: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    buscar: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    filtro: '<path d="M4 5h16M7 12h10M10 19h4"/>',
    flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    atras: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    alerta: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
    estrella: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    ruta: '<path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
    camion: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    moneda: '<circle cx="12" cy="12" r="9"/><path d="M14.8 9.2a3 3 0 0 0-2.8-1.7c-1.6 0-2.7.9-2.7 2.1 0 2.9 5.6 1.6 5.6 4.5 0 1.3-1.2 2.2-2.9 2.2a3.1 3.1 0 0 1-2.9-1.8"/><path d="M12 6v12"/>',
    lapiz: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    clip: '<path d="M20 11l-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7"/>',
    subir: '<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>',
    bajar: '<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>',
    imprimir: '<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2"/><rect x="6" y="14" width="12" height="7"/>',
    ojo: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    lista: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    renovar: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8"/><path d="M4 3v5h5M4 13a8 8 0 0 0 14.5 4.5L20 16"/><path d="M20 21v-5h-5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    basura: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    enlace: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    tarea2: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'
  };
  MK.ICONOS = ICONOS;
  MK.ic = function (n, s) {
    return '<svg class="i" viewBox="0 0 24 24"' + (s ? ' style="width:' + s + 'px;height:' + s + 'px"' : '') + '>' + (ICONOS[n] || ICONOS.documento) + '</svg>';
  };

  /* ── formatos ── */
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  var DIAS_L = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  MK.MESES = MESES; MK.MESES_L = MESES_L; MK.DIAS = DIAS; MK.DIAS_L = DIAS_L;
  MK.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  MK.num = function (v, d) { var x = Number(String(v == null ? 0 : v).replace(/,/g, '')); if (!isFinite(x)) x = 0; return x.toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  MK.dinero = function (v, corto) {
    var x = Number(String(v == null ? 0 : v).replace(/,/g, '')); if (!isFinite(x)) x = 0;
    if (corto && Math.abs(x) >= 10000) return 'B/. ' + (Math.round(x / 100) / 10).toLocaleString('en-US') + 'k';
    return 'B/. ' + x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  function d12(iso) { return new Date(String(iso).slice(0, 10) + 'T12:00:00'); }
  MK.fecha = function (iso) {   // "vie 25 sep"
    if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || '';
    var d = d12(iso); var s = DIAS[d.getDay()] + ' ' + d.getDate() + ' ' + MESES[d.getMonth()];
    if (MK.hoy && String(iso).slice(0, 4) !== MK.hoy.slice(0, 4)) s += ' ' + String(iso).slice(0, 4);
    return s;
  };
  MK.fechaCorta = function (iso) { if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || ''; var d = d12(iso); return d.getDate() + ' ' + MESES[d.getMonth()] + (MK.hoy && String(iso).slice(0, 4) !== MK.hoy.slice(0, 4) ? ' ' + String(iso).slice(2, 4) : ''); };
  MK.fechaLarga = function (iso) { if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || ''; var d = d12(iso); return DIAS_L[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES_L[d.getMonth()] + ' de ' + d.getFullYear(); };
  MK.mesNombre = function (ym) { if (!/^\d{4}-\d{2}/.test(ym || '')) return ym || ''; return MESES_L[Number(ym.slice(5, 7)) - 1] + ' ' + ym.slice(0, 4); };
  MK.cuando = function (iso) {  // hoy · mañana · ayer · hace 3 días · en 5 días
    if (!iso || !MK.hoy) return MK.fecha(iso);
    var n = MK.dias(MK.hoy, String(iso).slice(0, 10));
    if (n === 0) return 'hoy'; if (n === 1) return 'mañana'; if (n === -1) return 'ayer';
    if (n < 0 && n > -8) return 'hace ' + (-n) + ' días'; if (n > 0 && n < 8) return 'en ' + n + ' días';
    return MK.fecha(iso);
  };
  MK.dias = function (a, b) { return Math.round((d12(b) - d12(a)) / 86400000); };
  MK.masDias = function (iso, n) { var d = d12(iso); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  MK.lunes = function (iso) { var d = d12(iso); var w = (d.getDay() + 6) % 7; return MK.masDias(iso, -w); };
  MK.hoyLocal = function () { var d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
  MK.ahoraHM = function () { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); };
  MK.ini = function (n) { var p = String(n || '').replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ ]/g, ' ').trim().split(/\s+/); return ((p[0] || '?')[0] + (p[1] ? p[1][0] : '')).toUpperCase(); };
  MK.param = function (k) { try { return new URLSearchParams(location.search).get(k) || ''; } catch (e) { return ''; } };
  MK.telWa = function (t) { var n = String(t || '').replace(/\D/g, ''); if (!n) return ''; if (n.length === 7 || n.length === 8) n = '507' + n; return n; };
  MK.TIPOS = { llamada: 'Llamada', visita: 'Visita', whatsapp: 'WhatsApp', correo: 'Correo', reunion: 'Reunión', nota: 'Nota', tarea: 'Tarea', sistema: 'Sistema' };
  MK.ETAPA_TAG = function (e) {
    var m = { 'Registrado': 't-gris', 'Formulario enviado': 't-info', 'Formulario recibido': 't-info', 'Propuesta enviada': 't-info',
      'En negociación': 't-warn', 'Contrato en proceso': 't-warn', 'Firmado': 't-ok', 'Pasado a cartera': 't-ok', 'Rechazado': 't-bad', 'Stand-by': 't-gris' };
    return '<span class="tag ' + (m[e] || 't-gris') + '">' + MK.esc(e || 'Registrado') + '</span>';
  };

  /* ── servidor ── */
  function irEntrada() { try { localStorage.removeItem(K_PIN); } catch (e) {} location.href = 'index.html'; }
  MK.api = function (fn) {
    var args = Array.prototype.slice.call(arguments, 1);
    return new Promise(function (ok, mal) {
      var run = window.google && google.script && google.script.run;
      if (!run) { mal(new Error('Falta la conexión con el servidor (puente.js).')); return; }
      run.withSuccessHandler(function (r) {
        if (r && r.requiereLogin) { irEntrada(); return; }
        ok(r);
      }).withFailureHandler(function (e) { mal(e instanceof Error ? e : new Error(String((e && e.message) || e || 'Sin conexión'))); })[fn].apply(null, args);
    });
  };
  /* Llamada que avisa sola si falla. Devuelve la respuesta solo si ok. */
  MK.llamar = function (fn) {
    var a = arguments;
    return MK.api.apply(null, a).then(function (r) {
      if (!r || r.ok === false) { MK.aviso((r && r.error) || 'No se pudo completar.'); throw new Error((r && r.error) || 'Error'); }
      return r;
    }, function (e) { MK.aviso(e.message || 'Sin conexión'); throw e; });
  };
  MK.cambio = function (detalle) { try { window.dispatchEvent(new CustomEvent('mk:cambio', { detail: detalle || {} })); } catch (e) {} refrescarBase(); };

  /* ── piezas de interfaz ── */
  MK.aviso = function (t) {
    var e = document.getElementById('toast'); if (!e) { e = document.createElement('div'); e.id = 'toast'; e.className = 'toast'; document.body.appendChild(e); }
    e.textContent = t; e.classList.add('si'); clearTimeout(MK.aviso._t); MK.aviso._t = setTimeout(function () { e.classList.remove('si'); }, 3200);
  };
  MK.hoja = function (html, op) {
    var h = document.getElementById('hoja'); if (!h) { h = document.createElement('div'); h.id = 'hoja'; h.className = 'hoja'; h.onclick = function (e) { if (e.target === h) MK.cerrarHoja(); }; document.body.appendChild(h); }
    h.innerHTML = '<div class="cuerpo' + (op && op.ancha ? ' ancha' : '') + '" role="dialog" aria-modal="true">' + html + '</div>'; h.classList.add('si');
    var f = h.querySelector('[autofocus]'); if (f) setTimeout(function () { f.focus(); }, 60);
    return h.firstChild;
  };
  MK.cerrarHoja = function () { var h = document.getElementById('hoja'); if (h) h.classList.remove('si'); };
  MK.lado = function (html) {
    var l = document.getElementById('mk-lado'); if (!l) { l = document.createElement('aside'); l.id = 'mk-lado'; l.className = 'lado'; document.body.appendChild(l); }
    l.innerHTML = '<button class="btn gh sm cerrar" onclick="MK.cerrarLado()" aria-label="Cerrar">' + MK.ic('x', 16) + '</button>' + html; l.classList.add('si'); l.scrollTop = 0; return l;
  };
  MK.cerrarLado = function () { var l = document.getElementById('mk-lado'); if (l) l.classList.remove('si'); };
  MK.confirmar = function (texto, alAceptar, op) {
    op = op || {};
    MK.hoja('<h2>' + MK.esc(op.titulo || '¿Seguro?') + '</h2><p class="muted" style="margin-top:6px;white-space:pre-wrap">' + MK.esc(texto) + '</p>' +
      '<div class="pie"><button class="btn" onclick="MK.cerrarHoja()">Cancelar</button><button class="btn ' + (op.peligro ? 'bad' : 'pri') + '" id="mk-si">' + MK.esc(op.boton || 'Sí, continuar') + '</button></div>');
    document.getElementById('mk-si').onclick = function () { MK.cerrarHoja(); alAceptar(); };
  };
  MK.cargando = function (el, t) { if (typeof el === 'string') el = document.getElementById(el); if (el) el.innerHTML = '<div class="cargando">' + MK.esc(t || 'Cargando…') + '</div>'; };
  MK.vacio = function (t) { return '<div class="vacio">' + MK.esc(t) + '</div>'; };
  MK.error = function (el, t) { if (typeof el === 'string') el = document.getElementById(el); if (el) el.innerHTML = '<div class="aviso rj">' + MK.esc(t || 'No se pudo cargar.') + ' <a href="#" onclick="location.reload();return false">Reintentar</a></div>'; };
  MK.irOportunidad = function (cod) { location.href = 'MerOportunidad.html?id=' + encodeURIComponent(cod); };
  MK.irCliente = function (id) { location.href = 'MerCliente.html?id=' + encodeURIComponent(id); };
  MK.ocupado = function (btn, si, texto) {
    if (!btn) return; if (si) { btn._t = btn.innerHTML; btn.disabled = true; btn.innerHTML = MK.esc(texto || 'Guardando…'); } else { btn.disabled = false; if (btn._t) btn.innerHTML = btn._t; }
  };

  /* ── barra y menú ── */
  function contador(p) {
    var c = (MK.base && MK.base.contadores) || {};
    if (p.b === 'oportunidades') return c.excedidas ? '<span class="n">' + c.excedidas + '</span>' : (c.oportunidades ? '<span class="n g">' + c.oportunidades + '</span>' : '');
    if (p.b === 'agenda') { var n = (c.tareasHoy || 0) + (c.atrasadas || 0); return n ? '<span class="n' + (c.atrasadas ? '' : ' g') + '">' + n + '</span>' : ''; }
    if (p.b === 'compras') return c.compras ? '<span class="n g">' + c.compras + '</span>' : '';
    return '';
  }
  function menuHtml(pag) {
    return PAGINAS.map(function (p) {
      if (p.g) return '<div class="grp">' + p.g + '</div>';
      if (p.oculto && p.id !== pag) return '';
      if (p.accion === 'captura' && MK.usuario && MK.usuario.rol === 'gerente') return '';
      var href = p.f ? ' href="' + p.f + '"' : ' onclick="MK.captura();return false"';
      return '<a' + href + ' class="' + (p.id === pag ? 'on' : '') + '">' + MK.ic(p.i, 17) + MK.esc(p.n) + contador(p) + '</a>';
    }).join('') + '<div class="pie">¿Buscas la pantalla anterior? <a href="Alta.html">Abrir Alta</a></div>';
  }
  function pintarBarra(pag) {
    var sb = document.getElementById('sysbar');
    if (sb) {
      var u = MK.usuario || { nombre: '' };
      sb.className = 'sysbar';
      sb.innerHTML = '<button class="ham" onclick="MK.menuCel()" aria-label="Menú">' + MK.ic('menu', 22) + '</button>' +
        '<div class="lg"></div><div class="mk"><b>ECOVSA</b><span>Sistema de operaciones</span></div><div class="sep"></div><span class="mod">Mercadeo</span>' +
        '<div class="sp"></div><div class="srch">' + MK.ic('buscar', 15) + '<input id="mk-q" placeholder="Buscar cliente, oportunidad, RUC…" autocomplete="off"><div class="res" id="mk-res" hidden></div></div>' +
        (u.rol === 'gerente' ? '' : '<button class="cap" onclick="MK.captura()" title="Captura rápida (tecla N)">') + (u.rol === 'gerente' ? '' : MK.ic('mas', 15) + '<span class="tx">Captura</span></button>') +
        '<div class="us"><span>' + MK.esc(u.nombre) + '</span><div class="av">' + MK.esc(MK.ini(u.nombre)) + '</div></div>' +
        '<button class="bt" onclick="location.href=\'index.html\'">Módulos</button>';
      var q = document.getElementById('mk-q'); q.oninput = buscar; q.onkeydown = teclasBusqueda;
      q.onfocus = function () { if (q.value.trim().length >= 2) buscar(); };
      document.addEventListener('click', function (e) { if (!e.target.closest || !e.target.closest('.srch')) { var r = document.getElementById('mk-res'); if (r) r.hidden = true; } });
    }
    var nv = document.getElementById('mnav'); if (nv) nv.innerHTML = menuHtml(pag);
  }
  MK.menuCel = function () {
    var m = document.getElementById('mk-menu');
    if (!m) { m = document.createElement('div'); m.id = 'mk-menu'; m.className = 'menu-cel'; m.onclick = function (e) { if (e.target === m) m.classList.remove('si'); }; document.body.appendChild(m); }
    m.innerHTML = '<nav class="mnav">' + menuHtml(MK._pag) + '<div class="pie"><a href="index.html">← Volver a los módulos</a></div></nav>'; m.classList.add('si');
  };
  function refrescarBase() {
    MK.api('api_crmBase', MK.pin).then(function (b) { if (b && b.ok) { MK.base = b; var nv = document.getElementById('mnav'); if (nv) nv.innerHTML = menuHtml(MK._pag); } }, function () {});
  }

  /* ── búsqueda global ── */
  var tBus = null, resBus = [], selBus = -1;
  function buscar() {
    var q = document.getElementById('mk-q').value.trim(), r = document.getElementById('mk-res');
    clearTimeout(tBus);
    if (q.length < 2) { r.hidden = true; return; }
    tBus = setTimeout(function () {
      r.hidden = false; r.innerHTML = '<div class="vac">Buscando…</div>';
      MK.api('api_crmBuscar', MK.pin, q).then(function (x) {
        resBus = (x && x.resultados) || []; selBus = -1;
        if (!resBus.length) { r.innerHTML = '<div class="vac">Nada con «' + MK.esc(q) + '». <a href="#" onclick="MK.captura({empresa:document.getElementById(\'mk-q\').value});return false">Crear oportunidad</a></div>'; return; }
        r.innerHTML = resBus.map(function (z, i) {
          var ic = z.tipo === 'cliente' ? 'edificio' : z.tipo === 'oportunidad' ? 'embudo' : 'persona';
          return '<a href="#" data-i="' + i + '" onclick="MK._abrirRes(' + i + ');return false">' + MK.ic(ic, 16) + '<span><b>' + MK.esc(z.nombre) + '</b><small>' +
            (z.tipo === 'cliente' ? 'Cliente' : z.tipo === 'oportunidad' ? 'Oportunidad' : 'Contacto') + (z.detalle ? ' · ' + MK.esc(z.detalle) : '') + '</small></span></a>';
        }).join('');
      }, function () { r.innerHTML = '<div class="vac">Sin conexión.</div>'; });
    }, 250);
  }
  function teclasBusqueda(e) {
    var r = document.getElementById('mk-res'); if (r.hidden || !resBus.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); selBus = (selBus + (e.key === 'ArrowDown' ? 1 : -1) + resBus.length) % resBus.length;
      [].forEach.call(r.querySelectorAll('a'), function (a, i) { a.classList.toggle('on', i === selBus); }); }
    else if (e.key === 'Enter') { e.preventDefault(); MK._abrirRes(selBus < 0 ? 0 : selBus); }
    else if (e.key === 'Escape') { r.hidden = true; }
  }
  MK._abrirRes = function (i) {
    var z = resBus[i]; if (!z) return;
    if (z.tipo === 'cliente') MK.irCliente(z.id);
    else if (z.tipo === 'oportunidad') MK.irOportunidad(z.id);
    else if (z.refTipo === 'cli') MK.irCliente(z.id); else MK.irOportunidad(z.id);
  };

  /* ── opciones de chip ── */
  function chips(nombre, opciones, valor) {
    return '<div class="row w" data-chips="' + nombre + '">' + opciones.map(function (o) {
      var v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o;
      return '<button type="button" class="chip' + (v === valor ? ' on' : '') + '" data-v="' + MK.esc(v) + '">' + t + '</button>';
    }).join('') + '</div>';
  }
  function activarChips(raiz) {
    [].forEach.call(raiz.querySelectorAll('[data-chips]'), function (g) {
      g.onclick = function (e) { var b = e.target.closest('.chip'); if (!b) return; [].forEach.call(g.querySelectorAll('.chip'), function (c) { c.classList.toggle('on', c === b); }); if (g._cambio) g._cambio(b.getAttribute('data-v')); };
    });
  }
  function valorChips(raiz, nombre) { var b = raiz.querySelector('[data-chips="' + nombre + '"] .chip.on'); return b ? b.getAttribute('data-v') : ''; }
  MK.chips = chips; MK.activarChips = activarChips; MK.valorChips = valorChips;
  var TIPOS_PASO = [['llamada', MK.ic('llamada', 14) + ' Llamar'], ['whatsapp', MK.ic('whatsapp', 14) + ' WhatsApp'], ['correo', MK.ic('correo', 14) + ' Correo'], ['visita', MK.ic('visita', 14) + ' Visita'], ['reunion', MK.ic('reunion', 14) + ' Reunión']];
  MK.TIPOS_PASO = TIPOS_PASO;

  /* ── captura rápida (Nueva oportunidad · opción C) ── */
  MK.captura = function (pre) {
    pre = pre || {};
    var aj = (MK.base && MK.base.ajustes) || {};
    var h = MK.hoja('<h2>Captura rápida</h2><p class="muted small">Lo mínimo para no perder a nadie. Entra al embudo como «Registrado» y queda en «Completar después».</p>' +
      '<label class="lb">TIPO DE SERVICIO</label>' + chips('tipo', [['RECURRENTE', 'Recurrente (contrato)'], ['VISITA UNICA', 'Visita única']], pre.tipoServicio || 'RECURRENTE') +
      '<label class="lb" for="cp-emp">EMPRESA</label><input class="in" id="cp-emp" autofocus value="' + MK.esc(pre.empresa || '') + '" placeholder="Nombre como lo conoce la gente">' +
      '<div id="cp-dup" class="small" style="margin-top:6px"></div>' +
      '<div class="grid g3" style="gap:10px"><div><label class="lb" for="cp-con">CONTACTO</label><input class="in" id="cp-con" placeholder="Nombre"></div>' +
      '<div><label class="lb" for="cp-car">CARGO</label><input class="in" id="cp-car" placeholder="Administradora"></div>' +
      '<div><label class="lb" for="cp-cel">CELULAR</label><input class="in" id="cp-cel" inputmode="tel" placeholder="6612-3344"></div></div>' +
      '<label class="lb" for="cp-cor">CORREO <span class="muted">(opcional)</span></label><input class="in" id="cp-cor" inputmode="email">' +
      '<label class="lb">¿DE DÓNDE VIENE?</label>' + chips('fuente', (aj.fuentes || []), pre.fuente || '') +
      '<label class="chk" style="margin-top:12px"><input type="checkbox" id="cp-ya"> El cliente ya aceptó: entra en «Contrato en proceso»</label>' +
      '<label class="lb">PRIMER PASO</label>' + chips('paso', TIPOS_PASO, 'llamada') +
      '<div class="grid g2" style="gap:10px;margin-top:8px"><input class="in" type="date" id="cp-fec" value="' + (MK.hoy || MK.hoyLocal()) + '"><input class="in" type="time" id="cp-hor"></div>' +
      '<label class="lb" for="cp-not">NOTA <span class="muted">(opcional)</span></label><input class="in" id="cp-not" placeholder="Lo que dijo, lo que necesita">' +
      '<div id="cp-msg" class="small" style="margin-top:8px;color:var(--bad)"></div>' +
      '<div class="pie"><button class="btn" onclick="MK.cerrarHoja()">Cancelar</button><button class="btn pri" id="cp-ok">Guardar</button></div>');
    activarChips(h);
    var emp = document.getElementById('cp-emp'), dup = document.getElementById('cp-dup'), tD = null, forzar = false;
    emp.oninput = function () {
      forzar = false; clearTimeout(tD); var q = emp.value.trim(); if (q.length < 3) { dup.innerHTML = ''; return; }
      tD = setTimeout(function () {
        MK.api('api_crmBuscar', MK.pin, q).then(function (x) {
          var l = ((x && x.resultados) || []).filter(function (z) { return z.tipo !== 'contacto'; }).slice(0, 3);
          dup.innerHTML = l.length ? '¿Es esta? ' + l.map(function (z) {
            return '<a href="#" onclick="' + (z.tipo === 'cliente' ? 'MK.irCliente' : 'MK.irOportunidad') + '(\'' + MK.esc(z.id) + '\');return false">' + MK.esc(z.nombre) + '</a> <span class="muted">(' + (z.tipo === 'cliente' ? 'cliente' : MK.esc(z.detalle)) + ')</span>';
          }).join(' · ') : '';
        }, function () {});
      }, 300);
    };
    if (pre.empresa) emp.oninput();
    document.getElementById('cp-ok').onclick = function () {
      var b = this, msg = document.getElementById('cp-msg');
      var d = { empresa: emp.value.trim(), contacto: document.getElementById('cp-con').value.trim(), cargo: document.getElementById('cp-car').value.trim(), celular: document.getElementById('cp-cel').value.trim(),
        correo: document.getElementById('cp-cor').value.trim(), fuente: valorChips(h, 'fuente'), tipoServicio: valorChips(h, 'tipo'),
        notas: document.getElementById('cp-not').value.trim(), yaAcepto: document.getElementById('cp-ya').checked ? 'SI' : '',
        primerPaso: { tipo: valorChips(h, 'paso'), fecha: document.getElementById('cp-fec').value, hora: document.getElementById('cp-hor').value },
        forzar: forzar };
      if (!d.empresa) { msg.textContent = 'Escribe el nombre de la empresa.'; emp.focus(); return; }
      MK.ocupado(b, true);
      MK.api('api_crmCaptura', MK.pin, d).then(function (r) {
        MK.ocupado(b, false);
        if (r && r.duplicado) { forzar = true; msg.innerHTML = MK.esc(r.error) + ' Si es otra empresa, toca Guardar otra vez.'; b.textContent = 'Es otra, guardar'; return; }
        if (!r || !r.ok) { msg.textContent = (r && r.error) || 'No se pudo guardar.'; return; }
        MK.cerrarHoja(); MK.cambio({ tipo: 'captura', codigo: r.codigoPropuesta });
        MK.hoja('<h2>Guardada ✓</h2><p class="muted" style="margin-top:6px">' + MK.esc(d.empresa) + ' quedó en el embudo' + (r.tarea ? ' con su primer paso para ' + MK.cuando(r.tarea.fecha) : '') + '.</p>' +
          '<div class="pie"><button class="btn" onclick="MK.cerrarHoja()">Seguir aquí</button><button class="btn" onclick="MK.cerrarHoja();MK.captura()">Otra captura</button><button class="btn pri" onclick="MK.irOportunidad(\'' + MK.esc(r.codigoPropuesta) + '\')">Abrir la ficha</button></div>');
      }, function (e) { MK.ocupado(b, false); msg.textContent = e.message; });
    };
  };

  /* ── registrar actividad / completar tarea ── */
  MK.actividad = function (o) {
    o = o || {};
    var titulo = o.tareaId ? 'Completar: ' + (o.titulo || 'tarea') : 'Registrar actividad';
    var h = MK.hoja('<h2>' + MK.esc(titulo) + '</h2>' + (o.cuenta ? '<p class="muted small">' + MK.esc(o.cuenta) + '</p>' : '') +
      '<label class="lb">¿QUÉ FUE?</label>' + chips('tipo', [['llamada', MK.ic('llamada', 14) + ' Llamada'], ['whatsapp', MK.ic('whatsapp', 14) + ' WhatsApp'], ['correo', MK.ic('correo', 14) + ' Correo'], ['visita', MK.ic('visita', 14) + ' Visita'], ['reunion', MK.ic('reunion', 14) + ' Reunión'], ['nota', MK.ic('nota', 14) + ' Nota']], o.tipo || 'llamada') +
      '<label class="lb" for="ac-txt">¿QUÉ PASÓ?</label><textarea class="in" id="ac-txt" autofocus placeholder="Lo que se habló, lo que pidió">' + MK.esc(o.texto || '') + '</textarea>' +
      '<label class="lb">RESULTADO</label>' + chips('res', [['Contactado', 'Contactado'], ['No contestó', 'No contestó'], ['Interesado', 'Interesado'], ['Pidió propuesta', 'Pidió propuesta'], ['No le interesa', 'No le interesa']], '') +
      '<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line2)"><label class="chk"><input type="checkbox" id="ac-sig" ' + (o.ref ? 'checked' : '') + '> Dejar el siguiente paso</label>' +
      '<div id="ac-sigbox"><div class="grid g2" style="gap:10px;margin-top:8px"><input class="in" id="ac-st" placeholder="Qué sigue (ej. llamar para confirmar)" value="' + MK.esc(o.siguienteTitulo || '') + '"><div class="row">' + '<select class="sel" id="ac-stt">' + TIPOS_PASO.map(function (t) { return '<option value="' + t[0] + '">' + MK.TIPOS[t[0]] + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="row w" style="margin-top:8px"><button type="button" class="chip" data-d="1">Mañana</button><button type="button" class="chip" data-d="3">En 3 días</button><button type="button" class="chip" data-d="7">En una semana</button>' +
      '<input class="in" type="date" id="ac-sf" style="width:auto" value="' + MK.masDias(MK.hoy || MK.hoyLocal(), 3) + '"><input class="in" type="time" id="ac-sh" style="width:auto"></div></div></div>' +
      '<div id="ac-msg" class="small" style="margin-top:8px;color:var(--bad)"></div>' +
      '<div class="pie"><button class="btn" onclick="MK.cerrarHoja()">Cancelar</button><button class="btn pri" id="ac-ok">' + (o.tareaId ? 'Completar' : 'Guardar') + '</button></div>');
    activarChips(h);
    var sig = document.getElementById('ac-sig'), box = document.getElementById('ac-sigbox');
    var ver = function () { box.style.display = sig.checked ? '' : 'none'; }; sig.onchange = ver; ver();
    [].forEach.call(box.querySelectorAll('[data-d]'), function (c) { c.onclick = function () { document.getElementById('ac-sf').value = MK.masDias(MK.hoy || MK.hoyLocal(), Number(c.getAttribute('data-d'))); }; });
    document.getElementById('ac-ok').onclick = function () {
      var b = this, msg = document.getElementById('ac-msg');
      var a = { tipo: valorChips(h, 'tipo'), texto: document.getElementById('ac-txt').value.trim(), resultado: valorChips(h, 'res'),
        ref: o.ref || '', refTipo: o.refTipo || 'op', cuenta: o.cuenta || '', contacto: o.contacto || '', tareaId: o.tareaId || '', plantilla: o.plantilla || '' };
      if (!a.texto && !a.resultado) { msg.textContent = 'Escribe qué pasó o elige un resultado.'; return; }
      if (!a.texto) a.texto = o.titulo || MK.TIPOS[a.tipo];
      if (sig.checked) {
        var st = document.getElementById('ac-st').value.trim();
        if (!st) { msg.textContent = 'Escribe cuál es el siguiente paso, o desmarca la casilla.'; return; }
        a.siguiente = { titulo: st, tipo: document.getElementById('ac-stt').value, fecha: document.getElementById('ac-sf').value, hora: document.getElementById('ac-sh').value };
      }
      if (o.etapa) a.etapa = o.etapa;
      MK.ocupado(b, true);
      MK.api('api_crmGuardarActividad', MK.pin, a).then(function (r) {
        MK.ocupado(b, false);
        if (!r || !r.ok) { msg.textContent = (r && r.error) || 'No se pudo guardar.'; return; }
        MK.cerrarHoja(); MK.aviso(o.tareaId ? 'Tarea completada' + (r.siguiente ? ' · siguiente para ' + MK.cuando(r.siguiente.fecha) : '') : 'Actividad guardada');
        MK.cambio({ tipo: 'actividad', ref: a.ref });
        if (o.alGuardar) o.alGuardar(r);
      }, function (e) { MK.ocupado(b, false); msg.textContent = e.message; });
    };
  };
  MK.completar = function (t) {
    MK.actividad({ tareaId: t.id, titulo: t.titulo, tipo: MK.TIPOS[t.tipo] && t.tipo !== 'tarea' ? t.tipo : 'llamada', ref: t.ref, refTipo: t.refTipo, cuenta: t.cuenta, texto: t.titulo, alGuardar: t.alGuardar });
  };

  /* ── tarea nueva o editar ── */
  MK.tarea = function (t) {
    t = t || {};
    var ases = (MK.base && MK.base.asesores) || [];
    var h = MK.hoja('<h2>' + (t.id ? 'Editar tarea' : 'Nueva tarea') + '</h2>' + (t.cuenta ? '<p class="muted small">' + MK.esc(t.cuenta) + '</p>' : '') +
      '<label class="lb" for="ta-t">QUÉ HAY QUE HACER</label><input class="in" id="ta-t" autofocus value="' + MK.esc(t.titulo || '') + '" placeholder="Llamar para confirmar la visita">' +
      '<label class="lb">TIPO</label>' + chips('tipo', TIPOS_PASO.concat([['tarea', MK.ic('tarea', 14) + ' Otra']]), t.tipo || 'llamada') +
      (t.id || t.ref ? '' : '<label class="lb" for="ta-c">CON QUIÉN <span class="muted">(oportunidad o cliente)</span></label><input class="in" id="ta-c" placeholder="Escribe para buscar"><div id="ta-cr" class="small"></div>') +
      '<div class="grid g3" style="gap:10px"><div><label class="lb">FECHA</label><input class="in" type="date" id="ta-f" value="' + MK.esc(t.fecha || MK.hoy || '') + '"></div>' +
      '<div><label class="lb">HORA</label><input class="in" type="time" id="ta-h" value="' + MK.esc(t.hora || '') + '"></div>' +
      '<div><label class="lb">DURACIÓN</label><select class="sel" id="ta-d">' + [15, 30, 45, 60, 90, 120].map(function (m) { return '<option value="' + m + '"' + ((t.duracion || 30) == m ? ' selected' : '') + '>' + (m < 60 ? m + ' min' : (m / 60) + ' h') + '</option>'; }).join('') + '</select></div></div>' +
      '<label class="lb" for="ta-l">LUGAR <span class="muted">(opcional)</span></label><input class="in" id="ta-l" value="' + MK.esc(t.lugar || '') + '">' +
      (ases.length > 1 ? '<label class="lb">RESPONSABLE</label><select class="sel" id="ta-a">' + ases.map(function (a) { return '<option' + ((t.asignado || MK.usuario.nombre) === a.nombre ? ' selected' : '') + '>' + MK.esc(a.nombre) + '</option>'; }).join('') + '</select>' : '') +
      '<label class="lb" for="ta-n">NOTAS</label><input class="in" id="ta-n" value="' + MK.esc(t.notas || '') + '">' +
      '<div id="ta-msg" class="small" style="margin-top:8px;color:var(--bad)"></div>' +
      '<div class="pie">' + (t.id ? '<button class="btn bad" id="ta-anu" style="margin-right:auto">Anular</button>' : '') + '<button class="btn" onclick="MK.cerrarHoja()">Cancelar</button><button class="btn pri" id="ta-ok">Guardar</button></div>');
    activarChips(h);
    var ref = { ref: t.ref || '', refTipo: t.refTipo || '', cuenta: t.cuenta || '' };
    var ci = document.getElementById('ta-c');
    if (ci) {
      var tt = null; ci.oninput = function () {
        clearTimeout(tt); var q = ci.value.trim(); ref = { ref: '', refTipo: '', cuenta: q }; if (q.length < 2) { document.getElementById('ta-cr').innerHTML = ''; return; }
        tt = setTimeout(function () {
          MK.api('api_crmBuscar', MK.pin, q).then(function (x) {
            var l = ((x && x.resultados) || []).filter(function (z) { return z.tipo !== 'contacto'; }).slice(0, 5);
            document.getElementById('ta-cr').innerHTML = l.map(function (z, i) { return '<a href="#" data-i="' + i + '" style="display:inline-block;margin:6px 8px 0 0">' + MK.esc(z.nombre) + ' <span class="muted">(' + (z.tipo === 'cliente' ? 'cliente' : 'oportunidad') + ')</span></a>'; }).join('');
            [].forEach.call(document.querySelectorAll('#ta-cr a'), function (a) { a.onclick = function (e) { e.preventDefault(); var z = l[+a.getAttribute('data-i')]; ref = { ref: z.id, refTipo: z.tipo === 'cliente' ? 'cli' : 'op', cuenta: z.nombre }; ci.value = z.nombre; document.getElementById('ta-cr').innerHTML = '<span class="tag t-ok">✓ ' + MK.esc(z.nombre) + '</span>'; }; });
          }, function () {});
        }, 250);
      };
    }
    if (t.id) document.getElementById('ta-anu').onclick = function () {
      MK.confirmar('La tarea «' + (t.titulo || '') + '» se anula y sale de la agenda.', function () {
        MK.llamar('api_crmAnularTarea', MK.pin, t.id).then(function () { MK.aviso('Tarea anulada'); MK.cambio({ tipo: 'tarea' }); });
      }, { boton: 'Anular', peligro: true });
    };
    document.getElementById('ta-ok').onclick = function () {
      var b = this, msg = document.getElementById('ta-msg');
      var d = { id: t.id || '', titulo: document.getElementById('ta-t').value.trim(), tipo: valorChips(h, 'tipo'), fecha: document.getElementById('ta-f').value,
        hora: document.getElementById('ta-h').value, duracion: Number(document.getElementById('ta-d').value), lugar: document.getElementById('ta-l').value.trim(),
        notas: document.getElementById('ta-n').value.trim(), ref: ref.ref, refTipo: ref.refTipo, cuenta: ref.cuenta };
      var as = document.getElementById('ta-a'); if (as) d.asignado = as.value;
      if (!d.titulo) { msg.textContent = 'Escribe qué hay que hacer.'; return; }
      MK.ocupado(b, true);
      MK.api('api_crmGuardarTarea', MK.pin, d).then(function (r) {
        MK.ocupado(b, false);
        if (!r || !r.ok) { msg.textContent = (r && r.error) || 'No se pudo guardar.'; return; }
        MK.cerrarHoja(); MK.aviso('Tarea guardada'); MK.cambio({ tipo: 'tarea' }); if (t.alGuardar) t.alGuardar(r);
      }, function (e) { MK.ocupado(b, false); msg.textContent = e.message; });
    };
  };

  /* ── mensaje con plantilla (WhatsApp o correo) ── */
  var PLANTILLAS = null;
  function plantillas() {
    if (PLANTILLAS) return Promise.resolve(PLANTILLAS);
    return MK.api('api_crmAjustes', MK.pin).then(function (r) { PLANTILLAS = (r && r.ok && r.plantillas) || []; MK._firma = r && r.ajustes && r.ajustes.firma; return PLANTILLAS; });
  }
  MK.rellenar = function (texto, v) {
    v = v || {};
    var h = new Date().getHours();
    var tono = (MK.base && MK.base.ajustes && MK.base.ajustes.tono) || 'formal';
    var base = { saludo: tono === 'cercano' ? 'Hola' : (h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'), hora: MK.ahoraHM(), asesor: (MK.usuario && MK.usuario.nombre) || '', firma: MK._firma || ((MK.base && MK.base.ajustes && MK.base.ajustes.firma) || ''), fecha: MK.fechaLarga(MK.hoy) };
    return String(texto || '').replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null && v[k] !== '' ? v[k] : (base[k] != null ? base[k] : m); });
  };
  MK.mensaje = function (o) {
    o = o || {};
    plantillas().then(function (lista) {
      var canal = o.canal || (o.telefono ? 'whatsapp' : 'correo');
      var vars = Object.assign({ empresa: o.cuenta || '', contacto: o.contacto || '' }, o.vars || {});
      var util = lista.filter(function (p) { return p.activa !== false; });
      var pref = util.filter(function (p) { return o.momento && p.momento === o.momento; })[0] || null;
      var h = MK.hoja('<h2>' + (canal === 'whatsapp' ? 'Mensaje por WhatsApp' : 'Correo') + '</h2><p class="muted small">' + MK.esc(o.cuenta || '') + '</p>' +
        '<label class="lb">CANAL</label>' + chips('canal', [['whatsapp', MK.ic('whatsapp', 14) + ' WhatsApp'], ['correo', MK.ic('correo', 14) + ' Correo']], canal) +
        '<label class="lb" for="ms-p">PLANTILLA</label><select class="sel" id="ms-p"><option value="">— Escribir desde cero —</option>' + util.map(function (p) { return '<option value="' + MK.esc(p.id) + '"' + (pref && pref.id === p.id ? ' selected' : '') + '>' + MK.esc(p.nombre) + (p.momento ? ' · ' + MK.esc(p.momento) : '') + '</option>'; }).join('') + '</select>' +
        '<label class="lb" for="ms-d">PARA</label><input class="in" id="ms-d" value="' + MK.esc(canal === 'whatsapp' ? (o.telefono || '') : (o.correo || '')) + '">' +
        '<div id="ms-asb"><label class="lb" for="ms-as">ASUNTO</label><input class="in" id="ms-as"></div>' +
        '<label class="lb" for="ms-t">MENSAJE</label><textarea class="in" id="ms-t" rows="8"></textarea>' +
        '<p class="small muted" style="margin-top:6px">Se abre ' + (canal === 'whatsapp' ? 'WhatsApp' : 'tu correo') + ' con el mensaje listo; tú lo revisas y lo envías. Queda anotado en la actividad.</p>' +
        '<div class="pie"><button class="btn" onclick="MK.cerrarHoja()">Cancelar</button><button class="btn pri" id="ms-ok">Abrir y anotar</button></div>');
      activarChips(h);
      var sel = document.getElementById('ms-p'), txt = document.getElementById('ms-t'), as = document.getElementById('ms-as'), dest = document.getElementById('ms-d');
      var poner = function () { var p = util.filter(function (z) { return z.id === sel.value; })[0]; if (p) { txt.value = MK.rellenar(p.texto, vars); as.value = MK.rellenar(p.asunto || '', vars); } };
      sel.onchange = poner; if (pref) poner(); else if (o.texto) txt.value = o.texto;
      var gC = h.querySelector('[data-chips="canal"]');
      var verCanal = function (c) { canal = c; document.getElementById('ms-asb').style.display = c === 'correo' ? '' : 'none'; dest.value = c === 'whatsapp' ? (o.telefono || '') : (o.correo || ''); };
      gC._cambio = verCanal; verCanal(canal);
      document.getElementById('ms-ok').onclick = function () {
        var d = dest.value.trim(), t = txt.value.trim();
        if (!t) { MK.aviso('Escribe el mensaje.'); return; }
        if (canal === 'whatsapp') {
          var n = MK.telWa(d); if (!n) { MK.aviso('Escribe un número de WhatsApp.'); return; }
          window.open('https://wa.me/' + n + '?text=' + encodeURIComponent(t), '_blank');
        } else {
          if (!/@/.test(d)) { MK.aviso('Escribe un correo válido.'); return; }
          location.href = 'mailto:' + encodeURIComponent(d) + '?subject=' + encodeURIComponent(as.value) + '&body=' + encodeURIComponent(t);
        }
        if (sel.value) MK.api('api_crmUsarPlantilla', MK.pin, sel.value).catch(function () {});
        if (o.ref) MK.api('api_crmGuardarActividad', MK.pin, { tipo: canal, ref: o.ref, refTipo: o.refTipo || 'op', cuenta: o.cuenta || '', contacto: o.contacto || '',
          texto: (canal === 'correo' && as.value ? as.value + ' — ' : '') + t.slice(0, 400), resultado: 'Enviado', plantilla: sel.value }).then(function () { MK.cambio({ tipo: 'actividad', ref: o.ref }); }, function () {});
        MK.cerrarHoja(); MK.aviso('Mensaje listo · quedó anotado');
        if (typeof o.alEnviar === 'function') { try { o.alEnviar(canal, d); } catch (e) { console.error(e); } }
      };
    });
  };

  /* ── arranque ── */
  MK.iniciar = function (pagina, alListo) {
    MK._pag = pagina;
    document.body.classList.add('mk');
    try { var v = localStorage.getItem(K_PIN); if (v) MK.pin = JSON.parse(v); } catch (e) { MK.pin = ''; }
    if (!MK.pin) { location.href = 'index.html'; return; }
    pintarBarra(pagina);
    var main = document.getElementById('main');
    MK.api('api_crmBase', MK.pin).then(function (b) {
      if (!b || !b.ok) { if (main) main.innerHTML = '<div class="aviso rj">' + MK.esc((b && b.error) || 'No se pudo abrir mercadeo.') + ' <a href="index.html">Volver a los módulos</a></div>'; return; }
      MK.base = b; MK.usuario = b.usuario; MK.hoy = b.hoy;
      pintarBarra(pagina);
      try { alListo(b); } catch (e) { console.error(e); if (main) main.innerHTML = '<div class="aviso rj">Error al pintar la pantalla: ' + MK.esc(e.message) + '</div>'; }
    }, function (e) { if (main) MK.error(main, 'Sin conexión: ' + e.message); });
    document.addEventListener('keydown', function (e) {
      var t = e.target, escribe = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (e.key === 'Escape') { MK.cerrarHoja(); MK.cerrarLado(); var m = document.getElementById('mk-menu'); if (m) m.classList.remove('si'); }
      if (!escribe && !e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'n' || e.key === 'N') && MK.usuario && MK.usuario.rol !== 'gerente' && !(document.getElementById('hoja') || {}).classList?.contains('si')) { e.preventDefault(); MK.captura(); }
      if (!escribe && e.key === '/') { e.preventDefault(); var q = document.getElementById('mk-q'); if (q) q.focus(); }
    });
  };
})();
