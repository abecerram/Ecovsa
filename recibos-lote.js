/* Paquetes de recibos de una cuenta y una fecha en Logística. */
(function () {
  'use strict';

  const canales = window.RecibosCanales3107;
  const pintarRecibos = window.rx2Pintar_;
  if (!canales || typeof pintarRecibos !== 'function') return;

  const porPDF = 2 * 1024 * 1024;
  const porCorreo = 5 * 1024 * 1024;
  const elegidos = new Map();
  let sesion;
  let pendiente;
  let dialogo;
  let barra;
  let preparando = false;
  let enviando = false;

  const grupo = r => r && r.loteClienteId && /^\d{4}-\d{2}-\d{2}$/.test(r.fecha) ?
    JSON.stringify([r.loteCuentaId || r.loteClienteId, r.fecha]) : '';
  const visibles = () => window.rx2Filtrar_(window.RX2.lista);
  const ocupado = () => preparando || enviando;

  function elemento(tag, texto, atributos = {}) {
    const nodo = document.createElement(tag);
    if (texto) nodo.textContent = texto;
    for (const [nombre, valor] of Object.entries(atributos)) nodo.setAttribute(nombre, valor);
    return nodo;
  }

  function boton(texto, accion, clase = 'rx2-bt') {
    const nodo = elemento('button', texto, { type: 'button', class: clase });
    nodo.addEventListener('click', accion);
    return nodo;
  }

  function actualizarSesion() {
    if (sesion === window.PIN) return;
    sesion = window.PIN;
    elegidos.clear();
    pendiente = null;
    if (dialogo && dialogo.nodo.open) dialogo.nodo.close();
  }

  function textoCantidad(n, singular, plural) {
    return n + ' ' + (n === 1 ? singular : plural);
  }

  function agruparPorSede(filas) {
    const sedes = new Map();
    for (const r of filas) {
      if (!sedes.has(r.loteClienteId)) sedes.set(r.loteClienteId, { id: r.loteClienteId, nombre: r.loteSucursal || r.cliente, recibos: [] });
      sedes.get(r.loteClienteId).recibos.push(r);
    }
    return Array.from(sedes.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  function mostrarSedes(sedes, abrir) {
    sedes.panel.hidden = !abrir;
    sedes.boton.setAttribute('aria-expanded', String(abrir));
    if (barra) barra.revisar.hidden = abrir;
  }

  function crearSedes() {
    const selector = elemento('div', '', { class: 'ms-selector' });
    const panel = elemento('div', '', { class: 'ms-sedes', id: 'ms-sedes', hidden: '' });
    const lista = elemento('fieldset', '', { class: 'ms-lista', 'aria-label': 'Sedes con recibos' });
    const contenido = elemento('div', '', { class: 'ms-lista-filas' });
    lista.append(contenido);
    const todas = elemento('input', '', { type: 'checkbox' });
    const etiquetaTodas = elemento('label', '', { class: 'ms-opcion ms-todas' });
    etiquetaTodas.append(todas, elemento('strong', 'Todas las sedes'));

    const estado = elemento('span', '', { class: 'ms-ayuda', role: 'status' });
    const aplicar = boton('Aplicar', () => {
      elegidos.clear();
      for (const { casilla, sede } of controles) {
        if (casilla.checked) sede.recibos.forEach(r => elegidos.set(r.recibo, r));
      }
      mostrarSedes(sedes, false);
      window.rx2Pintar_();
      barra.revisar.focus();
    }, 'rx2-bt rec-lote-principal');
    const pie = elemento('div', '', { class: 'ms-pie' });
    pie.append(estado, aplicar);
    panel.append(etiquetaTodas, lista, pie);

    const botonSedes = boton('Sedes', () => {
      mostrarSedes(sedes, panel.hidden);
      if (!panel.hidden) controles[0]?.casilla.focus();
    }, 'rx2-bt ms-sedes-boton');
    botonSedes.setAttribute('aria-controls', panel.id);
    botonSedes.setAttribute('aria-expanded', 'false');
    selector.append(botonSedes, panel);
    selector.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || panel.hidden) return;
      event.stopPropagation();
      mostrarSedes(sedes, false);
      botonSedes.focus();
    });
    document.addEventListener('pointerdown', event => {
      if (!panel.hidden && !selector.contains(event.target)) mostrarSedes(sedes, false);
    });

    let controles = [];
    function actualizar() {
      const marcadas = controles.filter(({ casilla }) => casilla.checked);
      const n = marcadas.reduce((total, { sede }) => total + sede.recibos.length, 0);
      todas.checked = marcadas.length === controles.length;
      todas.indeterminate = marcadas.length > 0 && !todas.checked;
      aplicar.disabled = !n;
      estado.textContent = textoCantidad(n, 'recibo', 'recibos') + ' · ' +
        textoCantidad(marcadas.length, 'sede', 'sedes');
    }

    todas.addEventListener('change', () => {
      controles.forEach(({ casilla }) => { casilla.checked = todas.checked; });
      actualizar();
    });

    const sedes = { selector, boton: botonSedes, panel, cargar(disponibles, seleccion) {
      const seleccionadas = new Set(seleccion.map(r => r.loteClienteId));
      controles = disponibles.map(sede => {
        const fila = elemento('label', '', { class: 'ms-opcion' });
        const casilla = elemento('input', '', { type: 'checkbox' });
        casilla.checked = seleccionadas.has(sede.id);
        casilla.addEventListener('change', actualizar);
        fila.append(casilla, elemento('span', sede.nombre), elemento('small', textoCantidad(sede.recibos.length, 'recibo', 'recibos')));
        return { fila, casilla, sede };
      });
      contenido.replaceChildren(...controles.map(({ fila }) => fila));
      actualizar();
    } };
    return sedes;
  }

  function pintarSedes(sedes, filas, primero, seleccion) {
    const disponibles = agruparPorSede(filas.filter(r => grupo(r) === grupo(primero)));
    const mostrar = disponibles.length > 1 && !pendiente;
    sedes.selector.hidden = !mostrar;
    sedes.boton.disabled = ocupado();
    if (mostrar) sedes.cargar(disponibles, seleccion);
    else mostrarSedes(sedes, false);
    return mostrar;
  }

  function crearBarra(box) {
    const ayuda = elemento('p', 'Selecciona un recibo para preparar el envío.', { class: 'rec-lote-ayuda' });
    const acciones = elemento('div', '', { class: 'rec-lote-acciones ms-paquete' });
    const nombre = elemento('strong');
    const detalle = elemento('span');
    const alcance = elemento('div', '', { class: 'rec-lote-alcance', role: 'status' });
    alcance.append(nombre, detalle);
    const todos = boton('', () => {
      const key = grupo(elegidos.values().next().value);
      visibles().filter(r => grupo(r) === key).forEach(r => elegidos.set(r.recibo, r));
      window.rx2Pintar_();
      barra.revisar.focus();
    });
    const quitar = boton('Limpiar', () => {
      elegidos.clear();
      window.rx2Pintar_();
    });
    quitar.setAttribute('aria-label', 'Limpiar selección');
    const revisar = boton('Revisar correo', abrir, 'rx2-bt rec-lote-principal');
    const sedes = crearSedes();
    acciones.append(alcance, todos, sedes.selector, quitar, revisar);
    box.before(ayuda, acciones);
    return { ayuda, acciones, nombre, detalle, todos, quitar, revisar, sedes };
  }

  function fechaLarga(iso) {
    return new Intl.DateTimeFormat('es-PA', { dateStyle: 'long', timeZone: 'UTC' })
      .format(new Date(iso + 'T12:00:00Z'));
  }

  function pintaBarra(box, filas, primero) {
    if (!barra || !barra.acciones.isConnected) barra = crearBarra(box);
    barra.ayuda.hidden = !!primero || !filas.length || window.RX2.cargando;
    barra.acciones.hidden = !primero;
    if (!primero) {
      mostrarSedes(barra.sedes, false);
      return;
    }

    const seleccion = pendiente ? pendiente.filas : Array.from(elegidos.values());
    const n = seleccion.length;
    const compatibles = filas.filter(r => grupo(r) === grupo(primero)).length;
    barra.nombre.textContent = primero.loteCuenta || primero.cliente;
    barra.detalle.textContent = fechaLarga(primero.fecha) + ' · ' +
      textoCantidad(n, 'recibo seleccionado', 'recibos seleccionados') + ' · ' +
      textoCantidad(agruparPorSede(seleccion).length, 'sede', 'sedes');
    barra.todos.textContent = 'Seleccionar los ' + compatibles + ' de este día';
    const tieneSedes = pintarSedes(barra.sedes, filas, primero, seleccion);
    barra.todos.hidden = tieneSedes || !!pendiente || !compatibles || compatibles <= n;
    barra.todos.disabled = ocupado();
    barra.revisar.textContent = pendiente ? 'Consultar envío pendiente' : 'Revisar correo';
    barra.revisar.disabled = ocupado() || window.RX2.cargando;
    barra.quitar.disabled = !!pendiente || ocupado();
  }

  function agregaCasilla(fila, recibo, key) {
    const esTabla = fila.tagName === 'TR';
    const id = recibo.recibo;
    const keyRecibo = grupo(recibo);
    const celda = elemento(esTabla ? 'td' : 'label', '', { class: 'rec-lote-celda' });
    const casilla = elemento('input', '', { type: 'checkbox', 'data-rec-lote-elige': id, 'aria-label': 'Seleccionar recibo ' + id });
    casilla.checked = elegidos.has(id);
    casilla.disabled = !keyRecibo || (!!key && keyRecibo !== key) || ocupado() || !!pendiente;
    if (!keyRecibo) celda.title = 'El recibo necesita una sede identificada y fecha de recolección.';
    else if (key && key !== keyRecibo) celda.title = 'Este recibo es de otra cuenta o fecha.';
    celda.append(casilla);
    if (!esTabla) celda.append(' Seleccionar recibo');
    casilla.addEventListener('change', () => {
      if (casilla.checked) elegidos.set(id, recibo);
      else elegidos.delete(id);
      window.rx2Pintar_();
      const zona = esTabla ? '.rx2-tabla' : '.rx2-cards';
      document.querySelector(zona + ' [data-rec-lote-elige="' + CSS.escape(id) + '"]')?.focus({ preventScroll: true });
    });
    fila.prepend(celda);
  }

  window.rx2Pintar_ = function () {
    pintarRecibos.apply(this, arguments);
    actualizarSesion();
    const box = document.getElementById('rx2-cuerpo');
    if (!box) return;
    if (!window.esSupervisor()) {
      elegidos.clear();
      if (barra) barra.ayuda.hidden = barra.acciones.hidden = true;
      return;
    }
    const filas = visibles();
    const porFolio = new Map(filas.map(r => [r.recibo, r]));
    if (!window.RX2.cargando && !pendiente && !ocupado()) {
      for (const [id, r] of elegidos) {
        const actualizado = porFolio.get(id);
        if (!actualizado || grupo(actualizado) !== grupo(r)) elegidos.delete(id);
        else elegidos.set(id, actualizado);
      }
    }
    const primero = pendiente ? pendiente.filas[0] : elegidos.values().next().value;
    const key = grupo(primero);
    for (const fila of box.querySelectorAll('.rx2-tabla tbody tr, .rx2-card')) {
      const id = (fila.querySelector('td:first-child b, .m b')?.textContent || '').trim();
      if (porFolio.has(id)) agregaCasilla(fila, porFolio.get(id), key);
    }
    const cabecera = box.querySelector('.rx2-tabla thead tr');
    if (cabecera) cabecera.prepend(elemento('th', 'Selección', { scope: 'col', class: 'rec-lote-celda' }));
    pintaBarra(box, filas, primero);
  };

  function campo(control, etiqueta) {
    const nodo = elemento('div', '', { class: 'rec-lote-campo' });
    nodo.append(elemento('label', etiqueta, { for: control.id }), control);
    return nodo;
  }

  function crearDialogo() {
    const nodo = elemento('dialog', '', { class: 'rec-lote-modal rec-lote-paquete', 'aria-labelledby': 'rec-lote-titulo' });
    const cabecera = elemento('header');
    const cerrar = boton('Cerrar', () => { if (!ocupado()) nodo.close(); });
    cabecera.append(elemento('strong', 'Revisar correo del paquete', { id: 'rec-lote-titulo' }), cerrar);
    const form = elemento('form');
    const resumen = elemento('div', '', { class: 'rec-lote-resumen' });
    const archivos = elemento('ul');
    const adjuntos = elemento('details', '', { class: 'rec-lote-adjuntos' });
    const rotulo = elemento('summary');
    adjuntos.append(rotulo, archivos);

    const para = elemento('input', '', { id: 'rec-lote-destino', type: 'email', required: '', maxlength: '254', placeholder: 'nombre@ejemplo.com' });
    const asunto = elemento('input', '', { id: 'rec-lote-asunto', required: '', maxlength: '200' });
    const texto = elemento('textarea', '', { id: 'rec-lote-texto', required: '', maxlength: '6000', rows: '9' });
    const estado = elemento('p', '', { class: 'rec-lote-estado', role: 'status' });
    const acciones = elemento('div', '', { class: 'rec-lote-botones' });
    const enviar = elemento('button', 'Enviar correo con los PDF', { type: 'submit', class: 'rx2-bt rec-lote-principal' });
    acciones.append(enviar);
    form.append(resumen, campo(para, 'Correo de destino'), campo(asunto, 'Asunto'), campo(texto, 'Mensaje'), adjuntos, estado, acciones);
    form.addEventListener('submit', e => {
      e.preventDefault();
      enviarPaquete();
    });
    nodo.addEventListener('cancel', e => { if (ocupado()) e.preventDefault(); });
    nodo.append(cabecera, form);
    document.body.append(nodo);
    return { nodo, cerrar, resumen, para, asunto, texto, adjuntos, rotulo, archivos, estado, enviar };
  }

  function borrador(filas, sedes) {
    const r = filas[0];
    const fecha = fechaLarga(r.fecha);
    const n = filas.length;
    return {
      asunto: (n === 1 ? 'Recibo' : 'Recibos') + ' de recolección del ' + fecha + ' · ECOVSA',
      texto: 'Estimado equipo de ' + (r.loteCuenta || r.cliente) + ':\n\nAdjuntamos en PDF ' +
        (n === 1 ? 'el comprobante' : 'los ' + n + ' comprobantes') +
        ' de la recolección de desechos hospitalarios del ' + fecha +
        '.\n\n' + (sedes.length > 1 ? 'Sedes incluidas: ' + sedes.map(s => s.nombre).join(', ') + '.\n\n' : '') +
        'Gracias por confiar en ECOVSA.\nTel. 310-2268 · info@ecovsa.com'
    };
  }

  function abrir() {
    actualizarSesion();
    if (!window.esSupervisor() || ocupado()) return;
    const filas = pendiente ? pendiente.filas : Array.from(elegidos.values());
    if (!filas.length) return;
    if (!dialogo) dialogo = crearDialogo();
    const { nodo, resumen, para, asunto, texto, adjuntos, rotulo, archivos } = dialogo;
    const sedes = agruparPorSede(filas);
    const datos = pendiente ? pendiente.datos : borrador(filas, sedes);
    resumen.replaceChildren(
      elemento('strong', filas[0].loteCuenta || filas[0].cliente),
      elemento('span', fechaLarga(filas[0].fecha) + ' · ' + textoCantidad(sedes.length, 'sede', 'sedes'))
    );
    rotulo.textContent = filas.length + (filas.length === 1 ? ' PDF adjunto' : ' PDF adjuntos');
    archivos.replaceChildren(...sedes.map(sede => {
      const item = elemento('li', '', { class: 'ms-grupo-adjunto' });
      const lista = elemento('ul');
      lista.append(...sede.recibos.map(r => elemento('li', 'Recibo ' + r.recibo + ' · PDF')));
      item.append(elemento('strong', sede.nombre), lista);
      return item;
    }));
    adjuntos.open = sedes.length > 1;
    para.value = pendiente ? datos.para : '';
    asunto.value = datos.asunto;
    texto.value = datos.texto;
    nodo.showModal();
    pintarEnvio(pendiente ? 'Puedes consultar o reintentar este mismo correo. Comprueba Resend antes de iniciar otro envío.' : '');
    if (!pendiente) para.focus();
  }

  function pintarEnvio(mensaje, repintar = false) {
    const { para, asunto, texto, enviar, cerrar, estado } = dialogo;
    for (const control of [para, asunto, texto]) control.readOnly = ocupado() || !!pendiente;
    enviar.disabled = cerrar.disabled = ocupado();
    enviar.textContent = preparando ? 'Preparando PDF…' : enviando ? 'Enviando…' :
      pendiente ? 'Reintentar este mismo envío' : 'Enviar correo con los PDF';
    estado.textContent = mensaje;
    if (repintar) window.rx2Pintar_();
  }

  async function prepararAdjuntos(filas, pin) {
    const recibos = [];
    let bytes = 0;
    for (const r of filas) {
      pintarEnvio('Preparando PDF ' + (recibos.length + 1) + ' de ' + filas.length + '…');
      const detalle = await canales.rpc('api_obtenerDetalleRecibo', [r.recibo, '', pin]);
      const pdf = await canales.pdfCanonico(detalle.datos, detalle.empresa);
      bytes += pdf.blob.size;
      if (pdf.blob.size > porPDF) throw Error('El PDF del recibo ' + r.recibo + ' supera 2 MB.');
      if (bytes > porCorreo) throw Error('Los PDF suman más de 5 MB. Quita algunos recibos para este correo.');
      recibos.push({ folio: r.recibo, pdf: await canales.base64(pdf.blob) });
      if (pin !== window.PIN) throw Error('La sesión cambió.');
    }
    return recibos;
  }

  async function enviarPaquete() {
    if (ocupado() || !window.esSupervisor()) return;
    const pin = window.PIN;
    try {
      if (!pendiente) {
        const correos = canales.correos(dialogo.para.value);
        if (correos.length !== 1) throw Error('Escribe un solo correo de destino.');
        const asunto = dialogo.asunto.value.trim();
        const texto = dialogo.texto.value.trim();
        if (!asunto || !texto) throw Error('Completa el asunto y el mensaje.');
        const filas = Array.from(elegidos.values());
        const primero = filas[0];
        if (!primero) throw Error('Selecciona al menos un recibo.');
        preparando = true;
        pintarEnvio('Preparando los PDF…', true);
        const recibos = await prepararAdjuntos(filas, pin);
        pendiente = { filas, datos: {
          id: crypto.randomUUID(), para: correos[0], asunto, texto,
          cuenta: primero.loteCuentaId, sede: primero.loteClienteId, fecha: primero.fecha, recibos
        } };
      }
      preparando = false;
      enviando = true;
      pintarEnvio('Enviando el correo…', true);
      const respuesta = await canales.rpc('api_recCorreoLote', [pin, pendiente.datos]);
      if (!respuesta.aceptado) throw Error('El proveedor no confirmó el envío.');
      if (pin === window.PIN) {
        pendiente = null;
        elegidos.clear();
        dialogo.nodo.close();
        window.toast('Resend aceptó el correo con los PDF.');
        window.rx2Cargar_();
      }
    } catch (error) {
      if (pin === window.PIN) {
        if (!error.incierto && !/conect|confirm|fetch|network|timeout|abort/i.test(error.message)) pendiente = null;
        preparando = enviando = false;
        pintarEnvio(error.message || 'No se pudo completar el envío.', true);
      }
    } finally {
      preparando = enviando = false;
      if (!dialogo.nodo.open) window.rx2Pintar_();
    }
  }
})();
