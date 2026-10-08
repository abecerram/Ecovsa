/* ═══════════════════════════════════════════════════════════════════
   LogSolidos.js · api 3.26 · DESECHOS SÓLIDOS DENTRO DE LOGÍSTICA
   - api 3.26 (prueba del 8 oct): salida automática, el punto en 4 pasos con fotos de antes y después, descarga
     en planta sin peso con cambio de destino, y la ruta en vivo en el Inicio de la oficina.
   Se carga al final de Index.html. No cambia nada de peligrosos:
   - Supervisión: pestaña «Peligrosos | Sólidos» en la barra de arriba. En
     Sólidos el menú lateral y las pantallas son las de sólidos, con las
     mismas piezas de diseño (pl-*, ini-*, cr-*, fl-*).
   - Conductor: si tiene una hoja de ruta de sólidos, le sale arriba su
     tarjeta y el recorrido: revisión → firma → paradas → relleno → cierre.
   - api 3.18: el conductor de sólidos tiene su propio inicio (seis accesos:
     mapa, relleno y tickets, revisión, jornada, rutas hechas, próximas) y ya
     no ve los accesos de peligrosos. En celular, la pestaña «Peligrosos |
     Sólidos» de Logística va en su propia franja debajo de la barra.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.DSO) return;
  var CSS = `
  .rb-tabs{display:inline-flex;gap:3px;background:rgba(255,255,255,.12);border-radius:10px;padding:3px;margin-left:14px;vertical-align:middle}
  .rb-tabs button{display:inline-flex;align-items:center;gap:6px;border:0;background:none;color:#cfdcf0;font:800 12.5px Archivo,sans-serif;border-radius:8px;padding:6px 12px;cursor:pointer;letter-spacing:.2px}
  .rb-tabs button .mki{width:15px;height:15px}
  .rb-tabs button.on{background:#fff;color:#0f2a57;box-shadow:0 1px 3px rgba(0,0,0,.25)}
  .rb-tabs button.on.s{background:#8fd46a;color:#0f2a57}
  body.rb-sol header .barra-top{box-shadow:inset 0 -3px 0 #8fd46a}
  @media (max-width:640px){.rb-tabs{margin-left:6px}.rb-tabs button{padding:5px 8px;font-size:11.5px}.rb-tabs button .mki{display:none}}
  /* api 3.18 · en celular la pestaña va en su propia franja, debajo de la barra */
  .rb-tira{display:flex;background:#0f2a57;padding:6px 12px 9px;position:relative;z-index:19}
  .rb-tira .rb-tabs{margin:0;display:flex;width:100%;background:rgba(255,255,255,.10)}
  .rb-tira .rb-tabs button{flex:1;justify-content:center;padding:9px 6px;font-size:13.5px}
  .rb-tira .rb-tabs button .mki{display:inline-block;width:15px;height:15px}
  body.rb-sol .rb-tira{box-shadow:inset 0 -3px 0 #8fd46a}
  /* api 3.18 · inicio propio del conductor de sólidos */
  body.cond-sol #pantalla-hub > .grid-mosaicos:not(.dso-mos) > .mosaico-item{display:none!important}
  .dso-mos{margin-top:10px}
  .dso-mos .mosaico-item{position:relative}
  .dso-mos .mosaico-icono svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
  .dso-tg{display:inline-block;margin-top:6px;font-size:10.5px;font-weight:900;border-radius:6px;padding:2px 7px;background:#eaf6e4;color:#2f6b0a;align-self:flex-start}
  .dso-tg.w{background:#FFF4D6;color:#8a6300}
  .dso-libre{display:block;grid-column:1/-1;background:#fff;border:1px solid #dfe5ee;border-radius:20px;padding:16px;box-shadow:0 2px 10px rgba(20,48,107,.05)}
  .dso-libre .k{font-size:10.5px;letter-spacing:1.3px;font-weight:900;color:#5c6a80;text-transform:uppercase}
  .dso-libre h3{margin:4px 0 6px;font-size:18px;color:#0f2a57}
  .dso-libre p{margin:0;font-size:13px;color:#5c6a80;line-height:1.45}
  .dsv .fi{display:flex;align-items:center;gap:8px;padding:9px 0;border-top:1px solid #eef1f5;font-size:13px;font-weight:700;color:#0f2140}
  .dsv .fi:first-of-type{border-top:0}.dsv .fi>span{flex:1;min-width:0}.dsv .fi>span.est,.dsv .fi>span.n{flex:none}.dsv .fi small{display:block;font-size:11px;color:#7a879a;font-weight:600}
  .dsv .fi b{font-weight:900;color:#0f2a57;white-space:nowrap}.dsv .fi .n{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:900;background:#eef1f5;color:#0f2a57;flex:none}
  .dsv .est{font-size:10.5px;font-weight:900;border-radius:6px;padding:2px 7px;white-space:nowrap}
  .dsv .est.h{background:#eaf6e4;color:#2f6b0a}.dsv .est.p{background:#eef1f5;color:#5c6a80}.dsv .est.s{background:#fdecea;color:#b42318}.dsv .est.a{background:#FFF4D6;color:#8a6300}.dsv .est.b{background:#e8effb;color:#14306b}
  .dsv .hint{margin:4px 0 12px;font-size:12px;color:#5c6a80;line-height:1.45;border-left:3px solid #0f2a57;padding:2px 0 2px 9px}
  .dsv .vac{padding:14px 4px;color:#5c6a80;font-size:13px}
  .dsv-mapa{height:240px;border-radius:12px;overflow:hidden;margin-bottom:10px;background:#dfe9f3}
  .dsv-pin{width:24px;height:24px;border-radius:50%;border:2px solid #0f2a57;display:grid;place-items:center;font:900 11px Archivo,sans-serif;background:#fff;color:#0f2a57;box-shadow:0 2px 4px rgba(0,0,0,.25)}
  .dsv-pin.h{background:#2f9e44;color:#fff}.dsv-pin.s{background:#c0392b;color:#fff}.dsv-pin.a{background:#F5B301;color:#0f2140}
  .sv-chip{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:800;border-radius:6px;padding:2px 7px;background:#E8F0FA;color:#1b4a86;font-style:normal;letter-spacing:.2px;white-space:nowrap}
  .sv-chip.ro{background:#FFF1D6;color:#8A6300}.sv-chip.rj{background:#F1EBFC;color:#6D3FC4}.sv-chip.v{background:#E7F3DD;color:#2F6B0A}.sv-chip.r{background:#FDECEA;color:#B42318}.sv-chip.g{background:#eef1f5;color:#5b6a80}
  .sv-eq{display:flex;gap:6px;flex-wrap:wrap;align-items:center;min-height:38px}
  .sv-eq span{font-size:12.5px;font-weight:700;background:#F2F5F9;border:1px solid var(--ini-linea,#e1e6ee);border-radius:8px;padding:5px 9px;cursor:pointer}
  .sv-eq span.on{background:#14306b;border-color:#14306b;color:#fff}.sv-eq span.on small{color:#cfdcf0}
  .sv-eq span small{display:block;font-size:10px;color:#667489;font-weight:700}
  .pl-st.rell{background:#FFF8E6;border-color:#F3DC9C}
  .pl-st.rell .n{background:#F5B301;color:#3d2a00}
  .pl-st .mv{display:flex;gap:2px}.pl-st .mv button{border:0;background:#eef1f5;border-radius:6px;width:24px;height:24px;cursor:pointer;font-weight:900;color:#14306b}
  .pl-st .mv button.x{color:#B42318}
  .sv-tb{width:100%;border-collapse:collapse;font-size:13px}
  .sv-tb th{text-align:left;font-size:10.5px;letter-spacing:.8px;color:#7a879b;font-weight:800;padding:9px 10px;border-bottom:1px solid #e1e6ee;text-transform:uppercase;background:#fafbfd;white-space:nowrap}
  .sv-tb td{padding:9px 10px;border-bottom:1px solid #eef1f5;vertical-align:middle}
  .sv-tb td.n,.sv-tb th.n{text-align:right;font-variant-numeric:tabular-nums}
  .sv-tb small{display:block;color:#667489;font-size:11.5px}
  .sv-tb tr.tot td{font-weight:900;background:#f6f8fb}
  .sv-tb tr.clic{cursor:pointer}.sv-tb tr.clic:hover td{background:#f6f9fd}.sv-tb tr.sel td{background:#eef3fb}
  .sv-scroll{overflow-x:auto}
  .sv-bar{height:9px;border-radius:5px;background:#eef1f5;overflow:hidden;min-width:60px}.sv-bar i{display:block;height:100%;background:#14306b;border-radius:5px}
  .sv-g2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px;align-items:start}
  .sv-g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;align-items:start}
  .sv-g21{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:14px;align-items:start}
  @media (max-width:900px){.sv-g2,.sv-g3,.sv-g21{grid-template-columns:minmax(0,1fr)}}
  .sv-pad{padding:14px 16px}
  .sv-tl{position:relative;padding-left:26px;margin-top:4px}
  .sv-tl:before{content:"";position:absolute;left:9px;top:6px;bottom:6px;width:2px;background:#e1e6ee}
  .sv-tl .p{position:relative;padding:7px 0 9px}
  .sv-tl .p:before{content:"";position:absolute;left:-22px;top:9px;width:12px;height:12px;border-radius:50%;background:#fff;border:2px solid #c3cddb}
  .sv-tl .p.ok:before{background:#2f9e44;border-color:#2f9e44}
  .sv-tl .p.on:before{background:#14306b;border-color:#14306b;box-shadow:0 0 0 4px #dbe5f6}
  .sv-tl .p.mal:before{background:#d64045;border-color:#d64045}
  .sv-tl .p b{font-size:13.5px;display:block}.sv-tl .p span{font-size:12px;color:#667489}
  .sv-tl .p.no b{color:#8a96a8}
  .sv-firma{border:1.5px dashed #c4d2e6;border-radius:12px;height:130px;position:relative;background:#fbfcfe;margin-top:8px;touch-action:none}
  .sv-firma canvas{position:absolute;inset:0;width:100%;height:100%}
  .sv-firma img{position:absolute;inset:6px;max-width:calc(100% - 12px);max-height:calc(100% - 30px);object-fit:contain}
  .sv-firma small{position:absolute;left:12px;bottom:8px;font-size:11px;color:#8a96a8;pointer-events:none}
  .sv-ck{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid #eef1f5;font-size:13px}
  .sv-ck:last-child{border-bottom:0}
  .sv-ok{color:#2f9e44;font-weight:900}.sv-no{color:#B42318;font-weight:900}
  .sv-list .it{display:flex;gap:10px;align-items:flex-start;padding:11px 8px;border-bottom:1px solid #eef1f5;border-radius:10px;cursor:pointer}
  .sv-list .it:last-child{border-bottom:0}.sv-list .it.sel{background:#eef3fb}
  .sv-list .it .tx{flex:1;min-width:0}.sv-list .it b{font-size:13.5px}.sv-list .it small{display:block;color:#667489;font-size:12px;margin-top:2px}
  .sv-h{font-size:11px;letter-spacing:1px;color:#5b6a80;font-weight:900;text-transform:uppercase;margin:16px 0 8px}
  .sv-nota{border-left:3px solid #14306b;background:#f6f8fb;border-radius:0 10px 10px 0;padding:9px 12px;font-size:12.5px;color:#3d4a60;margin-top:12px}
  .sv-nota.am{border-left-color:#F5B301;background:#FFF8E6;color:#4d3a00}
  .sv-vacio{padding:26px 16px;text-align:center;color:#667489;font-size:13.5px}
  .sv-vacio b{display:block;color:#0f2140;font-size:15px;margin-bottom:4px}
  .sv-btns{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;margin-top:12px}
  .sv-mapa{height:520px;border-radius:14px;overflow:hidden;border:1px solid #e1e6ee}
  .sv-ley{display:flex;gap:10px;flex-wrap:wrap;font-size:12px;color:#3d4a60;margin:8px 0}
  .sv-ley i{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:5px;vertical-align:-1px}
  .sv-num{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;color:#fff;font:900 11px Archivo,sans-serif;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)}
  .sv-cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}
  .sv-cal .h{font-size:10.5px;font-weight:900;letter-spacing:1px;color:#7a879b;text-transform:uppercase;text-align:center;padding:4px 0}
  .sv-cal .d{background:#fff;border:1px solid #e1e6ee;border-radius:10px;min-height:96px;padding:7px;cursor:pointer;display:flex;flex-direction:column;gap:4px}
  .sv-cal .d.hoy{border-color:#14306b;box-shadow:0 0 0 2px #dbe5f6}.sv-cal .d b.n{font-size:12px;color:#0f2140}
  .sv-cal .d span{font-size:11px;border-radius:6px;padding:2px 6px;background:#E8F0FA;color:#1b4a86;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .sv-cal .d span.f{background:#fff;border:1px dashed #c4d2e6;color:#5b6a80}.sv-cal .d span.v{background:#E7F3DD;color:#2F6B0A}.sv-cal .d span.b{background:#eef1f5;color:#5b6a80}
  @media (max-width:700px){.sv-cal{grid-template-columns:repeat(2,minmax(0,1fr))}.sv-cal .h{display:none}}
  .dso-fondo{position:fixed;inset:0;background:rgba(15,33,64,.45);z-index:9000;display:flex;align-items:flex-start;justify-content:center;padding:40px 16px;overflow:auto}
  .dso-modal{background:#fff;border-radius:16px;width:100%;max-width:620px;box-shadow:0 20px 60px rgba(0,0,0,.3);font-family:Archivo,system-ui,sans-serif;color:#0f2140}
  .dso-modal .mh{display:flex;align-items:center;gap:10px;padding:16px 18px;border-bottom:1px solid #eef1f5}.dso-modal .mh h3{margin:0;font-size:16px;flex:1}
  .dso-modal .mh button{border:0;background:#eef1f5;border-radius:8px;width:30px;height:30px;cursor:pointer;font-weight:900}
  .dso-modal .mb{padding:14px 18px;max-height:70vh;overflow:auto}.dso-modal .mf{display:flex;gap:8px;justify-content:flex-end;padding:12px 18px;border-top:1px solid #eef1f5;flex-wrap:wrap}
  .dso-f{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  .dso-f label{display:flex;flex-direction:column;gap:4px;font-size:11px;font-weight:800;color:#5b6a80;letter-spacing:.5px;text-transform:uppercase}
  .dso-f label.w{grid-column:1/-1}
  .dso-f input,.dso-f select,.dso-f textarea{font:600 14px Archivo,system-ui,sans-serif;color:#0f2140;border:1.5px solid #d3ddea;border-radius:9px;padding:8px 10px;background:#fff;text-transform:none;letter-spacing:0;min-width:0}
  .dso-f textarea{min-height:90px;resize:vertical}
  .dso-dias{display:flex;gap:4px;flex-wrap:wrap}.dso-dias button{border:1.5px solid #d3ddea;background:#fff;border-radius:8px;padding:6px 9px;font:800 12px Archivo,sans-serif;cursor:pointer;color:#0f2140}
  .dso-dias button.on{background:#14306b;border-color:#14306b;color:#fff}
  @media (max-width:560px){.dso-f{grid-template-columns:minmax(0,1fr)}}
  @media print{body.dso-imp>*:not(#dso-imp){display:none!important}#dso-imp{display:block!important}}
  #dso-imp{display:none;font:13px Archivo,system-ui,sans-serif;color:#000;padding:10px}
  /* conductor */
  .sc-cnt{display:grid;grid-template-columns:70px 1fr 70px;gap:10px;align-items:center;margin:4px 0 8px}
  .sc-cnt button{height:70px;border-radius:18px;border:0;font:900 34px Archivo,sans-serif;cursor:pointer}
  .sc-cnt .m{background:#E8EEF7;color:#14306b}.sc-cnt .p{background:#14306b;color:#fff}
  .sc-cnt .v{text-align:center}.sc-cnt .v b{display:block;font-size:52px;line-height:1;font-weight:900;color:#0f2140}
  .sc-cnt .v small{font-size:12px;font-weight:800;color:#5B6880;letter-spacing:1px}
  .sc-rap{display:flex;gap:6px;justify-content:center}
  .sc-rap button{border:1px solid #D3DDEA;background:#fff;border-radius:10px;padding:7px 13px;font:800 13px Archivo,sans-serif;color:#14306b}
  .sc-seg{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
  .sc-seg button{border:1.5px solid #D3DDEA;background:#fff;border-radius:11px;padding:10px 2px;font:800 12px Archivo,sans-serif;color:#141C2B}
  .sc-seg button.on{background:#14306b;border-color:#14306b;color:#fff}
  .sc-foto{display:flex;align-items:center;gap:10px;border:1.5px dashed #c4d2e6;border-radius:12px;padding:11px;font-size:13px;color:#5B6880;background:#fafcff;font-weight:700;cursor:pointer;width:100%;font-family:inherit;text-align:left}
  .sc-foto.si{border-style:solid;border-color:#bfe3b3;background:#eaf6e4;color:#1e5a2a}
  .sc-foto.sub{border-style:solid;border-color:#c4d2e6;background:#f2f6fb;color:#14306b}
  .sc-foto .mki{width:22px;height:22px}
  .sc-in{width:100%;box-sizing:border-box;border:1.5px solid #c4d2e6;border-radius:12px;padding:12px;font:800 20px Archivo,sans-serif;color:#141C2B;background:#fff}
  .sc-in.t{font-size:15px;font-weight:600}
  .sc-lbl{font-size:11px;font-weight:900;letter-spacing:1px;color:#5B6880;text-transform:uppercase;margin:2px 0 6px}
  .sc-row{display:grid;grid-template-columns:minmax(0,1fr) 110px;gap:8px;align-items:center;padding:9px 0;border-bottom:1px solid #eef1f5}
  .sc-row:last-child{border-bottom:0}
  .sc-row b{font-size:14px}.sc-row small{display:block;font-size:11.5px;color:#5B6880;font-weight:600}
  .sc-of{display:grid;grid-template-columns:1fr 1fr;gap:4px}
  .sc-of button{text-align:center;border-radius:9px;padding:9px 0;font:900 12px Archivo,sans-serif;border:1.5px solid #D3DDEA;color:#5B6880;background:#fff;cursor:pointer}
  .sc-of button.ok{background:#eaf6e4;border-color:#9fd3a8;color:#1e6b31}.sc-of button.no{background:#FDECEA;border-color:#f3b9b4;color:#B42318}
  .sc-pasos{display:flex;gap:4px;margin-top:12px}
  .sc-pasos span{flex:1;text-align:center;font-size:10px;font-weight:800;color:#a9bbd9;border-top:4px solid rgba(255,255,255,.18);padding-top:6px;line-height:1.2}
  .sc-pasos span.ok{color:#8fd46a;border-top-color:#8fd46a}.sc-pasos span.on{color:#fff;border-top-color:#fff}
  .sc-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;border:0;border-radius:14px;padding:15px;font:900 15px Archivo,sans-serif;background:#14306b;color:#fff;margin-top:10px;cursor:pointer}
  .sc-btn.sec{background:#fff;color:#14306b;border:1.5px solid #c4d2e6}.sc-btn.am{background:#F5B301;color:#3d2a00}.sc-btn.v{background:#2f9e44}
  .sc-btn[disabled]{opacity:.55}
  .sc-btn .mki{width:18px;height:18px}
  .sc-inc{display:grid;grid-template-columns:1fr 1fr;gap:6px}
  .sc-inc button{border:1.5px solid #D3DDEA;background:#fff;border-radius:10px;padding:10px 8px;font:800 12px Archivo,sans-serif;color:#141C2B;text-align:left}
  .sc-inc button.on{border-color:#d64045;background:#fdecea;color:#8c1d22}
  .sc-caja{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .sc-caja label{border:1.5px solid #D3DDEA;border-radius:12px;padding:10px;background:#fff;display:block}
  .sc-caja small{font-size:11.5px;color:#5B6880;font-weight:700;display:block;margin-bottom:4px}
  .sc-caja input{width:100%;box-sizing:border-box;border:0;font:900 20px Archivo,sans-serif;color:#0f2140;background:none;text-transform:uppercase}
  .sc-par{display:flex;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid #eef1f5;font-size:13.5px}
  .sc-par:last-child{border-bottom:0}.sc-par .n{width:26px;height:26px;border-radius:50%;background:#eef1f5;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;flex:none}
  .sc-par.ok .n{background:#2f9e44;color:#fff}.sc-par.mal .n{background:#d64045;color:#fff}.sc-par.on .n{background:#14306b;color:#fff}
  .sc-par .t{flex:1;min-width:0}.sc-par small{display:block;color:#5B6880;font-size:12px}
  #hub-solidos{cursor:pointer}
  /* 3.17.2 · turno, interruptor de sucursal, días a la vista, mapa en una sola pantalla */
  .sv-chip.t-dia{background:#FFF4D6;color:#7a5200}.sv-chip.t-noche{background:#E3E9F6;color:#14306b}
  .sv-tn{display:inline-flex;border:1.5px solid #d3ddea;border-radius:10px;overflow:hidden}
  .sv-tn button{border:0;background:#fff;padding:7px 12px;font:800 12.5px Archivo,sans-serif;color:#5b6a80;cursor:pointer}
  .sv-tn button.on{background:#14306b;color:#fff}.sv-tn button[disabled]{cursor:default;opacity:.7}
  .sv-hint{font-size:11.5px;font-weight:700;color:#8a6300;margin-top:4px;max-width:260px;line-height:1.35;text-transform:none;letter-spacing:0}
  .sv-hint.r{color:#b42318}
  .sv-est{display:flex;gap:12px;align-items:center;border-radius:12px;padding:12px 14px;margin-bottom:12px;border:1.5px solid #b8dca0;background:#f1f9eb}
  .sv-est.off{border-color:#d3ddea;background:#f4f6f9}
  .sv-est .tx{flex:1;min-width:0}.sv-est .tx b{display:block;font:900 15px Archivo,sans-serif;color:#2F6B0A}.sv-est.off .tx b{color:#3d4a60}
  .sv-est .tx small{display:block;font-size:12.5px;color:#3d4a60;margin-top:2px}
  .sv-sw{position:relative;flex:none;width:58px;height:32px;border-radius:999px;border:0;background:#2f9e44;cursor:pointer;padding:0}
  .sv-sw::after{content:'';position:absolute;top:4px;left:30px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:left .15s}
  .sv-sw.off{background:#aab4c3}.sv-sw.off::after{left:4px}
  .sv-est .mot{margin-top:8px}.sv-est .mot input{width:100%;box-sizing:border-box;border:1.5px solid #d3ddea;border-radius:9px;padding:8px 10px;font:600 13px inherit}
  .sv-dl{display:inline-flex;gap:2px}.sv-dl i{font-style:normal;font:800 10px Archivo,sans-serif;width:17px;height:17px;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;background:#eef1f5;color:#a3adbd}
  .sv-dl i.on{background:#14306b;color:#fff}
  .sv-pz{display:inline-block;margin-top:4px}
  .pl-ban.g{background:#f4f6f9;border-color:#d3ddea;color:#3d4a60}
  .sv-why{font-size:13px;color:#3d4a60;line-height:1.5;padding:10px 4px}.sv-why b{color:#0f2140}.sv-why button{margin-top:8px}
  .sv-mv{display:grid;grid-template-columns:290px minmax(0,1fr);gap:12px;height:var(--mvh,560px);min-height:420px;margin-top:8px}
  .sv-mv-lado{display:flex;flex-direction:column;min-height:0;background:#fff;border:1px solid #e1e6ee;border-radius:14px;overflow:hidden}
  .sv-mv-hojas{display:flex;flex-wrap:wrap;gap:6px;padding:10px;border-bottom:1px solid #eef1f5}
  .sv-mv-hojas button{display:inline-flex;align-items:center;gap:5px;border:1.5px solid #d3ddea;background:#fff;border-radius:999px;padding:4px 10px;font:800 12px Archivo,sans-serif;color:#3d4a60;cursor:pointer}
  .sv-mv-hojas button.on{border-color:#14306b;background:#14306b;color:#fff}
  .sv-mv-hojas i{display:inline-block;width:9px;height:9px;border-radius:50%}
  .sv-mv-lista{flex:1;overflow:auto;padding:4px 10px 10px}
  .sv-mv-g{font:900 11px Archivo,sans-serif;text-transform:uppercase;letter-spacing:.4px;color:#5b6a80;margin:10px 0 4px}
  .sv-mv-p{display:flex;gap:8px;align-items:center;padding:6px 4px;border-radius:8px;cursor:pointer;font-size:12.5px}
  .sv-mv-p:hover{background:#f1f5fb}.sv-mv-p .n{flex:none;width:22px;height:22px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font:900 10.5px Archivo,sans-serif}
  .sv-mv-p .t{flex:1;min-width:0}.sv-mv-p b{display:block;color:#0f2140;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sv-mv-p small{color:#667489}
  .sv-mv-p.sin{opacity:.6;cursor:default}
  .sv-mv-mapa{position:relative;min-height:0;border:1px solid #e1e6ee;border-radius:14px;overflow:hidden;background:#eef1f5}
  .sv-mv-mapa #dso-mapa{position:absolute;inset:0}
  .sv-mv-bar{position:absolute;top:10px;right:10px;z-index:500;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
  .sv-mv-bar button{border:1.5px solid #c4d2e6;background:#fff;border-radius:9px;padding:6px 10px;font:800 12px Archivo,sans-serif;color:#14306b;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.12)}
  .sv-mv-bar button.on{background:#14306b;color:#fff;border-color:#14306b}
  .sv-mv-tip{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);z-index:500;background:rgba(15,33,64,.82);color:#fff;font:700 12px Archivo,sans-serif;padding:6px 12px;border-radius:999px;pointer-events:none;transition:opacity .2s}
  .sv-mv-tip.no{opacity:0}
  .sv-mv-mapa.full{position:fixed;inset:0;z-index:9000;border-radius:0}
  @media (max-width:860px){.sv-mv{grid-template-columns:1fr;height:auto}.sv-mv-lado{max-height:220px;order:2}.sv-mv-mapa{height:62vh}}
  /* api 3.26 · el punto en 4 pasos, la descarga y la ruta en vivo */
  #pantalla-solc label.sc-foto{text-transform:none;letter-spacing:0}
  .p4-paso{display:flex;gap:4px;margin:0 0 10px}.p4-paso span{flex:1;height:5px;border-radius:3px;background:#dfe5ee}.p4-paso span.ok{background:#2f9e44}.p4-paso span.on{background:#14306b}
  .jv-card.p4-act{border:2px solid #14306b}
  .p4-cant{display:grid;grid-template-columns:minmax(0,1fr) 40px 44px 40px;gap:6px;align-items:center;padding:7px 0;border-top:1px solid #eef1f5;font-size:13px;font-weight:800}
  .p4-cant button{height:38px;border-radius:10px;border:0;font:900 20px Archivo,sans-serif;background:#E8EEF7;color:#14306b;cursor:pointer}
  .p4-cant b{text-align:center;font-size:18px}.p4-cant small{display:block;font-size:11px;color:#5B6880;font-weight:700}
  .p4-ok{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800;color:#1e6b31;background:#eaf6e4;border-radius:10px;padding:9px 10px}
  .p4-ok button{margin-left:auto;border:0;background:none;color:#14306b;font:900 12px Archivo,sans-serif;text-decoration:underline;cursor:pointer}
  .p4-dst{display:grid;gap:8px}.p4-dst button{border:1.5px solid #D3DDEA;background:#fff;border-radius:12px;padding:11px 12px;text-align:left;font:900 14px Archivo,sans-serif;color:#0f2140;cursor:pointer}
  .p4-dst button small{display:block;font-size:11.5px;font-weight:700;color:#5B6880}.p4-dst button.on{border-color:#14306b;background:#EEF3FB;box-shadow:inset 0 0 0 1px #14306b}
  .vv{padding:14px 16px;margin-bottom:12px}
  .vv-h{display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap}.vv-h .tx{flex:1;min-width:240px}
  .vv-h .t1{font-size:16px;font-weight:900;color:var(--ini-navy)}.vv-h .t2{font-size:12.5px;color:var(--ini-gris);font-weight:600;margin-top:3px;line-height:1.5}.vv-h .t2 b{color:#0f2140}
  .vv-est{display:flex;flex-direction:column;align-items:flex-end;gap:4px;text-align:right}
  .vv-est .big{font-size:15px;font-weight:900;color:#14306b;background:#E8F0FA;border-radius:9px;padding:5px 10px}
  .vv-est .big.v{background:#E7F3DD;color:#2F6B0A}.vv-est .big.r{background:#FDECEA;color:#B42318}.vv-est .big.a{background:#FFF4D6;color:#8a6300}
  .vv-est small{font-size:11.5px;color:var(--ini-gris);font-weight:700}
  .vv-lin{position:relative;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);margin:18px 0 4px}
  .vv-lin:before{content:"";position:absolute;left:3%;right:3%;top:14px;height:4px;border-radius:3px;background:#e1e6ee}
  .vv-lin .pt{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;min-width:0;background:none;border:0;font-family:inherit;padding:0}
  .vv-lin .pt .c{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font:900 12px Archivo,sans-serif;background:#fff;border:2.5px solid #c3cddb;color:#7a879b;position:relative;z-index:1}
  .vv-lin .pt.h .c{background:#2f9e44;border-color:#2f9e44;color:#fff}.vv-lin .pt.s .c{background:#d64045;border-color:#d64045;color:#fff}
  .vv-lin .pt.n .c{background:#14306b;border-color:#14306b;color:#fff;box-shadow:0 0 0 5px rgba(20,48,107,.18)}
  .vv-lin .pt.d .c{border-radius:8px;background:#FFF4D6;border-color:#F5B301;color:#8a6300}.vv-lin .pt.d.h .c{background:#2f9e44;border-color:#2f9e44;color:#fff}
  .vv-lin .pt b{font-size:10.5px;font-weight:800;color:#3d4a60;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.vv-lin .pt small{font-size:10px;color:#8a96a8;font-weight:700;margin-top:-3px}
  .vv-g{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:14px;margin-top:14px}
  @media (max-width:1100px){.vv-g{grid-template-columns:minmax(0,1fr)}.vv-lin .pt b,.vv-lin .pt small{display:none}}
  .vv-mapa{height:320px;border-radius:14px;overflow:hidden;border:1px solid var(--ini-linea);background:#dfe9f3}
  .vv-col{display:flex;flex-direction:column;gap:10px}
  .vv-va{background:#fff;border:1px solid var(--ini-linea);border-left:5px solid #14306b;border-radius:14px;padding:12px 14px}
  .vv-va .et{font-size:10.5px;font-weight:900;letter-spacing:.8px;color:#14306b;text-transform:uppercase}.vv-va .n{font-size:16px;font-weight:900;color:var(--ini-navy);margin:3px 0 2px}
  .vv-va .z{font-size:12.5px;color:#5b6a80;font-weight:700;line-height:1.5}
  .vv-va.u{border-left-color:#2f9e44;cursor:pointer}.vv-va.u .et{color:#2F6B0A}.vv-va.u.s{border-left-color:#d64045}.vv-va.u.s .et{color:#B42318}
  .vv-cif{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));background:#fff;border:1px solid var(--ini-linea);border-radius:14px;overflow:hidden}
  .vv-cif div{padding:10px 12px;border-left:1px solid var(--ini-linea);border-top:1px solid var(--ini-linea)}
  .vv-cif div:nth-child(3n+1){border-left:0}.vv-cif div:nth-child(-n+3){border-top:0}
  .vv-cif b{display:block;font-size:19px;font-weight:900;color:var(--ini-navy)}.vv-cif span{font-size:11.5px;color:var(--ini-gris);font-weight:700}
  .vv tr.pe td{color:#8a96a8}.vv tr.nx td{background:#F3F7FD}
  .vv-pin{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font:900 11px Archivo,sans-serif;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);background:#fff;color:#0f2140}
  .vv-pin.h{background:#2f9e44;color:#fff}.vv-pin.s{background:#d64045;color:#fff}.vv-pin.n{background:#14306b;color:#fff}
  .vv-fotos{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:10px}.vv-fotos figure{margin:0}
  .vv-fotos .ph{aspect-ratio:4/3;border-radius:10px;background:#eef1f5;display:grid;place-items:center;font-size:12px;color:#8a96a8;font-weight:700;overflow:hidden}
  .vv-fotos img{width:100%;height:100%;object-fit:cover;display:block}.vv-fotos figcaption{font-size:11.5px;color:#5b6a80;font-weight:800;margin-top:4px}
  section[id^="pantalla-s-"]{color:var(--ini-tinta)}body.es-sup section[id^="pantalla-s-"]{max-width:1320px}
  `;
  var st = document.createElement('style'); st.id = 'dso-css'; st.textContent = CSS; document.head.appendChild(st);

  /* ── utilidades ── */
  function $i(id) { return document.getElementById(id); }
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function N(n, d) { n = Number(n) || 0; return n.toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function ic(n) { return typeof mkSvg_ === 'function' ? mkSvg_(n) : ''; }
  function aviso(m) { if (typeof toast === 'function') toast(m); }
  function sup() { return typeof esSupervisor === 'function' && esSupervisor(); }
  function hoy() { return typeof hoyISO === 'function' ? hoyISO() : new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10); }
  function masDias(f, n) { var d = new Date(f + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  var DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'], DIASL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var MESESL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function fCorta(f) { if (!f) return ''; var d = new Date(f + 'T12:00:00Z'); return DIAS[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MESES[d.getUTCMonth()]; }
  function fLarga(f) { if (!f) return ''; var d = new Date(f + 'T12:00:00Z'); var s = DIASL[d.getUTCDay()] + ' ' + d.getUTCDate() + ' de ' + MESESL[d.getUTCMonth()]; return s.charAt(0).toUpperCase() + s.slice(1); }
  function minDe(h) { var m = /(\d{1,2}):(\d{2})/.exec(h || ''); return m ? +m[1] * 60 + +m[2] : null; }
  function dur(a, b) { var x = minDe(a), y = minDe(b); if (x == null || y == null) return ''; var d = y - x; if (d < 0) d += 1440; return d + ' min'; }
  var TIPOS = { compactador: ['', 'Compactador', '🚚', 'Recoge bolsas · el conductor las cuenta'], rolloff: ['ro', 'Roll-off', '📦', 'Lleva caja vacía y levanta la llena'], rejilla: ['rj', 'Rejilla', '🛣️', 'Carga a mano · voluminosos'] };
  function chipTipo(t) { var x = TIPOS[t] || TIPOS.compactador; return '<span class="sv-chip ' + x[0] + '">' + x[1] + '</span>'; }
  var SERV = { bolsas: 'Cuenta bolsas', caja: 'Caja llena (roll-off)', granel: 'Carga a mano' };
  var EST = { borrador: ['g', 'Borrador'], publicada: ['', 'Publicada · falta la revisión'], por_firmar: ['r', 'Esperando tu firma'], en_ruta: ['', 'En ruta'], cerrada: ['v', 'Cerrada'], no_sale: ['r', 'No sale'], anulada: ['g', 'Anulada'] };
  function chipEst(s) { var x = EST[s] || ['g', s]; return '<span class="sv-chip ' + x[0] + '">' + x[1] + '</span>'; }
  function diasTxt(d) { var a = String(d || '').split(',').map(Number).filter(Boolean); if (a.length === 7) return 'Todos los días'; if (!a.length) return 'Cuando avisa'; return a.map(function (n) { return DIAS[n % 7]; }).join(', '); }

  /* 3.17.2 · día o noche (lo elegido; en hojas viejas, según la hora de salida) */
  var TURNO = { dia: ['☀️', 'Día', 'de día', '07:00'], noche: ['🌙', 'Noche', 'de noche', '21:30'] };
  function turnoDe(h) { if (h && (h.turno === 'dia' || h.turno === 'noche')) return h.turno; var m = minDe(h && h.salida); return m != null && m >= 300 && m < 1080 ? 'dia' : 'noche'; }
  function chipTurno(t) { var x = TURNO[t] || TURNO.noche; return '<span class="sv-chip t-' + (TURNO[t] ? t : 'noche') + '">' + x[0] + ' ' + x[1] + '</span>'; }
  function rutaTit(h) { return turnoDe(h) === 'dia' ? 'Mi ruta de hoy' : 'Mi ruta de esta noche'; }
  /* días de frecuencia a la vista: L M X J V S D */
  function diasLetras(d) { var a = String(d || '').split(',').map(Number); return '<span class="sv-dl" title="' + e(diasTxt(d)) + '">' + ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(function (l, i) { return '<i class="' + (a.indexOf(i + 1) >= 0 ? 'on' : '') + '">' + l + '</i>'; }).join('') + '</span>'; }
  /* 3.17.2 · lista de conductores: primero los de sólidos (rubro en Configuración › Usuarios o Equipos de trabajo), aparte los de peligrosos */
  function condLista() { var B = D.base || {}; return B.conductoresInfo || (B.conductores || []).map(function (n) { return { nombre: n, grupo: 'solidos', usuario: true }; }); }
  function condOpts(sel) {
    var L = condLista(), s = L.filter(function (c) { return c.grupo === 'solidos'; }), o = L.filter(function (c) { return c.grupo !== 'solidos'; });
    if (sel && !L.some(function (c) { return c.nombre === sel; })) s = [{ nombre: sel, grupo: 'solidos', usuario: false }].concat(s);
    var op = function (c) { return '<option value="' + e(c.nombre) + '"' + (c.nombre === sel ? ' selected' : '') + '>' + e(c.nombre) + (c.usuario ? '' : ' · sin usuario') + '</option>'; };
    return '<option value="">Elige…</option>' + (s.length ? '<optgroup label="Conductores de sólidos">' + s.map(op).join('') + '</optgroup>' : '') + (o.length ? '<optgroup label="Conductores de peligrosos">' + o.map(op).join('') + '</optgroup>' : '');
  }
  function condNota(sel) {
    var L = condLista(), c = L.filter(function (x) { return x.nombre === sel; })[0];
    if (!sel) return L.some(function (x) { return x.grupo === 'solidos'; }) ? '' : '<div class="sv-hint">Todavía no hay conductores de sólidos: márcalos como «Sólidos» en Configuración › Usuarios.</div>';
    if (!c) return '<div class="sv-hint r">Ya no está entre los conductores activos.</div>';
    if (!c.usuario) return '<div class="sv-hint r">Sin usuario en el sistema: no verá la hoja en su celular. Créalo en Configuración › Usuarios como conductor de sólidos.</div>';
    if (c.grupo !== 'solidos') return '<div class="sv-hint">Es conductor de peligrosos. Si va a trabajar en sólidos, márcalo como «Sólidos» en Configuración › Usuarios.</div>';
    return '';
  }
  /* unidades: todas las activas, primero las del tipo elegido, cada una con su tipo */
  function uniOpts(sel, tipo) {
    var L = ((D.base || {}).unidades || []).filter(function (u) { return u.estado === 'activa' || u.unidadId === sel; }).slice().sort(function (a, b) { return (a.tipo === tipo ? 0 : 1) - (b.tipo === tipo ? 0 : 1) || (a.nombre < b.nombre ? -1 : 1); });
    return '<option value="">Elige…</option>' + L.map(function (u) { return '<option value="' + e(u.unidadId) + '"' + (u.unidadId === sel ? ' selected' : '') + '>' + e(u.nombre + (u.placa ? ' · ' + u.placa : '') + ' · ' + (TIPOS[u.tipo] || TIPOS.compactador)[1]) + '</option>'; }).join('');
  }

  /* llamada al servidor con promesa */
  function S(fn) {
    var a = [].slice.call(arguments, 1);
    return new Promise(function (ok, no) {
      var r = google.script.run.withSuccessHandler(function (x) {
        if (x && x.ok === false) { var er = new Error(x.error || 'No se pudo'); er.r = x; no(er); return; }
        ok(x);
      }).withFailureHandler(function (er) { no(er instanceof Error ? er : new Error(String((er && er.message) || er || 'Sin conexión'))); });
      r[fn].apply(r, a);
    });
  }
  function falla(er) { aviso((er && er.message) || 'No se pudo'); }

  /* ventana propia (formularios de sólidos) */
  function modal(titulo, cuerpo, botones) {
    cerrarModal();
    var f = document.createElement('div'); f.className = 'dso-fondo'; f.id = 'dso-fondo';
    f.innerHTML = '<div class="dso-modal" role="dialog" aria-label="' + e(titulo) + '"><div class="mh"><h3>' + e(titulo) + '</h3><button type="button" data-x>✕</button></div><div class="mb">' + cuerpo + '</div>' +
      (botones ? '<div class="mf">' + botones + '</div>' : '') + '</div>';
    f.addEventListener('click', function (ev) { if (ev.target === f || ev.target.hasAttribute('data-x')) cerrarModal(); });
    document.body.appendChild(f);
    return f;
  }
  function cerrarModal() { var f = $i('dso-fondo'); if (f) f.remove(); }
  function val(id) { var x = $i(id); return x ? String(x.value || '').trim() : ''; }
  function diasSel(raiz) { return [].slice.call((raiz || document).querySelectorAll('.dso-dias button.on')).map(function (b) { return b.getAttribute('data-d'); }).join(','); }
  function diasHtml(d) { var a = String(d || '').split(',').map(Number); return '<div class="dso-dias">' + [1, 2, 3, 4, 5, 6, 7].map(function (n) { return '<button type="button" data-d="' + n + '" class="' + (a.indexOf(n) >= 0 ? 'on' : '') + '" onclick="this.classList.toggle(\'on\')">' + DIAS[n % 7] + '</button>'; }).join('') + '</div>'; }

  /* ═══ estado ═══ */
  var D = window.DSO = {
    modo: 'pel', base: null, fecha: null, dia: null, hojaSel: null, editor: null, ini: null, cerrar: null, tk: null, tkSel: null, cal: null, flotaTab: 'u', rellTab: 't', cliSel: null,
    con: { hoja: null, esSolidos: false, vista: '', idx: -1, borr: {} }
  };
  var MENU_PEL = null;
  var MENU_SOL = [['Operación'], ['s-hub', '🏠', 'Inicio'], ['s-plan', '🛠️', 'Planificar rutas'], ['s-mapa', '🗺️', 'Mapa de rutas'], ['s-agenda', '🗓️', 'Calendario'],
    ['s-salidas', '📋', 'Salidas y hojas de ruta', 'dsoSal'], ['s-cierre', '📊', 'Cierre de rutas'], ['s-cli', '👥', 'Clientes de sólidos', 'dsoCli'], ['s-rell', '🏭', 'Relleno · tickets', 'dsoRel'],
    ['Administración'], ['s-flota', '🚚', 'Flota de sólidos'], ['s-equipos', '👤', 'Equipos de trabajo'], ['s-cajas', '📦', 'Cajas roll-off', 'dsoCaj']];
  var PANTALLAS = {};

  /* ── pestaña Peligrosos | Sólidos ── */
  function pintarPestana() {
    var m = document.querySelector('.mk-marca'); if (!m) return;
    var t = document.querySelector('.rb-tabs'), tira = $i('rb-tira');
    if (!sup()) { if (t) t.remove(); if (tira) tira.remove(); return; }
    if (!t) { t = document.createElement('div'); t.className = 'rb-tabs mk-no'; }
    /* api 3.18 · en celular va en su propia franja debajo de la barra; en la computadora, en la barra */
    var cel = window.matchMedia && matchMedia('(max-width: 640px)').matches, hd = document.querySelector('header');
    if (cel && hd) {
      if (!tira) { tira = document.createElement('div'); tira.id = 'rb-tira'; tira.className = 'rb-tira mk-no'; hd.parentNode.insertBefore(tira, hd.nextSibling); }
      if (t.parentNode !== tira) tira.appendChild(t);
    } else { if (t.parentNode !== m) m.appendChild(t); if (tira) tira.remove(); }
    var s = D.modo === 'sol';
    t.innerHTML = '<button type="button" class="' + (s ? '' : 'on') + '" data-r="pel">' + ic('alerta') + 'Peligrosos</button><button type="button" class="s ' + (s ? 'on' : '') + '" data-r="sol">' + ic('basura') + 'Sólidos</button>';
    t.onclick = function (ev) { ev.stopPropagation(); var b = ev.target.closest('button'); if (b) cambiarModo(b.getAttribute('data-r')); };
    document.body.classList.toggle('rb-sol', s);
  }
  var RB_T = null; window.addEventListener('resize', function () { clearTimeout(RB_T); RB_T = setTimeout(function () { if (sup()) pintarPestana(); }, 150); });
  function cambiarModo(r, sinIr) {
    if (r !== 'sol') r = 'pel';
    if (!MENU_PEL) MENU_PEL = window.MENU_SUP.slice();
    if (D.modo === r && !sinIr && r === 'sol') { mostrar('s-hub'); return; }
    D.modo = r;
    try { localStorage.setItem('eco_rubro', r); } catch (er) {}
    window.MENU_SUP = r === 'sol' ? MENU_SOL.slice() : MENU_PEL.slice();
    pintarPestana();
    if (sinIr) return;
    if (r === 'sol') mostrar('s-hub'); else ORIG.mostrarTab('hub');
  }
  function contadores(k) {
    if (!window.INI) return;
    window.INI.menu = window.INI.menu || {};
    Object.keys(k).forEach(function (x) { window.INI.menu[x] = k[x]; });
  }

  /* ── pantallas de sólidos (secciones dentro de <main>) ── */
  function seccion(id) {
    var s = $i('pantalla-' + id);
    if (!s) { s = document.createElement('section'); s.id = 'pantalla-' + id; s.className = 'pantalla'; document.querySelector('main').appendChild(s); }
    return s;
  }
  function mostrar(id, arg) {
    if (!PANTALLAS[id]) id = 's-hub';
    if (D.modo !== 'sol' && sup()) cambiarModo('sol', true);
    var s = seccion(id);
    document.querySelectorAll('.pantalla').forEach(function (p) { p.classList.remove('activa'); });
    s.classList.add('activa');
    window.INI_TAB = id;
    if (typeof cerrarMenuSup_ === 'function') cerrarMenuSup_();
    if (typeof pintarMenuSup_ === 'function') pintarMenuSup_();
    var mn = $i('menu-sup'); if (mn && typeof mkIconos_ === 'function') mkIconos_(mn);
    window.scrollTo(0, 0);
    PANTALLAS[id](s, arg);
  }
  function pintar(s, html) { s.innerHTML = html; if (typeof mkIconos_ === 'function') mkIconos_(s); }
  function cargando(s, t) { if (!s.innerHTML) s.innerHTML = '<div class="sv-vacio"><b>' + e(t || 'Consultando…') + '</b></div>'; }
  function base() { return D.base ? Promise.resolve(D.base) : S('api_dsoBase', PIN).then(function (b) { D.base = b; return b; }); }
  function recargarBase() { D.base = null; return base(); }
  function puede() { return !!(D.base && D.base.puedeEditar); }
  function mapa(lista, k) { var o = {}; (lista || []).forEach(function (x) { o[x[k]] = x; }); return o; }

  /* ── enganches con la Logística de hoy (sin tocar su lógica) ── */
  var ORIG = { mostrarTab: window.mostrarTab, prepararMenuSup_: window.prepararMenuSup_, pintarTablero: window.pintarTablero };
  window.mostrarTab = function (t) {
    if (/^s-/.test(String(t))) return mostrar(t);
    if (D.modo === 'sol' && sup()) cambiarModo('pel', true);
    return ORIG.mostrarTab.apply(this, arguments);
  };
  if (typeof ORIG.prepararMenuSup_ === 'function') window.prepararMenuSup_ = function () {
    var r = ORIG.prepararMenuSup_.apply(this, arguments);
    var guardado = ''; try { guardado = localStorage.getItem('eco_rubro') || ''; } catch (er) {}
    if (sup() && guardado === 'sol' && D.modo !== 'sol' && !D._arrancado) { D._arrancado = true; setTimeout(function () { cambiarModo('sol'); }, 0); }
    pintarPestana();
    return r;
  };
  if (typeof ORIG.pintarTablero === 'function') window.pintarTablero = function () {
    var r = ORIG.pintarTablero.apply(this, arguments);
    try { conTarjeta(); } catch (er) {}
    return r;
  };
  D.mostrar = mostrar; D.modo_ = cambiarModo; D._S = S;

  /* ═════════════════ OFICINA ═════════════════ */

  /* ═══ Inicio ═══ */
  PANTALLAS['s-hub'] = function (s) {
    cargando(s, 'Consultando la operación de sólidos…');
    Promise.all([base(), S('api_dsoInicio', PIN, hoy())]).then(function (r) { D.ini = r[1]; pintarHub(s); }).catch(falla);
  };
  function estNoche(h) {
    var m = { por_firmar: ['firmar →', 'var(--ini-rojo)'], en_ruta: ['en ruta', 'var(--ini-navy)'], publicada: ['sin revisión', 'var(--ini-gris)'], borrador: ['borrador', 'var(--ini-gris)'], cerrada: ['cerrada', 'var(--ini-verde,#2f9e44)'], no_sale: ['no sale', 'var(--ini-rojo)'] };
    return m[h.estado] || [h.estado, 'var(--ini-gris)'];
  }
  function pintarHub(s) {
    var I = D.ini, k = I.kpi, B = D.base; vvAvisos(I);   /* api 3.26 */
    var nom = String((window.USUARIO && USUARIO.nombre) || '').trim().split(/\s+/)[0], hr = new Date().getHours();
    var hola = (hr < 12 ? 'Buenos días' : hr < 19 ? 'Buenas tardes' : 'Buenas noches') + (nom ? ', ' + e(nom) : '');
    var abiertas = I.noche.filter(function (h) { return h.estado !== 'cerrada' && h.estado !== 'no_sale'; }).length;
    var noche = I.noche.length ? I.noche.map(function (h) {
      var es = estNoche(h), pct = h.paradas.length ? Math.round(h.atendidas / h.paradas.length * 100) : 0;
      var sub = (h.conductor || 'Sin conductor') + (h.ayudantes && h.ayudantes.length ? ' + ' + h.ayudantes.length + ' ayudante' + (h.ayudantes.length > 1 ? 's' : '') : '') + ' · ' + h.atendidas + ' de ' + h.paradas.length + ' paradas' +
        (h.tipo === 'rolloff' ? ' · ' + h.paradas.filter(function (p) { return p.cajaLevanta; }).length + ' cajas' : ' · ' + N(h.bolsas) + ' bolsas');
      return '<div class="ini-sr" style="display:grid;grid-template-columns:minmax(0,1fr) 150px 80px;gap:14px;align-items:center;cursor:pointer" onclick="DSO.irHoja(\'' + e(h.hojaId) + '\',\'' + h.fecha + '\')"><b>' + chipTurno(turnoDe(h)) + ' ' + e(h.nombre || h.hojaId) + ' · ' + (TIPOS[h.tipo] || TIPOS.compactador)[1] + ' ' + e(h.unidad) +
        '<small style="display:block;font-weight:600;color:var(--ini-gris);font-size:12px;margin-top:2px">' + e(sub) + (h.fecha !== I.fecha ? ' · desde ' + fCorta(h.fecha) : '') + '</small></b><div class="ini-mini"><i style="width:' + pct + '%"></i></div><span class="e" style="color:' + es[1] + ';text-align:right">' + es[0] + '</span></div>';
    }).join('') : '<div class="sv-vacio"><b>No hay hojas de ruta para hoy</b>Ármalas en «Planificar rutas».' + (puede() ? '<div style="margin-top:10px"><button class="pl-btn v" onclick="DSO.mostrar(\'s-plan\')">Planificar rutas →</button></div>' : '') + '</div>';
    var kp = [[N(k.toneladas, 1) + ' t', 'al relleno', k.tickets + ' ticket' + (k.tickets === 1 ? '' : 's'), 's-rell'], [N(k.bolsas), 'bolsas contadas', 'compactador', 's-cierre'], [N(k.cajas), 'cajas cambiadas', 'roll-off', 's-cajas'],
      [k.cumplidas + '%', 'paradas cumplidas', k.sinHacer ? k.sinHacer + ' sin hacer' : 'todas hechas', 's-cierre'], [N(k.km), 'km recorridos', 'según el odómetro', 's-cierre']];
    var prox = I.proximos.map(function (p) {
      var es = p.hojas ? (p.publicadas === p.hojas ? ['lista', 'var(--ini-verde,#2f9e44)', 100] : ['borrador', 'var(--ini-gris)', Math.round(p.publicadas / p.hojas * 100)]) : (p.rutasFijas ? ['crear →', 'var(--ini-rojo)', 0] : ['sin ruta', 'var(--ini-gris)', 0]);
      return '<div class="ini-sr" style="cursor:pointer" onclick="DSO.irPlan(\'' + p.fecha + '\')"><b>' + fCorta(p.fecha) + '</b><span class="g">' + e(p.nombres || (p.rutasFijas ? p.rutasFijas + ' ruta(s) fija(s)' : '—')) + '</span><div class="ini-mini"><i style="width:' + es[2] + '%"></i></div><span class="e" style="color:' + es[1] + '">' + es[0] + '</span></div>';
    }).join('');
    var at = I.atencion.length ? I.atencion.map(function (a, i) {
      return '<div class="ini-al" style="cursor:pointer" onclick="DSO.atender(' + i + ')"><span class="dot ' + (a.tono || '') + '"></span><div><b>' + e(a.titulo) + '</b><span>' + e(a.detalle) + '</span><span class="ac' + (a.tono === 'r' ? ' p' : '') + '">' + e(a.accion) + ' →</span></div></div>';
    }).join('') : '<div class="sv-vacio" style="padding:14px 4px"><b>Todo en orden</b>Nada de sólidos espera por ti.</div>';
    var sinBase = !B.unidades.length || !B.clientes.length;
    pintar(s, '<div class="ini"><div class="ini-grid"><div><div class="ini-hola">' + hola + '<span>' + fLarga(I.fecha) + ' · sólidos · ' + (abiertas ? abiertas + ' ruta' + (abiertas > 1 ? 's' : '') + ' abierta' + (abiertas > 1 ? 's' : '') : 'sin rutas abiertas') + '</span></div>' +
      (sinBase ? '<div class="pl-ban a"><span>Para empezar: registra ' + (!B.unidades.length ? '<b>las unidades</b> en «Flota de sólidos»' : '') + (!B.unidades.length && !B.clientes.length ? ' y ' : '') + (!B.clientes.length ? '<b>los clientes y sus puntos de recolección</b> en «Clientes de sólidos»' : '') + '.</span><span class="sp"></span><button onclick="DSO.mostrar(\'' + (!B.unidades.length ? 's-flota' : 's-cli') + '\')">Ir →</button></div>' : '') +
      vvBloque(I) + '<div class="ini-bloque"><div class="ini-bt"><h3>Operación de hoy · en vivo</h3><button class="x" onclick="DSO.mostrar(\'s-salidas\')">Toca una ruta para ver su hoja</button></div><div class="ini-sem">' + noche + '</div></div>' +
      '<div class="ini-bloque"><div class="ini-bt"><h3>Indicadores · últimos 7 días</h3></div><div class="ini-kpis">' + kp.map(function (x) { return '<button onclick="DSO.mostrar(\'' + x[3] + '\')"><b>' + x[0] + '</b><span>' + x[1] + '</span><em>' + e(x[2]) + '</em></button>'; }).join('') + '</div></div>' +
      '<div class="ini-bloque"><div class="ini-bt"><h3>Lo que viene esta semana</h3><button class="x" onclick="DSO.mostrar(\'s-agenda\')">Abrir calendario →</button></div><div class="ini-sem">' + prox + '</div></div></div>' +
      '<aside class="ini-aten"><h3>Requiere tu atención <span style="color:var(--ini-rojo)">' + (I.atencion.length || '') + '</span></h3>' + at + '</aside></div></div>');
    vvMapas(I);   /* api 3.26 */
    contadores({ dsoSal: I.atencion.filter(function (a) { return a.ir === 'salidas' && a.tono === 'r'; }).length, dsoRel: I.atencion.filter(function (a) { return a.ir === 'relleno'; }).length,
      dsoCli: I.atencion.filter(function (a) { return a.ir === 'clientes'; }).length, dsoCaj: I.atencion.filter(function (a) { return /Caja llena/.test(a.titulo); }).length });
    if (typeof pintarMenuSup_ === 'function') pintarMenuSup_();
  }
  D.irHoja = function (id, f) { D.hojaSel = id; D.fecha = f || D.fecha; mostrar('s-salidas'); };
  D.irPlan = function (f) { D.fecha = f; D.editor = null; mostrar('s-plan'); };
  D.atender = function (i) {
    var a = D.ini.atencion[i]; if (!a) return;
    if (a.ir === 'salidas') { var h = D.ini.noche.filter(function (x) { return x.hojaId === a.hojaId; })[0]; D.irHoja(a.hojaId, h ? h.fecha : D.fecha); return; }
    if (a.ir === 'relleno') { D.rellTab = 'f'; mostrar('s-rell'); return; }
    if (a.ir === 'clientes') { var p = (D.base.puntos || []).filter(function (x) { return x.puntoId === a.puntoId; })[0]; D.cliSel = p ? p.clienteId : null; mostrar('s-cli'); return; }
    if (a.ir === 'plan') { D.fecha = a.fecha || hoy(); D.editor = null; D._abrirHoja = a.hojaId || null; mostrar('s-plan'); return; }
  };

  /* ═══ Planificar rutas ═══ */
  PANTALLAS['s-plan'] = function (s) {
    D.fecha = D.fecha || hoy();
    cargando(s, 'Cargando el planificador…');
    Promise.all([base(), S('api_dsoDia', PIN, D.fecha)]).then(function (r) {
      D.dia = r[1];
      if (D._abrirHoja && D.dia.hojas.some(function (x) { return x.hojaId === D._abrirHoja; })) { D.editor = editorDe(D.dia.hojas.filter(function (x) { return x.hojaId === D._abrirHoja; })[0]); D._abrirHoja = null; }
      else if (!D.editor || D.editor.fecha !== D.fecha) elegirHoja(null, true);
      else if (D.editor.hojaId) { var h = D.dia.hojas.filter(function (x) { return x.hojaId === D.editor.hojaId; })[0]; if (h && !D.editor.sucio) D.editor = editorDe(h); }
      pintarPlan(s);
    }).catch(falla);
  };
  function editorDe(h) {
    return { fecha: h.fecha, hojaId: h.hojaId, rutaId: h.rutaId, nombre: h.nombre, tipo: h.tipo, unidadId: h.unidadId, conductor: h.conductor, ayudantes: (h.ayudantes || []).slice(), salida: h.salida, relleno: h.relleno, turno: turnoDe(h),
      paradas: h.paradas.map(function (p) { return p.puntoId; }), estado: h.estado, sucio: false };
  }
  function editorNuevo() {
    var B = D.base, u = B.unidades.filter(function (x) { return x.estado === 'activa' && x.tipo === 'compactador'; })[0] || B.unidades.filter(function (x) { return x.estado === 'activa'; })[0] || {};
    return { fecha: D.fecha, hojaId: '', rutaId: '', nombre: 'Ruta de sólidos', tipo: u.tipo || 'compactador', unidadId: u.unidadId || '', conductor: u.conductor || '', ayudantes: (u.ayudantes || []).slice(), salida: '21:30', turno: 'noche', relleno: B.ajustes.rellenos[0] || '', paradas: [], estado: 'borrador', sucio: false };
  }
  function elegirHoja(id, sinPintar) {
    var h = id ? D.dia.hojas.filter(function (x) { return x.hojaId === id; })[0] : (sinPintar ? D.dia.hojas.filter(function (x) { return ['borrador', 'publicada'].indexOf(x.estado) >= 0; })[0] || D.dia.hojas[0] : null);
    D.editor = h ? editorDe(h) : editorNuevo();
    if (!sinPintar) pintarPlan(seccion('s-plan'));
  }
  D.elegirHoja = function (id) {
    var k = id || '__nueva';
    if (D.editor && D.editor.sucio && D._confirmaSalir !== k) { D._confirmaSalir = k; aviso('Tienes cambios sin guardar. Toca otra vez para dejarlos.'); return; }
    D._confirmaSalir = null; elegirHoja(id || null);
  };
  function editable() { return puede() && D.editor && ['borrador', 'publicada'].indexOf(D.editor.estado) >= 0; }
  function pintarPlan(s) {
    var B = D.base, Dd = D.dia, E = D.editor, P = mapa(B.puntos, 'puntoId'), C = mapa(B.clientes, 'clienteId'), U = mapa(B.unidades, 'unidadId'), EQ = mapa(B.equipo, 'personaId');
    var ocupados = {}; Dd.hojas.forEach(function (h) { if (h.hojaId !== E.hojaId) h.paradas.forEach(function (p) { ocupados[p.puntoId] = h.nombre || h.hojaId; }); });
    E.paradas.forEach(function (id) { ocupados[id] = 'esta hoja'; });
    var leToca = {}; Dd.candidatos.forEach(function (c) { leToca[c.puntoId] = c; });
    var fil = D.planFil || 'toca', q = String(D.planQ || '').toLowerCase();
    var cands = B.puntos.filter(function (p) {
      if (!p.activo || ocupados[p.puntoId]) return false;
      if (fil === 'toca' && !leToca[p.puntoId]) return false;
      if (TIPOS[fil] && p.unidadTipo !== fil) return false;
      if (q && (p.nombre + ' ' + ((C[p.clienteId] || {}).nombre || '') + ' ' + p.direccion).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var grupos = ['compactador', 'rolloff', 'rejilla'].map(function (t) { return [t, cands.filter(function (p) { return p.unidadTipo === t; })]; }).filter(function (g) { return g[1].length; });
    var ed = editable();
    var pz = (Dd.pausados || []);
    var izq = '<div class="pl-card pl-col-toca"><div class="pl-ch"><h3>A quién le toca el ' + fCorta(D.fecha).split(' ')[0] + '</h3><button class="x" onclick="DSO.planAgregarMarcados()"' + (ed ? '' : ' disabled') + '>Agregar marcados</button></div>' +
      '<input class="pl-busca" placeholder="🔍 Buscar en los clientes de sólidos…" value="' + e(D.planQ || '') + '" oninput="DSO.planBuscar(this.value)">' +
      (pz.length ? '<div class="pl-ban g" style="margin:0 12px 8px"><span>' + (pz.length === 1 ? 'Hay <b>1 sucursal pausada</b> que no sale aquí' : 'Hay <b>' + pz.length + ' sucursales pausadas</b> que no salen aquí') + '</span><span class="sp"></span><button onclick="DSO.verPausadas()">Ver</button></div>' : '') +
      '<div class="pl-fil">' + [['toca', 'Les toca'], ['todos', 'Todos'], ['compactador', 'Compactador'], ['rolloff', 'Roll-off'], ['rejilla', 'Rejilla']].map(function (f) { return '<button class="' + (fil === f[0] ? 'on' : '') + '" onclick="DSO.planFiltro(\'' + f[0] + '\')">' + f[1] + '</button>'; }).join('') + '</div>' +
      (grupos.length ? grupos.map(function (g) {
        return '<div class="pl-gr">' + (TIPOS[g[0]][1]) + ' · ' + (g[0] === 'compactador' ? 'cuentan bolsas' : g[0] === 'rolloff' ? 'cambio de caja' : 'carga a mano') + ' <span>' + g[1].length + '</span></div>' + g[1].map(function (p) {
          var c = C[p.clienteId] || {}, t = leToca[p.puntoId];
          var fx = chipTipo(p.unidadTipo) + ' <i>' + e(SERV[p.servicio] || '') + (p.horaDesde ? ' · recibe ' + e(p.horaDesde) + '–' + e(p.horaHasta) : '') + '</i>' + (t && t.cajaLlena ? ' <i class="r">Caja llena avisada</i>' : t ? ' <i class="v">Le toca este día</i>' : '');
          return '<div class="pl-cand"><input type="checkbox" class="c2-ck dso-ck" data-p="' + e(p.puntoId) + '"' + (ed ? '' : ' disabled') + '><div class="nm"><b><span class="pl-dot ' + (t ? 'tocan' : 'busca') + '"></span>' + e(p.nombre) + '</b><span>' + e(c.nombre || '') + (p.kgBolsa ? ' · ≈ ' + N(p.kgBolsa, 1) + ' kg por bolsa' : '') + '</span><div class="fx">' + fx + '</div></div>' +
            (ed ? '<button class="add" title="Agregar a la hoja" onclick="DSO.planAgregar(\'' + e(p.puntoId) + '\')">＋</button>' : '') + '</div>';
        }).join('');
      }).join('') : (B.puntos.length ? porQueVacio(fil, q) : '<div class="pl-vacio">Todavía no hay sucursales (puntos de recolección). Regístralas en «Clientes de sólidos».</div>')) + '</div>';

    var un = U[E.unidadId] || {};
    var ayud = B.equipo.filter(function (x) { return x.activo && x.puesto !== 'conductor'; });
    var paradas = E.paradas.map(function (id, i) {
      var p = P[id] || { nombre: id }, c = C[p.clienteId] || {};
      return '<div class="pl-st"><span class="n">' + (i + 1) + '</span><span class="eta">' + e(p.horaDesde || '') + '</span><div class="nm"><b>' + e(p.nombre) + '</b><span>' + e(c.nombre || '') + ' · ' + e(SERV[p.servicio] || '') + (p.cajaId ? ' · caja ' + e(p.cajaId) : '') + (p.horaDesde ? ' · recibe ' + e(p.horaDesde) + '–' + e(p.horaHasta) : '') + (p.nota ? ' · ' + e(p.nota) : '') + '</span></div>' +
        (ed ? '<span class="mv"><button title="Subir" onclick="DSO.planMover(' + i + ',-1)">↑</button><button title="Bajar" onclick="DSO.planMover(' + i + ',1)">↓</button><button class="x" title="Quitar" onclick="DSO.planQuitar(' + i + ')">✕</button></span>' : '') + '</div>';
    }).join('');
    var nCajas = E.paradas.filter(function (id) { return (P[id] || {}).servicio === 'caja'; }).length;
    var cap = [[E.paradas.length + '', 'paradas'], [nCajas ? nCajas + ' caja' + (nCajas > 1 ? 's' : '') : '—', 'roll-off a cambiar'], [un.capacidadT ? N(un.capacidadT) + ' t' : (un.capacidadYd3 ? N(un.capacidadYd3) + ' yd³' : '—'), 'capacidad de la unidad'], [E.salida || '—', 'salida']];
    var tabs = '<div class="pl-rtabs">' + Dd.hojas.map(function (h) { return '<button class="' + (h.hojaId === E.hojaId ? 'on' : '') + '" onclick="DSO.elegirHoja(\'' + e(h.hojaId) + '\')">' + e(h.nombre || h.hojaId) + ' ' + chipEst(h.estado) + '</button>'; }).join('') +
      (puede() ? '<button class="' + (!E.hojaId ? 'on' : '') + '" onclick="DSO.elegirHoja(\'\')">＋ Hoja nueva</button>' : '') + '</div>';
    var der = '<div class="pl-card pl-col-ruta">' + tabs + '<div class="pl-ch"><h3>' + (E.hojaId ? 'Hoja ' + e(E.hojaId) : 'Hoja nueva') + ' · ' + fCorta(D.fecha) + ' · ' + TURNO[E.turno][2] + '</h3><div style="display:flex;gap:8px;align-items:center">' + (E.sucio ? '<span class="pl-est suc">sin guardar</span>' : '') + chipEst(E.estado) + '</div></div>' +
      (E.estado === 'borrador' && (E.hojaId || E.paradas.length) ? '<div class="pl-ban a" style="margin:0 14px 10px"><span><b>Borrador</b> · ' + e(E.conductor || 'el conductor') + ' todavía no la ve en su celular. Cuando esté lista, toca «✓ Publicar al equipo».</span></div>' : '') +
      '<div class="tp2"><div class="lbl">Tipo de unidad</div>' + Object.keys(TIPOS).map(function (t) { return '<button class="op' + (t === E.tipo ? ' on' : '') + '"' + (ed ? ' onclick="DSO.planCampo(\'tipo\',\'' + t + '\')"' : ' disabled') + '><span class="ico">' + TIPOS[t][2] + '</span><span><b>' + TIPOS[t][1] + '</b><small>' + TIPOS[t][3] + '</small></span></button>'; }).join('') + '</div>' +
      '<div class="pl-cfg"><div><small>Turno</small><div class="sv-tn">' + ['dia', 'noche'].map(function (t) { return '<button type="button" class="' + (E.turno === t ? 'on' : '') + '"' + (ed ? ' onclick="DSO.planCampo(\'turno\',\'' + t + '\')"' : ' disabled') + '>' + TURNO[t][0] + ' ' + TURNO[t][1] + '</button>'; }).join('') + '</div></div>' +
      '<div><small>Nombre</small><input value="' + e(E.nombre) + '" onchange="DSO.planCampo(\'nombre\',this.value)"' + (ed ? '' : ' disabled') + ' style="width:150px"></div>' +
      '<div><small>Unidad</small><select onchange="DSO.planCampo(\'unidadId\',this.value)"' + (ed ? '' : ' disabled') + '>' + uniOpts(E.unidadId, E.tipo) + '</select>' + (un.tipo && un.tipo !== E.tipo ? '<div class="sv-hint">Es ' + TIPOS[un.tipo][1].toLowerCase() + ': la hoja pasa a ese tipo.</div>' : '') + '</div>' +
      '<div><small>Conductor</small><select onchange="DSO.planCampo(\'conductor\',this.value)"' + (ed ? '' : ' disabled') + '>' + condOpts(E.conductor) + '</select>' + condNota(E.conductor) + '</div>' +
      '<div><small>Salida</small><input type="time" value="' + e(E.salida) + '" onchange="DSO.planCampo(\'salida\',this.value)"' + (ed ? '' : ' disabled') + '></div></div>' +
      '<div class="pl-cfg" style="padding-top:0"><div style="flex:1 1 100%"><small>Ayudantes del equipo · no entran al sistema; el conductor confirma que vinieron</small><div class="sv-eq">' +
      (ayud.length ? ayud.map(function (a) { var on = E.ayudantes.indexOf(a.personaId) >= 0; return '<span class="' + (on ? 'on' : '') + '"' + (ed ? ' onclick="DSO.planAyudante(\'' + e(a.personaId) + '\')"' : '') + '>' + e(a.nombre) + '<small>' + (a.protocoloEstado === 'firmado' ? 'protocolo al día' : 'protocolo pendiente') + '</small></span>'; }).join('') : '<small style="text-transform:none">Regístralos en «Equipos de trabajo».</small>') + '</div></div>' +
      '<div style="flex:1 1 100%"><small>Disposición final</small><select onchange="DSO.planCampo(\'relleno\',this.value)"' + (ed ? '' : ' disabled') + '>' + B.ajustes.rellenos.concat(E.relleno && B.ajustes.rellenos.indexOf(E.relleno) < 0 ? [E.relleno] : []).map(function (r) { return '<option' + (r === E.relleno ? ' selected' : '') + '>' + e(r) + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="pl-cap"><div class="row">' + cap.map(function (c) { return '<div><b>' + e(c[0]) + '</b><span>' + c[1] + '</span></div>'; }).join('') + '</div></div>' +
      (E.paradas.length ? paradas + '<div class="pl-st rell"><span class="n">🏭</span><span class="eta"></span><div class="nm"><b>' + e(E.relleno || 'Relleno') + '</b><span>Descarga y ticket de báscula' + (E.tipo === 'rolloff' ? ' · un viaje por caja' : '') + '</span></div></div><div class="pl-fin">Regreso al ' + e(B.ajustes.patio) + '</div>'
        : '<div class="pl-vacio">Agrega paradas desde la lista de la izquierda.</div>') +
      '<div class="pl-pie">' + (ed ? '<button class="pl-btn" onclick="DSO.planCercania()">🧭 Por cercanía</button>' : '') + '<span style="flex:1"></span>' +
      (puede() && E.paradas.length ? '<button class="pl-btn" onclick="DSO.rutaDesdeHoja()">🔁 Guardar como ruta fija</button>' : '') +
      (ed && E.hojaId ? '<button class="pl-btn" onclick="DSO.planAnular()">Anular</button>' : '') +
      (ed ? '<button class="pl-btn a" onclick="DSO.planGuardar(false)">Guardar borrador</button><button class="pl-btn v" onclick="DSO.planGuardar(true)">✓ Publicar al equipo</button>' :
        (E.hojaId ? '<button class="pl-btn" onclick="DSO.irHoja(\'' + e(E.hojaId) + '\',\'' + D.fecha + '\')">Ver en Salidas y hojas →</button>' : '')) + '</div></div>';

    var faltan = Dd.rutas.filter(function (r) { return !r.yaTieneHoja; });
    var nT = { dia: 0, noche: 0 }; Dd.hojas.forEach(function (x) { nT[turnoDe(x)]++; });
    var h = '<div class="pl-tt"><div><h1>Planificar rutas · sólidos</h1><div class="sub">' + fLarga(D.fecha) + ' · ' + (Dd.hojas.length ? [nT.dia ? nT.dia + ' de día' : '', nT.noche ? nT.noche + ' de noche' : ''].filter(Boolean).join(' y ') : 'rutas de día o de noche') + '</div></div><span class="sp"></span>' +
      '<button class="pl-btn" onclick="DSO.rutasFijas()">🔁 Rutas fijas · ' + B.rutas.filter(function (r) { return r.activa; }).length + '</button>' +
      '<button class="pl-btn" onclick="DSO.planDia(-1)">◀</button><input type="date" value="' + D.fecha + '" onchange="DSO.planIr(this.value)"><button class="pl-btn" onclick="DSO.planDia(1)">▶</button></div>' +
      '<div class="pl-dias">' + Dd.dias.map(function (d) { return '<button class="' + (d.fecha === D.fecha ? 'on' : '') + (d.hojas ? '' : ' vac') + '" onclick="DSO.planIr(\'' + d.fecha + '\')"><b>' + fCorta(d.fecha) + '</b>' + (d.hojas ? d.hojas + ' hoja' + (d.hojas > 1 ? 's' : '') : 'sin hoja') + '</button>'; }).join('') + '</div>' +
      (faltan.length && puede() ? '<div class="pl-ban"><span>Rutas fijas de este día que todavía no tienen hoja: <b>' + e(faltan.map(function (r) { return r.nombre; }).join(', ')) + '</b></span><span class="sp"></span><button onclick="DSO.crearDeFijas()">Crear sus hojas</button></div>' : '') +
      '<div class="pl-grid">' + izq + der + '</div>';
    pintar(s, h);
  }
  function porQueVacio(fil, q) {
    var Dd = D.dia, pz = (Dd.pausados || []).filter(function (p) { return p.leToca; }).length;
    if (q || (fil !== 'toca' && fil !== 'todos')) return '<div class="pl-vacio">Nada con ese filtro.</div>';
    var r = [];
    if (fil === 'toca') {
      r.push('Ninguna sucursal más tiene marcado este día.');
      if (Dd.noLeToca) r.push('<b>' + Dd.noLeToca + '</b> en servicio no tiene' + (Dd.noLeToca > 1 ? 'n' : '') + ' marcado este día: tócalas en «Todos» para sumarlas igual.');
    } else r.push('Todas las sucursales en servicio ya están en una hoja de este día.');
    if (pz) r.push('<b>' + pz + '</b> sucursal' + (pz > 1 ? 'es' : '') + ' que hoy le' + (pz > 1 ? 's' : '') + ' tocaría está' + (pz > 1 ? 'n' : '') + ' <b>pausada' + (pz > 1 ? 's' : '') + '</b>.');
    return '<div class="sv-why">' + r.join('<br>') + '<div>' + (fil === 'toca' && Dd.noLeToca ? '<button class="pl-btn" onclick="DSO.planFiltro(\'todos\')">Ver todas las sucursales</button> ' : '') + (pz ? '<button class="pl-btn" onclick="DSO.verPausadas()">Ver las pausadas</button>' : '') + '</div></div>';
  }
  D.verPausadas = function () {
    var C = mapa(D.base.clientes, 'clienteId'), L = (D.dia && D.dia.pausados) || [];
    modal('Sucursales pausadas', L.length ? '<div class="sv-list">' + L.map(function (p) {
      return '<div class="it"><div class="tx"><b>' + e(p.nombre) + '</b><small>' + e((C[p.clienteId] || {}).nombre || '') + ' · pausada' + (p.desde ? ' desde ' + fCorta(p.desde) : '') + (p.motivo ? ' · ' + e(p.motivo) : '') + '</small></div>' +
        (puede() ? '<button class="pl-btn v" onclick="DSO.puntoEstado(\'' + e(p.puntoId) + '\',true,\'plan\')">Poner en servicio</button>' : '') + '</div>';
    }).join('') + '</div>' : '<div class="sv-vacio">No hay sucursales pausadas.</div>', '<button class="pl-btn" data-x>Cerrar</button>');
  };
  D.planBuscar = function (v) { D.planQ = v; clearTimeout(D._tq); D._tq = setTimeout(function () { var s = seccion('s-plan'), pos = s.querySelector('.pl-busca'); pintarPlan(s); var b = s.querySelector('.pl-busca'); if (b) { b.focus(); b.setSelectionRange(b.value.length, b.value.length); } }, 250); };
  D.planFiltro = function (f) { D.planFil = f; pintarPlan(seccion('s-plan')); };
  D.planIr = function (f) { if (!f) return; if (D.editor && D.editor.sucio && D._confirmaDia !== f) { D._confirmaDia = f; aviso('Tienes cambios sin guardar. Toca otra vez para cambiar de día.'); return; } D._confirmaDia = null; D.fecha = f; D.editor = null; mostrar('s-plan'); };
  D.planDia = function (n) { D.planIr(masDias(D.fecha, n)); };
  D.planCampo = function (k, v) {
    var E = D.editor; E[k] = v; E.sucio = true;
    if (k === 'tipo') { var u = D.base.unidades.filter(function (x) { return x.estado === 'activa' && x.tipo === v; })[0]; E.unidadId = u ? u.unidadId : ''; if (u && u.conductor) E.conductor = u.conductor; if (u) E.ayudantes = (u.ayudantes || []).slice(); }
    if (k === 'unidadId') { var u2 = mapa(D.base.unidades, 'unidadId')[v]; if (u2 && u2.tipo && u2.tipo !== E.tipo) E.tipo = u2.tipo; if (u2 && u2.conductor) E.conductor = u2.conductor; if (u2 && u2.ayudantes && u2.ayudantes.length) E.ayudantes = u2.ayudantes.slice(); }
    if (k === 'turno') { var o = v === 'dia' ? 'noche' : 'dia'; if (!E.salida || E.salida === TURNO[o][3]) E.salida = TURNO[v][3]; }
    pintarPlan(seccion('s-plan'));
  };
  D.planAyudante = function (id) { var a = D.editor.ayudantes, i = a.indexOf(id); if (i >= 0) a.splice(i, 1); else a.push(id); D.editor.sucio = true; pintarPlan(seccion('s-plan')); };
  D.planAgregar = function (id) { if (D.editor.paradas.indexOf(id) < 0) D.editor.paradas.push(id); D.editor.sucio = true; pintarPlan(seccion('s-plan')); };
  D.planAgregarMarcados = function () { [].slice.call(document.querySelectorAll('#pantalla-s-plan .dso-ck:checked')).forEach(function (c) { var id = c.getAttribute('data-p'); if (D.editor.paradas.indexOf(id) < 0) D.editor.paradas.push(id); }); D.editor.sucio = true; pintarPlan(seccion('s-plan')); };
  D.planMover = function (i, d) { var a = D.editor.paradas, j = i + d; if (j < 0 || j >= a.length) return; var x = a[i]; a[i] = a[j]; a[j] = x; D.editor.sucio = true; pintarPlan(seccion('s-plan')); };
  D.planQuitar = function (i) { D.editor.paradas.splice(i, 1); D.editor.sucio = true; pintarPlan(seccion('s-plan')); };
  D.planCercania = function () {
    var P = mapa(D.base.puntos, 'puntoId'), a = D.editor.paradas.slice(), con = a.filter(function (id) { return P[id] && P[id].lat; }), sin = a.filter(function (id) { return !(P[id] && P[id].lat); });
    if (con.length < 3) { aviso('Hacen falta al menos 3 puntos con ubicación'); return; }
    var orden = [con.shift()];
    while (con.length) {
      var u = P[orden[orden.length - 1]], mejor = 0, dm = 1e18;
      con.forEach(function (id, i) { var p = P[id], d = Math.pow(p.lat - u.lat, 2) + Math.pow((p.lng - u.lng) * Math.cos(u.lat * Math.PI / 180), 2); if (d < dm) { dm = d; mejor = i; } });
      orden.push(con.splice(mejor, 1)[0]);
    }
    D.editor.paradas = orden.concat(sin); D.editor.sucio = true; pintarPlan(seccion('s-plan')); aviso('Ordenadas por cercanía desde la primera parada');
  };
  D.planGuardar = function (publicar) {
    var E = D.editor;
    if (!E.paradas.length) { aviso('La hoja no tiene paradas'); return; }
    if (publicar && (!E.unidadId || !E.conductor)) { aviso('Para publicar elige la unidad y el conductor'); return; }
    var ci = condLista().filter(function (c) { return c.nombre === E.conductor; })[0];
    S('api_dsoGuardarHoja', PIN, { hojaId: E.hojaId, fecha: E.fecha, rutaId: E.rutaId, nombre: E.nombre, tipo: E.tipo, unidadId: E.unidadId, conductor: E.conductor, ayudantes: E.ayudantes, salida: E.salida, turno: E.turno, relleno: E.relleno, paradas: E.paradas, publicar: !!publicar })
      .then(function (r) { aviso(publicar ? (ci && !ci.usuario ? 'Publicada · ojo: ' + E.conductor + ' no tiene usuario y no la verá en su celular' : 'Publicada: ' + (E.conductor || 'el conductor') + ' ya la ve en su celular') : 'Borrador guardado · el conductor todavía no la ve'); D.editor.hojaId = r.hojaId; D.editor.sucio = false; mostrar('s-plan'); }).catch(falla);
  };
  D.planAnular = function () {
    modal('Anular la hoja ' + D.editor.hojaId, '<p style="margin:0;font-size:14px">La hoja deja de verse en el celular del conductor. Queda en el historial como anulada.</p>',
      '<button class="pl-btn" data-x>Volver</button><button class="pl-btn v" style="background:#B42318" onclick="DSO.planAnularSi()">Anular la hoja</button>');
  };
  D.planAnularSi = function () { S('api_dsoBorrarHoja', PIN, D.editor.hojaId).then(function () { cerrarModal(); aviso('Hoja anulada'); D.editor = null; mostrar('s-plan'); }).catch(falla); };
  D.crearDeFijas = function () {
    var ids = D.dia.rutas.filter(function (r) { return !r.yaTieneHoja; }).map(function (r) { return r.rutaId; });
    S('api_dsoCrearHojas', PIN, D.fecha, ids).then(function (r) { aviso(r.creadas.length + ' hoja(s) creada(s) en borrador'); D.editor = null; mostrar('s-plan'); }).catch(falla);
  };

  /* rutas fijas: la plantilla de cada día que sale */
  D.rutasFijas = function () {
    var B = D.base, U = mapa(B.unidades, 'unidadId');
    var L = B.rutas.length ? '<div class="sv-list">' + B.rutas.map(function (r) {
      return '<div class="it" onclick="DSO.rutaEditar(\'' + e(r.rutaId) + '\')"><div class="tx"><b>' + e(r.nombre) + ' ' + chipTurno(turnoDe(r)) + ' ' + chipTipo(r.tipo) + (r.activa ? '' : ' <span class="sv-chip g">pausada</span>') + '</b><small>' + e(r.rutaId) + ' · ' + diasTxt(r.dias) + ' · sale ' + e(r.salida || '—') + ' · ' + r.paradas.length + ' paradas · ' + e((U[r.unidadId] || {}).nombre || 'sin unidad') + ' · ' + e(r.conductor || 'sin conductor') + '</small></div><span class="sv-chip">Editar</span></div>';
    }).join('') + '</div>' : '<div class="sv-vacio"><b>Todavía no hay rutas fijas</b>Arma una hoja y toca «Guardar como ruta fija», o crea una aquí.</div>';
    modal('Rutas fijas de sólidos', L + '<div class="sv-nota">Una ruta fija es la plantilla de los días que sale: en el planificador, «Crear sus hojas» copia sus paradas, unidad y equipo a la hoja del día.</div>',
      puede() ? '<button class="pl-btn" data-x>Cerrar</button><button class="pl-btn v" onclick="DSO.rutaEditar(\'\')">＋ Ruta fija</button>' : '<button class="pl-btn" data-x>Cerrar</button>');
  };
  D.rutaDesdeHoja = function () { var E = D.editor; D._rutaBorr = { rutaId: '', nombre: E.nombre, tipo: E.tipo, unidadId: E.unidadId, conductor: E.conductor, ayudantes: E.ayudantes.slice(), dias: String(new Date(D.fecha + 'T12:00:00Z').getUTCDay() || 7), salida: E.salida, turno: E.turno, relleno: E.relleno, paradas: E.paradas.slice(), activa: true }; rutaForm(); };
  D.rutaEditar = function (id) {
    var r = D.base.rutas.filter(function (x) { return x.rutaId === id; })[0];
    D._rutaBorr = r ? JSON.parse(JSON.stringify(r)) : { rutaId: '', nombre: '', tipo: 'compactador', unidadId: '', conductor: '', ayudantes: [], dias: '1,2,3,4,5,6,7', salida: '21:30', turno: 'noche', relleno: D.base.ajustes.rellenos[0] || '', paradas: [], activa: true };
    rutaForm();
  };
  function rutaForm() {
    var r = D._rutaBorr, B = D.base, P = mapa(B.puntos, 'puntoId'), C = mapa(B.clientes, 'clienteId');
    var puntos = B.puntos.filter(function (p) { return p.activo; }).sort(function (a, b) { return (r.paradas.indexOf(a.puntoId) + 1 || 999) - (r.paradas.indexOf(b.puntoId) + 1 || 999) || (a.nombre < b.nombre ? -1 : 1); });
    var html = '<div class="dso-f"><label class="w">Nombre<input id="rf-nom" value="' + e(r.nombre) + '" placeholder="Ej. RS-01 · Restaurantes noche"></label>' +
      '<label>Tipo de unidad<select id="rf-tipo">' + Object.keys(TIPOS).map(function (t) { return '<option value="' + t + '"' + (t === r.tipo ? ' selected' : '') + '>' + TIPOS[t][1] + '</option>'; }).join('') + '</select></label>' +
      '<label>Unidad<select id="rf-uni">' + uniOpts(r.unidadId, r.tipo) + '</select></label>' +
      '<label>Conductor<select id="rf-con">' + condOpts(r.conductor) + '</select>' + condNota(r.conductor) + '</label>' +
      '<label>Turno<select id="rf-tur">' + ['dia', 'noche'].map(function (t) { return '<option value="' + t + '"' + (turnoDe(r) === t ? ' selected' : '') + '>' + TURNO[t][0] + ' ' + TURNO[t][1] + '</option>'; }).join('') + '</select></label>' +
      '<label>Salida<input id="rf-sal" type="time" value="' + e(r.salida) + '"></label>' +
      '<label class="w">Días que sale' + diasHtml(r.dias) + '</label>' +
      '<label class="w">Paradas, en orden · marca las que lleva<div id="rf-par" style="max-height:260px;overflow:auto;border:1.5px solid #d3ddea;border-radius:9px;padding:4px 8px;text-transform:none;letter-spacing:0">' +
      (puntos.length ? puntos.map(function (p) { var i = r.paradas.indexOf(p.puntoId); return '<div style="display:flex;gap:8px;align-items:center;padding:5px 0;font-size:13px;font-weight:600;color:#0f2140"><input type="checkbox" data-p="' + e(p.puntoId) + '"' + (i >= 0 ? ' checked' : '') + ' onchange="DSO.rutaMarca(this)"><span style="min-width:22px;font-weight:900;color:#14306b">' + (i >= 0 ? i + 1 : '') + '</span><span>' + e(p.nombre) + ' <small style="color:#667489">' + e((C[p.clienteId] || {}).nombre || '') + '</small></span></div>'; }).join('') : 'No hay puntos todavía.') + '</div></label>' +
      '<label><span><input type="checkbox" id="rf-act"' + (r.activa ? ' checked' : '') + '> Activa</span></label></div>';
    modal(r.rutaId ? 'Ruta fija ' + r.rutaId : 'Ruta fija nueva', html, '<button class="pl-btn" onclick="DSO.rutasFijas()">Volver</button><button class="pl-btn v" onclick="DSO.rutaGuardar()">Guardar</button>');
  }
  D.rutaMarca = function (ck) { var r = D._rutaBorr, id = ck.getAttribute('data-p'), i = r.paradas.indexOf(id); if (ck.checked && i < 0) r.paradas.push(id); if (!ck.checked && i >= 0) r.paradas.splice(i, 1); leerRutaForm(); rutaForm(); };
  function leerRutaForm() { var r = D._rutaBorr; r.nombre = val('rf-nom'); r.tipo = val('rf-tipo'); r.unidadId = val('rf-uni'); r.conductor = val('rf-con'); r.salida = val('rf-sal'); r.turno = val('rf-tur') || turnoDe(r); r.dias = diasSel($i('dso-fondo')); r.activa = !!($i('rf-act') && $i('rf-act').checked); }
  D.rutaGuardar = function () {
    leerRutaForm(); var r = D._rutaBorr;
    S('api_dsoGuardar', PIN, 'ruta', r).then(function () { aviso('Ruta fija guardada'); return recargarBase(); }).then(function () { D.rutasFijas(); if (D.modo === 'sol' && window.INI_TAB === 's-plan') { var s = seccion('s-plan'); S('api_dsoDia', PIN, D.fecha).then(function (d) { D.dia = d; pintarPlan(s); }); } }).catch(falla);
  };

  /* ═══ Mapa de rutas (3.17.2: cabe en una sola pantalla, con herramientas para recorrerlo) ═══ */
  var COLORES = ['#14306b', '#2f9e44', '#d9480f', '#7048e8', '#0c8599', '#c2255c', '#e8590c'];
  PANTALLAS['s-mapa'] = function (s) {
    D.fecha = D.fecha || hoy();
    cargando(s, 'Cargando el mapa…');
    Promise.all([base(), S('api_dsoDia', PIN, D.fecha)]).then(function (r) {
      D.dia = r[1]; var Dd = D.dia;
      if (D.mapaFecha !== D.fecha) { D.mapaSel = -1; D.mapaFecha = D.fecha; }
      if (D.mapaCand == null) D.mapaCand = true;
      var chips = '<button class="' + (D.mapaSel < 0 ? 'on' : '') + '" onclick="DSO.mapaHoja(-1)">Todas</button>' + Dd.hojas.map(function (h, i) {
        return '<button class="' + (D.mapaSel === i ? 'on' : '') + '" onclick="DSO.mapaHoja(' + i + ')"><i style="background:' + COLORES[i % COLORES.length] + '"></i>' + e(h.nombre || h.hojaId) + ' ' + TURNO[turnoDe(h)][0] + '</button>';
      }).join('');
      pintar(s, '<div class="pl-tt"><div><h1>Mapa de rutas · sólidos</h1><div class="sub">' + fLarga(D.fecha) + ' · ' + Dd.hojas.length + ' hoja' + (Dd.hojas.length === 1 ? '' : 's') + '</div></div><span class="sp"></span>' +
        '<button class="pl-btn" onclick="DSO.mapaDia(-1)">◀</button><input type="date" value="' + D.fecha + '" onchange="DSO.mapaIr(this.value)"><button class="pl-btn" onclick="DSO.mapaDia(1)">▶</button></div>' +
        '<div class="sv-mv" id="dso-mv"><div class="sv-mv-lado"><div class="sv-mv-hojas">' + chips + '</div><div class="sv-mv-lista" id="dso-mv-lista"></div></div>' +
        '<div class="sv-mv-mapa" id="dso-mv-mapa"><div id="dso-mapa"></div><div class="sv-mv-bar">' +
        '<button type="button" onclick="DSO.mapaVerTodo()" title="Ver todas las paradas">⤢ Ver todo</button>' +
        (Dd.candidatos.length ? '<button type="button" class="' + (D.mapaCand ? 'on' : '') + '" onclick="DSO.mapaCandidatos()" title="Sucursales a las que les toca y no están en ninguna hoja">Sin hoja · ' + Dd.candidatos.length + '</button>' : '') +
        '<button type="button" onclick="DSO.mapaCompleto()" title="Pantalla completa">⛶ Pantalla completa</button></div>' +
        '<div class="sv-mv-tip" id="dso-mv-tip">Haz clic en el mapa para acercar con la rueda del mouse</div></div></div>' +
        '<div class="sv-ley"><span><i style="background:#2f9e44"></i>Recolectada</span><span><i style="background:#d64045"></i>Con incidencia</span><span><i style="background:#adb5bd"></i>Le toca y no está en ninguna hoja</span><span><i style="background:#F5B301"></i>Donde marcó «Llegué» (GPS)</span><span>El número es el orden de la parada en su hoja · línea roja punteada: «Llegué» a más de ' + D.base.ajustes.distanciaLejos + ' m del punto</span></div>');
      pintarListaMapa();
      setTimeout(function () { altoMapa(); dibujarMapa(); }, 40);
    }).catch(falla);
  };
  D.mapaIr = function (f) { if (f) { D.fecha = f; mostrar('s-mapa'); } };
  D.mapaDia = function (n) { D.mapaIr(masDias(D.fecha, n)); };
  /* el mapa ocupa lo que queda de la pantalla: sin subir ni bajar */
  function altoMapa() {
    var mv = $i('dso-mv'); if (!mv) return;
    var top = mv.getBoundingClientRect().top + (window.scrollY || 0), ley = 54;
    mv.style.setProperty('--mvh', Math.max(420, Math.round(window.innerHeight - top - ley)) + 'px');
    if (D._mapa) D._mapa.invalidateSize();
  }
  window.addEventListener('resize', function () { if (window.INI_TAB === 's-mapa') altoMapa(); });
  function pintarListaMapa() {
    var Dd = D.dia, L = $i('dso-mv-lista'); if (!L) return;
    var h = Dd.hojas.map(function (x, i) {
      if (D.mapaSel >= 0 && D.mapaSel !== i) return '';
      var col = COLORES[i % COLORES.length];
      return '<div class="sv-mv-g">' + e(x.nombre || x.hojaId) + ' · ' + e(x.conductor || 'sin conductor') + '</div>' + x.paradas.map(function (p, j) {
        var c = p.atendida ? '#2f9e44' : p.inc ? '#d64045' : col;
        return '<div class="sv-mv-p' + (p.lat ? '' : ' sin') + '"' + (p.lat ? ' onclick="DSO.mapaParada(' + i + ',' + j + ')"' : ' title="Sin ubicación guardada"') + '><span class="n" style="background:' + c + '">' + (j + 1) + '</span><div class="t"><b>' + e(p.nombre) + '</b><small>' + (p.llegada ? 'llegó ' + e(p.llegada) : p.lat ? (p.horaDesde ? 'recibe ' + e(p.horaDesde) + '–' + e(p.horaHasta) : 'pendiente') : 'sin ubicación') + '</small></div></div>';
      }).join('');
    }).join('');
    if (D.mapaSel < 0 && D.mapaCand && Dd.candidatos.length) h += '<div class="sv-mv-g">Le toca y no está en ninguna hoja</div>' + Dd.candidatos.map(function (p, j) {
      return '<div class="sv-mv-p' + (p.lat ? '' : ' sin') + '"' + (p.lat ? ' onclick="DSO.mapaCandIr(' + j + ')"' : '') + '><span class="n" style="background:#adb5bd">·</span><div class="t"><b>' + e(p.nombre) + '</b><small>' + (p.lat ? 'sin hoja' : 'sin ubicación') + '</small></div></div>';
    }).join('');
    L.innerHTML = h || '<div class="sv-vacio" style="padding:14px 4px"><b>Sin paradas</b>Este día no tiene hojas de ruta.</div>';
  }
  function dibujarMapa() {
    if (typeof L === 'undefined' || !$i('dso-mapa')) { aviso('El mapa no cargó'); return; }
    if (D._mapa) { try { D._mapa.remove(); } catch (er) {} }
    /* acercar en pasos cortos; la rueda solo después de hacer clic en el mapa (así no se descontrola) */
    var m = D._mapa = L.map('dso-mapa', { zoomSnap: 0.25, zoomDelta: 0.5, wheelPxPerZoomLevel: 160, scrollWheelZoom: false }).setView([8.99, -79.52], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
    L.control.scale({ imperial: false }).addTo(m);
    var tip = $i('dso-mv-tip');
    m.on('click', function () { m.scrollWheelZoom.enable(); if (tip) tip.classList.add('no'); });
    m.on('mouseout', function () { m.scrollWheelZoom.disable(); if (tip) tip.classList.remove('no'); });
    D._capas = []; D._mk = []; D._cand = L.layerGroup(); D._candMk = [];
    D.dia.hojas.forEach(function (h, i) {
      var col = COLORES[i % COLORES.length], linea = [], g = L.layerGroup(); D._capas.push(g); D._mk.push([]);
      h.paradas.forEach(function (p, j) {
        if (!p.lat) { D._mk[i].push(null); return; }
        var ll = [p.lat, p.lng]; linea.push(ll);
        var mk = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="sv-num" style="background:' + (p.atendida ? '#2f9e44' : p.inc ? '#d64045' : col) + '">' + (j + 1) + '</div>', iconSize: [24, 24], iconAnchor: [12, 12] }) })
          .bindPopup('<b>' + e(p.nombre) + '</b><br>' + e(h.nombre || h.hojaId) + ' · parada ' + (j + 1) + (p.llegada ? '<br>Llegó ' + e(p.llegada) + (p.dist != null ? ' · a ' + p.dist + ' m' : '') : '') + (p.bolsas ? '<br>' + p.bolsas + ' bolsas' : '') + (p.inc ? '<br>' + e(p.inc) : ''));
        mk.addTo(g); D._mk[i].push(mk);
        if (p.gps && p.gps[0]) {
          L.circleMarker(p.gps, { radius: 5, color: '#8A6300', fillColor: '#F5B301', fillOpacity: 1, weight: 1 }).addTo(g);
          if (p.lejos) L.polyline([ll, p.gps], { color: '#d64045', weight: 2, dashArray: '5 5' }).addTo(g);
        }
      });
      if (linea.length > 1) L.polyline(linea, { color: col, weight: 3, opacity: .7 }).addTo(g);
    });
    D.dia.candidatos.forEach(function (p) { var mk = null; if (p.lat) { mk = L.circleMarker([p.lat, p.lng], { radius: 6, color: '#868e96', fillColor: '#adb5bd', fillOpacity: .9, weight: 1 }).bindPopup('<b>' + e(p.nombre) + '</b><br>Le toca y no está en ninguna hoja'); mk.addTo(D._cand); } D._candMk.push(mk); });
    capasMapa(true);
  }
  function capasMapa(ajustar) {
    var m = D._mapa; if (!m) return;
    D._capas.forEach(function (g, i) { if (D.mapaSel < 0 || D.mapaSel === i) g.addTo(m); else m.removeLayer(g); });
    if (D.mapaSel < 0 && D.mapaCand) D._cand.addTo(m); else m.removeLayer(D._cand);
    if (ajustar) D.mapaVerTodo();
  }
  D.mapaVerTodo = function () {
    var m = D._mapa; if (!m) return; var pts = [];
    D._capas.forEach(function (g, i) { if (D.mapaSel < 0 || D.mapaSel === i) g.eachLayer(function (l) { if (l.getLatLng) pts.push(l.getLatLng()); }); });
    if (D.mapaSel < 0 && D.mapaCand) D._cand.eachLayer(function (l) { pts.push(l.getLatLng()); });
    if (pts.length) m.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 15 });
  };
  D.mapaHoja = function (i) {
    D.mapaSel = i;
    [].forEach.call(document.querySelectorAll('#dso-mv .sv-mv-hojas button'), function (b, k) { b.classList.toggle('on', k === i + 1); });
    pintarListaMapa(); capasMapa(true);
  };
  D.mapaCandidatos = function () { D.mapaCand = !D.mapaCand; mostrar('s-mapa'); };
  D.mapaParada = function (i, j) { var mk = D._mk[i] && D._mk[i][j]; if (!mk || !D._mapa) return; D._mapa.flyTo(mk.getLatLng(), 17, { duration: .6 }); setTimeout(function () { mk.openPopup(); }, 650); };
  D.mapaCandIr = function (j) { var mk = D._candMk[j]; if (!mk || !D._mapa) return; D._mapa.flyTo(mk.getLatLng(), 17, { duration: .6 }); setTimeout(function () { mk.openPopup(); }, 650); };
  D.mapaCompleto = function () {
    var c = $i('dso-mv-mapa'); if (!c) return;
    var fin = function () { setTimeout(function () { if (D._mapa) D._mapa.invalidateSize(); }, 120); };
    if (document.fullscreenElement) { document.exitFullscreen().then(fin, fin); return; }
    if (c.classList.contains('full')) { c.classList.remove('full'); fin(); return; }
    if (c.requestFullscreen) c.requestFullscreen().then(fin, function () { c.classList.add('full'); fin(); }); else { c.classList.add('full'); fin(); }
  };
  document.addEventListener('fullscreenchange', function () { if (D._mapa) setTimeout(function () { D._mapa.invalidateSize(); }, 120); });

  /* ═══ Calendario ═══ */
  PANTALLAS['s-agenda'] = function (s) {
    var h0 = hoy(), d = new Date(h0 + 'T12:00:00Z'), lunes = masDias(h0, -((d.getUTCDay() + 6) % 7));
    D.calDesde = D.calDesde || lunes;
    cargando(s, 'Cargando el calendario…');
    S('api_dsoCalendario', PIN, D.calDesde, 28).then(function (r) {
      var cab = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map(function (x) { return '<div class="h">' + x + '</div>'; }).join('');
      var dias = r.dias.map(function (x) {
        var dd = new Date(x.fecha + 'T12:00:00Z');
        return '<div class="d' + (x.fecha === h0 ? ' hoy' : '') + '" onclick="DSO.irPlan(\'' + x.fecha + '\')"><b class="n">' + DIAS[dd.getUTCDay()] + ' ' + dd.getUTCDate() + (dd.getUTCDate() === 1 || x === r.dias[0] ? ' ' + MESES[dd.getUTCMonth()] : '') + '</b>' +
          x.hojas.map(function (h) { return '<span class="' + (h.estado === 'cerrada' ? 'v' : h.estado === 'borrador' ? 'b' : '') + '" title="' + e(h.nombre + ' · ' + (EST[h.estado] || [0, h.estado])[1]) + '">' + e(h.nombre || h.hojaId) + (h.estado === 'cerrada' ? ' · ' + h.atendidas + '/' + h.paradas : '') + '</span>'; }).join('') +
          x.fijas.map(function (f) { return '<span class="f" title="Ruta fija sin hoja todavía">' + e(f.nombre) + '</span>'; }).join('') + '</div>';
      }).join('');
      pintar(s, '<div class="pl-tt"><div><h1>Calendario · sólidos</h1><div class="sub">Cuatro semanas · toca un día para planificarlo</div></div><span class="sp"></span>' +
        '<button class="pl-btn" onclick="DSO.calMover(-7)">◀</button><button class="pl-btn" onclick="DSO.calMover(0)">Hoy</button><button class="pl-btn" onclick="DSO.calMover(7)">▶</button></div>' +
        '<div class="sv-ley"><span><i style="background:#E8F0FA;border:1px solid #1b4a86"></i>Hoja publicada o en ruta</span><span><i style="background:#eef1f5"></i>Borrador</span><span><i style="background:#E7F3DD"></i>Cerrada</span><span><i style="background:#fff;border:1px dashed #5b6a80"></i>Ruta fija sin hoja todavía</span></div>' +
        '<div class="sv-cal">' + cab + dias + '</div>');
    }).catch(falla);
  };
  D.calMover = function (n) { if (!n) D.calDesde = null; else D.calDesde = masDias(D.calDesde, n); mostrar('s-agenda'); };

  /* ═══ Salidas y hojas de ruta ═══ */
  PANTALLAS['s-salidas'] = function (s) {
    D.fecha = D.fecha || hoy();
    cargando(s, 'Cargando las hojas…');
    Promise.all([base(), S('api_dsoDia', PIN, D.fecha)]).then(function (r) {
      D.dia = r[1];
      var hs = D.dia.hojas.filter(function (h) { return h.estado !== 'anulada'; });
      if (!hs.some(function (h) { return h.hojaId === D.hojaSel; })) { var pf = hs.filter(function (h) { return h.estado === 'por_firmar'; })[0]; D.hojaSel = (pf || hs[0] || {}).hojaId || null; }
      if (!D.hojaSel) { D.det = null; pintarSalidas(s); return; }
      return S('api_dsoHoja', PIN, D.hojaSel).then(function (d) { D.det = d; pintarSalidas(s); });
    }).catch(falla);
  };
  D.salSel = function (id) { D.hojaSel = id; mostrar('s-salidas'); };
  D.salIr = function (f) { if (f) { D.fecha = f; D.hojaSel = null; mostrar('s-salidas'); } };
  function pintarSalidas(s) {
    var hs = D.dia.hojas.filter(function (h) { return h.estado !== 'anulada'; }), pf = hs.filter(function (h) { return h.estado === 'por_firmar'; }).length;
    var izq = '<div class="pl-card sv-pad"><div class="pl-ch" style="padding:0 0 6px"><h3>Hojas del ' + fCorta(D.fecha) + '</h3></div>' +
      (hs.length ? '<div class="sv-list">' + hs.map(function (h) {
        return '<div class="it' + (h.hojaId === D.hojaSel ? ' sel' : '') + '" onclick="DSO.salSel(\'' + e(h.hojaId) + '\')"><div class="tx"><b>' + e(h.nombre || h.hojaId) + ' · ' + (TIPOS[h.tipo] || TIPOS.compactador)[1] + ' ' + e(h.unidad) + '</b><small>' + e(h.hojaId) + ' · ' + e(h.conductor || 'sin conductor') + (h.ayudantes.length ? ' + ' + h.ayudantes.length + ' ayudante(s)' : '') + ' · ' + h.atendidas + '/' + h.paradas.length + '</small></div>' + chipEst(h.estado) + '</div>';
      }).join('') + '</div>' : '<div class="sv-vacio"><b>No hay hojas este día</b>Se arman en «Planificar rutas».</div>') +
      '<div class="sv-nota">El orden: <b>el conductor hace la revisión</b> en su celular → <b>si está bien, la ruta sale sola</b> (con una falla, o si falta alguien o su EPP, decides tú) → ruta → <b>descarga</b> → regreso y cierre.</div></div>';
    var h = '<div class="cr-tt"><div><h1>Salidas y hojas de ruta</h1><div class="sub">' + fLarga(D.fecha) + ' · ' + hs.length + ' hoja' + (hs.length === 1 ? '' : 's') + (pf ? ' · ' + pf + ' espera' + (pf > 1 ? 'n' : '') + ' tu firma' : '') + '</div></div><span class="sp"></span>' +
      '<button class="pl-btn" onclick="DSO.salIr(\'' + masDias(D.fecha, -1) + '\')">◀</button><input type="date" value="' + D.fecha + '" onchange="DSO.salIr(this.value)" style="border:1.5px solid var(--ini-linea);border-radius:10px;padding:7px 10px;font-family:inherit;font-weight:800;color:var(--ini-navy)"><button class="pl-btn" onclick="DSO.salIr(\'' + masDias(D.fecha, 1) + '\')">▶</button>' +
      (D.det ? '<button class="pl-btn" onclick="DSO.imprimirHoja()">🖨️ Imprimir hoja</button>' : '') + '</div>' +
      '<div class="sv-g21">' + izq + (D.det ? hojaDetalle(D.det) : '<div></div>') + '</div>';
    pintar(s, h);
    if (D.det && D.det.hoja.estado === 'por_firmar' && D.det.puedeFirmar) prepararFirma();
  }
  function hojaDetalle(d) {
    var h = d.hoja, rv = h.revision, fi = h.firma, ci = h.cierre, B = D.base, EQ = mapa(B.equipo, 'personaId');
    var ayud = (h.ayudantes || []).map(function (id) { return (EQ[id] || {}).nombre || id; });
    var est = h.estado;
    var paso = function (c, b, t) { return '<div class="p ' + c + '"><b>' + b + '</b><span>' + t + '</span></div>'; };
    var tl = paso(rv ? (rv.fallas ? 'mal' : 'ok') : (est === 'publicada' ? 'on' : 'no'), 'Revisión del camión', rv ? e(rv.por) + ' · ' + e(String(rv.en).slice(11)) + ' · ' + (rv.items.length - rv.fallas) + ' de ' + rv.items.length + ' bien · odómetro ' + N(rv.odometro) + (rv.tanque ? ' · tanque ' + e(rv.tanque) : '') : 'pendiente · la hace el conductor en su celular') +
      paso(rv ? 'ok' : 'no', 'Equipo presente', rv && rv.equipo && rv.equipo.length ? e(rv.equipo.map(function (q) { return q.nombre + (q.presente ? (q.epp ? '' : ' (sin EPP)') : ' (no vino)'); }).join(' · ')) : (ayud.length ? e(ayud.join(' · ')) : 'sin ayudantes')) +
      paso(fi ? (fi.decision === 'sale' ? 'ok' : 'mal') : (est === 'por_firmar' ? 'on' : 'no'), fi && fi.decision === 'no_sale' ? 'No sale' : fi && fi.por === 'Salida automática' ? 'Salida automática' : 'Salida firmada', fi ? e(fi.por === 'Salida automática' ? 'Revisión sin fallas' : fi.por) + ' · ' + e(String(fi.en).slice(11)) + (fi.nota ? ' · ' + e(fi.nota) : '') : (est === 'por_firmar' ? 'La revisión trae una falla o falta alguien: decide tú' : 'sale sola si la revisión llega bien')) +
      paso(est === 'cerrada' ? 'ok' : est === 'en_ruta' ? 'on' : 'no', 'En ruta · ' + h.paradas.length + ' paradas', h.atendidas + ' de ' + h.paradas.length + ' hechas' + (h.bolsas ? ' · ' + N(h.bolsas) + ' bolsas' : '') + (h.paradas.filter(function (p) { return p.inc; }).length ? ' · ' + h.paradas.filter(function (p) { return p.inc; }).length + ' incidencia(s)' : '')) +
      paso(h.viajes.length ? (h.sinTicket ? 'mal' : 'ok') : 'no', 'Descarga', h.viajes.length ? h.viajes.map(function (v) { return v.planta ? e(v.relleno || 'Planta') + ' · ' + N(v.bolsas) + ' bolsas · ' + (Number(v.neto) > 0 ? N(v.neto) + ' kg' : 'peso por llegar') : 'Ticket ' + e(v.ticket) + ' · ' + N(v.neto) + ' kg'; }).join(' · ') + (h.sinTicket ? ' · faltan ' + h.sinTicket + ' parada(s) sin ticket' : '') : 'pendiente') +
      paso(ci ? 'ok' : 'no', 'Regreso y cierre', ci ? e(ci.hora) + ' · odómetro ' + N(ci.odometro) + (ci.km != null ? ' (' + N(ci.km) + ' km)' : '') + (ci.tanque ? ' · tanque ' + e(ci.tanque) : '') + (ci.queda ? ' · ' + e(ci.queda) : '') : 'pendiente');
    var ck = rv ? rv.items.map(function (x) { return '<div class="sv-ck"><span>' + e(x.texto) + '</span>' + (x.estado === 'm' ? '<span class="sv-no">✕ falla</span>' : '<span class="sv-ok">✓ bien</span>') + '</div>'; }).join('') + (rv.nota ? '<div class="sv-nota am">' + e(rv.nota) + '</div>' : '')
      : (d.lista || []).map(function (x) { return '<div class="sv-ck"><span>' + e(x) + '</span><span style="color:#8a96a8;font-size:12px">pendiente</span></div>'; }).join('');
    var firma = '';
    if (est === 'por_firmar' && d.puedeFirmar) firma = '<div class="sv-h">Da la salida</div><div class="sv-firma" id="dso-firma"><canvas></canvas><small>Firme aquí con el dedo o el mouse</small></div>' +
      '<div class="sv-btns"><button class="pl-btn" onclick="DSO.firmaBorrar()">Borrar</button><button class="pl-btn" onclick="DSO.noSale()">No sale · avisar al conductor</button><button class="pl-btn v" onclick="DSO.firmar()">✓ Firmar y dar la salida</button></div>';
    else if (fi && fi.imagen) firma = '<div class="sv-h">Salida</div><div class="sv-firma"><img src="' + e(fi.imagen) + '" alt="Firma"><small>' + e(fi.por) + ' · ' + e(fi.cargo || '') + ' · ' + e(fi.en) + '</small></div>';
    else if (est === 'publicada') firma = '<div class="sv-nota">Cuando el conductor envíe la revisión del camión, aquí aparece para que firmes la salida.</div>';
    var fotosDe = function (ids) { return (ids || []).map(function (id, k) { return '<button class="sv-chip v" style="border:0;cursor:pointer" onclick="DSO.verFoto(\'' + e(id) + '\')">📷 ' + (k + 1) + '</button>'; }).join(' '); };
    var filas = h.paradas.map(function (p, i) {
      var ev = p.llegada ? (p.inc ? '<span class="sv-chip r">' + e(p.inc) + '</span> ' : '') + fotosDe(p.fotos) + (p.recibe === 'encargado' ? ' <span class="sv-chip">✍ ' + e(p.recibeNombre) + '</span>' : p.recibe === 'nadie' ? ' <span class="sv-chip g">sin encargado</span>' : '') + ((p.otro || []).length ? ' <span class="sv-chip ro">+ ' + e(vvOtro(p)) + '</span>' : '') : '';
      var qu = p.servicio === 'caja' ? (p.cajaLevanta ? 'levantó ' + e(p.cajaLevanta) : '') + (p.cajaDeja ? (p.cajaLevanta ? ' · ' : '') + 'dejó ' + e(p.cajaDeja) : '') : (p.llegada ? N(p.bolsas) : '');
      return '<tr><td>' + (i + 1) + '</td><td><b>' + e(p.nombre) + '</b><small>' + (p.horaDesde ? 'recibe ' + e(p.horaDesde) + '–' + e(p.horaHasta) : e(p.direccion)) + '</small></td>' +
        '<td class="n"' + (p.fueraHorario ? ' style="color:#B42318;font-weight:900"' : '') + '>' + e(p.llegada || '—') + '</td><td class="n">' + e(p.salida || '') + '</td><td class="n">' + (p.llegada && p.salida ? dur(p.llegada, p.salida) : '') + '</td>' +
        '<td class="n">' + (p.dist != null ? '<span class="' + (p.lejos ? 'sv-no' : '') + '">' + N(p.dist) + ' m</span>' : (p.llegada ? '<small>sin GPS</small>' : '')) + '</td><td class="n">' + qu + '</td><td class="n">' + (p.kg ? N(p.kg) : '') + '</td><td>' + ev + '</td></tr>';
    }).join('');
    var tk = h.viajes.map(function (v, n) { return '<tr><td><b>' + e(v.ticket) + '</b><small>viaje ' + (n + 1) + '</small></td><td class="n">' + e(v.llegada || '') + '</td><td class="n">' + e(v.salida || '') + '</td><td class="n">' + (v.lleno ? N(v.lleno) : '') + '</td><td class="n">' + (v.vacio ? N(v.vacio) : '') + '</td><td class="n"><b>' + N(v.neto) + '</b></td><td>' + (v.foto ? fotosDe([v.foto]) : '') + '</td></tr>'; }).join('');
    return '<div class="pl-card sv-pad"><div class="pl-ch" style="padding:0 0 8px"><h3>Hoja de ruta ' + e(h.hojaId) + ' · ' + e(h.nombre) + '</h3>' + chipEst(est) + '</div>' +
      '<div class="sv-g2" style="font-size:13px"><div><div class="sv-h" style="margin-top:4px">Unidad y equipo</div><div class="sv-ck"><span>Unidad</span><b>' + e(h.unidad || '—') + ' · ' + (TIPOS[h.tipo] || TIPOS.compactador)[1] + (h.placa ? ' · ' + e(h.placa) : '') + '</b></div><div class="sv-ck"><span>Conductor</span><b>' + e(h.conductor || '—') + '</b></div>' +
      '<div class="sv-ck"><span>Ayudantes</span><b>' + e(ayud.join(' · ') || '—') + '</b></div><div class="sv-ck"><span>Sale</span><b>' + e(h.salida || '—') + '</b></div><div class="sv-ck"><span>Relleno</span><b>' + e(h.relleno || '—') + '</b></div></div>' +
      '<div><div class="sv-h" style="margin-top:4px">Así va</div><div class="sv-tl">' + tl + '</div></div></div>' +
      '<div class="sv-h">Revisión del camión · la hace el conductor desde su celular</div>' + ck + firma +
      '<div class="sv-h">Paradas · «✓ Llegué» anota la hora y el GPS; «Listo», la salida</div><div class="sv-scroll"><table class="sv-tb"><thead><tr><th>#</th><th>Punto de recolección</th><th class="n">Llegó</th><th class="n">Salió</th><th class="n">En el punto</th><th class="n">GPS vs. punto</th><th class="n">' + (h.tipo === 'rolloff' ? 'Caja' : 'Bolsas') + '</th><th class="n">Kg</th><th>Evidencia</th></tr></thead><tbody>' + filas + '</tbody></table></div>' +
      (tk ? '<div class="sv-h">Tickets del relleno</div><div class="sv-scroll"><table class="sv-tb"><thead><tr><th>Ticket</th><th class="n">Llegó</th><th class="n">Salió</th><th class="n">Lleno</th><th class="n">Vacío</th><th class="n">Neto kg</th><th>Foto</th></tr></thead><tbody>' + tk + '</tbody></table></div>' : '') +
      '<div class="sv-btns">' + (['borrador', 'publicada'].indexOf(est) >= 0 && puede() ? '<button class="pl-btn" onclick="DSO.irPlanHoja(\'' + e(h.hojaId) + '\',\'' + h.fecha + '\')">Editar en el planificador</button>' : '') +
      (h.atendidas || h.paradas.some(function (p) { return p.llegada; }) ? '<button class="pl-btn" onclick="DSO.enlaces(\'' + e(h.hojaId) + '\')">🔗 Recibos para el cliente</button>' : '') + '</div>' +
      (est === 'cerrada' ? '<div class="sv-nota">Esta hoja queda como el documento de trabajo de la ruta: revisión, salida firmada, paradas, ticket del relleno y regreso.</div>' : '') +
      '<div class="sv-nota">Llegada a más de ' + h.distanciaLejos + ' m del punto guardado: sale en rojo. Llegada fuera de la hora en que el local recibe: la hora sale en rojo.</div></div>';
  }
  D.irPlanHoja = function (id, f) { D.fecha = f; D.editor = null; mostrar('s-plan'); setTimeout(function () { if (D.dia && D.dia.hojas.some(function (x) { return x.hojaId === id; })) D.elegirHoja(id); }, 900); };
  D.verFoto = function (id) {
    var w = window.open('', '_blank');
    S('api_dsoFoto', PIN, id).then(function (r) { if (w) w.location.href = r.url; else location.href = r.url; }).catch(function (er) { if (w) w.close(); falla(er); });
  };
  /* firma con el dedo o el mouse */
  function prepararFirma() {
    var caja = $i('dso-firma'); if (!caja) return;
    var cv = caja.querySelector('canvas'), r = caja.getBoundingClientRect(), k = window.devicePixelRatio || 1;
    cv.width = r.width * k; cv.height = r.height * k;
    var cx = cv.getContext('2d'); cx.scale(k, k); cx.lineWidth = 2.4; cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.strokeStyle = '#0f2140';
    var dib = false, trazos = 0, pos = function (ev) { var b = cv.getBoundingClientRect(); return [ev.clientX - b.left, ev.clientY - b.top]; };
    cv.onpointerdown = function (ev) { dib = true; trazos++; var p = pos(ev); cx.beginPath(); cx.moveTo(p[0], p[1]); cv.setPointerCapture(ev.pointerId); ev.preventDefault(); };
    cv.onpointermove = function (ev) { if (!dib) return; var p = pos(ev); cx.lineTo(p[0], p[1]); cx.stroke(); };
    cv.onpointerup = cv.onpointercancel = function () { dib = false; };
    D._firma = { cv: cv, n: function () { return trazos; }, borrar: function () { cx.clearRect(0, 0, cv.width, cv.height); trazos = 0; } };
  }
  D.firmaBorrar = function () { if (D._firma) D._firma.borrar(); };
  D.firmar = function () {
    var f = D._firma; if (!f || !f.n()) { aviso('Falta tu firma'); return; }
    var c2 = document.createElement('canvas'); c2.width = 600; c2.height = Math.round(600 * f.cv.height / f.cv.width);
    var x = c2.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c2.width, c2.height); x.drawImage(f.cv, 0, 0, c2.width, c2.height);
    S('api_dsoFirmarSalida', PIN, D.hojaSel, c2.toDataURL('image/jpeg', .7), 'sale').then(function () { aviso('Salida firmada: el conductor ya puede salir'); mostrar('s-salidas'); }).catch(falla);
  };
  D.noSale = function () {
    modal('No sale esta hoja', '<div class="dso-f"><label class="w">¿Por qué no sale? Lo lee el conductor<textarea id="ns-nota" placeholder="Ej. La falla del brazo no deja salir; mañana va a taller."></textarea></label></div>',
      '<button class="pl-btn" data-x>Volver</button><button class="pl-btn v" style="background:#B42318" onclick="DSO.noSaleSi()">Avisar: no sale</button>');
  };
  D.noSaleSi = function () { S('api_dsoFirmarSalida', PIN, D.hojaSel, '', 'no_sale', val('ns-nota')).then(function () { cerrarModal(); aviso('Listo: el conductor ve que no sale'); mostrar('s-salidas'); }).catch(falla); };
  D.enlaces = function (id) {
    S('api_dsoEnlaces', PIN, id).then(function (r) {
      var raiz = location.href.replace(/[^/]*([?#].*)?$/, '');
      D._enl = r.recibos.map(function (x) { return Object.assign({}, x, { url: raiz + x.url }); });
      modal('Recibos para el cliente', '<div class="sv-list">' + D._enl.map(function (x, i) {
        return '<div class="it" style="cursor:default"><div class="tx"><b>' + e(x.punto) + '</b><small>' + e(x.cliente) + '</small><small style="word-break:break-all">' + e(x.url) + '</small></div><button class="pl-btn" onclick="DSO.copiar(' + i + ')">Copiar</button></div>';
      }).join('') + '</div><div class="sv-nota">Cada enlace lleva una clave y muestra solo el recibo de esa visita: hora, bolsas o caja y peso. El reporte del mes sale en Cobros › Para facturar.</div>', '<button class="pl-btn" data-x>Cerrar</button>');
    }).catch(falla);
  };
  D.copiar = function (i) {
    var t = D._enl[i].url;
    var fin = function () { aviso('Enlace copiado'); };
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(fin, function () { prompt('Copia el enlace', t); }); else prompt('Copia el enlace', t);
  };
  D.imprimirHoja = function () {
    var d = D.det; if (!d) return;
    var h = d.hoja, EQ = mapa(D.base.equipo, 'personaId');
    var div = $i('dso-imp'); if (!div) { div = document.createElement('div'); div.id = 'dso-imp'; document.body.appendChild(div); }
    var t = function (r) { return '<tr>' + r.map(function (c) { return '<td style="border:1px solid #999;padding:4px 6px">' + c + '</td>'; }).join('') + '</tr>'; };
    div.innerHTML = '<h2 style="margin:0">ECOVSA · Hoja de ruta de desechos sólidos ' + e(h.hojaId) + '</h2><p>' + fLarga(h.fecha) + ' · ' + e(h.nombre) + ' · ' + (TIPOS[h.tipo] || TIPOS.compactador)[1] + ' ' + e(h.unidad) + ' ' + e(h.placa) + '<br>Conductor: ' + e(h.conductor) + ' · Ayudantes: ' + e((h.ayudantes || []).map(function (id) { return (EQ[id] || {}).nombre || id; }).join(', ') || '—') + ' · Relleno: ' + e(h.relleno) + '</p>' +
      (h.revision ? '<p><b>Revisión:</b> ' + e(h.revision.por) + ' · ' + e(h.revision.en) + ' · ' + (h.revision.items.length - h.revision.fallas) + '/' + h.revision.items.length + ' bien · odómetro ' + N(h.revision.odometro) + (h.revision.fallas ? ' · fallas: ' + e(h.revision.items.filter(function (i) { return i.estado === 'm'; }).map(function (i) { return i.texto; }).join(', ')) : '') + '</p>' : '') +
      (h.firma ? '<p><b>Salida:</b> ' + (h.firma.decision === 'sale' ? 'firmada por ' + e(h.firma.por) + ' · ' + e(h.firma.en) : 'NO SALE · ' + e(h.firma.nota)) + '</p>' + (h.firma.imagen ? '<img src="' + e(h.firma.imagen) + '" style="height:60px">' : '') : '') +
      '<table style="border-collapse:collapse;width:100%;font-size:12px">' + t(['#', 'Punto', 'Llegó', 'Salió', 'GPS', 'Bolsas / caja', 'Kg', 'Incidencia']) + h.paradas.map(function (p, i) { return t([i + 1, e(p.nombre), e(p.llegada || ''), e(p.salida || ''), p.dist != null ? p.dist + ' m' : '', p.servicio === 'caja' ? e((p.cajaLevanta || '') + (p.cajaDeja ? ' / dejó ' + p.cajaDeja : '')) : (p.llegada ? p.bolsas : ''), p.kg ? N(p.kg) : '', e(p.inc || '')]); }).join('') + '</table>' +
      (h.viajes.length ? '<p><b>Tickets:</b> ' + h.viajes.map(function (v) { return e(v.ticket) + ' · ' + N(v.neto) + ' kg'; }).join(' · ') + '</p>' : '') +
      (h.cierre ? '<p><b>Cierre:</b> ' + e(h.cierre.hora) + ' · odómetro ' + N(h.cierre.odometro) + (h.cierre.km != null ? ' · ' + h.cierre.km + ' km' : '') + ' · ' + e(h.cierre.queda || '') + '</p>' : '');
    document.body.classList.add('dso-imp');
    setTimeout(function () { window.print(); setTimeout(function () { document.body.classList.remove('dso-imp'); }, 400); }, 50);
  };

  /* ═══ Cierre de rutas ═══ */
  PANTALLAS['s-cierre'] = function (s) {
    D.cieHasta = D.cieHasta || hoy(); D.cieDesde = D.cieDesde || masDias(D.cieHasta, -6);
    cargando(s, 'Cargando las rutas…');
    S('api_dsoHojas', PIN, D.cieDesde, D.cieHasta).then(function (r) {
      var F = r.filas, tot = F.reduce(function (a, f) { a.p += f.paradas; a.a += f.atendidas; a.b += f.bolsas; a.c += f.cajas; a.k += f.neto; a.km += f.km || 0; a.t += f.tickets; return a; }, { p: 0, a: 0, b: 0, c: 0, k: 0, km: 0, t: 0 });
      var filas = F.map(function (f) {
        return '<tr class="clic" onclick="DSO.irHoja(\'' + e(f.hojaId) + '\',\'' + f.fecha + '\')"><td>' + fCorta(f.fecha) + '</td><td><b>' + e(f.nombre) + '</b><small>' + e(f.hojaId) + ' · ' + (TIPOS[f.tipo] || TIPOS.compactador)[1] + ' ' + e(f.unidad) + '</small></td><td>' + e(f.conductor) + '</td>' +
          '<td class="n">' + f.atendidas + '/' + f.paradas + (f.incidencias ? '<small>' + f.incidencias + ' incidencia(s)</small>' : '') + '</td><td class="n">' + (f.bolsas ? N(f.bolsas) : '') + (f.cajas ? '<small>' + f.cajas + ' caja(s)</small>' : '') + '</td>' +
          '<td class="n">' + (f.neto ? N(f.neto) : (f.sinTicket ? '<span class="sv-chip r">falta ticket</span>' : '')) + '</td><td class="n">' + e(f.salida) + '</td><td class="n">' + e(f.regreso) + '</td><td class="n">' + (f.km != null ? N(f.km) : '') + '</td><td>' + chipEst(f.estado) + (f.lejos ? ' <span class="sv-chip ro">' + f.lejos + ' lejos</span>' : '') + '</td></tr>';
      }).join('');
      pintar(s, '<div class="cr-tt"><div><h1>Cierre de rutas · sólidos</h1><div class="sub">Lo que pasó en cada ruta: paradas, bolsas, peso en báscula y kilómetros</div></div><span class="sp"></span>' +
        '<input type="date" value="' + D.cieDesde + '" onchange="DSO.cieRango(this.value,null)" style="border:1.5px solid var(--ini-linea);border-radius:10px;padding:7px 10px;font-family:inherit;font-weight:800"> a <input type="date" value="' + D.cieHasta + '" onchange="DSO.cieRango(null,this.value)" style="border:1.5px solid var(--ini-linea);border-radius:10px;padding:7px 10px;font-family:inherit;font-weight:800"></div>' +
        '<div class="pl-card sv-scroll">' + (F.length ? '<table class="sv-tb"><thead><tr><th>Fecha</th><th>Ruta</th><th>Conductor</th><th class="n">Paradas</th><th class="n">Bolsas</th><th class="n">Kg báscula</th><th class="n">Salió</th><th class="n">Regresó</th><th class="n">Km</th><th>Estado</th></tr></thead><tbody>' + filas +
          '<tr class="tot"><td></td><td>Total · ' + F.length + ' hoja(s)</td><td></td><td class="n">' + tot.a + '/' + tot.p + '</td><td class="n">' + N(tot.b) + '</td><td class="n">' + N(tot.k) + '</td><td></td><td></td><td class="n">' + N(tot.km) + '</td><td></td></tr></tbody></table>' : '<div class="sv-vacio"><b>No hay rutas en esas fechas</b></div>') + '</div>');
    }).catch(falla);
  };
  D.cieRango = function (a, b) { if (a) D.cieDesde = a; if (b) D.cieHasta = b; mostrar('s-cierre'); };

  /* ═══ Clientes de sólidos ═══ */
  function cobroTxt(c) {
    var b = c || {}, p = [];
    if (b.cuotaSucursal) p.push('B/. ' + N(b.cuotaSucursal, 2) + ' por sucursal al mes');
    if (b.porVisita) p.push('B/. ' + N(b.porVisita, 2) + ' por visita');
    if (b.porCaja) p.push('B/. ' + N(b.porCaja, 2) + ' por caja');
    if (b.porTonelada) p.push('B/. ' + N(b.porTonelada, 2) + ' por tonelada');
    if (b.minimoMes) p.push('mínimo B/. ' + N(b.minimoMes, 2) + ' al mes');
    return p.join(' + ') || 'Sin tarifa todavía';
  }
  PANTALLAS['s-cli'] = function (s) {
    cargando(s, 'Cargando los clientes…');
    recargarBase().then(function () { pintarClientes(s); }).catch(falla);
  };
  function pintarClientes(s) {
    var B = D.base, ESTC = { prueba: ['ro', 'En prueba'], activo: ['v', 'Activo'], pausa: ['g', 'En pausa'], baja: ['r', 'De baja'] };
    var filas = B.clientes.map(function (c) {
      var pts = B.puntos.filter(function (p) { return p.clienteId === c.clienteId; }), act = pts.filter(function (p) { return p.activo; });
      var tipos = []; act.forEach(function (p) { if (tipos.indexOf(p.unidadTipo) < 0) tipos.push(p.unidadTipo); });
      var serv = []; act.forEach(function (p) { if (serv.indexOf(SERV[p.servicio]) < 0) serv.push(SERV[p.servicio]); });
      var fr = []; act.forEach(function (p) { var t = diasTxt(p.dias); if (fr.indexOf(t) < 0) fr.push(t); });
      var pend = pts.filter(function (p) { return p.ubicPendiente; }).length, es = ESTC[c.estado] || ['g', c.estado], npz = pts.length - act.length;
      return '<tr class="clic' + (c.clienteId === D.cliSel ? ' sel' : '') + '" onclick="DSO.cliVer(\'' + e(c.clienteId) + '\')"><td><b>' + e(c.nombre) + '</b><small>' + act.length + ' sucursal' + (act.length === 1 ? '' : 'es') + ' en servicio' + (npz ? ' · <span class="sv-no">' + npz + ' pausada' + (npz > 1 ? 's' : '') + '</span>' : '') + (pend ? ' · <span class="sv-no">' + pend + ' ubicación por revisar</span>' : '') + '</small></td><td>' + tipos.map(chipTipo).join(' ') + '</td><td>' + e(serv.join(', ')) + '</td><td>' + e(fr.length > 1 ? 'Varía por punto' : fr[0] || '—') + '</td><td><small style="color:#0f2140">' + e(cobroTxt(c.cobro)) + '</small></td><td><span class="sv-chip ' + es[0] + '">' + es[1] + '</span></td></tr>';
    }).join('');
    var det = '';
    var c = B.clientes.filter(function (x) { return x.clienteId === D.cliSel; })[0];
    if (c) {
      var pts = B.puntos.filter(function (p) { return p.clienteId === c.clienteId; });
      det = '<div class="pl-card sv-pad" style="margin-top:14px"><div class="pl-ch" style="padding:0 0 8px"><h3>' + e(c.nombre) + ' · ' + e(c.clienteId) + '</h3>' + (puede() ? '<div style="display:flex;gap:8px"><button class="pl-btn" onclick="DSO.cliForm(\'' + e(c.clienteId) + '\')">Editar cliente</button><button class="pl-btn v" onclick="DSO.puntoForm(\'\',\'' + e(c.clienteId) + '\')">＋ Sucursal</button></div>' : '') + '</div>' +
        '<div class="sv-g2" style="font-size:13px"><div><div class="sv-ck"><span>Razón social</span><b>' + e(c.razonSocial || '—') + '</b></div><div class="sv-ck"><span>RUC</span><b>' + e(c.ruc || '—') + '</b></div><div class="sv-ck"><span>Contacto</span><b>' + e([c.contacto, c.telefono].filter(Boolean).join(' · ') || '—') + '</b></div><div class="sv-ck"><span>Correo</span><b>' + e(c.correo || '—') + '</b></div></div>' +
        '<div><div class="sv-ck"><span>Plan vendido</span><b style="text-align:right">' + e(cobroTxt(c.cobro)) + '</b></div><div class="sv-ck"><span>ITBMS</span><b>' + (c.retieneItbms === 'EXENTO' ? 'Exento' : c.retieneItbms === 'SI' ? '7 % · agente retenedor' : '7 %') + '</b></div>' + (c.notas ? '<div class="sv-nota">' + e(c.notas) + '</div>' : '') + '</div></div>' +
        '<div class="sv-h">Sucursales · puntos de recolección</div><div class="sv-scroll"><table class="sv-tb"><thead><tr><th>Sucursal</th><th>Estado</th><th>Servicio</th><th>Días</th><th>Recibe</th><th>Ubicación</th><th></th></tr></thead><tbody>' +
        (pts.length ? pts.map(function (p) {
          var est = p.activo ? '<span class="sv-chip v">● En servicio</span>' + (puede() ? '<br><button class="pl-btn sv-pz" onclick="DSO.pausar(\'' + e(p.puntoId) + '\')">Pausar…</button>' : '')
            : '<span class="sv-chip g">⏸ Pausada</span><small>' + (p.pausaDesde ? 'desde ' + e(fCorta(p.pausaDesde)) : '') + (p.pausaMotivo ? ' · ' + e(p.pausaMotivo) : '') + '</small>' + (puede() ? '<button class="pl-btn v sv-pz" onclick="DSO.puntoEstado(\'' + e(p.puntoId) + '\',true)">Poner en servicio</button>' : '');
          return '<tr' + (p.activo ? '' : ' style="background:#fafbfc"') + '><td><b>' + e(p.nombre) + '</b><small>' + e(p.direccion) + (p.nota ? ' · ' + e(p.nota) : '') + '</small></td><td>' + est + '</td><td>' + chipTipo(p.unidadTipo) + ' <small>' + e(SERV[p.servicio]) + (p.cajaId ? ' · caja ' + e(p.cajaId) : '') + '</small></td><td>' + diasLetras(p.dias) + '</td><td>' + (p.horaDesde ? e(p.horaDesde) + '–' + e(p.horaHasta) : '—') + '</td>' +
            '<td>' + (p.lat ? '<span class="sv-ok">✓ guardada</span>' : '<span class="sv-no">sin ubicación</span>') + (p.ubicPendiente ? '<small class="sv-no">El conductor mandó otra desde la puerta (' + e(p.ubicPendiente.por || '') + ')</small>' + (puede() ? '<button class="pl-btn" onclick="DSO.ubic(\'' + e(p.puntoId) + '\',true)">Aprobar</button> <button class="pl-btn" onclick="DSO.ubic(\'' + e(p.puntoId) + '\',false)">Descartar</button>' : '') : '') + '</td>' +
            '<td>' + (puede() ? '<button class="pl-btn" onclick="DSO.puntoForm(\'' + e(p.puntoId) + '\')">Editar</button>' : '') + '</td></tr>';
        }).join('') : '<tr><td colspan="7"><div class="sv-vacio">Sin sucursales todavía.</div></td></tr>') + '</tbody></table></div></div>';
    }
    pintar(s, '<div class="cr-tt"><div><h1>Clientes de sólidos</h1><div class="sub">' + B.clientes.length + ' cliente' + (B.clientes.length === 1 ? '' : 's') + ' · cada uno con su servicio, su frecuencia y su unidad, según el plan que se le vendió</div></div><span class="sp"></span>' + (puede() ? '<button class="pl-btn v" onclick="DSO.cliForm(\'\')">＋ Cliente</button>' : '') + '</div>' +
      '<div class="pl-card sv-scroll">' + (B.clientes.length ? '<table class="sv-tb"><thead><tr><th>Cliente</th><th>Unidad</th><th>Cómo se atiende</th><th>Frecuencia</th><th>Plan vendido</th><th>Estado</th></tr></thead><tbody>' + filas + '</tbody></table>' : '<div class="sv-vacio"><b>Todavía no hay clientes de sólidos</b>Registra el primero con «＋ Cliente».</div>') + '</div>' + det +
      '<div class="sv-nota am">Los clientes de sólidos van aparte de los de peligrosos. Las reglas de venta (planes y precios) se definen en Mercadeo después de la prueba real.</div>');
  }
  D.cliVer = function (id) { D.cliSel = D.cliSel === id ? null : id; pintarClientes(seccion('s-cli')); };
  D.cliForm = function (id) {
    var c = D.base.clientes.filter(function (x) { return x.clienteId === id; })[0] || { cobro: {}, estado: 'prueba', retieneItbms: 'NO' }, b = c.cobro || {};
    var num = function (k, t) { return '<label>' + t + '<input id="cf-' + k + '" type="number" min="0" step="0.01" value="' + (b[k] || '') + '" placeholder="0.00"></label>'; };
    modal(id ? 'Editar ' + c.nombre : 'Cliente de sólidos nuevo', '<div class="dso-f"><label class="w">Nombre<input id="cf-nom" value="' + e(c.nombre || '') + '" placeholder="Como lo conocemos"></label>' +
      '<label class="w">Razón social<input id="cf-rs" value="' + e(c.razonSocial || '') + '"></label><label>RUC<input id="cf-ruc" value="' + e(c.ruc || '') + '"></label>' +
      '<label>Estado<select id="cf-est">' + [['prueba', 'En prueba'], ['activo', 'Activo'], ['pausa', 'En pausa'], ['baja', 'De baja']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === c.estado ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>' +
      '<label>Contacto<input id="cf-con" value="' + e(c.contacto || '') + '"></label><label>Teléfono<input id="cf-tel" value="' + e(c.telefono || '') + '"></label><label class="w">Correo<input id="cf-cor" value="' + e(c.correo || '') + '"></label>' +
      '<div class="w sv-h" style="grid-column:1/-1;margin:6px 0 0">Plan vendido · lo que va a Cobros</div>' + num('cuotaSucursal', 'Cuota mensual por sucursal (B/.)') + num('porVisita', 'Por viaje o visita (B/.)') + num('porTonelada', 'Por tonelada (B/.)') + num('porCaja', 'Por caja roll-off (B/.)') + num('minimoMes', 'Mínimo mensual (B/.)') +
      '<label>ITBMS<select id="cf-itb">' + [['NO', '7 %'], ['SI', '7 % · agente retenedor'], ['EXENTO', 'Exento']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === c.retieneItbms ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>' +
      '<label class="w">Notas<textarea id="cf-not">' + e(c.notas || '') + '</textarea></label></div>',
      '<button class="pl-btn" data-x>Cancelar</button><button class="pl-btn v" onclick="DSO.cliGuardar(\'' + e(id) + '\')">Guardar</button>');
  };
  D.cliGuardar = function (id) {
    var n = function (k) { return Number(val('cf-' + k)) || 0; };
    S('api_dsoGuardar', PIN, 'cliente', { clienteId: id, nombre: val('cf-nom'), razonSocial: val('cf-rs'), ruc: val('cf-ruc'), estado: val('cf-est'), contacto: val('cf-con'), telefono: val('cf-tel'), correo: val('cf-cor'), retieneItbms: val('cf-itb'), notas: val('cf-not'),
      cobro: { cuotaSucursal: n('cuotaSucursal'), porVisita: n('porVisita'), porTonelada: n('porTonelada'), porCaja: n('porCaja'), minimoMes: n('minimoMes') } })
      .then(function (r) { cerrarModal(); aviso('Cliente guardado'); D.cliSel = r.clienteId; mostrar('s-cli'); }).catch(falla);
  };
  D.puntoForm = function (id, cliId) {
    var B = D.base, p = B.puntos.filter(function (x) { return x.puntoId === id; })[0] || { clienteId: cliId, servicio: 'bolsas', unidadTipo: 'compactador', dias: '1,2,3,4,5,6,7', activo: true, horaDesde: '', horaHasta: '' };
    D._ll = p.lat ? [p.lat, p.lng] : null; D._pfAct = p.activo !== false; D._pfMot = p.pausaMotivo || '';
    modal(id ? p.nombre : 'Sucursal nueva · punto de recolección', '<div id="pf-est">' + estHtml() + '</div><div class="dso-f"><label class="w">Nombre de la sucursal<input id="pf-nom" value="' + e(p.nombre || '') + '" placeholder="Ej. Sucursal Vía España"></label>' +
      '<label class="w">Dirección<input id="pf-dir" value="' + e(p.direccion || '') + '"></label>' +
      '<label class="w">Cómo llegar al punto (lo ve el conductor)<input id="pf-nota" value="' + e(p.nota || '') + '" placeholder="Ej. callejón de servicio, portón gris, tocar timbre"></label>' +
      '<label>Servicio<select id="pf-serv">' + Object.keys(SERV).map(function (k) { return '<option value="' + k + '"' + (k === p.servicio ? ' selected' : '') + '>' + SERV[k] + '</option>'; }).join('') + '</select></label>' +
      '<label>Unidad que lo atiende<select id="pf-uni">' + Object.keys(TIPOS).map(function (k) { return '<option value="' + k + '"' + (k === p.unidadTipo ? ' selected' : '') + '>' + TIPOS[k][1] + '</option>'; }).join('') + '</select></label>' +
      '<label>Recibe desde<input id="pf-hd" type="time" value="' + e(p.horaDesde || '') + '"></label><label>Recibe hasta<input id="pf-hh" type="time" value="' + e(p.horaHasta || '') + '"></label>' +
      '<label>Caja asignada (roll-off)<input id="pf-caja" value="' + e(p.cajaId || '') + '" placeholder="Ej. C-04"></label>' +
      '<label class="w">Frecuencia · días que le toca' + diasHtml(p.dias) + '</label>' +
      '<label class="w">Ubicación del punto de recolección · pega un enlace de Google Maps o «8.97, -79.52», o toca el mapa<input id="pf-ll" value="' + (D._ll ? D._ll.join(', ') : '') + '" oninput="DSO.puntoLeer(this.value)"></label></div><div id="pf-mapa" style="height:230px;border-radius:12px;margin-top:8px;border:1px solid #e1e6ee"></div>',
      '<button class="pl-btn" data-x>Cancelar</button><button class="pl-btn v" onclick="DSO.puntoGuardar(\'' + e(id) + '\',\'' + e(p.clienteId) + '\')">Guardar</button>');
    setTimeout(function () {
      if (typeof L === 'undefined') return;
      var m = D._pm = L.map('pf-mapa').setView(D._ll || [8.99, -79.52], D._ll ? 17 : 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
      D._pin = D._ll ? L.marker(D._ll).addTo(m) : null;
      m.on('click', function (ev) { D.puntoPin([+ev.latlng.lat.toFixed(6), +ev.latlng.lng.toFixed(6)], false); });
    }, 60);
  };
  D.puntoPin = function (ll, centrar) { D._ll = ll; var i = $i('pf-ll'); if (i && !centrar) i.value = ll.join(', '); if (!D._pm) return; if (D._pin) D._pin.setLatLng(ll); else D._pin = L.marker(ll).addTo(D._pm); if (centrar) D._pm.setView(ll, 17); };
  D.puntoLeer = function (t) { var m = String(t).match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || String(t).match(/[?&](?:q|query|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || String(t).match(/^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/); if (m) D.puntoPin([Number(m[1]), Number(m[2])], true); };
  D.puntoGuardar = function (id, cli) {
    S('api_dsoGuardar', PIN, 'punto', { puntoId: id, clienteId: cli, nombre: val('pf-nom'), direccion: val('pf-dir'), nota: val('pf-nota'), servicio: val('pf-serv'), unidadTipo: val('pf-uni'), horaDesde: val('pf-hd'), horaHasta: val('pf-hh'),
      cajaId: val('pf-caja'), activo: D._pfAct, pausaMotivo: D._pfAct ? '' : (val('pf-mot') || D._pfMot), dias: diasSel($i('dso-fondo')), lat: D._ll ? D._ll[0] : '', lng: D._ll ? D._ll[1] : '' })
      .then(function () { cerrarModal(); aviso(D._pfAct ? 'Sucursal guardada · en servicio' : 'Sucursal guardada · pausada: no sale en el planificador'); D.cliSel = cli; mostrar('s-cli'); }).catch(falla);
  };
  /* 3.17.2 · en servicio / pausada: un interruptor grande, solo cambia al tocarlo */
  function estHtml() {
    var on = D._pfAct;
    return '<div class="sv-est' + (on ? '' : ' off') + '"><div class="tx"><b>' + (on ? '● En servicio' : '⏸ Pausada') + '</b><small>' + (on ? 'Sale en el planificador los días marcados abajo.' : 'No sale en el planificador hasta que la vuelvas a poner en servicio.') + '</small>' +
      (on ? '' : '<div class="mot"><input id="pf-mot" value="' + e(D._pfMot) + '" placeholder="Motivo (opcional): cerrada por remodelación, suspendida por pago…" oninput="DSO._pfMotivo(this.value)"></div>') + '</div>' +
      '<button type="button" class="sv-sw' + (on ? '' : ' off') + '" onclick="DSO.pfEstado()" aria-pressed="' + on + '" aria-label="' + (on ? 'Pausar la sucursal' : 'Poner en servicio') + '"></button></div>';
  }
  D.pfEstado = function () { D._pfAct = !D._pfAct; var x = $i('pf-est'); if (x) x.innerHTML = estHtml(); };
  D._pfMotivo = function (v) { D._pfMot = v; };
  D.pausar = function (id) {
    var p = D.base.puntos.filter(function (x) { return x.puntoId === id; })[0]; if (!p) return;
    modal('Pausar ' + p.nombre, '<p style="margin:0 0 10px;font-size:14px">La sucursal deja de salir en el planificador hasta que la vuelvas a poner en servicio. No se borra nada.</p><div class="dso-f"><label class="w">Motivo (opcional)<input id="pz-mot" placeholder="Ej. cerrada por remodelación"></label></div>',
      '<button class="pl-btn" data-x>Volver</button><button class="pl-btn v" style="background:#5b6a80" onclick="DSO.puntoEstado(\'' + e(id) + '\',false)">Pausar la sucursal</button>');
  };
  D.puntoEstado = function (id, activo, desde) {
    S('api_dsoGuardar', PIN, 'puntoEstado', { puntoId: id, activo: activo, motivo: activo ? '' : val('pz-mot') })
      .then(function () { cerrarModal(); aviso(activo ? 'Sucursal en servicio: ya sale en el planificador' : 'Sucursal pausada'); D.base = null; if (desde === 'plan') mostrar('s-plan'); else mostrar('s-cli'); }).catch(falla);
  };
  D.ubic = function (id, si) { S('api_dsoAprobarUbicacion', PIN, id, si).then(function () { aviso(si ? 'Ubicación aprobada' : 'Ubicación descartada'); mostrar('s-cli'); }).catch(falla); };

  /* ═══ Relleno · tickets ═══ */
  PANTALLAS['s-rell'] = function (s) {
    D.rellMes = D.rellMes || hoy().slice(0, 7);
    var d = D.rellMes + '-01', fin = masDias(masDias(d, 32).slice(0, 7) + '-01', -1);
    cargando(s, 'Cargando los tickets…');
    S('api_dsoTickets', PIN, d, fin).then(function (r) { D.tk = r; if (!r.tickets.some(function (t) { return t.ticket === D.tkSel; })) D.tkSel = (r.tickets[0] || {}).ticket; pintarRelleno(s); }).catch(falla);
  };
  function pintarRelleno(s) {
    var R = D.tk, tab = D.rellTab === 'f' ? 'f' : 't', sel = R.tickets.filter(function (t) { return t.ticket === D.tkSel; })[0];
    var cuerpo;
    if (tab === 't') {
      var izq = '<div class="pl-card sv-scroll">' + (R.tickets.length ? '<table class="sv-tb"><thead><tr><th>Ticket</th><th>Hoja</th><th>Qué llevó</th><th class="n">Neto kg</th><th>Foto</th></tr></thead><tbody>' + R.tickets.map(function (t) {
        var que = t.reparto.length === 1 && t.reparto[0].caja ? 'Caja ' + t.reparto[0].caja + ' · ' + t.reparto[0].cliente : t.reparto.length + ' parada' + (t.reparto.length === 1 ? '' : 's') + ' · ' + N(t.reparto.reduce(function (a, x) { return a + x.bolsas; }, 0)) + ' bolsas';
        return '<tr class="clic' + (t.ticket === D.tkSel ? ' sel' : '') + '" onclick="DSO.tkVer(\'' + e(t.ticket) + '\')"><td><b>' + e(t.ticket) + '</b><small>' + e(t.llegada) + (t.salida ? '–' + e(t.salida) : '') + '</small></td><td>' + fCorta(t.fecha) + ' · ' + e(t.nombre) + '<small>' + e(t.hojaId) + ' · viaje ' + t.viaje + '</small></td><td>' + e(que) + '</td><td class="n"><b>' + N(t.neto) + '</b></td><td>' + (t.foto ? '<span class="sv-ok">✓</span>' : '—') + '</td></tr>';
      }).join('') + '<tr class="tot"><td>Total</td><td></td><td>' + R.tickets.length + ' tickets</td><td class="n">' + N(R.totalKg) + '</td><td></td></tr></tbody></table>' : '<div class="sv-vacio"><b>No hay tickets este mes</b>Los registra el conductor en el relleno, con la foto del comprobante.</div>') + '</div>';
      var der = sel ? '<div class="pl-card sv-pad"><div class="pl-ch" style="padding:0 0 6px"><h3>Ticket ' + e(sel.ticket) + ' · reparto</h3><span class="sv-chip v">' + N(sel.neto) + ' kg</span></div>' +
        '<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12.5px;color:#667489;margin-bottom:8px">' + (sel.lleno ? '<span>Lleno <b style="color:#0f2140">' + N(sel.lleno) + '</b></span><span>Vacío <b style="color:#0f2140">' + N(sel.vacio) + '</b></span>' : '') + '<span>Neto <b style="color:#0f2140">' + N(sel.neto) + ' kg</b></span><span>' + e(sel.relleno) + '</span></div>' +
        '<table class="sv-tb"><thead><tr><th>Punto</th><th class="n">' + (sel.tipo === 'rolloff' ? 'Caja' : 'Bolsas') + '</th><th>Parte</th><th class="n">Kg</th></tr></thead><tbody>' + sel.reparto.map(function (x) {
          var p = sel.neto ? x.kg / sel.neto * 100 : 0;
          return '<tr><td>' + e(x.nombre) + '<small>' + e(x.cliente) + '</small></td><td class="n">' + (x.caja ? e(x.caja) : N(x.bolsas)) + '</td><td><div style="display:flex;gap:8px;align-items:center"><div class="sv-bar" style="flex:1"><i style="width:' + p + '%"></i></div><small style="display:inline;min-width:40px;text-align:right">' + N(p, 1) + ' %</small></div></td><td class="n"><b>' + N(x.kg) + '</b></td></tr>';
        }).join('') + '</tbody></table><div class="sv-nota">Compactador: el peso del ticket se reparte según las bolsas de cada punto. <b>Roll-off: el ticket es de una sola caja, así que todo el peso es de ese cliente.</b></div></div>' : '<div></div>';
      cuerpo = '<div class="sv-g21" style="grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr)">' + izq + der + '</div>';
    } else {
      cuerpo = '<div class="pl-card sv-scroll">' + (R.faltan.length ? '<table class="sv-tb"><thead><tr><th>Fecha</th><th>Hoja</th><th class="n">Paradas sin ticket</th><th>Estado</th></tr></thead><tbody>' + R.faltan.map(function (f) {
        return '<tr class="clic" onclick="DSO.irHoja(\'' + e(f.hojaId) + '\',\'' + f.fecha + '\')"><td>' + fCorta(f.fecha) + '</td><td><b>' + e(f.nombre) + '</b><small>' + e(f.hojaId) + '</small></td><td class="n">' + f.paradas + '</td><td>' + chipEst(f.estado) + '</td></tr>';
      }).join('') + '</tbody></table>' : '<div class="sv-vacio"><b>No falta ningún ticket</b>Todas las paradas atendidas tienen su peso de báscula.</div>') + '</div>' +
        '<div class="sv-nota am">Una parada atendida sin ticket no tiene peso: en el cobro por tonelada no suma hasta que aparezca el ticket.</div>';
    }
    pintar(s, '<div class="cr-tt"><div><h1>Relleno · tickets de báscula</h1><div class="sub">El conductor cuenta, la báscula pesa · ' + R.tickets.length + ' ticket' + (R.tickets.length === 1 ? '' : 's') + ' en el mes · ' + N(R.totalKg / 1000, 1) + ' t' + (R.faltan.length ? ' · ' + R.faltan.length + ' hoja(s) con faltantes' : '') + '</div></div><span class="sp"></span>' +
      '<input type="month" value="' + D.rellMes + '" onchange="DSO.rellIr(this.value)" style="border:1.5px solid var(--ini-linea);border-radius:10px;padding:7px 10px;font-family:inherit;font-weight:800"></div>' +
      '<div class="cr-tabs"><button class="' + (tab === 't' ? 'on' : '') + '" onclick="DSO.rellTabIr(\'t\')">Tickets</button><button class="' + (tab === 'f' ? 'on' : '') + '" onclick="DSO.rellTabIr(\'f\')">Faltantes' + (R.faltan.length ? ' · ' + R.faltan.length : '') + '</button></div>' + cuerpo);
  }
  D.tkVer = function (t) { D.tkSel = t; pintarRelleno(seccion('s-rell')); };
  D.rellIr = function (m) { if (m) { D.rellMes = m; mostrar('s-rell'); } };
  D.rellTabIr = function (t) { D.rellTab = t; pintarRelleno(seccion('s-rell')); };

  /* ═══ Flota de sólidos ═══ */
  PANTALLAS['s-flota'] = function (s) {
    cargando(s, 'Cargando la flota…');
    Promise.all([recargarBase(), S('api_dsoDia', PIN, hoy())]).then(function (r) { D.diaHoy = r[1]; pintarFlota(s); }).catch(falla);
  };
  function pintarFlota(s) {
    var B = D.base, t = D.flotaTab === 'l' ? 'l' : D.flotaTab === 'a' ? 'a' : 'u', EQ = mapa(B.equipo, 'personaId'), cuerpo;
    var hojaDe = {}; (D.diaHoy ? D.diaHoy.hojas : []).forEach(function (h) { hojaDe[h.unidadId] = h; });
    if (t === 'u') {
      cuerpo = Object.keys(TIPOS).map(function (tp) {
        var L = B.unidades.filter(function (u) { return u.tipo === tp; });
        if (!L.length) return '';
        return '<div class="sv-h">' + TIPOS[tp][1] + (tp === 'rolloff' ? ' · cajas de 30 yd³' : '') + '</div><div class="fl-cams">' + L.map(function (u) {
          var h = hojaDe[u.unidadId], rv = h && h.revision;
          var chip = u.estado === 'baja' ? ['', 'de baja'] : h ? (h.estado === 'en_ruta' ? ['v', 'en ruta'] : h.estado === 'cerrada' ? ['v', 'terminó'] : h.estado === 'no_sale' ? ['a', 'no sale'] : ['', 'con hoja']) : ['v', 'disponible'];
          var eq = (u.conductor || 'sin conductor') + (u.ayudantes && u.ayudantes.length ? ' + ' + u.ayudantes.map(function (id) { return (EQ[id] || {}).nombre || id; }).join(', ') : '');
          return '<div class="fl-cam ' + (rv && rv.fallas ? 'falla' : '') + '" onclick="DSO.uniForm(\'' + e(u.unidadId) + '\')"><div class="a"><div><b>' + e(u.nombre) + '</b><small>' + e([u.modelo, u.placa].filter(Boolean).join(' · ') || TIPOS[u.tipo][1]) + '</small></div><span class="fl-chip ' + chip[0] + '">' + chip[1] + '</span></div>' +
            '<div style="margin:2px 0 8px">' + chipTipo(u.tipo) + (u.capacidadT ? ' <span class="sv-chip g">' + N(u.capacidadT) + ' t</span>' : '') + (u.capacidadYd3 ? ' <span class="sv-chip g">' + N(u.capacidadYd3) + ' yd³</span>' : '') + '</div>' +
            '<div class="fl-dt"><b>Equipo</b><span>' + e(eq) + '</span></div><div class="fl-dt"><b>Revisión de hoy</b><span class="' + (rv ? (rv.fallas ? 'a' : 'v') : '') + '">' + (rv ? (rv.fallas ? rv.fallas + ' falla(s) · ' : 'bien · ') + e(String(rv.en).slice(11)) : '—') + '</span></div></div>';
        }).join('') + '</div>';
      }).join('') || '<div class="sv-vacio"><b>Todavía no hay unidades de sólidos</b>Registra la primera con «＋ Unidad nueva». Van aparte de la flota de peligrosos.</div>';
    } else if (t === 'l') {
      cuerpo = '<div class="sv-g3">' + Object.keys(TIPOS).map(function (tp) {
        return '<div class="pl-card sv-pad"><div class="pl-ch" style="padding:0 0 6px"><h3>Lista de revisión · ' + TIPOS[tp][1] + '</h3></div><div class="dso-f"><label class="w">Un punto por línea<textarea id="lr-' + tp + '" style="min-height:220px"' + (puede() ? '' : ' disabled') + '>' + e((B.ajustes.listas[tp] || []).join('\n')) + '</textarea></label></div>' +
          '<div class="sv-ck"><span>Odómetro, tanque y equipo presente con EPP</span><span style="font-size:11px;color:#8a96a8">siempre</span></div></div>';
      }).join('') + '</div>' + (puede() ? '<div class="sv-btns"><button class="pl-btn v" onclick="DSO.listasGuardar()">Guardar las listas</button></div>' : '') +
        '<div class="sv-nota">Cada tipo de unidad tiene su propia lista. El conductor marca cada punto «bien» o «falla» antes de salir y eso va a la hoja que firmas.</div>';
    } else {
      var A = B.ajustes;
      cuerpo = '<div class="pl-card sv-pad" style="max-width:620px"><div class="dso-f"><label>Lejos del punto (metros)<input id="aj-lej" type="number" min="30" max="2000" value="' + A.distanciaLejos + '"></label><label>Patio de salida y regreso<input id="aj-pat" value="' + e(A.patio) + '"></label>' +
        '<label class="w">Rellenos · disposición final (uno por línea)<textarea id="aj-rel">' + e(A.rellenos.join('\n')) + '</textarea></label></div>' + (puede() ? '<div class="sv-btns"><button class="pl-btn v" onclick="DSO.ajustesGuardar()">Guardar</button></div>' : '') + '</div>';
    }
    pintar(s, '<div class="cr-tt"><div><h1>Flota de sólidos</h1><div class="sub">' + B.unidades.filter(function (u) { return u.estado === 'activa'; }).length + ' unidad(es) activa(s) · separadas de peligrosos</div></div><span class="sp"></span>' + (puede() ? '<button class="pl-btn v" onclick="DSO.uniForm(\'\')">＋ Unidad nueva</button>' : '') + '</div>' +
      '<div class="cr-tabs"><button class="' + (t === 'u' ? 'on' : '') + '" onclick="DSO.flotaIr(\'u\')">Unidades</button><button class="' + (t === 'l' ? 'on' : '') + '" onclick="DSO.flotaIr(\'l\')">Lista de revisión</button><button class="' + (t === 'a' ? 'on' : '') + '" onclick="DSO.flotaIr(\'a\')">Ajustes</button></div>' + cuerpo);
  }
  D.flotaIr = function (t) { D.flotaTab = t; pintarFlota(seccion('s-flota')); };
  D.listasGuardar = function () {
    var l = {}; Object.keys(TIPOS).forEach(function (tp) { l[tp] = val('lr-' + tp).split('\n').map(function (x) { return x.trim(); }).filter(Boolean); });
    S('api_dsoGuardar', PIN, 'ajustes', { listas: l }).then(function () { aviso('Listas guardadas'); mostrar('s-flota'); }).catch(falla);
  };
  D.ajustesGuardar = function () {
    S('api_dsoGuardar', PIN, 'ajustes', { distanciaLejos: Number(val('aj-lej')) || 150, patio: val('aj-pat'), rellenos: val('aj-rel').split('\n').map(function (x) { return x.trim(); }).filter(Boolean) })
      .then(function () { aviso('Ajustes guardados'); mostrar('s-flota'); }).catch(falla);
  };
  D.uniForm = function (id) {
    if (!puede()) return;
    var B = D.base, u = B.unidades.filter(function (x) { return x.unidadId === id; })[0] || { tipo: 'compactador', estado: 'activa', ayudantes: [] };
    D._ayU = (u.ayudantes || []).slice();
    var ay = B.equipo.filter(function (p) { return p.activo && p.puesto !== 'conductor'; });
    modal(id ? 'Unidad ' + u.nombre : 'Unidad de sólidos nueva', '<div class="dso-f"><label>Número o nombre<input id="uf-nom" value="' + e(u.nombre || '') + '" placeholder="Ej. 3077"></label><label>Tipo<select id="uf-tipo">' + Object.keys(TIPOS).map(function (k) { return '<option value="' + k + '"' + (k === u.tipo ? ' selected' : '') + '>' + TIPOS[k][1] + '</option>'; }).join('') + '</select></label>' +
      '<label>Placa<input id="uf-pla" value="' + e(u.placa || '') + '"></label><label>Modelo<input id="uf-mod" value="' + e(u.modelo || '') + '" placeholder="Ej. Compactador 25 yd³"></label>' +
      '<label>Capacidad (t)<input id="uf-ct" type="number" min="0" step="0.1" value="' + (u.capacidadT || '') + '"></label><label>Capacidad (yd³)<input id="uf-cy" type="number" min="0" value="' + (u.capacidadYd3 || '') + '"></label>' +
      '<label>Conductor habitual<select id="uf-con"><option value="">—</option>' + B.conductores.concat(u.conductor && B.conductores.indexOf(u.conductor) < 0 ? [u.conductor] : []).map(function (c) { return '<option' + (c === u.conductor ? ' selected' : '') + '>' + e(c) + '</option>'; }).join('') + '</select></label>' +
      '<label>Estado<select id="uf-est"><option value="activa">Activa</option><option value="baja"' + (u.estado === 'baja' ? ' selected' : '') + '>De baja</option></select></label>' +
      '<label class="w">Ayudantes habituales<div class="sv-eq" id="uf-ay" style="text-transform:none;letter-spacing:0">' + (ay.length ? ay.map(function (a) { return '<span data-a="' + e(a.personaId) + '" class="' + (D._ayU.indexOf(a.personaId) >= 0 ? 'on' : '') + '" onclick="this.classList.toggle(\'on\')">' + e(a.nombre) + '</span>'; }).join('') : '<small>Regístralos en «Equipos de trabajo».</small>') + '</div></label>' +
      '<label class="w">Notas<textarea id="uf-not">' + e(u.notas || '') + '</textarea></label></div>',
      '<button class="pl-btn" data-x>Cancelar</button><button class="pl-btn v" onclick="DSO.uniGuardar(\'' + e(id) + '\')">Guardar</button>');
  };
  D.uniGuardar = function (id) {
    var ay = [].slice.call(document.querySelectorAll('#uf-ay span.on')).map(function (x) { return x.getAttribute('data-a'); });
    S('api_dsoGuardar', PIN, 'unidad', { unidadId: id, nombre: val('uf-nom'), tipo: val('uf-tipo'), placa: val('uf-pla'), modelo: val('uf-mod'), capacidadT: val('uf-ct'), capacidadYd3: val('uf-cy'), conductor: val('uf-con'), estado: val('uf-est'), ayudantes: ay, notas: val('uf-not') })
      .then(function () { cerrarModal(); aviso('Unidad guardada'); mostrar('s-flota'); }).catch(falla);
  };

  /* ═══ Equipos de trabajo ═══ */
  var PUESTOS = { conductor: 'Conductor', ayudante: 'Ayudante', operador: 'Operador de roll-off', senalero: 'Señalero' };
  PANTALLAS['s-equipos'] = function (s) {
    cargando(s, 'Cargando los equipos…');
    recargarBase().then(function () {
      var B = D.base, grupos = B.unidades.map(function (u) { return [u.nombre + ' · ' + TIPOS[u.tipo][1], B.equipo.filter(function (p) { return p.unidadId === u.unidadId; })]; });
      var sinU = B.equipo.filter(function (p) { return !p.unidadId || !B.unidades.some(function (u) { return u.unidadId === p.unidadId; }); });
      if (sinU.length) grupos.push(['Sin unidad fija', sinU]);
      grupos = grupos.filter(function (g) { return g[1].length; });
      var vence = function (f) { if (!f) return ''; var d = Math.round((new Date(f + 'T12:00:00Z') - new Date(hoy() + 'T12:00:00Z')) / 864e5); return d < 0 ? ' · <span class="sv-no">licencia vencida</span>' : d < 30 ? ' · <span class="sv-no">licencia vence en ' + d + ' días</span>' : ' · licencia vence ' + fCorta(f); };
      pintar(s, '<div class="cr-tt"><div><h1>Equipos de trabajo</h1><div class="sub">Conductor y ayudantes por unidad · cada puesto con su protocolo</div></div><span class="sp"></span>' + (puede() ? '<button class="pl-btn v" onclick="DSO.perForm(\'\')">＋ Persona</button>' : '') + '</div>' +
        (grupos.length ? '<div class="sv-g3">' + grupos.map(function (g) {
          return '<div class="pl-card sv-pad"><div class="pl-ch" style="padding:0 0 6px"><h3>Equipo · ' + e(g[0]) + '</h3></div><div class="sv-list">' + g[1].map(function (p) {
            return '<div class="it" onclick="DSO.perForm(\'' + e(p.personaId) + '\')"><div class="tx"><b>' + e(p.nombre) + (p.activo ? '' : ' <span class="sv-chip g">inactivo</span>') + '</b><small>' + e(PUESTOS[p.puesto] || p.puesto) + (p.puesto === 'conductor' || p.puesto === 'operador' ? vence(p.licenciaVence) : '') + (p.eppEntregado ? ' · EPP entregado ' + fCorta(p.eppEntregado) : '') + '</small>' +
              '<div style="margin-top:6px"><span class="sv-chip ' + (p.protocoloEstado === 'firmado' ? 'v' : 'r') + '">' + e(p.protocolo || 'Protocolo') + ' · ' + (p.protocoloEstado === 'firmado' ? 'leído y firmado' : 'pendiente de firmar') + '</span></div></div></div>';
          }).join('') + '</div></div>';
        }).join('') + '</div>' : '<div class="sv-vacio"><b>Todavía no hay personas en los equipos</b>Registra al conductor y a los ayudantes de cada unidad.</div>') +
        '<div class="sv-g2" style="margin-top:14px"><div class="sv-nota">Los ayudantes <b>no entran al sistema</b>: el conductor confirma en la revisión que están presentes y con su EPP, y sus nombres quedan en la hoja de ruta.</div><div class="sv-nota am">Los protocolos de sólidos son distintos a los de peligrosos. Los códigos de formato están por asignar con el control de documentos.</div></div>');
    }).catch(falla);
  };
  D.perForm = function (id) {
    if (!puede()) return;
    var B = D.base, p = B.equipo.filter(function (x) { return x.personaId === id; })[0] || { puesto: 'ayudante', activo: true, protocoloEstado: 'pendiente' };
    modal(id ? p.nombre : 'Persona nueva', '<div class="dso-f"><label class="w">Nombre<input id="qf-nom" value="' + e(p.nombre || '') + '"></label>' +
      '<label>Puesto<select id="qf-pue">' + Object.keys(PUESTOS).map(function (k) { return '<option value="' + k + '"' + (k === p.puesto ? ' selected' : '') + '>' + PUESTOS[k] + '</option>'; }).join('') + '</select></label>' +
      '<label>Unidad<select id="qf-uni"><option value="">Sin unidad fija</option>' + B.unidades.map(function (u) { return '<option value="' + e(u.unidadId) + '"' + (u.unidadId === p.unidadId ? ' selected' : '') + '>' + e(u.nombre) + ' · ' + TIPOS[u.tipo][1] + '</option>'; }).join('') + '</select></label>' +
      '<label>Usuario del sistema (solo conductores)<select id="qf-usr"><option value="">No entra al sistema</option>' + B.conductores.concat(p.usuario && B.conductores.indexOf(p.usuario) < 0 ? [p.usuario] : []).map(function (c) { return '<option' + (c === p.usuario ? ' selected' : '') + '>' + e(c) + '</option>'; }).join('') + '</select></label>' +
      '<label>Teléfono<input id="qf-tel" value="' + e(p.telefono || '') + '"></label>' +
      '<label>Protocolo (código)<input id="qf-pro" value="' + e(p.protocolo || '') + '" placeholder="por asignar"></label><label>Protocolo<select id="qf-pes"><option value="pendiente">Pendiente de firmar</option><option value="firmado"' + (p.protocoloEstado === 'firmado' ? ' selected' : '') + '>Leído y firmado</option></select></label>' +
      '<label>Fecha de firma<input id="qf-pfe" type="date" value="' + e(p.protocoloFecha || '') + '"></label><label>Licencia vence<input id="qf-lic" type="date" value="' + e(p.licenciaVence || '') + '"></label>' +
      '<label>EPP entregado<input id="qf-epp" type="date" value="' + e(p.eppEntregado || '') + '"></label><label><span><input type="checkbox" id="qf-act"' + (p.activo ? ' checked' : '') + '> Activo</span></label>' +
      '<label class="w">Notas<textarea id="qf-not">' + e(p.notas || '') + '</textarea></label></div>',
      '<button class="pl-btn" data-x>Cancelar</button><button class="pl-btn v" onclick="DSO.perGuardar(\'' + e(id) + '\')">Guardar</button>');
  };
  D.perGuardar = function (id) {
    S('api_dsoGuardar', PIN, 'persona', { personaId: id, nombre: val('qf-nom'), puesto: val('qf-pue'), unidadId: val('qf-uni'), usuario: val('qf-usr'), telefono: val('qf-tel'), protocolo: val('qf-pro'), protocoloEstado: val('qf-pes'), protocoloFecha: val('qf-pfe'),
      licenciaVence: val('qf-lic'), eppEntregado: val('qf-epp'), activo: !!$i('qf-act').checked, notas: val('qf-not') }).then(function () { cerrarModal(); aviso('Guardado'); mostrar('s-equipos'); }).catch(falla);
  };

  /* ═══ Cajas roll-off ═══ */
  var LUGAR = { patio: 'Patio', cliente: 'En el cliente', camino: 'Camino al relleno', taller: 'Taller' };
  var ESTCAJA = { vacia: ['', 'Vacía'], en_uso: ['', 'En uso'], llena: ['ro', 'Llena'], llena_avisada: ['r', 'Llena avisada'], fuera: ['r', 'Fuera de uso'] };
  PANTALLAS['s-cajas'] = function (s) {
    cargando(s, 'Cargando las cajas…');
    recargarBase().then(function () {
      var B = D.base, P = mapa(B.puntos, 'puntoId'), C = mapa(B.clientes, 'clienteId');
      var cuenta = {}; B.cajas.forEach(function (c) { cuenta[c.lugar] = (cuenta[c.lugar] || 0) + 1; });
      var dias = function (f) { if (!f) return '—'; var d = Math.round((new Date(hoy() + 'T12:00:00Z') - new Date(f + 'T12:00:00Z')) / 864e5); return d <= 0 ? 'hoy' : d === 1 ? '1 día' : d + ' días'; };
      pintar(s, '<div class="cr-tt"><div><h1>Cajas roll-off</h1><div class="sub">' + B.cajas.length + ' caja(s)' + Object.keys(LUGAR).filter(function (k) { return cuenta[k]; }).map(function (k) { return ' · ' + cuenta[k] + ' ' + LUGAR[k].toLowerCase(); }).join('') + '</div></div><span class="sp"></span>' + (puede() ? '<button class="pl-btn v" onclick="DSO.cajaForm(\'\')">＋ Caja nueva</button>' : '') + '</div>' +
        '<div class="pl-card sv-scroll">' + (B.cajas.length ? '<table class="sv-tb"><thead><tr><th>Caja</th><th>Dónde está</th><th>Estado</th><th class="n">Ahí desde</th><th>Último movimiento</th></tr></thead><tbody>' + B.cajas.map(function (c) {
          var p = P[c.puntoId], es = ESTCAJA[c.estado] || ['', c.estado], h = c.historial[c.historial.length - 1];
          return '<tr class="clic" onclick="DSO.cajaForm(\'' + e(c.cajaId) + '\')"><td><b>' + e(c.cajaId) + '</b><small>' + N(c.capacidad) + ' yd³</small></td><td>' + (c.lugar === 'cliente' && p ? e(((C[p.clienteId] || {}).nombre || '') + ' · ' + p.nombre) : e(c.lugar === 'patio' ? D.base.ajustes.patio : LUGAR[c.lugar] || c.lugar)) + '</td>' +
            '<td><span class="sv-chip ' + es[0] + '">' + es[1] + '</span></td><td class="n">' + dias(c.desde) + '</td><td><small>' + (h ? e(h.en + ' · ' + h.por) : 'Lo registra el conductor al dejarla o levantarla') + '</small></td></tr>';
        }).join('') + '</tbody></table>' : '<div class="sv-vacio"><b>Todavía no hay cajas registradas</b>Registra cada caja con su número (por ejemplo C-01).</div>') + '</div>' +
        '<div class="sv-nota">Cada caja se sigue como un equipo: en qué cliente está, desde cuándo y si está llena. Cuando el cliente avisa que se llenó, márcala «Llena avisada» y sale en el planificador de ese día.</div>');
    }).catch(falla);
  };
  D.cajaForm = function (id) {
    if (!puede()) return;
    var B = D.base, c = B.cajas.filter(function (x) { return x.cajaId === id; })[0] || { capacidad: 30, lugar: 'patio', estado: 'vacia' };
    var pts = B.puntos.filter(function (p) { return p.servicio === 'caja' || p.unidadTipo === 'rolloff'; });
    modal(id ? 'Caja ' + id : 'Caja nueva', '<div class="dso-f"><label>Número<input id="kf-id" value="' + e(c.cajaId || '') + '"' + (id ? ' disabled' : '') + ' placeholder="C-01"></label><label>Capacidad (yd³)<input id="kf-cap" type="number" value="' + (c.capacidad || 30) + '"></label>' +
      '<label>Dónde está<select id="kf-lug">' + Object.keys(LUGAR).map(function (k) { return '<option value="' + k + '"' + (k === c.lugar ? ' selected' : '') + '>' + LUGAR[k] + '</option>'; }).join('') + '</select></label>' +
      '<label>Estado<select id="kf-est">' + Object.keys(ESTCAJA).map(function (k) { return '<option value="' + k + '"' + (k === c.estado ? ' selected' : '') + '>' + ESTCAJA[k][1] + '</option>'; }).join('') + '</select></label>' +
      '<label class="w">Punto del cliente (si está en un cliente)<select id="kf-pun"><option value="">—</option>' + pts.map(function (p) { return '<option value="' + e(p.puntoId) + '"' + (p.puntoId === c.puntoId ? ' selected' : '') + '>' + e(p.nombre) + '</option>'; }).join('') + '</select></label>' +
      '<label class="w">Notas<textarea id="kf-not">' + e(c.notas || '') + '</textarea></label></div>' +
      (c.historial && c.historial.length ? '<div class="sv-h">Movimientos</div>' + c.historial.slice(-8).reverse().map(function (h) { return '<div class="sv-ck"><span>' + e(h.en) + ' · ' + e(h.por) + '</span><span>' + e(LUGAR[h.lugar] || h.lugar) + ' · ' + e((ESTCAJA[h.estado] || [0, h.estado])[1]) + '</span></div>'; }).join('') : ''),
      '<button class="pl-btn" data-x>Cancelar</button><button class="pl-btn v" onclick="DSO.cajaGuardar(\'' + e(id) + '\')">Guardar</button>');
  };
  D.cajaGuardar = function (id) {
    S('api_dsoGuardar', PIN, 'caja', { cajaId: id || val('kf-id'), capacidad: val('kf-cap'), lugar: val('kf-lug'), estado: val('kf-est'), puntoId: val('kf-pun'), notas: val('kf-not') })
      .then(function () { cerrarModal(); aviso('Caja guardada'); mostrar('s-cajas'); }).catch(falla);
  };

  /* ═════════════════ CONDUCTOR (celular) ═════════════════ */
  var C = D.con;
  function esCond() { return !sup() && window.USUARIO && USUARIO.nombre && PIN; }
  function pasos(n) { var P = ['Revisión', 'Salida', 'Ruta', 'Descarga', 'Regreso']; return '<div class="sc-pasos">' + P.map(function (p, i) { return '<span class="' + (i < n ? 'ok' : i === n ? 'on' : '') + '">' + p + '</span>'; }).join('') + '</div>'; }
  function pasoDe(h) {
    if (!h) return 0;
    if (h.estado === 'publicada') return 0;
    if (h.estado === 'por_firmar' || h.estado === 'no_sale') return 1;
    if (h.estado === 'cerrada') return 5;
    var pend = h.paradas.filter(function (p) { return !p.salida; }).length;
    return pend ? 2 : (h.sinTicket ? 3 : 4);
  }
  function traer() { return S('api_dsoMiHoja', PIN).then(function (r) { C.esSolidos = r.esSolidos; C.hoja = r.hoja; C.t = Date.now(); return r; }); }

  /* la tarjeta en el inicio del conductor */
  function conTarjeta(forzar) {
    if (!esCond()) return;
    if (!forzar && C.t && Date.now() - C.t < 60000) { pintarTarjeta(); return; }
    if (C._vuelo) return; C._vuelo = true;
    traer().then(function () { C._vuelo = false; pintarTarjeta(); }, function () { C._vuelo = false; });
  }
  function pintarTarjeta() {
    var op = $i('hub-operador'), h = C.hoja, t = $i('hub-solidos');
    if (!op) return;
    if (!h) {
      /* api 3.18 · el conductor de sólidos sin hoja: «Hoy no tiene ruta» con su próxima ruta */
      if (C.esSolidos && !(window.RUTA && RUTA.paradas && RUTA.paradas.length)) { pintarLibre(op, t); pintarInicioSol(); return; }
      if (t) t.remove(); op.style.display = 'block'; pintarInicioSol(); return; }
    if (!t) { t = document.createElement('div'); t.id = 'hub-solidos'; op.parentNode.insertBefore(t, op); }
    t.className = 'tb'; t.style.display = 'block';
    var pelVacia = !(window.RUTA && RUTA.paradas && RUTA.paradas.length);
    op.style.display = pelVacia && C.esSolidos ? 'none' : 'block';
    var n = pasoDe(h), hechas = h.paradas.filter(function (p) { return p.salida; }).length;
    var btn = { 0: 'Empezar la revisión del camión →', 1: h.estado === 'no_sale' ? 'Ver por qué no sale →' : 'Logística decide si sales…', 2: 'Seguir mi ruta →', 3: 'Ir a la descarga →', 4: 'Regresar y cerrar la ruta →', 5: 'Ruta cerrada · ver resumen' }[n];
    t.innerHTML = '<div class="tb-et">' + rutaTit(h) + ' · sólidos</div><div class="tb-t1">' + e(h.nombre || h.hojaId) + ' · ' + h.paradas.length + ' paradas</div>' +
      '<div class="tb-t2">' + (TIPOS[h.tipo] || TIPOS.compactador)[1] + ' ' + e(h.unidad) + (h.salida ? ' · sale ' + e(h.salida) : '') + (h.ayudantesNombres.length ? ' · con ' + e(h.ayudantesNombres.join(' y ')) : '') + (n >= 2 && n < 5 ? ' · ' + hechas + ' de ' + h.paradas.length + ' hechas' : '') + '</div>' + pasos(n) +
      '<button class="tb-go" style="margin-top:14px" onclick="event.stopPropagation();DSO.conAbrir()">' + btn + '</button>';
    t.onclick = function () { D.conAbrir(); };
    pintarInicioSol();
  }

  /* pantalla propia del conductor */
  function cSec(html) {
    var s = $i('pantalla-solc');
    if (!s) { s = document.createElement('section'); s.id = 'pantalla-solc'; s.className = 'pantalla'; document.querySelector('main').appendChild(s); }
    s.innerHTML = html;
    document.querySelectorAll('.pantalla').forEach(function (p) { p.classList.remove('activa'); }); s.classList.add('activa'); window.scrollTo(0, 0);
    return s;
  }
  function nav(t, i) { return '<div class="barra-navegacion-top"><h2>' + ic(i) + ' ' + e(t) + '</h2><button class="btn-volver-hub" onclick="DSO.conVolver()">' + ic('menu') + ' Menú</button></div>'; }
  D.conVolver = function () { clearInterval(C._poll); C._poll = null; if (C._geo != null && navigator.geolocation) { navigator.geolocation.clearWatch(C._geo); C._geo = null; } window.mostrarTab('hub'); conTarjeta(true); };
  D.conAbrir = function (vista) {
    var ir = function () {
      var h = C.hoja; if (!h) { aviso('No tienes una hoja de sólidos abierta'); return; }
      var n = pasoDe(h);
      vista = vista || { 0: 'rev', 1: 'espera', 2: 'ruta', 3: 'ruta', 4: 'ruta', 5: 'fin' }[n];
      C.vista = vista;
      ({ rev: vRevision, espera: vEspera, ruta: vRuta, par: vParada, rell: vRelleno, cierre: vCierre, fin: vFin })[vista]();
    };
    traer().then(ir, function (er) { if (C.hoja) ir(); else falla(er); });
  };
  function heroHoja(et, t1, t2, extra) { return '<div class="jv-hero"><div class="et">' + et + '</div><div class="t1">' + t1 + '</div>' + (t2 ? '<div class="t2">' + t2 + '</div>' : '') + (extra || '') + '</div>'; }

  /* 1 · revisión del camión */
  function vRevision() {
    C.vista = 'rev';
    var h = C.hoja, b = C.borr;
    if (!b.rev || b.rev.hojaId !== h.hojaId) b.rev = { hojaId: h.hojaId, items: h.lista.map(function () { return ''; }), equipo: h.ayudantesNombres.map(function (n) { return { nombre: n, presente: true, epp: true }; }), tanque: '', odometro: '', nota: '' };
    var r = b.rev;
    cSec(nav('Revisión del camión', 'lista') + heroHoja('Antes de salir · ' + e(h.unidad) + ' ' + (TIPOS[h.tipo] || TIPOS.compactador)[1].toLowerCase(), 'Revisión del camión', 'Lo que marques aquí va a la hoja de ruta que firma Logística.') +
      '<div class="jv-card"><div class="jv-tit">' + ic('camion') + ' El camión</div>' + h.lista.map(function (x, i) {
        return '<div class="sc-row"><div><b>' + e(x) + '</b></div><div class="sc-of"><button type="button" class="' + (r.items[i] === 'b' ? 'ok' : '') + '" onclick="DSO.revMarca(' + i + ',\'b\')">Bien</button><button type="button" class="' + (r.items[i] === 'm' ? 'no' : '') + '" onclick="DSO.revMarca(' + i + ',\'m\')">Falla</button></div></div>';
      }).join('') + '</div>' +
      (r.equipo.length ? '<div class="jv-card"><div class="jv-tit">' + ic('personas') + ' El equipo</div>' + r.equipo.map(function (q, i) {
        return '<div class="sc-row"><div><b>' + e(q.nombre) + '</b><small>¿Vino? · ¿Tiene guantes, chaleco y botas?</small></div><div style="display:grid;gap:4px"><div class="sc-of"><button type="button" class="' + (q.presente ? 'ok' : '') + '" onclick="DSO.revEq(' + i + ',\'presente\',true)">Vino</button><button type="button" class="' + (!q.presente ? 'no' : '') + '" onclick="DSO.revEq(' + i + ',\'presente\',false)">No</button></div>' +
          '<div class="sc-of"><button type="button" class="' + (q.epp ? 'ok' : '') + '" onclick="DSO.revEq(' + i + ',\'epp\',true)">EPP</button><button type="button" class="' + (!q.epp ? 'no' : '') + '" onclick="DSO.revEq(' + i + ',\'epp\',false)">Sin EPP</button></div></div></div>';
      }).join('') + '</div>' : '') +
      '<div class="jv-card"><div class="sc-lbl">Odómetro</div><input class="sc-in" id="rv-odo" inputmode="numeric" value="' + e(r.odometro) + '" oninput="DSO.con.borr.rev.odometro=this.value" placeholder="km">' +
      '<div class="sc-lbl" style="margin-top:10px">Tanque</div><div class="sc-seg">' + ['¼', '½', '¾', 'Lleno'].map(function (x) { return '<button type="button" class="' + (r.tanque === x ? 'on' : '') + '" onclick="DSO.revTanque(\'' + x + '\')">' + x + '</button>'; }).join('') + '</div>' +
      '<div class="sc-lbl" style="margin-top:10px">Nota para Logística (opcional)</div><textarea class="sc-in t" id="rv-nota" rows="2" oninput="DSO.con.borr.rev.nota=this.value">' + e(r.nota) + '</textarea></div>' +
      '<button class="sc-btn" onclick="DSO.revEnviar()">Enviar revisión a Logística</button><div style="height:20px"></div>');
  }
  D.revMarca = function (i, v) { C.borr.rev.items[i] = v; vRevision(); };
  D.revEq = function (i, k, v) { C.borr.rev.equipo[i][k] = v; vRevision(); };
  D.revTanque = function (x) { C.borr.rev.tanque = x; vRevision(); };
  D.revEnviar = function () {
    var r = C.borr.rev;
    if (r.items.some(function (x) { return !x; })) { aviso('Marca cada punto del camión: bien o falla'); return; }
    if (!(Number(String(r.odometro).replace(/[^\d.]/g, '')) > 0)) { aviso('Falta el odómetro'); return; }
    S('api_dsoRevision', PIN, C.hoja.hojaId, { items: r.items, odometro: Number(String(r.odometro).replace(/[^\d.]/g, '')), tanque: r.tanque, equipo: r.equipo, nota: r.nota })
      .then(function (x) { C.borr.rev = null; if (x.estado === 'en_ruta') { aviso('Revisión sin fallas · salida lista, ya puedes salir'); D.conAbrir('ruta'); return; } aviso(x.fallas ? 'Revisión enviada con ' + x.fallas + ' falla(s) · Logística decide' : 'Revisión enviada · Logística decide'); D.conAbrir('espera'); }).catch(falla);   /* api 3.26 */
  };

  /* 2 · esperando la firma (o no sale) */
  function vEspera() {
    C.vista = 'espera';
    var h = C.hoja, ns = h.estado === 'no_sale';
    cSec('<div class="hub-saludo">Hoja de ruta <b>' + e(h.hojaId) + '</b></div><div class="grid-mosaicos"><div class="tb" style="display:block"><div class="tb-et">' + (ns ? 'Logística decidió' : 'Revisión enviada') + '</div><div class="tb-t1">' + (ns ? 'Esta ruta no sale' : 'Logística decide si sales') + '</div>' +
      '<div class="tb-t2">' + (ns ? e(h.firmada ? h.firmada.por + ': ' + h.firmada.nota : '') : 'Tu revisión trae una falla, o falta alguien del equipo o su EPP. Logística decide y te avisa aquí.') + '</div>' + pasos(1) +
      (h.revision ? '<div style="margin-top:14px;background:rgba(255,255,255,.12);border-radius:12px;padding:12px;font-size:13px;font-weight:700">' + (ns ? '' : '⏳ ') + 'Revisión: ' + (h.revision.items.length - h.revision.fallas) + ' de ' + h.revision.items.length + ' bien' + (h.revision.equipo && h.revision.equipo.length ? ' · equipo ' + (h.revision.equipo.every(function (q) { return q.presente && q.epp; }) ? 'completo' : 'incompleto') : '') + '</div>' : '') + '</div></div>' +
      '<div class="jv-card" style="margin-top:12px"><div class="jv-tit">' + ic('lista') + (turnoDe(h) === 'dia' ? ' Tu hoja de hoy' : ' Tu hoja de esta noche') + '</div>' + [['Unidad', (TIPOS[h.tipo] || TIPOS.compactador)[1] + ' ' + h.unidad], ['Equipo', h.ayudantesNombres.join(' · ') || '—'], ['Paradas', h.paradas.length + ''], ['Relleno', h.relleno || '—'], ['Salida', ns ? 'no sale' : 'por firmar']].map(function (f) { return '<div class="jv-fila"><b>' + f[0] + '</b><span>' + e(f[1]) + '</span></div>'; }).join('') + '</div>' +
      '<button class="sc-btn sec" onclick="DSO.conVolver()">Volver al menú</button>');
    clearInterval(C._poll);
    if (!ns) C._poll = setInterval(function () {
      if (C.vista !== 'espera' || !$i('pantalla-solc') || !$i('pantalla-solc').classList.contains('activa')) { clearInterval(C._poll); return; }
      traer().then(function () { if (C.hoja && C.hoja.estado !== 'por_firmar') { clearInterval(C._poll); if (C.hoja.estado === 'en_ruta') aviso('Salida firmada: ya puedes salir'); D.conAbrir(); } });
    }, 15000);
  }

  /* 3 · la ruta: siguiente parada, «Llegué», lista */
  function sigIdx() { var P = C.hoja.paradas; for (var i = 0; i < P.length; i++) if (!P[i].salida) return i; return -1; }
  function vRuta() {
    C.vista = 'ruta';
    var h = C.hoja, i = sigIdx(), P = h.paradas, hechas = P.filter(function (p) { return p.salida; }).length;
    var porTicket = P.filter(function (p) { return p.atendida && p.viaje < 0; }).length;
    var sig = '';
    if (i >= 0) {
      var p = P[i], llego = !!p.llegada;
      sig = '<div class="mc-sig"><div class="et">Siguiente · parada ' + (i + 1) + ' de ' + P.length + '</div><div class="n">' + e(p.nombre) + '</div>' +
        '<div class="z">' + (p.nota ? 'Punto de recolección: ' + e(p.nota) + '<br>' : '') + (p.direccion ? e(p.direccion) + '<br>' : '') + (p.horaDesde ? '🕘 recibe ' + e(p.horaDesde) + '–' + e(p.horaHasta) + '<br>' : '') + '<span id="sc-dist">' + (p.lat ? '📍 buscando tu ubicación…' : '📍 este punto no tiene ubicación guardada') + '</span></div>' +
        '<div class="mc-acc' + (p.lat ? ' dos">' : '" style="grid-template-columns:1fr">') + (p.lat ? '<a class="nav" href="https://www.google.com/maps/dir/?api=1&destination=' + p.lat + ',' + p.lng + '" target="_blank" rel="noopener">➤ Navegar<small>Google Maps</small></a>' : '') +
        '<button class="ok" onclick="DSO.llegue(' + i + ')">' + (llego ? '✓ Abrir parada<small>llegaste ' + e(p.llegada) + '</small>' : '✓ Llegué<small>abrir parada</small>') + '</button></div></div>';
    }
    var lista = P.map(function (p, k) {
      var c = p.salida ? (p.atendida ? 'ok' : 'mal') : (k === i ? 'on' : '');
      return '<div class="sc-par ' + c + '" onclick="DSO.abrirParada(' + k + ')"><span class="n">' + (k + 1) + '</span><div class="t"><b>' + e(p.nombre) + '</b><small>' + (p.salida ? (p.atendida ? (p.servicio === 'caja' ? 'caja ' + e(p.cajaLevanta || '') : N(p.bolsas) + ' bolsas') : e(p.inc || 'no se recolectó')) + ' · ' + e(p.llegada) + '–' + e(p.salida) : (p.llegada ? 'llegaste ' + e(p.llegada) : (p.horaDesde ? 'recibe ' + e(p.horaDesde) + '–' + e(p.horaHasta) : e(SERV[p.servicio] || '')))) + '</small></div><span>›</span></div>';
    }).join('');
    cSec(nav(rutaTit(C.hoja), 'ruta') + heroHoja(e(h.nombre) + ' · ' + (TIPOS[h.tipo] || TIPOS.compactador)[1].toLowerCase() + ' ' + e(h.unidad), hechas + ' de ' + P.length + ' hechas', '',
      '<div class="jv-kp"><div><b>' + N(h.bolsas) + '</b><span>bolsas</span></div><div><b>' + hechas + '/' + P.length + '</b><span>paradas</span></div><div><b>' + h.viajes.length + '</b><span>descarga' + (h.viajes.length === 1 ? '' : 's') + '</span></div></div>') +
      sig + (i < 0 ? '<div class="jv-card" style="margin-top:12px"><div class="jv-tit">' + ic('check') + ' Terminaste las paradas</div><p style="font-size:13.5px;color:#3d4a60;margin:4px 0 0">' + (porTicket ? 'Lleva la carga a la descarga.' : 'Regresa al patio y cierra la ruta.') + '</p></div>' : '') +
      (porTicket ? '<button class="sc-btn am" onclick="DSO.conAbrir(\'rell\')">' + (i < 0 ? 'Ir a la descarga' : 'El camión está lleno · ir a descargar') + '</button>' : '') +
      (i < 0 && !porTicket ? '<button class="sc-btn v" onclick="DSO.conAbrir(\'cierre\')">Regresé al patio · cerrar la ruta</button>' : '') +
      '<div class="jv-card" style="margin-top:12px"><div class="jv-tit">' + ic('lista') + ' Todas las paradas</div>' + lista + '</div>' +
      (i >= 0 ? '<button class="sc-btn sec" onclick="DSO.conAbrir(\'cierre\')">Terminar la ruta antes</button>' : '') + '<div style="height:20px"></div>');
    vigilarDistancia(i >= 0 ? P[i] : null);
  }
  function vigilarDistancia(p) {
    if (C._geo != null && navigator.geolocation) { navigator.geolocation.clearWatch(C._geo); C._geo = null; }
    if (!p || !p.lat || !navigator.geolocation) return;
    C._geo = navigator.geolocation.watchPosition(function (pos) {
      C.ultGps = { lat: pos.coords.latitude, lng: pos.coords.longitude, prec: pos.coords.accuracy, t: Date.now() };
      var z = $i('sc-dist'); if (!z) return;
      var d = distM(pos.coords.latitude, pos.coords.longitude, p.lat, p.lng), lim = C.hoja.distanciaLejos || 150;
      z.innerHTML = '📍 estás a <b>' + (d >= 1000 ? N(d / 1000, 1) + ' km' : N(d) + ' m') + '</b> del punto' + (d > lim ? '' : ' ✓');
    }, function () { var z = $i('sc-dist'); if (z) z.textContent = '📍 activa la ubicación del celular'; }, { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 });
  }
  function distM(a, b, c, d) { var R = 6371000, r = function (x) { return x * Math.PI / 180; }, h = Math.pow(Math.sin(r(c - a) / 2), 2) + Math.cos(r(a)) * Math.cos(r(c)) * Math.pow(Math.sin(r(d - b) / 2), 2); return Math.round(2 * R * Math.asin(Math.sqrt(h))); }
  function gpsAhora() {
    return new Promise(function (ok) {
      if (C.ultGps && Date.now() - C.ultGps.t < 20000) { ok(C.ultGps); return; }
      if (!navigator.geolocation) { ok({}); return; }
      var hecho = false, fin = function (x) { if (!hecho) { hecho = true; ok(x); } };
      navigator.geolocation.getCurrentPosition(function (pos) { fin({ lat: pos.coords.latitude, lng: pos.coords.longitude, prec: pos.coords.accuracy }); }, function () { fin({}); }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 });
      setTimeout(function () { fin({}); }, 9000);
    });
  }
  D.llegue = function (i) {
    var p = C.hoja.paradas[i]; if (p.llegada) { D.abrirParada(i); return; }
    aviso('Tomando tu ubicación…');
    gpsAhora().then(function (g) { C._gpsLlegada = g; return S('api_dsoLlegue', PIN, C.hoja.hojaId, i, g); }).then(function (r) {
      return traer().then(function () { C.idx = i; if (r.lejos) vLejos(i, r); else vParada(); });
    }).catch(falla);
  };
  D.abrirParada = function (i) { var p = C.hoja.paradas[i]; if (!p.llegada) { D.llegue(i); return; } C.idx = i; vParada(); };
  function vLejos(i, r) {
    C.vista = 'lejos';
    var p = C.hoja.paradas[i];
    cSec(nav(rutaTit(C.hoja), 'ruta') + heroHoja('Parada ' + (i + 1) + ' de ' + C.hoja.paradas.length, e(p.nombre), 'Llegada anotada ' + e(r.llegada)) +
      '<div class="jv-card" style="margin-top:12px;border:2px solid #F5B301"><div class="jv-tit">' + ic('alerta') + ' Estás lejos del punto de recolección</div><p style="font-size:13.5px;color:#3d4a60;margin:4px 0 10px">El GPS dice que estás a ' + N(r.dist) + ' m del punto guardado de este cliente.</p>' +
      '<button class="sc-btn" onclick="DSO.mandarUbic(' + i + ')">Estoy en la puerta · enviar mi ubicación</button><div style="font-size:12px;color:#5B6880;margin:6px 2px 0">Llega a Logística para aprobarla. La ficha no cambia hasta que la aprueben.</div>' +
      '<button class="sc-btn sec" onclick="DSO.abrirParada(' + i + ')">Seguir igual</button><div style="font-size:12px;color:#5B6880;margin:6px 2px 0">Queda marcada «lejos del punto» en la hoja de ruta.</div></div>');
  }
  D.mandarUbic = function (i) {
    gpsAhora().then(function (g) { return S('api_dsoUbicacion', PIN, C.hoja.hojaId, i, g, ''); }).then(function () { aviso('Ubicación enviada a Logística'); D.abrirParada(i); }).catch(falla);
  };

  /* 4 · la parada: bolsas, caja o carga a mano */
  function vParada() {
    C.vista = 'par';
    var h = C.hoja, i = C.idx, p = h.paradas[i], k = h.hojaId + '|' + i;
    if (!C.borr.par || C.borr.par.k !== k) C.borr.par = { k: k, atendida: p.salida ? !!p.atendida : true, bolsas: p.bolsas || 0, contenedor: p.contenedor || '', inc: p.inc || '', llamada: p.llamada || '', espera: p.espera || '',
      cajaDeja: p.cajaDeja || '', cajaLevanta: p.cajaLevanta || p.cajaPunto || '', cajaEstado: p.cajaEstado || '', foto: (p.fotos || [])[0] || '', subiendo: false };
    var b = C.borr.par, ya = !!p.salida;
    if (!('otro' in b)) Object.assign(b, { fotoAntes: p.fotoAntes || '', fotoDespues: p.fotoDespues || '', otro: (p.otro || []).reduce(function (o, x) { o[x.t] = x.n; return o; }, {}), recibe: p.recibe || '', recibeNombre: p.recibeNombre || '', firma: p.firma || '', paso: 0 });
    if (b.atendida && p.servicio !== 'caja') { vPunto4(); return; }   /* api 3.26 */
    var seg = function (campo, ops) { return '<div class="sc-seg">' + ops.map(function (o) { return '<button type="button" class="' + (b[campo] === o ? 'on' : '') + '" onclick="DSO.parCampo(\'' + campo + '\',\'' + o + '\')">' + o + '</button>'; }).join('') + '</div>'; };
    var fotoBtn = '<label class="sc-foto ' + (b.foto ? 'si' : b.subiendo ? 'sub' : '') + '">' + ic('camara') + (b.foto ? 'Foto del punto lista · tocar para cambiarla' : b.subiendo ? 'Subiendo la foto…' : 'Tomar la foto del punto') + '<input type="file" accept="image/*" capture="environment" style="display:none" onchange="DSO.parFoto(this)"></label>';
    var cuerpo;
    if (!b.atendida) {
      cuerpo = '<div class="jv-card"><div class="jv-tit">' + ic('alerta') + ' No pude recolectar</div><div class="sc-lbl" style="margin-top:6px">¿Qué pasó?</div><div class="sc-inc">' + h.incidencias.map(function (x) { return '<button type="button" class="' + (b.inc === x ? 'on' : '') + '" onclick="DSO.parCampo(\'inc\',\'' + e(x) + '\')">' + e(x) + '</button>'; }).join('') + '</div>' +
        '<div style="margin-top:10px">' + fotoBtn + '</div>' +
        '<div class="sc-lbl" style="margin-top:10px">Llamé al encargado</div><input class="sc-in t" value="' + e(b.llamada) + '" oninput="DSO.con.borr.par.llamada=this.value" placeholder="Ej. 22:51 · no contestó">' +
        '<div class="sc-lbl" style="margin-top:10px">Esperé (minutos)</div><input class="sc-in" inputmode="numeric" value="' + e(b.espera) + '" oninput="DSO.con.borr.par.espera=this.value"></div>' +
        '<div class="sv-nota am">Queda la prueba de que el camión estuvo en el punto: <b>hora de llegada, GPS, foto y llamada</b>. Logística lo ve en la mañana.</div>';
    } else if (p.servicio === 'caja') {
      cuerpo = '<div class="jv-card"><div class="sc-lbl">Cambio de caja</div><div class="sc-caja"><label><small>Dejé la vacía</small><input value="' + e(b.cajaDeja) + '" oninput="DSO.con.borr.par.cajaDeja=this.value" placeholder="C-00"></label><label><small>Levanté la llena</small><input value="' + e(b.cajaLevanta) + '" oninput="DSO.con.borr.par.cajaLevanta=this.value" placeholder="C-00"></label></div>' +
        '<div class="sc-lbl" style="margin-top:12px">¿Cómo venía la caja?</div>' + seg('cajaEstado', ['Media', 'Llena', 'Rebosada', 'Muy pesada']) + '<div style="margin-top:10px">' + fotoBtn + '</div></div>';
    } else {
      cuerpo = (p.servicio === 'bolsas' ? '<div class="jv-card"><div class="sc-lbl">¿Cuántas bolsas?</div><div class="sc-cnt"><button type="button" class="m" onclick="DSO.parBolsas(-1)">–</button><div class="v"><b id="sc-nb">' + b.bolsas + '</b><small>BOLSAS</small></div><button type="button" class="p" onclick="DSO.parBolsas(1)">+</button></div>' +
        '<div class="sc-rap"><button type="button" onclick="DSO.parBolsas(5)">+5</button><button type="button" onclick="DSO.parBolsas(10)">+10</button><button type="button" onclick="DSO.parBolsas(0,true)">Volver a 0</button></div></div>' : '') +
        '<div class="jv-card"><div class="sc-lbl">¿Cómo estaba el contenedor?</div>' + seg('contenedor', ['Vacío', 'Medio', 'Lleno', 'Desbordado']) + '<div style="margin-top:10px">' + fotoBtn + '</div></div>' +
        '<div class="jv-card"><div class="sc-lbl">¿Algo pasó? (opcional)</div><div class="sc-inc">' + ['Mal separada', 'Bolsa rota / derrame', 'Material no permitido', 'Otro'].map(function (x) { return '<button type="button" class="' + (b.inc === x ? 'on' : '') + '" onclick="DSO.parCampo(\'inc\',\'' + e(x) + '\',true)">' + e(x) + '</button>'; }).join('') + '</div></div>';
    }
    cSec(nav(rutaTit(C.hoja), 'ruta') + heroHoja('Parada ' + (i + 1) + ' de ' + h.paradas.length + (p.horaHasta ? ' · recibe hasta ' + e(p.horaHasta) : ''), e(p.nombre), e(p.nota || p.direccion || ''),
      '<div class="jv-est' + (p.lejos ? ' am' : '') + '">✓ Llegaste ' + e(p.llegada) + (p.dist != null ? ' · a ' + N(p.dist) + ' m del punto de recolección' : ' · sin GPS') + '</div>') +
      '<div class="sc-seg" style="grid-template-columns:1fr 1fr;margin:12px 0"><button type="button" class="' + (b.atendida ? 'on' : '') + '" onclick="DSO.parCampo(\'atendida\',true)">Recolecté</button><button type="button" class="' + (!b.atendida ? 'on' : '') + '" onclick="DSO.parCampo(\'atendida\',false)">No pude recolectar</button></div>' +
      cuerpo + '<button class="sc-btn" id="sc-listo" onclick="DSO.parListo()"' + (b.subiendo ? ' disabled' : '') + '>' + (ya ? 'Guardar cambios' : 'Listo · salgo de esta parada') + '</button>' +
      (ya ? '' : '<div style="font-size:12px;color:#5B6880;text-align:center;margin-top:6px">Al tocar «Listo» se anota la hora de salida</div>') + '<button class="sc-btn sec" onclick="DSO.conAbrir(\'ruta\')">Volver a la ruta</button><div style="height:20px"></div>');
  }
  D.parCampo = function (k, v, alterna) { var b = C.borr.par; if (alterna && b[k] === v) v = ''; b[k] = v; if (k === 'atendida' && !v && !b.inc) b.inc = 'Sin acceso'; if (k === 'atendida' && v && /acceso|cerrado|sacaron/i.test(b.inc)) b.inc = ''; vParada(); };
  D.parBolsas = function (n, cero) { var b = C.borr.par; b.bolsas = cero ? 0 : Math.max(0, Math.min(999, (Number(b.bolsas) || 0) + n)); var x = $i('sc-nb'); if (x) x.textContent = b.bolsas; };
  D.parFoto = function (inp) {
    var f = inp.files && inp.files[0]; if (!f) return;
    var b = C.borr.par, h = C.hoja, k = b.k;
    b.subiendo = true; vParada();
    subirFoto(f, 'parada ' + (C.idx + 1)).then(function (id) { if (C.borr.par && C.borr.par.k === k) { C.borr.par.foto = id; C.borr.par.subiendo = false; if (C.vista === 'par' || $i('sc-listo')) vParada(); } aviso('Foto guardada'); },
      function (er) { if (C.borr.par && C.borr.par.k === k) { C.borr.par.subiendo = false; vParada(); } falla(er); });
  };
  function subirFoto(file, que) {
    var h = C.hoja, prep;
    if (!window.ARCH) return Promise.reject(new Error('No cargó el módulo de fotos'));
    return ARCH.preparar(file).then(function (p) { prep = p; return S('api_dsoSubirFoto', PIN, h.hojaId, que, { nombre: 'foto.jpg', mime: p.meta.mime, tamano: p.meta.tamano }); })
      .then(function (r) { return ARCH.subir(r.subida, prep).then(function () { return S('api_dsoFotoLista', PIN, h.hojaId, r.archivoId); }); })
      .then(function (r) { return r.archivoId; });
  }
  D.parListo = function () {
    var b = C.borr.par, i = C.idx, p = C.hoja.paradas[i];
    if (b.atendida && p.servicio !== 'caja') { p4Guardar(); return; }   /* api 3.26 */
    if (b.subiendo) { aviso('Espera a que suba la foto'); return; }
    if (!b.foto) { aviso('Falta la foto del punto'); return; }
    if (!b.atendida && !b.inc) { aviso('Elige qué pasó'); return; }
    if (b.atendida && p.servicio === 'caja' && !b.cajaLevanta) { aviso('Escribe el número de la caja que levantaste'); return; }
    S('api_dsoParada', PIN, C.hoja.hojaId, i, { atendida: b.atendida, bolsas: b.bolsas, contenedor: b.contenedor || b.cajaEstado, inc: b.inc, llamada: b.llamada, espera: b.espera, cajaDeja: b.cajaDeja, cajaLevanta: b.cajaLevanta, cajaEstado: b.cajaEstado, foto: b.foto })
      .then(function (r) {
        C.borr.par = null; aviso(r.pendientes ? 'Listo · faltan ' + r.pendientes + ' parada(s)' : 'Listo · terminaste las paradas');
        return traer().then(function () { var porT = C.hoja.paradas.filter(function (x) { return x.atendida && x.viaje < 0; }).length; if (C.hoja.tipo === 'rolloff' && b.atendida && b.cajaLevanta && porT) D.conAbrir('rell'); else D.conAbrir('ruta'); });
      }).catch(falla);
  };

  /* ═══ api 3.26 · el punto en 4 pasos (prueba del 8 oct): foto de antes → bolsas → foto de después → quién recibe ═══ */
  var P4 = ['Foto de antes', 'Contar las bolsas', 'Foto de después', '¿Quién recibe?'];
  var OTROS = { carton: ['Cajas de cartón', 'cajas'], aceite: ['Aceite de cocina usado', 'galones'], vidrio: ['Vidrio', 'bolsas'], voluminoso: ['Voluminoso', 'piezas'], otro: ['Otro', 'piezas'] };
  D.OTROS = OTROS;
  function p4ok(b, k) { return k === 0 ? !!(b.fotoAntes && b.contenedor) : k === 1 ? b.bolsas > 0 : k === 2 ? !!b.fotoDespues : (b.recibe === 'nadie' || (b.recibe === 'encargado' && !!b.firma && !!String(b.recibeNombre || '').trim())); }
  function p4foto(b, k, txt) {
    var sub = b.subiendo === k;
    return '<label class="sc-foto ' + (b[k] ? 'si' : sub ? 'sub' : '') + '">' + ic('camara') + (b[k] ? '✓ Foto lista · tocar para cambiarla' : sub ? 'Subiendo la foto…' : txt) +
      '<input type="file" accept="image/*" capture="environment" style="display:none" onchange="DSO.p4Foto(this,\'' + k + '\')"></label>';
  }
  function vPunto4() {
    C.vista = 'par';
    var h = C.hoja, i = C.idx, p = h.paradas[i], b = C.borr.par, k = Math.min(b.paso || 0, 3), cuerpo;
    if (k === 0) cuerpo = p4foto(b, 'fotoAntes', 'Tomar la foto de antes · el depósito como lo encontraste') +
      '<div class="sc-lbl" style="margin-top:12px">¿Cómo estaba el depósito?</div><div class="sc-seg" style="grid-template-columns:repeat(3,1fr)">' +
      ['Medio', 'Lleno', 'Rebosado'].map(function (o) { return '<button type="button" class="' + (b.contenedor === o ? 'on' : '') + '" onclick="DSO.p4Set(\'contenedor\',\'' + o + '\')">' + o + '</button>'; }).join('') + '</div>';
    else if (k === 1) cuerpo = '<div class="sc-cnt"><button type="button" class="m" onclick="DSO.p4Bol(-1)">–</button><div class="v"><b>' + b.bolsas + '</b><small>BOLSAS</small></div><button type="button" class="p" onclick="DSO.p4Bol(1)">+</button></div>' +
      '<div class="sc-rap"><button type="button" onclick="DSO.p4Bol(5)">+5</button><button type="button" onclick="DSO.p4Bol(10)">+10</button><button type="button" onclick="DSO.p4Bol(-5)">–5</button></div>' +
      '<div class="sc-lbl" style="margin-top:14px">¿Encontraste otro material?</div><div class="sc-inc">' + Object.keys(OTROS).map(function (o) { return '<button type="button" class="' + (b.otro[o] ? 'on' : '') + '" onclick="DSO.p4Otro(\'' + o + '\')">' + OTROS[o][0] + '</button>'; }).join('') + '</div>' +
      Object.keys(b.otro).map(function (o) { return '<div class="p4-cant"><span>' + OTROS[o][0] + '<small>' + OTROS[o][1] + '</small></span><button type="button" onclick="DSO.p4Cant(\'' + o + '\',-1)">–</button><b>' + b.otro[o] + '</b><button type="button" onclick="DSO.p4Cant(\'' + o + '\',1)">+</button></div>'; }).join('');
    else if (k === 2) cuerpo = p4foto(b, 'fotoDespues', 'Tomar la foto de después · el depósito limpio');
    else cuerpo = '<div class="sc-seg" style="grid-template-columns:1fr 1fr"><button type="button" class="' + (b.recibe === 'encargado' ? 'on' : '') + '" onclick="DSO.p4Set(\'recibe\',\'encargado\')">Hay encargado</button><button type="button" class="' + (b.recibe === 'nadie' ? 'on' : '') + '" onclick="DSO.p4Set(\'recibe\',\'nadie\')">No hay nadie</button></div>' +
      (b.recibe === 'encargado' ? '<div class="sc-lbl" style="margin-top:12px">Nombre de quien recibe</div><input class="sc-in t" value="' + e(b.recibeNombre || '') + '" oninput="DSO.con.borr.par.recibeNombre=this.value" placeholder="Nombre">' +
        '<div class="sc-lbl" style="margin-top:10px">Firma</div>' + (b.firma ? '<div class="p4-ok">✓ Firma guardada <button type="button" onclick="DSO.p4Set(\'firma\',\'\')">Volver a firmar</button></div>'
          : '<div class="sv-firma" id="p4-firma"><canvas></canvas><small>' + (b.subiendo === 'firma' ? 'Guardando la firma…' : 'Firme aquí con el dedo') + '</small></div><div class="sc-rap" style="margin-top:6px"><button type="button" onclick="DSO.p4FirmaBorrar()">Borrar</button><button type="button" onclick="DSO.p4FirmaGuardar()">Guardar la firma</button></div>') : '') +
      (b.recibe === 'nadie' ? '<div class="sv-nota" style="margin-top:10px">Sin encargado: la constancia son las fotos de antes y después, con la hora y el GPS.</div>' : '');
    var todo = p4ok(b, 0) && p4ok(b, 1) && p4ok(b, 2) && p4ok(b, 3);
    cSec(nav(rutaTit(h), 'ruta') + heroHoja('Parada ' + (i + 1) + ' de ' + h.paradas.length + (p.horaHasta ? ' · recibe hasta ' + e(p.horaHasta) : ''), e(p.nombre), e(p.nota || p.direccion || ''),
      '<div class="jv-est' + (p.lejos ? ' am' : '') + '">✓ Llegaste ' + e(p.llegada) + (p.dist != null ? ' · a ' + N(p.dist) + ' m del punto de recolección' : ' · sin GPS') + '</div>') +
      '<div class="sc-seg" style="grid-template-columns:1fr 1fr;margin:12px 0"><button type="button" class="on">Recolecté</button><button type="button" onclick="DSO.parCampo(\'atendida\',false)">No pude recolectar</button></div>' +
      '<div class="p4-paso">' + P4.map(function (t, j) { return '<span class="' + (j < k ? 'ok' : j === k ? 'on' : '') + '"></span>'; }).join('') + '</div>' +
      '<div class="jv-card p4-act"><div class="jv-tit"><span class="n">' + (k + 1) + '</span> ' + P4[k] + '<span class="r">paso ' + (k + 1) + ' de 4</span></div>' + cuerpo + '</div>' +
      (k < 3 ? '<button class="sc-btn" ' + (p4ok(b, k) && !b.subiendo ? '' : 'disabled') + ' onclick="DSO.p4Sig()">Siguiente →</button>'
        : '<button class="sc-btn v" ' + (todo && !b.subiendo ? '' : 'disabled') + ' onclick="DSO.parListo()">✓ Terminé este punto</button><div style="font-size:12px;color:#5B6880;text-align:center;margin-top:6px">Se anota la hora de salida y queda el registro del punto</div>') +
      (k > 0 ? '<button class="mc-mal" onclick="DSO.p4Atras()">← Volver al paso anterior</button>' : '') +
      '<button class="sc-btn sec" onclick="DSO.conAbrir(\'ruta\')">Volver a la ruta</button><div style="height:20px"></div>');
    if (k === 3 && b.recibe === 'encargado' && !b.firma && b.subiendo !== 'firma') p4Lienzo();
  }
  D.p4Set = function (k, v) { C.borr.par[k] = v; vPunto4(); };
  D.p4Bol = function (n) { var b = C.borr.par; b.bolsas = Math.max(0, Math.min(999, (Number(b.bolsas) || 0) + n)); vPunto4(); };
  D.p4Otro = function (o) { var b = C.borr.par; if (b.otro[o]) delete b.otro[o]; else b.otro[o] = 1; vPunto4(); };
  D.p4Cant = function (o, n) { var b = C.borr.par; b.otro[o] = Math.max(1, Math.min(999, (b.otro[o] || 1) + n)); vPunto4(); };
  D.p4Sig = function () { var b = C.borr.par; if (b.subiendo) { aviso('Espera a que termine de subir'); return; } if (!p4ok(b, b.paso || 0)) { aviso('Falta completar este paso'); return; } b.paso = (b.paso || 0) + 1; vPunto4(); };
  D.p4Atras = function () { var b = C.borr.par; b.paso = Math.max(0, (b.paso || 0) - 1); vPunto4(); };
  D.p4Foto = function (inp, k) {
    var f = inp.files && inp.files[0]; if (!f) return;
    var b = C.borr.par, kk = b.k; b.subiendo = k; vPunto4();
    subirFoto(f, (k === 'fotoAntes' ? 'antes' : 'después') + ' · parada ' + (C.idx + 1)).then(function (id) { var x = C.borr.par; if (x && x.k === kk) { x[k] = id; x.subiendo = false; if (C.vista === 'par') vPunto4(); } aviso('Foto guardada'); },
      function (er) { var x = C.borr.par; if (x && x.k === kk) { x.subiendo = false; if (C.vista === 'par') vPunto4(); } falla(er); });
  };
  var P4L = null;
  function p4Lienzo() {
    var caja = $i('p4-firma'); if (!caja) return; var cv = caja.querySelector('canvas'); if (!cv) return;
    var r = caja.getBoundingClientRect(), k = window.devicePixelRatio || 1; cv.width = r.width * k; cv.height = r.height * k;
    var cx = cv.getContext('2d'); cx.scale(k, k); cx.lineWidth = 2.4; cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.strokeStyle = '#0f2140'; cv.style.touchAction = 'none';
    var dib = false, tr = 0, pos = function (ev) { var q = cv.getBoundingClientRect(); return [ev.clientX - q.left, ev.clientY - q.top]; };
    cv.onpointerdown = function (ev) { dib = true; tr++; var p = pos(ev); cx.beginPath(); cx.moveTo(p[0], p[1]); try { cv.setPointerCapture(ev.pointerId); } catch (er) {} ev.preventDefault(); };
    cv.onpointermove = function (ev) { if (!dib) return; var p = pos(ev); cx.lineTo(p[0], p[1]); cx.stroke(); };
    cv.onpointerup = cv.onpointercancel = function () { dib = false; };
    P4L = { cv: cv, n: function () { return tr; }, borrar: function () { cx.clearRect(0, 0, cv.width, cv.height); tr = 0; } };
  }
  D.p4FirmaBorrar = function () { if (P4L) P4L.borrar(); };
  D.p4FirmaGuardar = function () {
    if (!P4L || !P4L.n()) { aviso('Falta la firma'); return; }
    if (!String(C.borr.par.recibeNombre || '').trim()) { aviso('Escribe el nombre de quien recibe'); return; }
    var b = C.borr.par, kk = b.k, c2 = document.createElement('canvas'); c2.width = 600; c2.height = Math.max(120, Math.round(600 * P4L.cv.height / P4L.cv.width));
    var x = c2.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c2.width, c2.height); x.drawImage(P4L.cv, 0, 0, c2.width, c2.height);
    c2.toBlob(function (bl) {
      if (!bl) { aviso('No se pudo guardar la firma'); return; }
      var f; try { f = new File([bl], 'firma.jpg', { type: 'image/jpeg' }); } catch (er) { f = bl; }
      b.subiendo = 'firma'; vPunto4();
      subirFoto(f, 'firma · parada ' + (C.idx + 1)).then(function (id) { var y = C.borr.par; if (y && y.k === kk) { y.firma = id; y.subiendo = false; if (C.vista === 'par') vPunto4(); } aviso('Firma guardada'); },
        function (er) { var y = C.borr.par; if (y && y.k === kk) { y.subiendo = false; if (C.vista === 'par') vPunto4(); } falla(er); });
    }, 'image/jpeg', .8);
  };
  function p4Guardar() {
    var b = C.borr.par, i = C.idx;
    if (b.subiendo) { aviso('Espera a que termine de subir'); return; }
    for (var k = 0; k < 4; k++) if (!p4ok(b, k)) { b.paso = k; vPunto4(); aviso('Falta: ' + P4[k].toLowerCase()); return; }
    S('api_dsoParada', PIN, C.hoja.hojaId, i, { v3: true, atendida: true, bolsas: b.bolsas, contenedor: b.contenedor, inc: '', foto: b.fotoAntes, fotoAntes: b.fotoAntes, fotoDespues: b.fotoDespues,
      otro: Object.keys(b.otro).map(function (o) { return { t: o, n: b.otro[o] }; }), recibe: b.recibe, recibeNombre: b.recibeNombre || '', firma: b.firma || '' })
      .then(function (r) { C.borr.par = null; aviso(r.pendientes ? 'Punto terminado · faltan ' + r.pendientes : 'Punto terminado · terminaste las paradas'); return traer().then(function () { D.conAbrir('ruta'); }); }).catch(falla);
  }

  /* ═══ api 3.26 · la descarga: elegir dónde (puede cambiar) y si es planta (pesa después) o báscula (ticket) ═══ */
  D.tkSet = function (k, v) { C.borr.tk[k] = v; vRelleno(); };
  D.tkBol = function (n) { var t = C.borr.tk; t.bolsas = Math.max(0, Math.min(9999, (Number(t.bolsas) || 0) + n)); vRelleno(); };
  function vDescElegir(h, t, carga, nb) {
    var L = (h.destinos || []).slice(); if (h.relleno && L.indexOf(h.relleno) < 0) L.unshift(h.relleno);
    cSec(nav('Descarga', 'planta') + heroHoja('Viaje ' + (h.viajes.length + 1) + ' · ' + carga.length + ' parada' + (carga.length === 1 ? '' : 's') + ' · ' + N(nb) + ' bolsas', 'La descarga', 'Planificada: ' + e(h.relleno || '—')) +
      '<div class="jv-card"><div class="sc-lbl">¿Dónde descargas?</div><div class="p4-dst">' + L.map(function (d) { return '<button type="button" class="' + (t.relleno === d ? 'on' : '') + '" onclick="DSO.tkSet(\'relleno\',this.getAttribute(\'data-d\'))" data-d="' + e(d) + '">' + e(d) + (d === h.relleno ? '<small>la planificada</small>' : '<small>cambiar a este destino</small>') + '</button>'; }).join('') + '</div>' +
      '<div class="sc-lbl" style="margin-top:10px">¿Otro lugar?</div><input class="sc-in t" placeholder="Escribe el nombre del lugar" onchange="DSO.tkSet(\'relleno\',this.value)"></div>' +
      '<div class="jv-card"><div class="sc-lbl">¿Cómo se pesa ahí?</div><div class="sc-seg" style="grid-template-columns:1fr 1fr"><button type="button" onclick="DSO.tkSet(\'modo\',\'planta\')">Planta<br><small style="font-weight:700">pesan después</small></button><button type="button" onclick="DSO.tkSet(\'modo\',\'bascula\')">Báscula<br><small style="font-weight:700">me dan ticket</small></button></div></div>' +
      '<button class="sc-btn sec" onclick="DSO.conAbrir(\'ruta\')">Volver a la ruta</button><div style="height:20px"></div>');
  }
  function vDescPlanta(h, t, carga, nb, ll) {
    cSec(nav('Descarga', 'planta') + heroHoja('Viaje ' + (h.viajes.length + 1) + ' · ' + e(t.relleno), 'Descarga en planta', 'No se pesa al llegar: la planta manda el peso después') +
      (!ll ? '<button class="sc-btn" onclick="DSO.llegueRelleno()">✓ Llegué a la descarga</button><div style="font-size:12px;color:#5B6880;text-align:center;margin-top:6px">Se anota la hora y el GPS de llegada</div>' : '<div class="jv-card"><div class="jv-fila"><b>Llegada a la descarga</b><span>' + e(ll.llegada) + '</span></div></div>') +
      '<div class="jv-card"><div class="sc-lbl">Bolsas que entregas</div><div class="sc-cnt"><button type="button" class="m" onclick="DSO.tkBol(-1)">–</button><div class="v"><b>' + N(t.bolsas) + '</b><small>BOLSAS</small></div><button type="button" class="p" onclick="DSO.tkBol(1)">+</button></div>' +
      '<div style="font-size:12px;color:#5B6880;text-align:center">Contaste ' + N(nb) + ' en los puntos</div>' +
      '<div style="margin-top:10px"><label class="sc-foto ' + (t.foto ? 'si' : t.subiendo ? 'sub' : '') + '">' + ic('camara') + (t.foto ? 'Foto de la descarga lista · tocar para cambiarla' : t.subiendo ? 'Subiendo la foto…' : 'Foto de la descarga') + '<input type="file" accept="image/*" capture="environment" style="display:none" onchange="DSO.tkFoto(this)"></label></div>' +
      '<div class="sc-lbl" style="margin-top:10px">¿Quién recibió en la planta?</div><input class="sc-in t" value="' + e(t.recibio || '') + '" oninput="DSO.con.borr.tk.recibio=this.value" placeholder="Nombre"></div>' +
      '<button class="sc-btn v" onclick="DSO.descGuardar()"' + (t.subiendo ? ' disabled' : '') + '>✓ Terminé la descarga</button><button class="mc-mal" onclick="DSO.tkSet(\'modo\',\'\')">Cambiar el destino o cómo se pesa</button><button class="sc-btn sec" onclick="DSO.conAbrir(\'ruta\')">Volver a la ruta</button><div style="height:20px"></div>');
  }
  D.descGuardar = function () {
    var t = C.borr.tk;
    if (t.subiendo) { aviso('Espera a que suba la foto'); return; }
    if (!t.foto) { aviso('Falta la foto de la descarga'); return; }
    S('api_dsoDescarga', PIN, C.hoja.hojaId, { relleno: t.relleno, bolsas: t.bolsas, foto: t.foto, recibio: t.recibio || '' })
      .then(function (r) { C.borr.tk = null; aviso(r.repetido ? 'Esa descarga ya estaba anotada' : 'Descarga anotada · la planta manda el peso después'); return traer().then(function () { D.conAbrir('ruta'); }); }).catch(falla);
  };

  /* ═══ api 3.26 · Inicio de la oficina: la ruta en vivo ═══ */
  function vvSig(h) { for (var i = 0; i < h.paradas.length; i++) if (!h.paradas[i].salida) return i; return -1; }
  function vvOtro(p) { return (p.otro || []).map(function (o) { return o.n + ' ' + ((OTROS[o.t] || ['', ''])[1]) + ' · ' + ((OTROS[o.t] || [o.t])[0]).toLowerCase(); }).join(', '); }
  function vvAvisos(I) {
    if (I._vv) return; I._vv = true;
    (I.noche || []).forEach(function (h) { h.paradas.forEach(function (p) { if (p.atendida && (p.otro || []).length) I.atencion.push({ tono: '', titulo: 'Otro material · ' + p.nombre, detalle: vvOtro(p) + ' · ' + (h.nombre || h.hojaId), accion: 'Ver', hojaId: h.hojaId, ir: 'salidas' }); }); });
  }
  function vvEstado(h) {
    var s = vvSig(h), descargo = (h.viajes || []).length > 0;
    if (h.estado === 'cerrada') return ['Ruta cerrada ' + e((h.cierre || {}).hora || ''), 'v'];
    if (h.estado === 'por_firmar') return ['Decida la salida', 'r'];
    if (h.estado === 'no_sale') return ['No sale', 'r'];
    if (h.estado === 'publicada') return ['Esperando la revisión', 'a'];
    if (h.estado === 'borrador') return ['Borrador', 'a'];
    if (s >= 0) return ['Va al punto ' + (s + 1) + ' de ' + h.paradas.length, ''];
    return descargo && !h.sinTicket ? ['Regresando al patio', ''] : ['Va a la descarga', ''];
  }
  function vvHtml(h) {
    var P = h.paradas, s = vvSig(h), es = vvEstado(h), fi = h.firma || null, ult = null;
    P.forEach(function (p) { if (p.llegada) ult = p; });
    var sal = fi && fi.decision === 'sale' ? (fi.por === 'Salida automática' ? 'salida automática ' : 'salió ') + e(String(fi.en || '').slice(11, 16)) : 'sale ' + e(h.salida || '');
    var hechos = P.filter(function (p) { return p.salida; }).length, sin = P.filter(function (p) { return p.salida && !p.atendida; }).length;
    var at = P.filter(function (p) { return p.atendida; }), firmaron = at.filter(function (p) { return p.recibe === 'encargado'; }).length, nadie = at.filter(function (p) { return p.recibe === 'nadie'; }).length;
    var lin = '<div class="vv-lin">' + P.map(function (p, i) {
      var c = p.salida ? (p.atendida ? 'h' : 's') : i === s ? 'n' : '';
      return '<button type="button" class="pt ' + c + '" onclick="DSO.vvDet(\'' + e(h.hojaId) + '\',' + i + ')" title="' + e(p.nombre) + '"><span class="c">' + (p.salida ? (p.atendida ? '✓' : '✕') : i + 1) + '</span><b>' + e(String(p.nombre).replace(/^Sucursal\s+/i, '')) + '</b><small>' + e(p.llegada || (i === s ? 'sigue' : '')) + '</small></button>';
    }).join('') + '<span class="pt d' + ((h.viajes || []).length ? ' h' : '') + '"><span class="c">D</span><b>' + e(String(h.relleno || 'descarga').split(' ')[0]) + '</b><small>' + e(((h.viajes || [])[0] || {}).llegada || 'descarga') + '</small></span></div>';
    var va = '';
    if (h.estado === 'en_ruta' && s >= 0) { var q = P[s]; va = '<div class="vv-va"><div class="et">Va hacia · punto ' + (s + 1) + ' de ' + P.length + '</div><div class="n">' + e(q.nombre) + '</div><div class="z">' + (q.nota ? 'Dónde se recoge: ' + e(q.nota) + '<br>' : '') + (q.horaDesde ? 'Recibe ' + e(q.horaDesde) + '–' + e(q.horaHasta) : '') + '</div></div>'; }
    else if (h.estado === 'en_ruta') va = '<div class="vv-va"><div class="et">Va hacia · descarga</div><div class="n">' + e(h.relleno || '—') + '</div></div>';
    var ul = ult ? '<div class="vv-va u' + (ult.salida && !ult.atendida ? ' s' : '') + '" onclick="DSO.vvDet(\'' + e(h.hojaId) + '\',' + P.indexOf(ult) + ')"><div class="et">Último punto · ' + e(ult.llegada) + (ult.salida ? '–' + e(ult.salida) : '') + '</div><div class="n">' + e(ult.nombre) + '</div><div class="z">' +
      (!ult.salida ? 'está en el punto' : ult.atendida ? N(ult.bolsas) + ' bolsas · ' + (ult.recibe === 'encargado' ? 'firmó ' + e(ult.recibeNombre) : ult.recibe === 'nadie' ? 'sin encargado' : '') + ((ult.otro || []).length ? ' · ' + e(vvOtro(ult)) : '') : 'No se pudo recolectar · ' + e(ult.inc || '')) + ' · ver fotos →</div></div>' : '';
    var cif = '<div class="vv-cif">' + [[hechos + '/' + P.length, 'puntos'], [N(h.bolsas), 'bolsas'], [sin, 'sin acceso'], [firmaron, 'firmaron'], [nadie, 'sin encargado'], [at.filter(function (p) { return (p.otro || []).length; }).length, 'con otro material']].map(function (c) { return '<div><b>' + c[0] + '</b><span>' + c[1] + '</span></div>'; }).join('') + '</div>';
    var filas = P.map(function (p, i) {
      var ev = !p.salida ? '' : !p.atendida ? '<span class="sv-chip r">' + e(p.inc || 'sin acceso') + '</span>' + (p.llamada ? ' <span class="sv-chip g">📞 ' + e(p.llamada) + '</span>' : '') :
        (p.fotoAntes ? '<span class="sv-chip v">📷 antes</span> ' : '') + (p.fotoDespues ? '<span class="sv-chip v">📷 después</span> ' : '') + (p.recibe === 'encargado' ? '<span class="sv-chip">✍ ' + e(p.recibeNombre) + '</span>' : p.recibe === 'nadie' ? '<span class="sv-chip g">sin encargado</span>' : (p.fotos || []).length ? '<span class="sv-chip v">📷 foto</span>' : '');
      return '<tr class="clic' + (!p.salida ? (i === s ? ' nx' : ' pe') : '') + '" onclick="DSO.vvDet(\'' + e(h.hojaId) + '\',' + i + ')"><td>' + (i + 1) + '</td><td><b>' + e(p.nombre) + '</b><small>' + (i === s && !p.salida ? (p.llegada ? 'está en el punto' : 'va hacia aquí') : e(p.nota || '')) + '</small></td><td class="n">' + e(p.llegada || '—') + '</td><td class="n">' + e(p.salida || '') + '</td><td class="n">' + (p.salida && p.atendida ? '<b>' + N(p.bolsas) + '</b>' : '') + '</td><td>' + e(vvOtro(p)) + '</td><td>' + ev + '</td></tr>';
    }).join('');
    return '<div class="pl-card vv"><div class="vv-h"><div class="tx"><div class="t1">' + chipTurno(turnoDe(h)) + ' ' + e(h.nombre || h.hojaId) + ' · ' + (TIPOS[h.tipo] || TIPOS.compactador)[1] + ' ' + e(h.unidad) + '</div>' +
      '<div class="t2">' + e(h.conductor || 'sin conductor') + (h.ayudantes && h.ayudantes.length ? ' + ' + h.ayudantes.length + ' ayudante' + (h.ayudantes.length > 1 ? 's' : '') : '') + ' · ' + sal + '<br>Descarga: <b>' + e(h.relleno || '—') + '</b></div></div>' +
      '<div class="vv-est"><span class="big ' + es[1] + '">' + es[0] + '</span>' + (ult ? '<small>último registro ' + e(ult.salida || ult.llegada) + '</small>' : '') + '</div></div>' + lin +
      '<div class="vv-g"><div class="vv-mapa" id="vv-m-' + e(h.hojaId) + '"></div><div class="vv-col">' + va + ul + cif + '</div></div>' +
      '<div class="sv-scroll" style="margin-top:12px"><table class="sv-tb"><thead><tr><th>#</th><th>Sucursal</th><th class="n">Llegó</th><th class="n">Salió</th><th class="n">Bolsas</th><th>Otro material</th><th>Evidencia</th></tr></thead><tbody>' + filas + '</tbody></table></div></div>';
  }
  function vvBloque(I) {
    var L = (I.noche || []).filter(function (h) { return ['en_ruta', 'por_firmar', 'cerrada', 'publicada'].indexOf(h.estado) >= 0; });
    return L.length ? '<div class="ini-bloque"><div class="ini-bt"><h3>Ruta en vivo</h3><button class="x" onclick="DSO.mostrar(\'s-hub\')">Actualizar ↻</button></div>' + L.map(vvHtml).join('') + '</div>' : '';
  }
  function vvMapas(I) {
    if (!window.L) return;
    (I.noche || []).forEach(function (h) {
      var el = $i('vv-m-' + h.hojaId); if (!el) return;
      var m = L.map(el, { zoomControl: true }); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
      var s = vvSig(h), pts = [], hecho = [];
      h.paradas.forEach(function (p, i) {
        if (!p.lat) return; var c = p.salida ? (p.atendida ? 'h' : 's') : i === s ? 'n' : '';
        L.marker([p.lat, p.lng], { icon: L.divIcon({ className: '', html: '<div class="vv-pin ' + c + '">' + (i + 1) + '</div>', iconSize: [26, 26], iconAnchor: [13, 13] }), zIndexOffset: i === s ? 500 : 0 }).addTo(m).bindTooltip(e(p.nombre) + (p.llegada ? ' · ' + p.llegada : '')).on('click', function () { D.vvDet(h.hojaId, i); });
        pts.push([p.lat, p.lng]); if (p.salida || p.llegada) hecho.push([p.lat, p.lng]);
      });
      if (hecho.length > 1) L.polyline(hecho, { color: '#2f9e44', weight: 5, opacity: .85 }).addTo(m);
      var falta = hecho.length ? [hecho[hecho.length - 1]] : []; h.paradas.forEach(function (p) { if (!p.salida && !p.llegada && p.lat) falta.push([p.lat, p.lng]); });
      if (falta.length > 1) L.polyline(falta, { color: '#14306b', weight: 4, dashArray: '8 8', opacity: .6 }).addTo(m);
      if (pts.length) m.fitBounds(pts, { padding: [24, 24], maxZoom: 15 }); else m.setView([9.0, -79.5], 11);
      setTimeout(function () { try { m.invalidateSize(); } catch (er) {} }, 150);
    });
    clearTimeout(D._vvT);
    D._vvT = setTimeout(function () { if (window.INI_TAB === 's-hub' && D.modo === 'sol' && !$i('dso-fondo')) { var y = window.scrollY; S('api_dsoInicio', PIN, hoy()).then(function (r) { D.ini = r; pintarHub(seccion('s-hub')); window.scrollTo(0, y); }).catch(function () {}); } }, 60000);
  }
  /* detalle de un punto con sus fotos (se piden al abrir) */
  D.vvDet = function (hojaId, i) {
    var h = ((D.ini && D.ini.noche) || []).filter(function (x) { return x.hojaId === hojaId; })[0] || (D.det && D.det.hoja && D.det.hoja.hojaId === hojaId ? D.det.hoja : null); if (!h) return;
    var p = h.paradas[i]; if (!p) return;
    var fotos = p.atendida ? [[p.fotoAntes, 'Antes · ' + (p.llegada || '') + (p.contenedor ? ' · depósito ' + String(p.contenedor).toLowerCase() : '')], [p.fotoDespues, 'Después · ' + (p.salida || '')]] : [[(p.fotos || [])[0], 'El local · ' + (p.llegada || '')]];
    if (p.atendida && !p.fotoAntes && (p.fotos || []).length) fotos = [[p.fotos[0], 'Foto del punto']];
    if (p.firma) fotos.push([p.firma, 'Firma · ' + (p.recibeNombre || '')]);
    fotos = fotos.filter(function (f) { return f[0]; });
    var dat = [['Llegó', p.llegada || '—'], ['Salió', p.salida || '—'], ['GPS', p.dist != null ? N(p.dist) + ' m del punto' : '—']];
    if (p.atendida) dat.push(['Bolsas', N(p.bolsas)], ['Otro material', vvOtro(p) || 'No'], ['Quién recibió', p.recibe === 'encargado' ? p.recibeNombre + ' (firmó)' : p.recibe === 'nadie' ? 'Sin encargado · las fotos son la constancia' : '—']);
    else if (p.salida) dat.push(['Qué pasó', p.inc || '—'], ['Llamada', p.llamada || '—'], ['Esperó', p.espera ? p.espera + ' min' : '—']);
    modal('Punto ' + (i + 1) + ' · ' + p.nombre, (fotos.length ? '<div class="vv-fotos">' + fotos.map(function (f, k) { return '<figure><div class="ph" id="vv-f' + k + '">Cargando…</div><figcaption>' + e(f[1]) + '</figcaption></figure>'; }).join('') + '</div>' : (p.salida ? '' : '<div class="sv-vacio"><b>Todavía no llega</b></div>')) +
      dat.map(function (x) { return '<div class="sv-ck"><span>' + x[0] + '</span><b>' + e(x[1]) + '</b></div>'; }).join(''), '<button class="pl-btn a" data-x>Cerrar</button>');
    fotos.forEach(function (f, k) { S('api_dsoFoto', PIN, f[0]).then(function (r) { var z = $i('vv-f' + k); if (z) z.innerHTML = '<a href="' + e(r.url) + '" target="_blank" rel="noopener"><img src="' + e(r.url) + '" alt=""></a>'; }, function () { var z = $i('vv-f' + k); if (z) z.textContent = 'No se pudo abrir la foto'; }); });
  };

  /* 5 · relleno: llegada y ticket de báscula */
  function vRelleno() {
    C.vista = 'rell';
    var h = C.hoja, b = C.borr;
    if (!b.tk || b.tk.hojaId !== h.hojaId) b.tk = { hojaId: h.hojaId, ticket: '', lleno: '', vacio: '', neto: '', foto: '', subiendo: false };
    var t = b.tk, carga = h.paradas.filter(function (p) { return p.atendida && p.viaje < 0; }), ll = h.revision && h.revision.llegadaRelleno;
    var neto = (Number(t.lleno) > 0 && Number(t.vacio) > 0) ? Number(t.lleno) - Number(t.vacio) : Number(t.neto) || 0;
    /* api 3.26 · primero dónde descarga y cómo se pesa */
    var nb = carga.reduce(function (a, p) { return a + (p.bolsas || 0); }, 0);
    if (t.relleno == null) t.relleno = h.relleno || ''; if (t.bolsas == null) t.bolsas = nb;
    if (h.tipo !== 'rolloff' && !t.modo) { vDescElegir(h, t, carga, nb); return; }
    if (t.modo === 'planta') { vDescPlanta(h, t, carga, nb, ll); return; }
    cSec(nav('Descarga', 'planta') + heroHoja('Viaje ' + (h.viajes.length + 1) + ' · ' + e(t.relleno || h.relleno || 'relleno'), 'Ticket de báscula', carga.length + ' parada' + (carga.length === 1 ? '' : 's') + ' en este viaje' + (h.tipo === 'rolloff' ? ' · caja ' + e(carga.map(function (p) { return p.cajaLevanta; }).filter(Boolean).join(', ')) : ' · ' + N(carga.reduce(function (a, p) { return a + (p.bolsas || 0); }, 0)) + ' bolsas')) +
      (!ll ? '<button class="sc-btn" onclick="DSO.llegueRelleno()">✓ Llegué al relleno</button><div style="font-size:12px;color:#5B6880;text-align:center;margin-top:6px">Se anota la hora y el GPS de llegada</div>' : '<div class="jv-card"><div class="jv-fila"><b>Llegada al relleno</b><span>' + e(ll.llegada) + '</span></div></div>') +
      '<div class="jv-card"><div class="sc-lbl">Número del ticket</div><input class="sc-in" value="' + e(t.ticket) + '" oninput="DSO.con.borr.tk.ticket=this.value" placeholder="Ej. 104882">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><div><div class="sc-lbl">Peso lleno (kg)</div><input class="sc-in" inputmode="numeric" value="' + e(t.lleno) + '" oninput="DSO.tkPeso(\'lleno\',this.value)"></div><div><div class="sc-lbl">Peso vacío (kg)</div><input class="sc-in" inputmode="numeric" value="' + e(t.vacio) + '" oninput="DSO.tkPeso(\'vacio\',this.value)"></div></div>' +
      '<div class="sc-lbl" style="margin-top:10px">Si el ticket solo trae el neto</div><input class="sc-in" inputmode="numeric" value="' + e(t.neto) + '" oninput="DSO.tkPeso(\'neto\',this.value)" placeholder="Neto (kg)">' +
      '<div style="margin-top:10px;background:#eaf6e4;border:1px solid #bfe3b3;border-radius:12px;padding:12px;display:flex;justify-content:space-between;align-items:center"><b style="color:#1e5a2a">Neto</b><b style="font-size:22px;color:#1e5a2a" id="sc-neto">' + (neto > 0 ? N(neto) + ' kg' : '—') + '</b></div>' +
      '<div style="margin-top:10px"><label class="sc-foto ' + (t.foto ? 'si' : t.subiendo ? 'sub' : '') + '">' + ic('camara') + (t.foto ? 'Foto del ticket lista · tocar para cambiarla' : t.subiendo ? 'Subiendo la foto…' : 'Foto del ticket (comprobante)') + '<input type="file" accept="image/*" capture="environment" style="display:none" onchange="DSO.tkFoto(this)"></label></div></div>' +
      '<button class="sc-btn am" onclick="DSO.tkGuardar()"' + (t.subiendo ? ' disabled' : '') + '>Guardar el ticket</button>' + (h.tipo !== 'rolloff' ? '<button class="mc-mal" onclick="DSO.tkSet(\'modo\',\'\')">Cambiar el destino o cómo se pesa</button>' : '') + '<button class="sc-btn sec" onclick="DSO.conAbrir(\'ruta\')">Volver a la ruta</button><div style="height:20px"></div>');
  }
  D.llegueRelleno = function () { gpsAhora().then(function (g) { return S('api_dsoLlegue', PIN, C.hoja.hojaId, 'relleno', g); }).then(function (r) { aviso('Llegada al relleno ' + r.hora); return traer(); }).then(vRelleno).catch(falla); };
  D.tkPeso = function (k, v) { var t = C.borr.tk; t[k] = String(v).replace(/[^\d.]/g, ''); var n = (Number(t.lleno) > 0 && Number(t.vacio) > 0) ? Number(t.lleno) - Number(t.vacio) : Number(t.neto) || 0; var x = $i('sc-neto'); if (x) x.textContent = n > 0 ? N(n) + ' kg' : '—'; };
  D.tkFoto = function (inp) {   /* también la foto de la descarga en planta */
    var f = inp.files && inp.files[0]; if (!f) return;
    var t = C.borr.tk; t.subiendo = true; vRelleno();
    subirFoto(f, 'ticket').then(function (id) { t.foto = id; t.subiendo = false; vRelleno(); aviso('Foto guardada'); }, function (er) { t.subiendo = false; vRelleno(); falla(er); });
  };
  D.tkGuardar = function () {
    var t = C.borr.tk;
    if (!t.ticket) { aviso('Falta el número del ticket'); return; }
    if (!t.foto) { aviso('Falta la foto del ticket'); return; }
    S('api_dsoTicket', PIN, C.hoja.hojaId, { ticket: t.ticket, lleno: Number(t.lleno) || 0, vacio: Number(t.vacio) || 0, neto: Number(t.neto) || 0, foto: t.foto, relleno: t.relleno || '' })
      .then(function (r) { C.borr.tk = null; aviso(r.repetido ? 'Ese ticket ya estaba guardado' : 'Ticket guardado · ' + N(r.neto) + ' kg'); D.conAbrir('ruta'); }).catch(falla);
  };

  /* 6 · regreso y cierre */
  function vCierre() {
    C.vista = 'cierre';
    var h = C.hoja, b = C.borr;
    if (!b.ci || b.ci.hojaId !== h.hojaId) b.ci = { hojaId: h.hojaId, odometro: '', tanque: '', queda: 'Lavado y en orden', nota: '' };
    var c = b.ci, pend = h.paradas.filter(function (p) { return !p.salida; }).length, sinT = h.paradas.filter(function (p) { return p.atendida && p.viaje < 0; }).length;
    cSec(nav('Cerrar la ruta', 'bandera') + heroHoja('Regreso · ' + e(h.patio || 'patio'), e(h.nombre) + ' · cierre', '',
      '<div class="jv-kp"><div><b>' + h.paradas.filter(function (p) { return p.salida; }).length + '/' + h.paradas.length + '</b><span>paradas</span></div><div><b>' + N(h.bolsas) + '</b><span>bolsas</span></div><div><b>' + N(h.netoTotal) + '</b><span>kg en báscula</span></div></div>') +
      (pend ? '<div class="sv-nota am">Quedan ' + pend + ' parada(s) sin hacer. Al cerrar quedan anotadas como no hechas.</div>' : '') +
      (sinT ? '<div class="sv-nota am">Hay ' + sinT + ' parada(s) atendida(s) sin descargar. Si ya descargaste, anótalo antes de cerrar. <button class="pl-btn" onclick="DSO.conAbrir(\'rell\')">Ir a la descarga</button></div>' : '') +
      '<div class="jv-card"><div class="sc-lbl">Odómetro final</div><input class="sc-in" inputmode="numeric" value="' + e(c.odometro) + '" oninput="DSO.con.borr.ci.odometro=this.value" placeholder="' + (h.revision ? 'salió con ' + N(h.revision.odometro) : 'km') + '">' +
      '<div class="sc-lbl" style="margin-top:10px">Tanque al llegar</div><div class="sc-seg">' + ['¼', '½', '¾', 'Lleno'].map(function (x) { return '<button type="button" class="' + (c.tanque === x ? 'on' : '') + '" onclick="DSO.ciCampo(\'tanque\',\'' + x + '\')">' + x + '</button>'; }).join('') + '</div>' +
      '<div class="sc-lbl" style="margin-top:10px">El camión queda</div><div class="sc-seg" style="grid-template-columns:1fr 1fr">' + ['Lavado y en orden', 'Con una falla'].map(function (x) { return '<button type="button" class="' + (c.queda === x ? 'on' : '') + '" onclick="DSO.ciCampo(\'queda\',\'' + x + '\')">' + x + '</button>'; }).join('') + '</div>' +
      '<div class="sc-lbl" style="margin-top:10px">Nota (opcional)</div><textarea class="sc-in t" rows="2" oninput="DSO.con.borr.ci.nota=this.value">' + e(c.nota) + '</textarea></div>' +
      '<button class="sc-btn v" onclick="DSO.ciCerrar()">Cerrar la ruta</button><button class="sc-btn sec" onclick="DSO.conAbrir(\'ruta\')">Volver a la ruta</button><div style="height:20px"></div>');
  }
  D.ciCampo = function (k, v) { C.borr.ci[k] = v; vCierre(); };
  D.ciCerrar = function () {
    var c = C.borr.ci, odo = Number(String(c.odometro).replace(/[^\d.]/g, ''));
    if (!(odo > 0)) { aviso('Falta el odómetro final'); return; }
    gpsAhora().then(function (g) { return S('api_dsoLlegue', PIN, C.hoja.hojaId, 'patio', g).catch(function () {}); })
      .then(function () { return S('api_dsoCerrar', PIN, C.hoja.hojaId, { odometro: odo, tanque: c.tanque, queda: c.queda, nota: c.nota }); })
      .then(function () { C.borr.ci = null; aviso('Ruta cerrada. Buen trabajo.'); D.conAbrir('fin'); }).catch(falla);
  };
  function vFin() {
    C.vista = 'fin';
    var h = C.hoja, ci = h.cierre || {};
    cSec(nav(rutaTit(C.hoja), 'ruta') + heroHoja('Ruta cerrada · ' + e(ci.hora || ''), e(h.nombre) + ' terminada', fLarga(h.fecha),
      '<div class="jv-kp"><div><b>' + h.atendidas + '/' + h.paradas.length + '</b><span>paradas</span></div><div><b>' + N(h.bolsas) + '</b><span>bolsas</span></div><div><b>' + N(h.netoTotal) + '</b><span>kg en báscula</span></div></div>' +
      '<div class="jv-est">✓ ' + h.viajes.length + ' ticket(s) guardado(s)' + (ci.km != null ? ' · ' + N(ci.km) + ' km' : '') + '</div>') +
      '<button class="sc-btn sec" onclick="DSO.conVolver()">Volver al menú</button>');
  }


  /* ═════════ api 3.18 · INICIO PROPIO DEL CONDUCTOR DE SÓLIDOS ═════════
     Seis accesos con sus rutas (api_dsoMisRutas, solo lectura): mapa de la
     ruta, relleno y tickets, revisión de la unidad, jornada, rutas hechas y
     próximas. Los accesos de peligrosos no se le muestran. */
  var MR = { r: null, t: 0 };
  var SVG = {
    mapa: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    rel: '<path d="M3 20h18"/><path d="M5 20V11l5 3V11l5 3V7h4v13"/><path d="M8 17h1M12 17h1M16 17h1"/>',
    rev: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v3h6V3"/><path d="m9 13 2 2 4-4"/>',
    jor: '<path d="M5 20V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14"/><path d="M4 20h12"/><path d="M8 8h4"/><path d="M15 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V9l-3-3"/>',
    his: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'
  };
  function sv(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (SVG[k] || '') + '</svg>'; }
  function soloSol() { return esCond() && C.esSolidos && !(window.RUTA && RUTA.paradas && RUTA.paradas.length); }
  function traerMis(forzar) {
    if (!forzar && MR.r && Date.now() - MR.t < 60000) return Promise.resolve(MR.r);
    if (MR._v) return MR._v;
    MR._v = S('api_dsoMisRutas', PIN).then(function (r) { MR.r = r; MR.t = Date.now(); MR._v = null; return r; }, function (er) { MR._v = null; throw er; });
    return MR._v;
  }
  function rutas() { return (MR.r && MR.r.rutas) || []; }
  function proximas() { var h = hoy(); return rutas().filter(function (r) { return r.fecha >= h && r.estado !== 'cerrada' && r.estado !== 'no_sale'; }).sort(function (a, b) { return (a.fecha + (a.salida || '')).localeCompare(b.fecha + (b.salida || '')); }); }
  function hechasMes() { var m = hoy().slice(0, 7); return rutas().filter(function (r) { return r.estado === 'cerrada' && r.fecha.slice(0, 7) === m; }); }
  function pintarLibre(op, t) {
    if (!t) { t = document.createElement('div'); t.id = 'hub-solidos'; op.parentNode.insertBefore(t, op); }
    t.className = 'dso-libre'; t.onclick = null; op.style.display = 'none';
    var pr = proximas().filter(function (r) { return r.fecha > hoy() || r.estado === 'publicada'; })[0];
    t.innerHTML = '<div class="k">Mi ruta de hoy · sólidos</div><h3>Hoy no tiene ruta asignada</h3><p>' +
      (pr ? 'Su próxima ruta es el <b>' + e(fLarga(pr.fecha).toLowerCase()) + (pr.salida ? ', ' + e(pr.salida) : '') + '</b> · ' + e(pr.nombre || pr.hojaId) + ' · ' + pr.paradas + ' paradas' + (pr.unidad ? ' · ' + (TIPOS[pr.tipo] || TIPOS.compactador)[1] + ' ' + e(pr.unidad) : '') + '. ' : (MR.r ? 'Todavía no tiene rutas publicadas. ' : '')) +
      'Si Logística le asigna una, le aparece aquí.</p>';
    if (!MR.r) traerMis().then(function () { if ($i('hub-solidos') === t && !C.hoja) pintarLibre(op, t); }, function () {});
  }
  function pintarInicioSol() {
    var hub = $i('pantalla-hub'); if (!hub) return;
    var solo = soloSol(), m = $i('hub-dso-mos');
    document.body.classList.toggle('cond-sol', !!solo);
    if (!solo) { if (m) m.remove(); return; }
    if (!m) { var g = hub.querySelector('.grid-mosaicos'); if (!g) return; m = document.createElement('div'); m.id = 'hub-dso-mos'; m.className = 'grid-mosaicos dso-mos'; g.parentNode.insertBefore(m, g.nextSibling); }
    var h = C.hoja, uni = h ? (TIPOS[h.tipo] || TIPOS.compactador)[1].toLowerCase() + ' ' + h.unidad : '';
    var faltaTk = h && h.estado === 'en_ruta' && h.sinTicket > 0, revPend = h && h.estado === 'publicada';
    var T = [['mapa', 'i38-te', 'mapa', 'Mapa de mi ruta', h ? 'Mis paradas de hoy en el mapa' : 'Mis paradas en el mapa', ''],
      ['tickets', 'i38-ve', 'rel', 'Relleno y tickets', 'Mis tickets de báscula', faltaTk ? '<span class="dso-tg w">Falta el de hoy</span>' : ''],
      ['revs', '', 'rev', 'Revisión de mi unidad', h && h.unidad ? 'Lista del ' + e(uni) : 'Mis revisiones', revPend ? '<span class="dso-tg w">Pendiente hoy</span>' : ''],
      ['jor', 'i38-na', 'jor', 'Jornada de mi unidad', 'Km y combustible' + (h && h.unidad ? ' del ' + e(h.unidad) : ''), ''],
      ['hechas', 'i38-mo', 'his', 'Mis rutas hechas', 'Lo que he trabajado este mes', ''],
      ['prox', 'i38-am', 'cal', 'Mis próximas rutas', 'Las que me tocan', '']];
    m.innerHTML = T.map(function (x) {
      return '<div class="mosaico-item" role="button" tabindex="0" data-v="' + x[0] + '" onclick="DSO.misVer(this.getAttribute(\'data-v\'))"><div class="mosaico-top"><div class="mosaico-icono ' + x[1] + '">' + sv(x[2]) + '</div></div><div><div class="mosaico-tit">' + x[3] + '</div><div class="mosaico-sub">' + x[4] + '</div>' + x[5] + '</div></div>';
    }).join('');
    if (!MR.r) traerMis().then(function () {}, function () {});
  }
  function fila(izq, sub, der) { return '<div class="fi"><span>' + izq + (sub ? '<small>' + sub + '</small>' : '') + '</span>' + (der || '') + '</div>'; }
  function estRuta(r) {
    if (r.estado === 'cerrada') return '<span class="est h">hecha</span>';
    if (r.estado === 'en_ruta') return '<span class="est b">en ruta</span>';
    if (r.estado === 'por_firmar') return '<span class="est a">por firmar</span>';
    if (r.estado === 'no_sale') return '<span class="est s">no sale</span>';
    return r.fecha === hoy() ? '<span class="est a">' + (turnoDe(r) === 'dia' ? 'hoy' : 'esta noche') + '</span>' : '<span class="est p">publicada</span>';
  }
  function hora(iso) { var m = /T(\d{2}:\d{2})/.exec(String(iso || '')); return m ? m[1] : ''; }
  var VISTAS = {
    mapa: ['Mapa de mi ruta', 'ruta', function () {
      var h = C.hoja;
      if (!h) { var pr = proximas()[0]; return '<div class="jv-card"><div class="vac">Hoy no tiene una hoja de sólidos abierta. ' + (pr ? 'Su próxima ruta es el ' + e(fLarga(pr.fecha).toLowerCase()) + ' · ' + e(pr.nombre || pr.hojaId) + '.' : '') + ' El mapa sale cuando Logística publique su hoja.</div></div>'; }
      if (!h.paradas.length) return '<div class="jv-card"><div class="vac">Su hoja ' + e(h.nombre || h.hojaId) + ' no tiene paradas.</div></div>';
      var sig = -1; h.paradas.some(function (p, i) { if (!p.salida) { sig = i; return true; } return false; });
      var est = function (p, i) { return p.salida ? (p.atendida ? ['h', 'hecha'] : ['s', 'sin acceso']) : (i === sig ? ['a', 'siguiente'] : ['p', 'pendiente']); };
      var conGps = h.paradas.filter(function (p) { return p.lat && p.lng; }).length;
      return '<div class="jv-card">' + (conGps && window.L ? '<div class="dsv-mapa" id="dsv-mapa"></div>' : '<div class="hint">Las paradas de esta hoja todavía no tienen su ubicación guardada; aquí va la lista en orden.</div>') +
        h.paradas.map(function (p, i) { var x = est(p, i); return '<div class="fi"><span class="n">' + (i + 1) + '</span><span>' + e(p.nombre) + (p.direccion ? '<small>' + e(p.direccion) + '</small>' : '') + '</span><span class="est ' + x[0] + '">' + x[1] + '</span></div>'; }).join('') + '</div>';
    }, function () {
      var h = C.hoja, d = $i('dsv-mapa'); if (!h || !d || !window.L) return;
      var sig = -1; h.paradas.some(function (p, i) { if (!p.salida) { sig = i; return true; } return false; });
      var mp = L.map(d, { zoomControl: true }); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(mp);
      var pts = [];
      h.paradas.forEach(function (p, i) { if (!(p.lat && p.lng)) return; var ll = [Number(p.lat), Number(p.lng)]; pts.push(ll);
        var c = p.salida ? (p.atendida ? 'h' : 's') : (i === sig ? 'a' : '');
        L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="dsv-pin ' + c + '">' + (i + 1) + '</div>', iconSize: [24, 24], iconAnchor: [12, 12] }) }).addTo(mp).bindPopup('<b>' + e(p.nombre) + '</b>'); });
      if (pts.length > 1) { L.polyline(pts, { color: '#0b4f93', weight: 3, dashArray: '6 5' }).addTo(mp); mp.fitBounds(pts, { padding: [24, 24] }); } else mp.setView(pts[0], 16);
      setTimeout(function () { mp.invalidateSize(); }, 200);
    }],
    tickets: ['Relleno y tickets', 'camion', function () {
      var L2 = [], h = C.hoja;
      rutas().forEach(function (r) { r.tickets.forEach(function (t) { L2.push({ t: t, r: r }); }); });
      var falta = h && h.estado === 'en_ruta' && h.sinTicket > 0;
      return '<div class="jv-card"><div class="jv-tit">Mis tickets de báscula</div>' +
        (falta ? fila('Hoy · ' + e(h.nombre || h.hojaId), h.sinTicket + ' parada(s) sin ticket', '<span class="est a">falta</span>') : '') +
        (L2.length ? L2.map(function (x) { return fila(e(x.t.ticket || 's/n'), e(fCorta(x.r.fecha)) + ' · ' + e(x.r.nombre || x.r.hojaId) + (x.t.relleno ? ' · ' + e(x.t.relleno) : ''), '<b>' + N(x.t.neto) + ' kg</b>'); }).join('') : (falta ? '' : '<div class="vac">Todavía no tiene tickets en estas semanas.</div>')) + '</div>' +
        '<div class="hint">Cada ticket lleva su foto. Si falta uno, aparece aquí en ámbar.</div>' + (falta ? '<button class="sc-btn" onclick="DSO.conAbrir(\'rell\')">Registrar el ticket del relleno</button>' : '');
    }],
    revs: ['Revisión de mi unidad', 'lista', function () {
      var h = C.hoja, R = rutas().filter(function (r) { return r.revision; });
      var pend = h && h.estado === 'publicada';
      return '<div class="jv-card"><div class="jv-tit">Mis revisiones</div>' +
        (pend ? fila('Hoy · ' + e((TIPOS[h.tipo] || TIPOS.compactador)[1] + ' ' + h.unidad), e(h.nombre || h.hojaId), '<span class="est a">pendiente</span>') : '') +
        (R.length ? R.map(function (r) { var v = r.revision, f = v.fallas;
          return fila(e(fCorta(r.fecha)) + ' · ' + e((TIPOS[r.tipo] || TIPOS.compactador)[1] + ' ' + r.unidad), (r.firma ? 'Firmó ' + e(r.firma.por) + (hora(r.firma.en) ? ' ' + hora(r.firma.en) : '') + (r.firma.decision === 'no_sale' ? ' · no salió' : '') : 'sin firma aún') + (f && v.fallasTxt.length ? ' · ' + e(v.fallasTxt.join(', ')) : ''),
            '<span class="est ' + (f ? 'a' : 'h') + '">' + (f ? f + ' falla' + (f > 1 ? 's' : '') : (v.puntos - f) + ' de ' + v.puntos + ' bien') + '</span>'); }).join('') : (pend ? '' : '<div class="vac">Todavía no tiene revisiones en estas semanas.</div>')) + '</div>' +
        (pend ? '<button class="sc-btn" onclick="DSO.conAbrir(\'rev\')">Hacer la revisión de hoy</button>' : '');
    }],
    jor: ['Jornada de mi unidad', 'camion', function () {
      var h0 = hoy(), d7 = masDias(h0, -6), sem = rutas().filter(function (r) { return r.fecha >= d7 && r.fecha <= h0; });
      var km = sem.reduce(function (s, r) { return s + (r.cierre && Number(r.cierre.km) > 0 ? Number(r.cierre.km) : 0); }, 0);
      var min = sem.reduce(function (s, r) { if (!r.cierre || !r.salida || !r.cierre.hora) return s; var a = minDe(r.salida), b = minDe(r.cierre.hora); if (a == null || b == null) return s; var d = b - a; if (d < 0) d += 1440; return s + d; }, 0);
      var ult = rutas().filter(function (r) { return r.cierre && r.cierre.odometro; })[0], uni = (C.hoja && C.hoja.unidad) || (ult && ult.unidad) || (rutas()[0] && rutas()[0].unidad) || '';
      return '<div class="jv-card"><div class="jv-tit">' + (uni ? 'Unidad ' + e(uni) + ' · ' : '') + 'esta semana</div>' +
        fila('Rutas hechas', '', '<b>' + sem.filter(function (r) { return r.estado === 'cerrada'; }).length + '</b>') + fila('Km recorridos', 'de los cierres de ruta', '<b>' + N(km) + ' km</b>') +
        fila('Horas de ruta', 'de la salida al regreso', '<b>' + Math.floor(min / 60) + ' h ' + (min % 60) + ' min</b>') +
        fila('Último odómetro', ult ? e(fCorta(ult.fecha)) : '', '<b>' + (ult ? N(ult.cierre.odometro) : '—') + '</b>') + fila('Tanque al llegar', ult ? e(fCorta(ult.fecha)) : '', '<b>' + (ult && ult.cierre.tanque ? e(ult.cierre.tanque) : '—') + '</b>') + '</div>' +
        '<div class="hint">El combustible se carga en «Jornada y flota», como siempre.</div><button class="sc-btn sec" onclick="mostrarTab(\'jornada\')">Abrir Jornada y flota</button>';
    }],
    hechas: ['Mis rutas hechas', 'reloj', function () {
      var H = hechasMes();
      return '<div class="jv-card"><div class="jv-tit">' + e(MESESL[Number(hoy().slice(5, 7)) - 1].replace(/^./, function (c) { return c.toUpperCase(); })) + '</div>' +
        (H.length ? H.map(function (r) { return fila(e(fCorta(r.fecha)) + ' · ' + e(r.nombre || r.hojaId), r.atendidas + ' de ' + r.paradas + ' paradas · ' + N(r.bolsas) + ' bolsas' + (r.sinAcceso ? ' · ' + r.sinAcceso + ' sin acceso' : ''), '<b>' + (r.neto ? N(r.neto) + ' kg' : '—') + '</b>'); }).join('') : '<div class="vac">Todavía no ha cerrado rutas este mes.</div>') + '</div>';
    }],
    prox: ['Mis próximas rutas', 'calendario', function () {
      var P = proximas();
      return '<div class="jv-card"><div class="jv-tit">Las que me tocan</div>' +
        (P.length ? P.map(function (r) { return fila(e(fCorta(r.fecha)) + (r.salida ? ' · ' + e(r.salida) : ''), e(r.nombre || r.hojaId) + ' · ' + r.paradas + ' paradas' + (r.unidad ? ' · ' + e(r.unidad) : ''), estRuta(r)); }).join('') : '<div class="vac">No tiene rutas publicadas en los próximos días.</div>') + '</div>' +
        '<div class="hint">Solo ve las que Logística ya publicó.</div>';
    }]
  };
  D.misVer = function (v) {
    var x = VISTAS[v]; if (!x) return;
    var pinta = function () { cSec(nav(x[0], x[1]) + '<div class="dsv">' + x[2]() + '</div><button class="sc-btn sec" onclick="DSO.conVolver()">Volver al menú</button><div style="height:20px"></div>'); if (x[3]) x[3](); };
    if (MR.r) pinta(); else cSec(nav(x[0], x[1]) + '<div class="jv-card"><div class="vac">Consultando sus rutas…</div></div>');
    traerMis(true).then(pinta, function (er) { if (!MR.r) falla(er); });
  };
  D.misRutas = function () { return MR.r; };

  /* ── arranque ── */
  function arrancar() {
    if (!window.USUARIO || !USUARIO.nombre || !PIN) return;
    if (sup()) { pintarPestana(); var g = ''; try { g = localStorage.getItem('eco_rubro') || ''; } catch (er) {} if (g === 'sol' && D.modo !== 'sol' && !D._arrancado) { D._arrancado = true; cambiarModo('sol'); } }
    else conTarjeta(true);
  }
  D.conTarjeta = conTarjeta;
  /* el conductor: al volver a la app se refresca su tarjeta */
  document.addEventListener('visibilitychange', function () { if (!document.hidden && esCond()) conTarjeta(true); });
  if (document.readyState === 'complete') setTimeout(arrancar, 300); else window.addEventListener('load', function () { setTimeout(arrancar, 300); });
})();
