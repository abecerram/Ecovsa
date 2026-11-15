const fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const html=fs.readFileSync('Index.html','utf8');
if(sha(html)!=='5f7f3cfd3f947050782a6204337d296b4893369e884a8a2976c38e8f3f4cb5db')throw Error('Index cambió: rearmar, no sobrescribir');
const js=fs.readFileSync('.github/planificador398/pantalla_398.js','utf8'),css=fs.readFileSync('.github/planificador398/estilos_398.css','utf8');
const nuevo=html.replace('</head>','<style id="estilo-398">\n'+css+'\n</style>\n</head>').replace('</body>','<script id="js-398">\n'+js+'\n</script>\n</body>');
if(sha(nuevo)!=='a0aa4c30b03b6513e492978d929f608feb6422a1c1e7af68a04e9abc443b4ac9')throw Error('La pantalla difiere del archivo probado; no se guarda');
let n=0;for(const m of nuevo.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(!/\bsrc=/.test(m[1])&&!/application\/ld\+json/.test(m[1])){new vm.Script(m[2]);n++;}}
if(n<5)throw Error('Faltan scripts en la pantalla');
fs.writeFileSync('Index.html',nuevo);console.log('Index 3.98 probado: '+sha(nuevo));
