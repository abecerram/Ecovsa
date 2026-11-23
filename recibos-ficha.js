/* Recibos dentro de Documentos de la ficha de Logística. */
(function () {
  'use strict';
  var PANEL = 'c44-recibos-panel';
  var LIMITE = 600;
  function texto(v) { return String(v == null ? '' : v).trim(); }
  function mismoNombre(a, b) { return texto(a).toUpperCase() === texto(b).toUpperCase(); }
  function folio(v) { return texto(v && v.recibo); }
  function n(v) { var x = Number(v); return Number.isFinite(x) ? x : 0; }
  function infoEstado(r) {
    if (!r) return ['Sin dato de envío', 'gr'];
    var enviado = texto(r.enviado), correo = /correo/i.test(enviado), wa = /whatsapp/i.test(enviado), pide = texto(r.pide).toLowerCase();
    if (correo && wa) return ['Correo y WhatsApp enviados', 'ok'];
    if (correo) return [pide === 'ambos' ? 'Correo enviado · falta WhatsApp' : 'Correo enviado', pide === 'ambos' ? 'am' : 'ok'];
    if (wa) return [pide === 'ambos' ? 'WhatsApp confirmado · falta correo' : 'WhatsApp confirmado', pide === 'ambos' ? 'am' : 'ok'];
    if (enviado) return ['Enviado', 'ok'];
    return pide ? ['Por enviar', 'am'] : ['Solo papel', 'gr'];
  }
  function llamada(nombre, args, lista, fallo) {
    var u = window.google && google.script && google.script.run;
    if (!u) { fallo(); return; }
    var rpc = u.withSuccessHandler(lista).withFailureHandler(fallo);
    rpc[nombre].apply(rpc, args);
  }
  function vigente(panel, estado) { return panel.isConnected && panel._recibos === estado; }
  function textoEstado(panel, msg) { panel.querySelector('.c44-recibos-estado').textContent = msg; }
  function cargar(panel, cliente) {
    var estado = panel._recibos = { historial: null, pagina: 0, envios: null, consultaEnvioLista: false, cliente: cliente };
    panel.setAttribute('aria-busy','true');
    textoEstado(panel,'Consultando recibos de esta sede…');
    panel.querySelector('.c44-recibos-contenido').replaceChildren();
    function error(m) {
      if (!vigente(panel, estado)) return;
      panel.setAttribute('aria-busy','false');
      textoEstado(panel,m);
      var b = document.createElement('button'); b.type = 'button'; b.className = 'c44-btn';
      b.textContent = 'Reintentar'; b.onclick = function () { cargar(panel, cliente); };
      panel.querySelector('.c44-recibos-contenido').replaceChildren(b);
    }
    llamada('api_historialCliente', [window.PIN, cliente], function (r) {
      if (!vigente(panel, estado)) return;
      if (!r || !r.ok || (r.cliente && !mismoNombre(r.cliente, cliente))) { error(r && r.error || 'No se pudo consultar la sede.'); return; }
      estado.historial = Array.isArray(r.recolecciones) ? r.recolecciones : [];
      panel.setAttribute('aria-busy','false');
      pintar(panel, estado);
    }, function () { error('Sin conexión. No se pudieron consultar los recibos.'); });
    llamada('api_buscarRecibos', [window.PIN, {q:cliente, limite:LIMITE}], function (r) {
      if (!vigente(panel, estado)) return;
      estado.envios = new Map();
      if (r && r.ok && Array.isArray(r.recibos)) r.recibos.forEach(function (fila) {
        if (mismoNombre(fila.cliente, cliente) && folio(fila)) estado.envios.set(folio(fila), fila);
      });
      estado.consultaEnvioLista = true;
      if (estado.historial) pintarEnvios(panel, estado);
    }, function () {
      if (!vigente(panel, estado)) return;
      estado.consultaEnvioLista = true;
      if (estado.historial) pintarEnvios(panel, estado);
    });
  }
  function pintarEnvios(panel, estado) {
    panel.querySelectorAll('[data-c44-recibo-estado]').forEach(function (chip) {
      var id = chip.dataset.c44ReciboEstado, tipo = !id ? ['Sin folio','gr'] :
        estado.consultaEnvioLista ? infoEstado(estado.envios && estado.envios.get(id)) : ['Consultando','gr'];
      chip.textContent = tipo[0]; chip.className = 'rx2-tag ' + tipo[1];
    });
  }
  function pintar(panel, estado) {
    var registros = estado.historial, total = registros.reduce(function (acc, r) { return acc + n(r.totalKg); }, 0);
    var cont = panel.querySelector('.c44-recibos-contenido');
    if (!registros.length) { textoEstado(panel,'No hay visitas registradas para esta sede.'); cont.replaceChildren(); return; }
    textoEstado(panel,'');
    var max = 8, inicio = estado.pagina * max, filas = registros.slice(inicio, inicio + max);
    cont.innerHTML = '<div class="tarjeta-kpi-hist"><div><span>Visitas</span><b>' + registros.length +
      '</b></div><div><span>Total kilos</span><b>' + window.nIni_(total, 1) + ' kg</b></div></div>' +
      '<div class="rx2-tabla"><table><caption class="c44-rf-solo-lector">Recibos de esta sede</caption><thead><tr><th scope="col">Recibo</th><th scope="col">Fecha</th><th scope="col" class="r">Kg</th><th scope="col">PDF / Envío</th><th scope="col"><span class="c44-rf-solo-lector">Vista previa</span></th></tr></thead><tbody>' +
      filas.map(function (r) {
        var id = folio(r), esc = window.esc;
        return '<tr><td><b>' + esc(id || 'Sin folio') + '</b></td><td class="num">' + esc(r.fecha ? window.c2Fecha_(r.fecha) : '—') +
          '</td><td class="r num">' + n(r.totalKg).toFixed(2) + '</td><td><span data-c44-recibo-estado="' + esc(id) + '"></span></td><td class="acc">' +
          (id ? '<button type="button" class="rx2-b" title="Ver el recibo" aria-label="Ver el recibo ' + esc(id) +
          '" data-c44-recibo-ver="' + esc(id) + '">👁</button>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      (registros.length > max ? '<div class="c44-rf-pie"><span>' + (inicio + 1) + '–' + (inicio + filas.length) + ' de ' + registros.length +
      '</span><button type="button" class="c44-btn" data-rf-pagina="-1"' + (inicio ? '' : ' disabled') +
      '>Anterior</button><button type="button" class="c44-btn" data-rf-pagina="1"' + (inicio + filas.length < registros.length ? '' : ' disabled') +
      '>Siguiente</button></div>' : '');
    pintarEnvios(panel, estado);
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-c44-recibos-abre], [data-c44-recibo-ver], [data-rf-pagina]');
    if (!b) return;
    var doc = b.closest('#c44-docs'), panel = doc && doc.querySelector('#' + PANEL);
    if (!panel) return;
    var estado = panel._recibos;
    if (b.hasAttribute('data-c44-recibos-abre')) {
      panel.hidden = !panel.hidden; b.setAttribute('aria-expanded', String(!panel.hidden));
      if (!panel.hidden && !estado) cargar(panel, b.dataset.c44RecibosAbre);
    } else if (b.hasAttribute('data-c44-recibo-ver')) {
      window.verReciboEnPantalla(b.dataset.c44ReciboVer);
    } else if (estado && estado.historial) {
      estado.pagina += Number(b.dataset.rfPagina); pintar(panel, estado);
      var siguiente = panel.querySelector('button[data-rf-pagina="' + b.dataset.rfPagina + '"]:not([disabled])') ||
        panel.querySelector('button[data-rf-pagina]:not([disabled])');
      if (siguiente) siguiente.focus();
    }
  });
})();
