# Tablet del conductor (Huawei AGS2-L03): limpieza + modo quiosco

Objetivo: que la tablet corra **solo** la APK ECOVSA Conductor, sin apps compitiendo por memoria.
Todo lo de este documento se puede revertir. Tiempo estimado: 45–60 min.

## Qué necesitan
- La tablet, su cable USB y una PC (Windows, Mac o Linux).
- El **nombre de paquete** de la APK (ej. `com.ecovsa.conductor`) y el archivo `.apk`.
- Esta carpeta `tablet/` descargada en la PC.

---

## PARTE A: Preparar la PC (una sola vez)

**Windows**
1. Descargue **Android platform-tools** (busque "Android SDK Platform-Tools" en developer.android.com) y descomprima en `C:\adb`.
2. Instale **Git for Windows** (trae "Git Bash").
3. Abra **Git Bash** y escriba: `export PATH=$PATH:/c/adb/platform-tools` (cambie la ruta si descomprimió en otro lado).
4. Pruebe: `adb version`. Debe mostrar un número de versión.
5. Vaya a la carpeta del script, por ejemplo: `cd /c/Users/SU_USUARIO/Descargas/tablet`

**Mac / Linux**: instale platform-tools y abra la Terminal en la carpeta `tablet/`.

## PARTE B: Preparar la tablet

1. **Ajustes → Acerca de la tablet** → toque **7 veces** "Número de compilación".
2. **Ajustes → Sistema → Opciones de desarrollador** → active **Depuración USB**.
3. Conecte el cable. En la tablet aparece "¿Permitir depuración USB?": marque *Siempre permitir* y acepte.
4. En la PC: `adb devices`. Debe aparecer un número de serie con la palabra `device`. Si dice `unauthorized`, acepte el aviso de la tablet.

---

## PARTE C: NIVEL 1, Limpieza fuerte

**Paso 1. Diagnóstico (no cambia nada)**
```
./tablet-adb.sh diagnostico
```
Guarda en `respaldo/` la lista de apps de usuario y del sistema. Anote cuánto espacio libre y RAM tiene.
**Envíenme** el contenido de `respaldo/apps-usuario.txt` y `respaldo/apps-sistema.txt` y les confirmo qué más se puede apagar.

**Paso 2. Libere lo grande a mano (en la tablet)**
Fotos, videos, WhatsApp y Descargas, lo que falte del paso del chat anterior. Meta: **más de 25 % libre**.

**Paso 3. Revise la lista de candidatos**
Abra `lista-candidatos.txt`. Borre (o ponga `#` al inicio) de las líneas de apps que el conductor **sí** usa (por ejemplo Google Fotos si toma fotos con ella). Ahí pueden agregar paquetes nuevos, uno por línea.

**Paso 4. Deshabilitar**
```
APP_PKG=com.ecovsa.conductor ./tablet-adb.sh deshabilitar
```
- Muestra qué va a apagar y pide confirmar con `s`.
- Omite solo los paquetes **protegidos** (sistema, teclado, GPS, WebView, Chrome, Play Store, su APK).
- Es reversible: `./tablet-adb.sh revertir`.

**Paso 5. Limpiar caché y acelerar**
```
./tablet-adb.sh limpiar-cache
./tablet-adb.sh rapido
```

**Paso 6. Reiniciar** la tablet y correr `./tablet-adb.sh estado` para ver el espacio y la RAM libre.

> Si algo se comporta raro después de apagar una app, ejecute `./tablet-adb.sh revertir` y avise cuál fue.

---

## PARTE D: NIVEL 3, Modo quiosco

**Paso 1. Instalar o reinstalar la APK con permisos**
```
./tablet-adb.sh instalar /ruta/a/EcovsaConductor.apk com.ecovsa.conductor
```
Si aparece "Instalación bloqueada", active en la tablet *Fuentes desconocidas* para el instalador.

**Paso 2. Batería de EMUI (a mano, es lo que evita que se corte el GPS)**
- **Ajustes → Batería → Inicio de aplicaciones → ECOVSA Conductor → Gestionar manualmente** y active las 3: *Inicio automático*, *Inicio secundario*, *Ejecutar en segundo plano*.
- **Ajustes → Batería →** desactive *Modo ahorro de energía*.
- **Ajustes → Aplicaciones → Permisos → Ubicación → ECOVSA Conductor →** *Permitir siempre*.

**Paso 3. Aplicar el modo quiosco**
```
./tablet-adb.sh quiosco com.ecovsa.conductor
```
Hace tres cosas: apaga el actualizador de sistema de Huawei, oculta las barras mientras la APK está abierta (se ven al deslizar desde el borde) y mantiene la pantalla encendida mientras carga.

**Paso 4. Play Store sin actualizaciones automáticas**
Play Store → foto de perfil → **Configuración → Preferencias de red → Actualizar apps automáticamente → No actualizar apps automáticamente**.
(Actualicen WebView, Chrome y la APK a mano, en el taller, cada cierto tiempo.)

**Paso 5. Limpiar el escritorio**
Mantenga pulsado cada ícono → *Quitar*. Deje solo la APK en la pantalla principal. Quite widgets y el fondo animado.

**Paso 6. Fijar la pantalla (lo que bloquea al conductor dentro de la APK)**
1. **Ajustes → Seguridad y privacidad → Más ajustes → Fijar pantalla** → activar. Active también *Pedir PIN al desfijar*.
2. Abra la APK, toque el botón de **Recientes** (cuadrado) y toque el ícono de **alfiler** en la tarjeta de la APK.
3. Para salir: mantenga pulsados **Atrás + Recientes** y ponga el PIN. **Guarden el PIN en un lugar seguro.**

**Paso 7. Prueba de ruta (10 min)**
Inicien una ruta, apaguen la pantalla 5 minutos, enciéndanla y verifiquen que el aviso "Ruta en curso" sigue ahí y que la ubicación se siguió registrando.

---

## Revertir todo
```
./tablet-adb.sh quiosco-off     # barras, pantalla encendida y actualizador
./tablet-adb.sh revertir        # reactiva las apps deshabilitadas
```
Para salir de la pantalla fijada: Atrás + Recientes y el PIN.

## Si algo sale mal
| Problema | Qué hacer |
|---|---|
| `adb devices` vacío | Otro cable (uno de datos, no solo carga), otro puerto USB, y revisar Depuración USB |
| `unauthorized` | Aceptar el aviso en la pantalla de la tablet |
| No se ve la barra de navegación y no puedo salir | Deslice desde el borde inferior o superior; o `./tablet-adb.sh quiosco-off` |
| La APK se cierra con la pantalla apagada | Repetir Parte D, paso 2 (batería de EMUI) |
| Sigue lenta con todo hecho | Es el límite del hardware (Kirin 659, 2–3 GB). Ver Nivel 2 (reinstalar firmware) o alivianar el portal |
