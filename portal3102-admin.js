(function(w){'use strict';var C=w.Portal3102Common,P=w.Portal3102Admin={estado:null,resultado:null};
var style102=document.createElement('style');style102.textContent='[id^="p102-"][hidden]{display:none!important}';document.head.appendChild(style102);
function valor(id){return MK.val(id).trim();}
P.contacto=function(){var canal=valor('p102-canal');document.getElementById('p102-correo-campo').hidden=canal!=='correo';document.getElementById('p102-tel-campo').hidden=canal==='correo';};
P.formulario=function(estado){P.estado=estado;
 MK.lado('<h2>'+C.esc(estado.id?'Renovar invitación':'Invitar al portal')+'</h2><div class="sub">'+C.esc(estado.alcance||'')+'</div>'+
 '<label class="lb" for="p102-nombre">Nombre del destinatario</label><input class="in" id="p102-nombre" value="'+C.esc(estado.nombre||'')+'" '+(estado.id?'readonly':'')+'>'+
 '<label class="lb" for="p102-cargo">Cargo</label><input class="in" id="p102-cargo" value="'+C.esc(estado.cargo||'')+'" '+(estado.id?'readonly':'')+'>'+
 '<label class="lb" for="p102-canal">Entrega de la invitación</label><select class="in" id="p102-canal" onchange="Portal3102Admin.contacto()"><option value="correo" '+(estado.canal==='correo'?'selected':'')+'>Correo electrónico</option><option value="whatsapp" '+(estado.canal==='whatsapp'?'selected':'')+'>WhatsApp</option></select>'+
 '<div id="p102-correo-campo"><label class="lb" for="p102-correo">Un correo para esta persona</label><input class="in" type="email" id="p102-correo" autocomplete="email" value="'+C.esc(estado.correo||'')+'"><div class="small muted">Confirme el destinatario. La invitación es personal, de un solo uso y vence en 12 horas.</div></div>'+
 '<div id="p102-tel-campo"><label class="lb" for="p102-tel">Celular (WhatsApp)</label><input class="in" type="tel" id="p102-tel" value="'+C.esc(estado.telefono||'')+'"></div>'+
 '<div role="alert" class="small" id="p102-error"></div><div class="pie2"><button class="btn" onclick="MK.cerrarLado()">Cancelar</button><button class="btn pri" id="p102-preparar" onclick="Portal3102Admin.preparar(this)">Preparar invitación</button></div>');P.contacto();
 var form=document.getElementById('p102-nombre').parentElement;form.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.tagName!=='TEXTAREA'){e.preventDefault();var b=document.getElementById('p102-preparar');if(b&&!b.disabled)P.preparar(b);}});
};
P.preparar=function(btn){var s=P.estado,canal=valor('p102-canal'),correo=valor('p102-correo'),nombre=valor('p102-nombre'),tel=valor('p102-tel');
 var error=!nombre?'Escriba el nombre del destinatario.':canal==='correo'&&!C.correo(correo)?'Escriba un solo correo válido.':canal!=='correo'&&tel.replace(/\D/g,'').length<7?'Escriba un celular válido.':'';
 if(error){document.getElementById('p102-error').textContent=error;return;}MK.ocupado(btn,true);
 var args=s.id?['api_ptlReenviar',PIN,s.id,!!s.reiniciar,{canal,correo,telefono:tel}]:['api_ptlInvitar',PIN,{nivel:s.nivel,clienteId:s.clienteId,razonSocial:s.razonSocial,nombre,cargo:valor('p102-cargo'),telefono:tel,canal,correo}];
 MK.api.apply(MK,args).then(function(r){MK.ocupado(btn,false);if(!r||!r.ok){document.getElementById('p102-error').textContent=(r&&r.error)||'No se pudo preparar.';return;}P.mostrar(r);ptlCargar();},function(e){MK.ocupado(btn,false);document.getElementById('p102-error').textContent=e.message||'Sin conexión.';});
};
P.mostrar=function(r){if(r.yaActivo){MK.aviso('Esa persona ya tiene su acceso activo.');return;}P.resultado=r;
 if(r.canal!=='correo'){P.anteriorResultado(r,'Invitación lista');return;}
 var mail;try{mail=C.mail(r,r.correo);}catch(e){MK.aviso(e.message);return;}
 w._ptlTxt=mail.texto;
 MK.lado('<h2>Revisar invitación por correo</h2><div class="sub">Personal · un solo uso · vence el '+C.esc(r.vence)+' (hora de Panamá)</div>'+
 '<label class="lb">Para</label><div class="in">'+C.esc(r.correo)+'</div><label class="lb">Asunto</label><div>ECOVSA | Invitación para activar su acceso al portal de clientes</div>'+
 '<label class="lb">Mensaje</label><textarea class="in" readonly rows="13">'+C.esc(mail.texto)+'</textarea><p class="small muted">Abrir el correo prepara el mensaje en su aplicación. Revíselo y pulse Enviar allí. No se marca como enviado por abrirlo.</p>'+
 '<div class="pie2"><a class="btn pri" href="'+C.esc(mail.href)+'">Abrir correo</a><button class="btn" onclick="ptlCopiar()">Copiar mensaje</button><button class="btn" onclick="MK.cerrarLado()">Cerrar</button></div>');
};
P.anteriorResultado=w.ptlResultado;w.ptlResultado=P.mostrar;
w.ptlInvitar=function(nivel,ci,si){var c=PTL.cuentas[ci],s=si!=null?c.sedes[si]:null;P.formulario({nivel,clienteId:s?s.clienteId:'',razonSocial:c.razonSocial,alcance:s?s.nombre:c.razonSocial,correo:s?s.correo:'',telefono:s?s.telefono:(c.sedes[0]||{}).telefono,canal:'correo'});};
w.ptlReenviar=function(id,reiniciar){var a;PTL.cuentas.some(function(c){var L=(c.corp||[]).concat(...c.sedes.map(s=>s.accesos||[]));a=L.find(z=>z.accesoId===id);return !!a;});if(!a){MK.aviso('Recargue los accesos antes de reenviar.');return;}
 var abrir=function(){P.formulario(Object.assign({},a,{id,reiniciar,alcance:a.razonSocial}));};
 if(reiniciar)MK.confirmar('La contraseña anterior dejará de servir al preparar esta invitación.',abrir,{titulo:'¿Renovar el acceso?',boton:'Continuar'});else abrir();};
/* El pedido conserva el destinatario que indicó el corporativo hasta su aprobación. */
if(typeof w.vPortal==='function'){var anterior=w.vPortal;w.vPortal=function(){var h=anterior.apply(this,arguments);h=h.replace('«Aprobar» arma la invitación y abre WhatsApp al número de la ficha del cliente, nunca a uno que escriba quien pide.','«Aprobar» prepara la invitación para revisar su entrega. Los pedidos del equipo corporativo conservan el canal y el destinatario indicados; los pedidos de recuperación siguen usando el contacto registrado.');setTimeout(P.pedidos,0);return h;};}
P.pedidos=function(){if(typeof PTL==='undefined'||!PTL)return;document.querySelectorAll('[onclick*="ptlPedido("]').forEach(function(btn){var code=btn.getAttribute('onclick')||'',m=code.match(/ptlPedido\('([^']+)'/),p=m&&(PTL.pedidos||[]).find(x=>x.pedidoId===m[1]);if(!p||p.canal!=='correo')return;var box=btn.parentElement;if(box.querySelector('.p102-destino'))return;var el=document.createElement('p');el.className='small p102-destino';el.textContent='Invitación por correo a: '+p.correo;box.prepend(el);});};
var observer=new MutationObserver(function(){if(typeof PTL!=='undefined'&&PTL)P.pedidos();});observer.observe(document.body,{childList:true,subtree:true});
})(window);
