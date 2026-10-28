/* Dibujo del camión de caja (costados, frente, atrás y arriba) para marcar dónde tiene algún defecto.
   api 3.59 · lo usan Logística › Flota › Inspección mensual (marcar zonas) y la hoja impresa F-LOG-08.
   Cada pieza es una zona con nombre (data-z); las zonas marcadas se pintan con rayas rojas (.zn.mk). */
(function () {
var ZN = { 'caja': 'Caja de carga', 'cabina': 'Cabina', 'llanta-tras-der': 'Llanta trasera derecha', 'llanta-tras-izq': 'Llanta trasera izquierda', 'llanta-del-der': 'Llanta delantera derecha', 'llanta-del-izq': 'Llanta delantera izquierda',
  'parachoques-del': 'Parachoques delantero', 'parachoques-tras': 'Parachoques trasero', 'luces-tras': 'Luces traseras', 'faros': 'Faros delanteros', 'espejo-der': 'Espejo derecho', 'espejo-izq': 'Espejo izquierdo' };
function nombresZ(m){ return m.length ? m.map(function(z){ return ZN[z] || z; }).join(', ') : 'ninguna'; }
var INK = '#16233b', TRZ = 'fill="#fff" stroke="' + INK + '" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"';
function Z(id, inner, marks){ return '<g class="zn' + (marks.indexOf(id) >= 0 ? ' mk' : '') + '" data-z="' + id + '"><title>' + (ZN[id] || id) + '</title>' + inner + '</g>'; }
function rueda(cx, cy, r){ return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#3a4558" stroke="' + INK + '" stroke-width="1.5"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.56) + '" fill="#cfd6e2" stroke="' + INK + '" stroke-width="1"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.2) + '" fill="' + INK + '"/>'; }
function costado(der, m){
  var x = (der ? 'llanta-tras-der' : 'llanta-tras-izq'), y = (der ? 'llanta-del-der' : 'llanta-del-izq'), e = der ? 'espejo-der' : 'espejo-izq';
  var cost = '<line x1="0" y1="119" x2="280" y2="119" stroke="#cbd3df" stroke-width="1.2"/><rect x="10" y="100" width="250" height="8" rx="2" fill="#d9e0ea" stroke="' + INK + '" stroke-width="1.2"/>' +
    Z('caja', '<rect x="8" y="10" width="176" height="90" rx="5" ' + TRZ + '/>' + [40, 72, 104, 136, 168].map(function(v){ return '<line x1="' + v + '" y1="16" x2="' + v + '" y2="84" stroke="#c4ccd9" stroke-width="1.2"/>'; }).join('') + '<rect x="8" y="84" width="176" height="16" fill="#eef2f7" stroke="' + INK + '" stroke-width="1.2"/>', m) +
    Z('cabina', '<path d="M188 32 H228 Q241 32 247 47 L259 78 V100 H188 Z" ' + TRZ + '/><path d="M197 39 H225 Q232 39 236 49 L243 69 H197 Z" fill="#dbe8fa" stroke="' + INK + '" stroke-width="1.2"/><path d="M197 73 V98" stroke="' + INK + '" stroke-width="1.2"/><rect x="203" y="82" width="11" height="3.5" rx="1.7" fill="' + INK + '"/>', m) +
    Z(e, '<rect x="253" y="52" width="7" height="15" rx="2.5" ' + TRZ + '/>', m) +
    Z('faros', '<rect x="254" y="80" width="7" height="10" rx="2.5" fill="#f6dd8a" stroke="' + INK + '" stroke-width="1.2"/>', m) +
    Z('parachoques-del', '<rect x="253" y="93" width="16" height="9" rx="2.5" ' + TRZ + '/>', m) + Z('parachoques-tras', '<rect x="0" y="93" width="14" height="9" rx="2.5" ' + TRZ + '/>', m) +
    Z('luces-tras', '<rect x="5" y="60" width="6" height="20" rx="2.5" fill="#f3b3ae" stroke="' + INK + '" stroke-width="1.2"/>', m) +
    Z(x, rueda(52, 106, 17), m) + Z(y, rueda(224, 106, 17), m);
  return der ? cost : '<g transform="translate(280,0) scale(-1,1)">' + cost + '</g>';
}
function frente(m){
  return Z('caja', '<rect x="6" y="4" width="88" height="34" rx="4" ' + TRZ + '/>', m) +
    Z('cabina', '<path d="M16 24 H84 Q92 24 92 34 V96 H8 V34 Q8 24 16 24 Z" ' + TRZ + '/><rect x="16" y="31" width="68" height="32" rx="5" fill="#dbe8fa" stroke="' + INK + '" stroke-width="1.2"/><line x1="50" y1="31" x2="50" y2="63" stroke="' + INK + '" stroke-width="1"/><rect x="30" y="72" width="40" height="14" rx="3" fill="#eef2f7" stroke="' + INK + '" stroke-width="1.2"/><path d="M36 75 V83 M43 75 V83 M50 75 V83 M57 75 V83 M64 75 V83" stroke="' + INK + '" stroke-width="1"/>', m) +
    Z('faros', '<rect x="11" y="72" width="14" height="10" rx="3" fill="#f6dd8a" stroke="' + INK + '" stroke-width="1.2"/><rect x="75" y="72" width="14" height="10" rx="3" fill="#f6dd8a" stroke="' + INK + '" stroke-width="1.2"/>', m) +
    Z('espejo-der', '<rect x="0" y="42" width="7" height="16" rx="3" ' + TRZ + '/>', m) + Z('espejo-izq', '<rect x="93" y="42" width="7" height="16" rx="3" ' + TRZ + '/>', m) +
    Z('parachoques-del', '<rect x="8" y="96" width="84" height="10" rx="3" ' + TRZ + '/>', m) +
    Z('llanta-del-der', '<rect x="10" y="102" width="17" height="30" rx="5" fill="#3a4558" stroke="' + INK + '" stroke-width="1.5"/>', m) + Z('llanta-del-izq', '<rect x="73" y="102" width="17" height="30" rx="5" fill="#3a4558" stroke="' + INK + '" stroke-width="1.5"/>', m);
}
function atras(m){
  return Z('caja', '<rect x="8" y="6" width="84" height="94" rx="4" ' + TRZ + '/><line x1="50" y1="6" x2="50" y2="100" stroke="' + INK + '" stroke-width="1.5"/><rect x="42" y="48" width="5" height="12" rx="2" fill="' + INK + '"/><rect x="53" y="48" width="5" height="12" rx="2" fill="' + INK + '"/><rect x="8" y="18" width="5" height="9" fill="#d9e0ea" stroke="' + INK + '"/><rect x="87" y="18" width="5" height="9" fill="#d9e0ea" stroke="' + INK + '"/><rect x="8" y="76" width="5" height="9" fill="#d9e0ea" stroke="' + INK + '"/><rect x="87" y="76" width="5" height="9" fill="#d9e0ea" stroke="' + INK + '"/>', m) +
    Z('luces-tras', '<rect x="14" y="84" width="14" height="10" rx="3" fill="#f3b3ae" stroke="' + INK + '" stroke-width="1.2"/><rect x="72" y="84" width="14" height="10" rx="3" fill="#f3b3ae" stroke="' + INK + '" stroke-width="1.2"/>', m) +
    Z('parachoques-tras', '<rect x="10" y="100" width="80" height="9" rx="3" ' + TRZ + '/>', m) +
    Z('llanta-tras-izq', '<rect x="6" y="102" width="17" height="30" rx="5" fill="#3a4558" stroke="' + INK + '" stroke-width="1.5"/>', m) + Z('llanta-tras-der', '<rect x="77" y="102" width="17" height="30" rx="5" fill="#3a4558" stroke="' + INK + '" stroke-width="1.5"/>', m);
}
function arriba(m){
  var wr = function(id, cx, y){ return Z(id, '<rect x="' + (cx - 16) + '" y="' + y + '" width="32" height="11" rx="4" fill="#3a4558" stroke="' + INK + '" stroke-width="1.5"/>', m); };
  return Z('caja', '<rect x="8" y="26" width="176" height="62" rx="5" ' + TRZ + '/>' + [32, 56, 80, 104, 128, 152].map(function(v){ return '<line x1="' + v + '" y1="30" x2="' + v + '" y2="84" stroke="#c4ccd9" stroke-width="1.2"/>'; }).join(''), m) +
    Z('cabina', '<path d="M188 32 H238 Q254 32 258 44 V70 Q254 82 238 82 H188 Z" ' + TRZ + '/><path d="M238 36 Q250 36 253 46 V68 Q250 78 238 78 Z" fill="#dbe8fa" stroke="' + INK + '" stroke-width="1.2"/>', m) +
    Z('espejo-izq', '<rect x="232" y="22" width="11" height="7" rx="2.5" ' + TRZ + '/>', m) + Z('espejo-der', '<rect x="232" y="85" width="11" height="7" rx="2.5" ' + TRZ + '/>', m) +
    wr('llanta-tras-izq', 52, 16) + wr('llanta-tras-der', 52, 88) + wr('llanta-del-izq', 224, 16) + wr('llanta-del-der', 224, 88);
}
var VW = { izq: 280, der: 280, fre: 100, atr: 100, arr: 280 }, VL = { izq: 'Costado izquierdo', der: 'Costado derecho', fre: 'Frente', atr: 'Atrás', arr: 'Arriba' };
function truck(vs, marks){
  var m = marks || [], x = 0, g = '';
  vs.forEach(function(v){
    var d = v === 'izq' ? costado(false, m) : v === 'der' ? costado(true, m) : v === 'fre' ? frente(m) : v === 'atr' ? atras(m) : arriba(m);
    g += '<g transform="translate(' + x + ',0)">' + d + '<text x="' + (VW[v] / 2) + '" y="146" font-size="10" text-anchor="middle" fill="#44516a" font-weight="800" font-family="Archivo,Arial,sans-serif">' + VL[v] + '</text></g>'; x += VW[v] + 18; });
  return '<svg viewBox="0 0 ' + (x - 18) + ' 152" width="100%"><defs><pattern id="hach" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#fde1df"/><line x1="0" y1="0" x2="0" y2="5" stroke="#e5484d" stroke-width="2.2"/></pattern></defs>' + g + '</svg>';
}
function dibujo2(m){ return truck(['izq', 'der'], m) + truck(['fre', 'atr', 'arr'], m); }

window.CAMION = {
  costados: function (marcas) { return truck(['izq', 'der'], marcas); },
  resto: function (marcas) { return truck(['fre', 'atr', 'arr'], marcas); },
  dibujo: dibujo2,
  nombres: nombresZ,
  zonas: ZN
};
})();
