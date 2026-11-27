/* ECOVSA 3.120 · Calendario panorámico. Consulta; conserva permisos y fuentes existentes. */
(function () {
  'use strict';
  if (typeof CAL38 === 'undefined' || typeof cal38Cargar_ !== 'function') return;
  var originalLoad = cal38Cargar_, originalPaint = cal38Pintar_, originalRange = cal38Rango_;
  var state = { session: '', seq: 0, detailSeq: 0, days: Object.create(null), pending: Object.create(null), modal: null, selected: null, routes: [], filter: 'all', stop: null, loading: false, error: '', telemetry: null, telemetryAt: 0, opener: null, timer: null, updated: 0 };
  var layers = [['r', 'Rutas'], ['m', 'Mantenimiento y documentos'], ['i', 'Inspecciones'], ['c', 'Recordatorios'], ['x', 'Incidencias'], ['f', 'Feriados'], ['u', 'Fumigación']];
  var eventLayer = { mto: 'm', doc: 'm', ins: 'i', rec: 'c', inc: 'x', nr: 'x', fer: 'f', fum: 'u' };
  var eventNames = { mto: 'Mantenimiento', doc: 'Documento', ins: 'Inspección', rec: 'Recordatorio', inc: 'Incidencia', nr: 'No recolectado', fer: 'Feriado', fum: 'Fumigación' };
  function text(v) { return String(v == null ? '' : v); }
  function escape(v) { return text(v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function array(v) { return Array.isArray(v) ? v : []; }
  function finite(v) { return v !== null && v !== '' && Number.isFinite(Number(v)); }
  function num(v) { return Number(v) || 0; }
  function allowed() { return typeof PIN !== 'undefined' && !!PIN && typeof vistaLogistica_ === 'function' && vistaLogistica_(); }
  function session() { return text(typeof PIN === 'undefined' ? '' : PIN) + '|' + text((window.USUARIO || {}).nombre) + '|' + text((window.USUARIO || {}).rol); }
  function guard() {
    var sig = session();
    if (sig !== state.session) { state.seq++; state.detailSeq++; state.days = Object.create(null); state.pending = Object.create(null); state.telemetry = null; state.telemetryAt = 0; state.session = sig; CAL38.r = null; close(); }
    if (!allowed()) { state.days = Object.create(null); state.pending = Object.create(null); state.telemetry = null; state.stops = null; CAL38.r = null; close(); var old = document.querySelector('#cal38.cal3120'); if (old) old.replaceChildren(); return false; }
    return true;
  }
  function today() { return text(CAL38.r && CAL38.r.hoy) || hoyISO(); }
  function date(v) { return new Date(text(v) + 'T12:00:00'); }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function longDate(v) { var d = date(v); return isNaN(d) ? text(v) : d.toLocaleDateString('es-PA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
  function clock(t) { return new Date(t).toLocaleTimeString('es-PA', { timeZone: 'America/Panama', hour: '2-digit', minute: '2-digit', hour12: false }); }
  function reduced() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function icon(name) { return typeof mkSvg_ === 'function' ? mkSvg_(name) : ''; }
  function key(r) { return [r.fecha, r.rutaId, r.conductor, r.vehiculo].map(text).join('|'); }
  function same(a, b) { return text(a.fecha) === text(b.fecha) && text(a.rutaId) === text(b.rutaId) && text(a.conductor) === text(b.conductor) && (!a.vehiculo || !b.vehiculo || text(a.vehiculo) === text(b.vehiculo)); }
  function root() { var r = cal38Raiz_(); r.classList.add('cal3120'); return r; }
  function active() { var e = document.getElementById('pantalla-agenda'); return !!(e && e.classList.contains('activa') && allowed()); }
  function markActive() { document.body.classList.toggle('cl3120-active', active()); }
  function call(name, args) {
    return new Promise(function (resolve, reject) {
      var complete = false, timer = setTimeout(function () { finish(new Error('La consulta tardó demasiado. Vuelve a intentar.')); }, 20000);
      function finish(error, value) { if (complete) return; complete = true; clearTimeout(timer); if (error) reject(error); else resolve(value); }
      try { var run = google.script.run.withSuccessHandler(function (r) { finish(null, r); }).withFailureHandler(function () { finish(new Error('No se pudo consultar. Comprueba la conexión y vuelve a intentar.')); }); run[name].apply(run, args); } catch (e) { finish(new Error('No se pudo iniciar la consulta. Vuelve a intentar.')); }
    });
  }
  function checkResponse(r) {
    if (!r || r.ok !== true) { var e = new Error(text(r && r.error) || 'No se pudo cargar la información.'); e.login = !!(r && r.requiereLogin); e.denied = !!(r && r.ok === false); throw e; }
    return r;
  }
  function authorizedError(e) { if (!e.login && !e.denied) return; state.days = Object.create(null); state.pending = Object.create(null); state.telemetry = null; CAL38.r = null; state.error = e.message; close(); if (allowed()) render(); }
  function button(action, label, extra, cls) { return '<button type="button" class="cl3120-button ' + (cls || '') + '" data-cl3120="' + action + '" ' + (extra || '') + '>' + label + '</button>'; }
  function routesFor(f) { return array(CAL38.r && CAL38.r.dias).filter(function (r) { return text(r.fecha) === f; }); }
  function eventsFor(f) { return array(CAL38.r && CAL38.r.eventos).filter(function (e) { return e.fecha === f && (!eventLayer[e.tipo] || CAL38.capas[eventLayer[e.tipo]]); }); }
  function routeLabel(r) { return text(r.vehiculo) || text(r.conductor) || 'Ruta sin vehículo'; }
  function routeStatus(r) { if (r.borrador) return ['pending', 'Borrador']; if (num(r.total) > 0 && num(r.completadas) >= num(r.total)) return ['done', 'Completada']; if (r.fecha > today()) return ['pending', 'Programada']; if (/cerr|termin/i.test(text(r.estadoRuta))) return ['pending', 'Cerrada']; return r.fecha === today() ? ['active', 'En curso'] : ['pending', 'Pendiente']; }
  function routeCard(r) {
    var s = routeStatus(r);
    return button('route', '<span class="cl3120-route-top"><b>' + escape(routeLabel(r)) + '</b><span aria-hidden="true">↗</span></span><small>' + escape(r.conductor || 'Sin conductor') + '</small><span class="cl3120-route-bottom"><span>' + num(r.completadas) + '/' + num(r.total) + ' paradas</span><span>' + escape(s[1]) + '</span></span>', 'data-key="' + escape(key(r)) + '" aria-label="Abrir ruta de ' + escape(r.conductor || r.vehiculo) + ', ' + escape(longDate(r.fecha)) + ', ' + num(r.total) + ' paradas"', 'cl3120-route ' + s[0]);
  }
  function periodTitle() {
    if (CAL38.vista === 'dia') return longDate(CAL38.ref);
    var rg = cal38Rango_();
    if (CAL38.vista === 'sem') return longDate(rg[0]) + ' — ' + longDate(rg[1]);
    return date(CAL38.ref).toLocaleDateString('es-PA', { month: 'long', year: 'numeric' });
  }
  function calendar() {
    var rg = cal38Rango_(), d = date(rg[0]), last = rg[1], days = [];
    while (iso(d) <= last && days.length < 63) { days.push(iso(d)); d.setDate(d.getDate() + 1); }
    if (CAL38.vista === 'dia') return dayContent(CAL38.ref);
    var h = '<div class="cl3120-month" style="--cl3120-weeks:' + Math.max(1, Math.ceil(days.length / 7)) + '">';
    h += ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(function (s) { return '<div class="cl3120-weekday">' + s + '</div>'; }).join('');
    days.forEach(function (f) {
      var rs = CAL38.capas.r ? routesFor(f) : [], es = eventsFor(f), n = date(f).getDate();
      h += '<article class="cl3120-cell ' + (f.slice(0, 7) !== CAL38.ref.slice(0, 7) && CAL38.vista === 'mes' ? 'other ' : '') + (f === today() ? 'today ' : '') + (f === CAL38.sel ? 'selected' : '') + '">';
      h += button('day', '<b>' + n + '</b>' + (f === today() ? '<span>Hoy</span>' : ''), 'data-date="' + f + '" aria-label="Ver día ' + escape(longDate(f)) + '"', 'cl3120-date');
      h += '<div class="cl3120-cell-items">' + rs.map(routeCard).join('');
      es.slice(0, 2).forEach(function (e) { h += '<span class="cl3120-event" title="' + escape(e.titulo) + '">' + escape(eventNames[e.tipo] || 'Actividad') + ' · ' + escape(e.titulo) + '</span>'; });
      if (es.length > 2) h += button('day', '+' + (es.length - 2) + ' actividades', 'data-date="' + f + '"', 'cl3120-more');
      var toca = CAL38.r && CAL38.r.toca && num(CAL38.r.toca[f]);
      if (toca && CAL38.capas.r) h += '<span class="cl3120-due">' + toca + ' sin ruta</span>';
      h += '</div></article>';
    });
    return h + '</div>';
  }
  function dayContent(f) {
    var rs = CAL38.capas.r ? routesFor(f) : [], es = eventsFor(f);
    var h = '<section class="cl3120-day"><h2>' + escape(longDate(f)) + '</h2><div class="cl3120-day-routes">' + rs.map(routeCard).join('') + '</div>';
    if (!rs.length) h += '<p class="cl3120-empty">No hay rutas para este día en las capas seleccionadas.</p>';
    h += '<div class="cl3120-day-events">';
    es.forEach(function (e) {
      var i = array(CAL38.r.eventos).indexOf(e), actionable = !!e.incId || ['mto', 'doc', 'ins', 'fum'].indexOf(e.tipo) >= 0;
      var label = '<span>' + escape(eventNames[e.tipo] || 'Actividad') + '</span><b>' + escape(e.titulo) + '</b>' + (e.por ? '<small>' + escape(e.por) + '</small>' : '');
      h += actionable ? button('event', label, 'data-index="' + i + '"', 'cl3120-day-event') : '<div class="cl3120-day-event">' + label + '</div>';
    });
    return h + '</div></section>';
  }
  function render() {
    if (!allowed()) return;
    markActive();
    var r = root(), scroll = document.querySelector('body > #cuerpo > main'), top = scroll ? scroll.scrollTop : 0;
    var h = '<div class="cl3120-heading"><div><span>Logística</span><h1>Mi calendario</h1></div><div class="cl3120-updated" role="status">' + (state.loading ? 'Actualizando…' : state.updated ? 'Consultado a las ' + escape(clock(state.updated)) : '') + '</div></div>';
    h += '<div class="cl3120-toolbar"><div class="cl3120-period">' + button('move', icon('atras'), 'data-step="-1" aria-label="Período anterior"') + button('move', icon('flecha'), 'data-step="1" aria-label="Período siguiente"') + '<h2>' + escape(periodTitle()) + '</h2>' + button('today', 'Hoy') + '</div><div class="cl3120-viewgroup" aria-label="Vista del calendario">';
    [['dia', 'Día'], ['sem', 'Semana'], ['mes', 'Mes']].forEach(function (v) { h += button('view', v[1], 'data-view="' + v[0] + '" aria-pressed="' + (CAL38.vista === v[0]) + '"'); });
    h += '</div>' + button('refresh', icon('renovar') + '<span>Actualizar</span>', 'aria-label="Actualizar calendario"') + '</div>';
    h += '<div class="cl3120-layers" aria-label="Capas del calendario">' + layers.map(function (x) { return button('layer', x[1], 'data-layer="' + x[0] + '" aria-pressed="' + !!CAL38.capas[x[0]] + '"'); }).join('') + '</div>';
    if (state.error) h += '<div class="cl3120-error" role="alert">' + escape(state.error) + button('refresh', 'Reintentar') + '</div>';
    h += '<div class="cl3120-surface" aria-busy="' + state.loading + '">' + (CAL38.r ? calendar() : '<p class="cl3120-empty">' + (state.loading ? 'Consultando el calendario…' : 'Sin información disponible.') + '</p>') + '</div>';
    r.innerHTML = h;
    if (!r.dataset.cl3120Bound) { r.dataset.cl3120Bound = '1'; r.addEventListener('click', clickCalendar); }
    if (scroll) scroll.scrollTop = top;
  }
  function animate(el, source) {
    if (!el || reduced() || !el.animate) return;
    var rect = el.getBoundingClientRect(), dx = source ? (source.left + source.width / 2 - (rect.left + rect.width / 2)) * .18 : 0, dy = source ? (source.top + source.height / 2 - (rect.top + rect.height / 2)) * .18 : 16;
    el.animate([{ opacity: .2, transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.95)' }, { opacity: 1, transform: 'translate(0,0) scale(1)' }], { duration: 360, easing: 'cubic-bezier(.16,1,.3,1)' });
  }
  function load() {
    if (!guard()) return originalLoad.apply(this, arguments);
    if (['mes', 'sem', 'dia'].indexOf(CAL38.vista) < 0) CAL38.vista = 'mes';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text(CAL38.ref))) CAL38.ref = today();
    var sig = state.session, seq = ++state.seq, rg = cal38Rango_();
    state.loading = true; state.error = ''; render();
    call('api_calLogistica', [PIN, rg[0], rg[1]]).then(checkResponse).then(function (r) {
      if (session() !== sig || !allowed()) { guard(); close(); return; } if (seq !== state.seq) return;
      CAL38.r = r; CAL38.r.dias = array(r.dias); CAL38.r.eventos = array(r.eventos); state.updated = Date.now(); state.error = '';
    }).catch(function (e) { if (session() !== sig || seq !== state.seq) return; authorizedError(e); state.error = e.message; }).finally(function () { if (session() === sig && seq === state.seq && allowed()) { state.loading = false; render(); } });
  }
  function getDay(f, force) {
    if (!force && state.days[f] && Date.now() - state.days[f].at < 30000) return Promise.resolve(state.days[f].r);
    if (state.pending[f]) return state.pending[f];
    var sig = state.session;
    var p = call('api_agenda', [PIN, null, f, f]).then(checkResponse).then(function (r) { if (session() !== sig || !allowed()) throw new Error('La sesión cambió. Vuelve a abrir la ruta.'); state.days[f] = { at: Date.now(), r: r }; return r; }).finally(function () { if (state.pending[f] === p) delete state.pending[f]; });
    state.pending[f] = p; return p;
  }
  function telemetry(f, force) {
    if (f !== today() || !/^(admin|supervisor|gerente)$/.test(text((window.USUARIO || {}).rol))) return Promise.resolve(null);
    if (!force && state.telemetry && Date.now() - state.telemetryAt < 20000) return Promise.resolve(state.telemetry);
    var sig = state.session;
    return call('api_ubiMapa', [PIN]).then(function (r) {
      if (session() !== sig || !allowed() || !r || !r.ok || r.hoy !== f) return null;
      /* Keep only status evidence; coordinates and traces are not retained. */
      var result = array(r.camiones).map(function (c) { return { rutaId: text(c.rutaId), cerrada: !!c.cerrada, sinSenal: !!c.sinSenal, hace: c.hace, destino: text(c.destino), llegadas: array(c.llegadas).filter(function (e) { return finite(e.hace) && Number(e.hace) >= 0; }).map(function (e) { return { cliente: text(e.cliente), hace: Number(e.hace) }; }) }; });
      state.telemetry = result; state.telemetryAt = Date.now(); return result;
    }).catch(function () { return null; });
  }
  function normalizeStops(r, trucks) {
    var truck = array(trucks).find(function (c) { return c.rutaId && c.rutaId === text(r.rutaId) && !c.cerrada && !c.sinSenal && finite(c.hace) && Number(c.hace) >= 0 && Number(c.hace) <= 600; });
    var arrival = truck && truck.llegadas.slice().sort(function (a, b) { return a.hace - b.hace; })[0];
    return array(r.paradas).map(function (p, i) { return { p: p, i: i }; }).sort(function (a, b) { return num(a.p.orden) - num(b.p.orden) || a.i - b.i; }).map(function (entry, i) {
      var p = entry.p, done = p.hecha === true, hi = text(p.horaInicio), hf = text(p.horaFinal), closed = /cerr|termin/i.test(text(r.estadoRuta)), status = done ? 'done' : r.fecha === today() && !closed && hi && !hf ? 'active' : 'pending', source = '';
      if (!done && !closed && r.fecha === today() && arrival && arrival.cliente === text(p.clienteId) && truck.destino === arrival.cliente && arrival.hace <= 14400 && !hf) { status = 'active'; if (!hi) hi = clock(state.telemetryAt - arrival.hace * 1000); source = 'Llegada registrada por el conductor'; }
      return { n: i + 1, name: text(p.nombre || p.cliente) || 'Cliente ' + text(p.clienteId), status: status, arrival: hi, end: hf, kg: done && finite(p.totalKg) ? Number(p.totalKg) : null, receipt: text(p.recibo), source: source, extra: !!p.fueraDeRuta };
    });
  }
  function modal() {
    if (state.modal && state.modal.isConnected) return state.modal;
    var d = document.createElement('dialog'); d.className = 'cl3120-dialog'; d.id = 'cl3120-dialog'; d.setAttribute('aria-labelledby', 'cl3120-modal-title');
    d.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    d.addEventListener('click', function (e) { if (e.target === d) { var box = d.getBoundingClientRect(); if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) close(); } else clickModal(e); });
    d.addEventListener('close', function () { if (!d.open) cleanupModal(); }); document.body.appendChild(d); state.modal = d; return d;
  }
  function cleanupModal() { clearTimeout(state.timer); state.timer = null; state.selected = null; state.detailSeq++; if (state.opener && state.opener.isConnected) state.opener.focus({ preventScroll: true }); }
  function close() { if (state.modal && state.modal.open) state.modal.close(); cleanupModal(); }
  function showLoading(title) {
    var d = modal(); d.innerHTML = '<div class="cl3120-sheet"><div class="cl3120-modal-simple"><h2 id="cl3120-modal-title">' + escape(title) + '</h2>' + button('close', icon('x'), 'aria-label="Cerrar ficha"') + '</div><div class="cl3120-empty" role="status">Cargando paradas…</div></div>';
    if (!d.open) d.showModal();
  }
  function openRoute(summary, opener, force) {
    if (!guard()) return;
    if (opener) state.opener = opener;
    var source = opener && opener.getBoundingClientRect(), changed = !state.selected || !same(state.selected, summary), sig = state.session;
    state.selected = summary; CAL38.sel = summary.fecha; if (changed) { state.filter = 'all'; state.stop = null; }
    var seq = ++state.detailSeq; clearTimeout(state.timer);
    if (changed || !state.modal || !state.modal.open) showLoading(routeLabel(summary));
    else { var refresh = state.modal.querySelector('[data-cl3120="detail-refresh"]'); if (refresh) refresh.disabled = true; }
    Promise.all([getDay(summary.fecha, force), telemetry(summary.fecha, force)]).then(function (results) {
      if (session() !== sig || !allowed()) { guard(); close(); return; } if (seq !== state.detailSeq || !state.modal.open) return;
      state.routes = array(results[0].dias); var matches = state.routes.filter(function (r) { return same(r, summary); });
      if (matches.length !== 1) throw new Error(matches.length ? 'La ruta no se puede identificar de forma única. Actualiza el calendario.' : 'La ruta cambió o ya no está disponible. Actualiza el calendario.');
      state.selected = matches[0]; state.stops = normalizeStops(state.selected, results[1]); state.detailUpdated = Date.now(); state.detailError = ''; paintDetail();
      if (changed) { animate(state.modal.querySelector('.cl3120-sheet'), source); state.modal.querySelector('[data-cl3120="close"]')?.focus({ preventScroll: true }); }
    }).catch(function (e) { if (session() !== sig || seq !== state.detailSeq || !state.modal || !state.modal.open) return; authorizedError(e); if (e.login || e.denied) return; state.detailError = e.message; state.stops = null; paintDetail(); }).finally(function () {
      if (session() === sig && seq === state.detailSeq && state.modal && state.modal.open && summary.fecha === today()) state.timer = setTimeout(function () { if (active() && !document.hidden && state.selected) openRoute(state.selected, null, true); }, 30000);
    });
  }
  function paintDetail() {
    if (!state.modal || !state.modal.open || !state.selected || !allowed()) return;
    var r = state.selected, stops = array(state.stops), done = stops.filter(function (p) { return p.status === 'done'; }).length, running = stops.filter(function (p) { return p.status === 'active'; }), pending = stops.length - done - running.length;
    var peers = state.routes.filter(function (x) { return x.fecha === r.fecha; }), idx = peers.indexOf(r), scroll = state.modal.querySelector('.cl3120-detail-scroll'), scrollTop = scroll ? scroll.scrollTop : 0;
    var h = '<div class="cl3120-sheet"><div class="cl3120-modal-head"><div class="cl3120-modal-top"><span>' + escape(longDate(r.fecha)) + '</span><div>' + button('detail-refresh', icon('renovar') + ' Actualizar') + button('close', icon('x'), 'aria-label="Cerrar ficha de ruta"') + '</div></div><div class="cl3120-modal-title"><h2 id="cl3120-modal-title">' + escape(routeLabel(r)) + '</h2><span class="cl3120-badge">' + escape(routeStatus(r)[1]) + '</span></div><div class="cl3120-modal-sub">' + escape(r.conductor || 'Sin conductor') + (r.vehiculo ? ' · ' + escape(r.vehiculo) : '') + '</div>';
    if (peers.length > 1) h += '<div class="cl3120-peers">' + button('peer', icon('atras'), 'data-step="-1" aria-label="Ruta anterior del día"') + '<span>' + (idx + 1) + ' de ' + peers.length + ' rutas</span>' + button('peer', icon('flecha'), 'data-step="1" aria-label="Ruta siguiente del día"') + '</div>';
    h += '<div class="cl3120-counts"><span><b>' + done + '</b> realizadas</span><span><b>' + running.length + '</b> en atención</span><span><b>' + pending + '</b> pendientes</span></div>';
    h += '<div class="cl3120-progress" aria-label="Estado de las paradas">' + stops.map(function (p) { return button('jump', '', 'data-stop="' + p.n + '" aria-label="Ver parada ' + p.n + ', ' + escape(p.name) + ', ' + escape(statusName(p.status)) + '"', p.status); }).join('') + '</div></div><div class="cl3120-detail-scroll">';
    if (state.detailError) h += '<div class="cl3120-error" role="alert">' + escape(state.detailError) + button('detail-refresh', 'Reintentar') + '</div>';
    else {
      running.forEach(function (p) { h += button('jump', '<span>' + icon('visita') + '</span><span><small>En atención · parada ' + p.n + ' de ' + stops.length + '</small><b>' + escape(p.name) + '</b><small>Llegada registrada · ' + escape(p.arrival) + '</small></span><span>↓</span>', 'data-stop="' + p.n + '"', 'cl3120-current'); });
      h += '<div class="cl3120-filters" aria-label="Filtrar paradas">';
      [['all', 'Todas', stops.length], ['active', 'En atención', running.length], ['pending', 'Pendientes', pending], ['done', 'Realizadas', done]].forEach(function (s) { h += button('filter', escape(s[1]) + '<small>' + s[2] + '</small>', 'data-filter="' + s[0] + '" aria-pressed="' + (state.filter === s[0]) + '"'); });
      h += '</div><div class="cl3120-stops">'; var shown = stops.filter(function (p) { return state.filter === 'all' || state.filter === p.status; });
      shown.forEach(function (p) {
        var open = state.stop === p.n, meta = p.status === 'done' ? [p.arrival, p.end].filter(Boolean).join('–') + (p.kg !== null ? ' · ' + p.kg.toLocaleString('es-PA') + ' kg' : '') : p.arrival ? 'Llegada ' + p.arrival : 'Sin llegada registrada en el servidor';
        h += '<article class="cl3120-stop ' + p.status + '" id="cl3120-stop-' + p.n + '">' + button('stop', '<span class="cl3120-stop-number">' + (p.status === 'done' ? icon('check') : p.n) + '</span><span class="cl3120-stop-copy"><b>' + escape(p.name) + '</b><small>' + escape(meta) + '</small></span><span class="cl3120-stop-state ' + p.status + '">' + escape(statusName(p.status)) + '</span><span aria-hidden="true">' + (open ? '⌃' : '⌄') + '</span>', 'data-stop="' + p.n + '" aria-expanded="' + open + '" aria-controls="cl3120-stop-info-' + p.n + '"', 'cl3120-stop-toggle');
        h += '<div id="cl3120-stop-info-' + p.n + '" class="cl3120-stop-info"' + (open ? '' : ' hidden') + '>' + field('Llegada', p.arrival || 'Sin registrar') + field('Salida', p.end || 'Sin registrar') + field('Recolectado', p.kg === null ? 'Sin registrar' : p.kg.toLocaleString('es-PA') + ' kg') + field('Recibo', p.receipt || 'Sin registrar') + (p.source ? field('Origen de llegada', p.source) : '') + (p.extra ? field('Parada', 'Recolectada fuera de la ruta programada') : '') + '</div></article>';
      });
      if (!shown.length) h += '<p class="cl3120-empty">No hay paradas en este estado.</p>';
      h += '</div>';
    }
    h += '<footer class="cl3120-modal-foot">Consultado a las ' + escape(clock(state.detailUpdated || Date.now())) + ' · solo lectura ' + button('help', '?', 'aria-label="Cómo se determinan los estados"') + '<p id="cl3120-state-help" hidden>Realizada: recolección registrada. En atención: llegada registrada, sin recolección finalizada; la ubicación reciente debe seguir señalando esa parada. Las llegadas aún sin sincronizar no se muestran. Esta ficha no modifica la ruta.</p></footer></div></div>';
    state.modal.innerHTML = h;
    if (scrollTop) state.modal.querySelector('.cl3120-detail-scroll').scrollTop = scrollTop;
  }
  function statusName(s) { return { done: 'Realizada', active: 'En atención', pending: 'Pendiente' }[s]; }
  function field(label, value) { return '<div><span>' + escape(label) + '</span><b>' + escape(value) + '</b></div>'; }
  function openDay(f, opener) {
    if (!guard()) return; close(); CAL38.sel = f; state.opener = opener || null;
    var d = modal(); d.innerHTML = '<div class="cl3120-sheet"><div class="cl3120-modal-simple"><h2 id="cl3120-modal-title">' + escape(longDate(f)) + '</h2>' + button('close', icon('x'), 'aria-label="Cerrar día"') + '</div><div class="cl3120-detail-scroll">' + dayContent(f) + '</div></div>'; d.showModal(); animate(d.querySelector('.cl3120-sheet'), opener && opener.getBoundingClientRect());
  }
  function clickCalendar(e) {
    var b = e.target.closest('button[data-cl3120]'); if (!b || !guard()) return;
    var act = b.dataset.cl3120;
    if (act === 'route') { var r = array(CAL38.r && CAL38.r.dias).find(function (x) { return key(x) === b.dataset.key; }); if (r) openRoute(r, b, false); }
    else if (act === 'day') openDay(b.dataset.date, b);
    else if (act === 'event') eventGo(Number(b.dataset.index));
    else if (act === 'refresh') load();
    else if (act === 'layer') { CAL38.capas[b.dataset.layer] = CAL38.capas[b.dataset.layer] ? 0 : 1; try { localStorage.setItem('eco_cal38_c', JSON.stringify(CAL38.capas)); } catch (_) {} render(); root().querySelector('[data-layer="' + b.dataset.layer + '"]')?.focus({ preventScroll: true }); }
    else if (act === 'view') { CAL38.vista = b.dataset.view; try { localStorage.setItem('eco_cal38_v', CAL38.vista); } catch (_) {} load(); }
    else if (act === 'today') { CAL38.ref = today(); CAL38.sel = today(); CAL38.vista = 'dia'; load(); }
    else if (act === 'move') { var dt = date(CAL38.ref), step = num(b.dataset.step); if (CAL38.vista === 'mes') { dt.setDate(1); dt.setMonth(dt.getMonth() + step); } else dt.setDate(dt.getDate() + step * (CAL38.vista === 'sem' ? 7 : 1)); CAL38.ref = iso(dt); CAL38.sel = ''; load(); }
  }
  function clickModal(e) {
    var b = e.target.closest('button[data-cl3120]'); if (!b || !guard()) return;
    var act = b.dataset.cl3120;
    if (act === 'close') close();
    else if (act === 'route') { var r = array(CAL38.r && CAL38.r.dias).find(function (x) { return key(x) === b.dataset.key; }); if (r) openRoute(r, null, false); }
    else if (act === 'event') eventGo(Number(b.dataset.index));
    else if (act === 'detail-refresh' && state.selected) openRoute(state.selected, null, true);
    else if (act === 'filter') { state.filter = b.dataset.filter; state.stop = null; paintDetail(); state.modal.querySelector('[data-filter="' + state.filter + '"]')?.focus(); }
    else if (act === 'stop' || act === 'jump') { var n = Number(b.dataset.stop); state.stop = act === 'jump' || state.stop !== n ? n : null; if (act === 'jump') state.filter = 'all'; paintDetail(); var node = document.getElementById('cl3120-stop-' + n); node?.querySelector('button')?.focus({ preventScroll: true }); if (act === 'jump') node?.scrollIntoView({ block: 'center', behavior: reduced() ? 'instant' : 'smooth' }); }
    else if (act === 'peer') { var peers = state.routes.filter(function (r) { return r.fecha === state.selected.fecha; }), index = peers.indexOf(state.selected); if (peers.length) openRoute(peers[(index + Number(b.dataset.step) + peers.length) % peers.length], null, false); }
    else if (act === 'help') { var help = document.getElementById('cl3120-state-help'); if (help) help.hidden = !help.hidden; }
  }
  function eventGo(index) {
    var e = array(CAL38.r && CAL38.r.eventos)[index]; if (!e) return;
    close();
    if (e.incId && typeof bq38Ir_ === 'function') bq38Ir_('inc:' + text(e.incId));
    else if (e.tipo === 'mto' || e.tipo === 'doc') mostrarTab('mto');
    else if (e.tipo === 'fum') mostrarTab('fumigacion');
    else if (e.tipo === 'ins') { if (typeof BQ !== 'undefined') BQ.f = 'mer'; mostrarTab('solicitudes'); }
  }
  cal38Rango_ = function () { if (CAL38.vista === 'dia') { var f = CAL38.ref || today(); return [f, f]; } return originalRange.apply(this, arguments); };
  cal38Cargar_ = load;
  cal38Pintar_ = function () { if (!allowed()) return originalPaint.apply(this, arguments); if (!guard()) return; render(); };
  var originalTab = mostrarTab;
  mostrarTab = function () { var result = originalTab.apply(this, arguments); markActive(); if (!active()) close(); return result; };
  document.addEventListener('keydown', function (e) { if (state.modal && state.modal.open && e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); } }, true);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && active() && state.modal && state.modal.open && state.selected && state.selected.fecha === today()) openRoute(state.selected, null, true); });
  document.addEventListener('DOMContentLoaded', function () { state.session = session(); markActive(); if (active() && CAL38.r) render(); });
  var watcher = new MutationObserver(function () { markActive(); if (!allowed()) { guard(); close(); } else if (!active() && state.modal && state.modal.open) close(); });
  watcher.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  var agenda = document.getElementById('pantalla-agenda'); if (agenda) watcher.observe(agenda, { attributes: true, attributeFilter: ['class'] });
  if (CAL38.capas.u === undefined) CAL38.capas.u = 1;
  state.session = session();
})();
