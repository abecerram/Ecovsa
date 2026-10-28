/* Dibujo del camión de caja en línea negra (costados, frente, atrás y arriba) para marcar dónde tiene algún defecto.
   Sin colores: contorno negro, relleno blanco; la zona marcada se rellena con rayas negras (.zn.mk).
   api 3.59/3.60 · lo usan Flota › Inspección mensual (marcar zonas), la hoja impresa F-LOG-08 y la descarga en Word.
   Cada pieza es una zona con nombre (data-z). */
(function () {
var ZN = { 'caja': 'Caja de carga', 'cabina': 'Cabina', 'llanta-tras-der': 'Llanta trasera derecha', 'llanta-tras-izq': 'Llanta trasera izquierda',
  'llanta-del-der': 'Llanta delantera derecha', 'llanta-del-izq': 'Llanta delantera izquierda', 'parachoques-del': 'Parachoques delantero',
  'parachoques-tras': 'Parachoques trasero', 'luces-tras': 'Luces traseras', 'faros': 'Faros delanteros', 'espejo-der': 'Espejo derecho', 'espejo-izq': 'Espejo izquierdo' };
function nombresZ(m){ return m && m.length ? m.map(function(z){ return ZN[z] || z; }).join(', ') : 'ninguna'; }
var K = '#111', S = 'stroke="' + K + '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"', W = 'fill="#fff" ' + S, N = 'fill="none" ' + S, F = 'stroke="' + K + '" stroke-width="1" stroke-linecap="round" fill="none"';
function Z(id, inner, marks){ return '<g class="zn' + (marks.indexOf(id) >= 0 ? ' mk' : '') + '" data-z="' + id + '"><title>' + (ZN[id] || id) + '</title>' + inner + '</g>'; }
function ln(x1, y1, x2, y2, st){ return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" ' + (st || F) + '/>'; }
function rect(x, y, w, h, r, st){ return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r || 0) + '" ' + (st || W) + '/>'; }
function rueda(cx, cy, r){ return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#fff" stroke="' + K + '" stroke-width="3"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.58) + '" ' + N + '/><circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.2) + '" ' + N + '/>' +
  [0, 72, 144, 216, 288].map(function(a){ var t = a * Math.PI / 180; return ln((cx + Math.cos(t) * r * 0.27).toFixed(1), (cy + Math.sin(t) * r * 0.27).toFixed(1), (cx + Math.cos(t) * r * 0.58).toFixed(1), (cy + Math.sin(t) * r * 0.58).toFixed(1)); }).join(''); }

/* costado: el frente mira a la derecha (derecho) o a la izquierda (izquierdo) */
function costado(der, m){
  var x = der ? 'llanta-tras-der' : 'llanta-tras-izq', y = der ? 'llanta-del-der' : 'llanta-del-izq', e = der ? 'espejo-der' : 'espejo-izq';
  var g = ln(0, 119, 280, 119, 'stroke="#111" stroke-width="1" stroke-dasharray="1 4" stroke-linecap="round"') +
    Z('caja', rect(8, 8, 178, 90, 3) + [38, 68, 98, 128, 158].map(function(v){ return ln(v, 14, v, 92); }).join('') + ln(8, 90, 186, 90) + ln(8, 20, 186, 20), m) +
    rect(8, 98, 252, 7, 1.5) +
    Z('cabina', '<path d="M190 105 V26 Q190 22 195 22 H232 Q238 22 241 27 L258 62 Q260 66 260 71 V105 Z" ' + W + '/>' +
      '<path d="M198 30 H230 L246 60 H198 Z" ' + N + '/>' + rect(198, 66, 44, 34, 2, N) + ln(204, 76, 214, 76, 'stroke="#111" stroke-width="2.4" stroke-linecap="round"') + ln(222, 30, 222, 60), m) +
    Z(e, rect(251, 40, 9, 17, 2.5) + ln(245, 48, 251, 48), m) +
    Z('faros', rect(255, 76, 6, 12, 2.5), m) +
    Z('parachoques-del', rect(256, 92, 14, 11, 2.5), m) + Z('parachoques-tras', rect(0, 92, 12, 11, 2.5), m) +
    Z('luces-tras', rect(4, 66, 5, 20, 2), m) +
    Z(x, rueda(52, 106, 19), m) + Z(y, rueda(222, 106, 19), m);
  return der ? g : '<g transform="translate(280,0) scale(-1,1)">' + g + '</g>';
}
function frente(m){
  return Z('caja', rect(10, 4, 80, 36, 3), m) +
    Z('cabina', '<path d="M16 28 H84 Q92 28 92 38 V100 H8 V38 Q8 28 16 28 Z" ' + W + '/>' + rect(16, 34, 68, 30, 4, N) + ln(50, 34, 50, 64) + rect(30, 72, 40, 14, 3, N) + [37, 43, 50, 57, 63].map(function(v){ return ln(v, 75, v, 83); }).join(''), m) +
    Z('faros', rect(12, 72, 14, 12, 4) + rect(74, 72, 14, 12, 4), m) +
    Z('espejo-der', rect(0, 44, 7, 16, 3), m) + Z('espejo-izq', rect(93, 44, 7, 16, 3), m) +
    Z('parachoques-del', rect(8, 96, 84, 11, 3), m) +
    Z('llanta-del-der', rect(10, 104, 17, 30, 5) + ln(12, 112, 25, 112) + ln(12, 120, 25, 120) + ln(12, 128, 25, 128), m) +
    Z('llanta-del-izq', rect(73, 104, 17, 30, 5) + ln(75, 112, 88, 112) + ln(75, 120, 88, 120) + ln(75, 128, 88, 128), m);
}
function atras(m){
  return Z('caja', rect(10, 6, 80, 92, 3) + ln(50, 6, 50, 98) + rect(42, 46, 5, 14, 2, N) + rect(53, 46, 5, 14, 2, N) +
      [18, 76].map(function(v){ return rect(10, v, 5, 8, 1, N) + rect(85, v, 5, 8, 1, N); }).join(''), m) +
    Z('luces-tras', rect(15, 80, 14, 10, 3) + rect(71, 80, 14, 10, 3), m) +
    Z('parachoques-tras', rect(10, 98, 80, 10, 3), m) +
    Z('llanta-tras-izq', rect(4, 104, 22, 30, 5) + ln(8, 112, 22, 112) + ln(8, 120, 22, 120) + ln(8, 128, 22, 128), m) +
    Z('llanta-tras-der', rect(74, 104, 22, 30, 5) + ln(78, 112, 92, 112) + ln(78, 120, 92, 120) + ln(78, 128, 92, 128), m);
}
function arriba(m){
  var wr = function(id, cx, y){ return Z(id, rect(cx - 17, y, 34, 12, 4) + ln(cx - 8, y + 2, cx - 8, y + 10) + ln(cx, y + 2, cx, y + 10) + ln(cx + 8, y + 2, cx + 8, y + 10), m); };
  return Z('caja', rect(8, 24, 178, 66, 3) + [38, 68, 98, 128, 158].map(function(v){ return ln(v, 28, v, 86); }).join('') + ln(8, 57, 186, 57), m) +
    Z('cabina', '<path d="M190 30 H236 Q256 30 260 44 V70 Q256 84 236 84 H190 Z" ' + W + '/><path d="M238 36 Q252 38 255 47 V67 Q252 76 238 78 Z" ' + N + '/>' + ln(190, 57, 238, 57), m) +
    Z('espejo-izq', rect(230, 20, 12, 8, 2.5), m) + Z('espejo-der', rect(230, 86, 12, 8, 2.5), m) +
    wr('llanta-tras-izq', 52, 12) + wr('llanta-tras-der', 52, 90) + wr('llanta-del-izq', 222, 12) + wr('llanta-del-der', 222, 90);
}
var VW = { izq: 280, der: 280, fre: 100, atr: 100, arr: 280 }, VL = { izq: 'Costado izquierdo', der: 'Costado derecho', fre: 'Frente', atr: 'Atrás', arr: 'Arriba' };
var DEFS = '<defs><pattern id="hach" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#fff"/><line x1="0" y1="0" x2="0" y2="5" stroke="#111" stroke-width="2.4"/></pattern>' +
  '<style>.zn.mk *{fill:url(#hach)!important;stroke:#111!important;stroke-width:2.2!important}</style></defs>';
function truck(vs, marks){
  var m = marks || [], x = 0, g = '';
  vs.forEach(function(v){
    var d = v === 'izq' ? costado(false, m) : v === 'der' ? costado(true, m) : v === 'fre' ? frente(m) : v === 'atr' ? atras(m) : arriba(m);
    g += '<g transform="translate(' + x + ',0)">' + d + '<text x="' + (VW[v] / 2) + '" y="148" font-size="10" text-anchor="middle" fill="' + K + '" font-weight="700" font-family="Arial,Helvetica,sans-serif">' + VL[v] + '</text></g>'; x += VW[v] + 18; });
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + (x - 18) + ' 152" width="100%">' + DEFS + g + '</svg>';
}
function dibujo2(m){ return truck(['izq', 'der'], m) + truck(['fre', 'atr', 'arr'], m); }
/* un solo SVG con los 5 dibujos (para convertirlo en imagen, p. ej. en el Word) */
function todo(m){
  var a = truck(['izq', 'der'], m), b = truck(['fre', 'atr', 'arr'], m);
  var vb = function(s){ return s.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/); }, A = vb(a), B = vb(b), w = Math.max(+A[1], +B[1]), h = +A[2] + +B[2] + 6;
  var inner = function(s){ return s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '').replace(DEFS, ''); };
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w * 3 + '" height="' + h * 3 + '">' + DEFS + '<rect width="100%" height="100%" fill="#fff"/>' +
    '<g transform="translate(' + ((w - A[1]) / 2) + ',0)">' + inner(a) + '</g><g transform="translate(' + ((w - B[1]) / 2) + ',' + (+A[2] + 6) + ')">' + inner(b) + '</g></svg>';
}
window.CAMION = { costados: function (m) { return truck(['izq', 'der'], m); }, resto: function (m) { return truck(['fre', 'atr', 'arr'], m); },
  dibujo: dibujo2, todo: todo, nombres: nombresZ, zonas: ZN };
})();
