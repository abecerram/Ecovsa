/* ═══════════════════════════════════════════════════════════════════
   ECOVSA · NOVEDADES (novedades.js · api 3.78)
   Una presentación corta de lo nuevo, por módulo, con el nombre de quien entra.
   · El contenido va aparte: novedades/<módulo>.js llama ECO_NOV.registrar(módulo, { version, laminas: [...] }).
     Para sumar las de otro módulo o de otra actualización solo se escribe (o se cambia) ese archivo.
   · Sale sola una vez por persona y por versión del contenido; «Después» la vuelve a ofrecer la próxima vez que se
     entre al módulo; «Entendido» (o cerrarla desde el menú) la da por vista. Se puede volver a abrir desde el menú.
   · Lo que se guarda en el navegador: «ya vio la versión N» con una huella del nombre (no el nombre, ni el PIN).
   · Espera a que no haya otro aviso abierto (el del monitor de uso, una hoja) y nunca frena la pantalla.
   Láminas: { icono, titulo, puntos: [texto…], img, pie, boton: { t, href } } — el texto se escapa.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  if (window.ECO_NOV) return;
  var C = {}, abierto = false;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var ICO = {
    estrella: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    casa: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    rayo: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    embudo: '<path d="M3 4h18l-7 8v6l-4 2v-8z"/>',
    sello: '<circle cx="12" cy="9" r="5.5"/><path d="M9 13.8 7.5 21l4.5-2.4 4.5 2.4-1.5-7.2"/><path d="M10 9l1.5 1.5L14 7.5"/>',
    moneda: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v12"/>',
    flecha: '<path d="M9 6l6 6-6 6"/>', atras: '<path d="M15 6l-6 6 6 6"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>'
  };
  var ic = function (n, s) { return '<svg width="' + (s || 18) + '" height="' + (s || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICO[n] || ICO.estrella) + '</svg>'; };
  function huella(t) { var h = 2166136261; t = String(t || '').trim().toLowerCase(); for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
  function clave(mod, nombre) { return 'eco_nov:' + mod + ':' + huella(nombre); }
  function visto(mod, nombre) { try { return localStorage.getItem(clave(mod, nombre)) || ''; } catch (e) { return ''; } }
  function marcar(mod, nombre, v) { try { localStorage.setItem(clave(mod, nombre), v); } catch (e) {} }
  function pila(n) { var p = String(n || '').trim().split(/\s+/)[0] || ''; return p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : ''; }
  var css = '#eco-nov{position:fixed;inset:0;z-index:2147482500;background:rgba(15,33,64,.45);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Archivo,system-ui,sans-serif;animation:novF .25s ease-out both}' +
    '#eco-nov .nv{position:relative;width:min(880px,100%);max-height:calc(100vh - 32px);overflow:auto;border-radius:24px;border:1px solid #e6ebf2;box-shadow:0 24px 60px rgba(15,42,87,.25);color:#0f2140;' +
      'background:radial-gradient(ellipse at 10% 0%,#e3f1ff 0,rgba(227,241,255,0) 60%),radial-gradient(ellipse at 95% 100%,#dcf3e2 0,rgba(220,243,226,0) 58%),#f7fafc}' +
    '#eco-nov .nv-x{position:absolute;right:12px;top:12px;border:0;background:rgba(255,255,255,.8);border-radius:10px;width:34px;height:34px;display:grid;place-items:center;cursor:pointer;color:#51607a;z-index:2}' +
    '#eco-nov .nv-c{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:22px;padding:26px 26px 18px;align-items:center;min-height:330px}' +
    '#eco-nov .nv-c.sin-img{grid-template-columns:minmax(0,1fr)}' +
    '#eco-nov .nv-img{border-radius:14px;border:1px solid #e6ebf2;background:#fff;overflow:hidden;box-shadow:0 10px 26px rgba(15,42,87,.10)}#eco-nov .nv-img img{display:block;width:100%;height:auto}' +
    '#eco-nov .nv-img small{display:block;font-size:11.5px;color:#667489;padding:6px 10px;border-top:1px solid #eef1f5;background:#fff}' +
    '#eco-nov .lema{font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:700;color:#2F6B0A;margin-bottom:8px}' +
    '#eco-nov .nv-ic{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:#fff;border:1px solid #e6ebf2;color:#14306b;margin-bottom:10px}' +
    '#eco-nov h2{margin:0 0 10px;font-size:22px;line-height:1.25;color:#14306b;letter-spacing:-.2px}' +
    '#eco-nov ul{margin:0;padding:0;list-style:none;display:grid;gap:8px}#eco-nov li{position:relative;padding-left:18px;font-size:14px;line-height:1.5;color:#2b3a52}' +
    '#eco-nov li:before{content:"";position:absolute;left:2px;top:8px;width:7px;height:7px;border-radius:50%;background:#2f9e44}' +
    '#eco-nov .nv-pie{font-size:12.5px;color:#667489;margin-top:10px}' +
    '#eco-nov .nv-ir{display:inline-flex;align-items:center;gap:6px;margin-top:14px;font:700 13.5px Archivo,system-ui,sans-serif;color:#14306b;text-decoration:none;border:1px solid #cdd8ea;background:#fff;border-radius:10px;padding:8px 12px}' +
    '#eco-nov .nv-b{display:flex;align-items:center;gap:10px;padding:12px 26px 20px;flex-wrap:wrap}' +
    '#eco-nov .nv-p{display:flex;gap:6px;flex:1}#eco-nov .nv-p i{width:8px;height:8px;border-radius:50%;background:#cdd8ea}#eco-nov .nv-p i.on{background:#14306b;width:22px;border-radius:6px}' +
    '#eco-nov .nv-btn{font:700 14px Archivo,system-ui,sans-serif;border-radius:10px;padding:10px 16px;cursor:pointer;border:1px solid #e1e6ee;background:#fff;color:#14306b;display:inline-flex;align-items:center;gap:6px}' +
    '#eco-nov .nv-btn.pri{background:#14306b;border-color:#14306b;color:#fff}#eco-nov .nv-btn.gh{border-color:transparent;background:none;color:#667489}' +
    '#eco-nov .nv-c.ent{animation:novF .25s ease-out both}' +
    '@keyframes novF{from{opacity:0}to{opacity:1}}' +
    '@media (max-width:720px){#eco-nov{padding:0;align-items:stretch}#eco-nov .nv{border-radius:0;max-height:none;height:100%}#eco-nov .nv-c{grid-template-columns:minmax(0,1fr);padding:56px 18px 10px;gap:16px}#eco-nov .nv-c .nv-img{order:2}#eco-nov h2{font-size:20px}#eco-nov .nv-b{padding:12px 18px 18px}#eco-nov .nv-p{flex-basis:100%;justify-content:center;margin-bottom:4px}#eco-nov .nv-btn{flex:1;justify-content:center}}' +
    '@media (prefers-reduced-motion:reduce){#eco-nov,#eco-nov .nv-c.ent{animation:none}}';
  function estilos() { if (document.getElementById('eco-nov-css')) return; var s = document.createElement('style'); s.id = 'eco-nov-css'; s.textContent = css; document.head.appendChild(s); }
  function ocupado() { var h = document.getElementById('hoja'); return !!document.getElementById('uso-av') || !!document.getElementById('eco-cortina') || !!(h && h.classList.contains('si')) || document.hidden; }

  function mostrar(mod, op) {
    var d = C[mod]; if (!d || abierto) return false;
    op = op || {}; abierto = true; estilos();
    var L = d.laminas, i = 0, nombre = pila(op.nombre);
    var b = document.createElement('div'); b.id = 'eco-nov'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-modal', 'true'); b.setAttribute('aria-label', 'Novedades');
    b.innerHTML = '<div class="nv"><button type="button" class="nv-x" aria-label="Cerrar">' + ic('x', 18) + '</button><div class="nv-cu"></div>' +
      '<div class="nv-b"><div class="nv-p" aria-hidden="true">' + L.map(function () { return '<i></i>'; }).join('') + '</div>' +
      '<button type="button" class="nv-btn gh" data-nv="despues">Después</button><button type="button" class="nv-btn" data-nv="ant">' + ic('atras', 16) + ' Anterior</button><button type="button" class="nv-btn pri" data-nv="sig"></button></div></div>';
    document.body.appendChild(b);
    var cu = b.querySelector('.nv-cu');
    function pintar() {
      var x = L[i], tit = String(x.titulo || '').replace(/\{nombre\}/g, nombre || '').replace(/^,\s*/, '').replace(/\s+,/, ',');
      cu.innerHTML = '<div class="nv-c ent' + (x.img ? '' : ' sin-img') + '"><div>' + (i === 0 ? '<div class="lema">Ecología · Vida · Salud</div>' : '') +
        '<div class="nv-ic">' + ic(x.icono, 22) + '</div><h2>' + esc(tit) + '</h2><ul>' + (x.puntos || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' +
        (x.pie ? '<div class="nv-pie">' + esc(x.pie) + '</div>' : '') + (x.boton ? '<a class="nv-ir" href="' + esc(x.boton.href) + '">' + esc(x.boton.t) + ' ' + ic('flecha', 15) + '</a>' : '') + '</div>' +
        (x.img ? '<figure class="nv-img" style="margin:0"><img src="' + esc(x.img) + '" alt="' + esc(x.alt || tit) + '" loading="lazy">' + (x.leyenda ? '<small>' + esc(x.leyenda) + '</small>' : '') + '</figure>' : '') + '</div>';
      [].forEach.call(b.querySelectorAll('.nv-p i'), function (e, k) { e.classList.toggle('on', k === i); });
      b.querySelector('[data-nv="ant"]').style.visibility = i ? 'visible' : 'hidden';
      b.querySelector('[data-nv="sig"]').innerHTML = i === L.length - 1 ? 'Entendido' : (i === 0 ? 'Empezar' : 'Siguiente') + ' ' + ic('flecha', 16);
      var a = cu.querySelector('.nv-ir'); if (a) a.onclick = function () { marcar(mod, op.nombre, d.version); };
    }
    function cerrar(vista) {
      if (vista || op.forzar) marcar(mod, op.nombre, d.version); else try { sessionStorage.setItem('eco_nov_despues:' + mod, '1'); } catch (e) {}
      document.removeEventListener('keydown', tecla, true); if (b.parentNode) b.parentNode.removeChild(b); abierto = false;
    }
    function tecla(e) {
      if (e.key === 'Escape') { e.preventDefault(); cerrar(false); }
      else if (e.key === 'ArrowRight' && i < L.length - 1) { i++; pintar(); }
      else if (e.key === 'ArrowLeft' && i > 0) { i--; pintar(); }
    }
    b.addEventListener('click', function (e) {
      if (e.target === b) return;
      var t = e.target.closest('[data-nv],.nv-x'); if (!t) return;
      if (t.classList.contains('nv-x') || t.getAttribute('data-nv') === 'despues') { cerrar(false); return; }
      if (t.getAttribute('data-nv') === 'ant') { if (i > 0) { i--; pintar(); } return; }
      if (i < L.length - 1) { i++; pintar(); } else cerrar(true);
    });
    document.addEventListener('keydown', tecla, true);
    pintar(); setTimeout(function () { var s = b.querySelector('[data-nv="sig"]'); if (s) s.focus(); }, 50);
    return true;
  }

  window.ECO_NOV = {
    registrar: function (mod, d) { if (mod && d && d.version && Array.isArray(d.laminas) && d.laminas.length) C[mod] = d; },
    hay: function (mod, nombre) { var d = C[mod]; return !!d && visto(mod, nombre) !== d.version; },
    /* sale sola: solo si no la vio (o el contenido cambió), no dijo «Después» en esta sesión y no hay otro aviso abierto */
    revisar: function (mod, nombre) {
      var d = C[mod]; if (!d || visto(mod, nombre) === d.version) return;
      try { if (sessionStorage.getItem('eco_nov_despues:' + mod)) return; } catch (e) {}
      var n = 0; (function intento() { if (abierto) return; if (ocupado()) { if (++n < 60) setTimeout(intento, 1000); return; } mostrar(mod, { nombre: nombre }); })();
    },
    abrir: function (mod, nombre) { return mostrar(mod, { nombre: nombre, forzar: true }); }
  };
})();
