/* ECOVSA 3.107 · Cierre del conductor y vista previa de oficina.
   Solo el botón envía. Sin cola offline de correo; se conserva el intento. */
(function(w){
'use strict';if(w.RecibosCanales3107)return;
var C=w.RecibosCanales3107={},URL_API='https://wgufdfagvyelsypypkyr.supabase.co/functions/v1/api',desktop=null,movil=null,librerias={};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
function eq(){var e='';try{e=localStorage.getItem('eco_equipo')||'';}catch(_){}if(!/^[a-z0-9]{12,40}$/.test(e)){e=crypto.randomUUID().replace(/-/g,'');try{localStorage.setItem('eco_equipo',e);}catch(_){}}return e;}
function eqTxt(){var u=navigator.userAgent||'',so=/Android/.test(u)?'Android':/iPhone|iPad/.test(u)?'iPhone':/Windows/.test(u)?'Windows':/Mac OS/.test(u)?'Mac':/Linux/.test(u)?'Linux':'Equipo',nav=/Edg\//.test(u)?'Edge':/OPR\//.test(u)?'Opera':/Chrome\//.test(u)?'Chrome':/Firefox\//.test(u)?'Firefox':/Safari\//.test(u)?'Safari':'navegador';return so+' · '+nav;}
C.rpc=function(fn,args){return fetch(URL_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fn:fn,args:args,eq:eq(),eqd:eqTxt()}),signal:AbortSignal.timeout(35000)}).then(function(r){if(!r.ok)throw Error('No se pudo conectar con el servidor.');return r.json();}).then(function(j){if(!j||!j.ok)throw Error(j&&j.error||'No se pudo completar el pedido.');if(!j.r||!j.r.ok){var e=Error(j.r&&j.r.error||'No se pudo completar el pedido.');e.incierto=!!(j.r&&(j.r.incierto||j.r.enProceso));throw e;}return j.r;});};
C.correos=function(s){s=String(s||'').trim();if(!s)return [];if(s.length>1000||/[\r\n<>\x00-\x1f]/.test(s))throw Error('Revisa los correos: sepáralos con coma.');var a=s.split(/[;,]/).map(function(x){return x.trim();});if(a.some(function(x){return !x||x.length>254||!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(x);}))throw Error('Escribe correos válidos, separados por coma.');return a;};
C.union=function(){var a=[];for(var i=0;i<arguments.length;i++)a=a.concat(C.correos(arguments[i]));a=Array.from(new Map(a.map(function(x){return [x.toLowerCase(),x];})).values());if(a.length>10||a.join(', ').length>1000)throw Error('Se admiten hasta diez correos para recibos.');return a;};
function tel(s){var n=String(s||'').replace(/\D/g,'');if(n.length===8)n='507'+n;return /^\d{10,13}$/.test(n)?n:'';}
function modo(s){return /^(correo|whatsapp|ambos)$/.test(String(s||''))?s:'';}
function mensaje(d){if(typeof w.textoRecibo==='function')return w.textoRecibo(d,false);return 'Estimados '+(d.cliente||'')+':\n\nLe enviamos en PDF el comprobante de la recolección del '+(d.fecha||'')+'.\n\nRecibo N.º '+d.recibo+' · '+Number(d.totalKg||0).toFixed(2)+' kg.\n'+(d.firmante?'Entregó: '+d.firmante+'.\n':'')+'\nGracias por confiar en ECOVSA.\nTel. 310-2268 · info@ecovsa.com';}
function asunto(d){return typeof w.asuntoRecibo==='function'?w.asuntoRecibo(d):'Recibo N.º '+d.recibo+' · recolección del '+d.fecha+' · ECOVSA';}
function base64(blob){return new Promise(function(ok,mal){var f=new FileReader();f.onload=function(){ok(String(f.result).split(',')[1]);};f.onerror=function(){mal(Error('No se pudo leer el PDF.'));};f.readAsDataURL(blob);});}
function cargar(src,prueba){if(prueba())return Promise.resolve();if(librerias[src])return librerias[src];librerias[src]=new Promise(function(ok,mal){var s=document.createElement('script');s.src=src;s.onload=function(){prueba()?ok():mal(Error('No se pudo preparar la biblioteca del recibo.'));};s.onerror=function(){mal(Error('No se pudo cargar el PDF. Reintenta con conexión.'));};document.head.appendChild(s);}).catch(function(e){delete librerias[src];throw e;});return librerias[src];}
function pdfCanonico(d,e){return cargar('jspdf.umd.min.js',function(){return !!w.jspdf;}).then(function(){return cargar('recibos-pdf3107.js',function(){return !!w.RecibosPDF3107;});}).then(function(){return w.RecibosPDF3107.crear(d,e);});}
function nuevo(pin,folio){return {pin:pin,folio:folio,cfg:{correo:'',reciboDigital:'',whatsapp:''},canal:'',inicial:'',extra:'',telefono:'',guardar:false,agregar:false,busy:false,payload:null,pdf:null,ready:false,error:'',incierto:false,correoOk:false,waOk:false,waPreparado:false,id:crypto.randomUUID()};}
function elegido(s){return modo(s.canal)||modo(s.cfg.reciboDigital);}
function guardarModo(s,canal){var m=elegido(s);return m&&m!==canal?'ambos':(m||canal);}
function actualizarCliente(s){if(!s.parada)return;var c=w.cli(s.parada.clienteId);if(!c)return;c.reciboDigital=s.cfg.reciboDigital;c.correosRecibos=s.cfg.correosRecibos||'';try{w.guardarLocal(w.K_CLI,w.CLIENTES);}catch(_){}}
function notificar(s){if(w.parent!==w)w.parent.postMessage({tipo:'ecovsa:recibo-envio3107',recibo:s.folio},location.origin);}
function evidencia(s,r){s.sello=r.enviado||r.sello||'';s.correoOk=!!r.correoEnviado||/correo/i.test(s.sello);s.waOk=!!r.whatsappEnviado||/whatsapp/i.test(s.sello);if(s.parada){s.parada.correoEnviado=r.correoEnviado||'';s.parada.whatsappEnviado=r.whatsappEnviado||'';s.parada.marcaEnvio3107=s.sello;try{w.guardarLocal(w.K_PAR,w.RUTA);}catch(_){}}if(w.DATOS_RECIBO&&w.DATOS_RECIBO.recibo===s.folio){w.DATOS_RECIBO.enviado=s.sello;w.DATOS_RECIBO.marcaEnviado=s.sello;w.pintarBarra();}notificar(s);}
function obtenerDestinos(s){if(s.cfg.errorDestinatarios)throw Error(s.cfg.errorDestinatarios);var a=C.union(s.cfg.correo,s.inicial,s.extra);if(!a.length)throw Error('Escribe el correo del cliente.');return a;}
async function guardar(s,canal){if(!s.guardar||s.preferenciaGuardada)return;var adicionales=C.union(s.inicial,s.extra).join(', ');s.cfg=await C.rpc('api_recContactoGuardar',[s.pin,s.folio,{canal:guardarModo(s,canal),correoAdicional:adicionales,whatsapp:tel(s.telefono)||''}]);s.preferenciaGuardada=true;actualizarCliente(s);}
function cambioBloqueado(s){return s.busy||!!s.payload;}
async function enviarCorreo(s){
 if(s.busy||s.correoOk)return;if(!s.ready||!s.pdf)throw Error('Espera a que el recibo quede guardado y el PDF esté listo.');
 if(!s.cfg.activo||!s.cfg.configurado)throw Error('El envío por correo está apagado o sin conexión configurada.');
 if(!s.payload){var para=obtenerDestinos(s);s.asunto=String(s.asunto||asunto(s.d)).trim();s.texto=String(s.texto||mensaje(s.d)).trim();if(!s.asunto||s.asunto.length>200||/[\r\n]/.test(s.asunto)||!s.texto||s.texto.length>6000)throw Error('Revisa el asunto y el mensaje.');
  s.busy=true;dibujar(s);try{await guardar(s,'correo');s.payload={id:s.id,para:para.join(', '),asunto:s.asunto,texto:s.texto,pdf:await base64(s.pdf.blob),guardar:false};}catch(e){s.busy=false;throw e;}
 }else{s.busy=true;dibujar(s);}
 try{var r=await C.rpc('api_recCorreoEnviar',[s.pin,s.folio,s.payload]);if(!r.aceptado)throw Error('No se recibió confirmación del proveedor.');s.correoOk=true;s.incierto=false;s.sello=r.sello;
  try{var estado=await C.rpc('api_recCorreoEstado',[s.pin,s.folio]);s.cfg=estado;evidencia(s,estado);}catch(_){evidencia(s,r);}
  s.error='Correo con PDF aceptado por Resend.';return r;
 }catch(e){s.incierto=!!e.incierto||/conectar|confirm|fetch|network|timeout|abort/i.test(e.message);throw e;}finally{s.busy=false;dibujar(s);if(s.tipo==='desktop'&&s.correoOk&&desktop===s){desktop=null;var hj=document.getElementById('hj');if(hj)hj.classList.remove('si');if(w.avisoRec)w.avisoRec('Correo con PDF aceptado por Resend.');}}
}
function descargar(r){var u=URL.createObjectURL(r.blob),a=document.createElement('a');a.href=u;a.download=r.nombre;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},60000);}
async function compartirWa(s){
 if(s.busy||!s.ready||!s.pdf)throw Error('Espera a que el recibo quede guardado y el PDF esté listo.');var n=tel(s.telefono||s.cfg.whatsapp);if(!n)throw Error('Escribe un número de WhatsApp válido.');
 var nativa=w.APP38&&typeof w.APP38.tiene==='function'&&w.APP38.tiene('compartirArchivo')&&w.EcovsaApp,chat=nativa?null:w.open('about:blank','_blank');if(!nativa&&!chat)throw Error('Permite abrir WhatsApp en una pestaña nueva.');if(chat)chat.opener=null;
 s.busy=true;dibujar(s);try{await guardar(s,'whatsapp');if(nativa){var datos=await base64(s.pdf.blob);w.EcovsaApp.compartirArchivo('data:application/pdf;base64,'+datos,s.pdf.nombre,'application/pdf',mensaje(s.d));}else{descargar(s.pdf);chat.location.href='https://wa.me/'+n+'?text='+encodeURIComponent(mensaje(s.d)+'\n\nAdjuntamos el PDF del recibo.');}
  s.waPreparado=n;s.error='Adjunta el PDF en WhatsApp. Confirma aquí cuando lo hayas enviado.';
 }catch(e){if(chat)chat.close();throw e;}finally{s.busy=false;dibujar(s);}
}
function dibujar(s){if(s.tipo==='movil'){if(movil===s&&document.getElementById('cf-ok')===s.raiz){w.p9Pintar_(s.i);s.raiz.querySelectorAll('button,input').forEach(function(e){if(s.busy&&!e.disabled){e.dataset.rc107Restaurar='1';e.disabled=true;}else if(!s.busy&&e.dataset.rc107Restaurar){e.disabled=false;delete e.dataset.rc107Restaurar;}});}}else if(desktop===s){pintarDesktop(s);}}
function error(s,e){s.error=e.message||String(e);s.busy=false;dibujar(s);if(s.tipo==='desktop'&&w.avisoRec)w.avisoRec(s.error);}
function campos(s,pc){
 var m=elegido(s),lock=cambioBloqueado(s)?' disabled':'',h='',id=pc?'hj-dest':'rc107-inicial';
 if(!modo(s.cfg.reciboDigital)&&!pc){h+='<div class="pc-tit">¿Cómo desea recibir el recibo?</div><div class="pc-seg">'+[['correo','Correo'],['whatsapp','WhatsApp'],['ambos','Ambos']].map(function(x){return '<button type="button" class="'+(m===x[0]?'on':'')+'" onclick="rc107Canal(\''+x[0]+'\')"'+lock+'>'+x[1]+'</button>';}).join('')+'</div>';}
 if(!m&&!pc)return h+'<p class="p9-nota">Elija un canal para continuar. Si lo guarda, se usará en próximas visitas.</p>';
 if(pc||m==='correo'||m==='ambos'){
  if(s.cfg.correo){h+='<div class="'+(pc?'':'p9-dst')+'"><label class="'+(pc?'hj-l':'l')+'" for="'+id+'">'+(pc?'DESTINATARIOS GUARDADOS':s.cfg.correosRecibos?'Correos guardados para recibos':s.cfg.correoPrincipal?'Correo principal registrado':'Correos guardados para recibos')+'</label>';
   if(pc)h+='<div class="hj-in"><input id="hj-dest" value="'+esc(s.cfg.correo)+'" readonly></div>';
   else h+=s.cfg.correo.split(/[,;]/).map(function(x){return '<div class="v"><span style="word-break:normal;overflow-wrap:break-word">'+esc(x.trim())+'</span></div>';}).join('');h+='</div>';
   if(!s.agregar)h+='<button type="button" class="'+(pc?'hj-lk':'p9-lk')+'" onclick="rc107Agregar()"'+lock+'>Agregar otro correo</button>';
  }else h+='<label class="'+(pc?'hj-l':'l')+'" for="'+id+'">Correo del cliente</label><input class="'+(pc?'hj-in2':'p9-in')+'" id="'+id+'" type="email" placeholder="correo@cliente.com" value="'+esc(s.inicial)+'" oninput="rc107Campo(\'inicial\',this.value)"'+lock+'>';
  if(s.agregar)h+='<div class="'+(pc?'':'p9-dst')+'"><label class="'+(pc?'hj-l':'l')+'" for="rc107-extra">Correo adicional</label><input class="'+(pc?'hj-in2':'p9-in')+'" id="rc107-extra" inputmode="email" placeholder="persona@cliente.com" value="'+esc(s.extra)+'" oninput="rc107Campo(\'extra\',this.value)"'+lock+'><div class="'+(pc?'hj-n':'p9-nota')+'">Se añade al correo principal; ambos recibirán el PDF.</div></div>';
 }
 if(!pc&&(m==='whatsapp'||m==='ambos'))h+='<div class="p9-dst"><label class="l" for="rc107-telefono">WhatsApp del cliente</label><input class="p9-in" id="rc107-telefono" inputmode="tel" value="'+esc(s.telefono)+'" oninput="rc107Campo(\'telefono\',this.value)"'+lock+'></div>';
 if(s.agregar||!modo(s.cfg.reciboDigital)||!s.cfg.correo)h+='<label class="'+(pc?'hj-ck':'')+'" style="display:flex;gap:8px;align-items:center;justify-content:flex-start;text-align:left;font-weight:500;text-transform:none;letter-spacing:0;font-size:13px;line-height:1.4;margin:12px 0"><input id="rc107-guardar" type="checkbox" style="width:16px;min-width:16px;height:16px;flex:0 0 16px;margin:0" onchange="rc107Campo(\'guardar\',this.checked)" '+(s.guardar?'checked ':'')+lock+'><span>Guardar '+(pc?'este correo para próximos recibos':'para los próximos recibos')+'</span></label>';
 return h;
}
function actual(){return desktop||movil;}
w.rc107Canal=function(c){var s=actual();if(!s||cambioBloqueado(s))return;s.canal=c;dibujar(s);};
w.rc107Agregar=function(){var s=actual();if(!s||cambioBloqueado(s))return;s.agregar=true;dibujar(s);var e=document.getElementById('rc107-extra');if(e)e.focus();};
w.rc107Campo=function(k,v){var s=actual();if(!s||cambioBloqueado(s)||!['inicial','extra','telefono','guardar','asunto','texto'].includes(k))return;if(k==='telefono'&&s[k]!==v){s.waPreparado=false;var b=document.getElementById('rc107-confirmar-wa');if(b)b.style.display='none';}s[k]=v;};
w.rc107Correo=function(){var s=actual();if(s)enviarCorreo(s).catch(function(e){error(s,e);});};
w.rc107WhatsApp=function(){var s=movil;if(s)compartirWa(s).catch(function(e){error(s,e);});};
w.rc107ConfirmarWa=async function(){var s=movil;if(!s||!s.waPreparado||s.busy)return;s.busy=true;dibujar(s);try{var r=await C.rpc('api_recWhatsAppConfirmar',[s.pin,s.folio,s.waPreparado]);s.waOk=true;s.waPreparado=false;evidencia(s,r);s.error='Envío por WhatsApp confirmado por el operador.';}catch(e){error(s,e);}finally{s.busy=false;dibujar(s);}};
w.rc107Reintentar=function(){var s=movil;if(s&&!s.busy)iniciarMovil(s);};
function resumenError(s){if(s.error)return s.error;if(!s.ready)return s.esperando?'El recibo todavía está por subir. El envío se habilita cuando quede guardado.':'Preparando el recibo y sus contactos…';if(!s.cfg.activo||!s.cfg.configurado)return 'El envío por correo está apagado. WhatsApp sigue disponible.';return 'El recibo está guardado. El envío se confirma por separado.';}
function bloqueMovil(i){var s=movil;if(!s||s.i!==i)return '';var m=elegido(s),h='<div class="p9-box" id="p9-box">'+campos(s,false)+'<div class="p9-nota" role="status" id="rc107-estado">'+esc(resumenError(s))+'</div>';
 if(m==='correo'||m==='ambos')h+='<button type="button" class="cf-b az" id="rc107-enviar-correo" onclick="rc107Correo()"'+(!s.ready||s.busy||s.correoOk||!s.cfg.activo||!s.cfg.configurado?' disabled':'')+'>'+(s.busy?'Procesando…':s.correoOk?'Correo enviado':s.payload?'Reintentar este mismo envío':'Enviar correo con PDF')+'</button>';
 if(m==='whatsapp'||m==='ambos')h+='<button type="button" class="cf-b wa" id="rc107-enviar-wa" onclick="rc107WhatsApp()"'+(!s.ready||s.busy?' disabled':'')+'>'+(s.waOk?'Compartir PDF por WhatsApp otra vez':'Compartir PDF por WhatsApp')+'</button>';
 if(s.waPreparado)h+='<button type="button" class="p9-lk" id="rc107-confirmar-wa" onclick="rc107ConfirmarWa()"'+(s.busy?' disabled':'')+'>Ya envié el PDF</button>';
 if(s.error&&!s.ready&&!s.esperando)h+='<button type="button" class="p9-lk" onclick="rc107Reintentar()">Reintentar conexión</button>';
 return h+'</div>';
}
function vigente(s){return movil===s&&document.getElementById('cf-ok')===s.raiz;}
async function iniciarMovil(s){
 if(!vigente(s)||s.cargando)return;if((w.COLA||[]).some(function(x){return x.registroId===s.parada.registroId;})){s.esperando=true;dibujar(s);clearTimeout(s.timer);s.timer=setTimeout(function(){iniciarMovil(s);},1800);return;}
 s.esperando=false;s.cargando=true;s.error='';dibujar(s);
 try{var cfg=await C.rpc('api_recCorreoEstado',[s.pin,s.folio]);if(!vigente(s))return;s.cfg=cfg;if(!s.telefono)s.telefono=cfg.whatsapp||'';actualizarCliente(s);evidencia(s,cfg);
  var detalle=await C.rpc('api_obtenerDetalleRecibo',[s.folio,'',s.pin]);if(!vigente(s))return;s.d=detalle.datos;s.asunto=asunto(s.d);s.texto=mensaje(s.d);s.pdf=await pdfCanonico(s.d,detalle.empresa);if(!vigente(s))return;s.ready=true;var sync=document.getElementById('cf-sync');if(sync&&typeof w.cfSync_==='function')sync.outerHTML=w.cfSync_(s.parada);
 }catch(e){if(vigente(s))s.error=e.message;}finally{s.cargando=false;if(vigente(s))dibujar(s);}
}
if(typeof w.cfConfirmar_==='function'&&typeof w.p9Bloque_==='function'){
 var antiguoBloque=w.p9Bloque_,antiguaConfirmacion=w.cfConfirmar_,antiguoCerrar=w.cfCerrar_;
 function esCierreMovil(){return !w.esSupervisor()&&(matchMedia('(max-width:1000px)').matches||(w.APP38&&w.APP38.tiene&&w.APP38.tiene('compartirArchivo')));}
 w.p9Bloque_=function(i){return movil&&movil.i===i?bloqueMovil(i):antiguoBloque.apply(this,arguments);};
 w.cfConfirmar_=function(i){if(!esCierreMovil())return antiguaConfirmacion.apply(this,arguments);if(movil&&movil.busy)return;if(movil&&movil.incierto&&!w.confirm('Hay un correo sin confirmar. ¿Cerrar ese intento y abrir otro recibo?'))return;var p=w.RUTA.paradas[i],c=w.cli(p.clienteId)||{},s=nuevo(w.PIN,p.recibo);if(movil)clearTimeout(movil.timer);movil=null;s.tipo='movil';s.i=i;s.parada=p;s.cfg={correo:[c.correo,c.correosRecibos].filter(Boolean).join(', '),correoPrincipal:c.correo||'',reciboDigital:c.reciboDigital||'',whatsapp:c.whatsapp||c.telefono||''};s.telefono=s.cfg.whatsapp;
  w._cfConfirmar9_(i);movil=s;s.raiz=document.getElementById('cf-ok');w.p9Pintar_(i);iniciarMovil(s);
 };
 w.cfCerrar_=function(){if(movil&&movil.busy)return;if(movil&&movil.incierto&&!w.confirm('El resultado del correo no está confirmado. Cerrar no lo cancela. Reintenta este mismo intento antes de crear otro. ¿Cerrar?'))return;if(movil)clearTimeout(movil.timer);movil=null;return antiguoCerrar.apply(this,arguments);};
 document.addEventListener('keydown',function(e){if(!movil||desktop||!movil.raiz||!movil.raiz.contains(e.target))return;if(e.key==='Escape'){e.preventDefault();w.cfCerrar_();}if(e.key==='Enter'&&e.target.tagName==='INPUT'&&e.target.type!=='checkbox'){e.preventDefault();if(elegido(movil)==='whatsapp'||e.target.id==='rc107-telefono')w.rc107WhatsApp();else w.rc107Correo();}});
}
function pintarDesktop(s){
 if(desktop!==s)return;var v=document.getElementById('hj');if(!v){v=document.createElement('div');v.id='hj';v.className='hj';document.body.appendChild(v);}v.setAttribute('data-canal','correo');v.onclick=function(e){if(e.target===v)w.cerrarEnvio();};
 var h='<div class="hj-c" role="dialog" aria-modal="true" aria-label="Enviar por correo"><div class="hj-t">✉ Enviar por correo</div><div class="hj-s">Recibo '+esc(s.folio)+' · '+(s.pdf?'PDF listo ('+Math.max(1,Math.round(s.pdf.blob.size/1024))+' KB)':'preparando el PDF…')+'</div>'+campos(s,true);
 var lock=cambioBloqueado(s)?' disabled':'';
 h+='<label class="hj-l" for="hj-asunto">ASUNTO</label><input class="hj-in2" id="hj-asunto" value="'+esc(s.asunto||'')+'" oninput="rc107Campo(\'asunto\',this.value)"'+lock+'><label class="hj-l" for="hj-msg">MENSAJE · se puede editar</label><textarea id="hj-msg" rows="8" oninput="rc107Campo(\'texto\',this.value)"'+lock+'>'+esc(s.texto||'')+'</textarea><div class="hj-n" id="rc107-estado" role="status">'+esc(s.error||(!s.ready?'Preparando recibo y contactos…':!s.cfg.activo||!s.cfg.configurado?'El envío por correo está apagado en Configuración.':'Se enviará el PDF a los destinatarios guardados y al correo adicional que indiques.'))+'</div>';
 h+='<button type="button" class="hj-b az" id="hj-go" onclick="rc107Correo()"'+(!s.ready||s.busy||s.correoOk||!s.cfg.activo||!s.cfg.configurado?' disabled':'')+'>'+(s.busy?'Enviando PDF…':s.correoOk?'Correo enviado':s.payload?'Reintentar este mismo envío':'Enviar correo con PDF')+'</button><button type="button" class="hj-b gr" onclick="cerrarEnvio()"'+(s.busy?' disabled':'')+'>Cancelar</button></div>';
 v.innerHTML=h;v.classList.add('si');
}
if(typeof w.abrirEnvio==='function'){
 var antiguoAbrir=w.abrirEnvio,antiguoCerrarEnvio=w.cerrarEnvio,antiguoGuardarFicha=w.guardarEnFicha,antiguaMarca=w.marcarEnviado;
 w.abrirEnvio=function(canal){if(desktop&&desktop.busy)return;if(canal!=='correo'){desktop=null;return antiguoAbrir.apply(this,arguments);}if(!w.DATOS_RECIBO)return;var s=nuevo(w.PIN_ENV,w.DATOS_RECIBO.recibo);desktop=s;s.tipo='desktop';s.d=w.DATOS_RECIBO;s.asunto=asunto(s.d);s.texto=mensaje(s.d);s.cfg={correo:s.d.correo||'',correoPrincipal:s.d.correo||'',reciboDigital:s.d.reciboDigital||''};pintarDesktop(s);
  C.rpc('api_recCorreoEstado',[s.pin,s.folio]).then(function(cfg){if(desktop!==s)return;s.cfg=cfg;return new Promise(function(ok,mal){w.prepararPdf(function(r,e){r?ok(r):mal(Error(e||'No se pudo preparar el PDF.'));});});}).then(function(pdf){if(desktop!==s)return;s.pdf=pdf;s.ready=true;pintarDesktop(s);}).catch(function(e){if(desktop===s)error(s,e);});
 };
 w.cerrarEnvio=function(){var s=desktop;if(!s)return antiguoCerrarEnvio.apply(this,arguments);if(s.busy)return;if(s.incierto&&!w.confirm('El correo no está confirmado. Cerrar no cancela un envío aceptado. ¿Cerrar sin reintentar este intento?'))return;desktop=null;var v=document.getElementById('hj');if(v)v.classList.remove('si');};
 w.guardarEnFicha=function(campo,valor){var ck=document.getElementById('hj-guardar');if(campo!=='whatsapp'||!ck||!ck.checked||!w.DATOS_RECIBO)return antiguoGuardarFicha.apply(this,arguments);var d=w.DATOS_RECIBO,m=modo(d.reciboDigital);C.rpc('api_recContactoGuardar',[w.PIN_ENV,d.recibo,{canal:m&&m!=='whatsapp'?'ambos':(m||'whatsapp'),correoAdicional:'',whatsapp:valor}]).then(function(r){d.reciboDigital=r.reciboDigital;w.avisoRec('Preferencia de recibo guardada');notificar({folio:d.recibo});}).catch(function(e){w.avisoRec(e.message);});};
 w.marcarEnviado=function(canal){var m=String(canal||'').match(/whatsapp\s*→\s*(.+)$/i);if(!m||!w.DATOS_RECIBO)return antiguaMarca.apply(this,arguments);var d=w.DATOS_RECIBO;C.rpc('api_recWhatsAppConfirmar',[w.PIN_ENV,d.recibo,m[1]]).then(function(r){d.enviado=r.sello;d.marcaEnviado=r.sello;w.pintarBarra();notificar({folio:d.recibo});w.avisoRec('Envío por WhatsApp confirmado por el operador.');}).catch(function(e){w.avisoRec(e.message);});};
 w.correoDirecto=w.enviarCorreo=w.rm106Enviar=w.rc107Correo;
 document.addEventListener('keydown',function(e){if(!desktop)return;if(e.key==='Escape'){e.preventDefault();w.cerrarEnvio();}if(e.key==='Enter'&&e.target.tagName!=='TEXTAREA'&&e.target.tagName!=='BUTTON'){e.preventDefault();w.rc107Correo();}});
}
/* Oficina mantiene SIEMPRE su ventana real de vista previa. */
if(typeof w.rx2Enviar_==='function'){
 var anteriorEnviar=w.rx2Enviar_,anteriorFiltro=w.rx2Filtrar_,anteriorPintar=w.rx2Pintar_;
 w.rx2Enviar_=function(folio){return anteriorEnviar(folio,'');};
 function completo(r){var t=String(r.enviado||''),co=/correo/i.test(t),wa=/whatsapp/i.test(t);if(!t)return false;if(!co&&!wa)return true;return r.pide==='ambos'?co&&wa:r.pide==='correo'?co:r.pide==='whatsapp'?wa:true;}
 w.rx2Filtrar_=function(L){if(w.RX2.fil==='porEnviar')return L.filter(function(r){return r.pide&&!completo(r);});if(w.RX2.fil==='enviados')return L.filter(completo);return anteriorFiltro.apply(this,arguments);};
 w.rx2Pintar_=function(){var ret=anteriorPintar.apply(this,arguments),L=w.RX2.lista||[],pend=L.filter(function(r){return r.pide&&!completo(r);}),ok=L.filter(completo);
  document.querySelectorAll('.rx2-tag.ok[title],.c38-tag.ok[title]').forEach(function(t){var v=t.title,co=/correo/i.test(v),wa=/whatsapp/i.test(v),r=L.find(function(r){return String(r.enviado||'')===v;});if(!co&&!wa)return;var m=v.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})/);t.textContent=(co&&wa?'Correo y WhatsApp enviados':co?'Correo enviado':'WhatsApp enviado')+(m?' · '+w.c2Fecha_(m[1])+' '+m[2]:'');if(r&&r.pide==='ambos'&&!(co&&wa)){var aviso=document.createElement('span');aviso.className=t.classList.contains('c38-tag')?'c38-tag warn':'rx2-tag am';aviso.textContent=co?'WhatsApp pendiente':'Correo pendiente';t.after(aviso);}});
  document.querySelectorAll('#rx2-fil button').forEach(function(b){if(/^Por enviar/.test(b.textContent))b.textContent='Por enviar · '+pend.length;if(/^Enviados/.test(b.textContent))b.textContent='Enviados · '+ok.length;});
  var pie=document.getElementById('rx2-pie');if(pie&&!pie.querySelector('button')){var F=w.rx2Filtrar_(L),kg=F.reduce(function(a,r){return a+Number(r.totalKg||0);},0);pie.textContent='Selección: '+F.length+' recibo(s) · '+kg.toFixed(1)+' kg · '+F.filter(completo).length+' enviados · '+F.filter(function(r){return r.pide&&!completo(r);}).length+' por enviar';}
  if(pie&&typeof w.c38Es_==='function'&&w.c38Es_()){pie.innerHTML=pend.length?'<button class="c38-btn pri" onclick="rx2Enviar_('+esc(JSON.stringify(pend[0].recibo))+')">'+(pend.length===1?'Enviar el recibo':'Enviar los '+pend.length+' recibos')+'</button>':'';var box=document.getElementById('rx2');if(box)box.classList.toggle('c38-conpie',!!pend.length);}
  return ret;};
 w.addEventListener('message',function(e){var f=document.getElementById('mvr-frame');if(e.origin!==location.origin||!f||e.source!==f.contentWindow||!e.data||e.data.tipo!=='ecovsa:recibo-envio3107'||typeof e.data.recibo!=='string')return;if(w.RX2){w.RX2.recargar=true;if(document.getElementById('rx2'))w.rx2Cargar_();}});
}
})(window);
