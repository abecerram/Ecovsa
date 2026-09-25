/* ═══════════════════════════════════════════════════════════════
   PUENTE ECOVSA · GitHub Pages ⇄ Supabase / Apps Script  puente 3.0
   ───────────────────────────────────────────────────────────────
   Imita google.script.run. Las pantallas siguen llamando
       google.script.run.withSuccessHandler(fn).api_algo(args)
   y por dentro la llamada viaja por fetch al servidor.

   MUDANZA POR BLOQUES: las funciones que ya pasaron a Supabase
   (lista "enSupabase") van a Supabase; todas las demás siguen yendo
   a Apps Script mientras se terminan de pasar.

   Además:
   · COPIA LOCAL: las lecturas muestran al instante lo último que
     se vio y se refrescan solas por detrás. Si lo nuevo es igual,
     la pantalla no se vuelve a pintar.
   · REINTENTO SEGURO: si se pierde la respuesta (404, 5xx, corte),
     se reintenta solo. Todos los intentos llevan la MISMA etiqueta:
     el servidor la reconoce y nunca guarda dos veces lo mismo.
   · TURNO: como mucho 4 llamadas a la vez; las demás esperan su turno
     (así no se atoran unas con otras).
   · COLA: si un guardado no sale después de los reintentos, queda en
     cola (con su etiqueta) y se reenvía solo cuando vuelve la señal.
   · MEDICIÓN: cada llamada queda registrada (tiempo total y tiempo
     que tardó el servidor). Tocando el reloj se ve el reporte.
   · RELOJ traslúcido de última actualización, abajo a la derecha:
       verde  = datos en vivo, con la hora en que llegaron
       ámbar  = mostrando copia guardada (con su hora), actualizando
       rojo   = falló la actualización; dice desde qué hora son los
                datos que se ven
   Si la página corre dentro de Apps Script (google.script.run real),
   el puente no se instala y todo funciona como siempre.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CONFIG = {
    /* Dirección /exec de la implementación de Apps Script. */
    url: 'https://script.google.com/macros/s/AKfycbxWP6MYJKBl-VOOAdo_9wdDZHk_ZdW_4Hq1SaZ2wGKVzDHDIlmyVjsr_0BFMjpRz2VQ/exec',
    /* Servidor nuevo en Supabase y las funciones que ya viven allí.
       Bloques en Supabase: entrada y lobby · logística (con el comprobante de visita).
       Optimizar ruta (api_optimizarRuta) sigue en Apps Script a propósito. */
    supabase: 'https://wgufdfagvyelsypypkyr.supabase.co/functions/v1/api',
    enSupabase: /^api_(abiertasDe|abrirJornada|acta|actaSalida|actas|activos|administracion|agenda|altaBootstrap|anularCiclo|aprobarSolicitud|arqueo|avanceHoy|bootstrap|borrarPago|borrarProspecto|borrarRuta|buscarClientes|buscarRecibos|cajaAbrir|cajaAnular|cajaBootstrap|cajaCerrar|cajaGasto|cambiarEstadoCliente|cargarCiclos|cartera|catalogosFinanzas|cerrarGestion|cerrarJornada|cerrarPendiente|cerrarRuta|certificadosEmitidos|clientesDelDia|clientesPorRevisar|cob_catalogo|cob_direccion|cob_mensaje|cob_registrarEnvio|cob_reporte|cobros|combustible|consumibles|contrato|corregirProveedorDeSolicitud|correoCartera|correrVigia|datosCertificado|deducirInicios|dir_portada|dir_zona|distintivos|editarCiclo|editarFactura|editarPago|emitirCertificado|entradasPendientes|enviarInspeccion|estadoCuenta|estadoResultados|estadoSolicitud|facturasSinCliente|finanzasBootstrap|formulariosRecibidos|generarActa|generarActaPlanta|gestionesDe|getRutas|guardarActivo|guardarCiclo|guardarCombustible|guardarConsumo|guardarCuenta|guardarDatosFormularioCliente|guardarFactura|guardarFicha|guardarGastoFijo|guardarGestion|guardarHorarioCliente|guardarInspeccion|guardarInsumo|guardarLote|guardarMantenimiento|guardarNotificacion|guardarPago|guardarPlanTarea|guardarProspecto|guardarProveedor|guardarProveedorDeSolicitud|guardarRuta|guardarSalida|guardarSolicitud|guardarSolicitudPago|historialCliente|horarioCliente|indicadoresFlota|inspeccion|inspeccionDeProspecto|inspecciones|inventario|lobby|lobby_resumen|login|mantenimiento|marcador|marcarDistintivo|marcarFormularioEnviado|marcarGasto|marcarNovedadVista|marcarReciboEnviado|marcarVistoBueno|miCliente|morosidad|movimientos|notasPropuesta|notificaciones|novedades|obtenerDatosFormularioCliente|obtenerDetalleRecibo|obtenerListaClientes|paraFacturar|pasarACartera|pedirInspeccion|pendientes|ping|plantaActas|plantaBootstrap|plantaReporte|portada|propuesta|prospectos|reabrirRecibo|rechazarSolicitud|registrarEntradaDeSolicitud|registrarEntrega|registrarReciboEmas|registrarServicio|revisarBorrado|revisarContrato|rutasTodas|saldoDisposicion|salidas|solicitudes|tratamiento|ultimosRecibos|urlApp|verCertificado|verFactura|verSolicitud)$/,
    version: 'puente 3.2',
    /* El recuadro de estado abajo a la derecha:
       'discreto' → solo aparece si algo anda mal (error, reintento o guardados en cola)
       'oculto'   → nunca aparece; la pantalla pinta su propio semáforo con el evento 'puente:estado'
       'visible'  → siempre, como antes */
    indicador: 'discreto',
    cacheHoras: 24,          // una copia local más vieja que esto no se usa
    timeoutMs: 25000,        // tiempo máximo de espera por cada intento
    maxIntentos: 3,          // intentos por llamada (con la misma etiqueta)
    esperaReintento: [600, 1500],  // pausa antes del 2.º y del 3.er intento (ms)
    dobleEnvioMs: 0,         // apagado: el segundo envío hacía más fila, no más rapidez
    maxSimultaneas: 4,       // llamadas al mismo tiempo; las demás esperan turno
    maxMediciones: 300,      // cuántas mediciones se guardan para el reporte
    /* Funciones que ESCRIBEN: no se guardan en copia local y, si no
       salen por falta de conexión, van a la cola. */
    escritura: /^api_(guardar|marcar|abrir|cerrar|registrar|borrar|eliminar|crear|actualizar|enviar|corregir|cargarCiclos|dar|anular|confirmar|aprobar|rechazar|subir|asignar|mover|cambiar|agregar|nuevo|editar|deducir|reabrir|reiniciar|limpiar|importar|generar)/i,
    /* Lecturas que siempre van en vivo, nunca desde copia. */
    sinCopia: /^api_(login|urlApp)$/i,
    /* Lecturas que se entregan UNA sola vez a la pantalla (sin el
       segundo pintado cuando llega lo nuevo). */
    unaVez: /^$/
  };
  if (window.PUENTE_CONFIG) {
    for (var k in window.PUENTE_CONFIG) CONFIG[k] = window.PUENTE_CONFIG[k];
  }
  try {
    var urlPrueba = localStorage.getItem('pnt:url');
    if (urlPrueba && CONFIG.url.indexOf('PEGA_AQUI') === 0) CONFIG.url = urlPrueba;
  } catch (e) {}

  var enAppsScript = !!(window.google && google.script && google.script.run &&
                        !google.script.run.__puente);

  /* ─────────────── almacenamiento local seguro ─────────────── */
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) {
    try { localStorage.setItem(k, v); return true; }
    catch (e) { limpiarCopias(true); try { localStorage.setItem(k, v); return true; } catch (e2) { return false; } }
  }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function lsJSON(k, def) { var v = lsGet(k); if (!v) return def; try { return JSON.parse(v); } catch (e) { return def; } }

  function hash(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  function aTexto(x) { try { return JSON.stringify(x === undefined ? null : x); } catch (e) { return 'null'; } }

  /* ─────────────── copia local de lecturas ─────────────── */
  function claveCopia(fn, args) { return 'pnt:c:' + fn + ':' + hash(aTexto(args)); }
  function leerCopia(clave) {
    var c = lsJSON(clave, null);
    if (!c || !c.t) return null;
    if (Date.now() - c.t > CONFIG.cacheHoras * 3600000) { lsDel(clave); return null; }
    return c;
  }
  function guardarCopia(clave, j) { lsSet(clave, JSON.stringify({ t: Date.now(), j: j })); }
  function limpiarCopias(soloViejas) {
    try {
      var borrar = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('pnt:c:') === 0) borrar.push(k);
      }
      if (soloViejas) {
        borrar.sort(function (a, b) { return (lsJSON(a, {}).t || 0) - (lsJSON(b, {}).t || 0); });
        borrar = borrar.slice(0, Math.ceil(borrar.length / 2));
      }
      borrar.forEach(lsDel);
    } catch (e) {}
  }

  /* ─────────────── medición ─────────────── */
  function medir(fn, total, servidor, ok, intentos) {
    var m = lsJSON('pnt:med', []);
    m.push({ f: fn, t: Math.round(total), s: servidor == null ? null : Math.round(servidor), ok: !!ok, i: intentos || 1, at: Date.now() });
    if (m.length > CONFIG.maxMediciones) m = m.slice(m.length - CONFIG.maxMediciones);
    lsSet('pnt:med', JSON.stringify(m));
    if (window.console) console.log('[puente] ' + fn + ' · ' + Math.round(total) + ' ms' +
      (servidor != null ? ' (servidor ' + Math.round(servidor) + ' ms)' : '') +
      ((intentos || 1) > 1 ? ' · ' + intentos + ' intentos' : '') + (ok ? '' : ' · ERROR'));
  }
  function resumenMediciones() {
    var m = lsJSON('pnt:med', []), g = {};
    m.forEach(function (x) {
      var r = g[x.f] || (g[x.f] = { f: x.f, n: 0, tot: 0, srv: 0, nsrv: 0, max: 0, err: 0, rei: 0 });
      r.n++; r.tot += x.t; if (x.t > r.max) r.max = x.t;
      if (x.s != null) { r.srv += x.s; r.nsrv++; }
      if (!x.ok) r.err++;
      if ((x.i || 1) > 1) r.rei++;
    });
    return Object.keys(g).map(function (k) {
      var r = g[k];
      return { f: r.f, n: r.n, prom: Math.round(r.tot / r.n), srv: r.nsrv ? Math.round(r.srv / r.nsrv) : null, max: r.max, err: r.err, rei: r.rei };
    }).sort(function (a, b) { return b.prom - a.prom; });
  }

  /* ─────────────── viaje al servidor ─────────────── */
  function errorRed(msg) { var e = new Error(msg); e.red = true; return e; }

  function prepararArgs(args) {
    return args.map(function (a) {
      if (typeof HTMLFormElement !== 'undefined' && a instanceof HTMLFormElement) {
        var o = {};
        Array.prototype.forEach.call(a.elements, function (el) {
          if (!el.name || el.disabled) return;
          if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) return;
          if (el.type === 'file') { console.warn('[puente] Los archivos de formulario todavía no viajan por el puente: ' + el.name); return; }
          o[el.name] = el.value;
        });
        return o;
      }
      return a;
    });
  }

  function nuevoId() {
    return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  /* Un solo intento. Marca como "reintentable" todo lo que NO es un error de
     la función misma: sin conexión, 404/5xx del servidor, respuesta vacía o rota,
     tiempo agotado. Un error de la función (ok:false) no se reintenta. */
  function destino(fn) {
    return (CONFIG.supabase && CONFIG.enSupabase && CONFIG.enSupabase.test(fn)) ? CONFIG.supabase : CONFIG.url;
  }

  /* Turno: como mucho maxSimultaneas llamadas en vuelo. */
  var enVuelo = 0, fila = [];
  function conTurno(tarea) {
    return new Promise(function (resolve, reject) {
      function correr() {
        enVuelo++;
        var fin = function () { enVuelo--; if (fila.length) fila.shift()(); };
        tarea().then(function (v) { fin(); resolve(v); }, function (e) { fin(); reject(e); });
      }
      if (enVuelo < (CONFIG.maxSimultaneas || 4)) correr(); else fila.push(correr);
    });
  }

  function intento(fn, args, id, esc) {
    return conTurno(function () { return intentoDirecto(fn, args, id, esc); });
  }

  function intentoDirecto(fn, args, id, esc) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var reloj_ = ctrl ? setTimeout(function () { ctrl.abort(); }, CONFIG.timeoutMs) : null;
    return fetch(destino(fn), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn: fn, args: args, id: id, esc: !!esc }),
      redirect: 'follow',
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (reloj_) clearTimeout(reloj_);
      if (!res.ok) { var e = errorRed('El servidor respondió ' + res.status); e.reintentable = true; e.red = res.status >= 500 || res.status === 0; throw e; }
      return res.text();
    }, function (err) {
      if (reloj_) clearTimeout(reloj_);
      var e = (err && err.name === 'AbortError')
        ? new Error('El servidor tardó más de ' + Math.round(CONFIG.timeoutMs / 1000) + ' s y no confirmó.')
        : errorRed('Sin conexión con el servidor.');
      e.reintentable = true;
      throw e;
    }).then(function (txt) {
      var d;
      try { d = JSON.parse(txt); }
      catch (e) { var e2 = new Error('La respuesta del servidor llegó incompleta.'); e2.reintentable = true; throw e2; }
      if (!d.ok) { var e3 = new Error(d.error || 'Error del servidor'); e3.ms = d.ms; throw e3; }
      return d;
    });
  }

  /* Llamada completa: reintentos + doble envío. Todos los intentos llevan la
     MISMA etiqueta (id); el servidor la usa para no guardar dos veces. */
  function llamarServidor(fn, args, opc) {
    opc = opc || {};
    var dir = destino(fn);
    if (!dir || dir.indexOf('PEGA_AQUI') === 0)
      return Promise.reject(new Error('El puente no tiene la dirección del servidor configurada.'));
    var id = opc.id || nuevoId();
    var esc = !!opc.esc;
    var a = prepararArgs(args);
    var t0 = Date.now();
    return new Promise(function (resolve, reject) {
      var terminado = false, lanzados = 0, activos = 0, programado = false, dobleTimer = null;
      function cerrar(bien, valor) {
        if (terminado) return;
        terminado = true;
        if (dobleTimer) clearTimeout(dobleTimer);
        medir(fn, Date.now() - t0, valor && valor.ms, bien, lanzados);
        if (bien) resolve(valor.r); else reject(valor);
      }
      function lanzar() {
        if (terminado) return;
        programado = false;
        lanzados++; activos++;
        if (lanzados > 1) reloj.reintento();
        intento(fn, a, id, esc).then(function (d) {
          activos--; cerrar(true, d);
        }, function (err) {
          activos--;
          if (terminado) return;
          if (err.reintentable && lanzados < CONFIG.maxIntentos) {
            if (!programado) { programado = true; setTimeout(lanzar, CONFIG.esperaReintento[Math.min(lanzados - 1, CONFIG.esperaReintento.length - 1)]); }
          } else if (activos === 0 && !programado) {
            cerrar(false, err);
          }
        });
      }
      lanzar();
      if (CONFIG.dobleEnvioMs > 0) {
        dobleTimer = setTimeout(function () {
          if (!terminado && lanzados < CONFIG.maxIntentos && !programado) lanzar();
        }, CONFIG.dobleEnvioMs);
      }
    });
  }

  /* ─────────────── entrega a la pantalla ─────────────── */
  function entregar(h, dato, uo, fn) {
    if (typeof h !== 'function') return;
    try { h(dato, uo); } catch (e) { console.error('[puente] Error en la pantalla al procesar ' + fn, e); }
  }
  function entregarError(h, err, uo, fn) {
    if (typeof h === 'function') { try { h(err, uo); } catch (e) { console.error(e); } }
    else console.error('[puente] ' + fn + ': ' + err.message);
  }

  function ejecutar(fn, args, ok, fail, uo) {
    var esEsc = CONFIG.escritura.test(fn);
    var usaCopia = !esEsc && !CONFIG.sinCopia.test(fn);
    var clave = usaCopia ? claveCopia(fn, args) : null;
    var copia = usaCopia ? leerCopia(clave) : null;
    var entregado = null;

    if (copia) {
      entregado = copia.j;
      var dato = null; try { dato = JSON.parse(copia.j); } catch (e) {}
      reloj.inicio('copia', copia.t);
      entregar(ok, dato, uo, fn);
    } else {
      reloj.inicio(esEsc ? 'guardando' : 'cargando');
    }

    var id = nuevoId();
    llamarServidor(fn, args, { id: id, esc: esEsc }).then(function (r) {
      var j = aTexto(r);
      if (usaCopia) guardarCopia(clave, j);
      reloj.fin(true);
      if (entregado === null) entregar(ok, r, uo, fn);
      else if (entregado !== j && !CONFIG.unaVez.test(fn)) entregar(ok, r, uo, fn);
    }, function (err) {
      reloj.fin(false, err.message, copia ? copia.t : null);
      if (esEsc && err.reintentable) {
        encolar(fn, args, id);
        entregarError(fail, new Error('Sin conexión: el guardado quedó en cola y se enviará solo al volver la señal. No lo vuelvas a enviar.'), uo, fn);
        return;
      }
      if (copia && err.reintentable) return;   // ya se ve la copia; el reloj en rojo avisa
      entregarError(fail, err, uo, fn);
    });
  }

  /* ─────────────── cola de guardados ─────────────── */
  var procesando = false;
  function encolar(fn, args, id) {
    var c = lsJSON('pnt:cola', []);
    c.push({ fn: fn, args: prepararArgs(args), id: id || nuevoId(), at: Date.now() });
    lsSet('pnt:cola', JSON.stringify(c));
    reloj.pintar();
  }
  function procesarCola() {
    if (procesando) return;
    var c = lsJSON('pnt:cola', []);
    if (!c.length) return;
    procesando = true;
    var item = c[0];
    llamarServidor(item.fn, item.args, { id: item.id, esc: true }).then(function () {
      var c2 = lsJSON('pnt:cola', []); c2.shift(); lsSet('pnt:cola', JSON.stringify(c2));
      procesando = false; reloj.pintar(); procesarCola();
    }, function (err) {
      procesando = false;
      if (err.reintentable) { reloj.pintar(); return; }   // sigue sin respuesta: se intenta luego
      var c2 = lsJSON('pnt:cola', []); var malo = c2.shift(); lsSet('pnt:cola', JSON.stringify(c2));
      var f = lsJSON('pnt:fallidos', []); malo.error = err.message; f.push(malo);
      lsSet('pnt:fallidos', JSON.stringify(f.slice(-50)));
      reloj.pintar(); procesarCola();
    });
  }

  /* ─────────────── reloj traslúcido ─────────────── */
  var reloj = (function () {
    var el = null, pendientes = 0, estado = 'cargando', horaDatos = null, ultimoError = '';
    function hora(t) {
      if (!t) return '—';
      var d = new Date(t), hoy = new Date();
      var hh = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2);
      if (d.toDateString() !== hoy.toDateString()) hh = d.getDate() + '/' + (d.getMonth() + 1) + ' ' + hh;
      return hh;
    }
    function crear() {
      if (el || !document.body) return;
      el = document.createElement('div');
      el.id = 'puente-reloj';
      el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:2147483000;' +
        'font:600 11.5px/1.2 system-ui,-apple-system,Segoe UI,sans-serif;color:#fff;' +
        'background:rgba(20,30,45,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);' +
        'padding:6px 10px;border-radius:999px;opacity:.7;cursor:pointer;user-select:none;' +
        'box-shadow:0 2px 8px rgba(0,0,0,.18);transition:opacity .2s';
      el.onmouseenter = function () { el.style.opacity = '1'; };
      el.onmouseleave = function () { el.style.opacity = '.7'; };
      el.onclick = abrirPanel;
      document.body.appendChild(el);
      pintar();
    }
    function pintar() {
      if (!el) { crear(); if (!el) return; }
      var col = { vivo: '#3ddc84', copia: '#ffb020', error: '#ff5a5a', cargando: '#b8c2cc', guardando: '#6cb6ff', reintento: '#ffb020' }[estado] || '#b8c2cc';
      var txt;
      if (estado === 'vivo') txt = 'Actualizado ' + hora(horaDatos);
      else if (estado === 'copia') txt = 'Copia de ' + hora(horaDatos) + ' · actualizando…';
      else if (estado === 'error') txt = (horaDatos ? 'Datos de ' + hora(horaDatos) : 'Sin datos') + ' · no se pudo actualizar';
      else if (estado === 'guardando') txt = 'Guardando…';
      else if (estado === 'reintento') txt = (horaDatos ? 'Datos de ' + hora(horaDatos) + ' · ' : '') + 'reintentando…';
      else txt = 'Cargando…';
      var cola = lsJSON('pnt:cola', []).length;
      if (cola) txt += ' · ' + cola + ' en cola';
      el.innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:1px;background:' + col + '"></span>' + txt;
      var modo = CONFIG.indicador || 'discreto';
      var problema = estado === 'error' || estado === 'reintento' || cola > 0;
      el.style.display = (modo === 'oculto' || (modo === 'discreto' && !problema)) ? 'none' : '';
      try {
        document.dispatchEvent(new CustomEvent('puente:estado', { detail: {
          estado: estado, cola: cola, hora: horaDatos, error: ultimoError, enLinea: navigator.onLine !== false } }));
      } catch (e) {}
      el.title = estado === 'error' ? ('Último error: ' + ultimoError + '\nToca para ver el detalle') : 'Toca para ver el detalle';
    }
    return {
      inicio: function (tipo, t) {
        pendientes++;
        if (tipo === 'copia') { estado = 'copia'; horaDatos = t; }
        else if (estado !== 'copia' && estado !== 'error') estado = tipo;
        pintar();
      },
      fin: function (bien, msg, tCopia) {
        pendientes = Math.max(0, pendientes - 1);
        if (bien) {
          if (estado !== 'copia' || pendientes === 0) horaDatos = Date.now();
          if (pendientes === 0) estado = 'vivo';
        } else {
          estado = 'error'; ultimoError = msg || '';
          if (tCopia) horaDatos = tCopia;
        }
        pintar();
      },
      reintento: function () { if (estado !== 'copia') { estado = 'reintento'; pintar(); } },
      pintar: pintar,
      crear: crear,
      estado: function () { return { estado: estado, hora: horaDatos, error: ultimoError, pendientes: pendientes }; }
    };
  })();

  /* ─────────────── panel de detalle (al tocar el reloj) ─────────────── */
  function reporteTexto() {
    var r = resumenMediciones();
    var lin = ['REPORTE PUENTE ECOVSA · ' + CONFIG.version + ' · ' + new Date().toLocaleString(),
               'Pantalla: ' + location.pathname, '',
               'función | veces | promedio ms | servidor ms | máx ms | errores | con reintento'];
    r.forEach(function (x) { lin.push(x.f + ' | ' + x.n + ' | ' + x.prom + ' | ' + (x.srv == null ? '—' : x.srv) + ' | ' + x.max + ' | ' + x.err + ' | ' + x.rei); });
    var f = lsJSON('pnt:fallidos', []);
    if (f.length) { lin.push('', 'Guardados de la cola que el servidor rechazó:'); f.forEach(function (x) { lin.push(x.fn + ' · ' + new Date(x.at).toLocaleString() + ' · ' + x.error); }); }
    return lin.join('\n');
  }
  function abrirPanel() {
    var viejo = document.getElementById('puente-panel'); if (viejo) { viejo.remove(); return; }
    var st = reloj.estado(), r = resumenMediciones(), cola = lsJSON('pnt:cola', []), f = lsJSON('pnt:fallidos', []);
    var p = document.createElement('div');
    p.id = 'puente-panel';
    p.style.cssText = 'position:fixed;right:10px;bottom:46px;z-index:2147483001;width:min(560px,calc(100vw - 20px));max-height:70vh;overflow:auto;' +
      'background:#fff;color:#1b2430;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.25);font:13px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;padding:14px 16px';
    var filas = r.map(function (x) {
      var lento = x.prom > 3000 ? 'color:#c0392b;font-weight:700' : (x.prom > 1500 ? 'color:#b9770e;font-weight:700' : '');
      return '<tr><td style="padding:3px 6px">' + x.f + '</td><td style="text-align:right;padding:3px 6px">' + x.n +
        '</td><td style="text-align:right;padding:3px 6px;' + lento + '">' + x.prom + '</td><td style="text-align:right;padding:3px 6px">' +
        (x.srv == null ? '—' : x.srv) + '</td><td style="text-align:right;padding:3px 6px">' + x.max + '</td><td style="text-align:right;padding:3px 6px">' + (x.err || '') + '</td><td style="text-align:right;padding:3px 6px">' + (x.rei || '') + '</td></tr>';
    }).join('');
    p.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>Estado de los datos</b>' +
      '<button data-a="cerrar" style="border:0;background:none;font-size:18px;cursor:pointer">×</button></div>' +
      '<div>Estado: <b>' + st.estado + '</b> · datos de: <b>' + (st.hora ? new Date(st.hora).toLocaleString() : '—') + '</b></div>' +
      (st.error ? '<div style="color:#c0392b">Último error: ' + st.error + '</div>' : '') +
      '<div>Guardados en cola: <b>' + cola.length + '</b>' + (f.length ? ' · rechazados: <b style="color:#c0392b">' + f.length + '</b>' : '') + '</div>' +
      '<div style="margin-top:10px"><b>Tiempos por función</b> <span style="color:#667">(ms; lo más lento arriba)</span></div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:4px"><tr style="background:#eef2f6">' +
      '<th style="text-align:left;padding:3px 6px">función</th><th style="padding:3px 6px">veces</th><th style="padding:3px 6px">prom.</th>' +
      '<th style="padding:3px 6px">servidor</th><th style="padding:3px 6px">máx.</th><th style="padding:3px 6px">err.</th><th style="padding:3px 6px">reint.</th></tr>' +
      (filas || '<tr><td colspan="7" style="padding:6px;color:#667">Todavía no hay mediciones.</td></tr>') + '</table>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px">' +
      '<button data-a="copiar" style="padding:7px 10px;border-radius:8px;border:1px solid #cfd8e3;background:#f5f8fb;cursor:pointer">Copiar reporte</button>' +
      '<button data-a="cola" style="padding:7px 10px;border-radius:8px;border:1px solid #cfd8e3;background:#f5f8fb;cursor:pointer">Reintentar cola</button>' +
      '<button data-a="copias" style="padding:7px 10px;border-radius:8px;border:1px solid #cfd8e3;background:#f5f8fb;cursor:pointer">Borrar copias locales</button>' +
      '<button data-a="med" style="padding:7px 10px;border-radius:8px;border:1px solid #cfd8e3;background:#f5f8fb;cursor:pointer">Borrar mediciones</button>' +
      '</div><div style="margin-top:8px;color:#889;font-size:11px">' + CONFIG.version + '</div>';
    p.onclick = function (ev) {
      var a = ev.target.getAttribute && ev.target.getAttribute('data-a'); if (!a) return;
      if (a === 'cerrar') p.remove();
      if (a === 'copiar') {
        var t = reporteTexto();
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(
          function () { ev.target.textContent = 'Copiado ✓'; },
          function () { window.prompt('Copia el reporte:', t); });
      }
      if (a === 'cola') { procesarCola(); ev.target.textContent = 'Reintentando…'; }
      if (a === 'copias') { limpiarCopias(false); ev.target.textContent = 'Copias borradas ✓'; }
      if (a === 'med') { lsDel('pnt:med'); lsDel('pnt:fallidos'); p.remove(); }
    };
    document.body.appendChild(p);
  }

  /* ─────────────── imitación de google.script.* ─────────────── */
  function corredor(ok, fail, uo) {
    var base = {
      __puente: true,
      withSuccessHandler: function (f) { return corredor(f, fail, uo); },
      withFailureHandler: function (f) { return corredor(ok, f, uo); },
      withUserObject: function (o) { return corredor(ok, fail, o); }
    };
    return new Proxy(base, {
      get: function (t, p) {
        if (p in t) return t[p];
        if (typeof p !== 'string' || p === 'then') return undefined;
        return function () { ejecutar(p, Array.prototype.slice.call(arguments), ok, fail, uo); };
      }
    });
  }

  function parametros() {
    var q = {}, qs = {};
    new URLSearchParams(location.search).forEach(function (v, k) {
      if (!(k in q)) q[k] = v; (qs[k] = qs[k] || []).push(v);
    });
    return { parameter: q, parameters: qs, hash: location.hash.replace(/^#/, '') };
  }

  if (!enAppsScript) {
    window.google = window.google || {};
    window.google.script = window.google.script || {};
    Object.defineProperty(window.google.script, 'run', { get: function () { return corredor(null, null, undefined); }, configurable: true });
    window.google.script.url = { getLocation: function (cb) { if (typeof cb === 'function') cb(parametros()); } };
    window.google.script.host = {
      close: function () {}, setHeight: function () {}, setWidth: function () {},
      editor: { focus: function () {} }, origin: location.origin
    };
    window.google.script.history = {
      push: function (st, q, h) { var u = new URL(location.href); if (q) Object.keys(q).forEach(function (k) { u.searchParams.set(k, q[k]); }); if (h) u.hash = h; history.pushState(st, '', u); },
      replace: function (st, q, h) { var u = new URL(location.href); if (q) Object.keys(q).forEach(function (k) { u.searchParams.set(k, q[k]); }); if (h) u.hash = h; history.replaceState(st, '', u); },
      setChangeHandler: function (f) { window.addEventListener('popstate', function (e) { f({ state: e.state, location: parametros() }); }); }
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', reloj.crear);
    else reloj.crear();
    window.addEventListener('online', procesarCola);
    setInterval(procesarCola, 30000);
    setTimeout(procesarCola, 2000);
  }

  window.PUENTE = {
    config: CONFIG,
    activo: !enAppsScript,
    llamar: function (fn) { return llamarServidor(fn, Array.prototype.slice.call(arguments, 1)); },
    destino: destino,
    reporte: reporteTexto,
    mediciones: resumenMediciones,
    limpiarCopias: function () { limpiarCopias(false); },
    procesarCola: procesarCola,
    panel: abrirPanel
  };
  /* api 2.9 · El vigía de inactividad. Si en este navegador hay alguien con
     PIN guardado, se carga entrada.js: tras 15 minutos sin uso pregunta
     «¿Sigues ahí?» y, al minuto, bloquea la pantalla con la entrada del
     árbol. El conductor no se bloquea. Una página puede apagarlo con
     PUENTE_CONFIG = { vigia:false } (el lobby lo maneja él mismo). */
  try {
    var hayQuien = !!localStorage.getItem('ecovsa_pin') || localStorage.getItem('eco_bloqueado') === '1';
    if (hayQuien && CONFIG.vigia !== false && window.top === window && !document.getElementById('ent-js')) {
      var sEnt = document.createElement('script');
      sEnt.id = 'ent-js'; sEnt.src = 'entrada.js'; sEnt.setAttribute('data-vigia', '1');
      (document.head || document.documentElement).appendChild(sEnt);
    }
  } catch (e) {}
})();
