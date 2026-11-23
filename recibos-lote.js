/* Selección de recibos de Logística y un correo con varios PDF. */
(function () {
  'use strict';
  var C = window.RecibosCanales3107, pintar = window.rx2Pintar_;
  if (!C || typeof pintar !== 'function') return;
  var elegidos = new Map(), pendiente = null, dialogo = null, ocupado = false, cargando = false;
  var MAX = 10, POR_PDF = 2 * 1024 * 1024, TOTAL = 5 * 1024 * 1024;
  function elemento(tag, texto, clase) {
    var n = document.createElement(tag);
    if (texto) n.textContent = texto;
    if (clase) n.className = clase;
    return n;
  }
  function boton(texto, clase) { var b = elemento('button',texto,clase || 'rx2-bt'); b.type = 'button'; return b; }
  function rol() { return typeof window.esSupervisor === 'function' && window.esSupervisor(); }
  function barra() {
    var box = document.getElementById('rx2-cuerpo'); if (!box) return;
    var b = document.getElementById('rec-lote-acciones');
    if (!b && rol()) {
      b = elemento('div',null,'rec-lote-acciones'); b.id='rec-lote-acciones';
      var n=elemento('span');n.id='rec-lote-cuenta';n.setAttribute('role','status');
      var enviar=boton('Enviar seleccionados por correo','rx2-bt');enviar.id='rec-lote-abrir';enviar.onclick=abrir;
      var vaciar=boton('Quitar selección');vaciar.id='rec-lote-quitar';vaciar.onclick=function(){elegidos.clear();window.rx2Pintar_();};
      b.append(n,enviar,vaciar);box.before(b);
    }
    if (!b) return;
    b.hidden=!rol() || (!elegidos.size&&!pendiente);
    document.getElementById('rec-lote-cuenta').textContent = elegidos.size+(elegidos.size===1?' recibo seleccionado':' recibos seleccionados');
    document.getElementById('rec-lote-abrir').textContent=pendiente?'Consultar envío pendiente':'Enviar seleccionados por correo';
    document.getElementById('rec-lote-quitar').disabled=!!pendiente;
    box.querySelectorAll('[data-rec-lote-elige]').forEach(function(input){input.checked=elegidos.has(input.dataset.recLoteElige);input.disabled=!!pendiente;});
  }
  function repararTabla() {
    if (!rol()) { elegidos.clear();barra();return; }
    var box=document.getElementById('rx2-cuerpo');
    if (!box || !window.RX2) return;
    var listaById=new Map((window.RX2.lista||[]).map(function(r){return [String(r.recibo||'').trim(),r];}));
    var presentes=new Set();
    var fila=[].slice.call(box.querySelectorAll('.rx2-tabla tbody tr,.rx2-card'));
    fila.forEach(function(f) {
      var id=(f.querySelector('td:first-child b,.m b')||{}).textContent;
      id=String(id||'').trim();var r=listaById.get(id);if(!id||!r)return;
      presentes.add(id);
      if(f.querySelector('[data-rec-lote-elige]')) return;
      var input=elemento('input');input.type='checkbox';input.dataset.recLoteElige=id;
      input.setAttribute('aria-label','Seleccionar recibo '+id);
      input.onchange=function(){
        if(input.checked&&elegidos.size>=MAX){input.checked=false;document.getElementById('rec-lote-cuenta').textContent='Puedes seleccionar hasta diez recibos.';return;}
        if(input.checked)elegidos.set(id,r);else elegidos.delete(id);
        barra();
      };
      var celda=elemento(f.matches('tr')?'td':'label',null,'rec-lote-celda');
      if(!f.matches('tr'))celda.append('Seleccionar recibo ');
      celda.append(input);f.prepend(celda);
    });
    if (!window.RX2.cargando && !pendiente) elegidos.forEach(function(_,id){if(!presentes.has(id))elegidos.delete(id);});
    var cab=box.querySelector('.rx2-tabla thead tr');
    if(cab&&!cab.querySelector('.rec-lote-celda')){var th=elemento('th','Selección','rec-lote-celda');th.scope='col';cab.prepend(th);}
    barra();
  }
  window.rx2Pintar_=function(){var r=pintar.apply(this,arguments);repararTabla();return r;};
  function construirDialogo(){
    var d=elemento('dialog',null,'rec-lote-modal');d.id='rec-lote-modal';
    d.setAttribute('aria-labelledby','rec-lote-titulo');
    var h=elemento('header');var titulo=elemento('strong','Enviar seleccionados por correo');titulo.id='rec-lote-titulo';
    var cerrar=boton('Cerrar','rx2-bt');cerrar.onclick=function(){if(!ocupado&&!cargando)d.close();};h.append(titulo,cerrar);
    var form=elemento('form');form.noValidate=false;
    var ul=elemento('ul');ul.id='rec-lote-archivos';
    var label=elemento('label','Correo de destino');
    var destino=elemento('input');destino.id='rec-lote-destino';destino.type='email';destino.required=true;
    destino.placeholder='correo@ejemplo.com';label.htmlFor=destino.id;
    var nota=elemento('p','Este correo se usa solo para este envío. Los destinatarios guardados quedan en la ficha.');
    var info=elemento('p');info.id='rec-lote-estado';info.setAttribute('role','status');
    var acciones=elemento('div',null,'rec-lote-botones');
    var enviar=elemento('button','Enviar correo con los PDF','rx2-bt');enviar.type='submit';enviar.id='rec-lote-confirmar';
    acciones.append(enviar);form.append(ul,label,destino,nota,info,acciones);
    form.onsubmit=function(e){e.preventDefault();enviarLote();};
    d.addEventListener('cancel',function(e){if(ocupado||cargando)e.preventDefault();});
    d.append(h,form);document.body.append(d);return d;
  }
  function abrir(){
    if(!rol()||(!elegidos.size&&!pendiente))return;
    if(!dialogo)dialogo=construirDialogo();
    var lista=document.getElementById('rec-lote-archivos'),destino=document.getElementById('rec-lote-destino');
    lista.replaceChildren();
    (pendiente?pendiente.filas:Array.from(elegidos.values())).forEach(function(r){lista.append(elemento('li',r.recibo+' · '+r.cliente));});
    destino.value=pendiente?pendiente.datos.para:'';
    dialogo.showModal();
    pintarEnvio(pendiente?'Puedes consultar o reintentar el mismo correo. Comprueba Resend antes de iniciar un envío nuevo.':'');
  }
  function pintarEnvio(msg){
    var destino=document.getElementById('rec-lote-destino'),b=document.getElementById('rec-lote-confirmar');
    destino.readOnly=!!pendiente||ocupado||cargando;b.disabled=ocupado||cargando;
    b.textContent=cargando?'Preparando PDF…':ocupado?'Enviando…':pendiente?'Reintentar este mismo envío':'Enviar correo con los PDF';
    document.getElementById('rec-lote-estado').textContent=msg;barra();
  }
  async function enviarLote(){
    if(ocupado||cargando||!rol())return;
    try{
      if(!pendiente){
        var valor=document.getElementById('rec-lote-destino').value,correo=C.correos(valor);
        if(correo.length!==1)throw Error('Escribe un solo correo de destino.');
        var filas=Array.from(elegidos.values()),recibos=[],bytes=0;
        if(!filas.length||filas.length>MAX)throw Error('Selecciona de uno a diez recibos.');
        cargando=true;
        for(var i=0;i<filas.length;i++){
          pintarEnvio('Preparando PDF '+(i+1)+' de '+filas.length+'…');
          var r=await C.rpc('api_obtenerDetalleRecibo',[filas[i].recibo,'',window.PIN]);
          var p=await C.pdfCanonico(r.datos,r.empresa);bytes+=p.blob.size;
          if(p.blob.size>POR_PDF||bytes>TOTAL)throw Error('El límite es 2 MB por PDF y 5 MB para el correo. Elige menos recibos.');
          recibos.push({folio:filas[i].recibo,pdf:await C.base64(p.blob)});
        }
        pendiente={pin:window.PIN,filas:filas,datos:{id:crypto.randomUUID(),para:correo[0],recibos:recibos}};
      }
      cargando=false;ocupado=true;pintarEnvio('Enviando el correo…');
      if(pendiente.pin!==window.PIN)throw Error('La sesión cambió. Revisa el intento desde Logística.');
      var respuesta=await C.rpc('api_recCorreoLote',[window.PIN,pendiente.datos]);
      if(!respuesta.aceptado)throw Error('El proveedor no confirmó el envío.');
      if(typeof window.toast==='function')window.toast('Resend aceptó el correo con los PDF.');
      pendiente=null;elegidos.clear();dialogo.close();if(typeof window.rx2Cargar_==='function')window.rx2Cargar_();
    }catch(e){
      cargando=false;ocupado=false;
      if(pendiente&&!e.incierto&&!/conect|confirm|fetch|network|timeout|abort|sesión cambió/i.test(e.message))pendiente=null;
      pintarEnvio(e.message||'No se pudo completar el envío.');return;
    }
    ocupado=false;pintarEnvio('');
  }
})();
