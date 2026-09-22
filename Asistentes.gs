/* ═══════════════════════════════════════════════════════════════════
   ASISTENTES · el piso y el primer asistente
   ═══════════════════════════════════════════════════════════════════

   Este archivo existe para que Codigo.gs deje de crecer. Todos los .gs
   de un proyecto de Apps Script comparten UN SOLO ámbito global: una
   función de aquí llama a una de Codigo.gs directamente, sin importar
   nada. Partir el código es gratis y es orden, no arquitectura.

   TRES REGLAS al agregar archivos nuevos:

   1. NO repetir nombres entre archivos. Dos funciones con el mismo
      nombre en dos .gs distintos se pisan EN SILENCIO — la que carga
      después gana. Ya se perdió medio día por eso dentro de un solo
      archivo; entre archivos es más fácil todavía no verlo. Por eso
      cada asistente lleva su prefijo: cob_, aud_, mkt_, rut_, ia_.

   2. Nada de leer una constante de otro archivo AL CARGAR. Apps Script
      no garantiza el orden entre archivos. Dentro de una función, en
      tiempo de ejecución, no hay problema: para entonces ya cargó todo.

   3. Las pantallas no se enteran de dónde vive cada cosa.
      google.script.run.api_pendientes() la encuentra viva donde viva.

   QUÉ VA DÓNDE
   Codigo.gs   → marcar_ / marcaDe_ / api_marcador, y las 26 líneas que
                 estampan el marcador dentro de funciones que ya existían.
   Asistentes.gs (este) → las hojas del piso, la configuración, los diez
                 vigilantes, el vigía y la bandeja.
   Cobranza.gs, Rutas.gs, Auditor.gs, IA.gs → cada uno cuando se
                 construya, con su prefijo.
   ═══════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════
   EL PISO DE LOS ASISTENTES
   ───────────────────────────────────────────────────────────────────
   Tres hojas que no hacen nada por sí solas y sin las cuales ningún
   asistente puede existir:

   PENDIENTES  — dónde dejan lo que encuentran. Una fila por cosa que
                 alguien tiene que atender. Sin esto, un vigilante
                 encuentra algo, lo dice una vez, y no tiene forma de
                 recordar que ya lo dijo.
   MARCADORES  — una fila por módulo con la hora de su último cambio.
                 El navegador pregunta por esa celda; si no cambió, no
                 pide nada más. Un marcador POR MÓDULO: cobros no se
                 despierta porque un operador cerró una recolección.
   CONFIGURACIÓN — el interruptor general, uno por módulo, y la fecha
                 de arranque.

   La fecha de arranque no es un detalle: sin ella, el primer día los
   asistentes procesan años de historia y generan cientos de pendientes.
   El sistema se muere de ruido antes de que nadie lo use.
   ═══════════════════════════════════════════════════════════════════ */

const HOJA_PEND = 'Pendientes';
const COLS_PEND = ['pendienteId','fecha','asistente','modulo','prioridad','tipo',
                   'referencia','titulo','descripcion','contenido','enlace',
                   'estado','clave','atendidoPor','atendidoEn','notaCierre','recordarEn'];

const HOJA_MARCAS = 'Marcadores';
const COLS_MARCAS = ['modulo','ultimaModificacion'];

const HOJA_CONFIG = 'ConfiguracionAsistentes';
const COLS_CONFIG = ['clave','valor','explica'];

const HOJA_LOG = 'LogAsistentes';
const COLS_LOG = ['fecha','asistente','resultado','encontrados','anotados','detalle'];

/* Los módulos para efectos de asistentes y marcadores. Ojo: NO es la
   constante MODULOS del lobby, que es otra cosa —la lista de pantallas con
   sus roles—. Dos listas parecidas con el mismo nombre se pisan en silencio;
   ya perdimos medio día por eso. */
const MODULOS_ASIST = ['logistica','mercadeo','planta','cobros','solicitudes','gerencia'];
const PRIORIDADES = ['alta','media','baja'];

/* ── Los estados de un pendiente ─────────────────────────────────────
   Tres de ellos son finales y uno no, y esa diferencia es lo que separa
   una bandeja útil de una que se vacía sola:

   resuelto   — se hizo. No vuelve.
   descartado — no aplica, nunca aplicó. No vuelve.
   pospuesto  — todavía hay que hacerlo, pero no ahora. VUELVE el día que
                diga `recordarEn`, si el problema sigue vivo.

   Sin `pospuesto`, quitar una tarjeta incómoda silenciaba ese aviso para
   siempre: el vigía volvía a encontrar el problema cada mañana, veía que
   ya había una fila con esa clave y se callaba. La salida fácil costaba
   justo lo que uno más necesita que le recuerden. */
const ESTADOS_PEND = ['nuevo','abierto','enviado','pospuesto','resuelto','descartado'];
const ESTADOS_CERRADOS = ['resuelto','descartado'];

/* ── Configuración ───────────────────────────────────────────────────
   El interruptor general y uno por módulo. Cualquiera con acceso a la
   hoja los apaga sin entrar al código, que es justamente el punto. */
const CONFIG_BASE = [
  ['asistentes_activos', 'NO',
   'Interruptor general. En NO, ningún asistente hace nada, sin importar los de abajo.'],
  ['fecha_arranque', '',
   'Los asistentes ignoran todo lo anterior a esta fecha (aaaa-mm-dd). Vacío = desde hoy.'],
  /* Un interruptor que no apaga nada es peor que no tener interruptor:
     quien lo ve en SI cree que hay una IA redactando y no la hay. Todavía
     no existe ni un solo llamado a un modelo en todo el sistema, así que
     la explicación lo dice con esas palabras hasta que exista. */
  ['ia_activa', 'NO',
   'RESERVADO · todavía no hace nada. Ningún texto se redacta con IA por ahora: ' +
   'todo sale de plantillas. Esta fila queda lista para cuando se conecte.']
];

function configBase_() {
  const filas = CONFIG_BASE.slice();
  MODULOS_ASIST.forEach(m => {
    filas.push(['asistente_' + m, 'NO',
      'Asistente del módulo ' + m + '. En SI, el vigía revisa este módulo cada mañana.']);
    filas.push(['ia_' + m, 'NO',
      'RESERVADO · todavía no hace nada en ' + m + '. Ponerlo en SI no cambia ningún texto.']);
  });
  return filas;
}

/* Deja la explicación de los interruptores al día aunque las filas ya
   existan. Sin esto, quien ya tiene la hoja creada se queda con el texto
   viejo —el que hacía creer que la IA estaba trabajando— para siempre. */
function corregirExplicaciones_() {
  const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_CONFIG);
  if (!h) return 0;
  const vals = h.getDataRange().getValues();
  const cab = vals[0].map(String);
  const cCla = cab.indexOf('clave'), cExp = cab.indexOf('explica');
  if (cCla < 0 || cExp < 0) return 0;
  const nuevo = {};
  configBase_().forEach(f => { nuevo[f[0]] = f[2]; });
  let n = 0;
  for (let i = 1; i < vals.length; i++) {
    const k = String(vals[i][cCla]).trim();
    if (nuevo[k] && String(vals[i][cExp]) !== nuevo[k]) {
      h.getRange(i + 1, cExp + 1).setValue(nuevo[k]); n++;
    }
  }
  return n;
}

function crearHojasAsistentes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  [[HOJA_PEND, COLS_PEND], [HOJA_MARCAS, COLS_MARCAS],
   [HOJA_CONFIG, COLS_CONFIG], [HOJA_LOG, COLS_LOG]].forEach(p => {
    const h = ss.getSheetByName(p[0]);
    if (!h) crearHoja_(ss, p[0], p[1]); else asegurarColumnas_(h, p[1]);
  });
  /* la configuración se siembra solo con lo que falte: no se pisa lo que
     alguien ya haya cambiado a mano */
  const h = hojaFin_(HOJA_CONFIG, COLS_CONFIG);
  const hay = leerHoja_(HOJA_CONFIG).map(r => String(r.clave || '').trim());
  let n = 0;
  configBase_().forEach(f => { if (hay.indexOf(f[0]) < 0) { h.appendRow(f); n++; } });
  const corregidas = corregirExplicaciones_();
  MODULOS_ASIST.forEach(m => { if (!marcaDe_(m)) marcar_(m); });
  SpreadsheetApp.getUi().alert(
    'Hojas de asistentes al día. Se agregaron ' + n + ' opción(es) de configuración' +
    (corregidas ? ' y se corrigieron ' + corregidas + ' explicación(es)' : '') + '.\n\n' +
    'Todo nace APAGADO: pon asistentes_activos en SI cuando quieras que empiecen, ' +
    'y una fecha de arranque para que no procesen años de historia.\n\n' +
    'Las filas ia_* están RESERVADAS: no hay ninguna IA conectada todavía, ' +
    'ponerlas en SI no cambia ningún texto.');
}

function config_(clave, porOmision) {
  const f = leerHoja_(HOJA_CONFIG)
    .filter(r => String(r.clave || '').trim() === String(clave))[0];
  if (!f) return porOmision === undefined ? '' : porOmision;
  const v = String(f.valor == null ? '' : f.valor).trim();
  return v === '' && porOmision !== undefined ? porOmision : v;
}
function configSi_(clave) { return String(config_(clave, 'NO')).toUpperCase() === 'SI'; }

/* Un asistente corre solo si el interruptor general Y el de su módulo
   están en SI. Dos llaves, no una: apagar todo tiene que ser un solo
   gesto, y apagar uno no debe obligar a tocar los demás. */
function asistenteActivo_(modulo) {
  return configSi_('asistentes_activos') && configSi_('asistente_' + String(modulo || ''));
}
/* Nada anterior a la fecha de arranque existe para los asistentes.

   Ojo con el alcance: los diez vigilantes de hoy miran ESTADO, no
   historia — «este contrato está vencido», «a esta ficha le falta el
   DV». Una fecha no los filtra: lo que está vencido lo está hoy, sin
   importar desde cuándo. La fecha de arranque va a pesar de verdad
   cuando llegue el asistente que lee correos y facturas de meses
   anteriores.

   Contra el otro riesgo —que el primer día aparezcan cientos de
   pendientes— lo que protege es el tope por corrida, más abajo. */
function desdeArranque_() {
  const f = config_('fecha_arranque', '');
  return /^\d{4}-\d{2}-\d{2}$/.test(f) ? f : hoyPanama_();
}

/* Cuántos pendientes puede crear UN vigilante en UNA corrida. Es la
   protección de verdad contra el día uno: si hay ochenta fichas
   incompletas, la bandeja con ochenta tarjetas no se lee, se cierra.
   Se avisan las primeras y el resto queda para la corrida siguiente,
   a medida que se van atendiendo. */
const TOPE_POR_VIGILANTE = 15;

/* ── Pendientes ──────────────────────────────────────────────────────
   anotarPendiente_ es idempotente por `clave`: llamarla dos veces con la
   misma clave no crea dos filas. Sin eso, un asistente que corre cada
   mañana llena la hoja con el mismo aviso repetido hasta que nadie la
   mira. Tampoco revive uno que alguien ya resolvió o descartó. */
/* El id de un pendiente NO puede ser solo la hora.
   ─────────────────────────────────────────────────────────────────────
   El vigía crea varios pendientes en un mismo ciclo, uno detrás de otro.
   `new Date().getTime()` tiene resolución de milisegundo: en una corrida
   apretada salen todos con el mismo número, y entonces cerrar un aviso
   cierra otro — el usuario descarta una tarjeta y desaparece una
   distinta. Lo encontró la prueba, no producción, y por poco.

   Por eso el id lleva la hora MÁS un contador que avanza dentro de la
   misma ejecución. La hora separa una corrida de otra; el contador separa
   las filas de una misma corrida. Sin azar: no hace falta y sería peor
   de leer. */
var _SEQ_PEND = 0;
function siguientePendiente_() {
  _SEQ_PEND++;
  return 'P-' + new Date().getTime().toString(36).toUpperCase() +
         '-' + ('00' + _SEQ_PEND).slice(-3);
}

function anotarPendiente_(d) {
  const clave = String(d.clave || '').trim();
  if (!clave) return { ok:false, error:'Un pendiente sin clave se duplicaría cada corrida.' };

  const ya = leerHoja_(HOJA_PEND)
    .filter(p => String(p.clave || '').trim() === clave)[0];
  if (ya) return { ok:true, repetido:true, pendienteId:String(ya.pendienteId || '') };

  /* Un módulo o una prioridad mal escritos no se rechazan: se corrigen a un
     valor válido. Perder un aviso por una letra sería peor que mostrarlo
     con prioridad media. */
  const mod = String(d.modulo || '').trim().toLowerCase();
  const pri = String(d.prioridad || '').trim().toLowerCase();

  const h = hojaFin_(HOJA_PEND, COLS_PEND);
  const id = siguientePendiente_();
  const fila = {
    pendienteId:id, fecha:hoyPanama_(), asistente:String(d.asistente || ''),
    modulo: MODULOS_ASIST.indexOf(mod) >= 0 ? mod : 'gerencia',
    prioridad: PRIORIDADES.indexOf(pri) >= 0 ? pri : 'media',
    tipo:String(d.tipo || ''), referencia:String(d.referencia || ''),
    titulo:String(d.titulo || ''), descripcion:String(d.descripcion || ''),
    contenido:String(d.contenido || ''), enlace:String(d.enlace || ''),
    estado:'nuevo', clave:clave, atendidoPor:'', atendidoEn:'', notaCierre:'',
    recordarEn:''
  };
  h.appendRow(COLS_PEND.map(c => fila[c] !== undefined ? fila[c] : ''));
  marcar_(fila.modulo);
  return { ok:true, creado:true, pendienteId:id };
}

/* ── El registro de corridas ─────────────────────────────────────────
   Un asistente que corre sin dejar rastro es un asistente en el que no
   se puede confiar: el día que no avise algo, nadie sabrá si falló o si
   no había nada que avisar. */
function registrarCorrida_(asistente, resultado, encontrados, anotados, detalle) {
  try {
    const h = hojaFin_(HOJA_LOG, COLS_LOG);
    h.appendRow([hoyPanama_() + ' ' +
      Utilities.formatDate(new Date(), 'America/Panama', 'HH:mm'),
      String(asistente || ''), String(resultado || ''),
      Number(encontrados) || 0, Number(anotados) || 0,
      String(detalle || '').slice(0, 500)]);
  } catch (e) { /* el log nunca tumba al asistente */ }
}

/* ═══════════════════════════════════════════════════════════════════
   AVISOS QUE CADA QUIEN SE ARMA
   ───────────────────────────────────────────────────────────────────
   La trampa de una pantalla así es dejar escribir un aviso con nombre y
   propósito y nada que lo dispare: se ve poderosa, no manda nunca nada,
   y alguien termina confiando en un correo que no existe.

   Por eso un aviso no se escribe, se ARMA con piezas que el sistema sabe
   evaluar de verdad. Cada vigilante de aquí abajo devuelve filas reales;
   si no se puede calcular, no está en la lista.

   Un aviso = qué vigilar + con qué umbral + a quién + cada cuánto.
   ═══════════════════════════════════════════════════════════════════ */

const HOJA_AVISOS = 'Avisos';
const COLS_AVISOS = ['avisoId','nombre','proposito','vigila','umbral','destinatarios',
                     'frecuencia','hora','dia','activo','creadoPor','creadoEn',
                     'ultimoEnvio','ultimoCuantos'];

const FRECUENCIAS_AVISO = [
  ['diario',   'Todos los días'],
  ['semanal',  'Una vez por semana'],
  ['mensual',  'Una vez al mes, el día 1']
];

/* ── Quién queda fuera del radar de los vigilantes ───────────────────
   Un cliente suspendido no debe generar pendientes: pedirle la fecha de
   inicio a alguien que ya no se atiende es hacerle perder el tiempo a
   quien abre la bandeja.

   El filtro miraba SOLO la columna `situacion` (mora, cierre, retiro,
   pausa). Y en el libro real once de los doce suspendidos tienen esa
   columna VACÍA: el estado dice SUSPENDIDO y la situación no dice nada.
   Resultado, la bandeja mandaba a trabajar clientes dados de baja —
   CLINIC MEDIC y CLINILAB aparecieron así en producción.

   Ahora se miran las dos columnas. `estado` ya trae la verdad y no hay
   que esperar a que nadie llene nada. */
const ESTADOS_FUERA = ['suspendido','cancelado','retirado','completado','baja'];

function clienteFuera_(c) {
  if (!c) return true;
  if (situacionFuera_(c.situacion)) return true;
  return ESTADOS_FUERA.indexOf(String(c.estado || '').trim().toLowerCase()) >= 0;
}

/* ── A dónde lleva cada aviso ────────────────────────────────────────
   Un enlace es un pedazo de consulta, no una dirección completa: la
   pantalla le pega adelante la URL de la app, que solo el navegador
   conoce. Si aquí se guardara la dirección entera, el día que la app se
   vuelva a publicar todos los pendientes viejos apuntarían a la anterior.

   Sin id no hay enlace. Devolver una cadena vacía es correcto: la tarjeta
   dice «Sin ficha ligada», que es la verdad, en vez de mandar a una
   pantalla que va a abrir en blanco. */
function enlaceCliente_(c) {
  const id = Number(c && c.id) || 0;
  return id ? '?p=alta&cli=' + id : '';
}
function enlaceProspecto_(p) {
  const cod = String((p && p.codigoPropuesta) || '').trim();
  return cod ? '?p=alta&cod=' + encodeURIComponent(cod) : '';
}

/* ── Los vigilantes ──────────────────────────────────────────────────
   clave, título, qué explica, la etiqueta del umbral (vacío = sin umbral),
   su valor por omisión, y la función que devuelve las filas que aplican.
   Cada fila: { titulo, detalle, dato } — y opcionalmente `enlace`, que es
   lo que convierte el aviso en trabajo: sin él la tarjeta dice qué pasa y
   deja al lector buscando dónde arreglarlo. */
const VIGILANTES = {

  contratos_por_vencer: {
    titulo: 'Contratos por vencer',
    explica: 'Clientes de la cartera cuyo contrato vence pronto. Sirve para renovar antes, no después.',
    umbral: 'Vencen en menos de', unidad: 'días', porOmision: 30,
    area: 'Mercadeo',
    buscar: function (n) {
      const hoy = hoyPanama_();
      return leerHoja_(HOJA_CLI).map(c => {
        const v = fechaISO_(c.vencimiento);
        if (!v) return null;
        if (clienteFuera_(c)) return null;
        const d = Math.round((new Date(v + 'T00:00:00') - new Date(hoy + 'T00:00:00')) / 86400000);
        if (d < 0 || d > n) return null;
        return { titulo: String(c.nombre || ''),
                 detalle: 'Vence el ' + fechaPanama_(v),
                 dato: d === 0 ? 'hoy' : 'en ' + d + ' día' + (d === 1 ? '' : 's'),
                 orden: d, clave: String(c.nombre || ''),
                 enlace: enlaceCliente_(c) };
      }).filter(Boolean).sort((a, b) => a.orden - b.orden);
    }
  },

  contratos_vencidos: {
    titulo: 'Contratos ya vencidos',
    explica: 'Clientes que siguen en servicio con el contrato vencido. Se está prestando servicio sin papel vigente.',
    umbral: 'Vencidos hace más de', unidad: 'días', porOmision: 0,
    area: 'Mercadeo',
    buscar: function (n) {
      const hoy = hoyPanama_();
      return leerHoja_(HOJA_CLI).map(c => {
        const v = fechaISO_(c.vencimiento);
        if (!v) return null;
        if (clienteFuera_(c)) return null;
        const d = Math.round((new Date(hoy + 'T00:00:00') - new Date(v + 'T00:00:00')) / 86400000);
        if (d <= n) return null;
        return { titulo: String(c.nombre || ''), detalle: 'Venció el ' + fechaPanama_(v),
                 dato: 'hace ' + d + ' días', orden: -d, clave: String(c.nombre || ''),
                 enlace: enlaceCliente_(c) };
      }).filter(Boolean).sort((a, b) => a.orden - b.orden);
    }
  },

  fichas_incompletas: {
    titulo: 'Fichas de cliente incompletas',
    explica: 'Clientes a los que les falta RUC, correo o fecha de inicio. Sin eso no se factura ni se certifica bien.',
    umbral: '', unidad: '', porOmision: 0,
    area: 'Mercadeo',
    buscar: function () {
      return leerHoja_(HOJA_CLI).map(c => {
        if (clienteFuera_(c)) return null;
        const f = [];
        if (!String(c.ruc || '').trim()) f.push('RUC');
        if (!String(c.correo || '').trim()) f.push('correo');
        if (!fechaISO_(c['inicio recoleccion'])) f.push('fecha de inicio');
        if (!f.length) return null;
        return { titulo: String(c.nombre || ''), detalle: 'Le falta ' + f.join(', '),
                 dato: f.length + ' dato' + (f.length === 1 ? '' : 's'),
                 enlace: enlaceCliente_(c) };
      }).filter(Boolean);
    }
  },

  clientes_sin_inicio: {
    titulo: 'Clientes sin fecha de inicio',
    explica: 'Su distintivo sale sin la fecha que el MINSA verifica en el establecimiento.',
    umbral: '', unidad: '', porOmision: 0,
    area: 'Mercadeo',
    buscar: function () {
      return leerHoja_(HOJA_CLI).map(c => {
        if (clienteFuera_(c)) return null;
        if (fechaISO_(c['inicio recoleccion'])) return null;
        if (!String(c.nombre || '').trim()) return null;
        return { titulo: String(c.nombre || ''),
                 detalle: 'Sin fecha de primera recolección', dato: '',
                 enlace: enlaceCliente_(c) };
      }).filter(Boolean);
    }
  },

  distintivos_pendientes: {
    titulo: 'Distintivos sin entregar',
    explica: 'Clientes activos que todavía no tienen su distintivo pegado en el local.',
    umbral: '', unidad: '', porOmision: 0,
    area: 'Mercadeo',
    buscar: function () {
      return leerHoja_(HOJA_CLI).map(c => {
        if (clienteFuera_(c)) return null;
        if (String(c.estado || '').trim().toUpperCase() === 'RETIRADO') return null;
        if (fechaISO_(c.distintivoEntregado)) return null;
        if (!String(c.nombre || '').trim()) return null;
        return { titulo: String(c.nombre || ''), detalle: 'Sin distintivo entregado', dato: '',
                 enlace: enlaceCliente_(c) };
      }).filter(Boolean);
    }
  },

  prospectos_quietos: {
    titulo: 'Prospectos sin movimiento',
    explica: 'Propuestas que llevan tiempo sin avanzar. Una propuesta olvidada es una venta perdida en silencio.',
    umbral: 'Sin moverse hace más de', unidad: 'días', porOmision: 15,
    area: 'Mercadeo',
    buscar: function (n) {
      const hoy = hoyPanama_();
      const cerrados = ['Rechazado', 'Pasado a cartera'];
      return leerHoja_(HOJA_PRO).map(p => {
        if (cerrados.indexOf(String(p.estado || '').trim()) >= 0) return null;
        const ref = fechaISO_(p['fecha propuesta']) || fechaISO_(p['fecha contacto']);
        if (!ref) return null;
        const d = Math.round((new Date(hoy + 'T00:00:00') - new Date(ref + 'T00:00:00')) / 86400000);
        if (d <= n) return null;
        return { titulo: String(p.empresa || ''),
                 detalle: String(p.estado || '') + ' · ' + String(p.asesor || 'sin asesor'),
                 dato: 'quieto hace ' + d + ' días', orden: -d,
                 enlace: enlaceProspecto_(p) };
      }).filter(Boolean).sort((a, b) => a.orden - b.orden);
    }
  },

  seguimiento_vencido: {
    titulo: 'Seguimientos vencidos',
    explica: 'Prospectos con fecha de próximo seguimiento ya pasada.',
    umbral: '', unidad: '', porOmision: 0,
    area: 'Mercadeo',
    buscar: function () {
      const hoy = hoyPanama_();
      const cerrados = ['Rechazado', 'Pasado a cartera'];
      return leerHoja_(HOJA_PRO).map(p => {
        if (cerrados.indexOf(String(p.estado || '').trim()) >= 0) return null;
        const s = fechaISO_(p['proximo seguimiento']);
        if (!s || s >= hoy) return null;
        return { titulo: String(p.empresa || ''),
                 detalle: 'Tocaba el ' + s + ' · ' + String(p.asesor || 'sin asesor'),
                 dato: '', orden: s, enlace: enlaceProspecto_(p) };
      }).filter(Boolean).sort((a, b) => String(a.orden).localeCompare(String(b.orden)));
    }
  },

  solicitudes_sin_aprobar: {
    titulo: 'Altas de cliente sin aprobar',
    explica: 'Clientes firmados esperando que logística los apruebe con su ubicación. Mientras tanto no entran a ninguna ruta.',
    umbral: 'Esperando hace más de', unidad: 'días', porOmision: 2,
    area: 'Logística',
    buscar: function (n) {
      const hoy = hoyPanama_();
      return leerHoja_(HOJA_SOL).map(s => {
        if (String(s.estado || '').trim().toUpperCase() !== 'PENDIENTE') return null;
        const f = fechaISO_(s.fechaSolicitud);
        if (!f) return null;
        const d = Math.round((new Date(hoy + 'T00:00:00') - new Date(f + 'T00:00:00')) / 86400000);
        if (d <= n) return null;
        return { titulo: String(s.empresa || ''),
                 detalle: 'Enviada el ' + f + ' por ' + String(s.registradoPor || ''),
                 dato: 'hace ' + d + ' días', orden: -d };
      }).filter(Boolean).sort((a, b) => a.orden - b.orden);
    }
  },

  pagos_sin_aprobar: {
    titulo: 'Solicitudes de pago sin aprobar',
    explica: 'Pagos pedidos que siguen esperando visto bueno.',
    umbral: 'Esperando hace más de', unidad: 'días', porOmision: 3,
    area: 'Gerencia',
    buscar: function (n) {
      const hoy = hoyPanama_();
      return leerHoja_(HOJA_SP).map(s => {
        if (String(s.estado || '').trim().toUpperCase() !== 'SOLICITADA') return null;
        const f = fechaISO_(s.fechaSolicitud) || fechaISO_(s.fecha);
        if (!f) return null;
        const d = Math.round((new Date(hoy + 'T00:00:00') - new Date(f + 'T00:00:00')) / 86400000);
        if (d <= n) return null;
        return { titulo: String(s.proveedor || s.solicitudId || ''),
                 detalle: 'Pedida el ' + f + ' por ' + String(s.solicitadoPor || ''),
                 dato: 'hace ' + d + ' días', orden: -d };
      }).filter(Boolean).sort((a, b) => a.orden - b.orden);
    }
  },

  /* ═══ Los cinco de cobros ═══════════════════════════════════════════
     Hasta hoy ninguno de los diez vigilantes miraba cobros. Por eso los
     cuarenta pendientes de producción eran todos de mercadeo: no era que
     cobros estuviera tranquilo, era que nadie lo estaba mirando.

     Los cinco se apoyan en cobrosVista_(), que arma una sola vez la foto
     de facturas, pagos y saldos. Sin eso cada vigilante releería las tres
     hojas y la corrida se iría en lecturas.

     Deliberadamente NO hay un vigilante de «cliente moroso» a secas: 60
     días en un cliente recurrente es alarma y en una entidad pública es
     el trámite normal. Ese corte lo hace el tipo de cartera. */

  /* UNA TARJETA POR CLIENTE, NO POR FACTURA.
     ─────────────────────────────────────────────────────────────────
     Antes salía una por factura. Un cliente con cuatro vencidas ocupaba
     cuatro tarjetas, el contador decía 37 cuando había doce clientes, y
     quien cobra le escribía cuatro veces el mismo día al mismo señor —
     porque el redactor sí agrupa por cliente y le arma UN mensaje con
     todas sus facturas. La bandeja y el redactor contaban cosas
     distintas.

     Se conserva el número de cada factura en el detalle: sin él la
     tarjeta obliga a ir a buscar cuáles son. */
  factura_vencida: {
    titulo: 'Clientes con facturas vencidas',
    explica: 'Pasó el vencimiento y siguen con saldo. Una tarjeta por cliente, con todas ' +
             'sus facturas juntas: es un solo mensaje, no uno por factura.',
    umbral: 'Vencidas hace más de', unidad: 'días', porOmision: 5,
    area: 'Cobros',
    buscar: function (n) {
      const porCliente = {};
      cobrosVista_().facturas
        .filter(f => f.saldo > 0.009 && f.mora > n)
        .forEach(f => {
          /* la misma llave que usa el resto de cobros: RUC si lo hay, si
             no el nombre. Así la tarjeta y el redactor hablan del mismo */
          const k = String(f.ruc || '').trim() || String(f.cliente || '');
          if (!porCliente[k]) porCliente[k] = {
            clave: k, cliente: f.cliente || f.razon || '(sin cliente)',
            facturas: [], saldo: 0, moraMax: 0, vieja: ''
          };
          const d = porCliente[k];
          d.facturas.push(f);
          d.saldo += f.saldo;
          if (f.mora > d.moraMax) { d.moraMax = f.mora; d.vieja = f.vencimiento; }
        });

      return Object.keys(porCliente).map(k => porCliente[k])
        .sort((a, b) => b.moraMax - a.moraMax)
        .map(d => {
          const cu = d.facturas.length;
          /* hasta tres se nombran; de ahí en adelante la lista no se lee */
          const nums = d.facturas.slice(0, 3).map(f => f.factura).join(', ') +
                       (cu > 3 ? ' y ' + (cu - 3) + ' más' : '');
          return {
            titulo: d.cliente,
            detalle: cu + ' factura' + (cu === 1 ? '' : 's') + ' por B/. ' +
                     (Math.round(d.saldo * 100) / 100).toFixed(2) +
                     ' · ' + nums +
                     ' · la más vieja venció el ' + fechaPanama_(d.vieja),
            dato: 'hace ' + d.moraMax + ' días',
            /* LA CLAVE ES EL CLIENTE, NO EL TEXTO.
               Si dependiera del detalle, cada abono cambiaría el monto,
               cambiaría la clave y abriría una tarjeta nueva encima de la
               vieja. La deuda de un cliente cambia todos los días; su
               identidad no. */
            clave: d.clave,
            enlace: '?p=cobros&cli=' + encodeURIComponent(d.cliente)
          };
        });
    }
  },

  promesa_incumplida: {
    titulo: 'Promesas de pago incumplidas',
    explica: 'El cliente dijo cuándo pagaba, pasó la fecha y no entró el pago. Es el aviso más accionable que hay: ya hubo conversación.',
    umbral: '', unidad: '', porOmision: 0,
    area: 'Cobros',
    buscar: function () {
      const hoy = hoyPanama_();
      const v = cobrosVista_();
      return leerHoja_(HOJA_GES).map(g => {
        if (String(g.seCompromete || '').trim().toUpperCase() !== 'SI') return null;
        const fp = fechaISO_(g.fechaPrometida);
        if (!fp || fp >= hoy) return null;
        const res = String(g.resultado || '').trim().toUpperCase();
        if (['CUMPLIO', 'CUMPLIÓ', 'ANULADO'].indexOf(res) >= 0) return null;
        /* si ya no debe nada, la promesa se cumplió aunque nadie lo anotara */
        const k = String(g.ruc || '').trim() || String(g.cliente || '').trim();
        if (!(v.saldoPorClave[k] > 0.009)) return null;
        const d = Math.round((new Date(hoy + 'T00:00:00') - new Date(fp + 'T00:00:00')) / 86400000);
        const m = Number(g.montoPrometido) || 0;
        return { titulo: String(g.cliente || k),
                 detalle: 'Prometió ' + (m ? 'B/. ' + m.toFixed(2) + ' ' : '') +
                          'para el ' + fechaPanama_(fp),
                 dato: 'hace ' + d + ' días', orden: -d,
                 /* la promesa concreta: cliente + fecha prometida. El monto
                    queda fuera a propósito, para que un abono parcial no
                    abra una tarjeta nueva sobre la misma promesa. */
                 clave: k + '|' + fp,
                 enlace: '?p=cobros&cli=' + encodeURIComponent(String(g.cliente || k)) };
      }).filter(Boolean).sort((a, b) => a.orden - b.orden);
    }
  },

  deuda_sin_gestion: {
    titulo: 'Deuda sin gestionar',
    explica: 'Clientes con factura vencida a los que nadie ha llamado ni escrito. Una deuda sin gestión no envejece sola: empeora.',
    umbral: 'Sin gestión hace más de', unidad: 'días', porOmision: 15,
    area: 'Cobros',
    buscar: function (n) {
      const hoy = hoyPanama_();
      const v = cobrosVista_();
      const ult = {};
      leerHoja_(HOJA_GES).forEach(g => {
        const k = String(g.ruc || '').trim() || String(g.cliente || '').trim();
        const f = fechaISO_(g.fecha);
        if (k && f && (!ult[k] || f > ult[k])) ult[k] = f;
      });
      return Object.keys(v.deudores).map(k => {
        const d = v.deudores[k];
        if (!(d.vencido > 0.009)) return null;
        const u = ult[k] || '';
        const dias = u
          ? Math.round((new Date(hoy + 'T00:00:00') - new Date(u + 'T00:00:00')) / 86400000)
          : 9999;
        if (dias <= n) return null;
        return { titulo: d.cliente,
                 detalle: 'B/. ' + d.vencido.toFixed(2) + ' vencido · ' +
                          (u ? 'última gestión el ' + u : 'nunca se ha gestionado'),
                 dato: u ? 'hace ' + dias + ' días' : 'sin gestión',
                 orden: -dias,
                 enlace: '?p=cobros&cli=' + encodeURIComponent(d.cliente) };
      }).filter(Boolean).sort((a, b) => a.orden - b.orden);
    }
  },

  deudor_sin_correo: {
    titulo: 'Deuda sin correo a dónde escribir',
    explica: 'Clientes que deben y cuya ficha no tiene correo. No es que no se les haya escrito: es que no se puede.',
    umbral: '', unidad: '', porOmision: 0,
    area: 'Cobros',
    buscar: function () {
      const v = cobrosVista_();
      const correo = {};
      leerHoja_(HOJA_CLI).forEach(c => {
        const e = String(c.correo || '').trim();
        const r = String(c.ruc || '').trim();
        const nm = String(c.nombre || '').trim().toUpperCase();
        if (r) correo['R' + r] = e;
        if (nm) correo['N' + nm] = e;
      });
      return Object.keys(v.deudores).map(k => {
        const d = v.deudores[k];
        if (!(d.saldo > 0.009)) return null;
        const e = correo['R' + String(d.ruc || '').trim()] ||
                  correo['N' + String(d.cliente || '').trim().toUpperCase()] || '';
        if (e) return null;
        return { titulo: d.cliente,
                 detalle: 'Debe B/. ' + d.saldo.toFixed(2) + ' y su ficha no tiene correo',
                 dato: 'sin correo', orden: -d.saldo,
                 enlace: '?p=cobros&cli=' + encodeURIComponent(d.cliente) };
      }).filter(Boolean).sort((a, b) => a.orden - b.orden);
    }
  },

  cuenta_quieta: {
    titulo: 'Cuentas de contrato sin movimiento',
    explica: 'Cuentas de acto público con saldo y sin gestión reciente. Ahí el problema no suele ser que no quieran pagar, es que falta un papel.',
    umbral: 'Quietas hace más de', unidad: 'días', porOmision: 30,
    area: 'Cobros',
    buscar: function (n) {
      const hoy = hoyPanama_();
      const v = cobrosVista_();
      const ult = {};
      leerHoja_(HOJA_GES).forEach(g => {
        const k = String(g.ruc || '').trim() || String(g.cliente || '').trim();
        const f = fechaISO_(g.fecha);
        if (k && f && (!ult[k] || f > ult[k])) ult[k] = f;
      });
      return Object.keys(v.deudores).map(k => {
        const d = v.deudores[k];
        if (d.tipo !== 'contrato') return null;      // este vigilante es solo de esa cartera
        if (!(d.saldo > 0.009)) return null;
        const u = ult[k] || '';
        const dias = u
          ? Math.round((new Date(hoy + 'T00:00:00') - new Date(u + 'T00:00:00')) / 86400000)
          : 9999;
        if (dias <= n) return null;
        return { titulo: d.cliente,
                 detalle: 'B/. ' + d.saldo.toFixed(2) + ' en cuenta de contrato · ' +
                          (u ? 'sin movimiento desde el ' + fechaPanama_(u)
                             : 'sin ninguna gestión registrada'),
                 dato: u ? 'hace ' + dias + ' días' : 'nunca',
                 orden: -dias,
                 enlace: '?p=cobros&cli=' + encodeURIComponent(d.cliente) };
      }).filter(Boolean).sort((a, b) => a.orden - b.orden);
    }
  },

  mantenimiento_vencido: {
    titulo: 'Mantenimientos vencidos',
    explica: 'Equipos que ya pasaron su fecha de mantenimiento. Es lo que puede parar la planta.',
    umbral: '', unidad: '', porOmision: 0,
    area: 'Planta',
    buscar: function () {
      const hoy = hoyPanama_();
      return leerHoja_(HOJA_MTO).map(m => {
        const p = fechaISO_(m.proximaFecha) || fechaISO_(m['proxima fecha']);
        if (!p || p >= hoy) return null;
        const d = Math.round((new Date(hoy + 'T00:00:00') - new Date(p + 'T00:00:00')) / 86400000);
        return { titulo: String(m.equipo || m.vehiculo || ''),
                 detalle: String(m.tipo || 'Mantenimiento') + ' · tocaba el ' + p,
                 dato: 'hace ' + d + ' días', orden: -d };
      }).filter(Boolean).sort((a, b) => a.orden - b.orden);
    }
  }
};

/* El catálogo tal como lo necesita la pantalla, sin las funciones. */
function catalogoVigilantes_() {
  return Object.keys(VIGILANTES).map(k => {
    const v = VIGILANTES[k];
    return { clave:k, titulo:v.titulo, explica:v.explica, area:v.area,
             umbral:v.umbral, unidad:v.unidad, porOmision:v.porOmision };
  });
}

/* Corre un vigilante y devuelve lo que encontró hoy. Si el vigilante
   revienta —una hoja que todavía no existe, una columna con otro nombre—
   se devuelve el error en vez de tumbar la pantalla entera. */
function evaluarAviso_(vigila, umbral) {
  const v = VIGILANTES[String(vigila || '')];
  if (!v) return { ok:false, error:'Ese vigilante no existe.' };
  try {
    const n = Number(umbral);
    const filas = v.buscar(isFinite(n) ? n : (v.porOmision || 0)) || [];
    return { ok:true, titulo:v.titulo, cuantos:filas.length, filas:filas };
  } catch (e) {
    return { ok:false, error:'No se pudo revisar: ' + e.message };
  }
}


/* ═══════════════════════════════════════════════════════════════════
   EL VIGÍA — el primer asistente, y no usa IA
   ───────────────────────────────────────────────────────────────────
   Corre los diez vigilantes y deja en Pendientes lo que encuentra.
   Hasta hoy esas reglas estaban escritas y no las llamaba nadie: sabían
   mirar el libro pero no tenían dónde dejar lo que veían.

   Las cuatro reglas de seguridad del documento, cumplidas aquí:

   1. Registro de cada corrida — registrarCorrida_ al final, pase lo que
      pase, con lo que encontró y lo que anotó.
   2. Un vigilante que revienta no tumba a los otros nueve: evaluarAviso_
      ya devuelve el error en vez de lanzarlo, y aquí se cuenta y sigue.
   3. Marcar ANTES de actuar — anotarPendiente_ escribe la fila con su
      clave antes de que nadie la vea. Si el script muere a la mitad, es
      preferible no haber avisado a avisar dos veces.
   4. Respeta el interruptor y la fecha de arranque, siempre.

   Cada pendiente lleva una CLAVE estable —vigilante + a quién se
   refiere—, así que correrlo diez veces al día no crea diez filas. Ese
   detalle es lo que separa una bandeja útil de una hoja que nadie mira.
   ═══════════════════════════════════════════════════════════════════ */

/* En qué módulo aterriza lo que ve cada vigilante. El `area` que ya traían
   es para leerlo una persona; esto es para saber a qué bandeja va. */
const VIGILANTE_MODULO = {
  contratos_por_vencer:'mercadeo', contratos_vencidos:'mercadeo',
  fichas_incompletas:'mercadeo',   clientes_sin_inicio:'mercadeo',
  distintivos_pendientes:'mercadeo', prospectos_quietos:'mercadeo',
  seguimiento_vencido:'mercadeo',  solicitudes_sin_aprobar:'logistica',
  pagos_sin_aprobar:'solicitudes', mantenimiento_vencido:'planta',
  factura_vencida:'cobros',        promesa_incumplida:'cobros',
  deuda_sin_gestion:'cobros',      deudor_sin_correo:'cobros',
  cuenta_quieta:'cobros'
};
/* Lo que no se puede dejar para mañana sin que cueste plata o un cliente. */
const VIGILANTE_PRIORIDAD = {
  contratos_vencidos:'alta', pagos_sin_aprobar:'alta',
  mantenimiento_vencido:'alta', seguimiento_vencido:'alta',
  /* una promesa rota es lo más urgente de cobros: ya hubo conversación,
     el cliente puso la fecha él mismo, y dejarla pasar en silencio enseña
     que la próxima promesa tampoco hay que cumplirla */
  promesa_incumplida:'alta',
  contratos_por_vencer:'media', solicitudes_sin_aprobar:'media',
  prospectos_quietos:'media', clientes_sin_inicio:'media',
  factura_vencida:'media', deuda_sin_gestion:'media', cuenta_quieta:'media',
  fichas_incompletas:'baja', distintivos_pendientes:'baja',
  deudor_sin_correo:'baja'
};

/* Una clave estable para no repetir el mismo aviso cada corrida. Se arma
   con el vigilante y a quién se refiere; si dos cosas distintas del mismo
   cliente comparten clave, una taparía a la otra, así que entra también el
   detalle. */
function claveVigia_(vigilante, fila) {
  /* UN VIGILANTE PUEDE FIJAR SU PROPIA CLAVE.
     ─────────────────────────────────────────────────────────────────
     Por omisión la clave sale del texto de la tarjeta, y eso alcanza
     mientras el texto no cambie. Pero hay tarjetas cuyo texto cambia
     solo por vivir: la deuda de un cliente cambia con cada abono. Si la
     clave dependiera del monto, cada pago abriría una tarjeta nueva
     encima de la vieja y la bandeja se llenaría de fantasmas del mismo
     caso.

     Cuando el vigilante devuelve `clave`, esa manda: es la identidad
     del caso —el cliente, la promesa— y no su estado de hoy. Así
     también se puede corregir la redacción de una tarjeta sin que se
     duplique todo lo que ya estaba abierto. */
  const propia = String((fila && fila.clave) || '').trim();
  if (propia) return (String(vigilante) + ':' + propia).slice(0, 180).toUpperCase();

  const base = String(vigilante) + ':' + String((fila && fila.titulo) || '');
  const det = String((fila && fila.detalle) || '');
  return (base + ':' + det).slice(0, 180).toUpperCase();
}

/* ── Lo que ya no aplica se cierra solo ──────────────────────────────
   Hasta hoy una tarjeta abierta se quedaba abierta para siempre. Si la
   factura se pagaba, el vigía dejaba de encontrarla —y la tarjeta seguía
   ahí, pidiendo cobrar algo ya cobrado. Quien limpia la bandeja a mano
   deja de creerle a la bandeja.

   Solo se tocan los tipos que ESTA corrida evaluó de verdad: si el
   módulo de cobros está apagado, sus claves no se calcularon y cerrar
   sus pendientes sería borrar avisos buenos por no haberlos mirado.

   Se marca `resuelto`, no se borra: la fila queda, que es la regla. */
function cerrarPendientesIdos_(vivas, tiposMirados) {
  if (!tiposMirados || !tiposMirados.length) return 0;

  const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_PEND);
  if (!h) return 0;
  const vals = h.getDataRange().getValues();
  if (vals.length < 2) return 0;
  const cab = vals[0].map(String);
  const cTipo = cab.indexOf('tipo'), cCla = cab.indexOf('clave'),
        cEst = cab.indexOf('estado'), cQui = cab.indexOf('atendidoPor'),
        cCua = cab.indexOf('atendidoEn'), cNot = cab.indexOf('notaCierre'),
        cMod = cab.indexOf('modulo');
  if (cTipo < 0 || cCla < 0 || cEst < 0) return 0;

  const mirado = {}; tiposMirados.forEach(t => { mirado[t] = 1; });
  const tocados = {};
  let n = 0;
  for (let i = 1; i < vals.length; i++) {
    const est = String(vals[i][cEst] || '').trim().toLowerCase();
    if (ESTADOS_CERRADOS.indexOf(est) >= 0) continue;
    const tipo = String(vals[i][cTipo] || '').trim();
    if (!mirado[tipo]) continue;
    const clave = String(vals[i][cCla] || '').trim().toUpperCase();
    if (!clave || vivas[clave]) continue;

    h.getRange(i + 1, cEst + 1).setValue('resuelto');
    if (cQui >= 0) h.getRange(i + 1, cQui + 1).setValue('vigia');
    if (cCua >= 0) h.getRange(i + 1, cCua + 1).setValue(hoyPanama_());
    if (cNot >= 0) h.getRange(i + 1, cNot + 1)
      .setValue('Cerrado por el vigía: lo que lo originó ya no existe.');
    if (cMod >= 0) tocados[String(vals[i][cMod] || '').trim()] = 1;
    n++;
  }
  /* que la pantalla se entere: sin marcar el módulo, la bandeja sigue
     mostrando la tarjeta hasta que alguien recargue */
  Object.keys(tocados).forEach(m => { if (m) marcar_(m); });
  return n;
}

function correrVigia_(forzar) {
  const inicio = new Date();
  if (!forzar && !configSi_('asistentes_activos')) {
    registrarCorrida_('vigia', 'apagado', 0, 0, 'asistentes_activos está en NO');
    return { ok:true, apagado:true, encontrados:0, anotados:0 };
  }

  let encontrados = 0, anotados = 0, repetidos = 0, topados = 0;
  const fallos = [];
  const porModulo = {};
  /* para cerrar después lo que ya no aparece: TODAS las claves vivas
     —incluidas las que el tope dejó fuera, que siguen siendo casos
     reales— y qué tipos se miraron de verdad en esta corrida */
  const vivas = {};
  const tiposMirados = [];

  Object.keys(VIGILANTES).forEach(clave => {
    const modulo = VIGILANTE_MODULO[clave] || 'gerencia';
    /* cada módulo tiene su propio interruptor: se puede estrenar el vigía
       en mercadeo sin despertar a planta */
    if (!forzar && !asistenteActivo_(modulo)) return;

    const v = VIGILANTES[clave];
    const r = evaluarAviso_(clave, v.porOmision || 0);
    if (!r.ok) { fallos.push(clave + ': ' + r.error); return; }

    encontrados += r.filas.length;
    tiposMirados.push(clave);
    r.filas.forEach(f => { vivas[claveVigia_(clave, f)] = 1; });
    /* el tope: si hay más, se avisan las primeras y el resto espera a la
       corrida siguiente, según se vayan atendiendo */
    if (r.filas.length > TOPE_POR_VIGILANTE) topados += r.filas.length - TOPE_POR_VIGILANTE;
    r.filas.slice(0, TOPE_POR_VIGILANTE).forEach(f => {
      const res = anotarPendiente_({
        asistente: 'vigia', modulo: modulo,
        prioridad: VIGILANTE_PRIORIDAD[clave] || 'media',
        tipo: clave, referencia: String(f.titulo || ''),
        titulo: String(f.titulo || ''),
        descripcion: v.titulo + ' · ' + String(f.detalle || ''),
        /* el enlace es lo que separa un tablero de avisos de una
           herramienta: sin él la tarjeta dice qué pasa y deja a quien la
           lee buscando a mano dónde arreglarlo */
        contenido: '', enlace: String(f.enlace || ''),
        clave: claveVigia_(clave, f)
      });
      if (res.creado) { anotados++; porModulo[modulo] = (porModulo[modulo] || 0) + 1; }
      else if (res.repetido) repetidos++;
    });
  });

  /* si un vigilante falló, sus claves no se calcularon: no se cierra
     nada suyo, o se borrarían avisos buenos por un error de lectura */
  const cerrados = fallos.length
    ? cerrarPendientesIdos_(vivas, tiposMirados.filter(t =>
        fallos.every(x => x.indexOf(t + ':') !== 0)))
    : cerrarPendientesIdos_(vivas, tiposMirados);
  const seg = Math.round((new Date() - inicio) / 1000);
  registrarCorrida_('vigia', fallos.length ? 'con fallos' : 'ok', encontrados, anotados,
    'repetidos ' + repetidos +
    (cerrados ? ' · ' + cerrados + ' cerrados porque ya no aplican' : '') +
    (topados ? ' · ' + topados + ' quedaron para la próxima corrida (tope ' +
                TOPE_POR_VIGILANTE + ')' : '') +
    ' · desde ' + desdeArranque_() + ' · ' + seg + 's' +
    (fallos.length ? ' · fallaron: ' + fallos.join(' | ') : ''));

  return { ok:true, encontrados:encontrados, anotados:anotados,
           repetidos:repetidos, topados:topados,
           porModulo:porModulo, fallos:fallos };
}

/* El disparador diario. Se instala desde el menú. */
function correrVigiaDiario() { correrVigia_(false); }

function instalarVigia() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'correrVigiaDiario') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('correrVigiaDiario').timeBased().atHour(6).everyDays(1).create();
  SpreadsheetApp.getUi().alert(
    'El vigía correrá todos los días a las 6 de la mañana.\n\n' +
    'No hará nada mientras asistentes_activos esté en NO.');
}

/* ── Correrlo a mano desde la hoja ───────────────────────────────────
   Estaba api_correrVigia para las pantallas, pero no había ningún botón
   ni ítem de menú que la llamara: para probar el vigía había que abrir el
   editor de Apps Script y ejecutar la función a mano. Código escrito que
   nadie puede alcanzar es código que no existe.

   Corre en modo NO forzado a propósito: así lo que se ve aquí es
   exactamente lo que va a pasar mañana a las 6, interruptores incluidos.
   Si está apagado, el aviso lo dice en vez de disimularlo. */
function correrVigiaAhora() {
  const ui = SpreadsheetApp.getUi();
  const r = correrVigia_(false);
  if (r.apagado) {
    ui.alert('El vigía no hizo nada.\n\n' +
             'El interruptor asistentes_activos está en NO. ' +
             'Ponlo en SI en la hoja ConfiguracionAsistentes y vuelve a correrlo.');
    return;
  }
  const mods = Object.keys(r.porModulo || {})
    .map(m => '  · ' + m + ': ' + r.porModulo[m]).join('\n');
  ui.alert(
    'El vigía terminó.\n\n' +
    'Encontrados: ' + r.encontrados + '\n' +
    'Anotados nuevos: ' + r.anotados + '\n' +
    'Ya estaban anotados: ' + r.repetidos + '\n' +
    (r.topados ? 'Quedaron para la próxima corrida: ' + r.topados + '\n' : '') +
    (mods ? '\nPor módulo:\n' + mods + '\n' : '') +
    (r.fallos && r.fallos.length ? '\nFallaron:\n  ' + r.fallos.join('\n  ') : '') +
    '\n\nLo anotado está en la hoja Pendientes y en la bandeja de cada módulo.');
}

/* Correrlo a mano, para verlo trabajar sin esperar a mañana. */
function api_correrVigia(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (['admin','gerente'].indexOf(u.rol) < 0)
    return { ok:false, error:'Correr los asistentes a mano es de gerencia o administración.' };
  const r = correrVigia_(true);
  r.usuario = u.nombre;
  return r;
}

/* ═══ Lo que hay que atender en un módulo ═══ */
function api_pendientes(pin, modulo, incluirCerrados) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };

  const m = String(modulo || '').trim().toLowerCase();
  const hoy = hoyPanama_();
  const orden = { alta:0, media:1, baja:2 };
  let lista = leerHoja_(HOJA_PEND)
    .filter(p => String(p.pendienteId || '').trim())
    .filter(p => !m || String(p.modulo || '').trim().toLowerCase() === m)
    .map(p => ({
      pendienteId:String(p.pendienteId), fecha:fechaISO_(p.fecha),
      asistente:String(p.asistente || ''), modulo:String(p.modulo || ''),
      prioridad:String(p.prioridad || 'media'), tipo:String(p.tipo || ''),
      referencia:String(p.referencia || ''), titulo:String(p.titulo || ''),
      descripcion:String(p.descripcion || ''), contenido:String(p.contenido || ''),
      enlace:String(p.enlace || ''), estado:String(p.estado || 'nuevo'),
      atendidoPor:String(p.atendidoPor || ''), atendidoEn:fechaISO_(p.atendidoEn),
      recordarEn:fechaISO_(p.recordarEn)
    }));

  if (!incluirCerrados) {
    lista = lista.filter(p => ESTADOS_CERRADOS.indexOf(p.estado) < 0);
    /* Un pospuesto sigue abierto en la hoja —por eso el vigía no lo
       duplica— pero no se muestra hasta que llegue su día. Cuando llega,
       reaparece solo, sin que nadie tenga que hacer nada. */
    lista = lista.filter(p => !(p.estado === 'pospuesto' && p.recordarEn && p.recordarEn > hoy));
  }

  lista.sort((a, b) =>
    (orden[a.prioridad] === undefined ? 1 : orden[a.prioridad]) -
    (orden[b.prioridad] === undefined ? 1 : orden[b.prioridad]) ||
    String(a.fecha).localeCompare(String(b.fecha)));

  const t = { alta:0, media:0, baja:0 };
  lista.forEach(p => { if (t[p.prioridad] !== undefined) t[p.prioridad]++; });

  return { ok:true, hoy:hoy, modulo:m, pendientes:lista,
           total:lista.length, porPrioridad:t, marca:marcaDe_(m) };
}

/* ═══ Atender uno ═══
   Cerrar un pendiente no lo borra: queda con quién lo cerró, cuándo y con
   qué nota. Un pendiente borrado es una decisión que nadie puede revisar. */
function api_cerrarPendiente(pin, pendienteId, estado, nota, dias) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };

  const est = String(estado || '').trim().toLowerCase();
  if (ESTADOS_PEND.indexOf(est) < 0) return { ok:false, error:'Ese estado no existe.' };

  const id = String(pendienteId || '').trim().toUpperCase();
  const suyo = leerHoja_(HOJA_PEND)
    .filter(p => String(p.pendienteId || '').trim().toUpperCase() === id)[0];
  if (!suyo) return { ok:false, error:'No encontré ese pendiente.' };

  /* Posponer necesita un día de regreso. Por omisión, mañana: es lo que
     alguien quiere decir casi siempre al quitar una tarjeta que todavía
     tiene que hacer. Sin fecha, un pospuesto sería un descartado con otro
     nombre —volvería a esconderse para siempre— así que si el número no
     sirve se usa 1 en vez de dejarlo vacío. */
  let recordar = '';
  if (est === 'pospuesto') {
    const n = Math.min(Math.max(Math.round(Number(dias) || 1), 1), 365);
    recordar = sumarDias_(hoyPanama_(), n);
  }

  const ok = actualizarFila_(HOJA_PEND, 'pendienteId', id, {
    estado: est, atendidoPor: u.nombre, atendidoEn: hoyPanama_(),
    notaCierre: String(nota || '').trim().slice(0, 400),
    recordarEn: recordar
  });
  if (!ok) return { ok:false, error:'No se pudo actualizar ese pendiente.' };
  marcar_(String(suyo.modulo || ''));
  return { ok:true, pendienteId:id, estado:est, recordarEn:recordar };
}

/* Sumar días a una fecha aaaa-mm-dd sin que la zona horaria mueva el día.
   Se ancla a mediodía a propósito: a medianoche, un desfase de una hora
   deja la fecha en el día anterior y el recordatorio llega un día antes. */
function sumarDias_(iso, n) {
  const d = new Date(String(iso) + 'T12:00:00');
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + (Number(n) || 0));
  return Utilities.formatDate(d, 'America/Panama', 'yyyy-MM-dd');
}