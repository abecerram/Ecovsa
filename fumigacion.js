/* ═══════════════════════════════════════════════════════════════════
   FUMIGACIÓN · api 3.36 (maqueta aprobada por Álvaro el 22 oct 2026, A-A-B-A-A-B)
   ───────────────────────────────────────────────────────────────────
   Una sola pieza para las dos puertas:
   · Logística › Fumigación (Index.html): el supervisor ve el programa,
     agenda, mueve, anula y registra lo hecho.
   · Fumigacion.html: quien fumiga ve sus citas y registra lo hecho con
     la firma de quien recibe, en su celular.
   Calendario aparte (decisión 3·B). La constancia la ve Logística; al
   cliente le llega cuando estén el permiso, el producto y el código.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var FU = window.FU = { d: null, pin: '', cont: null, vista: 'prog', mes: '', alListo: null };
  var MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var MESL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function f(d) { if (!d) return '—'; var p = d.split('-'); return Number(p[2]) + ' ' + MES[Number(p[1]) - 1] + ' ' + p[0]; }
  function fc(d) { var x = new Date(d + 'T12:00:00'); return DIAS[x.getDay()].slice(0, 3) + ' ' + x.getDate() + ' ' + MES[x.getMonth()]; }
  function fl(d) { var x = new Date(d + 'T12:00:00'); return DIAS[x.getDay()] + ' ' + x.getDate() + ' de ' + MESL[x.getMonth()]; }
  function h12(h) { var m = /^(\d{2}):(\d{2})$/.exec(h || ''); if (!m) return h || ''; var x = +m[1], pm = x >= 12; x = x % 12 || 12; return x + ':' + m[2] + (pm ? ' p. m.' : ' a. m.'); }
  function mas(d, n) { var x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + n); return x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2); }
  function aviso(t) {
    var a = $('fu-aviso'); if (!a) { a = document.createElement('div'); a.id = 'fu-aviso'; a.className = 'fu-toast'; document.body.appendChild(a); }
    a.textContent = t; a.classList.add('ver'); clearTimeout(a._t); a._t = setTimeout(function () { a.classList.remove('ver'); }, 3500);
  }
  FU.aviso = aviso;
  function api(fn) {
    var a = [].slice.call(arguments, 1);
    return new Promise(function (ok, no) { var r = google.script.run.withSuccessHandler(ok).withFailureHandler(no); r[fn].apply(r, a); });
  }
  FU.api = api;

  /* ── estilos (los colores salen de las variables de tema.css) ── */
  var CSS = '.fu{font-family:Archivo,system-ui,sans-serif;color:var(--tm-tinta,#0f2140)}' +
    '.fu .fu-k{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0 0 14px}.fu .fu-k div{background:#fff;border:1px solid var(--tm-linea,#e1e6ee);border-radius:14px;padding:12px 14px}.fu .fu-k b{display:block;font-size:22px}.fu .fu-k span{font-size:12.5px;color:var(--tm-gris,#667489)}.fu .fu-k .w b{color:var(--tm-warn,#d99a00)}' +
    '.fu .fu-intro{color:var(--tm-gris,#667489);font-size:13.5px;margin:0 0 14px}' +
    '.fu .fu-card{background:#fff;border:1px solid var(--tm-linea,#e1e6ee);border-radius:14px;padding:14px 16px;margin-bottom:14px}' +
    '.fu h3{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--tm-gris,#667489);margin:0 0 8px;display:flex;align-items:center;gap:8px}.fu h3 .sp{flex:1}' +
    '.fu .fu-tabs{display:flex;gap:6px;margin:0 0 14px;flex-wrap:wrap}.fu .fu-tabs button{border:1px solid var(--tm-linea,#e1e6ee);background:#fff;border-radius:99px;padding:6px 13px;font:600 12.5px Archivo,sans-serif;color:var(--tm-navy2,#14306b);cursor:pointer}.fu .fu-tabs button.on{background:var(--tm-navy2,#14306b);color:#fff;border-color:var(--tm-navy2,#14306b)}' +
    '.fu .fu-fila{display:flex;gap:12px;align-items:center;padding:11px 0;border-top:1px solid #eef1f5;flex-wrap:wrap}.fu .fu-fila:first-of-type{border-top:0}.fu .fu-fila .tx{flex:1;min-width:200px}.fu .fu-fila .tx b{display:block;font-size:14px}.fu .fu-fila .tx small{display:block;color:var(--tm-gris,#667489);font-size:12.5px;margin-top:2px}.fu .fu-fila .acc{display:flex;gap:6px;flex-wrap:wrap}' +
    '.fu .fu-fe{width:48px;min-width:48px;text-align:center;border:1px solid var(--tm-linea,#e1e6ee);border-radius:10px;padding:5px 0;background:#fafbfd}.fu .fu-fe b{display:block;font-size:16px;line-height:1.15}.fu .fu-fe span{font-size:10px;letter-spacing:.6px;text-transform:uppercase;color:var(--tm-gris,#667489)}.fu .fu-fe.mo{background:#f3ecf8;border-color:#d9c3ea;color:var(--tm-morado,#6C3A96)}.fu .fu-fe.hoy{background:#fff4d6;border-color:#f0d58a}' +
    '.fu .fu-tag{display:inline-flex;align-items:center;font-size:11.5px;font-weight:700;border-radius:99px;padding:2px 9px;white-space:nowrap}.fu .t-ok{background:#eaf6e4;color:#2f9e44}.fu .t-warn{background:#fff4d6;color:#9a6e00}.fu .t-info{background:#e8effb;color:#3b6fd4}.fu .t-gris{background:#eef1f5;color:#667489}.fu .t-mo{background:#f3ecf8;color:#6C3A96}' +
    '.fu .fu-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--tm-linea,#e1e6ee);background:#fff;border-radius:9px;padding:7px 12px;font:600 12.5px Archivo,sans-serif;color:var(--tm-navy2,#14306b);cursor:pointer;white-space:nowrap}.fu .fu-btn.p{background:var(--tm-navy2,#14306b);border-color:var(--tm-navy2,#14306b);color:#fff}.fu .fu-btn.rj{color:var(--tm-bad,#d64045)}.fu .fu-btn[disabled]{opacity:.55;cursor:wait}' +
    '.fu table{width:100%;border-collapse:collapse;font-size:13px}.fu th{text-align:left;font-size:10.5px;letter-spacing:.6px;text-transform:uppercase;color:var(--tm-gris,#667489);padding:8px 10px;border-bottom:1px solid var(--tm-linea,#e1e6ee)}.fu td{padding:11px 10px;border-bottom:1px solid #eef1f5;vertical-align:top}.fu td small{display:block;color:var(--tm-gris,#667489);font-size:12px;margin-top:2px}.fu .fu-tw{overflow-x:auto}' +
    '.fu .fu-nota{background:var(--tm-fondo,#f3f5f8);border-radius:10px;padding:10px 12px;font-size:12.5px;color:#44516a;margin-top:10px}.fu .fu-vacio{color:var(--tm-gris,#667489);font-size:13.5px;padding:8px 0}' +
    '.fu-fondo{position:fixed;inset:0;background:rgba(15,33,64,.45);display:flex;align-items:flex-start;justify-content:center;padding:30px 12px;z-index:9000;overflow:auto}' +
    '.fu-modal{background:#fff;border-radius:16px;max-width:620px;width:100%;padding:20px 22px;box-shadow:0 20px 60px rgba(15,33,64,.3)}.fu-modal h2{margin:0 0 4px;font-size:19px;color:var(--tm-navy2,#14306b)}.fu-modal .sub{color:var(--tm-gris,#667489);font-size:13px;margin:0 0 14px}' +
    '.fu .fu-campo{display:grid;gap:5px;margin-bottom:12px}.fu .fu-campo label{font-size:11px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--tm-gris,#667489)}.fu .fu-campo input,.fu .fu-campo select,.fu .fu-campo textarea{border:1px solid #cdd5e1;border-radius:9px;padding:9px 11px;font:500 14px Archivo,sans-serif;color:var(--tm-tinta,#0f2140);background:#fff;width:100%;box-sizing:border-box}' +
    '.fu .fu-dos{display:grid;grid-template-columns:1fr 1fr;gap:12px}.fu .fu-pie{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap}' +
    '.fu .fu-av{border-radius:10px;padding:10px 12px;font-size:13px;margin:4px 0 12px}.fu .fu-av.am{background:#fff4d6;color:#5c4200}.fu .fu-av.in{background:#e8effb;color:#1d3f87}.fu .fu-av.mo{background:#f3ecf8;color:#4c2470}.fu .fu-av.rj{background:#fdecea;color:#7d1d16}' +
    '.fu .fu-chips{display:flex;gap:6px;flex-wrap:wrap}.fu .fu-chips button{border:1px solid #cdd5e1;border-radius:99px;padding:6px 12px;font:600 12.5px Archivo,sans-serif;background:#fff;color:var(--tm-tinta,#0f2140);cursor:pointer}.fu .fu-chips button.on{background:var(--tm-navy2,#14306b);color:#fff;border-color:var(--tm-navy2,#14306b)}' +
    '.fu .fu-firma{position:relative;border:1px dashed #b8c3d3;border-radius:10px;background:#fafbfd;touch-action:none}.fu .fu-firma canvas{display:block;width:100%;height:150px;border-radius:10px}.fu .fu-firma span{position:absolute;left:12px;bottom:8px;font-size:12px;color:#8a96a8;pointer-events:none}.fu .fu-firma button{position:absolute;right:8px;top:8px}' +
    '.fu .fu-err{color:var(--tm-bad,#d64045);font-size:13px;margin-top:6px;min-height:1px}' +
    '.fu .fu-cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;font-size:12px}.fu .fu-cal div{border:1px solid #eef1f5;border-radius:8px;min-height:64px;padding:5px;background:#fff;min-width:0}.fu .fu-cal .h{border:0;min-height:0;font-weight:700;color:var(--tm-gris,#667489);text-align:center;background:none}.fu .fu-cal .o{background:#f6f8fa}.fu .fu-cal .hoy{box-shadow:inset 0 0 0 2px #7e9bbf}' +
    '.fu .fu-cal i{display:block;font-style:normal;background:#f3ecf8;color:#4c2470;border-left:3px solid var(--tm-morado,#6C3A96);border-radius:4px;padding:2px 4px;margin-top:3px;font-size:10.5px;line-height:1.25;overflow-wrap:anywhere}.fu .fu-cal i.h2{background:#eaf6e4;color:#23653c;border-left-color:#2f9e44}' +
    '.fu .fu-calnav{display:flex;gap:8px;align-items:center;margin-bottom:10px}.fu .fu-calnav b{font-size:16px;min-width:150px;text-align:center}' +
    '.fu-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:9100;background:#14202e;color:#fff;font:600 13px Archivo,sans-serif;padding:10px 16px;border-radius:10px;opacity:0;pointer-events:none;transition:opacity .25s;max-width:90vw}.fu-toast.ver{opacity:1}' +
    '@media(max-width:700px){.fu .fu-k{grid-template-columns:repeat(2,minmax(0,1fr))}.fu .fu-dos{grid-template-columns:1fr}.fu .fu-cal{font-size:11px}.fu .fu-cal div{min-height:52px;padding:3px}}';
  if (!$('fu-css')) { var st = document.createElement('style'); st.id = 'fu-css'; st.textContent = CSS; document.head.appendChild(st); }

  /* ── cargar y pintar ── */
  FU.iniciar = function (cont, op) {
    op = op || {}; FU.cont = cont; FU.pin = op.pin || FU.pin; FU.alListo = op.alListo || FU.alListo;
    if (!FU.d) cont.innerHTML = '<div class="fu"><div class="fu-vacio">Cargando fumigaciones…</div></div>';
    return FU.cargar();
  };
  FU.cargar = function () {
    return api('api_fumInicio', FU.pin).then(function (r) {
      if (!r || !r.ok) { if (FU.cont) FU.cont.innerHTML = '<div class="fu"><div class="fu-av rj">' + esc((r && r.error) || 'No se pudo cargar.') + '</div></div>'; return r; }
      FU.d = r; if (!FU.mes) FU.mes = r.hoy.slice(0, 7);
      if (r.rol === 'fumigacion' && FU.vista === 'prog') FU.vista = 'mias';
      FU.pintar(); if (FU.alListo) FU.alListo(r); return r;
    }, function () { if (FU.cont && !FU.d) FU.cont.innerHTML = '<div class="fu"><div class="fu-av rj">Sin conexión. Intente de nuevo.</div></div>'; });
  };
  FU.ir = function (v) { FU.vista = v; FU.pintar(); };
  FU.pintar = function () {
    var D = FU.d, c = FU.cont; if (!D || !c) return;
    var quien = D.rol === 'fumigacion', P = D.programa || [], toca = P.filter(function (p) { return p.estado === 'toca'; });
    var mesH = D.hechas.filter(function (x) { return x.hechaEl.slice(0, 7) === D.hoy.slice(0, 7); }).length;
    var h = '<div class="fu">';
    if (quien) {
      var hoyC = D.citas.filter(function (x) { return x.fecha <= D.hoy; });
      h += '<div class="fu-k"><div class="' + (hoyC.length ? 'w' : '') + '"><b>' + hoyC.length + '</b><span>para hoy</span></div><div><b>' + D.citas.length + '</b><span>citas agendadas</span></div><div><b>' + mesH + '</b><span>hechas este mes</span></div><div><b>' + esc(D.yo.split(' ')[0]) + '</b><span>su equipo</span></div></div>';
      h += tabs([['mias', 'Mis citas'], ['hechas', 'Hechas']]);
    } else {
      h += '<p class="fu-intro">Los clientes que tienen fumigación en su plan, cuándo les toca, sus citas y lo que ya se hizo.</p>' +
        '<div class="fu-k"><div><b>' + P.length + '</b><span>clientes con fumigación</span></div><div class="' + (toca.length ? 'w' : '') + '"><b>' + toca.length + '</b><span>les toca y no tienen cita</span></div><div><b>' + D.citas.length + '</b><span>citas agendadas</span></div><div><b>' + mesH + '</b><span>hecha' + (mesH === 1 ? '' : 's') + ' este mes</span></div></div>';
      h += tabs([['prog', 'Programa'], ['cli', 'Clientes'], ['hechas', 'Hechas'], ['cal', 'Calendario de fumigación']]);
    }
    var v = FU.vista;
    if (v === 'cli' && !quien) h += vClientes();
    else if (v === 'hechas') h += vHechas();
    else if (v === 'cal' && !quien) h += vCal();
    else if (quien) h += vMias();
    else h += vPrograma();
    c.innerHTML = h + '</div>';
  };
  function tabs(L) { return '<div class="fu-tabs">' + L.map(function (x) { return '<button class="' + (FU.vista === x[0] ? 'on' : '') + '" onclick="FU.ir(\'' + x[0] + '\')">' + x[1] + '</button>'; }).join('') + '</div>'; }
  function fe(d, cl) { return '<div class="fu-fe ' + (cl || '') + '"><b>' + Number(d.slice(8)) + '</b><span>' + MES[Number(d.slice(5, 7)) - 1] + '</span></div>'; }
  function estTag(p) { return p.estado === 'agendada' ? '<span class="fu-tag t-mo">Agendada</span>' : p.estado === 'toca' ? '<span class="fu-tag t-warn">Le toca</span>' : '<span class="fu-tag t-gris">Al día</span>'; }
  function citaTx(x) { return fc(x.fecha) + ' · ' + h12(x.hora) + ' · ' + esc(x.personas.join(' y ')) + (x.nota ? ' · «' + esc(x.nota) + '»' : ''); }
  function vPrograma() {
    var D = FU.d, toca = D.programa.filter(function (p) { return p.estado === 'toca'; }), sol = D.solicitudes || [], g = D.gestiona;
    var h = '';
    if (sol.length) h += '<div class="fu-card"><h3>Las pidieron desde su portal<span class="sp"></span><span class="fu-tag t-info">' + sol.length + '</span></h3>' + sol.map(function (s) {
      return '<div class="fu-fila"><div class="fu-fe"><b>' + (s.fechaPref ? Number(s.fechaPref.slice(8)) : '—') + '</b><span>' + (s.fechaPref ? MES[Number(s.fechaPref.slice(5, 7)) - 1] : 'fecha') + '</span></div><div class="tx"><b>' + esc(s.cliente) + '</b><small>' + (s.fechaPref ? 'Prefiere el ' + fc(s.fechaPref) : 'Sin fecha preferida') + (s.horario ? ', ' + esc(s.horario) : '') + (s.nota ? ' · «' + esc(s.nota) + '»' : '') + ' · ' + esc(s.folio) + '</small></div>' +
        (g ? '<div class="acc">' + (s.tieneFum ? '<button class="fu-btn p" onclick="FU.agendarSol(\'' + esc(s.pendienteId) + '\')">Agendar</button>' : '<button class="fu-btn" onclick="FU.aMercadeo(\'' + esc(s.pendienteId) + '\')">No la tiene en su plan · Pasar a Mercadeo</button>') + '</div>' : '') + '</div>'; }).join('') + '</div>';
    h += '<div class="fu-card"><h3>Les toca y no tienen cita<span class="sp"></span><span class="fu-tag t-warn">' + toca.length + '</span></h3>' +
      (toca.length ? toca.map(function (p) {
        return '<div class="fu-fila">' + (p.tocaEl ? fe(p.tocaEl) : '<div class="fu-fe"><b>1.ª</b><span>vez</span></div>') + '<div class="tx"><b>' + esc(p.cliente) + '</b><small>' + esc(p.frec) + ' · ' + (p.ultima ? 'última ' + f(p.ultima) + ' · le toca ' + (p.tocaEl < D.hoy ? 'desde el ' : 'el ') + fc(p.tocaEl) : 'primera fumigación') + '</small></div>' +
          (g ? '<div class="acc"><button class="fu-btn p" onclick="FU.agendar(\'' + esc(p.clienteId) + '\')">Agendar</button></div>' : '') + '</div>'; }).join('') : '<div class="fu-vacio">Nadie pendiente: todos tienen su cita o están al día.</div>') + '</div>';
    h += '<div class="fu-card"><h3>Agendadas<span class="sp"></span><span class="fu-tag t-mo">' + D.citas.length + '</span></h3>' + (D.citas.length ? D.citas.map(filaCita).join('') : '<div class="fu-vacio">No hay citas agendadas.</div>') + '</div>';
    if (!D.personas.length && g) h += '<div class="fu-av am">Todavía no hay nadie con el rol «Fumigación». Créelo en Configuración › Usuarios para poder agendar.</div>';
    return h;
  }
  function filaCita(x) {
    var D = FU.d, g = D.gestiona, mia = D.rol === 'fumigacion';
    return '<div class="fu-fila">' + fe(x.fecha, x.fecha <= D.hoy ? 'hoy' : 'mo') + '<div class="tx"><b>' + esc(x.cliente) + (x.fecha < D.hoy ? ' <span class="fu-tag t-warn">pendiente de registrar</span>' : '') + '</b><small>' + citaTx(x) + '</small></div><div class="acc">' +
      (g ? '<button class="fu-btn" onclick="FU.mover(\'' + esc(x.fumId) + '\')">Mover</button><button class="fu-btn rj" onclick="FU.anular(\'' + esc(x.fumId) + '\')">Anular</button>' : '') +
      (g || mia ? '<button class="fu-btn p" onclick="FU.hecha(\'' + esc(x.fumId) + '\')">Registrar hecha</button>' : '') + '</div></div>';
  }
  function vMias() {
    var D = FU.d, hoy = D.citas.filter(function (x) { return x.fecha <= D.hoy; }), prox = D.citas.filter(function (x) { return x.fecha > D.hoy; });
    return '<div class="fu-card"><h3>Hoy</h3>' + (hoy.length ? hoy.map(filaCita).join('') : '<div class="fu-vacio">No tiene fumigaciones para hoy.</div>') + '</div>' +
      '<div class="fu-card"><h3>Próximas</h3>' + (prox.length ? prox.map(filaCita).join('') : '<div class="fu-vacio">No tiene más citas agendadas.</div>') + '</div>';
  }
  function vClientes() {
    var D = FU.d;
    return '<div class="fu-card"><h3>Clientes con fumigación en su plan<span class="sp"></span><small style="text-transform:none;letter-spacing:0;font-weight:500">Sale de lo que Mercadeo pone en la propuesta</small></h3><div class="fu-tw"><table><thead><tr><th>Cliente</th><th>Frecuencia</th><th>Última</th><th>Próxima</th><th>Estado</th><th></th></tr></thead><tbody>' +
      (D.programa.length ? D.programa.map(function (p) {
        return '<tr><td><b>' + esc(p.cliente) + '</b><small>' + esc(p.direccion) + '</small></td><td>' + esc(p.frec) + '</td><td>' + f(p.ultima) + '</td><td>' + (p.proxima ? fc(p.proxima.fecha) + '<small>' + h12(p.proxima.hora) + '</small>' : p.tocaEl ? 'le toca ' + fc(p.tocaEl) : 'por agendar') + '</td><td>' + estTag(p) + '</td><td>' +
          (D.gestiona && !p.proxima ? '<button class="fu-btn p" onclick="FU.agendar(\'' + esc(p.clienteId) + '\')">Agendar</button>' : '') + '</td></tr>'; }).join('') : '<tr><td colspan="6" class="fu-vacio">Ningún cliente tiene fumigación en su plan. La agrega Mercadeo en la propuesta (lo que se lleva en cada visita).</td></tr>') + '</tbody></table></div></div>';
  }
  function vHechas() {
    var D = FU.d;
    return '<div class="fu-card"><h3>Hechas · últimos 90 días</h3>' + (D.hechas.length ? D.hechas.map(function (x) {
      return '<div class="fu-fila">' + fe(x.hechaEl, 'mo') + '<div class="tx"><b>' + esc(x.cliente) + '</b><small>' + h12(x.horaIni) + ' a ' + h12(x.horaFin) + ' · ' + esc(x.hicieron.join(' y ')) + ' · recibió ' + esc(x.recibe) + '</small></div><div class="acc"><button class="fu-btn" onclick="FU.constancia(\'' + esc(x.fumId) + '\')">Constancia ' + esc(x.constancia) + '</button></div></div>'; }).join('') : '<div class="fu-vacio">Todavía no hay fumigaciones registradas.</div>') + '</div>';
  }
  function vCal() {
    var D = FU.d, ym = FU.mes, p = ym.split('-'), y = +p[0], m = +p[1] - 1, pri = new Date(y, m, 1, 12), off = (pri.getDay() + 6) % 7, ult = new Date(y, m + 1, 0).getDate();
    var ev = {};
    D.citas.forEach(function (x) { (ev[x.fecha] = ev[x.fecha] || []).push('<i>' + esc(x.cliente) + ' · ' + h12(x.hora) + '</i>'); });
    D.hechas.forEach(function (x) { (ev[x.hechaEl] = ev[x.hechaEl] || []).push('<i class="h2">' + esc(x.cliente) + ' · hecha</i>'); });
    var c = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(function (d) { return '<div class="h">' + d + '</div>'; }).join('');
    for (var b = 0; b < off; b++) c += '<div class="o"></div>';
    for (var d = 1; d <= ult; d++) { var k = ym + '-' + ('0' + d).slice(-2); c += '<div class="' + (k === D.hoy ? 'hoy' : '') + '"><b>' + d + '</b>' + (ev[k] || []).join('') + '</div>'; }
    while ((off + ult) % 7) { c += '<div class="o"></div>'; ult++; }
    return '<div class="fu-card"><div class="fu-calnav"><button class="fu-btn" onclick="FU.calMes(-1)">‹</button><b>' + MESL[m].charAt(0).toUpperCase() + MESL[m].slice(1) + ' ' + y + '</b><button class="fu-btn" onclick="FU.calMes(1)">›</button><button class="fu-btn" onclick="FU.mes=FU.d.hoy.slice(0,7);FU.pintar()">Hoy</button></div><div class="fu-cal">' + c + '</div>' +
      '<div class="fu-nota">Morado: agendadas · verde: hechas. Es el calendario de fumigación; el Calendario de Logística queda solo para las rutas.</div></div>';
  }
  FU.calMes = function (n) { var p = FU.mes.split('-'), d = new Date(+p[0], +p[1] - 1 + n, 1); FU.mes = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2); FU.pintar(); };

  /* ── ventanas ── */
  function modal(html) { cerrar(); var d = document.createElement('div'); d.className = 'fu fu-fondo'; d.id = 'fu-modal'; d.innerHTML = '<div class="fu-modal" role="dialog" aria-modal="true">' + html + '</div>'; d.onclick = function (e) { if (e.target === d) cerrar(); }; document.body.appendChild(d); return d; }
  function cerrar() { var d = $('fu-modal'); if (d) d.remove(); }
  FU.cerrar = cerrar;
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('fu-modal')) cerrar(); });
  function chips(id, L, sel) { return '<div class="fu-chips" id="' + id + '">' + L.map(function (x) { return '<button type="button" class="' + (sel.indexOf(x) >= 0 ? 'on' : '') + '" onclick="this.classList.toggle(\'on\')">' + esc(x) + '</button>'; }).join('') + '</div>'; }
  function chipsSel(id) { return [].map.call(document.querySelectorAll('#' + id + ' button.on'), function (b) { return b.textContent; }); }
  function ocupado(b, si, t) { if (!b) return; if (si) { b._t = b.textContent; b.disabled = true; b.textContent = t || 'Guardando…'; } else { b.disabled = false; if (b._t) b.textContent = b._t; } }

  /* Agendar · mover · desde una solicitud del portal */
  function formAgendar(o) {
    var D = FU.d, P = D.programa, cli = o.clienteId ? P.filter(function (p) { return p.clienteId === o.clienteId; })[0] : null;
    var fecha = o.fecha || (cli && cli.tocaEl && cli.tocaEl > D.hoy ? cli.tocaEl : D.hoy), hora = o.hora || '08:00', per = o.personas || (D.personas.length === 1 ? D.personas : []);
    var h = '<h2>' + (o.fumId ? 'Mover la cita' : 'Agendar una fumigación') + '</h2><p class="sub">' + (cli ? esc(cli.cliente) + ' · ' + esc(cli.frec) + (cli.ultima ? ' · última ' + f(cli.ultima) : ' · primera fumigación') : 'Elija el cliente') + (o.sol ? ' · la pidió desde su portal (' + esc(o.sol.folio) + ')' : '') + '</p>';
    if (o.sol) h += '<div class="fu-av in"><b>Lo que pidió:</b> ' + (o.sol.fechaPref ? 'prefiere el ' + fc(o.sol.fechaPref) : 'sin fecha preferida') + (o.sol.horario ? ', ' + esc(o.sol.horario) : '') + (o.sol.nota ? ' — «' + esc(o.sol.nota) + '»' : '') + '</div>';
    if (!o.clienteId) h += '<div class="fu-campo"><label for="fa-c">Cliente</label><select id="fa-c">' + P.map(function (p) { return '<option value="' + esc(p.clienteId) + '">' + esc(p.cliente) + ' · ' + esc(p.frec) + '</option>'; }).join('') + '</select></div>';
    h += '<div class="fu-dos"><div class="fu-campo"><label for="fa-f">Fecha</label><input id="fa-f" type="date" min="' + D.hoy + '" value="' + esc(fecha) + '"></div><div class="fu-campo"><label for="fa-h">Hora</label><input id="fa-h" type="time" value="' + esc(hora) + '"></div></div>' +
      '<div class="fu-campo"><label>Quién va</label>' + (D.personas.length ? chips('fa-p', D.personas, per) : '<div class="fu-av am" style="margin:0">Nadie tiene el rol «Fumigación» todavía (Configuración › Usuarios).</div>') + '</div>' +
      '<div class="fu-campo"><label for="fa-n">Nota para el equipo</label><textarea id="fa-n" rows="2" maxlength="300" placeholder="Ej. Entrar por la puerta de atrás">' + esc(o.nota || '') + '</textarea></div>' +
      (o.sol ? '<div class="fu-av mo">El cliente ve en su portal: «Su fumigación quedó para el <span id="fa-pv"></span>» y su solicitud queda atendida.</div>' : '') +
      '<div class="fu-err" id="fa-e"></div><div class="fu-pie"><button class="fu-btn" onclick="FU.cerrar()">Cancelar</button><button class="fu-btn p" id="fa-ok">' + (o.fumId ? 'Mover' : 'Agendar') + '</button></div>';
    modal(h);
    function pv() { var e = $('fa-pv'), fe2 = $('fa-f').value, ho = $('fa-h').value; if (e) e.textContent = (fe2 ? fl(fe2) : '…') + ', a las ' + (ho ? h12(ho) : '…') + '.'; }
    $('fa-f').oninput = pv; $('fa-h').oninput = pv; pv();
    $('fa-ok').onclick = function () {
      var b = this, cid = o.clienteId || ($('fa-c') || {}).value, d = { fumId: o.fumId || '', clienteId: cid, fecha: $('fa-f').value, hora: $('fa-h').value, personas: chipsSel('fa-p'), nota: $('fa-n').value, pendienteId: o.sol ? o.sol.pendienteId : '', folioSol: o.sol ? o.sol.folio : '' };
      if (!d.fecha || !d.hora) { $('fa-e').textContent = 'Elija la fecha y la hora.'; return; }
      if (!d.personas.length) { $('fa-e').textContent = 'Elija quién va.'; return; }
      ocupado(b, true);
      api('api_guardarFumigacion', FU.pin, d).then(function (r) {
        ocupado(b, false);
        if (!r || !r.ok) { $('fa-e').textContent = (r && r.error) || 'No se pudo guardar.'; return; }
        cerrar(); aviso(r.movida ? 'Cita movida' : r.respondida ? 'Agendada · el cliente ya ve la fecha en su portal' : 'Fumigación agendada'); FU.cargar();
        if (o.alGuardar) o.alGuardar(r);
      }, function () { ocupado(b, false); $('fa-e').textContent = 'Sin conexión: no se guardó.'; });
    };
  }
  FU.agendar = function (cid) { formAgendar({ clienteId: cid }); };
  FU.mover = function (id) { var x = FU.d.citas.filter(function (c) { return c.fumId === id; })[0]; if (x) formAgendar({ fumId: id, clienteId: x.clienteId, fecha: x.fecha, hora: x.hora, personas: x.personas, nota: x.nota }); };
  FU.agendarSol = function (pid, alGuardar) {
    function abrir() { var s = (FU.d.solicitudes || []).filter(function (x) { return x.pendienteId === pid; })[0]; if (!s) { aviso('Esa solicitud ya se atendió.'); return; } formAgendar({ clienteId: s.clienteId, sol: s, fecha: s.fechaPref && s.fechaPref >= FU.d.hoy ? s.fechaPref : '', alGuardar: alGuardar }); }
    /* siempre con los datos al día: la solicitud pudo llegar después de abrir Fumigación */
    api('api_fumInicio', FU.pin).then(function (r) { if (r && r.ok) { FU.d = r; if (!FU.mes) FU.mes = r.hoy.slice(0, 7); abrir(); } else aviso((r && r.error) || 'No se pudo abrir.'); }, function () { aviso('Sin conexión.'); });
  };
  FU.aMercadeo = function (pid, alGuardar) {
    modal('<h2>Pasar a Mercadeo</h2><p class="sub">Este cliente no tiene fumigación en su plan. Mercadeo le cotiza el servicio; si lo acepta, entra a su plan.</p><div class="fu-err" id="fm-e"></div><div class="fu-pie"><button class="fu-btn" onclick="FU.cerrar()">Cancelar</button><button class="fu-btn p" id="fm-ok">Pasar a Mercadeo</button></div>');
    $('fm-ok').onclick = function () { var b = this; ocupado(b, true);
      api('api_moverFumigacionAMercadeo', FU.pin, pid).then(function (r) { ocupado(b, false); if (!r || !r.ok) { $('fm-e').textContent = (r && r.error) || 'No se pudo.'; return; } cerrar(); aviso('Listo: lo ve Mercadeo para cotizarlo'); if (FU.cont) FU.cargar(); if (alGuardar) alGuardar(r); },
        function () { ocupado(b, false); $('fm-e').textContent = 'Sin conexión.'; }); };
  };
  FU.anular = function (id) {
    var x = FU.d.citas.filter(function (c) { return c.fumId === id; })[0]; if (!x) return;
    modal('<h2>Anular la cita</h2><p class="sub">' + esc(x.cliente) + ' · ' + citaTx(x) + '</p><div class="fu-campo"><label for="fn-m">Por qué se anula</label><input id="fn-m" maxlength="200" placeholder="Ej. El cliente pidió otra semana"></div><div class="fu-err" id="fn-e"></div><div class="fu-pie"><button class="fu-btn" onclick="FU.cerrar()">Volver</button><button class="fu-btn p" id="fn-ok">Anular la cita</button></div>');
    $('fn-ok').onclick = function () { var b = this, m = $('fn-m').value.trim(); if (m.length < 3) { $('fn-e').textContent = 'Escriba por qué se anula.'; return; } ocupado(b, true);
      api('api_anularFumigacion', FU.pin, id, m).then(function (r) { ocupado(b, false); if (!r || !r.ok) { $('fn-e').textContent = (r && r.error) || 'No se pudo.'; return; } cerrar(); aviso('Cita anulada'); FU.cargar(); }, function () { ocupado(b, false); $('fn-e').textContent = 'Sin conexión.'; }); };
  };

  /* Registrar la fumigación hecha, con la firma de quien recibe */
  FU.hecha = function (id) {
    var D = FU.d, x = D.citas.filter(function (c) { return c.fumId === id; })[0]; if (!x) return;
    modal('<h2>Registrar la fumigación hecha</h2><p class="sub">' + esc(x.cliente) + ' · cita del ' + fc(x.fecha) + ', ' + h12(x.hora) + '</p>' +
      '<div class="fu-dos"><div class="fu-campo"><label for="fh-f">Hecha el</label><input id="fh-f" type="date" max="' + D.hoy + '" value="' + (x.fecha <= D.hoy ? x.fecha : D.hoy) + '"></div><div class="fu-dos"><div class="fu-campo"><label for="fh-i">Desde</label><input id="fh-i" type="time" value="' + esc(x.hora) + '"></div><div class="fu-campo"><label for="fh-h">Hasta</label><input id="fh-h" type="time"></div></div></div>' +
      '<div class="fu-campo"><label>La hicieron</label>' + chips('fh-q', D.personas, x.personas) + '</div>' +
      '<div class="fu-campo"><label>Áreas tratadas</label>' + chips('fh-a', D.areas, []) + '</div>' +
      '<div class="fu-campo"><label for="fh-p">Producto usado</label><input id="fh-p" maxlength="120" placeholder="Nombre y registro (según los protocolos)"></div>' +
      '<div class="fu-campo"><label for="fh-o">Observaciones</label><textarea id="fh-o" rows="2" maxlength="400" placeholder="Ej. Ventilar 2 horas antes de usar las áreas"></textarea></div>' +
      '<div class="fu-campo"><label for="fh-r">Recibe en el local (nombre)</label><input id="fh-r" maxlength="90"></div>' +
      '<div class="fu-campo"><label>Firma de quien recibe</label><div class="fu-firma"><canvas id="fh-c"></canvas><span id="fh-cs">Firme aquí con el dedo</span><button type="button" class="fu-btn" id="fh-cb">Borrar</button></div></div>' +
      (D.constanciaCliente ? '' : '<div class="fu-av mo">Al guardar sale la constancia de fumigación. Por ahora la ve Logística; al cliente le llegará cuando estén el permiso y el producto.</div>') +
      '<div class="fu-err" id="fh-e"></div><div class="fu-pie"><button class="fu-btn" onclick="FU.cerrar()">Cancelar</button><button class="fu-btn p" id="fh-ok">Guardar</button></div>');
    var cv = $('fh-c'), ctx, raya = false, hay = false;
    function ajustar() { var r = cv.getBoundingClientRect(), k = window.devicePixelRatio || 1; cv.width = r.width * k; cv.height = r.height * k; ctx = cv.getContext('2d'); ctx.scale(k, k); ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0f2140'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, r.width, r.height); hay = false; $('fh-cs').style.display = ''; }
    function pt(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    setTimeout(ajustar, 30);
    cv.onpointerdown = function (e) { raya = true; cv.setPointerCapture(e.pointerId); var p = pt(e); ctx.beginPath(); ctx.moveTo(p[0], p[1]); };
    cv.onpointermove = function (e) { if (!raya) return; var p = pt(e); ctx.lineTo(p[0], p[1]); ctx.stroke(); if (!hay) { hay = true; $('fh-cs').style.display = 'none'; } };
    cv.onpointerup = cv.onpointercancel = function () { raya = false; };
    $('fh-cb').onclick = ajustar;
    $('fh-ok').onclick = function () {
      var b = this, d = { hechaEl: $('fh-f').value, horaIni: $('fh-i').value, horaFin: $('fh-h').value, hicieron: chipsSel('fh-q'), areas: chipsSel('fh-a'), producto: $('fh-p').value, observaciones: $('fh-o').value, recibe: $('fh-r').value.trim(), firma: '' }, e = $('fh-e');
      if (!d.horaIni || !d.horaFin) { e.textContent = 'Escriba la hora de inicio y de fin.'; return; }
      if (!d.hicieron.length) { e.textContent = 'Marque quién la hizo.'; return; }
      if (!d.areas.length) { e.textContent = 'Marque las áreas tratadas.'; return; }
      if (d.recibe.length < 3) { e.textContent = 'Escriba el nombre de quien recibe.'; return; }
      if (!hay) { e.textContent = 'Falta la firma de quien recibe.'; return; }
      d.firma = cv.toDataURL('image/jpeg', .6);
      ocupado(b, true);
      api('api_registrarFumigacion', FU.pin, id, d).then(function (r) {
        ocupado(b, false); if (!r || !r.ok) { e.textContent = (r && r.error) || 'No se pudo guardar.'; return; }
        cerrar(); aviso('Registrada · constancia ' + r.constancia); FU.vista = FU.d.rol === 'fumigacion' ? 'mias' : FU.vista; FU.cargar();
      }, function () { ocupado(b, false); e.textContent = 'Sin conexión: no se guardó. Intente de nuevo cuando tenga señal.'; });
    };
  };

  /* La constancia de fumigación (hoja carta, para ver e imprimir) */
  FU.constancia = function (id) {
    var w = window.open('', '_blank'); if (w) { try { w.document.write('<title>Abriendo…</title><p style="font:14px Archivo,sans-serif;color:#667489;padding:24px">Abriendo la constancia…</p>'); } catch (e) {} }
    api('api_fumConstancia', FU.pin, id).then(function (r) {
      if (!r || !r.ok) { if (w) w.close(); aviso((r && r.error) || 'No se pudo abrir.'); return; }
      var html = FU.constanciaHTML(r);
      if (w) { w.document.open(); w.document.write(html); w.document.close(); } else { var u = URL.createObjectURL(new Blob([html], { type: 'text/html' })); location.href = u; }
    }, function () { if (w) w.close(); aviso('Sin conexión.'); });
  };
  FU.constanciaHTML = function (r) {
    var e = r.empresa || {}, base = location.href.replace(/[^\/]*$/, ''), pend = function (t) { return '<span class="pend">' + esc(t) + '</span>'; };
    var pr = r.proxima ? MESL[Number(r.proxima.slice(5, 7)) - 1] + ' de ' + r.proxima.slice(0, 4) : '';
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Constancia de fumigación ' + esc(r.folio) + '</title>' +
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&display=swap"><style>' +
      '@page{size:letter;margin:.25in}body{margin:0;background:#e9edf3;font-family:Archivo,Arial,sans-serif;color:#0f2140;-webkit-print-color-adjust:exact;print-color-adjust:exact}.barra{max-width:8.5in;margin:14px auto 0;display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:12.5px}.barra button{border:0;background:#14306b;color:#fff;border-radius:9px;padding:8px 14px;font:600 13px Archivo,sans-serif;cursor:pointer}.barra span{background:#fff4d6;color:#5c4200;border-radius:8px;padding:7px 10px;flex:1}' +
      '.hoja{width:8.5in;max-width:100%;min-height:10.5in;margin:12px auto 24px;background:#fff;box-shadow:0 8px 30px rgba(15,33,64,.15);padding:.45in .5in;box-sizing:border-box}' +
      '.mb{display:flex;align-items:center;gap:16px;border-bottom:3px solid #0f2a57;padding-bottom:12px;flex-wrap:wrap}.mb img{width:70px}.mb .em b{display:block;font-size:22px;letter-spacing:2px;color:#0f2a57}.mb .em span{font-size:11px;color:#667489;display:block;line-height:1.5}.mb .rec{margin-left:auto;border:1px solid #e1e6ee;border-radius:10px;padding:10px 14px;text-align:right}.mb .rec b{display:block;color:#14306b;font-size:15px;letter-spacing:.5px}.mb .rec span{font-size:11px;color:#667489;display:block}' +
      '.fr{background:#f3f5f8;font-size:10.5px;color:#44516a;padding:6px 10px;margin:8px 0 18px;border-radius:6px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}h1{font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:#14306b;margin:18px 0 8px}' +
      '.g{display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;font-size:13px}.g small{display:block;font-size:10.5px;letter-spacing:.6px;text-transform:uppercase;color:#667489}.g b{font-size:13.5px}.txt{font-size:13px;line-height:1.6}.pend{background:#fff4d6;color:#5c4200;border-radius:6px;padding:1px 6px;font-size:12px}' +
      '.fir{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:34px;font-size:12px;text-align:center;align-items:end}.fir img{max-height:80px;max-width:100%;display:block;margin:0 auto 4px}.fir div>div{border-top:1px solid #0f2140;padding-top:6px}.franja{height:8px;margin-top:34px;background:linear-gradient(90deg,#0C5395 0 50%,#00782E 50% 78%,#86B62C 78% 100%)}' +
      '@media print{body{background:#fff}.barra{display:none}.hoja{box-shadow:none;margin:0;zoom:.94}}</style></head><body>' +
      '<div class="barra"><button onclick="print()">Imprimir</button>' + (r.paraCliente ? '' : '<span>Documento interno de Logística: todavía no se entrega al cliente. Lo marcado en amarillo se completa con los protocolos y permisos de fumigación.</span>') + '</div>' +
      '<div class="hoja"><div class="mb"><img src="' + base + 'logo-ecovsa.png" alt="ECOVSA"><div class="em"><b>' + esc(e.comercial || 'ECOVSA') + '</b><span>' + esc(e.razonSocial || '') + ' · RUC ' + esc(e.ruc || '') + (e.dv ? ' DV ' + esc(e.dv) : '') + '</span><span>' + esc(e.direccion || '') + '</span></div>' +
      '<div class="rec"><b>CONSTANCIA DE FUMIGACIÓN</b><span>N.° ' + esc(r.folio) + ' · ' + fl(r.hechaEl) + ' de ' + r.hechaEl.slice(0, 4) + '</span></div></div>' +
      '<div class="fr"><span>' + esc(e.resolucion || 'Empresa registrada ante el Ministerio de Salud') + ' · ' + pend('permiso de fumigación: por definir') + '</span><span>' + (e.formulario ? esc(e.formulario) : pend('código: lo asigna Calidad')) + '</span></div>' +
      '<h1>Establecimiento</h1><div class="g"><div><small>Cliente</small><b>' + esc(r.cliente) + '</b></div><div><small>Dirección</small><b>' + esc(r.direccion || '—') + '</b></div></div>' +
      '<h1>Servicio</h1><div class="g"><div><small>Fecha y hora</small><b>' + fl(r.hechaEl).replace(/^./, function (c) { return c.toUpperCase(); }) + ' de ' + r.hechaEl.slice(0, 4) + ' · ' + h12(r.horaIni) + ' a ' + h12(r.horaFin) + '</b></div><div><small>Realizado por</small><b>' + esc(r.hicieron.join(' y ')) + ' · ECOVSA</b></div>' +
      '<div><small>Áreas tratadas</small><b>' + esc(r.areas.join(', ')) + '</b></div><div><small>Producto y registro</small><b>' + (r.producto ? esc(r.producto) : pend('por definir con los protocolos')) + '</b></div>' +
      '<div><small>Indicaciones</small><b>' + esc(r.observaciones || '—') + '</b></div><div><small>Próxima fumigación</small><b>' + (pr ? esc(pr) + (r.frec ? ' · ' + esc(r.frec.toLowerCase()) : '') : '—') + '</b></div></div>' +
      '<p class="txt" style="margin-top:18px">Se deja constancia de que el servicio de fumigación y control de plagas se realizó en el establecimiento indicado, en la fecha y las áreas descritas.</p>' +
      '<div class="fir"><div><div>Responsable del servicio · ECOVSA</div></div><div>' + (r.firma ? '<img src="' + r.firma + '" alt="Firma">' : '') + '<div>Recibido por ' + esc(r.recibe) + '</div></div></div><div class="franja"></div></div></body></html>';
  };
})();
