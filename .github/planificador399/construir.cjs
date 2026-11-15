const fs=require('fs'),path=require('path'),crypto=require('crypto'),vm=require('vm');
const root=__dirname,base=fs.readFileSync(path.resolve(root,'../../Index.html'),'utf8');
const blob=crypto.createHash('sha1').update('blob '+Buffer.byteLength(base)+'\0').update(base).digest('hex');
if(blob!=='561020817d3561a3e049c531ab2cc362a68b2d3c')throw Error('La base pública cambió');
let h=base;
const puntos=[
 ['ED.sucio = false; PL_RSEL = r.rutaId; plCargar_(PL.fecha, false);','p399Limpiar_(ED); ED.sucio = false; PL_RSEL = r.rutaId; plCargar_(PL.fecha, false);'],
 ['alAceptar: function(){ PL_RSEL = ED.rutaId; ED.sucio = false; plCargar_(PL.fecha, false); }','alAceptar: function(){ p399Limpiar_(ED); PL_RSEL = ED.rutaId; ED.sucio = false; plCargar_(PL.fecha, false); }'],
 ['toast("Ruta borrada"); ED = null; plCargar_(PL.fecha, false);','toast("Ruta borrada"); p399Limpiar_(ED); ED = null; plCargar_(PL.fecha, false);']
];
for(const [de,a]of puntos){if(h.split(de).length!==2)throw Error('No hay una única entrada de cierre: '+de);h=h.replace(de,a);}
h=h.replace('</head>','<style id="estilo-399">\n'+fs.readFileSync(path.join(root,'estilos_399.css'),'utf8')+'\n</style>\n</head>');
h=h.replace('</body>','<script id="js-399">\n'+fs.readFileSync(path.join(root,'pantalla_399.js'),'utf8')+'\n</script>\n</body>');
for(const m of h.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){if(m[1].trim())new vm.Script(m[1]);}
fs.writeFileSync(path.resolve(root,'../../Index.html'),h);fs.writeFileSync(path.join(root,'pantalla_sha256.json'),JSON.stringify({baseBlob:blob,baseSha256:crypto.createHash('sha256').update(base).digest('hex'),indexSha256:crypto.createHash('sha256').update(h).digest('hex')},null,2));
