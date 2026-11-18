const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const html = fs.readFileSync(require('path').join(__dirname, '..', 'Index.html'), 'utf8');
let scripts = 0;
for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
  if (!m[2].trim() || /type=["'](?:application\/json|application\/ld\+json)/i.test(m[1])) continue;
  new vm.Script(m[2], {filename: 'inline-' + (++scripts)});
}
function extract(name) {
  const start = html.indexOf('function ' + name + '(');
  assert(start >= 0, name);
  const end = html.indexOf('\nfunction ', start + 1);
  return html.slice(start, end);
}
const banner = {innerHTML:'', scrollIntoView(){}};
const disk = new Map();
let sent = 0, success, failure, lastToast = '';
const c = {
  COLA: [{registroId:'a'}, {registroId:'b'}], ENVIO_CIERRE:{ocupado:false,error:''},
  K_COLA:'ecovsa_cola', PIN:'test', RUTA:{rutaId:'ruta',fecha:'2026-11-16',paradas:[]},
  JORNADA:{kmInicio:100}, JV:{km:'120'}, navigator:{onLine:true},
  localStorage:{getItem:k => disk.get(k) || null},
  $:id => id === 'jv-envios' ? banner : null,
  esc:s => String(s).replace(/</g, '&lt;'), toast:s => lastToast=s,
  guardarLocal:(k,v) => disk.set(k, JSON.stringify(v)),
  esSupervisor:() => false, aplicarRutaServidor_:() => {},
  num:Number, jvGuardar_:() => {},
  google:{script:{run:{withSuccessHandler(f){success=f;return this;},
    withFailureHandler(f){failure=f;return this;}, api_guardarLote(){sent++;}}}},
};
c.window=c;
vm.createContext(c);
for (const name of ['estadoEnvioCierre_','pintarAvisoEnvioCierre_','enviarPendientesCierre_',
  'comprobarEnviosAntesDeCerrar_','sincronizar','cerrarJornadaConRevision_','cerrarJornada']) {
  vm.runInContext(extract(name),c);
}
c.pintarSync = () => c.pintarAvisoEnvioCierre_();
let checks=0;
function test(name, fn){fn();checks++;console.log('PASS '+name);}
test('pending collections show send action and block both closing paths',()=>{
  c.pintarAvisoEnvioCierre_(); assert.match(banner.innerHTML,/Enviar datos pendientes/);
  assert.equal(c.comprobarEnviosAntesDeCerrar_(),false);
  c.cerrarJornadaConRevision_(); c.cerrarJornada(); assert.equal(sent,0);
});
test('offline leaves records and visible action intact',()=>{
  c.navigator.onLine=false;c.enviarPendientesCierre_();
  assert.equal(sent,0);assert.equal(c.COLA.length,2);assert.match(banner.innerHTML,/Sin conexión/);
  c.navigator.onLine=true;
});
test('manual send starts once and cannot close before acknowledgement',()=>{
  c.enviarPendientesCierre_(); c.enviarPendientesCierre_();
  assert.equal(sent,1); assert.equal(c.ENVIO_CIERRE.ocupado,true);
  assert.equal(c.comprobarEnviosAntesDeCerrar_(),false);
});
test('partial acknowledgement preserves remaining and newly added records',()=>{
  c.COLA.push({registroId:'c'});success({ok:true,guardados:['a']});
  assert.equal(c.COLA.map(r=>r.registroId).join(','),'b,c');
  assert.equal(c.comprobarEnviosAntesDeCerrar_(),false);
});
test('network failure is visible and retains records for retry',()=>{
  c.enviarPendientesCierre_();failure(new Error('timeout'));
  assert.equal(c.COLA.length,2);assert.equal(c.ENVIO_CIERRE.ocupado,false);
  assert.match(banner.innerHTML,/No se confirmó el envío/);
});
test('server rejection is visible and cannot empty the queue',()=>{
  c.enviarPendientesCierre_();success({ok:false,error:'Sesión vencida'});
  assert.equal(c.COLA.length,2);assert.match(banner.innerHTML,/Sesión vencida/);
});
test('acknowledged duplicates count as saved, bridge queue still blocks close',()=>{
  disk.set('pnt:cola',JSON.stringify([{fn:'api_guardarLote'}]));
  c.enviarPendientesCierre_();success({ok:true,guardados:['b'],duplicados:['c']});
  assert.equal(c.COLA.length,0);assert.equal(c.comprobarEnviosAntesDeCerrar_(),false);
  assert.match(banner.innerHTML,/Enviar datos pendientes/);
});
test('recovery after bridge drains allows close',()=>{
  disk.set('pnt:cola','[]');assert.equal(c.comprobarEnviosAntesDeCerrar_(),true);
  c.pintarAvisoEnvioCierre_();assert.match(banner.innerHTML,/No quedan datos pendientes/);
});
test('unreadable bridge storage blocks close without claiming success',()=>{
  disk.set('pnt:cola','{bad');assert.equal(c.comprobarEnviosAntesDeCerrar_(),false);
  assert.match(banner.innerHTML,/No se pudo comprobar/);
});
test('closed historical journey does not claim it is still open',()=>{
  disk.set('pnt:cola','[]');c.JORNADA.cerrada=true;c.COLA.push({registroId:'d'});
  c.pintarAvisoEnvioCierre_();assert.match(banner.innerHTML,/jornada está cerrada/);
});
assert.match(extract('pintarCierre_'),/id="jv-envios"/);
assert.match(extract('pintarJornadaCerrada_'),/pintarAvisoEnvioCierre_\(\)/);
console.log(`${checks} behavior checks; ${scripts} inline scripts parsed.`);
