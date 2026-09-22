/* ═══════════════════════════════════════════════════════════════════
   COBRANZA · el asistente que prepara los mensajes
   ═══════════════════════════════════════════════════════════════════

   Archivo nuevo, y esa es la mitad del punto: Codigo.gs tiene 8,400
   líneas y nada obliga a que crezca. Apps Script junta todos los .gs en
   UN SOLO ámbito, así que esto llama a leerHoja_ o a EMPRESA sin
   importar nada. Partir es orden, no arquitectura.

   LAS DOS REGLAS, otra vez, porque son las que muerden:

   1. NO repetir nombres entre archivos. Dos funciones con el mismo
      nombre en dos .gs se pisan EN SILENCIO — gana la que carga
      después. Por eso aquí todo lleva prefijo `cob_`, salvo las api_
      que las llama la pantalla por su nombre, y `fechaPanama_`, que
      escribe una fecha como se escribe en Panamá y la usan también los
      vigilantes: una sola implementación, no dos que se separan.

   2. Nada de leer una constante de otro archivo AL CARGAR. Dentro de
      una función, en tiempo de ejecución, no hay problema: para
      entonces ya cargó todo.

   ───────────────────────────────────────────────────────────────────
   QUÉ HACE Y QUÉ NO

   Prepara el mensaje. NO lo manda. La persona lo lee, lo corrige si
   quiere, y lo envía con su propio correo — así sale con su remitente,
   le queda en Enviados, y si algo está mal es porque ella lo leyó y lo
   dejó pasar, no porque una máquina lo soltó sola.

   Y la gestión se registra CUANDO ELLA CONFIRMA que lo mandó. La
   pantalla anterior la registraba al abrir la ventana de Outlook: si la
   cerraba sin enviar, en el panel igual quedaba escrito que se le había
   escrito al cliente. Eso ensucia el dato de «sin gestionar», que es
   justo uno de los cinco vigilantes de cobros.
   ═══════════════════════════════════════════════════════════════════ */

/* ═══ LAS PLANTILLAS VIVEN EN UNA HOJA ══════════════════════════════
   No en el código. La forma de pedir plata se ajusta con el tiempo, y
   cada ajuste no puede costar una pegada de código: quien escribe el
   mensaje es quien cobra, no quien programa.

   La hoja se siembra con nueve plantillas de arranque y de ahí en
   adelante manda la hoja. Si alguien la borra, el sistema sigue
   funcionando con las de arranque — un mensaje feo es mejor que una
   pantalla rota. */
const HOJA_PLANT = 'PlantillasMensajes';
const COLS_PLANT = ['clave','titulo','cartera','canal','motivo',
                    'desdeDias','hastaDias','asunto','cuerpo','activa','explica'];

/* `desdeDias` y `hastaDias` son días de MORA: negativo = todavía no vence.
   Vacío en `cartera` significa que sirve para las dos. */
const COB_PLANTILLAS_BASE = [

  /* ── ANTES DE VENCER ─────────────────────────────────────────────── */

  ['por_vencer', 'Aviso antes de vencer', 'recurrente', 'correo', 'saldo', -7, -1,
   'Su factura vence pronto · {empresa}',
   '{saludo}. Le saludamos de {empresa}.\n\n' +
   'Le escribimos para recordarle que tiene {cuantas} factura(s) próxima(s) a ' +
   'vencer, por un total de B/. {saldo}:\n\n' +
   '{detalle}\n\n' +
   'Si ya realizó el pago, por favor haga caso omiso y le agradecemos enviarnos ' +
   'el comprobante para actualizarlo.\n\n' +
   'Quedamos atentos.\n\n' +
   '{firma}',
   'SI',
   'Se manda ANTES del vencimiento. La mayoría de los atrasos son olvidos, y un ' +
   'aviso a tiempo evita tener que cobrar después.'],

  ['por_vencer_wa', 'Aviso antes de vencer', 'recurrente', 'whatsapp', 'saldo', -7, -1,
   '',
   '{saludo}. Le saludamos de {empresa}.\n' +
   'Le recordamos que tiene {cuantas} factura(s) próxima(s) a vencer por ' +
   'B/. {saldo}:\n{detalle}\n' +
   'Si ya lo pagó, haga caso omiso y le agradecemos enviarnos el comprobante.',
   'SI',
   'El mismo aviso, en el canal que sí se lee el mismo día.'],

  /* ── YA VENCIÓ: LA ESCALERA ──────────────────────────────────────── */

  ['recordatorio', 'Recordatorio amable', 'recurrente', 'correo', 'saldo', 1, 15,
   'Saldo pendiente · {empresa}',
   '{saludo}. Le saludamos de {empresa}.\n\n' +
   'Su cuenta presenta un saldo pendiente de B/. {saldo}, correspondiente a ' +
   '{cuantas} factura(s):\n\n' +
   '{detalle}\n\n' +
   'Si ya realizó el pago, por favor haga caso omiso y le agradecemos enviarnos ' +
   'el comprobante para actualizarlo.\n\n' +
   'Quedamos atentos.\n\n' +
   '{firma}',
   'SI',
   'Primeros quince días. Asume buena fe, que casi siempre es cierto. La línea ' +
   'del comprobante no es cortesía: resuelve el caso más incómodo, que es ' +
   'cobrarle a quien ya pagó.'],

  ['recordatorio_wa', 'Recordatorio amable', 'recurrente', 'whatsapp', 'saldo', 1, 15,
   '',
   '{saludo}. Le escribimos de {empresa}.\n' +
   'Su cuenta presenta un saldo pendiente de B/. {saldo}:\n{detalle}\n' +
   'Si ya realizó el pago, por favor haga caso omiso y le agradecemos enviarnos ' +
   'el comprobante para actualizarlo. Quedamos atentos.',
   'SI',
   'Corto. Un WhatsApp largo no se lee: con hasta tres facturas las nombra, y de ' +
   'ahí en adelante resume.'],

  ['segundo_aviso', 'Segundo aviso · pide fecha', 'recurrente', 'correo', 'saldo', 16, 45,
   'Segundo aviso · saldo pendiente {empresa}',
   '{saludo}. Le escribimos nuevamente de {empresa}.\n\n' +
   'Su cuenta tiene {cuantas} factura(s) pendiente(s) por un total de ' +
   'B/. {saldo}, la más antigua desde el {facturaVieja}:\n\n' +
   '{detalle}\n\n' +
   'Le agradecemos indicarnos una fecha estimada de pago para poder organizarnos ' +
   'de nuestro lado. Si hay algo que revisar en la factura, también estamos ' +
   'atentos.\n\n' +
   '{firma}',
   'SI',
   'Ya no se asume olvido: se pide una fecha concreta. Preguntar por la factura ' +
   'abre la puerta a que digan si hay un reclamo, que a veces es la razón real ' +
   'del atraso.'],

  ['segundo_aviso_wa', 'Segundo aviso · pide fecha', 'recurrente', 'whatsapp', 'saldo', 16, 45,
   '',
   '{saludo}. Le escribimos de {empresa}.\n' +
   'Su cuenta tiene {cuantas} factura(s) pendiente(s) por B/. {saldo}, la más ' +
   'antigua desde el {facturaVieja}.\n' +
   '¿Nos puede indicar una fecha estimada de pago? Si hay algo que revisar en la ' +
   'factura, también estamos atentos.',
   'SI',
   'La pregunta directa funciona mejor por WhatsApp que por correo: se contesta ' +
   'en una línea.'],

  ['firme', 'Se ofrece arreglo', 'recurrente', 'correo', 'saldo', 46, 90,
   'Saldo pendiente · {razon}',
   '{saludo}. Le saludamos de {empresa}.\n\n' +
   'Su cuenta tiene {cuantas} factura(s) pendiente(s) por un total de ' +
   'B/. {saldo}, la más antigua desde el {facturaVieja}:\n\n' +
   '{detalle}\n\n' +
   'Entendemos que a veces se acumula. Si le sirve, podemos ver juntos un ' +
   'arreglo de pago que se ajuste a su flujo.\n\n' +
   '¿Le parece si conversamos esta semana?\n\n' +
   '{firma}',
   'SI',
   'La frase que importa es «entendemos que a veces se acumula». Un cliente que ' +
   'se atrasa casi nunca es un cliente que no quiere pagar, y tratarlo como si lo ' +
   'fuera es como se pierde.'],

  ['firme_wa', 'Se ofrece arreglo', 'recurrente', 'whatsapp', 'saldo', 46, 90,
   '',
   '{saludo}. Le saludamos de {empresa}.\n' +
   'Su cuenta tiene {cuantas} factura(s) pendiente(s) por un total de B/. {saldo}, ' +
   'la más antigua desde el {facturaVieja}.\n' +
   'Entendemos que a veces se acumula. Si le sirve, podemos ver juntos un arreglo ' +
   'de pago que se ajuste a su flujo.\n' +
   '¿Le parece si conversamos esta semana?',
   'SI',
   'Igual que el correo. Terminar con una pregunta concreta —«¿esta semana?»— da ' +
   'algo fácil que contestar; «quedamos atentos» no.'],

  ['ultimo_aviso', 'Último aviso · antes de suspender', 'recurrente', 'correo', 'saldo', 91, 99999,
   'Situación de su cuenta · {razon}',
   '{saludo}. Le escribimos de {empresa}.\n\n' +
   'Su cuenta tiene {cuantas} factura(s) pendiente(s) por B/. {saldo}, la más ' +
   'antigua desde el {facturaVieja}:\n\n' +
   '{detalle}\n\n' +
   'Hemos intentado comunicarnos en varias ocasiones sin obtener respuesta. De no ' +
   'recibir el pago o una propuesta de pago en los próximos días, tendremos que ' +
   'suspender temporalmente la recolección hasta regularizar la cuenta.\n\n' +
   'Preferimos no llegar a eso. Seguimos disponibles para conversarlo.\n\n' +
   '{firma}',
   'SI',
   'Solo después de 90 días y de haber escrito antes. Anuncia una consecuencia ' +
   'REAL: no se amenaza con algo que no se va a hacer. Si se manda y no se ' +
   'suspende nada, el próximo último aviso no lo lee nadie.'],

  ['ultimo_aviso_wa', 'Último aviso · antes de suspender', 'recurrente', 'whatsapp', 'saldo', 91, 99999,
   '',
   '{saludo}. Le escribimos de {empresa}.\n' +
   'Su cuenta tiene {cuantas} factura(s) pendiente(s) por B/. {saldo}, la más ' +
   'antigua desde el {facturaVieja}. Hemos intentado comunicarnos varias veces ' +
   'sin respuesta.\n' +
   'De no recibir el pago o una propuesta en los próximos días, tendremos que ' +
   'suspender temporalmente la recolección. Preferimos no llegar a eso: ' +
   'seguimos disponibles para conversarlo.',
   'SI',
   'Por WhatsApp llega. Pero un anuncio de suspensión conviene mandarlo también ' +
   'por correo, que deja constancia.'],

  /* ── LA PROMESA QUE NO SE CUMPLIÓ ────────────────────────────────── */

  ['promesa_rota', 'Promesa incumplida', 'recurrente', 'correo', 'promesa', -99999, 99999,
   'Sobre el pago acordado · {razon}',
   '{saludo}. Le saludamos de {empresa}.\n\n' +
   'El {fechaPrometida} conversamos y quedamos en que el pago de ' +
   'B/. {prometido} se gestionaría en esa fecha. A hoy no lo hemos ' +
   'registrado.\n\n' +
   '{detalle}\n\n' +
   '¿Nos confirma si pudo hacerlo, o si prefiere que acordemos una nueva ' +
   'fecha?\n\n' +
   'Quedamos atentos.\n\n' +
   '{firma}',
   'SI',
   'Nombrar el compromiso —la fecha en que se conversó— sin reprochar. El sistema ' +
   'se acuerda por ella, y eso vale más que insistir cinco veces.'],

  ['promesa_rota_wa', 'Promesa incumplida', 'recurrente', 'whatsapp', 'promesa', -99999, 99999,
   '',
   '{saludo}. Le saludamos de {empresa}.\n' +
   'El {fechaPrometida} conversamos y quedamos en que el pago de B/. {prometido} ' +
   'se gestionaría en esa fecha.\n' +
   '¿Nos confirma si pudo hacerlo? Quedamos atentos.',
   'SI',
   'Tres líneas. Preguntar «¿pudo hacerlo?» abre la puerta a que digan qué pasó; ' +
   '«no hemos recibido su pago» la cierra.'],

  /* ── CUENTAS DE CONTRATO: OTRO OFICIO ────────────────────────────── */

  ['cuenta_tramite', 'Cuenta de contrato · seguimiento', 'contrato', 'correo', 'saldo', -99999, 99999,
   'Seguimiento a cuenta de cobro · {razon}',
   'Estimados señores:\n\n' +
   'Le escribimos de {empresa} para dar seguimiento a la(s) cuenta(s) de cobro ' +
   'presentada(s) por un total de B/. {saldo}:\n\n' +
   '{detalle}\n\n' +
   'Le agradecemos indicarnos en qué etapa del trámite se encuentra(n) y si ' +
   'requieren algún documento adicional de nuestra parte para continuar.\n\n' +
   'Quedamos atentos y a la orden para lo que necesiten.\n\n' +
   '{firma}',
   'SI',
   'A una entidad pública NO se le cobra: se le da seguimiento al expediente. Ahí ' +
   'el problema casi nunca es que no quieran pagar, es que falta un papel. ' +
   'Preguntar cuál lo destraba; reclamar lo entierra.'],

  ['cuenta_tramite_wa', 'Cuenta de contrato · seguimiento', 'contrato', 'whatsapp', 'saldo', -99999, 99999,
   '',
   'Buenos días. Le escribimos de {empresa} para dar seguimiento a la(s) ' +
   'cuenta(s) de cobro presentada(s) por B/. {saldo}.\n' +
   '¿Nos puede indicar en qué etapa del trámite va y si requieren algún documento ' +
   'adicional de nuestra parte? Quedamos a la orden.',
   'SI',
   'Se usa con la persona que lleva la cuenta, no con la institución. Por eso el ' +
   'saludo es neutro y la pregunta es operativa.']
];

/* El saludo: el nombre de la persona si lo hay, y la razón social si no.
   «Estimados INVERSIONES VALLE, S.A.» es como escribe un banco; «Buenos
   días, Ana» es como escribe alguien que quiere que le contesten. Si el
   contacto trae nombre y apellido se usa solo el nombre — repetir el
   apellido completo en cada saludo suena a citación. */
function cob_saludo_(d) {
  const c = String((d && d.contacto) || '').trim();
  if (!c) return 'Buenos días';           // sin nombre, se saluda y ya
  /* solo el nombre de pila: repetir el apellido completo en cada saludo
     suena a citación. Y se le quita el título, que en un mensaje de cobro
     pone distancia justo donde hace falta cercanía. */
  const partes = c.replace(/^(sr|sra|srta|dr|dra|lic|ing|licda)\.?\s+/i, '')
                  .split(/\s+/).filter(String);
  return 'Buenos días, ' + (partes[0] || c);
}

function crearHojaPlantillas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let h = ss.getSheetByName(HOJA_PLANT);
  let n = 0;
  if (!h) h = crearHoja_(ss, HOJA_PLANT, COLS_PLANT);
  else asegurarColumnas_(h, COLS_PLANT);

  /* se siembra solo lo que falte: no se pisa lo que alguien ya editó */
  const hay = leerHoja_(HOJA_PLANT).map(r => String(r.clave || '').trim());
  const cab = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0].map(String);
  COB_PLANTILLAS_BASE.forEach(p => {
    if (hay.indexOf(p[0]) >= 0) return;
    const fila = {};
    COLS_PLANT.forEach((c, i) => { fila[c] = p[i] !== undefined ? p[i] : ''; });
    h.appendRow(cab.map(c => (fila[c] !== undefined ? fila[c] : '')));
    n++;
  });
  SpreadsheetApp.getUi().alert(
    'Plantillas de mensajes al día. Se agregaron ' + n + '.\n\n' +
    'Puedes editar el asunto y el cuerpo directamente en la hoja "' + HOJA_PLANT + '". ' +
    'Los marcadores entre llaves los rellena el sistema:\n\n' +
    '{saludo} {razon} {cliente} {ruc} {saldo} {cuantas} {diasMora} {detalle}\n' +
    '{prometido} {fechaPrometida} {facturaVieja} {empresa} {hoy} {firma}\n\n' +
    '{saludo} es el saludo completo: «Buenos días, Ana» si la ficha tiene ' +
    'contacto, y «Buenos días» a secas si no. Nunca la razón social: saludar a ' +
    'una empresa por su nombre legal se lee como carta de banco.\n\n' +
    'Para apagar una plantilla sin borrarla, pon NO en la columna "activa".');
}

/* Lee las plantillas de la hoja. Si la hoja no existe o quedó vacía, se
   usan las de arranque: la pantalla tiene que seguir funcionando aunque
   alguien borre la hoja por error. */
function cob_plantillas_() {
  let filas = [];
  try {
    if (SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_PLANT))
      filas = leerHoja_(HOJA_PLANT);
  } catch (e) { filas = []; }

  if (!filas.length) {
    filas = COB_PLANTILLAS_BASE.map(p => {
      const o = {}; COLS_PLANT.forEach((c, i) => { o[c] = p[i]; }); return o;
    });
  }
  return filas
    .filter(p => String(p.clave || '').trim())
    .filter(p => String(p.activa || 'SI').trim().toUpperCase() !== 'NO')
    .map(p => ({
      clave: String(p.clave).trim(),
      titulo: String(p.titulo || p.clave),
      cartera: String(p.cartera || '').trim().toLowerCase(),
      canal: String(p.canal || 'correo').trim().toLowerCase(),
      motivo: String(p.motivo || 'saldo').trim().toLowerCase(),
      desde: p.desdeDias === '' || p.desdeDias === undefined ? -99999 : Number(p.desdeDias),
      hasta: p.hastaDias === '' || p.hastaDias === undefined ? 99999 : Number(p.hastaDias),
      asunto: String(p.asunto || ''),
      cuerpo: String(p.cuerpo || ''),
      explica: String(p.explica || '')
    }));
}

/* ═══ CUÁL PLANTILLA LE TOCA ════════════════════════════════════════
   Por cartera, por canal, por motivo y por días de mora. Se devuelven
   TODAS las que aplican, no solo la mejor: la primera es la sugerida y
   las demás quedan a la mano, porque quien cobra conoce al cliente y a
   veces sabe que con este conviene el tono suave aunque lleve 60 días.

   Una plantilla de cartera vacía sirve para las dos. */
function cob_candidatas_(deudor, canal, motivo) {
  const tipo = String((deudor && deudor.tipo) || 'recurrente').toLowerCase();
  const dias = Number((deudor && deudor.moraMax) || 0);
  const cn = String(canal || 'correo').toLowerCase();
  const mv = String(motivo || 'saldo').toLowerCase();

  const todas = cob_plantillas_().filter(p =>
    p.canal === cn && p.motivo === mv && (!p.cartera || p.cartera === tipo));

  /* ── EL LADO DEL VENCIMIENTO NO SE CRUZA ──────────────────────────
     Se ofrecen las otras plantillas a propósito: quien cobra conoce al
     cliente y a veces quiere bajar el tono aunque lleve dos meses. Pero
     bajar el tono y AFIRMAR ALGO FALSO son cosas distintas.

     Un aviso «su factura está próxima a vencer» sobre una factura que
     venció hace 235 días se contradice a sí mismo en la línea siguiente
     —el detalle dice la fecha real— y ese mensaje no se puede mandar.
     Pasó en la primera prueba en pantalla.

     Así que las plantillas del otro lado del vencimiento ni se ofrecen.
     Las demás sí: «recordatorio amable» a los 235 días es suave pero
     cierto, y esa decisión es de quien cobra. */
  const compatibles = todas.filter(p =>
    dias >= 0 ? p.hasta >= 0 : p.desde < 0);

  /* la que cubre los días va primero; las demás quedan como alternativa */
  const dentro = compatibles.filter(p => dias >= p.desde && dias <= p.hasta);
  const fuera  = compatibles.filter(p => dentro.indexOf(p) < 0);
  const orden  = dentro.concat(fuera);

  /* Si no queda ninguna dentro de rango —una escalera con un hueco, o
     alguien apagó la que tocaba— se usan las compatibles igual: mejor un
     mensaje de otro tramo que ninguno. Y si tampoco hay, se devuelve
     vacío y la pantalla lo dice. */
  return orden;
}

/* Las fechas salen de la hoja en ISO (2026-01-15) porque así ordenan
   bien. Pero eso es formato de máquina: al cliente se le escribe como
   se escribe una fecha en Panamá. Si el valor no es una fecha ISO se
   devuelve tal cual, para no romper un dato escrito a mano. */
function fechaPanama_(v) {
  const s = String(v || '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? m[3] + '/' + m[2] + '/' + m[1] : s;
}

/* ═══ EL DETALLE DE LAS FACTURAS ════════════════════════════════════
   Lo que hoy falta y es la razón de que un cliente no conteste: el
   mensaje decía «3 factura(s)» y lo dejaba a él buscando cuáles. Con
   número, fecha, monto y días vencida, puede verificar sin levantarse.

   En WhatsApp se resume: una lista de doce líneas en el teléfono no se
   lee, se cierra. */
function cob_detalle_(deudor, canal) {
  const det = (deudor && deudor.detalle) || [];
  const r2 = v => (Math.round((Number(v) || 0) * 100) / 100).toFixed(2);
  if (!det.length) return '';

  const abiertas = det.filter(f => Number(f.saldo) > 0.009)
                      .sort((a, b) => String(a.vencimiento || '').localeCompare(String(b.vencimiento || '')));
  if (!abiertas.length) return '';

  if (String(canal).toLowerCase() === 'whatsapp') {
    if (abiertas.length <= 3)
      return abiertas.map(f => '· Factura ' + f.factura + ': B/. ' + r2(f.saldo)).join('\n');
    return '· ' + abiertas.length + ' facturas, desde la ' + abiertas[0].factura +
           ' del ' + fechaPanama_(abiertas[0].fecha || '');
  }

  return abiertas.map(f =>
    '· Factura ' + f.factura +
    (f.fecha ? ' del ' + fechaPanama_(f.fecha) : '') +
    ' · B/. ' + r2(f.saldo) +
    (f.vencimiento ? ' · venció el ' + fechaPanama_(f.vencimiento) : '') +
    (Number(f.mora) > 0 ? ' (' + f.mora + ' días)' : '')
  ).join('\n');
}

/* La firma sale de EMPRESA, que es la única fuente de la identidad. Se
   lee DENTRO de la función, no al cargar: el orden entre archivos no
   está garantizado. */
function cob_firma_() {
  return EMPRESA.comercial + ' · ' + EMPRESA.razonSocial + '\n' +
         'Tel. ' + EMPRESA.telefono + ' · ' + EMPRESA.correo;
}

function cob_rellenar_(txt, d) {
  return String(txt || '').replace(/\{(\w+)\}/g, function (m, k) {
    return d[k] !== undefined && d[k] !== null ? String(d[k]) : '';
  });
}

/* ═══ ARMAR EL MENSAJE ══════════════════════════════════════════════ */
function cob_armar_(deudor, plantilla, canal, extra) {
  const r2 = v => (Math.round((Number(v) || 0) * 100) / 100).toFixed(2);
  const det = ((deudor && deudor.detalle) || []).filter(f => Number(f.saldo) > 0.009)
    .sort((a, b) => String(a.vencimiento || '').localeCompare(String(b.vencimiento || '')));

  const datos = {
    saludo: cob_saludo_(deudor),
    cliente: String(deudor.cliente || ''),
    razon: String(deudor.razon || deudor.cliente || ''),
    ruc: String(deudor.ruc || ''),
    saldo: r2(deudor.saldo),
    vencido: r2(deudor.vencido),
    cuantas: det.length || Number(deudor.facturas) || 0,
    diasMora: Number(deudor.moraMax) || 0,
    facturas: det.map(f => f.factura).join(', '),
    facturaVieja: det.length ? fechaPanama_(det[0].fecha || det[0].vencimiento || '') : '',
    detalle: cob_detalle_(deudor, canal),
    prometido: r2((extra && extra.prometido) || (deudor.gestion && deudor.gestion.prometido) || 0),
    fechaPrometida: fechaPanama_((extra && extra.fechaPrometida) ||
                           (deudor.gestion && deudor.gestion.fechaPrometida) || ''),
    hoy: fechaPanama_(hoyPanama_()),
    empresa: EMPRESA.comercial,
    firma: cob_firma_()
  };
  return {
    asunto: cob_rellenar_(plantilla.asunto, datos),
    cuerpo: cob_rellenar_(plantilla.cuerpo, datos)
  };
}

/* ═══ LO QUE PIDE LA PANTALLA ═══════════════════════════════════════
   Devuelve el mensaje sugerido Y las otras plantillas que aplican, para
   que quien cobra pueda cambiar de tono sin salir de la pantalla. */
function api_cob_mensaje(pin, clave, canal, plantillaClave, motivo) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!esCobros_(u)) return { ok:false, error:'Sin permiso.' };

  const mor = api_morosidad(pin);
  if (!mor.ok) return mor;

  const k = String(clave || '').trim().toUpperCase();
  const d = (mor.deudores || []).find(x =>
    String(x.ruc || '').trim().toUpperCase() === k ||
    String(x.cliente || '').trim().toUpperCase() === k);
  if (!d) return { ok:false, error:'No encontré a ese deudor. Puede que ya no deba nada.' };

  const cn = String(canal || 'correo').toLowerCase();
  const mv = String(motivo || 'saldo').toLowerCase();
  const cand = cob_candidatas_(d, cn, mv);
  if (!cand.length)
    return { ok:false, error:'No hay ninguna plantilla activa de ' + cn + ' para este caso. ' +
                             'Revisa la hoja ' + HOJA_PLANT + '.' };

  const elegida = (plantillaClave && cand.find(p => p.clave === plantillaClave)) || cand[0];

  /* ── TODOS LOS TONOS VIENEN ARMADOS DE UNA VEZ ────────────────────
     Cambiar de tono pedía el mensaje otra vez al servidor, y cada
     petición volvía a calcular la morosidad ENTERA: leer Facturas,
     Pagos, Clientes y Gestiones, cruzar los pagos con sus facturas y
     rearmar la lista de deudores. Todo eso para cambiar un texto sobre
     los mismos datos. Se notaba como lentitud al pulsar cada botón.

     Los datos del deudor son los mismos para todas las plantillas: lo
     único que cambia es el molde. Así que se rellenan las cinco de una
     vez y el cambio de tono deja de tocar el servidor. Son unos pocos
     kilobytes más en una respuesta que ya se estaba pidiendo. */
  const armadas = cand.map(p => {
    const m = cob_armar_(d, p, cn);
    return { clave:p.clave, titulo:p.titulo, desde:p.desde, hasta:p.hasta,
             explica:p.explica, asunto:m.asunto, cuerpo:m.cuerpo,
             /* dentro del tramo que le toca por días de mora. Las de fuera
                se ofrecen igual, pero marcadas: elegir otro tono es una
                decisión, no un descuido. */
             enRango: Number(d.moraMax||0) >= p.desde && Number(d.moraMax||0) <= p.hasta };
  });
  const sel = armadas.find(o => o.clave === elegida.clave) || armadas[0];

  return { ok:true, deudor:d, canal:cn,
           plantilla: sel.clave, titulo: sel.titulo, explica: sel.explica,
           asunto: sel.asunto, cuerpo: sel.cuerpo,
           correo: String(d.correo || ''), telefono: cob_telefono_(d),
           opciones: armadas };
}

/* El número tal como lo quiere WhatsApp: solo dígitos, con el 507 si es
   un celular panameño de ocho. Un número raro devuelve vacío en vez de
   armar un enlace que abre una conversación con quién sabe quién. */
function cob_telefono_(d) {
  let n = String(d.telefono || '').replace(/[^0-9]/g, '');
  if (!n) {
    const w = String(d.whatsapp || '');
    const m = /wa\.me\/(\d+)/.exec(w);
    n = m ? m[1] : w.replace(/[^0-9]/g, '');
  }
  if (!n) return '';
  if (n.length === 8) n = '507' + n;
  return (n.length >= 10 && n.length <= 13) ? n : '';
}

/* ═══ LA GESTIÓN SE REGISTRA CUANDO SE ENVIÓ ════════════════════════
   No cuando se abre la ventana. La pantalla anterior la registraba al
   abrir Outlook: si la persona cerraba sin mandar, en el panel igual
   quedaba escrito que se le había escrito al cliente. Ese dato falso
   alimenta al vigilante de «deuda sin gestionar», que entonces se
   calla sobre alguien a quien nadie ha contactado.

   Se guarda el TEXTO QUE SE MANDÓ, no la plantilla: si ella lo editó,
   lo que vale es lo que salió. */
function api_cob_registrarEnvio(pin, d) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!esCobros_(u)) return { ok:false, error:'Sin permiso.' };
  if (!d || !String(d.cliente || '').trim())
    return { ok:false, error:'Falta el cliente.' };

  return api_guardarGestion(pin, {
    fecha: '', cliente: d.cliente, 'razon social': d.razon || '', ruc: d.ruc || '',
    canal: d.canal || 'correo', saldo: Number(d.saldo) || 0,
    facturas: String(d.facturas || ''),
    mensaje: String(d.mensaje || '').slice(0, 900),
    seCompromete: !!d.seCompromete,
    montoPrometido: Number(d.montoPrometido) || 0,
    fechaPrometida: d.fechaPrometida || '',
    resultado: d.seCompromete ? 'PENDIENTE' : 'ENVIADO',
    notas: 'plantilla: ' + String(d.plantilla || 'editada a mano') +
           (String(d.mensaje || '') !== String(d.original || '') ? ' · editada antes de enviar' : '')
  });
}

/* El catálogo, para poder verlo y entender qué se está mandando sin
   abrir la hoja. Una plantilla que nadie sabe que existe es una
   plantilla que nadie usa. */
function api_cob_catalogo(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!esCobros_(u)) return { ok:false, error:'Sin permiso.' };
  return { ok:true, hoja: HOJA_PLANT, plantillas: cob_plantillas_() };
}

/* ═══════════════════════════════════════════════════════════════════
   LA PANTALLA DE DIRECCIÓN
   ═══════════════════════════════════════════════════════════════════

   Las otras pestañas de cobros contestan «¿cómo están las cosas hoy?».
   Ninguna contesta «¿vamos mejor o peor que antes?», que es la pregunta
   de quien dirige y no la de quien cobra. Esto calcula esa segunda.

   POR QUÉ VIVE AQUÍ Y NO EN api_cobros
   api_cobros manda al navegador SOLO las facturas y pagos del rango de
   fechas que se ve en pantalla. Para comparar meses hace falta el libro
   entero, y mandarlo entero al navegador sería mover miles de filas para
   que el navegador saque cuatro cifras. Se calculan aquí y viajan cuatro
   cifras.

   NADA DE ESTO SE GUARDA
   Todo se deriva de Facturas y Pagos en el momento. Una cifra guardada
   es una cifra que algún día no coincide con la hoja de donde salió.
   ═══════════════════════════════════════════════════════════════════ */

/* El saldo de una factura A UNA FECHA. No es lo mismo que su saldo de
   hoy: para saber cómo estaba la cartera hace dos meses hay que quitar
   los pagos que entraron después de esa fecha. Sin esto no hay
   comparación posible, solo la foto de hoy repetida. */
function cob_saldoAl_(neto, pagosDeFactura, fecha) {
  let pagado = 0;
  (pagosDeFactura || []).forEach(p => { if (p.fecha && p.fecha <= fecha) pagado += p.monto; });
  return Math.round((neto - pagado) * 100) / 100;
}

function cob_diasEntre_(a, b) {
  if (!a || !b) return 0;
  return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
}

/* aaaa-mm de una fecha ISO, y el mes n meses antes */
function cob_mesDe_(iso) { return String(iso || '').slice(0, 7); }
function cob_mesMenos_(mes, n) {
  const a = Number(String(mes).slice(0, 4)), m = Number(String(mes).slice(5, 7));
  const d = new Date(a, m - 1 - n, 1);
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
}
const COB_MESES = ['', 'Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function cob_mesEnPalabras_(mes) {
  const m = Number(String(mes).slice(5, 7));
  return (COB_MESES[m] || mes) + ' ' + String(mes).slice(0, 4);
}

/* Arma una sola vez lo que las cuatro medidas necesitan: cada factura con
   su neto esperado, su vencimiento y sus pagos al lado. Leer las dos hojas
   una vez y no cuatro es la diferencia entre una pantalla que abre y una
   que se queda pensando. */
function cob_libro_() {
  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;

  const pagos = leerHoja_(HOJA_PAG).map(p => ({
    factura: String(p.factura || '').trim(),
    fecha: fechaISO_(p.fecha),
    monto: r2(p.monto)
  })).filter(p => p.factura && p.fecha);

  const porFac = {};
  pagos.forEach(p => { (porFac[p.factura] = porFac[p.factura] || []).push(p); });

  const facturas = leerHoja_(HOJA_FAC).map(f => {
    const num = String(f.factura || '').trim();
    if (!num) return null;
    const total = r2(f.total) || r2(Number(f.monto) + Number(f.itbms));
    return {
      factura: num, fecha: fechaISO_(f.fecha),
      cliente: String(f.cliente || ''), razon: String(f['razon social'] || ''),
      ruc: String(f.ruc || '').trim(),
      total: total,
      /* el neto, no el total: a un agente retenedor no se le puede
         reclamar el ITBMS que él entera al fisco */
      neto: netoEsperado_(f, total),
      vencimiento: vencimientoDe_(f),
      pagos: porFac[num] || []
    };
  }).filter(Boolean);

  return { facturas: facturas, pagos: pagos };
}

/* ── 1 · CUÁNTOS DÍAS TARDAMOS EN COBRAR ─────────────────────────────
   Promedio ponderado por monto entre la fecha de la factura y la fecha
   del pago. Ponderado y no simple: una factura de B/. 5,000 que tardó
   90 días pesa en el flujo mucho más que una de B/. 50 que tardó 5, y
   un promedio simple las cuenta igual.

   Se mide sobre los pagos de una ventana de días, y se compara contra
   la ventana anterior. Así el número dice si esto va empeorando, que es
   lo único que uno hace con él. */
function cob_diasEnCobrar_(libro, hoy, ventana) {
  const dias = Number(ventana) || 90;
  const fechaF = {};
  libro.facturas.forEach(f => { fechaF[f.factura] = f.fecha; });

  const corte1 = cob_sumarDias_(hoy, -dias);
  const corte2 = cob_sumarDias_(hoy, -dias * 2);

  let mA = 0, pA = 0, nA = 0, mB = 0, pB = 0, nB = 0;
  libro.pagos.forEach(p => {
    const ff = fechaF[p.factura];
    if (!ff || p.monto <= 0) return;
    const d = cob_diasEntre_(ff, p.fecha);
    if (d < 0) return;                       // un pago anterior a su factura no mide nada
    if (p.fecha > corte1 && p.fecha <= hoy) { mA += p.monto * d; pA += p.monto; nA++; }
    else if (p.fecha > corte2 && p.fecha <= corte1) { mB += p.monto * d; pB += p.monto; nB++; }
  });

  return {
    dias:  pA > 0 ? Math.round(mA / pA) : 0,
    antes: pB > 0 ? Math.round(mB / pB) : 0,
    pagos: nA, pagosAntes: nB, ventana: dias,
    /* sin muestra suficiente no se enseña una comparación: dos pagos no
       son una tendencia, y un número que baila asusta sin motivo */
    comparable: nA >= 5 && nB >= 5
  };
}

function cob_sumarDias_(iso, n) {
  const d = new Date(String(iso) + 'T12:00:00');   // mediodía: la zona no mueve el día
  if (isNaN(d.getTime())) return String(iso);
  d.setDate(d.getDate() + Number(n || 0));
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) +
         '-' + ('0' + d.getDate()).slice(-2);
}

/* ── 2 · DE CADA MES FACTURADO, CUÁNTO YA ENTRÓ ──────────────────────
   La curva. Se agrupa por el mes de la FACTURA, no por el del pago: la
   pregunta es qué tan rápido se cobra lo de cada mes, y para eso el pago
   tiene que contarse contra el mes que lo generó aunque entre medio año
   después.

   El mes en curso se compara contra el anterior AL MISMO DÍA. Comparar
   un mes a la mitad contra uno cerrado da alarma todos los meses. */
function cob_curva_(libro, hoy, cuantos) {
  const n = Number(cuantos) || 6;
  const mesHoy = cob_mesDe_(hoy);
  const dia = Number(String(hoy).slice(8, 10));

  const meses = [];
  for (let i = n - 1; i >= 0; i--) meses.push(cob_mesMenos_(mesHoy, i));

  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;
  const filas = meses.map(mes => {
    let facturado = 0, cobrado = 0, cuantas = 0;
    libro.facturas.forEach(f => {
      if (cob_mesDe_(f.fecha) !== mes) return;
      facturado += f.neto; cuantas++;
      f.pagos.forEach(p => { if (p.fecha <= hoy) cobrado += p.monto; });
    });
    return { mes: mes, etiqueta: cob_mesEnPalabras_(mes),
             facturado: r2(facturado), cobrado: r2(cobrado), facturas: cuantas,
             pendiente: r2(facturado - cobrado),
             pct: facturado > 0.009 ? Math.round(cobrado / facturado * 1000) / 10 : 0 };
  });

  /* el mes anterior, medido al mismo día del mes que llevamos hoy */
  const mesAntes = cob_mesMenos_(mesHoy, 1);
  const corte = mesAntes + '-' + ('0' + dia).slice(-2);
  let fa = 0, ca = 0;
  libro.facturas.forEach(f => {
    if (cob_mesDe_(f.fecha) !== mesAntes) return;
    fa += f.neto;
    f.pagos.forEach(p => { if (p.fecha <= corte) ca += p.monto; });
  });

  const actual = filas[filas.length - 1] || { pct: 0 };
  const pctAntes = fa > 0.009 ? Math.round(ca / fa * 1000) / 10 : 0;
  return {
    filas: filas,
    actual: actual,
    alMismoDia: { mes: mesAntes, etiqueta: cob_mesEnPalabras_(mesAntes),
                  pct: pctAntes, dia: dia, comparable: fa > 0.009 }
  };
}

/* ── 3 · QUIÉN ES LA CARTERA ─────────────────────────────────────────
   El vencido repartido por cuenta. Ninguna otra pantalla lo pesa: la de
   morosidad las lista, pero una lista de doce nombres no dice que dos de
   ellos son el 82 % del problema. Y eso cambia qué se hace el lunes. */
function cob_concentracion_(libro, hoy, cuantas) {
  const tope = Number(cuantas) || 5;
  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;
  const por = {};
  let vencido = 0, facturasVencidas = 0;

  libro.facturas.forEach(f => {
    const saldo = cob_saldoAl_(f.neto, f.pagos, hoy);
    if (saldo <= 0.009) return;
    if (!f.vencimiento || f.vencimiento >= hoy) return;      // abierta pero no vencida
    const mora = cob_diasEntre_(f.vencimiento, hoy);
    const k = f.ruc || f.cliente;
    if (!por[k]) por[k] = { cliente: f.cliente || f.razon || '(sin cliente)',
                            razon: f.razon || '', ruc: f.ruc,
                            facturas: 0, saldo: 0, mora: 0 };
    const d = por[k];
    d.facturas++; d.saldo += saldo;
    if (mora > d.mora) d.mora = mora;
    vencido += saldo; facturasVencidas++;
  });

  const todas = Object.keys(por).map(k => por[k]).sort((a, b) => b.saldo - a.saldo);
  const arriba = todas.slice(0, tope).map(d => ({
    cliente: d.cliente, razon: d.razon, ruc: d.ruc,
    facturas: d.facturas, mora: d.mora, saldo: r2(d.saldo),
    parte: vencido > 0.009 ? Math.round(d.saldo / vencido * 1000) / 10 : 0
  }));
  const resto = todas.slice(tope);
  const restoSaldo = resto.reduce((s, d) => s + d.saldo, 0);

  return {
    vencido: r2(vencido), facturas: facturasVencidas, cuentas: todas.length,
    arriba: arriba,
    resto: { cuentas: resto.length,
             facturas: resto.reduce((s, d) => s + d.facturas, 0),
             saldo: r2(restoSaldo),
             parte: vencido > 0.009 ? Math.round(restoSaldo / vencido * 1000) / 10 : 0 },
    /* el titular: cuánto pesa la peor cuenta. Es el dato que reencuadra
       todo lo demás, así que sale calculado y no lo arma la pantalla */
    mayor: arriba[0] || null
  };
}

/* ── 4 · ¿LA CARTERA ESTÁ ENVEJECIENDO? ──────────────────────────────
   Lo de más de 90 días rara vez se cobra completo. Lo que importa no es
   el monto sino su PARTICIPACIÓN: que suba significa que lo nuevo entra
   y lo viejo se queda, que es como una cartera se pudre despacio. */
function cob_envejecimiento_(libro, hoy, diasAtras) {
  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;
  const medir = fecha => {
    let vencido = 0, viejo = 0;
    libro.facturas.forEach(f => {
      const saldo = cob_saldoAl_(f.neto, f.pagos, fecha);
      if (saldo <= 0.009) return;
      if (!f.vencimiento || f.vencimiento >= fecha) return;
      vencido += saldo;
      if (cob_diasEntre_(f.vencimiento, fecha) > 90) viejo += saldo;
    });
    return { vencido: r2(vencido), viejo: r2(viejo),
             parte: vencido > 0.009 ? Math.round(viejo / vencido * 1000) / 10 : 0 };
  };
  const ahora = medir(hoy);
  const antes = medir(cob_sumarDias_(hoy, -(Number(diasAtras) || 60)));
  return { monto: ahora.viejo, parte: ahora.parte, vencido: ahora.vencido,
           parteAntes: antes.parte, montoAntes: antes.viejo,
           diasAtras: Number(diasAtras) || 60,
           comparable: antes.vencido > 0.009 };
}

/* ── Lo que pide la pantalla ─────────────────────────────────────────
   Una sola llamada: la Cartera no puede hacer cuatro viajes al servidor
   para pintarse. */
function api_cob_direccion(pin) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!esCobros_(u))
    return { ok:false, error:'Esta pantalla es para cobros, gerencia y administración.' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(HOJA_FAC)) return { ok:true, vacio:true, hoy:hoyPanama_() };

  const hoy = hoyPanama_();
  const libro = cob_libro_();
  if (!libro.facturas.length) return { ok:true, vacio:true, hoy:hoy };

  return {
    ok: true, hoy: hoy,
    diasEnCobrar: cob_diasEnCobrar_(libro, hoy, 90),
    curva: cob_curva_(libro, hoy, 6),
    concentracion: cob_concentracion_(libro, hoy, 5),
    envejecimiento: cob_envejecimiento_(libro, hoy, 60)
  };
}

/* ═══ EL REPORTE DE CARTERA A PROFUNDIDAD ════════════════════════════
   Lo que la pantalla de Dirección resume en cuatro números, aquí se abre
   entero y en papel: es el documento que gerencia manda por correo.

   No repite un solo cálculo de los que ya existen. Lo único nuevo son
   dos cosas que la portada no necesitaba:

     · el reparto por TRAMOS de mora, que es como se lee una cartera
     · la lista de facturas vencidas, una por una

   Todo sale del mismo libro y con la misma regla de siempre: el saldo se
   calcula, nunca se lee de una celda. */

const COB_TRAMOS = [
  { clave:'0-30',  etiqueta:'De 1 a 30 días',   desde:1,   hasta:30 },
  { clave:'31-60', etiqueta:'De 31 a 60 días',  desde:31,  hasta:60 },
  { clave:'61-90', etiqueta:'De 61 a 90 días',  desde:61,  hasta:90 },
  { clave:'+90',   etiqueta:'Más de 90 días',   desde:91,  hasta:999999 }
];

/* Una factura vencida, con lo que hace falta para llamar al cliente:
   quién es, cuánto debe HOY y cuántos días lleva. */
function cob_vencidas_(libro, hoy) {
  const out = [];
  libro.facturas.forEach(f => {
    if (!f.vencimiento || f.vencimiento >= hoy) return;
    const saldo = cob_saldoAl_(f.neto, f.pagos, hoy);
    if (saldo <= 0.009) return;
    out.push({
      factura: f.factura, fecha: f.fecha, vencimiento: f.vencimiento,
      cliente: f.cliente, razon: f.razon, ruc: f.ruc,
      total: f.total, neto: f.neto, saldo: saldo,
      mora: cob_diasEntre_(f.vencimiento, hoy)
    });
  });
  /* la más vieja primero: es la que hay que llamar hoy */
  return out.sort((a, b) => b.mora - a.mora);
}

/* El reparto por tramos. Se mide sobre el SALDO vivo de cada factura, no
   sobre su total: una factura de mil con novecientos pagados aporta cien
   a su tramo, no mil. */
function cob_tramos_(vencidas) {
  const cajas = COB_TRAMOS.map(t => ({
    clave:t.clave, etiqueta:t.etiqueta, monto:0, facturas:0, cuentas:{} }));
  let total = 0;
  vencidas.forEach(v => {
    for (let i = 0; i < COB_TRAMOS.length; i++) {
      if (v.mora >= COB_TRAMOS[i].desde && v.mora <= COB_TRAMOS[i].hasta) {
        cajas[i].monto += v.saldo; cajas[i].facturas++;
        cajas[i].cuentas[String(v.cliente || '').toUpperCase()] = 1;
        total += v.saldo;
        break;
      }
    }
  });
  return { total: Math.round(total * 100) / 100,
    tramos: cajas.map(c => ({
      clave:c.clave, etiqueta:c.etiqueta,
      monto: Math.round(c.monto * 100) / 100,
      facturas: c.facturas, cuentas: Object.keys(c.cuentas).length,
      parte: total > 0.009 ? Math.round(c.monto / total * 1000) / 10 : 0 })) };
}

/* Lo facturado y lo cobrado DEL PERIODO que se esté mirando. Es la única
   cifra del reporte que depende del rango: todo lo demás —la mora, los
   tramos, la concentración— es de siempre, y el reporte lo dice. */
function cob_delPeriodo_(libro, desde, hasta) {
  let facturado = 0, cuantas = 0;
  libro.facturas.forEach(f => {
    if (!f.fecha || f.fecha < desde || f.fecha > hasta) return;
    facturado += f.neto; cuantas++;
  });
  let cobrado = 0, recibos = 0;
  libro.pagos.forEach(p => {
    if (!p.fecha || p.fecha < desde || p.fecha > hasta) return;
    cobrado += p.monto; recibos++;
  });
  return { facturado: Math.round(facturado * 100) / 100, facturas: cuantas,
           cobrado: Math.round(cobrado * 100) / 100, pagos: recibos,
           desde: desde, hasta: hasta };
}

function api_cob_reporte(pin, desde, hasta) {
  const u = usuarioPorPin_(pin);
  if (!u) return { ok:false, error:'PIN no válido', requiereLogin:true };
  if (!esCobros_(u))
    return { ok:false, error:'Este reporte es para cobros, gerencia y administración.' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoy = hoyPanama_();
  if (!ss.getSheetByName(HOJA_FAC)) return { ok:true, vacio:true, hoy:hoy, usuario:u };

  const libro = cob_libro_();
  if (!libro.facturas.length) return { ok:true, vacio:true, hoy:hoy, usuario:u };

  const d1 = String(desde || '') || hoy.slice(0, 8) + '01';
  const d2 = String(hasta || '') || hoy;

  const vencidas = cob_vencidas_(libro, hoy);

  /* Todo lo que se cobra: no solo lo vencido. Una cartera sana también
     tiene plata por vencer, y esconderla hace ver la deuda más chica de
     lo que es. */
  let porCobrar = 0, abiertas = 0;
  libro.facturas.forEach(f => {
    const s = cob_saldoAl_(f.neto, f.pagos, hoy);
    if (s > 0.009) { porCobrar += s; abiertas++; }
  });

  return {
    ok: true, hoy: hoy, usuario: u, desde: d1, hasta: d2,
    porCobrar: Math.round(porCobrar * 100) / 100, abiertas: abiertas,
    periodo: cob_delPeriodo_(libro, d1, d2),
    diasEnCobrar: cob_diasEnCobrar_(libro, hoy, 90),
    curva: cob_curva_(libro, hoy, 6),
    /* diez y no cinco: en el reporte impreso cabe la lista larga, y es
       ahí donde se ve si la mora es de una cuenta o de la cartera */
    concentracion: cob_concentracion_(libro, hoy, 10),
    envejecimiento: cob_envejecimiento_(libro, hoy, 60),
    tramos: cob_tramos_(vencidas),
    vencidas: vencidas
  };
}