/* 3.99 · Un editor, dos vistas de trabajo y cambios pendientes compartidos. */
var P399 = { dia: 'plan', semana: 'plan', ampliada: false, pendientes: {}, basesSemana: new WeakMap(), basesMes: new WeakMap() };
function p399Copia_(x){ return JSON.parse(JSON.stringify(x)); }
function p399Llave_(e){ return e.fecha + '|' + (e.rutaId || 'nueva'); }
function p399Capturar_(){
  if(!ED || !PL || !ED.sucio) return;
  var c = plCalc_();
  P399.pendientes[p399Llave_(ED)] = { editor:p399Copia_(ED), clientes:p399Copia_(PL.clientes), calculo:p399Copia_(c) };
}
function p399Salir_(hacer){
  p399Capturar_(); var anterior = ED;
  if(anterior) anterior.sucio = false;
  try { return hacer(); } finally { if(anterior && P399.pendientes[p399Llave_(anterior)]) anterior.sucio = true; }
}
/* Navegar conserva el borrador en memoria; solamente Guardar/Publicar llama al servidor. */
p398Descartar_ = p399Salir_;
plPreguntarDescartar_ = p399Salir_;
plElegirRuta_ = (function(original){ return function(id){
  var r = original.apply(this,arguments), key = id && id.indexOf('pendiente399-')===0 ? PL.fecha+'|nueva' : ED && p399Llave_(ED), p = P399.pendientes[key];
  if(p){ ED = p399Copia_(p.editor); PL_KMG = null; }
  return r;
}; })(plElegirRuta_);
plNuevaRuta_ = (function(original){return function(silencio){
  if(!silencio&&PL){p399Capturar_();var p=P399.pendientes[PL.fecha+'|nueva'];if(p){ED=p399Copia_(p.editor);PL_KMG=null;plPintar_();toast('Guarda o descarta esta ruta nueva antes de crear otra para el mismo día.');return;}}
  return original.apply(this,arguments);
};})(plNuevaRuta_);
plSucio_ = (function(original){ return function(){ var r=original.apply(this,arguments); p399Capturar_(); return r; }; })(plSucio_);
function p399Pendiente_(fecha,ruta){ return Object.keys(P399.pendientes).some(function(k){ var e=P399.pendientes[k].editor; return (!fecha||e.fecha===fecha)&&(!ruta||e.rutaId===ruta); }); }
function p399Proyectar_(datos,mes){
  if(!datos || !datos.dias) return;
  var bases=mes?P399.basesMes:P399.basesSemana, base=bases.get(datos);
  if(!base){ base=p399Copia_(datos.dias); bases.set(datos,base); }
  datos.dias=p399Copia_(base);
  Object.keys(P399.pendientes).forEach(function(key){
    var p=P399.pendientes[key], e=p.editor, d=datos.dias.find(function(x){return x.fecha===e.fecha;}); if(!d)return;
    var rid=e.rutaId||'pendiente399-'+e.fecha, idx=d.rutas.findIndex(function(x){return x.rutaId===rid;}), vieja=idx<0?{}:d.rutas[idx];
    var paradas=e.paradas.filter(function(x){return x.clienteId!=='P';}).map(function(x,i){return Object.assign({},x,{horaPlan:p.calculo.paradas[e.paradas.indexOf(x)]&&p.calculo.paradas[e.paradas.indexOf(x)].eta||'',hecha:false});});
    var ruta=Object.assign({},vieja,{rutaId:rid,conductor:e.conductor,vehiculo:e.vehiculo,horaSalida:e.horaSalida,estadoPlan:e.estadoPlan,tipo:e.tipo,destinoId:e.destinoId,trazo:e.trazo,paradas:paradas,ids:paradas.map(function(x){return x.clienteId;}),kg:p.calculo.kg,regresoMin:p.calculo.regresoMin,sinGuardar399:true});
    if(idx<0)d.rutas.push(ruta);else d.rutas[idx]=ruta;
    p.clientes.forEach(function(c){if(datos.clientes&&!datos.clientes[c.id])datos.clientes[c.id]=c;});
  });
}
function p399Banner_(root){
  var old=root.querySelector('.p399-pendientes'); if(old)old.remove();
  var list=Object.keys(P399.pendientes).map(function(k){return P399.pendientes[k].editor;}); if(!list.length)return;
  var b=document.createElement('div');b.className='p399-pendientes';
  b.innerHTML='<b>Cambios sin guardar</b> · Vista previa compartida entre Día, Semana y Mes. '+list.map(function(e){return '<button type="button" class="pl-btn" onclick="PL_RSEL=\''+esc(e.rutaId||'pendiente399-'+e.fecha)+'\';p42AbrirDia_(\''+e.fecha+'\')">'+esc(p398TextoFecha_(e.fecha))+' · '+esc(e.vehiculo||'Ruta nueva')+'</button>';}).join('');
  root.insertBefore(b,root.firstChild);
}
function p399Vista_(vista,modo){ P399[vista]=modo;p399Montar_(); }
function p399Ampliar_(){P399.ampliada=!P399.ampliada;p399Montar_();}
function p399Barra_(vista,root,despues){
  var nav=root.querySelector('.p399-nav'); if(!nav){nav=document.createElement('div');nav.className='p399-nav';despues.after(nav);}
  nav.innerHTML='<div role="group" aria-label="Área de trabajo"><button type="button" class="pl-btn '+(P399[vista]==='plan'?'on':'')+'" aria-pressed="'+(P399[vista]==='plan')+'" onclick="p399Vista_(\''+vista+'\',\'plan\')">Planificar</button><button type="button" class="pl-btn '+(P399[vista]==='mapa'?'on':'')+'" aria-pressed="'+(P399[vista]==='mapa')+'" onclick="p399Vista_(\''+vista+'\',\'mapa\')">Mapa</button></div><button type="button" class="pl-btn" onclick="p399Ampliar_()">'+(P399.ampliada?'Salir de vista ampliada':'Ampliar vista')+'</button>';
}
function p399Alto_(){
  var raiz=$('pantalla-plan');if(!raiz)return;
  var area=P42.vista==='dia'?(P399.dia==='mapa'?raiz.querySelector('#p43-dia > .p43-dm'):raiz.querySelector('.p43-dg')):(P399.semana==='mapa'?$('p43-s-mc'):$('p43-s-g'));
  if(!area)return;
  var alto=Math.max(270,window.innerHeight-area.getBoundingClientRect().top-88);
  raiz.style.setProperty('--p399-alto',alto+'px');
  var mapa=P42.vista==='dia'?P43.dmap:P42.map;
  if(mapa&&mapa.getContainer().isConnected)mapa.invalidateSize({pan:false});
}
function p399ListaMapa_(){
  if(!ED)return '';
  return '<summary>'+ED.paradas.length+' paradas · desplegar para cambiar el orden</summary><div class="p399-orden">'+ED.paradas.map(function(p,i){var c=plC_(p.clienteId);return '<div class="p399-orden-fila" data-i="'+i+'" draggable="true" ondragstart="p43Tomar_(event,'+i+')" ondragover="p43Sobre_(event,this)" ondragleave="this.classList.remove(\'sob\')" ondrop="p43Soltar_(event,'+i+')" ondragend="p43Fin_()"><b>'+ (i+1)+'. '+esc(c.nombre)+'</b><button type="button" class="pl-btn" aria-label="Subir parada '+(i+1)+'" onclick="p399Orden_('+i+','+(i-1)+')" '+(i===0?'disabled':'')+'>↑</button><button type="button" class="pl-btn" aria-label="Bajar parada '+(i+1)+'" onclick="p399Orden_('+i+','+(i+1)+')" '+(i===ED.paradas.length-1?'disabled':'')+'>↓</button></div>';}).join('')+'</div><small>Arrastra un punto cerca de otra parada para cambiar su posición; las ubicaciones se conservan.</small>';
}
function p399Orden_(de,a){
  if(!ED||de===a||de<0||a<0||de>=ED.paradas.length||a>=ED.paradas.length)return;
  var p=ED.paradas.splice(de,1)[0];ED.paradas.splice(a,0,p);P43.marca=p.clienteId;plSucio_();
}
function p399ArrastreMapa_(){
  if(!P43.dcapa||!P43.dmap||!ED)return;
  var markers=[];
  P43.dcapa.eachLayer(function(m){var el=m.getElement&&m.getElement(),pin=el&&el.querySelector('.p42-pin');if(!pin)return;var i=Number(pin.firstChild.nodeValue)-1;if(!Number.isInteger(i)||i<0)return;markers.push({m:m,i:i});});
  markers.forEach(function(x){
    if(x.m._p399)return;x.m._p399=true;if(x.m.dragging)x.m.dragging.enable();
    x.m.on('dragstart',function(){x.origen=x.m.getLatLng();});
    x.m.on('dragend',function(){
      var pos=P43.dmap.latLngToContainerPoint(x.m.getLatLng()),mejor=null,dist=90;
      markers.forEach(function(y){if(x===y)return;var d=pos.distanceTo(P43.dmap.latLngToContainerPoint(y.m.getLatLng()));if(d<dist){dist=d;mejor=y;}});
      if(x.origen)x.m.setLatLng(x.origen);
      if(mejor)p399Orden_(x.i,mejor.i);else p43Aviso_('Acerca el punto a otra parada para cambiar el orden. La ubicación se conserva.',false);
    });
  });
}
function p399Montar_(){
  var s=$('pantalla-plan');if(!s)return;
  s.classList.toggle('p399-ampliada',P399.ampliada);s.classList.add('p399-activo');
  var dia=P42.vista==='dia',sem=P42.vista==='semana',root=dia?$('p43-dia'):sem?$('p43-sem'):null;
  if(!root)return;
  var vista=dia?'dia':'semana',mapa=dia?root.querySelector('.p43-dm'):$('p43-s-mc'),top=dia?$('p43-d-top'):$('p43-s-top');
  if(!mapa||!top)return;
  p399Barra_(vista,root,top);root.classList.toggle('p399-mapa',P399[vista]==='mapa');root.classList.add('p399-trabajo');
  if(dia){
    var lista=$('p43-d-lista'),toca=$('p43-d-toca'),grid=root.querySelector('.p43-dg');
    var cifras=$('p43-d-k'),linea=$('p43-d-linea');
    if(cifras&&linea&&mapa.previousElementSibling!==linea)mapa.before(cifras,linea);
    if(toca.parentNode!==grid)grid.appendChild(toca);
    var orden=mapa.querySelector('.p399-paradas');if(!orden){orden=document.createElement('details');orden.className='p399-paradas';mapa.insertBefore(orden,mapa.firstChild);}
    var abierta=orden.open;orden.innerHTML=p399ListaMapa_();orden.open=abierta;
    p399ArrastreMapa_();
  }
  p399Banner_(root);requestAnimationFrame(p399Alto_);
}
p43MapaDia_=(function(o){return function(){var r=o.apply(this,arguments);p399ArrastreMapa_();return r;};})(p43MapaDia_);
p43Dia_=(function(o){return function(){p399Capturar_();var r=o.apply(this,arguments);p399Montar_();return r;};})(p43Dia_);
p42Pintar_=(function(o){return function(){p399Capturar_();p399Proyectar_(P42.d,false);var r=o.apply(this,arguments);p399Montar_();return r;};})(p42Pintar_);
p43Mes_=(function(o){return function(){p399Capturar_();p399Proyectar_(P43.mes,true);var r=o.apply(this,arguments);if($('p43-mes'))p399Banner_($('p43-mes'));return r;};})(p43Mes_);
p42Ruta_=(function(o){return function(S,d,r){var h=o.apply(this,arguments);return r.sinGuardar399?h.replace('<div class="q">','<div class="q"><strong class="p399-pendiente">Sin guardar</strong>'):h;};})(p42Ruta_);
/* Un guardado rechazado conserva el editor y su vista previa. Solo éxito elimina la copia. */
var p399GuardarOriginal_=plGuardar_;
plGuardar_=function(){p399Capturar_();return p399GuardarOriginal_.apply(this,arguments);};
function p399Limpiar_(editor){if(editor)delete P399.pendientes[p399Llave_(editor)];P42.d=null;P43.mes=null;}
/* No sobrescribir un borrador local con acciones persistentes de Semana/Mes. */
function p399Guardia_(original,obtener){return function(){var d=obtener.apply(this,arguments);if(p399Pendiente_(d.fecha,d.ruta)){p43Aviso_('Guarda o descarta primero los cambios del Día antes de modificar esta ruta desde otra vista.',false);return;}return original.apply(this,arguments);};}
p42Mover_=p399Guardia_(p42Mover_,function(ruta,id,fecha){return{fecha:null,ruta:ruta};});
p43MMover_=p399Guardia_(p43MMover_,function(id,ruta){return{ruta:ruta};});
p43MMoverRuta_=p399Guardia_(p43MMoverRuta_,function(ruta){return{ruta:ruta};});
p44Aplicar_=p399Guardia_(p44Aplicar_,function(ruta){return{ruta:ruta};});
f48Aplicar_=p399Guardia_(f48Aplicar_,function(){return{};});
p43MesAplicar_=p399Guardia_(p43MesAplicar_,function(){return{};});
p43ArmarMes_=p399Guardia_(p43ArmarMes_,function(){return{};});
window.addEventListener('resize',p399Alto_);
window.addEventListener('keydown',function(e){if(e.key==='Escape'&&P399.ampliada){P399.ampliada=false;p399Montar_();}});
window.addEventListener('beforeunload',function(e){p399Capturar_();if(Object.keys(P399.pendientes).length){e.preventDefault();e.returnValue='';}});
