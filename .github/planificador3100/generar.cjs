const fs=require('fs'),path=require('path'),crypto=require('crypto'),vm=require('vm');
const root=__dirname,base=fs.readFileSync(path.resolve(root,'../../Index.html'),'utf8'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
if(sha(base)!=='745a46cf83ac451dc33280f376721aebaf3f6f4a95382e6883c49b8c0030a62c')throw Error('La pantalla base cambió: rearmar antes de publicar');
if(base.includes('id="js-3100"'))throw Error('El paquete ya estaba aplicado');
const css=fs.readFileSync(path.join(root,'estilos_3100.css'),'utf8'),js=fs.readFileSync(path.join(root,'pantalla_3100.js'),'utf8');new vm.Script(js);
const html=base.replace('</head>','<style id="estilo-3100">\n'+css+'\n</style>\n</head>').replace('</body>','<script id="js-3100">\n'+js+'\n</script>\n</body>');
fs.mkdirSync(path.join(root,'GitHub/Ecovsa'),{recursive:true});fs.writeFileSync(path.resolve(root,'../../Index.html'),html);
fs.writeFileSync(path.join(root,'SHA256.json'),JSON.stringify({baseSha256:sha(base),indexSha256:sha(html),api:'sin cambio; api 3.99'},null,2)+'\n');
