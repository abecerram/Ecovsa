/* ═══════════════════════════════════════════════════════════════════
   ECOVSA · kit común de los módulos con el estilo nuevo (api 3.4)
   Configuración, Cobros, Planta y Dirección. Es el mismo lenguaje de
   Mercadeo (mercadeo-kit): barra azul con el emblema, menú a la izquierda
   (en el celular, pestañas que se deslizan), hojas y paneles laterales.
   ───────────────────────────────────────────────────────────────────
   Cada módulo es UNA página; las secciones se cambian con #seccion:
     <head>
       <script>window.PUENTE_CONFIG={sinCopia:/./,indicador:'oculto',enSupabase:/^api_(?!optimizarRuta$)/};</script>
       <script src="puente.js"></script>
       <link rel="stylesheet" href="modulo-kit.css">
       <script src="modulo-kit.js"></script>
     </head>
     <body>
       <div id="sysbar"></div>
       <div class="mtabs" id="mtabs"></div>
       <div class="shell"><nav class="mnav" id="mnav"></nav><main class="main" id="main"></main></div>
       <script>MK.iniciar({ modulo:'Cobros', base:'api_cobBase', paginas:[…], pintar:function(id){…} });</script>

   MK.iniciar(op):
     op.modulo     nombre en la barra
     op.base       función del servidor que se llama con el PIN al abrir
                   (devuelve {ok, usuario, hoy, …}); queda en MK.base
     op.paginas    [{g:'GRUPO'} | {id, n, i (ícono), oculto, ir:'url'}]
     op.inicio     sección por defecto
     op.accion     {t:'Registrar pago', i:'mas', fn:function(){…}, quien:fn(usuario)→bool}
     op.buscar     {ph:'Buscar…', fn:function(q){ return [{t, d, i, ir:function(){…}}] }}
     op.pintar     function(id) pinta la sección en #main
     op.pin        function() → PIN a usar (Configuración usa el que se
                   escribe al entrar, no el guardado)
   MK.contador(id, n, tono) pone el numerito del menú (tono '', 'g', 'am').
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  var K_PIN = 'ecovsa_pin';
  var MK = window.MK = { pin: '', base: null, usuario: null, hoy: '', seccion: '', op: {} };
  if (!window.TemaECOVSA && !document.getElementById('tema-js')) {
    var tj = document.createElement('script'); tj.id = 'tema-js'; tj.src = 'tema.js'; (document.head || document.documentElement).appendChild(tj);
  }

  var ICONOS = {
    casa: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    hoy: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    persona: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    personas: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5"/><circle cx="17" cy="7" r="2.8"/><path d="M16 12.8c2.7.2 4.6 2 5.5 5"/>',
    alta: '<circle cx="10" cy="8" r="4"/><path d="M3 21c1.4-4 4-6 7-6s3.6.8 4.6 1.8M18 14v6M15 17h6"/>',
    baja: '<circle cx="10" cy="8" r="4"/><path d="M3 21c1.4-4 4-6 7-6s3.6.8 4.6 1.8M15 17h6"/>',
    llave: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M14 9l2 2"/>',
    candado: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    escudo: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    tabla: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/>',
    reglas: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    historial: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
    puerta: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>',
    calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    agenda: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h3M8 18h6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    plan: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    escalera: '<path d="M3 20h5v-5h5v-5h5V5h3"/>',
    suma: '<path d="M18 4H6l6 8-6 8h12"/>',
    telefono: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    whatsapp: '<path d="M4 20l1.3-3.8A8 8 0 1 1 8 19z"/><path d="M9 9.5c.5 2 2.3 4 4.5 4.8l1.2-1.2 2 1-.5 1.5c-3.5.3-7.7-3.6-7.6-7.2l1.4-.6 1 2z"/>',
    correo: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    documento: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
    factura: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    billete: '<rect x="2.5" y="6" width="19" height="12" rx="2.2"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9.5v5M18 9.5v5"/>',
    moneda: '<circle cx="12" cy="12" r="9"/><path d="M14.8 9.2a3 3 0 0 0-2.8-1.7c-1.6 0-2.7.9-2.7 2.1 0 2.9 5.6 1.6 5.6 4.5 0 1.3-1.2 2.2-2.9 2.2a3.1 3.1 0 0 1-2.9-1.8"/><path d="M12 6v12"/>',
    subir: '<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>',
    bajar: '<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>',
    enlace: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    archivo: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4"/>',
    grafico: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    tendencia: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    ajustes: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    buscar: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    atras: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    alerta: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
    lapiz: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    basura: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    ojo: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    pausa: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    camion: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    ruta: '<path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
    maletin: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    planta: '<path d="M3 21h18M5 21V10l5 3V10l5 3V6l4 2v13"/>',
    fuego: '<path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8 0 4 3 7 7 7z"/>',
    termometro: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/><path d="M12 9v7"/>',
    balanza: '<path d="M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0zM8 21h8"/>',
    llaveInglesa: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-2-2 7-7-1.3-1.3a4 4 0 0 1-5-5L9 3 3 9l2 2 4-4z"/>',
    caja: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M3 13h18"/>',
    matraz: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 18l-5-9V3"/><path d="M7 15h10"/>',
    libro: '<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
    imprimir: '<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2"/><rect x="6" y="14" width="12" height="7"/>',
    brujula: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    carrito: '<circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2l2.4 11h11l2-8H6.5"/>',
    sello: '<circle cx="12" cy="9" r="5.5"/><path d="M9 13.8 7.5 21l4.5-2.4 4.5 2.4-1.5-7.2"/><path d="M10 9l1.5 1.5L14 7.5"/>',
    nota: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    filtro: '<path d="M4 5h16M7 12h10M10 19h4"/>',
    renovar: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8"/><path d="M4 3v5h5M4 13a8 8 0 0 0 14.5 4.5L20 16"/><path d="M20 21v-5h-5"/>',
    circulo: '<circle cx="12" cy="12" r="8"/>'
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
  MK.ROLES = { admin: 'Administrador', gerente: 'Gerente', supervisor: 'Supervisor', mercadeo: 'Mercadeo', planta: 'Planta', cobros: 'Cobros', operador: 'Conductor' };
  MK.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  MK.n = function (v) { var x = Number(String(v == null ? 0 : v).replace(/,/g, '')); return isFinite(x) ? x : 0; };
  MK.num = function (v, d) { return MK.n(v).toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  MK.dinero = function (v, corto) {
    var x = MK.n(v);
    if (corto && Math.abs(x) >= 10000) return 'B/. ' + (Math.round(x / 100) / 10).toLocaleString('en-US') + 'k';
    return 'B/. ' + x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  MK.pct = function (v, d) { return MK.num(v, d == null ? 0 : d) + ' %'; };
  function d12(iso) { return new Date(String(iso).slice(0, 10) + 'T12:00:00'); }
  MK.fecha = function (iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || '';
    var d = d12(iso); var s = DIAS[d.getDay()] + ' ' + d.getDate() + ' ' + MESES[d.getMonth()];
    if (MK.hoy && String(iso).slice(0, 4) !== MK.hoy.slice(0, 4)) s += ' ' + String(iso).slice(0, 4);
    return s;
  };
  MK.fechaCorta = function (iso) { if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || ''; var d = d12(iso); return d.getDate() + ' ' + MESES[d.getMonth()] + (MK.hoy && String(iso).slice(0, 4) !== MK.hoy.slice(0, 4) ? ' ' + String(iso).slice(2, 4) : ''); };
  MK.dmy = function (iso) { if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || ''; return iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4); };
  MK.fechaLarga = function (iso) { if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || ''; var d = d12(iso); return DIAS_L[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES_L[d.getMonth()] + ' de ' + d.getFullYear(); };
  MK.mesNombre = function (ym) { if (!/^\d{4}-\d{2}/.test(ym || '')) return ym || ''; return MESES_L[Number(ym.slice(5, 7)) - 1] + ' ' + ym.slice(0, 4); };
  MK.mesCorto = function (ym) { if (!/^\d{4}-\d{2}/.test(ym || '')) return ym || ''; return MESES[Number(ym.slice(5, 7)) - 1] + (MK.hoy && ym.slice(0, 4) !== MK.hoy.slice(0, 4) ? ' ' + ym.slice(2, 4) : ''); };
  MK.dias = function (a, b) { return Math.round((d12(b) - d12(a)) / 86400000); };
  MK.masDias = function (iso, n) { var d = d12(iso); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  MK.masMeses = function (iso, n) { var d = d12(iso), dia = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); var ult = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(dia, ult)); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  MK.cuando = function (iso) {
    if (!iso || !MK.hoy) return MK.fecha(iso);
    var n = MK.dias(MK.hoy, String(iso).slice(0, 10));
    if (n === 0) return 'hoy'; if (n === 1) return 'mañana'; if (n === -1) return 'ayer';
    if (n < 0 && n > -8) return 'hace ' + (-n) + ' días'; if (n > 0 && n < 8) return 'en ' + n + ' días';
    return MK.fecha(iso);
  };
  MK.ini = function (n) { var p = String(n || '').replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ ]/g, ' ').trim().split(/\s+/); return ((p[0] || '?')[0] + (p[1] ? p[1][0] : '')).toUpperCase(); };
  MK.telWa = function (t) { var n = String(t || '').replace(/\D/g, ''); if (!n) return ''; if (n.length === 7 || n.length === 8) n = '507' + n; return n; };
  MK.param = function (k) { try { return new URLSearchParams(location.search).get(k) || ''; } catch (e) { return ''; } };

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
  /* Con el PIN de la sesión como primer argumento */
  MK.p = function (fn) { var a = [fn, MK.pinUso()].concat(Array.prototype.slice.call(arguments, 1)); return MK.api.apply(null, a); };
  MK.pinUso = function () { return (MK.op.pin && MK.op.pin()) || MK.pin; };
  /* Llamada que avisa sola si falla; resuelve solo si ok */
  MK.llamar = function (fn) {
    var a = [fn, MK.pinUso()].concat(Array.prototype.slice.call(arguments, 1));
    return MK.api.apply(null, a).then(function (r) {
      if (!r || r.ok === false) { MK.aviso((r && r.error) || 'No se pudo completar.'); throw new Error((r && r.error) || 'Error'); }
      return r;
    }, function (e) { MK.aviso(e.message || 'Sin conexión'); throw e; });
  };

  /* ── piezas ── */
  MK.aviso = function (t, ms) {
    var e = document.getElementById('toast'); if (!e) { e = document.createElement('div'); e.id = 'toast'; e.className = 'toast'; document.body.appendChild(e); }
    e.textContent = t; e.classList.add('si'); clearTimeout(MK.aviso._t); MK.aviso._t = setTimeout(function () { e.classList.remove('si'); }, ms || 3200);
  };
  MK.hoja = function (html, op) {
    var h = document.getElementById('hoja'); if (!h) { h = document.createElement('div'); h.id = 'hoja'; h.className = 'hoja'; h.onclick = function (e) { if (e.target === h && !(MK._hojaOp && MK._hojaOp.fija)) MK.cerrarHoja(); }; document.body.appendChild(h); }
    MK._hojaOp = op || {};
    h.innerHTML = '<div class="cuerpo' + (op && op.ancha ? ' ancha' : '') + '" role="dialog" aria-modal="true">' + html + '</div>'; h.classList.add('si');
    var f = h.querySelector('[autofocus]'); if (f) setTimeout(function () { f.focus(); }, 60);
    return h.firstChild;
  };
  MK.cerrarHoja = function () { var h = document.getElementById('hoja'); if (h) h.classList.remove('si'); };
  /* El cajón: panel que entra por la derecha, a pantalla completa en el celular */
  MK.lado = function (html, op) {
    var l = document.getElementById('mk-lado');
    if (!l) { l = document.createElement('aside'); l.id = 'mk-lado'; l.className = 'lado'; document.body.appendChild(l); }
    var v = document.getElementById('mk-velo');
    if (!v) { v = document.createElement('div'); v.id = 'mk-velo'; v.className = 'mk-velo'; v.onclick = MK.cerrarLado; document.body.appendChild(v); }
    l.className = 'lado' + (op && op.ancho ? ' ancho' : '');
    l.innerHTML = '<button class="btn gh sm cerrar" onclick="MK.cerrarLado()" aria-label="Cerrar">' + MK.ic('x', 16) + '</button>' + html;
    l.classList.add('si'); v.classList.add('si'); l.scrollTop = 0;
    var f = l.querySelector('[autofocus]'); if (f) setTimeout(function () { f.focus(); }, 80);
    return l;
  };
  MK.cerrarLado = function () { var l = document.getElementById('mk-lado'); if (l) l.classList.remove('si'); var v = document.getElementById('mk-velo'); if (v) v.classList.remove('si'); };
  MK.confirmar = function (texto, alAceptar, op) {
    op = op || {};
    MK.hoja('<h2>' + MK.esc(op.titulo || '¿Seguro?') + '</h2><p class="muted" style="margin-top:6px;white-space:pre-wrap">' + MK.esc(texto) + '</p>' +
      '<div class="pie"><button class="btn" onclick="MK.cerrarHoja()">Cancelar</button><button class="btn ' + (op.peligro ? 'bad' : 'pri') + '" id="mk-si">' + MK.esc(op.boton || 'Sí, continuar') + '</button></div>');
    document.getElementById('mk-si').onclick = function () { MK.cerrarHoja(); alAceptar(); };
  };
  MK.cargando = function (el, t) { if (typeof el === 'string') el = document.getElementById(el); if (el) el.innerHTML = '<div class="cargando">' + MK.esc(t || 'Cargando…') + '</div>'; };
  MK.vacio = function (t) { return '<div class="vacio">' + MK.esc(t) + '</div>'; };
  MK.error = function (el, t) { if (typeof el === 'string') el = document.getElementById(el); if (el) el.innerHTML = '<div class="aviso rj">' + MK.esc(t || 'No se pudo cargar.') + ' <a href="#" onclick="location.reload();return false">Reintentar</a></div>'; };
  MK.ocupado = function (btn, si, texto) {
    if (!btn) return; if (si) { btn._t = btn.innerHTML; btn.disabled = true; btn.innerHTML = MK.esc(texto || 'Guardando…'); } else { btn.disabled = false; if (btn._t) btn.innerHTML = btn._t; }
  };
  MK.val = function (id) { var e = document.getElementById(id); return e ? String(e.value == null ? '' : e.value).trim() : ''; };
  MK.copiar = function (texto, btn) {
    var hecho = function () { MK.aviso('Copiado'); };
    try { navigator.clipboard.writeText(texto).then(hecho, function () { MK.aviso('Selecciónalo y cópialo'); }); } catch (e) { MK.aviso('Selecciónalo y cópialo'); }
  };

  /* ── piezas de pantalla ── */
  /* Cabecera de sección: título, subtítulo y botones a la derecha */
  MK.cabeza = function (titulo, sub, derecha) {
    return '<div class="ph"><div><h1>' + MK.esc(titulo) + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div><div class="sp"></div>' + (derecha || '') + '</div>';
  };
  /* Números grandes: [{e:'etiqueta', v:'valor', s:'sub', c:'bad'|'ok'|'warn'}] */
  MK.kpis = function (l, cols) {
    return '<div class="kpis" style="grid-template-columns:repeat(' + (cols || l.length) + ',minmax(0,1fr))">' + l.map(function (k) {
      return '<div class="kpi' + (k.c ? ' k-' + k.c : '') + '"' + (k.ir ? ' onclick="' + k.ir + '" style="cursor:pointer"' : '') + '><span>' + MK.esc(k.e) + '</span><b class="num">' + k.v + '</b>' + (k.s ? '<small>' + k.s + '</small>' : '') + '</div>';
    }).join('') + '</div>';
  };
  /* Tabla: cab = ['Col', …] (prefijo '>' alinea a la derecha), filas = [[…]] */
  MK.tabla = function (cab, filas, op) {
    op = op || {};
    var der = cab.map(function (c) { return c.charAt(0) === '>'; });
    return '<div class="tbw"><table class="tb' + (op.cls ? ' ' + op.cls : '') + '"><thead><tr>' + cab.map(function (c, i) { return '<th' + (der[i] ? ' class="r"' : '') + '>' + MK.esc(der[i] ? c.slice(1) : c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      (filas.length ? filas.map(function (f, j) { return '<tr' + (op.clic ? ' onclick="' + op.clic(j) + '" style="cursor:pointer"' : '') + '>' + f.map(function (x, i) { return '<td' + (der[i] ? ' class="r num"' : '') + '>' + (x == null ? '' : x) + '</td>'; }).join('') + '</tr>'; }).join('')
        : '<tr><td colspan="' + cab.length + '" class="vacio">' + MK.esc(op.vacio || 'Nada por aquí.') + '</td></tr>') +
      (op.pie ? '<tr class="tot">' + op.pie.map(function (x, i) { return '<td' + (der[i] ? ' class="r num"' : '') + '>' + (x == null ? '' : x) + '</td>'; }).join('') + '</tr>' : '') +
      '</tbody></table></div>';
  };
  /* Barras verticales simples: datos [{e, v, c?}], alto en px */
  MK.barras = function (datos, op) {
    op = op || {};
    var max = Math.max.apply(null, datos.map(function (d) { return Math.abs(d.v) || 0; }).concat([1]));
    return '<div class="mbar" style="height:' + (op.alto || 150) + 'px">' + datos.map(function (d) {
      var h = Math.max(1, Math.round((Math.abs(d.v) || 0) / max * 100));
      return '<div class="c" title="' + MK.esc(d.e + ': ' + (op.fmt ? op.fmt(d.v) : d.v)) + '"><em>' + (op.fmt ? op.fmt(d.v) : MK.num(d.v)) + '</em><i style="height:' + h + '%;background:' + (d.c || op.color || 'var(--navy2)') + '"></i><span>' + MK.esc(d.e) + '</span></div>';
    }).join('') + '</div>';
  };
  /* Barras horizontales: [{e, v, c?, d?}] */
  MK.hbar = function (datos, op) {
    op = op || {};
    var max = Math.max.apply(null, datos.map(function (d) { return d.v || 0; }).concat([1]));
    return '<div class="hbar">' + datos.map(function (d) {
      return '<div class="f"' + (d.ir ? ' onclick="' + d.ir + '" style="cursor:pointer"' : '') + '><span class="e">' + MK.esc(d.e) + (d.d ? '<small>' + MK.esc(d.d) + '</small>' : '') + '</span><span class="b"><i style="width:' + Math.max(1, (d.v || 0) / max * 100) + '%;background:' + (d.c || op.color || 'var(--navy2)') + '"></i></span><b class="num">' + (op.fmt ? op.fmt(d.v) : MK.num(d.v)) + '</b></div>';
    }).join('') + '</div>';
  };
  MK.tag = function (t, tono) { return '<span class="tag t-' + (tono || 'gris') + '">' + MK.esc(t) + '</span>'; };
  MK.chips = function (lista, activo, fn) {
    return '<div class="chips">' + lista.map(function (c) { return '<button class="chip' + (c[0] === activo ? ' on' : '') + '" onclick="' + fn + '(\'' + c[0] + '\')">' + MK.esc(c[1]) + (c[2] != null ? ' <span class="n">' + c[2] + '</span>' : '') + '</button>'; }).join('') + '</div>';
  };
  /* Solo mira (permiso «Ve»): esconde lo que escribe */
  MK.soloVer = false;
  MK.si = function (html) { return MK.soloVer ? '' : html; };

  /* ── barra, menú y pestañas ── */
  MK.contadores = {};
  MK.contador = function (id, n, tono) { MK.contadores[id] = n ? { n: n, t: tono || '' } : null; pintarMenu(); };
  function menuHtml() {
    return (MK.op.paginas || []).map(function (p) {
      if (p.g) return (p.quien && !p.quien(MK.usuario || {})) ? '' : '<div class="grp">' + MK.esc(p.g) + '</div>';
      if (p.oculto && p.id !== MK.seccion) return '';
      if (p.quien && !p.quien(MK.usuario || {})) return '';
      var c = MK.contadores[p.id];
      var href = p.ir ? ' href="' + p.ir + '"' : ' href="#' + p.id + '" onclick="MK.ir(\'' + p.id + '\');return false"';
      return '<a' + href + ' class="' + (p.id === MK.seccion ? 'on' : '') + '">' + MK.ic(p.i, 17) + MK.esc(p.n) +
        (c ? '<span class="n' + (c.t ? ' ' + c.t : '') + '">' + c.n + '</span>' : '') + '</a>';
    }).join('');
  }
  function tabsHtml() {
    return (MK.op.paginas || []).filter(function (p) { return !p.g && !(p.oculto && p.id !== MK.seccion) && !(p.quien && !p.quien(MK.usuario || {})); }).map(function (p) {
      var c = MK.contadores[p.id];
      var href = p.ir ? ' href="' + p.ir + '"' : ' href="#' + p.id + '" onclick="MK.ir(\'' + p.id + '\');return false"';
      return '<a' + href + ' class="' + (p.id === MK.seccion ? 'on' : '') + '">' + MK.esc(p.n) + (c ? ' <span class="n' + (c.t ? ' ' + c.t : '') + '">' + c.n + '</span>' : '') + '</a>';
    }).join('');
  }
  function pintarMenu() {
    var nv = document.getElementById('mnav'); if (nv) nv.innerHTML = menuHtml() + (MK.op.pieMenu ? '<div class="pie">' + MK.op.pieMenu + '</div>' : '');
    var tb = document.getElementById('mtabs');
    if (tb) { tb.innerHTML = tabsHtml(); var on = tb.querySelector('a.on'); if (on && on.scrollIntoView) { try { tb.scrollLeft = on.offsetLeft - 16; } catch (e) {} } }
  }
  MK.pintarMenu = pintarMenu;
  MK.pintarBarra = function () { pintarBarra(); };
  function pintarBarra() {
    var sb = document.getElementById('sysbar'); if (!sb) return;
    var u = MK.usuario || { nombre: '' }, op = MK.op;
    var acc = op.accion && !MK.soloVer && (!op.accion.quien || op.accion.quien(u));
    sb.className = 'sysbar';
    sb.innerHTML = '<div class="lg"></div><div class="mk"><b>ECOVSA</b><span>Sistema de operaciones</span></div><div class="sep"></div><span class="mod">' + MK.esc(op.modulo || '') + '</span>' +
      '<div class="sp"></div>' +
      (op.buscar ? '<div class="srch">' + MK.ic('buscar', 15) + '<input id="mk-q" placeholder="' + MK.esc(op.buscar.ph || 'Buscar…') + '" autocomplete="off"><div class="res" id="mk-res" hidden></div></div>' : '') +
      (acc ? '<button class="cap" id="mk-accion">' + MK.ic(op.accion.i || 'mas', 15) + '<span class="tx">' + MK.esc(op.accion.t) + '</span></button>' : '') +
      (u.nombre ? '<div class="us" role="button" tabindex="0" title="Tu usuario" id="mk-us"><span class="nm">' + MK.esc(u.nombre) + '</span><div class="av">' + MK.esc(MK.ini(u.nombre)) + '</div></div>' : '') +
      '<button class="bt" onclick="location.href=\'index.html\'">Módulos</button>';
    var b = document.getElementById('mk-accion'); if (b) b.onclick = function () { op.accion.fn(); };
    var us = document.getElementById('mk-us'); if (us) us.onclick = function () { if (window.TemaECOVSA && TemaECOVSA.menuUsuario) TemaECOVSA.menuUsuario(us, MK.usuario); };
    var q = document.getElementById('mk-q');
    if (q) {
      q.oninput = buscar; q.onkeydown = teclas;
      q.onfocus = function () { if (q.value.trim().length >= 2) buscar(); };
    }
  }
  document.addEventListener('click', function (e) { if (!e.target.closest || !e.target.closest('.srch')) { var r = document.getElementById('mk-res'); if (r) r.hidden = true; } });

  var tB = null, res = [], sel = -1;
  function buscar() {
    var q = document.getElementById('mk-q').value.trim(), r = document.getElementById('mk-res');
    clearTimeout(tB);
    if (q.length < 2) { r.hidden = true; return; }
    tB = setTimeout(function () {
      r.hidden = false;
      Promise.resolve(MK.op.buscar.fn(q)).then(function (l) {
        res = l || []; sel = -1;
        if (!res.length) { r.innerHTML = '<div class="vac">Nada con «' + MK.esc(q) + '».</div>'; return; }
        r.innerHTML = res.slice(0, 30).map(function (z, i) {
          return '<a href="#" onclick="MK._abrirRes(' + i + ');return false">' + MK.ic(z.i || 'documento', 16) + '<span><b>' + MK.esc(z.t) + '</b>' + (z.d ? '<small>' + MK.esc(z.d) + '</small>' : '') + '</span></a>';
        }).join('');
      }, function () { r.innerHTML = '<div class="vac">No se pudo buscar.</div>'; });
    }, 200);
  }
  function teclas(e) {
    var r = document.getElementById('mk-res'); if (r.hidden || !res.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + res.length) % res.length;
      [].forEach.call(r.querySelectorAll('a'), function (a, i) { a.classList.toggle('on', i === sel); }); }
    else if (e.key === 'Enter') { e.preventDefault(); MK._abrirRes(sel < 0 ? 0 : sel); }
    else if (e.key === 'Escape') { r.hidden = true; }
  }
  MK._abrirRes = function (i) {
    var z = res[i]; if (!z) return;
    var r = document.getElementById('mk-res'); if (r) r.hidden = true;
    var q = document.getElementById('mk-q'); if (q) q.blur();
    if (typeof z.ir === 'function') z.ir();
  };

  /* ── navegación entre secciones ── */
  MK.ir = function (id, sinHistorial) {
    var p = (MK.op.paginas || []).filter(function (x) { return x.id === id; })[0];
    if (!p) id = MK.op.inicio;
    MK.seccion = id;
    if (!sinHistorial && location.hash !== '#' + id) { try { history.pushState(null, '', '#' + id); } catch (e) { location.hash = id; } }
    MK.cerrarLado(); MK.cerrarHoja();
    pintarMenu();
    var main = document.getElementById('main');
    try { MK.op.pintar(id); } catch (e) { console.error(e); if (main) main.innerHTML = '<div class="aviso rj">Error al pintar: ' + MK.esc(e.message) + '</div>'; }
    window.scrollTo(0, 0);
  };
  MK.repintar = function () { try { MK.op.pintar(MK.seccion); } catch (e) { console.error(e); } };
  window.addEventListener('popstate', function () { var h = (location.hash || '').slice(1); if (h && h !== MK.seccion) MK.ir(h, true); });

  /* ── arranque ── */
  MK.iniciar = function (op) {
    MK.op = op || {};
    document.body.classList.add('mk');
    try { var v = localStorage.getItem(K_PIN); if (v) MK.pin = JSON.parse(v); } catch (e) { MK.pin = ''; }
    if (!MK.pin && !op.sinPinGuardado) { location.href = 'index.html'; return; }
    var h = (location.hash || '').slice(1);
    MK.seccion = (op.paginas || []).some(function (p) { return p.id === h; }) ? h : op.inicio;
    pintarBarra(); pintarMenu();
    MK.recargar(true);
    document.addEventListener('keydown', function (e) {
      var t = e.target, escribe = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (e.key === 'Escape') { MK.cerrarHoja(); MK.cerrarLado(); }
      if (!escribe && e.key === '/') { var q = document.getElementById('mk-q'); if (q) { e.preventDefault(); q.focus(); } }
    });
  };
  /* Vuelve a pedir la base y repinta la sección actual */
  MK.recargar = function (primera) {
    var main = document.getElementById('main');
    if (primera && main) MK.cargando(main);
    if (MK.op.antes && primera) { var seguir = MK.op.antes(); if (seguir === false) return Promise.resolve(); }
    /* baseArgs: argumentos extra para la base (Dirección le pasa el periodo) */
    return MK.api.apply(null, [MK.op.base, MK.pinUso()].concat(MK.op.baseArgs ? MK.op.baseArgs() : [])).then(function (b) {
      if (!b || !b.ok) { if (main) main.innerHTML = '<div class="aviso rj">' + MK.esc((b && b.error) || 'No se pudo abrir.') + ' <a href="index.html">Volver a los módulos</a></div>'; return; }
      MK.base = b; MK.usuario = b.usuario || MK.usuario; MK.hoy = b.hoy || MK.hoy;
      MK.soloVer = b.permiso === 've';
      document.body.classList.toggle('solo-ver', MK.soloVer);
      if (MK.op.alCargar) { try { MK.op.alCargar(b); } catch (e) { console.error(e); } }
      pintarBarra(); pintarMenu();
      MK.repintar();
    }, function (e) { if (main && primera) MK.error(main, 'Sin conexión: ' + e.message); else MK.aviso('Sin conexión'); });
  };
})();
