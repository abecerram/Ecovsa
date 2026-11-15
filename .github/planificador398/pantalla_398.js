/* 3.98 · Frecuencia y programación son estados distintos en Mes, Semana y Día. */
var F398 = { todos: false, abierta: true, datos: null, contexto: '' };
function p398Fecha_(f) { return /^\d{4}-\d{2}-\d{2}$/.test(String(f || '')) ? String(f) : ''; }
function p398Sumar_(f, n) {
  if(!p398Fecha_(f)) return '';
  var d = new Date(f + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + Number(n || 0)); return d.toISOString().slice(0, 10);
}
function p398Dias_(a, b) { return Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 86400000); }
function p398TextoFecha_(f) { return p398Fecha_(f) ? f.slice(8) + '/' + f.slice(5, 7) + '/' + f.slice(0, 4) : 'sin fecha'; }
function p398Datos_() {
  if(typeof P42 !== 'undefined' && P42.vista === 'mes' && typeof P43 !== 'undefined' && P43.mes) return P43.mes;
  if(typeof P42 !== 'undefined' && P42.vista === 'semana' && P42.d) return P42.d;
  return typeof PL !== 'undefined' && PL ? PL : F398.datos;
}
function p398Cliente_(id, datos) {
  var d = datos || p398Datos_();
  return d && Array.isArray(d.frecuencias398) ? d.frecuencias398.find(function(c) { return Number(c.clienteId) === Number(id); }) : null;
}
function p398Estado_(c) {
  if(c.recurrente || c.estado === 'recurrente') return 'Recurrencia activa';
  if(c.estado === 'vencido') return 'Vencido' + (Number(c.dias) ? ' · ' + Math.abs(Number(c.dias)) + ' días' : '');
  if(c.estado === 'hoy') return 'Vence hoy';
  if(c.estado === 'proximo') return 'Próximo a vencer' + (Number(c.dias) ? ' · ' + Math.abs(Number(c.dias)) + ' días' : '');
  if(c.estado === 'sinfecha') return 'Sin fecha de vencimiento';
  return 'Al día';
}
function p398Color_(c) {
  return c.estado === 'vencido' ? 'bad' : c.estado === 'hoy' || c.estado === 'proximo' ? 'warn' : c.estado === 'sinfecha' ? 'info' : 'ok';
}
function p398Programada_(c) { return p398Fecha_(typeof c.programada === 'string' ? c.programada : c.programada && c.programada.fecha); }
function p398Programaciones_(c) {
  return (c.programaciones || []).map(function(p) {
    var desfase = Number(p.desfaseDias) || 0, aviso = p.alerta === 'tarde' ? ' · fuera de plazo: ' + desfase + ' días tarde' :
      p.alerta === 'adelanto' ? ' · adelanto superior al margen: ' + Math.abs(desfase) + ' días' :
      desfase < 0 ? ' · anticipada ' + Math.abs(desfase) + ' días' : '';
    return '<span class="p398-programacion ' + (p.alerta ? 'p398-' + (p.alerta === 'tarde' ? 'bad' : 'warn') : '') + '">Programado para <b>' + esc(p398TextoFecha_(p.fecha)) + '</b> · ' + esc(p.estadoPlan === 'borrador' ? 'borrador' : 'publicada') + esc(aviso) + '</span>';
  }).join('');
}
function p398Revisar_(c) {
  return !(c.recurrente || c.estado === 'recurrente') && (['vencido', 'hoy', 'proximo', 'sinfecha'].indexOf(c.estado) >= 0 ||
    (c.programaciones || []).some(function(p) { return p.alerta === 'tarde' || p.alerta === 'adelanto'; }));
}
function p398Contar_(l) {
  var n = { vencido: 0, proximo: 0, hoy: 0, tarde: 0, adelanto: 0, recurrente: 0 };
  l.forEach(function(c) {
    if(c.recurrente || c.estado === 'recurrente') { n.recurrente++; return; }
    if(n[c.estado] !== undefined) n[c.estado]++;
    if((c.programaciones || []).some(function(p) { return p.alerta === 'tarde'; })) n.tarde++;
    if((c.programaciones || []).some(function(p) { return p.alerta === 'adelanto'; })) n.adelanto++;
  });
  return n;
}
function p398Html_(d, contexto) {
  var l = d.frecuencias398 || [], n = p398Contar_(l), visibles = F398.todos ? l : l.filter(p398Revisar_);
  var chips = [[n.vencido, 'vencidos', 'bad'], [n.hoy, 'vencen hoy', 'warn'], [n.proximo, 'próximos a vencer', 'warn'], [n.tarde, 'programados tarde', 'bad'], [n.adelanto, 'adelantos por revisar', 'warn']];
  return '<section class="p398-panel" aria-label="Frecuencia de recolección"><div class="p398-cab"><b>Frecuencia de recolección</b><div class="p398-contadores">' + chips.map(function(x) {
    return '<span class="p398-chip p398-' + x[2] + '"><strong>' + x[0] + '</strong> ' + x[1] + '</span>';
  }).join('') + '</div></div><details' + (F398.abierta ? ' open' : '') + ' ontoggle="F398.abierta=this.open"><summary>' + visibles.length + (F398.todos ? ' clientes activos' : ' clientes para revisar') + '</summary><div class="p398-opciones"><button type="button" class="pl-btn" onclick="F398.todos=!F398.todos;p398Repintar_()">' + (F398.todos ? 'Ver solo alertas' : 'Ver todos los clientes') + '</button><span>' + n.recurrente + ' con recurrencia activa</span></div>' +
    '<div class="p398-lista">' + (visibles.length ? visibles.map(function(c) {
      var fecha = p398Programada_(c) || p398Fecha_(c.vence) || p398Fecha_(d.hoy), id = Number(c.clienteId) || 0;
      return '<article class="p398-fila" data-frecuencia-cliente="' + id + '"><div class="p398-cliente"><b>' + esc(c.nombre || 'Cliente ' + id) + '</b><span class="p398-estado p398-' + p398Color_(c) + '">' + esc(p398Estado_(c)) + '</span></div><div class="p398-fechas"><span>' + (c.recurrente ? 'Calendario de recurrencia' : 'Vence el <b>' + esc(p398TextoFecha_(c.vence)) + '</b>') + '</span>' +
        (p398Programaciones_(c) || '<span>Sin programación</span>') + '</div><div class="p398-acciones">' + (fecha ? '<button type="button" class="pl-btn" onclick="p398Abrir_(' + id + ',\'' + fecha + '\',\'semana\')">Semana</button><button type="button" class="pl-btn" onclick="p398Abrir_(' + id + ',\'' + fecha + '\',\'dia\')">Día</button>' : '') + '</div></article>';
    }).join('') : '<div class="p398-vacio">No hay alertas de frecuencia para revisar.</div>') + '</div></details></section>';
}
function p398Pintar_(d, host, contexto) {
  if(!d || !Array.isArray(d.frecuencias398) || !host) return;
  F398.datos = d; F398.contexto = contexto;
  var viejo = host.querySelector('[data-panel-frecuencia398]');
  if(!viejo) { viejo = document.createElement('div'); viejo.setAttribute('data-panel-frecuencia398', contexto); host.insertBefore(viejo, host.firstChild); }
  viejo.innerHTML = p398Html_(d, contexto);
}
function p398Repintar_() {
  var host = F398.contexto === 'clientes' ? $('c2-cuerpo') : $('pl42'); p398Pintar_(F398.datos, host, F398.contexto);
}
function p398Abrir_(id, fecha, vista) {
  if(!p398Fecha_(fecha)) return;
  p398Descartar_(function() {
    if(typeof mostrarTab === 'function' && typeof INI_TAB !== 'undefined' && INI_TAB !== 'plan') mostrarTab('plan');
    if(vista === 'semana') { PL_F = fecha; P42.vista = 'semana'; p42Cab_(); P42.d = null; p42Cargar_(fecha); }
    else {
      var c = p398Cliente_(id, F398.datos), p = c && (c.programaciones || []).find(function(x) { return x.fecha === fecha; });
      if(p && typeof PL_RSEL !== 'undefined') PL_RSEL = p.rutaId;
      p42AbrirDia_(fecha);
    }
  });
}
/* Se pregunta ANTES de tocar PL_F o ED: abrir Día desde Mes antes omitía esta protección. */
function p398Descartar_(hacer) {
  if(typeof ED === 'undefined' || !ED || !ED.sucio) { hacer(); return; }
  if(typeof p43Cargando_ === 'function') p43Cargando_(false);
  preguntar({ titulo: 'Cambios sin guardar', icono: '!', boton: 'Descartar y continuar',
    texto: 'Hay cambios sin guardar en la ruta del <b>' + esc(p398TextoFecha_(ED.fecha || PL_F)) + '</b>. Guarda la ruta o confirma que deseas descartarlos.',
    alAceptar: function() { ED.sucio = false; hacer(); } });
}
/* Calcula el plazo de la visita movida; una segunda visita no usa el vencimiento de la primera. */
function p398VencePara_(c, fecha, rutaId) {
  var origen = (c.programaciones || []).find(function(p) { return rutaId && p.rutaId === rutaId; });
  if(origen) return p398Fecha_(origen.vence) || p398Sumar_(origen.fecha, -(Number(origen.desfaseDias) || 0));
  var vence = p398Fecha_(c.vence), intervalo = Number(c.intervaloDias || c.frecuenciaDias) || 0;
  if(intervalo) (c.programaciones || []).filter(function(p) { return p.fecha < fecha; }).sort(function(a, b) { return a.fecha.localeCompare(b.fecha); }).forEach(function(p) { vence = p398Sumar_(p.fecha, intervalo); });
  return vence;
}
function p398Avisos_(ids, fecha, rutaId, datos) {
  if(!p398Fecha_(fecha)) return [];
  var d = datos || p398Datos_(), vistos = {}, avisos = [];
  (ids || []).forEach(function(id) {
    id = Number(id); if(!id || vistos[id]) return; vistos[id] = true;
    var c = p398Cliente_(id, d); if(!c || c.recurrente || c.estado === 'recurrente') return;
    var vence = p398VencePara_(c, fecha, rutaId), delta = vence ? p398Dias_(vence, fecha) : 0;
    if(!vence) { avisos.push({ clienteId: id, nombre: c.nombre, texto: 'sin fecha de vencimiento para comprobar el plazo', tipo: 'info' }); return; }
    if(delta > 0) avisos.push({ clienteId: id, nombre: c.nombre, texto: 'programado fuera de su fecha de recolección: ' + delta + ' días tarde; vence el ' + p398TextoFecha_(vence), tipo: 'tarde' });
    else if(delta < 0) {
      var definido = c.margenAdelantoDefinido === true && c.adelantoDias !== null && c.adelantoDias !== undefined;
      var excesivo = definido && -delta > Number(c.adelantoDias);
      if(excesivo || !definido) avisos.push({ clienteId: id, nombre: c.nombre, texto: (excesivo ? 'adelanto superior al margen permitido: ' : 'recolección anticipada: ') + (-delta) + ' días antes del ' + p398TextoFecha_(vence) + (!definido ? '; margen de adelanto pendiente de definir' : ''), tipo: excesivo ? 'adelanto' : 'info' });
    }
  });
  return avisos;
}
function p398Confirmar_(avisos, hacer) {
  if(!avisos.length) { hacer(); return; }
  preguntar({ titulo: 'Revisar fecha de recolección', icono: '!', boton: 'Confirmar fecha',
    texto: '<div class="p398-avisos">' + avisos.map(function(a) { return '<p><b>' + esc(a.nombre || 'Cliente ' + a.clienteId) + '</b>: ' + esc(a.texto) + '.</p>'; }).join('') + '</div>', alAceptar: hacer });
}
function p398AvisosPropuesta_(r) {
  if(r.res && Array.isArray(r.res.avisosFrecuencia398)) return r.res.avisosFrecuencia398.map(function(a) {
    return { clienteId: a.clienteId, nombre: a.nombre, tipo: a.alerta, texto: (p398Fecha_(a.fecha) ? p398TextoFecha_(a.fecha) + ': ' : '') + (a.texto || 'revisar fecha; vence el ' + p398TextoFecha_(a.vence)) };
  });
  var d = { frecuencias398: JSON.parse(JSON.stringify(r.frecuencias398 || (P43.mes && P43.mes.frecuencias398) || [])) }, avisos = [];
  ((r.res && r.res.rutas) || []).slice().sort(function(a, b) { return a.fecha.localeCompare(b.fecha); }).forEach(function(ruta, n) {
    (ruta.orden || []).forEach(function(identificador) {
      var visita = (r.visitas || {})[identificador], id = Number(visita && visita.clienteId);
      if(!id) return;
      p398Avisos_([id], ruta.fecha, '', d).forEach(function(a) { a.texto = p398TextoFecha_(ruta.fecha) + ': ' + a.texto; avisos.push(a); });
      var c = p398Cliente_(id, d);
      if(c) { c.programaciones = c.programaciones || []; c.programaciones.push({ fecha: ruta.fecha, rutaId: 'propuesta398-' + n }); }
    });
  });
  return avisos;
}
p43MesPlanVer_ = (function(original) { return function(r) {
  var resultado = original.apply(this, arguments), avisos = p398AvisosPropuesta_(r);
  var hoja = document.querySelector('#f48-velo .f48-hoja'), pie = hoja && hoja.querySelector('.f48-pie');
  if(avisos.length && hoja && pie) {
    var bloque = document.createElement('div'); bloque.className = 'f48-nota am'; bloque.setAttribute('data-avisos-mes398', '');
    bloque.innerHTML = '<div><b>' + avisos.length + ' fechas de recolección para revisar</b><div class="p398-avisos">' + avisos.map(function(a) { return '<p><b>' + esc(a.nombre || 'Cliente ' + a.clienteId) + '</b> · ' + esc(a.texto) + '.</p>'; }).join('') + '</div></div>';
    hoja.insertBefore(bloque, pie);
  }
  return resultado;
}; })(p43MesPlanVer_);
/* Renderizadores reales conservados. El panel usa el mismo dato de servidor en las tres vistas. */
p42Pintar_ = (function(original) { return function() { var r = original.apply(this, arguments); if(P42.vista === 'semana') p398Pintar_(P42.d, $('pl42'), 'semana'); return r; }; })(p42Pintar_);
p43Dia_ = (function(original) { return function() { var r = original.apply(this, arguments); if(P42.vista === 'dia') p398Pintar_(PL, $('pl42'), 'dia'); return r; }; })(p43Dia_);
p43Mes_ = (function(original) { return function() { var r = original.apply(this, arguments); if(P42.vista === 'mes') p398Pintar_(P43.mes, $('pl42'), 'mes'); return r; }; })(p43Mes_);
pintarC2_ = (function(original) { return function() { var r = original.apply(this, arguments); p398Pintar_(C2, $('c2-cuerpo'), 'clientes'); return r; }; })(pintarC2_);
/* El filtro y la etiqueta de Clientes dejan de reemplazar vencimiento por "Programado". */
c2Prox_ = (function(original) { return function(c) {
  var f = p398Cliente_(c.id, C2); if(!f) return original.apply(this, arguments);
  return [p398Estado_(f) + (f.recurrente ? '' : ' · vence el ' + p398TextoFecha_(f.vence)) + (p398Programada_(f) ? ' · programado para ' + p398TextoFecha_(p398Programada_(f)) : ''), p398Color_(f) === 'bad' ? 'bad' : p398Color_(f) === 'warn' ? 'am' : ''];
}; })(c2Prox_);
c2Pasa_ = (function(original) { return function(c, filtro) {
  var f = p398Cliente_(c.id, C2); if(!f || !c.activo) return original.apply(this, arguments);
  if(filtro === 'recurrentes') return !!f.recurrente;
  if(['atrasado', 'vencido', 'semana', 'aldia'].indexOf(filtro) >= 0) {
    if(f.recurrente) return false;
    if(filtro === 'atrasado') return f.estado === 'vencido' && Number(f.dias) < -7;
    if(filtro === 'vencido') return f.estado === 'vencido' && Number(f.dias) >= -7;
    if(filtro === 'semana') return f.estado === 'hoy' || f.estado === 'proximo';
    return f.estado === 'aldia';
  }
  return original.apply(this, arguments);
}; })(c2Pasa_);
p42AbrirDia_ = (function(original) { return function(f) { var self = this, args = arguments; p398Descartar_(function() { original.apply(self, args); }); }; })(p42AbrirDia_);
plCargar_ = (function(original) { return function(f, conservar) {
  var self = this, args = arguments;
  if(ED && ED.sucio && !conservar) { p398Descartar_(function() { original.apply(self, args); }); return; }
  return original.apply(this, args);
}; })(plCargar_);
p42Vista_ = (function(original) { return function(v) {
  var self = this, args = arguments;
  if(v !== P42.vista && ED && ED.sucio) { p398Descartar_(function() { original.apply(self, args); }); return; }
  return original.apply(this, args);
}; })(p42Vista_);
plGuardar_ = (function(original) { return function(estado, trazo, ya) {
  var self = this, acepta = ya || {};
  if(!ED || !PL) return original.apply(self, arguments);
  var avisos = p398Avisos_(ED.paradas.map(function(p) { return p.clienteId; }), PL.fecha, ED.rutaId, PL);
  var firma = JSON.stringify([PL.fecha, ED.rutaId, ED.paradas.map(function(p) { return p.clienteId; }), avisos]);
  if(acepta.frecuencia398 === firma) return original.apply(self, arguments);
  p398Confirmar_(avisos, function() { acepta.frecuencia398 = firma; plGuardar_.call(self, estado, trazo, acepta); });
}; })(plGuardar_);
p42Mover_ = (function(original) { return function(rutaId, id, fecha, destino) {
  var self = this, args = arguments; p398Confirmar_(p398Avisos_([id], fecha, rutaId, P42.d), function() { original.apply(self, args); });
}; })(p42Mover_);
p43MMover_ = (function(original) { return function(id, rutaId, de, a) {
  var self = this, args = arguments; p398Confirmar_(p398Avisos_([id], a, rutaId, P43.mes), function() { original.apply(self, args); });
}; })(p43MMover_);
p43MMoverRuta_ = (function(original) { return function(rutaId, de, a) {
  var self = this, args = arguments, d = P43.mes && (P43.mes.dias || []).find(function(x) { return x.fecha === de; });
  var ruta = d && (d.rutas || []).find(function(x) { return x.rutaId === rutaId; });
  p398Confirmar_(p398Avisos_(ruta && ruta.ids || [], a, rutaId, P43.mes), function() { original.apply(self, args); });
}; })(p43MMoverRuta_);
p43MoverADia_ = (function(original) { return function(i, fecha) {
  if(!ED || !ED.rutaId || ED.sucio) { p43Aviso_('Guarda los cambios de esta ruta antes de mover una parada.', false); return; }
  var self = this, args = arguments, p = ED.paradas[i];
  p398Confirmar_(p398Avisos_(p ? [p.clienteId] : [], fecha, ED.rutaId, PL), function() { original.apply(self, args); });
}; })(p43MoverADia_);
p43MesAplicar_ = (function(original) { return function() {
  var r = P43.propMes, self = this, args = arguments;
  if(!r || !r.res || P43.mesGuardando) return original.apply(self, args);
  var firma = JSON.stringify([r.sello, r.res.rutas, r.res.avisosFrecuencia398, r.frecuencias398]);
  if(F398.mesAceptada === firma) return original.apply(self, args);
  p398Confirmar_(p398AvisosPropuesta_(r), function() { F398.mesAceptada = firma; p43MesAplicar_.apply(self, args); });
}; })(p43MesAplicar_);
/* Las acciones de Semana guardan por otra entrada que el editor del Día. */
p44Aplicar_ = (function(original) { return function(rutaId, publicar, listo) {
  var self = this, args = arguments, S = P42.d, x = p44Ruta_(rutaId), prop = P44.prop[rutaId];
  if(!S || !x || !prop || !prop.res) return original.apply(self, args);
  var ids = (prop.res.orden || []).map(Number), avisos = p398Avisos_(ids, x.d.fecha, rutaId, S);
  var firma = JSON.stringify([rutaId, publicar, x.d.fecha, ids, S.frecuencias398]);
  F398.rutasAceptadas = F398.rutasAceptadas || {};
  if(F398.rutasAceptadas[rutaId] === firma) return original.apply(self, args);
  if(avisos.length) { var aviso = $('p43-av'); if(aviso && aviso.classList && aviso.classList.contains('g')) aviso.classList.remove('on'); }
  p398Confirmar_(avisos, function() { F398.rutasAceptadas[rutaId] = firma; if(avisos.length) p43Aviso_(publicar ? 'Publicando la ruta…' : 'Guardando la ruta…', 'g'); p44Aplicar_.apply(self, args); });
}; })(p44Aplicar_);
f48Aplicar_ = (function(original) { return function(publicar) {
  var self = this, args = arguments, r = F48.prop, S = P42.d;
  if(!r || !r.res || !S) return original.apply(self, args);
  var clientes = JSON.parse(JSON.stringify(S.frecuencias398 || [])), visitas = {};
  clientes.forEach(function(c) { c.programaciones = (c.programaciones || []).filter(function(p) { return !(p.estadoPlan === 'borrador' && p.fecha >= S.lunes && p.fecha <= S.sabado); }); });
  (r.res.rutas || []).forEach(function(ruta) { (ruta.orden || []).forEach(function(id) { if(Number(id) > 0) visitas[id] = { clienteId: Number(id) }; }); });
  var avisos = p398AvisosPropuesta_({ frecuencias398: clientes, visitas: visitas, res: r.res });
  var firma = JSON.stringify([S.lunes, publicar, r.res.rutas, S.frecuencias398]);
  if(F398.semanaAceptada === firma) return original.apply(self, args);
  p398Confirmar_(avisos, function() { F398.semanaAceptada = firma; f48Aplicar_.apply(self, args); });
}; })(f48Aplicar_);
