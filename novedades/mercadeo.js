/* Novedades de Mercadeo · contenido de la versión 3.77 (lo que está en vivo de la 3.62 a la 3.77).
   Para la próxima actualización: cambiar «version» y las láminas; quien ya vio esta, verá la nueva una vez. */
ECO_NOV.registrar('mercadeo', {
  version: '3.77',
  laminas: [
    { icono: 'estrella', titulo: 'Hola, {nombre}. Esto es lo nuevo en Mercadeo',
      puntos: ['Mi día comercial, rehecho: la cadena de sus oportunidades.', 'Todo Mercadeo abre más rápido y cambia de pantalla sin brincos.', 'Oportunidades: lo contratado, la regla de cobro y las fechas de inicio.', 'Licitaciones de punta a punta: seguimiento, oferta y licitación ganada.', 'Cobros al Estado: el cobro de los contratos con el gobierno.'],
      pie: 'Son 5 láminas cortas más. Puedes volver a verlas cuando quieras en el menú, en «Novedades».' },
    { icono: 'casa', titulo: 'Mi día comercial', img: 'novedades/mercadeo-1.jpg', leyenda: 'Datos ficticios',
      puntos: ['Arriba, «La cadena de sus oportunidades»: un paso por etapa, con cuántas hay y su valor.', 'En ámbar, las etapas con alguna oportunidad que pasó su límite de días.', 'Toca un paso y se abre Oportunidades en esa etapa.', 'Debajo, lo que te espera y tu agenda del día, como siempre.'],
      boton: { t: 'Ir a Mi día comercial', href: 'Mercadeo.html' } },
    { icono: 'rayo', titulo: 'Más rápido y a tu medida', img: 'novedades/mercadeo-2.jpg', leyenda: 'El menú oculto: queda como íconos · datos ficticios',
      puntos: ['Mi día comercial, Oportunidades, Clientes y Agenda abren al instante con lo último que viste y se actualizan solas.', 'Al cambiar de pantalla, la barra de arriba y el menú se quedan quietos; solo cambia el centro (en Chrome y Edge).', 'Al final del menú está «Ocultar el menú solo»: encendido, el menú queda como íconos y se abre al pasar el ratón.'],
      pie: 'La primera vez de cada día, cada pantalla todavía espera al servidor.' },
    { icono: 'embudo', titulo: 'Oportunidades', img: 'novedades/mercadeo-3.jpg', leyenda: 'Nueva oportunidad · datos ficticios',
      puntos: ['Nueva oportunidad: recurrente o especial; el cliente llena su formulario o lo completas tú.', 'En la ficha, «Lo contratado» por sede y la regla de cobro.', 'La fumigación y los insumos cuentan desde la fecha de inicio que confirma Logística; Sólidos lleva frecuencia y precio.', 'El cliente ve en su portal «Sus servicios» de cada sede, sin precios.'],
      boton: { t: 'Ir a Oportunidades', href: 'MerOportunidades.html' } },
    { icono: 'sello', titulo: 'Licitaciones', img: 'novedades/mercadeo-4.jpg', leyenda: 'Ficha de una licitación · datos ficticios',
      puntos: ['Pestaña «Licitaciones», aparte del Embudo, con su cronograma y avisos en la Agenda.', 'Documentos de la empresa con aviso para renovarlos y el expediente de cada acto.', 'La oferta: renglones con ITBMS, fianzas, propuesta económica en PDF y expediente final.', 'Ganada: adjudicada, refrendo, orden de proceder y «Pasar a cartera», un alta por lugar del pliego.'],
      boton: { t: 'Ir a Licitaciones', href: 'MerOportunidades.html?vista=licitaciones' } },
    { icono: 'moneda', titulo: 'Cobros al Estado', img: 'novedades/mercadeo-5.jpg', leyenda: 'Así lo ve Cobros · datos ficticios',
      puntos: ['Cuando pasas a cartera una licitación ganada, Cobros lleva su cobro por periodo: tesorería, refrendo y pago por ACH.', 'Lo que anota Cobros aparece en la Actividad de la licitación, en su ficha.', 'Las entidades de gobierno ya no se mezclan con la cartera normal.'],
      pie: 'Listo. Toca «Entendido» y sigue trabajando.' }
  ]
});
