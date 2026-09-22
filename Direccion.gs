/* ═══════════════════════════════════════════════════════════════════
   DIRECCIÓN · la portada de gerencia
   ═══════════════════════════════════════════════════════════════════

   POR QUÉ EXISTE ESTE ARCHIVO
   El panel de gerencia era, hasta hoy, un informe de logística: kilos,
   visitas, operadores y vehículos. Mercadeo, planta y cobros no salían
   en ninguna línea. Gerencia abría «la portada de la empresa» y veía una de
   las cuatro zonas.

   QUÉ HACE — Y QUÉ NO
   LEE Y CALCULA. Nada más. No escribe una sola celda, no manda correos,
   no corre solo con un disparador, y no guarda ninguna cifra: todo se
   deriva del libro en el momento. Una cifra guardada es una cifra que
   algún día no coincide con la hoja de donde salió.

   Eso también es una garantía: el panel de dirección no puede cambiar
   nada del libro ni por accidente.

   LAS DOS REGLAS DE SIEMPRE
   1. NO repetir nombres entre archivos: aquí todo lleva prefijo `dir_`
      salvo las dos api_ que llama la pantalla.
   2. Nada de leer constantes de otro archivo AL CARGAR. Dentro de una
      función no hay problema.

   Y UNA TERCERA, PROPIA DE ESTE ARCHIVO
   3. NO se duplica un cálculo que ya exista. La zona de cobros llama a
      lo que hace Cobranza.gs; la de planta y la de logística leen las
      mismas hojas con las mismas reglas. Si mañana cambia cómo se mide
      la mora, cambia en un sitio y aquí se refleja solo.

   ───────────────────────────────────────────────────────────────────
   DEL PERIODO vs. DE SIEMPRE

   La mitad de estas cifras NO dependen del rango de fechas: la deuda
   vencida, el material sin acta y los contratos por vencer existen
   aunque uno mire solo septiembre. La otra mitad sí: kilos, visitas,
   facturado.

   Mezclarlas sin decirlo fue el error que encontramos en la Cartera
   vieja —cuatro cuadros pegados midiendo dos cosas distintas—. Por eso
   cada cifra viaja con `deSiempre: true|false` y la pantalla lo dice.
   ═══════════════════════════════════════════════════════════════════ */

const DIR_ZONAS = ['logistica', 'mercadeo', 'planta', 'cobros'];
const DIR_ROLES = ['gerente', 'admin', 'mercadeo'];

function dir_puede_(u) { return !!u && DIR_ROLES.indexOf(u.rol) >= 0; }


/* ── Leer cada hoja UNA vez por llamada ──────────────────────────────
   Armar la zona de logística leía la hoja de Recolecciones TRES veces:
   una para el periodo, otra para el periodo anterior y otra para la
   comparación al mismo día del mes. Con miles de filas eso es la
   diferencia entre que la pantalla abra en dos segundos o en veinte, y
   veinte segundos en blanco es lo que hace que uno recargue creyendo que
   se rompió.

   El memo dura lo que dura la llamada y se vacía al empezar cada una: en
   Apps Script cada petición es un proceso nuevo, pero vaciarlo a mano es
   lo que garantiza que dos llamadas seguidas nunca compartan datos
   viejos. Una cifra de dirección leída de una copia rancia es peor que
   una pantalla lenta. */
var DIR_MEMO = {};
function dir_memoLimpio_() { DIR_MEMO = {}; }
function dir_hoja_(nombre) {
  if (!DIR_MEMO[nombre]) DIR_MEMO[nombre] = leerHoja_(nombre);
  return DIR_MEMO[nombre];
}

/* ── Cuentas de fechas ───────────────────────────────────────────────
   El periodo anterior es del MISMO LARGO y termina justo antes. Sin eso
   la comparación miente: un mes contra una semana siempre «baja». */
function dir_periodoAnterior_(desde, hasta) {
  const d1 = new Date(String(desde) + 'T12:00:00');
  const d2 = new Date(String(hasta) + 'T12:00:00');
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return { desde:'', hasta:'' };
  const dias = Math.round((d2 - d1) / 86400000) + 1;
  const fin = new Date(d1.getTime()); fin.setDate(fin.getDate() - 1);
  const ini = new Date(fin.getTime()); ini.setDate(ini.getDate() - dias + 1);
  return { desde: dir_iso_(ini), hasta: dir_iso_(fin), dias: dias };
}
function dir_iso_(d) {
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) +
         '-' + ('0' + d.getDate()).slice(-2);
}
function dir_dias_(a, b) {
  if (!a || !b) return 0;
  return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
}
function dir_r2_(v) { return Math.round((Number(v) || 0) * 100) / 100; }

/* Separador de miles a mano. `toLocaleString` con locale no es de fiar
   en Apps Script —depende de qué tanto ICU traiga el runtime— y una
   cifra de dirección que salga «18400.00» en vez de «18,400.00» se lee
   mal justo donde más importa que se lea bien. */
function dir_miles_(v, dec) {
  const d = dec === undefined ? 2 : dec;
  const n = Number(v) || 0;
  const s = Math.abs(n).toFixed(d);
  const par = s.split('.');
  par[0] = par[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (n < 0 ? '-' : '') + par.join('.');
}
function dir_pct_(parte, todo) {
  return todo > 0.0001 ? Math.round(parte / todo * 1000) / 10 : 0;
}
/* Cuántos pendientes abiertos dejó el vigía en un módulo. Sale de la
   misma hoja que alimenta la bandeja: si ahí hay 12 cosas por atender,
   la tarjeta de esa zona dice 12. */
function dir_pendientes_(modulo) {
  const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_PEND);
  if (!h) return { total: 0, altas: 0, lista: [] };
  const filas = leerHoja_(HOJA_PEND);
  let total = 0, altas = 0;
  const lista = [];
  filas.forEach(p => {
    if (String(p.modulo || '').trim().toLowerCase() !== modulo) return;
    const e = String(p.estado || '').trim().toLowerCase();
    if (ESTADOS_CERRADOS.indexOf(e) >= 0) return;
    total++;
    const alta = String(p.prioridad || '').trim().toLowerCase() === 'alta';
    if (alta) altas++;
    lista.push({ titulo: String(p.titulo || p.tipo || 'Pendiente'),
                 detalle: String(p.descripcion || ''),
                 enlace: String(p.enlace || ''),
                 fecha: fechaISO_(p.fecha), alta: alta });
  });
  /* primero lo urgente y, dentro de eso, lo más viejo: un pendiente de
     hace tres semanas pesa más que el de ayer aunque sean del mismo tipo */
  lista.sort((a, b) => (b.alta - a.alta) || String(a.fecha).localeCompare(String(b.fecha)));
  return { total: total, altas: altas, lista: lista.slice(0, 8) };
}

/* ── La gráfica, con UNA sola forma para las cuatro zonas ─────────────
   Cada zona mide algo distinto —kilos, plata, porcentaje— pero la
   pantalla no tiene por qué saberlo. Todas devuelven lo mismo:

     { titulo, lee, unidad, horizontal?, barras:[{x, v, parcial?}] }

   `parcial` marca el mes EN CURSO. La pantalla lo dibuja rayado, y esa
   raya evita el error más caro de leer una gráfica de dirección: ver
   media barra de septiembre el día 15 y entender que las ventas se
   cayeron cuando el mes va por la mitad. */
function dir_gr_(titulo, lee, unidad, barras, horizontal) {
  return { titulo: titulo, lee: lee, unidad: unidad,
           horizontal: !!horizontal, barras: barras };
}

/* ── Lo que espera una decisión, por zona ────────────────────────────
   Esto vivía suelto en la portada vieja, en un solo bloque que mezclaba
   las cuatro zonas. Repartirlo por zona no es cosmética: un
   mantenimiento vencido no es un asunto «de la empresa», es un asunto de
   planta, y verlo en la pestaña de planta es lo que hace que alguien lo
   atienda.

   No calcula nada nuevo: son las mismas cuatro fuentes que ya miraba la
   portada, leídas donde estaban. */
function dir_decisiones_(zona, hoy) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const out = [];

  if (zona === 'planta' && ss.getSheetByName(HOJA_MTO)) {
    /* Solo el PRÓXIMO mantenimiento de cada equipo: si un equipo tiene
       cinco registros viejos, sigue siendo un equipo, no cinco alarmas. */
    const prox = {};
    leerHoja_(HOJA_MTO).forEach(m => {
      const p = fechaISO_(m.proximo); if (!p) return;
      const k = String(m.equipo || '') + '|' + String(m.tipo || '');
      if (!prox[k] || p < prox[k].proximo)
        prox[k] = { equipo:String(m.equipo || ''), tipo:String(m.tipo || ''), proximo:p };
    });
    const vencidos = [], porVencer = [];
    Object.keys(prox).forEach(k => {
      const d = dir_dias_(hoy, prox[k].proximo);
      if (d < 0) vencidos.push(prox[k]);
      else if (d <= 15) porVencer.push(prox[k]);
    });
    if (vencidos.length)
      out.push({ urgente:true, ir:'planta',
        titulo: vencidos.length + ' mantenimiento(s) vencido(s)',
        detalle: vencidos.slice(0, 3).map(v => v.equipo + ' · ' + v.tipo).join(' — ') });
    if (porVencer.length)
      out.push({ urgente:false, ir:'planta',
        titulo: porVencer.length + ' mantenimiento(s) por vencer',
        detalle: 'en los próximos 15 días' });
  }

  if (zona === 'cobros' && ss.getSheetByName(HOJA_GES)) {
    let rotas = 0;
    leerHoja_(HOJA_GES).forEach(g => {
      const fp = fechaISO_(g.fechaPrometida);
      if (fp && fp < hoy && String(g.seCompromete || '').toUpperCase() === 'SI' &&
          ['CUMPLIO','ANULADO'].indexOf(String(g.resultado || '').toUpperCase()) < 0) rotas++;
    });
    if (rotas)
      out.push({ urgente:true, ir:'cobros',
        titulo: rotas + ' compromiso(s) de pago incumplido(s)',
        detalle: 'clientes que prometieron pagar y no lo hicieron' });
  }

  if (zona === 'mercadeo') {
    let formularios = 0;
    if (ss.getSheetByName(HOJA_PRO)) {
      leerHoja_(HOJA_PRO).forEach(p => {
        if (String(p['formulario estado'] || '').toUpperCase() === 'RECIBIDO' &&
            ['Propuesta enviada','En negociación','Contrato en proceso','Firmado',
             'Pasado a cartera'].indexOf(String(p.estado || '').trim()) < 0) formularios++;
      });
    }
    if (formularios)
      out.push({ urgente:false, ir:'alta',
        titulo: formularios + ' cliente(s) enviaron sus datos',
        detalle: 'esperan que se les prepare la propuesta' });

    let solicitudes = 0;
    if (ss.getSheetByName(HOJA_SOL)) {
      leerHoja_(HOJA_SOL).forEach(x => {
        if (String(x.estado || '').toUpperCase() === 'PENDIENTE') solicitudes++;
      });
    }
    if (solicitudes)
      out.push({ urgente:false, ir:'alta',
        titulo: solicitudes + ' solicitud(es) por aprobar',
        detalle: 'clientes nuevos esperando entrar a la cartera' });
  }

  return out;
}

/* ═══ LOGÍSTICA ═════════════════════════════════════════════════════
   El titular es la COBERTURA, no los kilos. Los kilos suben y bajan con
   el tipo de cliente que tocó esa semana; la cobertura dice si se está
   cumpliendo con quien paga, que es la pregunta de dirección. */
function dir_recolecciones_(desde, hasta) {
  return dir_hoja_(HOJA_REC).filter(r => {
    const f = fechaISO_(r['Fecha de Recoleccion']);
    return f && (!desde || f >= desde) && (!hasta || f <= hasta);
  });
}

function dir_logistica_(desde, hasta) {
  const recs = dir_recolecciones_(desde, hasta);
  const clientes = dir_hoja_(HOJA_CLI).filter(c => !clienteFuera_(c));

  const visitados = {};
  let kg = 0;
  recs.forEach(r => {
    kg += Number(r['total Kg'] || 0);
    const k = String(r.Cliente || '').trim().toUpperCase();
    if (k) visitados[k] = 1;
  });

  const enCartera = clientes.length;
  const cuantosVisitados = Object.keys(visitados).length;
  const cobertura = dir_pct_(cuantosVisitados, enCartera);

  /* el mismo cálculo sobre el periodo anterior, para la comparación */
  const ant = dir_periodoAnterior_(desde, hasta);
  const recsAnt = dir_recolecciones_(ant.desde, ant.hasta);
  const visAnt = {};
  let kgAnt = 0;
  recsAnt.forEach(r => {
    kgAnt += Number(r['total Kg'] || 0);
    const k = String(r.Cliente || '').trim().toUpperCase();
    if (k) visAnt[k] = 1;
  });
  const coberturaAnt = dir_pct_(Object.keys(visAnt).length, enCartera);

  /* lo que duele: los que están pasados de su fecha. Sale del estado que
     ya mantiene el sistema, no de un cálculo paralelo */
  const atrasados = clientes
    .filter(c => ['VENCIDO','ATRASADO','POR RECOLECTAR'].indexOf(String(c.estado || '').trim()) >= 0)
    .map(c => ({ nombre: String(c.nombre || ''), estado: String(c.estado || ''),
                 region: String(c.region || ''), frecuencia: String(c.frecuencia || ''),
                 proxima: fechaISO_(c.proximaVisita), atraso: Number(c.diasAtraso || 0) }))
    .sort((a, b) => b.atraso - a.atraso);

  return {
    zona:'logistica', nombre:'Logística',
    valor: cobertura, unidad:'%', deSiempre:false,
    texto: cobertura.toFixed(cobertura < 10 ? 1 : 0) + ' %',
    sub: 'de la cartera visitada · ' + cuantosVisitados + ' de ' + enCartera + ' clientes',
    dif: Math.round((cobertura - coberturaAnt) * 10) / 10,
    difTexto: 'pts vs. el periodo anterior',
    subirEsMalo: false,
    comparable: recsAnt.length > 0,
    duele: atrasados.length
      ? atrasados.length + ' cliente' + (atrasados.length === 1 ? '' : 's') +
        ' pasado' + (atrasados.length === 1 ? '' : 's') + ' de su fecha; el peor lleva ' +
        atrasados[0].atraso + ' días.'
      : 'Toda la cartera está dentro de su fecha.',
    /* lo que el detalle necesita y no vale la pena recalcular */
    _recs: recs, _kg: kg, _kgAnt: kgAnt, _clientes: clientes,
    _atrasados: atrasados, _visitados: cuantosVisitados, _enCartera: enCartera
  };
}

/* ═══ MERCADEO ══════════════════════════════════════════════════════
   El titular es el VALOR PARADO, no el número de prospectos. Contar
   prospectos no dice nada; contar la plata que está esperando una
   llamada, sí. */
function dir_prospectos_() {
  return dir_hoja_(HOJA_PRO).filter(p => String(p.empresa || '').trim());
}

function dir_mercadeo_(desde, hasta, hoy) {
  const pros = dir_prospectos_();
  const vivos = pros.filter(p => {
    const e = String(p.estado || '').trim();
    return e && ['Rechazado','Stand-by','Pasado a cartera'].indexOf(e) < 0;
  });

  /* propuesta enviada y todavía sin cerrar: es plata esperando */
  const esperando = vivos.filter(p =>
    fechaISO_(p['fecha propuesta']) && CERRADOS_PRO.indexOf(String(p.estado || '').trim()) < 0);
  let valor = 0;
  esperando.forEach(p => { valor += Number(p['valor cotizado']) || 0; });

  const ant = dir_periodoAnterior_(desde, hasta);
  const cerradosPeriodo = pros.filter(p => {
    const f = fechaISO_(p['fecha contrato']);
    return f && f >= desde && f <= hasta;
  }).length;
  const cerradosAntes = pros.filter(p => {
    const f = fechaISO_(p['fecha contrato']);
    return f && f >= ant.desde && f <= ant.hasta;
  }).length;

  /* contratos por vencer: se miran los CLIENTES, que es donde vive el
     vencimiento del contrato firmado */
  const porVencer = leerHoja_(HOJA_CLI).map(c => {
    if (clienteFuera_(c)) return null;
    const v = fechaISO_(c.vencimiento);
    if (!v) return null;
    const d = dir_dias_(hoy, v);
    if (d > 30) return null;
    return { nombre: String(c.nombre || ''), vence: v, dias: d };
  }).filter(Boolean).sort((a, b) => a.dias - b.dias);

  return {
    zona:'mercadeo', nombre:'Mercadeo',
    valor: dir_r2_(valor), unidad:'B/.', deSiempre:true,
    texto: 'B/. ' + dir_miles_(valor),
    sub: 'en propuestas sin respuesta · ' + esperando.length + ' de ' + vivos.length + ' prospectos vivos',
    dif: cerradosPeriodo - cerradosAntes,
    difTexto: 'cierres vs. el periodo anterior',
    subirEsMalo: false,
    comparable: (cerradosPeriodo + cerradosAntes) > 0,
    duele: porVencer.length
      ? porVencer.length + ' contrato' + (porVencer.length === 1 ? '' : 's') +
        (porVencer[0].dias < 0
          ? '; uno venció hace ' + Math.abs(porVencer[0].dias) + ' días.'
          : ' vencen en los próximos 30 días.')
      : 'Ningún contrato vence en los próximos 30 días.',
    _pros: pros, _vivos: vivos, _esperando: esperando,
    _cerrados: cerradosPeriodo, _porVencer: porVencer
  };
}

/* ═══ PLANTA ════════════════════════════════════════════════════════
   El titular es LO QUE ENTRÓ Y NO HA SALIDO. De todo lo de planta es lo
   único con consecuencia: material acumulado sin acta sigue siendo,
   legalmente, responsabilidad de ECOVSA.

   Y ya se calculaba: `acta` vacía en la hoja de recolecciones. Estaba
   ahí desde el principio y no lo miraba nadie. */
function dir_planta_(desde, hasta, hoy) {
  const todas = dir_hoja_(HOJA_REC);
  const sinActa = todas.filter(r => !String(r.acta || '').trim() &&
                                    fechaISO_(r['Fecha de Recoleccion']));
  let kgSinActa = 0, masViejo = '';
  const porResponsable = {};
  sinActa.forEach(r => {
    const kg = Number(r['total Kg'] || 0);
    kgSinActa += kg;
    const f = fechaISO_(r['Fecha de Recoleccion']);
    if (!masViejo || f < masViejo) masViejo = f;
    const q = String(r.Responsable || '(sin responsable)').trim();
    if (!porResponsable[q]) porResponsable[q] = { responsable:q, registros:0, kg:0, viejo:'' };
    const d = porResponsable[q];
    d.registros++; d.kg += kg;
    if (!d.viejo || f < d.viejo) d.viejo = f;
  });

  const recs = dir_recolecciones_(desde, hasta);
  let recibido = 0;
  recs.forEach(r => { recibido += Number(r['total Kg'] || 0); });

  /* la merma sale de Salidas: lo que pesó planta contra lo que pesó la
     báscula de destino */
  const salidas = dir_hoja_(HOJA_SAL).filter(s => fechaISO_(s.fecha));
  const porMes = {};
  salidas.forEach(s => {
    const f = fechaISO_(s.fecha), m = f.slice(0, 7);
    const kp = Number(s.kgPlanta) || 0, ke = Number(s.kgEmas) || 0;
    if (!porMes[m]) porMes[m] = { mes:m, kgPlanta:0, kgEmas:0, salidas:0 };
    porMes[m].kgPlanta += kp; porMes[m].kgEmas += ke; porMes[m].salidas++;
  });
  const meses = Object.keys(porMes).sort().slice(-6).map(m => {
    const x = porMes[m];
    return { mes:m, etiqueta: dir_mes_(m), salidas:x.salidas,
             kgPlanta: dir_r2_(x.kgPlanta), kgEmas: dir_r2_(x.kgEmas),
             merma: x.kgPlanta > 0.0001
               ? Math.round((x.kgPlanta - x.kgEmas) / x.kgPlanta * 1000) / 10 : 0 };
  });
  const ahora = meses.length ? meses[meses.length - 1] : null;
  const antes = meses.length > 1 ? meses[0] : null;

  const dias = masViejo ? dir_dias_(masViejo, hoy) : 0;

  return {
    zona:'planta', nombre:'Planta',
    valor: dir_r2_(kgSinActa), unidad:'kg', deSiempre:true,
    texto: dir_miles_(kgSinActa, 0) + ' kg',
    sub: 'entraron y todavía no han salido · ' + sinActa.length + ' recolección(es)',
    dif: (ahora && antes) ? Math.round((ahora.merma - antes.merma) * 10) / 10 : 0,
    difTexto: 'pts de merma vs. ' + (antes ? antes.etiqueta : ''),
    subirEsMalo: true,
    comparable: !!(ahora && antes),
    duele: sinActa.length
      ? 'El lote más viejo lleva ' + dias + ' días esperando acta.'
      : 'Todo lo recibido tiene su acta de salida.',
    _sinActa: sinActa, _kgSinActa: dir_r2_(kgSinActa), _recibido: dir_r2_(recibido),
    _porResponsable: Object.keys(porResponsable).map(k => porResponsable[k])
      .sort((a, b) => b.kg - a.kg),
    _meses: meses, _viejo: masViejo, _diasViejo: dias
  };
}

const DIR_MESES = ['', 'Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function dir_mes_(m) {
  const n = Number(String(m).slice(5, 7));
  return (DIR_MESES[n] || m) + ' ' + String(m).slice(0, 4);
}

/* ═══ COBROS ════════════════════════════════════════════════════════
   No se recalcula nada: se llama a lo que ya vive en Cobranza.gs. Si
   mañana cambia cómo se mide la mora, cambia allá y aquí se refleja. */
function dir_cobros_(hoy) {
  const libro = cob_libro_();
  /* Diez cuentas y no cinco: esta pestaña ES el reporte desde que se
     fundieron, y con cinco no se alcanza a ver si la mora es de una
     cuenta o de la cartera entera. */
  const k = cob_concentracion_(libro, hoy, 10);
  const e = cob_envejecimiento_(libro, hoy, 60);
  const c = cob_curva_(libro, hoy, 6);
  const d = cob_diasEnCobrar_(libro, hoy, 90);

  return {
    zona:'cobros', nombre:'Cobros',
    valor: k.vencido, unidad:'B/.', deSiempre:true,
    texto: 'B/. ' + dir_miles_(k.vencido),
    sub: 'vencidos · ' + k.facturas + ' factura(s) en mora',
    dif: e.comparable ? Math.round((e.parte - e.parteAntes) * 10) / 10 : 0,
    difTexto: 'pts de cartera vieja vs. hace ' + e.diasAtras + ' días',
    subirEsMalo: true,
    comparable: e.comparable,
    duele: k.mayor
      ? 'El ' + k.mayor.parte.toFixed(k.mayor.parte < 10 ? 1 : 0) +
        ' % es una sola cuenta: ' + k.mayor.cliente + '.'
      : 'No hay nada vencido.',
    /* El libro viaja con el resumen para que el detalle no lo vuelva a
       leer: son media docena de hojas y leerlas dos veces era la mitad
       de la espera. */
    _libro: libro,
    _concentracion: k, _envejecimiento: e, _curva: c, _dias: d
  };
}

/* ═══ LA PORTADA ════════════════════════════════════════════════════
   Las cuatro tarjetas de un solo viaje. Es lo único que se pide al
   abrir, y por eso la portada aparece rápido: el detalle de cada zona
   se busca solo cuando alguien la abre. */
function api_dir_portada(pin, desde, hasta) {
  dir_memoLimpio_();
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!dir_puede_(u))
    return { ok:false, error:'El panel de dirección es para gerencia y administración.' };

  const hoy = hoyPanama_();
  const d1 = String(desde || '') || hoy.slice(0, 8) + '01';
  const d2 = String(hasta || '') || hoy;

  const zonas = [];
  const fallas = [];
  /* Si una zona revienta —una hoja que no existe todavía, una columna
     que alguien renombró— NO se cae la portada entera: esa tarjeta dice
     que no pudo calcularse y las otras tres siguen sirviendo. */
  [['logistica', () => dir_logistica_(d1, d2)],
   ['mercadeo',  () => dir_mercadeo_(d1, d2, hoy)],
   ['planta',    () => dir_planta_(d1, d2, hoy)],
   ['cobros',    () => dir_cobros_(hoy)]].forEach(par => {
    try {
      const z = dir_limpiar_(par[1]());
      z.pendientes = dir_pendientes_(par[0]);
      zonas.push(z);
    } catch (err) {
      fallas.push(par[0] + ': ' + (err && err.message));
      zonas.push({ zona:par[0], nombre:par[0], error:true,
                   texto:'—', sub:'no se pudo calcular',
                   duele:'', pendientes: dir_pendientes_(par[0]) });
    }
  });

  const ant = dir_periodoAnterior_(d1, d2);
  return { ok:true, usuario:u, hoy:hoy, desde:d1, hasta:d2,
           anterior:ant, zonas:zonas, fallas:fallas };
}

/* La tarjeta no lleva los datos crudos del detalle: son miles de filas
   que nadie va a mirar en la portada. Se quitan las claves que empiezan
   con guion bajo. */
function dir_limpiar_(z) {
  const o = {};
  Object.keys(z).forEach(k => { if (k.charAt(0) !== '_') o[k] = z[k]; });
  return o;
}

/* ═══ EL DETALLE DE UNA ZONA ════════════════════════════════════════
   Con sus preguntas YA CONTESTADAS.

   Van juntas a propósito. Es la lección de los botones de tono en
   cobros: cuando cada clic salía a preguntarle al servidor, se sentía
   lento. Aquí llega todo de una y hacer clic en una pregunta es
   instantáneo. */
function api_dir_zona(pin, zona, desde, hasta, ventana) {
  dir_memoLimpio_();
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!dir_puede_(u))
    return { ok:false, error:'El panel de dirección es para gerencia y administración.' };

  const z = String(zona || '').trim().toLowerCase();
  if (DIR_ZONAS.indexOf(z) < 0) return { ok:false, error:'Zona desconocida: ' + zona };

  const hoy = hoyPanama_();
  const d1 = String(desde || '') || hoy.slice(0, 8) + '01';
  const d2 = String(hasta || '') || hoy;

  try {
    const r = z === 'logistica' ? dir_detLogistica_(d1, d2, hoy)
            : z === 'mercadeo'  ? dir_detMercadeo_(d1, d2, hoy, ventana)
            : z === 'planta'    ? dir_detPlanta_(d1, d2, hoy)
            :                     dir_detCobros_(hoy, d1, d2);
    /* Lo que el vigía dejó abierto y lo que espera una decisión viajan
       CON la zona. Si fallan, la zona sigue sirviendo: son un añadido,
       no el reporte. */
    try { r.pendientes = dir_pendientes_(z); }
    catch (e) { r.pendientes = { total:0, altas:0, lista:[] }; }
    try { r.decisiones = dir_decisiones_(z, hoy); }
    catch (e) { r.decisiones = []; }
    /* Los cuatro conteos van en el MISMO viaje: las pestañas tienen que
       poder mostrar su pastilla sin salir a preguntar cuatro veces más.
       Es una sola lectura de la hoja de Pendientes. */
    try { r.conteos = lobby_pendientes_(); }
    catch (e) { r.conteos = {}; }
    /* Cartera SÍ depende del rango desde que el reporte se fundió con la
       pestaña: la mora sigue siendo de siempre, pero lo facturado y lo
       cobrado son del periodo, y cada número lleva su pastilla diciendo
       de cuál de los dos sale. */
    return r;
  } catch (err) {
    return { ok:false, error:'No se pudo calcular ' + z + ': ' + (err && err.message) };
  }
}

/* ── Logística en detalle ─────────────────────────────────────────────
   Todo el módulo en un viaje. Esto era lo último que quedaba partido: la
   pestaña enseñaba cuatro números y el detalle de verdad vivía en Panel,
   una página que solo se abría desde aquí y que además pedía TRES cosas
   distintas al servidor.

   Dos bloques, como en mercadeo: LA OPERACIÓN —lo que se recogió— y LA
   FLOTA —con qué se recogió—. La flota no existía en Dirección: había que
   entrar a Panel para verla.

   El dinero de la flota (lo que costó el combustible) NO va aquí: eso es
   de Finanzas. Aquí quedan los rendimientos, que son de operación. */
function dir_detLogistica_(d1, d2, hoy) {
  const z = dir_logistica_(d1, d2);
  const recs = z._recs;

  let kgBolsas = 0, kgPunzo = 0;
  const porMes = {}, porOperador = {}, porCliente = {};
  recs.forEach(r => {
    const kg = Number(r['total Kg'] || 0);
    kgBolsas += Number(r['Kg Recolectados'] || 0);
    kgPunzo  += Number(r['kg punzo cortantes'] || 0);
    const f = fechaISO_(r['Fecha de Recoleccion']), m = f.slice(0, 7);
    if (!porMes[m]) porMes[m] = { mes:m, kg:0, visitas:0 };
    porMes[m].kg += kg; porMes[m].visitas++;
    const o = String(r.Responsable || '—').trim();
    if (!porOperador[o]) porOperador[o] = { operador:o, kg:0, visitas:0, minutos:0 };
    porOperador[o].kg += kg; porOperador[o].visitas++;
    porOperador[o].minutos += minutosEntre_(horaTxt_(r['hora inicio']), horaTxt_(r['hora final']));
    const c = String(r.Cliente || '—').trim();
    if (!porCliente[c]) porCliente[c] = { cliente:c, kg:0, visitas:0 };
    porCliente[c].kg += kg; porCliente[c].visitas++;
  });

  /* La gráfica sigue al periodo, no a un seis fijo. Los meses salen del
     RANGO y no de los datos, para que un mes sin recolecciones se vea
     como un hueco en vez de desaparecer de la fila. Y como la ventana
     puede alcanzar meses de antes del periodo —cuando el filtro es corto
     y se completa hacia atrás—, los kilos de la gráfica se cuentan sobre
     todo el libro y no solo sobre lo del rango. */
  const w = dir_ventanaMeses_(d1, d2);
  const kgMesTodo = {};
  dir_hoja_(HOJA_REC).forEach(r => {
    const f = fechaISO_(r['Fecha de Recoleccion']); if (!f) return;
    const m = f.slice(0, 7);
    kgMesTodo[m] = (kgMesTodo[m] || 0) + Number(r['total Kg'] || 0);
  });
  const meses = w.meses.map(m => ({ mes:m, etiqueta:dir_mes_(m),
    kg: dir_r2_(kgMesTodo[m] || 0), visitas: (porMes[m] || {}).visitas || 0 }));

  const operadores = Object.keys(porOperador).map(k => {
    const o = porOperador[k];
    return { operador:o.operador, visitas:o.visitas, kg:dir_r2_(o.kg),
             promedioMin: o.visitas ? Math.round(o.minutos / o.visitas) : 0,
             /* kilos por hora en ruta: mide el rendimiento sin premiar
                a quien simplemente tiene más paradas */
             kgHora: o.minutos > 0 ? Math.round(o.kg / (o.minutos / 60)) : 0 };
  }).sort((a, b) => b.kg - a.kg);

  const topClientes = Object.keys(porCliente).map(k => porCliente[k])
    .sort((a, b) => b.kg - a.kg).slice(0, 10)
    .map(c => ({ cliente:c.cliente, visitas:c.visitas, kg:dir_r2_(c.kg),
                 parte: dir_pct_(c.kg, z._kg) }));

  /* ── LA FLOTA ── jornadas y cargas de combustible del periodo.
     De aquí sale el rendimiento; el gasto se queda fuera a propósito. */
  const enRango = f => { const x = fechaISO_(f); return x && x >= d1 && x <= d2; };
  const jor = dir_hoja_(HOJA_JOR)
    .filter(j => enRango(j.fecha) && Number(j.kmRecorridos) > 0);
  const com = dir_hoja_(HOJA_COM).filter(c => enRango(c.fecha));

  let kmTotal = 0, kgFlota = 0, paradas = 0, galones = 0;
  jor.forEach(j => {
    kmTotal += Number(j.kmRecorridos || 0);
    kgFlota += Number(j.totalKg || 0);
    paradas += Number(j.paradas || 0);
  });
  com.forEach(c => { galones += Number(c.galones || 0); });
  kmTotal = dir_r2_(kmTotal); galones = dir_r2_(galones);
  const kgPorKm = kmTotal ? Math.round(kgFlota / kmTotal * 100) / 100 : 0;
  const kmPorGalon = galones ? Math.round(kmTotal / galones * 10) / 10 : 0;
  const kmPorParada = paradas ? Math.round(kmTotal / paradas * 10) / 10 : 0;

  /* ── el rendimiento, mes a mes ──
     El bloque de la flota enseña los kilos por kilómetro DEL PERIODO, y
     un rendimiento suelto no dice si vamos mejor o peor: hace falta
     contra qué. Se cuenta sobre TODAS las jornadas y no solo las del
     rango, porque la ventana puede alcanzar meses de antes. */
  const flotaMes = {};
  dir_hoja_(HOJA_JOR).forEach(j => {
    const f = fechaISO_(j.fecha); if (!f) return;
    const km = Number(j.kmRecorridos || 0); if (km <= 0) return;
    const m = f.slice(0, 7);
    if (!flotaMes[m]) flotaMes[m] = { km:0, kg:0 };
    flotaMes[m].km += km;
    flotaMes[m].kg += Number(j.totalKg || 0);
  });
  const rendMes = w.meses.map(m => {
    const x = flotaMes[m] || { km:0, kg:0 };
    return { mes:m, km: dir_r2_(x.km), kg: dir_r2_(x.kg),
             kgPorKm: x.km > 0.0001 ? Math.round(x.kg / x.km * 100) / 100 : 0 };
  });
  const conRuta = rendMes.filter(m => m.km > 0.0001);

  const porVehiculo = {};
  const cajaV = v => {
    if (!porVehiculo[v]) porVehiculo[v] = { vehiculo:v, km:0, kg:0, paradas:0, galones:0 };
    return porVehiculo[v];
  };
  jor.forEach(j => {
    const v = cajaV(String(j.vehiculo || '—'));
    v.km += Number(j.kmRecorridos || 0);
    v.kg += Number(j.totalKg || 0);
    v.paradas += Number(j.paradas || 0);
  });
  com.forEach(c => { cajaV(String(c.vehiculo || '—')).galones += Number(c.galones || 0); });
  const vehiculos = Object.keys(porVehiculo).map(k => {
    const v = porVehiculo[k];
    v.km = dir_r2_(v.km); v.kg = dir_r2_(v.kg); v.galones = dir_r2_(v.galones);
    v.rendimiento = v.galones ? Math.round(v.km / v.galones * 10) / 10 : 0;
    v.kgPorKm = v.km ? Math.round(v.kg / v.km * 100) / 100 : 0;
    return v;
  }).sort((a, b) => b.km - a.km);

  const jornadas = jor.map(j => ({
    fecha: fechaISO_(j.fecha), conductor:String(j.conductor || '—'),
    vehiculo:String(j.vehiculo || '—'),
    km: dir_r2_(j.kmRecorridos), kg: dir_r2_(j.totalKg),
    paradas: Number(j.paradas || 0)
  })).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

  /* ── el ritmo de las visitas ──
     Esto en Panel se llamaba «Estado de la cartera» y era una dona. El
     nombre engañaba: no es la cartera comercial —esa vive en mercadeo—
     sino cada cuánto se está visitando, que es cosa de logística. */
  const ritmo = {};
  dir_hoja_(HOJA_CLI).forEach(c => {
    if (clienteFuera_(c)) return;
    const e = String(c.estado || 'SIN ESTADO').trim().toUpperCase() || 'SIN ESTADO';
    ritmo[e] = (ritmo[e] || 0) + 1;
  });
  const ritmoLista = Object.keys(ritmo)
    .map(k => ({ etiqueta: k.charAt(0) + k.slice(1).toLowerCase(), cuantos: ritmo[k],
                 vacio: k === 'SIN ESTADO' }))
    .sort((a, b) => (a.vacio - b.vacio) || (b.cuantos - a.cuantos));

  /* la comparación honesta del mes en curso: contra el mes anterior AL
     MISMO DÍA, no contra el mes anterior cerrado */
  const mesHoy = hoy.slice(0, 7), dia = Number(hoy.slice(8, 10));
  const mesAnt = dir_mesMenos_(mesHoy, 1);
  const corte = mesAnt + '-' + ('0' + dia).slice(-2);
  let kgMes = 0, kgAntAlDia = 0, kgAntTotal = 0;
  dir_hoja_(HOJA_REC).forEach(r => {
    const f = fechaISO_(r['Fecha de Recoleccion']); if (!f) return;
    const kg = Number(r['total Kg'] || 0);
    if (f.slice(0, 7) === mesHoy && f <= hoy) kgMes += kg;
    else if (f.slice(0, 7) === mesAnt) {
      kgAntTotal += kg;
      if (f <= corte) kgAntAlDia += kg;
    }
  });

  const lejos = z._atrasados.filter(c => c.atraso > 15);

  return { ok:true, zona:'logistica', nombre:'Logística', hoy:hoy, desde:d1, hasta:d2,
    dice:'<b>Lo recogido y la flota son del periodo</b>' +
         '<span> · el ritmo de las visitas es de siempre</span>',
    /* La flota va en su propio bloque: no existía en Dirección y mezclarla
       con lo recogido daría ocho números sin decir cuál mide qué. */
    bloques: [
      { titulo:'La operación', kpis: [
        { e:'Recolectado', v: dir_miles_(z._kg, 0), u:'kg',
          s: dir_miles_(kgBolsas, 0) + ' kg bolsas · ' + dir_miles_(kgPunzo, 0) + ' kg punzo' },
        { e:'Visitas', v: String(recs.length),
          s: recs.length ? dir_miles_(z._kg / recs.length, 0) + ' kg promedio por visita'
                         : '—' },
        { e:'Clientes visitados', v: String(z._visitados),
          s:'de ' + z._enCartera + ' en cartera' },
        { e:'Pasados de fecha', v: String(z._atrasados.length),
          s: z._atrasados.length ? 'el peor con ' + z._atrasados[0].atraso + ' días'
                                 : 'ninguno',
          de:'siempre', malo: lejos.length > 0 }
      ] },
      { titulo:'La flota', kpis: [
        { e:'Kilómetros', v: dir_miles_(kmTotal, 0), u:'km',
          s: jor.length + ' jornada(s) con ruta' },
        { e:'Kilos por km', v: String(kgPorKm), u:'kg',
          s: kmPorParada ? kmPorParada + ' km entre parada y parada'
                         : 'sin paradas registradas' },
        { e:'Rendimiento', v: kmPorGalon ? String(kmPorGalon) : '—', u:'km/gal',
          s: galones ? dir_miles_(galones, 0) + ' galones cargados'
                     : 'sin cargas de combustible en el periodo' },
        { e:'Paradas', v: dir_miles_(paradas, 0),
          s: jor.length ? Math.round(paradas / jor.length) + ' por jornada' : '—' }
      ] }
    ],
    graficas: [
      { titulo:'Kilos recolectados por mes', lee: dir_leeMeses_(w), unidad:'kg',
        horizontal:false,
        barras: meses.map(m => ({ x: m.etiqueta.split(' ')[0].slice(0, 3), v: m.kg,
                                  parcial: m.mes === hoy.slice(0, 7) })) },
      /* El mes en curso NO va rayado aquí. En los kilos sí, porque un mes
         a medias lleva menos kilos y sin la raya se lee como una caída.
         Esto es una RAZÓN: kilos entre kilómetros de los días que van.
         Un mes a medias da un número completo y válido, y marcarlo como
         incompleto diría que está subestimado cuando no lo está. */
      { titulo:'Cuántos kilos movió cada kilómetro', lee: dir_leeMeses_(w), unidad:'kg',
        horizontal:false,
        barras: rendMes.map(m => ({ x: dir_mes_(m.mes).split(' ')[0].slice(0, 3),
                                    v: m.kgPorKm })) }
    ],
    /* El ritmo se dibuja con las barras de siempre y no con una dona:
       cuatro tajadas se comparan mejor en fila que en círculo, y así se
       va una librería de fuera que había que bajar de internet. */
    reparto: { titulo:'Cómo va el ritmo de las visitas',
               lee: z._enCartera + ' cliente(s) en ruta', lista: ritmoLista },
    preguntas: [
      { clave:'sin_visita', q:'¿Qué clientes llevan más de 15 días sin visita?',
        cuenta: lejos.length + ' cliente(s)',
        titulo: lejos.length ? lejos.length + ' clientes pasados de 15 días'
                             : 'Ninguno pasa de 15 días',
        tabla: { cab:['Cliente','Región','Frecuencia','Atraso'], alerta:3,
                 filas: lejos.map(c => [c.nombre, c.region || '—', c.frecuencia || '—',
                                        c.atraso + ' días']) },
        nota:'Un cliente que se pasa de su frecuencia acumula residuo que no cabe, y esa es ' +
             'la llamada que entra de mal humor.' },
      { clave:'operadores', q:'¿Qué operador rinde más?',
        cuenta: operadores.length + ' operador(es)',
        titulo: operadores.length
          ? operadores[0].operador + ' lleva más kilos, pero mira la última columna'
          : 'Sin datos de operadores en el periodo',
        tabla: { cab:['Operador','Visitas','Kg','Min/visita','Kg por hora'], num:[1,2,3,4],
                 filas: operadores.map(o => [o.operador, o.visitas, dir_miles_(o.kg, 0),
                                             o.promedioMin || '—', o.kgHora || '—']) },
        nota:'Más paradas no es mejor rendimiento: las rutas no son igual de densas, y ' +
             'comparar sin mirar la zona premia a quien tiene la ruta fácil.' },
      { clave:'rendimiento', q:'¿La flota está rindiendo mejor o peor?',
        cuenta: conRuta.length + ' meses con ruta',
        titulo: conRuta.length > 1
          ? (conRuta[conRuta.length - 1].kgPorKm >= conRuta[0].kgPorKm
              ? 'Mejor: de ' + conRuta[0].kgPorKm + ' a ' +
                conRuta[conRuta.length - 1].kgPorKm + ' kg por km'
              : 'Peor: de ' + conRuta[0].kgPorKm + ' a ' +
                conRuta[conRuta.length - 1].kgPorKm + ' kg por km')
          : 'Hace falta más de un mes con jornadas para saberlo',
        tabla: { cab:['Mes','Kilómetros','Kilos','Kilos por km'], num:[1,2,3],
                 filas: rendMes.map(m => [dir_mes_(m.mes), dir_miles_(m.km, 0),
                   dir_miles_(m.kg, 0), m.kgPorKm || '—']) },
        nota:'Más kilos por kilómetro es mejor: significa que se recogió más sin rodar ' +
             'más. Pero cuidado con leerlo solo: una ruta nueva y lejana baja el número ' +
             'sin que nadie esté trabajando peor, y un mes con poca recolección lo sube ' +
             'porque se dejaron de hacer los viajes largos.' },
      { clave:'vehiculos', q:'¿Cómo se comparan los vehículos?',
        cuenta: vehiculos.length + ' vehículo(s)',
        titulo: vehiculos.length
          ? vehiculos[0].vehiculo + ' es el que más rueda'
          : 'Sin jornadas registradas en el periodo',
        tabla: { cab:['Vehículo','Km','Kg','Paradas','Galones','Rendimiento'],
                 num:[1,2,3,4,5],
                 filas: vehiculos.map(v => [v.vehiculo, dir_miles_(v.km, 0),
                   dir_miles_(v.kg, 0), v.paradas, v.galones || '—',
                   v.rendimiento ? v.rendimiento + ' km/gal' : '—']) },
        nota:'El rendimiento sale de dividir los kilómetros del vehículo entre los galones ' +
             'que se le cargaron EN EL PERIODO. Si se cargó al final del mes y se rodó al ' +
             'principio, el número de un mes suelto engaña: se lee mejor en trimestre.' },
      { clave:'jornadas', q:'¿Cómo fue cada jornada?',
        cuenta: jornadas.length + ' jornada(s)',
        titulo: jornadas.length ? 'La última fue el ' + fechaPanama_(jornadas[0].fecha)
                                : 'Sin jornadas registradas',
        tabla: { cab:['Fecha','Conductor','Vehículo','Km','Kg','Paradas'], num:[3,4,5],
                 filas: jornadas.map(j => [fechaPanama_(j.fecha), j.conductor, j.vehiculo,
                   dir_miles_(j.km, 0), dir_miles_(j.kg, 0), j.paradas]) } },
      { clave:'top_clientes', q:'¿Quiénes son los clientes de más volumen?',
        cuenta: topClientes.length + ' cliente(s)',
        titulo: topClientes.length
          ? 'Los tres primeros son el ' +
            dir_r2_(topClientes.slice(0, 3).reduce((s, c) => s + c.parte, 0)) + ' % de los kilos'
          : 'Sin recolecciones en el periodo',
        tabla: { cab:['Cliente','Visitas','Kg','Del total'], num:[1,2,3],
                 filas: topClientes.map(c => [c.cliente, c.visitas, dir_miles_(c.kg, 0),
                                              c.parte + ' %']) } },
      { clave:'mas_o_menos', q:'¿Recogimos más o menos que el mes pasado?',
        cuenta: dir_mes_(mesHoy),
        titulo: kgMes >= kgAntAlDia ? 'Vamos arriba, al mismo día del mes' : 'Vamos abajo',
        texto: 'Van ' + dir_miles_(kgMes, 0) + ' kg de ' + dir_mes_(mesHoy) +
               ' contra ' + dir_miles_(kgAntAlDia, 0) + ' kg que llevaba ' + dir_mes_(mesAnt) +
               ' al día ' + dia + '. ' + dir_mes_(mesAnt) + ' cerró en ' +
               dir_miles_(kgAntTotal, 0) + ' kg.',
        nota:'Se compara al mismo día del mes. Contra un mes cerrado, el mes en curso ' +
             'siempre parece una caída y no lo es.' }
    ] };
}


/* ── LA VENTANA DE MESES DE UNA GRÁFICA ──────────────────────────────
   Sigue al PERIODO: si se pide un año, salen doce barras. Antes salían
   seis siempre, sin mirar el filtro, así que con un año a la vista la
   gráfica enseñaba medio año y el subtítulo decía «últimos seis meses»
   tan tranquilo. Los números decían una cosa y el dibujo otra.

   Dos cuidados:
   · con menos del mínimo se completa hacia atrás con historia — una
     semana filtrada saldría como UNA barra sin con qué compararse
   · con más del tope se corta, porque cuarenta barras en este ancho no
     se leen; y entonces el subtítulo lo dice, que es lo que antes no
     hacía nadie

   Devuelve TODOS los meses del rango, incluso los que no tienen nada:
   un mes sin recolecciones tiene que verse como un hueco, no
   desaparecer de la fila como si no hubiera existido. */
const DIR_MESES_MIN = 6, DIR_MESES_TOPE = 24;

function dir_ventanaMeses_(d1, d2, min, tope) {
  min = min || DIR_MESES_MIN; tope = tope || DIR_MESES_TOPE;
  const fin = String(d2).slice(0, 7);
  let y = Number(String(d1).slice(0, 4)), m = Number(String(d1).slice(5, 7));
  const lista = [];
  /* freno duro: una fecha rara en el libro no puede colgar el servidor */
  for (let i = 0; i < 400; i++) {
    const mm = y + '-' + ('0' + m).slice(-2);
    lista.push(mm);
    if (mm >= fin) break;
    m++; if (m > 12) { m = 1; y++; }
  }
  let cortada = false;
  if (lista.length > tope) { lista.splice(0, lista.length - tope); cortada = true; }
  let completada = false;
  while (lista.length < min) {
    const p = lista[0].split('-');
    let yy = Number(p[0]), mm = Number(p[1]) - 1;
    if (mm < 1) { mm = 12; yy--; }
    lista.unshift(yy + '-' + ('0' + mm).slice(-2));
    completada = true;
  }
  return { meses: lista, cortada: cortada, completada: completada };
}

/* Qué decir debajo del título, para que el subtítulo no mienta. */
function dir_leeMeses_(w) {
  if (w.cortada)
    return 'los últimos ' + w.meses.length + ' meses · el periodo es más largo';
  if (w.completada)
    return w.meses.length + ' meses, para tener con qué comparar';
  return dir_mes_(w.meses[0]) + ' a ' + dir_mes_(w.meses[w.meses.length - 1]);
}

function dir_mesMenos_(mes, n) {
  const a = Number(String(mes).slice(0, 4)), m = Number(String(mes).slice(5, 7));
  const d = new Date(a, m - 1 - n, 1);
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
}

/* ── Mercadeo en detalle ──────────────────────────────────────────────
   Todo lo del módulo en un solo viaje: la cartera que ya se tiene y el
   embudo de lo que viene entrando. Antes esto estaba partido en dos —la
   pestaña con cuatro números y una página aparte con el resto— y el
   embudo por etapa se calculaba DOS VECES, una en cada sitio. */
function dir_detMercadeo_(d1, d2, hoy, ventana) {
  const z = dir_mercadeo_(d1, d2, hoy);
  const pros = z._pros, vivos = z._vivos, esperando = z._esperando;

  /* el embudo: cuánta plata hay parada en cada etapa. Las etapas que no
     están en la lista oficial también cuentan: si alguien escribió un
     estado a mano, su plata no puede desaparecer del total. */
  const porEtapa = {};
  vivos.forEach(p => {
    const e = String(p.estado || 'Sin estado').trim();
    if (!porEtapa[e]) porEtapa[e] = { etapa:e, cuantos:0, valor:0 };
    porEtapa[e].cuantos++;
    porEtapa[e].valor += Number(p['valor cotizado']) || 0;
  });
  const etapas = ESTADOS_PRO.filter(e => porEtapa[e]).map(e => porEtapa[e]);
  Object.keys(porEtapa).forEach(k => {
    if (ESTADOS_PRO.indexOf(k) < 0) etapas.push(porEtapa[k]);
  });
  const valorEmbudo = etapas.reduce((s, e) => s + e.valor, 0);
  etapas.forEach(e => { e.valor = dir_r2_(e.valor); e.parte = dir_pct_(e.valor, valorEmbudo); });

  /* enviadas contra firmadas, mes a mes. Una propuesta cuenta en el mes
     en que SE ENVIÓ y un contrato en el que se firmó: no son la misma
     propuesta en las dos barras y no tienen por qué cuadrar. Esa
     distancia es justo lo que se está mirando. */
  const meses = [];
  for (let i = 5; i >= 0; i--) meses.push(dir_mesMenos_(hoy.slice(0, 7), i));
  const porMes = {};
  meses.forEach(m => { porMes[m] = { mes:m, enviadas:0, firmadas:0, valor:0 }; });
  pros.forEach(p => {
    const fe = String(fechaISO_(p['fecha propuesta'])).slice(0, 7);
    if (porMes[fe]) { porMes[fe].enviadas++; porMes[fe].valor += Number(p['valor cotizado']) || 0; }
    const fc = String(fechaISO_(p['fecha contrato'])).slice(0, 7);
    if (porMes[fc]) porMes[fc].firmadas++;
  });
  const filasMes = meses.map(m => porMes[m]);

  const anio = hoy.slice(0, 4);
  const enviadas = pros.filter(p =>
    String(fechaISO_(p['fecha propuesta'])).slice(0, 4) === anio);
  const firmadas = pros.filter(p =>
    String(fechaISO_(p['fecha contrato'])).slice(0, 4) === anio);
  const tasa = enviadas.length
    ? Math.round(firmadas.length / enviadas.length * 1000) / 10 : 0;
  const calladas = enviadas.filter(p =>
    ['Propuesta enviada','Formulario enviado'].indexOf(String(p.estado || '').trim()) >= 0).length;

  /* las que ya pasaron su validez: insistir sobre una propuesta vencida
     obliga a volver a cotizar, así que conviene saberlo ANTES de llamar */
  const sinRespuesta = esperando.map(p => {
    const f = fechaISO_(p['fecha propuesta']);
    const validez = Number(p['validez propuesta']) || 30;
    const dias = dir_dias_(f, hoy);
    return { empresa:String(p.empresa || ''), estado:String(p.estado || ''),
             asesor:String(p.asesor || '—'), fecha:f, dias:dias, validez:validez,
             vencida: dias > validez, valor: dir_r2_(Number(p['valor cotizado']) || 0) };
  }).sort((a, b) => b.dias - a.dias);
  const vencidas = sinRespuesta.filter(v => v.vencida);

  /* clientes sin fecha de vencimiento: sin ella no se puede saber si el
     contrato sigue vigente, y se le sigue prestando servicio sin papel */
  const sinFecha = dir_hoja_(HOJA_CLI).filter(c => !clienteFuera_(c))
    .filter(c => !fechaISO_(c.vencimiento))
    .map(c => ({ nombre:String(c.nombre || ''), estado:String(c.estado || '') }));

  return { ok:true, zona:'mercadeo', nombre:'Mercadeo', hoy:hoy, desde:d1, hasta:d2,
    dice:'<b>Los prospectos y los contratos son de siempre</b>' +
         '<span> · lo cerrado es del periodo</span>',
    cartera: dir_cartera_(hoy, ventana),
    kpis: [
      { e:'Prospectos vivos', v: String(vivos.length), s:'sin cerrar ni descartar' },
      { e:'Valor en juego', v: dir_miles_(z.valor), u:'B/.',
        s: esperando.length + ' propuesta(s) sin respuesta' },
      { e:'Cerrados', v: String(z._cerrados), s:'con fecha de contrato', de:'periodo' },
      { e:'Tasa de cierre', v: String(tasa), u:'%',
        s:'de ' + enviadas.length + ' propuestas de ' + anio },
      { e:'Valor del embudo', v: dir_miles_(valorEmbudo), u:'B/.',
        s:'todo lo vivo, en cualquier etapa' },
      { e:'Propuestas vencidas', v: String(vencidas.length),
        s:'hay que volver a cotizarlas', malo: vencidas.length > 0 },
      { e:'Contratos por vencer', v: String(z._porVencer.length),
        s: sinFecha.length
          ? 'no puede dar otro número: ' + sinFecha.length + ' fichas sin vencimiento'
          : 'en menos de 30 días',
        malo: z._porVencer.length > 0 || sinFecha.length > 0 },
      { e:'Sin fecha de contrato', v: String(sinFecha.length),
        s:'no se sabe si siguen vigentes', malo: sinFecha.length > 0 }
    ],
    graficas: [
      { titulo:'Valor parado en cada etapa', lee:'de los ' + vivos.length + ' prospectos vivos',
        unidad:'B/.', horizontal:true,
        barras: etapas.map(e => ({ x:e.etapa, v:e.valor })) },
      { titulo:'Propuestas enviadas contra contratos firmados', lee:'últimos seis meses',
        unidad:'', horizontal:false, dos:true, series:['Enviadas','Firmadas'],
        barras: filasMes.map(m => ({ x: dir_mes_(m.mes).split(' ')[0].slice(0, 3),
                                     v: m.enviadas, v2: m.firmadas,
                                     parcial: m.mes === hoy.slice(0, 7) })) }
    ],
    preguntas: [
      { clave:'sin_respuesta', q:'¿Cuánto valor hay parado sin respuesta?',
        cuenta: esperando.length + ' propuesta(s)',
        titulo:'B/. ' + dir_miles_(z.valor) + ' en ' + esperando.length + ' propuesta(s)',
        tabla: { cab:['Empresa','Asesor','Enviada','Días','Valor','Estado'],
                 num:[3,4], alerta:5,
                 filas: sinRespuesta.map(v => [v.empresa, v.asesor, fechaPanama_(v.fecha),
                   v.dias, 'B/. ' + dir_miles_(v.valor),
                   v.vencida ? 'validez vencida' : 'vigente']),
                 total:['Total', '', '', '', 'B/. ' + dir_miles_(z.valor), ''] },
        nota: vencidas.length
          ? vencidas.length + ' ya pasaron su validez: antes de insistir hay que volver a ' +
            'cotizarlas.'
          : 'Todas siguen dentro de su validez.' },
      { clave:'por_vencer', q:'¿Qué contratos vencen en 30 días?',
        cuenta: z._porVencer.length + ' contrato(s)',
        titulo: z._porVencer.length
          ? z._porVencer.length + ' contrato(s)' +
            (z._porVencer[0].dias < 0 ? ', y uno ya venció' : '')
          : (sinFecha.length
              ? 'No puede decirlo: ' + sinFecha.length + ' fichas no tienen vencimiento'
              : 'Ninguno vence en los próximos 30 días'),
        tabla: { cab:['Cliente','Vence','Faltan'], alerta:2,
                 filas: z._porVencer.map(c => [c.nombre, fechaPanama_(c.vence),
                   c.dias < 0 ? 'venció hace ' + Math.abs(c.dias) + ' días'
                              : (c.dias === 0 ? 'hoy' : 'en ' + c.dias + ' días')]) },
        nota: 'Renovar antes cuesta una llamada; renovar después cuesta una negociación. ' +
              'Y a un contrato vencido se le sigue prestando servicio sin papel vigente.' },
      { clave:'etapas', q:'¿Cómo está repartido el embudo?',
        cuenta: etapas.length + ' etapas',
        titulo: etapas.length
          ? etapas[0].etapa + ' concentra el ' + etapas[0].parte + ' %'
          : 'No hay prospectos vivos',
        tabla: { cab:['Etapa','Prospectos','Valor','Parte'], num:[1,2,3],
                 filas: etapas.map(e => [e.etapa, e.cuantos,
                                         'B/. ' + dir_miles_(e.valor), e.parte + ' %']),
                 total:['Total vivo', vivos.length,
                        'B/. ' + dir_miles_(valorEmbudo), '100.0 %'] },
        nota:'El valor es el COTIZADO, no el firmado: es lo que se está negociando, no lo ' +
             'que ya entró.' },
      { clave:'mes_a_mes', q:'¿Cómo va mes a mes?',
        cuenta: filasMes.length + ' meses',
        titulo:'Enviadas contra firmadas, los últimos seis meses',
        tabla: { cab:['Mes','Enviadas','Firmadas','Valor enviado'], num:[1,2,3],
                 filas: filasMes.map(m => [dir_mes_(m.mes), m.enviadas, m.firmadas,
                                           'B/. ' + dir_miles_(m.valor)]) },
        nota:'Una propuesta cuenta en el mes en que se ENVIÓ y un contrato en el que se ' +
             'firmó. No son la misma propuesta en las dos columnas y no tienen por qué ' +
             'cuadrar: esa distancia es justo lo que se está mirando.' },
      { clave:'tasa_cierre', q:'¿De cada diez propuestas, cuántas se firman?',
        cuenta: enviadas.length + ' enviadas',
        titulo: enviadas.length
          ? Math.round(firmadas.length / enviadas.length * 10) + ' de cada 10, en ' + anio
          : 'Todavía no hay propuestas de ' + anio,
        texto: enviadas.length
          ? enviadas.length + ' propuestas enviadas en ' + anio + ', ' + firmadas.length +
            ' con contrato firmado. De las que no cerraron, ' + calladas +
            ' siguen sin respuesta.'
          : 'Sin propuestas enviadas este año no hay tasa que calcular.',
        nota:'Una propuesta que no cierra por silencio no se perdió contra un competidor: ' +
             'se perdió por falta de seguimiento.' },
      { clave:'sin_fecha', q:'¿Qué clientes no tienen fecha de vencimiento?',
        cuenta: sinFecha.length + ' cliente(s)',
        titulo: sinFecha.length
          ? sinFecha.length + ' fichas sin vencimiento registrado'
          : 'Todas las fichas tienen su vencimiento',
        tabla: { cab:['Cliente','Estado'], filas: sinFecha.map(c => [c.nombre, c.estado]) },
        nota:'Sin esa fecha no se puede saber si su contrato sigue vigente, y mientras tanto ' +
             '«contratos por vencer» solo puede decir cero. Mercadeo la completa desde la ' +
             'ficha del cliente.' }
    ] };
}

/* ── Planta en detalle ────────────────────────────────────────────────
   Todo el módulo en un viaje. Esto es lo que sustenta el cumplimiento
   ambiental: cada ciclo tiene que poder enseñarse con su temperatura,
   sus minutos y su indicador químico, y cada salida con su recibo de la
   báscula de destino.

   Antes la merma por mes y el próximo mantenimiento de cada equipo se
   calculaban DOS VECES —una para la pestaña y otra para la página— y
   nada garantizaba que dijeran lo mismo. */
function dir_detPlanta_(d1, d2, hoy) {
  const z = dir_planta_(d1, d2, hoy);
  const receta = RECETA_AUTOCLAVE;

  /* ── los ciclos del periodo, contra la receta ── */
  const ciclos = dir_hoja_(HOJA_CIC).map(c => {
    const f = fechaISO_(c.fecha);
    if (!f || f < d1 || f > d2) return null;
    const temp = Number(c.temperatura) || 0;
    const min  = Number(c.minutos) || 0;
    /* la columna conserva el nombre viejo; lo que guarda es la cinta */
    if (String(c.anulado || '').trim().toUpperCase() === 'SI') return null;
    if (String(c.esPrueba || '').trim().toUpperCase() === 'SI') return null;
    const prueba = String(c.pruebaBiologica || '').trim().toUpperCase() === 'SI';
    const res = String(c.resultadoPrueba || '').trim();
    return { fecha:f, numero:String(c.numero || ''),
             kgEntrada: dir_r2_(c.kgEntrada),
             temperatura: temp, minutos: min, operador: String(c.operador || '—'),
             prueba: prueba, resultado: res,
             /* un ciclo conforme es el que llegó a temperatura Y aguantó
                los minutos. Uno solo de los dos no esteriliza. */
             conforme: temp >= receta.temperatura && min >= receta.minutos,
             pruebaFallida: prueba && res && res.toUpperCase().indexOf('NO CONFORME') >= 0 };
  }).filter(Boolean).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

  const noConformes = ciclos.filter(c => !c.conforme);
  const pruebas = ciclos.filter(c => c.prueba);
  const fallidas = ciclos.filter(c => c.pruebaFallida);
  let kgTratado = 0;
  ciclos.forEach(c => { kgTratado += c.kgEntrada; });

  /* ── las salidas del periodo ── */
  const salidas = dir_hoja_(HOJA_SAL).map(s => {
    const f = fechaISO_(s.fecha);
    if (!f || f < d1 || f > d2) return null;
    const kp = dir_r2_(s.kgPlanta), ke = dir_r2_(s.kgEmas);
    return { fecha:f, kgPlanta:kp, kgEmas:ke,
             recibo: String(s.reciboEmas || '').trim(),
             vehiculo:String(s.vehiculo || '—'), conductor:String(s.conductor || '—'),
             merma: kp > 0.0001 ? Math.round((kp - ke) / kp * 1000) / 10 : 0 };
  }).filter(Boolean).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

  const sinRecibo = salidas.filter(s => !s.recibo);
  let kgAlRelleno = 0;
  salidas.forEach(s => { kgAlRelleno += s.kgEmas; });

  /* ── el mantenimiento, solo el próximo de cada equipo ── */
  const prox = {};
  dir_hoja_(HOJA_MTO).forEach(m => {
    const p = fechaISO_(m.proximo); if (!p) return;
    const k = String(m.equipo || '') + '|' + String(m.tipo || '');
    if (!prox[k] || p < prox[k].proximo)
      prox[k] = { equipo:String(m.equipo || ''), tipo:String(m.tipo || ''), proximo:p,
                  empresa:String(m.empresa || '—') };
  });
  const mantos = Object.keys(prox).map(k => {
    const m = prox[k];
    m.dias = dir_dias_(hoy, m.proximo);
    m.estado = m.dias < 0 ? 'VENCIDO' : (m.dias <= 15 ? 'POR VENCER' : 'al día');
    return m;
  }).sort((a, b) => a.dias - b.dias);
  const mtoVencidos = mantos.filter(m => m.estado === 'VENCIDO');

  /* ── quién genera más residuo ── esto solo lo tenía la pestaña, y el
     reporte nunca lo trajo. Al fundirlos no se pierde. */
  const porGenerador = {};
  dir_recolecciones_(d1, d2).forEach(r => {
    const g = String(r.Cliente || '—').trim();
    if (!porGenerador[g]) porGenerador[g] = { generador:g, kg:0, visitas:0 };
    porGenerador[g].kg += Number(r['total Kg'] || 0);
    porGenerador[g].visitas++;
  });
  const generadores = Object.keys(porGenerador).map(k => porGenerador[k])
    .sort((a, b) => b.kg - a.kg).slice(0, 10)
    .map(g => ({ generador:g.generador, visitas:g.visitas, kg:dir_r2_(g.kg),
                 parte: dir_pct_(g.kg, z._recibido) }));

  const ahora = z._meses.length ? z._meses[z._meses.length - 1] : null;
  const antes = z._meses.length > 1 ? z._meses[0] : null;

  return { ok:true, zona:'planta', nombre:'Planta', hoy:hoy, desde:d1, hasta:d2,
    dice:'<b>Lo recibido, tratado y salido es del periodo</b>' +
         '<span> · lo que espera acta y el mantenimiento son de siempre</span>',
    kpis: [
      { e:'Recibido', v: dir_miles_(z._recibido, 0), u:'kg',
        s: 'de las recolecciones del rango' },
      { e:'Tratado en autoclave', v: dir_miles_(kgTratado, 0), u:'kg',
        s: ciclos.length + ' ciclo(s) corridos' },
      { e:'Enviado al relleno', v: dir_miles_(kgAlRelleno, 0), u:'kg',
        s: salidas.length + ' viaje(s)' },
      { e:'Merma del último mes', v: String(ahora ? ahora.merma : 0), u:'%',
        s: ahora ? 'sobre ' + dir_miles_(ahora.kgPlanta, 0) + ' kg salidos'
                 : 'sin salidas registradas' },
      { e:'Ciclos fuera de receta', v: String(noConformes.length),
        s:'de ' + ciclos.length + ' · receta ' + receta.temperatura + '° y ' +
          receta.minutos + ' min', malo: noConformes.length > 0 },
      { e:'Indicador químico', v: String(pruebas.length),
        s: fallidas.length ? fallidas.length + ' NO CONFORME' : 'todas conformes',
        malo: fallidas.length > 0 },
      { e:'Sin acta', v: dir_miles_(z._kgSinActa, 0), u:'kg',
        s: z._sinActa.length + ' recolección(es) · el lote más viejo lleva ' +
           z._diasViejo + ' días', de:'siempre', malo: z._sinActa.length > 0 },
      { e:'Mantenimientos vencidos', v: String(mtoVencidos.length),
        s: mtoVencidos.length ? mtoVencidos[0].equipo + ' · ' + mtoVencidos[0].tipo
                              : 'ninguno', de:'siempre', malo: mtoVencidos.length > 0 }
    ],
    graficas: [
      { titulo:'Merma por mes', lee:'kilos que pesó planta menos los que pesó el destino',
        unidad:'%', horizontal:false,
        barras: z._meses.map(m => ({ x: dir_mes_(m.mes).split(' ')[0].slice(0, 3),
                                     v: m.merma, parcial: m.mes === hoy.slice(0, 7) })) },
      { titulo:'Kilos que entraron contra kilos que salieron', lee:'últimos seis meses',
        unidad:'kg', horizontal:false, dos:true, series:['Pesó planta','Pesó el destino'],
        barras: z._meses.map(m => ({ x: dir_mes_(m.mes).split(' ')[0].slice(0, 3),
                                     v: m.kgPlanta, v2: m.kgEmas,
                                     parcial: m.mes === hoy.slice(0, 7) })) }
    ],
    preguntas: [
      { clave:'ciclos', q:'¿Los ciclos cumplieron la receta?',
        cuenta: ciclos.length + ' ciclo(s)',
        titulo: ciclos.length
          ? (noConformes.length
              ? noConformes.length + ' de ' + ciclos.length + ' quedaron fuera de receta'
              : 'Los ' + ciclos.length + ' cumplieron')
          : 'Sin ciclos registrados en el periodo',
        tabla: { cab:['Fecha','N°','Kg entrada','Temp.','Minutos','Ind. químico','Operador',
                      'Contra la receta'],
                 num:[2,3,4], alerta:7,
                 filas: ciclos.map(c => [fechaPanama_(c.fecha), c.numero,
                   dir_miles_(c.kgEntrada, 0), c.temperatura + '°', c.minutos,
                   c.prueba ? (c.resultado || 'sí') : '—',
                   c.operador, c.conforme ? 'conforme' : 'FUERA DE RECETA']) },
        nota:'La receta es ' + receta.temperatura + ' grados y ' + receta.minutos +
             ' minutos. Un ciclo es conforme si cumple LAS DOS: llegar a temperatura sin ' +
             'aguantar los minutos no esteriliza, y aguantar los minutos sin llegar a ' +
             'temperatura tampoco. Lo que se anota en cada ciclo es el INDICADOR ' +
             'QUÍMICO —la cinta—, que dice que hubo calor; la verificación biológica, ' +
             'que es la que prueba que murió el organismo, va una vez al mes.' },
      { clave:'salidas', q:'¿Cada salida tiene su recibo del destino?',
        cuenta: salidas.length + ' viaje(s)',
        titulo: sinRecibo.length
          ? sinRecibo.length + ' viaje(s) sin recibo'
          : (salidas.length ? 'Todos tienen su recibo' : 'Sin salidas en el periodo'),
        tabla: { cab:['Fecha','Pesó planta','Pesó destino','Merma','Recibo','Vehículo',
                      'Conductor'],
                 num:[1,2,3], alerta:4,
                 filas: salidas.map(s => [fechaPanama_(s.fecha), dir_miles_(s.kgPlanta, 0),
                   dir_miles_(s.kgEmas, 0), s.merma + ' %',
                   s.recibo || 'SIN RECIBO', s.vehiculo, s.conductor]),
                 total:['Total', dir_miles_(salidas.reduce((a, s) => a + s.kgPlanta, 0), 0),
                        dir_miles_(kgAlRelleno, 0), '', '', '', ''] },
        nota: sinRecibo.length
          ? sinRecibo.length + ' viaje(s) sin recibo del destino. Sin ese papel no hay cómo ' +
            'probar que el material llegó a donde dice el acta.'
          : 'Todos los viajes tienen su recibo del destino.' },
      { clave:'sin_acta', q:'¿Qué entró y no ha salido?',
        cuenta: z._sinActa.length + ' recolección(es)',
        titulo: z._sinActa.length
          ? dir_miles_(z._kgSinActa, 0) + ' kg en ' + z._sinActa.length +
            ' recolecciones sin acta'
          : 'Todo lo recibido tiene su acta',
        tabla: { cab:['Responsable','Recolecciones','Kg','El más viejo'], num:[1,2],
                 filas: z._porResponsable.map(r => [r.responsable, r.registros,
                   dir_miles_(r.kg, 0),
                   r.viejo ? fechaPanama_(r.viejo) + ' · ' + dir_dias_(r.viejo, hoy) + ' días'
                           : '—']),
                 total:['Total', z._sinActa.length, dir_miles_(z._kgSinActa, 0), ''] },
        nota:'Material recibido sin acta de disposición es responsabilidad de ECOVSA hasta ' +
             'que salga. El reloj corre desde que entra, no desde que se registra.' },
      { clave:'mantenimiento', q:'¿Hay mantenimientos vencidos?',
        cuenta: mantos.length + ' equipo(s)',
        titulo: mtoVencidos.length
          ? mtoVencidos.length + ' vencido(s): ' + mtoVencidos[0].equipo
          : (mantos.length ? 'Ninguno vencido' : 'Sin mantenimientos registrados'),
        tabla: { cab:['Equipo','Tipo','Próximo','Estado','Empresa'], alerta:3,
                 filas: mantos.map(m => [m.equipo, m.tipo, fechaPanama_(m.proximo),
                   m.estado === 'VENCIDO' ? 'VENCIDO hace ' + Math.abs(m.dias) + ' días'
                     : (m.estado === 'POR VENCER' ? 'en ' + m.dias + ' días' : 'al día'),
                   m.empresa]) },
        nota:'La caldera y el autoclave trabajan a presión: una prueba de hermeticidad ' +
             'vencida no es papeleo, es un riesgo. Solo se lista el PRÓXIMO mantenimiento ' +
             'de cada equipo — cinco registros viejos siguen siendo un equipo, no cinco ' +
             'alarmas.' },
      { clave:'merma', q:'¿La merma está creciendo?',
        cuenta: z._meses.length + ' meses',
        titulo: (ahora && antes)
          ? (ahora.merma > antes.merma
              ? 'Sí: de ' + antes.merma + ' % a ' + ahora.merma + ' %'
              : 'No: de ' + antes.merma + ' % a ' + ahora.merma + ' %')
          : 'Hace falta más de un mes con salidas para saberlo',
        tabla: { cab:['Mes','Salidas','Kg planta','Kg báscula','Merma'], num:[1,2,3,4],
                 filas: z._meses.map(m => [m.etiqueta, m.salidas, dir_miles_(m.kgPlanta, 0),
                                           dir_miles_(m.kgEmas, 0), m.merma + ' %']) },
        nota:'Antes de asumir pérdida vale revisar la calibración de la báscula: una ' +
             'desviación constante en la misma dirección se parece más a un instrumento ' +
             'descalibrado que a un faltante.' },
      { clave:'generadores', q:'¿Quién genera más residuo?',
        cuenta: generadores.length + ' generador(es)',
        titulo: generadores.length
          ? 'Los tres primeros son el ' +
            dir_r2_(generadores.slice(0, 3).reduce((s, g) => s + g.parte, 0)) + ' % del total'
          : 'Sin recolecciones en el periodo',
        tabla: { cab:['Generador','Visitas','Kg','Del total'], num:[1,2,3],
                 filas: generadores.map(g => [g.generador, g.visitas,
                                              dir_miles_(g.kg, 0), g.parte + ' %']) } }
    ] };
}

/* ── Cobros en detalle ────────────────────────────────────────────── */
function dir_detCobros_(hoy, d1, d2) {
  const z = dir_cobros_(hoy);
  const k = z._concentracion, e = z._envejecimiento, c = z._curva, d = z._dias;
  const libro = z._libro;

  const filas = k.arriba.map(x => [x.cliente, x.facturas, x.mora + ' días',
                                   'B/. ' + dir_miles_(x.saldo), x.parte + ' %']);
  if (k.resto.cuentas)
    filas.push(['Las demás cuentas (' + k.resto.cuentas + ')', k.resto.facturas, '—',
                'B/. ' + dir_miles_(k.resto.saldo), k.resto.parte + ' %']);

  const act = c.actual, ad = c.alMismoDia;

  /* ── lo que antes vivía en la página aparte ──────────────────────
     Se calcula aquí y en el mismo viaje. Mientras estuvo en RCartera,
     el reparto de la mora se armaba dos veces —en el servidor para la
     pestaña y en el navegador para el reporte— y eran dos versiones del
     mismo número esperando a separarse. */
  const venc = cob_vencidas_(libro, hoy);
  const tr = cob_tramos_(venc);
  const per = cob_delPeriodo_(libro, d1, d2);

  /* Todo lo que se cobra, no solo lo vencido: una cartera sana también
     tiene plata por vencer, y esconderla hace ver la deuda más chica. */
  let porCobrar = 0, abiertas = 0;
  libro.facturas.forEach(f => {
    const s = cob_saldoAl_(f.neto, f.pagos, hoy);
    if (s > 0.009) { porCobrar += s; abiertas++; }
  });
  porCobrar = Math.round(porCobrar * 100) / 100;

  return { ok:true, zona:'cobros', nombre:'Cobros', hoy:hoy, desde:d1, hasta:d2,
    /* La mora no depende del rango y lo facturado sí. Decirlo arriba
       evita la pregunta que siempre sale en la reunión. */
    dice:'<b>La mora es de siempre</b><span> · lo facturado y lo cobrado son ' +
         'del periodo</span>',
    kpis: [
      { e:'Vencido', v:'B/. ' + dir_miles_(k.vencido), s: k.facturas +
        ' factura(s) de ' + k.cuentas + ' cuenta(s)', malo: k.vencido > 0.009 },
      { e:'Más de 90 días', v:'B/. ' + dir_miles_(e.monto),
        s: e.parte + ' % de todo lo vencido', malo: e.parte >= 25 },
      { e:'Por cobrar', v:'B/. ' + dir_miles_(porCobrar),
        s: abiertas + ' factura(s) abiertas' },
      { e:'Días en cobrar', v: d.pagos ? String(d.dias) : '0', u:'días',
        s: d.pagos ? 'sobre ' + d.pagos + ' pagos de los últimos ' + d.ventana + ' días'
                   : 'sin pagos recientes' },
      { e:'Facturado', v:'B/. ' + dir_miles_(per.facturado),
        s: per.facturas + ' factura(s)', de:'periodo' },
      { e:'Cobrado', v:'B/. ' + dir_miles_(per.cobrado),
        s: per.pagos + ' pago(s) recibidos', de:'periodo' },
      { e:'De ' + (act.etiqueta || 'este mes'), v: String(act.pct), u:'%',
        s:'ya entró · B/. ' + dir_miles_(act.cobrado) },
      { e:'Cuentas con deuda', v: String(k.cuentas),
        s: k.mayor ? 'la mayor concentra el ' + k.mayor.parte + ' %'
                   : 'no hay nada vencido' }
    ],
    /* La banda roja. Hasta ahora la pantalla la sabía pintar pero el
       servidor no se la mandaba nunca: el dato se calculaba en la
       función de la portada, que ya no llama nadie. */
    duele: k.mayor && k.mayor.parte >= 40
      ? 'El ' + k.mayor.parte + ' % del vencido es una sola cuenta: ' + k.mayor.cliente +
        '. Con esta concentración no hay un problema de cobranza — hay un problema con ' +
        'un cliente.'
      : '',
    grafica: dir_gr_('De lo facturado cada mes, cuánto ya entró',
      'la fila que baja es la salud real', '%',
      c.filas.map(f => ({ x: f.etiqueta.split(' ')[0].slice(0, 3), v: f.pct,
                          parcial: f.mes === hoy.slice(0, 7) }))),
    preguntas: [
      { clave:'tramos', q:'¿Cómo está repartido el vencido?',
        cuenta: tr.tramos.length + ' tramos',
        titulo: e.parte >= 25
          ? 'El ' + e.parte + ' % lleva más de 90 días'
          : 'Lo viejo es el ' + e.parte + ' % del total',
        tabla: { cab:['Tramo','Facturas','Cuentas','Saldo','Parte'],
                 num:[1,2,3,4],
                 filas: tr.tramos.map(t => [t.etiqueta, t.facturas, t.cuentas,
                                            'B/. ' + dir_miles_(t.monto), t.parte + ' %']),
                 total:['Total vencido', k.facturas, k.cuentas,
                        'B/. ' + dir_miles_(tr.total), '100.0 %'] },
        nota:'El saldo es el vivo: lo facturado menos lo abonado. Una misma cuenta puede ' +
             'aparecer en dos tramos si tiene facturas de distintas edades — por eso las ' +
             'cuentas de los tramos no suman las del total.' },
      { clave:'vencidas', q:'¿Qué facturas están vencidas?',
        cuenta: venc.length + ' factura(s)',
        titulo: venc.length
          ? 'La más vieja lleva ' + venc[0].mora + ' días'
          : 'Ninguna: no hay nada vencido',
        tabla: { cab:['Factura','Cliente','Emitida','Venció','Días','Saldo'],
                 num:[4,5], alerta:4, alertaMin:90,
                 filas: venc.map(v => [v.factura, v.cliente, fechaPanama_(v.fecha),
                                       fechaPanama_(v.vencimiento), v.mora,
                                       'B/. ' + dir_miles_(v.saldo)]) },
        nota:'La más vieja primero: es la que hay que llamar hoy.' },
      { clave:'cuanto_entro', q:'¿De lo facturado este mes, cuánto ya entró?',
        cuenta: c.filas.length + ' meses',
        titulo: ad.comparable
          ? (act.pct >= ad.pct
              ? 'El ' + act.pct + ' %, arriba de ' + ad.etiqueta + ' al mismo día'
              : 'El ' + act.pct + ' %, abajo de ' + ad.etiqueta + ' al mismo día')
          : 'El ' + act.pct + ' % de lo facturado',
        tabla: { cab:['Mes','Facturado','Cobrado','Ya entró'],
                 filas: c.filas.map(f => [f.etiqueta, 'B/. ' + dir_miles_(f.facturado),
                                          'B/. ' + dir_miles_(f.cobrado), f.pct + ' %']) },
        nota: 'La fila que va bajando es la salud real de la cartera. Un mes que se queda ' +
              'atrás no se recupera solo.' },
      { clave:'concentra', q:'¿Quién concentra la mora?',
        cuenta: k.cuentas + ' cuenta(s)',
        titulo: k.mayor
          ? (k.arriba.length > 1
              ? 'Dos cuentas son el ' +
                dir_r2_(k.arriba[0].parte + k.arriba[1].parte) + ' %'
              : k.mayor.cliente + ' es el ' + k.mayor.parte + ' %')
          : 'No hay nada vencido',
        tabla: { cab:['Cuenta','Facturas','Mora','Saldo','Parte'], filas: filas,
                 num:[1,3,4], alerta:2,
                 total:['Total vencido', k.facturas, '—',
                        'B/. ' + dir_miles_(k.vencido), '100.0 %'] },
        nota: k.mayor && k.mayor.parte > 50
          ? 'No es una cartera enferma: es una cuenta atascada con el resto sano detrás. ' +
            'Resolver esa cuenta cambia el número entero.'
          : 'La deuda está repartida: no hay una sola cuenta que explique el total.' },
      { clave:'dias_cobrar', q:'¿Cuánto tardamos en cobrar?',
        cuenta: d.pagos + ' pago(s)',
        titulo: d.pagos
          ? d.dias + ' días de la factura al pago'
          : 'Sin pagos en los últimos ' + d.ventana + ' días',
        texto: d.comparable
          ? 'Promedio ponderado por monto sobre ' + d.pagos + ' pagos de los últimos ' +
            d.ventana + ' días. En los ' + d.ventana + ' anteriores eran ' + d.antes +
            ' días: ' + (d.dias > d.antes
              ? 'el dinero está tardando ' + (d.dias - d.antes) + ' días más en entrar.'
              : 'se está cobrando ' + (d.antes - d.dias) + ' días más rápido.')
          : 'Todavía no hay suficientes pagos para comparar contra el periodo anterior.',
        nota: 'Ponderado por monto y no simple: una factura de B/. 5,000 que tardó 90 días ' +
              'pesa en el flujo mucho más que una de B/. 50 que tardó 5.' }
    ] };
}

/* ═══ EL RESUMEN DEL CENTRO ═════════════════════════════════════════
   Las cuatro líneas que van dentro de la tarjeta de Dirección en el
   lobby. Es el mismo cálculo de la portada, pero sin comparaciones ni
   listas: solo el titular de cada zona.

   Va en una llamada aparte y no dentro de api_lobby a propósito. Dos
   razones, y las dos importan:

   1. El lobby tiene que abrir de una. Estas cuatro cuentas leen
      Recolecciones, Clientes, Prospectos, Facturas y Pagos completas.
      Metidas en api_lobby, TODO el mundo esperaría por ellas —incluido
      el operador que ni siquiera ve el centro.
   2. Si una de estas cuentas revienta, el lobby no se puede caer: es la
      única puerta de entrada al sistema. Aquí lo peor que pasa es que
      la tarjeta se quede sin resumen y todo lo demás siga abriendo.

   Y por eso mismo cada zona va en su propio try: una hoja que alguien
   renombró apaga una línea, no las cuatro. */
function api_lobby_resumen(pin) {
  dir_memoLimpio_();
  const u = usuarioPorPin_(pin);
  if (!u || !dir_puede_(u)) return { ok:false };

  const hoy = hoyPanama_();
  const d1 = hoy.slice(0, 8) + '01';          // del 1 del mes a hoy

  const lineas = [
    ['logistica', 'Logística',   () => dir_logistica_(d1, hoy)],
    ['mercadeo',  'Mercadeo',    () => dir_mercadeo_(d1, hoy, hoy)],
    ['planta',    'Tratamiento', () => dir_planta_(d1, hoy, hoy)],
    ['cobros',    'Cartera',     () => dir_cobros_(hoy)]
  ].map(par => {
    try {
      const z = par[2]();
      return { zona: par[0], nombre: par[1],
               texto: String(z.texto || '—'), sub: String(z.sub || '') };
    } catch (err) {
      return { zona: par[0], nombre: par[1],
               texto: '—', sub: 'no se pudo calcular' };
    }
  });

  return { ok:true, hoy:hoy, desde:d1, lineas:lineas };
}

/* ═══════════════════════════════════════════════════════════════════
   LOS REPORTES A PROFUNDIDAD DE MERCADEO Y TRATAMIENTO
   ───────────────────────────────────────────────────────────────────
   Van aquí y no en Codigo.gs por lo mismo que el resto de este archivo:
   son cálculos de dirección, solo leen, y tenerlos juntos es lo que
   permite cambiarlos sin abrir un archivo de 8,000 líneas.

   Las cuatro zonas siguen la misma forma, para que la pantalla sea una
   sola en las cuatro:
     kpis[]  ·  graficas[]  ·  preguntas[]  ·  cartera
   ═══════════════════════════════════════════════════════════════════ */

function dir_kpi_(e, v, u, s, malo) {
  return { e:e, v:v, u:u || '', s:s || '', malo: !!malo };
}

/* ── LA CARTERA ──────────────────────────────────────────────────────
   El embudo dice lo que viene entrando; la cartera dice lo que ya se
   tiene. Son dos preguntas distintas y hasta ahora dirección solo veía
   la primera: nadie sabía cuántos clientes hay.

   Cuenta igual que la pantalla de mercadeo —misma función, en Codigo.gs—
   para que las dos digan el mismo número. Facturación AGRUPADA: las
   fichas que comparten RUC son UN cliente con varios puntos. POR PUNTO:
   cada ficha es un cliente aunque compartan RUC.

   La ventana de la curva es aparte de la del reporte: arriba se elige el
   periodo del embudo —lo que se cerró este mes— y aquí la historia de la
   cartera, que solo tiene sentido en años. Son dos preguntas y por eso
   son dos controles. */
function dir_cliCartera_() {
  return dir_hoja_(HOJA_CLI).map(c => {
    const o = {};
    Object.keys(c).forEach(k => { o[k] = c[k]; });
    o.situacion = String(c.situacion || 'activo').toLowerCase().trim() || 'activo';
    o.deBaja = SITUACIONES_FUERA.indexOf(o.situacion) >= 0;
    return o;
  });
}

/* De qué a qué mes va la curva. Devuelve los dos meses y cómo hay que
   dejar pintado el control, para que la pantalla no vuelva a decidirlo. */
function dir_ventanaCurva_(ventana, hoy, primero) {
  const mes0 = hoy.slice(0, 7);
  const v = String(ventana || '12').trim();
  const libre = v.match(/^(\d{4}-\d{2})\.\.(\d{4}-\d{2})$/);
  if (libre) {
    let a = libre[1], b = libre[2];
    if (a > b) { const t = a; a = b; b = t; }
    if (b > mes0) b = mes0;
    return { desde:a, hasta:b, cual:'' };
  }
  if (v === 'todo')
    return { desde: primero || car_mesMenos_(mes0, 11), hasta: mes0, cual:'todo' };
  if (v === 'anio')
    return { desde: mes0.slice(0, 4) + '-01', hasta: mes0, cual:'anio' };
  const n = (v === '6') ? 6 : 12;
  return { desde: car_mesMenos_(mes0, n - 1), hasta: mes0, cual: String(n) };
}

function dir_cartera_(hoy, ventana) {
  const cli = dir_cliCartera_();
  const vivos = cli.filter(c => !c.deBaja);
  const res = car_resumen_(cli, hoy);
  const w = dir_ventanaCurva_(ventana, hoy, car_primerMes_(cli));
  const curva = car_curvaMeses_(cli, hoy, w.desde, w.hasta);

  /* Una baja sin fecha no se puede ubicar en el tiempo: la curva no sabe
     en qué mes bajar el escalón y la cifra de arriba queda sin respaldo. */
  const bajasSinFecha = cli.filter(c => c.deBaja &&
    !fechaISO_(c['fecha baja']) && !fechaISO_(c.fechaEstado)).length;

  const cerrados = curva.filter(p => !p.enCurso);
  const primero = cerrados.length ? cerrados[0] : (curva[0] || null);
  const ultimo  = cerrados.length ? cerrados[cerrados.length - 1] : primero;
  let cuenta = '';
  if (primero && ultimo && primero !== ultimo) {
    const dif = ultimo.puntos - primero.puntos;
    cuenta = 'De <b>' + primero.puntos + ' puntos en ' + dir_mes_(primero.mes) +
             '</b> a <b>' + ultimo.puntos + ' en ' + dir_mes_(ultimo.mes) + '</b>: ' +
             (dif > 0 ? dif + ' puntos más' :
              dif < 0 ? Math.abs(dif) + ' puntos menos' : 'la misma cartera') +
             ' en ' + cerrados.length + ' meses. ';
  }
  cuenta += 'Cuenta PUNTOS de atención, no clientes: un cliente que factura ' +
            'agrupado aparece tantas veces como puntos se le visitan.';

  return {
    ventana: w.cual, desde: w.desde, hasta: w.hasta,
    kpis: [
      dir_kpi_('Clientes', String(res.clientes), '',
               'en ' + res.puntos + ' punto(s) de atención'),
      dir_kpi_('Puntos activos', String(res.activos), '',
               res.suspendidos ? res.suspendidos + ' en mora o en pausa'
                               : 'ninguno en mora ni en pausa'),
      dir_kpi_('Nuevos en ' + res.anio, String(res.nuevosAnio), '',
               res.nuevos30 + ' en los últimos 30 días'),
      dir_kpi_('De baja', String(res.bajas), '',
               bajasSinFecha ? bajasSinFecha + ' sin fecha registrada'
                             : 'con motivo y fecha',
               bajasSinFecha > 0)
    ],
    curva: {
      titulo:'Cómo ha crecido la cartera',
      lee:'puntos acumulados a fin de mes',
      puntos: curva, nota: cuenta
    },
    reparto: {
      titulo:'Dónde están y cada cuánto se visitan',
      lee: res.puntos + ' punto(s)',
      region: res.region, frecuencia: res.frecuencia
    },
    agrupados: res.agrupados, puntosAgrupados: res.puntosAgrupados,
    total: vivos.length
  };
}