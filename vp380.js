/* ═══════════════════════════════════════════════════════════════════
   ECOVSA · api 3.80 · «Lo que reciben los clientes»: MODO EJEMPLO
   Va DENTRO de cada marco de AdmVistaPrevia.html, en lugar de puente.js.
   La pantalla es la real (Encuesta, FormularioCliente, Propuesta); lo que
   cambia es que aquí no hay camino al servidor:
   · google.script.run lo contesta este archivo con el cliente de ejemplo
     (window.parent.VP380_EJ). Lo que el cliente «guarda» o «envía» se
     contesta «hecho» y no sale del navegador.
   · fetch, XMLHttpRequest, sendBeacon, WebSocket y EventSource no salen
     (la subida de un documento se imita con su barra de avance).
   · localStorage y sessionStorage son de mentira (en memoria): no queda
     nada escrito en el navegador.
   · los enlaces a WhatsApp, correo o mapas no se abren; los que van a otra
     pantalla del cliente se abren en este mismo marco, en modo ejemplo.
   Cada llamada se anota en la página de afuera (VP380.anotar).
   Nada de esto lo carga una pantalla del cliente: solo el marco de la
   vista previa. Nombres propios: vp380 / VP380.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var P = window.parent, CFG = window.VP380_CFG || {}, AF = (P && P !== window && P.VP380) || null;
  var EJ = (P && P.VP380_EJ) || null;
  function anotar(o) { try { if (AF) AF.anotar(CFG.marco, o); } catch (e) {} }
  function copia(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); }

  /* ── 1 · sin salida a la red ── */
  function bloqueo(que, url) { anotar({ tipo: 'bloqueado', fn: que, txt: String(url || '').slice(0, 120) }); }
  window.fetch = function (u) { bloqueo('fetch', u && u.url || u); return Promise.reject(new TypeError('Vista previa: sin conexión al servidor')); };
  try { navigator.sendBeacon = function (u) { bloqueo('sendBeacon', u); return true; }; } catch (e) {}
  window.WebSocket = function (u) { bloqueo('WebSocket', u); throw new Error('Vista previa: sin conexión'); };
  window.EventSource = function (u) { bloqueo('EventSource', u); throw new Error('Vista previa: sin conexión'); };
  /* XHR: la subida de documentos (PUT a la firma de vp380) avanza sola y dice «200»; todo lo demás falla sin salir */
  function XHR() { this.readyState = 0; this.status = 0; this.responseText = ''; this.upload = {}; this._h = {}; }
  XHR.prototype.open = function (m, u) { this._m = m; this._u = String(u || ''); this.readyState = 1; };
  XHR.prototype.setRequestHeader = function () {};
  XHR.prototype.getAllResponseHeaders = function () { return ''; };
  XHR.prototype.getResponseHeader = function () { return null; };
  XHR.prototype.abort = function () { this._fin = true; if (this.onabort) this.onabort({}); };
  XHR.prototype.send = function (cuerpo) {
    var x = this;
    if (/^vp380:/.test(x._u)) {
      var tam = (cuerpo && cuerpo.size) || 1, n = 0;
      anotar({ tipo: 'escribe', fn: 'subir el archivo', txt: 'el archivo se queda en su computadora' });
      var t = setInterval(function () {
        if (x._fin) return clearInterval(t);
        n += 25; if (x.upload.onprogress) x.upload.onprogress({ lengthComputable: true, loaded: Math.min(n, 100) * tam / 100, total: tam });
        if (n >= 100) { clearInterval(t); x.readyState = 4; x.status = 200; if (x.onload) x.onload({}); if (x.onreadystatechange) x.onreadystatechange({}); }
      }, 220);
      return;
    }
    bloqueo('XMLHttpRequest', x._u);
    setTimeout(function () { x.readyState = 4; x.status = 0; if (x.onerror) x.onerror({}); if (x.onreadystatechange) x.onreadystatechange({}); }, 0);
  };
  window.XMLHttpRequest = XHR;

  /* ── 2 · nada escrito en el navegador ── */
  function Memoria() { var d = {}; return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(d, k) ? d[k] : null; },
    setItem: function (k, v) { d[k] = String(v); }, removeItem: function (k) { delete d[k]; },
    clear: function () { d = {}; }, key: function (i) { return Object.keys(d)[i] || null; },
    get length() { return Object.keys(d).length; } }; }
  ['localStorage', 'sessionStorage'].forEach(function (k) {
    try { Object.defineProperty(window, k, { value: Memoria(), configurable: true }); } catch (e) {}
  });
  try { Object.defineProperty(document, 'cookie', { get: function () { return ''; }, set: function () {}, configurable: true }); } catch (e) {}
  try { if (navigator.serviceWorker) Object.defineProperty(navigator, 'serviceWorker', { value: undefined, configurable: true }); } catch (e) {}
  /* sin pedir la ubicación de verdad: «Estoy en el local» marca un punto de ejemplo */
  try {
    var GEO = { getCurrentPosition: function (ok) { setTimeout(function () { ok({ coords: { latitude: 8.9824, longitude: -79.5199, accuracy: 15 }, timestamp: Date.now() }); }, 300); },
                watchPosition: function () { return 0; }, clearWatch: function () {} };
    Object.defineProperty(navigator, 'geolocation', { value: GEO, configurable: true });
  } catch (e) {}

  /* ── 3 · los parámetros del enlace (el marco no tiene dirección propia) ── */
  var QS = new URLSearchParams(CFG.qs || '');
  var USP = window.URLSearchParams;
  window.URLSearchParams = function (a) {
    if (a === undefined || a === '' || a === location.search) return new USP(CFG.qs || '');
    return new USP(a);
  };
  window.URLSearchParams.prototype = USP.prototype;
  function parametros() { var q = {}, qs = {}; QS.forEach(function (v, k) { if (!(k in q)) q[k] = v; (qs[k] = qs[k] || []).push(v); }); return { parameter: q, parameters: qs, hash: '' }; }

  /* ── 4 · las fechas grabadas se corren al día de hoy ── */
  function corrimiento() {
    if (!EJ || !EJ.dia) return 0;
    var h = new Date(), hoy = Date.UTC(h.getFullYear(), h.getMonth(), h.getDate());
    var d = EJ.dia.split('-'); return Math.round((hoy - Date.UTC(+d[0], +d[1] - 1, +d[2])) / 864e5);
  }
  var DIAS = corrimiento();
  function correr(x) {
    if (!DIAS) return x;
    if (typeof x === 'string') return x.replace(/\b(20\d\d)-(\d\d)-(\d\d)\b/g, function (m, a, b, c) {
      var t = new Date(Date.UTC(+a, +b - 1, +c) + DIAS * 864e5); return t.toISOString().slice(0, 10); });
    if (Array.isArray(x)) return x.map(correr);
    if (x && typeof x === 'object') { var o = {}; Object.keys(x).forEach(function (k) { o[k] = correr(x[k]); }); return o; }
    return x;
  }

  /* ── 5 · lo que «contesta el servidor» con el cliente de ejemplo ── */
  var S = { paso: CFG.paso || 'datos', docs: {}, banc: null, n: 0 };
  function F() { return EJ && EJ.formulario; }
  function enlaceDocs() {
    var b = copia(F().documentos), e = b.enlace;
    (e.docs && e.docs.docs || []).forEach(function (d) {
      var s = S.docs[d.doc]; if (s) { d.estado = 'por revisar'; d.fecha = EJ.dia + ' 10:00'; d.nombre = s; }
      if (d.escrito && S.banc) { d.estado = 'por revisar'; d.fecha = EJ.dia + ' 10:00'; d.banco = S.banc.banco; d.ult4 = S.banc.ult4; d.titular = S.banc.titular; }
    });
    if (e.docs) {
      var L = e.docs.docs || [];
      e.docs.porRevisar = L.filter(function (d) { return d.estado === 'por revisar'; }).length;
      if (L.length && L.every(function (d) { return d.estado === 'por revisar' || d.estado === 'aceptado'; })) e.paso = 'revision';
    }
    b.documentos = e.docs; return b;
  }
  function formulario() {
    if (S.paso === 'documentos') return enlaceDocs();
    return copia(F()[S.paso] || F().datos);
  }
  function hecho(fn, txt, r) { anotar({ tipo: 'escribe', fn: fn, txt: txt }); return r; }
  var R = {
    /* Formulario de primer contacto / el enlace del cliente */
    api_crmFormulario: function () { anotar({ tipo: 'lee', fn: 'api_crmFormulario', txt: 'el enlace en el paso «' + S.paso + '»' }); return formulario(); },
    api_crmFormularioBorrador: function () { S.n++; return hecho('api_crmFormularioBorrador', 'guardó el borrador', { ok: true, guardado: S.n }); },
    api_guardarDatosFormularioCliente: function (t, d) { S.paso = 'espera'; return hecho('api_guardarDatosFormularioCliente', 'envió sus datos', { ok: true, empresa: (d && d.empresa) || 'Clínica Ejemplo' }); },
    api_enlaceResponder: function (t, k, dec, d) {
      d = d || {};
      if (dec === 'acepto') {
        if (!d.acepta) return { ok: false, error: 'Marque la casilla para confirmar que acepta.' };
        S.paso = 'documentos';
        var r = enlaceDocs().enlace; r.aceptoPor = [d.nombre, d.cargo].filter(Boolean).join(' · ');
        return hecho('api_enlaceResponder', 'aceptó la propuesta', Object.assign({ ok: true }, r));
      }
      var e = copia(F().propuesta.enlace);
      e.paso = 'noacepto'; e.respuesta = String(dec || ''); e.motivo = d.motivo || ''; e.comentario = d.comentario || '';
      if (dec === 'despues') { e.paso = 'propuesta'; }
      return hecho('api_enlaceResponder', dec === 'despues' ? 'dijo «lo decido más adelante»' : 'no aceptó la propuesta', Object.assign({ ok: true }, e));
    },
    api_docsClientePedirSubida: function (t, k, doc, meta) {
      S.ult = { doc: doc, nombre: (meta && meta.nombre) || 'documento.pdf' };
      return { ok: true, archivoId: 'VP380-' + (++S.n), subida: 'vp380://subida' };
    },
    api_docsClienteListo: function () {
      if (S.ult) S.docs[S.ult.doc] = S.ult.nombre;
      return hecho('api_docsClienteListo', 'subió «' + (S.ult ? S.ult.nombre : 'un documento') + '»', { ok: true, enlace: enlaceDocs().enlace });
    },
    api_enlaceBancarios: function (t, k, d) {
      S.banc = { banco: (d && d.banco) || '', ult4: (d && d.ult4) || '', titular: (d && d.titular) || '' };
      return hecho('api_enlaceBancarios', 'escribió sus datos bancarios', Object.assign({ ok: true }, enlaceDocs().enlace));
    },
    api_docsCliente: function () { return { ok: true, docs: enlaceDocs().documentos }; },
    api_frmBuscarLugar: function (t, q) {
      anotar({ tipo: 'lee', fn: 'api_frmBuscarLugar', txt: 'buscó «' + String(q || '').slice(0, 40) + '» en el mapa' });
      return { ok: true, conectado: true, lugares: [
        { nombre: 'Plaza Ejemplo', direccion: 'Vía España, Ciudad de Panamá', lat: 8.9926, lng: -79.5227 },
        { nombre: 'Edificio Ejemplo', direccion: 'Calle 50, Ciudad de Panamá', lat: 8.9824, lng: -79.5199 }] };
    },
    api_frmLeerEnlace: function () { return { ok: true, punto: { lat: 8.9824, lng: -79.5199, lugar: 'Punto de ejemplo' } }; },
    api_frmRevisarPunto: function () { return { ok: true, dist: { km: 0.2 } }; },
    api_frmEnlaceLocal: function () { return { ok: false, error: 'En la vista previa no se prepara el mensaje para la sucursal.' }; },
    /* La propuesta en su enlace */
    api_enlacePropuesta: function () { anotar({ tipo: 'lee', fn: 'api_enlacePropuesta', txt: 'abrió la propuesta' }); return copia(EJ.propuesta); },
    /* Encuesta */
    api_encAbrir: function () { anotar({ tipo: 'lee', fn: 'api_encAbrir', txt: 'abrió la encuesta (no se marca «abierta»)' });
      return { ok: true, cerrada: false, cliente: EJ.encuesta.cliente, asesor: EJ.encuesta.asesor, progreso: 0, respuestas: {} }; },
    api_encGuardar: function (e, k, resp, i) { return hecho('api_encGuardar', 'va en la pregunta ' + (Number(i) + 1), { ok: true }); },
    api_encResponder: function () { return hecho('api_encResponder', 'envió la encuesta', { ok: true }); }
  };
  function contestar(fn, args) {
    if (!EJ) return { ok: false, error: 'Vista previa sin datos de ejemplo.' };
    if (R[fn]) return correr(R[fn].apply(null, args));
    anotar({ tipo: 'nueva', fn: fn, txt: 'la pantalla pidió algo que la vista previa no conoce; se contestó «hecho»' });
    return { ok: true };
  }

  /* ── 6 · google.script.* de mentira (la misma forma que puente.js) ── */
  function corredor(ok, mal, uo) {
    var base = {
      __puente: true, __vp380: true,
      withSuccessHandler: function (f) { return corredor(f, mal, uo); },
      withFailureHandler: function (f) { return corredor(ok, f, uo); },
      withUserObject: function (u) { return corredor(ok, mal, u); }
    };
    return new Proxy(base, { get: function (t, fn) {
      if (fn in t) return t[fn];
      if (typeof fn !== 'string') return undefined;
      return function () {
        var args = Array.prototype.slice.call(arguments);
        setTimeout(function () {
          var r; try { r = contestar(fn, args); } catch (e) { if (mal) mal(e, uo); return; }
          if (ok) try { ok(r, uo); } catch (e) { console.error(e); }
        }, 180 + Math.random() * 220);
      };
    } });
  }
  window.google = window.google || {};
  window.google.script = window.google.script || {};
  Object.defineProperty(window.google.script, 'run', { get: function () { return corredor(null, null, undefined); }, configurable: true });
  window.google.script.url = { getLocation: function (cb) { if (typeof cb === 'function') cb(parametros()); } };
  window.google.script.host = { close: function () {}, setHeight: function () {}, setWidth: function () {}, origin: location.origin };
  window.google.script.history = { push: function () {}, replace: function () {}, setChangeHandler: function () {} };
  window.PUENTE = { vistaPrevia: true, reporte: function () { return 'Vista previa: sin servidor'; }, estado: function () { return {}; } };

  /* ── 7 · enlaces, ventanas y formularios ── */
  var PANTALLAS = /(^|\/)(Encuesta|FormularioCliente|Propuesta)\.html(\?|#|$)/;
  function salida(href) {
    var u = String(href || '');
    if (/^https?:\/\/(wa\.me|api\.whatsapp)/.test(u)) return 'WhatsApp';
    if (/^mailto:|outlook\.|mail\.google/.test(u)) return 'el correo';
    if (/^tel:/.test(u)) return 'la llamada';
    if (/google\.[a-z.]+\/maps|maps\.app|goo\.gl/.test(u)) return 'el mapa';
    return 'otra página';
  }
  function abrir(href) {
    var u; try { u = new URL(href, CFG.base); } catch (e) { return false; }
    if (u.origin === new URL(CFG.base).origin && PANTALLAS.test(u.pathname)) {
      anotar({ tipo: 'navega', fn: u.pathname.split('/').pop(), txt: 'abrió otra pantalla del cliente' });
      if (AF) AF.navegar(CFG.marco, u.pathname.split('/').pop(), u.search.replace(/^\?/, ''), S.paso);
      return true;
    }
    aviso('En la vista previa no se abre ' + salida(href) + '.');
    anotar({ tipo: 'bloqueado', fn: 'enlace', txt: salida(href) + ': ' + String(href).slice(0, 80) });
    return true;
  }
  window.open = function (u) { abrir(u); return null; };
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href') || '';
    if (!h || h.charAt(0) === '#' || /^javascript:/i.test(h) || /^blob:/.test(a.href)) return;
    e.preventDefault(); e.stopPropagation(); abrir(a.href);
  }, true);
  document.addEventListener('submit', function (e) { e.preventDefault(); }, true);
  /* Escape dentro del marco cierra «Abrir en grande» de la página de afuera */
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && AF && AF.escape) try { AF.escape(); } catch (x) {} });

  /* ── 8 · la cinta fija y el aviso ── */
  function aviso(t) {
    var d = document.getElementById('vp380-aviso');
    if (!d) { d = document.createElement('div'); d.id = 'vp380-aviso'; d.setAttribute('role', 'status');
      d.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483001;background:#0f2140;color:#fff;font:600 13px Archivo,Arial,sans-serif;padding:10px 16px;border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,.25);max-width:90vw;text-align:center';
      document.body.appendChild(d); }
    d.textContent = t; d.style.display = 'block'; clearTimeout(d._t); d._t = setTimeout(function () { d.style.display = 'none'; }, 2600);
  }
  function cinta() {
    if (document.getElementById('vp380-cinta')) return;
    var c = document.createElement('div'); c.id = 'vp380-cinta';
    c.innerHTML = '<b>VISTA PREVIA</b><span>· datos de ejemplo · nada se guarda ni se envía</span>';
    c.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:2147483000;display:flex;gap:6px;align-items:center;flex-wrap:wrap;background:#F5B301;color:#0f2140;font:600 12.5px Archivo,Arial,sans-serif;padding:7px 14px;box-shadow:0 2px 8px rgba(0,0,0,.15);pointer-events:none';
    document.body.appendChild(c);
    var h = c.getBoundingClientRect().height || 32;
    document.documentElement.style.scrollPaddingTop = h + 'px';
    document.body.style.paddingTop = 'calc(' + (getComputedStyle(document.body).paddingTop || '0px') + ' + ' + h + 'px)';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cinta); else cinta();
  window.VP380_HIJO = { estado: function () { return copia(S); } };
  anotar({ tipo: 'abre', fn: CFG.pantalla, txt: 'pantalla real en modo ejemplo' });
})();
