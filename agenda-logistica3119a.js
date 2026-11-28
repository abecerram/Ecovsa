/* 3.119a · Actividades recibidas en el inicio de Logística; solo consulta. */
(function(){
  if(typeof pintarInicio_!=='function')return;
  var anterior=pintarInicio_;
  pintarInicio_=function(){
    var r=anterior.apply(this,arguments),root=document.getElementById('ini-sup');
    if(!root||typeof vistaLogistica_!=='function'||!vistaLogistica_()||typeof INI==='undefined'||!INI)return r;
    root.querySelector('#ag119-logistica')?.remove();
    var list=Array.isArray(INI.actividadesEquipo)?INI.actividadesEquipo:[];
    if(!list.length)return r;
    var box=document.createElement('section');box.id='ag119-logistica';box.className='ini-card';
    var title=document.createElement('h3');title.textContent='Actividades recibidas · '+list.length;box.append(title);
    list.forEach(function(a){var p=document.createElement('p'),link=document.createElement('a');link.href='Agenda.html#me-'+encodeURIComponent(a.id);link.textContent=a.titulo+(a.fecha?' · '+a.fecha:'');p.append(link);box.append(p);});
    root.append(box);return r;
  };
})();
