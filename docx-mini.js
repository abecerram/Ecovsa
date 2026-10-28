/* Generador mínimo de archivos Word (.docx) para el navegador, sin librerías externas.
   api 3.59/3.60 · «Descargar en Word» de la inspección mensual F-LOG-08, su hoja para el mecánico y la hoja de vida.
   Un .docx es un zip de XML: aquí se arma el zip (sin comprimir) y las piezas de texto, tablas e imágenes que hacen falta. */
(function () {
var enc = new TextEncoder();
/* ───────── zip ───────── */
var CRC = (function () { var t = [], c, n, k; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function u16(n) { return [n & 255, (n >> 8) & 255]; }
function u32(n) { return [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255]; }
function zip(files) {
  var out = [], central = [], off = 0;
  files.forEach(function (f) {
    var name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
    var lh = [].concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
    out.push(new Uint8Array(lh), name, data);
    central.push(new Uint8Array([].concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off))), name);
    off += lh.length + name.length + data.length;
  });
  var csize = 0; central.forEach(function (c) { csize += c.length; });
  var end = new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(csize), u32(off), u16(0)));
  return new Blob(out.concat(central, [end]), { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}
/* ───────── piezas del documento ───────── */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''); }
function run(t, o) {
  o = o || {};
  var pr = (o.b ? '<w:b/>' : '') + (o.i ? '<w:i/>' : '') + (o.caps ? '<w:caps/>' : '') + (o.color ? '<w:color w:val="' + o.color + '"/>' : '') + (o.sz ? '<w:sz w:val="' + o.sz + '"/><w:szCs w:val="' + o.sz + '"/>' : '');
  var parts = String(t == null ? '' : t).split('\n');
  return '<w:r>' + (pr ? '<w:rPr>' + pr + '</w:rPr>' : '') + parts.map(function (x, i) { return (i ? '<w:br/>' : '') + '<w:t xml:space="preserve">' + esc(x) + '</w:t>'; }).join('') + '</w:r>';
}
/* contenido de un párrafo: texto, o lista de [texto, opciones] */
function runs(c, o) { if (Array.isArray(c)) return c.map(function (x) { return typeof x === 'string' ? run(x, o) : (x.xml || run(x[0], Object.assign({}, o, x[1]))); }).join(''); return run(c, o); }
function para(c, o) {
  o = o || {};
  var pr = (o.keepNext ? '<w:keepNext/>' : '') + (o.border ? '<w:pBdr><w:bottom w:val="single" w:sz="' + o.border + '" w:space="1" w:color="' + (o.borderColor || '0F2A57') + '"/></w:pBdr>' : '') + (o.fill ? '<w:shd w:val="clear" w:color="auto" w:fill="' + o.fill + '"/>' : '') +
    '<w:spacing w:before="' + (o.before || 0) + '" w:after="' + (o.after || 0) + '"' + (o.line ? ' w:line="' + o.line + '" w:lineRule="auto"' : '') + '/>' + (o.align ? '<w:jc w:val="' + o.align + '"/>' : '');
  return '<w:p><w:pPr>' + pr + '</w:pPr>' + (o.xml ? o.xml : runs(c, o)) + '</w:p>';
}
function cell(content, o) {
  o = o || {};
  var blocks = Array.isArray(content) ? content : [para(content, o)];
  var last = blocks[blocks.length - 1] || '';
  if (/^<w:tbl>/.test(last)) blocks.push('<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/></w:pPr></w:p>');
  var pr = '<w:tcW w:w="' + o.w + '" w:type="dxa"/>' + (o.span ? '<w:gridSpan w:val="' + o.span + '"/>' : '') + (o.vmerge ? (o.vmerge === 'restart' ? '<w:vMerge w:val="restart"/>' : '<w:vMerge/>') : '') +
    (o.borders ? '<w:tcBorders>' + ['top', 'left', 'bottom', 'right'].map(function (s) { var b = o.borders[s] || o.borders.all; return b ? '<w:' + s + ' w:val="' + (b.v || 'single') + '" w:sz="' + (b.sz || 4) + '" w:space="0" w:color="' + (b.color || '9FB0C8') + '"/>' : ''; }).join('') + '</w:tcBorders>' : '') +
    (o.fill ? '<w:shd w:val="clear" w:color="auto" w:fill="' + o.fill + '"/>' : '') + (o.mar ? '<w:tcMar><w:top w:w="' + o.mar[0] + '" w:type="dxa"/><w:left w:w="' + o.mar[1] + '" w:type="dxa"/><w:bottom w:w="' + o.mar[2] + '" w:type="dxa"/><w:right w:w="' + o.mar[3] + '" w:type="dxa"/></w:tcMar>' : '') +
    (o.valign ? '<w:vAlign w:val="' + o.valign + '"/>' : '');
  return '<w:tc><w:tcPr>' + pr + '</w:tcPr>' + blocks.join('') + '</w:tc>';
}
/* filas: [{ h: alto mínimo, cells: [cell(...)] }]; o.borde: color de la rejilla o 'none' */
function table(widths, rows, o) {
  o = o || {};
  var bd = o.borde === 'none' ? '<w:tblBorders>' + ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(function (s) { return '<w:' + s + ' w:val="nil"/>'; }).join('') + '</w:tblBorders>'
    : '<w:tblBorders>' + ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(function (s) { return '<w:' + s + ' w:val="single" w:sz="4" w:space="0" w:color="' + (o.borde || '9FB0C8') + '"/>'; }).join('') + '</w:tblBorders>';
  var m = o.mar || [10, 70, 10, 70];
  var tw = widths.reduce(function (a, b) { return a + b; }, 0);
  return '<w:tbl><w:tblPr><w:tblW w:w="' + tw + '" w:type="dxa"/>' + bd + '<w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="' + m[0] + '" w:type="dxa"/><w:left w:w="' + m[1] + '" w:type="dxa"/><w:bottom w:w="' + m[2] + '" w:type="dxa"/><w:right w:w="' + m[3] + '" w:type="dxa"/></w:tblCellMar></w:tblPr>' +
    '<w:tblGrid>' + widths.map(function (w) { return '<w:gridCol w:w="' + w + '"/>'; }).join('') + '</w:tblGrid>' +
    rows.map(function (r) { return '<w:tr><w:trPr><w:cantSplit/>' + (r.h ? '<w:trHeight w:val="' + r.h + '" w:hRule="atLeast"/>' : '') + '</w:trPr>' + r.cells.join('') + '</w:tr>'; }).join('') + '</w:tbl>';
}
var IMGN = 0;
function imagen(rid, cx, cy, nombre) {
  IMGN++;
  return '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:docPr id="' + IMGN + '" name="' + esc(nombre || 'Imagen ' + IMGN) + '"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>' +
    '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="' + IMGN + '" name="' + esc(nombre || 'imagen') + '"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="' + rid + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
    '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
}
/* documento carta con márgenes en twips (por omisión 0,45 pulgadas) */
function documento(cuerpo, imagenes, o) {
  o = o || {}; var mg = o.margen || 650;
  var doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>' +
    cuerpo + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="' + mg + '" w:right="' + mg + '" w:bottom="' + mg + '" w:left="' + mg + '" w:header="300" w:footer="300" w:gutter="0"/></w:sectPr></w:body></w:document>';
  var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    imagenes.map(function (im) { return '<Relationship Id="' + im.rid + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/' + im.nombre + '"/>'; }).join('') + '</Relationships>';
  var files = [
    { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>' },
    { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
    { name: 'word/document.xml', data: doc }, { name: 'word/_rels/document.xml.rels', data: rels },
    { name: 'word/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/><w:sz w:val="16"/><w:szCs w:val="16"/><w:lang w:val="es-PA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>' }
  ];
  imagenes.forEach(function (im) { files.push({ name: 'word/media/' + im.nombre, data: im.bytes }); });
  return zip(files);
}
/* ───────── imágenes ───────── */
function pngTam(b) { return { w: (b[16] << 24 | b[17] << 16 | b[18] << 8 | b[19]) >>> 0, h: (b[20] << 24 | b[21] << 16 | b[22] << 8 | b[23]) >>> 0 }; }
function cargarBytes(url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error('No se pudo leer ' + url); return r.arrayBuffer(); }).then(function (a) { return new Uint8Array(a); }); }
function svgAPng(svg, w, h) {
  return new Promise(function (ok, mal) {
    var img = new Image();
    img.onload = function () {
      var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h);
      c.toBlob(function (b) { if (!b) return mal(new Error('No se pudo armar la imagen')); b.arrayBuffer().then(function (a) { ok(new Uint8Array(a)); }); }, 'image/png');
    };
    img.onerror = function () { mal(new Error('No se pudo dibujar el camión')); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
function descargar(blob, nombre) {
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
window.DOCXMINI = { zip: zip, esc: esc, run: run, para: para, cell: cell, table: table, imagen: imagen, documento: documento, pngTam: pngTam, cargarBytes: cargarBytes, svgAPng: svgAPng, descargar: descargar };
})();
