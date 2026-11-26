(function () {
  'use strict';

  const script = document.currentScript;
  const pagina = script?.dataset.modulo;
  if (!pagina || window.top !== window || window.EcovsaApp || (/Android/i.test(navigator.userAgent) && /\bwv\b/.test(navigator.userAgent))) return;

  const html = document.documentElement;
  // El Iris se encarga de estas navegaciones. Evita que compita con la transición automática de Mercadeo.
  const transicionNativa = document.createElement('style');
  transicionNativa.textContent = '@view-transition { navigation: none; }';
  script.after(transicionNativa);
  const rutas = [
    ['lobby', 'Mi día', 'index.html'], ['inicio', 'Dirección', 'Inicio.html'],
    ['campo', 'Logística', 'Index.html'], ['planta', 'Planta', 'Planta.html'],
    ['alta', 'Mercadeo', 'Mercadeo.html'], ['cobros', 'Cobros', 'Cobros.html'],
    ['finanzas', 'Finanzas', 'Finanzas.html'], ['administracion', 'Administración', 'Administracion.html'],
    ['fumigacion', 'Fumigación', 'Fumigacion.html'], ['solicitud', 'Solicitud de pago', 'SolicitudPago.html'],
    ['certificados', 'Certificados', 'Certificado.html'], ['config', 'Configuración', 'Configuracion.html'],
    ['calidad', 'Calidad', 'Calidad.html'], ['seguridad', 'Seguridad', 'Seguridad.html']
  ].map(([id, nombre, archivo]) => ({ id, nombre, archivo }));

  function sesion() {
    try { return JSON.parse(localStorage.getItem('ecovsa_pin') || 'null'); } catch { return null; }
  }

  const ui = window.EcovsaAurora = {
    pagina, rutas, permitidos: ['lobby'], iconos: {"casa":"<path d=\"M3 11l9-7 9 7\"/><path d=\"M5 10v10h14V10\"/>","personas":"<circle cx=\"9\" cy=\"8\" r=\"3.5\"/><path d=\"M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5\"/><circle cx=\"17\" cy=\"7\" r=\"2.8\"/><path d=\"M16 12.8c2.7.2 4.6 2 5.5 5\"/>","llave":"<circle cx=\"8\" cy=\"15\" r=\"4\"/><path d=\"M11 12l9-9M17 6l3 3M14 9l2 2\"/>","escudo":"<path d=\"M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z\"/>","billete":"<rect x=\"2.5\" y=\"6\" width=\"19\" height=\"12\" rx=\"2.2\"/><circle cx=\"12\" cy=\"12\" r=\"2.8\"/><path d=\"M6 9.5v5M18 9.5v5\"/>","moneda":"<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M14.8 9.2a3 3 0 0 0-2.8-1.7c-1.6 0-2.7.9-2.7 2.1 0 2.9 5.6 1.6 5.6 4.5 0 1.3-1.2 2.2-2.9 2.2a3.1 3.1 0 0 1-2.9-1.8\"/><path d=\"M12 6v12\"/>","ajustes":"<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1\"/>","camion":"<path d=\"M3 6h11v10H3zM14 10h4l3 3v3h-7\"/><circle cx=\"7\" cy=\"18\" r=\"2\"/><circle cx=\"17\" cy=\"18\" r=\"2\"/>","maletin":"<rect x=\"3\" y=\"7\" width=\"18\" height=\"13\" rx=\"2\"/><path d=\"M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18\"/>","planta":"<path d=\"M3 21h18M5 21V10l5 3V10l5 3V6l4 2v13\"/>","matraz":"<path d=\"M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 18l-5-9V3\"/><path d=\"M7 15h10\"/>","brujula":"<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M15.5 8.5l-2 5-5 2 2-5z\"/>","sello":"<circle cx=\"12\" cy=\"9\" r=\"5.5\"/><path d=\"M9 13.8 7.5 21l4.5-2.4 4.5 2.4-1.5-7.2\"/><path d=\"M10 9l1.5 1.5L14 7.5\"/>","recibo":"<circle cx=\"12\" cy=\"9\" r=\"5.5\"/><path d=\"M9 13.8 7.5 21l4.5-2.4 4.5 2.4-1.5-7.2\"/><path d=\"M10 9l1.5 1.5L14 7.5\"/>"},
    activo() { return pagina !== 'campo' || document.body?.classList.contains('es-sup'); }
  };
  html.dataset.ecovsaAurora = '';
  let ultimaSesion;
  let ultimaConsulta = 0;
  let pendiente;

  ui.permisos = () => {
    const llave = sesion();
    if (!llave) return Promise.resolve(false);
    if (llave === ultimaSesion && Date.now() - ultimaConsulta < 45_000) return Promise.resolve(true);
    if (pendiente?.llave === llave) return pendiente.promesa;

    const validar = window.google?.script?.run;
    if (!validar) return Promise.resolve(false);
    const permiso = { llave };
    pendiente = permiso;
    permiso.promesa = new Promise(resolve => {
      const limite = setTimeout(() => terminar(null), 4500);
      let terminado = false;
      function terminar(r) {
        if (terminado) return;
        terminado = true;
        clearTimeout(limite);
        if (pendiente === permiso) pendiente = null;
        if (r?.ok && r.permisos && sesion() === llave) {
          ui.usuario = r.usuario;
          ui.permitidos = rutas.filter(m => m.id === 'lobby' || ['ve', 'trabaja'].includes(r.permisos[m.id])).map(m => m.id);
          ultimaSesion = llave;
          ultimaConsulta = Date.now();
          resolve(true);
        } else {
          if (sesion() === llave) ui.permitidos = ['lobby'];
          resolve(false);
        }
      }
      try {
        validar.withSuccessHandler(terminar).withFailureHandler(() => terminar(null)).api_misPermisos(llave);
      } catch { terminar(null); }
    });
    return permiso.promesa;
  };

  ui.usuariosLocal = () => ui.usuario || window.MK?.usuario || window.USUARIO || window._US || {};

  // Los paneles antiguos conservan sus propios controles. Solo se añade el acceso común.
  ui.cabeceraAntigua = () => {
    if (document.body.dataset.auroraMarco !== 'antiguo' || !sesion()) return null;
    const barra = document.querySelector('body > header, #app > header, #contenido > header, header');
    if (!barra || !barra.getClientRects().length) return null;
    if (barra.querySelector('.aurora-legado')) return barra;
    const zona = document.createElement('div');
    zona.className = 'aurora-legado';
    const marca = document.createElement('button');
    marca.type = 'button';
    marca.className = 'aurora-regreso';
    marca.setAttribute('aria-label', 'Volver al Lobby');
    const imagen = document.createElement('img');
    imagen.src = 'ecovsa-emblema.png';
    imagen.alt = '';
    marca.append(imagen);
    marca.addEventListener('click', e => ui.abrirRuta?.('index.html', e));
    const modulo = document.createElement('span');
    modulo.className = 'mod';
    modulo.textContent = rutas.find(r => r.id === pagina)?.nombre || 'Dirección';
    const usuario = document.createElement('button');
    usuario.type = 'button';
    usuario.className = 'aurora-legado-usuario';
    usuario.setAttribute('aria-label', 'Tu usuario');
    usuario.textContent = 'Tu usuario';
    usuario.addEventListener('click', async () => {
      if (!window.TemaECOVSA) return;
      await ui.permisos();
      if (sesion() && !document.querySelector('#ent.bq')) TemaECOVSA.menuUsuario(usuario, ui.usuariosLocal());
    });
    zona.append(marca, modulo, usuario);
    barra.append(zona);
    return barra;
  };
})();

/* Parche del laboratorio. Trabaja sobre los controles de las páginas originales. */
(() => {
  'use strict';

  const html = document.documentElement;
  const params = new URLSearchParams(location.search);
  const vista = 'piel';
  const pruebaBarra = 'propuesta';
  const clavePiel = 'eco_aurora_piel';
  const claveRiel = 'eco_piel_riel_fijo';
  const memoria = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch {} }
  };
  const temas = [['noche', 'Noche Oscura'], ['clara', 'Mañana Clara']];
  const recursos = window.EcovsaAurora;
  if (!recursos) return;
  const rutas = recursos.rutas;
  const esDocumento = recursos.pagina === 'recibo';
  const animar = () => !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esTema = valor => temas.some(([k]) => k === valor);

  function crear(etiqueta, texto, atributos = {}) {
    const el = document.createElement(etiqueta);
    if (texto) el.textContent = texto;
    for (const [k, v] of Object.entries(atributos)) el.setAttribute(k, v);
    return el;
  }

  function boton(texto, accion, atributos = {}) {
    const el = crear('button', texto, { type: 'button', ...atributos });
    el.addEventListener('click', accion);
    return el;
  }

  function cambiarTema(valor, persistir) {
    if (!esTema(valor)) return;
    html.dataset.pgPiel = valor;
    const tablero = document.getElementById('tablero');
    if (tablero) tablero.dataset.piel = valor;
    if (persistir) memoria.set(clavePiel, valor);
    for (const b of document.querySelectorAll('#tm-menu-us [data-piel]')) {
      b.setAttribute('aria-pressed', String(b.dataset.piel === valor));
    }
  }

  html.dataset.pgVista = vista;
  if (vista === 'piel' && pruebaBarra) html.dataset.pgBarra = pruebaBarra;
  const temaInicial = esTema(params.get('tema')) ? params.get('tema') : memoria.get(clavePiel);
  cambiarTema(temaInicial === 'clara' ? 'clara' : 'noche', !!temaInicial);
  window.addEventListener('storage', e => { if (e.key === clavePiel) cambiarTema(e.newValue, false); });

  const paginas = new Set(["index.html","Index.html","Inicio.html","Planta.html","Mercadeo.html","Cobros.html","Configuracion.html","Calidad.html","Seguridad.html","Fumigacion.html","MerAgenda.html","MerAjustes.html","MerCliente.html","MerClientes.html","MerCompras.html","MerCuenta.html","MerDocumentos.html","MerEncuestas.html","MerEntregables.html","MerMinsa.html","MerOportunidad.html","MerOportunidades.html","MerReportes.html","MerTarifario.html","Administracion.html","Alta.html","SolicitudPago.html","Certificado.html","Panel.html","RCartera.html","RZona.html"]);
  function resolver(href) {
    try {
      const url = new URL(href, location.href);
      const id = url.searchParams.get('p');
      const ruta = rutas.find(r => r.id === id);
      if (ruta) {
        const local = new URL(ruta.archivo, location.href);
        for (const [k, v] of url.searchParams) if (k !== 'p') local.searchParams.set(k, v);
        if (url.hash) local.hash = url.hash;
        return resolver(local);
      }
      if (new URL('.', url).href !== new URL('.', location.href).href) return null;
      const nombre = url.pathname.split('/').at(-1);
      if (nombre === 'Finanzas.html') {
        const finanzas = new URL('Inicio.html', location.href);
        finanzas.hash = url.hash || 'fut';
        return finanzas;
      }
      return paginas.has(nombre) ? url : null;
    } catch { return null; }
  }

  let navegando = false;
  let ultimoClic;
  const puntoIris = /^(\d{1,3})-(\d{1,3})$/.exec(params.get('iris') || '')?.slice(1).map(Number);
  const llegaIris = !esDocumento && vista === 'piel' && puntoIris?.every(n => n <= 100) && animar();
  if (llegaIris) {
    html.dataset.pgIris = 'espera';
    html.style.setProperty('--pg-x', puntoIris[0] + '%');
    html.style.setProperty('--pg-y', puntoIris[1] + '%');
  }
  if (params.has('iris')) {
    const limpia = new URL(location.href);
    limpia.searchParams.delete('iris');
    try { history.replaceState(history.state, '', limpia); } catch {}
  }

  function marcaOrbital() {
    const marca = crear('div', '', { class: 'pg-orbital' });
    const etapa = crear('div', '', { class: 'pg-orbital-etapa' });
    const disco = crear('div', '', { class: 'pg-orbital-disco' });
    const flechas = crear('div', '', { class: 'pg-orbital-flechas' });
    const imagen = parte => crear('img', '', { src: 'entrada-' + parte + '.png', alt: '', draggable: 'false' });
    flechas.append(imagen('flecha-a'), imagen('flecha-b'));
    disco.append(imagen('globo'), imagen('bio'), flechas);
    etapa.append(disco);
    const lema = crear('span', '', { class: 'pg-orbital-lema' });
    lema.append(crear('i'), crear('i'), crear('i'), document.createTextNode('Ecología · Vida · Salud'));
    marca.append(etapa, lema);
    return marca;
  }

  function montarIris(fase) {
    const iris = crear('div', '', { class: 'pg-iris', 'data-fase': fase, 'aria-hidden': 'true' });
    iris.append(marcaOrbital());
    document.body.append(iris);
    return iris;
  }

  function quitarIris() {
    document.querySelector('.pg-iris')?.remove();
    delete html.dataset.pgIris;
    html.style.removeProperty('--pg-x');
    html.style.removeProperty('--pg-y');
    navegando = false;
  }

  function recibirIris() {
    const iris = montarIris('llegada');
    html.dataset.pgIris = 'llegada';
    const inicio = performance.now();
    function esperarPantalla() {
      if (!iris.isConnected) return;
      const cargando = document.querySelector('#eco-cortina:not(.fuera)');
      const tiempo = performance.now() - inicio;
      if (tiempo < 140 || cargando) {
        requestAnimationFrame(esperarPantalla);
        return;
      }
      iris.dataset.fase = 'revelar';
      setTimeout(quitarIris, 265);
    }
    requestAnimationFrame(esperarPantalla);
  }

  function navegar(url, evento) {
    const a = resolver(url);
    if (!a || !recursos.activo()) return false;
    if (navegando || document.querySelector('#ent.bq')) return true;
    if (a.pathname === location.pathname && a.search === location.search) {
      if (a.hash !== location.hash) location.assign(a);
      return true;
    }
    if (!animar()) { location.assign(a); return true; }
    navegando = true;
    const iris = montarIris('salida');
    const origen = evento?.detail ? evento : performance.now() - (ultimoClic?.desde ?? -Infinity) <= 550 ? ultimoClic : null;
    const porcentaje = (p, ancho) => Math.min(100, Math.max(0, Math.round(100 * (p ?? ancho / 2) / ancho)));
    const x = porcentaje(origen?.clientX, innerWidth);
    const y = porcentaje(origen?.clientY, innerHeight);
    iris.style.setProperty('--pg-x', x + '%');
    iris.style.setProperty('--pg-y', y + '%');
    a.searchParams.set('iris', x + '-' + y);
    setTimeout(() => location.assign(a), 355);
    return true;
  }

  document.addEventListener('click', e => {
    ultimoClic = e.detail ? { clientX: e.clientX, clientY: e.clientY, desde: performance.now() } : undefined;
  }, true);
  document.addEventListener('click', e => {
    if (vista !== 'piel' || esDocumento || e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    const enlace = e.target.closest?.('a[href]:not([download],[data-no-iris],[onclick])');
    if (!enlace || enlace.target && enlace.target !== '_self') return;
    const url = new URL(enlace.href);
    if (url.protocol !== location.protocol) return;
    const mismaCarpeta = new URL('.', url).href === new URL('.', location.href).href;
    if (!recursos.activo() || !mismaCarpeta || url.hash || !resolver(url)) return;
    e.preventDefault();
    abrirModulo(url.href, e);
  });
  window.addEventListener('pageshow', e => { if (e.persisted) quitarIris(); });
  recursos.navegar = navegar;
  recursos.abrirRuta = abrirModulo;

  recursos.presentarBloqueo = (pantalla, nombre, abrir, motivo) => {
    if (!recursos.activo()) return false;
    recursos.cerrarSelectorBarra?.();
    document.querySelectorAll('dialog.pg-confirmacion[open],dialog.pg-espera[open],dialog.pg-selector[open]').forEach(d => d.close());
    pantalla.setAttribute('aria-label', 'Pantalla bloqueada');
    pantalla.setAttribute('aria-modal', 'true');
    pantalla.classList.add('pg-bq-lista');
    const acciones = crear('div', '', { class: 'pg-bq-acciones' });
    const botones = crear('div', '', { class: 'pg-bq-botones' });
    const identidad = crear('p', '', { class: 'pg-bq-identidad' });
    const usuario = recursos.usuariosLocal();
    const nombreVisible = nombre || usuario.nombre || 'Tu sesión';
    const iniciales = nombreVisible.split(/\s+/).slice(0, 2).map(palabra => palabra[0]).join('');
    identidad.append(crear('span', iniciales, { 'aria-hidden': 'true' }), crear('b', nombreVisible), crear('small', usuario.rotulo || window.TemaECOVSA?.roles?.[usuario.rol] || ''));
    function abrirFormulario(cambiarUsuario) {
      acciones.remove();
      pantalla.classList.remove('pg-bq-lista');
      abrir(cambiarUsuario);
      if (!cambiarUsuario) pantalla.querySelector('.bq-formulario .go')?.setAttribute('aria-label', 'Desbloquear');
    }
    const continuar = boton('Desbloquear', () => abrirFormulario(false));
    botones.append(continuar, boton('Cambiar usuario', () => abrirFormulario(true), { class: 'pg-bq-cambiar' }));
    acciones.append(crear('h2', motivo === 'inactividad' ? 'Bloqueo por inactividad' : 'Pantalla bloqueada'), identidad, botones);
    pantalla.append(acciones);
    continuar.focus({ preventScroll: true });
    return true;
  };

  function opciones(titulo, items, conBusqueda) {
    document.querySelector('.pg-selector')?.remove();
    const dialogo = crear('dialog', '', { class: 'pg-selector', 'aria-labelledby': 'pg-selector-titulo' });
    const header = crear('header');
    const list = crear('div', '', { class: 'pg-opciones' });
    header.append(crear('strong', titulo, { id: 'pg-selector-titulo' }), boton('Cerrar', () => dialogo.close()));
    dialogo.append(header);
    const buscar = conBusqueda ? crear('input', '', { type: 'search', placeholder: 'Buscar módulo', 'aria-label': 'Buscar módulo' }) : null;
    const pintar = () => {
      const q = buscar?.value.trim().toLocaleLowerCase('es') || '';
      list.replaceChildren(...items.filter(x => x.nombre.toLocaleLowerCase('es').includes(q)).map(x => boton(x.nombre, e => {
        dialogo.close();
        x.accion(e);
      })));
      if (!list.childElementCount) list.append(crear('p', 'Sin coincidencias'));
    };
    if (buscar) {
      buscar.addEventListener('input', pintar);
      buscar.addEventListener('keydown', e => {
        if (e.key === 'Enter') list.querySelector('button')?.click();
      });
      dialogo.append(buscar);
    }
    dialogo.append(list);
    dialogo.addEventListener('close', () => dialogo.remove());
    document.body.append(dialogo);
    pintar();
    dialogo.showModal();
    buscar?.focus();
  }

  async function modulos(evento) {
    const control = document.querySelector('.pg-barra .pg-modulo');
    if (!recursos.activo() || !control) return;
    if (control.getAttribute('aria-expanded') === 'true') { recursos.cerrarSelectorBarra?.(); control.focus(); return; }
    if (control.getAttribute('aria-busy') === 'true') return;
    control.setAttribute('aria-busy', 'true');
    await recursos.permisos();
    control.removeAttribute('aria-busy');
    if (!control.isConnected || document.querySelector('#ent.bq')) return;
    const escribir = !evento?.detail || matchMedia('(min-width: 768px)').matches;
    if (recursos.abrirSelectorBarra?.(control, abrirModulo, escribir)) return;
    const permitidos = rutas.filter(x => recursos.permitidos.includes(x.id) && x.id !== recursos.pagina && !['certificados', 'fumigacion'].includes(x.id));
    opciones('Módulos', permitidos.map(x => ({ nombre: x.nombre, accion: e => abrirModulo(x.archivo, e) })), true);
  }

  function abrirModulo(archivo, evento) {
    const tema = window.TemaECOVSA;
    if (!tema?.aMedias?.()) { navegar(archivo, evento); return; }
    if (tema.confirmarSalida) tema.confirmarSalida(() => navegar(archivo));
    else recursos.confirmar({ titulo: '¿Salir sin guardar?', mensaje: 'Hay cambios sin guardar en esta pantalla.',
      cancelar: 'Seguir aquí', boton: 'Salir sin guardar', peligro: true }, ok => { if (ok) navegar(archivo); });
  }

  function actualizarMenuUsuario() {
    const menu = document.getElementById('tm-menu-us');
    if (!menu || menu.querySelector('.pg-temas')) return;
    const actual = menu.querySelector('.aurora-temas');
    if (actual) {
      actual.classList.add('pg-temas');
      for (const [id, nombre] of temas) {
        const control = actual.querySelector('[data-piel="' + id + '"]');
        if (control) {
          control.textContent = nombre;
          control.addEventListener('click', () => cambiarTema(id, true));
        }
      }
      return;
    }
    const grupo = crear('fieldset', '', { class: 'pg-temas' });
    const controles = crear('div');
    for (const [id, nombre] of temas) controles.append(boton(nombre, () => cambiarTema(id, true), {
      'data-piel': id, 'aria-pressed': String(html.dataset.pgPiel === id)
    }));
    grupo.append(crear('legend', 'Apariencia'), controles);
    menu.firstElementChild?.after(grupo);
  }

  function activo(a) {
    return a.classList.contains('on') || a.getAttribute('aria-current') === 'page';
  }

  function etiqueta(a) {
    const copia = a.cloneNode(true);
    copia.querySelectorAll('svg, em, .n, small').forEach(n => n.remove());
    return copia.textContent.trim();
  }

  let firmaMovil = '';
  function movil(opcionesNativas) {
    const firma = opcionesNativas.map(a => [etiqueta(a), activo(a)].join(':')).join('|');
    if (firma === firmaMovil) return;
    firmaMovil = firma;
    let barra = document.querySelector('.pg-movil');
    if (!barra) {
      barra = crear('nav', '', { class: 'pg-movil', 'aria-label': 'Navegación del módulo' });
      document.body.append(barra);
    }
    document.body.dataset.pgMovil = '';
    const botones = opcionesNativas.map(a => {
      const item = boton('', () => a.click());
      if (activo(a)) item.setAttribute('aria-current', 'page');
      const ic = a.querySelector('svg');
      if (ic) item.append(ic.cloneNode(true));
      item.append(crear('span', etiqueta(a)));
      return item;
    });
    barra.replaceChildren(...botones);
    const activa = barra.querySelector('[aria-current="page"]');
    if (activa && barra.clientWidth) barra.scrollLeft = activa.offsetLeft - (barra.clientWidth - activa.offsetWidth) / 2;
  }

  function fijar(riel) {
    if (riel.querySelector('.pg-fijar')) return;
    const b = boton('', () => {
      const fijo = document.body.dataset.pgFijo !== 'true';
      document.body.dataset.pgFijo = String(fijo);
      memoria.set(claveRiel, fijo ? '1' : '0');
      rotulo();
    }, { class: 'pg-fijar' });
    const texto = crear('span');
    const icono = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icono.setAttribute('viewBox', '0 0 24 24');
    icono.setAttribute('aria-hidden', 'true');
    const trazo = document.createElementNS(icono.namespaceURI, 'path');
    trazo.setAttribute('d', 'm9 4 11 11-4 1-2 4-3-5-7-3 4-2 1-6Zm2 11-6 6');
    icono.append(trazo);
    const interruptor = crear('i', '', { class: 'pg-pin-estado', 'aria-hidden': 'true' });
    b.append(icono, texto, interruptor);
    function rotulo() {
      const fijo = document.body.dataset.pgFijo === 'true';
      texto.textContent = fijo ? 'Soltar barra' : 'Fijar barra';
      b.setAttribute('aria-pressed', String(fijo));
      b.title = texto.textContent;
    }
    rotulo();
    const encabezado = crear('div', '', { class: 'pg-riel-encabezado' });
    encabezado.append(crear('i'), crear('span', rutas.find(r => r.id === recursos.pagina)?.nombre));
    riel.prepend(encabezado);
    riel.append(crear('div', '', { class: 'pg-riel-pie' }));
    riel.lastElementChild.append(b);
  }

  function decorar() {
    if (!recursos.activo()) return;
    const barra = document.querySelector('#tablero .lb, #sysbar.sysbar, body.es-sup > header') || recursos.cabeceraAntigua();
    if (!barra) return;
    barra.classList.add('pg-barra');
    const marca = barra.querySelector('.logo-img-header, .lg');
    const letras = barra.querySelector('.mk, .wm, .brand-mk');
    if (marca?.matches('.pg-marca[title]')) marca.removeAttribute('title');
    if (marca && recursos.pagina !== 'lobby' && !marca.classList.contains('pg-marca')) {
      marca.classList.add('pg-marca');
      marca.setAttribute('aria-label', 'Volver al Lobby');
      marca.removeAttribute('title');
      if (letras) {
        letras.classList.add('pg-letras');
        letras.addEventListener('click', () => marca.click());
      }
      if (marca.tabIndex < 0) {
        marca.tabIndex = 0;
        marca.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); marca.click(); }
        });
      }
    }
    recursos.dejarMarcaEnBarra?.(marca, letras);
    let modulo = barra.querySelector('.mod');
    if (!modulo && recursos.dejarMarcaEnBarra && recursos.pagina === 'lobby') {
      modulo = crear('span', 'Mi día', { class: 'mod' });
      barra.querySelector('.sep')?.after(modulo);
    }
    if (modulo && !modulo.matches('.pg-modulo')) {
      modulo.classList.add('pg-modulo');
      modulo.setAttribute('role', 'button');
      modulo.tabIndex = 0;
      modulo.setAttribute('aria-label', 'Cambiar de módulo');
      if (recursos.abrirSelectorBarra) {
        modulo.setAttribute('aria-expanded', 'false');
        modulo.setAttribute('aria-haspopup', 'dialog');
      }
      modulo.addEventListener('click', modulos);
      modulo.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); modulos(); }
      });
    }
    const perfil = barra.querySelector('.mk-us');
    if (perfil && !perfil.hasAttribute('data-pg-perfil') && window.TemaECOVSA) {
      perfil.dataset.pgPerfil = '';
      perfil.setAttribute('role', 'button');
      perfil.setAttribute('aria-label', 'Tu usuario');
      perfil.tabIndex = 0;
      perfil.addEventListener('click', () => {
        TemaECOVSA.menuUsuario(perfil, window.USUARIO);
        const salir = document.querySelector('#tm-menu-us [data-a="salir"]');
        salir?.addEventListener('click', e => {
          e.stopPropagation();
          document.getElementById('tm-menu-us')?.remove();
          window.cerrarSesion?.();
        });
      });
      perfil.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); perfil.click(); }
      });
    }
    const usuarioBarra = barra.querySelector('.us, .mk-us');
    if (usuarioBarra && !usuarioBarra.querySelector('.pg-chev, .us-chev')) {
      usuarioBarra.append(crear('i', '', { class: 'pg-chev', 'aria-hidden': 'true' }));
    }
    const riel = document.querySelector('.mnav, #menu-sup');
    if (riel) {
      const enlaces = Array.from(riel.querySelectorAll('a')).filter(a => !a.closest('.pie') && etiqueta(a) && (a.matches('[onclick], [aria-current=page]') || (a.hasAttribute('href') && resolver(a.href))));
      if (enlaces.length) {
        riel.classList.add('pg-riel');
        for (const a of enlaces) {
          a.classList.add('pg-opcion');
          if (!a.title) a.title = etiqueta(a);
          if (!a.hasAttribute('href') && !a.hasAttribute('data-pg-teclado')) {
            a.dataset.pgTeclado = '';
            a.tabIndex = 0;
            a.setAttribute('role', 'button');
            a.addEventListener('keydown', e => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); a.click(); }
            });
          }
        }
        fijar(riel);
        movil(enlaces);
      }
    }
    actualizarMenuUsuario();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (esDocumento) return;
    if (llegaIris && (recursos.pagina !== 'campo' || !window.EcovsaApp)) recibirIris();
    document.body.dataset.pgFijo = String(memoria.get(claveRiel) === '1');
    decorar();
    let pendiente = false;
    new MutationObserver(() => {
      if (!pendiente) {
        pendiente = true;
        requestAnimationFrame(() => { pendiente = false; decorar(); });
      }
    }).observe(document.body, { childList: true, subtree: true });
    if (vista === 'piel') document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !document.querySelector('#ent.bq')) { e.preventDefault(); modulos(); }
    });
  });
})();

/* Variante de la barra para revisión visual en la maqueta. */
(() => {
  'use strict';

  if (!window.EcovsaAurora) return;
  const lab = window.EcovsaAurora;
  const iconos = { lobby: 'casa', inicio: 'brujula', campo: 'camion', planta: 'planta', alta: 'personas',
    cobros: 'moneda', config: 'ajustes', calidad: 'sello', seguridad: 'escudo', finanzas: 'billete', administracion: 'maletin', fumigacion: 'matraz', solicitud: 'recibo', certificados: 'sello' };
  const normalizar = texto => texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es');
  let menu;
  let ancla;

  function nodo(etiqueta, clase, texto) {
    const el = document.createElement(etiqueta);
    if (clase) el.className = clase;
    if (texto) el.textContent = texto;
    return el;
  }

  lab.dejarMarcaEnBarra = (marca, letras) => {
    if (ancla && !ancla.isConnected) lab.cerrarSelectorBarra();
    if (!marca || marca.parentElement.matches('.pb-marca')) return;
    const conjunto = nodo('div', 'pb-marca');
    if (lab.pagina !== 'lobby') conjunto.dataset.regreso = '';
    if (marca.matches('.logo-img-header')) conjunto.classList.add('mk-only');
    marca.before(conjunto);
    conjunto.append(marca);
    if (letras) conjunto.append(letras);
    conjunto.addEventListener('click', e => { if (e.target === conjunto) marca.click(); });
  };

  function posicionar() {
    if (!ancla?.isConnected || !menu) return;
    const caja = ancla.getBoundingClientRect();
    const ancho = Math.min(298, innerWidth - 24);
    menu.style.left = Math.max(12, Math.min(caja.left, innerWidth - 12 - ancho)) + 'px';
    menu.style.top = caja.bottom + 10 + 'px';
    menu.style.setProperty('--pb-lista-altura', Math.max(120, innerHeight - caja.bottom - 26) + 'px');
  }

  function cerro() {
    ancla?.setAttribute('aria-expanded', 'false');
    ancla?.removeAttribute('aria-controls');
    ancla = null;
    menu?.remove();
    menu = null;
    window.removeEventListener('resize', posicionar);
    document.removeEventListener('pointerdown', cerrarSiFuera, true);
    document.removeEventListener('focusin', cerrarSiFuera);
  }

  function cerrarSiFuera(e) {
    if (menu && !menu.contains(e.target) && !ancla?.contains(e.target)) lab.cerrarSelectorBarra();
  }

  lab.cerrarSelectorBarra = () => {
    if (menu?.matches(':popover-open')) menu.hidePopover();
    cerro();
  };

  lab.abrirSelectorBarra = (control, elegir, escribir) => {
    if (!control || !('showPopover' in HTMLElement.prototype)) return false;
    if (menu?.matches(':popover-open')) { lab.cerrarSelectorBarra(); control.focus(); return true; }
    menu = nodo('div', 'pb-modulos');
    ancla = control;
    const abierto = menu;
    menu.id = 'pb-modulos';
    menu.popover = 'manual';
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-label', 'Cambiar de módulo');
    const cabecera = nodo('label', 'pb-busqueda');
    const buscar = nodo('input');
    buscar.type = 'search';
    buscar.setAttribute('aria-label', 'Buscar módulo');
    buscar.placeholder = 'Buscar módulo';
    const lente = nodo('i', 'pb-lente');
    lente.setAttribute('aria-hidden', 'true');
    cabecera.append(lente, buscar);
    const opciones = nodo('div', 'pb-opciones');
    /* Módulos que viven dentro de otro: se despliegan bajo él en vez de salir sueltos.
       Finanzas y Solicitud de pago ya son páginas de Dirección; los archivos viejos solo redirigen. */
    const hijosDe = { inicio: [
      { id: 'finanzas', nombre: 'Finanzas', archivo: 'Inicio.html#ftab' },
      { id: 'solicitud', nombre: 'Solicitud de pago', archivo: 'Inicio.html#fsol' }
    ] };
    /* Gestión no tiene página propia: solo reúne Calidad, Seguridad y Ambiente (Ambiente aún sin pantalla). */
    const gestion = { id: 'gestion', nombre: 'Gestión', icono: 'calidad', hijos: [
      { id: 'calidad', nombre: 'Calidad', archivo: 'Calidad.html' },
      { id: 'seguridad', nombre: 'Seguridad', archivo: 'Seguridad.html' }
    ] };
    const esHijo = new Set([...Object.values(hijosDe).flat(), ...gestion.hijos].map(h => h.id));
    const crearFila = (r, actual, clase) => {
      const item = nodo(actual ? 'div' : 'button', 'pb-opcion' + (clase ? ' ' + clase : ''));
      const icono = nodo('span', 'pb-icono');
      icono.setAttribute('aria-hidden', 'true');
      if (lab.iconos?.[iconos[r.id]]) icono.innerHTML = '<svg viewBox="0 0 24 24">' + lab.iconos[iconos[r.id]] + '</svg>';
      const direccion = nodo('span', 'pb-indicador', actual ? '✓' : '›');
      direccion.setAttribute('aria-hidden', 'true');
      item.append(icono, nodo('span', '', r.nombre), direccion);
      if (actual) item.setAttribute('aria-current', 'page');
      else {
        item.type = 'button';
        item.addEventListener('click', e => { lab.cerrarSelectorBarra(); elegir(r.archivo, e); });
      }
      return item;
    };
    /* Padre: al tocarlo se despliega; adentro, él mismo (si tiene página) y luego sus módulos. */
    const crearGrupo = (r, hijos, conPropio) => {
      const actualEnGrupo = r.id === lab.pagina || hijos.some(h => h.id === lab.pagina);
      const grupo = nodo('div', 'pb-grupo');
      const cab = nodo('button', 'pb-opcion pb-padre');
      cab.type = 'button';
      cab.setAttribute('aria-expanded', String(actualEnGrupo));
      const ic = nodo('span', 'pb-icono');
      ic.setAttribute('aria-hidden', 'true');
      const clave = iconos[r.icono || r.id];
      if (lab.iconos?.[clave]) ic.innerHTML = '<svg viewBox="0 0 24 24">' + lab.iconos[clave] + '</svg>';
      const fl = nodo('span', 'pb-indicador pb-flecha', '›');
      fl.setAttribute('aria-hidden', 'true');
      cab.append(ic, nodo('span', '', r.nombre), fl);
      if (actualEnGrupo) cab.setAttribute('aria-current', 'page');
      const sub = nodo('div', 'pb-sub');
      if (conPropio) sub.append(crearFila({ ...r, nombre: 'Resumen de ' + r.nombre }, r.id === lab.pagina, 'pb-hijo'));
      for (const h of hijos) sub.append(crearFila(h, h.id === lab.pagina, 'pb-hijo'));
      sub.hidden = !actualEnGrupo;
      cab.addEventListener('click', () => {
        const abierto = cab.getAttribute('aria-expanded') === 'true';
        cab.setAttribute('aria-expanded', String(!abierto));
        sub.hidden = abierto;
      });
      grupo.append(cab, sub);
      return { item: grupo, nombre: normalizar(r.nombre + ' ' + hijos.map(h => h.nombre).join(' ')), grupo: { cab, sub, abrir: actualEnGrupo } };
    };
    /* Certificados y Fumigación son de las pantallas viejas: ya no van en la lista de módulos. */
    const ocultos = new Set(['certificados', 'fumigacion']);
    const permitidas = lab.rutas.filter(r => lab.permitidos.includes(r.id) && !ocultos.has(r.id));
    const filas = [];
    for (const r of permitidas) {
      if (esHijo.has(r.id)) continue;
      const hijos = (hijosDe[r.id] || []).filter(h => lab.permitidos.includes(h.id));
      if (!hijos.length) {
        filas.push({ item: crearFila(r, r.id === lab.pagina), nombre: normalizar(r.nombre) });
        continue;
      }
      filas.push(crearGrupo(r, hijos, true));
    }
    const hg = gestion.hijos.filter(h => lab.permitidos.includes(h.id));
    if (hg.length) filas.push(crearGrupo(gestion, hg, false));
    const vacio = nodo('p', 'pb-vacio', 'Sin coincidencias');
    vacio.hidden = true;
    opciones.append(...filas.map(f => f.item), vacio);
    menu.append(cabecera, opciones);
    buscar.addEventListener('input', () => {
      const filtro = normalizar(buscar.value.trim());
      for (const f of filas) {
        f.item.hidden = !f.nombre.includes(filtro);
        if (f.grupo) {
          const ab = filtro ? !f.item.hidden : f.grupo.abrir;
          f.grupo.cab.setAttribute('aria-expanded', String(ab));
          f.grupo.sub.hidden = !ab;
        }
      }
      vacio.hidden = filas.some(f => !f.item.hidden);
    });
    buscar.addEventListener('keydown', e => {
      if (e.key !== 'ArrowDown' && e.key !== 'Enter') return;
      e.preventDefault();
      const primera = opciones.querySelector('button:not([hidden])');
      if (e.key === 'ArrowDown') primera?.focus();
      else primera?.click();
    });
    menu.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      lab.cerrarSelectorBarra();
      control.focus();
    });
    menu.addEventListener('toggle', e => {
      if (e.newState === 'closed' && menu === abierto) cerro();
    });
    document.body.append(menu);
    posicionar();
    window.addEventListener('resize', posicionar);
    control.setAttribute('aria-expanded', 'true');
    control.setAttribute('aria-controls', menu.id);
    menu.showPopover();
    if (escribir) buscar.focus();
    else opciones.querySelector('button')?.focus({ preventScroll: true });
    document.addEventListener('pointerdown', cerrarSiFuera, true);
    document.addEventListener('focusin', cerrarSiFuera);
    return true;
  };
})();

/* Muestra de interacciones del paquete visual sobre los controles internos. */
(() => {
  'use strict';

  const html = document.documentElement;
  const lab = window.EcovsaAurora;
  if (!lab) return;

  function nodo(etiqueta, clase, texto) {
    const resultado = document.createElement(etiqueta);
    if (clase) resultado.className = clase;
    if (texto) resultado.textContent = texto;
    return resultado;
  }

  function boton(texto, accion, clase) {
    const resultado = nodo('button', clase, texto);
    resultado.type = 'button';
    resultado.addEventListener('click', accion);
    return resultado;
  }

  let tiempoAviso;
  function avisar(texto, duracion = 2800, tipo = '') {
    if (!lab.activo()) return false;
    let aviso = document.getElementById('toast');
    if (!aviso) {
      aviso = nodo('div');
      aviso.id = 'toast';
      document.body.append(aviso);
    }
    aviso.setAttribute('role', 'status');
    aviso.classList.add('pg-aviso', 'pg-visible');
    aviso.dataset.tipo = tipo;
    aviso.textContent = texto;
    clearTimeout(tiempoAviso);
    tiempoAviso = setTimeout(() => aviso.classList.remove('pg-visible'), duracion);
    return true;
  }

  function confirmar(opciones, alCerrar) {
    if (!lab.activo()) return false;
    const dialogo = nodo('dialog', 'pg-confirmacion');
    const titulo = nodo('h2', '', opciones.titulo);
    const icono = nodo('span', 'pg-confirmacion-icono', '!');
    const pie = nodo('footer', 'pg-interaccion-acciones');
    const cancelar = boton(opciones.cancelar || 'Cancelar', () => dialogo.close());
    const aceptar = boton(opciones.boton || 'Confirmar', () => dialogo.close('aceptar'), 'pg-accion-primaria');
    titulo.id = 'pg-confirmacion-titulo';
    icono.setAttribute('aria-hidden', 'true');
    dialogo.setAttribute('aria-labelledby', titulo.id);
    if (opciones.peligro) dialogo.dataset.peligro = '';
    pie.append(cancelar, aceptar);
    const cabecera = nodo('div', 'pg-confirmacion-cabecera');
    cabecera.append(icono, titulo);
    const detalle = nodo('p', 'pg-confirmacion-texto', opciones.mensaje);
    detalle.id = 'pg-confirmacion-texto';
    dialogo.setAttribute('aria-describedby', detalle.id);
    dialogo.append(cabecera, detalle, pie);
    dialogo.addEventListener('close', () => {
      dialogo.remove();
      alCerrar?.(dialogo.returnValue === 'aceptar');
    }, { once: true });
    document.body.append(dialogo);
    dialogo.showModal();
    cancelar.focus();
    return true;
  }

  lab.avisar = avisar;
  lab.confirmar = confirmar;

  let tiempoRed;
  function mostrarRed(conectado) {
    if (!lab.activo()) return;
    let banner = document.querySelector('.pg-red');
    if (!banner) {
      banner = nodo('div', 'pg-red');
      banner.setAttribute('role', 'status');
      document.body.append(banner);
    }
    clearTimeout(tiempoRed);
    banner.dataset.enLinea = String(conectado);
    banner.textContent = conectado ? 'Conexión restablecida' : 'Sin conexión a internet';
    if (conectado) tiempoRed = setTimeout(() => banner.remove(), 2400);
  }

  const operaciones = new Map();
  let espera;

  function quitarEspera() {
    if (espera?.open) espera.close();
    espera?.remove();
    espera = null;
  }

  function mostrarEspera(texto) {
    if (espera || document.querySelector('#ent.bq')) return;
    espera = nodo('dialog', 'pg-espera');
    espera.setAttribute('aria-label', texto);
    espera.setAttribute('aria-busy', 'true');
    const emblema = nodo('div', 'pg-espera-emblema');
    emblema.setAttribute('aria-hidden', 'true');
    if (window.ECOCARGA?.logo) emblema.innerHTML = ECOCARGA.logo(64, { gira: true });
    const estado = nodo('strong', '', texto);
    estado.setAttribute('role', 'status');
    espera.append(emblema, estado);
    espera.addEventListener('cancel', e => e.preventDefault());
    const dialogo = espera;
    espera.addEventListener('close', () => { if (espera === dialogo) quitarEspera(); }, { once: true });
    document.body.append(espera);
    espera.showModal();
  }

  function finalizar(btn) {
    const timers = operaciones.get(btn);
    if (!timers) return;
    clearTimeout(timers.abrir);
    clearTimeout(timers.limite);
    operaciones.delete(btn);
    if (!operaciones.size) quitarEspera();
  }

  lab.ocupado = (btn, si, texto) => {
    if (!lab.activo() || !btn || !btn.closest('#hoja, #mk-lado')) return;
    if (!si) { finalizar(btn); return; }
    if (operaciones.has(btn)) return;
    operaciones.set(btn, {
      abrir: setTimeout(() => {
        if (btn.isConnected && btn.disabled) mostrarEspera(texto || 'Guardando…');
        else finalizar(btn);
      }, 300),
      limite: setTimeout(() => finalizar(btn), 30_000)
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('offline', () => mostrarRed(false));
    window.addEventListener('online', () => mostrarRed(true));
    if (!navigator.onLine) mostrarRed(false);
    new MutationObserver(() => {
      for (const btn of operaciones.keys()) if (!btn.isConnected || !btn.disabled) finalizar(btn);
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });
  });
})();
