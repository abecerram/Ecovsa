/* ═══════════════════════════════════════════════════════════════════
   ENTRADA ECOVSA · pantalla del PIN y bloqueo por inactividad (api 2.9)
   ───────────────────────────────────────────────────────────────────
   Una sola pieza para dos usos:
     · el lobby (index.html) la usa como su puerta de entrada;
     · puente.js la carga en las demás páginas como «vigía»: si nadie toca
       nada en 15 minutos avisa «¿Sigues ahí?» y, al minuto, bloquea.
   El bloqueo no reinicia: si vuelve a entrar la misma persona sigue donde
   quedó; si entra otra, se va al lobby con lo suyo. El conductor no se
   bloquea nunca. Las páginas públicas (sin PIN guardado) no se tocan.
   Archivos que usa, junto a este en el repositorio:
     entrada-arbol.jpg · entrada-globo.png · entrada-bio.png ·
     entrada-flecha-a.png · entrada-flecha-b.png
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.EntradaECOVSA) return;

  var BASE = (function () {
    var s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/[^\/]*$/, '') : '';
  })();
  var MIN_INACTIVO = 15, SEG_AVISO = 60;
  /* api 3.4: lo que decide Configuración › Seguridad (largo del PIN, bloqueo,
     intentos, «cerrar todas»). Se guarda una copia para arrancar al instante. */
  var AJ = { largoPin: 4, minInactivo: 15, intentos: 5, esperaMin: 10, alUltimo: true, sesionDesde: 0 };
  (function () { try { var c = JSON.parse(localStorage.getItem('eco_ajustes') || 'null'); if (c && c.largoPin) for (var k in c) AJ[k] = c[k]; } catch (e) {} })();
  function largo() { return AJ.largoPin === 6 ? 6 : 4; }
  function traerAjustes(listo) {
    if (!window.google || !google.script || !google.script.run) { if (listo) listo(); return; }
    google.script.run.withSuccessHandler(function (r) {
      if (r && r.ok) { for (var k in r) if (k !== 'ok') AJ[k] = r[k]; try { localStorage.setItem('eco_ajustes', JSON.stringify(AJ)); } catch (e) {} if (E) pts(); }
      if (listo) listo();
    }).withFailureHandler(function () { if (listo) listo(); }).api_entradaAjustes();
  }
  /* intentos equivocados en ESTE equipo */
  function bloqueadoHasta() { try { var f = JSON.parse(localStorage.getItem('eco_fallos') || '{}'); return f.hasta && f.hasta > Date.now() ? f.hasta : 0; } catch (e) { return 0; } }
  function fallo() {
    try { var f = JSON.parse(localStorage.getItem('eco_fallos') || '{}'); f.n = (f.n || 0) + 1;
      if (f.n >= (AJ.intentos || 5)) { f.hasta = Date.now() + (AJ.esperaMin || 10) * 60000; f.n = 0; }
      localStorage.setItem('eco_fallos', JSON.stringify(f)); } catch (e) {}
  }
  function acierto() { try { localStorage.removeItem('eco_fallos'); localStorage.setItem('eco_login_t', String(Date.now())); } catch (e) {} }
  var K_PIN = 'ecovsa_pin', K_ACT = 'eco_actividad', K_BLOQ = 'eco_bloqueado', K_FONDO = 'eco_fondo', K_ROL = 'eco_rol_sesion';
  var SOL = [0.49, 0.40];                         /* dónde está el sol en la foto */

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function pinGuardado() { try { return JSON.parse(lsGet(K_PIN) || '""') || ''; } catch (e) { return ''; } }
  function $(id) { return document.getElementById(id); }

  /* ── estilos ── */
  var CSS = '' +
  '#ent{position:fixed;inset:0;z-index:2147483000;font-family:Archivo,system-ui,-apple-system,"Segoe UI",sans-serif;color:#fff;overflow:hidden;user-select:none;-webkit-user-select:none;touch-action:none;background:#1c3a1e}' +
  '#ent *{box-sizing:border-box}' +
  '#ent .e-fondo{position:absolute;inset:-24px;transition:transform 1.2s cubic-bezier(.2,.8,.2,1)}' +
  '#ent .e-foto{position:absolute;inset:0;background:center/cover no-repeat;animation:eKb 38s ease-in-out infinite alternate;transform-origin:60% 40%}' +
  '@keyframes eKb{from{transform:scale(1.02)}to{transform:scale(1.1) translate(-1.2%,-.8%)}}' +
  '#ent .e-copa{filter:url(#e-viento);-webkit-mask-image:linear-gradient(#000 0,#000 48%,transparent 62%);mask-image:linear-gradient(#000 0,#000 48%,transparent 62%)}' +
  '#ent .e-sol{position:absolute;pointer-events:none;mix-blend-mode:screen}' +
  '#ent .e-sol i{position:absolute;inset:0;border-radius:50%}' +
  '#ent .e-halo{background:radial-gradient(circle,rgba(255,244,200,.85) 0,rgba(255,226,150,.35) 22%,rgba(255,220,140,0) 60%);animation:eLate 6s ease-in-out infinite alternate}' +
  '#ent .e-rayos{background:repeating-conic-gradient(from 0deg,rgba(255,240,190,.28) 0 4deg,rgba(255,240,190,0) 4deg 13deg);-webkit-mask-image:radial-gradient(circle,#000 5%,transparent 68%);mask-image:radial-gradient(circle,#000 5%,transparent 68%);animation:eRota 60s linear infinite}' +
  '@keyframes eLate{from{opacity:.75;transform:scale(.95)}to{opacity:1;transform:scale(1.07)}}@keyframes eRota{to{transform:rotate(360deg)}}' +
  '#ent .e-velo{position:absolute;inset:0;background:linear-gradient(rgba(5,20,40,.5) 0,rgba(5,20,40,.08) 32%,rgba(5,20,40,0) 55%,rgba(5,20,30,.45) 100%)}' +
  '#ent canvas{position:absolute;inset:0;width:100%;height:100%}' +
  '#ent .e-pan{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;padding-bottom:calc(20px + env(safe-area-inset-bottom,0px))}' +
  '#ent .e-reloj{font-size:clamp(46px,11vw,78px);font-weight:900;line-height:1;text-shadow:0 2px 14px rgba(0,0,0,.55),0 1px 3px rgba(0,0,0,.5);font-variant-numeric:tabular-nums}' +
  '#ent .e-reloj i{font-style:normal;animation:eTic 1s steps(1) infinite}@keyframes eTic{50%{opacity:.25}}' +
  '#ent .e-fecha{font-size:15px;font-weight:700;margin-top:6px;text-shadow:0 2px 10px rgba(0,0,0,.6)}' +
  '#ent .e-esc{position:relative;width:min(54vw,206px);aspect-ratio:720/590;margin:26px 0 8px;transition:transform .6s cubic-bezier(.3,1,.4,1);cursor:grab}' +
  '#ent .e-disco{position:absolute;left:-2.625%;top:-14.49%;width:104%;aspect-ratio:1;border-radius:50%;background:#fff;-webkit-backdrop-filter:none;backdrop-filter:none;box-shadow:0 0 0 8px rgba(255,255,255,.08),0 14px 40px rgba(0,0,0,.4)}' +
  '#ent .e-capa{position:absolute;inset:0;width:100%;height:100%;transform-origin:49.375% 48.98%;pointer-events:none}' +
  '#ent .e-gira{position:absolute;inset:0;transform-origin:49.375% 48.98%}' +
  '#ent .e-bio{pointer-events:auto;cursor:pointer}' +
  '#ent .e-marca{display:flex;justify-content:center;margin-top:18px}' +
  '#ent .e-marca img{display:block;width:108px;height:auto;filter:drop-shadow(0 2px 10px rgba(0,0,0,.45));animation:eCae .6s 1.9s cubic-bezier(.3,1.5,.5,1) both;-webkit-user-drag:none;user-select:none}' +
  '#ent .e-lema{font-size:12.5px;letter-spacing:2.5px;margin-top:4px;text-shadow:0 2px 10px rgba(0,0,0,.6);animation:eAp .6s 2.6s both}' +
  '#ent .e-toca{margin-top:28px;font-weight:800;font-size:15px;padding:13px 26px;border-radius:30px;background:rgba(10,30,60,.38);border:1px solid rgba(255,255,255,.3);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);animation:eResp 2.4s ease-in-out infinite;cursor:pointer;text-align:center}' +
  '#ent .e-toca b{color:#F5B301}#ent .e-toca small{display:block;font-weight:600;font-size:12px;opacity:.85;margin-top:3px}' +
  '@keyframes eResp{50%{background:rgba(10,30,60,.55);transform:scale(1.04)}}@keyframes eCae{from{opacity:0;transform:translateY(-24px)}to{opacity:1;transform:none}}@keyframes eAp{from{opacity:0}to{opacity:1}}' +
  '#ent .in-gl{animation:eGl .9s .1s cubic-bezier(.3,1.35,.5,1) both}#ent .in-bi{animation:eBi .9s .7s cubic-bezier(.3,1.2,.5,1) both}' +
  '#ent .in-fa{animation:eFa 1.1s 1s cubic-bezier(.2,.9,.25,1.08) both}#ent .in-fb{animation:eFb 1.1s 1s cubic-bezier(.2,.9,.25,1.08) both}#ent .in-di{animation:eGl .7s cubic-bezier(.3,1.3,.5,1) both}' +
  '@keyframes eGl{from{opacity:0;transform:scale(.15) rotate(-120deg)}to{opacity:1;transform:none}}@keyframes eBi{from{opacity:0;transform:scale(0) rotate(-360deg)}to{opacity:1;transform:none}}' +
  '@keyframes eFa{from{opacity:0;transform:rotate(-220deg) scale(.8)}to{opacity:1;transform:none}}@keyframes eFb{from{opacity:0;transform:rotate(220deg) scale(.8)}to{opacity:1;transform:none}}' +
  '#ent .pulso{animation:ePul .7s cubic-bezier(.3,1.4,.5,1)}@keyframes ePul{40%{transform:scale(1.18) rotate(60deg);filter:drop-shadow(0 0 8px #b8ff8a)}100%{transform:rotate(120deg)}}' +
  /* en computadora: reloj arriba y logo abajo, para lucir el árbol */
  '#ent.ancho .e-pan{justify-content:flex-end;padding-bottom:calc(34px + env(safe-area-inset-bottom,0px))}' +
  '#ent.ancho .e-reloj{position:absolute;top:64px;left:0;right:0;text-align:center}' +
  '#ent.ancho .e-fecha{position:absolute;top:calc(64px + clamp(46px,11vw,78px) + 6px);left:0;right:0;text-align:center}' +
  '#ent.ancho .e-esc{width:min(30vw,150px);margin:0 0 4px}#ent.ancho .e-marca{margin-top:14px}#ent.ancho .e-marca img{width:92px}#ent.ancho .e-toca{margin-top:16px}' +
  /* teclado */
  '#ent .e-tec{position:absolute;left:0;right:0;bottom:0;margin:0 auto;max-width:440px;background:rgba(11,31,69,.95);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-radius:26px 26px 0 0;padding:18px 22px calc(22px + env(safe-area-inset-bottom,0px));transform:translateY(105%);transition:transform .45s cubic-bezier(.3,1,.4,1);box-shadow:0 -10px 40px rgba(0,0,0,.4);touch-action:manipulation}' +
  '#ent.abierto .e-tec{transform:none}' +
  '#ent.abierto .e-esc{transform:translateY(-38%) scale(.62)}#ent.abierto.ancho .e-esc{transform:translateY(-190%) scale(.8)}' +
  '#ent.abierto .e-reloj,#ent.abierto .e-fecha,#ent.abierto .e-toca,#ent.entrando .e-toca{opacity:0;pointer-events:none}' +
  '#ent .e-reloj,#ent .e-fecha,#ent .e-toca{transition:opacity .3s}' +
  '#ent.abierto .e-marca,#ent.abierto .e-lema{transform:translateY(-190%) scale(.8)}#ent.abierto.ancho .e-marca,#ent.abierto.ancho .e-lema{opacity:0}' +
  '#ent .e-marca,#ent .e-lema{transition:transform .5s cubic-bezier(.3,1,.4,1),opacity .3s}' +
  '#ent .e-tt{text-align:center;font-weight:800;font-size:16px}#ent .e-tt small{display:block;font-weight:600;opacity:.7;font-size:12.5px;margin-top:3px}' +
  '#ent .e-pts{display:flex;justify-content:center;gap:14px;margin:16px 0 14px;min-height:18px}' +
  '#ent .e-pts i{width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.6);transition:all .15s}' +
  '#ent .e-pts i.on{background:#fff;border-color:#fff;transform:scale(1.15)}#ent .e-pts.ok i{background:#7cc242;border-color:#7cc242}' +
  '#ent .e-pts.mal{animation:eSac .45s}#ent .e-pts.mal i{background:#ff6b5e;border-color:#ff6b5e}' +
  '@keyframes eSac{20%,60%{transform:translateX(-10px)}40%,80%{transform:translateX(10px)}}' +
  '#ent .e-teclas{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}' +
  '#ent .e-teclas button{height:58px;border:0;border-radius:16px;background:rgba(255,255,255,.09);color:#fff;font:800 24px Archivo,system-ui,sans-serif;cursor:pointer;transition:background .1s,transform .1s}' +
  '#ent .e-teclas button:active{background:rgba(255,255,255,.22);transform:scale(.95)}' +
  '#ent .e-teclas .e-bs{font-size:18px;background:transparent}#ent .e-teclas .e-ok{background:#F5B301;color:#3d2a00;font-size:15px}' +
  '#ent .e-teclas .e-ok[disabled]{opacity:.35}' +
  '#ent .e-msg{text-align:center;min-height:20px;font-size:13px;margin-top:10px;color:#ffc9c4;font-weight:700}' +
  '#ent .e-bienv{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:18vh;pointer-events:none;opacity:0;transition:opacity .4s;text-shadow:0 2px 14px rgba(0,0,0,.6)}' +
  '#ent .e-bienv.si{opacity:1}#ent .e-bienv b{font-size:26px}#ent .e-bienv span{opacity:.85;margin-top:6px}' +
  '#ent .e-fnd-b{position:absolute;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));border:0;border-radius:18px;padding:7px 11px;background:rgba(10,30,50,.4);color:rgba(255,255,255,.85);font:700 12.5px Archivo,system-ui,sans-serif;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);cursor:pointer}' +
  '#ent .e-fnd{position:absolute;left:12px;bottom:calc(52px + env(safe-area-inset-bottom,0px));background:#fff;color:#14306b;border-radius:14px;padding:8px;box-shadow:0 8px 26px rgba(0,0,0,.35);display:none;min-width:230px}' +
  '#ent .e-fnd.si{display:block}#ent .e-fnd b{display:block;font-size:12px;color:#5e6b7e;padding:4px 8px 6px;letter-spacing:.3px}' +
  '#ent .e-fnd button{display:flex;gap:10px;align-items:center;width:100%;border:0;background:none;text-align:left;padding:9px 8px;border-radius:9px;font:700 14px Archivo,system-ui,sans-serif;color:#14306b;cursor:pointer}' +
  '#ent .e-fnd button small{display:block;font-weight:500;font-size:11.5px;color:#5e6b7e}#ent .e-fnd button.on{background:#e8f3e2}' +
  '#ent.quieto .e-foto,#ent.quieto .e-copa{animation:none!important;transform:scale(1.03)}#ent.quieto .e-copa,#ent.quieto canvas,#ent.quieto .e-rayos{display:none}' +
  '#ent.quieto .e-halo,#ent.quieto .e-toca{animation:none}#ent.quieto .e-fondo{transform:none!important}' +
  '#ent.azul{background:linear-gradient(160deg,#0B2A5B 0%,#14306b 58%,#0A6B4E 145%)}#ent.azul .e-fondo,#ent.azul canvas{display:none}' +
  '#ent.azul .e-disco{display:block!important}' +
  '#ent.azul .e-capa{filter:none}#ent.azul .e-pan{justify-content:center!important}#ent.azul .e-reloj,#ent.azul .e-fecha{position:static!important}' +
  '#ent.azul .e-esc{width:min(56vw,212px)!important;margin:26px 0 8px!important}' +
  /* aviso de inactividad */
  '#ent-aviso{position:fixed;inset:0;z-index:2147483001;background:rgba(6,20,44,.8);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Archivo,system-ui,sans-serif}' +
  '#ent-aviso .av{background:#fff;color:#14306b;border-radius:22px;padding:24px 22px;max-width:340px;width:100%;text-align:center}' +
  '#ent-aviso h3{font-size:19px;margin:12px 0 6px}#ent-aviso p{font-size:14px;color:#5e6b7e;line-height:1.5;margin:0}' +
  '#ent-aviso .aro{width:96px;height:96px;margin:0 auto;position:relative}#ent-aviso svg{transform:rotate(-90deg)}#ent-aviso .aro b{position:absolute;inset:0;display:grid;place-items:center;font-size:26px}' +
  '#ent-aviso button{display:block;width:100%;border:0;border-radius:12px;padding:13px;font:800 15px Archivo,system-ui,sans-serif;margin-top:10px;cursor:pointer}' +
  '#ent-aviso .si{background:#14306b;color:#fff}#ent-aviso .no{background:#e9eef4;color:#14306b}' +
  /* computadora (opción C): como la pantalla de bloqueo de Windows. La hora grande
     arriba a la izquierda, el logo arriba a la derecha y abajo, al centro, el PIN
     escrito con el teclado. Sin elegir usuario: el PIN dice quién eres. */
  '#ent .e-pc{display:none}' +
  '#ent.ancho .e-pan,#ent.ancho .e-tec{display:none}' +
  '#ent.ancho .e-pc{display:block;position:absolute;inset:0;pointer-events:none}' +
  '#ent .e-pc-velo{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.34),rgba(0,0,0,0) 30%,rgba(0,0,0,0) 50%,rgba(6,18,40,.78))}' +
  '#ent .e-pc-reloj{position:absolute;top:40px;left:50px;text-shadow:0 2px 16px rgba(0,0,0,.45)}' +
  '#ent .e-pc-reloj b{display:block;font-size:46px;font-weight:600;line-height:1;letter-spacing:-1px;font-variant-numeric:tabular-nums}' +
  '#ent .e-pc-reloj span{display:block;margin-top:4px;font-size:14px;font-weight:600;opacity:.95}' +
  '#ent .e-pc-zona{position:absolute;left:0;right:0;bottom:84px;display:flex;flex-direction:column;align-items:center;gap:12px;pointer-events:auto;text-shadow:0 1px 8px rgba(0,0,0,.5)}' +
  '#ent .e-pc-av{width:96px;height:96px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.93);border:2px solid #fff;box-shadow:0 8px 30px rgba(0,0,0,.35)}' +
  '#ent .e-pc-av img{width:70px;height:70px;object-fit:contain}' +
  /* el emblema sin círculo blanco: en relieve, con un destello blanco detrás para que se lea
     sobre el árbol oscuro. Da una vuelta al abrir, avanza con cada número del PIN y gira si lo tocan. */
  '#ent .e-pc-emb{position:relative;width:168px;height:168px;border-radius:50%;background:#fff;box-shadow:0 0 0 8px rgba(255,255,255,.08),0 14px 40px rgba(0,0,0,.4);cursor:pointer;-webkit-tap-highlight-color:transparent}' +
  '#ent .e-pc-3d{position:absolute;left:8%;right:8%;top:16%;bottom:16%}' +
  '#ent .e-pc-wm{display:block;width:112px;height:auto;margin-top:10px;filter:drop-shadow(0 2px 10px rgba(0,0,0,.45));-webkit-user-drag:none;user-select:none}' +
  '#ent .e-pc-so{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;opacity:.85;margin-top:-4px}' +
  '#ent .e-pc-emb img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;-webkit-user-drag:none;user-select:none}' +
  '#ent .e-pc-fl{position:absolute;inset:0;transform-origin:49.375% 48.98%}' +
  '#ent .e-pc-emb img{transform-origin:49.375% 48.98%}#ent .in-wm{animation:eCae .6s 1.9s cubic-bezier(.3,1.5,.5,1) both}' +
  '@media (prefers-reduced-motion:reduce){#ent .in-gl,#ent .in-bi,#ent .in-fa,#ent .in-fb,#ent .in-wm{animation:none}}' +
  '#ent .e-pc-av.ini{background:#14306b;color:#fff;font-size:34px;font-weight:700;text-shadow:none}' +
  '#ent .e-pc-nom{font-size:20px;font-weight:700;text-align:center}#ent .e-pc-sub{font-size:13px;opacity:.92;text-align:center;margin-top:-6px}' +
  '#ent .e-pc-otro{background:none;border:0;color:#fff;font:600 13px Archivo,system-ui,sans-serif;text-decoration:underline;cursor:pointer;opacity:.9;margin-top:-4px}' +
  '#ent .e-pc-fila{display:flex;gap:8px;align-items:center}' +
  '#ent .e-pc-pin{display:flex;gap:8px}' +
  '#ent .e-pc-pin i{width:44px;height:52px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.42);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);transition:.15s}' +
  '#ent .e-pc-pin i.on::after{content:"";width:12px;height:12px;border-radius:50%;background:#fff}' +
  '#ent .e-pc-pin i.cur{box-shadow:0 0 0 2px #F5B301}#ent .e-pc-pin i.ext{opacity:.45}' +
  '#ent .e-pc-pin.mal{animation:eSac .45s}#ent .e-pc-pin.mal i{border-color:#ff6b5e;background:rgba(255,107,94,.3)}' +
  '#ent .e-pc-pin.ok i{border-color:#7cc242;background:rgba(124,194,66,.35)}' +
  '#ent .e-pc-ir{width:52px;height:52px;border-radius:10px;border:0;background:#fff;color:#14306b;font-size:22px;font-weight:800;cursor:pointer}#ent .e-pc-ir[disabled]{opacity:.4;cursor:default}' +
  '#ent .e-pc-msg{min-height:18px;font-size:13px;font-weight:700;color:#ffd5cf}' +
  '#ent .e-pc-hint{font-size:12.5px;display:flex;gap:6px;align-items:center;opacity:.9}' +
  '#ent .e-pc-hint kbd{font:600 11.5px Archivo,system-ui,sans-serif;border:1px solid currentColor;border-bottom-width:2px;border-radius:5px;padding:1px 6px}' +
  '#ent .e-pc-hint button{background:none;border:0;color:#fff;font:700 12.5px Archivo,system-ui,sans-serif;text-decoration:underline;cursor:pointer;padding:0}' +
  '#ent .e-pc-tec{display:none;grid-template-columns:repeat(3,64px);gap:6px}#ent.teclado .e-pc-tec{display:grid}' +
  '#ent .e-pc-tec button{height:44px;border:0;border-radius:9px;background:rgba(255,255,255,.16);color:#fff;font:700 18px Archivo,system-ui,sans-serif;cursor:pointer;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}' +
  '#ent .e-pc-tec button:hover{background:rgba(255,255,255,.26)}' +
  '#ent.ancho.entrando .e-pc-zona{opacity:0;transition:opacity .3s}' +
  '#ent.azul .e-pc-velo{display:none}' +
  '@media (prefers-reduced-motion:reduce){#ent *{animation-duration:.01s!important;animation-delay:0s!important}}';

  function ponerCss() {
    if (!$('ent-css')) { var st = document.createElement('style'); st.id = 'ent-css'; st.textContent = CSS; document.head.appendChild(st); }
    if (!document.querySelector('link[href*="family=Archivo"]')) {
      var l = document.createElement('link'); l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&display=swap';
      document.head.appendChild(l);
    }
  }

  /* ═══ La pantalla ═══ */
  var E = null;   /* estado de la pantalla montada */

  function montar(op) {
    op = op || {};
    desmontar();
    ponerCss(); traerAjustes();
    var fondo = lsGet(K_FONDO) || '';
    if (!fondo) { try { fondo = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'quieto' : 'vivo'; } catch (e) { fondo = 'vivo'; } }
    var d = document.createElement('div'); d.id = 'ent'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Entrada ECOVSA');
    var foto = 'url(' + BASE + 'entrada-arbol.jpg)';
    d.innerHTML =
      '<div class="e-fondo"><div class="e-foto" style="background-image:' + foto + '"></div><div class="e-foto e-copa" style="background-image:' + foto + '"></div>' +
      '<div class="e-sol"><i class="e-halo"></i><i class="e-rayos"></i></div><div class="e-velo"></div></div>' +
      '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="e-viento" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="3" result="n"><animate attributeName="baseFrequency" dur="9s" values="0.012 0.018;0.014 0.021;0.012 0.018" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G"/></filter></svg>' +
      '<canvas></canvas>' +
      '<div class="e-pan"><div class="e-reloj"></div><div class="e-fecha"></div>' +
        '<div class="e-esc"><div class="e-disco in-di"></div>' +
          '<img class="e-capa in-gl" src="' + BASE + 'entrada-globo.png" alt="" draggable="false">' +
          '<img class="e-capa e-bio in-bi" src="' + BASE + 'entrada-bio.png" alt="" draggable="false">' +
          '<div class="e-gira"><img class="e-capa in-fa" src="' + BASE + 'entrada-flecha-a.png" alt="" draggable="false"><img class="e-capa in-fb" src="' + BASE + 'entrada-flecha-b.png" alt="" draggable="false"></div>' +
        '</div>' +
        '<div class="e-marca"><img src="' + BASE + 'ecovsa-letras.png" alt="ECOVSA" draggable="false"></div>' +
        '<div class="e-lema">ECOLOGÍA · VIDA · SALUD</div>' +
        '<div class="e-toca" role="button" tabindex="0">' + (op.bloqueo ? 'Sesión bloqueada · <b>PIN</b><small>' + esc(op.nombre || '') + '</small>' : 'Toca para entrar · <b>PIN</b>') + '</div>' +
      '</div>' +
      '<div class="e-bienv"><b></b><span></span></div>' +
      '<div class="e-tec"><div class="e-tt">' + (op.bloqueo ? 'Escribe tu PIN para seguir' : 'Escribe tu PIN') + '<small>' + (op.bloqueo ? 'Si eres otra persona, escribe el tuyo' : 'Rutas ECOVSA') + '</small></div>' +
        '<div class="e-pts"></div><div class="e-teclas"></div><div class="e-msg" aria-live="polite"></div></div>' +
      '<div class="e-pc"><div class="e-pc-velo"></div>' +
        '<div class="e-pc-reloj"><b></b><span></span></div>' +
        '<div class="e-pc-zona"><div class="e-pc-yo"></div>' +
          '<div class="e-pc-fila"><div class="e-pc-pin"></div><button type="button" class="e-pc-ir" title="Entrar" aria-label="Entrar" disabled>→</button></div>' +
          '<div class="e-pc-msg" aria-live="polite"></div>' +
          '<div class="e-pc-hint">Escribe tu PIN · <kbd>Enter</kbd> · <button type="button" class="e-pc-vtec">teclado en pantalla</button></div>' +
          '<div class="e-pc-tec"></div>' +
        '</div></div>' +
      '<button type="button" class="e-fnd-b">🌳 Fondo</button>' +
      '<div class="e-fnd"><b>FONDO DE ESTA PANTALLA</b>' +
        '<button type="button" data-f="vivo">🌳<span>Árbol con movimiento<small>Viento, luz y hojas que caen</small></span></button>' +
        '<button type="button" data-f="quieto">🖼️<span>Árbol quieto<small>La misma foto, sin movimiento</small></span></button>' +
        '<button type="button" data-f="azul">🔵<span>Azul, sin árbol<small>El fondo de siempre, fijo</small></span></button></div>';
    document.body.appendChild(d);
    E = { d: d, op: op, pin: '', vel: 0.12, ang: 0, arr: false, a0: 0, ult: 0, mx: -999, my: -999, P: [], raf: 0, t: [], ocupado: false, fondo: fondo };
    var q = function (s) { return d.querySelector(s); };
    E.q = q;

    /* teclado: 1-9, ⌫, 0, Entrar (los PIN pueden tener de 4 a 6 números) */
    q('.e-teclas').innerHTML = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'ok'].map(function (k) {
      if (k === 'ok') return '<button type="button" class="e-ok" data-k="ok" disabled>Entrar</button>';
      return '<button type="button" data-k="' + k + '"' + (k === '⌫' ? ' class="e-bs" aria-label="Borrar"' : '') + '>' + k + '</button>';
    }).join('');
    q('.e-pc-tec').innerHTML = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'ok'].map(function (k) {
      return '<button type="button" data-k="' + k + '"' + (k === '⌫' ? ' aria-label="Borrar"' : '') + '>' + (k === 'ok' ? '→' : k) + '</button>';
    }).join('');
    pcYo();
    pts();
    ancho(); fondoAplicar(fondo); reloj();
    E.t.push(setInterval(reloj, 5000));

    /* hojas que caen y se apartan del dedo */
    var cv = q('canvas'); E.cv = cv; E.cx = cv.getContext('2d');
    for (var i = 0; i < 34; i++) E.P.push({ x: Math.random(), y: Math.random(), r: 3 + Math.random() * 4, v: .0006 + Math.random() * .0009, rot: Math.random() * 6, vr: (Math.random() - .5) * .04,
      c: ['124,194,66', '86,168,90', '232,196,74', '200,140,60'][i % 4], dx: 0, dy: 0, f: Math.random() * 6 });
    tam(); E.onRes = function () { tam(); ancho(); solSitio(); }; addEventListener('resize', E.onRes);
    solSitio();

    /* eventos */
    var esc2 = q('.e-esc');
    esc2.addEventListener('pointerdown', function (e) { if (e.target.classList.contains('e-bio')) return; E.arr = true; E.a0 = angulo(e); E.ult = 0; try { esc2.setPointerCapture(e.pointerId); } catch (x) {} e.stopPropagation(); });
    esc2.addEventListener('pointermove', function (e) { if (!E.arr) return; var a = angulo(e), g = a - E.a0; if (g > 180) g -= 360; if (g < -180) g += 360; E.ang += g; E.ult = g; E.a0 = a; });
    esc2.addEventListener('pointerup', function (e) { if (!E.arr) return; E.arr = false; E.vel = Math.max(-25, Math.min(25, E.ult)); if (Math.abs(E.ult) < .5) abrir(); e.stopPropagation(); });
    q('.e-bio').addEventListener('pointerdown', function (e) { e.stopPropagation(); var b = q('.e-bio'); b.classList.remove('in-bi', 'pulso'); void b.offsetWidth; b.classList.add('pulso'); E.vel = 18; try { navigator.vibrate && navigator.vibrate(15); } catch (x) {} });
    E.onMove = function (e) { E.mx = e.clientX; E.my = e.clientY;
      if (E.fondo === 'vivo') { var tx = e.clientX / innerWidth - .5, ty = e.clientY / innerHeight - .5; q('.e-fondo').style.transform = 'translate(' + (-tx * 18) + 'px,' + (-ty * 12) + 'px)'; }
      tocarTec(); };
    d.addEventListener('pointermove', E.onMove);
    q('.e-teclas').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; e.stopPropagation(); tecla(b.getAttribute('data-k')); });
    q('.e-teclas').addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    E.onKey = function (e) { if (!E || !$('ent')) return;
      if (/^[0-9]$/.test(e.key)) { abrir(); tecla(e.key); e.preventDefault(); }
      else if (e.key === 'Backspace') { tecla('⌫'); e.preventDefault(); }
      else if (e.key === 'Enter') { if (d.classList.contains('abierto')) tecla('ok'); else abrir(); e.preventDefault(); }
      else if (e.key === 'Escape') cerrarTec(); };
    document.addEventListener('keydown', E.onKey, true);
    q('.e-fnd-b').addEventListener('click', function (e) { e.stopPropagation(); q('.e-fnd').classList.toggle('si'); });
    q('.e-fnd').addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    q('.e-fnd').addEventListener('click', function (e) { var b = e.target.closest('button[data-f]'); if (!b) return; fondoAplicar(b.getAttribute('data-f')); lsSet(K_FONDO, b.getAttribute('data-f')); q('.e-fnd').classList.remove('si'); });
    d.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.e-tec,.e-fnd,.e-fnd-b,.e-pc-zona')) return;
      q('.e-fnd').classList.remove('si');
      if (d.classList.contains('abierto')) cerrarTec(); else abrir();
    });
    q('.e-toca').addEventListener('keydown', function (e) { if (e.key === ' ') { abrir(); e.preventDefault(); } });
    q('.e-pc-tec').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; e.stopPropagation(); tecla(b.getAttribute('data-k')); });
    q('.e-pc-ir').addEventListener('click', function (e) { e.stopPropagation(); tecla('ok'); });
    q('.e-pc-vtec').addEventListener('click', function (e) { e.stopPropagation(); d.classList.toggle('teclado'); });
    q('.e-pc-yo').addEventListener('click', function (e) { if (e.target.closest('.e-pc-emb')) { e.stopPropagation(); E.pcBase = (E.pcBase || 0) + 360; pcGiro(1.4); return; }
      if (!e.target.closest('.e-pc-otro')) return; e.stopPropagation(); E.otro = true; E.pin = ''; pts(); pcYo(); msg(''); });
    E.onVis = function () { if (!document.hidden && E && !E.raf) cuadro(); };
    document.addEventListener('visibilitychange', E.onVis);
    cuadro();
    if (op.abierto) setTimeout(abrir, 300);
  }

  function desmontar() {
    if (!E) return;
    E.t.forEach(clearInterval); cancelAnimationFrame(E.raf); E.raf = 0;
    removeEventListener('resize', E.onRes); document.removeEventListener('keydown', E.onKey, true);
    document.removeEventListener('visibilitychange', E.onVis);
    if (E.d && E.d.parentNode) E.d.parentNode.removeChild(E.d);
    E = null;
  }

  /* el círculo de abajo: el logo al abrir el sistema; en una sesión en pausa,
     quién estaba, con la opción de entrar con otro PIN */
  function pcYo() {
    if (!E) return;
    var y = E.q('.e-pc-yo'), op = E.op, nom = String(op.nombre || '').trim();
    var h = new Date().getHours(), sal = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
    if (op.bloqueo && nom && !E.otro) {
      var p = nom.split(/\s+/), ini = ((p[0] || '?')[0] + (p[1] ? p[1][0] : '')).toUpperCase();
      y.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px';
      y.innerHTML = '<div class="e-pc-av ini">' + esc(ini) + '</div><div class="e-pc-nom">' + esc(nom) + '</div>' +
        '<div class="e-pc-sub">🔒 Sesión en pausa · escribe tu PIN para seguir donde estabas</div>' +
        '<button type="button" class="e-pc-otro">¿No eres ' + esc(p[0]) + '? Entrar con otro PIN</button>';
    } else {
      y.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px';
      /* api 3.5.2: en la computadora el emblema también se arma al abrir, como en el celular */
      var ar = !E.pcVuelta, c1 = ar ? ' class="in-gl"' : '', c2 = ar ? ' class="in-bi"' : '', c3 = ar ? ' class="in-fa"' : '', c4 = ar ? ' class="in-fb"' : '';
      y.innerHTML = '<div class="e-pc-emb" title="ECOVSA"><div class="e-pc-3d">' +
          '<img' + c1 + ' src="' + BASE + 'entrada-globo.png" alt="" draggable="false"><img' + c2 + ' src="' + BASE + 'entrada-bio.png" alt="" draggable="false">' +
          '<div class="e-pc-fl"><img' + c3 + ' src="' + BASE + 'entrada-flecha-a.png" alt="" draggable="false"><img' + c4 + ' src="' + BASE + 'entrada-flecha-b.png" alt="" draggable="false"></div></div></div>' +
        '<img class="e-pc-wm' + (ar ? ' in-wm' : '') + '" src="' + BASE + 'ecovsa-letras.png" alt="ECOVSA" draggable="false"><div class="e-pc-so' + (ar ? ' in-wm' : '') + '">Sistema de operaciones</div>' +
        '<div class="e-pc-sub">' + sal + ' · escribe tu PIN</div>';
      pcGiro(0);
      if (!E.pcVuelta) {                     /* una sola vuelta al abrir; luego quieto */
        E.pcVuelta = true;
        var quieto = false; try { quieto = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (x) {}
        if (!quieto) setTimeout(function () { if (E) { E.pcBase = (E.pcBase || 0) + 360; pcGiro(1.8); } }, 2100);
      }
    }
  }
  /* gira las flechas del emblema de la computadora hasta su ángulo: las vueltas dadas
     más 60° por cada número escrito (6 números = una vuelta completa) */
  function pcGiro(seg) {
    if (!E) return; var f = E.q('.e-pc-fl'); if (!f) return;
    var a = (E.pcBase || 0) + Math.min(E.pin.length, largo()) * (360 / largo());
    f.style.transition = seg ? 'transform ' + seg + 's cubic-bezier(.25,.75,.25,1)' : 'none';
    f.style.transform = 'rotate(' + a + 'deg)';
  }
  function msg(t, color) {
    if (!E) return;
    var a = E.q('.e-msg'), b = E.q('.e-pc-msg');
    a.textContent = t; b.textContent = t; a.style.color = color || ''; b.style.color = color || '';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ancho() { if (E) E.d.classList.toggle('ancho', innerWidth > innerHeight && innerWidth > 700); }
  function tam() { if (!E) return; var k = devicePixelRatio || 1; E.cv.width = innerWidth * k; E.cv.height = innerHeight * k; }
  function reloj() {
    if (!E) return; var x = new Date(), h = x.getHours(), m = x.getMinutes();
    E.q('.e-reloj').innerHTML = (h % 12 || 12) + '<i>:</i>' + ('0' + m).slice(-2);
    var f = x.toLocaleDateString('es-PA', { weekday: 'long', day: 'numeric', month: 'long' });
    E.q('.e-fecha').textContent = f.charAt(0).toUpperCase() + f.slice(1);
    var pr = E.q('.e-pc-reloj'); if (pr) { pr.querySelector('b').textContent = h + ':' + ('0' + m).slice(-2); pr.querySelector('span').textContent = f; }
  }
  function solSitio() {
    if (!E) return; var W0 = innerWidth + 48, H0 = innerHeight + 48, w0 = 900, h0 = 1350, k = Math.max(W0 / w0, H0 / h0) * 1.06;
    var w = w0 * k, h = h0 * k, ox = (W0 - w) / 2, oy = (H0 - h) / 2, s = E.q(".e-sol"), dd = Math.max(W0, H0) * (innerWidth > innerHeight ? .32 : .5);
    s.style.left = (ox + SOL[0] * w - dd / 2) + 'px'; s.style.top = (oy + SOL[1] * h - dd / 2) + 'px'; s.style.width = s.style.height = dd + 'px';
  }
  function fondoAplicar(f) {
    if (!E) return; E.fondo = f;
    E.d.classList.toggle('quieto', f !== 'vivo'); E.d.classList.toggle('azul', f === 'azul');
    [].forEach.call(E.d.querySelectorAll('.e-fnd button'), function (b) { b.classList.toggle('on', b.getAttribute('data-f') === f); });
    E.q('.e-fnd-b').textContent = f === 'vivo' ? '🌳 Fondo' : f === 'quieto' ? '🖼️ Fondo' : '🔵 Fondo';
    if (f !== 'vivo') E.q('.e-fondo').style.transform = '';
  }
  function centro() { var r = E.q('.e-esc').getBoundingClientRect(); return [r.left + r.width * .49375, r.top + r.height * .4898]; }
  function angulo(e) { var c = centro(); return Math.atan2(e.clientY - c[1], e.clientX - c[0]) * 180 / Math.PI; }
  function cuadro() {
    if (!E) return;
    if (document.hidden) { E.raf = 0; return; }
    var base = E.fondo === 'vivo' ? .12 : 0;
    if (!E.arr) { E.vel += (base - E.vel) * .02; E.ang += E.vel; }
    E.q('.e-gira').style.transform = 'rotate(' + E.ang + 'deg)';
    if (E.fondo === 'vivo') {
      var cx = E.cx, W = E.cv.width, H = E.cv.height, k = devicePixelRatio || 1;
      cx.clearRect(0, 0, W, H);
      E.P.forEach(function (p) {
        p.y += p.v; p.f += .02; p.rot += p.vr; if (p.y > 1.05) { p.y = -.05; p.x = Math.random(); }
        var px = p.x * W + Math.sin(p.f) * 18 * k + p.dx, py = p.y * H + p.dy, ddx = px - E.mx * k, ddy = py - E.my * k, dd = Math.hypot(ddx, ddy);
        if (dd < 130 * k && dd > 0) { p.dx += ddx / dd * 4; p.dy += ddy / dd * 4; }
        p.dx *= .96; p.dy *= .96;
        cx.save(); cx.translate(px, py); cx.rotate(p.rot); cx.beginPath(); cx.ellipse(0, 0, p.r * k, p.r * .45 * k, 0, 0, 7);
        cx.fillStyle = 'rgba(' + p.c + ',.75)'; cx.fill(); cx.restore();
      });
    }
    E.raf = requestAnimationFrame(cuadro);
  }
  function pts() {
    if (!E) return; var n = Math.max(largo(), E.pin.length);
    E.q('.e-pts').innerHTML = Array.from({ length: n }, function (_, i) { return '<i class="' + (i < E.pin.length ? 'on' : '') + '"></i>'; }).join('');
    var ok = E.q('.e-ok'); if (ok) ok.disabled = E.pin.length < 4;
    var pp = E.q('.e-pc-pin');
    if (pp) {
      var hh = '';
      for (var i = 0; i < Math.max(largo(), E.pin.length); i++) hh += '<i class="' + (i < E.pin.length ? 'on' : '') + (i === E.pin.length ? ' cur' : '') + '"></i>';
      pp.innerHTML = hh; E.q('.e-pc-ir').disabled = E.pin.length < 4;
      pcGiro(.5);
    }
  }
  function abrir() { if (!E || E.ocupado) return; E.d.classList.add('abierto'); tocarTec(); }
  function cerrarTec() { if (!E) return; E.d.classList.remove('abierto'); E.pin = ''; pts(); msg(''); }
  function tocarTec() { if (!E) return; clearTimeout(E.tq); E.tq = setTimeout(function () { if (E && E.d.classList.contains('abierto') && !E.ocupado) cerrarTec(); }, 20000); }
  function tecla(k) {
    if (!E || E.ocupado) return; tocarTec(); msg('');
    if (k === '⌫') { E.pin = E.pin.slice(0, -1); pts(); return; }
    if (k === 'ok') { if (E.pin.length >= 4) probar(); return; }
    if (E.pin.length >= 6) return;
    E.pin += k; pts(); E.vel += 6;
    if ((AJ.alUltimo !== false && E.pin.length === largo()) || E.pin.length === 6) setTimeout(probar, 150);
  }
  function probar() {
    if (!E || E.ocupado) return;
    var pin = E.pin;
    var hasta = bloqueadoHasta();
    if (hasta) { msg('Demasiados intentos. Espera ' + Math.ceil((hasta - Date.now()) / 60000) + ' min.'); E.pin = ''; pts(); return; }
    E.ocupado = true; msg('Verificando…', '#cfe0ff');
    var validar = E.op.validar || function (p, fin) { fin({ ok: false, error: 'Sin validación' }); };
    validar(pin, function (r) {
      if (!E) return;
      msg('');
      if (r && r.ok) {
        acierto();
        E.q('.e-pts').classList.add('ok'); E.q('.e-pc-pin').classList.add('ok'); E.vel = 30; E.pcBase = (E.pcBase || 0) + 360; pcGiro(1.2);
        var nom = String((r.nombre || '')).trim().split(' ')[0];
        E.q('.e-bienv b').textContent = (E.op.bloqueo && r.mismo ? 'Hola de nuevo' : 'Bienvenido') + (nom ? ', ' + nom : '');
        E.q('.e-bienv span').textContent = r.texto || (E.op.bloqueo ? 'Sigues donde quedaste' : 'Abriendo tus módulos…');
        setTimeout(function () { if (!E) return; E.d.classList.remove('abierto'); E.d.classList.add('entrando'); E.q('.e-bienv').classList.add('si'); }, 400);
        setTimeout(function () { if (E && E.op.alEntrar) E.op.alEntrar(r); }, r.pausa || 1500);
      } else {
        E.ocupado = false; fallo();
        var p = E.q('.e-pts'), p2 = E.q('.e-pc-pin'); p.classList.add('mal'); p2.classList.add('mal'); try { navigator.vibrate && navigator.vibrate([60, 40, 60]); } catch (x) {}
        msg((r && r.error) || 'PIN no válido · intenta otra vez');
        setTimeout(function () { if (!E) return; p.classList.remove('mal'); p2.classList.remove('mal'); E.pin = ''; pts(); }, 600);
      }
    });
  }

  /* ═══ El vigía: bloqueo por inactividad en cualquier página ═══ */
  var V = { activo: false, pin: '', nombre: '', aviso: null, tAv: 0, bloqueado: false };
  function marcarActividad() {
    if (!V.activo || V.bloqueado || V.aviso) return;
    var ahora = Date.now();
    if (ahora - (V.ultEscrito || 0) > 15000) { V.ultEscrito = ahora; lsSet(K_ACT, String(ahora)); }
    V.ultLocal = ahora;
  }
  function ultimaActividad() { return Math.max(Number(lsGet(K_ACT)) || 0, V.ultLocal || 0); }

  function vigiar(op) {
    op = op || {};
    if (V.iniciado || window.top !== window) return;                     /* dentro de un visor: lo cuida la página de arriba */
    var pin = pinGuardado();
    if (!pin) { if (lsGet(K_BLOQ) === '1') bloquear(true); return; }
    V.pin = pin;
    var seguir = function (rol, nombre) {
      if (rol === 'operador') return;                      /* el conductor no se bloquea */
      if (V.iniciado) return; V.iniciado = true;
      V.activo = true; V.nombre = nombre || '';
      V.ultLocal = Date.now(); lsSet(K_ACT, String(Date.now()));
      ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(function (ev) { addEventListener(ev, marcarActividad, { passive: true, capture: true }); });
      addEventListener('storage', function (e) {
        if (e.key === K_BLOQ && e.newValue === '1' && !V.bloqueado) bloquear(true);
        if (e.key === K_BLOQ && !e.newValue && V.bloqueado) desbloquearAqui();
        if (e.key === K_ACT && V.aviso) quitarAviso();
      });
      setInterval(revisar, 10000);
      if (lsGet(K_BLOQ) === '1') bloquear(true);
      /* «Cerrar la sesión de todos» (Configuración): si esta sesión es de antes, pide el PIN */
      traerAjustes(function () { if (AJ.sesionDesde && AJ.sesionDesde > (Number(lsGet('eco_login_t')) || 0)) bloquear(); });
    };
    var cache = null; try { cache = JSON.parse(sessionStorage.getItem(K_ROL) || 'null'); } catch (e) {}
    if (cache && cache.p === pin.length + ':' + pin.slice(-1)) { seguir(cache.rol, cache.nombre); return; }
    if (!window.google || !google.script || !google.script.run) return;
    google.script.run.withSuccessHandler(function (r) {
      if (!r || !r.ok || !r.usuario) return;
      try { sessionStorage.setItem(K_ROL, JSON.stringify({ p: pin.length + ':' + pin.slice(-1), rol: r.usuario.rol, nombre: r.usuario.nombre })); } catch (e) {}
      seguir(r.usuario.rol, r.usuario.nombre);
    }).withFailureHandler(function () {}).api_login(pin);
  }
  function revisar() {
    if (!V.activo || V.bloqueado) return;
    var quieto = (Date.now() - ultimaActividad()) / 60000;
    if (quieto >= (AJ.minInactivo || MIN_INACTIVO) && !V.aviso) mostrarAviso();
    if (AJ.sesionDesde && AJ.sesionDesde > (Number(lsGet('eco_login_t')) || 0)) bloquear();
  }
  function mostrarAviso() {
    ponerCss();
    var n = SEG_AVISO, a = document.createElement('div'); a.id = 'ent-aviso';
    a.innerHTML = '<div class="av" role="alertdialog" aria-labelledby="ent-av-t"><div class="aro"><svg width="96" height="96" aria-hidden="true"><circle cx="48" cy="48" r="42" stroke="#e9eef4" stroke-width="8" fill="none"/><circle id="ent-arc" cx="48" cy="48" r="42" stroke="#F5B301" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="264" stroke-dashoffset="0"/></svg><b id="ent-cta">' + n + '</b></div>' +
      '<h3 id="ent-av-t">¿Sigues ahí?</h3><p>No has usado el sistema en un rato. Por seguridad vamos a bloquear la pantalla. Lo que tienes abierto se queda como está.</p>' +
      '<button type="button" class="si" id="ent-sigo">Sigo aquí</button><button type="button" class="no" id="ent-cerrar">Bloquear ahora</button></div>';
    document.body.appendChild(a); V.aviso = a;
    $('ent-sigo').onclick = function () { lsSet(K_ACT, String(Date.now())); V.ultLocal = Date.now(); quitarAviso(); };
    $('ent-cerrar').onclick = function () { quitarAviso(); bloquear(); };
    V.tAv = setInterval(function () {
      n--; var c = $('ent-cta'), arc = $('ent-arc'); if (c) c.textContent = n; if (arc) arc.style.strokeDashoffset = 264 * (1 - n / SEG_AVISO);
      if (Date.now() - ultimaActividad() < 5000) { quitarAviso(); return; }  /* alguien siguió en otra pestaña */
      if (n <= 0) { quitarAviso(); bloquear(); }
    }, 1000);
  }
  function quitarAviso() { clearInterval(V.tAv); if (V.aviso && V.aviso.parentNode) V.aviso.parentNode.removeChild(V.aviso); V.aviso = null; }

  function bloquear(desdeOtra) {
    if (V.bloqueado) return;
    V.bloqueado = true;
    lsSet(K_BLOQ, '1'); lsDel(K_PIN);                   /* sin PIN guardado: nadie entra sin escribirlo */
    montar({ bloqueo: true, nombre: V.nombre,
      validar: function (p, fin) {
        var sinRed = !window.google || !google.script || !google.script.run;
        /* sin señal, el mismo PIN abre (como antes); con señal se pregunta al
           servidor, así un usuario dado de baja ya no desbloquea */
        if (V.pin && p === V.pin && sinRed) { fin({ ok: true, mismo: true, nombre: V.nombre, pausa: 1100 }); return; }
        if (sinRed) { fin({ ok: false, error: 'Sin conexión. Intenta con señal.' }); return; }
        google.script.run.withSuccessHandler(function (r) {
          if (!r || !r.ok) { fin({ ok: false, error: (r && r.error) || 'PIN no válido' }); return; }
          if (V.pin && p === V.pin) { fin({ ok: true, mismo: true, nombre: V.nombre, pausa: 1100 }); return; }
          fin({ ok: true, mismo: false, nombre: r.usuario.nombre, otro: p, rol: r.usuario.rol, texto: 'Abriendo tus módulos…' });
        }).withFailureHandler(function () {
          if (V.pin && p === V.pin) { fin({ ok: true, mismo: true, nombre: V.nombre, pausa: 1100 }); return; }
          fin({ ok: false, error: 'Sin conexión. Intenta con señal.' });
        }).api_login(p);
      },
      alEntrar: function (r) {
        if (r.mismo) { lsSet(K_PIN, JSON.stringify(V.pin)); lsDel(K_BLOQ); lsSet(K_ACT, String(Date.now())); desbloquearAqui(); return; }
        /* otra persona: guarda su PIN y va a su lobby */
        lsSet(K_PIN, JSON.stringify(r.otro)); lsDel(K_BLOQ); lsSet(K_ACT, String(Date.now()));
        try { sessionStorage.removeItem(K_ROL); } catch (e) {}
        var destino = BASE + 'index.html';
        try { if (window.top !== window) { window.top.location.href = destino; return; } } catch (e) {}
        location.href = destino;
      } });
  }
  function desbloquearAqui() { V.bloqueado = false; V.ultLocal = Date.now(); desmontar();
    /* la pantalla de abajo puede repintarse (p. ej. el lobby toma el fondo que se eligió al bloquear) */
    try { window.dispatchEvent(new Event('eco-desbloqueo')); } catch (e) {} }

  window.EntradaECOVSA = { montar: montar, quitar: desmontar, vigiar: vigiar, detener: function () { V.activo = false; quitarAviso(); },
                           reanudar: function () { V.pin = pinGuardado(); if (V.iniciado) { V.activo = true; V.ultLocal = Date.now(); } else vigiar(); }, bloquear: function () { quitarAviso(); bloquear(); },
                           aviso: mostrarAviso, base: BASE };
  /* puente.js la carga con data-vigia: arranca el vigía sola */
  var yo = document.currentScript;
  if (yo && yo.hasAttribute('data-vigia')) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { vigiar(); });
    else vigiar();
  }
})();
