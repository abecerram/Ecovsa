/* ═══════════════════════════════════════════════════════════════════
   ECOVSA · TEMA DEL SISTEMA (tema.js) — lo que el estilo solo no hace.
   Pone el emblema de ECOVSA (globo + flechas) en el lugar del logo de la
   barra azul de cada pantalla: da una vuelta al abrir y otra si lo tocan.
   Dónde: Mercadeo (.sysbar .lg), el lobby (.lb .lg) y Logística solo para
   supervisión (body.es-sup header .logo-img-header). El conductor no cambia.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  if (window.TemaECOVSA) return;
  var SEL = '.sysbar .lg, .lb .lg, body.es-sup header .logo-img-header';
  var girado = false;
  function marca(el) {
    if (!el || el.classList.contains('tm-marca')) return;
    el.classList.add('tm-marca');
    el.setAttribute('title', 'ECOVSA');
    el.innerHTML = '<div class="tm-3d"><img src="entrada-globo.png" alt=""><img src="entrada-bio.png" alt="">' +
      '<div class="tm-fl"><img src="entrada-flecha-a.png" alt=""><img src="entrada-flecha-b.png" alt=""></div></div>';
    el.addEventListener('click', function () { girar(el); });
    /* una vuelta al abrir la pantalla; los repintados no vuelven a girar */
    if (!girado) { girado = true; setTimeout(function () { girar(el); }, 250); }
  }
  function girar(el) {
    var f = el.querySelector('.tm-fl'); if (!f) return;
    f.classList.remove('gira'); void f.offsetWidth; f.classList.add('gira');
  }
  function quitar() {
    /* si la barra deja de ser de supervisión (otra sesión), vuelve el logo de siempre */
    document.querySelectorAll('header .logo-img-header.tm-marca').forEach(function (el) {
      if (document.body.classList.contains('es-sup')) return;
      el.classList.remove('tm-marca'); el.innerHTML = '';
    });
  }
  function revisar() { document.querySelectorAll(SEL).forEach(marca); quitar(); }
  function arrancar() {
    revisar();
    if (window.MutationObserver) {
      var pend = 0;
      new MutationObserver(function () { if (!pend) pend = requestAnimationFrame(function () { pend = 0; revisar(); }); })
        .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }
  }
  /* ── api 3.4: el menú del usuario (tocar su nombre en la barra) ──
     Nombre y rol, «Configuración del sistema» (SOLO el administrador: es el
     apartado oculto), «Bloquear pantalla» y «Salir». */
  var ROLES = { admin: 'Administrador', gerente: 'Gerente', supervisor: 'Supervisor', mercadeo: 'Mercadeo', planta: 'Planta', cobros: 'Cobros', operador: 'Conductor' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function menuUsuario(ancla, usuario) {
    var viejo = document.getElementById('tm-menu-us'); if (viejo) { viejo.parentNode.removeChild(viejo); return; }
    if (!document.getElementById('tm-menu-css')) {
      var st = document.createElement('style'); st.id = 'tm-menu-css';
      st.textContent = '#tm-menu-us{position:fixed;z-index:95;min-width:250px;background:#fff;color:var(--tm-tinta,#0f2140);border:1px solid var(--tm-linea,#e1e6ee);border-radius:12px;box-shadow:0 16px 40px rgba(15,33,64,.22);padding:6px;font:500 13.5px var(--tm-letra,Archivo,sans-serif)}' +
        '#tm-menu-us .q{padding:10px 12px 8px;border-bottom:1px solid var(--tm-linea2,#eef1f5);margin-bottom:4px}#tm-menu-us .q b{display:block;font-size:14px}#tm-menu-us .q span{font-size:12px;color:var(--tm-gris,#667489)}' +
        '#tm-menu-us a{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;color:inherit;text-decoration:none;cursor:pointer;font-weight:600}#tm-menu-us a:hover{background:var(--tm-hover,#f7f9fc)}' +
        '#tm-menu-us a.cfg{color:var(--tm-navy2,#14306b)}#tm-menu-us svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}';
      document.head.appendChild(st);
    }
    var u = usuario || {}, m = document.createElement('div'); m.id = 'tm-menu-us';
    var ic = function (p) { return '<svg viewBox="0 0 24 24">' + p + '</svg>'; };
    m.innerHTML = '<div class="q"><b>' + esc(u.nombre || '') + '</b><span>' + esc(ROLES[u.rol] || u.rol || '') + '</span></div>' +
      (u.rol === 'admin' ? '<a class="cfg" href="Configuracion.html">' + ic('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>') + 'Configuración del sistema</a>' : '') +
      '<a data-a="bloq">' + ic('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>') + 'Bloquear pantalla</a>' +
      '<a data-a="salir">' + ic('<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>') + 'Salir</a>';
    document.body.appendChild(m);
    var r = ancla.getBoundingClientRect();
    m.style.top = (r.bottom + 8) + 'px';
    m.style.right = Math.max(8, innerWidth - r.right) + 'px';
    m.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[data-a]'); if (!a) return;
      e.preventDefault(); cerrar();
      if (a.getAttribute('data-a') === 'bloq') { if (window.EntradaECOVSA && EntradaECOVSA.bloquear) EntradaECOVSA.bloquear(); }
      else { try { localStorage.removeItem('ecovsa_pin'); sessionStorage.clear(); } catch (x) {} location.href = 'index.html'; }
    });
    function cerrar() { if (m.parentNode) m.parentNode.removeChild(m); document.removeEventListener('pointerdown', fuera, true); }
    function fuera(e) { if (!m.contains(e.target) && !ancla.contains(e.target)) cerrar(); }
    setTimeout(function () { document.addEventListener('pointerdown', fuera, true); }, 0);
  }
  window.TemaECOVSA = { marca: marca, girar: girar, revisar: revisar, menuUsuario: menuUsuario, roles: ROLES };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
})();
