/* 3.100 · Las listas crecen con el documento; el mapa usa el alto de la ventana. */
var P3100 = { resumen: false };
function p3100Resumen_(){P3100.resumen=!P3100.resumen;p3100Montar_();}
function p3100Montar_(){
  var s=$('pantalla-plan');if(!s)return;
  s.classList.add('p3100');s.classList.toggle('p3100-resumen',P3100.resumen);
  var nav=s.querySelector('.p399-nav');
  if(nav){
    var boton=nav.querySelector('[data-resumen3100]');
    if(!boton){boton=document.createElement('button');boton.type='button';boton.className='pl-btn';boton.setAttribute('data-resumen3100','');boton.onclick=p3100Resumen_;nav.insertBefore(boton,nav.lastChild);}
    boton.hidden=!P399.ampliada;boton.textContent=P3100.resumen?'Plegar resumen':'Mostrar resumen';boton.setAttribute('aria-expanded',String(P3100.resumen));
  }
  requestAnimationFrame(p399Alto_);
}
/* Ya no se resta el encabezado al alto de las listas o del mapa. */
p399Alto_=function(){
  var s=$('pantalla-plan');if(!s||!s.classList.contains('activa'))return;
  var rect=s.getBoundingClientRect(),css=getComputedStyle(s),izq=Math.max(0,rect.left)+(parseFloat(css.paddingLeft)||0),der=Math.max(0,innerWidth-rect.right)+(parseFloat(css.paddingRight)||0);
  s.style.setProperty('--p3100-izq',izq+'px');s.style.setProperty('--p3100-der',der+'px');
  var pie=$('p43-d-pie');if(pie)s.style.setProperty('--p3100-pie',Math.ceil(pie.getBoundingClientRect().height)+'px');
  var mapa=P42.vista==='dia'?P43.dmap:P42.vista==='semana'?P42.map:null;
  var caja=P42.vista==='dia'?s.querySelector('#p43-dia>.p43-dm'):$('p43-s-mc');
  if(caja){
    if(P399.ampliada)caja.style.setProperty('height',Math.max(240,innerHeight-caja.getBoundingClientRect().top-(pie?pie.getBoundingClientRect().height:0)-12)+'px','important');
    else caja.style.removeProperty('height');
  }
  if(mapa&&mapa.getContainer().isConnected){
    mapa.invalidateSize({pan:false});
    var modo=P42.vista==='dia'?P399.dia:P399.semana,clave=P42.vista+'|'+modo+'|'+P399.ampliada+'|'+P3100.resumen;
    if(modo==='mapa'&&P42.vista==='dia'&&P3100.dimensionModo!==clave&&P43.dcapa){
      var puntos=[];P43.dcapa.eachLayer(function(m){if(m.getLatLng)puntos.push(m.getLatLng());});
      if(puntos.length>1)mapa.fitBounds(puntos,{padding:[40,40]});
    }
    P3100.dimensionModo=clave;
  }
};
p399Montar_=(function(original){return function(){var r=original.apply(this,arguments);p3100Montar_();return r;};})(p399Montar_);
p399Vista_=(function(original){return function(vista,modo){
  var r=original.apply(this,arguments);
  if(modo==='mapa')requestAnimationFrame(function(){var nav=document.querySelector('#pantalla-plan .p399-nav');if(nav)nav.scrollIntoView({block:'start',behavior:'instant'});});
  return r;
};})(p399Vista_);
p399Ampliar_=(function(original){return function(){
  if(!P399.ampliada)P3100.resumen=false;
  var r=original.apply(this,arguments);var s=$('pantalla-plan');if(P399.ampliada&&s)s.scrollTop=0;return r;
};})(p399Ampliar_);
window.addEventListener('resize',p399Alto_);
