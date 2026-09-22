/**
 * ═══════════════════════════════════════════════════════════════
 *  RUTAS ECOVSA · Servidor  (versión 3 — ARCHIVO ÚNICO)
 *
 *  Este archivo reemplaza a Codigo.gs, Codigo2.gs y Codigo3.gs.
 *  Borra esos tres y deja solo este, llamado "Codigo".
 *
 *  CAMBIO IMPORTANTE: la identificación ahora es por PIN, no por
 *  correo. Google no le entrega el correo del visitante a la app
 *  cuando se publica para cualquier usuario, por eso todos salían
 *  como "Invitado".
 *
 *  Hojas: Clientes · Rutas · Recolecciones · Usuarios
 * ═══════════════════════════════════════════════════════════════
 */

const HOJA_CLI = 'Clientes';

/* ═══════════ DATOS DE LA EMPRESA ═══════════
   Estaban escritos a mano dentro de cuatro pantallas distintas: la propuesta,
   el contrato, el certificado y la solicitud de pago. Corregir la dirección
   significaba acordarse de los cuatro, y basta olvidar uno para que salga una
   dirección en el contrato y otra en el certificado del mismo cliente.

   Ahora viven aquí, una sola vez, y las pantallas los reciben del servidor.
   Para cambiar la dirección se cambia esta línea y cambia en todas partes.

   Lo que se escriba aquí debe coincidir con el Aviso de Operación y con el
   pacto social: es lo que se imprime en documentos legales. */
const EMPRESA = {
  comercial:  'ECOVSA',
  razonSocial:'ECOTERMO DE PANAMA S.A.',
  ruc:        '1074020-1-552789',
  /* El sistema venía imprimiendo DV 60 en ocho documentos. Confirmado por
     Supervisor el 4 sep 2026: es 50. Los contratos ya firmados llevan el 60 y no
     se reimprimen — un documento firmado es lo que dice. */
  dv:         '50',
  lema:       'Ecología · Vida · Salud',
  direccion:  'Distrito Panamá, Edif. P.H. Credicorp Bank, Piso 7',
  ciudad:     'Panamá',
  telefono:   '310-2268',
  whatsapp:   '6264-1647',
  correo:     'correo@ejemplo.com',
  instagram:  '@ecovsapanama',
  /* Solo la vigente. El certificado en Word citaba la 0297 del 23 feb 2024 y
     el contrato la 0096 del 25 ene 2025; no había forma de saber cuál era la
     buena, y una resolución superada no es la autorización en vigor. Mejor
     citar una correcta que dos donde una está mal. */
  resolucion: 'Resolución Sanitaria N° 1519 del 10 de diciembre de 2025',
  resolucionCorta:'Resolución Sanitaria N° 1519',
  decreto:    'Decreto Ejecutivo 111 de 1999'
};

/* ═══════════ LISTADO MAESTRO DE FORMULARIOS ═══════════
   Un documento sin código ni versión no se puede auditar: no se sabe si es el
   vigente. El único que llevaba código era el certificado en Word de Mercadeo
   (F-VEN-04 v1), numerado suelto y sin listado detrás.

   Se numera por el ORDEN DEL FLUJO, no por el orden en que se programaron las
   pantallas: se cotiza, se propone, se firma, se entrega el distintivo, el
   cliente consulta. Así el número dice algo.

   El distintivo cae en el 04 y ese es justo el número que ya usaba el
   certificado que reemplaza, así que entra como VERSIÓN 2 de F-VEN-04: mismo
   propósito, documento nuevo, versión anterior obsoleta y rastreable.

   Sube la versión lo que cambia el contenido — un campo, un texto legal, una
   resolución. No sube un margen ni una tilde. Al subir, cambian número y mes. */
const FORMULARIOS = {
  cotizacion:  ['F-VEN-01', 1],
  propuesta:   ['F-VEN-02', 1],
  contrato:    ['F-VEN-03', 1],
  distintivo:  ['F-VEN-04', 2],   // v1 fue el certificado en Word, jun-25
  miCliente:   ['F-VEN-05', 1],
  /* Sexto del área comercial aunque en el flujo vaya casi al principio:
     el correlativo va por orden de registro, y renumerar los cinco que
     ya circulan es peor que un número fuera de orden. */
  inspeccion:  ['F-VEN-06', 1],
  recibo:      ['F-LOG-01', 1],
  manifiesto:  ['F-LOG-02', 1],
  recepcion:   ['F-PLA-01', 1],
  actaFinal:   ['F-PLA-02', 1],
  solicitudPago:['F-ADM-01', 1],
  arqueo:      ['F-ADM-02', 1],
  certificado: ['F-CAL-01', 1]
};
const FORM_MES = 'SEP-26';   // mes de esta emisión; cambia al subir versiones

function codigoFormulario_(clave) {
  const f = FORMULARIOS[clave];
  return f ? (f[0] + ' · VERSIÓN ' + f[1] + ' / ' + FORM_MES) : '';
}

/* Una línea de pie, la misma en todos los documentos. */
/* La dirección ya empieza con "Distrito Panamá", así que anteponer la ciudad
   daba "Panamá, Distrito Panamá, Edif...". Se antepone solo si hace falta, y
   así sigue funcionando si mañana la dirección se escribe sin la ciudad. */
function conCiudad_(dir, ciudad) {
  const d = String(dir || '').trim(), c = String(ciudad || '').trim();
  if (!d) return c;
  if (!c || d.toUpperCase().indexOf(c.toUpperCase()) >= 0) return d;
  return c + ', ' + d;
}
function pieEmpresa_() {
  return conCiudad_(EMPRESA.direccion, EMPRESA.ciudad) + ' · Tel. ' + EMPRESA.telefono +
         ' · ' + EMPRESA.correo;
}

/* Lo que reciben las pantallas que imprimen: los datos de la empresa más el
   código del formulario que les toca. */
function datosDoc_(clave) {
  const e = {};
  Object.keys(EMPRESA).forEach(k => { e[k] = EMPRESA[k]; });
  e.formulario = codigoFormulario_(clave);
  return e;
}
const HOJA_RUT = 'Rutas';
const HOJA_REC = 'Recolecciones';
const HOJA_USR = 'Usuarios';

const COLS_CLI = ['id','nombre','estado','direccion','region','kg','frecuencia',
                  'ultimaVisita','proximaVisita','diasAtraso','contacto','telefono','whatsapp','lat','lng',
                  'razon social','ruc','dv','correo','canal','clienteRef','facturacion',
                  'plan costo','plan kg','tarifa kg adic','tarifa visita adic','inicio recoleccion','contrato',
                  'vencimiento','notas comerciales','tipo cartera'];
const COLS_RUT = ['rutaId','fecha','conductor','vehiculo','orden','clienteId','creadaPor','creadaEn'];
const COLS_REC = ['registroId','Cliente','Fecha de Recoleccion','hora inicio','hora final',
                  'Kg Recolectados','cantidad bolsas','kg punzo cortantes','cantidad punzo cort',
                  'kg anatomopatologico','cantidad anatomo','manifiesto',
                  'recibo numero','Observaciones','Responsable','total Kg','tiempo','Mes','Semana',
                  'vehiculo','latRegistro','lngRegistro','subidoEn','acta',
                  'horaBoton inicio','horaBoton final','ajustada',
                  'firma','firmante','enviado'];

const HOJA_DIS = 'Disposiciones';
/* ═══ EL CÓDIGO DEL ACTA DE ENTREGA ═══════════════════════════════
   ACT-26-09-01 — tipo, año, mes y el número del acta DENTRO DE ESE MES.

   Es la misma forma que el código del ciclo (CIC-26-09-0550): tipo, año,
   mes, número. Un sistema con dos convenciones obliga a recordar cuál usa
   cada cosa; con una sola, se lee igual en todas partes.

   Antes era ACT-2026-0001, con correlativo corrido del año entero — y
   antes de eso, DF. Los tres formatos conviven sin problema: lo que
   identifica un acta es su texto exacto, no su forma.

   Dos dígitos alcanzan de sobra para las entregas de un mes. Si alguna vez
   un mes pasara de 99, el número crece a tres solo; lo que NO pasa nunca es
   que dos actas del mismo mes salgan con el mismo código. */
function actaId_(fecha, numero) {
  const f = String(fecha || hoyPanama_());
  const n = Number(numero) || 1;
  return 'ACT-' + f.slice(2, 4) + '-' + f.slice(5, 7) + '-' +
         (n < 100 ? ('0' + n).slice(-2) : String(n));
}

/* El siguiente número dentro del mes de esa fecha. Cuenta solo las actas
   del formato nuevo: las viejas llevan correlativo del año y mezclarlas
   daría un número absurdo. */
function siguienteNumeroActa_(fecha) {
  const pre = 'ACT-' + String(fecha).slice(2, 4) + '-' + String(fecha).slice(5, 7) + '-';
  let alto = 0;
  leerHoja_(HOJA_DIS).forEach(r => {
    const id = String(r.actaId || '').trim();
    if (id.indexOf(pre) !== 0) return;
    const n = Number(id.slice(pre.length)) || 0;
    if (n > alto) alto = n;
  });
  return alto + 1;
}

const COLS_DIS = ['actaId','fecha','hora','operador','vehiculo','destino','recibe',
                  'desde','hasta','recibos','kgBio','cantBio','kgAnatomo','cantAnatomo',
                  'kgPunzo','cantPunzo','kgTotal','bultos','observaciones','detalle','firma','registradoEn'];

const HOJA_JOR = 'Jornadas';
const COLS_JOR = ['jornadaId','fecha','conductor','vehiculo','kmInicio','horaInicio',
                  'kmFinal','horaFinal','kmRecorridos','paradas','totalKg','registradoEn'];

const HOJA_COM = 'Combustible';
const COLS_COM = ['cargaId','fecha','hora','conductor','vehiculo','kilometraje','galones',
                  'monto','estacion','notas','registradoEn'];
const COLS_USR = ['pin','nombre','rol','activo','correo'];   // rol: operador | supervisor | gerente | mercadeo
const HOJA_SOL = 'Solicitudes';
/* ── La solicitud es el puente, y era un colador ──────────────────────
   Un cliente nace así: prospecto → solicitud → cliente. Cada salto
   copiaba a mano un puñado de campos, y lo que no estaba en la lista se
   perdía sin que nadie se enterara.

   El caso que lo destapó: el RUC. `api_pasarACartera` SÍ lo mandaba, y
   esta hoja no tenía dónde ponerlo — se enviaba y se tiraba, en silencio.
   Mercadeo lo captura en el prospecto y el cliente nacía sin él, que es
   justamente la llave del contribuyente.

   Igual con lo que la propuesta ya sabe y el cliente necesita para
   facturarse: el plan, las tarifas, el contrato, el vencimiento. Nada de
   eso llegaba, y alguien tenía que copiarlo a mano después. Los huecos
   que salieron en la auditoría de la cartera son exactamente esto.

   Las columnas nuevas van AL FINAL: asegurarColumnas_ las agrega sin
   tocar las que ya están ni su orden, así que una hoja con historial
   sigue leyéndose igual. */
const COLS_SOL = ['solicitudId','fechaSolicitud','empresa','razonSocial','contacto','cargo',
                  'telefono','celular','correo','direccion','zona','frecuencia','kgMax',
                  'inicioRecoleccion','plusCode','notas','registradoPor','estado',
                  'motivo','procesadaEn','procesadaPor',
                  /* identificación fiscal: sin esto no se factura ni se cobra */
                  'ruc','dv','sector','provincia',
                  /* de dónde vino, para poder volver a la propuesta años después */
                  'codigoPropuesta','tipoServicio',
                  /* la ficha comercial que ya acordó mercadeo */
                  'planCosto','planKg','tarifaKgAdic','tarifaVisitaAdic',
                  'contrato','fechaContrato','plazoContrato','vencimiento',
                  'horarioRecoleccion','diasSemana',
                  /* lo que contabilidad exige */
                  'retieneItbms','facturacion','canalEnvio'];

/* ═══════════════════════════════════════════════════════════════════
   LA IDENTIDAD, EN UN SOLO LUGAR
   ───────────────────────────────────────────────────────────────────
   Estaba copiada a mano en 19 pantallas, y ya se había desincronizado:
   el azul de ECOVSA tenía cuatro valores (#0B5394 en diez archivos,
   #0C5395 en tres — un dígito que nadie eligió), el verde dos, y el
   borde cinco. Un color no puede depender de que alguien copie bien.

   Aquí vive la paleta. El archivo `Estilos` la imprime y cada pantalla
   lo incluye con una línea.

   Los TRES ACENTOS son a propósito, los eligió Supervisor: azul para
   operaciones, dorado para Finanzas, verde para Certificados. Lo que se
   unifica es todo lo demás.
   ═══════════════════════════════════════════════════════════════════ */
const TEMA = {
  base: {
    'tinta':'#141C2B', 'gris':'#5B6880', 'fondo':'#EEF2F7', 'borde':'#D3DDEA',
    'verde':'#2F6B0A', 'verde-bandera':'#00792F', 'lima':'#86B62B',
    'verde-claro':'#CFE5B4', 'verde-suave':'#EEF5E4',
    'ambar':'#F5B301', 'ambar-osc':'#9A6E00',
    'rojo':'#C0392B', 'rojo-suave':'#FBEAE8',
    /* El color de Tratamiento. Estaba escrito a mano en el lobby y en las
       maquetas; puesto aquí, las cuatro zonas se identifican igual en
       toda la app y el día que cambie, cambia en un sitio. */
    'morado':'#6C3A96', 'morado-claro':'#B08BD4',
    'radio':'15px', 'sombra':'0 2px 12px rgba(20,48,107,.10)'
  },
  acentos: {
    /* operaciones — el azul de siempre */
    operaciones:  { 'azul-osc':'#14306B', 'azul':'#0B5394',
                    'azul-claro':'#BDD5EC', 'azul-suave':'#E9F1FA',
                    'sombra':'0 2px 12px rgba(20,48,107,.10)' },
    /* finanzas — dorado. La variable se llama 'azul' y guarda dorado:
       feo por dentro, pero cambiarle el nombre obligaría a tocar cada
       regla de CSS de esas dos pantallas. */
    finanzas:     { 'azul-osc':'#7A5600', 'azul':'#A87B0A',
                    'azul-claro':'#EBD69B', 'azul-suave':'#FBF3DC',
                    'tinta':'#241D0B', 'gris':'#6E6450', 'fondo':'#F7F3E9',
                    'borde':'#E4DAC2', 'radio':'16px',
                    'sombra':'0 2px 12px rgba(122,86,0,.11)' },
    /* certificados — verde */
    certificados: { 'azul-osc':'#1E5127', 'azul':'#2F7D32',
                    'azul-claro':'#B9DBBB', 'azul-suave':'#EAF4EA',
                    'tinta':'#15220F', 'gris':'#5D6B58', 'fondo':'#F1F6EF',
                    'borde':'#D2E2D0', 'radio':'16px',
                    'sombra':'0 2px 12px rgba(30,81,39,.10)' }
  }
};

/* Devuelve el bloque :root ya armado. Lo llama la plantilla `Estilos`. */
function paletaCss_(acento) {
  const a = TEMA.acentos[String(acento || 'operaciones')] || TEMA.acentos.operaciones;
  const v = {};
  Object.keys(TEMA.base).forEach(k => { v[k] = TEMA.base[k]; });
  Object.keys(a).forEach(k => { v[k] = a[k]; });
  return ':root{' + Object.keys(v).map(k => '--' + k + ':' + v[k]).join(';') + '}';
}

/* incluir() usa getContent(), que NO evalúa scriptlets: con esa función el
   archivo `Estilos` saldría con el `<?= ?>` literal. Por eso esta otra, que
   sí evalúa la plantilla. La de siempre se deja como está para no romper
   nada que ya la use. */
function incluirTema(acento) {
  const t = HtmlService.createTemplateFromFile('Estilos');
  t.acento = String(acento || 'operaciones');
  return t.evaluate().getContent();
}

/* ═══════════════ MENÚ ═══════════════ */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('ECOVSA')
    .addItem('Preparar hojas', 'prepararHojas')
    .addItem('Actualizar columnas de Recolecciones', 'actualizarColumnasRecolecciones')
    .addItem('Ver actas de disposición final', 'verActas')
    .addItem('Limpiar rutas duplicadas', 'limpiarRutasDuplicadas')
    .addItem('Crear hoja Prospectos', 'crearHojaProspectos')
    .addItem('Crear hojas de Cobros', 'crearHojasCobros')
    .addItem('Crear hoja de Gestión de cobros', 'crearHojaGestion')
    .addItem('Crear plantillas de mensajes', 'crearHojaPlantillas')
    .addItem('Crear hojas de Planta', 'crearHojasPlanta')
    .addItem('Renumerar ciclos al formato nuevo', 'renumerarCiclos')
    .addItem('Renumerar actas al formato nuevo', 'renumerarActas')
    .addItem('Crear hojas de Finanzas', 'crearHojasFinanzas')
    .addItem('Crear hojas de Caja menuda', 'crearHojasCaja')
    .addItem('Crear hojas de Administración', 'crearHojasAdministracion')
    .addItem('Crear hoja de Inspecciones', 'crearHojaInspecciones')
    .addItem('Crear hojas de Asistentes', 'crearHojasAsistentes')
    .addItem('Programar el vigía (6 a.m.)', 'instalarVigia')
    .addItem('Correr el vigía ahora', 'correrVigiaAhora')
    .addItem('Cargar catálogo contable base', 'sembrarCuentasContables')
    .addItem('Corregir BIMENSUAL → BIMESTRAL', 'migrarBimestral')
    .addItem('Ver enlace de la app', 'verEnlace')
    .addItem('Revisar la integridad del libro', 'revisarLibroUI')
    .addSeparator()
    .addItem('Generar PIN a quien no tenga', 'generarPines')
    .addItem('Ver PIN del equipo', 'verPines')
    .addSeparator()
    .addItem('Actualizar estados de clientes', 'actualizarEstadosManual')
    .addItem('Programar actualización nocturna', 'instalarDisparador')
    .addSeparator()
    .addItem('Revisar ubicaciones', 'revisarUbicaciones')
    .addItem('Convertir Plus Codes a coordenadas', 'convertirPlusCodes')
    .addItem('Corregir coordenadas', 'arreglarCoordenadasTexto')
    .addItem('Buscar ubicaciones faltantes', 'buscarUbicacionesFaltantes')
    .addItem('Verificar ubicaciones en Google Maps', 'crearEnlacesVerificacion')
    .addItem('Diagnóstico (copiar datos)', 'diagnosticoUbicaciones')
    .addToUi();
}

function prepararHojas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  crearHoja_(ss, HOJA_CLI, COLS_CLI);
  crearHoja_(ss, HOJA_RUT, COLS_RUT);
  crearHoja_(ss, HOJA_REC, COLS_REC);
  crearHoja_(ss, HOJA_SOL, COLS_SOL);
  crearHoja_(ss, HOJA_JOR, COLS_JOR);
  crearHoja_(ss, HOJA_COM, COLS_COM);
  crearHoja_(ss, HOJA_DIS, COLS_DIS);
  const u = crearHoja_(ss, HOJA_USR, COLS_USR);
  if (u.getLastRow() < 2) {
    u.appendRow(['0000', 'Supervisor', 'supervisor', 'SI', Session.getActiveUser().getEmail() || '']);
  }
  /* La hoja Clientes ya existe hace tiempo y crearHoja_ no le agrega
     columnas nuevas: solo escribe encabezados cuando la hoja nace vacía.
     Por eso las columnas que fueron llegando después —la situación, la
     retención, y ahora el tipo de cartera— hay que asegurarlas aparte, o
     el campo existe en el código y no en la hoja. */
  asegurarColumnas_(ss.getSheetByName(HOJA_CLI), CAMPOS_CARTERA);
  asegurarColumnas_(ss.getSheetByName(HOJA_SOL), COLS_SOL);

  SpreadsheetApp.getUi().alert(
    'Hojas listas.\n\n' +
    '1. Importa Clientes_ECOVSA.csv en la hoja "Clientes".\n' +
    '2. En la hoja "Usuarios" escribe una fila por persona: PIN, nombre y rol.\n' +
    '3. Publica: Implementar > Nueva implementación > Aplicación web.\n\n' +
    'Tu PIN de supervisor quedó como 1234 — cámbialo por uno tuyo.');
}

function crearHoja_(ss, nombre, cols) {
  let h = ss.getSheetByName(nombre);
  if (!h) h = ss.insertSheet(nombre);
  if (h.getLastRow() === 0 || h.getRange(1,1).getValue() === '') {
    h.getRange(1,1,1,cols.length).setValues([cols]);
  }
  h.getRange(1,1,1,cols.length).setFontWeight('bold').setBackground('#0E5F45').setFontColor('#FFFFFF');
  h.setFrozenRows(1);
  if (nombre === HOJA_USR) h.getRange('A:A').setNumberFormat('@');   // el PIN como texto, para no perder ceros
  return h;
}

function verEnlace() {
  const url = urlApp_();
  SpreadsheetApp.getUi().alert('Enlace de la app:\n\n' + (url || 'Aún no has publicado la app.') +
    '\n\nPara el panel de gerencia agrega  ?p=panel  al final.');
}

/* ═══════════════ USUARIOS Y PIN ═══════════════ */

function generarPines() {
  const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_USR);
  const datos = h.getDataRange().getValues();
  const cab = datos[0].map(String);
  const cPin = cab.indexOf('pin'), cNom = cab.indexOf('nombre');
  const usados = {};
  datos.slice(1).forEach(f => { if (f[cPin]) usados[String(f[cPin]).trim()] = true; });

  let n = 0;
  for (let i = 1; i < datos.length; i++) {
    if (!String(datos[i][cNom] || '').trim()) continue;
    if (String(datos[i][cPin] || '').trim()) continue;
    let pin;
    do { pin = String(Math.floor(1000 + Math.random() * 9000)); } while (usados[pin]);
    usados[pin] = true;
    datos[i][cPin] = pin;
    n++;
  }
  h.getRange(1, 1, datos.length, cab.length).setValues(datos);
  SpreadsheetApp.getUi().alert(n + ' PIN generado(s).\n\nUsa "Ver PIN del equipo" para repartirlos.');
}

function verPines() {
  const filas = leerHoja_(HOJA_USR).filter(u => String(u.nombre || '').trim());
  const txt = filas.map(u => '• ' + u.nombre + '  →  PIN ' + u.pin + '   (' + u.rol + ')').join('\n');
  SpreadsheetApp.getUi().alert('PIN DEL EQUIPO\n\n' + (txt || 'No hay usuarios registrados.') +
    '\n\nMándale a cada quien SU PIN por separado, no la lista completa.');
}


/* ═══ Permisos ═══
   admin       — todo, incluido lo que no tiene marcha atrás
   supervisor  — planifica y monitorea operaciones; no borra ni reabre
   El resto trabaja en su módulo. */
function esAdmin_(u)      { return u && u.rol === 'admin'; }
function esSupervisor_(u) { return u && (u.rol === 'supervisor' || u.rol === 'admin'); }

/* ── Quién puede trabajar cobros ─────────────────────────────────────
   El rol `cobros` existe para que quien lleva la cartera entre a UNA
   pantalla y nada más. Con supervisor o gerente vería el sistema entero,
   que es justo lo que no queremos.

   Va aparte de esSupervisor_ a propósito: cobrar incluye registrar
   facturas, pagos y gestiones —o sea escribir—, y meter ese permiso
   dentro de «supervisor» habría obligado a darle a Cobros un rol que
   abre puertas que no le tocan. */
/* OJO: esta lista no solo abre la pantalla de Cartera — también autoriza
   REGISTRAR facturas y pagos. Quien esté aquí puede tocar plata. */
const ROLES_COBROS = ['cobros', 'supervisor', 'gerente', 'admin', 'mercadeo'];
function esCobros_(u) { return !!u && ROLES_COBROS.indexOf(u.rol) >= 0; }

function usuarioPorPin_(pin) {
  const p = String(pin || '').trim();
  if (!p) return null;
  const f = leerHoja_(HOJA_USR).find(u =>
    String(u.pin).trim() === p && String(u.activo || 'SI').toUpperCase() !== 'NO');
  if (!f) return null;
  return { nombre: String(f.nombre || ''), rol: String(f.rol || 'operador').toLowerCase().trim(), autorizado: true };
}

function api_login(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok: false, error: 'PIN incorrecto. Pídeselo a tu supervisor.' };
  return { ok: true, usuario: u };
}

/* ═══════════════ ENTRADA WEB ═══════════════ */

/* Index está partido en varios archivos para que cada uno se pueda pegar
   completo en el editor. Esta función los une al servir la página. */
function incluir(archivo) {
  return HtmlService.createHtmlOutputFromFile(archivo).getContent();
}

/* La app corre dentro de un iframe: para abrir otra página del proyecto
   hace falta la URL real, que solo el servidor conoce. */
/* ═══ LA DIRECCIÓN DE LA APP ═══════════════════════════════════════

   De aquí cuelga TODA la navegación: los iconos del lobby, cada «← Inicio»
   y cada documento que se abre en pestaña nueva. Ninguna pantalla sabe
   dónde vive la app; se lo pregunta al servidor, y el servidor contestaba
   siempre ScriptApp.getService().getUrl().

   Esa función NO devuelve la implementación por la que entró el usuario:
   devuelve la que Google considere activa. El día que se crea una
   implementación nueva, esa pasa a ser la activa — y entonces quien sigue
   entrando por la dirección de siempre se queda encerrado. La pantalla en
   la que está carga bien, pero todo lo que intente abrir o volver lo manda
   a la otra puerta.

   Eso fue lo del 8 de septiembre: se veía la página de alta y «← Inicio»
   no regresaba al lobby. No estaba roto ningún archivo; la app repartía la
   dirección equivocada.

   Se arregla pudiendo FIJARLA. Si hay una guardada, manda ella y da igual
   cuántas implementaciones existan. Se pone a mano en Configuración del
   proyecto → Propiedades de la secuencia de comandos, con el nombre
   URL_APP_FIJA y la dirección /exec por la que entra el equipo. */
const PROP_URL_APP = 'URL_APP_FIJA';

/* Una dirección de app válida y nada más. Se valida AL LEER, a propósito:
   esta función decide a dónde va todo el equipo al pulsar «volver». Si lo
   guardado trae basura y se devolviera tal cual, la app entera quedaría
   apuntando a la nada y sin forma de salir. Ante algo que no se entiende,
   mejor la de Google: puede no ser la ideal, pero abre. */
function urlValida_(u) {
  const s = String(u || '').trim().split('?')[0].split('#')[0].replace(/\/+$/, '');
  return /^https:\/\/script\.google\.com\/macros\/s\/[^\/]+\/exec$/.test(s) ? s : '';
}

function urlApp_() {
  const fija = urlValida_(PropertiesService.getScriptProperties()
                            .getProperty(PROP_URL_APP));
  return fija || ScriptApp.getService().getUrl();
}

function api_urlApp() {
  return urlApp_();
}

function doGet(e) {
  const pagina = (e && e.parameter && e.parameter.p) || 'app';
  const paginas = {
    /* El detalle operativo ya no es una página: vive dentro de la
       pestaña de Logística del panel de dirección. La dirección vieja se
       queda un tiempo devolviendo allá, por si alguien la tiene guardada. */
    panel: { archivo: 'Inicio', titulo: 'ECOVSA · Panel de Dirección' },
    alta:  { archivo: 'Alta',  titulo: 'Alta de Clientes ECOVSA' },
    acta:   { archivo: 'Acta',   titulo: 'Acta de Disposición Final' },
    planta: { archivo: 'Planta', titulo: 'Planta · Recepción ECOVSA' },
    rplanta:{ archivo: 'RPlanta',titulo: 'Reporte de Recepción · ECOVSA' },
    propuesta:{ archivo: 'Propuesta', titulo: 'Propuesta Comercial · ECOVSA' },
    contrato: { archivo: 'Contrato',  titulo: 'Contrato de Servicio · ECOVSA' },
    asalida:  { archivo: 'ActaSalida', titulo: 'Manifiesto de Salida · ECOVSA' },
    inicio:   { archivo: 'Inicio',    titulo: 'ECOVSA · Panel de Dirección' },
    cobros:   { archivo: 'Cobros',    titulo: 'Cobros · ECOVSA' },
    recibo:   { archivo: 'Recibo',    titulo: 'Recibo de Visita · ECOVSA' },
    formulario:   { archivo: 'FormularioCliente',  titulo: 'Formulario de Datos · ECOVSA' },
    certificados: { archivo: 'Certificado',        titulo: 'Certificado Ambiental · ECOVSA' },
    vercert:      { archivo: 'CertificadoVista',   titulo: 'Certificado Oficial · ECOVSA' },
    finanzas:     { archivo: 'Finanzas',           titulo: 'Finanzas · ECOVSA' },
    solicitud:    { archivo: 'SolicitudPago',      titulo: 'Solicitud de Pago · ECOVSA' },
    vsolicitud:   { archivo: 'SolicitudVista',     titulo: 'Solicitud de Pago · Documento' },
    arqueo:       { archivo: 'Arqueo',             titulo: 'Arqueo de Caja Menuda · ECOVSA' },
    admin:        { archivo: 'Administracion',     titulo: 'Administración · ECOVSA' },
    vinspeccion:  { archivo: 'InspeccionVista',    titulo: 'Inspección Técnica · Documento' },
    micliente:    { archivo: 'MiCliente',          titulo: 'Su servicio · ECOVSA' },
    /* Los reportes a profundidad de dirección. Se llega a ellos DESDE
       Dirección, no desde el lobby: son páginas a las que se viaja. */
    /* La cartera a profundidad ya no es una página: vive dentro de la
       pestaña de Cartera del panel. La dirección vieja se queda un
       tiempo devolviendo al panel, por si alguien la tiene guardada. */
    rcartera:     { archivo: 'Inicio',             titulo: 'ECOVSA · Panel de Dirección' },
    /* Mercadeo y Tratamiento a profundidad ya no son páginas: viven
       dentro de sus pestañas del panel. La dirección vieja se queda un
       tiempo devolviendo al panel, por si alguien la tiene guardada. */
    rzona:        { archivo: 'Inicio',             titulo: 'ECOVSA · Panel de Dirección' }
  };
  paginas.campo  = { archivo: 'Index',  titulo: 'Rutas ECOVSA' };
  paginas.app    = { archivo: 'Lobby',  titulo: 'ECOVSA' };
  const p = paginas[pagina] || { archivo: 'Lobby', titulo: 'ECOVSA' };
  return HtmlService.createTemplateFromFile(p.archivo)
    .evaluate()
    .setTitle(p.titulo)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ═══════════════ UTILIDADES ═══════════════ */

/**
 * Lee una hoja pidiendo SOLO las columnas necesarias.
 * leerHoja_ arma un objeto por fila con todas las columnas; cuando solo
 * hacen falta cuatro campos, eso desperdicia tiempo y memoria.
 * Devuelve un arreglo de arreglos, en el orden pedido.
 */
function leerColumnas_(nombre, columnas) {
  const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombre);
  if (!h || h.getLastRow() < 2) return [];
  const nCol = h.getLastColumn();
  const cab = h.getRange(1, 1, 1, nCol).getValues()[0].map(String);
  const idx = columnas.map(c => cab.indexOf(c));
  if (idx.some(i => i < 0)) return null;          // falta una columna: que use leerHoja_

  const desde = Math.min.apply(null, idx);
  const hasta = Math.max.apply(null, idx);
  const bloque = h.getRange(2, desde + 1, h.getLastRow() - 1, hasta - desde + 1).getValues();
  const rel = idx.map(i => i - desde);
  return bloque.map(f => rel.map(i => f[i]));
}

function leerHoja_(nombre) {
  const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombre);
  if (!h || h.getLastRow() < 2) return [];
  const datos = h.getDataRange().getValues();
  const cab = datos.shift().map(String);
  return datos.filter(f => f.some(v => v !== '')).map(f => {
    const o = {}; cab.forEach((c, i) => o[c] = f[i]); return o;
  });
}

/* La zona horaria de la hoja puede no ser la de Panamá. Si se convierte,
   la medianoche de un día cae en el anterior y todas las fechas se corren
   un día. Se lee con la zona de la propia hoja, así lo que está en la celda
   es exactamente lo que sale. */
var _TZ_HOJA = null;
function tzHoja_() {
  if (!_TZ_HOJA) {
    try { _TZ_HOJA = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(); }
    catch (e) { _TZ_HOJA = 'America/Panama'; }
    if (!_TZ_HOJA) _TZ_HOJA = 'America/Panama';
  }
  return _TZ_HOJA;
}

function fechaISO_(v) {
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, tzHoja_(), 'yyyy-MM-dd');
  var s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  var d = new Date(s);
  if (!isNaN(d.getTime())) return Utilities.formatDate(d, tzHoja_(), 'yyyy-MM-dd');
  return s.slice(0, 10);
}

/* Sheets devuelve las celdas de hora como fecha del 30/12/1899.
   Esto las convierte a "HH:mm" y deja pasar el texto que ya venga bien. */
function horaTxt_(v) {
  if (!v && v !== 0) return '';
  if (v instanceof Date) return Utilities.formatDate(v, tzHoja_(), 'HH:mm');
  var s = String(v).trim();
  if (!s) return '';
  var m = s.match(/(\d{1,2}):(\d{2})/);       // "8:47", "08:47:00", o el engendro de 1899
  if (m) return ('0' + m[1]).slice(-2) + ':' + m[2];
  return s;
}

function hoyPanama_() {
  return Utilities.formatDate(new Date(), 'America/Panama', 'yyyy-MM-dd');
}

/* ═══════════════ API DE LA APP ═══════════════ */

function api_bootstrap(pin, fecha) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok: false, error: 'PIN no válido', requiereLogin: true };
  /* Esta pantalla no tenía filtro de rol: cualquier PIN válido que
     escribiera ?p=campo se llevaba el catálogo entero de clientes con
     direcciones y las rutas del día. La tarjeta del lobby ya decía que
     no; la puerta no lo decía. Ahora sí, y con la misma lista. */
  if (['operador','supervisor','gerente','admin','mercadeo'].indexOf(u.rol) < 0)
    return { ok: false, error: 'Esta pantalla es para operaciones.' };

  const clientes = leerHoja_(HOJA_CLI).map(c => ({
    id: Number(c.id),
    nombre: String(c.nombre || ''),
    estado: String(c.estado || ''),
    direccion: String(c.direccion || ''),
    region: String(c.region || ''),
    kg: c.kg === '' ? null : Number(c.kg),
    frecuencia: String(c.frecuencia || ''),
    ultimaVisita: fechaISO_(c.ultimaVisita),
    proximaVisita: fechaISO_(c.proximaVisita),
    diasAtraso: Number(c.diasAtraso || 0),
    contacto: String(c.contacto || ''),
    telefono: String(c.telefono || ''),
    whatsapp: String(c.whatsapp || ''),
    lat: numeroSeguro_(c.lat),
    lng: numeroSeguro_(c.lng),
    diaSemana: String(c['dias semana'] || ''),
    /* si mercadeo lo dio de baja, no debe aparecer en la ruta de nadie */
    fueraDeServicio: ['mora','cierre','retiro','pausa']
      .indexOf(String(c.situacion || 'activo').toLowerCase()) >= 0
  })).filter(c => c.id && c.nombre && !c.fueraDeServicio);

  const f = fecha || hoyPanama_();

  // ── jornada abierta: la que no tiene hora final ──
  let jornada = null;
  leerHoja_(HOJA_JOR).forEach(j => {
    if (String(j.horaFinal || '').trim()) return;
    if (String(j.conductor || '').trim().toLowerCase() !== u.nombre.trim().toLowerCase()) return;
    const fj = fechaISO_(j.fecha);
    if (!jornada || fj > jornada.fecha) {
      jornada = { jornadaId: String(j.jornadaId), fecha: fj,
                  conductor: String(j.conductor || ''), vehiculo: String(j.vehiculo || ''),
                  kmInicio: Number(j.kmInicio || 0), horaInicio: horaTxt_(j.horaInicio),
                  cerrada: false };
    }
  });

  // ── recolecciones ya registradas ese día por esta persona ──
  const idPorNombre = {};
  clientes.forEach(c => { idPorNombre[String(c.nombre).trim().toUpperCase()] = c.id; });
  const hechas = [];
  leerHoja_(HOJA_REC).forEach(r => {
    if (fechaISO_(r['Fecha de Recoleccion']) !== f) return;
    const resp = String(r.Responsable || '').trim().toLowerCase();
    if (u.rol === 'operador' && resp !== u.nombre.trim().toLowerCase()) return;
    const nom = String(r.Cliente || '').trim().toUpperCase();
    hechas.push({
      clienteId: idPorNombre[nom] || null, cliente: String(r.Cliente || ''),
      registroId: String(r.registroId || ''),
      horaInicio: horaTxt_(r['hora inicio']), horaFinal: horaTxt_(r['hora final']),
      kgBolsas: Number(r['Kg Recolectados'] || 0), cantBolsas: Number(r['cantidad bolsas'] || 0),
      kgPunzo: Number(r['kg punzo cortantes'] || 0), cantPunzo: Number(r['cantidad punzo cort'] || 0),
      kgAnatomo: Number(r['kg anatomopatologico'] || 0), cantAnatomo: Number(r['cantidad anatomo'] || 0),
      recibo: String(r['recibo numero'] || ''), manifiesto: String(r.manifiesto || ''),
      totalKg: Number(r['total Kg'] || 0)
    });
  });

  return { ok: true, usuario: u, clientes: clientes,
           rutas: rutasDe_(u, f), jornada: jornada, hechas: hechas,
           servidorFecha: hoyPanama_() };
}

function numeroSeguro_(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = (typeof v === 'number') ? v : parseFloat(String(v).trim().replace(',', '.'));
  return isFinite(n) && n !== 0 ? n : null;
}

function rutasDe_(u, fecha) {
  const filas = leerHoja_(HOJA_RUT).filter(r => fechaISO_(r.fecha) === fecha);
  const mapa = {};
  filas.forEach(r => {
    const id = String(r.rutaId);
    if (!mapa[id]) mapa[id] = { rutaId: id, fecha: fecha, conductor: String(r.conductor || ''),
                                vehiculo: String(r.vehiculo || ''), paradas: [] };
    const cid = Number(r.clienteId);
    if (mapa[id].paradas.some(p => p.clienteId === cid)) return;   // no repetir el mismo cliente
    mapa[id].paradas.push({ orden: Number(r.orden || 0), clienteId: cid });
  });
  let rutas = Object.keys(mapa).map(k => {
    mapa[k].paradas.sort((a, b) => a.orden - b.orden); return mapa[k];
  });
  if (u.rol === 'operador') {
    rutas = rutas.filter(r => r.conductor.trim().toLowerCase() === u.nombre.trim().toLowerCase());
  }
  return rutas;
}

/**
 * Agenda del operador: rutas programadas de hoy en adelante.
 * Devuelve un resumen por día para que el conductor sepa qué le viene.
 */
function api_agenda(pin, dias, desdeArg, hastaArg) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok: false, error: 'PIN no válido', requiereLogin: true };

  const hoy = hoyPanama_();
  let desde, hasta, n;

  if (desdeArg && hastaArg) {
    // rango explícito: sirve para mirar hacia atrás, no solo hacia adelante
    desde = String(desdeArg); hasta = String(hastaArg);
    if (desde > hasta) { const t = desde; desde = hasta; hasta = t; }
    n = 0;
  } else {
    n = Math.min(Math.max(Number(dias) || 7, 1), 62);
    desde = hoy;
    const tope = new Date(hoy + 'T00:00:00');
    tope.setDate(tope.getDate() + n - 1);
    hasta = Utilities.formatDate(tope, 'America/Panama', 'yyyy-MM-dd');
  }

  // nombre de cliente por id, para no mandar el catálogo completo
  // respuesta reciente guardada: la agenda cambia poco entre consultas
  const cacheKey = 'agenda_' + u.pin + '_' + desde + '_' + hasta + '_' + hoy;
  const cache = CacheService.getScriptCache();
  try {
    const guardado = cache.get(cacheKey);
    if (guardado) return JSON.parse(guardado);
  } catch (e) {}

  const nombres = {};
  const filasCli = leerColumnas_(HOJA_CLI, ['id', 'nombre']);
  if (filasCli) filasCli.forEach(f => { nombres[Number(f[0])] = String(f[1] || ''); });
  else leerHoja_(HOJA_CLI).forEach(c => { nombres[Number(c.id)] = String(c.nombre || ''); });

  // qué clientes ya se recolectaron, por fecha (para marcar lo hecho)
  const hechas = {};
  const COLS = ['Cliente', 'Fecha de Recoleccion', 'hora inicio', 'hora final',
                'Kg Recolectados', 'kg punzo cortantes', 'kg anatomopatologico',
                'recibo numero', 'Responsable', 'total Kg',
                'ajustada', 'horaBoton inicio', 'horaBoton final'];
  const filasRec = leerColumnas_(HOJA_REC, COLS);
  const guardar = (cli, f, hi, hf, kb, kp, ka, rec, resp, tot, aj, hbi, hbf) => {
    hechas[f + '|' + String(cli).trim().toUpperCase()] = {
      cliente: String(cli || ''), fecha: f, responsable: String(resp || ''),
      totalKg: Number(tot || 0), kgBolsas: Number(kb || 0),
      kgPunzo: Number(kp || 0), kgAnatomo: Number(ka || 0),
      horaInicio: horaTxt_(hi), horaFinal: horaTxt_(hf), recibo: String(rec || ''),
      ajustada: String(aj || '').toUpperCase() === 'SI',
      horaBotonInicio: horaTxt_(hbi), horaBotonFinal: horaTxt_(hbf)
    };
  };
  if (filasRec) {
    filasRec.forEach(r => {
      const f = fechaISO_(r[1]);
      if (f < desde || f > hasta) return;
      guardar(r[0], f, r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[10], r[11], r[12]);
    });
  } else {
    leerHoja_(HOJA_REC).forEach(r => {
      const f = fechaISO_(r['Fecha de Recoleccion']);
      if (f < desde || f > hasta) return;
      guardar(r.Cliente, f, r['hora inicio'], r['hora final'], r['Kg Recolectados'],
              r['kg punzo cortantes'], r['kg anatomopatologico'], r['recibo numero'],
              r.Responsable, r['total Kg'], r['ajustada'],
              r['horaBoton inicio'], r['horaBoton final']);
    });
  }

  const porDia = {};
  leerHoja_(HOJA_RUT).forEach(r => {
    const f = fechaISO_(r.fecha);
    if (f < desde || f > hasta) return;
    const cond = String(r.conductor || '');
    if (u.rol === 'operador' && cond.trim().toLowerCase() !== u.nombre.trim().toLowerCase()) return;

    const k = f + '|' + cond;
    if (!porDia[k]) porDia[k] = { fecha: f, clave: k, rutaId: String(r.rutaId), conductor: cond,
                                  vehiculo: String(r.vehiculo || ''), paradas: [] };
    const id = Number(r.clienteId);
    if (porDia[k].paradas.some(p => p.clienteId === id)) return;   // ruta vieja con el cliente repetido
    const nom = nombres[id] || ('Cliente ' + id);
    const h = hechas[f + '|' + nom.trim().toUpperCase()] || null;
    porDia[k].paradas.push({
      orden: Number(r.orden || 0), clienteId: id, nombre: nom,
      hecha: !!h,
      totalKg: h ? h.totalKg : 0,
      horaInicio: h ? h.horaInicio : '',
      horaFinal: h ? h.horaFinal : '',
      ajustada: h ? !!h.ajustada : false,
      horaBotonInicio: h ? h.horaBotonInicio : '',
      horaBotonFinal: h ? h.horaBotonFinal : '',
      recibo: h ? h.recibo : ''
    });
  });

  // ── lo que se recolectó pero ya no figura en la ruta (se republicó, o fue extra) ──
  const idPorNombre = {};
  Object.keys(nombres).forEach(id => { idPorNombre[nombres[id].trim().toUpperCase()] = Number(id); });

  Object.keys(hechas).forEach(clave => {
    const h = hechas[clave];
    if (u.rol === 'operador' &&
        h.responsable.trim().toLowerCase() !== u.nombre.trim().toLowerCase()) return;

    const nomU = h.cliente.trim().toUpperCase();
    // ¿ya aparece en alguna ruta de ese día?
    const yaEsta = Object.keys(porDia).some(k3 =>
      porDia[k3].fecha === h.fecha &&
      porDia[k3].paradas.some(p => p.nombre.trim().toUpperCase() === nomU));
    if (yaEsta) return;

    const k4 = h.fecha + '|' + h.responsable;
    if (!porDia[k4]) porDia[k4] = { fecha: h.fecha, clave: k4, rutaId: '', conductor: h.responsable,
                                    vehiculo: '', paradas: [] };
    porDia[k4].paradas.push({
      orden: -1,                       // van primero: se hicieron antes
      clienteId: idPorNombre[nomU] || null,
      nombre: h.cliente, hecha: true, fueraDeRuta: true,
      totalKg: h.totalKg, horaInicio: h.horaInicio, horaFinal: h.horaFinal, recibo: h.recibo
    });
  });

  const dias_ = Object.keys(porDia).sort().map(k2 => {
    const d = porDia[k2];
    d.paradas.sort((a, b) => a.orden - b.orden);
    d.total = d.paradas.length;
    d.completadas = d.paradas.filter(p => p.hecha).length;
    d.totalKg = Math.round(d.paradas.reduce((a, p) => a + (p.totalKg || 0), 0) * 100) / 100;
    d.kgBio = 0; d.kgPunzo = 0; d.kgAnatomo = 0;
    d.paradas.forEach(p => {
      const h = hechas[d.fecha + '|' + p.nombre.trim().toUpperCase()];
      if (h) { d.kgBio += h.kgBolsas; d.kgPunzo += h.kgPunzo; d.kgAnatomo += h.kgAnatomo; }
    });
    d.kgBio = Math.round(d.kgBio * 100) / 100;
    d.kgPunzo = Math.round(d.kgPunzo * 100) / 100;
    d.kgAnatomo = Math.round(d.kgAnatomo * 100) / 100;
    const horas = d.paradas.filter(p => p.horaInicio).map(p => p.horaInicio).sort();
    const fines = d.paradas.filter(p => p.horaFinal).map(p => p.horaFinal).sort();
    d.primera = horas.length ? horas[0] : '';
    d.ultima = fines.length ? fines[fines.length - 1] : '';
    d.minutos = (d.primera && d.ultima) ? minutosEntre_(d.primera, d.ultima) : 0;
    return d;
  });

  const res = { rutas: dias_.length, paradas: 0, hechas: 0, kg: 0 };
  dias_.forEach(d => { res.paradas += d.total; res.hechas += d.completadas; res.kg += d.totalKg; });
  res.kg = Math.round(res.kg * 100) / 100;

  const salida = { ok: true, usuario: u, hoy: hoy, desde: desde, hasta: hasta,
                   dias: dias_, resumen: res };
  try { cache.put(cacheKey, JSON.stringify(salida), 45); } catch (e) {}
  return salida;
}

function api_getRutas(pin, fecha) {
  const u = usuarioPorPin_(pin);
  if (!u) return [];
  return rutasDe_(u, fecha || hoyPanama_());
}

function api_guardarRuta(pin, ruta) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok: false, error: 'PIN no válido' };
  if (!esSupervisor_(u)) return { ok: false, error: 'Solo un supervisor puede planificar rutas.' };

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_RUT);
    const rutaId = ruta.rutaId || ('R' + new Date().getTime());
    const datos = h.getDataRange().getValues();
    const cond = String(ruta.conductor || '').trim().toLowerCase();
    for (let i = datos.length - 1; i >= 1; i--) {
      const mismoId = String(datos[i][0]) === String(rutaId);
      // un operador no puede tener dos rutas el mismo día: la nueva reemplaza a la vieja
      const mismoDia = fechaISO_(datos[i][1]) === String(ruta.fecha) &&
                       String(datos[i][2] || '').trim().toLowerCase() === cond;
      if (mismoId || mismoDia) h.deleteRow(i + 1);
    }
    // el mismo cliente no puede ir dos veces en la misma ruta
    const vistos = {};
    const paradas = (ruta.paradas || []).filter(p => {
      const k = String(p.clienteId);
      if (vistos[k]) return false;
      vistos[k] = 1; return true;
    });
    const repetidos = (ruta.paradas || []).length - paradas.length;
    const ahora = new Date();
    const filas = paradas.map((p, i) =>
      [rutaId, ruta.fecha, ruta.conductor, ruta.vehiculo, i + 1, p.clienteId, u.nombre, ahora]);
    if (filas.length) h.getRange(h.getLastRow() + 1, 1, filas.length, COLS_RUT.length).setValues(filas);
    marcar_('logistica');
    return { ok: true, rutaId: rutaId, repetidos: repetidos, total: paradas.length };
  } finally { lock.releaseLock(); }
}

function idsYaGuardados_() {
  const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_REC);
  if (!h || h.getLastRow() < 2) return [];
  return h.getRange(2, 1, h.getLastRow() - 1, 1).getValues().map(f => String(f[0])).filter(String);
}

function invalidarAgenda_(pin) {
  try {
    const c = CacheService.getScriptCache();
    const hoy = hoyPanama_();
    [1, 7, 31].forEach(n => c.remove('agenda_' + pin + '_' + n + '_' + hoy));
  } catch (e) {}
}

function api_guardarLote(pin, registros) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok: false, error: 'PIN no válido' };
  if (!registros || !registros.length) return { ok: true, guardados: [], duplicados: [] };

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return { ok: false, error: 'Sistema ocupado, intenta de nuevo.' };
  try {
    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_REC);

    /* Se escribe por NOMBRE de columna, nunca por posición: si alguien mueve
       una columna en la hoja, los datos siguen cayendo donde deben. */
    let cab = h.getRange(1, 1, 1, Math.max(h.getLastColumn(), 1)).getValues()[0].map(String);
    COLS_REC.forEach(c => {
      if (cab.indexOf(c) < 0) { h.getRange(1, cab.length + 1).setValue(c); cab.push(c); }
    });
    const col = {};
    cab.forEach((c, i) => col[c] = i);

    const existentes = {};
    idsYaGuardados_().forEach(id => existentes[id] = true);

    const nuevas = [], guardados = [], duplicados = [];
    const ahora = new Date();
    const n = v => Number(v) || 0;

    registros.forEach(r => {
      if (existentes[r.registroId]) { duplicados.push(r.registroId); return; }
      existentes[r.registroId] = true;
      guardados.push(r.registroId);

      const total = n(r.kgBolsas) + n(r.kgPunzo) + n(r.kgAnatomo);
      const fila = new Array(cab.length).fill('');
      const set = (c, v) => { if (col[c] !== undefined) fila[col[c]] = v; };

      set('registroId', r.registroId);
      set('Cliente', r.cliente);
      set('Fecha de Recoleccion', r.fecha);
      set('hora inicio', r.horaInicio || '');
      set('hora final', r.horaFinal || '');
      set('Kg Recolectados', n(r.kgBolsas));
      set('cantidad bolsas', n(r.cantBolsas));
      set('kg punzo cortantes', n(r.kgPunzo));
      set('cantidad punzo cort', n(r.cantPunzo));
      set('kg anatomopatologico', n(r.kgAnatomo));
      set('cantidad anatomo', n(r.cantAnatomo));
      set('manifiesto', r.manifiesto || '');
      set('recibo numero', r.recibo || '');
      set('Observaciones', r.obs || '');
      set('Responsable', r.responsable || u.nombre);
      set('total Kg', Math.round(total * 100) / 100);
      set('tiempo', r.tiempo || '');
      set('Mes', String(r.fecha).slice(0, 7) + '-01');
      set('Semana', r.semana || '');
      set('vehiculo', r.vehiculo || '');
      set('latRegistro', r.lat || '');
      set('lngRegistro', r.lng || '');
      set('subidoEn', ahora);
      set('horaBoton inicio', r.horaBotonInicio || '');
      set('horaBoton final', r.horaBotonFinal || '');
      set('ajustada', r.ajustada || '');
      set('firma', r.firma || '');
      set('firmante', r.firmante || '');
      set('enviado', r.enviado || '');
      /* 'acta' se deja vacía: la escribe la disposición final al sellar */

      nuevas.push(fila);
    });

    if (nuevas.length)
      h.getRange(h.getLastRow() + 1, 1, nuevas.length, cab.length).setValues(nuevas);
    invalidarAgenda_(pin);
    marcar_('logistica');
    return { ok: true, guardados: guardados, duplicados: duplicados };
  } finally { lock.releaseLock(); }
}

function minutosEntre_(a, b) {
  const p = v => {
    if (v instanceof Date) return v.getHours() * 60 + v.getMinutes();
    const m = String(v || '').match(/^(\d{1,2}):(\d{2})/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const i = p(a), f = p(b);
  if (i === null || f === null) return 0;
  let d = f - i; if (d < 0) d += 1440;
  return d > 480 ? 0 : d;
}

/* ═══════════════ ESTADOS AUTOMÁTICOS ═══════════════ */

/* ═══════════ FRECUENCIAS ═══════════
   Había cuatro listas distintas: una en el alta, otra en cartera, otra en
   prospectos y otra en el formulario del cliente. La de cartera no incluía
   DIARIA, SEMESTRAL ni ANUAL, así que un cliente con esa frecuencia abría su
   ficha con el campo EN BLANCO — y al guardar, el desplegable mandaba vacío
   y le BORRABA la frecuencia en la hoja. Sin frecuencia, el recálculo
   nocturno lo sacaba de la planificación sin avisar.

   Ahora hay una sola lista, y además se le une lo que de verdad existe en la
   hoja: si alguien escribe una frecuencia nueva directamente en el libro,
   aparece en el desplegable. La app lee lo que hay, no impone lo que cree.

   BIMESTRAL: en español, *bimensual* es dos veces al mes y *bimestral* es
   cada dos meses. Lo que ECOVSA hace es cada dos meses. Se migra el dato con
   una función del menú y el sistema sigue entendiendo el término viejo. */
const FRECUENCIAS_BASE = ['DIARIA','SEMANAL','2X SEMANA','QUINCENAL','MENSUAL',
                          'BIMESTRAL','TRIMESTRAL','SEMESTRAL','ANUAL','SERVICIO ESPECIAL'];

const DIAS_FRECUENCIA = {
  '2x semana': 3, 'semanal': 7, 'quincenal': 15, 'mensual': 30,
  'bimestral': 60, 'bimensual': 60,   // el viejo se sigue entendiendo
  'trimestral': 90, 'semestral': 180, 'anual': 365, 'diaria': 1
};

/* La lista que se le ofrece a una pantalla: lo estándar más lo que de verdad
   hay escrito en esa hoja. Recorre filas que la API ya trajo a memoria, así
   que no agrega ni una lectura. */
function frecuenciasCon_(filas, campo) {
  const vistas = [];
  (filas || []).forEach(r => {
    const v = String((r && r[campo]) || '').trim();
    if (v && FRECUENCIAS_BASE.indexOf(v.toUpperCase()) < 0 && vistas.indexOf(v) < 0)
      vistas.push(v);
  });
  return FRECUENCIAS_BASE.concat(vistas.sort());
}

function diasDeFrecuencia_(f) {
  const k = String(f || '').toLowerCase().trim();
  if (DIAS_FRECUENCIA[k]) return DIAS_FRECUENCIA[k];
  for (const n in DIAS_FRECUENCIA) if (k.indexOf(n) >= 0) return DIAS_FRECUENCIA[n];
  return null;
}

function actualizarEstadosClientes() {
  const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_CLI);
  const datos = h.getDataRange().getValues();
  const cab = datos[0].map(String);
  const col = n => cab.indexOf(n);

  const ultimas = {};
  leerHoja_(HOJA_REC).forEach(r => {
    const f = r['Fecha de Recoleccion']; if (!f) return;
    const d = (f instanceof Date) ? f : new Date(String(f) + 'T00:00:00');
    const k = String(r.Cliente || '').trim().toUpperCase();
    if (!ultimas[k] || d > ultimas[k]) ultimas[k] = d;
  });

  const hoy = new Date(); hoy.setHours(0,0,0,0);
  let cambios = 0;

  for (let i = 1; i < datos.length; i++) {
    const nombre = String(datos[i][col('nombre')] || '').trim();
    if (!nombre) continue;
    const est = String(datos[i][col('estado')] || '').toUpperCase();
    if (['SUSPENDIDO','COMPLETADO','TRATAMIENTO'].indexOf(est) >= 0) continue;
    /* a quien mercadeo sacó de servicio no se le calcula próxima visita */
    const cSit = col('situacion');
    if (cSit >= 0 && ['mora','cierre','retiro','pausa']
        .indexOf(String(datos[i][cSit] || '').toLowerCase()) >= 0) continue;
    // POR INICIAR solo se mantiene mientras NO tenga ninguna recolección registrada
    if (est === 'POR INICIAR' && !ultimas[nombre.toUpperCase()]) continue;

    const dias = diasDeFrecuencia_(datos[i][col('frecuencia')]);
    if (!dias) continue;

    const ultima = ultimas[nombre.toUpperCase()] ||
                   (datos[i][col('ultimaVisita')] ? new Date(datos[i][col('ultimaVisita')]) : null);
    if (!ultima || isNaN(ultima.getTime())) continue;

    const proxima = new Date(ultima.getTime());
    proxima.setDate(proxima.getDate() + dias);
    const atraso = Math.floor((hoy - proxima) / 86400000);

    let estado;
    if (atraso > 15) estado = 'ATRASADO';
    else if (atraso > 0) estado = 'VENCIDO';
    else if (atraso >= -3) estado = 'POR RECOLECTAR';
    else estado = 'AL DÍA';

    datos[i][col('ultimaVisita')]  = Utilities.formatDate(ultima,'America/Panama','yyyy-MM-dd');
    datos[i][col('proximaVisita')] = Utilities.formatDate(proxima,'America/Panama','yyyy-MM-dd');
    datos[i][col('diasAtraso')]    = Math.max(0, atraso);
    datos[i][col('estado')]        = estado;
    cambios++;
  }
  h.getRange(1,1,datos.length,cab.length).setValues(datos);
  return cambios;
}

function actualizarEstadosManual() {
  const n = actualizarEstadosClientes();
  SpreadsheetApp.getUi().alert(n + ' cliente(s) actualizados.\n\n' +
    'Se recalculó última visita, próxima visita, atraso y estado.\n' +
    'Los suspendidos, completados y en tratamiento no se tocan.');
}

function instalarDisparador() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'actualizarEstadosClientes') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('actualizarEstadosClientes')
    .timeBased().atHour(23).everyDays(1).inTimezone('America/Panama').create();
  SpreadsheetApp.getUi().alert('Listo. Los estados se actualizarán cada noche a las 11 pm.');
}

/* ═══════════════ UBICACIONES ═══════════════ */

function revisarUbicaciones() {
  const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_CLI);
  const datos = h.getDataRange().getValues();
  const cab = datos[0].map(String);
  const cLat = cab.indexOf('lat'), cLng = cab.indexOf('lng');
  const cNom = cab.indexOf('nombre'), cDir = cab.indexOf('direccion');

  if (cLat < 0 || cLng < 0) {
    SpreadsheetApp.getUi().alert('PROBLEMA\n\nLa hoja Clientes no tiene columnas "lat" y "lng".\n' +
      'Vuelve a importar Clientes_ECOVSA.csv con Archivo > Importar > Reemplazar hoja actual.');
    return;
  }
  let bien = 0, texto = 0, vacios = 0;
  const lista = [];
  for (let i = 1; i < datos.length; i++) {
    if (!String(datos[i][cNom] || '').trim()) continue;
    const la = datos[i][cLat];
    if (typeof la === 'number' && la !== 0) { bien++; continue; }
    if (String(la).trim() !== '' && isFinite(parseFloat(String(la).replace(',','.')))) { texto++; continue; }
    vacios++;
    if (lista.length < 12) lista.push('• ' + datos[i][cNom] + (datos[i][cDir] ? ' — ' + datos[i][cDir] : ''));
  }
  SpreadsheetApp.getUi().alert('REVISIÓN DE UBICACIONES\n\n' +
    '✓ Correctas: ' + bien + '\n' +
    (texto ? '⚠ Guardadas como texto: ' + texto + '\n' : '') +
    '✖ Sin ubicación: ' + vacios + '\n\n' +
    (texto ? 'Usa "Arreglar coordenadas de texto".\n\n' : '') +
    (vacios ? 'Sin ubicación:\n' + lista.join('\n') +
      (vacios > 12 ? '\n… y ' + (vacios - 12) + ' más' : '') +
      '\n\nUsa "Buscar ubicaciones faltantes".' : '¡Todos tienen ubicación!'));
}

function arreglarCoordenadasTexto() {
  const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_CLI);
  const datos = h.getDataRange().getValues();
  const cab = datos[0].map(String);
  const cLat = cab.indexOf('lat'), cLng = cab.indexOf('lng'), cNom = cab.indexOf('nombre');
  if (cLat < 0 || cLng < 0) { SpreadsheetApp.getUi().alert('No encuentro las columnas lat y lng.'); return; }

  let arreglados = 0, escalados = 0, imposibles = 0;
  const dudosos = [];

  for (let i = 1; i < datos.length; i++) {
    if (!String(datos[i][cNom] || '').trim()) continue;
    let la = parseFloat(String(datos[i][cLat]).replace(',', '.'));
    let ln = parseFloat(String(datos[i][cLng]).replace(',', '.'));
    if (!isFinite(la) || !isFinite(ln) || la === 0) continue;

    const original = (typeof datos[i][cLat] === 'number' && Math.abs(la) <= 90);

    // Corrige el punto decimal perdido al importar.
    // Panamá está entre 7 y 10 de latitud, y entre -77 y -84 de longitud.
    let vueltas = 0;
    while (Math.abs(la) > 10.5 && vueltas < 9) { la = la / 10; vueltas++; }
    vueltas = 0;
    while (Math.abs(ln) > 84 && vueltas < 9) { ln = ln / 10; vueltas++; }

    const laOk = la >= 7 && la <= 10.2;
    const lnOk = ln <= -77 && ln >= -83.5;

    if (!laOk || !lnOk) {
      imposibles++;
      if (dudosos.length < 10) dudosos.push('• ' + datos[i][cNom]);
      continue;
    }

    la = Math.round(la * 1e6) / 1e6;
    ln = Math.round(ln * 1e6) / 1e6;
    if (la !== datos[i][cLat] || ln !== datos[i][cLng]) {
      if (!original) escalados++;
      datos[i][cLat] = la; datos[i][cLng] = ln;
      arreglados++;
    }
  }

  h.getRange(1, 1, datos.length, cab.length).setValues(datos);
  h.getRange(2, cLat + 1, datos.length - 1, 2).setNumberFormat('0.000000');

  SpreadsheetApp.getUi().alert(
    'COORDENADAS CORREGIDAS\n\n' +
    '✓ Arregladas: ' + arreglados + '\n' +
    (imposibles ? '⚠ No se pudieron corregir: ' + imposibles + '\n' + dudosos.join('\n') +
      '\n\nEsas quedaron como estaban. Ubícalas a mano en el mapa de la app.\n' : '') +
    '\nAhora corre "Verificar ubicaciones en Google Maps" y revisa un par ' +
    'de clientes que conozcas bien.\n\n' +
    'IMPORTANTE: en la app, toca el botón "Actualizar" para que el celular ' +
    'baje las coordenadas corregidas.');
}

function buscarUbicacionesFaltantes() {
  const ui = SpreadsheetApp.getUi();
  if (ui.alert('Buscar ubicaciones',
    'Buscaré en Google Maps la ubicación de los clientes que no la tienen, usando su dirección escrita.\n\n' +
    'Los resultados son APROXIMADOS: revísalos en el mapa antes de mandar a un operador.\n\n¿Continuar?',
    ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_CLI);
  const datos = h.getDataRange().getValues();
  const cab = datos[0].map(String);
  const cLat = cab.indexOf('lat'), cLng = cab.indexOf('lng');
  const cNom = cab.indexOf('nombre'), cDir = cab.indexOf('direccion');
  let cVer = cab.indexOf('ubicacionVerificar');
  if (cVer < 0) {
    cVer = cab.length; cab.push('ubicacionVerificar');
    h.getRange(1, cVer + 1).setValue('ubicacionVerificar').setFontWeight('bold').setBackground('#F5B301');
  }

  const geo = Maps.newGeocoder().setRegion('pa');
  let hallados = 0, fallidos = 0; const noHallados = [];

  for (let i = 1; i < datos.length; i++) {
    if (!String(datos[i][cNom] || '').trim()) continue;
    const laAct = parseFloat(String(datos[i][cLat]).replace(',','.'));
    if (isFinite(laAct) && laAct !== 0) continue;
    const dir = String(datos[i][cDir] || '').trim();
    if (!dir || dir === '0' || dir === '—') { fallidos++; noHallados.push(datos[i][cNom] + ' (sin dirección)'); continue; }
    try {
      const res = geo.geocode(dir + ', Panamá');
      if (res.status === 'OK' && res.results.length) {
        const loc = res.results[0].geometry.location;
        datos[i][cLat] = Math.round(loc.lat * 1e6) / 1e6;
        datos[i][cLng] = Math.round(loc.lng * 1e6) / 1e6;
        while (datos[i].length <= cVer) datos[i].push('');
        datos[i][cVer] = 'REVISAR — ' + res.results[0].formatted_address;
        hallados++;
      } else { fallidos++; noHallados.push(String(datos[i][cNom])); }
    } catch (e) { fallidos++; noHallados.push(String(datos[i][cNom])); }
    Utilities.sleep(250);
  }
  const ancho = Math.max(cab.length, ...datos.map(f => f.length));
  datos.forEach(f => { while (f.length < ancho) f.push(''); });
  h.getRange(1,1,datos.length,ancho).setValues(datos);

  ui.alert('BÚSQUEDA TERMINADA\n\n✓ Encontrados: ' + hallados + '\n✖ No encontrados: ' + fallidos +
    (hallados ? '\n\nQuedaron marcados "REVISAR" en la última columna. Confírmalos en el mapa.' : '') +
    (noHallados.length ? '\n\nSin resultado:\n• ' + noHallados.slice(0,15).join('\n• ') : ''));
}


/**
 * Escribe en la columna "verEnMapa" la URL directa de cada cliente.
 * Google Sheets la vuelve clicable sola — no usamos fórmulas para
 * evitar problemas con la configuración regional de la hoja.
 */
function crearEnlacesVerificacion() {
  const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_CLI);
  const datos = h.getDataRange().getValues();
  const cab = datos[0].map(String);
  const cLat = cab.indexOf('lat'), cLng = cab.indexOf('lng'), cNom = cab.indexOf('nombre');
  if (cLat < 0 || cLng < 0) { SpreadsheetApp.getUi().alert('No encuentro las columnas lat y lng.'); return; }

  let cVer = cab.indexOf('verEnMapa');
  if (cVer < 0) { cVer = cab.length; cab.push('verEnMapa'); }

  const columna = [['verEnMapa']];
  let n = 0;
  for (let i = 1; i < datos.length; i++) {
    if (!String(datos[i][cNom] || '').trim()) { columna.push(['']); continue; }
    const la = parseFloat(String(datos[i][cLat]).replace(',', '.'));
    const ln = parseFloat(String(datos[i][cLng]).replace(',', '.'));
    if (isFinite(la) && isFinite(ln) && la !== 0) {
      columna.push(['https://www.google.com/maps/search/?api=1&query=' + la + ',' + ln]);
      n++;
    } else {
      columna.push(['sin coordenadas']);
    }
  }
  h.getRange(1, cVer + 1, columna.length, 1).setValues(columna);
  h.getRange(1, cVer + 1).setFontWeight('bold').setBackground('#1F6FB2').setFontColor('#FFFFFF');
  h.setColumnWidth(cVer + 1, 260);

  SpreadsheetApp.getUi().alert(
    n + ' enlace(s) escritos en la columna "verEnMapa".\n\n' +
    'Haz clic en cualquiera para abrirlo en Google Maps y confirmar ' +
    'si cae donde debe.\n\n' +
    'Empieza por los clientes de Colón y de fuera de la ciudad: son los ' +
    'más propensos a haber quedado mal ubicados.');
}

/**
 * Muestra las coordenadas de los primeros clientes con su dirección.
 * Sirve para copiar el texto y detectar el patrón del error.
 */
function diagnosticoUbicaciones() {
  const filas = leerHoja_(HOJA_CLI).filter(c => String(c.nombre || '').trim()).slice(0, 20);
  const txt = filas.map(c => {
    const la = String(c.lat), ln = String(c.lng);
    return c.nombre + '\n   dir: ' + (c.direccion || '—') +
           '\n   lat/lng: ' + (la || 'vacío') + ' , ' + (ln || 'vacío') +
           '   [' + (c.region || 'sin región') + ']';
  }).join('\n\n');

  const html = HtmlService.createHtmlOutput(
    '<div style="font-family:monospace;font-size:12px;white-space:pre-wrap;padding:8px">' +
    txt.replace(/&/g,'&amp;').replace(/</g,'&lt;') + '</div>')
    .setWidth(560).setHeight(460);
  SpreadsheetApp.getUi().showModalDialog(html, 'Primeros 20 clientes — selecciona y copia');
}


/* ═══════════════ PLUS CODES ═══════════════
   Convierte los Plus Codes de Google Maps (ej: 2F6R+C5) a
   coordenadas. Puedes pegarlos en la columna "direccion" o crear
   una columna "pluscode" — el sistema los encuentra en cualquiera.
*/

var OLC_A = '23456789CFGHJMPQRVWX';
var OLC_PRES = [20.0, 1.0, 0.05, 0.0025, 0.000125];

function olcDecode_(code) {
  var c = String(code || '').toUpperCase().replace(/\+/g, '').replace(/0+$/, '');
  var lat = -90, lng = -180, latRes = 400, lngRes = 400, i;
  var n = Math.min(c.length, 10);
  for (i = 0; i < n; i += 2) {
    latRes = OLC_PRES[i / 2]; lngRes = OLC_PRES[i / 2];
    lat += OLC_A.indexOf(c.charAt(i)) * latRes;
    if (i + 1 < c.length) lng += OLC_A.indexOf(c.charAt(i + 1)) * lngRes;
  }
  if (c.length > 10) {
    var gLat = latRes, gLng = lngRes;
    var g = Math.min(c.length - 10, 5);
    for (i = 0; i < g; i++) {
      var d = OLC_A.indexOf(c.charAt(10 + i));
      gLat = gLat / 5; gLng = gLng / 4;
      lat += Math.floor(d / 4) * gLat;
      lng += (d % 4) * gLng;
    }
    latRes = gLat; lngRes = gLng;
  }
  return { lat: lat + latRes / 2, lng: lng + lngRes / 2 };
}

function olcRecover_(shortCode, refLat, refLng) {
  var s = String(shortCode || '').toUpperCase().trim();
  var sep = s.indexOf('+');
  if (sep < 0) return null;
  if (sep === 8) return olcDecode_(s);
  var faltan = 8 - sep;
  var res = Math.pow(20, 2 - (faltan / 2));
  var mitad = res / 2;

  function enc(v, max) {
    var out = '', val = v + max;
    for (var k = 0; k < 5; k++) {
      var p = OLC_PRES[k], d = Math.floor(val / p);
      out += OLC_A.charAt(d); val -= d * p;
    }
    return out;
  }
  var latRef = enc(refLat, 90), lngRef = enc(refLng, 180), pre = '';
  for (var k = 0; k < faltan / 2; k++) pre += latRef.charAt(k) + lngRef.charAt(k);

  var full = pre + s.replace('+', '');
  full = full.substring(0, 8) + '+' + full.substring(8);
  var d = olcDecode_(full);
  if (refLat + mitad < d.lat && d.lat - res >= -90) d.lat -= res;
  else if (refLat - mitad > d.lat && d.lat + res <= 90) d.lat += res;
  if (refLng + mitad < d.lng) d.lng -= res;
  else if (refLng - mitad > d.lng) d.lng += res;
  return d;
}

/** Punto de referencia según la región, para resolver Plus Codes cortos. */
function refDeRegion_(texto) {
  var t = String(texto || '').toUpperCase();
  if (t.indexOf('CHORRERA') >= 0)  return [8.880, -79.783];
  if (t.indexOf('COLON') >= 0 || t.indexOf('COLÓN') >= 0) return [9.355, -79.900];
  if (t.indexOf('ARRAIJ') >= 0)    return [8.951, -79.663];
  if (t.indexOf('OESTE') >= 0)     return [8.920, -79.720];
  if (t.indexOf('ESTE') >= 0)      return [9.080, -79.390];
  if (t.indexOf('NORTE') >= 0)     return [9.070, -79.520];
  if (t.indexOf('PENONOM') >= 0 || t.indexOf('COBRE') >= 0) return [8.520, -80.360];
  return [8.985, -79.520];   // Ciudad de Panamá
}

function convertirPlusCodes() {
  var h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_CLI);
  var datos = h.getDataRange().getValues();
  var cab = datos[0].map(String);
  var cLat = cab.indexOf('lat'), cLng = cab.indexOf('lng');
  var cNom = cab.indexOf('nombre'), cDir = cab.indexOf('direccion');
  var cReg = cab.indexOf('region'), cPC = cab.indexOf('pluscode');
  if (cLat < 0 || cLng < 0) { SpreadsheetApp.getUi().alert('No encuentro las columnas lat y lng.'); return; }

  var re = /\b([23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3})\b/;
  var n = 0, yaTenian = 0;
  var hechos = [];

  for (var i = 1; i < datos.length; i++) {
    if (!String(datos[i][cNom] || '').trim()) continue;

    var laAct = parseFloat(String(datos[i][cLat]).replace(',', '.'));
    var teniaCoord = isFinite(laAct) && Math.abs(laAct) > 6 && Math.abs(laAct) < 11;

    var fuente = (cPC >= 0 ? String(datos[i][cPC] || '') + ' ' : '') + String(datos[i][cDir] || '');
    var m = re.exec(fuente.toUpperCase());
    if (!m) continue;
    if (teniaCoord) { yaTenian++; continue; }

    var ref = refDeRegion_(String(datos[i][cDir] || '') + ' ' + (cReg >= 0 ? datos[i][cReg] : ''));
    var d = olcRecover_(m[1], ref[0], ref[1]);
    if (!d) continue;

    datos[i][cLat] = Math.round(d.lat * 1e6) / 1e6;
    datos[i][cLng] = Math.round(d.lng * 1e6) / 1e6;
    n++;
    if (hechos.length < 10) hechos.push('• ' + datos[i][cNom] + '  (' + m[1] + ')');
  }

  h.getRange(1, 1, datos.length, cab.length).setValues(datos);
  h.getRange(2, cLat + 1, datos.length - 1, 2).setNumberFormat('0.000000');

  SpreadsheetApp.getUi().alert(
    'PLUS CODES CONVERTIDOS\n\n' +
    '✓ Convertidos: ' + n + '\n' +
    (yaTenian ? '· Ya tenían coordenadas (no se tocaron): ' + yaTenian + '\n' : '') +
    (hechos.length ? '\n' + hechos.join('\n') + '\n' : '') +
    '\nPara agregar un cliente nuevo: pega su Plus Code en la columna ' +
    '"direccion" (o crea una columna "pluscode") y vuelve a correr esta opción.\n\n' +
    'No olvides tocar "Actualizar" en la app.');
}


/* ═══════════════ ALTA DE CLIENTES (mercadeo → agenda) ═══════════════ */

/** Listas para armar los desplegables del formulario. */
function api_altaBootstrap(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok: false, error: 'PIN no válido', requiereLogin: true };
  if (['mercadeo', 'supervisor', 'admin', 'gerente'].indexOf(u.rol) < 0)
    return { ok: false, error: 'Esta pantalla es para mercadeo y supervisores.' };

  const filasCli = leerHoja_(HOJA_CLI);
  const clientes = filasCli.map(c => String(c.nombre || '').trim()).filter(String);

  return {
    ok: true, usuario: u,
    frecuencias: frecuenciasCon_(filasCli, 'frecuencia'),
    zonas: ['CENTRO CIUDAD','PANAMÁ ESTE','PANAMÁ OESTE','PANAMÁ NORTE','COLON','CHORRERA','OTRA'],
    clientesExistentes: clientes,
    /* Mercadeo ya no revisa: eso vive en Logística, que es donde se ubica
       al cliente. Aquí solo se ve en qué quedó lo que uno mandó. */
    mias: solicitudesDe_(u.nombre)
  };
}

/* ── Los clientes nuevos que esperan revisión de logística ────────────
   Vive aquí y no en la pantalla de mercadeo porque el trabajo es de
   logística: confirmar la dirección, ubicar el punto y ver que el nombre
   cuadre con el de los recibos. Mercadeo tocaba el timbre y también tenía
   que abrir la puerta. */
function api_clientesPorRevisar(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!esSupervisor_(u) && u.rol !== 'gerente')
    return { ok:false, error:'Revisar clientes nuevos es de supervisión.' };

  const pendientes = solicitudesPendientes_();
  const hoy = hoyPanama_();
  pendientes.forEach(s => {
    s.diasEsperando = s.fechaSolicitud
      ? Math.round((new Date(hoy + 'T00:00:00') - new Date(s.fechaSolicitud + 'T00:00:00')) / 86400000)
      : 0;
  });
  /* el que más lleva esperando, primero: es el que ya firmó y sigue sin servicio */
  pendientes.sort((a, b) => b.diasEsperando - a.diasEsperando);

  return { ok:true, usuario:u, hoy:hoy, pendientes:pendientes,
           total: pendientes.length,
           masViejo: pendientes.length ? pendientes[0].diasEsperando : 0,
           frecuencias: frecuenciasCon_(leerHoja_(HOJA_CLI), 'frecuencia'),
           zonas: ['CENTRO CIUDAD','PANAMÁ ESTE','PANAMÁ OESTE','PANAMÁ NORTE',
                   'COLON','CHORRERA','OTRA'] };
}

function solicitudesPendientes_() {
  return leerHoja_(HOJA_SOL)
    .filter(s => String(s.estado || '').toUpperCase() === 'PENDIENTE')
    .map(mapSolicitud_);
}

function solicitudesDe_(nombre) {
  const hoy = hoyPanama_();
  return leerHoja_(HOJA_SOL)
    .filter(s => String(s.registradoPor || '').trim().toLowerCase() === String(nombre).trim().toLowerCase())
    .map(mapSolicitud_)
    .map(s => {
      /* los días solo cuentan mientras espera: en una ya revisada, el número
         no dice nada y confunde */
      s.diasEsperando = (String(s.estado || '').toUpperCase() === 'PENDIENTE' && s.fechaSolicitud)
        ? Math.round((new Date(hoy + 'T00:00:00') - new Date(s.fechaSolicitud + 'T00:00:00')) / 86400000)
        : 0;
      return s;
    })
    .slice(-15).reverse();
}

function mapSolicitud_(s) {
  return {
    solicitudId: String(s.solicitudId || ''),
    fechaSolicitud: fechaISO_(s.fechaSolicitud),
    empresa: String(s.empresa || ''),
    razonSocial: String(s.razonSocial || ''),
    contacto: String(s.contacto || ''),
    cargo: String(s.cargo || ''),
    telefono: String(s.telefono || ''),
    celular: String(s.celular || ''),
    correo: String(s.correo || ''),
    direccion: String(s.direccion || ''),
    zona: String(s.zona || ''),
    frecuencia: String(s.frecuencia || ''),
    kgMax: s.kgMax === '' ? '' : Number(s.kgMax),
    inicioRecoleccion: fechaISO_(s.inicioRecoleccion),
    plusCode: String(s.plusCode || ''),
    notas: String(s.notas || ''),
    registradoPor: String(s.registradoPor || ''),
    estado: String(s.estado || ''),
    motivo: String(s.motivo || ''),
    /* Quién lo revisó y cuándo. Sin esto, mercadeo ve «aprobada» y tiene
       que preguntar quién y qué día — que es justo la llamada que sobra. */
    procesadaPor: String(s.procesadaPor || ''),
    procesadaEn: fechaISO_(s.procesadaEn) || String(s.procesadaEn || ''),
    /* La ficha comercial viaja hasta la pantalla de aprobación. No para
       que se edite ahí —el precio lo pone mercadeo, no quien aprueba—
       sino para que quien aprueba VEA lo que está dejando entrar. */
    ruc: String(s.ruc || ''), dv: String(s.dv || ''),
    sector: String(s.sector || ''), provincia: String(s.provincia || ''),
    codigoPropuesta: String(s.codigoPropuesta || ''),
    tipoServicio: String(s.tipoServicio || ''),
    planCosto: s.planCosto === '' || s.planCosto === undefined ? '' : Number(s.planCosto),
    planKg: s.planKg === '' || s.planKg === undefined ? '' : Number(s.planKg),
    tarifaKgAdic: s.tarifaKgAdic === '' || s.tarifaKgAdic === undefined ? '' : Number(s.tarifaKgAdic),
    tarifaVisitaAdic: s.tarifaVisitaAdic === '' || s.tarifaVisitaAdic === undefined ? '' : Number(s.tarifaVisitaAdic),
    contrato: String(s.contrato || ''), fechaContrato: fechaISO_(s.fechaContrato),
    plazoContrato: String(s.plazoContrato || ''), vencimiento: fechaISO_(s.vencimiento),
    horarioRecoleccion: String(s.horarioRecoleccion || ''),
    diasSemana: String(s.diasSemana || ''),
    retieneItbms: String(s.retieneItbms || ''),
    facturacion: String(s.facturacion || ''),
    canalEnvio: String(s.canalEnvio || '')
  };
}

/** Mercadeo envía un cliente nuevo. Queda PENDIENTE de tu aprobación. */
function api_guardarSolicitud(pin, d) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok: false, error: 'PIN no válido' };
  if (['mercadeo', 'supervisor', 'admin'].indexOf(u.rol) < 0)
    return { ok: false, error: 'No tienes permiso para registrar clientes.' };
  if (!String(d.empresa || '').trim()) return { ok: false, error: 'Falta el nombre de la empresa.' };

  const nombre = String(d.empresa).trim();

  // avisa si ya existe uno parecido en la cartera, pero no bloquea: puede ser
  // una sucursal nueva del mismo grupo, y eso es legítimo
  const existentes = leerHoja_(HOJA_CLI).map(c => String(c.nombre || '').trim().toUpperCase());
  const duplicado = existentes.indexOf(nombre.toUpperCase()) >= 0;

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    /* ── Una solicitud PENDIENTE por cliente ──────────────────────────
       Esto sí bloquea, y es distinto del aviso de arriba. Dos envíos del
       mismo nombre esperando aprobación no son dos clientes: son el mismo
       formulario mandado dos veces —doble clic, o alguien que no vio que
       ya lo había enviado—. Lo que llegaba era la bandeja del supervisor
       con la misma alta repetida, y él aprobando el mismo cliente dos
       veces sin manera de saberlo.

       Se compara dentro del candado, con la hoja fresca. Una solicitud ya
       APROBADA o DEVUELTA no estorba: esa ya se atendió. */
    const pendiente = leerHoja_(HOJA_SOL).find(x =>
      String(x.estado || '').trim().toUpperCase() === 'PENDIENTE' &&
      String(x.empresa || '').trim().toUpperCase() === nombre.toUpperCase());
    if (pendiente) {
      return { ok:false, yaEnviada:true,
               solicitudId: String(pendiente.solicitudId || ''),
               error:'«' + nombre + '» ya está con logística esperando revisión' +
                     (fechaISO_(pendiente.fechaSolicitud)
                        ? ' desde el ' + fechaISO_(pendiente.fechaSolicitud) : '') +
                     '. No se envió otra vez.' };
    }

    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_SOL);
    asegurarColumnas_(h, COLS_SOL);
    const id = 'S' + Utilities.formatDate(new Date(), 'America/Panama', 'yyMMdd') +
               '-' + String(h.getLastRow()).padStart(3, '0');

    /* La fila se arma POR NOMBRE DE COLUMNA, leyendo el encabezado real de
       la hoja. Antes era una lista de 21 valores en posición fija: el día
       que se agrega una columna en medio, o alguien mueve una a mano,
       todos los datos entran corridos y nadie lo nota hasta que un teléfono
       aparece en la casilla del correo. */
    const fila = {
      solicitudId:id, fechaSolicitud:hoyPanama_(), empresa:nombre,
      razonSocial:d.razonSocial || '', contacto:d.contacto || '', cargo:d.cargo || '',
      telefono:d.telefono || '', celular:d.celular || '', correo:d.correo || '',
      direccion:d.direccion || '', zona:d.zona || '', frecuencia:d.frecuencia || '',
      kgMax:d.kgMax || '', inicioRecoleccion:d.inicioRecoleccion || '',
      plusCode:d.plusCode || '', notas:d.notas || '',
      registradoPor:u.nombre, estado:'PENDIENTE', motivo:'', procesadaEn:'', procesadaPor:'',
      ruc:d.ruc || '', dv:d.dv || '', sector:d.sector || '', provincia:d.provincia || '',
      codigoPropuesta:d.codigoPropuesta || '', tipoServicio:d.tipoServicio || '',
      planCosto:d.planCosto || '', planKg:d.planKg || '',
      tarifaKgAdic:d.tarifaKgAdic || '', tarifaVisitaAdic:d.tarifaVisitaAdic || '',
      contrato:d.contrato || '', fechaContrato:d.fechaContrato || '',
      plazoContrato:d.plazoContrato || '', vencimiento:d.vencimiento || '',
      horarioRecoleccion:d.horarioRecoleccion || '', diasSemana:d.diasSemana || '',
      retieneItbms:d.retieneItbms || '', facturacion:d.facturacion || '',
      canalEnvio:d.canalEnvio || ''
    };
    const cab = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0].map(String);
    h.appendRow(cab.map(c => (fila[c] !== undefined ? fila[c] : '')));
    marcar_('mercadeo');
    return { ok: true, solicitudId: id, duplicado: duplicado };
  } finally { lock.releaseLock(); }
}

/**
 * El supervisor aprueba: la solicitud pasa a la hoja Clientes.
 * Puede corregir cualquier dato y agregar el Plus Code o las coordenadas.
 */
function api_aprobarSolicitud(pin, solicitudId, ajustes) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok: false, error: 'PIN no válido' };
  if (!esSupervisor_(u)) return { ok: false, error: 'Solo un supervisor puede aprobar.' };

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hs = ss.getSheetByName(HOJA_SOL);
    const datos = hs.getDataRange().getValues();
    const cab = datos[0].map(String);
    const cId = cab.indexOf('solicitudId'), cEst = cab.indexOf('estado');

    let fila = -1;
    for (let i = 1; i < datos.length; i++) {
      if (String(datos[i][cId]) === String(solicitudId)) { fila = i; break; }
    }
    if (fila < 0) return { ok: false, error: 'No encuentro esa solicitud.' };
    if (String(datos[fila][cEst]).toUpperCase() !== 'PENDIENTE')
      return { ok: false, error: 'Esa solicitud ya fue procesada.' };

    const a = ajustes || {};
    const nombre = String(a.nombre || datos[fila][cab.indexOf('empresa')]).trim();
    const zona = String(a.zona || datos[fila][cab.indexOf('zona')] || 'SIN REGIÓN');

    // resuelve la ubicación: coordenadas directas, o Plus Code
    let lat = '', lng = '';
    if (a.lat && a.lng) {
      lat = Number(String(a.lat).replace(',', '.'));
      lng = Number(String(a.lng).replace(',', '.'));
    } else {
      const pc = String(a.plusCode || datos[fila][cab.indexOf('plusCode')] || '').trim();
      const m = /([23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3})/i.exec(pc.toUpperCase());
      if (m) {
        const ref = refDeRegion_(zona + ' ' + (a.direccion || ''));
        const d = olcRecover_(m[1], ref[0], ref[1]);
        if (d) { lat = Math.round(d.lat * 1e6) / 1e6; lng = Math.round(d.lng * 1e6) / 1e6; }
      }
    }

    // crea el cliente
    const hc = ss.getSheetByName(HOJA_CLI);
    const dc = hc.getDataRange().getValues();
    const cc = dc[0].map(String);
    let maxId = 0;
    for (let i = 1; i < dc.length; i++) {
      const n = Number(dc[i][cc.indexOf('id')]);
      if (n > maxId) maxId = n;
    }
    /* Se aseguran las columnas ANTES de escribir: la ficha comercial trae
       campos que una hoja Clientes vieja todavía no tiene, y sin esto se
       escribirían al vacío sin avisar. */
    asegurarColumnas_(hc, CAMPOS_CARTERA);
    const cc2 = hc.getRange(1, 1, 1, hc.getLastColumn()).getValues()[0].map(String);

    const sol = (c) => { const k = cab.indexOf(c); return k >= 0 ? datos[fila][k] : ''; };
    const nuevo = new Array(cc2.length).fill('');
    function set(col, val) { const k = cc2.indexOf(col); if (k >= 0) nuevo[k] = val; }

    set('id', maxId + 1);
    set('nombre', nombre);
    set('estado', 'POR INICIAR');
    set('direccion', String(a.direccion || sol('direccion') || ''));
    set('region', zona);
    set('kg', a.kg || sol('kgMax') || '');
    set('frecuencia', String(a.frecuencia || sol('frecuencia') || ''));
    set('proximaVisita', fechaISO_(a.inicioRecoleccion || sol('inicioRecoleccion') || ''));
    set('diasAtraso', 0);
    set('contacto', String(sol('contacto') || ''));
    set('telefono', String(sol('celular') || sol('telefono') || ''));
    set('lat', lat);
    set('lng', lng);

    /* ── Lo que antes se quedaba en la solicitud ──────────────────────
       Estos cinco YA estaban en la hoja Solicitudes y no se copiaban: el
       cliente nacía sin razón social, sin correo y sin fecha de inicio.
       La fecha de inicio se usaba solo para calcular la próxima visita y
       después se tiraba, por eso `inicio recoleccion` salía vacía —y con
       ella el distintivo salía sin la fecha que el MINSA verifica. */
    set('razon social', String(sol('razonSocial') || ''));
    set('correo', String(sol('correo') || ''));
    set('whatsapp', String(sol('celular') || ''));
    set('inicio recoleccion', fechaISO_(a.inicioRecoleccion || sol('inicioRecoleccion') || ''));
    set('notas comerciales', String(sol('notas') || ''));

    /* ── Y lo que nunca salía de la propuesta ─────────────────────────
       Sin esto el cliente entra sin plan, sin tarifas, sin contrato y sin
       vencimiento, y alguien tiene que ir a copiarlos a mano. */
    set('ruc', String(sol('ruc') || ''));
    set('dv', String(sol('dv') || ''));
    set('clienteRef', String(sol('codigoPropuesta') || ''));
    set('plan costo', sol('planCosto') || '');
    set('plan kg', sol('planKg') || '');
    set('tarifa kg adic', sol('tarifaKgAdic') || '');
    set('tarifa visita adic', sol('tarifaVisitaAdic') || '');
    set('contrato', String(sol('contrato') || ''));
    set('vencimiento', fechaISO_(sol('vencimiento')));
    set('canal', String(sol('canalEnvio') || ''));
    set('facturacion', String(sol('facturacion') || ''));
    set('retiene itbms', String(sol('retieneItbms') || ''));
    set('dias semana', String(sol('diasSemana') || ''));
    /* Una visita única no es cartera recurrente: se cotiza, se hace y se
       cobra una vez. Marcarla desde el principio evita que después aparezca
       como cliente moroso de un servicio mensual que nunca tuvo. */
    set('modalidad', /UNICA|ÚNICA|ESPECIAL/i.test(String(sol('tipoServicio') || '')) ? 'servicio' : '');
    set('tipo cartera', 'recurrente');

    hc.appendRow(nuevo);

    /* qué quedó vacío, para poder decírselo a quien aprobó en vez de que
       lo descubra semanas después al querer facturar */
    const CLAVE_FACTURAR = [['ruc','RUC'], ['correo','correo'], ['plan costo','costo del plan'],
                            ['contrato','número de contrato'], ['vencimiento','vencimiento']];
    const faltantes = CLAVE_FACTURAR
      .filter(z => !String(nuevo[cc2.indexOf(z[0])] || '').trim()).map(z => z[1]);

    // marca la solicitud
    hs.getRange(fila + 1, cEst + 1).setValue('APROBADA');
    hs.getRange(fila + 1, cab.indexOf('procesadaEn') + 1).setValue(hoyPanama_());
    hs.getRange(fila + 1, cab.indexOf('procesadaPor') + 1).setValue(u.nombre);

    marcar_('mercadeo');
    return { ok: true, clienteId: maxId + 1, conUbicacion: lat !== '',
             faltantes: faltantes };
  } finally { lock.releaseLock(); }
}

function api_rechazarSolicitud(pin, solicitudId, motivo) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok: false, error: 'PIN no válido' };
  if (!esSupervisor_(u)) return { ok: false, error: 'Solo un supervisor puede rechazar.' };

  const hs = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_SOL);
  const datos = hs.getDataRange().getValues();
  const cab = datos[0].map(String);
  const cId = cab.indexOf('solicitudId'), cEst = cab.indexOf('estado');
  for (let i = 1; i < datos.length; i++) {
    if (String(datos[i][cId]) === String(solicitudId)) {
      hs.getRange(i + 1, cEst + 1).setValue('DEVUELTA');
      hs.getRange(i + 1, cab.indexOf('motivo') + 1).setValue(motivo || '');
      hs.getRange(i + 1, cab.indexOf('procesadaEn') + 1).setValue(hoyPanama_());
      hs.getRange(i + 1, cab.indexOf('procesadaPor') + 1).setValue(u.nombre);
      /* Devolución nueva: se borra la marca de vista para que vuelva a avisar.
         Si no, una segunda devolución del mismo caso llegaría muda. */
      asegurarColumnas_(hs, COLS_SOL_VISTA);
      const cab2 = hs.getRange(1, 1, 1, hs.getLastColumn()).getValues()[0].map(String);
      limpiarVistaSolicitud_(hs, cab2, i + 1);
      return { ok: true };
    }
  }
  return { ok: false, error: 'No encuentro esa solicitud.' };
}


/* ═══════════════ JORNADA Y KILOMETRAJE ═══════════════ */

/** Abre la jornada con el kilometraje inicial del vehículo. */
function api_abrirJornada(pin, d) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok: false, error: 'PIN no válido' };
  const km = Number(d.kmInicio);
  if (!isFinite(km) || km <= 0) return { ok: false, error: 'Kilometraje inicial inválido.' };

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_JOR);
    const id = d.jornadaId || ('J' + Utilities.formatDate(new Date(), 'America/Panama', 'yyMMdd-HHmmss'));

    // valida contra el último kilometraje conocido de ese vehículo
    const previas = leerHoja_(HOJA_JOR).filter(j => String(j.vehiculo) === String(d.vehiculo));
    let ultimoKm = 0;
    previas.forEach(j => {
      const k = Number(j.kmFinal || j.kmInicio || 0);
      if (k > ultimoKm) ultimoKm = k;
    });
    const aviso = (ultimoKm && km < ultimoKm)
      ? 'El kilometraje es menor que el último registrado (' + ultimoKm + ').' : '';

    h.appendRow([id, d.fecha || hoyPanama_(), u.nombre, d.vehiculo || '', km,
                 d.horaInicio || '', '', '', '', '', '', new Date()]);
    return { ok: true, jornadaId: id, aviso: aviso, ultimoKm: ultimoKm };
  } finally { lock.releaseLock(); }
}

/** Cierra la jornada con el kilometraje final. */
function api_cerrarJornada(pin, d) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok: false, error: 'PIN no válido' };
  const kmF = Number(d.kmFinal);
  if (!isFinite(kmF) || kmF <= 0) return { ok: false, error: 'Kilometraje final inválido.' };

  const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_JOR);
  const datos = h.getDataRange().getValues();
  const cab = datos[0].map(String);
  const cId = cab.indexOf('jornadaId');

  for (let i = datos.length - 1; i >= 1; i--) {
    if (String(datos[i][cId]) !== String(d.jornadaId)) continue;
    const kmI = Number(datos[i][cab.indexOf('kmInicio')] || 0);
    if (kmF < kmI) return { ok: false, error: 'El kilometraje final (' + kmF + ') es menor que el inicial (' + kmI + ').' };
    h.getRange(i + 1, cab.indexOf('kmFinal') + 1).setValue(kmF);
    h.getRange(i + 1, cab.indexOf('horaFinal') + 1).setValue(d.horaFinal || '');
    h.getRange(i + 1, cab.indexOf('kmRecorridos') + 1).setValue(kmF - kmI);
    h.getRange(i + 1, cab.indexOf('paradas') + 1).setValue(Number(d.paradas) || 0);
    h.getRange(i + 1, cab.indexOf('totalKg') + 1).setValue(Number(d.totalKg) || 0);
    marcar_('logistica');
    return { ok: true, kmRecorridos: kmF - kmI };
  }
  return { ok: false, error: 'No encuentro esa jornada abierta.' };
}

/** Registra una carga de combustible. */
function api_guardarCombustible(pin, d) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok: false, error: 'PIN no válido' };
  const gal = Number(d.galones), km = Number(d.kilometraje);
  if (!isFinite(gal) || gal <= 0) return { ok: false, error: 'Galones inválidos.' };
  if (!isFinite(km) || km <= 0) return { ok: false, error: 'Kilometraje inválido.' };

  const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_COM);
  const id = 'C' + Utilities.formatDate(new Date(), 'America/Panama', 'yyMMdd-HHmmss');
  h.appendRow([id, d.fecha || hoyPanama_(), d.hora || '', u.nombre, d.vehiculo || '',
               km, gal, Number(d.monto) || 0, d.estacion || '', d.notas || '', new Date()]);

  // rendimiento contra la carga anterior del mismo vehículo
  const cargas = leerHoja_(HOJA_COM)
    .filter(c => String(c.vehiculo) === String(d.vehiculo) && Number(c.kilometraje) < km)
    .sort((a, b) => Number(b.kilometraje) - Number(a.kilometraje));
  let rendimiento = null;
  if (cargas.length) {
    const kmPrev = Number(cargas[0].kilometraje);
    const galPrev = Number(cargas[0].galones);
    if (galPrev > 0 && km > kmPrev) rendimiento = Math.round((km - kmPrev) / galPrev * 10) / 10;
  }
  marcar_('logistica');
  return { ok: true, cargaId: id, rendimiento: rendimiento };
}

/* ═══════════════ RUTA ÓPTIMA ═══════════════ */

/**
 * Calcula el mejor orden de las paradas usando las carreteras reales
 * (no distancia en línea recta). Devuelve el orden sugerido, la
 * distancia total y el tiempo estimado de manejo.
 */
function api_optimizarRuta(pin, puntos, origen) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok: false, error: 'PIN no válido' };
  if (!puntos || puntos.length < 2) return { ok: false, error: 'Se necesitan al menos dos paradas con ubicación.' };
  if (puntos.length > 23) return { ok: false, error: 'Máximo 23 paradas por cálculo. Divide la ruta.' };

  try {
    const df = Maps.newDirectionFinder().setMode(Maps.DirectionFinder.Mode.DRIVING);
    const ini = origen && origen.lat ? origen : puntos[0];
    df.setOrigin(ini.lat, ini.lng);

    // el destino es la última parada; el resto son waypoints a optimizar
    const medios = origen && origen.lat ? puntos.slice(0, puntos.length - 1) : puntos.slice(1, puntos.length - 1);
    medios.forEach(p => df.addWaypoint(p.lat, p.lng));
    const fin = puntos[puntos.length - 1];
    df.setDestination(fin.lat, fin.lng);
    df.setOptimizeWaypoints(true);

    const res = df.getDirections();
    if (!res || !res.routes || !res.routes.length)
      return { ok: false, error: 'Google no pudo calcular una ruta entre esos puntos.' };

    const ruta = res.routes[0];
    let metros = 0, segundos = 0;
    ruta.legs.forEach(l => { metros += l.distance.value; segundos += l.duration.value; });

    // reconstruye el orden: waypoint_order son índices dentro de "medios"
    const orden = [];
    if (!(origen && origen.lat)) orden.push(puntos[0].id);
    (ruta.waypoint_order || []).forEach(k => orden.push(medios[k].id));
    orden.push(fin.id);

    return {
      ok: true,
      orden: orden,
      km: Math.round(metros / 100) / 10,
      minutos: Math.round(segundos / 60)
    };
  } catch (e) {
    return { ok: false, error: 'No se pudo optimizar: ' + e.message };
  }
}

/* ═══════════════ INDICADORES DE FLOTA ═══════════════ */

/**
 * Historial de jornadas para el panel: una fila por salida,
 * con la última arriba. Incluye lo mismo que ve el conductor.
 */
/**
 * Últimas cargas de combustible, con el rendimiento calculado
 * contra la carga anterior del mismo vehículo.
 */
function api_combustible(pin, cuantas) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok: false, error: 'PIN no válido' };
  if (u.rol === 'operador') return { ok: false, error: 'Solo supervisores y gerencia.' };

  const n = Math.min(Math.max(Number(cuantas) || 10, 1), 50);
  const filas = leerHoja_(HOJA_COM).map(c => ({
    fecha: fechaISO_(c.fecha), hora: String(c.hora || ''),
    conductor: String(c.conductor || ''), vehiculo: String(c.vehiculo || ''),
    kilometraje: Number(c.kilometraje || 0), galones: Number(c.galones || 0),
    monto: Number(c.monto || 0), estacion: String(c.estacion || ''),
    notas: String(c.notas || '')
  })).filter(c => c.fecha);

  // orden cronológico para poder medir el rendimiento entre cargas
  filas.sort((a, b) => a.fecha === b.fecha
    ? String(a.hora).localeCompare(String(b.hora))
    : a.fecha.localeCompare(b.fecha));

  const ultimoKm = {};
  filas.forEach(c => {
    const prev = ultimoKm[c.vehiculo];
    if (prev && c.kilometraje > prev && c.galones > 0) {
      c.rendimiento = Math.round((c.kilometraje - prev) / c.galones * 10) / 10;
      c.recorrido = c.kilometraje - prev;
    } else {
      c.rendimiento = null; c.recorrido = null;
    }
    if (c.kilometraje > 0) ultimoKm[c.vehiculo] = c.kilometraje;
  });

  filas.reverse();                                  // la más reciente primero
  const ultimas = filas.slice(0, n);

  const conRend = ultimas.filter(c => c.rendimiento);
  return {
    ok: true, cargas: ultimas,
    totalGalones: Math.round(ultimas.reduce((a, c) => a + c.galones, 0) * 100) / 100,
    totalMonto: Math.round(ultimas.reduce((a, c) => a + c.monto, 0) * 100) / 100,
    promedioRend: conRend.length
      ? Math.round(conRend.reduce((a, c) => a + c.rendimiento, 0) / conRend.length * 10) / 10
      : null
  };
}


function api_indicadoresFlota(pin, desde, hasta) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok: false, error: 'PIN no válido' };
  if (u.rol === 'operador') return { ok: false, error: 'Solo supervisores y gerencia.' };

  const dDesde = desde ? new Date(desde + 'T00:00:00') : new Date(new Date().getFullYear(), 0, 1);
  const dHasta = hasta ? new Date(hasta + 'T23:59:59') : new Date();
  const enRango = f => {
    if (!f) return false;
    const d = (f instanceof Date) ? f : new Date(String(f) + 'T00:00:00');
    return d >= dDesde && d <= dHasta;
  };

  const jor = leerHoja_(HOJA_JOR).filter(j => enRango(j.fecha) && Number(j.kmRecorridos) > 0);
  const com = leerHoja_(HOJA_COM).filter(c => enRango(c.fecha));

  const kmTotal = jor.reduce((s, j) => s + Number(j.kmRecorridos || 0), 0);
  const kgTotal = jor.reduce((s, j) => s + Number(j.totalKg || 0), 0);
  const paradas = jor.reduce((s, j) => s + Number(j.paradas || 0), 0);
  const galones = com.reduce((s, c) => s + Number(c.galones || 0), 0);
  const gasto = com.reduce((s, c) => s + Number(c.monto || 0), 0);

  const porOperador = {};
  jor.forEach(j => {
    const k = String(j.conductor || '—');
    if (!porOperador[k]) porOperador[k] = { conductor: k, jornadas: 0, km: 0, kg: 0,
                                            paradas: 0, minutos: 0, vehiculos: {} };
    const o = porOperador[k];
    o.jornadas++;
    o.km += Number(j.kmRecorridos || 0);
    o.kg += Number(j.totalKg || 0);
    o.paradas += Number(j.paradas || 0);
    o.minutos += minutosEntre_(horaTxt_(j.horaInicio), horaTxt_(j.horaFinal));
    const v = String(j.vehiculo || '—');
    o.vehiculos[v] = (o.vehiculos[v] || 0) + Number(j.kmRecorridos || 0);
  });

  const porVehiculo = {};
  jor.forEach(j => {
    const v = String(j.vehiculo || '—');
    if (!porVehiculo[v]) porVehiculo[v] = { vehiculo: v, km: 0, kg: 0, paradas: 0, galones: 0, gasto: 0 };
    porVehiculo[v].km += Number(j.kmRecorridos || 0);
    porVehiculo[v].kg += Number(j.totalKg || 0);
    porVehiculo[v].paradas += Number(j.paradas || 0);
  });
  com.forEach(c => {
    const v = String(c.vehiculo || '—');
    if (!porVehiculo[v]) porVehiculo[v] = { vehiculo: v, km: 0, kg: 0, paradas: 0, galones: 0, gasto: 0 };
    porVehiculo[v].galones += Number(c.galones || 0);
    porVehiculo[v].gasto += Number(c.monto || 0);
  });

  return {
    ok: true,
    kmTotal: Math.round(kmTotal * 10) / 10,
    kgTotal: Math.round(kgTotal * 10) / 10,
    paradas: paradas,
    galones: Math.round(galones * 10) / 10,
    gasto: Math.round(gasto * 100) / 100,
    kgPorKm: kmTotal ? Math.round(kgTotal / kmTotal * 100) / 100 : 0,
    kmPorGalon: galones ? Math.round(kmTotal / galones * 10) / 10 : 0,
    costoPorParada: paradas ? Math.round(gasto / paradas * 100) / 100 : 0,
    kmPorParada: paradas ? Math.round(kmTotal / paradas * 10) / 10 : 0,
    jornadas: jor.length,
    operadores: Object.keys(porOperador).map(k => {
      const o = porOperador[k];
      o.km = Math.round(o.km * 10) / 10;
      o.kg = Math.round(o.kg * 10) / 10;
      o.kmPorParada = o.paradas ? Math.round(o.km / o.paradas * 10) / 10 : 0;
      o.detalleVehiculos = Object.keys(o.vehiculos)
        .map(v => ({ vehiculo: v, km: Math.round(o.vehiculos[v] * 10) / 10 }))
        .sort((a, b) => b.km - a.km);
      delete o.vehiculos;
      return o;
    }).sort((a, b) => b.km - a.km),
    vehiculos: Object.keys(porVehiculo).map(k => {
      const v = porVehiculo[k];
      v.km = Math.round(v.km * 10) / 10;
      v.kg = Math.round(v.kg * 10) / 10;
      v.rendimiento = v.galones ? Math.round(v.km / v.galones * 10) / 10 : 0;
      return v;
    })
  };
}


/**
 * Inserta en la hoja Recolecciones las columnas que falten,
 * EN LA POSICIÓN EXACTA que el sistema espera. Los datos que ya
 * están se corren a la derecha sin perderse ni desalinearse.
 *
 * Es segura de correr varias veces: si las columnas ya están, no hace nada.
 */
function actualizarColumnasRecolecciones() {
  const ui = SpreadsheetApp.getUi();
  const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_REC);
  if (!h) { ui.alert('No encuentro la hoja Recolecciones.'); return; }

  const actuales = h.getRange(1, 1, 1, Math.max(h.getLastColumn(), 1))
                    .getValues()[0].map(v => String(v).trim());

  const faltan = COLS_REC.filter(c => actuales.indexOf(c) < 0);
  if (!faltan.length) {
    ui.alert('La hoja Recolecciones ya tiene todas las columnas al día.\\n\\nNo hubo nada que cambiar.');
    return;
  }

  if (ui.alert('Actualizar columnas',
      'Voy a insertar ' + faltan.length + ' columna(s) en la hoja Recolecciones:\\n\\n\u2022 ' +
      faltan.join('\\n\u2022 ') + '\\n\\n' +
      'Las inserto en la posición correcta; los datos que ya tienes se corren ' +
      'a la derecha sin perderse.\\n\\n' +
      'ANTES DE SEGUIR: haz una copia de respaldo con Archivo > Hacer una copia.\\n\\n' +
      '¿Continuar?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  // Recorre el orden correcto e inserta cada faltante donde corresponde.
  for (let destino = 0; destino < COLS_REC.length; destino++) {
    const nombre = COLS_REC[destino];
    const cab = h.getRange(1, 1, 1, Math.max(h.getLastColumn(), 1))
                 .getValues()[0].map(v => String(v).trim());
    if (cab.indexOf(nombre) >= 0) continue;

    h.insertColumnBefore(destino + 1);
    h.getRange(1, destino + 1).setValue(nombre);
  }

  const finales = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0].map(v => String(v).trim());
  const sobran = finales.filter(c => c && COLS_REC.indexOf(c) < 0);

  h.getRange(1, 1, 1, h.getLastColumn())
    .setFontWeight('bold').setBackground('#0E5F45').setFontColor('#FFFFFF');
  h.setFrozenRows(1);

  ui.alert('COLUMNAS ACTUALIZADAS\\n\\n' +
    '\u2713 Insertadas: ' + faltan.join(', ') + '\\n\\n' +
    (sobran.length ? 'Columnas extra que dejé intactas (no las uso, pero no estorban):\\n\u2022 ' +
      sobran.join('\\n\u2022 ') + '\\n\\n' : '') +
    'Las filas viejas quedan vacías en las columnas nuevas — es correcto: ' +
    'esos datos no se registraron en su momento. Las recolecciones nuevas ' +
    'sí traerán los tres tipos de desecho separados.');
}

/* ═══════════════ DISPOSICIÓN FINAL ═══════════════ */
/* Cada operador dispone lo que él recolectó. El saldo son las recolecciones
   suyas que todavía no llevan número de acta. */

function saldoDe_(nombre, desde, hasta) {
  const filas = leerHoja_(HOJA_REC);
  const nom = String(nombre || '').trim().toLowerCase();
  const sinActa = filas.filter(r =>
    String(r.Responsable || '').trim().toLowerCase() === nom &&
    !String(r.acta || '').trim());

  // el rango es opcional: sin él, todo lo que no tenga acta
  const mio = sinActa.filter(r => {
    const f = fechaISO_(r['Fecha de Recoleccion']);
    if (!f) return false;
    if (desde && f < desde) return false;
    if (hasta && f > hasta) return false;
    return true;
  });

  const s = { kgBio:0, cantBio:0, kgAnatomo:0, cantAnatomo:0, kgPunzo:0, cantPunzo:0,
              kgTotal:0, bultos:0, registros:mio.length, recibos:[], desde:'', hasta:'',
              detalle:[], pendienteDesde:'', pendienteHasta:'', pendienteTotal:sinActa.length };
  const n = v => { const x = Number(v); return isFinite(x) ? x : 0; };

  // los extremos de TODO lo pendiente, para proponerle el rango al conductor
  sinActa.forEach(r => {
    const f = fechaISO_(r['Fecha de Recoleccion']); if (!f) return;
    if (!s.pendienteDesde || f < s.pendienteDesde) s.pendienteDesde = f;
    if (!s.pendienteHasta || f > s.pendienteHasta) s.pendienteHasta = f;
  });

  const porCli = {};
  mio.forEach(r => {
    const kb = n(r['Kg Recolectados']), ka = n(r['kg anatomopatologico']), kp = n(r['kg punzo cortantes']);
    s.kgBio += kb; s.kgAnatomo += ka; s.kgPunzo += kp;
    s.cantBio += n(r['cantidad bolsas']);
    s.cantAnatomo += n(r['cantidad anatomo']);
    s.cantPunzo += n(r['cantidad punzo cort']);
    const rec = String(r['recibo numero'] || '').trim();
    if (rec) s.recibos.push(rec);
    const f = fechaISO_(r['Fecha de Recoleccion']);
    if (f) { if (!s.desde || f < s.desde) s.desde = f; if (!s.hasta || f > s.hasta) s.hasta = f; }

    const c = String(r.Cliente || '(sin cliente)').trim();
    if (!porCli[c]) porCli[c] = { cliente:c, visitas:0, kg:0, kgBio:0, kgAnatomo:0, kgPunzo:0, recibos:[] };
    const d = porCli[c];
    d.visitas++; d.kgBio += kb; d.kgAnatomo += ka; d.kgPunzo += kp;
    d.kg += kb + ka + kp;
    if (rec) d.recibos.push(rec);
  });

  s.kgTotal = Math.round((s.kgBio + s.kgAnatomo + s.kgPunzo) * 100) / 100;
  s.bultos  = s.cantBio + s.cantAnatomo + s.cantPunzo;
  ['kgBio','kgAnatomo','kgPunzo'].forEach(k => s[k] = Math.round(s[k] * 100) / 100);
  s.recibos.sort();
  s.detalle = Object.keys(porCli).map(k => {
    const d = porCli[k];
    ['kg','kgBio','kgAnatomo','kgPunzo'].forEach(z => d[z] = Math.round(d[z] * 100) / 100);
    d.recibos.sort();
    return d;
  }).sort((a, b) => b.kg - a.kg);
  return s;
}

/* nombres de los operadores activos, para elegir a nombre de quién va el acta */
function operadoresActivos_() {
  return leerHoja_(HOJA_USR)
    .filter(u => String(u.activo || '').trim().toUpperCase() !== 'NO' &&
                 String(u.rol || '').trim().toLowerCase() === 'operador')
    .map(u => String(u.nombre || '').trim())
    .filter(Boolean);
}

function api_saldoDisposicion(pin, desde, hasta, operador) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  const quien = (u.rol === 'operador') ? u.nombre : (operador || u.nombre);
  return { ok:true, saldo: saldoDe_(quien, desde, hasta), operador: quien,
           operadores: operadoresActivos_() };
}

function api_generarActa(pin, datos) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  datos = datos || {};

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const quien = (u.rol === 'operador') ? u.nombre : (datos.operador || u.nombre);
    /* Sin rango = TODO lo que no tiene acta, que es lo que el operador lleva
       encima. Elegir fechas es la excepción —entregar en dos tandas—, no la
       regla: pedírselas siempre era lo que lo hacía equivocarse. */
    const desde = String(datos.desde || ''), hasta = String(datos.hasta || '');
    if (!desde !== !hasta)
      return { ok:false, error:'El rango está a medias: pon las dos fechas o ninguna.' };
    if (desde && hasta && desde > hasta)
      return { ok:false, error:'La fecha inicial es posterior a la final.' };

    const s = saldoDe_(quien, desde, hasta);
    if (!s.registros)
      return { ok:false, error: desde
        ? 'No hay recolecciones de ' + quien + ' sin acta en ese rango.'
        : 'No hay recolecciones de ' + quien + ' pendientes de entregar.' };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let hd = ss.getSheetByName(HOJA_DIS);
    if (!hd) hd = crearHoja_(ss, HOJA_DIS, COLS_DIS);

    const hoy = hoyPanama_();

    const usados = {};
    leerHoja_(HOJA_DIS).forEach(r => { usados[String(r.actaId || '').trim()] = 1; });

    /* El 1 de septiembre la cuenta vieja devolvió cero con cuatro actas ya en
       la hoja, y el sistema volvió a emitir el ACT-2026-0001. Dos actas con el
       mismo número: al abrir una siempre salía la otra, y la del 1 de
       septiembre quedó imposible de ver desde la app.

       Por eso el número calculado no se usa a ciegas. Si está ocupado se
       avanza hasta encontrar uno libre, y si aun así no aparece, NO se
       escribe nada: mejor un error que alguien ve, que un acta duplicada que
       nadie nota hasta que la busca. */
    let actaId = '';
    const arranque = siguienteNumeroActa_(hoy);
    for (let intento = 0; intento < 500; intento++) {
      const cand = actaId_(hoy, arranque + intento);
      if (!usados[cand]) { actaId = cand; break; }
    }
    if (!actaId)
      return { ok:false, error:'No se pudo asignar un número de acta libre. ' +
                              'Avísale al administrador antes de volver a intentar.' };
    const hora = Utilities.formatDate(new Date(), 'America/Panama', 'HH:mm');
    let firma = String(datos.firma || '');
    if (firma.length > 45000) firma = '';

    let detalleTxt = JSON.stringify(s.detalle);
    if (detalleTxt.length > 45000) detalleTxt = '';

    hd.appendRow([actaId, hoy, hora, quien, String(datos.vehiculo || ''),
      String(datos.destino || ''), String(datos.recibe || ''),
      s.desde, s.hasta, s.recibos.join(', '),
      s.kgBio, s.cantBio, s.kgAnatomo, s.cantAnatomo, s.kgPunzo, s.cantPunzo,
      s.kgTotal, s.bultos, String(datos.observaciones || ''), detalleTxt, firma, new Date()]);

    // sellar SOLO las recolecciones del rango
    const hr = ss.getSheetByName(HOJA_REC);
    const vals = hr.getDataRange().getValues();
    const cab = vals[0].map(String);
    let cActa = cab.indexOf('acta');
    if (cActa < 0) { hr.getRange(1, cab.length + 1).setValue('acta'); cActa = cab.length; }
    const cResp = cab.indexOf('Responsable');
    const cFecha = cab.indexOf('Fecha de Recoleccion');
    const marcas = [];
    for (let i = 1; i < vals.length; i++) {
      const resp = String(vals[i][cResp] || '').trim().toLowerCase();
      const ya = String(vals[i][cActa] || '').trim();
      const f = fechaISO_(vals[i][cFecha]);
      /* El rango vacío significa TODO lo pendiente. Comparar contra '' sellaba
         cero filas en silencio: `f <= ''` es falso para cualquier fecha. */
      const enRango = !!f && (!desde || f >= desde) && (!hasta || f <= hasta);
      const entra = resp === quien.trim().toLowerCase() && !ya && enRango;
      marcas.push([entra ? actaId : (vals[i][cActa] || '')]);
    }
    if (marcas.length) hr.getRange(2, cActa + 1, marcas.length, 1).setValues(marcas);

    return { ok:true, actaId: actaId };
  } finally { lock.releaseLock(); }
}

function api_actas(pin, n, desde, hasta, operador) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  const quien = (u.rol === 'operador') ? u.nombre : (operador || u.nombre);
  let filas = leerHoja_(HOJA_DIS).map(r => ({
    actaId: String(r.actaId || ''), fecha: fechaISO_(r.fecha), hora: horaTxt_(r.hora),
    operador: String(r.operador || ''), destino: String(r.destino || ''),
    recibe: String(r.recibe || ''), desde: fechaISO_(r.desde), hasta: fechaISO_(r.hasta),
    recibos: String(r.recibos || ''),
    kgBio: Number(r.kgBio || 0), kgAnatomo: Number(r.kgAnatomo || 0),
    kgPunzo: Number(r.kgPunzo || 0), kgTotal: Number(r.kgTotal || 0),
    bultos: Number(r.bultos || 0), observaciones: String(r.observaciones || ''),
    detalle: (function(){ try { return JSON.parse(String(r.detalle || '[]')); } catch(e){ return []; } })()
  }));
  if (u.rol === 'operador') {
    filas = filas.filter(a => a.operador.trim().toLowerCase() === u.nombre.trim().toLowerCase());
  }
  filas.sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
  return { ok:true, actas: filas.slice(0, n || 20), saldo: saldoDe_(quien, desde, hasta),
           operador: quien, operadores: operadoresActivos_() };
}

function verActas() {
  const filas = leerHoja_(HOJA_DIS);
  if (!filas.length) { SpreadsheetApp.getUi().alert('Todavía no hay actas emitidas.'); return; }
  const t = filas.slice(-15).reverse().map(r =>
    String(r.actaId) + '  ' + fechaISO_(r.fecha) + '  ' + String(r.operador) +
    '  ' + Number(r.kgTotal || 0).toFixed(1) + ' kg').join('\n');
  SpreadsheetApp.getUi().alert('Últimas actas de disposición final\n\n' + t);
}

/* Quita filas repetidas de la hoja Rutas: mismo día, mismo operador, mismo cliente. */
function limpiarRutasDuplicadas() {
  const ui = SpreadsheetApp.getUi();
  const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_RUT);
  if (!h || h.getLastRow() < 2) { ui.alert('La hoja Rutas está vacía.'); return; }

  const datos = h.getDataRange().getValues();
  const vistos = {}, borrar = [];
  for (let i = 1; i < datos.length; i++) {
    const clave = fechaISO_(datos[i][1]) + '|' +
                  String(datos[i][2] || '').trim().toLowerCase() + '|' +
                  String(datos[i][5] || '').trim();
    if (vistos[clave]) borrar.push(i + 1); else vistos[clave] = 1;
  }
  if (!borrar.length) { ui.alert('No hay paradas repetidas. Todo limpio.'); return; }

  if (ui.alert('Limpiar rutas',
      'Encontré ' + borrar.length + ' parada(s) repetida(s):\n' +
      'el mismo cliente puesto dos veces el mismo día al mismo operador.\n\n' +
      'Voy a dejar solo la primera de cada una.\n\n¿Continuar?',
      ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  borrar.reverse().forEach(f => h.deleteRow(f));
  try { CacheService.getScriptCache().removeAll([]); } catch (e) {}
  ui.alert('Listo. Se quitaron ' + borrar.length + ' parada(s) repetida(s).\n\n' +
           'Abre la app y toca Actualizar.');
}

/* ═══════ Rutas: verlas todas y poder borrarlas ═══════ */
function api_rutasTodas(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (u.rol === 'operador') return { ok:false, error:'Solo supervisores y gerencia.' };

  const nombres = {};
  leerHoja_(HOJA_CLI).forEach(c => nombres[Number(c.id)] = String(c.nombre || ''));

  const mapa = {};
  leerHoja_(HOJA_RUT).forEach(r => {
    const id = String(r.rutaId || ''); if (!id) return;
    const f = fechaISO_(r.fecha);
    if (!mapa[id]) mapa[id] = { rutaId:id, fecha:f, conductor:String(r.conductor||''),
                                vehiculo:String(r.vehiculo||''), paradas:[] };
    const cid = Number(r.clienteId);
    if (mapa[id].paradas.some(p => p.clienteId === cid)) return;
    mapa[id].paradas.push({ orden:Number(r.orden||0), clienteId:cid,
                            cliente: nombres[cid] || ('Cliente ' + cid) });
  });

  // cuántas de esas paradas ya se recolectaron
  const hechas = {};
  leerHoja_(HOJA_REC).forEach(r => {
    const f = fechaISO_(r['Fecha de Recoleccion']);
    if (f) hechas[f + '|' + String(r.Cliente || '').trim().toUpperCase()] = 1;
  });

  const hoy = hoyPanama_();
  const rutas = Object.keys(mapa).map(k => {
    const r = mapa[k];
    r.paradas.sort((a, b) => a.orden - b.orden);
    r.total = r.paradas.length;
    r.hechas = r.paradas.filter(p => hechas[r.fecha + '|' + p.cliente.trim().toUpperCase()]).length;
    r.pasada = r.fecha < hoy;
    r.hoy = r.fecha === hoy;
    return r;
  }).sort((a, b) => b.fecha.localeCompare(a.fecha));

  return { ok:true, rutas: rutas, hoy: hoy };
}

function api_borrarRuta(pin, rutaId) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (!esAdmin_(u)) return { ok:false, error:'Tu rol es "' + u.rol + '" y solo el administrador ' +
    'puede borrar rutas. Revisa tu fila en la hoja Usuarios.' };
  if (!rutaId) return { ok:false, error:'Falta el identificador de la ruta.' };

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_RUT);
    const datos = h.getDataRange().getValues();
    let n = 0;
    for (let i = datos.length - 1; i >= 1; i--) {
      if (String(datos[i][0]) === String(rutaId)) { h.deleteRow(i + 1); n++; }
    }
    return { ok:true, borradas:n };
  } finally { lock.releaseLock(); }
}

/* ═══════ Un acta completa, para el reporte imprimible ═══════ */
function api_acta(pin, actaId) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  const r = leerHoja_(HOJA_DIS).find(a => String(a.actaId || '') === String(actaId));
  if (!r) return { ok:false, error:'No encontré esa acta.' };
  if (u.rol === 'operador' &&
      String(r.operador || '').trim().toLowerCase() !== u.nombre.trim().toLowerCase()) {
    return { ok:false, error:'Esa acta no es tuya.' };
  }
  let det = [];
  try { det = JSON.parse(String(r.detalle || '[]')); } catch (e) { det = []; }
  return { ok:true, acta: {
    actaId:String(r.actaId||''), fecha:fechaISO_(r.fecha), hora:horaTxt_(r.hora),
    operador:String(r.operador||''), vehiculo:String(r.vehiculo||''),
    destino:String(r.destino||''), recibe:String(r.recibe||''),
    desde:fechaISO_(r.desde), hasta:fechaISO_(r.hasta), recibos:String(r.recibos||''),
    kgBio:Number(r.kgBio||0), cantBio:Number(r.cantBio||0),
    kgAnatomo:Number(r.kgAnatomo||0), cantAnatomo:Number(r.cantAnatomo||0),
    kgPunzo:Number(r.kgPunzo||0), cantPunzo:Number(r.cantPunzo||0),
    kgTotal:Number(r.kgTotal||0), bultos:Number(r.bultos||0),
    observaciones:String(r.observaciones||''), detalle:det, firma:String(r.firma||'')
  }};
}

/* ═══════════════ PLANTA DE TRATAMIENTO ═══════════════ */
/* Planta solo consulta: ve lo que entró, no modifica nada.
   Los generadores sí se muestran — la trazabilidad del origen es
   exigible a quien trata el desecho. Lo que NO se expone es la
   cartera comercial: frecuencias, direcciones, contactos, estados. */

function api_plantaBootstrap(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok: false, error: 'PIN no válido' };
  if (['planta', 'supervisor', 'gerente', 'admin', 'mercadeo'].indexOf(u.rol) < 0) {
    return { ok: false, error: 'Este acceso es para el supervisor de planta.' };
  }
  return { ok: true, usuario: u, hoy: hoyPanama_() };
}

function api_plantaActas(pin, desde, hasta) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok: false, error: 'PIN no válido' };
  if (['planta', 'supervisor', 'gerente', 'admin', 'mercadeo'].indexOf(u.rol) < 0) {
    return { ok: false, error: 'Sin permiso para esta consulta.' };
  }

  const d1 = String(desde || ''), d2 = String(hasta || '');
  const filas = leerHoja_(HOJA_DIS).filter(r => {
    const f = fechaISO_(r.fecha);
    if (!f) return false;
    if (d1 && f < d1) return false;
    if (d2 && f > d2) return false;
    return true;
  });

  const actas = filas.map(r => {
    let det = [];
    try { det = JSON.parse(String(r.detalle || '[]')); } catch (e) { det = []; }
    return {
      actaId: String(r.actaId || ''), fecha: fechaISO_(r.fecha), hora: horaTxt_(r.hora),
      operador: String(r.operador || ''), vehiculo: String(r.vehiculo || ''),
      destino: String(r.destino || ''), recibe: String(r.recibe || ''),
      desde: fechaISO_(r.desde), hasta: fechaISO_(r.hasta),
      recibos: String(r.recibos || ''),
      kgBio: Number(r.kgBio || 0), cantBio: Number(r.cantBio || 0),
      kgAnatomo: Number(r.kgAnatomo || 0), cantAnatomo: Number(r.cantAnatomo || 0),
      kgPunzo: Number(r.kgPunzo || 0), cantPunzo: Number(r.cantPunzo || 0),
      kgTotal: Number(r.kgTotal || 0), bultos: Number(r.bultos || 0),
      observaciones: String(r.observaciones || ''), detalle: det
    };
  }).sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));

  // ── totales del periodo ──
  const t = { actas: actas.length, kgBio: 0, cantBio: 0, kgAnatomo: 0, cantAnatomo: 0,
              kgPunzo: 0, cantPunzo: 0, kgTotal: 0, bultos: 0, entregas: 0 };
  const porOperador = {}, porGenerador = {}, porMes = {};

  actas.forEach(a => {
    t.kgBio += a.kgBio; t.kgAnatomo += a.kgAnatomo; t.kgPunzo += a.kgPunzo;
    t.cantBio += a.cantBio; t.cantAnatomo += a.cantAnatomo; t.cantPunzo += a.cantPunzo;
    t.kgTotal += a.kgTotal; t.bultos += a.bultos;

    const o = a.operador || '—';
    if (!porOperador[o]) porOperador[o] = { operador: o, actas: 0, kg: 0, bultos: 0 };
    porOperador[o].actas++; porOperador[o].kg += a.kgTotal; porOperador[o].bultos += a.bultos;

    const m = a.fecha.slice(0, 7);
    if (!porMes[m]) porMes[m] = { mes: m, actas: 0, kg: 0 };
    porMes[m].actas++; porMes[m].kg += a.kgTotal;

    (a.detalle || []).forEach(d => {
      const g = String(d.cliente || '—');
      if (!porGenerador[g]) porGenerador[g] = { generador: g, visitas: 0, kg: 0 };
      porGenerador[g].visitas += Number(d.visitas || 0);
      porGenerador[g].kg += Number(d.kg || 0);
      t.entregas += Number(d.visitas || 0);
    });
  });

  const r1 = v => Math.round(v * 100) / 100;
  ['kgBio', 'kgAnatomo', 'kgPunzo', 'kgTotal'].forEach(k => t[k] = r1(t[k]));

  const ops = Object.keys(porOperador).map(k => {
    porOperador[k].kg = r1(porOperador[k].kg); return porOperador[k];
  }).sort((a, b) => b.kg - a.kg);

  const gens = Object.keys(porGenerador).map(k => {
    porGenerador[k].kg = r1(porGenerador[k].kg); return porGenerador[k];
  }).sort((a, b) => b.kg - a.kg);

  const meses = Object.keys(porMes).sort().map(k => {
    porMes[k].kg = r1(porMes[k].kg); return porMes[k];
  });

  return { ok: true, usuario: u, desde: d1, hasta: d2, hoy: hoyPanama_(),
           actas: actas, totales: t, operadores: ops, generadores: gens, meses: meses };
}

/* ═══════ Reporte de planta: se alimenta del HISTÓRICO DE RECOLECCIONES ═══════
   La pantalla muestra las actas recibidas (lo que Planta pesó en la puerta).
   El reporte responde otra pregunta: qué se levantó en la calle en este periodo,
   sin importar en qué entrega llegó. Por eso filtra por fecha de recolección. */

function api_plantaReporte(pin, desde, hasta) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok: false, error: 'PIN no válido' };
  if (['planta', 'supervisor', 'gerente', 'admin', 'mercadeo'].indexOf(u.rol) < 0) {
    return { ok: false, error: 'Sin permiso para esta consulta.' };
  }
  const d1 = String(desde || ''), d2 = String(hasta || '');
  if (!d1 || !d2) return { ok: false, error: 'Falta el periodo.' };

  const filas = leerHoja_(HOJA_REC).filter(r => {
    const f = fechaISO_(r['Fecha de Recoleccion']);
    return f && f >= d1 && f <= d2;
  });
  if (!filas.length) {
    return { ok: true, usuario: u, desde: d1, hasta: d2, hoy: hoyPanama_(), vacio: true };
  }

  // datos de las actas, para saber cuándo entró cada lote a planta
  const infoActa = {};
  leerHoja_(HOJA_DIS).forEach(a => {
    infoActa[String(a.actaId || '')] = {
      fecha: fechaISO_(a.fecha), recibe: String(a.recibe || ''),
      destino: String(a.destino || ''), vehiculo: String(a.vehiculo || '')
    };
  });

  const n = v => { const x = Number(v); return isFinite(x) ? x : 0; };
  const t = { recolecciones: filas.length, kgBio: 0, cantBio: 0, kgAnatomo: 0, cantAnatomo: 0,
              kgPunzo: 0, cantPunzo: 0, kgTotal: 0, bultos: 0, sinActa: 0, kgSinActa: 0 };
  const porGen = {}, porOp = {}, porMes = {}, porActa = {};

  filas.forEach(r => {
    const kb = n(r['Kg Recolectados']), ka = n(r['kg anatomopatologico']), kp = n(r['kg punzo cortantes']);
    const cb = n(r['cantidad bolsas']), ca = n(r['cantidad anatomo']), cp = n(r['cantidad punzo cort']);
    const kg = kb + ka + kp, bultos = cb + ca + cp;

    t.kgBio += kb; t.kgAnatomo += ka; t.kgPunzo += kp;
    t.cantBio += cb; t.cantAnatomo += ca; t.cantPunzo += cp;
    t.kgTotal += kg; t.bultos += bultos;

    const g = String(r.Cliente || '(sin generador)').trim();
    if (!porGen[g]) porGen[g] = { generador: g, visitas: 0, kg: 0, bultos: 0, recibos: [] };
    porGen[g].visitas++; porGen[g].kg += kg; porGen[g].bultos += bultos;
    const rec = String(r['recibo numero'] || '').trim();
    if (rec) porGen[g].recibos.push(rec);

    const o = String(r.Responsable || '—').trim();
    if (!porOp[o]) porOp[o] = { operador: o, recolecciones: 0, kg: 0, bultos: 0 };
    porOp[o].recolecciones++; porOp[o].kg += kg; porOp[o].bultos += bultos;

    const f = fechaISO_(r['Fecha de Recoleccion']);
    const m = f.slice(0, 7);
    if (!porMes[m]) porMes[m] = { mes: m, recolecciones: 0, kg: 0 };
    porMes[m].recolecciones++; porMes[m].kg += kg;

    const ac = String(r.acta || '').trim();
    if (!ac) { t.sinActa++; t.kgSinActa += kg; }
    const clave = ac || '(sin disponer)';
    if (!porActa[clave]) {
      const i = infoActa[ac] || {};
      porActa[clave] = { actaId: ac, dispuesta: !!ac, recolecciones: 0, kg: 0, bultos: 0,
                         fechaEntrega: i.fecha || '', recibe: i.recibe || '',
                         vehiculo: i.vehiculo || '', primera: f, ultima: f };
    }
    const pa = porActa[clave];
    pa.recolecciones++; pa.kg += kg; pa.bultos += bultos;
    if (f < pa.primera) pa.primera = f;
    if (f > pa.ultima) pa.ultima = f;
  });

  const r2 = v => Math.round(v * 100) / 100;
  ['kgBio','kgAnatomo','kgPunzo','kgTotal','kgSinActa'].forEach(k => t[k] = r2(t[k]));

  const gens = Object.keys(porGen).map(k => {
    const g = porGen[k]; g.kg = r2(g.kg); g.recibos.sort(); return g;
  }).sort((a, b) => b.kg - a.kg);

  const ops = Object.keys(porOp).map(k => { porOp[k].kg = r2(porOp[k].kg); return porOp[k]; })
    .sort((a, b) => b.kg - a.kg);

  const meses = Object.keys(porMes).sort().map(k => { porMes[k].kg = r2(porMes[k].kg); return porMes[k]; });

  const actas = Object.keys(porActa).map(k => { porActa[k].kg = r2(porActa[k].kg); return porActa[k]; })
    .sort((a, b) => (a.fechaEntrega || '9999').localeCompare(b.fechaEntrega || '9999'));

  return { ok: true, usuario: u, desde: d1, hasta: d2, hoy: hoyPanama_(), vacio: false,
           totales: t, generadores: gens, operadores: ops, meses: meses, actas: actas };
}

/* ═══════════════ CARTERA DE CLIENTES (mercadeo) ═══════════════
   Una sola base: mercadeo edita la ficha comercial aquí y operaciones
   la lee de la misma hoja. Se acabó el Excel paralelo. */

const CAMPOS_CARTERA = ['nombre','razon social','ruc','dv','correo','canal','facturacion',
  'frecuencia','plan costo','plan kg','tarifa kg adic','tarifa visita adic',
  'inicio recoleccion','contrato','vencimiento','contacto','telefono','estado',
  'direccion','region','kg','notas comerciales',
  /* cómo se le cobra y si retiene ITBMS */
  'modalidad','retiene itbms',
  /* situación comercial: la decide mercadeo, no el cálculo nocturno */
  'situacion','motivo baja','fecha baja',
  /* qué día de la semana le toca, para armar la ruta de un toque */
  'dias semana',
  /* a qué cartera pertenece: cambia quién lo cobra y con qué vara se mide */
  'tipo cartera'];

/* Modalidad de cobro. La mayoría es por ciclo; el resto son excepciones reales:
   CRIVB AIP paga por kilo, y hay servicios de una sola vez sin contrato. */
const MODALIDADES = [
  ['plan',     'Plan · tarifa fija con kilos incluidos'],
  ['peso',     'Peso · se cobra por kilo recolectado'],
  ['servicio', 'Servicio de recolección · una sola vez, sin contrato']
];

/* La situación comercial la decide mercadeo y es distinta del estado operativo,
   que el sistema calcula solo cada noche según la frecuencia. Dar de baja aquí
   saca al cliente de las rutas: Josue deja de verlo y el planificador no lo sugiere. */
const SITUACIONES = [
  ['activo',    'Activo · en servicio'],
  ['mora',      'Suspendido por mora · vuelve si paga'],
  ['cierre',    'Baja definitiva · cerró el establecimiento'],
  ['retiro',    'Baja definitiva · se retiró'],
  ['pausa',     'Pausa temporal · a solicitud del cliente']
];
const SITUACIONES_FUERA = ['mora','cierre','retiro','pausa'];   // salen de las rutas

const DIAS_SEMANA = [
  ['1','Lunes'],['2','Martes'],['3','Miércoles'],['4','Jueves'],
  ['5','Viernes'],['6','Sábado'],['7','Domingo']
];

/* Un cliente que se va no se borra: se marca por qué, para saber si es
   recuperable o no. "Suspendido" a secas mezclaba mora con cierre. */

/* ═══ CUÁNTOS CLIENTES TENEMOS ═════════════════════════════════════

   Mercadeo entraba a la cartera y no podía contestar la pregunta más
   simple de su trabajo. La pantalla enseñaba fichas sin RUC, fichas sin
   correo y contratos vencidos —todas tareas suyas— y ninguna cifra del
   negocio.

   Y contar filas no sirve: MINIMED son 15 fichas y un solo cliente.

   LA REGLA, que la fijó Supervisor y sale de cómo se factura:

     · facturación AGRUPADA  → las fichas que comparten RUC son UN cliente
                               con varios puntos de atención
     · facturación POR PUNTO → cada ficha es un cliente, aunque comparta
                               RUC con otras

   Una ficha sin RUC no se puede agrupar con nadie, así que cuenta suelta.
   No es una decisión de programa: es que sin RUC no hay con qué juntarla.
   Por eso las fichas sin RUC salen contadas aparte en la pantalla — el
   número es aproximado mientras existan, y decirlo es parte del número. */
function car_cuenta_(cli) {
  const grupos = {};
  let sueltos = 0;
  cli.forEach(c => {
    const ruc = String(c.ruc || '').trim();
    const agr = String(c.facturacion || '').trim().toUpperCase() === 'AGRUPADA';
    if (agr && ruc) grupos[ruc] = (grupos[ruc] || 0) + 1;
    else sueltos++;
  });
  const cuantos = Object.keys(grupos);
  return { clientes: cuantos.length + sueltos, puntos: cli.length,
           agrupados: cuantos.length,
           puntosAgrupados: cuantos.reduce((s, k) => s + grupos[k], 0) };
}

/* La cartera mes a mes, hacia atrás, desde las fechas que ya están.

   Un punto cuenta en un mes si ya había empezado a atenderse antes de que
   ese mes terminara y todavía no se había ido. La entrada sale de «inicio
   recoleccion» y la salida de la fecha en que se le puso una situación de
   baja. Las dos ya existen: no hay que empezar a acumular nada, la
   historia se puede leer desde 2024.

   Ojo con lo que esto NO sabe: una ficha sin fecha de inicio no aparece
   en ningún mes, y un cliente al que se dio de baja sin fecha se queda
   contado para siempre. Las dos cosas salen en «fichas por completar». */
function car_curva_(cli, hoy, meses) {
  return car_curvaMeses_(cli, hoy, car_mesMenos_(hoy.slice(0, 7), meses - 1),
                         hoy.slice(0, 7));
}

/* Un mes atrás, sin líos de días 31: se construye por año y mes. */
function car_mesMenos_(mes, n) {
  const a = Number(String(mes).slice(0, 4)), m = Number(String(mes).slice(5, 7));
  const d = new Date(a, m - 1 - n, 1);
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
}

/* La curva entre dos meses cualesquiera, ambos incluidos.
   Dirección elige la ventana; mercadeo siempre pide los últimos doce. */
function car_curvaMeses_(cli, hoy, m1, m2) {
  const salida = c => fechaISO_(c['fecha baja']) || fechaISO_(c.fechaEstado) || '';
  const lista = [];
  const mes0 = hoy.slice(0, 7);
  if (m2 > mes0) m2 = mes0;
  if (!m1 || m1 > m2) m1 = m2;
  let d = new Date(Number(m1.slice(0, 4)), Number(m1.slice(5, 7)) - 1, 1);
  const tope = new Date(Number(m2.slice(0, 4)), Number(m2.slice(5, 7)) - 1, 1);
  /* freno duro: una fecha rara en el libro no puede colgar el servidor */
  for (let vueltas = 0; d <= tope && vueltas < 400; vueltas++) {
    const m = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
    /* último día del mes; para el mes en curso, hoy */
    const ult = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    let fin = ult.getFullYear() + '-' + ('0' + (ult.getMonth() + 1)).slice(-2) +
              '-' + ('0' + ult.getDate()).slice(-2);
    const enCurso = (m === mes0);
    if (enCurso) fin = hoy;

    let n = 0;
    cli.forEach(c => {
      const ini = fechaISO_(c['inicio recoleccion']);
      if (!ini || ini > fin) return;
      const sal = c.deBaja ? salida(c) : '';
      if (sal && sal <= fin) return;
      n++;
    });
    lista.push({ mes: m, puntos: n, enCurso: enCurso });
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }
  return lista;
}

/* El mes más viejo que la cartera puede enseñar: la primera recolección
   registrada. Sin eso, «Todo» no sabría dónde empezar. */
function car_primerMes_(cli) {
  let min = '';
  cli.forEach(c => {
    const f = fechaISO_(c['inicio recoleccion']);
    if (f && (!min || f < min)) min = f;
  });
  return min ? min.slice(0, 7) : '';
}

/* Un reparto ordenado de mayor a menor, con lo vacío al final y dicho por
   su nombre: «sin región» es un dato que hay que arreglar, no un hueco. */
function car_reparto_(cli, campo, vacio) {
  const cuenta = {};
  cli.forEach(c => {
    let v = String(c[campo] || '').trim();
    /* «Mensual» y «MENSUAL» son lo mismo y estaban partiendo el conteo */
    v = v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : '';
    cuenta[v || vacio] = (cuenta[v || vacio] || 0) + 1;
  });
  return Object.keys(cuenta)
    .map(k => ({ etiqueta: k, cuantos: cuenta[k], vacio: k === vacio }))
    .sort((a, b) => (a.vacio - b.vacio) || (b.cuantos - a.cuantos));
}

/* Todo lo que la cabecera de la cartera necesita para contestar de un
   vistazo. Se calcula sobre la lista que api_cartera ya armó, así que no
   vuelve a leer la hoja. */
function car_resumen_(cli, hoy) {
  const vivos = cli.filter(c => !c.deBaja);
  const anio = hoy.slice(0, 4);
  const hace30 = (function () {
    const d = new Date(hoy + 'T00:00:00'); d.setDate(d.getDate() - 30);
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) +
           '-' + ('0' + d.getDate()).slice(-2);
  })();

  const inicios = cli.map(c => fechaISO_(c['inicio recoleccion'])).filter(String);
  const nuevosAnio = inicios.filter(f => f.slice(0, 4) === anio).length;
  const nuevos30 = inicios.filter(f => f >= hace30 && f <= hoy).length;

  /* «Suspendido» y «de baja» salen de situacion, que es donde vive la
     relación con el cliente. El campo «estado» es otra cosa: lo calcula
     el proceso nocturno desde la última recolección, y dice el ritmo de
     las visitas, no si el cliente sigue con nosotros. Contarlos desde ahí
     era el error de fondo. */
  const porSituacion = {};
  cli.forEach(c => {
    const s = String(c.situacion || 'activo').toLowerCase();
    porSituacion[s] = (porSituacion[s] || 0) + 1;
  });
  const recuperables = ['mora', 'pausa'];
  let suspendidos = 0, bajas = 0;
  Object.keys(porSituacion).forEach(s => {
    if (recuperables.indexOf(s) >= 0) suspendidos += porSituacion[s];
    else if (SITUACIONES_FUERA.indexOf(s) >= 0) bajas += porSituacion[s];
  });

  const c = car_cuenta_(vivos);
  return {
    clientes: c.clientes, puntos: c.puntos,
    agrupados: c.agrupados, puntosAgrupados: c.puntosAgrupados,
    activos: vivos.length, suspendidos: suspendidos, bajas: bajas,
    nuevosAnio: nuevosAnio, nuevos30: nuevos30, anio: anio,
    porSituacion: porSituacion,
    region: car_reparto_(vivos, 'region', 'Sin región'),
    frecuencia: car_reparto_(vivos, 'frecuencia', 'Sin frecuencia'),
    curva: car_curva_(cli, hoy, 12)
  };
}

function api_cartera(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (['mercadeo','supervisor','gerente', 'admin'].indexOf(u.rol) < 0)
    return { ok:false, error:'Esta pantalla es para mercadeo y supervisores.' };

  const hoy = hoyPanama_();
  const filas = leerHoja_(HOJA_CLI);
  const cli = filas.map(c => {
    const o = { id: Number(c.id) || 0 };
    CAMPOS_CARTERA.forEach(k => {
      let v = c[k];
      if (k === 'inicio recoleccion' || k === 'vencimiento') v = fechaISO_(v);
      o[k] = (v === null || v === undefined) ? '' : String(v).trim();
    });
    // qué le falta a esta ficha
    const f = [];
    if (!o['razon social']) f.push('razón social');
    if (!o['ruc']) f.push('RUC');
    if (!o['correo']) f.push('correo');
    const esp = String(o.modalidad || '').toLowerCase() === 'servicio' ||
                String(o.frecuencia || '').toUpperCase().indexOf('ESPECIAL') >= 0;
    if (!o['inicio recoleccion'] && !esp) f.push('inicio de recolección');
    if (!o['plan costo'] && String(o.modalidad||'').toLowerCase() !== 'peso') f.push('tarifa');
    if (String(o.modalidad||'').toLowerCase() === 'peso' && !o['tarifa kg adic'])
      f.push('tarifa por kilo');
    if (!o['frecuencia']) f.push('frecuencia');
    o.faltantes = f;
    // estado del contrato
    o.diasVence = '';
    if (esp) { o.diasVence = ''; o.contratoEstado = 'SERVICIO ESPECIAL'; }
    else if (o['vencimiento']) {
      const d = Math.round((new Date(o['vencimiento'] + 'T00:00:00') -
                            new Date(hoy + 'T00:00:00')) / 86400000);
      o.diasVence = d;
      o.contratoEstado = d < 0 ? 'VENCIDO' : (d <= 60 ? 'POR VENCER' : 'VIGENTE');
    } else o.contratoEstado = 'SIN FECHA';
    return o;
  }).sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)));

  const r = { total: cli.length, activos: 0, bajas: 0, especiales: 0,
              sinRuc: 0, sinInicio: 0, sinCorreo: 0,
              vencidos: 0, porVencer: 0, completas: 0, sinMotivo: 0 };
  cli.forEach(c => {
    /* un servicio especial no necesita contrato: no se le exige */
    c.esEspecial = String(c.modalidad || '').toLowerCase() === 'servicio' ||
                   String(c.frecuencia || '').toUpperCase().indexOf('ESPECIAL') >= 0;
    c.situacion = String(c.situacion || 'activo').toLowerCase();
    c.deBaja = SITUACIONES_FUERA.indexOf(c.situacion) >= 0;
    if (c.esEspecial) { r.especiales++; c.contratoEstado = 'SERVICIO ESPECIAL'; }
    if (c.deBaja) {
      r.bajas++;
      if (!String(c['fecha baja'] || '').trim()) { r.sinMotivo++; c.faltantes.push('fecha de la baja'); }
    } else r.activos++;

    if (!c['ruc']) r.sinRuc++;
    if (!c['inicio recoleccion'] && !c.esEspecial) r.sinInicio++;
    if (!c['correo']) r.sinCorreo++;
    if (c.contratoEstado === 'VENCIDO' && !c.deBaja && !c.esEspecial) r.vencidos++;
    if (c.contratoEstado === 'POR VENCER' && !c.deBaja) r.porVencer++;
    if (!c.faltantes.length) r.completas++;
  });

  return { ok:true, usuario:u, hoy:hoy, clientes:cli, resumen:r,
           cabecera: car_resumen_(cli, hoy),
           frecuencias: frecuenciasCon_(filas, 'frecuencia'),
           canales: ['correo','whatsapp','ambos','ninguno'],
           modalidades: MODALIDADES, situaciones: SITUACIONES,
           situacionesFuera: SITUACIONES_FUERA, diasSemana: DIAS_SEMANA,
           carteras: CARTERAS, puedeTarifas: true };
}

function api_guardarFicha(pin, id, datos) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['mercadeo','supervisor', 'admin'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin permiso para editar fichas.' };

  // las tarifas mueven dinero: solo el supervisor las cambia
  /* Mercadeo lleva la relación con el cliente: si negocia una tarifa o un
     cambio de frecuencia, debe poder registrarlo. Nada queda bloqueado, pero
     todo lo que mueve dinero deja constancia de quién lo cambió y cuándo. */
  const CON_HUELLA = ['plan costo','plan kg','tarifa kg adic','tarifa visita adic',
                      'frecuencia','modalidad','retiene itbms','situacion','dias semana',
                      'tipo cartera'];

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_CLI);
    const vals = h.getDataRange().getValues();
    const cab = vals[0].map(String);
    const cId = cab.indexOf('id');
    if (cId < 0) return { ok:false, error:'La hoja Clientes no tiene columna id.' };

    let fila = -1;
    for (let i = 1; i < vals.length; i++) {
      if (Number(vals[i][cId]) === Number(id)) { fila = i; break; }
    }
    if (fila < 0) return { ok:false, error:'No encontré ese cliente.' };

    const escritos = [], cambios = [], rechazados = [];

    /* Sacar a un cliente de servicio tiene efecto operativo: deja de aparecer
       en las rutas. Por eso pide fecha, y el motivo va implícito en la situación. */
    const sit = String(datos.situacion || '').toLowerCase();
    if (sit && SITUACIONES_FUERA.indexOf(sit) >= 0) {
      const cF = cab.indexOf('fecha baja');
      const yaTenia = cF >= 0 ? String(vals[fila][cF] || '').trim() : '';
      if (!datos['fecha baja'] && !yaTenia) datos['fecha baja'] = hoyPanama_();
    }
    if (sit === 'activo') { datos['motivo baja'] = ''; datos['fecha baja'] = ''; }

    Object.keys(datos || {}).forEach(k => {
      if (CAMPOS_CARTERA.indexOf(k) < 0) { rechazados.push(k); return; }
      let col = cab.indexOf(k);
      if (col < 0) {                       // la columna no existe todavía: se crea al final
        col = cab.length;
        h.getRange(1, col + 1).setValue(k);
        cab.push(k);
      }
      const antes = String(vals[fila][col] === undefined ? '' : vals[fila][col]);
      const ahora = String(datos[k] === null || datos[k] === undefined ? '' : datos[k]);
      if (antes === ahora) return;         // no se escribe lo que no cambió
      h.getRange(fila + 1, col + 1).setValue(datos[k]);
      escritos.push(k);
      if (CON_HUELLA.indexOf(k) >= 0) cambios.push(k + ': "' + antes + '" → "' + ahora + '"');
    });

    /* huella de lo que mueve dinero */
    if (cambios.length) {
      let cNot = cab.indexOf('notas comerciales');
      if (cNot < 0) { cNot = cab.length; h.getRange(1, cNot + 1).setValue('notas comerciales'); cab.push(cNot); }
      const sello = '[' + hoyPanama_() + ' ' +
        Utilities.formatDate(new Date(), 'America/Panama', 'HH:mm') + ' · ' + u.nombre +
        ' cambió ' + cambios.join(' · ') + ']';
      const previo = String(vals[fila][cNot] || '');
      h.getRange(fila + 1, cNot + 1).setValue((previo ? previo + ' ' : '') + sello);
    }

    marcar_('mercadeo');

    return { ok: true, escritos: escritos.length, cambios: cambios.length,
             rechazados: rechazados, bloqueados: [] };
  } finally { lock.releaseLock(); }
}

/* Rellena la fecha de primera recolección desde el histórico, para los que no la tienen.
   La más antigua registrada es, a efectos del ciclo, el punto desde el cual contar. */
function api_deducirInicios(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (!esAdmin_(u)) return { ok:false, error:'Solo el administrador puede hacer esto.' };

  const primera = {};
  leerHoja_(HOJA_REC).forEach(r => {
    const n = String(r.Cliente || '').trim().toUpperCase();
    const f = fechaISO_(r['Fecha de Recoleccion']);
    if (!n || !f) return;
    if (!primera[n] || f < primera[n]) primera[n] = f;
  });

  const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_CLI);
  const vals = h.getDataRange().getValues();
  const cab = vals[0].map(String);
  let col = cab.indexOf('inicio recoleccion');
  if (col < 0) { col = cab.length; h.getRange(1, col + 1).setValue('inicio recoleccion'); }
  const cNom = cab.indexOf('nombre');

  const cambios = [];
  for (let i = 1; i < vals.length; i++) {
    const ya = String(vals[i][col] || '').trim();
    if (ya) continue;
    const n = String(vals[i][cNom] || '').trim().toUpperCase();
    if (primera[n]) {
      h.getRange(i + 1, col + 1).setValue(primera[n]);
      cambios.push({ cliente: vals[i][cNom], fecha: primera[n] });
    }
  }
  return { ok:true, cambios: cambios.length, detalle: cambios.slice(0, 40) };
}
/* ═══════════════ PROSPECTOS (pipeline comercial) ═══════════════
   Una fila por punto de servicio, no por empresa: dos sucursales de la
   misma razón social son dos prospectos con su propia cotización.
   Al llegar a "Firmado" se genera la solicitud; al aprobarla, el prospecto
   pasa a Clientes y queda en "Pasado a cartera". */

const HOJA_PRO = 'Prospectos';

const COLS_PRO = [
  // identificación
  'codigoCliente','codigoPropuesta','empresa','razon social','ruc','dv','sector',
  // propuesta y tarifas
  'frecuencia','costo visita','itbms','kg plan','tarifa kg adic','tarifa visita adic',
  'validez propuesta','plazo contrato','kg propuesta','valor cotizado','valor contratado',
  // contacto
  'contacto','cargo','telefono','celular','correo',
  // estado y seguimiento
  'estado','fecha contacto','fecha propuesta','proximo seguimiento','notas','asesor',
  // documentación
  'doc aviso operacion','doc cedula representante','doc registro publico',
  'doc datos generales','doc datos bancarios','doc propuesta firmada','doc contrato firmado',
  // contrato y cierre
  'n contrato','fecha contrato','inicio recoleccion','vencimiento','horario recoleccion',
  'representante legal','cedula representante','folio registro',
  'genero representante','nacionalidad representante','direccion',
  // formulario que llena el propio cliente
  'provincia','zona','actividad','tipo residuo','kg estimado','frecuencia estimada',
  'formulario estado','formulario enviado','formulario recibido','notas cliente','base del kg',
  // tipo de servicio: decide qué campos aplican y qué dice la propuesta
  'tipoServicio','descripcionTrabajo','cantidadEstimada','fechaTentativa','notasPropuesta',
  'formularioVisto',
  // lo que contabilidad exige para poder facturar
  'retiene itbms','facturacion','canal envio',
  'clienteId','registradoEn'
];

const TIPOS_SERVICIO = ['RECURRENTE', 'VISITA UNICA'];

/* Un servicio de una sola visita y un contrato recurrente son dos negocios
   distintos: uno lleva plazo, contrato y representante legal; el otro se
   cotiza, se hace y se registra. Pedirle a quien cotiza los datos de un
   contrato para algo que no lleva contrato es lo que llenaba de campos
   vacíos las fichas.

   Los prospectos anteriores al 4 sep 2026 no tienen el campo: su tipo se
   deduce de la frecuencia, que es donde estaba escrito "SERVICIO ESPECIAL". */
function esVisitaUnica_(p) {
  const t = String((p && p.tipoServicio) || '').trim().toUpperCase();
  if (t) return t.indexOf('UNICA') >= 0 || t.indexOf('ÚNICA') >= 0 || t.indexOf('ESPECIAL') >= 0;
  return String((p && p.frecuencia) || '').toUpperCase().indexOf('ESPECIAL') >= 0;
}
function tipoServicioDe_(p) { return esVisitaUnica_(p) ? 'VISITA UNICA' : 'RECURRENTE'; }

/* En una visita única no existe el contrato, así que su casilla tampoco:
   una lista que jamás puede completarse es una lista que se deja de mirar. */
function docsDe_(p) {
  return esVisitaUnica_(p)
    ? DOCS_PRO.filter(d => d[0] !== 'doc contrato firmado')
    : DOCS_PRO;
}

const ESTADOS_PRO = ['Registrado','Formulario enviado','Formulario recibido',
                     'Propuesta enviada','En negociación','Contrato en proceso',
                     'Firmado','Pasado a cartera','Rechazado','Stand-by'];

/* Antes de que exista propuesta, mercadeo puede corregir sus propios errores. */
const BORRABLES_MERCADEO = ['Registrado','Formulario enviado','Formulario recibido'];

/* a partir de aquí el negocio ya avanzó a contrato: el embudo lo cuenta como
   cerrado y el formulario del cliente deja de recibir datos */
const CERRADOS_PRO = ['Contrato en proceso','Firmado','Pasado a cartera'];

/* Y a partir de aquí la ficha ya no se toca. No es la misma lista: mientras el
   contrato se está armando, mercadeo todavía corrige precios y datos — es
   justamente cuando más los corrige. El candado cae cuando el cliente firma. */
const BLOQUEADOS_PRO = ['Firmado','Pasado a cartera'];

const DOCS_PRO = [
  ['doc aviso operacion','Aviso de operación'],
  ['doc cedula representante','Cédula del representante'],
  ['doc registro publico','Registro público'],
  ['doc datos generales','Datos generales'],
  ['doc datos bancarios','Datos bancarios'],
  ['doc propuesta firmada','Propuesta firmada'],
  ['doc contrato firmado','Contrato firmado']
];

function crearHojaProspectos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let h = ss.getSheetByName(HOJA_PRO);
  if (h) {
    SpreadsheetApp.getUi().alert('La hoja Prospectos ya existe. No se tocó nada.');
    return;
  }
  h = crearHoja_(ss, HOJA_PRO, COLS_PRO);
  SpreadsheetApp.getUi().alert('Hoja Prospectos creada con ' + COLS_PRO.length + ' columnas.\n\n' +
    'Ya puedes trabajar el pipeline desde la página de mercadeo.');
}

function api_prospectos(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (['mercadeo','supervisor','gerente', 'admin'].indexOf(u.rol) < 0)
    return { ok:false, error:'Esta pantalla es para mercadeo y supervisores.' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(HOJA_PRO)) crearHoja_(ss, HOJA_PRO, COLS_PRO);

  const hoy = hoyPanama_();
  const lista = leerHoja_(HOJA_PRO).map(r => {
    const o = {};
    COLS_PRO.forEach(k => {
      let v = r[k];
      if (k.indexOf('fecha') === 0 || k === 'inicio recoleccion' ||
          k === 'vencimiento' || k === 'proximo seguimiento') v = fechaISO_(v);
      o[k] = (v === null || v === undefined) ? '' : String(v).trim();
    });
    // el tipo decide qué campos y qué documentos aplican
    o.tipoServicio = tipoServicioDe_(o);
    o.visitaUnica  = esVisitaUnica_(o);
    /* Las notas estándar viajan ya armadas, con los números de ESTE prospecto.
       Antes el cuadro abría vacío y las notas se traían con un botón: nadie
       pulsa un botón para que le den lo que debería estar ahí, así que se
       copiaban a mano de otra propuesta — y con los números de la otra. */
    o.notasBase = notasBase_(o);
    // avance de la documentación, contra las casillas que sí aplican
    const docs = docsDe_(o);
    let listos = 0;
    docs.forEach(d => { if (String(o[d[0]]).toUpperCase() === 'SI') listos++; });
    o.docsListos = listos;
    o.docsTotal = docs.length;
    o.pctDocs = Math.round(listos / docs.length * 100);
    // cuánto lleva quieto
    const ref = o['fecha propuesta'] || o['fecha contacto'];
    o.diasQuieto = ref
      ? Math.round((new Date(hoy+'T00:00:00') - new Date(ref+'T00:00:00')) / 86400000) : '';
    o.atrasado = !!(o['proximo seguimiento'] && o['proximo seguimiento'] < hoy &&
                    ['Rechazado','Pasado a cartera'].indexOf(o.estado) < 0);
    return o;
  });

  const r = { total: lista.length, activos: 0, firmados: 0, rechazados: 0,
              atrasados: 0, valorCotizado: 0, valorContratado: 0 };
  lista.forEach(p => {
    if (['Rechazado','Pasado a cartera'].indexOf(p.estado) < 0) r.activos++;
    if (p.estado === 'Firmado') r.firmados++;
    if (p.estado === 'Rechazado') r.rechazados++;
    if (p.atrasado) r.atrasados++;
    r.valorCotizado += Number(p['valor cotizado']) || 0;
    r.valorContratado += Number(p['valor contratado']) || 0;
  });
  r.valorCotizado = Math.round(r.valorCotizado*100)/100;
  r.valorContratado = Math.round(r.valorContratado*100)/100;
  r.conversion = r.total ? Math.round((r.firmados + (r.total - r.activos - r.rechazados)) / r.total * 100) : 0;

  return { ok:true, usuario:u, hoy:hoy, prospectos:lista, resumen:r,
           estados: ESTADOS_PRO, cerrados: CERRADOS_PRO,
           bloqueados: BLOQUEADOS_PRO, documentos: DOCS_PRO,
           tiposServicio: TIPOS_SERVICIO,
           frecuencias: frecuenciasCon_(lista, 'frecuencia'),
           sectores: ['PRIVADO','GOBIERNO','MINERA','MERCADOS','OTRO'] };
}

function api_guardarProspecto(pin, codigoPropuesta, datos) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['mercadeo','supervisor', 'admin'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin permiso.' };

  datos = datos || {};
  // el vencimiento no se escribe: sale de la fecha del contrato más el plazo pactado
  const base = String(datos['fecha contrato'] || '').trim();
  const meses = Number(datos['plazo contrato']);
  if (base && meses > 0) {
    const d = new Date(base + 'T12:00:00');
    if (!isNaN(d.getTime())) {
      d.setMonth(d.getMonth() + meses);
      datos['vencimiento'] = Utilities.formatDate(d, 'America/Panama', 'yyyy-MM-dd');
    }
  } else if (!base) {
    datos['vencimiento'] = '';
  }

  /* El valor cotizado ya no se escribe a mano. Se escribía en una casilla
     aparte del costo que lo compone, y por eso UNICARNES llegó a tener
     costo por visita 3,240 y valor cotizado 3: nadie estaba mintiendo, era
     un número tecleado dos veces. Ahora sale del costo. */
  if (datos['costo visita'] !== undefined && datos['costo visita'] !== '') {
    const c = Number(String(datos['costo visita']).replace(/,/g, ''));
    if (isFinite(c)) datos['valor cotizado'] = c;
  }

  /* El tipo de servicio se normaliza aquí: la ficha manda 'VISITA UNICA' o
     'RECURRENTE', y si no lo manda (prospecto viejo) no se toca. */
  if (datos.tipoServicio !== undefined && String(datos.tipoServicio).trim() !== '') {
    datos.tipoServicio = tipoServicioDe_({ tipoServicio: datos.tipoServicio });
    if (datos.tipoServicio === 'VISITA UNICA') {
      // un trabajo puntual no lleva contrato: no se guardan sus campos con basura
      ['frecuencia','plazo contrato','kg plan','tarifa visita adic',
       'n contrato','fecha contrato','inicio recoleccion','vencimiento',
       'horario recoleccion'].forEach(k => { datos[k] = ''; });
    }
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let h = ss.getSheetByName(HOJA_PRO);
    if (!h) h = crearHoja_(ss, HOJA_PRO, COLS_PRO);
    const vals = h.getDataRange().getValues();
    const cab = vals[0].map(String);
    const cCod = cab.indexOf('codigoPropuesta');

    let fila = -1;
    if (codigoPropuesta) {
      for (let i = 1; i < vals.length; i++)
        if (String(vals[i][cCod]).trim() === String(codigoPropuesta).trim()) { fila = i; break; }
    }

    /* Desde que el cliente firma, la ficha queda cerrada: lo que dice ya está
       firmado por él y cambiarlo aquí no cambia el papel que él tiene.
       Antes de eso —incluso con el contrato en proceso— se edita normal.
       Supervisión reabre, que es lo que la pantalla ofrece y lo que dice el
       aviso cuando alguien se topa con el candado. */
    if (fila >= 0) {
      const cEst = cab.indexOf('estado');
      const est = cEst >= 0 ? String(vals[fila][cEst]).trim() : '';
      if (BLOQUEADOS_PRO.indexOf(est) >= 0 && !esSupervisor_(u) && !datos.__forzar) {
        return { ok:false, error:'El cliente ya firmó esta propuesta (está en "' + est +
                 '"), así que ya no se edita. Pídele a supervisión que la reabra ' +
                 'si hay un error.' };
      }
      delete datos.__forzar;
    }

    if (fila < 0) {           // prospecto nuevo
      /* Un doble clic en Guardar no debe crear dos veces el mismo prospecto:
         si ya existe uno con ese nombre y todavía no tiene propuesta, se avisa. */
      const nom = String(datos.empresa || '').trim().toUpperCase();
      if (nom) {
        const cEmp = cab.indexOf('empresa'), cEst = cab.indexOf('estado');
        for (let i = 1; i < vals.length; i++) {
          if (String(vals[i][cEmp] || '').trim().toUpperCase() !== nom) continue;
          const e = cEst >= 0 ? String(vals[i][cEst] || '').trim() : '';
          if (['Rechazado','Pasado a cartera'].indexOf(e) >= 0) continue;
          return { ok:false, duplicado:true,
                   codigoExistente: String(vals[i][cCod] || '').trim(),
                   error:'Ya existe un prospecto de "' + String(datos.empresa) + '" en estado "' +
                         e + '". Ábrelo en vez de crear otro.' };
        }
      }

      COLS_PRO.forEach(k => {           // hojas creadas antes pueden no tener todas
        if (cab.indexOf(k) < 0) { h.getRange(1, cab.length + 1).setValue(k); cab.push(k); }
      });
      const cod = codigoPropuesta || siguienteCodigoPropuesta_();
      const nueva = COLS_PRO.map(k => {
        if (k === 'codigoPropuesta') return cod;
        if (k === 'registradoEn') return new Date();
        if (k === 'estado') return datos.estado || 'Registrado';
        if (k === 'asesor') return datos.asesor || u.nombre;
        if (k === 'fecha contacto') return datos['fecha contacto'] || hoyPanama_();
        return datos[k] !== undefined ? datos[k] : '';
      });
      h.appendRow(nueva);
      marcar_('mercadeo');
      return { ok: true, creado:true, codigoPropuesta:cod };
    }

    Object.keys(datos || {}).forEach(k => {
      if (k === 'codigoPropuesta' || k === 'registradoEn') return;
      if (COLS_PRO.indexOf(k) < 0) return;
      let c = cab.indexOf(k);
      if (c < 0) {                      // la hoja es de antes: se agrega la columna
        c = cab.length;
        h.getRange(1, c + 1).setValue(k);
        cab.push(k);
      }
      h.getRange(fila + 1, c + 1).setValue(datos[k]);
    });
    marcar_('mercadeo');
    return { ok: true, creado:false, codigoPropuesta:codigoPropuesta };
  } finally { lock.releaseLock(); }
}

/* PRO-AA-NNN-001, con el correlativo del año */
function siguienteCodigoPropuesta_() {
  const anio = hoyPanama_().slice(2, 4);
  const previos = leerHoja_(HOJA_PRO)
    .map(r => String(r.codigoPropuesta || ''))
    .filter(c => c.indexOf('PRO-' + anio + '-') === 0)
    .map(c => Number((c.split('-')[2] || '').replace(/\D/g,'')) || 0);
  const n = (previos.length ? Math.max.apply(null, previos) : 0) + 1;
  return 'PRO-' + anio + '-' + ('00' + n).slice(-3) + '-001';
}

/* Un prospecto firmado se envía a operaciones como solicitud. */
/* El vencimiento del contrato, cuando el prospecto no lo trae escrito pero
   sí trae la fecha de firma y el plazo en meses. Vale la pena calcularlo: la
   columna `vencimiento` estaba vacía en el 100% de la cartera, y de ella
   dependen dos vigilantes —contratos por vencer y contratos vencidos— que
   por eso no avisaban de nada. */
function vencimientoContrato_(p) {
  const f = fechaISO_(p['fecha contrato']) || fechaISO_(p['inicio recoleccion']);
  const meses = Number(String(p['plazo contrato'] || '').replace(/\D/g, '')) || 0;
  if (!f || !meses) return '';
  const d = new Date(f + 'T12:00:00');
  if (isNaN(d.getTime())) return '';
  d.setMonth(d.getMonth() + meses);
  return Utilities.formatDate(d, 'America/Panama', 'yyyy-MM-dd');
}

/* ── Una propuesta pasa a cartera UNA vez ─────────────────────────────
   Diez clics en «Enviar a cartera» creaban diez solicitudes del mismo
   cliente en la bandeja del supervisor de rutas. Hay tres puertas por
   donde se colaba, y las tres tienen que estar cerradas:

   1. EL BOTÓN no se apagaba al pulsarlo. Se arregla en la pantalla, y es
      lo que atrapa el 99% de los casos — pero no basta: una pantalla es
      una sugerencia, el servidor es la ley.

   2. LA COMPROBACIÓN NO ERA ATÓMICA. Se leía el estado del prospecto
      FUERA de todo candado. Diez llamadas que salen en el mismo segundo
      leen las diez «Firmado», las diez pasan la guarda, y las diez crean
      su solicitud. Que la primera lo cierre no sirve: para entonces las
      otras nueve ya iban en camino. Por eso ahora todo —leer, decidir y
      escribir— ocurre DENTRO del mismo candado.

   3. LA IDEMPOTENCIA. Aun con candado, si algo falla a mitad de camino y
      alguien reintenta, no debe salir una segunda solicitud. Si ya existe
      una PENDIENTE para esta propuesta, se devuelve ESA en vez de crear
      otra. Es la misma regla que ya salvó a la bandeja de los asistentes:
      la clave estable manda, no el número de veces que se llame.        */
function api_pasarACartera(pin, codigoPropuesta) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['mercadeo','supervisor', 'admin'].indexOf(u.rol) < 0) return { ok:false, error:'Sin permiso.' };

  const cod = String(codigoPropuesta || '').trim();
  if (!cod) return { ok:false, error:'Falta el código de la propuesta.' };

  const lock = LockService.getScriptLock();
  /* Si no se consigue el candado en 30 segundos es porque otra llamada está
     haciendo exactamente esto. Mejor decirlo que crear la segunda solicitud. */
  try { lock.waitLock(30000); }
  catch (e) { return { ok:false, error:'Se está enviando en este momento. Espera un segundo.' }; }
  try {
    return pasarACarteraBloqueado_(u, pin, cod);
  } finally { lock.releaseLock(); }
}

function pasarACarteraBloqueado_(u, pin, cod) {
  /* se relee DENTRO del candado: lo que se leyó antes de esperar ya podría
     estar viejo, y decidir con un dato viejo es justo el defecto */
  const p = leerHoja_(HOJA_PRO).find(r =>
    String(r.codigoPropuesta || '').trim() === cod);
  if (!p) return { ok:false, error:'No encontré ese prospecto.' };
  if (String(p.estado).trim() === 'Pasado a cartera')
    return { ok:false, error:'Esta propuesta ya pasó a cartera. Busca el cliente en Cartera.' };
  if (String(p.estado).trim() !== 'Firmado')
    return { ok:false, error:'Solo se pasan a cartera los prospectos en estado Firmado.' };

  /* ¿Ya hay una solicitud viva de esta propuesta? Entonces no se crea otra:
     se devuelve la que hay. Puede existir aunque el prospecto siga en
     "Firmado" —si el cierre falló la vez anterior—, y ese es precisamente
     el caso en que alguien vuelve a pulsar el botón. */
  const yaHay = leerHoja_(HOJA_SOL).find(x =>
    String(x.codigoPropuesta || '').trim() === cod &&
    String(x.estado || '').trim().toUpperCase() === 'PENDIENTE');
  if (yaHay) {
    /* de paso se termina de cerrar el prospecto, que es lo que quedó a
       medias la vez anterior */
    api_guardarProspecto(pin, cod, { estado: 'Pasado a cartera', __forzar: true });
    return { ok:false, yaEnviada:true, solicitudId: String(yaHay.solicitudId || ''),
             error:'Este cliente ya está con logística esperando revisión' +
                   (fechaISO_(yaHay.fechaSolicitud)
                      ? ' desde el ' + fechaISO_(yaHay.fechaSolicitud) : '') +
                   '. No se envió otra vez.' };
  }

  const faltan = docsDe_(p).filter(d => String(p[d[0]] || '').toUpperCase() !== 'SI')
                           .map(d => d[1]);

  /* TODO lo que la propuesta ya sabe viaja con la solicitud. Antes iban
     once campos y el resto se perdía: el cliente nacía sin RUC, sin plan,
     sin tarifas, sin contrato y sin vencimiento, y alguien tenía que ir a
     copiarlos a mano desde la propuesta. Eso es exactamente lo que dejó
     la cartera llena de huecos. */
  const r = api_guardarSolicitud(pin, {
    empresa: String(p.empresa || ''), razonSocial: String(p['razon social'] || ''),
    ruc: String(p.ruc || ''), dv: String(p.dv || ''), sector: String(p.sector || ''),
    contacto: String(p.contacto || ''),
    cargo: String(p.cargo || ''), telefono: String(p.telefono || ''),
    celular: String(p.celular || ''), correo: String(p.correo || ''),
    /* la dirección puede venir del prospecto o del formulario que llenó el
       propio cliente; se prefiere la que esté escrita */
    direccion: String(p.direccion || ''),
    zona: String(p.zona || ''), provincia: String(p.provincia || ''),
    frecuencia: String(p.frecuencia || ''), kgMax: p['kg plan'] || '',
    inicioRecoleccion: fechaISO_(p['inicio recoleccion']),
    codigoPropuesta: String(p.codigoPropuesta || ''),
    tipoServicio: tipoServicioDe_(p),
    planCosto: p['costo visita'] || '', planKg: p['kg plan'] || '',
    tarifaKgAdic: p['tarifa kg adic'] || '',
    tarifaVisitaAdic: p['tarifa visita adic'] || '',
    contrato: String(p['n contrato'] || ''),
    fechaContrato: fechaISO_(p['fecha contrato']),
    plazoContrato: String(p['plazo contrato'] || ''),
    vencimiento: fechaISO_(p.vencimiento) || vencimientoContrato_(p),
    horarioRecoleccion: String(p['horario recoleccion'] || ''),
    retieneItbms: String(p['retiene itbms'] || ''),
    facturacion: String(p.facturacion || ''),
    canalEnvio: String(p['canal envio'] || ''),
    notas: 'Desde propuesta ' + cod +
           (faltan.length ? ' · DOCUMENTOS PENDIENTES: ' + faltan.join(', ') : ' · documentación completa')
  });
  if (!r || !r.ok) return r;

  /* ── Y el prospecto se cierra ────────────────────────────────────
     Esta llamada estaba y NO FUNCIONABA, y nadie lo veía porque no se
     miraba lo que devolvía. Un prospecto en "Firmado" ya está cerrado a
     la edición —para que nadie le cambie el precio después de firmar— y
     guardarProspecto lo rechazaba. Resultado: el prospecto se quedaba en
     "Firmado" y se podía pasar a cartera otra vez, y otra, creando una
     solicitud por cada clic y un cliente duplicado por cada aprobación.

     `__forzar` porque aquí no es una persona editando algo cerrado: es el
     sistema cerrándolo. Y el resultado se revisa: si el cierre falla, la
     solicitud ya está creada y hay que decirlo, no devolver ok. */
  const cierre = api_guardarProspecto(pin, cod,
    { estado: 'Pasado a cartera', __forzar: true });
  if (!cierre || !cierre.ok) {
    return { ok:true, faltan: faltan, solicitudId: r.solicitudId,
             aviso: 'La solicitud se creó, pero la propuesta no quedó marcada como ' +
                    'pasada a cartera. Ciérrala a mano para que no se envíe dos veces.' };
  }
  marcar_('mercadeo');
  return { ok: true, faltan: faltan, solicitudId: r.solicitudId };
}

/* ═══ Notas de la propuesta ═══
   Antes vivían escritas dentro de Propuesta.html: siete viñetas fijas, iguales
   para todos, que en un servicio de una sola visita afirmaban cosas falsas
   ("contrato a 12 meses", "los precios se mantienen durante la vigencia del
   contrato"). Ahora se generan según el tipo de servicio, se pueden editar y
   se guardan con el prospecto — así una propuesta se reimprime idéntica meses
   después aunque la plantilla haya cambiado. */
/* La propuesta impresa ya escribe "Propuesta vigente hasta ..." sola, como
   primera viñeta y con la fecha calculada. Si alguien deja esa misma línea
   guardada dentro de las notas, saldría dos veces y con fechas distintas.
   Se descarta al imprimir; en el editor se deja ver, no molesta. */
function esLineaVigencia_(t) {
  return /^\s*propuesta\s+vigente\s+hasta/i.test(String(t || ''));
}

function notasBase_(p) {
  const n2 = v => (Math.round((Number(v) || 0) * 100) / 100).toFixed(2);
  const especial = esVisitaUnica_(p);
  const kg    = Number(p['kg plan']) || 0;
  const tKg   = Number(p['tarifa kg adic']) || 0;
  const tVis  = Number(p['tarifa visita adic']) || 0;
  const plazo = Number(String(p['plazo contrato'] || '').replace(/\D/g, '')) || 0;

  const l = [];
  if (especial) {
    l.push('Esta cotización corresponde a una recolección única, no a un servicio recurrente.');
    if (tKg) l.push('El excedente sobre la cantidad estimada se cotiza a B/. ' + n2(tKg) + ' por kilogramo más ITBMS.');
    l.push('El servicio se factura una vez completado.');
    l.push('La fecha se coordina con un mínimo de 48 horas de anticipación.');
    l.push('El precio cubre únicamente el trabajo aquí descrito.');
  } else {
    /* el plazo NUNCA se inventa: si no está, la línea no existe */
    if (plazo) l.push('Contrato a ' + plazo + ' meses, frecuencia ' +
                      String(p.frecuencia || '').trim() + '.');
    else if (String(p.frecuencia || '').trim())
      l.push('Frecuencia de servicio: ' + String(p.frecuencia).trim() + '.');
    if (tKg)  l.push('El kilogramo adicional, a partir de ' + kg + ' kg, tiene un costo de B/. ' +
                     n2(tKg) + ' más ITBMS.');
    if (tVis) l.push('Las visitas adicionales a la frecuencia contratada tienen un costo de B/. ' +
                     n2(tVis) + ' más ITBMS.');
    l.push('El servicio realizado debe ser facturado y cancelado a mes corriente.');
    l.push('Cualquier cambio en la programación debe informarse con un máximo de 48 horas de anticipación.');
    if (plazo) l.push('Los precios se mantienen durante toda la vigencia del contrato.');
  }
  return l;
}

/* Una propuesta se arma en el momento desde la ficha del prospecto:
   no se guarda ningún archivo, así una corrección de tarifa se refleja sola. */
function api_propuesta(pin, codigoPropuesta) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['mercadeo','supervisor','gerente', 'admin'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin permiso.' };

  const r = leerHoja_(HOJA_PRO).find(p =>
    String(p.codigoPropuesta || '').trim() === String(codigoPropuesta).trim());
  if (!r) return { ok:false, error:'No encontré esa propuesta.' };

  const o = {};
  COLS_PRO.forEach(k => {
    let v = r[k];
    if (k.indexOf('fecha') === 0 || k === 'inicio recoleccion' ||
        k === 'vencimiento' || k === 'proximo seguimiento') v = fechaISO_(v);
    o[k] = (v === null || v === undefined) ? '' : String(v).trim();
  });

  o.tipoServicio = tipoServicioDe_(o);
  o.visitaUnica  = esVisitaUnica_(o);

  /* Las notas guardadas mandan sobre las generadas: si Mercadeo las ajustó
     para este cliente, la propuesta se reimprime igual dentro de un año. */
  const guardadas = String(o.notasPropuesta || '').trim();
  o.notas_lista = (guardadas
    ? guardadas.split('\n').map(x => x.trim()).filter(Boolean)
    : notasBase_(o)).filter(x => !esLineaVigencia_(x));
  o.notasEditadas = !!guardadas;

  return { ok:true, usuario:u, hoy:hoyPanama_(), prospecto:o, empresa:datosDoc_('propuesta') };
}

/* Devuelve las notas que le tocan a un prospecto, para precargar el editor.
   Si pide 'base', ignora lo guardado y regenera desde el tipo de servicio —
   es el botón "restaurar" de la pantalla. */
function api_notasPropuesta(pin, codigoPropuesta, base, ctx) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['mercadeo','supervisor','gerente','admin'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin permiso.' };

  /* La ficha puede pedir las notas antes de guardar el prospecto: en ese caso
     no hay fila que buscar y se trabaja con lo que hay en pantalla. */
  let r = null;
  if (String(codigoPropuesta || '').trim()) {
    r = leerHoja_(HOJA_PRO).find(x =>
      String(x.codigoPropuesta || '').trim() === String(codigoPropuesta).trim()) || null;
  }
  if (!r) r = ctx || null;
  if (!r) return { ok:false, error:'No encontré esa propuesta.' };

  const guardadas = String(r.notasPropuesta || '').trim();
  const usar = (!base && guardadas)
    ? guardadas.split('\n').map(x => x.trim()).filter(Boolean)
    : notasBase_(r);
  return { ok:true, notas: usar, editadas: !base && !!guardadas,
           tipoServicio: tipoServicioDe_(r) };
}

/* ═══════ Contrato: solo se genera si la ficha está completa ═══════
   Es un documento legal que se imprime, se firma y se archiva.
   Un campo vacío aquí es un contrato inválido, así que se valida antes. */

const REQ_CONTRATO = [
  ['empresa','Nombre de la empresa','Empresa'],
  ['razon social','Razón social','Empresa'],
  ['ruc','RUC','Empresa'],
  ['dv','DV','Empresa'],
  ['folio registro','Folio del Registro Público','Empresa'],
  ['direccion','Dirección, sucursales y horarios','Empresa'],
  ['correo','Correo para notificaciones','Empresa'],
  ['telefono','Teléfono','Empresa'],
  ['representante legal','Nombre del representante legal','Representante legal'],
  ['cedula representante','Cédula del representante','Representante legal'],
  ['cargo','Cargo del representante','Representante legal'],
  ['genero representante','Género del representante','Representante legal'],
  ['nacionalidad representante','Nacionalidad del representante','Representante legal'],
  ['frecuencia','Frecuencia del servicio','Servicio'],
  ['costo visita','Costo por visita','Servicio'],
  ['kg plan','Kilogramos incluidos en el plan','Servicio'],
  ['tarifa kg adic','Tarifa del kilogramo adicional','Servicio'],
  ['codigoPropuesta','Código de la propuesta','Servicio'],
  ['fecha propuesta','Fecha de la propuesta','Servicio'],
  ['n contrato','Número de contrato','Servicio']
];

/* la propuesta y el contrato firmados son consecuencia, no requisito */
const DOCS_CONTRATO = ['doc aviso operacion','doc cedula representante',
                       'doc registro publico','doc datos generales','doc datos bancarios'];

function validarContrato_(p) {
  const faltan = {};
  REQ_CONTRATO.forEach(r => {
    if (!String(p[r[0]] || '').trim()) {
      if (!faltan[r[2]]) faltan[r[2]] = [];
      faltan[r[2]].push(r[1]);
    }
  });
  const docs = [];
  DOCS_CONTRATO.forEach(k => {
    if (String(p[k] || '').toUpperCase() !== 'SI') {
      const d = DOCS_PRO.find(x => x[0] === k);
      docs.push(d ? d[1] : k);
    }
  });
  if (docs.length) faltan['Documentos por recibir'] = docs;
  return faltan;
}

function api_contrato(pin, codigoPropuesta) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['mercadeo','supervisor','gerente', 'admin'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin permiso.' };

  const r = leerHoja_(HOJA_PRO).find(p =>
    String(p.codigoPropuesta || '').trim() === String(codigoPropuesta).trim());
  if (!r) return { ok:false, error:'No encontré ese prospecto.' };

  const o = {};
  COLS_PRO.forEach(k => {
    let v = r[k];
    if (k.indexOf('fecha') === 0 || k === 'inicio recoleccion' ||
        k === 'vencimiento' || k === 'proximo seguimiento') v = fechaISO_(v);
    o[k] = (v === null || v === undefined) ? '' : String(v).trim();
  });

  const faltan = validarContrato_(o);
  if (Object.keys(faltan).length)
    return { ok:false, incompleto:true, faltan:faltan, empresa:o.empresa };

  return { ok:true, usuario:u, hoy:hoyPanama_(), prospecto:o, empresa:datosDoc_('contrato') };
}

/* solo revisa: sirve para que el botón avise antes de abrir la página */
function api_revisarContrato(pin, codigoPropuesta) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  const r = leerHoja_(HOJA_PRO).find(p =>
    String(p.codigoPropuesta || '').trim() === String(codigoPropuesta).trim());
  if (!r) return { ok:false, error:'No encontré ese prospecto.' };
  const o = {};
  COLS_PRO.forEach(k => {
    let v = r[k];
    if (k.indexOf('fecha') === 0) v = fechaISO_(v);
    o[k] = (v === null || v === undefined) ? '' : String(v).trim();
  });
  const faltan = validarContrato_(o);
  return { ok:true, listo: Object.keys(faltan).length === 0, faltan: faltan };
}

function api_borrarProspecto(pin, codigoPropuesta) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['mercadeo','supervisor','admin'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin permiso para borrar prospectos.' };

  /* mercadeo borra sus propios errores; desde que hay propuesta, solo el admin */
  if (!esAdmin_(u)) {
    const p = leerHoja_(HOJA_PRO)
      .find(r => String(r.codigoPropuesta || '').trim() === String(codigoPropuesta).trim());
    if (p && BORRABLES_MERCADEO.indexOf(String(p.estado || '').trim()) < 0)
      return { ok:false, error:'Esta propuesta ya está en "' + String(p.estado || '') +
               '". Solo el administrador puede borrarla.' };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_PRO);
    if (!h) return { ok:false, error:'No existe la hoja Prospectos.' };
    const vals = h.getDataRange().getValues();
    const c = vals[0].map(String).indexOf('codigoPropuesta');
    for (let i = vals.length - 1; i >= 1; i--) {
      if (String(vals[i][c]).trim() === String(codigoPropuesta).trim()) {
        h.deleteRow(i + 1);
        return { ok:true };
      }
    }
    return { ok:false, error:'No encontré ese prospecto.' };
  } finally { lock.releaseLock(); }
}

/* ═══════════════ PORTADA DE GERENCIA ═══════════════
   Cuatro bloques con lo esencial de cada área. El detalle vive en
   las páginas de cada quien; esto responde "¿cómo va el negocio?". */

function api_portada(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (['gerente','supervisor','admin','mercadeo'].indexOf(u.rol) < 0)
    return { ok:false, error:'Esta pantalla es para gerencia.' };

  const hoy = hoyPanama_();
  const mes = hoy.slice(0, 7);
  const d = new Date(hoy + 'T12:00:00');
  d.setMonth(d.getMonth() - 1);
  const mesAnt = Utilities.formatDate(d, 'America/Panama', 'yyyy-MM');
  const r2 = v => Math.round(v * 100) / 100;

  /* ── operaciones ── */
  const rec = leerHoja_(HOJA_REC);
  const op = { kgMes:0, kgAnt:0, visitasMes:0, clientesMes:{}, sinDisponer:0, kgSinDisponer:0 };
  rec.forEach(r => {
    const f = fechaISO_(r['Fecha de Recoleccion']); if (!f) return;
    const kg = (Number(r['Kg Recolectados'])||0) + (Number(r['kg anatomopatologico'])||0) +
               (Number(r['kg punzo cortantes'])||0);
    if (f.slice(0,7) === mes) {
      op.kgMes += kg; op.visitasMes++;
      op.clientesMes[String(r.Cliente||'').trim().toUpperCase()] = 1;
    } else if (f.slice(0,7) === mesAnt) op.kgAnt += kg;
    if (!String(r.acta||'').trim()) { op.sinDisponer++; op.kgSinDisponer += kg; }
  });
  op.kgMes = r2(op.kgMes); op.kgAnt = r2(op.kgAnt); op.kgSinDisponer = r2(op.kgSinDisponer);
  op.clientes = Object.keys(op.clientesMes).length; delete op.clientesMes;
  op.variacion = op.kgAnt ? Math.round((op.kgMes - op.kgAnt) / op.kgAnt * 100) : null;

  /* ── planta ── */
  const dis = leerHoja_(HOJA_DIS);
  const pl = { actasMes:0, kgMes:0, actasTotal:dis.length, ultima:'' };
  dis.forEach(a => {
    const f = fechaISO_(a.fecha); if (!f) return;
    if (f.slice(0,7) === mes) { pl.actasMes++; pl.kgMes += Number(a.kgTotal)||0; }
    if (f > pl.ultima) pl.ultima = f;
  });
  pl.kgMes = r2(pl.kgMes);
  pl.diasSinDisponer = pl.ultima
    ? Math.round((new Date(hoy+'T00:00:00') - new Date(pl.ultima+'T00:00:00'))/86400000) : null;

  /* ── tratamiento: lo que pasó por el autoclave ── */
  const ss0 = SpreadsheetApp.getActiveSpreadsheet();
  pl.kgTratadoMes = 0; pl.ciclosMes = 0; pl.pruebasMes = 0; pl.pruebasFallidas = 0;
  if (ss0.getSheetByName(HOJA_CIC)) {
    leerHoja_(HOJA_CIC).forEach(c => {
      const f = fechaISO_(c.fecha); if (!f || f.slice(0,7) !== mes) return;
      /* un ciclo anulado no pasó, y uno de mantenimiento corrió vacío */
      if (String(c.anulado || '').toUpperCase() === 'SI') return;
      if (String(c.esPrueba || '').toUpperCase() === 'SI') return;
      pl.ciclosMes++; pl.kgTratadoMes += Number(c.kgEntrada) || 0;
      if (String(c.pruebaBiologica||'').toUpperCase() === 'SI') {
        pl.pruebasMes++;
        if (String(c.resultadoPrueba||'').toUpperCase().indexOf('NO') === 0) pl.pruebasFallidas++;
      }
    });
  }
  pl.kgTratadoMes = r2(pl.kgTratadoMes);
  pl.porTratar = r2(pl.kgMes - pl.kgTratadoMes);

  /* ── salidas al relleno ── */
  pl.salidasMes = 0; pl.kgAlRelleno = 0; pl.sinRecibo = 0;
  if (ss0.getSheetByName(HOJA_SAL)) {
    leerHoja_(HOJA_SAL).forEach(s => {
      const f = fechaISO_(s.fecha); if (!f) return;
      if (f.slice(0,7) === mes) { pl.salidasMes++; pl.kgAlRelleno += Number(s.kgPlanta) || 0; }
      if (!String(s.reciboEmas||'').trim()) pl.sinRecibo++;
    });
  }
  pl.kgAlRelleno = r2(pl.kgAlRelleno);

  /* ── mantenimiento vencido: es lo que puede parar la planta ── */
  pl.mtoVencidos = 0; pl.mtoPorVencer = 0; pl.mtoAlerta = '';
  if (ss0.getSheetByName(HOJA_MTO)) {
    const prox = {};
    leerHoja_(HOJA_MTO).forEach(m => {
      const p = fechaISO_(m.proximo); if (!p) return;
      const k = String(m.equipo||'') + '|' + String(m.tipo||'');
      if (!prox[k] || p < prox[k].proximo)
        prox[k] = { equipo:String(m.equipo||''), tipo:String(m.tipo||''), proximo:p };
    });
    Object.keys(prox).forEach(k => {
      const d = Math.round((new Date(prox[k].proximo+'T00:00:00') - new Date(hoy+'T00:00:00'))/86400000);
      if (d < 0) { pl.mtoVencidos++; if (!pl.mtoAlerta) pl.mtoAlerta = prox[k].equipo + ' · ' + prox[k].tipo; }
      else if (d <= 15) pl.mtoPorVencer++;
    });
  }

  /* ── comercial: cartera y pipeline ── */
  const cli = leerHoja_(HOJA_CLI);
  const co = { activos:0, valorMes:0, vencidos:0, valorVencido:0, porVencer:0, sinContrato:0 };
  const vistos = {};
  cli.forEach(c => {
    const est = String(c.estado||'').toUpperCase();
    if (['SUSPENDIDO','CANCELADO'].indexOf(est) >= 0) return;
    co.activos++;
    // en facturación agrupada el plan es de la razón social, no de cada punto
    const agr = String(c.facturacion||'').toUpperCase() === 'AGRUPADA';
    const clave = agr ? String(c['razon social']||'').trim().toUpperCase() : ('P'+c.id);
    const costo = Number(c['plan costo'])||0;
    if (!vistos[clave]) { vistos[clave] = 1; co.valorMes += costo; }
    const v = fechaISO_(c.vencimiento);
    if (v) {
      const dv = Math.round((new Date(v+'T00:00:00') - new Date(hoy+'T00:00:00'))/86400000);
      if (dv < 0) { co.vencidos++; if (!agr || vistos[clave]===1) co.valorVencido += costo; }
      else if (dv <= 60) co.porVencer++;
    } else co.sinContrato++;
  });
  co.valorMes = r2(co.valorMes); co.valorVencido = r2(co.valorVencido);

  /* ── pipeline ── */
  const pro = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_PRO)
    ? leerHoja_(HOJA_PRO) : [];
  const pi = { activos:0, valorEmbudo:0, firmados:0, ganadosMes:0 };
  pro.forEach(p => {
    const e = String(p.estado||'').trim();
    if (['Rechazado','Pasado a cartera'].indexOf(e) < 0) {
      pi.activos++; pi.valorEmbudo += Number(p['valor cotizado'])||Number(p['costo visita'])||0;
    }
    if (e === 'Firmado') pi.firmados++;
    const fc = fechaISO_(p['fecha contrato']);
    if (fc && fc.slice(0,7) === mes) pi.ganadosMes++;
  });
  pi.valorEmbudo = r2(pi.valorEmbudo);

  /* ── evolución de los últimos 6 meses ── */
  const serie = {};
  for (let i = 5; i >= 0; i--) {
    const t = new Date(hoy + 'T12:00:00'); t.setMonth(t.getMonth() - i);
    serie[Utilities.formatDate(t, 'America/Panama', 'yyyy-MM')] = 0;
  }
  rec.forEach(r => {
    const f = fechaISO_(r['Fecha de Recoleccion']); if (!f) return;
    const m = f.slice(0,7);
    if (m in serie) serie[m] += (Number(r['Kg Recolectados'])||0) +
      (Number(r['kg anatomopatologico'])||0) + (Number(r['kg punzo cortantes'])||0);
  });
  const meses = Object.keys(serie).sort().map(m => ({ mes:m, kg:r2(serie[m]) }));

  /* ── cobros: la cartera es de siempre, lo cobrado es del mes ── */
  const cb = { saldo:0, vencido:0, mas90:0, abiertas:0, deudores:0,
               facturadoMes:0, facturadoAnt:0, cobradoMes:0, promesasRotas:0 };
  if (ss0.getSheetByName(HOJA_FAC)) {
    const porFac = {};
    if (ss0.getSheetByName(HOJA_PAG)) {
      leerHoja_(HOJA_PAG).forEach(p => {
        const n = String(p.factura||'').trim();
        if (n) porFac[n] = (porFac[n]||0) + (Number(p.monto)||0);
        const f = fechaISO_(p.fecha);
        if (f && f.slice(0,7) === mes) cb.cobradoMes += Number(p.monto)||0;
      });
    }
    const deu = {};
    leerHoja_(HOJA_FAC).forEach(f => {
      const num = String(f.factura||'').trim(); if (!num) return;
      const total = r2(f.total) || r2(f.monto);
      const fe = fechaISO_(f.fecha);
      if (fe && fe.slice(0,7) === mes) cb.facturadoMes += total;
      if (fe && fe.slice(0,7) === mesAnt) cb.facturadoAnt += total;

      const saldo = r2(netoEsperado_(f, total) - (porFac[num]||0));
      if (saldo <= 0.009) return;
      cb.saldo += saldo; cb.abiertas++;
      deu[String(f.ruc||'').trim() || String(f.cliente||'')] = 1;
      const venc = vencimientoDe_(f);
      if (venc && venc < hoy) {
        cb.vencido += saldo;
        const d = Math.round((new Date(hoy+'T00:00:00') - new Date(venc+'T00:00:00'))/86400000);
        if (d > 90) cb.mas90 += saldo;
      }
    });
    cb.deudores = Object.keys(deu).length;
  }
  ['saldo','vencido','mas90','facturadoMes','facturadoAnt','cobradoMes'].forEach(k => cb[k] = r2(cb[k]));
  cb.variacion = cb.facturadoAnt ? Math.round((cb.facturadoMes - cb.facturadoAnt)/cb.facturadoAnt*100) : null;

  /* promesas de pago que no se cumplieron */
  if (ss0.getSheetByName(HOJA_GES)) {
    leerHoja_(HOJA_GES).forEach(g => {
      const fp = fechaISO_(g.fechaPrometida);
      if (fp && fp < hoy && String(g.seCompromete||'').toUpperCase() === 'SI' &&
          ['CUMPLIO','ANULADO'].indexOf(String(g.resultado||'').toUpperCase()) < 0) cb.promesasRotas++;
    });
  }

  /* ── lo que espera acción de alguien ── */
  const al = { formularios:0, solicitudes:0, recibosSinEnviar:0 };
  if (ss0.getSheetByName(HOJA_PRO)) {
    leerHoja_(HOJA_PRO).forEach(p => {
      if (String(p['formulario estado']||'').toUpperCase() === 'RECIBIDO' &&
          ['Propuesta enviada','En negociación','Contrato en proceso','Firmado',
           'Pasado a cartera'].indexOf(String(p.estado||'').trim()) < 0) al.formularios++;
    });
  }
  leerHoja_(HOJA_SOL).forEach(s => {
    if (String(s.estado||'').toUpperCase() === 'PENDIENTE') al.solicitudes++;
  });

  return { ok:true, usuario:u, hoy:hoy, mes:mes, mesAnterior:mesAnt,
           operaciones:op, planta:pl, comercial:co, pipeline:pi, meses:meses,
           cobros:cb, alertas:al };
}

/* ═══════════════ LOBBY ═══════════════
   Un solo enlace para toda la empresa. Quien tiene un destino entra
   directo; quien tiene varios, elige. */

/* El modelo: cuatro módulos donde se hace el trabajo y uno en el centro
   donde se mira y se decide. La empresa se ve así, y el lobby la dibuja
   igual — quien entra entiende la operación antes de tocar nada.

   zona dice dónde va cada uno:
     centro  el que manda. Va en medio y es más grande. Quien no dirige
             NO lo ve — a un operador no le sirve saber que existe.
     lado    los cuatro de la operación. Estos SÍ se ven siempre, en gris
             si no te tocan: ver lo que no te toca dice más que no verlo,
             se entiende que existe y que hay que pedirlo.
     aparte  se usan desde cualquier módulo. No son parte del modelo, así
             que van de botón abajo: ponerlos de tarjeta diría que pesan
             lo mismo que Logística, y no.
     oculto  la pantalla existe y se navega, pero no desde aquí. A
             Detalle operativo se llega desde Dirección: es una página a
             la que se viaja, no una puerta del lobby.

   pend enlaza el módulo con el nombre que el vigía usa en la hoja de
   Pendientes, para la pastilla con lo que está esperando. */
const MODULOS = [
  { id:'inicio', titulo:'Dirección', icono:'brujula', zona:'centro',
    detalle:'Cómo va cada módulo y qué necesita una decisión',
    /* supervisor sigue aquí porque ya entraba al panel viejo: quitárselo
       ahora sería quitarle algo que hoy usa, y eso no se hace de callado. */
    roles:['gerente','admin','mercadeo','supervisor'] },

  { id:'campo', titulo:'Logística', icono:'ruta', zona:'lado', pend:'logistica',
    detalle:'Rutas, recolección y cierre del día',
    roles:['operador','supervisor','gerente','admin','mercadeo'] },
  { id:'alta', titulo:'Mercadeo', icono:'maletin', zona:'lado', pend:'mercadeo',
    detalle:'Prospectos, propuestas, contratos y cartera',
    roles:['mercadeo','supervisor','gerente','admin'] },
  { id:'planta', titulo:'Tratamiento', icono:'planta', zona:'lado', pend:'planta',
    detalle:'Recepción, autoclave y disposición final',
    roles:['planta','supervisor','gerente','admin','mercadeo'] },
  { id:'cobros', titulo:'Cartera', icono:'moneda', zona:'lado', pend:'cobros',
    detalle:'Facturación, pagos y lo que está por cobrar',
    roles:['cobros','supervisor','gerente','admin','mercadeo'] },

  { id:'certificados', titulo:'Certificados', icono:'sello', zona:'aparte',
    detalle:'Certificado de tratamiento al cliente, al percibir el pago',
    roles:['mercadeo','supervisor','gerente','admin'] },
  { id:'solicitud', titulo:'Solicitud de pago', icono:'recibo', zona:'aparte',
    detalle:'Pedir un pago a la dirección financiera',
    roles:['admin','gerente','supervisor','mercadeo','planta'] },
  { id:'finanzas', titulo:'Finanzas', icono:'billete', zona:'aparte',
    detalle:'Solicitudes de pago, gastos y utilidad de la empresa',
    roles:['admin','gerente','mercadeo'] },
  /* Vehículos y equipos de planta en el mismo sitio, porque son el mismo
     problema: un activo, un plan y una alarma. Planta entra porque
     Planta anota los servicios del autoclave y de la caldera. */
  { id:'admin', titulo:'Administración', icono:'llave', zona:'aparte',
    detalle:'Mantenimiento de vehículos y equipos, e inventario de insumos',
    roles:['admin','gerente','supervisor','planta','mercadeo'] }
];

/* Cuántas cosas dejó abiertas el vigía en cada módulo. La hoja se lee UNA
   vez y se cuentan los cuatro de una: preguntar cuatro veces por lo mismo
   es lo que vuelve lento un lobby que debe abrir de inmediato.
   Si la hoja no existe todavía, el lobby abre igual sin pastillas. */
function lobby_pendientes_() {
  const cuenta = {};
  try {
    leerHoja_(HOJA_PEND).forEach(p => {
      const e = String(p.estado || '').trim().toLowerCase();
      if (ESTADOS_CERRADOS.indexOf(e) >= 0) return;
      const m = String(p.modulo || '').trim().toLowerCase();
      if (m) cuenta[m] = (cuenta[m] || 0) + 1;
    });
  } catch (err) {}
  return cuenta;
}

function api_lobby(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };

  const pend = lobby_pendientes_();

  /* Los 'oculto' no salen del lobby: se llega a ellos desde otra pantalla. */
  const lista = MODULOS.filter(m => m.zona !== 'oculto').map(m => ({
    id: m.id, titulo: m.titulo, detalle: m.detalle, icono: m.icono,
    zona: m.zona,
    permitido: m.roles.indexOf(u.rol) >= 0,
    estado: m.estado || '',
    pendientes: m.pend ? (pend[m.pend] || 0) : 0
  }));

  const abiertos = lista.filter(m => m.permitido && m.estado !== 'construccion');
  if (!abiertos.length)
    return { ok:false, error:'Tu usuario no tiene ninguna pantalla asignada. Avísale al administrador.' };

  return { ok:true, usuario:u, modulos:lista, abiertos:abiertos.length,
           url: urlApp_(), hoy: hoyPanama_() };
}
/* ═══════════════ COBROS ═══════════════
   Dos hojas: lo que se facturó y lo que se pagó. Un pago se enlaza a su
   factura por el número; el saldo se calcula, nunca se escribe. */

const HOJA_FAC = 'Facturas';
const HOJA_PAG = 'Pagos';

const COLS_FAC = ['factura','fecha','clienteId','cliente','razon social','ruc',
                  'periodo','concepto','monto','itbms','total','plazo','vencimiento',
                  'estado','notas','registradoPor','registradoEn'];

const COLS_PAG = ['pagoId','factura','fecha','monto','metodo','referencia',
                  'cliente','notas','registradoPor','registradoEn'];

const METODOS_PAG = ['transferencia ACH','cheque','efectivo','depósito','retención','otro'];

function crearHojasCobros() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let n = 0;
  if (!ss.getSheetByName(HOJA_FAC)) { crearHoja_(ss, HOJA_FAC, COLS_FAC); n++; }
  if (!ss.getSheetByName(HOJA_PAG)) { crearHoja_(ss, HOJA_PAG, COLS_PAG); n++; }
  SpreadsheetApp.getUi().alert(n ? 'Se crearon ' + n + ' hoja(s): Facturas y Pagos.'
                                : 'Las hojas Facturas y Pagos ya existen.');
}

/* Lo cobrado sale de sumar los pagos de cada factura: el saldo nunca
   se escribe a mano, así no puede quedar desactualizado. */

/* El vencimiento se toma de la hoja; si viene vacío se calcula con la fecha
   de emisión y el plazo pactado. Así las facturas importadas sin esa columna
   igual pueden marcarse como vencidas. */
function vencimientoDe_(f) {
  const v = fechaISO_(f.vencimiento);
  if (v) return v;
  const base = fechaISO_(f.fecha);
  if (!base) return '';
  const dias = Number(String(f.plazo || '').replace(/\D/g, '')) || 30;
  const d = new Date(base + 'T12:00:00');
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + dias);
  return Utilities.formatDate(d, tzHoja_(), 'yyyy-MM-dd');
}


/* Un agente retenedor paga menos que el total de la factura: retiene parte
   del ITBMS y lo entera al fisco. Esa diferencia no es deuda. Sin esto, esas
   facturas quedan con un saldo que nadie va a cobrar nunca. */
var _RETEN = null;
function retencionDe_(ruc, cliente) {
  if (!_RETEN) {
    _RETEN = {};
    leerHoja_(HOJA_CLI).forEach(c => {
      /* sí o no: el porcentaje de retención es siempre el 50% del ITBMS */
      const p = /^(s|1|x|v)/i.test(String(c['retiene itbms']||'').trim()) ? 50 : 0;
      if (!p) return;
      /* por clave normalizada: el RUC del cliente y el de la factura
         vienen de manos distintas y casi nunca traen el mismo formato */
      const r = rucClave_(c.ruc);
      if (r) _RETEN['R' + r] = p;
      _RETEN['N' + String(c.nombre || '').trim().toUpperCase()] = p;
    });
  }
  const r = rucClave_(ruc);
  if (r && _RETEN['R' + r]) return _RETEN['R' + r];
  return _RETEN['N' + String(cliente || '').trim().toUpperCase()] || 0;
}

/* Lo que de verdad se espera cobrar de una factura, ya descontada la retención. */
/* LA FACTURA SE ESCRIBE DE DOS MANERAS Y HAY QUE AGUANTAR LAS DOS.
   ─────────────────────────────────────────────────────────────────────
   En el libro de hoy las 267 facturas vienen cargadas con el ITBMS YA
   ADENTRO del total y la columna `itbms` en cero: CLINILAB sale como
   monto 133.75, itbms 0, total 133.75. api_guardarFactura, en cambio,
   escribe la base aparte —itbms = monto × 7 %, total = monto + itbms—.

   Si se cree solo en la columna `itbms`, las 267 de hoy quedan como si
   no tuvieran impuesto y al retenedor se le reclama de más. Si se
   deduce siempre del total, se pisa el ITBMS real de las que sí lo
   traen escrito.

   Así que: se usa el ITBMS ESCRITO cuando lo hay, y si está en cero o
   vacío se deduce del TOTAL, que en las dos formas lo lleva adentro.
   Se deduce del total y no de `monto` a propósito: `monto` significa
   una cosa en unas filas y otra en otras; `total` significa siempre lo
   mismo.

   Ojo con la consecuencia: una factura de un retenedor genuinamente
   exenta —ITBMS cero de verdad— no se puede distinguir de las 267
   cargadas, y se le calcula retención igual. Mientras el libro venga
   así, no hay forma de separarlas; el día que todas traigan el ITBMS
   escrito, deja de pasar solo. */
function netoEsperado_(f, total) {
  const p = retencionDe_(f.ruc, f.cliente);
  if (!p) return total;
  const escrito = Math.round((Number(f.itbms) || 0) * 100) / 100;
  const itbms = escrito > 0.009
    ? escrito
    : Math.round((total - total / 1.07) * 100) / 100;
  return Math.round((total - itbms * p / 100) * 100) / 100;
}

/* ═══ LAS DOS CARTERAS ═══════════════════════════════════════════════
   No es una etiqueta de adorno: cambia quién cobra y con qué vara se mide.

   RECURRENTE — las clínicas y veterinarias del servicio mensual. Se cobra
   por correo y llamada, lo maneja cobros, y 60 días vencido es alarma.
   CONTRATO   — los actos públicos ganados por periodo (AAUUD, ASOCSA,
   MINSA, la CSS). Se cobra con expediente, firmas y visitas, lo manejan
   Mercadeo y Gerencia, y 60 días es el trámite normal. Medirlos con la misma
   vara hace que la cartera se vea como una deuda incobrable cuando no lo es.

   Si la ficha no dice nada, se asume recurrente: es lo que son casi todos,
   y equivocarse por ahí solo hace que un aviso llegue antes de tiempo. */
const CARTERAS = ['recurrente', 'contrato'];

function carteraDe_(c) {
  const t = String((c && (c['tipo cartera'] || c.cartera)) || '').trim().toLowerCase();
  return t.indexOf('contra') === 0 ? 'contrato' : 'recurrente';
}

/* ═══ La foto de cobros, armada una sola vez ══════════════════════════
   Los cinco vigilantes de cobros necesitan lo mismo: qué se facturó, qué
   se pagó, cuánto queda y de quién. Sin esto cada uno releería Facturas,
   Pagos y Clientes por su cuenta y la corrida se iría en lecturas de hoja.

   La clave de un deudor es el RUC cuando lo hay, y el nombre cuando no.
   Es la misma que ya usa la pantalla de morosidad, a propósito: dos
   maneras de agrupar al mismo cliente terminan en dos cifras distintas
   para la misma deuda, y entonces nadie sabe cuál creer. */
var _COB_VISTA = null;
function cobrosVista_() {
  if (_COB_VISTA) return _COB_VISTA;
  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;
  const hoy = hoyPanama_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const fichas = {};
  leerHoja_(HOJA_CLI).forEach(c => {
    const t = carteraDe_(c);
    const ruc = String(c.ruc || '').trim();
    const nm = String(c.nombre || '').trim().toUpperCase();
    if (ruc) fichas['R' + ruc] = t;
    if (nm) fichas['N' + nm] = t;
  });

  const porFactura = {};
  if (ss.getSheetByName(HOJA_PAG)) {
    leerHoja_(HOJA_PAG).forEach(p => {
      /* el número se compara como TEXTO EXACTO: hay dos series que se pisan
         y quitarle los ceros a la de 2026 le pega un pago de cinco cifras a
         una clínica de tres. Ya pasó en la primera prueba. */
      const n = String(p.factura || '').trim();
      if (n) porFactura[n] = (porFactura[n] || 0) + (Number(p.monto) || 0);
    });
  }

  const facturas = [];
  const deudores = {};
  if (ss.getSheetByName(HOJA_FAC)) {
    leerHoja_(HOJA_FAC).forEach(f => {
      const num = String(f.factura || '').trim();
      if (!num) return;
      const total = r2(f.total) || r2(Number(f.monto) + Number(f.itbms));
      const neto = netoEsperado_(f, total);
      const saldo = r2(neto - r2(porFactura[num] || 0));
      const venc = vencimientoDe_(f);
      const mora = (saldo > 0.009 && venc && venc < hoy)
        ? Math.round((new Date(hoy + 'T00:00:00') - new Date(venc + 'T00:00:00')) / 86400000)
        : 0;
      const cliente = String(f.cliente || '').trim();
      const ruc = String(f.ruc || '').trim();
      const item = { factura:num, fecha:fechaISO_(f.fecha), cliente:cliente,
                     razon:String(f['razon social'] || ''), ruc:ruc,
                     total:total, saldo:saldo, vencimiento:venc, mora:mora };
      facturas.push(item);
      if (saldo <= 0.009) return;

      const k = ruc || cliente || '(sin cliente)';
      if (!deudores[k]) deudores[k] = {
        clave:k, cliente: cliente || String(f['razon social'] || '') || k,
        ruc:ruc, saldo:0, vencido:0, facturas:0, mora:0,
        tipo: fichas['R' + ruc] || fichas['N' + cliente.toUpperCase()] || 'recurrente'
      };
      const d = deudores[k];
      d.saldo += saldo; d.facturas++;
      if (mora > 0) { d.vencido += saldo; if (mora > d.mora) d.mora = mora; }
    });
  }

  const saldoPorClave = {};
  Object.keys(deudores).forEach(k => {
    deudores[k].saldo = r2(deudores[k].saldo);
    deudores[k].vencido = r2(deudores[k].vencido);
    saldoPorClave[k] = deudores[k].saldo;
    /* que el nombre también sirva de llave: las gestiones a veces se
       registran sin RUC y si no, no encuentran su deuda */
    const nm = String(deudores[k].cliente || '').trim();
    if (nm && saldoPorClave[nm] === undefined) saldoPorClave[nm] = deudores[k].saldo;
  });

  _COB_VISTA = { hoy:hoy, facturas:facturas, deudores:deudores, saldoPorClave:saldoPorClave };
  return _COB_VISTA;
}

function api_cobros(pin, desde, hasta) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!esCobros_(u))
    return { ok:false, error:'Esta pantalla es para cobros, gerencia y administración.' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(HOJA_FAC)) crearHoja_(ss, HOJA_FAC, COLS_FAC);
  if (!ss.getSheetByName(HOJA_PAG)) crearHoja_(ss, HOJA_PAG, COLS_PAG);

  const hoy = hoyPanama_();
  const d1 = String(desde || ''), d2 = String(hasta || '');
  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;

  const pagos = leerHoja_(HOJA_PAG).map(p => ({
    pagoId: String(p.pagoId || ''), factura: String(p.factura || '').trim(),
    fecha: fechaISO_(p.fecha), monto: r2(p.monto), metodo: String(p.metodo || ''),
    referencia: String(p.referencia || ''), cliente: String(p.cliente || ''),
    notas: String(p.notas || '')
  })).filter(p => p.fecha || p.factura);

  const porFactura = {};
  pagos.forEach(p => { if (p.factura) porFactura[p.factura] = (porFactura[p.factura] || 0) + p.monto; });

  const facturas = leerHoja_(HOJA_FAC).map(f => {
    const num = String(f.factura || '').trim();
    const total = r2(f.total) || r2(Number(f.monto) + Number(f.itbms));
    const cobrado = r2(porFactura[num] || 0);
    const neto = netoEsperado_(f, total);        // los retenedores pagan menos
    const saldo = r2(neto - cobrado);
    const retenido = r2(total - neto);
    const venc = vencimientoDe_(f);
    const mora = (saldo > 0.009 && venc && venc < hoy)
      ? Math.round((new Date(hoy+'T00:00:00') - new Date(venc+'T00:00:00')) / 86400000) : 0;
    return {
      factura: num, fecha: fechaISO_(f.fecha), clienteId: Number(f.clienteId) || 0,
      cliente: String(f.cliente || ''), razon: String(f['razon social'] || ''),
      ruc: String(f.ruc || ''), periodo: String(f.periodo || ''),
      concepto: String(f.concepto || ''), monto: r2(f.monto), itbms: r2(f.itbms),
      total: total, neto: neto, retenido: retenido,
      cobrado: cobrado, saldo: saldo, vencimiento: venc, mora: mora,
      estado: saldo <= 0.009 ? 'PAGADA' : (cobrado > 0 ? 'PARCIAL' : (mora ? 'VENCIDA' : 'PENDIENTE')),
      notas: String(f.notas || '')
    };
  }).filter(f => f.factura);

  const enRango = f => (!d1 || f.fecha >= d1) && (!d2 || f.fecha <= d2);
  const fr = facturas.filter(enRango);
  const pr = pagos.filter(p => (!d1 || p.fecha >= d1) && (!d2 || p.fecha <= d2));

  /* ── totales del periodo ── */
  const t = { facturas: fr.length, facturado: 0, cobradoPeriodo: 0, pagos: pr.length };
  fr.forEach(f => t.facturado += f.total);
  pr.forEach(p => t.cobradoPeriodo += p.monto);
  t.facturado = r2(t.facturado); t.cobradoPeriodo = r2(t.cobradoPeriodo);

  /* ── la cartera es de siempre, no del periodo ── */
  const c = { saldo: 0, vencido: 0, abiertas: 0, vencidas: 0,
              t30: 0, t60: 0, t90: 0, tmas: 0 };
  facturas.forEach(f => {
    if (f.saldo <= 0.009) return;
    c.saldo += f.saldo; c.abiertas++;
    if (f.mora > 0) {
      c.vencido += f.saldo; c.vencidas++;
      if (f.mora <= 30) c.t30 += f.saldo;
      else if (f.mora <= 60) c.t60 += f.saldo;
      else if (f.mora <= 90) c.t90 += f.saldo;
      else c.tmas += f.saldo;
    }
  });
  ['saldo','vencido','t30','t60','t90','tmas'].forEach(k => c[k] = r2(c[k]));

  /* ── quién debe ── */
  const deudores = {};
  facturas.forEach(f => {
    if (f.saldo <= 0.009) return;
    const k = f.cliente || '(sin cliente)';
    if (!deudores[k]) deudores[k] = { cliente: k, razon: f.razon, ruc: f.ruc,
                                      saldo: 0, facturas: 0, mora: 0 };
    deudores[k].saldo += f.saldo; deudores[k].facturas++;
    if (f.mora > deudores[k].mora) deudores[k].mora = f.mora;
  });
  const lista = Object.keys(deudores).map(k => {
    deudores[k].saldo = r2(deudores[k].saldo); return deudores[k];
  }).sort((a, b) => b.saldo - a.saldo);

  /* pagos sin enlazar: no se pueden aplicar a ninguna factura */
  const sueltos = pagos.filter(p => !p.factura || !facturas.some(f => f.factura === p.factura));

  return { ok:true, usuario:u, hoy:hoy, desde:d1, hasta:d2,
           totales:t, cartera:c, deudores:lista,
           facturas: fr.sort((a,b) => (b.fecha||'').localeCompare(a.fecha||'')),
           pagos: pr.sort((a,b) => (b.fecha||'').localeCompare(a.fecha||'')),
           sueltos: sueltos.length, sueltosMonto: r2(sueltos.reduce((s,p)=>s+p.monto,0)),
           metodos: METODOS_PAG, puedeEditar: esCobros_(u) };
}

function api_guardarFactura(pin, datos) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (!esCobros_(u)) return { ok:false, error:'Sin permiso para registrar facturas.' };
  const num = String((datos && datos.factura) || '').trim();
  if (!num) return { ok:false, error:'Falta el número de factura.' };

  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let h = ss.getSheetByName(HOJA_FAC);
    if (!h) h = crearHoja_(ss, HOJA_FAC, COLS_FAC);
    const vals = h.getDataRange().getValues();
    const cab = vals[0].map(String);
    const cNum = cab.indexOf('factura');

    let fila = -1;
    for (let i = 1; i < vals.length; i++)
      if (String(vals[i][cNum]).trim() === num) { fila = i; break; }
    if (fila >= 0 && !datos.__actualizar)
      return { ok:false, error:'Ya existe una factura con el número ' + num + '.' };

    const monto = Number(datos.monto) || 0;
    const itbms = (datos.itbms === '' || datos.itbms === undefined)
      ? Math.round(monto * 0.07 * 100) / 100 : Number(datos.itbms) || 0;
    const total = Math.round((monto + itbms) * 100) / 100;
    const plazo = Number(datos.plazo) || 30;
    let venc = String(datos.vencimiento || '');
    if (!venc && datos.fecha) {
      const d = new Date(String(datos.fecha) + 'T12:00:00');
      if (!isNaN(d.getTime())) {
        d.setDate(d.getDate() + plazo);
        venc = Utilities.formatDate(d, 'America/Panama', 'yyyy-MM-dd');
      }
    }
    const fila_ = [num, datos.fecha || hoyPanama_(), Number(datos.clienteId) || '',
      datos.cliente || '', datos['razon social'] || '', datos.ruc || '',
      datos.periodo || '', datos.concepto || '', monto, itbms, total, plazo, venc,
      '', datos.notas || '', u.nombre, new Date()];

    if (fila >= 0) h.getRange(fila + 1, 1, 1, fila_.length).setValues([fila_]);
    else h.appendRow(fila_);
    marcar_('cobros');
    return { ok: true, factura:num, total:total, vencimiento:venc, actualizada: fila >= 0 };
  } finally { lock.releaseLock(); }
}

function api_guardarPago(pin, datos) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (!esCobros_(u)) return { ok:false, error:'Sin permiso para registrar pagos.' };
  const monto = Number(datos && datos.monto) || 0;
  if (monto <= 0) return { ok:false, error:'El monto debe ser mayor que cero.' };

  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let h = ss.getSheetByName(HOJA_PAG);
    if (!h) h = crearHoja_(ss, HOJA_PAG, COLS_PAG);

    const num = String(datos.factura || '').trim();
    let aviso = '';
    if (num) {
      const f = leerHoja_(HOJA_FAC).find(x => String(x.factura || '').trim() === num);
      if (!f) return { ok:false, error:'No existe la factura ' + num + '. Regístrala primero.' };
      const total = Number(f.total) || 0;
      const ya = leerHoja_(HOJA_PAG)
        .filter(p => String(p.factura || '').trim() === num)
        .reduce((s, p) => s + (Number(p.monto) || 0), 0);
      if (ya + monto > total + 0.01)
        aviso = 'El pago excede el saldo: la factura es de B/. ' + total.toFixed(2) +
                ' y ya tenía B/. ' + ya.toFixed(2) + ' cobrado.';
    }

    const id = 'PG' + new Date().getTime().toString(36).toUpperCase();
    h.appendRow([id, num, datos.fecha || hoyPanama_(), monto, datos.metodo || '',
      datos.referencia || '', datos.cliente || '', datos.notas || '', u.nombre, new Date()]);
    marcar_('cobros');
    return { ok: true, pagoId:id, aviso:aviso };
  } finally { lock.releaseLock(); }
}

/* ═══ Lo que hay que facturar del mes ═══
   Es lo que Cobros necesita: a quién, por cuánto y con qué respaldo.
   Sale del histórico de recolecciones y del plan de cada cliente. */
function api_paraFacturar(pin, desde, hasta) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (!esCobros_(u)) return { ok:false, error:'Sin permiso.' };
  const d1 = String(desde || ''), d2 = String(hasta || '');
  if (!d1 || !d2) return { ok:false, error:'Falta el periodo.' };
  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;

  /* ficha comercial de cada cliente */
  const fichas = {};
  leerHoja_(HOJA_CLI).forEach(c => {
    fichas[String(c.nombre || '').trim().toUpperCase()] = {
      id: Number(c.id) || 0, nombre: String(c.nombre || ''),
      razon: String(c['razon social'] || ''), ruc: String(c.ruc || ''),
      dv: String(c.dv || ''), agrupada: String(c.facturacion || '').toUpperCase() === 'AGRUPADA',
      costo: Number(c['plan costo']) || 0, kgPlan: Number(c['plan kg']) || 0,
      kgAdic: Number(c['tarifa kg adic']) || 0, visAdic: Number(c['tarifa visita adic']) || 0,
      frecuencia: String(c.frecuencia || ''),
      modalidad: String(c.modalidad || 'plan').toLowerCase(),
      retencion: /^(s|1|x|v)/i.test(String(c['retiene itbms']||'').trim()) ? 50 : 0,
      estado: String(c.estado || '')
    };
  });

  /* lo recolectado en el periodo */
  const recol = {};
  leerHoja_(HOJA_REC).forEach(r => {
    const f = fechaISO_(r['Fecha de Recoleccion']);
    if (!f || f < d1 || f > d2) return;
    const k = String(r.Cliente || '').trim().toUpperCase();
    if (!recol[k]) recol[k] = { visitas: 0, kg: 0, recibos: [] };
    recol[k].visitas++;
    recol[k].kg += (Number(r['Kg Recolectados'])||0) + (Number(r['kg anatomopatologico'])||0) +
                   (Number(r['kg punzo cortantes'])||0);
    const rec = String(r['recibo numero'] || '').trim();
    if (rec) recol[k].recibos.push(rec);
  });

  /* agrupar por quien recibe la factura */
  const grupos = {};
  Object.keys(recol).forEach(k => {
    const fi = fichas[k];
    const clave = (fi && fi.agrupada && fi.razon) ? 'RS:' + fi.razon.toUpperCase() : 'PT:' + k;
    if (!grupos[clave]) grupos[clave] = {
      titular: fi ? (fi.agrupada ? fi.razon : fi.nombre) : k,
      razon: fi ? fi.razon : '', ruc: fi ? fi.ruc : '', dv: fi ? fi.dv : '',
      clienteId: fi ? fi.id : 0, agrupada: !!(fi && fi.agrupada),
      costo: fi ? fi.costo : 0, kgPlan: fi ? fi.kgPlan : 0,
      kgAdic: fi ? fi.kgAdic : 0, visAdic: fi ? fi.visAdic : 0,
      frecuencia: fi ? fi.frecuencia : '',
      modalidad: fi ? fi.modalidad : 'plan',
      retencion: fi ? fi.retencion : 0,
      puntos: [], visitas: 0, kg: 0, recibos: [], sinFicha: !fi
    };
    const g = grupos[clave];
    g.puntos.push({ nombre: fi ? fi.nombre : k, visitas: recol[k].visitas, kg: r2(recol[k].kg) });
    g.visitas += recol[k].visitas; g.kg += recol[k].kg;
    g.recibos = g.recibos.concat(recol[k].recibos);
  });

  const lineas = Object.keys(grupos).map(k => {
    const g = grupos[k];
    g.kg = r2(g.kg); g.recibos.sort();
    /* Cada modalidad se cobra distinto. La mayoría es plan fijo más excedente,
       pero hay quien paga por kilo levantado y quien contrata una sola visita. */
    if (g.modalidad === 'peso') {
      g.kgExceso = 0; g.cargoPlan = 0;
      g.cargoKg = r2(g.kg * g.kgAdic);
      g.detalleCobro = r2(g.kg) + ' kg × B/. ' + g.kgAdic.toFixed(2);
    } else if (g.modalidad === 'servicio') {
      g.kgExceso = 0; g.cargoKg = 0;
      g.cargoPlan = r2(g.costo);
      g.detalleCobro = 'Servicio de recolección';
    } else {
      g.kgExceso = g.kgPlan ? Math.max(0, r2(g.kg - g.kgPlan)) : 0;
      g.cargoKg = r2(g.kgExceso * g.kgAdic);
      g.cargoPlan = r2(g.costo);
      g.detalleCobro = 'Plan ' + (g.kgPlan ? g.kgPlan + ' kg' : 'fijo') +
        (g.kgExceso ? ' + ' + g.kgExceso + ' kg de excedente' : '');
    }

    g.subtotal = r2(g.cargoPlan + g.cargoKg);
    g.itbms = r2(g.subtotal * 0.07);
    g.total = r2(g.subtotal + g.itbms);

    /* Los agentes retenedores retienen parte del ITBMS: la factura sale por el
       total, pero al banco entra menos. Saberlo evita perseguir un saldo que
       en realidad ya está cancelado. */
    g.retiene = g.retencion ? r2(g.itbms * g.retencion / 100) : 0;
    g.aCobrar = r2(g.total - g.retiene);

    g.aviso = g.sinFicha ? 'Sin ficha comercial: no se puede calcular'
            : (g.modalidad === 'kilo' && !g.kgAdic ? 'Sin tarifa por kilo registrada'
            : (g.modalidad !== 'kilo' && !g.costo ? 'Sin tarifa registrada' : ''));
    return g;
  }).sort((a, b) => b.total - a.total);

  const t = { titulares: lineas.length, visitas: 0, kg: 0, plan: 0, exceso: 0,
              subtotal: 0, itbms: 0, total: 0, retiene: 0, aCobrar: 0,
              incompletos: 0, retenedores: 0 };
  lineas.forEach(l => {
    t.visitas += l.visitas; t.kg += l.kg; t.plan += l.cargoPlan; t.exceso += l.cargoKg;
    t.subtotal += l.subtotal; t.itbms += l.itbms; t.total += l.total;
    t.retiene += l.retiene; t.aCobrar += l.aCobrar;
    if (l.aviso) t.incompletos++;
    if (l.retencion) t.retenedores++;
  });
  ['kg','plan','exceso','subtotal','itbms','total','retiene','aCobrar'].forEach(k => t[k] = r2(t[k]));

  return { ok:true, usuario:u, desde:d1, hasta:d2, hoy:hoyPanama_(),
           lineas:lineas, totales:t, empresa: datosDoc_('') };
}

/* ═══════════════ RECIBO DE VISITA E HISTORIAL DEL CLIENTE ═══════════════ */

/* El recibo se arma en el momento desde la fila de Recolecciones:
   no se guarda ningún archivo, así una corrección se refleja sola. */
function api_obtenerDetalleRecibo(reciboId) {
  const folio = String(reciboId || '').trim();
  if (!folio) return { ok:false, error:'Número de recibo no especificado.' };

  const fila = leerHoja_(HOJA_REC)
    .find(r => String(r['recibo numero'] || '').trim() === folio);
  if (!fila) return { ok:false, error:'No encontré el recibo ' + folio + '.' };

  const nom = String(fila.Cliente || '').trim();
  const c = leerHoja_(HOJA_CLI)
    .find(x => String(x.nombre || '').trim().toUpperCase() === nom.toUpperCase()) || {};

  const n = v => Number(v) || 0;
  return { ok:true, datos: {
    recibo: folio, cliente: nom,
    fecha: fechaISO_(fila['Fecha de Recoleccion']),
    horaInicio: horaTxt_(fila['hora inicio']), horaFinal: horaTxt_(fila['hora final']),
    kgBio: n(fila['Kg Recolectados']), cantBio: n(fila['cantidad bolsas']),
    kgAnatomo: n(fila['kg anatomopatologico']), cantAnatomo: n(fila['cantidad anatomo']),
    kgPunzo: n(fila['kg punzo cortantes']), cantPunzo: n(fila['cantidad punzo cort']),
    totalKg: n(fila['total Kg']) ||
      (n(fila['Kg Recolectados']) + n(fila['kg anatomopatologico']) + n(fila['kg punzo cortantes'])),
    obs: String(fila.Observaciones || ''), manifiesto: String(fila.manifiesto || ''),
    responsable: String(fila.Responsable || ''), vehiculo: String(fila.vehiculo || ''),
    acta: String(fila.acta || ''),
    gps: (fila.latRegistro && fila.lngRegistro)
         ? String(fila.latRegistro) + ', ' + String(fila.lngRegistro) : '',
    firma: String(fila.firma || ''), firmante: String(fila.firmante || ''),
    razon: String(c['razon social'] || ''), ruc: String(c.ruc || ''),
    contacto: String(c.contacto || ''), direccion: String(c.direccion || ''),
    frecuencia: String(c.frecuencia || ''),
    correo: String(c.correo || ''), telefono: String(c.telefono || ''),
    whatsapp: String(c.whatsapp || ''), canal: String(c.canal || '')
  }, empresa: datosDoc_('recibo') };
}

/* Todo lo que se le ha recolectado a un cliente, para consultarlo en campo. */
function api_historialCliente(pin, cliente) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };

  const nom = String(cliente || '').trim().toUpperCase();
  const n = v => Number(v) || 0;
  let totalKg = 0;

  const lista = leerHoja_(HOJA_REC)
    .filter(r => String(r.Cliente || '').trim().toUpperCase() === nom)
    .map(r => {
      const tot = n(r['total Kg']) ||
        (n(r['Kg Recolectados']) + n(r['kg anatomopatologico']) + n(r['kg punzo cortantes']));
      totalKg += tot;
      return {
        fecha: fechaISO_(r['Fecha de Recoleccion']),
        horaInicio: horaTxt_(r['hora inicio']), horaFinal: horaTxt_(r['hora final']),
        totalKg: Math.round(tot * 100) / 100,
        kgBio: n(r['Kg Recolectados']), cantBio: n(r['cantidad bolsas']),
        kgAnatomo: n(r['kg anatomopatologico']), cantAnatomo: n(r['cantidad anatomo']),
        kgPunzo: n(r['kg punzo cortantes']), cantPunzo: n(r['cantidad punzo cort']),
        recibo: String(r['recibo numero'] || ''), responsable: String(r.Responsable || ''),
        acta: String(r.acta || '')
      };
    })
    .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

  return { ok:true, cliente: String(cliente || ''), totalVisitas: lista.length,
           totalKg: Math.round(totalKg * 100) / 100, recolecciones: lista };
}

/* El Index nuevo llama a este nombre; la lógica buena es la de api_generarActa,
   que numera correlativo, sella por operador y guarda el desglose por cliente. */
function api_generarActaPlanta(pin, datos) {
  return api_generarActa(pin, datos);
}

/* ═══════ Avance de la ruta en vivo, para el panel del administrador ═══════ */
function api_avanceHoy(pin, fecha) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  const f = String(fecha || hoyPanama_());

  const nombres = {};
  leerHoja_(HOJA_CLI).forEach(c => nombres[Number(c.id)] = String(c.nombre || ''));

  const rutas = {};
  leerHoja_(HOJA_RUT).forEach(r => {
    if (fechaISO_(r.fecha) !== f) return;
    const id = String(r.rutaId || ''); if (!id) return;
    if (!rutas[id]) rutas[id] = { rutaId:id, conductor:String(r.conductor||''),
                                  vehiculo:String(r.vehiculo||''), paradas:[] };
    const cid = Number(r.clienteId);
    if (rutas[id].paradas.some(p => p.clienteId === cid)) return;
    rutas[id].paradas.push({ orden:Number(r.orden||0), clienteId:cid,
                             cliente: nombres[cid] || ('Cliente ' + cid) });
  });

  const n = v => Number(v) || 0;
  const hechas = {};
  leerHoja_(HOJA_REC).forEach(r => {
    if (fechaISO_(r['Fecha de Recoleccion']) !== f) return;
    hechas[String(r.Cliente || '').trim().toUpperCase()] = {
      kg: n(r['total Kg']) || (n(r['Kg Recolectados']) + n(r['kg anatomopatologico']) + n(r['kg punzo cortantes'])),
      hora: horaTxt_(r['hora final']) || horaTxt_(r['hora inicio']),
      recibo: String(r['recibo numero'] || '')
    };
  });

  const jor = {};
  leerHoja_(HOJA_JOR).forEach(j => {
    if (fechaISO_(j.fecha) !== f) return;
    jor[String(j.conductor || '').trim().toUpperCase()] = {
      horaInicio: horaTxt_(j.horaInicio), horaFinal: horaTxt_(j.horaFinal),
      abierta: !String(j.horaFinal || '').trim(), vehiculo: String(j.vehiculo || '')
    };
  });

  const lista = Object.keys(rutas).map(k => {
    const r = rutas[k];
    r.paradas.sort((a, b) => a.orden - b.orden);
    let kg = 0, ok = 0;
    r.paradas.forEach(p => {
      const h = hechas[p.cliente.trim().toUpperCase()];
      p.hecha = !!h;
      p.kg = h ? Math.round(h.kg * 100) / 100 : 0;
      p.hora = h ? h.hora : '';
      p.recibo = h ? h.recibo : '';
      if (h) { ok++; kg += h.kg; }
    });
    r.total = r.paradas.length;
    r.completadas = ok;
    r.pct = r.total ? Math.round(ok / r.total * 100) : 0;
    r.kg = Math.round(kg * 100) / 100;
    r.jornada = jor[r.conductor.trim().toUpperCase()] || null;
    const sig = r.paradas.find(p => !p.hecha);
    r.siguiente = sig ? sig.cliente : '';
    return r;
  }).sort((a, b) => a.conductor.localeCompare(b.conductor));

  const t = { rutas: lista.length, total: 0, completadas: 0, kg: 0 };
  lista.forEach(r => { t.total += r.total; t.completadas += r.completadas; t.kg += r.kg; });
  t.kg = Math.round(t.kg * 100) / 100;
  t.pct = t.total ? Math.round(t.completadas / t.total * 100) : 0;

  return { ok:true, fecha:f, hoy:hoyPanama_(), rutas:lista, totales:t,
           hora: Utilities.formatDate(new Date(), 'America/Panama', 'HH:mm') };
}

/* ═══════ Últimos recibos emitidos, para el administrador ═══════ */
function api_ultimosRecibos(pin, n) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  const num = v => Number(v) || 0;

  let lista = leerHoja_(HOJA_REC)
    .filter(r => String(r['recibo numero'] || '').trim())
    .map(r => ({
      recibo: String(r['recibo numero']).trim(),
      cliente: String(r.Cliente || ''),
      fecha: fechaISO_(r['Fecha de Recoleccion']),
      horaInicio: horaTxt_(r['hora inicio']), horaFinal: horaTxt_(r['hora final']),
      totalKg: Math.round((num(r['total Kg']) ||
        (num(r['Kg Recolectados']) + num(r['kg anatomopatologico']) + num(r['kg punzo cortantes']))) * 100) / 100,
      responsable: String(r.Responsable || ''),
      enviado: String(r.enviado || ''), firmante: String(r.firmante || '')
    }));

  if (u.rol === 'operador') {
    lista = lista.filter(r => r.responsable.trim().toLowerCase() === u.nombre.trim().toLowerCase());
  }
  lista.sort((a, b) => (b.fecha + b.horaFinal).localeCompare(a.fecha + a.horaFinal));
  return { ok:true, recibos: lista.slice(0, Number(n) || 20) };
}

/* ═══════ Buscador de recibos ═══════
   Para verificar un recibo cuando un cliente consulta. Busca por número
   (parcial o completo: "0412" encuentra ECV-2026-0412), por cliente o por
   rango de fechas. El operador solo ve los suyos; el resto ve todos. */
function api_buscarRecibos(pin, filtro) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  const f = filtro || {};
  const q  = String(f.q || '').trim().toUpperCase();
  const d1 = String(f.desde || '').trim(), d2 = String(f.hasta || '').trim();
  const tope = Math.min(Number(f.limite) || 50, 200);
  if (!q && !d1 && !d2) return { ok:false, error:'Escribe un número de recibo, un cliente o un rango de fechas.' };

  const num = v => Number(v) || 0;
  let lista = leerHoja_(HOJA_REC)
    .filter(r => String(r['recibo numero'] || '').trim())
    .map(r => ({
      recibo: String(r['recibo numero']).trim(),
      cliente: String(r.Cliente || ''),
      fecha: fechaISO_(r['Fecha de Recoleccion']),
      horaInicio: horaTxt_(r['hora inicio']), horaFinal: horaTxt_(r['hora final']),
      totalKg: Math.round((num(r['total Kg']) ||
        (num(r['Kg Recolectados']) + num(r['kg anatomopatologico']) + num(r['kg punzo cortantes']))) * 100) / 100,
      responsable: String(r.Responsable || ''),
      acta: String(r.acta || ''),
      enviado: String(r.enviado || ''), firmante: String(r.firmante || '')
    }));

  if (u.rol === 'operador')
    lista = lista.filter(r => r.responsable.trim().toLowerCase() === u.nombre.trim().toLowerCase());
  if (q)  lista = lista.filter(r => r.recibo.toUpperCase().indexOf(q) >= 0 ||
                                    r.cliente.toUpperCase().indexOf(q) >= 0);
  if (d1) lista = lista.filter(r => r.fecha && r.fecha >= d1);
  if (d2) lista = lista.filter(r => r.fecha && r.fecha <= d2);

  const total = lista.length;
  lista.sort((a, b) => (b.fecha + b.horaFinal).localeCompare(a.fecha + a.horaFinal));
  return { ok:true, recibos: lista.slice(0, tope), total: total, truncado: total > tope };
}

/* Una parada enviada queda cerrada; solo el administrador la reabre. */
function api_reabrirRecibo(pin, reciboNumero) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (!esAdmin_(u)) return { ok:false, error:'Solo el administrador puede reabrir un recibo.' };

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_REC);
    const vals = h.getDataRange().getValues();
    const cab = vals[0].map(String);
    const cRec = cab.indexOf('recibo numero');
    let cEnv = cab.indexOf('enviado');
    if (cEnv < 0) { cEnv = cab.length; h.getRange(1, cEnv + 1).setValue('enviado'); }
    for (let i = 1; i < vals.length; i++) {
      if (String(vals[i][cRec]).trim() === String(reciboNumero).trim()) {
        h.getRange(i + 1, cEnv + 1).setValue('');
        return { ok:true };
      }
    }
    return { ok:false, error:'No encontré el recibo ' + reciboNumero + '.' };
  } finally { lock.releaseLock(); }
}

/* Deja constancia de cuándo y por dónde se le envió el recibo al cliente. */
function api_marcarReciboEnviado(pin, reciboNumero, canal) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_REC);
    const vals = h.getDataRange().getValues();
    const cab = vals[0].map(String);
    const cRec = cab.indexOf('recibo numero');
    let cEnv = cab.indexOf('enviado');
    if (cEnv < 0) { cEnv = cab.length; h.getRange(1, cEnv + 1).setValue('enviado'); }

    const sello = hoyPanama_() + ' ' +
      Utilities.formatDate(new Date(), 'America/Panama', 'HH:mm') +
      ' · ' + String(canal || 'manual') + ' · ' + u.nombre;

    for (let i = 1; i < vals.length; i++) {
      if (String(vals[i][cRec]).trim() === String(reciboNumero).trim()) {
        h.getRange(i + 1, cEnv + 1).setValue(sello);
        return { ok:true, sello: sello };
      }
    }
    return { ok:false, error:'No encontré el recibo ' + reciboNumero + '.' };
  } finally { lock.releaseLock(); }
}

/* ═══════ Estado de cuenta ═══════
   Contabilidad factura a la razón social; operaciones recolecta con el nombre
   comercial de cada sucursal. El puente entre los dos mundos es el RUC:
   un RUC = un titular que paga, aunque tenga quince puntos de recolección.
   Los reportes de contabilidad ya traen el ITBMS dentro del monto. */
function api_estadoCuenta(pin, texto) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (!esCobros_(u)) return { ok:false, error:'Sin permiso.' };

  const q = String(texto || '').trim().toUpperCase();
  if (q.length < 2) return { ok:false, error:'Escribe al menos dos letras.' };
  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;
  const hoy = hoyPanama_();
  const tiene = t => String(t || '').toUpperCase().indexOf(q) >= 0;

  /* ── qué RUC busca: por nombre de sucursal, razón social o el RUC mismo ── */
  const clientes = leerHoja_(HOJA_CLI);
  const rucs = {};
  const puntos = [];
  clientes.forEach(c => {
    const ruc = String(c.ruc || '').trim();
    if (!ruc) return;
    if (tiene(c.nombre) || tiene(c['razon social']) || tiene(ruc)) rucs[ruc] = 1;
  });

  /* si no casó por cliente, puede ser el nombre con que factura contabilidad */
  if (!Object.keys(rucs).length) {
    leerHoja_(HOJA_FAC).forEach(f => {
      if (tiene(f.cliente) || tiene(f['razon social']) || tiene(f.ruc)) {
        const r = String(f.ruc || '').trim();
        if (r) rucs[r] = 1;
      }
    });
  }
  const listaRuc = Object.keys(rucs);

  /* ── todos los puntos de recolección de esos RUC ── */
  let razon = '';
  clientes.forEach(c => {
    const ruc = String(c.ruc || '').trim();
    if (ruc && rucs[ruc]) {
      puntos.push(String(c.nombre || ''));
      if (!razon && c['razon social']) razon = String(c['razon social']);
    }
  });

  /* ── facturas del titular ── */
  const pagos = leerHoja_(HOJA_PAG).map(p => ({
    factura: String(p.factura || '').trim(), fecha: fechaISO_(p.fecha),
    monto: r2(p.monto), metodo: String(p.metodo || ''),
    referencia: String(p.referencia || ''), cliente: String(p.cliente || '')
  }));
  const porFac = {};
  pagos.forEach(p => { if (p.factura) porFac[p.factura] = (porFac[p.factura] || 0) + p.monto; });

  const facturas = leerHoja_(HOJA_FAC)
    .filter(f => {
      const r = String(f.ruc || '').trim();
      if (r && rucs[r]) return true;
      /* sin RUC en la hoja de clientes, se cae al nombre */
      return !listaRuc.length && (tiene(f.cliente) || tiene(f['razon social']));
    })
    .map(f => {
      const num = String(f.factura || '').trim();
      const total = r2(f.total) || r2(f.monto);      // el monto ya trae el ITBMS
      const cobrado = r2(porFac[num] || 0);
      const saldo = r2(total - cobrado);
      const venc = vencimientoDe_(f);
      const mora = (saldo > 0.009 && venc && venc < hoy)
        ? Math.round((new Date(hoy+'T00:00:00') - new Date(venc+'T00:00:00')) / 86400000) : 0;
      return { factura:num, fecha:fechaISO_(f.fecha), cliente:String(f.cliente||''),
               razon:String(f['razon social']||''), ruc:String(f.ruc||''),
               periodo:String(f.periodo||''), total:total, cobrado:cobrado, saldo:saldo,
               vencimiento:venc, mora:mora,
               estado: saldo <= 0.009 ? 'PAGADA' : (cobrado > 0 ? 'PARCIAL' : (mora ? 'VENCIDA' : 'PENDIENTE')) };
    })
    .sort((a, b) => (b.fecha||'').localeCompare(a.fecha||''));

  if (!facturas.length && !puntos.length) {
    const sug = clientes.filter(c => tiene(c.nombre) || tiene(c['razon social']))
      .map(c => String(c.nombre || ''));
    return { ok:true, vacio:true, texto:q, sugerencias: sug.slice(0, 8) };
  }

  if (!razon && facturas.length) razon = facturas[0].razon || facturas[0].cliente;

  const susPagos = pagos.filter(p => facturas.some(f => f.factura === p.factura))
    .sort((a, b) => (b.fecha||'').localeCompare(a.fecha||''));

  const t = { facturas:facturas.length, facturado:0, cobrado:0, saldo:0,
              vencido:0, moraMax:0, ultimaFactura:'', ultimoPago:'' };
  facturas.forEach(f => {
    t.facturado += f.total; t.cobrado += f.cobrado; t.saldo += f.saldo;
    if (f.mora > 0) { t.vencido += f.saldo; if (f.mora > t.moraMax) t.moraMax = f.mora; }
    if (f.fecha > t.ultimaFactura) t.ultimaFactura = f.fecha;
  });
  susPagos.forEach(p => { if (p.fecha > t.ultimoPago) t.ultimoPago = p.fecha; });
  ['facturado','cobrado','saldo','vencido'].forEach(k => t[k] = r2(t[k]));

  /* ── lo recolectado en TODOS sus puntos ── */
  const arriba = {};
  puntos.forEach(p => arriba[p.trim().toUpperCase()] = 1);
  const porPunto = {};
  let kg = 0, visitas = 0, ultima = '';
  leerHoja_(HOJA_REC).forEach(r => {
    const n = String(r.Cliente || '').trim();
    if (!arriba[n.toUpperCase()]) return;
    const k = (Number(r['Kg Recolectados'])||0) + (Number(r['kg anatomopatologico'])||0) +
              (Number(r['kg punzo cortantes'])||0);
    kg += k; visitas++;
    const f = fechaISO_(r['Fecha de Recoleccion']);
    if (f > ultima) ultima = f;
    if (!porPunto[n]) porPunto[n] = { punto:n, visitas:0, kg:0, ultima:'' };
    porPunto[n].visitas++; porPunto[n].kg += k;
    if (f > porPunto[n].ultima) porPunto[n].ultima = f;
  });
  const detallePuntos = Object.keys(porPunto).map(k => {
    porPunto[k].kg = r2(porPunto[k].kg); return porPunto[k];
  }).sort((a, b) => b.kg - a.kg);

  return { ok:true, vacio:false, texto:q,
           razon: razon, rucs: listaRuc, puntos: puntos,
           totales:t, facturas:facturas, pagos:susPagos.slice(0, 60),
           recoleccion: { visitas:visitas, kg:r2(kg), ultima:ultima, puntos:detallePuntos } };
}

/* Facturas cuyo RUC no está en la hoja de Clientes: o son de otro negocio
   del grupo, o el RUC quedó mal escrito. Conviene revisarlas. */
function api_facturasSinCliente(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (!esCobros_(u)) return { ok:false, error:'Sin permiso.' };

  const rucs = {};
  leerHoja_(HOJA_CLI).forEach(c => {
    const r = String(c.ruc || '').trim(); if (r) rucs[r] = String(c.nombre || '');
  });
  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;
  const g = {};
  leerHoja_(HOJA_FAC).forEach(f => {
    const r = String(f.ruc || '').trim();
    if (r && rucs[r]) return;
    const k = r || ('(sin ruc) ' + String(f.cliente || ''));
    if (!g[k]) g[k] = { ruc:r, cliente:String(f.cliente||''), facturas:0, total:0 };
    g[k].facturas++; g[k].total += Number(f.total) || Number(f.monto) || 0;
  });
  const lista = Object.keys(g).map(k => { g[k].total = r2(g[k].total); return g[k]; })
    .sort((a, b) => b.total - a.total);
  return { ok:true, lista: lista, total: r2(lista.reduce((s, x) => s + x.total, 0)) };
}

/* ── El RUC, para buscar ─────────────────────────────────────────────
   Un RUC se guarda como se ve, porque así tiene que salir impreso en la
   factura y en el certificado. Pero se BUSCA sin guiones ni espacios.

   En el libro real hay catorce formas distintas de escribir un RUC. La
   búsqueda comparaba texto contra texto: quien pega el número completo
   desde un PDF, sin guiones, no encontraba nada aunque el cliente
   estuviera ahí. Normalizar los dos lados arregla eso sin tocar el dato.

   Ojo: esto es SOLO para buscar. Los números de FACTURA jamás se
   normalizan — hay dos series que se pisan y quitarles los ceros de la
   izquierda le pega un pago de cinco cifras a una clínica de tres. */
function rucClave_(v) {
  return String(v == null ? '' : v).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/* Nombres para el buscador, sin traer toda la cartera. */
function api_buscarClientes(pin, texto) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  const q = String(texto || '').trim().toUpperCase();
  if (q.length < 2) return { ok:true, lista:[] };
  const qr = rucClave_(q);
  const vistos = {}, lista = [];
  leerHoja_(HOJA_CLI).forEach(c => {
    const n = String(c.nombre || '');
    if (!n || vistos[n]) return;
    const ruc = String(c.ruc || '');
    if (n.toUpperCase().indexOf(q) >= 0 ||
        String(c['razon social']||'').toUpperCase().indexOf(q) >= 0 ||
        ruc.toUpperCase().indexOf(q) >= 0 ||
        (qr.length >= 4 && rucClave_(ruc).indexOf(qr) >= 0)) {
      vistos[n] = 1;
      lista.push({ nombre:n, razon:String(c['razon social']||''), ruc:ruc });
    }
  });
  return { ok:true, lista: lista.slice(0, 10) };
}

/* ═══════════════ GESTIÓN DE COBRO ═══════════════
   Cobrar es insistir: hay que saber a quién se le escribió, cuándo, qué
   prometió y si cumplió. Eso no cabe en Facturas — un cliente puede tener
   diez gestiones sobre las mismas facturas. */

const HOJA_GES = 'Gestion de cobros';
const COLS_GES = ['gestionId','fecha','cliente','razon social','ruc','canal',
                  'saldoEnEseMomento','facturas','mensaje','seCompromete',
                  'montoPrometido','fechaPrometida','resultado','notas','hechoPor','registradoEn'];

function crearHojaGestion() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSheetByName(HOJA_GES)) {
    /* la hoja puede existir vacía: se le ponen los encabezados */
    const h = ss.getSheetByName(HOJA_GES);
    if (h.getLastRow() === 0) h.getRange(1, 1, 1, COLS_GES.length).setValues([COLS_GES]);
    SpreadsheetApp.getUi().alert('La hoja "' + HOJA_GES + '" ya existe. Se revisaron los encabezados.');
    return;
  }
  crearHoja_(ss, HOJA_GES, COLS_GES);
  SpreadsheetApp.getUi().alert('Hoja "' + HOJA_GES + '" creada.');
}

function hojaGestion_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let h = ss.getSheetByName(HOJA_GES);
  if (!h) return crearHoja_(ss, HOJA_GES, COLS_GES);
  if (h.getLastRow() === 0) h.getRange(1, 1, 1, COLS_GES.length).setValues([COLS_GES]);
  return h;
}

/* ═══ Panel de morosidad ═══ */
function api_morosidad(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!esCobros_(u)) return { ok:false, error:'Sin permiso.' };

  const hoy = hoyPanama_();
  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;
  const dias = (a, b) => Math.round((new Date(b+'T00:00:00') - new Date(a+'T00:00:00')) / 86400000);
  const mes = hoy.slice(0, 7);

  const pagos = leerHoja_(HOJA_PAG).map(p => ({
    factura: String(p.factura || '').trim(), fecha: fechaISO_(p.fecha), monto: r2(p.monto)
  }));
  const porFac = {}, ultimoPagoFac = {};
  pagos.forEach(p => {
    if (!p.factura) return;
    porFac[p.factura] = (porFac[p.factura] || 0) + p.monto;
    if (!ultimoPagoFac[p.factura] || p.fecha > ultimoPagoFac[p.factura]) ultimoPagoFac[p.factura] = p.fecha;
  });

  /* recuperado del mes: pagos aplicados a facturas vencidas antes del mes */
  let recuperado = 0, pagosMes = 0;

  /* contacto del cliente, para poder escribirle desde la misma pantalla */
  const contacto = {};
  const tipoCartera = {};
  leerHoja_(HOJA_CLI).forEach(c => {
    const r = String(c.ruc || '').trim();
    const k = r || String(c.nombre || '');
    if (!contacto[k]) contacto[k] = {
      telefono: String(c.telefono || ''), whatsapp: String(c.whatsapp || ''),
      correo: String(c.correo || ''), razon: String(c['razon social'] || ''),
      /* el nombre de la PERSONA. Un mensaje que empieza «Buenos días, Ana»
         se contesta; uno que empieza «Estimados INVERSIONES VALLE, S.A.»
         se archiva. Sin esto no hay a quién saludar. */
      contacto: String(c.contacto || '')
    };
    /* dos llaves para lo mismo, porque las facturas de contabilidad a
       veces traen RUC y a veces solo el nombre */
    const t = carteraDe_(c);
    const rc = rucClave_(c.ruc);
    if (rc) tipoCartera['R' + rc] = t;
    const nm = String(c.nombre || '').trim().toUpperCase();
    if (nm) tipoCartera['N' + nm] = t;
  });

  const deudores = {};
  leerHoja_(HOJA_FAC).forEach(f => {
    const num = String(f.factura || '').trim(); if (!num) return;
    const total = r2(f.total) || r2(f.monto);
    const cobrado = r2(porFac[num] || 0);
    const saldo = r2(netoEsperado_(f, total) - cobrado);
    const venc = vencimientoDe_(f);
    if (saldo <= 0.009) return;

    const mora = (venc && venc < hoy) ? dias(venc, hoy) : 0;
    const ruc = String(f.ruc || '').trim();
    const clave = ruc || String(f.cliente || '');
    if (!deudores[clave]) deudores[clave] = {
      ruc: ruc, cliente: String(f.cliente || ''), razon: String(f['razon social'] || ''),
      /* a qué cartera pertenece. Sin esto la pantalla mide con la misma vara
         a una clínica que a una entidad pública, y entonces el 90% de la
         deuda se ve «vencida» cuando en realidad está en trámite. */
      tipo: tipoCartera['R' + rucClave_(ruc)] ||
            tipoCartera['N' + String(f.cliente || '').trim().toUpperCase()] || 'recurrente',
      saldo: 0, vencido: 0, facturas: 0, moraMax: 0, ultimoPago: '',
      t30:0, t60:0, t90:0, tmas:0, detalle: [],
      telefono: (contacto[clave] || {}).telefono || '',
      whatsapp: (contacto[clave] || {}).whatsapp || '',
      correo:   (contacto[clave] || {}).correo   || '',
      contacto: (contacto[clave] || {}).contacto || ''
    };
    const d = deudores[clave];
    d.saldo += saldo; d.facturas++;
    if (mora > 0) {
      d.vencido += saldo;
      if (mora > d.moraMax) d.moraMax = mora;
      if (mora <= 30) d.t30 += saldo;
      else if (mora <= 60) d.t60 += saldo;
      else if (mora <= 90) d.t90 += saldo;
      else d.tmas += saldo;
    }
    const up = ultimoPagoFac[num] || '';
    if (up > d.ultimoPago) d.ultimoPago = up;
    d.detalle.push({ factura:num, fecha:fechaISO_(f.fecha), total:total,
                     cobrado:cobrado, saldo:saldo, vencimiento:venc, mora:mora });
  });

  /* último pago de cada deudor, mirando todos sus pagos y no solo los de sus facturas abiertas */
  const porCliente = {};
  leerHoja_(HOJA_FAC).forEach(f => {
    const num = String(f.factura || '').trim();
    const ruc = String(f.ruc || '').trim() || String(f.cliente || '');
    if (num) porCliente[num] = ruc;
  });
  pagos.forEach(p => {
    if (p.fecha && p.fecha.slice(0,7) === mes) { pagosMes++; recuperado += p.monto; }
    const c = porCliente[p.factura];
    if (c && deudores[c] && p.fecha > deudores[c].ultimoPago) deudores[c].ultimoPago = p.fecha;
  });

  /* gestiones ya hechas */
  const ges = {};
  let escritosSemana = 0, promesasRotas = [], promesasVivas = [];
  const hace7 = Utilities.formatDate(new Date(new Date(hoy+'T12:00:00').getTime() - 7*86400000),
                                     tzHoja_(), 'yyyy-MM-dd');
  leerHoja_(HOJA_GES).forEach(g => {
    const k = String(g.ruc || '').trim() || String(g.cliente || '');
    const f = fechaISO_(g.fecha);
    if (!ges[k] || f > ges[k].fecha) ges[k] = {
      fecha: f, canal: String(g.canal || ''),
      prometido: r2(g.montoPrometido), fechaPrometida: fechaISO_(g.fechaPrometida),
      resultado: String(g.resultado || '')
    };
    if (f >= hace7) escritosSemana++;
    const fp = fechaISO_(g.fechaPrometida);
    if (fp && String(g.seCompromete||'').toUpperCase() === 'SI' &&
        ['CUMPLIO','ANULADO'].indexOf(String(g.resultado||'').toUpperCase()) < 0) {
      const item = { cliente:String(g.cliente||''), ruc:String(g.ruc||''),
                     monto:r2(g.montoPrometido), fecha:fp, gestionId:String(g.gestionId||'') };
      if (fp < hoy) promesasRotas.push(item); else promesasVivas.push(item);
    }
  });

  const lista = Object.keys(deudores).map(k => {
    const d = deudores[k];
    ['saldo','vencido','t30','t60','t90','tmas'].forEach(z => d[z] = r2(d[z]));
    d.detalle.sort((a,b) => (a.fecha||'').localeCompare(b.fecha||''));
    d.gestion = ges[k] || null;
    d.diasSinPagar = d.ultimoPago ? dias(d.ultimoPago, hoy) : null;
    d.diasSinGestion = (d.gestion && d.gestion.fecha) ? dias(d.gestion.fecha, hoy) : null;
    d.silencioso = (d.diasSinPagar === null || d.diasSinPagar > 60);
    return d;
  }).sort((a, b) => b.vencido - a.vencido || b.saldo - a.saldo);

  const t = { deudores: lista.length, saldo: 0, vencido: 0,
              t30:0, t60:0, t90:0, tmas:0, silenciosos: 0,
              recuperadoMes: r2(recuperado), pagosMes: pagosMes,
              escritosSemana: escritosSemana };
  lista.forEach(d => {
    t.saldo += d.saldo; t.vencido += d.vencido;
    t.t30 += d.t30; t.t60 += d.t60; t.t90 += d.t90; t.tmas += d.tmas;
    if (d.silencioso && d.vencido > 0.009) t.silenciosos++;
  });
  ['saldo','vencido','t30','t60','t90','tmas'].forEach(k => t[k] = r2(t[k]));

  /* ── Las dos carteras, contadas aparte ──────────────────────────────
     Todo junto, el 90% de la deuda sale «con más de 90 días» y parece que
     la empresa no cobra. Separado se ve lo que de verdad pasa: lo
     recurrente reparte 30/40/30 y lo abultado son unos pocos contratos de
     proyectos terminados. Es el mismo dinero contado con la vara correcta. */
  const porCartera = {};
  CARTERAS.forEach(k => porCartera[k] = {
    cartera:k, deudores:0, saldo:0, vencido:0, t30:0, t60:0, t90:0, tmas:0
  });
  lista.forEach(d => {
    const c = porCartera[d.tipo] || porCartera.recurrente;
    c.deudores++;
    c.saldo += d.saldo; c.vencido += d.vencido;
    c.t30 += d.t30; c.t60 += d.t60; c.t90 += d.t90; c.tmas += d.tmas;
  });
  CARTERAS.forEach(k => ['saldo','vencido','t30','t60','t90','tmas']
    .forEach(z => porCartera[k][z] = r2(porCartera[k][z])));

  return { ok:true, usuario:u, hoy:hoy, totales:t, deudores:lista,
           carteras: CARTERAS, porCartera: porCartera,
           promesasRotas: promesasRotas.sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||'')),
           promesasVivas: promesasVivas.sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||'')),
           puedeEditar: esCobros_(u) };
}

/* ═══ Registrar una gestión de cobro ═══ */
function api_guardarGestion(pin, d) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (!esCobros_(u)) return { ok:false, error:'Sin permiso.' };

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const h = hojaGestion_();
    const id = 'GC' + new Date().getTime().toString(36).toUpperCase();
    h.appendRow([id, d.fecha || hoyPanama_(), d.cliente || '', d['razon social'] || '',
      d.ruc || '', d.canal || '', Number(d.saldo) || 0, d.facturas || '',
      String(d.mensaje || '').slice(0, 900),
      d.seCompromete ? 'SI' : 'NO', Number(d.montoPrometido) || '',
      d.fechaPrometida || '', d.resultado || 'PENDIENTE', d.notas || '',
      u.nombre, new Date()]);
    marcar_('cobros');
    return { ok: true, gestionId:id };
  } finally { lock.releaseLock(); }
}

function api_cerrarGestion(pin, gestionId, resultado, notas) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (!esCobros_(u)) return { ok:false, error:'Sin permiso.' };
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const h = hojaGestion_();
    const vals = h.getDataRange().getValues();
    const cab = vals[0].map(String);
    const cId = cab.indexOf('gestionId'), cRes = cab.indexOf('resultado'), cNot = cab.indexOf('notas');
    for (let i = 1; i < vals.length; i++) {
      if (String(vals[i][cId]).trim() === String(gestionId).trim()) {
        if (cRes >= 0) h.getRange(i+1, cRes+1).setValue(resultado || 'CERRADO');
        if (cNot >= 0 && notas) h.getRange(i+1, cNot+1).setValue(notas);
        marcar_('cobros');
        return { ok: true };
      }
    }
    return { ok:false, error:'No encontré esa gestión.' };
  } finally { lock.releaseLock(); }
}

/* Historial de gestiones de un cliente. */
function api_gestionesDe(pin, ruc, cliente) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  const r = String(ruc || '').trim(), c = String(cliente || '').trim().toUpperCase();
  const lista = leerHoja_(HOJA_GES).filter(g =>
    (r && String(g.ruc||'').trim() === r) ||
    (!r && String(g.cliente||'').trim().toUpperCase() === c)
  ).map(g => ({
    gestionId: String(g.gestionId||''), fecha: fechaISO_(g.fecha),
    canal: String(g.canal||''), saldo: Number(g.saldoEnEseMomento)||0,
    seCompromete: String(g.seCompromete||''), montoPrometido: Number(g.montoPrometido)||0,
    fechaPrometida: fechaISO_(g.fechaPrometida), resultado: String(g.resultado||''),
    notas: String(g.notas||''), hechoPor: String(g.hechoPor||'')
  })).sort((a,b) => (b.fecha||'').localeCompare(a.fecha||''));
  return { ok:true, gestiones: lista };
}

/* ═══ Consultar una factura antes de abonarle ═══
   El pago se registra contra la factura, no contra un nombre escrito a mano:
   así el cliente, la razón social y el RUC salen de la fuente. */
function api_verFactura(pin, numero) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  /* Esta devolvía la factura a cualquier PIN válido, operador incluido.
     Se notó al crear el rol de cobros: si se separa quién ve qué, no puede
     quedar una puerta lateral que entrega lo facturado a quien pasaba. */
  if (!esCobros_(u)) return { ok:false, error:'Sin permiso para ver facturas.' };
  const n = String(numero || '').trim();
  if (!n) return { ok:false, error:'Escribe el número de factura.' };
  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;

  const f = leerHoja_(HOJA_FAC).find(x => String(x.factura || '').trim() === n);
  if (!f) return { ok:false, error:'No existe la factura ' + n + '.' };

  const abonos = leerHoja_(HOJA_PAG)
    .filter(p => String(p.factura || '').trim() === n)
    .map(p => ({ pagoId:String(p.pagoId||''), fecha:fechaISO_(p.fecha), monto:r2(p.monto),
                 metodo:String(p.metodo||''), referencia:String(p.referencia||'') }))
    .sort((a,b) => (a.fecha||'').localeCompare(b.fecha||''));
  const cobrado = r2(abonos.reduce((s,p) => s + p.monto, 0));
  const total = r2(f.total) || r2(f.monto);
  const venc = vencimientoDe_(f);
  const hoy = hoyPanama_();
  const saldo = r2(total - cobrado);

  return { ok:true, factura:{
    factura:n, fecha:fechaISO_(f.fecha), cliente:String(f.cliente||''),
    razon:String(f['razon social']||''), ruc:String(f.ruc||''),
    periodo:String(f.periodo||''), concepto:String(f.concepto||''),
    total:total, cobrado:cobrado, saldo:saldo, vencimiento:venc,
    mora: (saldo > 0.009 && venc && venc < hoy)
      ? Math.round((new Date(hoy+'T00:00:00') - new Date(venc+'T00:00:00'))/86400000) : 0,
    abonos: abonos
  }};
}

/* Facturas abiertas de un cliente, de la más vieja a la más nueva:
   así se abona primero lo que lleva más tiempo pendiente. */
function api_abiertasDe(pin, ruc, cliente) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;
  const porFac = {};
  leerHoja_(HOJA_PAG).forEach(p => {
    const n = String(p.factura || '').trim();
    if (n) porFac[n] = (porFac[n] || 0) + (Number(p.monto) || 0);
  });
  const r = String(ruc || '').trim(), c = String(cliente || '').trim().toUpperCase();
  const lista = leerHoja_(HOJA_FAC).filter(f => {
    const fr = String(f.ruc || '').trim();
    return (r && fr === r) || (!r && String(f.cliente||'').trim().toUpperCase() === c);
  }).map(f => {
    const n = String(f.factura || '').trim();
    const total = r2(f.total) || r2(f.monto);
    const saldo = r2(total - (porFac[n] || 0));
    return { factura:n, fecha:fechaISO_(f.fecha), total:total, saldo:saldo,
             vencimiento:vencimientoDe_(f) };
  }).filter(f => f.saldo > 0.009)
    .sort((a,b) => (a.fecha||'').localeCompare(b.fecha||''));
  return { ok:true, facturas:lista, saldo: r2(lista.reduce((s,f)=>s+f.saldo,0)) };
}

/* ═══ Corregir un pago o una factura ═══
   Se permite, pero queda constancia: un descuadre corregido en silencio
   reaparece meses después sin que nadie sepa por qué. */
function api_editarPago(pin, pagoId, datos) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (!esAdmin_(u)) return { ok:false, error:'Solo el administrador puede corregir un pago.' };

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_PAG);
    const vals = h.getDataRange().getValues();
    const cab = vals[0].map(String);
    const cId = cab.indexOf('pagoId');
    let cNot = cab.indexOf('notas');
    if (cNot < 0) { cNot = cab.length; h.getRange(1, cNot+1).setValue('notas'); cab.push('notas'); }

    for (let i = 1; i < vals.length; i++) {
      if (String(vals[i][cId]).trim() !== String(pagoId).trim()) continue;
      const cambios = [];
      ['factura','fecha','monto','metodo','referencia','cliente'].forEach(k => {
        if (datos[k] === undefined) return;
        const c = cab.indexOf(k); if (c < 0) return;
        const antes = String(vals[i][c]);
        const ahora = String(datos[k]);
        if (antes === ahora) return;
        h.getRange(i+1, c+1).setValue(datos[k]);
        cambios.push(k + ': "' + antes + '" → "' + ahora + '"');
      });
      if (cambios.length) {
        const sello = '[' + hoyPanama_() + ' ' +
          Utilities.formatDate(new Date(), 'America/Panama', 'HH:mm') + ' · ' + u.nombre +
          ' corrigió ' + cambios.join(' · ') + ']';
        const previo = String(vals[i][cNot] || '');
        h.getRange(i+1, cNot+1).setValue((previo ? previo + ' ' : '') + sello);
      }
      return { ok:true, cambios: cambios.length };
    }
    return { ok:false, error:'No encontré el pago ' + pagoId + '.' };
  } finally { lock.releaseLock(); }
}

function api_editarFactura(pin, numero, datos) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (!esAdmin_(u)) return { ok:false, error:'Solo el administrador puede corregir una factura.' };

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_FAC);
    const vals = h.getDataRange().getValues();
    const cab = vals[0].map(String);
    const cNum = cab.indexOf('factura');
    let cNot = cab.indexOf('notas');
    if (cNot < 0) { cNot = cab.length; h.getRange(1, cNot+1).setValue('notas'); cab.push('notas'); }

    for (let i = 1; i < vals.length; i++) {
      if (String(vals[i][cNum]).trim() !== String(numero).trim()) continue;
      const cambios = [];
      ['fecha','cliente','razon social','ruc','periodo','concepto','monto','total',
       'plazo','vencimiento'].forEach(k => {
        if (datos[k] === undefined) return;
        const c = cab.indexOf(k); if (c < 0) return;
        const antes = String(vals[i][c]), ahora = String(datos[k]);
        if (antes === ahora) return;
        h.getRange(i+1, c+1).setValue(datos[k]);
        cambios.push(k + ': "' + antes + '" → "' + ahora + '"');
      });
      if (cambios.length) {
        const sello = '[' + hoyPanama_() + ' ' +
          Utilities.formatDate(new Date(), 'America/Panama', 'HH:mm') + ' · ' + u.nombre +
          ' corrigió ' + cambios.join(' · ') + ']';
        const previo = String(vals[i][cNot] || '');
        h.getRange(i+1, cNot+1).setValue((previo ? previo + ' ' : '') + sello);
      }
      return { ok:true, cambios: cambios.length };
    }
    return { ok:false, error:'No encontré la factura ' + numero + '.' };
  } finally { lock.releaseLock(); }
}

function api_borrarPago(pin, pagoId, motivo) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (!esAdmin_(u)) return { ok:false, error:'Solo el administrador puede borrar un pago.' };
  if (!String(motivo || '').trim()) return { ok:false, error:'Escribe el motivo.' };

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_PAG);
    const vals = h.getDataRange().getValues();
    const cId = vals[0].map(String).indexOf('pagoId');
    for (let i = vals.length - 1; i >= 1; i--) {
      if (String(vals[i][cId]).trim() === String(pagoId).trim()) {
        h.deleteRow(i + 1);
        return { ok:true };
      }
    }
    return { ok:false, error:'No encontré ese pago.' };
  } finally { lock.releaseLock(); }
}

/* ═══════════════ CERTIFICADO AMBIENTAL ═══════════════
   Cierra la cadena: recolección → disposición → tratamiento → factura →
   pago → certificado. Por eso se emite al percibir el pago, no al tratar
   (cláusula tercera, numeral 9 del contrato). */

function api_obtenerListaClientes(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return [];
  const vistos = {}, lista = [];
  leerHoja_(HOJA_CLI).forEach(c => {
    const n = String(c.nombre || '').trim();
    const est = String(c.estado || '').toUpperCase();
    if (!n || vistos[n]) return;
    if (['CANCELADO', 'SUSPENDIDO'].indexOf(est) >= 0) return;   // no se certifica a quien ya no es cliente
    vistos[n] = 1; lista.push(n);
  });
  return lista.sort();
}

function api_datosCertificado(pin, clienteIdONombre, desde, hasta) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (['supervisor','gerente','admin','mercadeo'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin permiso para generar certificados.' };

  const d1 = String(desde || ''), d2 = String(hasta || '');
  const q = String(clienteIdONombre || '').trim().toUpperCase();
  if (!q || !d1 || !d2) return { ok:false, error:'Faltan datos: elige el cliente y el periodo.' };

  const clientes = leerHoja_(HOJA_CLI);
  const qr = rucClave_(q);
  const cliente = clientes.find(c =>
    String(c.id) === q ||
    String(c.nombre || '').trim().toUpperCase() === q ||
    String(c['razon social'] || '').trim().toUpperCase() === q ||
    (qr.length >= 4 && rucClave_(c.ruc) === qr));
  if (!cliente) return { ok:false, error:'No encontré un cliente con ese nombre o RUC.' };

  /* Un certificado se emite al titular, no a una sucursal: si el RUC agrupa
     varios puntos, se certifica todo lo recolectado en todos ellos. */
  const ruc = rucClave_(cliente.ruc);
  const puntos = [];
  clientes.forEach(c => {
    const r = rucClave_(c.ruc);
    if (ruc ? (r === ruc) : (String(c.nombre||'').trim().toUpperCase() === q))
      puntos.push(String(c.nombre || '').trim());
  });
  const acepta = {};
  puntos.forEach(p => acepta[p.toUpperCase()] = 1);

  const n = v => { const z = Number(v); return isFinite(z) ? z : 0; };
  const r2 = v => Math.round(v * 100) / 100;
  let kgBio = 0, kgAnatomo = 0, kgPunzo = 0;
  let bBio = 0, bAnatomo = 0, bPunzo = 0, visitas = 0;
  const actas = {}, porPunto = {}, sinActa = [];

  leerHoja_(HOJA_REC).forEach(r => {
    const nom = String(r.Cliente || '').trim();
    if (!acepta[nom.toUpperCase()]) return;
    const f = fechaISO_(r['Fecha de Recoleccion']);
    if (!f || f < d1 || f > d2) return;

    const kb = n(r['Kg Recolectados']), ka = n(r['kg anatomopatologico']), kp = n(r['kg punzo cortantes']);
    kgBio += kb; kgAnatomo += ka; kgPunzo += kp;
    bBio += n(r['cantidad bolsas']); bAnatomo += n(r['cantidad anatomo']); bPunzo += n(r['cantidad punzo cort']);
    visitas++;

    const ac = String(r.acta || '').trim();
    if (ac) actas[ac] = true; else sinActa.push(f);

    if (!porPunto[nom]) porPunto[nom] = { punto:nom, visitas:0, kg:0 };
    porPunto[nom].visitas++; porPunto[nom].kg += kb + ka + kp;
  });

  if (!visitas)
    return { ok:false, error:'No hay recolecciones de este cliente entre el ' + d1 + ' y el ' + d2 + '.' };

  /* Estado de cuenta: el certificado se entrega al percibir el pago. */
  let facturado = 0, cobrado = 0, saldo = 0, facturasAbiertas = 0;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSheetByName(HOJA_FAC)) {
    const porFac = {};
    leerHoja_(HOJA_PAG).forEach(p => {
      const num = String(p.factura || '').trim();
      if (num) porFac[num] = (porFac[num] || 0) + n(p.monto);
    });
    leerHoja_(HOJA_FAC).forEach(f => {
      const fr = String(f.ruc || '').trim();
      const fc = String(f.cliente || '').trim().toUpperCase();
      if (ruc ? (fr !== ruc) : !acepta[fc]) return;
      const total = n(f.total) || n(f.monto);
      const c = porFac[String(f.factura || '').trim()] || 0;
      facturado += total; cobrado += c;
      const s = total - c;
      if (s > 0.009) { saldo += s; facturasAbiertas++; }
    });
  }

  const dv = String(cliente.dv || '').trim();
  return {
    ok: true,
    empresa: {
      nombre: String(cliente.nombre || ''),
      razonSocial: String(cliente['razon social'] || cliente.nombre || ''),
      ruc: ruc || 'SIN RUC', dv: dv,
      rucCompleto: ruc ? (dv ? ruc + ' DV ' + dv : ruc) : 'SIN RUC',
      direccion: String(cliente.direccion || ''), region: String(cliente.region || ''),
      puntos: puntos
    },
    periodo: { desde: d1, hasta: d2 },
    totales: {
      kgBio: r2(kgBio), kgAnatomo: r2(kgAnatomo), kgPunzo: r2(kgPunzo),
      totalKg: r2(kgBio + kgAnatomo + kgPunzo),
      bultosBio: bBio, bultosAnatomo: bAnatomo, bultosPunzo: bPunzo,
      totalBultos: bBio + bAnatomo + bPunzo, visitas: visitas
    },
    porPunto: Object.keys(porPunto).map(k => { porPunto[k].kg = r2(porPunto[k].kg); return porPunto[k]; })
                    .sort((a, b) => b.kg - a.kg),
    actasAsociadas: Object.keys(actas).sort(),
    /* avisos: el certificado no se bloquea, pero quien lo emite debe saber */
    avisos: {
      sinActa: sinActa.length,
      saldo: r2(saldo), facturasAbiertas: facturasAbiertas,
      facturado: r2(facturado), cobrado: r2(cobrado),
      alDia: saldo <= 0.009
    },
    fechaEmision: hoyPanama_(),
    emitidoPor: u.nombre
  };
}

/* ═══════ Registro de certificados emitidos ═══════
   Un certificado es un documento legal: lleva folio correlativo, queda
   registrado y se puede volver a abrir por su número. Antes el folio era
   aleatorio y cambiaba cada vez que se abría la página.
   El certificado se entrega al percibir el pago: si el cliente tiene saldo,
   no se emite, salvo que administración o gerencia lo fuercen a sabiendas. */
const HOJA_CERT = 'Certificados';
const COLS_CERT = ['folio','fechaEmision','cliente','razonSocial','ruc','dv','direccion',
                   'desde','hasta','visitas','kgBio','kgAnatomo','kgPunzo','totalKg',
                   'bultosBio','bultosAnatomo','bultosPunzo','totalBultos','actas','puntos',
                   'saldoAlEmitir','forzado','emitidoPor','registradoEn'];

function siguienteCertificado_() {
  const anio = hoyPanama_().slice(0, 4);
  const previos = leerHoja_(HOJA_CERT)
    .map(c => String(c.folio || ''))
    .filter(z => z.indexOf('CERT-' + anio + '-') === 0)
    .map(z => Number((z.split('-')[2] || '').replace(/\D/g, '')) || 0);
  return 'CERT-' + anio + '-' + ('000' + ((previos.length ? Math.max.apply(null, previos) : 0) + 1)).slice(-4);
}

function api_emitirCertificado(pin, clienteIdONombre, desde, hasta, forzar) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };

  const d = api_datosCertificado(pin, clienteIdONombre, desde, hasta);
  if (!d || !d.ok) return d;

  const puedeForzar = ['admin','gerente'].indexOf(u.rol) >= 0;
  if (!d.avisos.alDia && !(forzar && puedeForzar)) {
    return { ok:false, sinPazYSalvo:true, puedeForzar: puedeForzar,
             empresa: d.empresa, avisos: d.avisos,
             error: 'El cliente tiene un saldo pendiente de B/. ' + d.avisos.saldo.toFixed(2) +
                    ' en ' + d.avisos.facturasAbiertas + ' factura(s). El certificado se entrega al percibir el pago.' };
  }

  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const h = hojaPlanta_(HOJA_CERT, COLS_CERT);
    const folio = siguienteCertificado_();
    const e = d.empresa, t = d.totales, p = d.periodo;
    h.appendRow([folio, d.fechaEmision, e.nombre, e.razonSocial, e.ruc === 'SIN RUC' ? '' : e.ruc, e.dv,
      e.direccion, p.desde, p.hasta, t.visitas, t.kgBio, t.kgAnatomo, t.kgPunzo, t.totalKg,
      t.bultosBio, t.bultosAnatomo, t.bultosPunzo, t.totalBultos,
      d.actasAsociadas.join(', '), e.puntos.join(' | '),
      d.avisos.saldo, d.avisos.alDia ? '' : 'SI', u.nombre, new Date()]);
    d.folio = folio;
    d.forzado = !d.avisos.alDia;
    return d;
  } finally { lock.releaseLock(); }
}

/* Reabre un certificado ya emitido, tal como quedó registrado. */
function api_verCertificado(pin, folio) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (['supervisor','gerente','admin','mercadeo'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin permiso para ver certificados.' };
  const fo = String(folio || '').trim().toUpperCase();
  if (!fo) return { ok:false, error:'Falta el número de folio.' };

  const c = leerHoja_(HOJA_CERT).find(x => String(x.folio || '').trim().toUpperCase() === fo);
  if (!c) return { ok:false, error:'No encontré el certificado ' + fo + '.' };

  const n = v => Number(v) || 0;
  const ruc = String(c.ruc || '').trim(), dv = String(c.dv || '').trim();
  const lista = s => String(s || '').split(/\s*[|,]\s*/).filter(Boolean);
  return {
    ok: true, folio: String(c.folio), forzado: String(c.forzado || '').toUpperCase() === 'SI',
    empresa: {
      nombre: String(c.cliente || ''), razonSocial: String(c.razonSocial || c.cliente || ''),
      ruc: ruc || 'SIN RUC', dv: dv,
      rucCompleto: ruc ? (dv ? ruc + ' DV ' + dv : ruc) : 'SIN RUC',
      direccion: String(c.direccion || ''), puntos: lista(c.puntos)
    },
    periodo: { desde: fechaISO_(c.desde), hasta: fechaISO_(c.hasta) },
    totales: {
      kgBio: n(c.kgBio), kgAnatomo: n(c.kgAnatomo), kgPunzo: n(c.kgPunzo), totalKg: n(c.totalKg),
      bultosBio: n(c.bultosBio), bultosAnatomo: n(c.bultosAnatomo), bultosPunzo: n(c.bultosPunzo),
      totalBultos: n(c.totalBultos), visitas: n(c.visitas)
    },
    actasAsociadas: lista(c.actas),
    avisos: { saldo: n(c.saldoAlEmitir), alDia: n(c.saldoAlEmitir) <= 0.009 },
    fechaEmision: fechaISO_(c.fechaEmision),
    emitidoPor: String(c.emitidoPor || ''),
    empresa: datosDoc_('certificado')
  };
}

/* Los últimos certificados emitidos, para reabrirlos o verificar un folio. */
function api_certificadosEmitidos(pin, n) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (['supervisor','gerente','admin','mercadeo'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin permiso.' };
  const lista = leerHoja_(HOJA_CERT).map(c => ({
    folio: String(c.folio || ''), fecha: fechaISO_(c.fechaEmision),
    cliente: String(c.cliente || ''), desde: fechaISO_(c.desde), hasta: fechaISO_(c.hasta),
    totalKg: Number(c.totalKg) || 0, visitas: Number(c.visitas) || 0,
    forzado: String(c.forzado || '').toUpperCase() === 'SI',
    emitidoPor: String(c.emitidoPor || '')
  })).filter(c => c.folio);
  lista.sort((a, b) => b.folio.localeCompare(a.folio));
  return { ok:true, certificados: lista.slice(0, Number(n) || 20) };
}

/* ═══════════════ FORMULARIO QUE LLENA EL CLIENTE ═══════════════
   Mercadeo le manda un enlace único atado a la propuesta. El cliente llena
   sus datos y al enviar el enlace se cierra: una corrección posterior se
   hace por llamada y la edita mercadeo. */

function api_obtenerDatosFormularioCliente(token) {
  const cod = String(token || '').trim();
  if (!cod) return { ok:false, error:'El enlace no es válido. Pídele uno nuevo a tu asesor.' };

  const p = leerHoja_(HOJA_PRO)
    .find(r => String(r.codigoPropuesta || '').trim() === cod);
  if (!p) return { ok:false, error:'Este enlace no corresponde a ninguna solicitud activa.' };

  const est = String(p['formulario estado'] || '').trim().toUpperCase();
  if (est === 'RECIBIDO')
    return { ok:false, cerrado:true, empresa:String(p.empresa || ''),
             recibido: fechaISO_(p['formulario recibido']),
             error:'Ya recibimos tus datos. Si necesitas corregir algo, comunícate con nosotros al 310-2268.' };

  if (CERRADOS_PRO.indexOf(String(p.estado || '').trim()) >= 0)
    return { ok:false, cerrado:true, empresa:String(p.empresa || ''),
             error:'Esta solicitud ya fue procesada. Gracias por tu interés.' };

  /* solo lo que el cliente necesita ver, nunca tarifas ni notas internas */
  return { ok:true, token:cod,
    zonas: ['CENTRO CIUDAD','PANAMÁ ESTE','PANAMÁ OESTE','PANAMÁ NORTE','COLON','CHORRERA','OTRA'],
    /* Al cliente se le ofrece una lista corta y en sus palabras: es lo que él
       cree que necesita, no la frecuencia contratada. Por eso no se une con
       la hoja ni lleva DIARIA o ANUAL. */
    frecuencias: ['SEMANAL','2X SEMANA','QUINCENAL','MENSUAL','BIMESTRAL','TRIMESTRAL','NO SÉ AÚN'],
    datos:{
    empresa: String(p.empresa || ''), 'razon social': String(p['razon social'] || ''),
    ruc: String(p.ruc || ''), dv: String(p.dv || ''),
    'representante legal': String(p['representante legal'] || ''),
    direccion: String(p.direccion || ''), provincia: String(p.provincia || ''),
    zona: String(p.zona || ''), contacto: String(p.contacto || ''),
    cargo: String(p.cargo || ''), telefono: String(p.telefono || ''),
    celular: String(p.celular || ''), correo: String(p.correo || ''),
    actividad: String(p.actividad || ''), 'tipo residuo': String(p['tipo residuo'] || ''),
    'kg estimado': String(p['kg estimado'] || ''), 'base del kg': String(p['base del kg'] || ''),
    'frecuencia estimada': String(p['frecuencia estimada'] || ''),
    'notas cliente': String(p['notas cliente'] || '')
  }};
}

function api_guardarDatosFormularioCliente(token, d) {
  const cod = String(token || '').trim();
  if (!cod) return { ok:false, error:'El enlace no es válido.' };
  if (!d || !String(d.empresa || '').trim())
    return { ok:false, error:'Falta el nombre de la empresa.' };
  d = JSON.parse(JSON.stringify(d));

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return { ok:false, error:'Intenta de nuevo en un momento.' };
  try {
    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_PRO);
    if (!h) return { ok:false, error:'No se pudo registrar. Avísale a tu asesor.' };
    const vals = h.getDataRange().getValues();
    let cab = vals[0].map(String);
    const cCod = cab.indexOf('codigoPropuesta');

    let fila = -1;
    for (let i = 1; i < vals.length; i++)
      if (String(vals[i][cCod]).trim() === cod) { fila = i; break; }
    if (fila < 0) return { ok:false, error:'Este enlace no corresponde a ninguna solicitud.' };

    const cEst = cab.indexOf('formulario estado');
    if (cEst >= 0 && String(vals[fila][cEst]).trim().toUpperCase() === 'RECIBIDO')
      return { ok:false, cerrado:true, error:'Ya habíamos recibido tus datos. Gracias.' };

    /* El formulario nombra los campos en otro estilo; se aceptan las dos formas.
       El cliente nunca toca tarifas, estado ni notas internas. */
    const equivale = {
      'empresa':'empresa', 'razonSocial':'razon social', 'ruc':'ruc', 'dv':'dv',
      'representanteLegal':'representante legal', 'direccion':'direccion',
      'provincia':'provincia', 'zona':'zona', 'contacto':'contacto', 'cargo':'cargo',
      'telefono':'telefono', 'celular':'celular', 'correo':'correo',
      'actividad':'actividad', 'residuo':'tipo residuo', 'tipoResiduo':'tipo residuo',
      'kg':'kg estimado', 'kgEstimado':'kg estimado',
      'frecuenciaKg':'base del kg', 'frecuencia':'frecuencia estimada',
      'frecuenciaEstimada':'frecuencia estimada', 'notas':'notas cliente',
      'notasCliente':'notas cliente'
    };
    const permitidos = ['empresa','razon social','ruc','dv','representante legal','direccion',
      'provincia','zona','contacto','cargo','telefono','celular','correo',
      'actividad','tipo residuo','kg estimado','base del kg','frecuencia estimada','notas cliente'];

    /* se normaliza lo que llegue a los nombres de la hoja */
    const limpio = {};
    Object.keys(d).forEach(k => {
      const destino = equivale[k] || k;
      if (permitidos.indexOf(destino) >= 0 && d[k] !== undefined && d[k] !== '')
        limpio[destino] = d[k];
    });
    d = limpio;

    permitidos.forEach(k => {
      if (d[k] === undefined) return;
      let c = cab.indexOf(k);
      if (c < 0) { c = cab.length; h.getRange(1, c + 1).setValue(k); cab.push(k); }
      h.getRange(fila + 1, c + 1).setValue(d[k]);
    });

    /* el enlace queda cerrado y el prospecto marcado para mercadeo */
    const marcar = (col, val) => {
      let c = cab.indexOf(col);
      if (c < 0) { c = cab.length; h.getRange(1, c + 1).setValue(col); cab.push(col); }
      h.getRange(fila + 1, c + 1).setValue(val);
    };
    marcar('formulario estado', 'RECIBIDO');
    /* envío nuevo: se limpia el descarte anterior para que vuelva a avisar */
    marcar('formularioVisto', '');
    marcar('formulario recibido', hoyPanama_() + ' ' +
      Utilities.formatDate(new Date(), 'America/Panama', 'HH:mm'));   // texto, no objeto Date
    /* el estado avanza solo, salvo que ya haya ido más lejos */
    const cEs = cab.indexOf('estado');
    const est = cEs >= 0 ? String(vals[fila][cEs] || '').trim() : '';
    if (['','Registrado','Formulario enviado'].indexOf(est) >= 0)
      marcar('estado', 'Formulario recibido');

    marcar_('mercadeo');

    return { ok: true, empresa:String(d.empresa || '') };
  } finally { lock.releaseLock(); }
}

/* Mercadeo: cuántos formularios llegaron y están sin revisar. */
function api_formulariosRecibidos(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  const lista = leerHoja_(HOJA_PRO)
    .filter(p => String(p['formulario estado'] || '').trim().toUpperCase() === 'RECIBIDO')
    .map(p => ({ codigoPropuesta:String(p.codigoPropuesta || ''), empresa:String(p.empresa || ''),
                 recibido:String(p['formulario recibido'] || ''), estado:String(p.estado || ''),
                 contacto:String(p.contacto || ''), correo:String(p.correo || '') }))
    .sort((a, b) => (b.recibido || '').localeCompare(a.recibido || ''));
  /* sin revisar = todavía no se le hizo la propuesta */
  const nuevos = lista.filter(p => ['Propuesta enviada','En negociación','Contrato en proceso',
                                    'Firmado','Pasado a cartera'].indexOf(p.estado) < 0);
  return { ok:true, recibidos:lista, sinRevisar:nuevos };
}

/* Qué se pierde si se borra este prospecto. Se consulta antes de preguntar,
   para que el aviso diga lo que de verdad está en juego. */
function api_revisarBorrado(pin, codigoPropuesta) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  const p = leerHoja_(HOJA_PRO)
    .find(r => String(r.codigoPropuesta || '').trim() === String(codigoPropuesta).trim());
  if (!p) return { ok:false, error:'No encontré ese prospecto.' };

  const est = String(p.estado || '').trim();
  const puede = esAdmin_(u) || BORRABLES_MERCADEO.indexOf(est) >= 0;
  const pierde = [];
  if (String(p['formulario estado'] || '').toUpperCase() === 'RECIBIDO')
    pierde.push('los datos que el cliente ya envió por formulario');
  if (String(p['n contrato'] || '').trim()) pierde.push('el número de contrato ' + p['n contrato']);
  if (Number(p['valor cotizado']) > 0) pierde.push('la cotización registrada');
  const docs = ['doc aviso operacion','doc cedula representante','doc registro publico',
                'doc datos generales','doc datos bancarios']
    .filter(k => String(p[k] || '').toUpperCase() === 'SI').length;
  if (docs) pierde.push(docs + ' documento(s) marcados como recibidos');

  return { ok:true, puede:puede, estado:est, empresa:String(p.empresa || ''),
           pierde:pierde, rol:u.rol };
}

/* Deja constancia de que el formulario ya se envió, y mueve el estado. */
function api_marcarFormularioEnviado(pin, codigoPropuesta, canal) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['mercadeo','supervisor','admin'].indexOf(u.rol) < 0) return { ok:false, error:'Sin permiso.' };

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_PRO);
    const vals = h.getDataRange().getValues();
    let cab = vals[0].map(String);
    const cCod = cab.indexOf('codigoPropuesta');
    for (let i = 1; i < vals.length; i++) {
      if (String(vals[i][cCod]).trim() !== String(codigoPropuesta).trim()) continue;
      const marcar = (col, val) => {
        let c = cab.indexOf(col);
        if (c < 0) { c = cab.length; h.getRange(1, c+1).setValue(col); cab.push(col); }
        h.getRange(i+1, c+1).setValue(val);
      };
      /* solo avanza el estado si todavía no ha ido más lejos */
      const est = String(vals[i][cab.indexOf('estado')] || '').trim();
      if (['','Registrado'].indexOf(est) >= 0) marcar('estado', 'Formulario enviado');
      marcar('formulario estado', 'ENVIADO');
      marcar('formulario enviado', hoyPanama_() + ' · ' + (canal || '') + ' · ' + u.nombre);
      return { ok:true };
    }
    return { ok:false, error:'No encontré ese prospecto.' };
  } finally { lock.releaseLock(); }
}

/* ═══════════════ PLANTA DE TRATAMIENTO ═══════════════
   La trazabilidad de entrada la cierra el acta ACT de Josue. Aquí empieza la
   otra mitad: qué se trató, con qué parámetros, y qué salió al relleno.
   Los lotes se mezclan físicamente en planta, así que no se rastrea por acta
   sino por periodo: entró tanto entre estas fechas, se trató en estos ciclos,
   salió tanto al vertedero. */

const HOJA_CIC = 'Ciclos';
const HOJA_SAL = 'Salidas';
const HOJA_MTO = 'Mantenimiento';
const HOJA_CON = 'Consumibles';

/* pruebaBiologica y resultadoPrueba guardan el INDICADOR QUÍMICO (la cinta).
   Conservan el nombre viejo para no dejar huérfano el histórico; ver la nota
   de las dos verificaciones más abajo.
   verifBiologica y resultadoBiologico son la verificación biológica de verdad
   —el vial Attest—, mensual, y nacen vacías hasta que lleguen los viales. */
const COLS_CIC = ['cicloId','fecha','numero','horaInicio','horaFinal','bolsas','kgEntrada',
                  'kgSalida','temperatura','minutos','duracionTotal','pruebaBiologica',
                  'resultadoPrueba','operador','observaciones','salida','registradoEn',
                  'esPrueba','verifBiologica','resultadoBiologico',
                  'anulado','motivoAnulacion','anuladoPor','fechaAnulacion',
                  /* El ciclo corrió —lo certifica el contador del equipo— pero el
                     peso no quedó anotado. No es cero y no es un ciclo de prueba:
                     es un dato que falta, y así se guarda. La alternativa era
                     perder también la constancia de que el ciclo existió, o
                     inventarle un peso. Las dos son peores. */
                  'pesoNoRegistrado'];

const COLS_SAL = ['salidaId','fecha','horaSalida','kgPlanta','kgEmas','reciboEmas',
                  'vehiculo','conductor','destino','ciclos','firmaResponsable','responsable',
                  'merma','observaciones','registradoPor','registradoEn'];

const COLS_MTO = ['mtoId','equipo','tipo','fecha','proximo','responsable','empresa',
                  'resultado','costo','observaciones','registradoPor','registradoEn'];

const COLS_CON = ['consumoId','fecha','periodo','articulo','cantidad','unidad',
                  'registradoPor','registradoEn'];

/* Los del equipo de Planta. Si cambia el equipo, se ajusta aquí. */
/* 800 kg por ciclo, en siete carros de acero inoxidable, conformada por peso y
   balanceada entre ellos. Estuvo en 3000 por error: todo lo que el sistema
   calculaba con la capacidad —cuántos ciclos hacen falta, si uno va lleno o a
   medias— salía con un número casi cuatro veces mayor que el real. */
const RECETA_AUTOCLAVE = { temperatura: 137, minutos: 56, capacidadKg: 800 };

/* ═══ EL MARGEN DE TRABAJO ═══
   Los 800 kg no son un techo duro: son el objetivo. El operador pesa el big
   bag hasta acercarse, y clavar los 800 exactos es imposible, así que la
   planta trabaja con ±15 kg — un ciclo de 810 es tan normal como uno de 790.

   Esto importa para el aviso. Si saltara con cualquier cosa por encima de
   800, Planta lo vería en uno de cada dos ciclos y en dos semanas
   aprendería a darle «registrar» sin leerlo. Un aviso que suena siempre es
   un aviso apagado, y entonces no sirve para el caso en que de verdad hay
   un dedazo. Por eso el umbral es 815 y no 800. */
const MARGEN_CARGA = 15;

/* ═══ LAS DOS VERIFICACIONES, QUE NO SON LA MISMA ═══════════════════
   El sistema llamaba «prueba biológica con cinta 3M» a una sola cosa, y
   eso mezclaba dos controles distintos:

   · INDICADOR QUÍMICO — la cinta 3M. Es Clase 1: dice que el paquete pasó
     por calor, no que se esterilizó. Va en CADA ciclo. Es lo que la planta
     hace hoy, y es lo que guardan todos los registros anteriores.

   · VERIFICACIÓN BIOLÓGICA — el vial Attest 1262, incubado. Ese sí prueba
     que murió el organismo de referencia. El protocolo la fija MENSUAL, en
     el último ciclo del mes previo al despacho.

   No es un cambio de vocabulario: EMAS pidió pruebas biológicas que
   demuestren el 99,99 %, y el manifiesto les estaba llamando biológico al
   indicador químico. Ahora cada uno se llama por su nombre.

   Los viales todavía no se han comprado, así que la verificación biológica
   nace vacía y esperando. La columna del libro conserva su nombre viejo
   —pruebaBiologica— a propósito: ahí está el histórico del indicador
   químico y renombrarla lo dejaría huérfano. Lo que cambió es todo lo que
   lee una persona.

   La cadencia no es una constante: «mensual» se resuelve mirando si el mes
   en curso ya tiene la suya, en api_tratamiento. Un número suelto aquí
   habría sido otra regla más que mantener de acuerdo con el protocolo. */

const EQUIPOS_PLANTA = ['Autoclave','Caldera','Planta eléctrica','Triturador',
                        'Báscula','Hidrolavadora','Otro'];
const TIPOS_MTO = ['Preventivo','Correctivo','Prueba de hermeticidad','Calibración',
                   'Inspección','Cambio de aceite','Otro'];

/* ═══ Renumerar los ciclos al formato nuevo ═══
   Se corre una vez, desde el menú ECOVSA, cuando el histórico ya tenga los
   números reales de la máquina escritos en la columna «numero».

   Lo importante está en la segunda parte: la hoja Salidas guarda, en cada
   despacho, la LISTA DE CICLOS ESCRITA CON SUS IDENTIFICADORES. Renombrar
   los ciclos a mano sin tocar esa lista deja al despacho apuntando a
   nombres que ya no existen — el manifiesto se queda sin sus ciclos y el
   ciclo sin su despacho, y eso no avisa: simplemente sale vacío. Por eso
   las dos cosas se hacen juntas, o no se hace ninguna. */
function renumerarCiclos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const hC = ss.getSheetByName(HOJA_CIC);
  if (!hC) { ui.alert('No existe la hoja Ciclos.'); return; }
  asegurarColumnas_(hC, COLS_CIC);

  const vals = hC.getDataRange().getValues();
  const cab = vals[0].map(String);
  const cId = cab.indexOf('cicloId'), cF = cab.indexOf('fecha'), cN = cab.indexOf('numero');
  if (cId < 0 || cF < 0 || cN < 0) { ui.alert('A la hoja Ciclos le faltan columnas.'); return; }

  const cambios = [], sinNumero = [], choques = {};
  for (let i = 1; i < vals.length; i++) {
    const viejo = String(vals[i][cId] || '').trim();
    if (!viejo) continue;
    const num = Number(vals[i][cN]) || 0;
    if (!num) { sinNumero.push(viejo); continue; }
    const nuevo = cicloId_(fechaISO_(vals[i][cF]), num);
    if (nuevo === viejo) continue;
    if (choques[nuevo]) { sinNumero.push(viejo + ' (repetiría a ' + choques[nuevo] + ')'); continue; }
    choques[nuevo] = viejo;
    cambios.push({ fila: i + 1, viejo: viejo, nuevo: nuevo });
  }

  if (!cambios.length) {
    ui.alert('Nada que renumerar.' +
      (sinNumero.length ? '\n\nSin número de máquina, quedan como están:\n' + sinNumero.join('\n') : ''));
    return;
  }

  const r = ui.alert('Renumerar ciclos',
    'Se van a renombrar ' + cambios.length + ' ciclo(s) al formato CIC-26-09-0000, ' +
    'y se corregirán las referencias en los despachos de la hoja Salidas.\n\n' +
    'Ejemplo: ' + cambios[0].viejo + '  →  ' + cambios[0].nuevo +
    (sinNumero.length ? '\n\nSin número de máquina, quedan como están (' + sinNumero.length + '):\n' +
                        sinNumero.slice(0, 12).join('\n') : '') +
    '\n\n¿Seguimos?', ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;

  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const mapa = {};
    cambios.forEach(x => { mapa[x.viejo] = x.nuevo; hC.getRange(x.fila, cId + 1).setValue(x.nuevo); });

    /* y ahora los despachos, que es la parte que se olvida */
    let despachos = 0;
    const hS = ss.getSheetByName(HOJA_SAL);
    if (hS) {
      const sv = hS.getDataRange().getValues();
      const sc = sv[0].map(String).indexOf('ciclos');
      if (sc >= 0) {
        for (let i = 1; i < sv.length; i++) {
          const lista = String(sv[i][sc] || '').split(',').map(z => z.trim()).filter(String);
          if (!lista.length) continue;
          const nueva = lista.map(z => mapa[z] || z);
          if (nueva.join(',') !== lista.join(',')) {
            hS.getRange(i + 1, sc + 1).setValue(nueva.join(', '));
            despachos++;
          }
        }
      }
    }
    ui.alert('Listo.\n\n' + cambios.length + ' ciclo(s) renumerados.\n' +
             despachos + ' despacho(s) con sus referencias corregidas.');
  } finally { lock.releaseLock(); }
}

/* ═══ Renumerar las actas al formato nuevo ═══
   Se corre una vez, con la app cerrada.

   Lo importante es la segunda parte, y es la misma historia que con los
   ciclos: **cada recolección guarda, en su columna `acta`, el código del
   acta que la selló**. Renombrar las actas sin corregir esa columna deja a
   cada recolección apuntando a un acta que ya no se llama así — y eso no
   avisa: el acta sale sin sus recolecciones, la recolección sin su acta, y
   nadie se entera hasta que alguien va a buscar una.

   Se puede renumerar todo el histórico porque las actas de ECOVSA solo
   existen en digital: no hay papel firmado por ahí que diga el código
   viejo. El día que se imprima y se entregue una, esto deja de ser
   seguro. */
function renumerarActas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const hd = ss.getSheetByName(HOJA_DIS);
  if (!hd) { ui.alert('No existe la hoja de disposiciones.'); return; }

  const vals = hd.getDataRange().getValues();
  const cab = vals[0].map(String);
  const cId = cab.indexOf('actaId'), cF = cab.indexOf('fecha');
  if (cId < 0 || cF < 0) { ui.alert('A la hoja de actas le faltan columnas.'); return; }

  /* Se renumera EN ORDEN DE FECHA, no en el orden en que estén las filas:
     el número dentro del mes tiene que seguir el calendario o no significa
     nada. */
  const filas = [];
  for (let i = 1; i < vals.length; i++) {
    const viejo = String(vals[i][cId] || '').trim();
    if (!viejo) continue;
    const f = fechaISO_(vals[i][cF]);
    if (!f) continue;
    filas.push({ fila: i + 1, viejo: viejo, fecha: f });
  }
  filas.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.viejo.localeCompare(b.viejo));

  const porMes = {}, cambios = [], choques = {}, saltadas = [];
  filas.forEach(x => {
    const mes = x.fecha.slice(0, 7);
    porMes[mes] = (porMes[mes] || 0) + 1;
    const nuevo = actaId_(x.fecha, porMes[mes]);
    if (nuevo === x.viejo) { choques[nuevo] = x.viejo; return; }
    /* No debería pasar nunca: el número corre dentro del mes y pasa a tres
       dígitos solo/ si un mes llegara a 100 actas. Pero si pasara, lo que no
       se puede hacer es renombrar dos actas con el mismo código — eso deja
       dos registros distintos con la misma identidad y las recolecciones
       apuntando a cualquiera de los dos. Se deja quieta y SE DICE: un salto
       silencioso aquí es peor que no renumerar. */
    if (choques[nuevo]) { saltadas.push(x.viejo + ' (chocaba con ' + nuevo + ')'); return; }
    choques[nuevo] = x.viejo;
    cambios.push({ fila: x.fila, viejo: x.viejo, nuevo: nuevo });
  });

  if (!cambios.length) { ui.alert('Nada que renumerar: las actas ya están en el formato nuevo.'); return; }

  const meses = Object.keys(porMes).sort();
  const r = ui.alert('Renumerar actas',
    'Se van a renombrar ' + cambios.length + ' acta(s) al formato ACT-26-09-01, ' +
    'y se corregirán las referencias en la columna «acta» de las recolecciones.\n\n' +
    'Ejemplo: ' + cambios[0].viejo + '  →  ' + cambios[0].nuevo + '\n' +
    'Meses afectados: ' + meses.length + ' (de ' + meses[0] + ' a ' + meses[meses.length-1] + ')\n' +
    'El mes con más actas tiene ' + Math.max.apply(null, meses.map(m => porMes[m])) + '.\n' +
    (saltadas.length
      ? '\nATENCIÓN: ' + saltadas.length + ' acta(s) se quedan como están porque el código\n' +
        'nuevo chocaría con otra:\n' + saltadas.slice(0, 5).join('\n') + '\n'
      : '') +
    '\nHazlo con la aplicación cerrada. ¿Seguimos?', ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;

  const lock = LockService.getScriptLock(); lock.waitLock(60000);
  try {
    const mapa = {};
    cambios.forEach(x => { mapa[x.viejo] = x.nuevo; hd.getRange(x.fila, cId + 1).setValue(x.nuevo); });

    /* y ahora las recolecciones, que es la parte que se olvida */
    let tocadas = 0;
    const hr = ss.getSheetByName(HOJA_REC);
    if (hr) {
      const rv = hr.getDataRange().getValues();
      const ca = rv[0].map(String).indexOf('acta');
      if (ca >= 0) {
        for (let i = 1; i < rv.length; i++) {
          const a = String(rv[i][ca] || '').trim();
          if (a && mapa[a]) { hr.getRange(i + 1, ca + 1).setValue(mapa[a]); tocadas++; }
        }
      }
    }
    ui.alert('Listo.\n\n' + cambios.length + ' acta(s) renumeradas.\n' +
             tocadas + ' recolección(es) con su referencia corregida.\n' +
             (saltadas.length ? saltadas.length + ' acta(s) quedaron con su código viejo.\n' : '') +
             '\nCorre ahora «Revisar la integridad del libro» para confirmar que no quedó nada suelto.');
  } finally { lock.releaseLock(); }
}

function crearHojasPlanta() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let n = 0;
  [[HOJA_CIC, COLS_CIC], [HOJA_SAL, COLS_SAL],
   [HOJA_MTO, COLS_MTO], [HOJA_CON, COLS_CON]].forEach(p => {
    if (!ss.getSheetByName(p[0])) { crearHoja_(ss, p[0], p[1]); n++; }
  });
  SpreadsheetApp.getUi().alert(n ? 'Se crearon ' + n + ' hoja(s) de planta.'
                                : 'Las hojas de planta ya existen.');
}

/* Abre una hoja de planta y se asegura de que tenga todas las columnas que
   el código espera.

   ESTO ES LO QUE FALTABA, Y COSTÓ CARO. Antes esta función solo escribía la
   cabecera cuando la hoja estaba VACÍA. El día que a COLS_CIC se le agregó
   'duracionTotal' en la posición 11, la hoja Ciclos ya tenía datos: se quedó
   con sus 16 nombres viejos mientras el código empezó a escribir 17 valores
   por posición. Desde la columna 11 todo entró corrido una casilla.

   El resultado no se vio como un error. Se vio como un dato: la duración del
   ciclo —97 minutos— quedó en la casilla de la prueba biológica, y el ciclo
   del 1 de septiembre terminó marcado como despachado hacia una salida
   llamada «prueba 1». Nunca apareció en los pendientes y nunca se le pudo
   sacar el manifiesto.

   Lo más incómodo del asunto: el remedio ya estaba escrito. asegurarColumnas_
   existe desde hace rato y se usa en diez lugares —clientes, solicitudes,
   finanzas—. Planta fue la única familia de hojas que nunca lo recibió. */
function hojaPlanta_(nombre, cols) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let h = ss.getSheetByName(nombre);
  if (!h) h = crearHoja_(ss, nombre, cols);
  if (h.getLastRow() === 0) h.getRange(1, 1, 1, cols.length).setValues([cols]);
  asegurarColumnas_(h, cols);
  return h;
}

/* Arma una fila leyendo la cabecera REAL de la hoja, no la lista del código.

   Es la diferencia entre «el undécimo valor» y «el valor que va bajo
   duracionTotal». Con esto, agregar una columna al código deja de ser
   peligroso: si la hoja todavía no la tiene, conciliarColumnas_ se la pone;
   si la tiene en otro orden, el valor igual cae donde debe; y una columna que
   el código no conoce se queda como está en vez de recibir basura. */
function filaPorNombre_(h, obj) {
  const cab = h.getRange(1, 1, 1, Math.max(h.getLastColumn(), 1))
               .getValues()[0].map(c => String(c).trim());
  return cab.map(c => (c && obj[c] !== undefined) ? obj[c] : '');
}

/* ═══ Panel de tratamiento ═══ */
function api_tratamiento(pin, desde, hasta) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (['planta','supervisor','admin','gerente','mercadeo'].indexOf(u.rol) < 0)
    return { ok:false, error:'Esta pantalla es para planta y supervisores.' };

  const hoy = hoyPanama_();
  const d1 = String(desde || ''), d2 = String(hasta || '');
  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;
  const n = v => Number(v) || 0;

  /* lo que entró a planta: son las actas ACT que generó el operador */
  let kgEntrado = 0, actas = 0;
  leerHoja_(HOJA_DIS).forEach(a => {
    const f = fechaISO_(a.fecha);
    if (!f || (d1 && f < d1) || (d2 && f > d2)) return;
    kgEntrado += n(a.kgTotal); actas++;
  });

  /* los ciclos del periodo */
  const ciclos = leerHoja_(HOJA_CIC).map(c => ({
    cicloId: String(c.cicloId || ''), fecha: fechaISO_(c.fecha),
    numero: n(c.numero), horaInicio: horaTxt_(c.horaInicio), horaFinal: horaTxt_(c.horaFinal),
    bolsas: n(c.bolsas), kgEntrada: r2(c.kgEntrada),
    kgSalida: r2(c.kgSalida) || r2(c.kgEntrada),
    salidaEstimada: !(Number(c.kgSalida) > 0),
    temperatura: n(c.temperatura) || RECETA_AUTOCLAVE.temperatura,
    minutos: n(c.minutos) || RECETA_AUTOCLAVE.minutos,
    duracionTotal: n(c.duracionTotal),
    /* el indicador químico —la cinta— vive en las columnas viejas */
    quimico: String(c.pruebaBiologica || '').toUpperCase() === 'SI',
    resultadoQuimico: String(c.resultadoPrueba || ''),
    biologico: String(c.verifBiologica || '').toUpperCase() === 'SI',
    resultadoBiologico: String(c.resultadoBiologico || ''),
    esPrueba: String(c.esPrueba || '').toUpperCase() === 'SI',
    sinPeso: String(c.pesoNoRegistrado || '').toUpperCase() === 'SI',
    anulado: String(c.anulado || '').toUpperCase() === 'SI',
    motivoAnulacion: String(c.motivoAnulacion || ''),
    anuladoPor: String(c.anuladoPor || ''), fechaAnulacion: fechaISO_(c.fechaAnulacion),
    operador: String(c.operador || ''),
    obs: String(c.observaciones || ''), salida: String(c.salida || '')
  })).filter(c => c.fecha && (!d1 || c.fecha >= d1) && (!d2 || c.fecha <= d2))
     .sort((a, b) => (b.fecha + ('000'+b.numero).slice(-4)).localeCompare(a.fecha + ('000'+a.numero).slice(-4)));

  /* Un ciclo anulado no cuenta en nada, y uno de prueba corrió sin carga: si
     sumara kilos, la merma y el rendimiento saldrían mentirosos. Los dos
     siguen en la lista, a la vista, marcados por lo que son. */
  const cuentan = ciclos.filter(c => !c.anulado && !c.esPrueba);

  const t = { actas: actas, kgEntrado: r2(kgEntrado), ciclos: cuentan.length,
              bolsas: 0, kgTratado: 0, kgSalidaCiclos: 0, pruebas: 0, fallidas: 0,
              deMantenimiento: ciclos.filter(c => c.esPrueba && !c.anulado).length,
              anulados: ciclos.filter(c => c.anulado).length };
  /* Un ciclo sin peso anotado corrió y cuenta como ciclo, pero no puede sumar
     kilos: si sumara cero, el promedio y la merma saldrían mentirosos, y si
     le pusiéramos un estimado dejaría de ser un registro. Cuenta en el
     número de ciclos y se dice cuántos son. */
  t.sinPeso = cuentan.filter(c => c.sinPeso).length;
  cuentan.forEach(c => {
    if (c.sinPeso) return;
    t.bolsas += c.bolsas; t.kgTratado += c.kgEntrada; t.kgSalidaCiclos += c.kgSalida;
    if (c.quimico) { t.pruebas++; if (c.resultadoQuimico.toUpperCase().indexOf('NO') === 0) t.fallidas++; }
  });
  ['kgTratado','kgSalidaCiclos'].forEach(k => t[k] = r2(t[k]));
  t.porTratar = r2(t.kgEntrado - t.kgTratado);
  /* la merma solo tiene sentido con pesos medidos de verdad */
  const conPeso = cuentan.filter(c => !c.salidaEstimada && !c.sinPeso);
  let mE = 0, mS = 0;
  conPeso.forEach(c => { mE += c.kgEntrada; mS += c.kgSalida; });
  t.merma = mE ? Math.round((mE - mS) / mE * 1000) / 10 : null;
  t.ciclosConPeso = conPeso.length;
  t.ciclosEstimados = cuentan.length - conPeso.length;

  /* ═══ Cuántos ciclos faltan para lo que está por tratar ═══
     La carga típica no se inventa ni se toma de la capacidad del equipo: se
     saca de lo que este periodo cargó de verdad. La capacidad son 800 kg pero
     el operador para 10 o 15 antes, así que un ciclo ronda los 785–790 — y
     eso varía. Si el periodo no tiene ciclos con peso, ahí sí se usa la
     capacidad menos ese margen, y la pantalla dice que es referencia. */
  t.cargaTipica = mE && conPeso.length ? r2(mE / conPeso.length)
                                       : RECETA_AUTOCLAVE.capacidadKg - MARGEN_CARGA;
  t.cargaMedida = !!(mE && conPeso.length);
  t.ciclosPorTratar = t.porTratar > 0 && t.cargaTipica > 0
                      ? Math.ceil(t.porTratar / t.cargaTipica) : 0;

  /* ═══ Horas de uso del autoclave en el periodo ═══
     Se suman las horas ANOTADAS y nada más. Donde no hay hora de inicio o de
     final no se estima: la tarjeta dice sobre cuántos ciclos está calculada y
     cuántos quedaron fuera, para que el número no se lea como si cubriera
     todo. Un ciclo que termina después de medianoche cruza el día, y eso se
     contempla sumándole 24 h en vez de dar una duración negativa.

     La duración anotada a mano (duracionTotal) no entra aquí: es otro dato,
     de otra fuente, y mezclarlos daría un total que no se puede reconstruir. */
  const mins = s => { const m = String(s || '').match(/^(\d{1,2}):(\d{2})$/);
                      return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
  let minutosUso = 0, ciclosConHora = 0;
  cuentan.forEach(c => {
    const a = mins(c.horaInicio), b = mins(c.horaFinal);
    if (a === null || b === null) return;
    let d = b - a; if (d < 0) d += 24 * 60;   // el ciclo cruzó la medianoche
    if (d <= 0 || d > 12 * 60) return;        // un ciclo de 56 min no dura 12 h: eso es un dedazo
    minutosUso += d; ciclosConHora++;
  });
  t.horasUso = Math.round(minutosUso / 6) / 10;
  t.ciclosConHora = ciclosConHora;
  t.ciclosSinHora = cuentan.length - ciclosConHora;

  /* ═══ ¿Toca la verificación biológica? ═══
     El protocolo la fija MENSUAL, en el último ciclo del mes previo al
     despacho. Antes el sistema la pedía cada 3 ciclos, que era otra regla —
     y encima se la pedía al indicador químico, que va en cada ciclo.

     Aquí se responde lo único que la pantalla necesita saber: si este mes
     ya tiene su verificación biológica o todavía no. Sin viales no se puede
     hacer, así que el aviso dice qué falta en vez de dar una orden. */
  const mesActual = hoy.slice(0, 7);
  const delMes = leerHoja_(HOJA_CIC).filter(c => {
    const f = fechaISO_(c.fecha);
    return f && f.slice(0, 7) === mesActual &&
           String(c.anulado || '').toUpperCase() !== 'SI';
  });
  const bioDelMes = delMes.filter(c => String(c.verifBiologica || '').toUpperCase() === 'SI')[0] || null;

  /* el indicador químico va en cada ciclo: cuántos van sin él */
  let sinQuimico = 0;
  delMes.forEach(c => {
    if (String(c.esPrueba || '').toUpperCase() === 'SI') return;
    if (String(c.pruebaBiologica || '').toUpperCase() !== 'SI') sinQuimico++;
  });

  /* ciclos tratados que todavía no salieron al relleno */
  /* El peso posterior al tratamiento no se pesa en planta: la única báscula
     que lo mide es la del relleno. Cuando falta, se toma el de entrada como
     referencia y se marca como estimado para que nadie lo lea como medición. */
  const pendientes = leerHoja_(HOJA_CIC)
    .filter(c => !String(c.salida || '').trim() && fechaISO_(c.fecha) &&
                 String(c.anulado || '').toUpperCase() !== 'SI' &&
                 String(c.esPrueba || '').toUpperCase() !== 'SI')
    .map(c => ({ cicloId:String(c.cicloId||''), fecha:fechaISO_(c.fecha), numero:n(c.numero),
                 kgSalida: r2(c.kgSalida) || r2(c.kgEntrada),
                 estimado: !(Number(c.kgSalida) > 0),
                 sinPeso: String(c.pesoNoRegistrado || '').toUpperCase() === 'SI',
                 bolsas:n(c.bolsas) }))
    .sort((a, b) => (a.fecha||'').localeCompare(b.fecha||''));
  const kgPorDespachar = r2(pendientes.reduce((s, c) => s + c.kgSalida, 0));

  return { ok:true, usuario:u, hoy:hoy, desde:d1, hasta:d2,
           receta: RECETA_AUTOCLAVE,
           totales:t, ciclos:ciclos,
           /* la cinta va en cada ciclo; el vial, una vez al mes */
           sinQuimico: sinQuimico,
           bioDelMes: bioDelMes ? { cicloId:String(bioDelMes.cicloId||''),
                                    fecha: fechaISO_(bioDelMes.fecha),
                                    resultado: String(bioDelMes.resultadoBiologico||'') } : null,
           tocaBiologica: !bioDelMes,
           pendientes: pendientes, kgPorDespachar: kgPorDespachar,
           siguienteNumero: siguienteNumeroCiclo_(),
           puedeEditar: ['planta','supervisor','admin'].indexOf(u.rol) >= 0 };
}

/* ═══ EL NÚMERO DE CICLO ES EL DE LA MÁQUINA ═══════════════════════
   No se inventa. El autoclave lleva su propio contador y nunca se
   reinicia, así que ese número identifica el ciclo mejor que cualquier
   cosa que armemos aquí — y como es corrido, un salto significa algo:
   o fue un ciclo de prueba (que ahora se puede registrar) o hubo un
   ciclo que nadie anotó.

   Antes se numeraba corrido dentro del día —01, 02— y el identificador
   se armaba con los DOS últimos dígitos. Si alguien tecleaba el número
   real de la máquina, 550, el ciclo quedaba guardado como el 50. Y al
   llegar a 1550 habría chocado con ese mismo.

   Lo que se devuelve aquí es solo una sugerencia para la pantalla: el
   siguiente al mayor registrado. Quien registra escribe el que marca el
   equipo. */
function siguienteNumeroCiclo_() {
  const nums = leerHoja_(HOJA_CIC).map(c => Number(c.numero) || 0);
  return (nums.length ? Math.max.apply(null, nums) : 0) + 1;
}

/* CIC-26-09-0550 — año, mes y el número del equipo a cuatro dígitos.
   El formato viejo, CIC-20260901-01, era largo y no decía nada que el
   número de máquina no dijera mejor. */
function cicloId_(fecha, numero) {
  const f = String(fecha || hoyPanama_());
  return 'CIC-' + f.slice(2, 4) + '-' + f.slice(5, 7) + '-' +
         ('000' + (Number(numero) || 0)).slice(-4);
}

function api_guardarCiclo(pin, d) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['planta','supervisor','admin'].indexOf(u.rol) < 0) return { ok:false, error:'Sin permiso.' };

  /* Un ciclo de prueba —mantenimiento, prueba de componentes— corre sin carga
     y sin peso. Registrarlo es lo que mantiene continuo el contador de la
     máquina: si no, deja un hueco idéntico al de un ciclo con desechos que
     nadie anotó, y desde afuera esos dos se ven igual. */
  const esPrueba = !!d.esPrueba;
  /* Un ciclo puede entrar sin peso por dos motivos distintos, y el sistema
     tiene que poder decir cuál: o corrió sin carga (prueba de mantenimiento),
     o corrió con carga y el peso no se anotó. Lo segundo pasa con el
     histórico: el contador del equipo certifica que el ciclo existió y el
     cuaderno donde estaba el peso se perdió. Registrarlo con el peso vacío
     dice la verdad; no registrarlo borra la constancia del ciclo. */
  const sinPeso = !!d.pesoNoRegistrado;
  if (!esPrueba && !sinPeso && !(Number(d.kgEntrada) > 0))
    return { ok:false, error:'Falta el peso que entró al ciclo. Si fue un ciclo de prueba sin ' +
                             'carga, márcalo como tal; si el peso no quedó anotado, márcalo ' +
                             'como no registrado.' };

  const numero = Number(d.numero) || siguienteNumeroCiclo_();
  if (!(numero > 0)) return { ok:false, error:'Falta el número de ciclo que marca la máquina.' };

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const h = hojaPlanta_(HOJA_CIC, COLS_CIC);
    const fecha = d.fecha || hoyPanama_();
    const id = cicloId_(fecha, numero);

    const previos = leerHoja_(HOJA_CIC);
    /* El número lo lleva la máquina y no se repite, así que verlo dos veces
       casi siempre es un dedazo. Pero AVISA en vez de trabar, por una razón
       concreta: los ciclos viejos se numeraron corrido dentro del día —01,
       02— y ahí el 1 aparece decenas de veces. Hasta que el histórico se
       renumere con los números reales del equipo, un bloqueo duro le estaría
       diciendo que no a quien está anotando bien. Quien registra ve con cuál
       choca y decide. */
    const choca = previos.filter(c => (Number(c.numero) || 0) === numero &&
                                      String(c.anulado || '').toUpperCase() !== 'SI')[0];
    if (choca && !d.numeroConfirmado)
      return { ok:false, avisoNumero:{
        numero: numero, cicloId: String(choca.cicloId || ''),
        fecha: fechaISO_(choca.fecha) } };

    /* Dos cosas que hoy entran sin que nadie diga nada, y las dos importan
       para lo mismo: que el registro diga lo que de verdad pasó en la máquina.

       El peso. La capacidad de trabajo son 800 kg y el operador para 10 o 15
       kg antes, así que un ciclo ronda los 785–790. Un número por encima de
       800 no es un ciclo grande: es un dedazo (un 7 que quedó en 8, una coma
       corrida) o una carga que no debió correr así. Cualquiera de las dos hay
       que mirarla antes de dejarla escrita.

       La receta. Está grabada en el PLC con su número y solo la cambia un
       operador registrado con su usuario y contraseña; el equipo lleva el año
       corriendo con la misma. Si lo anotado no coincide con la receta, o el
       equipo corrió distinto —y eso se documenta— o quien anotó se equivocó.
       Avisamos y quien registra decide; no bloqueamos, porque el sistema no
       puede saber más que la persona que estaba frente al autoclave. */
    const avisos = [];
    const kgE = Number(d.kgEntrada) || 0;
    if (kgE > RECETA_AUTOCLAVE.capacidadKg + MARGEN_CARGA)
      avisos.push({ campo:'kgEntrada',
        texto:'Anotaste ' + kgE + ' kg. La capacidad de trabajo son ' +
              RECETA_AUTOCLAVE.capacidadKg + ' kg con un margen de ±' + MARGEN_CARGA +
              ', o sea hasta ' + (RECETA_AUTOCLAVE.capacidadKg + MARGEN_CARGA) +
              '. Revisa el peso antes de guardar.' });

    const tmp = Number(d.temperatura) || RECETA_AUTOCLAVE.temperatura;
    if (tmp !== RECETA_AUTOCLAVE.temperatura)
      avisos.push({ campo:'temperatura',
        texto:'Anotaste ' + tmp + ' °C y la receta del equipo corre a ' +
              RECETA_AUTOCLAVE.temperatura + ' °C.' });

    const min = Number(d.minutos) || RECETA_AUTOCLAVE.minutos;
    if (min !== RECETA_AUTOCLAVE.minutos)
      avisos.push({ campo:'minutos',
        texto:'Anotaste ' + min + ' minutos y la receta del equipo corre ' +
              RECETA_AUTOCLAVE.minutos + ' minutos.' });

    if (avisos.length && !d.parametrosConfirmados)
      return { ok:false, avisoParametros:{ avisos:avisos, receta:RECETA_AUTOCLAVE } };

    /* Y esto ya no es un aviso: el código se arma con el año, el mes y el
       número, así que dos ciclos con el mismo número en el mismo mes serían
       el mismo registro. Aquí no hay nada que confirmar. */
    if (previos.some(c => String(c.cicloId || '').trim() === id))
      return { ok:false, error:'Ya existe un ciclo ' + id + '. Dos ciclos del mismo mes no ' +
                               'pueden llevar el mismo número de equipo.' };

    h.appendRow(filaPorNombre_(h, {
      cicloId: id,
      fecha: fecha,
      numero: numero,
      esPrueba: esPrueba ? 'SI' : '',
      pesoNoRegistrado: sinPeso ? 'SI' : '',
      verifBiologica: d.verifBiologica ? 'SI' : '',
      resultadoBiologico: d.resultadoBiologico || '',
      horaInicio: d.horaInicio || '',
      horaFinal: d.horaFinal || '',
      bolsas: Number(d.bolsas) || 0,
      kgEntrada: Number(d.kgEntrada) || 0,
      kgSalida: Number(d.kgSalida) || 0,
      temperatura: Number(d.temperatura) || RECETA_AUTOCLAVE.temperatura,
      minutos: Number(d.minutos) || RECETA_AUTOCLAVE.minutos,
      duracionTotal: Number(d.duracionTotal) || '',
      pruebaBiologica: d.pruebaBiologica ? 'SI' : 'NO',
      resultadoPrueba: d.resultadoPrueba || '',
      operador: d.operador || u.nombre,
      /* Si se guardó con parámetros fuera de la receta, queda dicho en el
         registro. Quien lo lea dentro de un año no va a tener a nadie a quien
         preguntarle por qué ese ciclo corrió distinto. */
      observaciones: (d.observaciones || '') +
        (avisos.length ? (d.observaciones ? ' · ' : '') +
          'Guardado con parámetros fuera de la receta (' +
          avisos.map(a => a.campo).join(', ') + '), confirmado por ' + u.nombre : ''),
      salida: '',                    // se llena cuando el ciclo se despacha
      registradoEn: new Date()
    }));
    marcar_('planta');
    return { ok: true, cicloId:id };
  } finally { lock.releaseLock(); }
}

/* ═══ Cargar muchos ciclos de una vez ═══
   Para el histórico. Planta entrega del control de producción cuatro
   datos por ciclo —número, fecha, peso y hora— y el resto lo pone el
   sistema: la temperatura y los minutos salen de la receta, que está
   grabada en el PLC con su número y solo la cambia un operador registrado
   con usuario y contraseña. Eso no es deducir: es anotar cómo está
   configurada la máquina, y cualquiera puede ir a comprobarlo.

   Lo que NO se rellena es si se puso la cinta en ese ciclo. Eso nadie lo
   puede saber después, así que queda vacío y se ve que falta — que es lo
   correcto en un registro que puede terminar en una auditoría.

   Se revisa TODO antes de escribir NADA. Una carga a medias en una hoja de
   registros de esterilización es peor que una que no entró: deja un
   histórico en el que ya no se sabe qué se cargó y qué no. */
function api_cargarCiclos(pin, filas, opciones) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (['planta','supervisor','admin'].indexOf(u.rol) < 0) return { ok:false, error:'Sin permiso.' };
  if (!filas || !filas.length) return { ok:false, error:'No hay filas que cargar.' };

  const o = opciones || {};
  const nota = String(o.nota || 'Cargado del control de producción').trim();
  const n = v => Number(String(v == null ? '' : v).replace(',', '.')) || 0;

  const previos = leerHoja_(HOJA_CIC);
  const idsUsados = {}, numsUsados = {};
  previos.forEach(c => {
    idsUsados[String(c.cicloId || '').trim()] = String(c.cicloId || '').trim();
    const x = Number(c.numero) || 0;
    if (x && String(c.anulado || '').toUpperCase() !== 'SI') numsUsados[x] = String(c.cicloId || '');
  });

  const buenas = [], problemas = [];
  const vistosId = {}, vistosNum = {};

  filas.forEach((f, i) => {
    const linea = i + 1;
    const numero = Number(f.numero) || 0;
    const fecha = String(f.fecha || '').trim().slice(0, 10);
    const kg = n(f.kgEntrada);
    const esPrueba = !!f.esPrueba;
    const sinPeso = !!f.pesoNoRegistrado;

    if (!numero)  return problemas.push({ linea:linea, que:'sin número de ciclo' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha))
      return problemas.push({ linea:linea, que:'la fecha no está como 2026-09-11', dato:String(f.fecha || '') });
    if (!esPrueba && !sinPeso && !(kg > 0))
      return problemas.push({ linea:linea, que:'sin peso de entrada — si no quedó anotado, ' +
        'escribe «sin peso» en esa columna', dato:'ciclo ' + numero });
    /* El objetivo son 800 kg con ±15 de margen: un ciclo de 810 es tan normal
       como uno de 790. Por encima de 815 sí hay algo que mirar — un dedazo,
       una coma corrida, o una carga que no debió correr así. */
    if (kg > RECETA_AUTOCLAVE.capacidadKg + MARGEN_CARGA)
      return problemas.push({ linea:linea, que:'pesa más que la capacidad de trabajo (' +
        RECETA_AUTOCLAVE.capacidadKg + ' kg ±' + MARGEN_CARGA + ')',
        dato:'ciclo ' + numero + ' · ' + kg + ' kg' });

    const id = cicloId_(fecha, numero);
    if (idsUsados[id])
      return problemas.push({ linea:linea, que:'ya está en el libro', dato:id });
    if (numsUsados[numero])
      return problemas.push({ linea:linea, que:'el número ya lo tiene otro ciclo',
                              dato:'ciclo ' + numero + ' → ' + numsUsados[numero] });
    if (vistosId[id])
      return problemas.push({ linea:linea, que:'repetido dentro de la misma carga', dato:id });
    if (vistosNum[numero])
      return problemas.push({ linea:linea, que:'el número se repite en la línea ' + vistosNum[numero],
                              dato:'ciclo ' + numero });
    vistosId[id] = linea; vistosNum[numero] = linea;

    buenas.push({ id:id, numero:numero, fecha:fecha, kg:kg, esPrueba:esPrueba, sinPeso:sinPeso,
      horaInicio: String(f.horaInicio || '').trim(),
      horaFinal:  String(f.horaFinal  || '').trim(),
      bolsas: n(f.bolsas), kgSalida: n(f.kgSalida),
      obs: String(f.observaciones || '').trim() });
  });

  /* ── los huecos del contador ──
     El número lo lleva la máquina y no se reinicia, así que un salto
     significa algo: o fue un ciclo de prueba que nadie anotó, o fue un
     ciclo con desechos que nadie anotó. Se avisa, no se traba: el hueco
     puede estar perfectamente explicado fuera del sistema. */
  const todos = Object.keys(numsUsados).map(Number)
    .concat(buenas.map(b => b.numero)).sort((a, b) => a - b);
  const huecos = [];
  for (let i = 1; i < todos.length && huecos.length < 40; i++) {
    const salto = todos[i] - todos[i - 1];
    if (salto > 1) huecos.push(salto === 2 ? String(todos[i-1] + 1)
                                           : (todos[i-1] + 1) + ' al ' + (todos[i] - 1));
  }

  if (problemas.length && !o.forzar)
    return { ok:false, revisar:true, problemas:problemas,
             listas: buenas.length, total: filas.length, huecos: huecos };

  if (!buenas.length) return { ok:false, error:'No quedó ninguna fila cargable.' };

  const lock = LockService.getScriptLock(); lock.waitLock(60000);
  try {
    const h = hojaPlanta_(HOJA_CIC, COLS_CIC);
    const hoy = hoyPanama_();
    buenas.forEach(b => {
      h.appendRow(filaPorNombre_(h, {
        cicloId: b.id, fecha: b.fecha, numero: b.numero,
        esPrueba: b.esPrueba ? 'SI' : '',
        pesoNoRegistrado: b.sinPeso ? 'SI' : '',
        horaInicio: b.horaInicio, horaFinal: b.horaFinal,
        bolsas: b.bolsas, kgEntrada: b.kg, kgSalida: b.kgSalida,
        /* de la receta del PLC, que no cambia sin usuario y contraseña */
        temperatura: RECETA_AUTOCLAVE.temperatura,
        minutos: RECETA_AUTOCLAVE.minutos,
        duracionTotal: '',
        /* la cinta NO se rellena: nadie puede saber después si se puso */
        pruebaBiologica: '', resultadoPrueba: '',
        verifBiologica: '', resultadoBiologico: '',
        operador: String(o.operador || ''),
        observaciones: b.obs || nota,
        salida: '',
        registradoEn: new Date()
      }));
    });
    marcar_('planta');
    return { ok:true, cargados: buenas.length, descartados: problemas.length,
             problemas: problemas, huecos: huecos, desde: buenas[0].numero,
             hasta: buenas[buenas.length - 1].numero, cargadoEl: hoy };
  } finally { lock.releaseLock(); }
}

/* ═══ Corregir un ciclo mal registrado ═══
   El supervisor revisa y encuentra que un ciclo se anotó con el peso de
   otro, o con la hora cambiada. Hasta ahora no había forma de arreglarlo
   sin meter mano al libro.

   Lo que NO se puede tocar aquí: el número de la máquina y la fecha. Esos
   dos arman el identificador, y el identificador es lo que los despachos
   guardan para saber qué ciclos llevan. Cambiarlo desde aquí dejaría al
   despacho apuntando a un ciclo que ya no se llama así. Si el número está
   mal, se anula y se registra de nuevo. */
function api_editarCiclo(pin, cicloId, d) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (['planta','supervisor','admin'].indexOf(u.rol) < 0) return { ok:false, error:'Sin permiso.' };

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_CIC);
    if (!h) return { ok:false, error:'La hoja Ciclos no existe todavía.' };
    asegurarColumnas_(h, COLS_CIC);
    const vals = h.getDataRange().getValues();
    const cab = vals[0].map(String);
    const c = x => cab.indexOf(x);

    for (let i = 1; i < vals.length; i++) {
      if (String(vals[i][c('cicloId')]).trim() !== String(cicloId).trim()) continue;

      if (String(vals[i][c('anulado')] || '').toUpperCase() === 'SI')
        return { ok:false, error:'Ese ciclo está anulado. Un registro anulado no se edita.' };

      const esPrueba = d.esPrueba !== undefined
        ? !!d.esPrueba
        : String(vals[i][c('esPrueba')] || '').toUpperCase() === 'SI';
      if (!esPrueba && d.kgEntrada !== undefined && !(Number(d.kgEntrada) > 0))
        return { ok:false, error:'Un ciclo con carga necesita su peso de entrada.' };

      const set = (col, v) => { if (c(col) >= 0) h.getRange(i + 1, c(col) + 1).setValue(v); };
      const num = (k, v) => { if (d[k] !== undefined) set(v || k, Number(d[k]) || 0); };
      const txt = (k, v) => { if (d[k] !== undefined) set(v || k, String(d[k] || '')); };

      txt('horaInicio'); txt('horaFinal');
      num('bolsas'); num('kgEntrada'); num('kgSalida');
      num('temperatura'); num('minutos'); num('duracionTotal');
      txt('operador'); txt('observaciones'); txt('resultadoPrueba'); txt('resultadoBiologico');
      if (d.pruebaBiologica  !== undefined) set('pruebaBiologica',  d.pruebaBiologica ? 'SI' : 'NO');
      if (d.verifBiologica   !== undefined) set('verifBiologica',   d.verifBiologica ? 'SI' : '');
      if (d.esPrueba         !== undefined) set('esPrueba',         d.esPrueba ? 'SI' : '');

      marcar_('planta');
      return { ok:true, cicloId:cicloId, editadoPor:u.nombre };
    }
    return { ok:false, error:'No encontré el ciclo ' + cicloId + '.' };
  } finally { lock.releaseLock(); }
}

/* ═══ Anular un ciclo ═══
   La fila no se borra y el número no desaparece: la ficha pasa a mostrar la
   justificación, con quién la anuló y cuándo. Es a propósito. El número de
   ciclo lo lleva el contador del equipo, así que un ciclo borrado deja un
   hueco idéntico al de un ciclo escondido — desde afuera, un registro que
   falta y un registro que se quitó se ven exactamente igual. Anulado y con
   su motivo se lee de otra manera.

   Un ciclo que ya salió al relleno no se anula: ese material ya se despachó
   y el manifiesto lo declara. */
function api_anularCiclo(pin, cicloId, motivo) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (['planta','supervisor','admin'].indexOf(u.rol) < 0) return { ok:false, error:'Sin permiso.' };
  const razon = String(motivo || '').trim();
  if (razon.length < 5) return { ok:false, error:'Escribe por qué se anula. Queda en el registro.' };

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_CIC);
    if (!h) return { ok:false, error:'La hoja Ciclos no existe todavía.' };
    asegurarColumnas_(h, COLS_CIC);
    const vals = h.getDataRange().getValues();
    const cab = vals[0].map(String);
    const c = x => cab.indexOf(x);

    for (let i = 1; i < vals.length; i++) {
      if (String(vals[i][c('cicloId')]).trim() !== String(cicloId).trim()) continue;
      if (String(vals[i][c('anulado')] || '').toUpperCase() === 'SI')
        return { ok:false, error:'Ese ciclo ya está anulado.' };
      const salida = String(vals[i][c('salida')] || '').trim();
      if (salida)
        return { ok:false, error:'Ese ciclo ya salió al relleno en el despacho ' + salida +
                                '. No se puede anular lo que ya se despachó.' };

      const set = (col, v) => { if (c(col) >= 0) h.getRange(i + 1, c(col) + 1).setValue(v); };
      set('anulado', 'SI');
      set('motivoAnulacion', razon);
      set('anuladoPor', u.nombre);
      set('fechaAnulacion', hoyPanama_());
      marcar_('planta');
      return { ok:true, cicloId:cicloId, anuladoPor:u.nombre };
    }
    return { ok:false, error:'No encontré el ciclo ' + cicloId + '.' };
  } finally { lock.releaseLock(); }
}

/* ═══ Salidas al relleno sanitario ═══
   El material tratado pierde peso: se tritura y se deshidrata a 137°C.
   Por eso no se busca que entren y salgan los mismos kilos, sino que la
   merma sea consistente. Una merma fuera de lo habitual es la señal. */

function api_salidas(pin, desde, hasta) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['planta','supervisor','admin','gerente','mercadeo'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin permiso.' };
  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;
  const d1 = String(desde || ''), d2 = String(hasta || '');

  const todas = leerHoja_(HOJA_SAL).map(s => ({
    salidaId: String(s.salidaId || ''), fecha: fechaISO_(s.fecha),
    horaSalida: horaTxt_(s.horaSalida), kgPlanta: r2(s.kgPlanta), kgEmas: r2(s.kgEmas),
    reciboEmas: String(s.reciboEmas || ''), vehiculo: String(s.vehiculo || ''),
    conductor: String(s.conductor || ''), destino: String(s.destino || ''),
    ciclos: String(s.ciclos || ''), responsable: String(s.responsable || ''),
    obs: String(s.observaciones || '')
  })).filter(s => s.salidaId).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

  /* la merma de EMAS contra la báscula de planta, para ver si es consistente */
  const conAmbos = todas.filter(s => s.kgPlanta > 0 && s.kgEmas > 0);
  conAmbos.forEach(s => s.dif = Math.round((s.kgEmas - s.kgPlanta) / s.kgPlanta * 1000) / 10);
  const difs = conAmbos.map(s => s.dif);
  const prom = difs.length ? r2(difs.reduce((a, b) => a + b, 0) / difs.length) : 0;
  todas.forEach(s => {
    s.dif = (s.kgPlanta > 0 && s.kgEmas > 0)
      ? Math.round((s.kgEmas - s.kgPlanta) / s.kgPlanta * 1000) / 10 : null;
    /* se marca la que se aparta más de 5 puntos del comportamiento normal */
    s.rara = (s.dif !== null && difs.length >= 3 && Math.abs(s.dif - prom) > 5);
  });

  const rango = todas.filter(s => (!d1 || s.fecha >= d1) && (!d2 || s.fecha <= d2));
  const t = { salidas: rango.length, kgPlanta: 0, kgEmas: 0, sinRecibo: 0 };
  rango.forEach(s => {
    t.kgPlanta += s.kgPlanta; t.kgEmas += s.kgEmas;
    if (!s.reciboEmas) t.sinRecibo++;
  });
  t.kgPlanta = r2(t.kgPlanta); t.kgEmas = r2(t.kgEmas);
  t.difPromedio = prom;

  return { ok:true, salidas:rango, totales:t, difPromedio:prom,
           siguienteId: siguienteSalida_(),
           destinos: ['Relleno Sanitario El Diamante · La Chorrera'],
           vehiculos: ['CU-7697','CU-7662','AX-2051','AT-7501'],
           puedeEditar: ['planta','supervisor','admin'].indexOf(u.rol) >= 0 };
}

function siguienteSalida_() {
  const anio = hoyPanama_().slice(0, 4);
  const previos = leerHoja_(HOJA_SAL)
    .map(s => String(s.salidaId || ''))
    .filter(z => z.indexOf('SAL-' + anio + '-') === 0)
    .map(z => Number((z.split('-')[2] || '').replace(/\D/g, '')) || 0);
  return 'SAL-' + anio + '-' + ('000' + ((previos.length ? Math.max.apply(null, previos) : 0) + 1)).slice(-4);
}

function api_guardarSalida(pin, d) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['planta','supervisor','admin'].indexOf(u.rol) < 0) return { ok:false, error:'Sin permiso.' };
  if (!(Number(d.kgPlanta) > 0)) return { ok:false, error:'Falta el peso que sale de planta.' };

  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const h = hojaPlanta_(HOJA_SAL, COLS_SAL);
    const id = String(d.salidaId || '').trim() || siguienteSalida_();
    /* La misma guarda que en las actas: un número repetido hace que al
       abrir una salida salga otra. */
    if (leerHoja_(HOJA_SAL).some(x => String(x.salidaId || '').trim() === id))
      return { ok:false, error:'Ya existe la salida ' + id + '.' };

    const ciclos = (d.ciclos || []).map(String).filter(String);

    /* La pantalla solo ofrece los ciclos que todavía no salieron, pero la
       lista viaja desde el navegador: una pestaña abierta desde ayer, o dos
       personas despachando a la vez, mandan ciclos que ya se fueron. Abajo
       se les escribe la salida encima sin preguntar, y entonces el
       manifiesto que ya se imprimió queda reclamando ciclos que el libro
       dice que son de otro viaje. El mismo material contado dos veces.

       Se comprueba contra la hoja, que es lo único que sabe la verdad. */
    if (ciclos.length) {
      const tomados = {};
      leerHoja_(HOJA_CIC).forEach(c => {
        const s = String(c.salida || '').trim();
        if (s) tomados[String(c.cicloId || '').trim()] = s;
      });
      const repetidos = ciclos.filter(c => tomados[c]);
      if (repetidos.length)
        return { ok:false, error:'Estos ciclos ya salieron en otro manifiesto: ' +
          repetidos.map(c => c + ' (' + tomados[c] + ')').join(', ') +
          '. Recarga la pantalla para ver los que quedan sin despachar.' };
    }

    /* Una salida SIN ciclos es un camión que sale de planta sin nada que
       diga qué se trató. El manifiesto se imprime igual, pero con la
       tabla de ciclos vacía: un papel que parece completo y no lo está.

       Así quedaron las 18 salidas que se cargaron a mano en el libro.
       De aquí en adelante no pasa: o lleva ciclos, o quien la guarda
       tiene que decir a propósito que va sin ellos (`sinCiclos`), y esa
       decisión queda escrita en las observaciones para que se vea en el
       papel y en la revisión. */
    if (!ciclos.length && !d.sinCiclos)
      return { ok:false, sinCiclos:true,
        error:'Esta salida no lleva ningún ciclo de autoclave. Sin ellos, el ' +
              'manifiesto sale sin constancia de qué se trató. Elige los ciclos, ' +
              'o confirma que va sin ellos y anota por qué.' };

    const merma = Number(d.kgPlanta) && Number(d.kgTratado)
      ? Math.round((Number(d.kgTratado) - Number(d.kgPlanta)) / Number(d.kgTratado) * 1000) / 10 : '';

    h.appendRow(filaPorNombre_(h, {
      salidaId: id,
      fecha: d.fecha || hoyPanama_(),
      horaSalida: d.horaSalida || '',
      kgPlanta: Number(d.kgPlanta) || 0,
      kgEmas: Number(d.kgEmas) || 0,
      reciboEmas: d.reciboEmas || '',
      vehiculo: d.vehiculo || '',
      conductor: d.conductor || '',
      destino: d.destino || 'Relleno Sanitario El Diamante · La Chorrera',
      ciclos: ciclos.join(', '),
      firmaResponsable: d.firma || '',
      responsable: d.responsable || u.nombre,
      merma: merma,
      /* si va sin ciclos, el porqué queda escrito en la propia fila */
      observaciones: (!ciclos.length ? '[SIN CICLOS] ' : '') + (d.observaciones || ''),
      registradoPor: u.nombre,
      registradoEn: new Date()
    }));

    /* los ciclos quedan sellados: ya no se pueden despachar dos veces */
    if (ciclos.length) {
      const hc = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_CIC);
      const vals = hc.getDataRange().getValues();
      const cab = vals[0].map(String);
      const cId = cab.indexOf('cicloId');
      let cSal = cab.indexOf('salida');
      if (cSal < 0) { cSal = cab.length; hc.getRange(1, cSal + 1).setValue('salida'); }
      for (let i = 1; i < vals.length; i++)
        if (ciclos.indexOf(String(vals[i][cId]).trim()) >= 0)
          hc.getRange(i + 1, cSal + 1).setValue(id);
    }
    marcar_('planta');
    return { ok: true, salidaId:id, ciclos:ciclos.length };
  } finally { lock.releaseLock(); }
}

/* El recibo de báscula de EMAS llega después del viaje. */
function api_registrarReciboEmas(pin, salidaId, kgEmas, recibo) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['planta','supervisor','admin'].indexOf(u.rol) < 0) return { ok:false, error:'Sin permiso.' };

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_SAL);
    const vals = h.getDataRange().getValues();
    const cab = vals[0].map(String);
    const cId = cab.indexOf('salidaId');
    for (let i = 1; i < vals.length; i++) {
      if (String(vals[i][cId]).trim() !== String(salidaId).trim()) continue;
      const cK = cab.indexOf('kgEmas'), cR = cab.indexOf('reciboEmas');
      if (cK >= 0) h.getRange(i+1, cK+1).setValue(Number(kgEmas) || 0);
      if (cR >= 0) h.getRange(i+1, cR+1).setValue(String(recibo || ''));
      marcar_('planta');
      return { ok: true };
    }
    return { ok:false, error:'No encontré la salida ' + salidaId + '.' };
  } finally { lock.releaseLock(); }
}

/* Acta de salida imprimible: qué va, de qué ciclos y con qué parámetros. */
function api_actaSalida(pin, salidaId) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;

  const s = leerHoja_(HOJA_SAL).find(z => String(z.salidaId || '').trim() === String(salidaId).trim());
  if (!s) return { ok:false, error:'No encontré esa salida.' };

  /* ═══ EL ENLACE ENTRE EL CICLO Y EL DESPACHO VIVE EN DOS COLUMNAS ═══
     `Salidas.ciclos` lleva la lista de códigos, y `Ciclos.salida` lleva el
     número de salida en la fila de cada ciclo. El sistema escribe las dos
     cuando genera el despacho, pero quien corrige en el libro llena una
     sola — y hasta hoy el manifiesto miraba únicamente la lista de la
     salida. Si esa quedaba vacía, el papel salía con la tabla en blanco y
     el recuadro rojo, como si el ciclo no existiera. Callado.

     Ahora manda `Ciclos.salida`, que es el dato de la fila del propio
     ciclo y no se puede desincronizar consigo mismo, y la lista de la
     salida entra como refuerzo: se toma la UNIÓN de las dos. Y si no
     coinciden, el documento lo dice en vez de elegir en silencio. */
  const ids = String(s.ciclos || '').split(',').map(z => z.trim()).filter(String);
  const todosCic = leerHoja_(HOJA_CIC);
  const sellados = todosCic
    .filter(c => String(c.salida || '').trim() === String(s.salidaId || '').trim())
    .map(c => String(c.cicloId || '').trim()).filter(String);

  const union = {};
  sellados.concat(ids).forEach(x => { union[x] = 1; });
  const soloLista   = ids.filter(x => sellados.indexOf(x) < 0);
  const soloSellado = sellados.filter(x => ids.indexOf(x) < 0);

  const ciclos = todosCic
    .filter(c => !!union[String(c.cicloId || '').trim()])
    .map(c => ({ cicloId:String(c.cicloId||''), fecha:fechaISO_(c.fecha),
                 numero:Number(c.numero)||0, bolsas:Number(c.bolsas)||0,
                 kgEntrada:r2(c.kgEntrada),
                 kgSalida: r2(c.kgSalida) || r2(c.kgEntrada),
                 estimado: !(Number(c.kgSalida) > 0),
                 sinPeso: String(c.pesoNoRegistrado||'').toUpperCase()==='SI',
                 temperatura:Number(c.temperatura)||RECETA_AUTOCLAVE.temperatura,
                 minutos:Number(c.minutos)||RECETA_AUTOCLAVE.minutos,
                 /* la cinta, que es lo que de verdad se hace en cada ciclo */
                 quimico:String(c.pruebaBiologica||'').toUpperCase()==='SI',
                 resultadoQuimico:String(c.resultadoPrueba||''),
                 biologico:String(c.verifBiologica||'').toUpperCase()==='SI',
                 resultadoBiologico:String(c.resultadoBiologico||'') }))
    .sort((a,b) => (a.fecha||'').localeCompare(b.fecha||''));

  const t = { ciclos:ciclos.length, bolsas:0, kgEntrada:0, kgSalida:0, pruebas:0, sinPeso:0 };
  ciclos.forEach(c => {
    if (c.quimico) t.pruebas++;
    /* el ciclo sin peso anotado cuenta como ciclo y no suma kilos: el total
       del manifiesto tiene que ser la suma de lo que de verdad se pesó */
    if (c.sinPeso) { t.sinPeso++; return; }
    t.bolsas += c.bolsas; t.kgEntrada += c.kgEntrada; t.kgSalida += c.kgSalida;
  });
  ['kgEntrada','kgSalida'].forEach(k => t[k] = r2(t[k]));

  return { ok:true, salida:{
    salidaId:String(s.salidaId||''), fecha:fechaISO_(s.fecha), horaSalida:horaTxt_(s.horaSalida),
    kgPlanta:r2(s.kgPlanta), kgEmas:r2(s.kgEmas), reciboEmas:String(s.reciboEmas||''),
    vehiculo:String(s.vehiculo||''), conductor:String(s.conductor||''),
    destino:String(s.destino||''), responsable:String(s.responsable||''),
    firma:String(s.firmaResponsable||''), obs:String(s.observaciones||'')
  }, ciclos:ciclos, totales:t, receta:RECETA_AUTOCLAVE, hoy:hoyPanama_(),
     /* los dos lados del enlace no cuadran: el papel lo dice */
     descuadre: (soloLista.length || soloSellado.length)
       ? { soloLista: soloLista, soloSellado: soloSellado } : null,
     empresa: datosDoc_('manifiesto') };
}

/* ═══ Mantenimiento de los equipos de planta ═══
   La caldera y el autoclave trabajan a presión: una prueba de hermeticidad
   vencida no es papeleo, es un riesgo. Por eso el sistema avisa por fecha. */

function api_mantenimiento(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['planta','supervisor','admin','gerente','mercadeo'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin permiso.' };

  const hoy = hoyPanama_();
  const dias = (a, b) => Math.round((new Date(b+'T00:00:00') - new Date(a+'T00:00:00')) / 86400000);

  const lista = leerHoja_(HOJA_MTO).map(m => {
    const prox = fechaISO_(m.proximo);
    const o = {
      mtoId: String(m.mtoId || ''), equipo: String(m.equipo || ''), tipo: String(m.tipo || ''),
      fecha: fechaISO_(m.fecha), proximo: prox, responsable: String(m.responsable || ''),
      empresa: String(m.empresa || ''), resultado: String(m.resultado || ''),
      costo: Number(m.costo) || 0, obs: String(m.observaciones || '')
    };
    o.diasPara = prox ? dias(hoy, prox) : null;
    o.estado = !prox ? 'sin programar'
      : (o.diasPara < 0 ? 'VENCIDO' : (o.diasPara <= 15 ? 'POR VENCER' : 'al día'));
    return o;
  }).filter(m => m.mtoId || m.equipo)
    .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

  /* lo próximo de cada equipo, para no repetir el mismo aviso */
  const porEquipo = {};
  lista.forEach(m => {
    if (!m.proximo) return;
    const k = m.equipo + '|' + m.tipo;
    if (!porEquipo[k] || m.proximo < porEquipo[k].proximo) porEquipo[k] = m;
  });
  const alertas = Object.keys(porEquipo).map(k => porEquipo[k])
    .filter(m => m.estado === 'VENCIDO' || m.estado === 'POR VENCER')
    .sort((a, b) => (a.proximo || '').localeCompare(b.proximo || ''));

  return { ok:true, usuario:u, hoy:hoy, mantenimientos:lista, alertas:alertas,
           equipos:EQUIPOS_PLANTA, tipos:TIPOS_MTO,
           puedeEditar: ['planta','supervisor','admin'].indexOf(u.rol) >= 0 };
}

function api_guardarMantenimiento(pin, d) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['planta','supervisor','admin'].indexOf(u.rol) < 0) return { ok:false, error:'Sin permiso.' };
  if (!String(d.equipo || '').trim()) return { ok:false, error:'Falta el equipo.' };

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const h = hojaPlanta_(HOJA_MTO, COLS_MTO);
    const id = 'MTO' + new Date().getTime().toString(36).toUpperCase();
    h.appendRow(filaPorNombre_(h, {
      mtoId: id, equipo: d.equipo, tipo: d.tipo || '',
      fecha: d.fecha || hoyPanama_(), proximo: d.proximo || '',
      responsable: d.responsable || u.nombre, empresa: d.empresa || '',
      resultado: d.resultado || '', costo: Number(d.costo) || 0,
      observaciones: d.observaciones || '',
      registradoPor: u.nombre, registradoEn: new Date()
    }));
    marcar_('planta');
    return { ok: true, mtoId:id };
  } finally { lock.releaseLock(); }
}

/* ═══ Consumibles de planta ═══ */
function api_consumibles(pin, desde, hasta) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['planta','supervisor','admin','gerente','mercadeo'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin permiso.' };
  const d1 = String(desde || ''), d2 = String(hasta || '');
  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;

  const todos = leerHoja_(HOJA_CON).map(c => ({
    consumoId: String(c.consumoId || ''), fecha: fechaISO_(c.fecha),
    periodo: String(c.periodo || ''), articulo: String(c.articulo || ''),
    cantidad: r2(c.cantidad), unidad: String(c.unidad || '')
  })).filter(c => c.articulo);

  const rango = todos.filter(c => (!d1 || c.fecha >= d1) && (!d2 || c.fecha <= d2));
  const porArt = {};
  rango.forEach(c => {
    if (!porArt[c.articulo]) porArt[c.articulo] = { articulo:c.articulo, cantidad:0,
                                                    unidad:c.unidad, veces:0, ultima:'' };
    porArt[c.articulo].cantidad += c.cantidad;
    porArt[c.articulo].veces++;
    if (c.fecha > porArt[c.articulo].ultima) porArt[c.articulo].ultima = c.fecha;
  });
  const resumen = Object.keys(porArt).map(k => { porArt[k].cantidad = r2(porArt[k].cantidad);
    return porArt[k]; }).sort((a, b) => b.cantidad - a.cantidad);

  return { ok:true, consumos: rango.sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')),
           resumen: resumen, articulos: ARTICULOS_PLANTA,
           puedeEditar: ['planta','supervisor','admin'].indexOf(u.rol) >= 0 };
}

const ARTICULOS_PLANTA = ['OVEROLES','MASCARILLAS','GUANTES QUIRÚRGICOS','GUANTES DE RECOLECCIÓN',
  'ALCOHOL','CINTA 3M','AMONIO','JABÓN','BOLSAS DE BASURA','ACPM','GAS','AGUA',
  'GASOLINA HIDROLAVADORA','OTRO'];

function api_guardarConsumo(pin, d) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['planta','supervisor','admin'].indexOf(u.rol) < 0) return { ok:false, error:'Sin permiso.' };
  if (!String(d.articulo || '').trim()) return { ok:false, error:'Falta el artículo.' };

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const h = hojaPlanta_(HOJA_CON, COLS_CON);
    const id = 'CON' + new Date().getTime().toString(36).toUpperCase();
    h.appendRow(filaPorNombre_(h, {
      consumoId: id, fecha: d.fecha || hoyPanama_(), periodo: d.periodo || '',
      articulo: d.articulo, cantidad: Number(d.cantidad) || 0,
      unidad: d.unidad || '', registradoPor: u.nombre, registradoEn: new Date()
    }));
    marcar_('planta');
    return { ok: true, consumoId:id };
  } finally { lock.releaseLock(); }
}

/* Los semanales caen siempre el mismo día. Marcado en la ficha, el planificador
   arma la ruta de un toque en vez de buscar cliente por cliente. */
function api_clientesDelDia(pin, fecha) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (!esSupervisor_(u)) return { ok:false, error:'Solo supervisores planifican rutas.' };

  const f = String(fecha || hoyPanama_());
  const d = new Date(f + 'T12:00:00');
  if (isNaN(d.getTime())) return { ok:false, error:'Fecha no válida.' };
  const dia = String(d.getDay() === 0 ? 7 : d.getDay());     // 1 lunes … 7 domingo
  const NOMBRES = ['','lunes','martes','miércoles','jueves','viernes','sábado','domingo'];

  const fijos = [], tocan = [], atrasados = [];
  leerHoja_(HOJA_CLI).forEach(c => {
    const id = Number(c.id); if (!id) return;
    const sit = String(c.situacion || 'activo').toLowerCase();
    if (['mora','cierre','retiro','pausa'].indexOf(sit) >= 0) return;

    const item = { id: id, nombre: String(c.nombre || ''), region: String(c.region || ''),
                   frecuencia: String(c.frecuencia || ''),
                   proximaVisita: fechaISO_(c.proximaVisita),
                   estado: String(c.estado || '') };

    const dias = String(c['dias semana'] || '').split(/[^0-9]+/).filter(String);
    if (dias.indexOf(dia) >= 0) { item.motivo = 'día fijo'; fijos.push(item); return; }

    const pv = item.proximaVisita;
    if (!pv) return;
    if (pv === f) { item.motivo = 'le toca ese día'; tocan.push(item); }
    else if (pv < f) {
      item.diasAtraso = Math.round((new Date(f+'T00:00:00') - new Date(pv+'T00:00:00')) / 86400000);
      item.motivo = 'atrasado ' + item.diasAtraso + ' día(s)';
      atrasados.push(item);
    }
  });

  atrasados.sort((a, b) => b.diasAtraso - a.diasAtraso);
  return { ok:true, fecha:f, dia:dia, nombreDia:NOMBRES[Number(dia)],
           fijos:fijos, tocan:tocan, atrasados:atrasados,
           total: fijos.length + tocan.length + atrasados.length };
}


/* ═══════════════════════════════════════════════════════════════════
   ADMINISTRACIÓN · MANTENIMIENTO DE ACTIVOS E INVENTARIO
   ───────────────────────────────────────────────────────────────────
   Dos cosas que hasta hoy vivían en Excel: el control de vehículos y el
   de insumos. Lo que se trajo de ahí es la estructura; lo que NO se
   trajo son los tres vicios que tenía:

   1. El kilometraje se mantenía a mano, y ya se había quedado atrás: de
      tres vehículos, dos marcaban cero. Aquí NO SE TECLEA — se deduce de
      lo que el sistema ya captura por otro lado (el odómetro que el
      conductor anota al abrir y cerrar jornada, y el de cada carga de
      combustible). Un dato que alguien debe acordarse de actualizar es
      un dato que un día deja de ser cierto sin que nadie se entere.

   2. Los vencimientos por fecha y los de kilómetros vivían en hojas
      distintas que no se hablaban. Aquí son el MISMO plan con dos
      relojes, y salta el que llegue primero.

   3. La entrada de insumos se anotaba aparte de la solicitud de pago con
      la que se compraron. Dos listas del mismo hecho terminan sin
      coincidir. Aquí la entrada NACE de la solicitud.

   Y una decisión de forma: los equipos de planta (autoclave, caldera) y
   los vehículos son el mismo problema —un activo, un plan, una alarma—,
   así que van en el mismo módulo. La única diferencia es que el vehículo
   tiene además el reloj de los kilómetros, y eso lo cubre el punto 2.
   ═══════════════════════════════════════════════════════════════════ */

const HOJA_ACT = 'Activos';
const HOJA_PLN = 'PlanMantenimiento';
const HOJA_INS = 'Insumos';
const HOJA_MOV = 'MovimientosInventario';

const COLS_ACT = ['activoId','clase','nombre','placa','marca','anio','responsable',
                  'estado','notas','registradoPor','registradoEn'];

/* Una tarea del plan. `cadaKm` y `cadaDias` pueden estar los dos, uno, o
   ninguno —un documento sin periodicidad conocida vence en su fecha y ya—.
   `ultimoKm` y `ultimaFecha` son el punto de partida del próximo. */
const COLS_PLN = ['planId','activoId','tarea','cadaKm','cadaDias',
                  'ultimoKm','ultimaFecha','vence','numero','notas',
                  'registradoPor','registradoEn'];

const COLS_INS = ['insumoId','descripcion','categoria','unidad','minimo',
                  'activo','registradoPor','registradoEn'];

/* El stock NO se guarda: se suma de los movimientos. Una columna de saldo
   que se edita puede quedar diciendo algo que los movimientos no respaldan,
   y entonces no se sabe cuál de las dos miente. Sumando siempre cuadra, y
   además se puede reconstruir a cualquier fecha. */
const COLS_MOV = ['movId','fecha','tipo','insumoId','cantidad',
                  'destinoTipo','destino','entregadoPor',
                  'solicitudId','proveedor','factura','costoUnitario',
                  'observaciones','registradoPor','registradoEn'];

const CLASES_ACTIVO = ['vehiculo','equipo'];
const CATEGORIAS_INSUMO = ['EPP','Limpieza','Bioseguridad','Repuestos','Otro'];

/* Las cuentas contables con las que se compran insumos. Una solicitud de
   pago con un renglón en una de estas es una compra que tiene que entrar
   al inventario; con cualquier otra, no. */
const CUENTAS_INSUMO = ['61050503', '62050516'];

/* ═══ EL ODÓMETRO NO SE TECLEA ═══
   La lectura más alta entre las jornadas y las cargas de combustible de ese
   vehículo. Las dos hojas ya existen y ya se llenan solas: el conductor
   anota el odómetro al abrir y cerrar jornada, y otra vez en cada carga.

   Se compara por placa Y por identificador, porque en `Jornadas` el
   vehículo se guardó a veces como 'CU7662' y a veces como 'Camión 1'. Lo
   que no se encuentra devuelve 0, y eso significa «todavía no hay lectura»
   — que es distinto de «tiene cero kilómetros» y la pantalla lo dice. */
function odometroDe_(activo) {
  const nombres = [String(activo.placa || ''), String(activo.nombre || ''),
                   String(activo.activoId || '')]
    .map(s => s.trim().toUpperCase().replace(/[\s-]/g, '')).filter(String);
  const coincide = v => nombres.indexOf(String(v || '').trim().toUpperCase()
                                          .replace(/[\s-]/g, '')) >= 0;
  let max = 0, fuente = '', cuando = '';
  const mirar = (km, f, de) => {
    const n = Number(km) || 0;
    if (n > max) { max = n; fuente = de; cuando = fechaISO_(f) || ''; }
  };
  leerHoja_(HOJA_JOR).forEach(j => {
    if (!coincide(j.vehiculo)) return;
    mirar(j.kmInicio, j.fecha, 'jornada');
    mirar(j.kmFinal,  j.fecha, 'jornada');
  });
  leerHoja_(HOJA_COM).forEach(c => {
    if (!coincide(c.vehiculo)) return;
    mirar(c.kilometraje, c.fecha, 'carga de combustible');
  });
  return { km: max, fuente: fuente, fecha: cuando, hay: max > 0 };
}

function api_administracion(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (['admin','gerente','supervisor','planta','mercadeo'].indexOf(u.rol) < 0)
    return { ok:false, error:'Este módulo es para administración.' };
  return { ok:true, usuario:u, hoy:hoyPanama_(),
           clases:CLASES_ACTIVO, categorias:CATEGORIAS_INSUMO,
           tiposMto:TIPOS_MTO, equiposPlanta:EQUIPOS_PLANTA,
           /* Quién anota qué: el mantenimiento del autoclave lo lleva
              planta; el de los vehículos, supervisión. Las entregas de
              insumos las anota quien entrega. */
           puedeActivos:   ['admin','supervisor','gerente'].indexOf(u.rol) >= 0,
           puedeServicio:  ['admin','supervisor','gerente','planta'].indexOf(u.rol) >= 0,
           puedeInventario:['admin','supervisor','gerente','mercadeo'].indexOf(u.rol) >= 0 };
}

/* ═══ Los activos con su plan, su odómetro y lo que está por vencer ═══ */
function api_activos(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (['admin','gerente','supervisor','planta','mercadeo'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin permiso.' };

  const hoy = hoyPanama_();
  const dias = (a, b) => Math.round((new Date(b+'T00:00:00') - new Date(a+'T00:00:00')) / 86400000);
  const n = v => Number(v) || 0;

  const planes = leerHoja_(HOJA_PLN);
  const servicios = leerHoja_(HOJA_MTO);

  const activos = leerHoja_(HOJA_ACT)
    .filter(a => String(a.activoId || '').trim())
    .map(a => {
      const id = String(a.activoId).trim();
      const clase = String(a.clase || 'equipo').trim().toLowerCase();
      const o = { activoId:id, clase:clase, nombre:String(a.nombre||''),
                  placa:String(a.placa||''), marca:String(a.marca||''),
                  anio:String(a.anio||''), responsable:String(a.responsable||''),
                  estado:String(a.estado||'Activo'), notas:String(a.notas||'') };

      /* el odómetro solo tiene sentido en un vehículo */
      const od = clase === 'vehiculo' ? odometroDe_(o) : { km:0, hay:false, fuente:'', fecha:'' };
      o.km = od.km; o.kmHay = od.hay; o.kmFuente = od.fuente; o.kmFecha = od.fecha;

      o.tareas = planes
        .filter(p => String(p.activoId || '').trim() === id)
        .map(p => {
          const t = { planId:String(p.planId||''), tarea:String(p.tarea||''),
                      cadaKm:n(p.cadaKm), cadaDias:n(p.cadaDias),
                      ultimoKm:n(p.ultimoKm), ultimaFecha:fechaISO_(p.ultimaFecha),
                      vence:fechaISO_(p.vence), numero:String(p.numero||''),
                      notas:String(p.notas||'') };

          /* ── el reloj de los kilómetros ── */
          t.tocaKm = (t.cadaKm && t.ultimoKm) ? t.ultimoKm + t.cadaKm : 0;
          t.faltanKm = null;
          if (t.tocaKm) {
            if (od.hay) t.faltanKm = t.tocaKm - od.km;
            else t.sinOdometro = true;
          }

          /* ── el reloj de la fecha ── */
          if (!t.vence && t.cadaDias && t.ultimaFecha) {
            const d = new Date(t.ultimaFecha + 'T00:00:00');
            d.setDate(d.getDate() + t.cadaDias);
            t.vence = Utilities.formatDate(d, 'America/Panama', 'yyyy-MM-dd');
            t.venceCalculado = true;
          }
          t.faltanDias = t.vence ? dias(hoy, t.vence) : null;

          /* ── y salta el que llegue primero ──
             Un ciclo de vida medido en kilómetros y otro en días no se
             pueden comparar entre sí, así que no se promedian: cada uno
             decide su propio estado y se toma el peor de los dos. */
          const est = [];
          if (t.faltanKm !== null)   est.push(t.faltanKm < 0 ? 2 : (t.faltanKm <= 500 ? 1 : 0));
          if (t.faltanDias !== null) est.push(t.faltanDias < 0 ? 2 : (t.faltanDias <= 30 ? 1 : 0));
          const peor = est.length ? Math.max.apply(null, est) : -1;
          t.estado = peor === 2 ? 'VENCIDO' : peor === 1 ? 'POR VENCER'
                   : peor === 0 ? 'al día' : 'sin datos';
          t.porQue = (t.faltanKm !== null && t.faltanKm < 0) ? 'km'
                   : (t.faltanDias !== null && t.faltanDias < 0) ? 'fecha'
                   : (t.faltanKm !== null && t.faltanKm <= 500) ? 'km'
                   : (t.faltanDias !== null && t.faltanDias <= 30) ? 'fecha' : '';
          return t;
        })
        .sort((x, y) => (x.tarea || '').localeCompare(y.tarea || ''));

      o.vencidas   = o.tareas.filter(t => t.estado === 'VENCIDO').length;
      o.porVencer  = o.tareas.filter(t => t.estado === 'POR VENCER').length;
      o.sinDatos   = o.tareas.filter(t => t.estado === 'sin datos').length;
      o.estado2    = o.vencidas ? 'VENCIDO' : (o.porVencer ? 'POR VENCER' : 'al día');

      o.servicios = servicios
        .filter(s => String(s.activoId || '').trim() === id ||
                     (!String(s.activoId || '').trim() &&
                      String(s.equipo || '').trim().toUpperCase() ===
                      String(o.nombre || '').trim().toUpperCase()))
        .map(s => ({ mtoId:String(s.mtoId||''), tipo:String(s.tipo||''),
                     fecha:fechaISO_(s.fecha), empresa:String(s.empresa||''),
                     costo:Number(s.costo)||0, km:Number(s.kmServicio)||0,
                     resultado:String(s.resultado||''), obs:String(s.observaciones||'') }))
        .sort((x, y) => (y.fecha || '').localeCompare(x.fecha || ''));
      return o;
    })
    .sort((a, b) => (a.clase || '').localeCompare(b.clase || '') ||
                    (a.nombre || '').localeCompare(b.nombre || ''));

  /* Las alertas son de TAREAS, no de activos: lo que hay que hacer es una
     tarea concreta, y decir «el CU7662 tiene algo» no sirve de nada. */
  const alertas = [];
  activos.forEach(a => a.tareas.forEach(t => {
    if (t.estado !== 'VENCIDO' && t.estado !== 'POR VENCER') return;
    alertas.push({ activoId:a.activoId, activo:a.placa || a.nombre, clase:a.clase,
                   tarea:t.tarea, estado:t.estado, porQue:t.porQue,
                   faltanKm:t.faltanKm, faltanDias:t.faltanDias });
  }));
  alertas.sort((x, y) => (y.estado === 'VENCIDO') - (x.estado === 'VENCIDO'));

  const t = { activos:activos.length,
              vehiculos:activos.filter(a => a.clase === 'vehiculo').length,
              equipos:activos.filter(a => a.clase !== 'vehiculo').length,
              vencidas:alertas.filter(a => a.estado === 'VENCIDO').length,
              porVencer:alertas.filter(a => a.estado === 'POR VENCER').length,
              sinOdometro:activos.filter(a => a.clase === 'vehiculo' && !a.kmHay).length,
              gastoMto: r2_(servicios.reduce((s, x) => s + (Number(x.costo) || 0), 0)),
              servicios: servicios.filter(s => String(s.mtoId||'').trim()).length };

  /* El combustible ya está en el libro y es el gasto grande de la flota.
     Se muestra aquí porque es donde alguien lo va a mirar. */
  let litros = 0, gastoCom = 0, cargas = 0;
  leerHoja_(HOJA_COM).forEach(c => {
    if (!String(c.cargaId || '').trim() && !Number(c.galones)) return;
    litros += Number(c.galones) || 0; gastoCom += Number(c.monto) || 0; cargas++;
  });
  t.litros = r2_(litros); t.gastoCombustible = r2_(gastoCom); t.cargas = cargas;

  return { ok:true, usuario:u, hoy:hoy, activos:activos, alertas:alertas, totales:t,
           puedeActivos:  ['admin','supervisor','gerente'].indexOf(u.rol) >= 0,
           puedeServicio: ['admin','supervisor','gerente','planta'].indexOf(u.rol) >= 0 };
}

function r2_(v) { return Math.round((Number(v) || 0) * 100) / 100; }

function api_guardarActivo(pin, d) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['admin','supervisor','gerente'].indexOf(u.rol) < 0) return { ok:false, error:'Sin permiso.' };
  if (!String(d.nombre || '').trim()) return { ok:false, error:'Falta el nombre del activo.' };

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const h = hojaPlanta_(HOJA_ACT, COLS_ACT);
    const previos = leerHoja_(HOJA_ACT);
    const id = String(d.activoId || '').trim() ||
               ('ACT-' + ('00' + (previos.length + 1)).slice(-3));

    /* editar: se reescribe la fila, no se agrega otra */
    const vals = h.getDataRange().getValues();
    const cab = vals[0].map(String);
    const cId = cab.indexOf('activoId');
    for (let i = 1; i < vals.length; i++) {
      if (String(vals[i][cId]).trim() !== id) continue;
      [['clase',d.clase],['nombre',d.nombre],['placa',d.placa],['marca',d.marca],
       ['anio',d.anio],['responsable',d.responsable],['estado',d.estado],['notas',d.notas]
      ].forEach(p => {
        const c = cab.indexOf(p[0]);
        if (c >= 0 && p[1] !== undefined) h.getRange(i+1, c+1).setValue(p[1]);
      });
      marcar_('admin');
      return { ok:true, activoId:id, editado:true };
    }

    h.appendRow(filaPorNombre_(h, {
      activoId: id,
      clase: String(d.clase || 'equipo').toLowerCase(),
      nombre: String(d.nombre || '').trim(),
      placa: String(d.placa || '').trim().toUpperCase(),
      marca: String(d.marca || ''), anio: String(d.anio || ''),
      responsable: String(d.responsable || ''),
      estado: String(d.estado || 'Activo'),
      notas: String(d.notas || ''),
      registradoPor: u.nombre, registradoEn: new Date()
    }));
    marcar_('admin');
    return { ok:true, activoId:id };
  } finally { lock.releaseLock(); }
}

function api_guardarPlanTarea(pin, d) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['admin','supervisor','gerente'].indexOf(u.rol) < 0) return { ok:false, error:'Sin permiso.' };
  if (!String(d.activoId || '').trim()) return { ok:false, error:'Falta el activo.' };
  if (!String(d.tarea || '').trim())    return { ok:false, error:'Falta el nombre de la tarea.' };
  /* Una tarea sin ningún reloj no vence nunca: es una fila que nadie va a
     mirar y que ensucia el plan. */
  if (!(Number(d.cadaKm) > 0) && !(Number(d.cadaDias) > 0) && !String(d.vence || '').trim())
    return { ok:false, error:'La tarea necesita al menos un vencimiento: cada tantos ' +
                             'kilómetros, cada tantos días, o una fecha.' };

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const h = hojaPlanta_(HOJA_PLN, COLS_PLN);
    const id = String(d.planId || '').trim() ||
               ('PLN-' + ('000' + (leerHoja_(HOJA_PLN).length + 1)).slice(-4));

    const vals = h.getDataRange().getValues();
    const cab = vals[0].map(String);
    const cId = cab.indexOf('planId');
    const campos = [['tarea',d.tarea],['cadaKm',Number(d.cadaKm)||''],
                    ['cadaDias',Number(d.cadaDias)||''],['ultimoKm',Number(d.ultimoKm)||''],
                    ['ultimaFecha',d.ultimaFecha||''],['vence',d.vence||''],
                    ['numero',d.numero||''],['notas',d.notas||'']];
    for (let i = 1; i < vals.length; i++) {
      if (String(vals[i][cId]).trim() !== id) continue;
      campos.forEach(p => { const c = cab.indexOf(p[0]);
        if (c >= 0 && p[1] !== undefined) h.getRange(i+1, c+1).setValue(p[1]); });
      marcar_('admin');
      return { ok:true, planId:id, editado:true };
    }

    h.appendRow(filaPorNombre_(h, {
      planId:id, activoId:String(d.activoId).trim(), tarea:String(d.tarea).trim(),
      cadaKm:Number(d.cadaKm) || '', cadaDias:Number(d.cadaDias) || '',
      ultimoKm:Number(d.ultimoKm) || '', ultimaFecha:d.ultimaFecha || '',
      vence:d.vence || '', numero:String(d.numero || ''), notas:String(d.notas || ''),
      registradoPor:u.nombre, registradoEn:new Date()
    }));
    marcar_('admin');
    return { ok:true, planId:id };
  } finally { lock.releaseLock(); }
}

/* ═══ Anotar un servicio ═══
   Escribe en la bitácora Y adelanta el reloj de la tarea. Si solo hiciera
   lo primero, el plan seguiría avisando de algo que ya se hizo — que es
   como se le enseña a la gente a ignorar los avisos. */
function api_registrarServicio(pin, d) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['admin','supervisor','gerente','planta'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin permiso.' };
  if (!String(d.activoId || '').trim()) return { ok:false, error:'Falta el activo.' };

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const act = leerHoja_(HOJA_ACT)
      .filter(a => String(a.activoId || '').trim() === String(d.activoId).trim())[0];
    if (!act) return { ok:false, error:'No encontré ese activo.' };

    const fecha = d.fecha || hoyPanama_();
    const h = hojaPlanta_(HOJA_MTO, COLS_MTO);
    asegurarColumnas_(h, ['activoId','kmServicio']);
    const id = 'MTO-' + fecha.replace(/-/g, '') + '-' +
               ('00' + (leerHoja_(HOJA_MTO).length + 1)).slice(-3);

    h.appendRow(filaPorNombre_(h, {
      mtoId:id, activoId:String(d.activoId).trim(),
      equipo:String(act.nombre || ''), tipo:String(d.tipo || 'Preventivo'),
      fecha:fecha, proximo:d.proximo || '',
      kmServicio:Number(d.km) || '',
      responsable:String(d.responsable || u.nombre), empresa:String(d.empresa || ''),
      resultado:String(d.resultado || ''), costo:Number(d.costo) || 0,
      observaciones:String(d.observaciones || ''),
      registradoPor:u.nombre, registradoEn:new Date()
    }));

    /* y el reloj de la tarea queda puesto en cero desde aquí */
    let tareas = 0;
    const ids = (d.planIds || []).map(String).filter(String);
    if (ids.length) {
      const hp = hojaPlanta_(HOJA_PLN, COLS_PLN);
      const vals = hp.getDataRange().getValues();
      const cab = vals[0].map(String);
      const cP = cab.indexOf('planId'), cK = cab.indexOf('ultimoKm'), cF = cab.indexOf('ultimaFecha');
      const cV = cab.indexOf('vence');
      for (let i = 1; i < vals.length; i++) {
        if (ids.indexOf(String(vals[i][cP]).trim()) < 0) continue;
        if (cK >= 0 && Number(d.km) > 0) hp.getRange(i+1, cK+1).setValue(Number(d.km));
        if (cF >= 0) hp.getRange(i+1, cF+1).setValue(fecha);
        /* una fecha de vencimiento fija ya no vale: la nueva se recalcula
           desde este servicio con la periodicidad de la tarea */
        if (cV >= 0 && Number(vals[i][cab.indexOf('cadaDias')]) > 0)
          hp.getRange(i+1, cV+1).setValue('');
        tareas++;
      }
    }
    marcar_('admin');
    return { ok:true, mtoId:id, tareas:tareas };
  } finally { lock.releaseLock(); }
}

/* ═══════════════ INVENTARIO ═══════════════ */

/* El stock sale de los movimientos, no de una columna que alguien edita. */
function api_inventario(pin, desde, hasta) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (['admin','gerente','supervisor','mercadeo','planta'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin permiso.' };

  const d1 = String(desde || ''), d2 = String(hasta || '');
  const movs = leerHoja_(HOJA_MOV).filter(m => String(m.movId || '').trim());

  const stock = {}, ultimoCosto = {};
  movs.forEach(m => {
    const k = String(m.insumoId || '').trim();
    const c = Number(m.cantidad) || 0;
    const entra = String(m.tipo || '').toUpperCase() === 'ENTRADA';
    stock[k] = (stock[k] || 0) + (entra ? c : -c);
    if (entra && Number(m.costoUnitario) > 0) ultimoCosto[k] = Number(m.costoUnitario);
  });

  const insumos = leerHoja_(HOJA_INS)
    .filter(i => String(i.insumoId || '').trim())
    .map(i => {
      const id = String(i.insumoId).trim();
      const o = { insumoId:id, descripcion:String(i.descripcion||''),
                  categoria:String(i.categoria||'Otro'), unidad:String(i.unidad||''),
                  minimo:Number(i.minimo)||0, stock:r2_(stock[id] || 0),
                  costo:ultimoCosto[id] || 0,
                  activo:String(i.activo||'SI').toUpperCase() !== 'NO' };
      /* «en el mínimo» y «por debajo» no son lo mismo y conviene separarlos:
         uno avisa que toca comprar, el otro que ya se llegó tarde. */
      o.estado = !o.minimo ? 'sin mínimo'
               : (o.stock < o.minimo ? 'POR DEBAJO'
               : (o.stock === o.minimo ? 'EN EL MÍNIMO' : 'bien'));
      return o;
    })
    .sort((a, b) => (a.categoria||'').localeCompare(b.categoria||'') ||
                    (a.descripcion||'').localeCompare(b.descripcion||''));

  const nombre = {};
  insumos.forEach(i => { nombre[i.insumoId] = i.descripcion; });

  const enRango = f => (!d1 || f >= d1) && (!d2 || f <= d2);
  const lista = movs.map(m => ({
      movId:String(m.movId||''), fecha:fechaISO_(m.fecha),
      tipo:String(m.tipo||'').toUpperCase(), insumoId:String(m.insumoId||''),
      insumo: nombre[String(m.insumoId||'').trim()] || String(m.insumoId||''),
      cantidad:Number(m.cantidad)||0,
      destinoTipo:String(m.destinoTipo||''), destino:String(m.destino||''),
      entregadoPor:String(m.entregadoPor||''),
      solicitudId:String(m.solicitudId||''), proveedor:String(m.proveedor||''),
      factura:String(m.factura||''), costoUnitario:Number(m.costoUnitario)||0,
      obs:String(m.observaciones||'')
    }))
    .filter(m => m.fecha && enRango(m.fecha))
    .sort((a, b) => (b.fecha||'').localeCompare(a.fecha||''));

  const t = { insumos:insumos.length,
              bajos:insumos.filter(i => i.estado === 'POR DEBAJO').length,
              enMinimo:insumos.filter(i => i.estado === 'EN EL MÍNIMO').length,
              entregas:lista.filter(m => m.tipo === 'SALIDA').length,
              entradas:lista.filter(m => m.tipo === 'ENTRADA').length,
              comprado:r2_(lista.filter(m => m.tipo === 'ENTRADA')
                .reduce((s, m) => s + m.cantidad * m.costoUnitario, 0)) };

  return { ok:true, usuario:u, hoy:hoyPanama_(), desde:d1, hasta:d2,
           insumos:insumos, movimientos:lista, totales:t,
           categorias:CATEGORIAS_INSUMO,
           pendientes: entradasPendientes_(),
           puedeInventario: ['admin','supervisor','gerente','mercadeo'].indexOf(u.rol) >= 0 };
}

function api_guardarInsumo(pin, d) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['admin','supervisor','gerente','mercadeo'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin permiso.' };
  if (!String(d.descripcion || '').trim()) return { ok:false, error:'Falta la descripción.' };

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const h = hojaPlanta_(HOJA_INS, COLS_INS);
    const previos = leerHoja_(HOJA_INS);
    const id = String(d.insumoId || '').trim() ||
               ('INS-' + ('00' + (previos.length + 1)).slice(-3));

    const vals = h.getDataRange().getValues();
    const cab = vals[0].map(String);
    const cId = cab.indexOf('insumoId');
    for (let i = 1; i < vals.length; i++) {
      if (String(vals[i][cId]).trim() !== id) continue;
      [['descripcion',d.descripcion],['categoria',d.categoria],['unidad',d.unidad],
       ['minimo',Number(d.minimo)||0],['activo',d.activo === false ? 'NO' : 'SI']
      ].forEach(p => { const c = cab.indexOf(p[0]);
        if (c >= 0 && p[1] !== undefined) h.getRange(i+1, c+1).setValue(p[1]); });
      marcar_('admin');
      return { ok:true, insumoId:id, editado:true };
    }

    h.appendRow(filaPorNombre_(h, {
      insumoId:id, descripcion:String(d.descripcion).trim(),
      categoria:String(d.categoria || 'Otro'), unidad:String(d.unidad || ''),
      minimo:Number(d.minimo) || 0, activo:'SI',
      registradoPor:u.nombre, registradoEn:new Date()
    }));

    /* El saldo de apertura es una ENTRADA, no un número puesto a mano: así
       el stock sigue siendo la suma de los movimientos y se puede auditar
       de dónde salió cada unidad. */
    if (Number(d.stockInicial) > 0)
      movimiento_({ tipo:'ENTRADA', insumoId:id, cantidad:Number(d.stockInicial),
                    fecha:d.fecha || hoyPanama_(), observaciones:'Saldo de apertura',
                    registradoPor:u.nombre });
    marcar_('admin');
    return { ok:true, insumoId:id };
  } finally { lock.releaseLock(); }
}

function movimiento_(d) {
  const h = hojaPlanta_(HOJA_MOV, COLS_MOV);
  const id = 'MOV-' + String(d.fecha || hoyPanama_()).replace(/-/g, '') + '-' +
             ('000' + (leerHoja_(HOJA_MOV).length + 1)).slice(-4);
  h.appendRow(filaPorNombre_(h, {
    movId:id, fecha:d.fecha || hoyPanama_(), tipo:String(d.tipo || 'SALIDA').toUpperCase(),
    insumoId:String(d.insumoId || ''), cantidad:Number(d.cantidad) || 0,
    destinoTipo:String(d.destinoTipo || ''), destino:String(d.destino || ''),
    entregadoPor:String(d.entregadoPor || ''),
    solicitudId:String(d.solicitudId || ''), proveedor:String(d.proveedor || ''),
    factura:String(d.factura || ''), costoUnitario:Number(d.costoUnitario) || '',
    observaciones:String(d.observaciones || ''),
    registradoPor:String(d.registradoPor || ''), registradoEn:new Date()
  }));
  return id;
}

/* ═══ La entrega ═══
   El destino es un CLIENTE o una PERSONA, y no es un detalle de forma: los
   recipientes y las bolsas van incluidos en el plan que el cliente firma,
   así que son costo de servirlo a él y hoy nadie los mide. El EPP va a una
   persona, que es otra cosa —costo de operación, y constancia de a quién se
   le entregó qué— y también hay que poder decirlo.

   En el Excel esto era texto libre («Equipo region 2»), y por eso el costo
   no caía en ningún lado. */
function api_registrarEntrega(pin, d) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['admin','supervisor','gerente','mercadeo'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin permiso.' };
  if (!String(d.insumoId || '').trim()) return { ok:false, error:'Falta el insumo.' };
  if (!(Number(d.cantidad) > 0))        return { ok:false, error:'Falta la cantidad.' };

  const tipo = String(d.destinoTipo || '').toLowerCase();
  if (['cliente','persona'].indexOf(tipo) < 0)
    return { ok:false, error:'Falta decir si va a un cliente o a una persona.' };
  if (!String(d.destino || '').trim())
    return { ok:false, error:'Falta a quién se le entrega.' };

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    /* No se entrega lo que no hay. Con el stock deducido de los
       movimientos esto se comprueba sin confiar en ninguna columna. */
    const inv = api_inventario(pin, '', '');
    const ins = (inv.insumos || []).filter(i => i.insumoId === String(d.insumoId).trim())[0];
    if (!ins) return { ok:false, error:'No encontré ese insumo.' };
    if (Number(d.cantidad) > ins.stock && !d.negativoConfirmado)
      return { ok:false, sinStock:{ insumo:ins.descripcion, hay:ins.stock,
                                    piden:Number(d.cantidad), unidad:ins.unidad } };

    const id = movimiento_({ tipo:'SALIDA', insumoId:String(d.insumoId).trim(),
      cantidad:Number(d.cantidad), fecha:d.fecha || hoyPanama_(),
      destinoTipo:tipo, destino:String(d.destino).trim(),
      entregadoPor:String(d.entregadoPor || u.nombre),
      observaciones:String(d.observaciones || ''), registradoPor:u.nombre });
    marcar_('admin');
    return { ok:true, movId:id };
  } finally { lock.releaseLock(); }
}

/* ═══ La entrada nace de la solicitud de pago ═══
   Comprar coveroles ya pasa por una solicitud. Si el inventario anota su
   propia entrada aparte, en tres meses las dos listas no coinciden y nadie
   sabe cuál vale. Aquí se buscan las solicitudes con un renglón de cuenta
   de insumos que todavía no tengan su entrada, y se ofrecen para cargar. */
function entradasPendientes_() {
  let sols = [], det = [];
  try { sols = leerHoja_(HOJA_SP); det = leerHoja_(HOJA_SPD); } catch (e) { return []; }

  const yaCargadas = {};
  leerHoja_(HOJA_MOV).forEach(m => {
    const s = String(m.solicitudId || '').trim();
    if (s) yaCargadas[s] = true;
  });

  const porSol = {};
  det.forEach(r => {
    const cod = String(r.cuentaCodigo || '').trim();
    if (CUENTAS_INSUMO.indexOf(cod) < 0) return;
    const s = String(r.solicitudId || '').trim();
    if (!s || yaCargadas[s]) return;
    if (!porSol[s]) porSol[s] = [];
    porSol[s].push({ linea:Number(r.linea) || 0, concepto:String(r.concepto || ''),
                     cantidad:Number(r.cantidad) || 0, unidad:String(r.unidad || ''),
                     costoUnitario:Number(r.valorUnitario) || 0,
                     cuenta:cod });
  });

  return sols
    .filter(s => porSol[String(s.solicitudId || '').trim()])
    .filter(s => ['ANULADA','RECHAZADA'].indexOf(String(s.estado || '').toUpperCase()) < 0)
    .map(s => ({ solicitudId:String(s.solicitudId || ''), numero:Number(s.numero) || 0,
                 fecha:fechaISO_(s.fecha), proveedor:String(s.proveedor || ''),
                 estado:String(s.estado || ''), total:Number(s.total) || 0,
                 renglones: porSol[String(s.solicitudId).trim()] }))
    .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
}

function api_entradasPendientes(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['admin','supervisor','gerente','mercadeo'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin permiso.' };
  return { ok:true, pendientes: entradasPendientes_() };
}

function api_registrarEntradaDeSolicitud(pin, solicitudId, lineas) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['admin','supervisor','gerente','mercadeo'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin permiso.' };
  if (!String(solicitudId || '').trim()) return { ok:false, error:'Falta la solicitud.' };
  if (!lineas || !lineas.length) return { ok:false, error:'No hay renglones que cargar.' };

  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const sol = leerHoja_(HOJA_SP)
      .filter(s => String(s.solicitudId || '').trim() === String(solicitudId).trim())[0];
    if (!sol) return { ok:false, error:'No encontré esa solicitud.' };

    /* Un renglón puede traer un insumo que todavía no existe en el catálogo:
       se crea, con su unidad, y queda sin mínimo hasta que alguien lo ponga. */
    const h = hojaPlanta_(HOJA_INS, COLS_INS);
    let creados = 0, cargados = 0;
    lineas.forEach(l => {
      let id = String(l.insumoId || '').trim();
      if (!id) {
        id = 'INS-' + ('00' + (leerHoja_(HOJA_INS).length + 1)).slice(-3);
        h.appendRow(filaPorNombre_(h, {
          insumoId:id, descripcion:String(l.concepto || '').trim(),
          categoria:String(l.categoria || 'Otro'), unidad:String(l.unidad || ''),
          minimo:Number(l.minimo) || 0, activo:'SI',
          registradoPor:u.nombre, registradoEn:new Date() }));
        creados++;
      }
      movimiento_({ tipo:'ENTRADA', insumoId:id, cantidad:Number(l.cantidad) || 0,
        fecha:fechaISO_(sol.fecha) || hoyPanama_(),
        solicitudId:String(solicitudId).trim(),
        proveedor:String(sol.proveedor || ''), factura:String(l.factura || ''),
        costoUnitario:Number(l.costoUnitario) || 0,
        observaciones:'De la solicitud ' + String(solicitudId).trim(),
        registradoPor:u.nombre });
      cargados++;
    });
    marcar_('admin');
    return { ok:true, cargados:cargados, insumosNuevos:creados };
  } finally { lock.releaseLock(); }
}

function crearHojasAdministracion() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let n = 0;
  [[HOJA_ACT, COLS_ACT], [HOJA_PLN, COLS_PLN],
   [HOJA_INS, COLS_INS], [HOJA_MOV, COLS_MOV]].forEach(p => {
    if (!ss.getSheetByName(p[0])) { crearHoja_(ss, p[0], p[1]); n++; }
    else asegurarColumnas_(ss.getSheetByName(p[0]), p[1]);
  });
  /* la bitácora vieja gana dos columnas para poder colgar de un activo */
  const hm = ss.getSheetByName(HOJA_MTO);
  if (hm) asegurarColumnas_(hm, COLS_MTO.concat(['activoId','kmServicio']));
  SpreadsheetApp.getUi().alert(n ? n + ' hoja(s) creada(s) para Administración.'
                                 : 'Las hojas de Administración ya existían. Columnas al día.');
}


/* ═══════════════════════════════════════════════════════════════════
   FINANZAS · SOLICITUDES DE PAGO Y ESTADO DE RESULTADOS
   ───────────────────────────────────────────────────────────────────
   Todo el dinero que sale de la empresa nace en una solicitud de pago.
   Una solicitud pagada ES el gasto: no se captura dos veces. Con las
   facturas de Cobros como entradas y las solicitudes pagadas como
   salidas, la utilidad se calcula sola.

   El ciclo: SOLICITADA → APROBADA → PAGADA. O RECHAZADA, o ANULADA.
   ═══════════════════════════════════════════════════════════════════ */

const HOJA_SP   = 'SolicitudesPago';
const HOJA_SPD  = 'SolicitudDetalle';
const HOJA_PROV = 'Proveedores';
const HOJA_CTA  = 'CuentasContables';
const HOJA_GFIJ = 'GastosFijos';

const COLS_SP = ['solicitudId','numero','fecha','compania','proyecto','proveedor','ruc','dv',
                 'tipoPago','condicion','banco','numeroCuenta','tipoCuenta',
                 'subtotal','itbms','exentos','retencionContrato','retencionItbms','anticipo','total',
                 'urgencia','facturaOriginal','facturaCopia','concepto','observaciones',
                 'estado','solicitadoPor','fechaSolicitud','aprobadoPor','fechaAprobacion',
                 'motivoRechazo','fechaPago','referenciaPago','numeroCheque','pagadoPor',
                 'origen','registradoEn',
                 'extraordinario','porConfirmar','notaConfirmar','marcadoPor','fechaMarca',
                 'vistoBuenoPor','fechaVistoBueno'];

/* ═══════════════════════════════════════════════════════════════════
   EL ITBMS DE LAS COMPRAS
   ───────────────────────────────────────────────────────────────────
   La tasa con la que se calcula el impuesto de una solicitud de pago, en
   un solo lugar y con nombre. Si algún día cambia, se cambia aquí.

   Y ojo con no confundir dos cosas que se llaman igual:

   · Hay CLIENTES de ECOVSA que son agentes retenedores y le retienen a
     ECOVSA el 50% del ITBMS al pagarle. Eso es real, vive en el alta de
     clientes y en cobros, y no tiene nada que ver con esto.
   · ECOVSA, al COMPRAR, no es agente retenedor: no puede retenerle a
     ningún proveedor. Por eso una solicitud de pago nunca lleva esa
     retención, y la casilla que la ofrecía se quitó de la pantalla.

   La fila «Retención ITBMS 50%» sigue en el papel porque el formato
   está registrado y no se toca; simplemente ya nadie puede llenarla.
   ═══════════════════════════════════════════════════════════════════ */
const ITBMS_TASA = 0.07;

/* Arriba de esta cifra, la solicitud no se aprueba sin el visto bueno
   de gerencia de gestión. Es sobre el TOTAL NETO —lo que de verdad se
   le va a pagar al proveedor, ya con retenciones y anticipo
   descontados—, no sobre el subtotal. */
const SP_UMBRAL_VOBO = 1500;

/* ═══════════════════════════════════════════════════════════════════
   LOS GASTOS HISTÓRICOS
   ───────────────────────────────────────────────────────────────────
   Lo que se gastó ANTES de que existiera el sistema. Vive en su propia
   hoja y no en SolicitudesPago, por dos razones que valen la pena:

   · La lista de solicitudes es una cola de trabajo — cosas que alguien
     tiene que aprobar o pagar. Un movimiento de enero de 2026 ya pagado
     no tiene nada que hacer ahí: son 402 filas muertas estorbando.
   · De los 119 «proveedores» de 2026, 114 no están en el catálogo, y 55
     de ellos son personas de mano de obra sin cuenta bancaria. Meterlos
     como proveedores ensucia la lista de la que Mercadeo escoge para
     pagar de verdad.

   Finanzas suma las dos fuentes. Cada movimiento sabe de dónde vino.
   ═══════════════════════════════════════════════════════════════════ */
const HOJA_GHIS = 'GastosHistoricos';
const COLS_GHIS = ['gastoId','fechaPago','proveedor','concepto','documento',
                   'categoria','cuenta','descripcionCuenta','proyecto','monto','itbms',
                   'extraordinario','porConfirmar','notaConfirmar','marcadoPor','fechaMarca',
                   'origen'];

/* ═══════════════════════════════════════════════════════════════════
   LAS DOS MARCAS DE UN GASTO
   ───────────────────────────────────────────────────────────────────
   Son cosas distintas y por eso son dos casillas, no una lista:

   EXTRAORDINARIO — es nuestro, es real, no es operativo. Una multa.
     Sí baja la utilidad, porque la plata salió. No entra al costo por
     proyecto, ni al costo por kilo, ni al presupuesto del año que
     viene: ensuciaría la medida de lo que cuesta operar.

   POR CONFIRMAR — puede que ni siquiera sea nuestro. Se carga, se ve,
     y NO computa en ningún total mientras esté así. Queda en una lista
     por resolver. Si resulta de otra empresa del grupo, deja de ser
     gasto y pasa a ser cuenta por cobrar a relacionada.

   Un gasto puede tener las dos, o ninguna. Por confirmar manda: si no
   sabemos de quién es, no se suma aunque sea extraordinario.
   ═══════════════════════════════════════════════════════════════════ */
function marcado_(v) { return String(v == null ? '' : v).trim().toUpperCase() === 'SI'; }

const COLS_SPD = ['solicitudId','linea','cantidad','unidad','concepto','job',
                  'cuentaCodigo','cuentaDescripcion','exento','valorUnitario','valorTotal'];

/* cuentaCodigo es la cuenta contable con la que casi siempre se registra
   lo que se le compra a ese proveedor. Al elegirlo en la solicitud, se
   pega sola en los renglones, igual que ya se pegan el banco y el número
   de cuenta. Antes había que teclear el código de memoria, y un dígito
   mal escrito no lo cachaba nadie: entraba al desglose de gastos como
   una cuenta que no existe y salía a la luz meses después. */
const COLS_PROV = ['proveedor','ruc','dv','banco','numeroCuenta','tipoCuenta',
                   'contacto','telefono','correo','activo','notas','cuentaCodigo'];

const COLS_CTA = ['codigo','descripcion','grupo','activo'];

const COLS_GFIJ = ['gastoFijoId','concepto','cuentaCodigo','proveedor','monto',
                   'proyecto','activo','notas'];

const PROYECTOS_ECOVSA = ['DESECHOS PELIGROSOS','DAVITA','DESECHOS SOLIDOS',
                          'MERCADOS MUNICIPALES','CSS'];
const TIPOS_PAGO   = ['ACH','CHEQUE','EFECTIVO'];
const CONDICIONES  = ['CONTADO','CREDITO'];
const URGENCIAS    = ['REGULAR','URGE'];
const ESTADOS_SP   = ['SOLICITADA','APROBADA','PAGADA','RECHAZADA','ANULADA'];

/* Quién ve la utilidad, y quién solo sus propias solicitudes. */
/* Quién ve la utilidad de la empresa. Mercadeo entró aquí el 4 sep: Mercadeo
   revisa costos periódicamente y necesita el desglose para cotizar bien.
   Aprobar pagos sigue siendo de gerencia — ver y aprobar no son lo mismo. */
function esFinanzas_(u)  { return u && ['admin','gerente','mercadeo'].indexOf(u.rol) >= 0; }
function puedeAprobar_(u){ return u && ['admin','gerente'].indexOf(u.rol) >= 0; }
function puedeSolicitar_(u){
  return u && ['admin','gerente','supervisor','mercadeo','planta'].indexOf(u.rol) >= 0;
}

function crearHojasFinanzas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let n = 0;
  [[HOJA_SP, COLS_SP], [HOJA_SPD, COLS_SPD], [HOJA_PROV, COLS_PROV],
   [HOJA_CTA, COLS_CTA], [HOJA_GFIJ, COLS_GFIJ], [HOJA_GHIS, COLS_GHIS]].forEach(p => {
    const existia = !!ss.getSheetByName(p[0]);
    const h = existia ? ss.getSheetByName(p[0]) : crearHoja_(ss, p[0], p[1]);
    if (!existia) n++;
    /* a las que ya existían les agrega las columnas nuevas — las marcas de
       gasto entraron después de que estas hojas nacieran */
    else asegurarColumnas_(h, p[1]);
  });
  SpreadsheetApp.getUi().alert(
    (n ? 'Se crearon ' + n + ' hoja(s) de finanzas. ' : 'Las hojas de finanzas ya existen. ') +
    'Las columnas de todas quedaron al día.');
}

/* ═══════════════════════════════════════════════════════════════════
   TODOS LOS GASTOS DEL PERIODO, VENGAN DE DONDE VENGAN
   ───────────────────────────────────────────────────────────────────
   Una sola función para que nadie tenga que acordarse de sumar la
   segunda fuente. Devuelve movimientos con la misma forma, cada uno
   sabiendo si nació de una solicitud o de la carga histórica.

   El monto va SIN ITBMS a propósito: el impuesto es crédito fiscal, no
   costo. Es el mismo criterio que ya usaba el estado de resultados.
   ═══════════════════════════════════════════════════════════════════ */
function gastosDelPeriodo_(d1, d2) {
  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;
  const enRango = f => f && f >= d1 && f <= d2;
  const movs = [];

  /* ── de las solicitudes: solo las PAGADAS son gasto ── */
  leerHoja_(HOJA_SP).forEach(s => {
    const id = String(s.solicitudId || '').trim().toUpperCase();
    if (!id) return;
    if (String(s.estado || '').trim().toUpperCase() !== 'PAGADA') return;
    /* el gasto se reconoce el día que salió la plata */
    const fecha = fechaISO_(s.fechaPago) || fechaISO_(s.fecha);
    if (!enRango(fecha)) return;
    movs.push({
      fuente: 'solicitud', id: id, fecha: fecha,
      proveedor: String(s.proveedor || ''), proyecto: String(s.proyecto || ''),
      concepto: String(s.concepto || ''), categoria: '',
      monto: r2(r2(s.subtotal) + r2(s.exentos)), itbms: r2(s.itbms),
      cuenta: '', descripcionCuenta: '',
      extraordinario: marcado_(s.extraordinario),
      porConfirmar:   marcado_(s.porConfirmar),
      notaConfirmar:  String(s.notaConfirmar || '')
    });
  });

  /* ── de la carga histórica: todo lo que hay ya se pagó ── */
  leerHoja_(HOJA_GHIS).forEach(g => {
    const id = String(g.gastoId || '').trim().toUpperCase();
    if (!id) return;
    const fecha = fechaISO_(g.fechaPago);
    if (!enRango(fecha)) return;
    movs.push({
      fuente: 'historico', id: id, fecha: fecha,
      proveedor: String(g.proveedor || ''), proyecto: String(g.proyecto || ''),
      concepto: String(g.concepto || ''), categoria: String(g.categoria || ''),
      monto: r2(g.monto), itbms: r2(g.itbms),
      cuenta: String(g.cuenta || '').trim(),
      descripcionCuenta: String(g.descripcionCuenta || ''),
      extraordinario: marcado_(g.extraordinario),
      porConfirmar:   marcado_(g.porConfirmar),
      notaConfirmar:  String(g.notaConfirmar || '')
    });
  });

  return movs;
}

/* Escribe unos campos en la fila que tenga cierta clave. Devuelve false si
   no la encuentra, para que quien llama lo diga en vez de creer que guardó.
   Asegura las columnas primero: si la hoja es vieja y le falta alguna, el
   dato se escribiría en el vacío sin avisar. */
function actualizarFila_(hojaNombre, campoClave, valorClave, campos) {
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(hojaNombre);
    if (!h || h.getLastRow() < 2) return false;
    const cols = hojaNombre === HOJA_GHIS  ? COLS_GHIS
               : hojaNombre === HOJA_SP    ? COLS_SP
               : hojaNombre === HOJA_CAJA  ? COLS_CAJA
               : hojaNombre === HOJA_CAJAG ? COLS_CAJAG
               : hojaNombre === HOJA_PEND  ? COLS_PEND : null;
    if (cols) asegurarColumnas_(h, cols);

    const vals = h.getDataRange().getValues();
    const cab = vals[0].map(String);
    const iClave = cab.indexOf(campoClave);
    if (iClave < 0) return false;
    const buscado = String(valorClave).trim().toUpperCase();

    for (let i = 1; i < vals.length; i++) {
      if (String(vals[i][iClave]).trim().toUpperCase() !== buscado) continue;
      Object.keys(campos).forEach(k => {
        const j = cab.indexOf(k);
        if (j >= 0) h.getRange(i + 1, j + 1).setValue(campos[k]);
      });
      return true;
    }
    return false;
  } finally { lock.releaseLock(); }
}

/* ═══ Los movimientos del periodo, uno por uno ═══
   Para revisar y marcar. Es la única pantalla donde se ven mezcladas las dos
   fuentes en detalle; el resto del módulo trabaja con los totales. */
function api_movimientos(pin, desde, hasta, filtro) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!esFinanzas_(u)) return { ok:false, error:'El detalle de gastos es de gerencia.' };

  const hoy = hoyPanama_();
  const d1 = String(desde || hoy.slice(0, 4) + '-01-01');
  const d2 = String(hasta || hoy);
  const f = filtro || {};
  const q = String(f.q || '').trim().toUpperCase();
  const solo = String(f.solo || '').toLowerCase();   // '', 'extra', 'confirmar', 'historico', 'solicitud'

  let movs = gastosDelPeriodo_(d1, d2);
  if (solo === 'extra')      movs = movs.filter(m => m.extraordinario);
  if (solo === 'confirmar')  movs = movs.filter(m => m.porConfirmar);
  if (solo === 'historico' || solo === 'solicitud') movs = movs.filter(m => m.fuente === solo);
  if (q) movs = movs.filter(m =>
    (m.proveedor + ' ' + m.concepto + ' ' + m.id + ' ' + m.proyecto + ' ' + m.categoria)
      .toUpperCase().indexOf(q) >= 0);

  movs.sort((a, b) => (b.fecha + b.id).localeCompare(a.fecha + a.id));
  const total = movs.reduce((a, m) => a + m.monto, 0);

  return { ok:true, desde:d1, hasta:d2,
           movimientos: movs.slice(0, Number(f.limite) || 300),
           total: movs.length, monto: Math.round(total * 100) / 100,
           puedeMarcar: puedeAprobar_(u) };
}

/* ═══ Marcar un gasto ═══
   Marcar cambia los números del estado de resultados, así que no lo hace
   quien pide el pago: es de gerencia o administración. Sirve igual para
   una solicitud que para un movimiento histórico. */
function api_marcarGasto(pin, fuente, id, marcas) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!puedeAprobar_(u))
    return { ok:false, error:'Marcar un gasto cambia la utilidad: es de gerencia o administración.' };

  const clave = String(id || '').trim().toUpperCase();
  if (!clave) return { ok:false, error:'Falta cuál gasto se marca.' };
  const hist = String(fuente || '') === 'historico';
  const hoja = hist ? HOJA_GHIS : HOJA_SP;
  const campoId = hist ? 'gastoId' : 'solicitudId';

  const m = marcas || {};
  const nota = String(m.notaConfirmar || '').trim().slice(0, 400);
  const porConfirmar = !!m.porConfirmar;
  if (porConfirmar && !nota)
    return { ok:false, error:'Un gasto por confirmar necesita la nota de qué hay que averiguar.' };

  const ok = actualizarFila_(hoja, campoId, clave, {
    extraordinario: m.extraordinario ? 'SI' : 'NO',
    porConfirmar:   porConfirmar ? 'SI' : 'NO',
    notaConfirmar:  nota,
    marcadoPor:     u.nombre,
    fechaMarca:     hoyPanama_()
  });
  if (!ok) return { ok:false, error:'No se encontró ' + clave + ' en ' + hoja + '.' };
  return { ok:true, id: clave, fuente: hist ? 'historico' : 'solicitud',
           extraordinario: !!m.extraordinario, porConfirmar: porConfirmar,
           notaConfirmar: nota, marcadoPor: u.nombre };
}

function hojaFin_(nombre, cols) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let h = ss.getSheetByName(nombre);
  if (!h) h = crearHoja_(ss, nombre, cols);
  if (h.getLastRow() === 0) h.getRange(1, 1, 1, cols.length).setValues([cols]);
  asegurarColumnas_(h, cols);
  return h;
}

/* Si el sistema aprende a guardar un dato nuevo, la hoja que ya existe se
   queda sin esa columna y el dato se pierde en silencio. Esto le agrega al
   final las que falten, sin tocar las que ya están ni su orden: quien haya
   movido columnas a mano no pierde nada. */
function asegurarColumnas_(hoja, cols) {
  if (hoja.getLastRow() === 0) return;
  const cab = hoja.getRange(1, 1, 1, Math.max(hoja.getLastColumn(), 1)).getValues()[0].map(String);
  const faltan = cols.filter(c => cab.indexOf(c) < 0);
  if (!faltan.length) return;
  hoja.getRange(1, cab.length + 1, 1, faltan.length).setValues([faltan]);
}

/* ═══ COMPARAR NOMBRES DE PROVEEDOR ═══════════════════════════════
   «ANDAV», «TRANSPORTE ANDAV» y «Andav S.A.» son el mismo señor escrito de
   tres maneras. Si cada una entra como un proveedor distinto, la lista se
   llena de casi-iguales, nadie sabe cuál elegir, y la cuenta contable que
   se pega sola deja de servir porque está en el duplicado equivocado. */
function normProv_(s) {
  return String(s || '')
    .toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // fuera tildes
    .replace(/[.,]/g, ' ')
    .replace(/\b(S\s?A|SA|SRL|S\s?DE\s?RL|INC|CORP|CIA)\b/g, ' ')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function normRuc_(s) { return String(s || '').replace(/[^0-9A-Za-z]/g, '').toUpperCase(); }

/* ═══ ¿ESTE PROVEEDOR YA ESTÁ? ═══════════════════════════════════
   Devuelve uno de cuatro veredictos. La pantalla no repite esta regla: la
   pregunta y obedece, para que no haya dos versiones que puedan discrepar.

   · igual        — mismo nombre y mismo RUC. No hay nada que hacer.
   · rucOtroNombre— el RUC ya está, con otro nombre. Probablemente es el
                    mismo proveedor mal escrito, y eso sí conviene atajarlo
                    ANTES de guardar la solicitud.
   · parecido     — el nombre se parece a uno que ya está, pero el RUC es
                    otro. Pueden ser dos empresas distintas de verdad.
   · nuevo        — no coincide nada. */
function revisarProveedor_(nombre, ruc) {
  const nom = normProv_(nombre), rc = normRuc_(ruc);
  if (!nom) return { estado:'nuevo' };

  const lista = leerHoja_(HOJA_PROV).filter(p => String(p.proveedor || '').trim());
  const ficha = p => ({ proveedor:String(p.proveedor).trim(), ruc:String(p.ruc || ''),
                        dv:String(p.dv || ''), banco:String(p.banco || ''),
                        numeroCuenta:String(p.numeroCuenta || ''),
                        tipoCuenta:String(p.tipoCuenta || ''),
                        cuentaCodigo:String(p.cuentaCodigo || '') });

  const porNombre = lista.filter(p => normProv_(p.proveedor) === nom)[0];
  const porRuc    = rc ? lista.filter(p => normRuc_(p.ruc) === rc)[0] : null;

  if (porNombre && (!rc || !porRuc || normProv_(porRuc.proveedor) === nom))
    return { estado:'igual', existente: ficha(porNombre) };
  if (porRuc) return { estado:'rucOtroNombre', existente: ficha(porRuc) };
  if (porNombre) return { estado:'igual', existente: ficha(porNombre) };

  /* parecido: uno contiene al otro, palabra por palabra */
  const parecido = lista.filter(p => {
    const o = normProv_(p.proveedor);
    if (!o || o === nom) return false;
    return o.indexOf(nom) === 0 || nom.indexOf(o) === 0;
  })[0];
  if (parecido) return { estado:'parecido', existente: ficha(parecido) };

  return { estado:'nuevo' };
}

function siguienteSolicitud_() {
  const anio = hoyPanama_().slice(0, 4);
  const previos = leerHoja_(HOJA_SP)
    .map(s => String(s.solicitudId || ''))
    .filter(z => z.indexOf('SP-' + anio + '-') === 0)
    .map(z => Number((z.split('-')[2] || '').replace(/\D/g, '')) || 0);
  return 'SP-' + anio + '-' + ('000' + ((previos.length ? Math.max.apply(null, previos) : 0) + 1)).slice(-4);
}

/* El consecutivo que va al lado del código. Salía de CONTAR las filas de
   la hoja, y contar no sirve para numerar: el día que se borra una línea
   —cosa que se hace a mano cuando hay que corregir algo— la siguiente
   solicitud repite el número de otra que ya existe. Se busca el mayor y se
   le suma uno, igual que ya se hacía con el código SP-2026-xxxx. Así
   respeta lo que se haya corregido en el libro y nunca reutiliza. */
function siguienteNumero_() {
  const previos = leerHoja_(HOJA_SP).map(s => Number(s.numero) || 0);
  return (previos.length ? Math.max.apply(null, previos) : 0) + 1;
}

/* ═══ Catálogos y arranque del módulo ═══ */
function api_finanzasBootstrap(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!puedeSolicitar_(u)) return { ok:false, error:'Sin acceso al módulo financiero.' };

  const n = v => Number(v) || 0;
  const proveedores = leerHoja_(HOJA_PROV)
    .filter(p => String(p.proveedor || '').trim() &&
                 String(p.activo || 'SI').toUpperCase() !== 'NO')
    .map(p => ({
      proveedor: String(p.proveedor).trim(), ruc: String(p.ruc || ''), dv: String(p.dv || ''),
      banco: String(p.banco || ''), numeroCuenta: String(p.numeroCuenta || ''),
      tipoCuenta: String(p.tipoCuenta || ''),
      cuentaCodigo: String(p.cuentaCodigo || '').trim()
    })).sort((a, b) => a.proveedor.localeCompare(b.proveedor));

  const cuentas = leerHoja_(HOJA_CTA)
    .filter(c => String(c.codigo || '').trim() &&
                 String(c.activo || 'SI').toUpperCase() !== 'NO')
    .map(c => ({ codigo: String(c.codigo).trim(), descripcion: String(c.descripcion || '') }));

  return { ok:true, usuario:u, hoy:hoyPanama_(),
           proveedores: proveedores, cuentas: cuentas,
           proyectos: PROYECTOS_ECOVSA, tiposPago: TIPOS_PAGO,
           condiciones: CONDICIONES, urgencias: URGENCIAS,
           compania: 'ECOTERMO DE PANAMA S.A.',
           siguienteId: siguienteSolicitud_(),
           itbmsTasa: ITBMS_TASA, umbralVistoBueno: SP_UMBRAL_VOBO,
           verFinanzas: esFinanzas_(u), puedeAprobar: puedeAprobar_(u) };
}

/* ═══ Guardar una solicitud de pago ═══
   Ojo con el nombre: ya existe api_guardarSolicitud para el alta de clientes
   que envía mercadeo. Dos funciones con el mismo nombre no conviven — la
   segunda pisa a la primera en silencio y rompe la otra pantalla. */
function api_guardarSolicitudPago(pin, d, lineas) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (!puedeSolicitar_(u)) return { ok:false, error:'Sin permiso para solicitar pagos.' };
  if (!String(d.proveedor || '').trim()) return { ok:false, error:'Falta a quién se le paga.' };
  if (!lineas || !lineas.length) return { ok:false, error:'La solicitud no tiene ni una línea de detalle.' };

  /* ── El RUC que ya está con otro nombre ──
     Este es el único caso que DETIENE el envío, y se comprueba aquí dentro y
     no en una consulta aparte: así no se puede saltar por más veces que se
     le dé al botón. Si quien llena insiste, reenvía con rucConfirmado y
     entonces sí pasa. Los otros casos no interrumpen: se resuelven después
     de que la solicitud esté guardada. */
  const rev = revisarProveedor_(d.proveedor, d.ruc);
  if (rev.estado === 'rucOtroNombre' && !d.rucConfirmado)
    return { ok:false, avisoRuc:{
      escrito: String(d.proveedor).trim(), ruc: String(d.ruc || ''),
      existente: rev.existente
    } };

  const n = v => Number(v) || 0;
  const r2 = v => Math.round(v * 100) / 100;

  /* El nombre de la cuenta no lo manda la pantalla: se busca aquí, en el
     catálogo. Antes se guardaba lo que llegara —que era nada— y la columna
     del libro quedaba en blanco en todas las solicitudes. */
  const desc = {};
  leerHoja_(HOJA_CTA).forEach(c => {
    const k = String(c.codigo || '').trim();
    if (k) desc[k] = String(c.descripcion || '');
  });

  /* los totales se recalculan aquí: la pantalla propone, el servidor decide */
  let subtotal = 0, exentos = 0;
  const filas = [];
  lineas.forEach((l, i) => {
    const vt  = r2(n(l.cantidad) * n(l.valorUnitario));
    const cod = String(l.cuentaCodigo || '').trim();
    if (l.exento) exentos += vt; else subtotal += vt;
    filas.push([ '', i + 1, n(l.cantidad), String(l.unidad || 'UNIDAD'),
                 String(l.concepto || ''), String(l.job || ''),
                 cod, desc[cod] || String(l.cuentaDescripcion || ''),
                 l.exento ? 'SI' : '', n(l.valorUnitario), vt ]);
  });
  subtotal = r2(subtotal); exentos = r2(exentos);
  if (!(subtotal + exentos > 0)) return { ok:false, error:'El monto de la solicitud es cero.' };

  /* El impuesto ya no se escribe a mano: sale del 7% de lo que paga
     impuesto. Cada renglón dice si paga o no, y esa marca —la misma que
     el papel imprime como «exento»— es lo único que decide. Antes había
     una casilla suelta donde cabía cualquier cifra, incluso con todos los
     renglones marcados sin impuesto. */
  const itbms = r2(subtotal * ITBMS_TASA);
  const retC  = r2(n(d.retencionContrato));
  const anti  = r2(n(d.anticipo));
  /* Cero, siempre: ECOVSA no es agente retenedor cuando compra. Se deja la
     variable y la columna porque el formato impreso las tiene y porque las
     solicitudes viejas que sí guardaron una cifra tienen que seguir
     leyéndose igual. */
  const retI  = 0;
  const total = r2(subtotal + exentos + itbms - retC - retI - anti);
  if (total < 0) return { ok:false, error:'Las retenciones y el anticipo superan el monto.' };

  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const h  = hojaFin_(HOJA_SP,  COLS_SP);
    const hd = hojaFin_(HOJA_SPD, COLS_SPD);
    const id = siguienteSolicitud_();
    const numero = siguienteNumero_();

    h.appendRow([id, numero, d.fecha || hoyPanama_(),
      'ECOTERMO DE PANAMA S.A.', String(d.proyecto || ''),
      String(d.proveedor).trim(), String(d.ruc || ''), String(d.dv || ''),
      String(d.tipoPago || 'ACH'), String(d.condicion || 'CONTADO'),
      String(d.banco || ''), String(d.numeroCuenta || ''), String(d.tipoCuenta || ''),
      subtotal, itbms, exentos, retC, retI, anti, total,
      String(d.urgencia || 'REGULAR'),
      d.facturaOriginal ? 'SI' : '', d.facturaCopia ? 'SI' : '',
      String(d.concepto || (lineas[0] && lineas[0].concepto) || ''),
      String(d.observaciones || ''),
      'SOLICITADA', u.nombre, hoyPanama_(), '', '', '', '', '', '', '',
      String(d.origen || ''), new Date()]);

    filas.forEach(f => { f[0] = id; });
    hd.getRange(hd.getLastRow() + 1, 1, filas.length, COLS_SPD.length).setValues(filas);

    marcar_('solicitudes');

    /* La solicitud ya está guardada. Lo del proveedor viene DESPUÉS y no la
       puede echar a perder: si quien llena cierra la ventana, lo único que
       pasa es que la próxima vez tendrá que volver a escribirlo todo. */
    return { ok: true, solicitudId:id, numero:numero, total:total, lineas:filas.length,
             proveedor: { estado: rev.estado, existente: rev.existente || null,
               datos: { proveedor:String(d.proveedor).trim(), ruc:String(d.ruc || ''),
                        dv:String(d.dv || ''), banco:String(d.banco || ''),
                        numeroCuenta:String(d.numeroCuenta || ''),
                        tipoCuenta:String(d.tipoCuenta || ''),
                        cuentaCodigo:String((lineas[0] && lineas[0].cuentaCodigo) || '').trim() } } };
  } finally { lock.releaseLock(); }
}

/* ═══ Guardar el proveedor que se escribió a mano en una solicitud ═══
   Lo puede hacer cualquiera que pueda pedir un pago, sin importar el rol:
   es quien tiene la factura del proveedor en la mano. El catálogo normal
   sigue siendo de gerencia; esta es la puerta que se abre cuando el dato
   acaba de escribirse y está fresco.

   La salvaguarda no le cuesta un paso a nadie: en las notas queda de qué
   solicitud vino y quién lo agregó. Así gerencia, al revisar el catálogo,
   ve cuáles entraron por aquí y puede verificar los números de cuenta — que
   es lo único delicado de todo esto: un número mal copiado no se paga mal
   una vez, se paga mal muchas. */
function api_guardarProveedorDeSolicitud(pin, d, solicitudId) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!puedeSolicitar_(u)) return { ok:false, error:'Sin permiso.' };

  const nombre = String(d.proveedor || '').trim();
  if (!nombre) return { ok:false, error:'Falta el nombre del proveedor.' };

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const rev = revisarProveedor_(nombre, d.ruc);
    if (rev.estado === 'igual')
      return { ok:false, error:'«' + rev.existente.proveedor + '» ya está en el catálogo.' };
    if (rev.estado === 'rucOtroNombre')
      return { ok:false, error:'Ese RUC ya está en el catálogo como «' + rev.existente.proveedor +
                               '». Corrige ese registro en vez de crear otro.' };

    const h = hojaFin_(HOJA_PROV, COLS_PROV);
    h.appendRow(filaPorNombre_(h, {
      proveedor: nombre, ruc: String(d.ruc || ''), dv: String(d.dv || ''),
      banco: String(d.banco || ''), numeroCuenta: String(d.numeroCuenta || ''),
      tipoCuenta: String(d.tipoCuenta || ''), activo: 'SI',
      cuentaCodigo: String(d.cuentaCodigo || '').trim(),
      notas: 'Agregado desde la solicitud ' + String(solicitudId || '') + ' por ' + u.nombre
    }));
    marcar_('solicitudes');
    return { ok:true, proveedor:nombre };
  } finally { lock.releaseLock(); }
}

/* ═══ Corregir el proveedor que ya existe, desde la solicitud ═══
   Para cuando el RUC estaba registrado con otro nombre y quien llena decide
   que lo bueno es lo que acaba de escribir. Se actualiza el registro que ya
   existe en vez de crear un segundo — que es justo el duplicado que estamos
   tratando de evitar. El nombre viejo queda en las notas: si mañana alguien
   busca por él, ahí está. */
function api_corregirProveedorDeSolicitud(pin, d, solicitudId) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!puedeSolicitar_(u)) return { ok:false, error:'Sin permiso.' };

  const rc = normRuc_(d.ruc);
  if (!rc) return { ok:false, error:'Falta el RUC para saber cuál registro corregir.' };

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const h = hojaFin_(HOJA_PROV, COLS_PROV);
    const vals = h.getDataRange().getValues();
    const cab = vals[0].map(String);
    const c = x => cab.indexOf(x);

    for (let i = 1; i < vals.length; i++) {
      if (normRuc_(vals[i][c('ruc')]) !== rc) continue;
      const antes = String(vals[i][c('proveedor')] || '').trim();
      const set = (col, v) => { if (c(col) >= 0) h.getRange(i + 1, c(col) + 1).setValue(v); };

      if (String(d.proveedor || '').trim()) set('proveedor', String(d.proveedor).trim());
      ['dv','banco','numeroCuenta','tipoCuenta','cuentaCodigo'].forEach(k => {
        if (String(d[k] || '').trim()) set(k, String(d[k]).trim());
      });
      const notaVieja = String(vals[i][c('notas')] || '').trim();
      set('notas', (notaVieja ? notaVieja + ' · ' : '') +
        'Corregido desde la solicitud ' + String(solicitudId || '') + ' por ' + u.nombre +
        (antes && antes !== String(d.proveedor || '').trim() ? ' (antes: ' + antes + ')' : ''));
      marcar_('solicitudes');
      return { ok:true, proveedor:String(d.proveedor || antes).trim(), antes:antes };
    }
    return { ok:false, error:'No encontré un proveedor con ese RUC.' };
  } finally { lock.releaseLock(); }
}

/* ═══ Mover una solicitud de estado ═══ */
function api_estadoSolicitud(pin, solicitudId, nuevoEstado, datos) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  const est = String(nuevoEstado || '').toUpperCase();
  if (ESTADOS_SP.indexOf(est) < 0) return { ok:false, error:'Estado no válido.' };

  /* Aprobar y rechazar es de gerencia, siempre. Marcar el pago no: quien
     pidió el pago es quien le da seguimiento al proveedor y sabe el día que
     entró la plata, así que también puede registrarlo — pero solo en la
     solicitud que él mismo pidió, y queda escrito quién lo marcó. */
  if (['APROBADA','RECHAZADA'].indexOf(est) >= 0 && !puedeAprobar_(u))
    return { ok:false, error:'Solo administración o gerencia puede aprobar o rechazar.' };
  if (est === 'ANULADA' && !puedeAprobar_(u))
    return { ok:false, error:'Solo administración o gerencia puede anular una solicitud.' };

  const d = datos || {};
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_SP);
    if (!h) return { ok:false, error:'La hoja SolicitudesPago no existe todavía.' };
    /* si la hoja es de antes de que existiera alguna columna, se agrega ahora:
       de lo contrario el dato se escribiría en el vacío, sin avisar */
    asegurarColumnas_(h, COLS_SP);
    const vals = h.getDataRange().getValues();
    const cab = vals[0].map(String);
    const c = x => cab.indexOf(x);
    const cId = c('solicitudId');

    for (let i = 1; i < vals.length; i++) {
      if (String(vals[i][cId]).trim() !== String(solicitudId).trim()) continue;
      const actual = String(vals[i][c('estado')] || '').toUpperCase();

      /* una solicitud pagada ya es un gasto: no se reabre desde aquí */
      if (actual === 'PAGADA' && est !== 'PAGADA')
        return { ok:false, error:'La solicitud ya está pagada. Anúlala solo desde la hoja, dejando constancia.' };
      if (est === 'PAGADA' && actual !== 'APROBADA')
        return { ok:false, error:'Solo se puede pagar una solicitud aprobada. Esta está ' + actual + '.' };
      if (est === 'APROBADA' && actual !== 'SOLICITADA')
        return { ok:false, error:'Solo se aprueba una solicitud en estado SOLICITADA. Esta está ' + actual + '.' };

      /* ── EL VISTO BUENO DE GESTIÓN ──
         Arriba del umbral, la solicitud pasa obligatoriamente por gerencia
         de gestión antes de que finanzas la apruebe. No es un trámite: es
         que dos personas distintas miren el mismo gasto grande. Por eso no
         alcanza con que exista el visto bueno — tiene que haberlo dado
         alguien que no sea quien está aprobando ahora. Si fuera la misma
         persona el control sería de adorno. */
      if (est === 'APROBADA') {
        const monto = Number(vals[i][c('total')]) || 0;
        const vobo  = String(vals[i][c('vistoBuenoPor')] || '').trim();
        if (monto > SP_UMBRAL_VOBO && !vobo)
          return { ok:false, error:'Esta solicitud es por B/. ' + monto.toFixed(2) +
            ' y pasa de B/. ' + SP_UMBRAL_VOBO.toFixed(2) +
            ': necesita primero el visto bueno de gerencia de gestión.' };
        if (vobo && vobo.toLowerCase() === u.nombre.trim().toLowerCase())
          return { ok:false, error:'Tú diste el visto bueno de esta solicitud. ' +
            'La aprobación tiene que darla otra persona.' };
      }

      /* el que no es gerencia solo puede marcar el pago de lo suyo */
      if (est === 'PAGADA' && !puedeAprobar_(u)) {
        const suya = String(vals[i][c('solicitadoPor')] || '').trim().toLowerCase()
                     === u.nombre.trim().toLowerCase();
        if (!suya) return { ok:false, error:'Solo puedes marcar el pago de las solicitudes que tú pediste.' };
      }

      const set = (col, v) => { if (c(col) >= 0) h.getRange(i + 1, c(col) + 1).setValue(v); };
      set('estado', est);
      if (est === 'APROBADA') {
        set('aprobadoPor', u.nombre); set('fechaAprobacion', hoyPanama_());
      } else if (est === 'RECHAZADA') {
        set('aprobadoPor', u.nombre); set('fechaAprobacion', hoyPanama_());
        set('motivoRechazo', String(d.motivo || ''));
      } else if (est === 'PAGADA') {
        set('fechaPago', String(d.fechaPago || hoyPanama_()));
        set('referenciaPago', String(d.referencia || ''));
        set('numeroCheque', String(d.numeroCheque || ''));
        set('pagadoPor', u.nombre);
      } else if (est === 'ANULADA') {
        set('motivoRechazo', String(d.motivo || ''));
      }
      marcar_('solicitudes');
      return { ok: true, solicitudId:solicitudId, estado:est };
    }
    return { ok:false, error:'No encontré la solicitud ' + solicitudId + '.' };
  } finally { lock.releaseLock(); }
}

/* ═══ El visto bueno de gerencia de gestión ═══
   No es un estado: la solicitud sigue SOLICITADA, esperando que finanzas
   la apruebe. Es un sello que queda encima, con quién lo puso y cuándo.
   Se hizo así a propósito — un estado más habría metido una casilla nueva
   en la cola de trabajo de todos, cuando lo que hace falta es solo dejar
   constancia de que alguien de gestión ya la miró. */
function api_marcarVistoBueno(pin, solicitudId) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!puedeAprobar_(u)) return { ok:false, error:'Solo gerencia puede dar el visto bueno.' };

  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_SP);
    if (!h) return { ok:false, error:'La hoja SolicitudesPago no existe todavía.' };
    asegurarColumnas_(h, COLS_SP);
    const vals = h.getDataRange().getValues();
    const cab = vals[0].map(String);
    const c = x => cab.indexOf(x);

    for (let i = 1; i < vals.length; i++) {
      if (String(vals[i][c('solicitudId')]).trim() !== String(solicitudId).trim()) continue;

      const actual = String(vals[i][c('estado')] || '').toUpperCase();
      if (actual !== 'SOLICITADA')
        return { ok:false, error:'El visto bueno va antes de aprobar. Esta solicitud está ' + actual + '.' };

      const ya = String(vals[i][c('vistoBuenoPor')] || '').trim();
      if (ya) return { ok:false, error:'Ya tiene el visto bueno de ' + ya + '.' };

      /* Quien pidió el pago no puede darse el visto bueno a sí mismo. */
      const pidio = String(vals[i][c('solicitadoPor')] || '').trim().toLowerCase();
      if (pidio === u.nombre.trim().toLowerCase())
        return { ok:false, error:'Tú pediste este pago. El visto bueno lo da otra persona.' };

      if (c('vistoBuenoPor')   >= 0) h.getRange(i + 1, c('vistoBuenoPor')   + 1).setValue(u.nombre);
      if (c('fechaVistoBueno') >= 0) h.getRange(i + 1, c('fechaVistoBueno') + 1).setValue(hoyPanama_());
      marcar_('solicitudes');
      return { ok:true, solicitudId:solicitudId, vistoBuenoPor:u.nombre, fechaVistoBueno:hoyPanama_() };
    }
    return { ok:false, error:'No encontré la solicitud ' + solicitudId + '.' };
  } finally { lock.releaseLock(); }
}

/* ═══ Listar solicitudes ═══ */
function api_solicitudes(pin, filtro) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!puedeSolicitar_(u)) return { ok:false, error:'Sin acceso.' };

  const f = filtro || {};
  const d1 = String(f.desde || ''), d2 = String(f.hasta || '');
  const est = String(f.estado || '').toUpperCase();
  const q = String(f.q || '').trim().toUpperCase();
  const n = v => Number(v) || 0;

  let lista = leerHoja_(HOJA_SP).map(s => ({
    solicitudId: String(s.solicitudId || ''), numero: n(s.numero),
    fecha: fechaISO_(s.fecha), proyecto: String(s.proyecto || ''),
    proveedor: String(s.proveedor || ''), ruc: String(s.ruc || ''),
    concepto: String(s.concepto || ''), total: n(s.total),
    subtotal: n(s.subtotal), itbms: n(s.itbms), exentos: n(s.exentos),
    tipoPago: String(s.tipoPago || ''), urgencia: String(s.urgencia || ''),
    estado: String(s.estado || 'SOLICITADA').toUpperCase(),
    solicitadoPor: String(s.solicitadoPor || ''), aprobadoPor: String(s.aprobadoPor || ''),
    fechaPago: fechaISO_(s.fechaPago), referenciaPago: String(s.referenciaPago || ''),
    pagadoPor: String(s.pagadoPor || ''),
    vistoBuenoPor: String(s.vistoBuenoPor || ''), fechaVistoBueno: fechaISO_(s.fechaVistoBueno),
    motivoRechazo: String(s.motivoRechazo || ''), origen: String(s.origen || '')
  })).filter(s => s.solicitudId)
    /* Para que la pantalla no tenga que repetir la regla del umbral y
       arriesgarse a que un día diga algo distinto que el servidor. */
    .map(s => Object.assign(s, { requiereVistoBueno: s.total > SP_UMBRAL_VOBO }));

  /* quien no ve finanzas, ve solo lo que él mismo pidió */
  if (!esFinanzas_(u))
    lista = lista.filter(s => s.solicitadoPor.trim().toLowerCase() === u.nombre.trim().toLowerCase());

  if (d1)  lista = lista.filter(s => s.fecha && s.fecha >= d1);
  if (d2)  lista = lista.filter(s => s.fecha && s.fecha <= d2);
  if (est) lista = lista.filter(s => s.estado === est);
  if (q)   lista = lista.filter(s => s.proveedor.toUpperCase().indexOf(q) >= 0 ||
                                     s.solicitudId.toUpperCase().indexOf(q) >= 0 ||
                                     s.concepto.toUpperCase().indexOf(q) >= 0);

  lista.sort((a, b) => (b.fecha + b.solicitudId).localeCompare(a.fecha + a.solicitudId));

  const t = { solicitadas:0, aprobadas:0, pagadas:0, rechazadas:0,
              montoPorAprobar:0, montoPorPagar:0, montoPagado:0, urgentes:0,
              esperandoVistoBueno:0 };
  lista.forEach(s => {
    if (s.estado === 'SOLICITADA') { t.solicitadas++; t.montoPorAprobar += s.total;
                                     if (s.requiereVistoBueno && !s.vistoBuenoPor) t.esperandoVistoBueno++; }
    else if (s.estado === 'APROBADA')  { t.aprobadas++; t.montoPorPagar += s.total; }
    else if (s.estado === 'PAGADA')    { t.pagadas++;   t.montoPagado   += s.total; }
    else if (s.estado === 'RECHAZADA') { t.rechazadas++; }
    /* Una sola cuenta de urgentes, aquí. Antes las que estaban por aprobar
       se sumaban dos veces —una arriba y otra aquí— y las aprobadas una
       sola, así que el número de gerencia no solo era alto: era alto de
       forma desigual, y no había manera de saber cuánto sin contarlas. */
    if (s.urgencia === 'URGE' && ['SOLICITADA','APROBADA'].indexOf(s.estado) >= 0) t.urgentes++;
  });
  ['montoPorAprobar','montoPorPagar','montoPagado'].forEach(k => {
    t[k] = Math.round(t[k] * 100) / 100;
  });

  return { ok:true, solicitudes: lista.slice(0, Number(f.limite) || 200),
           total: lista.length, totales: t, umbralVistoBueno: SP_UMBRAL_VOBO,
           verFinanzas: esFinanzas_(u), puedeAprobar: puedeAprobar_(u) };
}

/* ═══ Una solicitud completa, para el documento imprimible ═══ */
function api_verSolicitud(pin, solicitudId) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  const id = String(solicitudId || '').trim().toUpperCase();
  if (!id) return { ok:false, error:'Falta el número de solicitud.' };

  const s = leerHoja_(HOJA_SP).find(x => String(x.solicitudId || '').trim().toUpperCase() === id);
  if (!s) return { ok:false, error:'No encontré la solicitud ' + id + '.' };

  const quien = String(s.solicitadoPor || '').trim().toLowerCase();
  if (!esFinanzas_(u) && quien !== u.nombre.trim().toLowerCase())
    return { ok:false, error:'Esta solicitud no es tuya.' };

  const n = v => Number(v) || 0;

  /* El impreso que va a contabilidad lleva el nombre de la cuenta, no solo
     su código: 61050506 no le dice nada a nadie, COMBUSTIBLE sí. */
  const desc = {};
  leerHoja_(HOJA_CTA).forEach(c => {
    const k = String(c.codigo || '').trim();
    if (k) desc[k] = String(c.descripcion || '');
  });

  const lineas = leerHoja_(HOJA_SPD)
    .filter(l => String(l.solicitudId || '').trim().toUpperCase() === id)
    .map(l => {
      const cod = String(l.cuentaCodigo || '').trim();
      return { linea: n(l.linea), cantidad: n(l.cantidad), unidad: String(l.unidad || ''),
               concepto: String(l.concepto || ''), job: String(l.job || ''),
               cuentaCodigo: cod,
               cuentaDescripcion: String(l.cuentaDescripcion || '') || desc[cod] || '',
               exento: String(l.exento || '').toUpperCase() === 'SI',
               valorUnitario: n(l.valorUnitario), valorTotal: n(l.valorTotal) };
    })
    .sort((a, b) => a.linea - b.linea);

  return { ok:true, hoy: hoyPanama_(), lineas: lineas, empresa: datosDoc_('solicitudPago'),
    solicitud: {
      solicitudId: String(s.solicitudId), numero: n(s.numero), fecha: fechaISO_(s.fecha),
      compania: String(s.compania || 'ECOTERMO DE PANAMA S.A.'),
      proyecto: String(s.proyecto || ''), proveedor: String(s.proveedor || ''),
      ruc: String(s.ruc || ''), dv: String(s.dv || ''),
      tipoPago: String(s.tipoPago || ''), condicion: String(s.condicion || ''),
      banco: String(s.banco || ''), numeroCuenta: String(s.numeroCuenta || ''),
      tipoCuenta: String(s.tipoCuenta || ''),
      subtotal: n(s.subtotal), itbms: n(s.itbms), exentos: n(s.exentos),
      retencionContrato: n(s.retencionContrato), retencionItbms: n(s.retencionItbms),
      anticipo: n(s.anticipo), total: n(s.total),
      urgencia: String(s.urgencia || ''), concepto: String(s.concepto || ''),
      observaciones: String(s.observaciones || ''),
      facturaOriginal: String(s.facturaOriginal || '').toUpperCase() === 'SI',
      facturaCopia: String(s.facturaCopia || '').toUpperCase() === 'SI',
      estado: String(s.estado || '').toUpperCase(),
      solicitadoPor: String(s.solicitadoPor || ''), fechaSolicitud: fechaISO_(s.fechaSolicitud),
      aprobadoPor: String(s.aprobadoPor || ''), fechaAprobacion: fechaISO_(s.fechaAprobacion),
      motivoRechazo: String(s.motivoRechazo || ''),
      fechaPago: fechaISO_(s.fechaPago), referenciaPago: String(s.referenciaPago || ''),
      numeroCheque: String(s.numeroCheque || ''), pagadoPor: String(s.pagadoPor || ''),
      vistoBuenoPor: String(s.vistoBuenoPor || ''), fechaVistoBueno: fechaISO_(s.fechaVistoBueno)
    }};
}

/* ═══════════════════════════════════════════════════════════════════
   ESTADO DE RESULTADOS
   ───────────────────────────────────────────────────────────────────
   Entra por Facturas, sale por solicitudes PAGADAS más los gastos fijos.
   Dos reglas que no se negocian:

   1. El ITBMS no es ingreso ni es gasto. Se cobra por cuenta del fisco
      y se paga como crédito fiscal. Meterlo infla las dos columnas y
      deja la utilidad igual: ruido puro. Va aparte, informativo.
   2. La utilidad se mide sobre lo FACTURADO, no sobre lo cobrado. Un
      servicio prestado en agosto es utilidad de agosto aunque el cliente
      pague en octubre. Lo cobrado se muestra al lado, porque la caja
      también manda.
   ═══════════════════════════════════════════════════════════════════ */

/* El ITBMS de una factura: si las columnas cuadran se usa el dato real,
   y si no se deduce del monto. Nunca se inventa. */
function itbmsDeFactura_(f, total) {
  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;
  const monto = r2(f.monto), itb = r2(f.itbms);
  if (itb > 0 && monto > 0 && Math.abs(monto + itb - total) < 0.05) return itb;
  if (itb > 0 && Math.abs(monto - total) < 0.05) return itb;   // ITBMS dentro del monto
  return r2(total - total / 1.07);
}

function mesDe_(iso) { return String(iso || '').slice(0, 7); }

function api_estadoResultados(pin, desde, hasta) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!esFinanzas_(u)) return { ok:false, error:'El estado de resultados es de gerencia.' };

  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;
  const hoy = hoyPanama_();
  const d1 = String(desde || hoy.slice(0, 4) + '-01-01');
  const d2 = String(hasta || hoy);
  const enRango = f => f >= d1 && f <= d2;

  /* ── INGRESOS ───────────────────────────────────────────── */
  const pagosPorFactura = {};
  leerHoja_(HOJA_PAG).forEach(p => {
    const num = String(p.factura || '').trim();
    if (num) pagosPorFactura[num] = (pagosPorFactura[num] || 0) + (Number(p.monto) || 0);
  });

  const ingresoMes = {}, ingresoCliente = {};
  let facturado = 0, itbmsCobrado = 0, cobradoDeEsasFacturas = 0, nFact = 0;

  leerHoja_(HOJA_FAC).forEach(f => {
    const num = String(f.factura || '').trim();
    if (!num) return;
    const fecha = fechaISO_(f.fecha);
    if (!enRango(fecha)) return;
    const total = r2(f.total) || r2((Number(f.monto) || 0) + (Number(f.itbms) || 0));
    if (!total) return;
    const itb = itbmsDeFactura_(f, total);
    const neto = r2(total - itb);
    nFact++;
    facturado += neto; itbmsCobrado += itb;
    cobradoDeEsasFacturas += r2(pagosPorFactura[num] || 0);
    const m = mesDe_(fecha);
    ingresoMes[m] = r2((ingresoMes[m] || 0) + neto);
    const c = String(f.cliente || f['razon social'] || 'SIN CLIENTE').trim().toUpperCase();
    ingresoCliente[c] = r2((ingresoCliente[c] || 0) + neto);
  });

  /* Lo cobrado en el periodo: caja de verdad, sin importar de qué factura venga. */
  let cobradoPeriodo = 0;
  leerHoja_(HOJA_PAG).forEach(p => {
    const fecha = fechaISO_(p.fecha);
    if (enRango(fecha)) cobradoPeriodo += (Number(p.monto) || 0);
  });

  /* ── GASTOS: solicitudes PAGADAS ────────────────────────── */
  const detalle = leerHoja_(HOJA_SPD);
  const porSolicitud = {};
  detalle.forEach(l => {
    const id = String(l.solicitudId || '').trim().toUpperCase();
    if (!id) return;
    (porSolicitud[id] = porSolicitud[id] || []).push(l);
  });

  const cuentasDesc = {};
  leerHoja_(HOJA_CTA).forEach(c => {
    const k = String(c.codigo || '').trim();
    if (k) cuentasDesc[k] = String(c.descripcion || '');
  });

  /* Lo que todavía no es gasto porque no ha salido: se lee aparte, de las
     solicitudes, porque un movimiento histórico ya está pagado por definición. */
  let pendienteAprobar = 0, aprobadoSinPagar = 0;
  leerHoja_(HOJA_SP).forEach(s => {
    if (!String(s.solicitudId || '').trim()) return;
    const estado = String(s.estado || '').trim().toUpperCase();
    if (estado === 'SOLICITADA') pendienteAprobar += r2(s.total);
    else if (estado === 'APROBADA') aprobadoSinPagar += r2(s.total);
  });

  const gastoMes = {}, gastoCuenta = {}, gastoProyecto = {}, gastoProveedor = {};
  let gastos = 0, itbmsPagado = 0, nSol = 0, nHist = 0;
  let extraordinario = 0, porConfirmar = 0;
  const listaExtra = [], listaConfirmar = [];

  gastosDelPeriodo_(d1, d2).forEach(g => {
    const monto = r2(g.monto);

    /* POR CONFIRMAR: puede que no sea nuestro. Se ve, no se suma. */
    if (g.porConfirmar) {
      porConfirmar += monto;
      listaConfirmar.push({ fuente:g.fuente, id:g.id, fecha:g.fecha,
        proveedor:g.proveedor, concepto:g.concepto, proyecto:g.proyecto,
        monto:monto, nota:g.notaConfirmar, extraordinario:g.extraordinario });
      return;
    }

    if (g.fuente === 'solicitud') nSol++; else nHist++;
    gastos += monto;
    itbmsPagado += r2(g.itbms);
    const m = mesDe_(g.fecha);
    gastoMes[m] = r2((gastoMes[m] || 0) + monto);
    const pv = String(g.proveedor || 'SIN PROVEEDOR').trim().toUpperCase();
    gastoProveedor[pv] = r2((gastoProveedor[pv] || 0) + monto);

    /* EXTRAORDINARIO: la plata salió, así que baja la utilidad y aparece en
       el mes. Lo que NO hace es cargarse a un proyecto — eso ensuciaría la
       medida de lo que cuesta operar ese proyecto. Cuenta contable sí tiene:
       una multa se contabiliza en alguna parte. */
    if (g.extraordinario) {
      extraordinario += monto;
      listaExtra.push({ fuente:g.fuente, id:g.id, fecha:g.fecha,
        proveedor:g.proveedor, concepto:g.concepto, proyecto:g.proyecto, monto:monto });
    } else {
      const pr = String(g.proyecto || 'SIN PROYECTO').trim().toUpperCase();
      gastoProyecto[pr] = r2((gastoProyecto[pr] || 0) + monto);
    }

    /* por cuenta contable. El histórico trae la suya en la fila; la solicitud
       la trae en su detalle, y si no hay detalle el monto va a una bolsa. */
    if (g.fuente === 'historico') {
      const cod = g.cuenta || 'SIN CUENTA';
      gastoCuenta[cod] = r2((gastoCuenta[cod] || 0) + monto);
      if (g.descripcionCuenta && !cuentasDesc[cod]) cuentasDesc[cod] = g.descripcionCuenta;
      return;
    }
    const lineas = porSolicitud[g.id] || [];
    let repartido = 0;
    lineas.forEach(l => {
      const v = r2(l.valorTotal);
      if (!v) return;
      const cod = String(l.cuentaCodigo || '').trim() || 'SIN CUENTA';
      gastoCuenta[cod] = r2((gastoCuenta[cod] || 0) + v);
      repartido += v;
    });
    const resto = r2(monto - repartido);
    if (Math.abs(resto) > 0.05)
      gastoCuenta['SIN CUENTA'] = r2((gastoCuenta['SIN CUENTA'] || 0) + resto);
  });

  extraordinario = r2(extraordinario);
  porConfirmar = r2(porConfirmar);
  listaExtra.sort((a, b) => b.monto - a.monto);
  listaConfirmar.sort((a, b) => b.monto - a.monto);

  /* ── GASTOS FIJOS: los que se repiten todos los meses ───── */
  const meses = mesesEntre_(d1, d2);
  let fijos = 0;
  const listaFijos = leerHoja_(HOJA_GFIJ)
    .filter(g => String(g.concepto || '').trim() &&
                 String(g.activo || 'SI').toUpperCase() !== 'NO')
    .map(g => {
      const mensual = r2(g.monto);
      const periodo = r2(mensual * meses.length);
      fijos += periodo;
      return { concepto: String(g.concepto), mensual: mensual, periodo: periodo,
               cuentaCodigo: String(g.cuentaCodigo || ''),
               proveedor: String(g.proveedor || ''),
               proyecto: String(g.proyecto || ''), notas: String(g.notas || '') };
    }).sort((a, b) => b.periodo - a.periodo);

  facturado = r2(facturado); gastos = r2(gastos); fijos = r2(fijos);
  const gastoTotal = r2(gastos + fijos);
  const utilidad = r2(facturado - gastoTotal);
  const margen = facturado > 0 ? Math.round(utilidad / facturado * 1000) / 10 : 0;

  /* Lo que cuesta OPERAR es el gasto total menos lo extraordinario. Una multa
     salió de la caja —por eso está en la utilidad— pero no es lo que cuesta
     recoger un kilo de desecho, y meterla ahí deforma la medida con la que
     después se cotiza y se presupuesta. */
  const gastoOperativo = r2(gastoTotal - extraordinario);

  /* ── SERIE MES A MES ────────────────────────────────────── */
  const fijoMensual = listaFijos.reduce((a, g) => a + g.mensual, 0);
  const serie = meses.map(m => {
    const ing = r2(ingresoMes[m] || 0);
    const gas = r2((gastoMes[m] || 0) + fijoMensual);
    return { mes: m, ingreso: ing, gasto: gas, utilidad: r2(ing - gas) };
  });

  /* ── OPERACIÓN: cuánto cuesta mover un kilo ─────────────── */
  let kgRecolectados = 0, visitas = 0;
  leerHoja_(HOJA_REC).forEach(r => {
    const fecha = fechaISO_(r['Fecha de Recoleccion']);
    if (!enRango(fecha)) return;
    visitas++;
    kgRecolectados += (Number(r['total Kg']) || Number(r['Kg Recolectados']) || 0);
  });
  let kgTratados = 0;
  leerHoja_(HOJA_CIC).forEach(c => {
    const fecha = fechaISO_(c.fecha);
    if (enRango(fecha)) kgTratados += (Number(c.kgEntrada) || 0);
  });
  kgRecolectados = Math.round(kgRecolectados);
  kgTratados = Math.round(kgTratados);

  const operacion = {
    kgRecolectados: kgRecolectados, kgTratados: kgTratados, visitas: visitas,
    costoPorKg:     kgRecolectados ? r2(gastoOperativo / kgRecolectados) : 0,
    ingresoPorKg:   kgRecolectados ? r2(facturado / kgRecolectados) : 0,
    utilidadPorKg:  kgRecolectados ? r2((facturado - gastoOperativo) / kgRecolectados) : 0,
    costoPorKgTratado: kgTratados ? r2(gastoOperativo / kgTratados) : 0,
    costoPorVisita: visitas ? r2(gastoOperativo / visitas) : 0,
    ingresoPorVisita: visitas ? r2(facturado / visitas) : 0,
    gastoOperativo: gastoOperativo
  };

  const ordenar = obj => Object.keys(obj)
    .map(k => ({ clave: k, monto: r2(obj[k]),
                 descripcion: cuentasDesc[k] || '' }))
    .sort((a, b) => b.monto - a.monto);

  return { ok:true, usuario:u, hoy:hoy, desde:d1, hasta:d2, meses:meses.length,
    resumen: {
      facturado: facturado, cobradoPeriodo: r2(cobradoPeriodo),
      cobradoDeEsasFacturas: r2(cobradoDeEsasFacturas),
      porCobrarDelPeriodo: r2(facturado + itbmsCobrado - cobradoDeEsasFacturas),
      gastosVariables: gastos, gastosFijos: fijos, gastoTotal: gastoTotal,
      gastoOperativo: gastoOperativo,
      extraordinario: extraordinario, porConfirmar: porConfirmar,
      utilidad: utilidad, margen: margen,
      facturas: nFact, solicitudesPagadas: nSol, movimientosHistoricos: nHist,
      itbmsCobrado: r2(itbmsCobrado), itbmsPagado: r2(itbmsPagado),
      itbmsNeto: r2(itbmsCobrado - itbmsPagado),
      pendienteAprobar: r2(pendienteAprobar), aprobadoSinPagar: r2(aprobadoSinPagar)
    },
    serie: serie,
    porCuenta: ordenar(gastoCuenta),
    porProyecto: ordenar(gastoProyecto),
    porProveedor: ordenar(gastoProveedor).slice(0, 15),
    porCliente: ordenar(ingresoCliente).slice(0, 15),
    gastosFijos: listaFijos,
    extraordinarios: listaExtra,
    porResolver: listaConfirmar,
    puedeMarcar: puedeAprobar_(u),
    operacion: operacion };
}

/* Los meses que toca un rango, en orden. */
function mesesEntre_(d1, d2) {
  const a = String(d1).slice(0, 7), b = String(d2).slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(a) || !/^\d{4}-\d{2}$/.test(b) || b < a) return [a];
  const out = [];
  let y = Number(a.slice(0, 4)), m = Number(a.slice(5, 7));
  for (let i = 0; i < 120; i++) {
    const k = y + '-' + ('0' + m).slice(-2);
    out.push(k);
    if (k >= b) break;
    m++; if (m > 12) { m = 1; y++; }
  }
  return out;
}

/* ═══════════════════════════════════════════════════════════════════
   CATÁLOGOS: proveedores, cuentas contables y gastos fijos
   Se editan desde la pantalla para no depender de que alguien abra la
   hoja de cálculo y rompa una columna.
   ═══════════════════════════════════════════════════════════════════ */

function api_catalogosFinanzas(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!esFinanzas_(u)) return { ok:false, error:'Los catálogos son de gerencia.' };

  const n = v => Number(v) || 0;
  return { ok:true,
    proveedores: leerHoja_(HOJA_PROV).filter(p => String(p.proveedor || '').trim())
      .map(p => ({ proveedor: String(p.proveedor).trim(), ruc: String(p.ruc || ''),
                   dv: String(p.dv || ''), banco: String(p.banco || ''),
                   numeroCuenta: String(p.numeroCuenta || ''), tipoCuenta: String(p.tipoCuenta || ''),
                   contacto: String(p.contacto || ''), telefono: String(p.telefono || ''),
                   correo: String(p.correo || ''),
                   activo: String(p.activo || 'SI').toUpperCase() !== 'NO',
                   cuentaCodigo: String(p.cuentaCodigo || '').trim(),
                   notas: String(p.notas || '') }))
      .sort((a, b) => a.proveedor.localeCompare(b.proveedor)),
    cuentas: leerHoja_(HOJA_CTA).filter(c => String(c.codigo || '').trim())
      .map(c => ({ codigo: String(c.codigo).trim(), descripcion: String(c.descripcion || ''),
                   grupo: String(c.grupo || ''),
                   activo: String(c.activo || 'SI').toUpperCase() !== 'NO' }))
      .sort((a, b) => a.codigo.localeCompare(b.codigo)),
    gastosFijos: leerHoja_(HOJA_GFIJ).filter(g => String(g.concepto || '').trim())
      .map(g => ({ gastoFijoId: String(g.gastoFijoId || ''), concepto: String(g.concepto),
                   cuentaCodigo: String(g.cuentaCodigo || ''), proveedor: String(g.proveedor || ''),
                   monto: n(g.monto), proyecto: String(g.proyecto || ''),
                   activo: String(g.activo || 'SI').toUpperCase() !== 'NO',
                   notas: String(g.notas || '') }))
      .sort((a, b) => b.monto - a.monto) };
}

/* Guarda un proveedor. Si el nombre ya existe, lo actualiza: no se
   duplica un proveedor solo porque alguien lo volvió a escribir. */
function api_guardarProveedor(pin, d) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (!esFinanzas_(u)) return { ok:false, error:'Sin permiso.' };
  const nombre = String(d.proveedor || '').trim();
  if (!nombre) return { ok:false, error:'Falta el nombre del proveedor.' };

  /* Por NOMBRE de columna, no por posición: la hoja ganó cuentaCodigo al
     final y una fila armada a mano por orden habría dejado ese dato fuera —
     o peor, lo habría borrado cada vez que alguien edita un proveedor. */
  const h = hojaFin_(HOJA_PROV, COLS_PROV);
  const fila = filaPorNombre_(h, {
    proveedor: nombre, ruc: String(d.ruc || ''), dv: String(d.dv || ''),
    banco: String(d.banco || ''), numeroCuenta: String(d.numeroCuenta || ''),
    tipoCuenta: String(d.tipoCuenta || ''), contacto: String(d.contacto || ''),
    telefono: String(d.telefono || ''), correo: String(d.correo || ''),
    activo: d.activo === false ? 'NO' : 'SI', notas: String(d.notas || ''),
    cuentaCodigo: String(d.cuentaCodigo || '').trim()
  });

  const idx = indiceFila_(h, 'proveedor', nombre);
  if (idx > 0) { h.getRange(idx, 1, 1, fila.length).setValues([fila]); return { ok:true, actualizado:true }; }
  h.appendRow(fila);
  return { ok:true, creado:true };
}

function api_guardarCuenta(pin, d) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (!esFinanzas_(u)) return { ok:false, error:'Sin permiso.' };
  const cod = String(d.codigo || '').trim();
  if (!cod) return { ok:false, error:'Falta el código de la cuenta.' };
  if (!String(d.descripcion || '').trim()) return { ok:false, error:'Falta la descripción.' };

  const h = hojaFin_(HOJA_CTA, COLS_CTA);
  const fila = [cod, String(d.descripcion).trim(), String(d.grupo || ''),
                d.activo === false ? 'NO' : 'SI'];
  const idx = indiceFila_(h, 'codigo', cod);
  if (idx > 0) { h.getRange(idx, 1, 1, fila.length).setValues([fila]); return { ok:true, actualizado:true }; }
  h.appendRow(fila);
  return { ok:true, creado:true };
}

function api_guardarGastoFijo(pin, d) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (!esFinanzas_(u)) return { ok:false, error:'Sin permiso.' };
  if (!String(d.concepto || '').trim()) return { ok:false, error:'Falta el concepto.' };
  if (!(Number(d.monto) > 0)) return { ok:false, error:'El monto mensual debe ser mayor que cero.' };

  const h = hojaFin_(HOJA_GFIJ, COLS_GFIJ);
  const id = String(d.gastoFijoId || '').trim() ||
             'GF-' + hoyPanama_().replace(/-/g, '') + '-' +
             ('00' + (leerHoja_(HOJA_GFIJ).length + 1)).slice(-3);
  const fila = [id, String(d.concepto).trim(), String(d.cuentaCodigo || ''),
                String(d.proveedor || ''), Number(d.monto), String(d.proyecto || ''),
                d.activo === false ? 'NO' : 'SI', String(d.notas || '')];
  const idx = indiceFila_(h, 'gastoFijoId', id);
  if (idx > 0) { h.getRange(idx, 1, 1, fila.length).setValues([fila]); return { ok:true, actualizado:true, gastoFijoId:id }; }
  h.appendRow(fila);
  return { ok:true, creado:true, gastoFijoId:id };
}

/* ═══════════════════════════════════════════════════════════════════
   CAJA MENUDA
   ───────────────────────────────────────────────────────────────────
   Vive aquí, en Solicitudes de pago, y no en Administración: la
   custodia es de Mercadeo y tiene que poder anotar el gasto el día
   que ocurre, no cuando alguien le abra una puerta.

   El ciclo es de 30 días y termina en dos cosas a la vez: el arqueo
   imprimible (F-ADM-02) y una solicitud de pago por la reposición,
   con el detalle adentro. Esa solicitud nace SOLICITADA — quien
   gasta no aprueba su propio reembolso.

   Tres decisiones que conviene recordar dentro de un año:

   · El ✕ no borra, ANULA. La línea queda con quién la anuló y
     cuándo, y deja de contar. Borrar de verdad deja un arqueo que
     después nadie puede reconstruir.
   · «Sin comprobante» se anota igual, marcado, y el arqueo lo cuenta
     aparte. Si son tres de nueve, esa es una conversación que
     conviene tener antes de una auditoría y no durante.
   · Un solo período abierto a la vez. Abrir septiembre con agosto sin
     cerrar es como se pierde el rastro de un fondo fijo.
   ═══════════════════════════════════════════════════════════════════ */

const HOJA_CAJA  = 'CajaMenuda';
const HOJA_CAJAG = 'CajaMenudaGastos';

const COLS_CAJA  = ['cajaId','periodo','custodio','fondoAsignado','apertura','cierre',
                    'estado','totalGastos','efectivoEnCaja','solicitudId',
                    'abiertoPor','cerradoPor','fechaCierre','notas'];
const COLS_CAJAG = ['gastoId','cajaId','fecha','concepto','cuentaCodigo','cuentaDescripcion',
                    'comprobante','sinComprobante','monto','anulado','motivoAnulacion',
                    'anuladoPor','registradoPor','registradoEn'];

const CAJA_FONDO_BASE = 300;   // lo confirmó Supervisor el 6 sep 2026

/* Los botones de «lo de siempre». Mercadeo no tiene por qué saberse 56
   cuentas contables: toca el botón y el sistema pone el concepto y la cuenta.
   Los siete códigos están verificados contra el catálogo real.
   Viven aquí, con la paleta y los datos de la empresa: el día que contabilidad
   mueva una cuenta se cambia en un lugar, no en la cabeza de alguien. */
const CAJA_ATAJOS = [
  { icono:'🚕', rotulo:'Taxi',           concepto:'Taxi',                    cuenta:'61050512' },
  { icono:'📄', rotulo:'Copias',         concepto:'Copias',                  cuenta:'62050507' },
  { icono:'☕', rotulo:'Cafetería',      concepto:'Cafetería',               cuenta:'62050516' },
  { icono:'✏️', rotulo:'Papelería',      concepto:'Papelería',               cuenta:'62050509' },
  { icono:'📦', rotulo:'Envío',          concepto:'Envío de documentos',     cuenta:'62050513' },
  { icono:'🅿️', rotulo:'Estacionamiento',concepto:'Estacionamiento',         cuenta:'62050515' },
  { icono:'🩹', rotulo:'Botiquín',       concepto:'Botiquín',                cuenta:'62050520' }
];

/* Quién guarda el fondo. Mercadeo lo tiene hoy (Mercadeo); gerencia y
   administración entran siempre, porque tienen que poder cerrar un período
   si la custodia está de vacaciones. */
function esCustodio_(u) { return u && ['admin','gerente','mercadeo'].indexOf(u.rol) >= 0; }

function crearHojasCaja() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let n = 0;
  [[HOJA_CAJA, COLS_CAJA], [HOJA_CAJAG, COLS_CAJAG]].forEach(p => {
    const h = ss.getSheetByName(p[0]);
    if (!h) { crearHoja_(ss, p[0], p[1]); n++; } else asegurarColumnas_(h, p[1]);
  });
  SpreadsheetApp.getUi().alert(n ? 'Se crearon ' + n + ' hoja(s) de caja menuda.'
                                : 'Las hojas de caja menuda ya existen y están al día.');
}

function siguienteCaja_() {
  const anio = hoyPanama_().slice(0, 4);
  const previos = leerHoja_(HOJA_CAJA)
    .map(c => String(c.cajaId || ''))
    .filter(z => z.indexOf('CM-' + anio + '-') === 0)
    .map(z => Number((z.split('-')[2] || '').replace(/\D/g, '')) || 0);
  return 'CM-' + anio + '-' + ('00' + ((previos.length ? Math.max.apply(null, previos) : 0) + 1)).slice(-3);
}

/* El período abierto, si hay uno. Nunca puede haber dos. */
function cajaAbierta_() {
  const abiertas = leerHoja_(HOJA_CAJA)
    .filter(c => String(c.cajaId || '').trim() &&
                 String(c.estado || '').trim().toUpperCase() === 'ABIERTA');
  return abiertas.length ? abiertas[abiertas.length - 1] : null;
}

/* Los gastos de un período, ya sin los anulados y con los totales hechos.
   Un solo lugar que sepa sumar: la pantalla, el arqueo y la solicitud de
   reposición tienen que dar exactamente el mismo número. */
function gastosCaja_(cajaId) {
  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;
  const cuentasDesc = {};
  leerHoja_(HOJA_CTA).forEach(c => {
    const k = String(c.codigo || '').trim();
    if (k) cuentasDesc[k] = String(c.descripcion || '');
  });
  const id = String(cajaId || '').trim().toUpperCase();
  const lista = leerHoja_(HOJA_CAJAG)
    .filter(g => String(g.cajaId || '').trim().toUpperCase() === id &&
                 String(g.gastoId || '').trim() &&
                 String(g.anulado || '').trim().toUpperCase() !== 'SI')
    .map(g => {
      const cod = String(g.cuentaCodigo || '').trim();
      return { gastoId: String(g.gastoId), fecha: fechaISO_(g.fecha),
        concepto: String(g.concepto || ''), cuentaCodigo: cod,
        cuentaDescripcion: String(g.cuentaDescripcion || '') || cuentasDesc[cod] || '',
        comprobante: String(g.comprobante || ''),
        sinComprobante: String(g.sinComprobante || '').trim().toUpperCase() === 'SI',
        monto: r2(g.monto), registradoPor: String(g.registradoPor || '') };
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.gastoId.localeCompare(b.gastoId));

  const total = r2(lista.reduce((a, g) => a + g.monto, 0));
  const sinComp = lista.filter(g => g.sinComprobante);
  return { gastos: lista, total: total, cuantos: lista.length,
           sinComprobante: sinComp.length,
           montoSinComprobante: r2(sinComp.reduce((a, g) => a + g.monto, 0)) };
}

/* Arma el estado completo de un período: lo usan la pantalla y el arqueo. */
function estadoCaja_(caja) {
  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;
  const g = gastosCaja_(caja.cajaId);
  const fondo = r2(caja.fondoAsignado) || CAJA_FONDO_BASE;
  return {
    cajaId: String(caja.cajaId), periodo: String(caja.periodo || ''),
    custodio: String(caja.custodio || ''), fondoAsignado: fondo,
    apertura: fechaISO_(caja.apertura), cierre: fechaISO_(caja.cierre),
    estado: String(caja.estado || 'ABIERTA').toUpperCase(),
    solicitudId: String(caja.solicitudId || ''),
    cerradoPor: String(caja.cerradoPor || ''), fechaCierre: fechaISO_(caja.fechaCierre),
    gastos: g.gastos, total: g.total, cuantos: g.cuantos,
    sinComprobante: g.sinComprobante, montoSinComprobante: g.montoSinComprobante,
    disponible: r2(fondo - g.total),
    usado: fondo > 0 ? Math.round(g.total / fondo * 100) : 0
  };
}

/* ═══ Abrir la pantalla ═══ */
function api_cajaBootstrap(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!esCustodio_(u)) return { ok:false, error:'La caja menuda es de quien tiene la custodia del fondo.' };

  const cuentasDesc = {};
  leerHoja_(HOJA_CTA).forEach(c => {
    const k = String(c.codigo || '').trim();
    if (k) cuentasDesc[k] = String(c.descripcion || '');
  });
  const atajos = CAJA_ATAJOS.map(a => ({
    icono:a.icono, rotulo:a.rotulo, concepto:a.concepto, cuenta:a.cuenta,
    cuentaDescripcion: cuentasDesc[a.cuenta] || '' }));

  const abierta = cajaAbierta_();
  /* los períodos ya cerrados, para poder volver a ver un arqueo */
  const cerrados = leerHoja_(HOJA_CAJA)
    .filter(c => String(c.cajaId || '').trim() &&
                 String(c.estado || '').toUpperCase() === 'CERRADA')
    .map(c => ({ cajaId:String(c.cajaId), periodo:String(c.periodo || ''),
                 total:Math.round((Number(c.totalGastos)||0)*100)/100,
                 cierre:fechaISO_(c.cierre), solicitudId:String(c.solicitudId || '') }))
    .sort((a, b) => b.cajaId.localeCompare(a.cajaId)).slice(0, 12);

  return { ok:true, usuario:u, hoy:hoyPanama_(),
           caja: abierta ? estadoCaja_(abierta) : null,
           cerrados: cerrados, atajos: atajos,
           fondoSugerido: CAJA_FONDO_BASE,
           siguienteId: siguienteCaja_(),
           puedeAprobar: puedeAprobar_(u) };
}

/* ═══ Abrir un período ═══ */
function api_cajaAbrir(pin, datos) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!esCustodio_(u)) return { ok:false, error:'Sin acceso a la caja menuda.' };

  if (cajaAbierta_())
    return { ok:false, error:'Ya hay un período abierto. Ciérralo antes de abrir otro: ' +
                             'con dos abiertos a la vez se pierde el rastro del fondo.' };

  const d = datos || {};
  /* Ojo con el `||` aquí: un fondo escrito como 0 es falso en JavaScript y se
     habría convertido en 300 sin decir nada. Un fondo mal tecleado tiene que
     dar error, no un número inventado que después nadie cuadra. */
  const puesto = d.fondoAsignado;
  const fondo = (puesto === undefined || puesto === null || puesto === '')
              ? CAJA_FONDO_BASE
              : Math.round((Number(puesto) || 0) * 100) / 100;
  if (!(fondo > 0)) return { ok:false, error:'El fondo asignado tiene que ser un número mayor que cero.' };
  const apertura = String(d.apertura || hoyPanama_());
  const custodio = String(d.custodio || u.nombre).trim();
  const periodo = String(d.periodo || '').trim() || rotuloPeriodo_(apertura);

  const id = siguienteCaja_();
  const h = hojaFin_(HOJA_CAJA, COLS_CAJA);
  const fila = COLS_CAJA.map(c => ({
    cajaId:id, periodo:periodo, custodio:custodio, fondoAsignado:fondo,
    apertura:apertura, cierre:'', estado:'ABIERTA', totalGastos:0,
    efectivoEnCaja:fondo, solicitudId:'', abiertoPor:u.nombre,
    cerradoPor:'', fechaCierre:'', notas:String(d.notas || '')
  }[c] !== undefined ? {
    cajaId:id, periodo:periodo, custodio:custodio, fondoAsignado:fondo,
    apertura:apertura, cierre:'', estado:'ABIERTA', totalGastos:0,
    efectivoEnCaja:fondo, solicitudId:'', abiertoPor:u.nombre,
    cerradoPor:'', fechaCierre:'', notas:String(d.notas || '')
  }[c] : ''));
  h.appendRow(fila);
  marcar_('solicitudes');
  return { ok: true, cajaId:id, caja: estadoCaja_({ cajaId:id, periodo:periodo,
    custodio:custodio, fondoAsignado:fondo, apertura:apertura, estado:'ABIERTA' }) };
}

/* «septiembre 2026» a partir de una fecha, para el rótulo del período. */
const MESES_LARGOS = ['enero','febrero','marzo','abril','mayo','junio','julio',
                      'agosto','septiembre','octubre','noviembre','diciembre'];
function rotuloPeriodo_(iso) {
  const p = String(iso || '').split('-');
  if (p.length < 2) return String(iso || '');
  return (MESES_LARGOS[Number(p[1]) - 1] || p[1]) + ' ' + p[0];
}

/* ═══ Anotar un gasto ═══ */
function api_cajaGasto(pin, datos) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!esCustodio_(u)) return { ok:false, error:'Sin acceso a la caja menuda.' };

  const caja = cajaAbierta_();
  if (!caja) return { ok:false, error:'No hay un período abierto. Abre uno antes de anotar gastos.' };

  const d = datos || {};
  const concepto = String(d.concepto || '').trim();
  if (!concepto) return { ok:false, error:'Falta en qué se gastó.' };
  const monto = Math.round((Number(d.monto) || 0) * 100) / 100;
  if (monto <= 0) return { ok:false, error:'El monto tiene que ser mayor que cero.' };

  const est = estadoCaja_(caja);
  if (monto > est.disponible + 0.001)
    return { ok:false, error:'Ese gasto (' + monto.toFixed(2) + ') pasa de lo que queda en la caja (' +
             est.disponible.toFixed(2) + '). Revisa el monto, o cierra el período y pide la reposición.' };

  const cod = String(d.cuentaCodigo || '').trim();
  if (!cod) return { ok:false, error:'Falta la cuenta contable. Usa un botón de los de siempre, o escógela.' };
  const cuentas = leerHoja_(HOJA_CTA).map(c => String(c.codigo || '').trim());
  if (cuentas.length && cuentas.indexOf(cod) < 0)
    return { ok:false, error:'La cuenta ' + cod + ' no está en el catálogo contable.' };

  const fecha = String(d.fecha || hoyPanama_());
  if (fecha > hoyPanama_()) return { ok:false, error:'No se puede anotar un gasto con fecha futura.' };
  if (est.apertura && fecha < est.apertura)
    return { ok:false, error:'Ese gasto es anterior a la apertura del período (' + est.apertura + ').' };

  const comprobante = String(d.comprobante || '').trim();
  const sinComp = !comprobante;

  const h = hojaFin_(HOJA_CAJAG, COLS_CAJAG);
  const id = 'CG-' + caja.cajaId.replace(/^CM-/, '') + '-' +
             ('00' + (leerHoja_(HOJA_CAJAG).filter(g =>
               String(g.cajaId || '').trim().toUpperCase() === String(caja.cajaId).toUpperCase()
             ).length + 1)).slice(-3);

  const cuentasDesc = {};
  leerHoja_(HOJA_CTA).forEach(c => {
    const k = String(c.codigo || '').trim();
    if (k) cuentasDesc[k] = String(c.descripcion || '');
  });

  const dato = { gastoId:id, cajaId:caja.cajaId, fecha:fecha, concepto:concepto,
    cuentaCodigo:cod, cuentaDescripcion:cuentasDesc[cod] || '',
    comprobante:comprobante, sinComprobante: sinComp ? 'SI' : 'NO', monto:monto,
    anulado:'NO', motivoAnulacion:'', anuladoPor:'',
    registradoPor:u.nombre, registradoEn:hoyPanama_() };
  h.appendRow(COLS_CAJAG.map(c => dato[c] !== undefined ? dato[c] : ''));

  marcar_('solicitudes');

  return { ok: true, gastoId:id, caja: estadoCaja_(caja) };
}

/* ═══ Anular un gasto ═══
   No se borra: queda con quién lo anuló y por qué, y deja de contar. Un
   arqueo del que se borran líneas es un arqueo que nadie puede reconstruir. */
function api_cajaAnular(pin, gastoId, motivo) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!esCustodio_(u)) return { ok:false, error:'Sin acceso a la caja menuda.' };

  const caja = cajaAbierta_();
  if (!caja) return { ok:false, error:'No hay un período abierto.' };

  const id = String(gastoId || '').trim().toUpperCase();
  const suyo = leerHoja_(HOJA_CAJAG).filter(g =>
    String(g.gastoId || '').trim().toUpperCase() === id)[0];
  if (!suyo) return { ok:false, error:'No encontré ese gasto.' };
  if (String(suyo.cajaId || '').trim().toUpperCase() !== String(caja.cajaId).toUpperCase())
    return { ok:false, error:'Ese gasto es de un período ya cerrado. Un arqueo firmado no se toca.' };

  const ok = actualizarFila_(HOJA_CAJAG, 'gastoId', id, {
    anulado:'SI', motivoAnulacion:String(motivo || '').trim().slice(0, 300),
    anuladoPor:u.nombre });
  if (!ok) return { ok:false, error:'No se pudo anular ese gasto.' };
  marcar_('solicitudes');
  return { ok: true, gastoId:id, caja: estadoCaja_(caja) };
}

/* ═══ Cerrar el período ═══
   Dos cosas a la vez: el arqueo queda firmado y nace la solicitud de
   reposición, SOLICITADA. Quien gasta no aprueba su propio reembolso. */
function api_cajaCerrar(pin, datos) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!esCustodio_(u)) return { ok:false, error:'Sin acceso a la caja menuda.' };

  const caja = cajaAbierta_();
  if (!caja) return { ok:false, error:'No hay un período abierto que cerrar.' };
  const est = estadoCaja_(caja);
  if (!est.cuantos) return { ok:false, error:'El período no tiene ni un gasto anotado: no hay nada que reponer.' };

  const d = datos || {};
  const cierre = String(d.cierre || hoyPanama_());
  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;

  /* la solicitud de reposición, con el detalle de cada gasto adentro */
  const lineas = est.gastos.map(g => ({
    cantidad: 1, unidad: 'GASTO',
    concepto: g.fecha.slice(5) + ' · ' + g.concepto +
              (g.sinComprobante ? ' (sin comprobante)' : ' · comp. ' + g.comprobante),
    cuentaCodigo: g.cuentaCodigo, cuentaDescripcion: g.cuentaDescripcion,
    exento: true, valorUnitario: g.monto
  }));
  const sol = api_guardarSolicitudPago(pin, {
    proyecto: String(d.proyecto || ''),
    proveedor: est.custodio,
    concepto: 'Reposición de caja menuda ' + est.periodo + ' · arqueo ' + est.cajaId,
    observaciones: est.cuantos + ' comprobante(s)' +
      (est.sinComprobante ? ', ' + est.sinComprobante + ' sin comprobante por ' +
        est.montoSinComprobante.toFixed(2) : '') +
      '. Respaldado por el arqueo ' + est.cajaId + ' (F-ADM-02).',
    tipoPago: 'EFECTIVO', condicion: 'CONTADO', urgencia: 'REGULAR',
    origen: 'CAJA MENUDA'
  }, lineas);
  if (!sol || !sol.ok)
    return { ok:false, error:'No se pudo crear la solicitud de reposición: ' +
             ((sol && sol.error) || 'motivo desconocido') + '. El período sigue abierto.' };

  const cerrada = actualizarFila_(HOJA_CAJA, 'cajaId', est.cajaId, {
    estado:'CERRADA', cierre:cierre, totalGastos:r2(est.total),
    efectivoEnCaja:r2(est.disponible), solicitudId:sol.solicitudId,
    cerradoPor:u.nombre, fechaCierre:hoyPanama_() });
  if (!cerrada) return { ok:false, error:'Se creó la solicitud ' + sol.solicitudId +
    ' pero no se pudo marcar el período como cerrado. Avísale a Supervisor antes de seguir.' };

  marcar_('solicitudes');

  return { ok: true, cajaId:est.cajaId, solicitudId:sol.solicitudId,
           total:est.total, urlArqueo:'?p=arqueo&caja=' + encodeURIComponent(est.cajaId) };
}

/* ═══ El arqueo, para imprimir ═══
   Sin PIN a propósito: es un documento que se abre desde un enlace, igual
   que el acta y el recibo. No trae nada que no esté ya en el papel. */
function api_arqueo(cajaId) {
  const id = String(cajaId || '').trim().toUpperCase();
  const caja = leerHoja_(HOJA_CAJA).filter(c =>
    String(c.cajaId || '').trim().toUpperCase() === id)[0];
  if (!caja) return { ok:false, error:'No encontré el arqueo ' + id + '.' };
  const est = estadoCaja_(caja);
  est.periodoTexto = rotuloPeriodo_(est.apertura);
  return { ok:true, arqueo: est, empresa: datosDoc_('arqueo') };
}

/* Fila de una hoja buscando por el valor de una columna con nombre.
   Devuelve el número de fila real (1 = encabezado), o 0 si no está. */
function indiceFila_(hoja, columna, valor) {
  if (hoja.getLastRow() < 2) return 0;
  const cab = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0].map(String);
  const c = cab.indexOf(columna);
  if (c < 0) return 0;
  const col = hoja.getRange(2, c + 1, hoja.getLastRow() - 1, 1).getValues();
  const buscado = String(valor).trim().toUpperCase();
  for (let i = 0; i < col.length; i++)
    if (String(col[i][0]).trim().toUpperCase() === buscado) return i + 2;
  return 0;
}

/* ═══════════════════════════════════════════════════════════════════
   El catálogo contable que ya usa la empresa en el formato de Excel.
   Se siembra una sola vez; después se edita desde la pantalla.
   Los códigos son texto: empiezan por 6 y no llevan ceros a la
   izquierda, pero se guardan como texto igual para que la hoja no
   los convierta en número y luego no cuadren al buscarlos.
   ═══════════════════════════════════════════════════════════════════ */
const CUENTAS_BASE = [
  ['61050501','TRATAMIENTO','Costo de operación'],
  ['61050502','MANO DE OBRA','Costo de operación'],
  ['61050503','INSUMOS','Costo de operación'],
  ['61050504','MANTENIMIENTO','Costo de operación'],
  ['61050505','ALQUILER','Costo de operación'],
  ['61050506','COMBUSTIBLE','Costo de operación'],
  ['61050507','ACTIVOS','Costo de operación'],
  ['61050508','Riesgo Profesional','Costo de operación'],
  ['61050509','Gastos de Representación','Costo de operación'],
  ['61050510','Servicios Eventuales','Costo de operación'],
  ['61050511','Honorarios Profesionales','Costo de operación'],
  ['61050512','Transporte y Movilización','Costo de operación'],
  ['61050514','Atención Empleados','Costo de operación'],
  ['61050515','Capacitaciones','Costo de operación'],
  ['61050517','Asesoría Comercial','Costo de operación'],
  ['61050518','Gastos de viajes al exterior','Costo de operación'],
  ['62050501','Alquileres','Gasto administrativo'],
  ['62050502','Arriendo Oficina o Local','Gasto administrativo'],
  ['62050503','Electricidad','Gasto administrativo'],
  ['62050504','Teléfonos y Celulares','Gasto administrativo'],
  ['62050505','Internet y Comunicación','Gasto administrativo'],
  ['62050506','Agua y Aseo','Gasto administrativo'],
  ['62050507','Fotocopias','Gasto administrativo'],
  ['62050508','Publicidad','Gasto administrativo'],
  ['62050509','Papelería y Útiles de oficina','Gasto administrativo'],
  ['62050510','Reparación y Mantenimiento','Gasto administrativo'],
  ['62050511','Seguros','Gasto administrativo'],
  ['62050512','Combustibles y Lubricantes','Gasto administrativo'],
  ['62050513','Correspondencia y Flete','Gasto administrativo'],
  ['62050514','Trámites Legales y Notariales','Gasto administrativo'],
  ['62050515','Estacionamientos y Peajes','Gasto administrativo'],
  ['62050516','Cafetería, Aseo y Limpieza','Gasto administrativo'],
  ['62050519','Cuotas y Suscripciones','Gasto administrativo'],
  ['62050520','Botiquín','Gasto administrativo'],
  ['62050521','Donaciones','Gasto administrativo'],
  ['62050522','Atención a Terceros','Gasto administrativo'],
  ['62050523','Otros Gastos Sociales','Gasto administrativo'],
  ['62050524','Licencias','Gasto administrativo'],
  ['62050525','Viáticos y Movilización a Proyectos','Gasto administrativo'],
  ['63050500','Impuesto Aviso de Operaciones','Impuestos'],
  ['63050501','Impuestos Municipales','Impuestos'],
  ['63050502','Impuesto de ITBMS','Impuestos'],
  ['63050503','Multa y Recargo','Impuestos'],
  ['63050504','Gastos de Importaciones','Impuestos'],
  ['63050505','Placas y Revisados','Impuestos'],
  ['63050508','Impuesto de Renta DGI','Impuestos'],
  ['63050509','Impuesto Inmueble','Impuestos'],
  ['63050510','Otros Impuestos','Impuestos'],
  ['65050501','Gastos de Licitación','Otros'],
  ['67050501','Cargos Bancarios','Financieros'],
  ['67050502','Comisiones por Factoring','Financieros'],
  ['67050503','Gastos Legales por Factoring','Financieros'],
  ['67050504','Intereses Bancarios','Financieros'],
  ['67050505','Leasing','Financieros']
];

function sembrarCuentasContables() {
  const h = hojaFin_(HOJA_CTA, COLS_CTA);
  const ya = {};
  leerHoja_(HOJA_CTA).forEach(c => { ya[String(c.codigo || '').trim()] = true; });

  const nuevas = CUENTAS_BASE.filter(c => !ya[c[0]]).map(c => [c[0], c[1], c[2], 'SI']);
  if (nuevas.length) {
    const desde = h.getLastRow() + 1;
    h.getRange(desde, 1, nuevas.length, COLS_CTA.length).setValues(nuevas);
    /* el código va como texto: si la hoja lo vuelve número, deja de coincidir */
    h.getRange(desde, 1, nuevas.length, 1).setNumberFormat('@');
  }
  SpreadsheetApp.getUi().alert(nuevas.length
    ? 'Se agregaron ' + nuevas.length + ' cuenta(s) contable(s). Las que ya existían no se tocaron.'
    : 'El catálogo contable ya está completo.');
}

/* ═══════════════════════════════════════════════════════════════════
   DISTINTIVO DEL CLIENTE Y SU PÁGINA PÚBLICA
   ───────────────────────────────────────────────────────────────────
   El distintivo se entrega al firmar el contrato y se pega en el local.
   Su QR abre una pantalla de solo lectura, sin PIN y sin un botón que
   tocar: el cliente ve su servicio, no el sistema.

   Dos reglas que sostienen esto:

   1. La página es PÚBLICA. Por eso los datos se piden campo por campo,
      nunca la fila completa de Clientes — ahí viven las notas
      comerciales, los costos y la situación de cobro. Un dump de la
      fila es una fuga.
   2. El enlace lleva un código derivado del id más una clave secreta.
      Sin el código no abre, así que no se llega escribiendo números
      al azar.
   ═══════════════════════════════════════════════════════════════════ */

const PROP_CLAVE_CLI = 'CLAVE_DISTINTIVO';

/* La clave se crea sola la primera vez y se queda en las propiedades del
   proyecto. No se guarda en ninguna hoja: quien vea la hoja no puede
   fabricar códigos válidos. */
function claveDistintivo_() {
  const p = PropertiesService.getScriptProperties();
  let k = p.getProperty(PROP_CLAVE_CLI);
  if (!k) {
    k = Utilities.getUuid() + '·' + Utilities.getUuid();
    p.setProperty(PROP_CLAVE_CLI, k);
  }
  return k;
}

/* Ocho caracteres, sin las letras y números que se confunden al teclear
   (0/O, 1/I/L). El cliente lo copia del papel, así que tiene que ser
   legible antes que corto. */
const ALFA_COD = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
function codigoCliente_(id) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
                                        'CLI-' + String(id) + '|' + claveDistintivo_(),
                                        Utilities.Charset.UTF_8);
  let s = '';
  for (let i = 0; i < 8; i++) s += ALFA_COD[(bytes[i] + 256) % ALFA_COD.length];
  return s;
}

/* ── frecuencia en palabras, no en códigos ── */
const NOMBRE_DIA = ['','lunes','martes','miércoles','jueves','viernes','sábado','domingo'];

function frecuenciaEnPalabras_(frec, diasSemana, diasVistos) {
  const f = String(frec || '').toLowerCase().trim();
  if (!f) return { texto: 'Según programación', detalle: '' };

  /* Se usan los términos de ECOVSA, con una excepción deliberada: la hoja
     dice BIMENSUAL para lo que ocurre cada dos meses, pero en español
     bimensual es DOS VECES AL MES y bimestral es cada dos meses. Puertas
     adentro da igual; esta palabra ahora la lee el cliente, y si entiende
     que van dos veces al mes tenemos un reclamo. Se imprime Bimestral. */
  let base = '';
  if (f.indexOf('2x') >= 0)              base = 'Dos veces por semana';
  else if (f.indexOf('diaria') >= 0)     base = 'Diaria';
  else if (f.indexOf('semanal') >= 0)    base = 'Semanal';
  else if (f.indexOf('quincenal') >= 0)  base = 'Quincenal';
  else if (f.indexOf('bimensual') >= 0 ||
           f.indexOf('bimestral') >= 0)  base = 'Bimestral';
  else if (f.indexOf('mensual') >= 0)    base = 'Mensual';
  else if (f.indexOf('trimestral') >= 0) base = 'Trimestral';
  else if (f.indexOf('semestral') >= 0)  base = 'Semestral';
  else if (f.indexOf('anual') >= 0)      base = 'Anual';
  else if (f.indexOf('especial') >= 0)   base = 'Servicio por visita';
  else base = String(frec).trim();

  /* el día se dice solo si de verdad se sabe: o está marcado en la ficha,
     o se repite en el historial. Inventarlo genera un reclamo. */
  let detalle = '';
  const marcados = String(diasSemana || '').split(/[,;\/ ]+/)
    .map(x => Number(String(x).replace(/\D/g, '')))
    .filter(n => n >= 1 && n <= 7);
  if (marcados.length) {
    detalle = marcados.map(n => NOMBRE_DIA[n]).join(' y ');
  } else if (diasVistos && diasVistos.length >= 3) {
    const cuenta = {};
    diasVistos.forEach(d => { cuenta[d] = (cuenta[d] || 0) + 1; });
    const top = Object.keys(cuenta).sort((a, b) => cuenta[b] - cuenta[a]);
    /* solo si ese día manda de verdad: al menos 6 de cada 10 visitas */
    if (cuenta[top[0]] / diasVistos.length >= 0.6) detalle = NOMBRE_DIA[Number(top[0])];
  }
  return { texto: base, detalle: detalle ? 'normalmente los ' + detalle : '' };
}

const NOMBRE_MES = ['','enero','febrero','marzo','abril','mayo','junio','julio',
                    'agosto','septiembre','octubre','noviembre','diciembre'];

/* Al cliente se le dice el MES, nunca el día exacto. Una fecha publicada
   es una promesa: si el camión no llega ese día, el reclamo lo generó
   nuestro propio sistema. */
function mesEnPalabras_(iso) {
  const s = String(iso || '');
  if (!/^\d{4}-\d{2}/.test(s)) return '';
  return NOMBRE_MES[Number(s.slice(5, 7))] + ' de ' + s.slice(0, 4);
}
function fechaEnPalabras_(iso) {
  const s = String(iso || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '';
  return Number(s.slice(8, 10)) + ' de ' + NOMBRE_MES[Number(s.slice(5, 7))] +
         ' de ' + s.slice(0, 4);
}

/* ¿Este cliente tiene facturas vencidas? Se calcula igual que en Cobros:
   el saldo sale de restar los pagos al neto esperado, nunca se lee escrito.

   Devuelve solo un semáforo, nunca cifras. La pantalla del cliente se abre
   escaneando un adhesivo pegado en la pared de su recepción: cualquiera que
   pase puede verla. Publicar ahí cuánto debe ese cliente es exponer su
   situación financiera en su propia sala de espera. El que debe, entiende
   "comuníquese con nosotros"; el que pasa por ahí, no se entera de nada. */
function semaforoCobro_(cliente, razonSocial) {
  const hoy = hoyPanama_();
  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;
  const nom = String(cliente || '').trim().toUpperCase();
  const raz = String(razonSocial || '').trim().toUpperCase();
  if (!nom && !raz) return 'verde';

  const pagos = {};
  leerHoja_(HOJA_PAG).forEach(p => {
    const f = String(p.factura || '').trim();
    if (f) pagos[f] = (pagos[f] || 0) + (Number(p.monto) || 0);
  });

  let vencidas = 0;
  leerHoja_(HOJA_FAC).forEach(f => {
    const suyo = String(f.cliente || '').trim().toUpperCase();
    const suyoRaz = String(f['razon social'] || '').trim().toUpperCase();
    if (suyo !== nom && suyo !== raz && suyoRaz !== nom && suyoRaz !== raz) return;
    const num = String(f.factura || '').trim();
    if (!num) return;
    const total = r2(f.total) || r2((Number(f.monto) || 0) + (Number(f.itbms) || 0));
    if (!total) return;
    const saldo = r2(netoEsperado_(f, total) - r2(pagos[num] || 0));
    if (saldo <= 0.009) return;
    const venc = vencimientoDe_(f);
    if (venc && venc < hoy) vencidas++;
  });

  if (vencidas >= 2) return 'rojo';
  if (vencidas === 1) return 'ambar';
  return 'verde';
}

/* ═══ La pantalla del cliente. Pública: sin PIN. ═══ */
function api_miCliente(clienteId, codigo) {
  const id = String(clienteId || '').trim();
  const cod = String(codigo || '').trim().toUpperCase();
  if (!id || !cod) return { ok:false, error:'Enlace incompleto.' };
  if (codigoCliente_(id) !== cod) return { ok:false, error:'Este enlace no es válido.' };

  const c = leerHoja_(HOJA_CLI).find(x => String(x.id).trim() === id);
  if (!c) return { ok:false, error:'No encontramos este establecimiento.' };

  const estado = String(c.estado || '').trim().toUpperCase();
  const situacion = String(c.situacion || '').trim().toLowerCase();
  /* un cliente retirado no debería seguir viendo su tablero */
  if (situacion.indexOf('retiro') >= 0 || estado === 'RETIRADO')
    return { ok:false, error:'Este servicio ya no está activo. Escríbenos y lo revisamos.' };

  const nombre = String(c.nombre || '').trim();
  const n = v => Number(v) || 0;

  /* ── historial: solo de este cliente, y solo lo que le pertenece ── */
  const suyas = [];
  const diasVistos = [];
  leerHoja_(HOJA_REC).forEach(r => {
    const quien = String(r.Cliente || '').trim().toUpperCase();
    if (quien !== nombre.toUpperCase() &&
        quien !== String(c['razon social'] || '').trim().toUpperCase()) return;
    const f = fechaISO_(r['Fecha de Recoleccion']);
    if (!f) return;
    suyas.push({
      fecha: f,
      kg: n(r['total Kg']) || n(r['Kg Recolectados']),
      bolsas: n(r['cantidad bolsas']),
      punzo: n(r['kg punzo cortantes']),
      anatomo: n(r['kg anatomopatologico']),
      recibo: String(r['recibo numero'] || '')
    });
    const d = new Date(f + 'T12:00:00');
    if (!isNaN(d.getTime())) diasVistos.push(d.getDay() === 0 ? 7 : d.getDay());
  });
  suyas.sort((a, b) => a.fecha.localeCompare(b.fecha));

  const acum = { visitas: suyas.length, kg: 0, bolsas: 0, punzo: 0, anatomo: 0 };
  suyas.forEach(v => {
    acum.kg += v.kg; acum.bolsas += v.bolsas;
    acum.punzo += v.punzo; acum.anatomo += v.anatomo;
  });
  acum.kg = Math.round(acum.kg * 100) / 100;
  acum.punzo = Math.round(acum.punzo * 100) / 100;
  acum.anatomo = Math.round(acum.anatomo * 100) / 100;

  const ultima = suyas.length ? suyas[suyas.length - 1] : null;
  /* la última visita real manda sobre la columna de la hoja: esa columna
     se actualiza de noche y puede venir atrasada */
  const ultimaFecha = (ultima && ultima.fecha) || fechaISO_(c.ultimaVisita);
  const frec = frecuenciaEnPalabras_(c.frecuencia, c['dias semana'], diasVistos);

  /* el mes de la próxima: de la columna si existe, si no se estima */
  let proxIso = fechaISO_(c.proximaVisita);
  if (!proxIso && ultimaFecha) {
    const dias = diasDeFrecuencia_(c.frecuencia);
    if (dias) {
      const d = new Date(ultimaFecha + 'T12:00:00');
      d.setDate(d.getDate() + dias);
      proxIso = Utilities.formatDate(d, tzHoja_(), 'yyyy-MM-dd');
    }
  }

  const contratoHasta = fechaISO_(c.vencimiento);
  const hoy = hoyPanama_();

  return { ok:true,
    establecimiento: nombre,
    razonSocial: String(c['razon social'] || ''),
    codigoCliente: String(c.id),
    direccion: String(c.direccion || ''),
    region: String(c.region || ''),
    servicioDesde: fechaEnPalabras_(fechaISO_(c['inicio recoleccion'])),
    frecuencia: frec.texto,
    frecuenciaDetalle: frec.detalle,
    ultimaVisita: fechaEnPalabras_(ultimaFecha),
    ultimaVisitaKg: ultima ? ultima.kg : 0,
    proximaMes: mesEnPalabras_(proxIso),
    contratoHasta: fechaEnPalabras_(contratoHasta),
    contratoVigente: contratoHasta ? (contratoHasta >= hoy) : true,
    semaforo: semaforoCobro_(nombre, c['razon social']),
    suspendido: String(c.situacion || '').trim().toUpperCase() === 'SUSPENDIDO',
    acumulado: acum,
    primeraVisita: suyas.length ? fechaEnPalabras_(suyas[0].fecha) : '',
    /* MINSA verifica esta pantalla cuando llega al establecimiento, así que
       los datos de la empresa y su código de formulario van dentro. */
    empresa: datosDoc_('miCliente'),
    hoy: fechaEnPalabras_(hoy) };
}

/* La dirección que se imprime en un QR SIEMPRE tiene que ser la publicada.
   getUrl() devuelve la dirección por la que entró quien está usando la app:
   si entró desde el editor, devuelve la /dev, que solo abre para quien puede
   editar el script. Un distintivo con /dev adentro funciona en la máquina de
   quien lo generó y en ninguna otra — y eso no se descubre hasta que el
   cliente escanea el adhesivo que ya está pegado en su pared. */
function urlPublica_() {
  return String(urlApp_() || '').replace(/\/dev(\?|$)/, '/exec$1');
}

/* ═══ Administración del distintivo (pestaña de Mercadeo) ═══ */
const COLS_DIST = ['distintivoEntregado', 'distintivoPor'];

function api_distintivos(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (['mercadeo','supervisor','gerente','admin'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin acceso a los distintivos.' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const h = ss.getSheetByName(HOJA_CLI);
  if (h) asegurarColumnas_(h, COLS_DIST);

  const lista = leerHoja_(HOJA_CLI).map(c => {
    const id = String(c.id || '').trim();
    if (!id) return null;
    const estado = String(c.estado || '').trim().toUpperCase();
    const situacion = String(c.situacion || '').trim().toLowerCase();
    return {
      id: id,
      nombre: String(c.nombre || '').trim(),
      razonSocial: String(c['razon social'] || ''),
      direccion: String(c.direccion || ''),
      region: String(c.region || ''),
      frecuencia: String(c.frecuencia || ''),
      estado: estado,
      activo: estado !== 'RETIRADO' && situacion.indexOf('retiro') < 0,
      contrato: String(c.contrato || ''),
      /* MINSA verifica esta fecha en el establecimiento: va impresa en la
         tarjeta, no solo detrás del QR. */
      inicioServicio: fechaEnPalabras_(fechaISO_(c['inicio recoleccion'])),
      entregado: fechaISO_(c.distintivoEntregado),
      entregadoPor: String(c.distintivoPor || ''),
      codigo: codigoCliente_(id)
    };
  }).filter(Boolean).filter(c => c.nombre);

  lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
  return { ok:true, usuario:u, hoy:hoyPanama_(), url: urlPublica_(),
           clientes: lista, empresa: datosDoc_('distintivo'),
           /* el distintivo sin fecha de inicio no le sirve al inspector */
           sinInicio: lista.filter(c => c.activo && !c.inicioServicio).length,
           pendientes: lista.filter(c => c.activo && !c.entregado).length };
}

function api_marcarDistintivo(pin, clienteId, entregado) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['mercadeo','supervisor','gerente','admin','operador'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin permiso.' };

  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_CLI);
    if (!h) return { ok:false, error:'No encuentro la hoja Clientes.' };
    asegurarColumnas_(h, COLS_DIST);

    const cab = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0].map(String);
    const cId = cab.indexOf('id');
    const cFe = cab.indexOf('distintivoEntregado');
    const cQu = cab.indexOf('distintivoPor');
    if (cId < 0) return { ok:false, error:'La hoja Clientes no tiene columna id.' };

    const ids = h.getRange(2, cId + 1, Math.max(h.getLastRow() - 1, 1), 1).getValues();
    const buscado = String(clienteId).trim();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() !== buscado) continue;
      const fila = i + 2;
      if (entregado === false) {
        if (cFe >= 0) h.getRange(fila, cFe + 1).setValue('');
        if (cQu >= 0) h.getRange(fila, cQu + 1).setValue('');
        return { ok:true, clienteId:buscado, entregado:'' };
      }
      const hoy = hoyPanama_();
      if (cFe >= 0) h.getRange(fila, cFe + 1).setValue(hoy);
      if (cQu >= 0) h.getRange(fila, cQu + 1).setValue(u.nombre);
      return { ok:true, clienteId:buscado, entregado:hoy, entregadoPor:u.nombre };
    }
    return { ok:false, error:'No encontré el cliente ' + buscado + '.' };
  } finally { lock.releaseLock(); }
}

/* ═══════════════════════════════════════════════════════════════════
   ESTADO DEL CLIENTE: SUSPENDER, DAR DE BAJA, REACTIVAR
   ───────────────────────────────────────────────────────────────────
   Dos cosas distintas que la gente confunde:

   SUSPENDIDO es temporal y casi siempre financiero. El cliente sigue
   siendo cliente, su contrato sigue vivo, deja de aparecer en rutas
   mientras dure. Se reactiva.

   DE BAJA es definitivo y factual: cerró, se mudó, se fue con otro.

   En los dos casos NO SE BORRA NADA. Los tres años de retención que
   pide Supervisor se cumplen solos porque esto es un cambio de estado, no
   una eliminación: el historial de recolecciones, actas y facturas
   queda intacto y consultable.
   ═══════════════════════════════════════════════════════════════════ */

const COLS_ESTADO_CLI = ['motivoEstado', 'fechaEstado', 'estadoPor'];

/* El vocabulario NO es nuevo: la columna 'situacion' ya existe y ya la lee
   el planificador (SITUACIONES_FUERA) para no sugerir a quien está fuera de
   servicio. Inventar aquí un segundo juego de palabras — ACTIVO, SUSPENDIDO,
   DE BAJA — habría dejado dos idiomas escribiendo en la misma columna y un
   cliente dado de baja seguiría apareciendo en las rutas. Se usa el que ya
   está.

   Y no se toca la columna 'estado': ese es el estado OPERATIVO que el
   sistema recalcula solo cada noche (AL DÍA, VENCIDO, ATRASADO). Escribirle
   encima le borraría a operaciones la información de la calle. */
const SITUACION_ACTIVO = 'activo';
function situacionValida_(s) {
  const v = String(s || '').trim().toLowerCase();
  return SITUACIONES.some(x => x[0] === v) ? v : '';
}
function situacionFuera_(s) {
  return SITUACIONES_FUERA.indexOf(String(s || '').trim().toLowerCase()) >= 0;
}

/* Suspender y dar de baja lo hace mercadeo — Mercadeo es quien habla con
   el cliente y quien se entera primero. Reactivar a quien está en mora NO:
   si el motivo fue que no paga, que lo autorice quien ve el dinero. */
function puedeCambiarEstadoCliente_(u) {
  return u && ['mercadeo','supervisor','gerente','admin'].indexOf(u.rol) >= 0;
}
function puedeReactivarMora_(u) {
  return u && ['supervisor','gerente','admin'].indexOf(u.rol) >= 0;
}

function api_cambiarEstadoCliente(pin, clienteId, nuevoEstado, motivo) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!puedeCambiarEstadoCliente_(u)) return { ok:false, error:'Sin permiso.' };

  const est = situacionValida_(nuevoEstado);
  if (!est) return { ok:false, error:'Situación no válida.' };
  const razon = String(motivo || '').trim();
  if (est !== SITUACION_ACTIVO && !razon)
    return { ok:false, error:'Escribe el motivo. Dentro de un año nadie va a recordar por qué.' };

  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_CLI);
    if (!h) return { ok:false, error:'No encuentro la hoja Clientes.' };
    asegurarColumnas_(h, COLS_ESTADO_CLI.concat(['situacion','motivo baja','fecha baja']));

    const cab = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0].map(String);
    const cId = cab.indexOf('id');
    if (cId < 0) return { ok:false, error:'La hoja Clientes no tiene columna id.' };

    const ids = h.getRange(2, cId + 1, Math.max(h.getLastRow() - 1, 1), 1).getValues();
    const buscado = String(clienteId).trim();

    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() !== buscado) continue;
      const fila = i + 2;
      const set  = (col, v) => { const c = cab.indexOf(col); if (c >= 0) h.getRange(fila, c + 1).setValue(v); };
      const leer = col => { const c = cab.indexOf(col); return c >= 0 ? String(h.getRange(fila, c + 1).getValue() || '') : ''; };

      const antes = String(leer('situacion') || SITUACION_ACTIVO).trim().toLowerCase();
      if (antes === est) return { ok:false, error:'El cliente ya está así. No hay nada que cambiar.' };

      /* a quien se suspendió por mora no lo reactiva quien lo suspendió */
      if (est === SITUACION_ACTIVO && antes === 'mora' && !puedeReactivarMora_(u))
        return { ok:false, error:'Este cliente salió de servicio por falta de pago. ' +
                 'La reactivación la autoriza supervisión o gerencia.' };

      const hoy = hoyPanama_();
      set('situacion',   est === SITUACION_ACTIVO ? '' : est);
      set('motivo baja', est === SITUACION_ACTIVO ? '' : razon);
      set('fecha baja',  est === SITUACION_ACTIVO ? '' : hoy);
      /* la bitácora sí se conserva aunque el cliente vuelva: es lo que
         responde "¿por qué se fue y cuándo volvió?" en una auditoría */
      set('motivoEstado', razon || ('Reactivado desde ' + antes));
      set('fechaEstado',  hoy);
      set('estadoPor',    u.nombre);

      /* La huella queda donde ya quedan las demás de la ficha: sellada en
         notas comerciales. Un solo lugar donde leer la historia del cliente.

         Nada se borra. Los tres años de retención se cumplen solos porque
         esto es un cambio de situación, no una eliminación: recolecciones,
         actas, certificados y facturas quedan intactos y consultables. */
      const cNot = cab.indexOf('notas comerciales');
      if (cNot >= 0) {
        const sello = '[' + hoy + ' ' +
          Utilities.formatDate(new Date(), 'America/Panama', 'HH:mm') + ' · ' + u.nombre +
          (est === SITUACION_ACTIVO
            ? ' reactivó al cliente (estaba en ' + antes + ')'
            : ' pasó al cliente a ' + est + ': ' + razon) + ']';
        const previo = String(h.getRange(fila, cNot + 1).getValue() || '');
        h.getRange(fila, cNot + 1).setValue((previo ? previo + ' ' : '') + sello);
      }

      marcar_('mercadeo');

      return { ok: true, clienteId:buscado, situacion:est, fuera:situacionFuera_(est),
               fecha:hoy, quien:u.nombre };
    }
    return { ok:false, error:'No encontré el cliente ' + buscado + '.' };
  } finally { lock.releaseLock(); }
}

/* ═══════════════════════════════════════════════════════════════════
   NOVEDADES Y DESTINATARIOS DE NOTIFICACIONES
   ───────────────────────────────────────────────────────────────────
   Dos cosas que hasta ahora no ocurrían solas:

   1. Un cliente llenaba su formulario un viernes a las seis y nadie se
      enteraba hasta el lunes, porque el aviso solo aparecía si mercadeo
      abría la pantalla. Ahora hay una consulta única que devuelve todo
      lo que espera atención, para pintarlo en un solo lugar.

   2. Una solicitud devuelta por logística escribía su motivo en la hoja
      Solicitudes — una hoja que mercadeo no abre nunca. El motivo se
      escribía para nadie. Ahora vuelve a quien tiene que corregirlo.

   Los destinatarios de correo viven en una hoja, no en el código: quién
   recibe qué cambia sin que nadie toque una línea.
   ═══════════════════════════════════════════════════════════════════ */

const HOJA_NOTIF  = 'Notificaciones';
const COLS_NOTIF  = ['evento', 'destinatarios', 'activo', 'notas'];

/* Los eventos que el sistema sabe anunciar. La hoja se siembra con estos;
   agregar uno nuevo aquí lo hace aparecer para que se le pongan correos. */
const EVENTOS_NOTIF = [
  ['cliente_a_cartera', 'Cliente nuevo pasa a cartera',
   'Ficha de facturación completa para contabilidad, cuando mercadeo cierra el contrato.'],
  ['solicitud_devuelta', 'Solicitud devuelta por logística',
   'Aviso a mercadeo con el motivo. Hoy se ve en pantalla; el correo es opcional.'],
  ['formulario_recibido', 'El cliente envió sus datos',
   'Hoy se ve en pantalla. Poner correos aquí solo si se quiere además por correo.']
];

function hojaNotif_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let h = ss.getSheetByName(HOJA_NOTIF);
  if (!h) h = crearHoja_(ss, HOJA_NOTIF, COLS_NOTIF);
  asegurarColumnas_(h, COLS_NOTIF);
  /* siembra los eventos que falten, sin tocar los correos ya escritos */
  const filas = leerHoja_(HOJA_NOTIF);
  const hay = filas.map(r => String(r.evento || '').trim());
  EVENTOS_NOTIF.forEach(e => {
    if (hay.indexOf(e[0]) < 0) h.appendRow([e[0], '', 'NO', e[2]]);
  });
  return h;
}

function api_notificaciones(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (['supervisor','gerente','admin'].indexOf(u.rol) < 0)
    return { ok:false, error:'Esta pantalla es de supervisión y gerencia.' };

  hojaNotif_();
  const filas = leerHoja_(HOJA_NOTIF);
  const lista = EVENTOS_NOTIF.map(e => {
    const r = filas.find(x => String(x.evento || '').trim() === e[0]) || {};
    return { evento:e[0], titulo:e[1], explica:e[2],
             destinatarios: String(r.destinatarios || '').trim(),
             activo: String(r.activo || '').trim().toUpperCase() === 'SI' };
  });
  return { ok:true, usuario:u, eventos:lista };
}

/* Un correo mal escrito no avisa a nadie y nadie se entera de que no avisó:
   se valida antes de guardar, no después de que falle el primer envío. */
function correosValidos_(txt) {
  const crudos = String(txt || '').split(/[,;\n]/).map(x => x.trim()).filter(Boolean);
  const buenos = [], malos = [];
  crudos.forEach(c => {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c)) buenos.push(c); else malos.push(c);
  });
  return { buenos: buenos, malos: malos };
}

function api_guardarNotificacion(pin, evento, destinatarios, activo) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['supervisor','gerente','admin'].indexOf(u.rol) < 0) return { ok:false, error:'Sin permiso.' };
  if (!EVENTOS_NOTIF.some(e => e[0] === String(evento).trim()))
    return { ok:false, error:'Ese evento no existe.' };

  const v = correosValidos_(destinatarios);
  if (v.malos.length)
    return { ok:false, error:'Esto no parece un correo: ' + v.malos.join(', ') };
  if (activo && !v.buenos.length)
    return { ok:false, error:'No puedes activar el aviso sin un correo a quién mandarlo.' };

  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const h = hojaNotif_();
    const vals = h.getDataRange().getValues();
    const cab = vals[0].map(String);
    const cEv = cab.indexOf('evento');
    for (let i = 1; i < vals.length; i++) {
      if (String(vals[i][cEv]).trim() !== String(evento).trim()) continue;
      h.getRange(i + 1, cab.indexOf('destinatarios') + 1).setValue(v.buenos.join(', '));
      h.getRange(i + 1, cab.indexOf('activo') + 1).setValue(activo ? 'SI' : 'NO');
      return { ok:true, destinatarios: v.buenos, activo: !!activo };
    }
    return { ok:false, error:'No encontré ese evento en la hoja.' };
  } finally { lock.releaseLock(); }
}

/* Todo lo que espera atención de mercadeo, en una sola consulta. Se llama
   cada pocos minutos, así que no hace escrituras ni cálculos pesados. */
function api_novedades(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (['mercadeo','supervisor','gerente','admin'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin permiso.' };

  const pros = leerHoja_(HOJA_PRO);
  const items = [];

  /* el cliente mandó sus datos y todavía no tiene propuesta */
  const yaAvanzados = ['Propuesta enviada','En negociación','Contrato en proceso',
                       'Firmado','Pasado a cartera','Rechazado'];
  pros.forEach(p => {
    if (String(p['formulario estado'] || '').trim().toUpperCase() !== 'RECIBIDO') return;
    if (yaAvanzados.indexOf(String(p.estado || '').trim()) >= 0) return;
    /* ya lo descartó a mano: descartar tiene que quedar escrito donde vive el
       dato, o vuelve en cuanto alguien recargue la página */
    if (String(p.formularioVisto || '').trim()) return;
    items.push({
      tipo: 'formulario',
      clave: 'form:' + String(p.codigoPropuesta || ''),
      codigoPropuesta: String(p.codigoPropuesta || ''),
      titulo: String(p.empresa || 'Sin nombre'),
      detalle: 'Envió sus datos',
      cuando: String(p['formulario recibido'] || '')
    });
  });

  /* logística devolvió la solicitud: el motivo tiene que llegarle a quien
     puede corregirlo, no quedarse en una hoja que mercadeo no abre */
  const porEmpresa = {};
  pros.forEach(p => {
    const n = String(p.empresa || '').trim().toUpperCase();
    if (n && !porEmpresa[n]) porEmpresa[n] = String(p.codigoPropuesta || '');
  });
  leerHoja_(HOJA_SOL).forEach(sx => {
    if (String(sx.estado || '').trim().toUpperCase() !== 'DEVUELTA') return;
    /* Ya la atendió alguien. La solicitud sigue DEVUELTA en la hoja hasta que
       se corrija y se reenvíe, así que sin esta marca el aviso volvería en
       cada consulta y en cada recarga, para siempre. */
    if (String(sx.vistaEn || '').trim()) return;
    const emp = String(sx.empresa || '').trim();
    items.push({
      tipo: 'devuelta',
      clave: 'dev:' + String(sx.solicitudId || ''),
      codigoPropuesta: porEmpresa[emp.toUpperCase()] || '',
      titulo: emp || 'Sin nombre',
      detalle: String(sx.motivo || 'Sin motivo anotado'),
      quien: String(sx.procesadaPor || ''),
      cuando: fechaISO_(sx.procesadaEn)
    });
  });

  items.sort((a, b) => String(b.cuando || '').localeCompare(String(a.cuando || '')));

  /* Lo que dejaron los asistentes en Pendientes entra a la misma pastilla.
     Va DESPUÉS de ordenar por fecha y ordenado por prioridad, porque un
     contrato vencido importa más que uno recibido esta mañana. */
  const orden = { alta:0, media:1, baja:2 };
  const pend = leerHoja_(HOJA_PEND)
    .filter(p => String(p.pendienteId || '').trim())
    .filter(p => String(p.modulo || '').trim().toLowerCase() === 'mercadeo')
    .filter(p => ESTADOS_CERRADOS.indexOf(String(p.estado || 'nuevo')) < 0)
    /* un pospuesto sigue abierto en la hoja —por eso el vigía no lo
       duplica— pero no se muestra hasta que llegue su día */
    .filter(p => !(String(p.estado) === 'pospuesto' &&
                   fechaISO_(p.recordarEn) && fechaISO_(p.recordarEn) > hoyPanama_()))
    .sort((a, b) =>
      (orden[String(a.prioridad)] === undefined ? 1 : orden[String(a.prioridad)]) -
      (orden[String(b.prioridad)] === undefined ? 1 : orden[String(b.prioridad)]))
    .map(p => ({
      tipo: 'pendiente',
      clave: 'pen:' + String(p.pendienteId || ''),
      codigoPropuesta: '',
      /* a dónde lleva la tarjeta. Sin esto el aviso decía qué pasaba y
         dejaba a quien lo leía buscando el cliente a mano: la bandeja
         era un tablero de avisos, no una herramienta. */
      enlace: String(p.enlace || ''),
      pendienteId: String(p.pendienteId || ''),
      estadoPend: String(p.estado || 'nuevo'),
      titulo: String(p.titulo || ''),
      detalle: String(p.descripcion || ''),
      prioridad: String(p.prioridad || 'media'),
      quien: String(p.asistente || ''),
      cuando: fechaISO_(p.fecha)
    }));

  return { ok:true, hoy: hoyPanama_(),
           novedades: pend.concat(items), total: pend.length + items.length,
           marca: marcaDe_('mercadeo') };
}

const COLS_SOL_VISTA = ['vistaPor', 'vistaEn'];

/* Apagar una novedad tiene que quedar escrito donde vive el dato, no en la
   memoria del navegador: si vive en el navegador, vuelve al recargar y le
   vuelve a aparecer a la otra persona. */
function api_marcarNovedadVista(pin, clave) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['mercadeo','supervisor','gerente','admin'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin permiso.' };

  const k = String(clave || '');
  const sello = hoyPanama_() + ' ' +
    Utilities.formatDate(new Date(), 'America/Panama', 'HH:mm') + ' · ' + u.nombre;

  /* El aviso del formulario se descarta sobre la fila del prospecto. Si el
     cliente vuelve a enviar sus datos, api_recibirFormulario limpia la marca
     y el aviso reaparece: es un envío nuevo y merece avisar otra vez. */
  if (k.indexOf('form:') === 0) {
    const cod = k.slice(5).trim();
    if (!cod) return { ok:false, error:'Novedad sin identificar.' };
    const r = api_guardarProspecto(pin, cod, { formularioVisto: sello });
    return r && r.ok ? { ok:true, codigoPropuesta:cod, quien:u.nombre } : r;
  }

  /* Quitar de la vista lo que dejó un asistente es POSPONERLO, no
     descartarlo. La diferencia importa: descartado no vuelve nunca, y la
     ✕ es la salida fácil para una tarjeta incómoda. Alguien que quita
     «a este cliente le falta el RUC» porque ahora no puede atenderlo no
     está diciendo que no haya que hacerlo — y sin embargo el sistema
     dejaba de mencionárselo para siempre.

     Vuelve mañana. Para decir «esto no es un problema», está el botón de
     No aplica, que sí descarta a conciencia. */
  if (k.indexOf('pen:') === 0) {
    const idp = k.slice(4).trim();
    if (!idp) return { ok:false, error:'Novedad sin identificar.' };
    return api_cerrarPendiente(pin, idp, 'pospuesto', 'Pospuesto desde la bandeja', 1);
  }
  if (k.indexOf('noaplica:') === 0) {
    const idn = k.slice(9).trim();
    if (!idn) return { ok:false, error:'Novedad sin identificar.' };
    return api_cerrarPendiente(pin, idn, 'descartado', 'Marcado «no aplica» desde la bandeja');
  }
  if (k.indexOf('hecho:') === 0) {
    const idh = k.slice(6).trim();
    if (!idh) return { ok:false, error:'Novedad sin identificar.' };
    return api_cerrarPendiente(pin, idh, 'resuelto', 'Atendido desde la bandeja');
  }

  if (k.indexOf('dev:') !== 0) return { ok:true, nada:true };
  const id = k.slice(4).trim();
  if (!id) return { ok:false, error:'Novedad sin identificar.' };

  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_SOL);
    if (!h) return { ok:false, error:'No encuentro la hoja Solicitudes.' };
    asegurarColumnas_(h, COLS_SOL_VISTA);

    const vals = h.getDataRange().getValues();
    const cab = vals[0].map(String);
    const cId = cab.indexOf('solicitudId');
    for (let i = 1; i < vals.length; i++) {
      if (String(vals[i][cId]).trim() !== id) continue;
      h.getRange(i + 1, cab.indexOf('vistaPor') + 1).setValue(u.nombre);
      h.getRange(i + 1, cab.indexOf('vistaEn') + 1).setValue(hoyPanama_() + ' ' +
        Utilities.formatDate(new Date(), 'America/Panama', 'HH:mm'));
      return { ok:true, solicitudId:id, quien:u.nombre };
    }
    return { ok:false, error:'No encontré la solicitud ' + id + '.' };
  } finally { lock.releaseLock(); }
}

/* Si logística la vuelve a devolver después de una corrección, la marca se
   limpia: es una devolución nueva y tiene que avisar otra vez. */
function limpiarVistaSolicitud_(h, cab, fila) {
  const cP = cab.indexOf('vistaPor'), cE = cab.indexOf('vistaEn');
  if (cP >= 0) h.getRange(fila, cP + 1).setValue('');
  if (cE >= 0) h.getRange(fila, cE + 1).setValue('');
}


/* ═══════════════════════════════════════════════════════════════════
   MARCADORES · el sondeo barato
   ───────────────────────────────────────────────────────────────────
   Esto se queda en Codigo.gs a propósito: las llaman las funciones de
   aquí mismo, cada vez que alguien escribe un dato. El resto de los
   asistentes vive en Asistentes.gs.

   Una fila por módulo con la hora de su último cambio. El navegador
   pregunta por esa celda —servida desde CacheService— y solo pide la
   lista completa si cambió. Un marcador POR MÓDULO: cobros no se
   despierta porque un operador cerró una recolección en campo.

   MODULOS_ASIST y la hoja se declaran en Asistentes.gs. Comparten el
   ámbito global de Apps Script, así que se ven desde aquí; se leen
   dentro de funciones, en tiempo de ejecución, que es la condición
   para que el orden de carga entre archivos no importe.
   ═══════════════════════════════════════════════════════════════════ */

/* ── Marcadores ──────────────────────────────────────────────────────
   La hoja es pasiva: sin fórmulas, solo el código escribe. Encima va
   CacheService para que la lectura ni siquiera toque la hoja.

   marcar_() nunca debe tumbar la operación que la llamó: si falla,
   el peor caso es que una pantalla tarde un poco más en enterarse.

   OJO al leer: dentro de api_guardarFicha y de api_guardarDatosFormularioCliente
   existe una función LOCAL llamada `marcar` —sin guion bajo— que escribe una
   celda del prospecto. No es esta. El guion bajo distingue. */
/* La marca lleva un contador además de la hora, por lo mismo que el id de
   un pendiente: `getTime()` tiene resolución de milisegundo, y dos cambios
   dentro del mismo milisegundo darían la misma marca. El navegador
   compararía «igual» y no se enteraría del segundo. Es improbable con
   acciones de una persona, pero la marca es justamente lo que decide si se
   pide o no se pide: si falla, falla en silencio. */
var _SEQ_MARCA = 0;

function marcar_(modulo) {
  const m = String(modulo || '').trim().toLowerCase();
  if (MODULOS_ASIST.indexOf(m) < 0) return;
  _SEQ_MARCA++;
  const sello = String(new Date().getTime()) + '.' + _SEQ_MARCA;
  try { CacheService.getScriptCache().put('marca_' + m, sello, 21600); } catch (e) {}
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let h = ss.getSheetByName(HOJA_MARCAS);
    if (!h) h = crearHoja_(ss, HOJA_MARCAS, COLS_MARCAS);
    const vals = h.getDataRange().getValues();
    for (let i = 1; i < vals.length; i++) {
      if (String(vals[i][0]).trim().toLowerCase() === m) {
        h.getRange(i + 1, 2).setValue(sello); return;
      }
    }
    h.appendRow([m, sello]);
  } catch (e) { /* que no se caiga lo que estaba haciendo el usuario */ }
}

function marcaDe_(modulo) {
  const m = String(modulo || '').trim().toLowerCase();
  try {
    const c = CacheService.getScriptCache().get('marca_' + m);
    if (c) return c;
  } catch (e) {}
  const f = leerHoja_(HOJA_MARCAS)
    .filter(r => String(r.modulo || '').trim().toLowerCase() === m)[0];
  const v = f ? String(f.ultimaModificacion || '') : '';
  if (v) { try { CacheService.getScriptCache().put('marca_' + m, v, 21600); } catch (e) {} }
  return v;
}

/* ═══ La llamada barata ═══
   Esto es lo que pregunta el navegador cada pocos segundos. Devuelve una
   cadena. Si no cambió respecto a la que ya tenía, no pide nada más. */
function api_marcador(pin, modulo) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  return { ok:true, marca: marcaDe_(modulo) };
}


/* ═══════════════════════════════════════════════════════════════════
   EL CORREO A CONTABILIDAD, ESCRITO PERO NO ENVIADO
   ───────────────────────────────────────────────────────────────────
   El sistema NO manda el correo. Lo redacta y abre el programa de correo
   de quien está trabajando, con destinatarios y texto puestos, para que
   ella lo revise y lo mande desde su propia cuenta.

   Es mejor que mandarlo solo, por cuatro razones que no son técnicas:
   sale con su firma y su remitente de verdad; le queda en Enviados, que
   es donde ella lo va a buscar; puede agregar una línea antes de mandar;
   y el sistema nunca escribe en nombre de nadie sin que lo vea.

   Además evita pedirle a Google permiso para enviar correo, que es un
   permiso que este sistema no necesita tener.
   ═══════════════════════════════════════════════════════════════════ */

function destinatariosDe_(evento) {
  hojaNotif_();
  const r = leerHoja_(HOJA_NOTIF)
    .find(x => String(x.evento || '').trim() === String(evento).trim());
  if (!r) return [];
  if (String(r.activo || '').trim().toUpperCase() !== 'SI') return [];
  return correosValidos_(r.destinatarios).buenos;
}

/* Texto plano a propósito: es lo que cabe en un enlace mailto y lo que
   cualquier programa de correo abre igual. */
function textoCarteraContabilidad_(p) {
  const d = v => { const x = String(v == null ? '' : v).trim(); return x || '— por definir —'; };
  const num = v => { const n = Number(v); return isFinite(n) && n ? n.toFixed(2) : '— por definir —'; };
  const unica = esVisitaUnica_(p);

  const L = [];
  L.push('Buen día,');
  L.push('');
  L.push('Se firmó contrato con un cliente nuevo y pasa a cartera. Estos son sus datos');
  L.push('para el registro y la facturación:');
  L.push('');
  L.push('DATOS DE LA EMPRESA');
  L.push('  Nombre comercial .... ' + d(p.empresa));
  L.push('  Razón social ........ ' + d(p['razon social']));
  L.push('  RUC ................. ' + d(p.ruc) + (String(p.dv || '').trim() ? '  DV ' + p.dv : ''));
  L.push('  Dirección ........... ' + d(p.direccion));
  L.push('');
  L.push('CONTACTO');
  L.push('  Persona ............. ' + d(p.contacto) + (String(p.cargo || '').trim() ? ' · ' + p.cargo : ''));
  L.push('  Teléfono ............ ' + d(p.telefono || p.celular));
  L.push('  Correo para facturas  ' + d(p.correo));
  L.push('  Enviar por .......... ' + d(p['canal envio']));
  L.push('');
  L.push('SERVICIO Y TARIFAS');
  L.push('  Tipo de servicio .... ' + tipoServicioDe_(p));
  if (!unica) {
    L.push('  Frecuencia .......... ' + d(p.frecuencia));
    L.push('  Costo por visita .... B/. ' + num(p['costo visita']));
    L.push('  Kg incluidos ........ ' + d(p['kg plan']));
    L.push('  Kg adicional ........ B/. ' + num(p['tarifa kg adic']));
    L.push('  Visita adicional .... B/. ' + num(p['tarifa visita adic']));
  } else {
    L.push('  Trabajo ............. ' + d(p.descripcionTrabajo));
    L.push('  Cantidad estimada ... ' + d(p.cantidadEstimada));
    L.push('  Costo del servicio .. B/. ' + num(p['costo visita']));
  }
  L.push('  Facturación ......... ' + d(p.facturacion));
  L.push('  ¿Retiene ITBMS? ..... ' + d(p['retiene itbms']));
  L.push('');
  L.push('CONTRATO');
  if (!unica) {
    L.push('  N° de contrato ...... ' + d(p['n contrato']));
    L.push('  Fecha del contrato .. ' + d(fechaISO_(p['fecha contrato'])));
    L.push('  Plazo ............... ' + d(p['plazo contrato']) + ' meses');
    L.push('  Inicio del servicio . ' + d(fechaISO_(p['inicio recoleccion'])));
    L.push('  Vencimiento ......... ' + d(fechaISO_(p.vencimiento)));
  } else {
    L.push('  Sin contrato: es un servicio de una sola visita.');
    L.push('  Fecha tentativa ..... ' + d(fechaISO_(p.fechaTentativa)));
  }
  L.push('  N° de propuesta ..... ' + d(p.codigoPropuesta));
  L.push('');

  const faltan = [];
  if (!String(p['razon social'] || '').trim()) faltan.push('razón social');
  if (!String(p.ruc || '').trim()) faltan.push('RUC');
  if (!String(p.correo || '').trim()) faltan.push('correo');
  if (!String(p.facturacion || '').trim()) faltan.push('tipo de facturación');
  if (!String(p['retiene itbms'] || '').trim()) faltan.push('si retiene ITBMS');
  if (faltan.length) {
    L.push('PENDIENTE: falta ' + faltan.join(', ') + '. Lo completo y les aviso.');
    L.push('');
  }
  L.push('Quedo pendiente de cualquier duda.');
  return { texto: L.join('\n'), faltan: faltan };
}

/* Devuelve el correo listo para que la pantalla lo abra. No manda nada. */
function api_correoCartera(pin, codigoPropuesta) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido' };
  if (['mercadeo','supervisor','gerente','admin'].indexOf(u.rol) < 0)
    return { ok:false, error:'Sin permiso.' };

  const p = leerHoja_(HOJA_PRO)
    .find(x => String(x.codigoPropuesta || '').trim() === String(codigoPropuesta).trim());
  if (!p) return { ok:false, error:'No encontré ese prospecto.' };

  const cuerpo = textoCarteraContabilidad_(p);
  const para = destinatariosDe_('cliente_a_cartera');
  return { ok:true,
           para: para,
           sinDestinatarios: !para.length,
           asunto: 'Cliente nuevo a cartera · ' + String(p.empresa || '') +
                   ' · ' + String(p.codigoPropuesta || ''),
           cuerpo: cuerpo.texto,
           faltan: cuerpo.faltan,
           empresa: String(p.empresa || '') };
}


/* ═══ BIMENSUAL → BIMESTRAL ═══
   En español, *bimensual* es dos veces al mes y *bimestral* es cada dos
   meses. Lo que ECOVSA hace es cada dos meses, así que el dato estaba mal
   escrito. Se corre una vez desde el menú; se puede volver a correr sin
   riesgo — si no queda nada por cambiar, lo dice y no toca nada.

   El sistema entiende las dos palabras (DIAS_FRECUENCIA tiene ambas), así
   que nada se rompe entre que se pega el código y se corre esta función. */
function migrarBimestral() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const donde = [[HOJA_CLI, ['frecuencia']],
                 [HOJA_PRO, ['frecuencia', 'frecuencia estimada']]];
  let total = 0;
  const detalle = [];

  donde.forEach(par => {
    const h = ss.getSheetByName(par[0]);
    if (!h || h.getLastRow() < 2) return;
    const cab = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0].map(String);
    par[1].forEach(col => {
      const c = cab.indexOf(col);
      if (c < 0) return;
      const n = h.getLastRow() - 1;
      const rango = h.getRange(2, c + 1, n, 1);
      const vals = rango.getValues();
      let tocadas = 0;
      for (let i = 0; i < vals.length; i++) {
        const v = String(vals[i][0] || '');
        if (/bimensual/i.test(v)) {
          vals[i][0] = v.replace(/bimensual/gi, m =>
            m === m.toUpperCase() ? 'BIMESTRAL' : (m[0] === m[0].toUpperCase() ? 'Bimestral' : 'bimestral'));
          tocadas++;
        }
      }
      if (tocadas) { rango.setValues(vals); total += tocadas; detalle.push(par[0] + ' · ' + col + ': ' + tocadas); }
    });
  });

  SpreadsheetApp.getUi().alert(total
    ? 'Listo. Se corrigieron ' + total + ' celda(s):\n\n' + detalle.join('\n') +
      '\n\nEl sistema seguía entendiendo el término viejo, así que nada dejó de funcionar mientras tanto.'
    : 'No quedaba ninguna celda con BIMENSUAL. Nada que corregir.');
  return { total: total, detalle: detalle };
}

/* ═══════════════════════════════════════════════════════════════════
   INSPECCIÓN TÉCNICA PREVIA A LA COTIZACIÓN  ·  F-VEN-06
   ───────────────────────────────────────────────────────────────────
   La etapa que faltaba. Entre que el cliente manda sus datos y que
   mercadeo le pone precio, a veces ECOVSA va al sitio: verifica cuánto
   genera de verdad, dónde lo almacena, cómo se llega, y de paso le dice
   qué debe hacer y qué no puede entregar.

   Dos ideas ordenan todo lo que sigue.

   PRIMERA: la frecuencia la manda el más restrictivo entre lo que genera
   y lo que puede almacenar. Un cliente que genera poco pero solo tiene
   espacio para tres días no puede ser mensual, por muchos kilos que le
   sobren. Es la misma regla de dos relojes del plan de mantenimiento:
   salta el que llegue primero.

   SEGUNDA: medido no es declarado. Cada cantidad se guarda CON SU ORIGEN
   —pesado, contado, dicho por el cliente, factura anterior—, porque un
   kilo pesado y un kilo dicho no valen lo mismo para poner un precio. Si
   el cliente declaró 8 y se midieron 18, eso es lo más valioso de toda
   la visita, y hasta hoy se perdía.                                    */

const HOJA_INSP = 'Inspecciones';
const COLS_INSP = ['inspeccionId','codigoPropuesta','empresa','estado',
  'motivo','pedidaPor','pedidaEn','inspectorAsignado',
  'fechaVisita','atendio','atendioCargo','tipoEstablecimiento','sedes',
  'horarioEstablecimiento','ventanaDesde','ventanaHasta','entrega','entregaSuplente',
  'corrientes','generacion','declaradoCotizacion',
  'picos','proveedorAnterior',
  'tieneArea','areaDonde','areaExclusiva','cabenCantidad','cabenUnidad',
  'diasQueCaben','condiciones','recipientes','recipientesDe','refrigeracion',
  'tipoAcceso','dondeEstaciona','distanciaAcopio','minutosVisita','accesoNotas',
  'segregacion','hallazgos','indicaciones','noRecibimos','requiereCapacitacion',
  'frecuenciaRec','relojQueManda','diasPorGeneracion','kgPlanRec',
  'recipientesEntregar','tipoServicioRec','observaciones','fotos',
  'cerradaPor','cerradaEn','registradoEn'];

/* Los estados son tres y se leen solos: la pidieron, se está haciendo,
   se mandó a mercadeo. */
const INSP_ABIERTAS = ['PEDIDA','EN PROCESO'];

function crearHojaInspecciones() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  crearHoja_(ss, HOJA_INSP, COLS_INSP);
  asegurarColumnas_(ss.getSheetByName(HOJA_INSP), COLS_INSP);
  SpreadsheetApp.getUi().alert(
    'Hoja «Inspecciones» lista.\n\n' +
    'Mercadeo pide la inspección desde la ficha del prospecto; sale en el menú ' +
    'de Logística y se llena en el teléfono, en sitio.');
}

/* Quién hace inspecciones. Hoy Supervisor; el rol está abierto a supervisión
   y gerencia porque él mismo dijo que en su momento serán más personas, y
   una lista que hay que tocar cada vez que entra alguien no se toca. */
function puedeInspeccionar_(u) {
  return u && ['admin','supervisor','gerente'].indexOf(u.rol) >= 0;
}
function puedePedirInspeccion_(u) {
  return u && ['mercadeo','supervisor','gerente','admin'].indexOf(u.rol) >= 0;
}

function siguienteIdInspeccion_() {
  const anio = hoyPanama_().slice(2, 4);
  const previos = leerHoja_(HOJA_INSP)
    .map(r => String(r.inspeccionId || ''))
    .filter(c => c.indexOf('INS-' + anio + '-') === 0)
    .map(c => Number((c.split('-')[2] || '').replace(/\D/g, '')) || 0);
  const n = (previos.length ? Math.max.apply(null, previos) : 0) + 1;
  return 'INS-' + anio + '-' + ('00' + n).slice(-3);
}

/* ── Mercadeo la pide ─────────────────────────────────────────────────
   Desde la ficha del prospecto, con el motivo escrito. El motivo importa:
   quien va a la visita necesita saber qué fue lo que no cuadró. */
function api_pedirInspeccion(pin, codigoPropuesta, motivo) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!puedePedirInspeccion_(u)) return { ok:false, error:'Sin permiso.' };

  const cod = String(codigoPropuesta || '').trim();
  if (!cod) return { ok:false, error:'Falta el código de la propuesta.' };
  const razon = String(motivo || '').trim();
  if (!razon) return { ok:false, error:'Escribe para qué es la inspección.' };

  const p = leerHoja_(HOJA_PRO).find(r =>
    String(r.codigoPropuesta || '').trim() === cod);
  if (!p) return { ok:false, error:'No encontré ese prospecto.' };

  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); }
  catch (e) { return { ok:false, error:'Se está pidiendo en este momento. Espera un segundo.' }; }
  try {
    /* Una abierta por prospecto. Dos inspecciones vivas del mismo cliente
       no son dos visitas: son el botón pulsado dos veces. */
    const viva = leerHoja_(HOJA_INSP).find(x =>
      String(x.codigoPropuesta || '').trim() === cod &&
      INSP_ABIERTAS.indexOf(String(x.estado || '').trim().toUpperCase()) >= 0);
    if (viva) return { ok:false, yaPedida:true,
      inspeccionId: String(viva.inspeccionId || ''),
      error:'Ya hay una inspección pedida para este prospecto desde el ' +
            (fechaISO_(viva.pedidaEn) || 'hace días') + '.' };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let h = ss.getSheetByName(HOJA_INSP);
    if (!h) h = crearHoja_(ss, HOJA_INSP, COLS_INSP);
    asegurarColumnas_(h, COLS_INSP);

    const id = siguienteIdInspeccion_();
    const fila = {
      inspeccionId: id, codigoPropuesta: cod, empresa: String(p.empresa || ''),
      estado: 'PEDIDA', motivo: razon,
      pedidaPor: u.nombre, pedidaEn: hoyPanama_(),
      /* lo que el cliente declaró al cotizar viaja con la inspección: es
         contra eso que se compara lo que se mida en sitio */
      declaradoCotizacion: String(p['kg estimado'] || '') +
        (p['base del kg'] ? ' ' + String(p['base del kg']) : ''),
      registradoEn: new Date()
    };
    h.appendRow(filaPorNombre_(h, fila));
    marcar_('logistica');
    return { ok:true, inspeccionId: id };
  } finally { lock.releaseLock(); }
}

/* ── Lo que logística tiene por inspeccionar ──────────────────────── */
function api_inspecciones(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!puedeInspeccionar_(u)) return { ok:false, error:'Las inspecciones son de supervisión.' };

  const hoy = hoyPanama_();
  const pros = leerHoja_(HOJA_PRO);
  const pendientes = leerHoja_(HOJA_INSP)
    .filter(r => INSP_ABIERTAS.indexOf(String(r.estado || '').trim().toUpperCase()) >= 0)
    .map(r => {
      const p = pros.find(x =>
        String(x.codigoPropuesta || '').trim() === String(r.codigoPropuesta || '').trim()) || {};
      const f = fechaISO_(r.pedidaEn);
      return {
        inspeccionId: String(r.inspeccionId || ''),
        codigoPropuesta: String(r.codigoPropuesta || ''),
        empresa: String(r.empresa || p.empresa || ''),
        estado: String(r.estado || '').toUpperCase(),
        motivo: String(r.motivo || ''),
        pedidaPor: String(r.pedidaPor || ''), pedidaEn: f,
        diasEsperando: f
          ? Math.round((new Date(hoy + 'T00:00:00') - new Date(f + 'T00:00:00')) / 86400000) : 0,
        /* de la ficha comercial, solo lo que hace falta para llegar y llamar */
        direccion: String(p.direccion || ''), zona: String(p.zona || ''),
        provincia: String(p.provincia || ''),
        contacto: String(p.contacto || ''), celular: String(p.celular || ''),
        telefono: String(p.telefono || ''),
        declarado: String(r.declaradoCotizacion || ''),
        actividad: String(p.actividad || ''), tipoResiduo: String(p['tipo residuo'] || '')
      };
    })
    .sort((a, b) => b.diasEsperando - a.diasEsperando);

  return { ok:true, usuario:u, hoy:hoy, pendientes:pendientes,
           total: pendientes.length,
           masVieja: pendientes.length ? pendientes[0].diasEsperando : 0,
           frecuencias: FRECUENCIAS_BASE.slice(),
           corrientes: CORRIENTES_INSP.slice(),
           condiciones: CONDICIONES_INSP.slice(),
           hallazgos: HALLAZGOS_INSP.slice(),
           accesos: ACCESOS_INSP.slice(),
           origenes: ORIGENES_INSP.slice() };
}

/* Los catálogos de la inspección, en un solo sitio: la pantalla los pinta
   y el reporte los vuelve a leer, así que si viven en dos lados algún día
   dicen cosas distintas. */
const CORRIENTES_INSP = ['Biológico-infeccioso','Punzocortante','Anatomopatológico',
                         'Farmacéutico','Químico'];
const ORIGENES_INSP = ['Pesado aquí','Contado','Lo dijo el cliente','Factura anterior'];
const CONDICIONES_INSP = ['Techado y con piso lavable','Ventilado',
  'Señalizado con el símbolo de riesgo biológico','Acceso restringido (con llave)',
  'Lejos de pacientes, alimentos y público'];
const HALLAZGOS_INSP = ['Mezcla residuo común con el biológico','Bolsas sin rotular',
  'Punzocortantes en bolsa, fuera del guardián','Guardianes desbordados',
  'Almacenamiento fuera del área'];
const ACCESOS_INSP = ['Calle','PH con administración','Estacionamiento','Sótano'];

/* ── Una inspección completa ──────────────────────────────────────── */
function api_inspeccion(pin, inspeccionId) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!puedeInspeccionar_(u) && !puedePedirInspeccion_(u))
    return { ok:false, error:'Sin permiso.' };

  const id = String(inspeccionId || '').trim();
  const r = leerHoja_(HOJA_INSP).find(x =>
    String(x.inspeccionId || '').trim() === id);
  if (!r) return { ok:false, error:'No encontré esa inspección.' };

  const o = {};
  COLS_INSP.forEach(k => {
    let v = r[k];
    if (k.indexOf('fecha') === 0 || k === 'pedidaEn' || k === 'cerradaEn') v = fechaISO_(v);
    o[k] = (v === null || v === undefined) ? '' : String(v).trim();
  });
  /* generación y fotos viajan como texto JSON en la hoja: una columna por
     corriente habría sido seis columnas que casi siempre están vacías */
  o.generacionLista = jsonSeguro_(o.generacion, []);
  o.fotosLista = jsonSeguro_(o.fotos, []);

  const p = leerHoja_(HOJA_PRO).find(x =>
    String(x.codigoPropuesta || '').trim() === String(o.codigoPropuesta || '').trim()) || {};
  return { ok:true, usuario:u, hoy:hoyPanama_(), inspeccion:o,
           prospecto: { empresa:String(p.empresa || o.empresa || ''),
                        razonSocial:String(p['razon social'] || ''),
                        ruc:String(p.ruc || ''), direccion:String(p.direccion || ''),
                        zona:String(p.zona || ''), contacto:String(p.contacto || ''),
                        celular:String(p.celular || ''), correo:String(p.correo || '') },
           empresaDoc: datosDoc_('inspeccion') };
}

function jsonSeguro_(txt, porOmision) {
  const s = String(txt || '').trim();
  if (!s) return porOmision;
  try { const v = JSON.parse(s); return v === null ? porOmision : v; }
  catch (e) { return porOmision; }
}

/* ── El cálculo que decide la frecuencia ──────────────────────────────
   Dos relojes. El de generación: cuántos días tarda en llenar lo que cabe
   en una visita. El de almacenamiento: cuántos días de generación le
   caben en el área. Manda el menor, y la pantalla dice cuál fue — porque
   «dos veces por semana» sin la razón detrás no se puede defender ante el
   cliente ni negociar con él. */
function relojesInspeccion_(d) {
  const n = v => { const x = Number(String(v || '').replace(',', '.')); return isFinite(x) ? x : 0; };
  const porDia = n(d.generacionDiaria);
  const caben  = n(d.cabenCantidad);
  const porVisita = n(d.kgPlanRec);

  const diasGen = (porDia > 0 && porVisita > 0) ? porVisita / porDia : 0;
  const diasAlm = (porDia > 0 && caben > 0)     ? caben / porDia     : 0;

  let manda = '', dias = 0;
  if (diasGen && diasAlm) {
    manda = diasAlm <= diasGen ? 'almacenamiento' : 'generación';
    dias = Math.min(diasGen, diasAlm);
  } else if (diasGen) { manda = 'generación'; dias = diasGen; }
  else if (diasAlm)   { manda = 'almacenamiento'; dias = diasAlm; }

  return { diasPorGeneracion: Math.round(diasGen * 10) / 10,
           diasQueCaben: Math.round(diasAlm * 10) / 10,
           relojQueManda: manda, dias: Math.round(dias * 10) / 10 };
}

/* ── Guardar el avance, sin cerrar ────────────────────────────────────
   Una inspección se llena en sitio, con mala señal y el teléfono en una
   mano. Poder guardar a medias no es comodidad: es que no se pierda la
   visita entera por un timbre de celular. */
function api_guardarInspeccion(pin, inspeccionId, datos) {
  return escribirInspeccion_(pin, inspeccionId, datos, false);
}

/* ── Cerrarla y mandarla a mercadeo ──────────────────────────────── */
function api_enviarInspeccion(pin, inspeccionId, datos) {
  return escribirInspeccion_(pin, inspeccionId, datos, true);
}

function escribirInspeccion_(pin, inspeccionId, datos, cerrar) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!puedeInspeccionar_(u)) return { ok:false, error:'Las inspecciones son de supervisión.' };

  const id = String(inspeccionId || '').trim();
  if (!id) return { ok:false, error:'Falta el número de inspección.' };
  datos = datos || {};

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const h = ss.getSheetByName(HOJA_INSP);
    if (!h) return { ok:false, error:'No existe la hoja de inspecciones.' };
    asegurarColumnas_(h, COLS_INSP);

    const vals = h.getDataRange().getValues();
    const cab = vals[0].map(String);
    const cId = cab.indexOf('inspeccionId');
    let fila = -1;
    for (let i = 1; i < vals.length; i++)
      if (String(vals[i][cId]).trim() === id) { fila = i; break; }
    if (fila < 0) return { ok:false, error:'No encontré la inspección ' + id + '.' };

    const cEst = cab.indexOf('estado');
    const est = cEst >= 0 ? String(vals[fila][cEst]).trim().toUpperCase() : '';
    if (est === 'ENVIADA' && !datos.__reabrir)
      return { ok:false, error:'Esta inspección ya se mandó a mercadeo. ' +
               'Pídele a un supervisor que la reabra si hay un error.' };

    /* Al cerrar sí se exige lo mínimo. A media visita no: guardar algo
       incompleto es justamente para lo que sirve guardar. */
    if (cerrar) {
      const faltan = [];
      if (!String(datos.atendio || '').trim()) faltan.push('quién atendió');
      if (!String(datos.fechaVisita || '').trim()) faltan.push('la fecha de la visita');
      if (!String(datos.frecuenciaRec || '').trim()) faltan.push('la frecuencia recomendada');
      if (faltan.length)
        return { ok:false, error:'Antes de mandarla a mercadeo falta ' + faltan.join(', ') + '.' };
    }

    const rel = relojesInspeccion_(datos);
    const escribir = {};
    COLS_INSP.forEach(k => { if (datos[k] !== undefined) escribir[k] = datos[k]; });
    /* lo que viaja como lista se guarda en texto, y los relojes se
       recalculan aquí: si los mandara la pantalla, un día dirían otra cosa */
    if (datos.generacionLista !== undefined)
      escribir.generacion = JSON.stringify(datos.generacionLista);
    if (datos.fotosLista !== undefined)
      escribir.fotos = JSON.stringify(datos.fotosLista);
    escribir.diasQueCaben = rel.diasQueCaben;
    escribir.diasPorGeneracion = rel.diasPorGeneracion;
    escribir.relojQueManda = rel.relojQueManda;

    if (cerrar) {
      escribir.estado = 'ENVIADA';
      escribir.cerradaPor = u.nombre;
      escribir.cerradaEn = hoyPanama_();
    } else if (est === 'PEDIDA') {
      escribir.estado = 'EN PROCESO';
    }
    if (datos.__reabrir) { escribir.estado = 'EN PROCESO'; escribir.cerradaEn = ''; }

    Object.keys(escribir).forEach(k => {
      if (k === 'inspeccionId' || k === 'registradoEn') return;
      let c = cab.indexOf(k);
      if (c < 0) { c = cab.length; h.getRange(1, c + 1).setValue(k); cab.push(k); }
      h.getRange(fila + 1, c + 1).setValue(escribir[k]);
    });

    marcar_(cerrar ? 'mercadeo' : 'logistica');
    return { ok:true, inspeccionId:id, enviada: !!cerrar, relojes: rel };
  } finally { lock.releaseLock(); }
}

/* ── Lo que mercadeo ve en la ficha del prospecto ──────────────────────
   No se le escribe nada al prospecto por la espalda. La recomendación se
   muestra, y Mercadeo decide si la aplica: el precio lo pone ella. */
function api_inspeccionDeProspecto(pin, codigoPropuesta) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!puedePedirInspeccion_(u) && !puedeInspeccionar_(u))
    return { ok:false, error:'Sin permiso.' };

  const cod = String(codigoPropuesta || '').trim();
  const todas = leerHoja_(HOJA_INSP)
    .filter(r => String(r.codigoPropuesta || '').trim() === cod);
  if (!todas.length) return { ok:true, hay:false };

  const r = todas[todas.length - 1];
  const est = String(r.estado || '').trim().toUpperCase();
  return { ok:true, hay:true,
    inspeccionId: String(r.inspeccionId || ''), estado: est,
    motivo: String(r.motivo || ''),
    pedidaEn: fechaISO_(r.pedidaEn), pedidaPor: String(r.pedidaPor || ''),
    cerradaEn: fechaISO_(r.cerradaEn), cerradaPor: String(r.cerradaPor || ''),
    fechaVisita: fechaISO_(r.fechaVisita),
    lista: est === 'ENVIADA',
    /* la recomendación, para enseñarla y para el botón de aplicarla */
    frecuenciaRec: String(r.frecuenciaRec || ''),
    kgPlanRec: String(r.kgPlanRec || ''),
    tipoServicioRec: String(r.tipoServicioRec || ''),
    recipientesEntregar: String(r.recipientesEntregar || ''),
    relojQueManda: String(r.relojQueManda || ''),
    diasQueCaben: String(r.diasQueCaben || ''),
    diasPorGeneracion: String(r.diasPorGeneracion || ''),
    minutosVisita: String(r.minutosVisita || ''),
    declarado: String(r.declaradoCotizacion || ''),
    observaciones: String(r.observaciones || ''),
    indicaciones: String(r.indicaciones || '') };
}