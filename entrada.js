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
   api 3.38.1 (aprobado por Álvaro el 23 oct, Maqueta_entrada_azul_huella):
     · el fondo es el azul de la marca, siempre: dos luces que se mueven
       despacio y puntos de luz que suben (sin el árbol ni el botón «Fondo»);
     · un brillo verde pasa por las letras ECOVSA al armarse el emblema;
     · con la app ECOVSA 1.2: botón grande «Entrar con tu huella»; al
       reconocerla, una luz verde llena la huella y se entra;
     · al entrar, un círculo de luz se abre desde el emblema.
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
  /* api 3.12: los intentos los cuenta el SERVIDOR (3 → 10 min, 3 más → 15 min, 3 más → bloqueado).
     Aquí solo se recuerda la espera que dijo el servidor, para no mandar intentos inútiles. */
  function bloqueadoHasta() { try { var f = JSON.parse(localStorage.getItem('eco_fallos') || '{}'); return f.hasta && f.hasta > Date.now() ? f.hasta : 0; } catch (e) { return 0; } }
  function fallo(r) {
    try { var b = r && r.bloqueo; if (b && b.tipo === 'espera' && b.min) localStorage.setItem('eco_fallos', JSON.stringify({ hasta: Date.now() + b.min * 60000 })); } catch (e) {}
  }
  function acierto() { try { localStorage.removeItem('eco_fallos'); localStorage.setItem('eco_login_t', String(Date.now())); } catch (e) {} }
  var K_PIN = 'ecovsa_pin', K_ACT = 'eco_actividad', K_BLOQ = 'eco_bloqueado', K_FONDO = 'eco_fondo', K_ROL = 'eco_rol_sesion';
  var K_BNOM = 'eco_bloq_nombre';   /* api 3.7: de quién era la sesión en pausa (solo el nombre, nunca el PIN) */
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
  /* api 3.12: crear tu PIN y «¿Olvidaste tu PIN?» */
  '#ent .e-olv{display:block;margin:8px auto 0;background:none;border:0;color:rgba(255,255,255,.8);font:700 12.5px Archivo,system-ui,sans-serif;text-decoration:underline;cursor:pointer}' +
  '#ent .e-olvp{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(92vw,380px);background:#fff;color:#14306b;border-radius:18px;padding:20px;box-shadow:0 18px 50px rgba(0,0,0,.45);z-index:5;text-shadow:none}' +
  '#ent .e-olvp b{display:block;font-size:17px}#ent .e-olvp p{font-size:13px;color:#5e6b7e;margin:6px 0 12px;line-height:1.45}' +
  '#ent .e-olvp input{width:100%;border:1px solid #cfd8e6;border-radius:10px;padding:11px 12px;font:600 15px Archivo,system-ui,sans-serif;color:#14306b}' +
  '#ent .e-olvp .fl{display:flex;gap:8px;justify-content:flex-end;margin-top:14px}' +
  '#ent .e-olvp button{border:0;border-radius:10px;padding:10px 14px;font:800 13.5px Archivo,system-ui,sans-serif;cursor:pointer;background:#eef2f8;color:#14306b}' +
  '#ent .e-olvp button.si{background:#14306b;color:#fff}#ent .e-olvp .ok{font-size:13.5px;color:#2d6a0b;font-weight:700;margin-top:10px}' +
  '#ent.creando .e-tt{color:#F5B301}' +
  '#ent .e-pc-tit{display:none;font-weight:800;font-size:17px;text-align:center}#ent .e-pc-tit small{display:block;font-weight:600;font-size:12.5px;opacity:.85;margin-top:3px;color:#fff}' +
  '#ent.creando .e-pc-tit{display:block;color:#F5B301}' +
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
  /* api 3.38.1 · el azul vivo, el brillo de las letras, la huella y el círculo de luz */
  '#ent{background:radial-gradient(120% 80% at 50% 38%,#16397a 0%,#0f2a57 45%,#081a3a 100%)}' +
  '#ent .e-foto,#ent .e-copa,#ent .e-sol,#ent .e-velo,#ent .e-fnd,#ent .e-fnd-b,#ent .e-pc-velo{display:none!important}' +
  '#ent .e-au{position:absolute;width:120vmax;height:120vmax;border-radius:50%;filter:blur(60px);opacity:.42;mix-blend-mode:screen}' +
  '#ent .e-au.a1{left:-60vmax;top:-50vmax;background:radial-gradient(circle,#1f7a4f 0%,transparent 60%);animation:eAu1 18s ease-in-out infinite alternate}' +
  '#ent .e-au.a2{right:-70vmax;bottom:-70vmax;background:radial-gradient(circle,#2a5bd7 0%,transparent 60%);animation:eAu2 22s ease-in-out infinite alternate}' +
  '@keyframes eAu1{to{transform:translate(30vmax,25vmax) scale(1.15)}}@keyframes eAu2{to{transform:translate(-28vmax,-30vmax) scale(1.1)}}' +
  '#ent.quieto .e-au{animation:none}' +
  '#ent .e-marca{position:relative}#ent .e-brillo{position:absolute;inset:0;pointer-events:none;-webkit-mask:center/contain no-repeat;mask:center/contain no-repeat;' +
    'background:linear-gradient(105deg,transparent 30%,#8fd46a 48%,#fff 52%,transparent 70%);background-size:300% 100%;background-position:120% 0;animation:eBrillo 1.4s 2.5s ease-in-out forwards}' +
  '@keyframes eBrillo{to{background-position:-60% 0}}#ent .e-lema{color:#8fd46a;font-weight:800}' +
  '#ent .e-hu{position:relative;margin-top:26px;width:84px;height:84px;border-radius:50%;border:0;background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.25);display:grid;place-items:center;cursor:pointer;color:#fff;animation:eAp .6s 2.4s both}' +
  '#ent .e-hu::before{content:"";position:absolute;inset:-8px;border-radius:50%;border:2px solid rgba(143,212,106,.6);animation:eOnda 2.2s ease-out infinite}' +
  '@keyframes eOnda{from{opacity:.9;transform:scale(.9)}to{opacity:0;transform:scale(1.35)}}#ent .e-hu svg{width:48px;height:48px}' +
  '#ent .e-hu-t{font-weight:700;font-size:14px;margin-top:10px;text-align:center;animation:eAp .6s 2.5s both}#ent .e-hu-t small{display:block;font-weight:600;font-size:12px;opacity:.75;margin-top:2px}' +
  '#ent.con-huella .e-toca{background:none;border:0;animation:none;padding:8px;margin-top:10px;font-size:13.5px;text-decoration:underline;text-underline-offset:3px;-webkit-backdrop-filter:none;backdrop-filter:none}' +
  '#ent.con-huella .e-toca b{color:inherit}#ent.abierto .e-hu,#ent.abierto .e-hu-t,#ent.entrando .e-hu,#ent.entrando .e-hu-t{opacity:0;pointer-events:none}' +
  '#ent .e-hu-k{display:none;margin:10px auto 0;background:none;border:0;color:#8fd46a;font:800 13px Archivo,system-ui,sans-serif;cursor:pointer}#ent.con-huella .e-hu-k{display:block}' +
  '#ent .e-esc2{position:absolute;z-index:6;left:50%;top:50%;width:150px;height:150px;transform:translate(-50%,-50%) scale(.6);opacity:0;pointer-events:none;transition:all .35s cubic-bezier(.2,.8,.2,1)}' +
  '#ent .e-esc2.si{opacity:1;transform:translate(-50%,-50%) scale(1)}#ent .e-esc2 svg{width:150px;height:150px;overflow:visible}' +
  '#ent .e-esc2 .bs path{stroke:rgba(255,255,255,.28)}#ent .e-esc2 .lz path{stroke:#4ADE80;filter:drop-shadow(0 0 6px rgba(74,222,128,.9))}' +
  '#ent .e-esc2 .lz{clip-path:inset(100% 0 0 0);transition:clip-path .9s cubic-bezier(.4,0,.2,1)}#ent .e-esc2.lleno .lz{clip-path:inset(0 0 0 0)}' +
  '#ent .e-esc2 .br{position:absolute;left:-10%;right:-10%;height:3px;border-radius:3px;background:linear-gradient(90deg,transparent,#8fd46a,#fff,#8fd46a,transparent);box-shadow:0 0 14px #8fd46a;top:100%;opacity:0}' +
  '#ent .e-esc2.lleno .br{animation:eBarra .9s cubic-bezier(.4,0,.2,1)}@keyframes eBarra{0%{top:100%;opacity:1}90%{opacity:1}100%{top:0;opacity:0}}' +
  '#ent .e-esc2.mal svg{animation:eSac .45s}#ent .e-esc2.mal .bs path{stroke:#ff6b6f}' +
  '#ent .e-esc2 .ok{position:absolute;right:-6px;bottom:-6px;width:44px;height:44px;border-radius:50%;background:#4ADE80;display:grid;place-items:center;transform:scale(0);transition:transform .35s cubic-bezier(.3,1.6,.5,1)}#ent .e-esc2.listo .ok{transform:scale(1)}' +
  '#ent.escaneando .e-pan,#ent.escaneando .e-pc-zona{opacity:.15;transition:opacity .3s}' +
  '#ent .e-portal{position:absolute;z-index:9;border-radius:50%;width:10px;height:10px;background:radial-gradient(circle,#fff 0%,#eef6e8 40%,#f3f5f8 70%);transform:translate(-50%,-50%) scale(0);pointer-events:none;transition:transform .75s cubic-bezier(.7,0,.2,1)}' +
  '@media (prefers-reduced-motion:reduce){#ent *{animation-duration:.01s!important;animation-delay:0s!important}}';

  function ponerCss() {
    if (!$('ent-css')) { var st = document.createElement('style'); st.id = 'ent-css'; st.textContent = CSS + CSS_INTRO + CSS_BQ + CSS_CL; document.head.appendChild(st); }
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
    envolverValidar(op);   /* api 3.92 */
    desmontar();
    ponerCss(); traerAjustes();
    /* api 3.38.1: el azul es fijo; solo se aquieta si el teléfono pide menos movimiento */
    var fondo = 'vivo';
    try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) fondo = 'quieto'; } catch (e) {}
    var d = document.createElement('div'); d.id = 'ent'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Entrada ECOVSA');
    var foto = 'none';   /* api 3.38.1: sin el árbol */
    var FP = '<path d="M12 11v3a8 8 0 0 1-1 4"/><path d="M8.5 13a3.5 3.5 0 0 1 7-1v2.5a11 11 0 0 1-.8 4"/><path d="M5.6 15.5A7 7 0 0 1 5 12.5a7 7 0 0 1 14 0v1.5"/><path d="M6.6 6.4A8.5 8.5 0 0 1 18.5 7"/><path d="M4 9.5A9.5 9.5 0 0 1 5 7.6"/><path d="M19.6 16.5a14 14 0 0 0 .4-2.5"/><path d="M12 20.5c-.4-.3-.8-.7-1.1-1.1"/>';
    if (!op.huella && hpHay()) op.huella = { pedir: function () { try { window.EcovsaApp.huellaPinPedir(); } catch (x) {} } };
    var conHuella = !!(op.huella && op.huella.pedir);
    d.innerHTML =
      '<div class="e-fondo"><i class="e-au a1"></i><i class="e-au a2"></i><div class="e-foto" style="background-image:' + foto + '"></div><div class="e-foto e-copa" style="background-image:' + foto + '"></div>' +
      '<div class="e-sol"><i class="e-halo"></i><i class="e-rayos"></i></div><div class="e-velo"></div></div>' +
      '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="e-viento" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="3" result="n"><animate attributeName="baseFrequency" dur="9s" values="0.012 0.018;0.014 0.021;0.012 0.018" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G"/></filter></svg>' +
      '<canvas></canvas>' +
      '<div class="e-pan"><div class="e-reloj"></div><div class="e-fecha"></div>' +
        '<div class="e-esc"><div class="e-disco in-di"></div>' +
          '<img class="e-capa in-gl" src="' + BASE + 'entrada-globo.png" alt="" draggable="false">' +
          '<img class="e-capa e-bio in-bi" src="' + BASE + 'entrada-bio.png" alt="" draggable="false">' +
          '<div class="e-gira"><img class="e-capa in-fa" src="' + BASE + 'entrada-flecha-a.png" alt="" draggable="false"><img class="e-capa in-fb" src="' + BASE + 'entrada-flecha-b.png" alt="" draggable="false"></div>' +
        '</div>' +
        '<div class="e-marca"><img src="' + BASE + 'ecovsa-letras.png" alt="ECOVSA" draggable="false"><span class="e-brillo" style="-webkit-mask-image:url(' + BASE + 'ecovsa-letras.png);mask-image:url(' + BASE + 'ecovsa-letras.png)"></span></div>' +
        '<div class="e-lema">ECOLOGÍA · VIDA · SALUD</div>' +
        (conHuella ? '<button type="button" class="e-hu" aria-label="Entrar con tu huella"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + FP + '</svg></button><div class="e-hu-t">Entrar con tu huella<small>Toca y pon el dedo en el lector</small></div>' : '') +
        '<div class="e-toca" role="button" tabindex="0">' + (conHuella ? 'Usar mi <b>PIN</b>' : op.bloqueo ? 'Sesión bloqueada · <b>PIN</b><small>' + esc(op.nombre || '') + '</small>' : 'Toca para entrar · <b>PIN</b>') + '</div>' +
      '</div>' +
      '<div class="e-bienv"><b></b><span></span></div>' +
      '<div class="e-tec"><div class="e-tt">' + (op.bloqueo ? 'Escribe tu PIN para seguir' : 'Escribe tu PIN') + '<small>' + (op.bloqueo ? 'Si eres otra persona, escribe el tuyo' : 'ECOVSA') + '</small></div>' +
        '<div class="e-pts"></div><div class="e-teclas"></div><div class="e-msg" aria-live="polite"></div>' +
        '<button type="button" class="e-hu-k">Entrar con mi huella</button>' +
        '<button type="button" class="e-olv">¿Olvidaste tu PIN?</button></div>' +
      '<div class="e-pc"><div class="e-pc-velo"></div>' +
        '<div class="e-pc-reloj"><b></b><span></span></div>' +
        '<div class="e-pc-zona"><div class="e-pc-yo"></div>' +
          '<div class="e-pc-tit"></div><div class="e-pc-fila"><div class="e-pc-pin"></div><button type="button" class="e-pc-ir" title="Entrar" aria-label="Entrar" disabled>→</button></div>' +
          '<div class="e-pc-msg" aria-live="polite"></div>' +
          '<div class="e-pc-hint">Escribe tu PIN · <kbd>Enter</kbd> · <button type="button" class="e-pc-vtec">teclado en pantalla</button> · <button type="button" class="e-olv" style="display:inline;margin:0">¿Olvidaste tu PIN?</button></div>' +
          '<div class="e-pc-tec"></div>' +
        '</div></div>' +
      '<div class="e-esc2"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"><g class="bs">' + FP + '</g><g class="lz">' + FP + '</g></svg><i class="br"></i><span class="ok"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#0b2a12" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg></span></div>' +
      '<button type="button" class="e-fnd-b">🌳 Fondo</button>' +
      '<div class="e-fnd"><b>FONDO DE ESTA PANTALLA</b>' +
        '<button type="button" data-f="vivo">🌳<span>Árbol con movimiento<small>Viento, luz y hojas que caen</small></span></button>' +
        '<button type="button" data-f="quieto">🖼️<span>Árbol quieto<small>La misma foto, sin movimiento</small></span></button>' +
        '<button type="button" data-f="azul">🔵<span>Azul, sin árbol<small>El fondo de siempre, fijo</small></span></button></div>';
    document.body.appendChild(d);
    if (conHuella) d.classList.add('con-huella');
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
    for (var i = 0; i < 46; i++) E.P.push({ x: Math.random(), y: Math.random(), r: .6 + Math.random() * 1.8, v: .00025 + Math.random() * .0007, rot: 0, vr: 0,
      c: i % 3 === 0 ? '143,212,106' : '255,255,255', dx: 0, dy: 0, f: Math.random() * 6 });
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
      if (E.intro) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); var b0 = E.intro.querySelector('.ei-bt'); if (b0) b0.click(); } return; }   /* api 3.83d: durante la intro solo el botón */
      if (e.target && e.target.tagName === 'INPUT') return;   /* escribiendo el nombre en «¿Olvidaste tu PIN?» */
      if (/^[0-9]$/.test(e.key)) { abrir(); tecla(e.key); e.preventDefault(); }
      else if (e.key === 'Backspace') { tecla('⌫'); e.preventDefault(); }
      else if (e.key === 'Enter') { if (d.classList.contains('abierto')) tecla('ok'); else abrir(); e.preventDefault(); }
      else if (e.key === 'Escape') cerrarTec(); };
    document.addEventListener('keydown', E.onKey, true);
    q('.e-fnd-b').addEventListener('click', function (e) { e.stopPropagation(); q('.e-fnd').classList.toggle('si'); });
    q('.e-fnd').addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    q('.e-fnd').addEventListener('click', function (e) { var b = e.target.closest('button[data-f]'); if (!b) return; fondoAplicar(b.getAttribute('data-f')); lsSet(K_FONDO, b.getAttribute('data-f')); q('.e-fnd').classList.remove('si'); });
    d.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.e-tec,.e-fnd,.e-fnd-b,.e-pc-zona,.e-olvp,.e-hu')) return;
      q('.e-fnd').classList.remove('si');
      if (d.classList.contains('abierto')) cerrarTec(); else abrir();
    });
    q('.e-toca').addEventListener('keydown', function (e) { if (e.key === ' ') { abrir(); e.preventDefault(); } });
    if (conHuella) {
      var pedirH = function (e) { e.stopPropagation(); if (E.ocupado) return; cerrarTec(); try { op.huella.pedir(); } catch (x) {} };
      q('.e-hu').addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      q('.e-hu').addEventListener('click', pedirH);
      q('.e-hu-k').addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      q('.e-hu-k').addEventListener('click', pedirH);
    }
    q('.e-pc-tec').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; e.stopPropagation(); tecla(b.getAttribute('data-k')); });
    q('.e-pc-ir').addEventListener('click', function (e) { e.stopPropagation(); tecla('ok'); });
    q('.e-pc-vtec').addEventListener('click', function (e) { e.stopPropagation(); d.classList.toggle('teclado'); });
    [].forEach.call(d.querySelectorAll('.e-olv'), function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); olvide(); }); });
    q('.e-pc-yo').addEventListener('click', function (e) { if (e.target.closest('.e-pc-emb')) { e.stopPropagation(); E.pcBase = (E.pcBase || 0) + 360; pcGiro(1.4); return; }
      if (!e.target.closest('.e-pc-otro')) return; e.stopPropagation(); E.otro = true; E.pin = ''; pts(); pcYo(); msg(''); });
    E.onVis = function () { if (!document.hidden && E && !E.raf) cuadro(); };
    document.addEventListener('visibilitychange', E.onVis);
    cuadro();
    if (op.abierto) setTimeout(abrir, 300);
    bloqueoPiel();   /* api 3.83e */
    intro();   /* api 3.83d: la intro del lobby (solo si el lobby la pide con intro:true) */
  }

  /* ═══ api 3.83d · la INTRO de la entrada del lobby (la misma del portal de clientes) y la transición inmediata al lobby ═══
     Solo lo visual: la validación del PIN, los bloqueos, la huella y el vigía NO cambian. Se pide con montar({ intro: true }) (solo el lobby);
     la pantalla de «sesión bloqueada» y la entrada del conductor siguen como estaban.
     Piel: Noche oscura por omisión (pedido de Álvaro, 30 oct); Mañana clara cuando se elija (AJ.piel o eco_piel = 'clara').
     Colores: variables de tema.css (--tm-*); lo que va después de la coma es el mismo valor, por si una página no carga el tema. */
  var CSS_INTRO = '' +
  '#ent.con-piel{background:radial-gradient(ellipse at 15% 0%,var(--tm-cielo,#e3f1ff) 0,rgba(227,241,255,0) 55%),radial-gradient(ellipse at 90% 100%,var(--tm-menta,#dcf3e2) 0,rgba(220,243,226,0) 55%),var(--tm-papel,#f7fafc);color:var(--tm-navy2,#14306b)}' +
  '#ent.con-piel.noche{background:linear-gradient(180deg,var(--tm-noche-a,#0c2146) 0%,var(--tm-noche-b,#08172f) 100%);color:var(--tm-noche-tx,#dbe8fb)}' +
  '#ent.con-piel .e-fondo,#ent.con-piel canvas,#ent.con-piel .e-au{display:none!important}#ent.con-piel .e-portal{display:none!important}' +
  '#ent.con-piel .e-marca img,#ent.con-piel .e-pc-wm{content:url(ecovsa-letras-azul.png);filter:none!important}#ent.con-piel.noche .e-marca img,#ent.con-piel.noche .e-pc-wm{content:url(ecovsa-letras.png)}#ent.con-piel .e-brillo{display:none}' +
  '#ent.con-piel .e-lema,#ent.con-piel .e-pc-so{color:var(--tm-verde,#2F6B0A)!important;text-shadow:none!important}#ent.con-piel.noche .e-lema,#ent.con-piel.noche .e-pc-so{color:var(--tm-verde-marca,#8fd46a)!important}' +
  '#ent.con-piel .e-reloj,#ent.con-piel .e-fecha,#ent.con-piel .e-pc-reloj,#ent.con-piel .e-pc-hint,#ent.con-piel .e-pc-hint button,#ent.con-piel .e-toca,#ent.con-piel .e-tt,#ent.con-piel .e-pc-tit{color:inherit!important;text-shadow:none!important}' +
  '#ent.con-piel .e-pc-pin i{background:#fff;border-color:var(--tm-linea,#e1e6ee)}#ent.con-piel.noche .e-pc-pin i{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.2)}#ent.con-piel .e-pc-pin i.on::after{background:var(--tm-navy2,#14306b)}#ent.con-piel.noche .e-pc-pin i.on::after{background:#fff}' +
  '#ei{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Archivo,system-ui,-apple-system,"Segoe UI",sans-serif;transition:opacity .7s ease;' +
    'background:radial-gradient(ellipse at 15% 0%,var(--tm-cielo,#e3f1ff) 0,rgba(227,241,255,0) 55%),radial-gradient(ellipse at 90% 100%,var(--tm-menta,#dcf3e2) 0,rgba(220,243,226,0) 55%),var(--tm-papel,#f7fafc)}' +
  '#ei.noche{background:linear-gradient(180deg,var(--tm-noche-a,#0c2146) 0%,var(--tm-noche-b,#08172f) 100%)}#ei.fuera{opacity:0;pointer-events:none}#ei canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}' +
  '#ei .im{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;text-align:center}#ei .em{position:relative;width:116px;height:116px;transform:scale(1.28);margin-bottom:44px}' +
  '#ei .em .eco-lg{box-shadow:0 0 0 8px #fff,0 0 0 9px var(--tm-linea,#e1e6ee),0 18px 40px rgba(15,42,87,.12)}#ei.noche .em .eco-lg{box-shadow:0 0 0 8px rgba(255,255,255,.06),0 0 0 9px rgba(255,255,255,.14)}' +
  '#ei .r{position:absolute;inset:0;border-radius:50%;border:2px solid var(--tm-ok,#2f9e44);opacity:0;animation:eiR 1.2s ease-out both}#ei.noche .r{border-color:var(--tm-raya,#88BE47)}' +
  '#ei .pt{position:absolute;left:50%;top:50%;margin:-3px 0 0 -3px;border-radius:50%;opacity:0;animation:eiP 1.1s 1.7s cubic-bezier(.1,.7,.3,1) both}' +
  '#ei .wm{display:block;width:150px;clip-path:inset(0 100% 0 0);animation:eiW 1s 2.05s cubic-bezier(.2,.7,.2,1) forwards}' +
  '#ei .lema{font-size:12px;letter-spacing:11px;text-transform:uppercase;font-weight:800;color:var(--tm-verde,#2F6B0A);opacity:0;margin-top:8px;animation:eiL 1.1s 2.7s ease forwards}#ei.noche .lema{color:var(--tm-verde-marca,#8fd46a)}' +
  '#ei .bt{margin-top:26px;border:0;cursor:pointer;color:#fff;background:var(--tm-navy2,#14306b);border-radius:999px;padding:14px 32px;font:800 15px Archivo,system-ui,sans-serif;opacity:0;transform:translateY(16px);animation:eiB .9s 3.5s cubic-bezier(.2,.8,.2,1) forwards}#ei.noche .bt{border:1px solid var(--tm-raya,#88BE47)}' +
  '@keyframes eiR{0%{opacity:.85;transform:scale(1)}100%{opacity:0;transform:scale(2.9)}}@keyframes eiP{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.2)}}' +
  '@keyframes eiW{to{clip-path:inset(0 0 0 0)}}@keyframes eiL{to{opacity:1;letter-spacing:3px}}@keyframes eiB{to{opacity:1;transform:none}}@keyframes eiIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@keyframes eiUp{from{opacity:0;transform:translateY(26px) scale(.97)}to{opacity:1;transform:none}}' +
  /* la transición después de la clave: el saludo y el logo que viaja a su lugar en la barra */
  '#et{position:fixed;inset:0;z-index:2147483001;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Archivo,system-ui,sans-serif;transition:opacity .6s ease;' +
    'background:radial-gradient(ellipse at 15% 0%,var(--tm-cielo,#e3f1ff) 0,rgba(227,241,255,0) 55%),radial-gradient(ellipse at 90% 100%,var(--tm-menta,#dcf3e2) 0,rgba(220,243,226,0) 55%),var(--tm-papel,#f7fafc)}' +
  '#et.noche{background:linear-gradient(180deg,var(--tm-noche-a,#0c2146) 0%,var(--tm-noche-b,#08172f) 100%)}#et.fuera{opacity:0;pointer-events:none}' +
  '#et .em{position:relative;width:150px;height:150px;transition:transform .9s cubic-bezier(.3,.8,.3,1)}#et .em .d{position:absolute;inset:0;border-radius:50%;background:#fff;box-shadow:0 0 0 8px #fff,0 0 0 9px var(--tm-linea,#e1e6ee)}#et.noche .em .d{box-shadow:0 0 0 8px rgba(255,255,255,.06),0 0 0 9px rgba(255,255,255,.14)}' +
  '#et .em img{position:absolute;inset:14%;width:72%;height:72%;object-fit:contain}#et .r{position:absolute;inset:0;border-radius:50%;border:2px solid var(--tm-ok,#2f9e44);opacity:0;animation:eiR 1.1s ease-out both}#et.noche .r{border-color:var(--tm-raya,#88BE47)}' +
  '#et h1{margin:26px 0 4px;font-size:30px;font-weight:800;color:var(--tm-navy2,#14306b);animation:eiIn .5s .1s both;transition:opacity .3s}#et.noche h1{color:#fff}#et p{margin:0;font-size:12.5px;letter-spacing:3px;font-weight:800;color:var(--tm-verde,#2F6B0A);animation:eiIn .5s .3s both;transition:opacity .3s}#et.noche p{color:var(--tm-verde-marca,#8fd46a)}' +
  '.ei-cae .ban,.ei-cae .box,.ei-cae .m,.ei-cae .adm{animation:eiUp .7s both}.ei-cae .m:nth-child(2){animation-delay:.08s}.ei-cae .m:nth-child(3){animation-delay:.16s}.ei-cae .m:nth-child(4){animation-delay:.24s}.ei-cae .m:nth-child(5){animation-delay:.32s}.ei-cae .m:nth-child(6){animation-delay:.4s}.ei-cae .box:nth-child(2){animation-delay:.2s}' +
  '@media (prefers-reduced-motion:reduce){#ei .r,#ei .pt,#et .r{display:none}#ei .wm,#ei .lema,#ei .bt{animation:none;opacity:1;clip-path:none;letter-spacing:3px;transform:none}#et h1,#et p{animation:none}.ei-cae *{animation:none!important}}';

  function piel() { var v = ''; try { v = String(AJ.piel || lsGet('eco_piel') || ''); } catch (e) {} return v === 'clara' ? 'clara' : 'noche'; }   /* 30 oct, Álvaro: Noche oscura ACTIVA; Mañana clara solo cuando se lance (AJ.piel o eco_piel = 'clara') */
  function cargarLogo(fin) {
    if (window.ECOCARGA && window.ECOCARGA.logo) { fin(); return; }
    var s = document.createElement('script'); s.src = BASE + 'cargador.js'; s.setAttribute('data-solo', ''); s.setAttribute('data-manual', '');
    s.onload = fin; document.head.appendChild(s);   /* si no carga, simplemente no hay intro: la entrada de siempre */
  }
  /* burbujas de la escena (las mismas del portal); en la noche, más claras para que se vean */
  function burbujas(c, noche) {
    var anim = 0, quieto = false; try { quieto = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    var x = c.getContext('2d'), L = [], W, H, dpr = Math.min(2, window.devicePixelRatio || 1);
    function talla() { W = innerWidth; H = innerHeight; c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function nueva(y) { return { x: Math.random() * W, y: y == null ? H + 10 : y, r: (noche ? 2.5 : 2) + Math.random() * (noche ? 5.5 : 5), v: .22 + Math.random() * .35, o: .25 + Math.random() * .6, f: Math.random() * 6.28, s: .3 + Math.random() * .6, g: Math.random() < .4 }; }
    talla(); addEventListener('resize', talla);
    for (var i = 0; i < 34; i++) L.push(nueva(Math.random() * H));
    (function paso() {
      if (!c.isConnected) { removeEventListener('resize', talla); return; }
      x.clearRect(0, 0, W, H);
      L.forEach(function (p, i) { if (!quieto) { p.y -= p.v; p.f += .01 * p.s; } var px = p.x + Math.sin(p.f) * 14, o = p.o * Math.min(1, p.y / (H * .25));
        x.fillStyle = noche ? (p.g ? 'rgba(143,212,106,' : 'rgba(150,190,255,') + Math.min(1, o * .75) + ')' : (p.g ? 'rgba(47,158,68,' : 'rgba(59,111,212,') + (o * .22) + ')';
        x.beginPath(); x.arc(px, p.y, p.r, 0, 6.28); x.fill(); if (p.y < -20) L[i] = nueva(); });
      if (!quieto) anim = requestAnimationFrame(paso);
    })();
  }
  function intro() {
    if (!E || !E.op.intro || E.op.bloqueo || E.introVisto) return;
    E.introVisto = true; var d = E.d, noche = piel() === 'noche';
    cargarLogo(function () {
      if (!E || E.d !== d || !window.ECOCARGA || !ECOCARGA.logo) return;
      var z = document.createElement('div'); z.id = 'ei'; z.className = noche ? 'noche' : ''; z.setAttribute('role', 'dialog'); z.setAttribute('aria-label', 'Bienvenida ECOVSA');
      var cv = document.createElement('canvas'); z.appendChild(cv);
      var h = '<div class="im"><div class="em">' + ECOCARGA.logo(116, { arma: true });
      for (var a = 0; a < 3; a++) h += '<span class="r" style="animation-delay:' + (1.15 + a * .32).toFixed(2) + 's"></span>';
      for (var k = 0; k < 26; k++) { var ang = k / 26 * 6.2832 + Math.random() * .3, dd = 90 + Math.random() * 95, c = k % 3 === 0 ? '#3b6fd4' : k % 3 === 1 ? '#2f9e44' : '#8fd46a', t = 3 + Math.random() * 5;
        h += '<span class="pt" style="--dx:' + Math.round(Math.cos(ang) * dd) + 'px;--dy:' + Math.round(Math.sin(ang) * dd) + 'px;width:' + t + 'px;height:' + t + 'px;background:' + c + '"></span>'; }
      h += '</div><img class="wm" src="' + BASE + (noche ? 'ecovsa-letras.png' : 'ecovsa-letras-azul.png') + '" alt="ECOVSA"><div class="lema">Ecología · Vida · Salud</div><button class="bt ei-bt" type="button">Entrar al sistema</button></div>';
      z.innerHTML = h; z.insertBefore(cv, z.firstChild); document.body.appendChild(z); d.classList.add('con-piel'); if (noche) d.classList.add('noche');
      try { burbujas(cv, noche); } catch (e) {}
      var lg = z.querySelector('.eco-lg'); setTimeout(function () { if (lg && lg.isConnected) { lg.classList.remove('arma', 'gira'); lg.classList.add('lento', 'respira'); } }, 1750);
      E.intro = z;
      var seguir = function () { if (!E || E.intro !== z) return; E.intro = null; z.classList.add('fuera'); setTimeout(function () { if (z.parentNode) z.parentNode.removeChild(z); }, 750); if (!d.classList.contains('ancho')) abrir(); };
      entradaClave(z, seguir);   /* api 3.92: «Entrar al sistema» abre usuario y contraseña */
    });
  }
  /* después de la clave: sin esperas; el saludo y el logo viaja a la barra del lobby mientras el lobby se descubre */
  function trans(r) {
    var noche = piel() === 'noche', nom = String((r && r.nombre) || '').trim().split(' ')[0], hh = new Date().getHours(), sal = hh < 12 ? 'Buenos días' : hh < 19 ? 'Buenas tardes' : 'Buenas noches';
    var z = document.createElement('div'); z.id = 'et'; z.className = noche ? 'noche' : '';
    z.innerHTML = '<div class="em"><span class="r"></span><span class="r" style="animation-delay:.3s"></span><span class="r" style="animation-delay:.6s"></span><div class="d"></div>' +
      '<img src="' + BASE + 'entrada-globo.png" alt=""><img src="' + BASE + 'entrada-bio.png" alt=""><img src="' + BASE + 'entrada-flecha-a.png" alt=""><img src="' + BASE + 'entrada-flecha-b.png" alt=""></div>' +
      '<h1>' + esc(sal + (nom ? ', ' + nom : '')) + '</h1><p>ECOLOGÍA · VIDA · SALUD</p>';
    document.body.appendChild(z);
    var t0 = Date.now(), fin = function () { if (z.parentNode) z.parentNode.removeChild(z); document.querySelectorAll('.ei-cae').forEach(function (e) { e.classList.remove('ei-cae'); }); };
    var vuela = function (l) {
      var em = z.querySelector('.em');
      if (l) { var a = l.getBoundingClientRect(), b = em.getBoundingClientRect(); em.style.transform = 'translate(' + (a.left + a.width / 2 - b.left - b.width / 2) + 'px,' + (a.top + a.height / 2 - b.top - b.height / 2) + 'px) scale(' + (a.width / b.width) + ')'; }
      z.querySelector('h1').style.opacity = 0; z.querySelector('p').style.opacity = 0;
      var t = document.getElementById('tablero'); if (t) t.classList.add('ei-cae');
      setTimeout(function () { z.classList.add('fuera'); }, 350); setTimeout(fin, 1300);
    };
    var poll = setInterval(function () {
      var l = document.querySelector('.lb .lg, .sysbar .lg'), listo = l && l.offsetWidth && Date.now() - t0 > 900;
      if (listo) { clearInterval(poll); vuela(l); } else if (Date.now() - t0 > 4500) { clearInterval(poll); vuela(null); }
    }, 60);
  }

  function desmontar() {
    if (!E) return;
    if (E.intro && E.intro.parentNode) E.intro.parentNode.removeChild(E.intro);
    quitarCapa();   /* api 3.92 */
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
      /* api 3.7: en la sesión en pausa también va el logo de ECOVSA; el nombre, debajo */
      var p = nom.split(/\s+/);
      y.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px';
      y.innerHTML = '<div class="e-pc-emb" title="ECOVSA"><div class="e-pc-3d">' +
          '<img src="' + BASE + 'entrada-globo.png" alt="" draggable="false"><img src="' + BASE + 'entrada-bio.png" alt="" draggable="false">' +
          '<div class="e-pc-fl"><img src="' + BASE + 'entrada-flecha-a.png" alt="" draggable="false"><img src="' + BASE + 'entrada-flecha-b.png" alt="" draggable="false"></div></div></div>' +
        '<img class="e-pc-wm" src="' + BASE + 'ecovsa-letras.png" alt="ECOVSA" draggable="false">' +
        '<div class="e-pc-nom" style="margin-top:4px">' + esc(nom) + '</div>' +
        '<div class="e-pc-sub">🔒 Sesión en pausa · escribe tu PIN para seguir donde estabas</div>' +
        '<button type="button" class="e-pc-otro">¿No eres ' + esc(p[0]) + '? Entrar con otro PIN</button>';
      pcGiro(0);
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
        p.y -= p.v; p.f += .02; if (p.y < -.03) { p.y = 1.03; p.x = Math.random(); }
        var px = p.x * W + Math.sin(p.f * .5) * 6 * k + p.dx, py = p.y * H + p.dy, ddx = px - E.mx * k, ddy = py - E.my * k, dd = Math.hypot(ddx, ddy);
        if (dd < 110 * k && dd > 0) { p.dx += ddx / dd * 3; p.dy += ddy / dd * 3; }
        p.dx *= .95; p.dy *= .95;
        cx.beginPath(); cx.arc(px, py, p.r * k, 0, 6.29);
        cx.fillStyle = 'rgba(' + p.c + ',' + (.25 + .35 * (1 + Math.sin(p.f)) / 2) + ')'; cx.fill();
      });
    }
    E.raf = requestAnimationFrame(cuadro);
  }
  function pts() {
    if (!E) return; var n = E.modo === 'crear' ? largo() : Math.max(largo(), E.pin.length);
    E.q('.e-pts').innerHTML = Array.from({ length: n }, function (_, i) { return '<i class="' + (i < E.pin.length ? 'on' : '') + '"></i>'; }).join('');
    var ok = E.q('.e-ok'); if (ok) { ok.disabled = E.pin.length < 4; ok.textContent = E.modo === 'crear' ? 'Seguir' : 'Entrar'; }
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
    if (E.modo === 'crear') {                       /* api 3.12: creando su propio PIN */
      if (k === 'ok') { if (E.pin.length === largo()) crearPaso(); else msg('Tu PIN lleva ' + largo() + ' números'); return; }
      if (E.pin.length >= largo()) return;
      E.pin += k; pts(); E.vel += 6;
      if (E.pin.length === largo()) setTimeout(crearPaso, 180);
      return;
    }
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
    var porHuella = !!E.porHuella; E.porHuella = false;
    validar(pin, function (r) {
      if (!E) return;
      msg('');
      if (r && r.ok) {
        acierto();
        /* app 1.6: el PIN de la cuenta también desbloquea la tablet (se guarda solo su huella cifrada, así abre sin señal) */
        try { if (window.EcovsaApp && typeof window.EcovsaApp.bloqueoPin === 'function') window.EcovsaApp.bloqueoPin(String(pin)); } catch (x) {}
        /* api 3.38.1: con la app que lo permite, antes de entrar se ofrece guardar la huella */
        if (!porHuella && hpOfrecer()) { ofrecerHuella(pin, function () { exito(r); }); return; }
        exito(r);
      } else if (r && r.crearPin) {
        /* api 3.12: entró con un PIN temporal: ahora crea el suyo */
        E.ocupado = false; empezarCrear(pin, r.nombre || '');
      } else {
        E.ocupado = false; fallo(r);
        /* api 3.38.1: la huella traía un PIN que ya no sirve (lo cambiaron): se olvida y se pide escribirlo */
        if (porHuella && !(r && (r.bloqueo || r.mantenimiento)) && !/conexi/i.test(String(r && r.error))) { hpBorrar(); abrir(); msg('Tu PIN cambió: escríbelo. Luego puedes volver a guardar tu huella.'); E.pin = ''; pts(); return; }
        if (porHuella) abrir();
        var p = E.q('.e-pts'), p2 = E.q('.e-pc-pin'); p.classList.add('mal'); p2.classList.add('mal'); try { navigator.vibrate && navigator.vibrate([60, 40, 60]); } catch (x) {}
        msg((r && r.error) || 'PIN no válido · intenta otra vez');
        setTimeout(function () { if (!E) return; p.classList.remove('mal'); p2.classList.remove('mal'); E.pin = ''; pts(); }, 600);
      }
    }, { huella: porHuella });
  }
  function exito(r) {
    if (!E) return;
    E.q('.e-pts').classList.add('ok'); E.q('.e-pc-pin').classList.add('ok'); E.vel = 30; E.pcBase = (E.pcBase || 0) + 360; pcGiro(1.2);
    var nom = String((r.nombre || '')).trim().split(' ')[0];
    E.q('.e-bienv b').textContent = (E.op.bloqueo && r.mismo ? 'Hola de nuevo' : 'Bienvenido') + (nom ? ', ' + nom : '');
    E.q('.e-bienv span').textContent = r.texto || (E.op.bloqueo ? 'Sigues donde quedaste' : 'Abriendo tus módulos…');
    setTimeout(function () { if (!E) return; E.d.classList.remove('abierto'); E.d.classList.add('entrando'); E.q('.e-bienv').classList.add('si'); }, 400);
    var conTrans = E.d.classList.contains('con-piel') && !E.bq; if (conTrans) { E.trans = true; trans(r); }
    if (E.bq) { E.trans = true; cierraBloqueo(); }   /* api 3.83e */   /* api 3.83d */
    var pausa = E.bq ? 1500 : conTrans ? Math.min(r.pausa || 1500, 800) : (r.pausa || 1500);
    setTimeout(portal, Math.max(450, pausa - 720));   /* api 3.38.1 */
    setTimeout(function () { if (E && E.op.alEntrar) E.op.alEntrar(r); }, pausa);
  }

  /* ═══ api 3.38.1 · el círculo de luz y la huella ═══ */
  function portal() {
    if (!E || E.trans) return; var quieto = false; try { quieto = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (x) {}
    if (quieto) return;
    var em = E.q(E.d.classList.contains('ancho') ? '.e-pc-emb' : '.e-esc') || E.d, rc = em.getBoundingClientRect(), p = document.createElement('i');
    p.className = 'e-portal'; p.style.left = (rc.left + rc.width / 2) + 'px'; p.style.top = (rc.top + rc.height / 2) + 'px'; E.d.appendChild(p);
    var k = Math.hypot(innerWidth, innerHeight) / 5; void p.offsetWidth; p.style.transform = 'translate(-50%,-50%) scale(' + k + ')';
    E.vel = 30;
  }
  function hpApp(f) { return !!(window.EcovsaApp && typeof window.EcovsaApp[f] === 'function'); }
  function hpHay() { try { return hpApp('huellaPinHay') && !!window.EcovsaApp.huellaPinHay(); } catch (x) { return false; } }
  function hpBorrar() { try { if (hpApp('huellaPinBorrar')) window.EcovsaApp.huellaPinBorrar(); } catch (x) {} }
  function hpOfrecer() {
    try { if (!hpApp('huellaPinDisponible') || !window.EcovsaApp.huellaPinDisponible() || hpHay()) return false; } catch (x) { return false; }
    var no = Number(lsGet('eco_hp_no')) || 0; return Date.now() - no > 30 * 86400000;   /* «Ahora no»: se vuelve a preguntar en 30 días */
  }
  var HP = { sigue: null };
  function ofrecerHuella(pin, sigue) {
    if (!E) return sigue();
    E.q('.e-pts').classList.add('ok'); E.d.classList.remove('abierto');
    var h = document.createElement('div'); h.className = 'e-olvp e-hpof';
    h.innerHTML = '<b>¿Entrar con tu huella la próxima vez?</b><p>Así no escribes el PIN al entrar. La huella se queda solo en este teléfono; tu PIN sigue sirviendo siempre.</p>' +
      '<div class="fl"><button type="button" class="no">Ahora no</button><button type="button" class="si">Sí, usar mi huella</button></div>';
    E.d.appendChild(h);
    h.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    var fin = function () { if (h.parentNode) h.parentNode.removeChild(h); HP.sigue = null; sigue(); };
    h.querySelector('.no').onclick = function () { lsSet('eco_hp_no', String(Date.now())); fin(); };
    h.querySelector('.si').onclick = function () { HP.sigue = fin; try { window.EcovsaApp.huellaPinGuardar(String(pin)); } catch (x) { fin(); } };
  }
  /* lo que contesta la app (EcovsaApp.huellaPinPedir / huellaPinGuardar) */
  if (!window.ecoHuella) window.ecoHuella = function (txt) {
    var r = {}; try { r = JSON.parse(txt); } catch (x) {}
    if (r.accion === 'guardar') { var f = HP.sigue; if (f) f(); return; }
    if (!E) return;
    if (r.ok && r.pin) { conHuellaPin(r.pin); return; }
    if (r.invalidada) { abrir(); msg('Las huellas del teléfono cambiaron: entra con tu PIN y vuelve a guardar la tuya.'); return; }
    if (r.error && r.error !== 'ocupado') { abrir(); msg(r.error); return; }
    if (r.cancelado) abrir();
  };
  if (!window.ecoHuellaFallo) window.ecoHuellaFallo = function () { huellaMal(); };
  /* la app reconoció la huella y devolvió el PIN: la luz llena la huella y se prueba el PIN como siempre */
  function conHuellaPin(pin) {
    if (!E || E.ocupado || !pin) return;
    var s = E.q('.e-esc2'); E.d.classList.remove('abierto'); E.d.classList.add('escaneando'); s.classList.remove('mal', 'lleno', 'listo'); s.classList.add('si');
    setTimeout(function () { if (E) s.classList.add('lleno'); }, 250);
    setTimeout(function () { if (!E) return; s.classList.add('listo'); try { navigator.vibrate && navigator.vibrate(40); } catch (x) {} }, 1150);
    setTimeout(function () { if (!E) return; s.classList.remove('si'); E.d.classList.remove('escaneando'); E.pin = String(pin); E.porHuella = true; pts(); probar(); }, 1550);
  }
  function huellaMal() {
    if (!E) return; var s = E.q('.e-esc2'); E.d.classList.add('escaneando'); s.classList.remove('lleno', 'listo'); s.classList.add('si', 'mal');
    try { navigator.vibrate && navigator.vibrate([60, 40, 60]); } catch (x) {}
    setTimeout(function () { if (!E) return; s.classList.remove('si', 'mal'); E.d.classList.remove('escaneando'); }, 900);
  }

  /* ═══ api 3.12 · Crear tu PIN (después de entrar con el temporal) ═══ */
  function tituloCrear(t, s) {
    if (!E) return;
    E.q('.e-tt').innerHTML = esc(t) + '<small>' + esc(s || '') + '</small>';
    var h = E.q('.e-pc-tit'); if (h) h.innerHTML = esc(t) + '<small>' + esc(s || '') + '</small>';
  }
  function empezarCrear(temporal, nombre) {
    if (!E) return;
    E.modo = 'crear'; E.temp = temporal; E.nomCrear = nombre; E.primero = ''; E.pin = '';
    E.d.classList.add('creando'); E.d.classList.add('abierto');
    var n = String(nombre || '').split(' ')[0];
    tituloCrear((n ? 'Hola, ' + n + ' · ' : '') + 'crea tu PIN', largo() + ' números que solo tú sepas. No lo compartas con nadie.');
    msg('Ese era tu PIN temporal: ahora escribe el tuyo.', '#cfe0ff'); pts();
  }
  function salirCrear() {
    if (!E) return;
    E.modo = null; E.temp = ''; E.primero = ''; E.d.classList.remove('creando');
    E.q('.e-tt').innerHTML = (E.op.bloqueo ? 'Escribe tu PIN para seguir' : 'Escribe tu PIN') + '<small>' + (E.op.bloqueo ? 'Si eres otra persona, escribe el tuyo' : 'Rutas ECOVSA') + '</small>';
    var h = E.q('.e-pc-tit'); if (h) h.innerHTML = '';
  }
  function crearPaso() {
    if (!E || E.modo !== 'crear' || E.ocupado || E.pin.length !== largo()) return;
    if (!E.primero) {
      /* todos iguales o seguidos (1111, 1234, 4321): se avisa de una vez, sin repetirlo */
      var d = E.pin.split('').map(Number), sube = true, baja = true;
      for (var i = 1; i < d.length; i++) { if (d[i] !== d[i - 1] + 1) sube = false; if (d[i] !== d[i - 1] - 1) baja = false; }
      if (/^(\d)\1+$/.test(E.pin) || sube || baja) { E.pin = ''; pts(); msg('Ese PIN es muy fácil de adivinar (todos iguales o seguidos). Elige otro.'); return; }
      E.primero = E.pin; E.pin = ''; pts();
      tituloCrear('Escríbelo otra vez', 'Para confirmar tu PIN nuevo'); msg(''); return;
    }
    if (E.pin !== E.primero) {
      E.primero = ''; E.pin = ''; pts();
      tituloCrear('No coinciden · empieza otra vez', largo() + ' números que solo tú sepas'); msg('Los dos PIN no son iguales.'); return;
    }
    var nuevo = E.pin;
    if (!window.google || !google.script || !google.script.run) { msg('Sin conexión. Intenta con señal.'); return; }
    E.ocupado = true; msg('Guardando tu PIN…', '#cfe0ff');
    google.script.run.withSuccessHandler(function (r) {
      if (!E) return; E.ocupado = false;
      if (r && r.ok) {
        salirCrear(); msg('¡Listo! Ese es tu PIN desde ahora.', '#b8ff8a');
        E.pin = nuevo; pts(); setTimeout(probar, 700); return;
      }
      if (r && (r.bloqueo || r.requiereLogin)) { fallo(r); salirCrear(); E.pin = ''; pts(); msg((r && r.error) || 'No se pudo.'); return; }
      E.primero = ''; E.pin = ''; pts();
      tituloCrear('Elige otro PIN', largo() + ' números que solo tú sepas');
      msg((r && r.error) || 'No se pudo guardar. Intenta otra vez.');
    }).withFailureHandler(function () { if (!E) return; E.ocupado = false; msg('Sin conexión. Intenta con señal.'); }).api_crearMiPin(E.temp, nuevo);
  }
  /* ═══ api 3.12 · ¿Olvidaste tu PIN? → aviso al administrador ═══ */
  function olvide() {
    if (!E || E.q('.e-olvp')) return;
    var p = document.createElement('div'); p.className = 'e-olvp';
    p.innerHTML = '<b>¿Olvidaste tu PIN?</b><p>Escribe tu nombre y le avisamos al administrador. Él te da un PIN temporal para que crees el tuyo. También puedes pedírselo directamente.</p>' +
      '<input type="text" autocomplete="name" placeholder="Tu nombre y apellido" maxlength="80"><div class="ok" hidden></div>' +
      '<div class="fl"><button type="button" class="no">Cerrar</button><button type="button" class="si">Avisar al administrador</button></div>';
    E.d.appendChild(p);
    var inp = p.querySelector('input'), ok = p.querySelector('.ok'), si = p.querySelector('.si');
    setTimeout(function () { inp.focus(); }, 60);
    p.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    p.querySelector('.no').onclick = function () { p.parentNode.removeChild(p); };
    var enviar = function () {
      var n = inp.value.trim(); if (n.length < 3) { ok.hidden = false; ok.style.color = '#a8262b'; ok.textContent = 'Escribe tu nombre.'; return; }
      if (!window.google || !google.script || !google.script.run) { ok.hidden = false; ok.textContent = 'Sin conexión. Pídeselo directamente al administrador.'; return; }
      si.disabled = true;
      google.script.run.withSuccessHandler(function (r) {
        si.disabled = false; ok.hidden = false; ok.style.color = r && r.ok ? '#2d6a0b' : '#a8262b';
        ok.textContent = (r && (r.texto || r.error)) || 'Listo.';
        if (r && r.ok) { si.style.display = 'none'; inp.disabled = true; }
      }).withFailureHandler(function () { si.disabled = false; ok.hidden = false; ok.textContent = 'Sin conexión. Pídeselo directamente al administrador.'; }).api_pedirPinNuevo(n);
    };
    si.onclick = enviar;
    inp.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') enviar(); if (e.key === 'Escape') p.parentNode.removeChild(p); });
  }

  /* ═══ api 3.76 · aviso del monitor de uso y «¿Cómo te fue?» ═══
     El sistema anota qué pantallas o funciones usa cada persona (nunca lo que escribe). Antes de anotar nada, cada usuario ve este aviso
     una vez («Entendido»). Una vez al mes puede responder un toque: Bien / Regular / Mal. El administrador no lo ve. */
  function usoAvisoPide() {
    if (window.top !== window || V.usoPidio) return; V.usoPidio = true;
    var pin = V.pin; if (!pin || !window.google || !google.script || !google.script.run) return;
    var clave = pin.length + ':' + pin.slice(-1), hoy = new Date().toISOString().slice(0, 10);
    try { if (sessionStorage.getItem('eco_uso') === hoy + clave) return; if ((Number(lsGet('eco_uso_no')) || 0) > Date.now()) return; } catch (e) {}
    setTimeout(function () {
      google.script.run.withSuccessHandler(function (r) {
        if (!r || !r.ok) return;
        if (r.pide) usoVer(r, 'aviso'); else if (r.pregunta) usoVer(r, 'pregunta'); else { try { sessionStorage.setItem('eco_uso', hoy + clave); } catch (e) {} }
      }).withFailureHandler(function () {}).api_usoAviso(pin);
    }, 2500);
  }
  function usoVer(r, tipo) {
    if (document.getElementById('uso-av')) return;
    var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var cara = function (c, d) { return '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="' + c + '" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9 9.5h.01M15 9.5h.01"/><path d="' + d + '"/></svg>'; };
    var b = document.createElement('div'); b.id = 'uso-av';
    b.style.cssText = 'position:fixed;inset:0;z-index:2147482900;background:rgba(15,33,64,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Archivo,system-ui,sans-serif';
    var base = 'background:#fff;border-radius:16px;padding:20px;max-width:420px;width:100%;color:#0f2140;box-shadow:0 12px 40px rgba(0,0,0,.3);max-height:90vh;overflow:auto';
    var btn = 'font:700 14px Archivo,system-ui,sans-serif;border-radius:10px;padding:11px 14px;cursor:pointer;border:1px solid #e1e6ee;background:#fff;color:#14306b';
    if (tipo === 'aviso') {
      b.innerHTML = '<div style="' + base + '" role="dialog" aria-modal="true"><h2 style="margin:0 0 8px;font-size:18px">Cómo cuidamos el sistema</h2><p style="font-size:14px;line-height:1.55;margin:6px 0">' + esc(r.texto) + '</p>' +
        '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button type="button" id="uso-ok" style="' + btn + ';background:#14306b;color:#fff;border-color:#14306b;flex:1">Entendido</button></div></div>';
      document.body.appendChild(b);
      document.getElementById('uso-ok').onclick = function () {
        this.disabled = true;
        google.script.run.withSuccessHandler(function (x) { if (b.parentNode) b.parentNode.removeChild(b); if (x && x.ok) { try { sessionStorage.removeItem('eco_uso'); } catch (e) {} } })
          .withFailureHandler(function () { if (b.parentNode) b.parentNode.removeChild(b); }).api_usoAvisoVisto(V.pin);
      };
    } else {
      b.innerHTML = '<div style="' + base + '" role="dialog" aria-modal="true"><h2 style="margin:0 0 8px;font-size:18px">¿Cómo te fue esta semana?</h2><p style="font-size:13.5px;color:#667489;margin:4px 0">Un toque. Nos ayuda a mejorar lo que no te funciona bien.</p>' +
        '<div style="display:flex;gap:8px;margin:14px 0">' + [['Bien', '#2f9e44', 'M8 14s1.5 2 4 2 4-2 4-2'], ['Regular', '#d99a00', 'M8 15h8'], ['Mal', '#d64045', 'M8 16s1.5-2 4-2 4 2 4 2']].map(function (x) {
          return '<button type="button" data-v="' + x[0] + '" style="' + btn + ';flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;color:#0f2140">' + cara(x[1], x[2]) + x[0] + '</button>'; }).join('') + '</div>' +
        '<button type="button" id="uso-no" style="' + btn + ';width:100%">Ahora no</button></div>';
      document.body.appendChild(b);
      var cerrar = function () { if (b.parentNode) b.parentNode.removeChild(b); };
      [].forEach.call(b.querySelectorAll('[data-v]'), function (x) { x.onclick = function () {
        google.script.run.withSuccessHandler(cerrar).withFailureHandler(cerrar).api_usoComoMeFue(V.pin, x.getAttribute('data-v'));
        try { sessionStorage.setItem('eco_uso', new Date().toISOString().slice(0, 10) + V.pin.length + ':' + V.pin.slice(-1)); } catch (e) {}
      }; });
      document.getElementById('uso-no').onclick = function () { lsSet('eco_uso_no', String(Date.now() + 7 * 86400000)); cerrar(); };
    }
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
    renovarLlave(function () { bloquear(false); });   /* api 3.92 */
    var seguir = function (rol, nombre) {
      usoAvisoPide();   /* api 3.76 */
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
    renovarLlave(function () { bloquear(false); });   /* api 3.92 */
    var quieto = (Date.now() - ultimaActividad()) / 60000;
    if (quieto >= (AJ.minInactivo || MIN_INACTIVO)) { quitarAviso(); bloquear(false, 'inactividad'); return; }   /* api 3.83e: sin cuenta regresiva */
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

  /* ═══ api 3.83e · MÁQUINA BLOQUEADA: sin cuenta regresiva; se bloquea con un mensaje y «Sigo aquí» lleva al PIN ═══
     Solo lo visual del bloqueo de la web (vigía): el desbloqueo (PIN, esperas, «otra persona», sin señal) NO cambia.
     Transiciones: al bloquear, la pantalla se abre desde el logo (iris) con tres aros que se cierran sobre él; al desbloquear, el iris se cierra sobre el logo
     con tres aros que salen, y se descubre la pantalla de debajo tal como estaba. Noche oscura por omisión; colores de tema.css (--tm-*). */
  var CSS_BQ = '' +
  '#ent.bq .bq-cv{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0}#ent.bq.con-piel canvas.bq-cv{display:block!important}' +
  '#ent.bq .e-pan,#ent.bq .e-pc,#ent.bq .e-tec{z-index:2}#ent.bq .e-pc-reloj,#ent.bq .e-bienv{z-index:2}#ent.bq .e-bienv{color:#fff;text-shadow:none}#ent.bq:not(.noche) .e-bienv{color:var(--tm-navy2,#14306b)}' +
  '#ent.bq .e-pc-pin i{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.2)}#ent.bq:not(.noche) .e-pc-pin i{background:#fff;border-color:var(--tm-linea,#e1e6ee)}' +
  '#ent.bq .e-pc-emb{box-shadow:0 0 0 8px rgba(255,255,255,.06),0 0 0 1px rgba(255,255,255,.14)}' +
  '#ent.bq .bq-msg{position:absolute;z-index:6;left:50%;transform:translateX(-50%);top:calc(50% + 122px);width:min(420px,88vw);text-align:center;color:var(--tm-noche-tx,#dbe8fb);animation:ebMsg .6s .5s both}' +
  '#ent.bq:not(.noche) .bq-msg{color:var(--tm-navy2,#14306b)}#ent.bq .bq-msg b{display:block;font-size:20px;font-weight:800;margin-bottom:6px;color:#fff}#ent.bq:not(.noche) .bq-msg b{color:var(--tm-navy2,#14306b)}' +
  '#ent.bq .bq-msg p{margin:0 0 16px;font-size:14px;line-height:1.5;color:var(--tm-noche-tx,#dbe8fb);opacity:.85}#ent.bq:not(.noche) .bq-msg p{color:var(--tm-gris,#667489);opacity:1}' +
  '#ent.bq .bq-msg button{border:1px solid var(--tm-raya,#88BE47);background:var(--tm-navy2,#14306b);color:#fff;border-radius:999px;padding:13px 34px;font:800 15px Archivo,system-ui,sans-serif;cursor:pointer}' +
  '#ent.bq.bq-oculta .e-pc-nom,#ent.bq.bq-oculta .e-pc-sub,#ent.bq.bq-oculta .e-pc-fila,#ent.bq.bq-oculta .e-pc-hint,#ent.bq.bq-oculta .e-pc-otro,#ent.bq.bq-oculta .e-pc-msg,#ent.bq.bq-oculta .e-pc-tit,#ent.bq.bq-oculta .e-toca,#ent.bq.bq-oculta .e-tec{visibility:hidden}' +
  '#ent.bq.bq-entra{animation:ebAbre .95s cubic-bezier(.3,.7,.2,1) both}#ent.bq.bq-sale{animation:ebCierra .85s cubic-bezier(.6,0,.3,1) both;pointer-events:none}' +
  '@keyframes ebMsg{from{opacity:0;transform:translate(-50%,14px)}to{opacity:1;transform:translate(-50%,0)}}@keyframes ebAbre{from{clip-path:circle(0% at 50% 46%)}to{clip-path:circle(150% at 50% 46%)}}@keyframes ebCierra{from{clip-path:circle(150% at 50% 46%)}to{clip-path:circle(0% at 50% 46%)}}' +
  '.eb-ar{position:fixed;z-index:2147483002;border-radius:50%;border:2px solid var(--tm-raya,#88BE47);opacity:0;pointer-events:none}.eb-ar.in{animation:ebAroIn 1s ease-in both}.eb-ar.out{animation:eiR 1s ease-out both}' +
  '@keyframes ebAroIn{0%{opacity:0;transform:scale(3.2)}35%{opacity:.8}100%{opacity:0;transform:scale(1)}}' +
  '@media (prefers-reduced-motion:reduce){#ent.bq.bq-entra,#ent.bq.bq-sale{animation:none}.eb-ar{display:none}#ent.bq .bq-msg{animation:none}}';

  /* tres aros alrededor del logo: hacia adentro al bloquear (in), hacia afuera al desbloquear (out) */
  function aros(sentido) {
    if (!E) return; var em = E.q(E.d.classList.contains('ancho') ? '.e-pc-emb' : '.e-esc'); if (!em) return; var r = em.getBoundingClientRect(); if (!r.width) return;
    for (var i = 0; i < 3; i++) { var a = document.createElement('span'); a.className = 'eb-ar ' + sentido; a.style.cssText = 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;animation-delay:' + (i * .22).toFixed(2) + 's';
      document.body.appendChild(a); (function (x) { setTimeout(function () { if (x.parentNode) x.parentNode.removeChild(x); }, 2000); })(a); }
  }
  /* la pantalla bloqueada: Noche oscura, burbujas, iris; si se bloqueó por inactividad, un mensaje antes del PIN */
  function bloqueoPiel() {
    if (!E || !E.op.bloqueo || E.bq) return; E.bq = true; var d = E.d, noche = piel() === 'noche';
    d.classList.add('con-piel', 'bq', 'bq-entra'); if (noche) d.classList.add('noche');
    var cv = document.createElement('canvas'); cv.className = 'bq-cv'; d.insertBefore(cv, d.firstChild); try { burbujas(cv, noche); } catch (e) {}
    setTimeout(function () { aros('in'); }, 30);
    if (E.op.motivo === 'inactividad' || E.op.motivo === 'otra') {
      var m = document.createElement('div'); m.className = 'bq-msg';
      m.innerHTML = '<b>Pantalla bloqueada</b><p>Por seguridad la bloqueamos porque no se usó en un rato. Lo que tenía abierto se queda como está.</p><button type="button" class="bq-sigo">Sigo aquí</button>';
      d.appendChild(m); d.classList.add('bq-oculta'); E.msg = m;
      m.querySelector('button').addEventListener('click', function (e) { e.stopPropagation(); if (!E || E.msg !== m) return; E.msg = null; m.parentNode && m.parentNode.removeChild(m); d.classList.remove('bq-oculta'); abrirBloqueo(); });
    } else if (E.op.clave) { setTimeout(abrirBloqueo, 700); }
  }
  /* al acertar el PIN: el iris se cierra sobre el logo con los aros saliendo y se descubre lo que estaba debajo */
  function abrirBloqueo() { if (!E) return; if (E.op.clave) { bloqueoClave(E.op.nombre, E.op.clave, function (ll) { entrarConLlave(ll); }); } else if (!E.d.classList.contains('ancho')) abrir(); }
  function cierraBloqueo() {
    if (!E) return; var d = E.d; setTimeout(function () { if (!E || E.d !== d) return; aros('out'); d.classList.remove('bq-entra'); d.classList.add('bq-sale'); }, 450);
  }

  /* ═══ api 3.92 · ENTRADA CON USUARIO Y CONTRASEÑA (etapa 3) ═══
     El servidor (api 3.90/3.91) ya entrega la «llave de sesión» s1.… que ocupa el lugar del PIN: viaja como primer argumento y el resto de la página no cambia.
     Aquí: tarjeta «Iniciar sesión» tras «Entrar al sistema» (con «Entrar con mi PIN» mientras dure la transición), contraseña temporal, crear usuario y contraseña tras entrar
     con el PIN, bloqueo que pide la contraseña, y renovación de la llave. El PIN, la huella y las esperas NO cambian. Colores: variables de tema.css (--tm-*). */
  var CSS_CL = '' +
  '.cl{box-sizing:border-box;width:min(352px,88vw);margin-top:14px;text-align:left;background:var(--tm-tarjeta,#fff);border:1px solid var(--tm-linea,#e1e6ee);border-radius:18px;padding:20px 20px 18px;box-shadow:0 8px 28px rgba(20,48,107,.10);color:var(--tm-tinta,#0f2140);animation:eiUp .5s both}' +
  '.noche .cl,.cl.noche{background:var(--tm-noche-a,#0c2146);border-color:rgba(255,255,255,.14);box-shadow:none;color:var(--tm-noche-tx,#dbe8fb)}' +
  '.cl h2{margin:0 0 6px;font-size:20px;font-weight:800;text-align:center;color:var(--tm-navy2,#14306b)}.noche .cl h2{color:#fff}' +
  '.cl .sb{margin:0 0 10px;text-align:center;font-size:13.5px;color:var(--tm-gris,#667489)}.noche .cl .sb{color:#b8cbe6}' +
  '.cl label{display:block;margin:10px 0 4px;font-size:12.5px;font-weight:700;color:var(--tm-gris,#667489)}.noche .cl label{color:#b8cbe6}' +
  '.cl input{box-sizing:border-box;width:100%;border:1px solid var(--tm-linea,#e1e6ee);background:var(--tm-tarjeta,#fff);color:var(--tm-tinta,#0f2140);border-radius:12px;padding:12px 14px;font:500 15px Archivo,system-ui,sans-serif}' +
  '.noche .cl input{border-color:rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff}.cl input:focus{outline:2px solid var(--tm-info,#3b6fd4);outline-offset:1px}.noche .cl input:focus{outline-color:var(--tm-raya,#88BE47)}' +
  '.cl input[readonly]{opacity:.75}.cl .pw{position:relative}.cl .pw input{padding-right:64px}.cl .ver{position:absolute;right:6px;top:50%;transform:translateY(-50%);border:0;background:none;color:inherit;font:700 13px Archivo,sans-serif;padding:8px 10px;cursor:pointer}' +
  '.cl .ay{margin:4px 0 0;font-size:12px;color:var(--tm-gris,#667489)}.noche .cl .ay{color:#b8cbe6}.cl .mj{min-height:18px;margin:10px 0 0;font-size:13px;font-weight:600;text-align:center;color:var(--tm-bad,#d64045)}.noche .cl .mj{color:#ff8a8f}.cl .mj.ok{color:var(--tm-ok,#2f9e44)}.noche .cl .mj.ok{color:#8fd46a}' +
  '.cl .go{display:block;width:100%;margin-top:8px;border:0;cursor:pointer;color:#fff;background:var(--tm-navy2,#14306b);border-radius:999px;padding:13px;font:800 15px Archivo,system-ui,sans-serif}.noche .cl .go{border:1px solid var(--tm-raya,#88BE47)}.cl .go:disabled{opacity:.5;cursor:default}' +
  '.cl .ol{display:block;margin-top:12px;text-align:center;font-size:13px;font-weight:700;color:var(--tm-info,#3b6fd4);background:none;border:0;cursor:pointer;width:100%;font-family:inherit}.noche .cl .ol{color:#8fb6ff}' +
  '#ec{position:fixed;inset:0;z-index:2147483002;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:auto;padding:16px;box-sizing:border-box;font-family:Archivo,system-ui,-apple-system,"Segoe UI",sans-serif;transition:opacity .4s;' +
    'background:radial-gradient(ellipse at 15% 0%,var(--tm-cielo,#e3f1ff) 0,rgba(227,241,255,0) 55%),radial-gradient(ellipse at 90% 100%,var(--tm-menta,#dcf3e2) 0,rgba(220,243,226,0) 55%),var(--tm-papel,#f7fafc)}' +
  '#ec.noche{background:linear-gradient(180deg,var(--tm-noche-a,#0c2146) 0%,var(--tm-noche-b,#08172f) 100%)}#ec .em{width:96px;height:96px;margin-bottom:6px}' +
  '@media (prefers-reduced-motion:reduce){.cl{animation:none}}';

  function esLlave(p) { return /^s1\./.test(String(p || '')); }
  function llaveUsuario(p) { return esLlave(p) ? String(p).split('.')[1] || '' : ''; }
  function llaveEmitida(p) { return esLlave(p) ? parseInt(String(p).split('.')[2], 36) || 0 : 0; }
  function llamarSrv(fn, args, ok, mal) {
    if (!window.google || !google.script || !google.script.run) { mal(); return; }
    var g = google.script.run.withSuccessHandler(ok).withFailureHandler(mal);
    try { g[fn].apply(g, args); } catch (e) { mal(); }
  }
  var SIN_RED = 'Sin conexión. Intenta con señal.';
  /* tarjeta: cfg = { titulo, sub, campos:[{id,label,tipo,valor,ph,ac,ver,solo,ayuda}], boton, enviar(vals, tar), enlaces:[{t,fn}] } */
  function tarjeta(cfg) {
    var f = document.createElement('form'); f.className = 'cl' + (cfg.noche ? ' noche' : ''); f.setAttribute('novalidate', ''); f.setAttribute('autocomplete', 'on');
    var h = '<h2>' + esc(cfg.titulo) + '</h2>' + (cfg.sub ? '<p class="sb">' + esc(cfg.sub) + '</p>' : '');
    (cfg.campos || []).forEach(function (c) {
      h += '<label for="cl-' + c.id + '">' + esc(c.label) + '</label>' + (c.ver ? '<div class="pw">' : '') +
        '<input id="cl-' + c.id + '" type="' + (c.tipo || 'text') + '"' + (c.valor ? ' value="' + esc(c.valor) + '"' : '') + (c.solo ? ' readonly' : '') + ' placeholder="' + esc(c.ph || '') + '" autocomplete="' + (c.ac || 'off') + '" autocapitalize="off" spellcheck="false">' +
        (c.ver ? '<button type="button" class="ver" aria-label="Mostrar u ocultar">Ver</button></div>' : '') + (c.ayuda ? '<p class="ay">' + esc(c.ayuda) + '</p>' : '');
    });
    h += '<p class="mj" role="alert" aria-live="polite"></p>' + (cfg.boton ? '<button class="go" type="submit">' + esc(cfg.boton) + '</button>' : '');
    (cfg.enlaces || []).forEach(function (l, i) { h += '<button type="button" class="ol" data-i="' + i + '">' + esc(l.t) + '</button>'; });
    f.innerHTML = h;
    var t = { el: f, ocupado: false,
      msg: function (m, ok) { var e = f.querySelector('.mj'); e.textContent = m || ''; e.className = 'mj' + (ok ? ' ok' : ''); },
      val: function (id) { var e = f.querySelector('#cl-' + id); return e ? e.value : ''; },
      foco: function (id) { var e = f.querySelector('#cl-' + id); if (e) try { e.focus(); } catch (x) {} },
      lock: function (b) { t.ocupado = !!b; var g = f.querySelector('.go'); if (g) g.disabled = !!b; },
      espera: function (min) { t.lock(true); var hasta = Date.now() + min * 60000, k = setInterval(function () { var r = Math.ceil((hasta - Date.now()) / 60000); if (r <= 0 || !f.isConnected) { clearInterval(k); if (f.isConnected) { t.lock(false); t.msg(''); } } else t.msg('Demasiados intentos. Espere ' + r + ' min.'); }, 1000); t.msg('Demasiados intentos. Espere ' + min + ' min.'); } };
    Array.prototype.forEach.call(f.querySelectorAll('.ver'), function (b) { b.addEventListener('click', function () { var i = b.parentNode.querySelector('input'); i.type = i.type === 'password' ? 'text' : 'password'; b.textContent = i.type === 'password' ? 'Ver' : 'Ocultar'; }); });
    Array.prototype.forEach.call(f.querySelectorAll('.ol'), function (b) { b.addEventListener('click', function () { cfg.enlaces[+b.getAttribute('data-i')].fn(t); }); });
    f.addEventListener('submit', function (e) { e.preventDefault(); if (t.ocupado) return; t.msg(''); cfg.enviar(t); });
    return t;
  }
  /* dónde se pone: dentro de la intro (debajo del logo) o en una capa propia con el logo */
  function ponerTarjeta(t, anterior) {
    var d = E && E.d, noche = piel() === 'noche';
    if (anterior && anterior.el.parentNode) anterior.el.parentNode.removeChild(anterior.el);
    var host = E && E.clHost;
    if (host && host.isConnected) { host.appendChild(t.el); }
    else {
      var z = document.createElement('div'); z.id = 'ec'; if (noche) z.className = 'noche'; t.el.classList.toggle('noche', noche);
      z.innerHTML = '<div class="em"></div>'; document.body.appendChild(z); z.appendChild(t.el); if (E) E.clHost = z;
      cargarLogo(function () { var em = z.querySelector('.em'); if (em && window.ECOCARGA && ECOCARGA.logo) em.innerHTML = ECOCARGA.logo(96, {}); });
    }
    t.foco(t.el.querySelector('input:not([readonly])') ? t.el.querySelector('input:not([readonly])').id.replace('cl-', '') : '');
  }
  function quitarCapa() { var z = document.getElementById('ec'); if (z && z.parentNode) z.parentNode.removeChild(z); if (E) E.clHost = null; }
  function errPorDefecto(r) { return (r && r.error) || 'No se pudo. Intenta otra vez.'; }

  /* ── la tarjeta «Iniciar sesión» ── */
  function tarjetaLogin(prev, usuario, opt) {
    opt = opt || {};
    var t = tarjeta({ titulo: 'Iniciar sesión', sub: opt.sub || '', noche: piel() === 'noche',
      campos: [{ id: 'u', label: 'Usuario', valor: usuario || '', ph: 'Escriba su usuario', ac: 'username' }, { id: 'c', label: 'Contraseña', tipo: 'password', ph: 'Escriba su contraseña', ac: 'current-password', ver: true }],
      boton: 'Entrar',
      enlaces: [].concat(opt.sinPin ? [] : [{ t: 'Entrar con mi PIN', fn: function () { if (opt.alPin) opt.alPin(); } }], [{ t: '¿Olvidó su contraseña?', fn: function () { tarjetaOlvide(t, t.val('u'), opt); } }]),
      enviar: function (t) {
        var u = t.val('u').trim(), c = t.val('c'); if (!u || !c) { t.msg('Escriba su usuario y su contraseña.'); return; }
        t.lock(true); t.msg('Verificando…', true);
        llamarSrv('api_loginClave', [u, c], function (r) {
          if (!E && !opt.sinE) return;
          if (r && r.ok && r.llave) { t.msg(''); opt.alLlave(r.llave, r, t); return; }
          t.lock(false);
          if (r && r.crearClave) { tarjetaTemporal(t, r.usuario || u, r.nombre || '', opt); return; }
          try { fallo(r); } catch (x) {}
          if (r && r.bloqueo && r.bloqueo.tipo === 'espera' && r.bloqueo.min) { t.espera(r.bloqueo.min); return; }
          t.msg(errPorDefecto(r)); var pc = t.el.querySelector('#cl-c'); if (pc) pc.value = ''; t.foco('c');
        }, function () { t.lock(false); t.msg(SIN_RED); });
      } });
    ponerTarjeta(t, prev); return t;
  }
  function tarjetaOlvide(prev, usuario, opt) {
    var t = tarjeta({ titulo: '¿Olvidó su contraseña?', sub: 'Pídale al administrador una contraseña temporal' + (usuario ? '. Dígale su usuario: ' + usuario + '.' : '. Dígale su usuario.'), noche: piel() === 'noche', campos: [], boton: '',
      enlaces: [{ t: 'Volver', fn: function () { tarjetaLogin(t, usuario, opt); } }], enviar: function () {} });
    ponerTarjeta(t, prev);
  }
  /* contraseña temporal: la persona crea la suya */
  function tarjetaTemporal(prev, usuario, nombre, opt) {
    var t = tarjeta({ titulo: 'Contraseña temporal', sub: 'Escriba la contraseña temporal y cree la suya.', noche: piel() === 'noche',
      campos: [{ id: 'u', label: 'Usuario', valor: usuario, solo: true, ac: 'username' }, { id: 't', label: 'Contraseña temporal', tipo: 'password', ph: 'La que le dio el administrador', ac: 'off', ver: true },
        { id: 'n', label: 'Contraseña nueva', tipo: 'password', ph: 'Cree su contraseña', ac: 'new-password', ver: true, ayuda: 'Mínimo 6 caracteres. Evite su nombre o números seguidos como 123456.' }, { id: 'r', label: 'Repítala', tipo: 'password', ph: 'Repita su contraseña', ac: 'new-password', ver: true }],
      boton: 'Guardar y entrar', enlaces: [{ t: 'Volver', fn: function () { tarjetaLogin(t, usuario, opt); } }],
      enviar: function (t) {
        var tmp = t.val('t'), n = t.val('n'), r2 = t.val('r');
        if (!tmp) { t.msg('Escriba la contraseña temporal.'); return; } if (n.length < 6) { t.msg('La contraseña debe tener al menos 6 caracteres.'); return; } if (n !== r2) { t.msg('Las dos contraseñas no son iguales.'); return; }
        t.lock(true); t.msg('Guardando…', true);
        llamarSrv('api_crearMiClave', [usuario, tmp, n], function (r) {
          if (r && r.ok && r.llave) { t.msg(''); opt.alLlave(r.llave, r, t); return; }
          t.lock(false); if (r && r.bloqueo && r.bloqueo.tipo === 'espera' && r.bloqueo.min) { t.espera(r.bloqueo.min); return; }
          t.msg(errPorDefecto(r)); if (r && r.claveVencida) return; t.foco(r && r.facil ? 'n' : 't');
        }, function () { t.lock(false); t.msg(SIN_RED); });
      } });
    ponerTarjeta(t, prev); return t;
  }
  /* primera vez con el PIN viejo: crear usuario y contraseña (se puede dejar para después mientras el PIN siga sirviendo) */
  function tarjetaCrear(m, pin, alLlave, despues) {
    var pasada = m.pinHasta && /^\d{4}-\d{2}-\d{2}$/.test(m.pinHasta) && new Date().toISOString().slice(0, 10) > m.pinHasta, min = m.claveMin || 6;
    var t = tarjeta({ titulo: 'Cree su usuario y contraseña', sub: 'Es su primer ingreso con el sistema nuevo.', noche: piel() === 'noche',
      campos: [{ id: 'u', label: 'Usuario', valor: m.usuario || '', ph: 'Su usuario', ac: 'username', ayuda: 'Sugerido para usted. Puede cambiarlo.' },
        { id: 'n', label: 'Contraseña nueva', tipo: 'password', ph: 'Cree su contraseña', ac: 'new-password', ver: true }, { id: 'r', label: 'Repítala', tipo: 'password', ph: 'Repita su contraseña', ac: 'new-password', ver: true, ayuda: 'Mínimo ' + min + ' caracteres. Evite su nombre o números seguidos como 123456.' }],
      boton: 'Guardar y entrar', enlaces: pasada ? [] : [{ t: 'Más tarde', fn: function () { despues(); } }],
      enviar: function (t) {
        var u = t.val('u').trim().toLowerCase(), n = t.val('n'), r2 = t.val('r');
        if (!/^[a-z0-9]{3,30}$/.test(u)) { t.msg('El usuario debe tener entre 3 y 30 letras o números, sin espacios ni tildes.'); return; }
        if (n.length < min) { t.msg('La contraseña debe tener al menos ' + min + ' caracteres.'); return; } if (n !== r2) { t.msg('Las dos contraseñas no son iguales.'); return; }
        t.lock(true); t.msg('Guardando…', true);
        llamarSrv('api_crearMiClavePin', [pin, { usuario: u, clave: n }], function (r) {
          if (r && r.ok && r.llave) { t.msg(''); alLlave(r.llave, r, t); return; }
          t.lock(false); t.msg(errPorDefecto(r)); t.foco(r && r.facil ? 'n' : 'u');
        }, function () { t.lock(false); t.msg(SIN_RED); });
      } });
    ponerTarjeta(t, null); return t;
  }
  /* lo que viene de tarjetaLogin cuando acierta: la llave pasa por el mismo camino que un PIN (validar → exito → alEntrar) */
  function entrarConLlave(llave) {
    if (!E) return; var d = E.d; E.ocupado = true;
    var validar = E.op.validar || function (p, fin) { fin({ ok: false, error: 'Sin validación' }); };
    validar(llave, function (r) {
      if (!E) return; E.ocupado = false;
      if (r && r.ok) { acierto(); quitarCapa(); exito(r); }
      else { var c = document.querySelector('#ec .cl .mj,#ei .cl .mj'); if (c) c.textContent = errPorDefecto(r); try { fallo(r); } catch (x) {} }
    });
  }
  /* la entrada del lobby: «Entrar al sistema» abre la tarjeta; «Entrar con mi PIN» abre el teclado de siempre */
  function entradaClave(z, seguir) {
    var im = z.querySelector('.im'), bt = z.querySelector('.ei-bt'); E.clHost = im;
    bt.addEventListener('click', function () {
      bt.style.animation = 'none'; bt.style.transition = 'opacity .25s'; bt.style.opacity = 0;
      setTimeout(function () { bt.style.display = 'none'; var em = im.querySelector('.em'); if (em) em.style.marginBottom = '24px'; tarjetaLogin(null, '', { sinE: false, alPin: function () { E.clHost = null; var c = im.querySelector('.cl'); if (c) c.parentNode.removeChild(c); seguir(); }, alLlave: function (ll) { entrarConLlave(ll); } }); }, 260);
    });
  }
  /* tras entrar con el PIN: ¿ya tiene usuario y contraseña? si no, se ofrece crearlos */
  function envolverValidar(op) {
    if (!op.intro || op.validarPin) return; op.validarPin = op.validar;
    op.validar = function (p, fin, o) {
      if (esLlave(p)) { op.validarPin(p, fin, o); return; }
      op.validarPin(p, function (r) {
        if (!r || !r.ok || !E) { fin(r); return; }
        llamarSrv('api_miAcceso', [p], function (m) {
          if (!m || !m.ok || m.tieneClave || !E) { fin(r); return; }
          tarjetaCrear(m, p, function (llave) { quitarCapa(); op.validarPin(llave, function (r2) { fin(r2 && r2.ok ? r2 : r); }, o); }, function () { quitarCapa(); fin(r); });
        }, function () { fin(r); });
      }, o);
    };
  }
  /* bloqueo con contraseña: pide solo la contraseña de quien estaba; «No soy …» abre el inicio de sesión completo */
  function bloqueoClave(nombre, usuario, alLlave) {
    var primero = (String(nombre || '').trim().split(' ')[0]) || usuario;
    var t = tarjeta({ titulo: 'Hola de nuevo, ' + primero, sub: 'Escriba su contraseña para seguir.', noche: piel() === 'noche',
      campos: [{ id: 'c', label: 'Contraseña', tipo: 'password', ph: 'Escriba su contraseña', ac: 'current-password', ver: true }], boton: 'Entrar',
      enlaces: [{ t: 'No soy ' + primero, fn: function () { tarjetaLogin(t, '', { sinPin: true, alLlave: alLlave }); } }, { t: '¿Olvidó su contraseña?', fn: function () { tarjetaOlvide(t, usuario, { sinPin: true, alLlave: alLlave }); } }],
      enviar: function (t) {
        var c = t.val('c'); if (!c) { t.msg('Escriba su contraseña.'); return; } t.lock(true); t.msg('Verificando…', true);
        llamarSrv('api_loginClave', [usuario, c], function (r) {
          if (r && r.ok && r.llave) { t.msg(''); alLlave(r.llave, r, t); return; }
          t.lock(false); if (r && r.crearClave) { tarjetaTemporal(t, r.usuario || usuario, r.nombre || '', { sinPin: true, alLlave: alLlave }); return; }
          try { fallo(r); } catch (x) {} if (r && r.bloqueo && r.bloqueo.tipo === 'espera' && r.bloqueo.min) { t.espera(r.bloqueo.min); return; }
          t.msg(errPorDefecto(r)); var pc = t.el.querySelector('#cl-c'); if (pc) pc.value = ''; t.foco('c');
        }, function () { t.lock(false); t.msg(SIN_RED); });
      } });
    ponerTarjeta(t, null); return t;
  }
  /* la llave dura 12 h: se renueva a las 6 h (hasta 7 días desde la contraseña); si ya no se puede, se pide la contraseña */
  var RENOVANDO = false;
  function renovarLlave(siFalla) {
    if (RENOVANDO || !esLlave(V.pin) || Date.now() - llaveEmitida(V.pin) < 6 * 3600000) return; RENOVANDO = true;
    llamarSrv('api_renovarLlave', [V.pin], function (r) {
      RENOVANDO = false;
      if (r && r.ok && r.llave) { V.pin = r.llave; lsSet(K_PIN, JSON.stringify(r.llave)); try { sessionStorage.removeItem(K_ROL); } catch (e) {} try { window.dispatchEvent(new CustomEvent('eco-llave', { detail: r.llave })); } catch (e) {} }
      else if (r && r.requiereLogin && siFalla) siFalla();
    }, function () { RENOVANDO = false; });
  }

  function bloquear(desdeOtra, motivo) {
    if (V.bloqueado) return;
    V.bloqueado = true;
    if (esLlave(V.pin)) { V.usuarioClave = llaveUsuario(V.pin); lsSet('eco_bloq_usr', V.usuarioClave); } else V.usuarioClave = lsGet('eco_bloq_usr') || '';   /* api 3.92 */
    lsSet(K_BLOQ, '1'); lsDel(K_PIN);                   /* sin PIN guardado: nadie entra sin escribirlo */
    /* api 3.7: se recuerda de quién era, para que una recarga no lo olvide */
    if (V.nombre) lsSet(K_BNOM, V.nombre); else V.nombre = lsGet(K_BNOM) || '';
    montar({ bloqueo: true, motivo: motivo, nombre: V.nombre, clave: V.usuarioClave,
      validar: function (p, fin) {
        var sinRed = !window.google || !google.script || !google.script.run;
        /* sin señal, el mismo PIN abre (como antes); con señal se pregunta al
           servidor, así un usuario dado de baja ya no desbloquea */
        if (V.pin && p === V.pin && sinRed) { fin({ ok: true, mismo: true, nombre: V.nombre, pausa: 1100 }); return; }
        if (sinRed) { fin({ ok: false, error: 'Sin conexión. Intenta con señal.' }); return; }
        google.script.run.withSuccessHandler(function (r) {
          if (!r || !r.ok) { fin({ ok: false, error: (r && r.error) || 'PIN no válido', crearPin: r && r.crearPin, nombre: r && r.nombre, bloqueo: r && r.bloqueo }); return; }
          if (esLlave(p) && V.nombre && String(r.usuario.nombre || '').trim() === String(V.nombre).trim()) { V.pin = p; fin({ ok: true, mismo: true, nombre: V.nombre, pausa: 1100 }); return; }   /* api 3.92: la misma persona, con su contraseña */
          if (V.pin && p === V.pin) { fin({ ok: true, mismo: true, nombre: V.nombre, pausa: 1100 }); return; }
          /* api 3.7: tras una recarga no hay PIN en memoria; si es la misma persona, sigue en esta misma página */
          if (!V.pin && V.nombre && String(r.usuario.nombre || '').trim() === String(V.nombre).trim()) {
            fin({ ok: true, mismo: true, recargar: true, otro: p, nombre: V.nombre, pausa: 900 }); return; }
          fin({ ok: true, mismo: false, nombre: r.usuario.nombre, otro: p, rol: r.usuario.rol, texto: 'Abriendo tus módulos…' });
        }).withFailureHandler(function () {
          if (V.pin && p === V.pin) { fin({ ok: true, mismo: true, nombre: V.nombre, pausa: 1100 }); return; }
          fin({ ok: false, error: 'Sin conexión. Intenta con señal.' });
        }).api_login(p);
      },
      alEntrar: function (r) {
        lsDel(K_BNOM); lsDel('eco_bloq_usr');
        if (r.recargar) { lsSet(K_PIN, JSON.stringify(r.otro)); lsDel(K_BLOQ); lsSet(K_ACT, String(Date.now())); try { sessionStorage.removeItem(K_ROL); } catch (e) {} location.reload(); return; }
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

  window.EntradaECOVSA = { montar: montar, quitar: desmontar, conHuella: conHuellaPin, huellaMal: huellaMal, abrirPin: function () { abrir(); }, vigiar: vigiar, detener: function () { V.activo = false; quitarAviso(); },
                           reanudar: function () { V.pin = pinGuardado(); if (V.iniciado) { V.activo = true; V.ultLocal = Date.now(); } else vigiar(); }, bloquear: function () { quitarAviso(); bloquear(); },
                           aviso: mostrarAviso, base: BASE };
  /* puente.js la carga con data-vigia: arranca el vigía sola */
  var yo = document.currentScript;
  if (yo && yo.hasAttribute('data-vigia')) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { vigiar(); });
    else vigiar();
  }
})();
