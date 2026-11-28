/* Código de producción propio de la etapa a; no contiene respuestas ficticias. */
(function(){
  var original = MK.api, pendiente = false, intento = '', datosIntento = '';
  var nombres = {api_agendaBase:'base',api_agendaCrear:'crear',api_agendaEstado:'estado',api_agendaComentar:'comentar'};
  var abrirHoja=MK.hoja,cerrarHoja=MK.cerrarHoja,retorno;
  MK.hoja=function(html,op){retorno=document.activeElement;var template=document.createElement('template');template.innerHTML=html;template.content.querySelectorAll('[autofocus]').forEach(function(el){el.removeAttribute('autofocus');el.setAttribute('data-ag119-autofocus','');});var box=abrirHoja.call(MK,template.innerHTML,op);var title=box.querySelector('h2');if(title){title.id='ag119-dialog-title';box.setAttribute('aria-labelledby',title.id);}box.querySelector('[data-ag119-autofocus]')?.focus();return box;};
  MK.cerrarHoja=function(){cerrarHoja.apply(MK,arguments);if(retorno?.isConnected)retorno.focus({preventScroll:true});};
  function sesion(){try{return JSON.parse(localStorage.getItem('ecovsa_pin')||'null');}catch(_){return null;}}
  function limpiar(){MK.base=null;MK.cerrarHoja();MK.cerrarLado();var main=document.getElementById('main');if(main)main.textContent='La sesión cambió. Vuelve a entrar desde Mi día.';}
  window.addEventListener('storage',function(e){if(e.key==='ecovsa_pin'&&e.oldValue!==e.newValue){limpiar();MK.pin='';}});
  MK.api = function(fn,pin){
    if(!nombres[fn]) return original.apply(MK,arguments);
    var args=Array.prototype.slice.call(arguments,2), d={accion:nombres[fn]};
    if(d.accion==='crear'){
      var serial=JSON.stringify(args[0]);
      if(serial!==datosIntento){intento=crypto.randomUUID();datosIntento=serial;}
      d.datos=args[0];d.intento=intento;
    }else if(d.accion!=='base'){
      var a=(MK.base?.actividades||[]).find(function(a){return a.id===args[0];});
      d.id=args[0];d.version=a&&a.v;
      if(d.accion==='estado')d.estado=args[1];else{d.texto=args[1];if(args[2])d.estado=args[2];}
    }
    if(d.accion!=='base'&&pendiente)return Promise.reject(new Error('Hay un guardado en curso.'));
    if(d.accion!=='base'){pendiente=true;document.body.classList.add('ag119-guardando');}
    return original.call(MK,'api_agendaEquipo',pin,d).then(function(r){
      if(sesion()!==pin){limpiar();throw new Error('La sesión cambió. Vuelve a entrar.');}
      if(r&&r.ok&&d.accion==='crear'){intento='';datosIntento='';}
      return r;
    }).finally(function(){if(d.accion!=='base'){pendiente=false;document.body.classList.remove('ag119-guardando');}});
  };
  var observar=new MutationObserver(function(){
    var head=document.querySelector('#main .ph');
    if(head&&!head.querySelector('#ag119-refresh')){var b=document.createElement('button');b.id='ag119-refresh';b.type='button';b.className='btn sm';b.textContent='Actualizar';b.onclick=function(){if(!pendiente)MK.recargar();};head.append(b);}
    var envio=document.getElementById('n-ok');if(envio&&!envio.dataset.ag119){envio.dataset.ag119='1';envio.addEventListener('click',function(e){if(pendiente){e.preventDefault();e.stopImmediatePropagation();}},true);}
    document.querySelectorAll('label.lb:not([for])').forEach(function(l){var c=l.nextElementSibling;if(c?.id&&c.matches('input,select,textarea'))l.htmlFor=c.id;});
    document.querySelectorAll('.ms-c[onclick],.ms-it[onclick],.eq-t[onclick],.bj-f[onclick],.ev[onclick],.ti[onclick]').forEach(function(el){if(el.dataset.ag119Teclado)return;el.dataset.ag119Teclado='1';el.tabIndex=0;el.setAttribute('role','button');el.addEventListener('keydown',function(e){if(e.target===el&&(e.key==='Enter'||e.key===' ')){e.preventDefault();el.click();}});});
  });observar.observe(document.body,{childList:true,subtree:true});
  // No dejar promesas de UI sin atender: MK.llamar ya presenta el error concreto.
  window.addEventListener('unhandledrejection',function(e){if(e.reason instanceof Error){e.preventDefault();MK.aviso(e.reason.message);}});
  document.addEventListener('keydown',function(e){
    var el=e.target;
    if(e.key==='Enter'&&!e.isComposing&&!e.repeat&&el?.tagName==='INPUT'){
      if(el.id==='ag-c'){e.preventDefault();el.parentElement.querySelector('button')?.click();}
      else if(el.closest('#hoja')&&document.getElementById('n-ok')){e.preventDefault();document.getElementById('n-ok').click();}
    }
    if(e.key==='Tab'){
      var box=document.querySelector('#hoja.si .cuerpo')||document.querySelector('#mk-lado.si');if(!box)return;
      var list=Array.from(box.querySelectorAll('button,input,textarea,select,a[href],[tabindex="0"]')).filter(x=>!x.disabled&&x.getClientRects().length);
      if(!list.length)return;var first=list[0],last=list[list.length-1];
      if(e.shiftKey&&(el===first||!box.contains(el))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(el===last||!box.contains(el))){e.preventDefault();first.focus();}
    }
  },true);
})();
