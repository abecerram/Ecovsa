/* ECOVSA 3.106 · Sin cola offline: el envío se inicia desde su botón. */
(function(w){
  'use strict';
  var RM106_URL='https://wgufdfagvyelsypypkyr.supabase.co/functions/v1/api';
  function rm106Equipo(){
    var e='';try{e=localStorage.getItem('eco_equipo')||'';}catch(_){}
    if(!/^[a-z0-9]{12,40}$/.test(e)){e=crypto.randomUUID().replace(/-/g,'');try{localStorage.setItem('eco_equipo',e);}catch(_){}}
    return e;
  }
  function rm106EquipoTexto(){
    var u=navigator.userAgent||'',so=/Android/.test(u)?'Android':/iPhone|iPad/.test(u)?'iPhone':/Windows/.test(u)?'Windows':/Mac OS/.test(u)?'Mac':/Linux/.test(u)?'Linux':'Equipo';
    var nav=/Edg\//.test(u)?'Edge':/OPR\//.test(u)?'Opera':/Chrome\//.test(u)?'Chrome':/Firefox\//.test(u)?'Firefox':/Safari\//.test(u)?'Safari':'navegador';
    return so+' · '+nav;
  }
  function rm106Call(fn,args){
    return fetch(RM106_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fn:fn,args:args,eq:rm106Equipo(),eqd:rm106EquipoTexto()}),signal:AbortSignal.timeout(35000)})
      .then(function(r){if(!r.ok)throw Error('No se pudo conectar con el servidor.');return r.json();})
      .then(function(r){if(!r||!r.ok)throw Error(r&&r.error||'No se pudo completar el pedido.');return r.r;});
  }
  function rm106UUID(){return crypto.randomUUID();}
  w.rm106Call=rm106Call;
  if(typeof w.abrirEnvio==='function'){
    var rm106Abrir=w.abrirEnvio,rm106Cerrar=w.cerrarEnvio,rm106State=null;
    function rm106Lock(on){
      ['hj-dest','hj-asunto','hj-msg','hj-guardar'].forEach(function(id){var e=document.getElementById(id);if(e)e.disabled=on;});
      var b=document.getElementById('hj-go');if(b)b.disabled=on;
    }
    function rm106Ready(){
      var s=rm106State,b=document.getElementById('hj-go');
      if(b&&s&&!s.busy)b.disabled=!s.enabled||!w.RP||!w.RP.pdf;
    }
    function rm106Error(t){var e=document.getElementById('rm106-estado');if(e)e.textContent=t;w.avisoRec(t);}
    w.abrirEnvio=function(canal){
      if(rm106State&&rm106State.busy)return;
      rm106Abrir(canal);
      if(canal!=='correo'){rm106State=null;return;}
      var s=rm106State={id:rm106UUID(),busy:false,enabled:false,payload:null,aceptado:false,incierto:false};
      var input=document.getElementById('hj-dest');
      input.value=String(w.DATOS_RECIBO.correo||'');input.maxLength=1000;input.autocomplete='email';
      var msg=document.getElementById('hj-msg');msg.value=w.textoRecibo(w.DATOS_RECIBO,false);
      var b=document.getElementById('hj-go');b.disabled=true;b.textContent='Enviar correo con PDF';
      b.onclick=function(){w.rm106Enviar();};
      var viejo=document.getElementById('hj-ir');if(viejo)viejo.remove();
      var nota=document.createElement('div');nota.className='hj-n';nota.id='rm106-estado';nota.setAttribute('role','status');nota.setAttribute('aria-live','polite');
      nota.textContent='Consultando si el envío está habilitado…';b.parentNode.insertBefore(nota,b);
      var notas=b.parentNode.querySelectorAll('.hj-n');
      Array.prototype.forEach.call(notas,function(n){if(n.textContent.indexOf('El mensaje lleva el enlace')===0)n.remove();});
      var guardar=document.getElementById('hj-guardar');if(guardar&&guardar.parentNode.lastChild)guardar.parentNode.lastChild.textContent=' Guardar estos correos en la ficha del cliente';
      rm106Call('api_recCorreoEstado',[w.PIN_ENV,w.DATOS_RECIBO.recibo]).then(function(r){
        if(rm106State!==s)return;
        if(!r||!r.ok){rm106Error(r&&r.error||'No se pudo consultar el envío.');return;}
        s.enabled=r.activo&&r.configurado;
        /* No pisar un correo que la persona ya empezó a cambiar. */
        if(input.value===String(w.DATOS_RECIBO.correo||'')&&input.value!==String(r.correo||''))input.value=r.correo||'';
        nota.textContent=s.enabled?'Se enviará desde ECOVSA con el PDF adjunto. Puedes editar los destinatarios; el cambio vale solo para este envío.':'El envío por correo está apagado. El administrador puede encenderlo en Configuración.';
        rm106Ready();
      }).catch(function(e){if(rm106State===s)rm106Error(e.message);});
      w.prepararPdf(function(){if(rm106State===s)rm106Ready();});
      input.focus();input.setSelectionRange(0,0);input.scrollLeft=0;
    };
    w.cerrarEnvio=function(){
      if(rm106State&&rm106State.busy)return;
      if(rm106State&&rm106State.incierto&&!w.confirm('El resultado de este envío no está confirmado. Cerrar no cancela un correo que Resend haya aceptado. Conviene reintentar este mismo intento antes de iniciar otro. ¿Cerrar?'))return;
      rm106State=null;rm106Cerrar();
    };
    w.rm106Enviar=async function(){
      var s=rm106State;if(!s||s.busy||!s.enabled)return;
      if(!s.payload){
        var para=w.correosValidos(document.getElementById('hj-dest').value);
        if(!para||para.length>10){rm106Error('Escribe de uno a diez correos válidos, separados por coma.');document.getElementById('hj-dest').focus();return;}
        var pdf=w.RP&&w.RP.pdf;if(!pdf){rm106Error('El PDF todavía no está listo.');return;}
        var asunto=document.getElementById('hj-asunto').value.trim(),texto=document.getElementById('hj-msg').value.trim();
        if(!asunto||asunto.length>200||/[\r\n]/.test(asunto)||!texto||texto.length>6000){rm106Error('Revisa el asunto y el mensaje.');return;}
        s.busy=true;rm106Lock(true);
        try{
          var base64=await new Promise(function(ok,fallo){var f=new FileReader();f.onload=function(){ok(String(f.result).split(',')[1]);};f.onerror=function(){fallo(Error('No se pudo leer el PDF.'));};f.readAsDataURL(pdf.blob);});
          s.payload={id:s.id,para:para.join(', '),asunto:asunto,texto:texto,pdf:base64,guardar:!!(document.getElementById('hj-guardar')||{}).checked};
        }catch(e){s.busy=false;rm106Lock(false);rm106Ready();rm106Error(e.message);return;}
      }else{s.busy=true;rm106Lock(true);}
      var boton=document.getElementById('hj-go');boton.textContent='Enviando PDF…';
      try{
        var r=await rm106Call('api_recCorreoEnviar',[w.PIN_ENV,w.DATOS_RECIBO.recibo,s.payload]);
        if(!r||!r.ok||!r.aceptado){s.incierto=!!(r&&(r.incierto||r.enProceso));throw Error(r&&r.error||'El proveedor no confirmó el envío.');}
        s.aceptado=true;s.incierto=false;
        w.DATOS_RECIBO.enviado=r.sello;w.DATOS_RECIBO.marcaEnviado=r.sello;
        if(s.payload.guardar)w.DATOS_RECIBO.correo=s.payload.para;
        w.pintarBarra();s.busy=false;rm106State=null;rm106Cerrar();
        w.avisoRec('Correo con PDF aceptado por Resend. La entrega en bandeja no está confirmada.');
      }catch(e){
        if(!s.aceptado){s.busy=false;if(!s.incierto)s.incierto=/conectar|confirm|fetch|network|timeout|abort/i.test(e.message);rm106Error(e.message);boton.disabled=false;boton.textContent='Reintentar este mismo envío';}
      }
    };
    /* Quita también las entradas antiguas de mailto/borrador. */
    w.correoDirecto=w.rm106Enviar;w.enviarCorreo=w.rm106Enviar;
    document.addEventListener('keydown',function(e){
      var hj=document.getElementById('hj');if(!rm106State||!hj||!hj.classList.contains('si'))return;
      if(e.key==='Escape'){e.preventDefault();w.cerrarEnvio();}
      if(e.key==='Enter'&&e.target.tagName!=='TEXTAREA'&&e.target.tagName!=='BUTTON'){e.preventDefault();w.rm106Enviar();}
    });
  }
  if(typeof w.vObra==='function'){
    var rm106Obra=w.vObra,rm106Cfg=null,rm106Loading=false;
    function rm106Pintar(){if(w.MK.seccion==='obra'&&!w.obraHojaAbierta())w.MK.repintar();}
    function rm106Leer(){
      if(rm106Loading)return;rm106Loading=true;
      rm106Call('api_cfgCorreoRecibos',[w.PIN]).then(function(r){rm106Cfg=r;},function(e){rm106Cfg={ok:false,error:e.message};}).finally(function(){rm106Loading=false;rm106Pintar();});
    }
    w.rm106CfgRecargar=function(){rm106Cfg=null;rm106Leer();rm106Pintar();};
    w.rm106CfgCambiar=function(checkbox){
      var valor=checkbox.checked;checkbox.disabled=true;
      rm106Call('api_cfgCorreoRecibosGuardar',[w.PIN,valor]).then(function(r){if(!r||!r.ok)throw Error(r&&r.error||'No se pudo guardar.');rm106Cfg=r;w.MK.aviso(valor?'Envío de recibos por correo encendido':'Envío de recibos por correo apagado');},function(e){throw e;}).catch(function(e){w.MK.aviso(e.message);}).finally(function(){rm106Pintar();});
    };
    w.vObra=function(){
      var h=rm106Obra(),c=rm106Cfg;
      if(!c&&!rm106Loading)rm106Leer();
      var card='<div class="card" id="rm106-config"><h3>Recibos por correo</h3>';
      if(!c)card+='<div class="rt">Consultando conexión…</div>';
      else if(!c.ok)card+='<div class="rt">'+w.MK.esc(c.error||'No se pudo consultar.')+'</div>';
      else card+='<div class="rt"><label for="rm106-toggle"><input type="checkbox" role="switch" id="rm106-toggle" onchange="rm106CfgCambiar(this)" '+(c.activo?'checked ':'')+(!c.configurado?'disabled ':'')+'> <b>Envío '+(c.activo?'encendido':'apagado')+'</b></label></div><p class="nota">Al pulsar «Enviar por correo», el cliente recibe el PDF adjunto. Apagar impide iniciar nuevos envíos; los que Resend ya aceptó continúan.</p><p class="nota">Remitente: '+w.MK.esc(c.remitente)+'<br>Respuestas: '+w.MK.esc(c.responderA)+'<br>'+(c.configurado?'Conexión configurada.':'Falta configurar la conexión en el servidor.')+'</p>';
      card+='<button type="button" class="btn sm" onclick="rm106CfgRecargar()">Consultar estado</button></div>';
      var i=h.indexOf('<div class="card');return i<0?h+card:h.slice(0,i)+card+h.slice(i);
    };
  }
})(window);
