/* 3.101 · Agregar una parada desde la ruta o el mapa usando Clientes. */
var P3101={catalogo:false};
pv26PoolDia_=(function(original){return function(){
  var lista=original.apply(this,arguments), vistos={};lista.forEach(function(x){vistos[Number(x.id)]=true;});
  if(PL&&ED&&(P3101.catalogo||String(P43.dq||'').trim()))(PL.clientes||[]).forEach(function(c){
    var id=Number(c.id);if(id>0&&c.activo!==false&&!vistos[id]&&!plEnED_(id)){lista.push({id:id,g:'catalogo',x:{}});vistos[id]=true;}
  });
  return lista;
};})(pv26PoolDia_);
function p3101Agregar_(){
  if(!PL||!ED){toast('Abre primero el día y la ruta donde deseas agregar al cliente.');return;}
  P3101.catalogo=true;PV26.dia='todos';P43.dq='';P399.dia='plan';p43Dia_();
  requestAnimationFrame(function(){var box=$('p43-d-toca'),bus=box&&box.querySelector('input.p42-bus');if(box)box.scrollIntoView({block:'start'});if(bus)bus.focus({preventScroll:true});});
}
function p3101Pintar_(){
  if(P42.vista!=='dia'||!PL||!ED)return;
  var titulo=document.querySelector('#p43-d-lista>h3');
  if(titulo&&!titulo.querySelector('[data-agregar3101]'))titulo.insertAdjacentHTML('beforeend','<button type="button" class="pl-btn a" data-agregar3101 onclick="p3101Agregar_()">＋ Agregar cliente</button>');
  var mapa=document.querySelector('#p43-dia>.p43-dm');
  if(mapa&&!mapa.querySelector('[data-agregar-mapa3101]'))mapa.insertAdjacentHTML('afterbegin','<div class="p3101-agregar-mapa"><button type="button" class="pl-btn a" data-agregar-mapa3101 onclick="p3101Agregar_()">＋ Agregar cliente a esta ruta</button></div>');
  var lista=$('p43-d-lista');if(lista){lista.setAttribute('ondragover','p43SobreLista_(event)');lista.setAttribute('ondrop','p43SoltarLista_(event)');}
  var count=document.querySelector('#p43-d-toca h3 small');
  if(count){var q=String(P43.dq||'').trim().toLowerCase(),n=pv26PoolDia_().filter(function(x){var c=plC_(x.id);return pv26Coincide_(p398Cliente_(x.id,PL),PV26.dia)&&(!q||String(c.nombre||'').toLowerCase().includes(q)||String(c.zona||'').toLowerCase().includes(q));}).length;count.textContent=n>60?'60 de '+n:n;}
}
p399Montar_=(function(original){return function(){var r=original.apply(this,arguments);p3101Pintar_();return r;};})(p399Montar_);
p43FiltrarDia_=(function(original){return function(){var r=original.apply(this,arguments);p3101Pintar_();return r;};})(p43FiltrarDia_);
/* Un catálogo abierto no cambia la fecha, conductor, orden ni guardado de la ruta. */
