const fs=require('fs'),path=require('path'),crypto=require('crypto'),vm=require('vm');
const root=__dirname,base=fs.readFileSync(path.resolve(root,'../../Index.html'),'utf8'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
if(sha(base)!=='cf4f7ed39cee68dbfcd208feb3511ca90c2a3caaa631e3e2b762d3fbe49289fb')throw Error('La pantalla base 3.100 cambió');
const css=fs.readFileSync(path.join(root,'estilos_3101.css'),'utf8'),js=fs.readFileSync(path.join(root,'pantalla_3101.js'),'utf8');new vm.Script(js);
const html=base.replace('</head>','<style id="estilo-3101">\n'+css+'\n</style>\n</head>').replace('</body>','<script id="js-3101">\n'+js+'\n</script>\n</body>');
fs.mkdirSync(path.join(root,'GitHub/Ecovsa'),{recursive:true});fs.writeFileSync(path.resolve(root,'../../Index.html'),html);fs.writeFileSync(path.join(root,'SHA256.json'),JSON.stringify({baseSha256:sha(base),indexSha256:sha(html),api:'sin cambio; api 3.99'},null,2)+'\n');
