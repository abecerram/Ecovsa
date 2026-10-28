/* Descarga en Word de la inspección mensual F-LOG-08 (una carta, igual que el formato) y de su hoja para el mecánico.
   api 3.59 · usa docx-mini.js y camion-dibujo.js. Recibe la inspección tal como la entrega api_inspeccionMensual (acción «ver»). */
(function () {
var D = window.DOCXMINI, NAVY = '0F2A57', GRIS = '5E6B7E', AZUL = 'E8EFFB', CLARO = 'F1F5FB', LIN = '9FB0C8';
var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function mesTxt(m) { m = String(m || ''); var n = Number(m.slice(5, 7)); return n ? MESES[n - 1].charAt(0).toUpperCase() + MESES[n - 1].slice(1) + ' ' + m.slice(0, 4) : m; }
function fch(iso) { iso = String(iso || ''); return /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : ''; }
function nm(n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
var GD = { 'Pedales': 'antideslizante, recorrido y graduación', 'Luces': 'uniformidad, intensidad y carcasas', 'Equipo de carretera y botiquín': 'gasas, esparadrapo, guantes, yodo, curitas' };
var GRUPOS = ['Niveles', 'Pedales', 'Luces', 'Equipo de carretera y botiquín', 'Varios'];
var ANCHO = 10940;
var B = { all: { sz: 4, color: LIN } };

function logoXml(logo) { var t = D.pngTam(logo.bytes), h = 380000, w = Math.round(h * t.w / t.h); return { xml: D.imagen('rIdLogo', w, h, 'Logo ECOVSA'), w: Math.round(w / 635) + 140 }; }
function membrete(logo, titulo, per, cod, pag) {
  var L = logoXml(logo), w1 = L.w, w3 = 4900, w2 = ANCHO - w1 - w3;
  return D.table([w1, w2, w3], [{ cells: [
    D.cell([D.para('', { xml: L.xml })], { w: w1, valign: 'center', mar: [0, 0, 0, 0] }),
    D.cell([D.para('ECOVSA', { b: 1, sz: 30, color: NAVY }), D.para('ECOTERMO DE PANAMA S.A. · RUC 1074020-1-552789 DV 50', { sz: 13, color: GRIS }), D.para('Proceso: plan de mantenimiento de vehículos · ISO 9001 e ISO 45001', { sz: 13, color: GRIS })], { w: w2, valign: 'center', mar: [0, 60, 0, 0] }),
    D.cell([D.para(titulo, { b: 1, sz: 21, color: NAVY, align: 'right' }), D.para(cod, { sz: 14, color: GRIS, align: 'right' }), D.para((per ? per + ' · ' : '') + 'Página ' + pag, { sz: 14, color: GRIS, align: 'right' })], { w: w3, valign: 'center', mar: [0, 0, 0, 0] })] }], { borde: 'none', mar: [0, 0, 0, 0] }) +
    D.para('', { border: 24, line: 60, after: 80 });
}
function pie(extra) {
  return (extra ? D.para(extra, { sz: 14, color: GRIS, before: 80 }) : '') +
    D.para('Empresa registrada ante el Ministerio de Salud · Resolución Sanitaria N.° 1519 del 10 de diciembre de 2025 · F-LOG-08', { sz: 14, b: 1, color: '44516A', align: 'center', fill: 'F1F4F8', before: extra ? 20 : 100 });
}
function celdaDato(t, w, lab) { return D.cell(t, { w: w, fill: lab ? CLARO : null, b: lab ? 1 : 0, color: lab ? NAVY : null, sz: 14, borders: B, mar: [14, 50, 14, 50] }); }
function datos(d, w) {
  var pre = d.ultimoPreventivo ? fch(d.ultimoPreventivo.fecha) + (d.ultimoPreventivo.taller ? ' · ' + d.ultimoPreventivo.taller : '') : '';
  var ace = d.ultimoAceite ? (d.ultimoAceite.fecha ? fch(d.ultimoAceite.fecha) : '') + (d.ultimoAceite.km ? (d.ultimoAceite.fecha ? ' · ' : '') + nm(d.ultimoAceite.km) + ' km' : '') : '';
  var c = [Math.round(w * .2), Math.round(w * .3), Math.round(w * .2), w - 2 * Math.round(w * .2) - Math.round(w * .3)];
  var f = function (a, b, c2, d2) { return { cells: [celdaDato(a, c[0], 1), celdaDato(b, c[1]), celdaDato(c2, c[2], 1), celdaDato(d2, c[3])] }; };
  return D.table(c, [f('Mes inspeccionado', mesTxt(d.mes), 'Placa', d.placa), f('Fecha de inspección', fch(d.fecha), 'Modelo', [d.modelo, d.anio].filter(Boolean).join(' ')),
    f('Conductor', d.conductor || '', 'Tipo de vehículo', d.tipo || ''), f('Vence la póliza', fch(d.polizaVence), 'Kilometraje actual', d.km ? nm(d.km) + ' km' : ''),
    f('Último mantenimiento preventivo (fecha y taller)', pre, 'Último cambio de aceite (fecha y km)', ace)], { mar: [14, 50, 14, 50] });
}
function obsPunto(p, d) { var o = String(p.obs || ''); if (!o && p.fuentes && p.fuentes.indexOf('s08') >= 0 && d.extintorVence) o = 'Vence ' + fch(d.extintorVence); return o; }
function lista(d) {
  var W = [1250, 380, 4300, 740, 740, 520, ANCHO - 1250 - 380 - 4300 - 740 - 740 - 520];
  var th = function (t, w, al) { return D.cell(t, { w: w, fill: NAVY, color: 'FFFFFF', b: 1, sz: 13, align: al || 'center', valign: 'center', borders: B, mar: [6, 20, 6, 20] }); };
  var rows = [{ cells: [D.cell([D.para([['LISTA DE CHEQUEO  ', { b: 1 }], ['Marque con una X el resultado de cada punto', { i: 1, sz: 13 }]], { color: 'FFFFFF', sz: 14 })], { w: W[0] + W[1] + W[2], span: 3, fill: NAVY, valign: 'center', borders: B, mar: [10, 40, 10, 40] }),
    th('BUEN ESTADO', W[3]), th('MAL ESTADO', W[4]), th('N/A', W[5]), th('OBSERVACIONES', W[6])] }];
  GRUPOS.forEach(function (g) {
    var fil = d.puntos.filter(function (p) { return p.grupo === g; });
    fil.forEach(function (p, k) {
      var g1 = k === 0 ? D.cell([D.para(g.toUpperCase(), { b: 1, sz: 14, color: NAVY, align: 'center' })].concat(GD[g] ? [D.para('(' + GD[g] + ')', { sz: 12, color: GRIS, align: 'center' })] : []), { w: W[0], vmerge: 'restart', fill: CLARO, valign: 'center', borders: B, mar: [6, 30, 6, 30] })
        : D.cell('', { w: W[0], vmerge: 'continue', fill: CLARO, borders: B });
      var X = function (v) { return D.cell(p.estado === v ? 'X' : '', { w: v === 'b' ? W[3] : v === 'm' ? W[4] : W[5], b: 1, sz: 14, align: 'center', borders: B, mar: [3, 20, 3, 20] }); };
      rows.push({ cells: [g1, D.cell(p.n + '.', { w: W[1], sz: 13, color: '7A8799', align: 'right', borders: B, mar: [3, 20, 3, 30] }), D.cell(p.texto, { w: W[2], sz: 14, borders: B, mar: [3, 50, 3, 40] }), X('b'), X('m'), X('x'),
        D.cell(obsPunto(p, d), { w: W[6], sz: 12, color: '33415A', borders: B, mar: [3, 50, 3, 40] })] });
    });
  });
  return D.table(W, rows, { mar: [3, 40, 3, 40] });
}
function cierre(I) {
  var d = I.datos;
  return D.para([['OBSERVACIONES GENERALES  ', { b: 1, color: NAVY }], ['(fallas encontradas, qué se hizo y si el vehículo puede salir)', { i: 1, sz: 13, color: GRIS }]], { sz: 15, before: 70, after: 20, keepNext: true }) +
    D.table([ANCHO], [{ h: 420, cells: [D.cell(String(d.observaciones || ''), { w: ANCHO, sz: 15, borders: B, mar: [40, 70, 40, 70] })] }], { mar: [40, 70, 40, 70] }) +
    D.para('Hago constar que la información de esta inspección es cierta. Toda condición insegura o defecto se reporta a la Coordinación de Logística (Reporte de falla F-LOG-05) y, si es crítico, el vehículo no sale hasta repararlo.', { sz: 14, before: 50, after: 40 }) +
    D.table([ANCHO / 2, ANCHO / 2], [{ cells: [D.cell('CONDUCTOR', { w: ANCHO / 2, fill: NAVY, color: 'FFFFFF', b: 1, sz: 14, borders: B }), D.cell('COORDINADOR DE LOGÍSTICA', { w: ANCHO / 2, fill: NAVY, color: 'FFFFFF', b: 1, sz: 14, borders: B })] },
      { h: 600, cells: [D.cell([D.para('Nombre: ' + (d.conductor || ''), { sz: 15, after: 120 }), D.para('Cédula: ______________     Firma: ______________', { sz: 15 })], { w: ANCHO / 2, borders: B, mar: [50, 70, 40, 70] }),
        D.cell([D.para('Nombre: ' + (I.firmadaPor || ''), { sz: 15, after: 120 }), D.para('Fecha: ' + (I.firmadaEn ? fch(I.firmadaEn) : '____ / ____ / ______') + '     Firma: ______________', { sz: 15 })], { w: ANCHO / 2, borders: B, mar: [50, 70, 40, 70] })] }], { mar: [20, 70, 20, 70] });
}
function extraTxt(I) {
  var d = I.datos, r = d.resumen || {};
  if (d.copiaDe) return 'Sin salidas en el mes: se repite la inspección de ' + mesTxt(d.copiaDe).toLowerCase() + ' (mismos estados y kilometraje)';
  return 'Armada con ' + (r.revisiones || 0) + (r.revisiones === 1 ? ' revisión' : ' revisiones') + ' del conductor (F-LOG-04) de ' + mesTxt(d.mes).toLowerCase();
}
function recursos() {
  return Promise.all([D.cargarBytes('logo-ecovsa.png')]).then(function (a) { return { logo: { bytes: a[0] } }; });
}
function inspeccion(I) {
  var d = I.datos, zonas = d.zonas || [];
  return recursos().then(function (R) {
    var svg = CAMION.todo(zonas), m = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/), vw = +m[1], vh = +m[2];
    return D.svgAPng(svg, Math.round(vw * 3), Math.round(vh * 3)).then(function (png) {
      var wL = 6300, wR = ANCHO - wL, cx = Math.round((wR - 400) * 635), cy = Math.round(cx * vh / vw);
      var top = D.table([wL, wR], [{ cells: [
        D.cell([datos(d, wL - 100)], { w: wL, valign: 'top', mar: [0, 0, 0, 100] }),
        D.cell([D.para('Marque con un círculo dónde el vehículo tiene algún defecto', { i: 1, sz: 13, color: GRIS, align: 'center' }), D.para('', { xml: D.imagen('rIdDib', cx, cy, 'Dibujo del vehículo'), align: 'center' })].concat(zonas.length ? [D.para('Zonas marcadas: ' + CAMION.nombres(zonas), { sz: 13, b: 1, align: 'center' })] : []), { w: wR, borders: B, valign: 'center', mar: [40, 60, 40, 60] })] }], { borde: 'none', mar: [0, 0, 0, 0] });
      var cuerpo = membrete(R.logo, 'INSPECCIÓN MENSUAL DEL VEHÍCULO', '', 'F-LOG-08 · VERSIÓN 1 / MAY-26', '1 de 1') + top + D.para('', { line: 40, after: 20 }) + lista(d) + cierre(I) + pie(extraTxt(I));
      return D.documento(cuerpo, [{ rid: 'rIdLogo', nombre: 'logo.png', bytes: R.logo.bytes }, { rid: 'rIdDib', nombre: 'camion.png', bytes: png }], { margen: 500 });
    });
  });
}
function planTxt(t) {
  if (t.porQue === 'km' && t.faltanKm !== null && t.faltanKm < 0) return 'Pasado ' + nm(-t.faltanKm) + ' km del servicio';
  if (t.porQue === 'fecha' && t.faltanDias !== null && t.faltanDias < 0) return 'Vencido hace ' + (-t.faltanDias) + (t.faltanDias === -1 ? ' día' : ' días');
  if (t.porQue === 'ciclos') return 'Pasado de ciclos';
  return 'Vencido';
}
function mecanico(I) {
  var d = I.datos, M = I.mecanico || { pendientes: [], resueltas: [], planVencido: [] };
  return recursos().then(function (R) {
    var filas = M.pendientes.map(function (p) { return [p.punto, p.queSePaso, p.desde ? fch(p.desde) : '', p.critico]; }).concat(M.planVencido.map(function (t) { return [t.tarea, planTxt(t), 'Plan de mantenimiento', false]; }));
    var W = [420, 2200, 4000, 1500, 650, ANCHO - 420 - 2200 - 4000 - 1500 - 650];
    var th = function (t, w, al) { return D.cell(t, { w: w, fill: AZUL, color: NAVY, b: 1, sz: 14, align: al, borders: B, mar: [30, 50, 30, 50] }); };
    var rows = [{ cells: [th('N.°', W[0], 'center'), th('Punto', W[1]), th('Qué se encontró', W[2]), th('Desde', W[3]), th('Hecho', W[4], 'center'), th('Observación del mecánico', W[5])] }];
    for (var i = 0; i < Math.max(12, filas.length); i++) { var r = filas[i] || ['', '', '', false]; rows.push({ h: 420, cells: [D.cell(String(i + 1), { w: W[0], sz: 15, align: 'center', b: 1, borders: B }), D.cell([D.para([[r[0], { b: 1 }], [r[3] ? ' ★' : '', {}]], { sz: 15 })], { w: W[1], borders: B, mar: [30, 50, 30, 50] }), D.cell(r[1], { w: W[2], sz: 15, borders: B, mar: [30, 50, 30, 50] }), D.cell(r[2], { w: W[3], sz: 15, borders: B, mar: [30, 50, 30, 50] }), D.cell('☐', { w: W[4], sz: 24, align: 'center', borders: B }), D.cell('', { w: W[5], borders: B })] }); }
    var dat = function (a, b, c, e) { var w = [1700, 3800, 1700, ANCHO - 7200]; return { cells: [celdaDato(a, w[0], 1), celdaDato(b, w[1]), celdaDato(c, w[2], 1), celdaDato(e, w[3])] }; };
    var res = M.resueltas.length ? D.table([3000, 5400, ANCHO - 8400], [{ cells: [th('Punto', 3000), th('Qué pasó', 5400), th('Resuelta el', ANCHO - 8400)] }].concat(M.resueltas.map(function (x) { return { cells: [D.cell(x.punto, { w: 3000, sz: 15, borders: B }), D.cell((x.queSePaso || '') + ' (' + fch(x.fecha) + ')', { w: 5400, sz: 15, borders: B }), D.cell(fch(x.resuelta), { w: ANCHO - 8400, sz: 15, borders: B })] }; })), { mar: [30, 50, 30, 50] })
      : D.para('Ninguna falla se resolvió en el mes.', { sz: 15, color: GRIS, before: 40 });
    var sec = function (t) { return D.para(t.toUpperCase(), { b: 1, sz: 15, color: NAVY, before: 200, after: 40, keepNext: true }); };
    var cuerpo = membrete(R.logo, 'HOJA PARA EL MECÁNICO', 'Pendientes de ' + mesTxt(d.mes).toLowerCase(), 'Anexo del F-LOG-08 · VERSIÓN 1 / MAY-26', '1 de 1') +
      D.table([1700, 3800, 1700, ANCHO - 7200], [dat('Vehículo', [d.modelo, d.tipo].filter(Boolean).join(' · '), 'Placa', d.placa), dat('Conductor del mes', d.conductor || '', 'Kilometraje', d.km ? nm(d.km) + ' km' : ''), dat('Inspección', 'F-LOG-08 de ' + mesTxt(d.mes).toLowerCase(), 'Entregada el', fch(I.firmadaEn || d.fecha))], { mar: [14, 50, 14, 50] }) +
      D.para('Esto es lo que hay que arreglar', { b: 1, sz: 26, color: NAVY, before: 220, after: 80 }) + D.table(W, rows, { mar: [30, 50, 30, 50] }) +
      D.para('★ Punto crítico: si falla, el camión no puede salir. Lo vencido del plan sale del plan de mantenimiento del camión.', { sz: 14, before: 50 }) +
      sec('Resuelto este mes (solo informativo)') + res + sec('Del taller') +
      D.table([1700, 3800, 1700, ANCHO - 7200], [{ h: 330, cells: [celdaDato('Taller o mecánico', 1700, 1), celdaDato('', 3800), celdaDato('Fecha de entrega', 1700, 1), celdaDato('', ANCHO - 7200)] }, { h: 330, cells: [celdaDato('Repuestos', 1700, 1), celdaDato('', 3800), celdaDato('Costo total B/.', 1700, 1), celdaDato('', ANCHO - 7200)] }], { mar: [14, 50, 14, 50] }) +
      D.table([ANCHO / 2 - 250, 500, ANCHO / 2 - 250], [{ h: 900, cells: [D.cell([D.para('', { after: 400 }), D.para('Entregó · coordinador de logística', { b: 1, sz: 15, align: 'center', border: 6, borderColor: '111111' }), D.para(I.firmadaPor || '', { sz: 14, color: GRIS, align: 'center' })], { w: ANCHO / 2 - 250, valign: 'bottom' }), D.cell('', { w: 500 }), D.cell([D.para('', { after: 400 }), D.para('Recibió · mecánico', { b: 1, sz: 15, align: 'center', border: 6, borderColor: '111111' }), D.para('Nombre, firma y fecha', { sz: 14, color: GRIS, align: 'center' })], { w: ANCHO / 2 - 250, valign: 'bottom' })] }], { borde: 'none', mar: [0, 0, 0, 0] }) +
      pie('Sale sola al generar la inspección mensual');
    return D.documento(cuerpo, [{ rid: 'rIdLogo', nombre: 'logo.png', bytes: R.logo.bytes }], { margen: 650 });
  });
}
function bajar(I, cual) {
  var f = cual === 'mec' ? mecanico : inspeccion;
  return f(I).then(function (blob) { D.descargar(blob, (cual === 'mec' ? 'Hoja-mecanico_' : 'F-LOG-08_') + I.placa + '_' + I.mes + '.docx'); return blob; });
}
window.DOCXF08 = { inspeccion: inspeccion, mecanico: mecanico, bajar: bajar };
})();
