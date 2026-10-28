/* Hoja de vida del vehículo: datos para la hoja impresa y descarga en Word.
   api 3.60 · usa docx-mini.js. Recibe lo que entrega api_fichaCamion (F) y el resumen del camión de Flota (c: odometro, conductor). */
(function () {
var D = window.DOCXMINI, NAVY = '0F2A57', GRIS = '5E6B7E', AZUL = 'E8EFFB', CLARO = 'F1F5FB', LIN = '9FB0C8', ANCHO = 10940;
var COD = 'F-LOG-09 (por confirmar) · VERSIÓN 1 / MAY-26';
var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function mesTxt(m) { m = String(m || ''); var n = Number(m.slice(5, 7)); return n ? MESES[n - 1].charAt(0).toUpperCase() + MESES[n - 1].slice(1) + ' ' + m.slice(0, 4) : m; }
function fch(iso) { iso = String(iso || ''); return /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : ''; }
function fchLarga(iso) { iso = String(iso || ''); return /^\d{4}-\d{2}-\d{2}/.test(iso) ? Number(iso.slice(8, 10)) + ' de ' + MESES[Number(iso.slice(5, 7)) - 1] + ' de ' + iso.slice(0, 4) : ''; }
function nm(n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function bs(n) { return 'B/. ' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function esDoc(t) { return !t.cadaKm && /seguro|p[oó]liza|revisado|permiso|registro|licencia|documento|placa|inspecci[oó]n vehicular/i.test(String(t.tarea || '')); }
function estadoPlan(t) {
  if (t.faltanKm !== null && t.faltanKm !== undefined) return t.faltanKm < 0 ? 'Pasado ' + nm(-t.faltanKm) + ' km' : 'Faltan ' + nm(t.faltanKm) + ' km';
  if (t.faltanDias !== null && t.faltanDias !== undefined) return t.faltanDias < 0 ? 'Vencido hace ' + (-t.faltanDias) + ' días' : 'Faltan ' + t.faltanDias + ' días';
  return 'Sin datos';
}
/* todo lo que lleva la hoja, ya en texto */
function datos(F, c) {
  c = c || {}; var A = F.activo || {}, H = F.hv || {}, hoy = F.hoy, anio = String(hoy).slice(0, 4);
  var cierre = {}; (H.eventos || []).forEach(function (e) { if (e.titulo === 'Falla resuelta' && !cierre[e.detalle]) cierre[e.detalle] = e.fecha; });
  var serv = (A.servicios || []).slice(0, 12), totAnio = (A.servicios || []).filter(function (s) { return String(s.fecha).slice(0, 4) === anio; }).reduce(function (a, s) { return a + (Number(s.costo) || 0); }, 0);
  var desde = new Date(hoy + 'T12:00:00Z'); desde.setUTCFullYear(desde.getUTCFullYear() - 1); var d1 = desde.toISOString().slice(0, 10);
  return {
    placa: F.placa, emitida: hoy, titulo: F.placa + (A.marca ? ' · ' + A.marca : ''), foto: H.foto || null,
    pares: [['Placa', F.placa, 'Marca y modelo', [A.marca, A.modelo, A.anio].filter(Boolean).join(' · ')], ['Tipo', [A.tipoVehiculo, A.uso].filter(Boolean).join(' · '), 'Responsable', c.conductor || A.responsable || ''],
      ['Chasis (VIN)', A.chasis || '', 'Motor N.°', A.motor || ''], ['Color', A.color || '', 'Capacidad', A.capacidad || ''], ['Combustible', [A.combustibleTipo, A.tanque ? 'tanque de ' + A.tanque : ''].filter(Boolean).join(' · '), 'Llantas', A.llantas || ''],
      ['Fecha de compra', [A.compraFecha ? fchLarga(A.compraFecha) : '', A.compraValor ? bs(A.compraValor) : ''].filter(Boolean).join(' · '), 'Odómetro', (c.odometro || A.km) ? nm(c.odometro || A.km) + ' km' : '']],
    docs: (H.docs || []).filter(function (d) { return !d.noAplica; }).map(function (d) { return [d.tarea, [d.numero, d.emisor].filter(Boolean).join(' · '), d.vence ? fch(d.vence) : '']; }),
    plan: (A.tareas || []).filter(function (t) { return !esDoc(t) && !t.noAplica; }).map(function (t) { return [t.tarea, t.cadaKm ? 'cada ' + nm(t.cadaKm) + ' km' : (t.cadaDias ? 'cada ' + t.cadaDias + ' días' : ''), estadoPlan(t)]; }),
    servicios: serv.map(function (s) { return [fch(s.fecha), s.tipo || 'Servicio', s.empresa || '', s.km ? nm(s.km) + ' km' : '', s.obs || s.resultado || '', bs(s.costo)]; }), totalAnio: totAnio, anio: anio,
    fallas: (F.fallas || []).filter(function (f) { return f.fecha >= d1 && f.estado !== 'anulada'; }).map(function (f) { var k = f.punto + (f.que ? ': ' + f.que : ''); return [fch(f.fecha), f.punto + (f.que ? ': ' + f.que : ''), f.estado === 'resuelta' ? (cierre[k] ? fch(cierre[k]) : 'Resuelta') : 'Abierta']; }),
    insp: (H.inspecciones || []).slice(0, 6).map(function (i) { return [mesTxt(i.mes), i.puntos + ' puntos · ' + i.malos + ' en mal estado', i.estado === 'firmada' ? i.firmadaPor + ' · ' + fch(i.firmadaEn) : 'Sin firmar'].concat([i.estado]); }),
    responsable: c.conductor || A.responsable || ''
  };
}
/* ───────── Word ───────── */
var B = { all: { sz: 4, color: LIN } };
function logoXml(logo) { var t = D.pngTam(logo), h = 380000, w = Math.round(h * t.w / t.h); return { xml: D.imagen('rIdLogo', w, h, 'Logo ECOVSA'), w: Math.round(w / 635) + 140 }; }
function membrete(logo, titulo, per, pag) {
  var L = logoXml(logo), w1 = L.w, w3 = 4900, w2 = ANCHO - w1 - w3;
  return D.table([w1, w2, w3], [{ cells: [D.cell([D.para('', { xml: L.xml })], { w: w1, valign: 'center', mar: [0, 0, 0, 0] }),
    D.cell([D.para('ECOVSA', { b: 1, sz: 30, color: NAVY }), D.para('ECOTERMO DE PANAMA S.A. · RUC 1074020-1-552789 DV 50', { sz: 13, color: GRIS }), D.para('Proceso: plan de mantenimiento de vehículos · ISO 9001 e ISO 45001', { sz: 13, color: GRIS })], { w: w2, valign: 'center', mar: [0, 60, 0, 0] }),
    D.cell([D.para(titulo, { b: 1, sz: 21, color: NAVY, align: 'right' }), D.para(COD, { sz: 14, color: GRIS, align: 'right' }), D.para((per ? per + ' · ' : '') + 'Página ' + pag, { sz: 14, color: GRIS, align: 'right' })], { w: w3, valign: 'center', mar: [0, 0, 0, 0] })] }], { borde: 'none', mar: [0, 0, 0, 0] }) + D.para('', { border: 24, line: 60, after: 80 });
}
function pie() { return D.para('Empresa registrada ante el Ministerio de Salud · Resolución Sanitaria N.° 1519 del 10 de diciembre de 2025 · F-LOG-09', { sz: 14, b: 1, color: '44516A', align: 'center', fill: 'F1F4F8', before: 120 }); }
function sec(t) { return D.para(t.toUpperCase(), { b: 1, sz: 16, color: NAVY, before: 200, after: 50, keepNext: true }); }
function th(t, w, al) { return D.cell(t, { w: w, fill: AZUL, color: NAVY, b: 1, sz: 15, align: al, borders: B, mar: [30, 60, 30, 60] }); }
function td(t, w, o) { return D.cell(t, Object.assign({ w: w, sz: 16, borders: B, mar: [28, 60, 28, 60] }, o || {})); }
function tabla(cols, cab, filas, vacio) {
  if (!filas.length) return D.para(vacio, { sz: 15, color: GRIS, before: 30 });
  return D.table(cols, [{ cells: cab.map(function (h, i) { return th(h, cols[i], h === 'Costo' ? 'right' : null); }) }].concat(filas.map(function (f) { return { cells: f.map(function (v, i) { return td(v, cols[i], cab[i] === 'Costo' ? { align: 'right' } : null); }) }; })), { mar: [28, 60, 28, 60] });
}
function documento(V, logo, foto) {
  var wL = foto ? 7300 : ANCHO, wR = ANCHO - wL, w = [1500, 3100, 1500, wL - 6100];
  var par = V.pares.map(function (p) { return { cells: [td(p[0], w[0], { fill: CLARO, b: 1, color: NAVY }), td(p[1], w[1]), td(p[2], w[2], { fill: CLARO, b: 1, color: NAVY }), td(p[3], w[3])] }; });
  var datos = D.table(w, par, { mar: [28, 60, 28, 60] });
  var arriba = foto ? D.table([wL, wR], [{ cells: [D.cell([datos], { w: wL, mar: [0, 0, 0, 100] }), D.cell([D.para('', { xml: D.imagen('rIdFoto', Math.round((wR - 160) * 635), Math.round((wR - 160) * 635 * foto.h / foto.w), 'Foto del vehículo'), align: 'center' })], { w: wR, borders: B, valign: 'center', mar: [40, 60, 40, 60] })] }], { borde: 'none', mar: [0, 0, 0, 0] }) : datos;
  var p1 = membrete(logo, 'HOJA DE VIDA DEL VEHÍCULO', 'Emitida el ' + fchLarga(V.emitida), '1 de 2') + arriba +
    sec('Documentos del vehículo') + tabla([4000, 4400, 2540], ['Documento', 'Número', 'Vence'], V.docs, 'Todavía no hay documentos cargados.') +
    sec('Plan de mantenimiento') + tabla([5000, 2800, 3140], ['Tarea', 'Frecuencia', 'Estado'], V.plan, 'El camión no tiene plan de mantenimiento.') + pie();
  var br = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  var p2 = membrete(logo, 'HOJA DE VIDA DEL VEHÍCULO', V.titulo, '2 de 2') +
    sec('Historial de servicios') + tabla([1100, 1300, 2000, 1200, 4040, 1300], ['Fecha', 'Tipo', 'Taller', 'Odómetro', 'Trabajo', 'Costo'], V.servicios, 'Sin servicios anotados.') +
    (V.servicios.length ? D.para('Total ' + V.anio + ': ' + bs(V.totalAnio), { b: 1, sz: 16, align: 'right', before: 40 }) : '') +
    sec('Fallas del último año') + tabla([1300, 6340, 3300], ['Fecha', 'Falla', 'Cierre'], V.fallas, 'Sin fallas en el último año.') +
    sec('Inspecciones mensuales (F-LOG-08)') + tabla([2200, 4400, 4340], ['Mes', 'Resultado', 'Firmó'], V.insp.map(function (i) { return i.slice(0, 3); }), 'Todavía no hay inspecciones.') +
    sec('Observaciones') + D.table([ANCHO], [{ h: 900, cells: [td('', ANCHO)] }], { mar: [28, 60, 28, 60] }) +
    D.table([ANCHO / 2 - 250, 500, ANCHO / 2 - 250], [{ h: 900, cells: [D.cell([D.para('', { after: 400 }), D.para('Responsable del vehículo', { b: 1, sz: 15, align: 'center', border: 6, borderColor: '111111' }), D.para(V.responsable, { sz: 14, color: GRIS, align: 'center' })], { w: ANCHO / 2 - 250, valign: 'bottom' }), D.cell('', { w: 500 }), D.cell([D.para('', { after: 400 }), D.para('Coordinador o supervisor de logística', { b: 1, sz: 15, align: 'center', border: 6, borderColor: '111111' }), D.para('', { sz: 14 })], { w: ANCHO / 2 - 250, valign: 'bottom' })] }], { borde: 'none', mar: [0, 0, 0, 0] }) + pie();
  var imgs = [{ rid: 'rIdLogo', nombre: 'logo.png', bytes: logo }];
  if (foto) imgs.push({ rid: 'rIdFoto', nombre: 'foto.' + foto.ext, bytes: foto.bytes });
  return D.documento(p1 + br + p2, imgs, { margen: 560 });
}
function leerFoto(F) {
  var f = F.hv && F.hv.foto; if (!f || !f.hayArchivo || !/^image\/(jpeg|png)$/.test(f.mime)) return Promise.resolve(null);
  return new Promise(function (ok) { google.script.run.withSuccessHandler(function (r) { if (!r || !r.ok || !r.url) return ok(null); D.cargarBytes(r.url).then(function (b) {
    var img = new Image(); img.onload = function () { ok({ bytes: b, ext: f.mime === 'image/png' ? 'png' : 'jpg', w: img.naturalWidth, h: img.naturalHeight }); }; img.onerror = function () { ok(null); }; img.src = URL.createObjectURL(new Blob([b], { type: f.mime }));
  }, function () { ok(null); }); }).withFailureHandler(function () { ok(null); }).api_arcVer(window.PIN || JSON.parse(localStorage.getItem('ecovsa_pin') || '""'), f.archivoId); });
}
function armar(F, c) { var V = datos(F, c); return Promise.all([D.cargarBytes('logo-ecovsa.png'), leerFoto(F)]).then(function (a) { return documento(V, a[0], a[1]); }); }
function bajar(F, c) { return armar(F, c).then(function (b) { D.descargar(b, 'Hoja-de-vida_' + F.placa + '_' + F.hoy + '.docx'); return b; }); }
window.DOCXHV = { datos: datos, armar: armar, bajar: bajar, COD: COD, fch: fch, fchLarga: fchLarga, nm: nm, bs: bs, mesTxt: mesTxt };
})();
