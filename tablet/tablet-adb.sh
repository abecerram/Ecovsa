#!/usr/bin/env bash
# Limpieza y modo quiosco de la tablet del conductor (Huawei AGS2-L03 / MediaPad T5) por ADB.
# Requisitos: adb (Android platform-tools), cable USB, Depuración USB activada en la tablet.
# En Windows: ejecutar desde "Git Bash" (ver GUIA-TABLET.md).
#
# Uso:
#   ./tablet-adb.sh diagnostico                  Espacio, RAM y apps (no cambia nada). Guarda copias en ./respaldo/
#   ./tablet-adb.sh limpiar-cache                Libera la caché de todas las apps
#   ./tablet-adb.sh deshabilitar [archivo]       Deshabilita (reversible) los paquetes de la lista. Por defecto lista-candidatos.txt
#   ./tablet-adb.sh revertir [archivo]           Vuelve a habilitar los paquetes de la lista
#   ./tablet-adb.sh rapido                       Animaciones al 50 % y pantalla 5 min
#   ./tablet-adb.sh instalar app.apk paquete     Instala la APK, da permisos y la saca del ahorro de batería
#   ./tablet-adb.sh quiosco paquete              Bloquea actualizaciones del sistema y oculta barras (modo quiosco)
#   ./tablet-adb.sh quiosco-off                  Revierte el modo quiosco
#   ./tablet-adb.sh estado                       Resumen: espacio libre, RAM libre y apps deshabilitadas
#
# Variable opcional:  APP_PKG=com.paquete.app  (paquete de la APK; queda protegido siempre)
set -uo pipefail

AQUI="$(cd "$(dirname "$0")" && pwd)"
RESPALDO="$AQUI/respaldo"
mkdir -p "$RESPALDO"

command -v adb >/dev/null || { echo "Falta adb. Instale Android platform-tools (ver GUIA-TABLET.md)."; exit 1; }
adb start-server >/dev/null 2>&1
estado_adb="$(adb get-state 2>&1)"
if [ "$estado_adb" != "device" ]; then
  echo "No veo la tablet ($estado_adb)."
  echo "Revise: cable USB, Depuración USB activada y aceptar 'Permitir depuración USB' en la pantalla."
  exit 1
fi

# Paquetes que NUNCA se deshabilitan (romperían el sistema, el GPS, el teclado o la APK).
PROTEGIDOS='^(android|com\.android\.(systemui|settings|phone|server\.telecom|packageinstaller|bluetooth|nfc|shell|keychain|certinstaller|webview|chrome|vending|location\.fused|inputmethod\..*|providers\..*|contacts|dialer|mms|stk)|com\.google\.android\.(gms|gsf|gsf\.login|webview|packageinstaller|inputmethod\..*|ext\.services|ext\.shared)|com\.huawei\.(android\.launcher|systemmanager|hwid|android\.internal\.app|hwdetectrepair)|com\.qualcomm\..*|com\.hisi\..*|com\.huawei\.hwid)$'

protegido() {
  local p="$1"
  [ -n "${APP_PKG:-}" ] && [ "$p" = "$APP_PKG" ] && return 0
  [[ "$p" =~ $PROTEGIDOS ]]
}

instalado() { adb shell pm list packages | tr -d '\r' | grep -qx "package:$1"; }

leer_lista() {  # imprime un paquete por línea, sin comentarios ni vacíos
  sed -e 's/#.*//' -e 's/[[:space:]]//g' "$1" | grep -v '^$'
}

cmd="${1:-}"
case "$cmd" in
  diagnostico)
    echo "== Modelo ==";        adb shell getprop ro.product.model | tr -d '\r'
    echo "== Android ==";       adb shell getprop ro.build.version.release | tr -d '\r'
    echo "== Almacenamiento (/data) =="; adb shell df -h /data | tr -d '\r'
    echo "== RAM =="; adb shell grep -E 'MemTotal|MemAvailable' /proc/meminfo | tr -d '\r'
    adb shell pm list packages -3 | tr -d '\r' | sed 's/package://' | sort > "$RESPALDO/apps-usuario.txt"
    adb shell pm list packages -s | tr -d '\r' | sed 's/package://' | sort > "$RESPALDO/apps-sistema.txt"
    adb shell pm list packages -d | tr -d '\r' | sed 's/package://' | sort > "$RESPALDO/apps-deshabilitadas-antes.txt"
    echo "== Apps instaladas por el usuario =="; cat "$RESPALDO/apps-usuario.txt"
    echo
    echo "Copias guardadas en $RESPALDO (apps-usuario, apps-sistema, apps-deshabilitadas-antes)."
    echo "Envíe el contenido de apps-usuario.txt y apps-sistema.txt para armar la lista de apps a apagar."
    ;;

  limpiar-cache)
    echo "Libre antes:";  adb shell df -h /data | tail -1 | tr -d '\r'
    adb shell pm trim-caches 999G >/dev/null 2>&1 || adb shell pm trim-caches 8G >/dev/null 2>&1
    echo "Libre después:"; adb shell df -h /data | tail -1 | tr -d '\r'
    ;;

  deshabilitar)
    lista="${2:-$AQUI/lista-candidatos.txt}"
    [ -f "$lista" ] || { echo "No existe $lista"; exit 1; }
    adb shell pm list packages -d | tr -d '\r' | sed 's/package://' | sort > "$RESPALDO/apps-deshabilitadas-antes.txt"
    a_apagar=()
    while IFS= read -r pkg; do
      if protegido "$pkg"; then echo "  PROTEGIDO, se omite: $pkg"
      elif ! instalado "$pkg"; then echo "  no está instalado:   $pkg"
      else a_apagar+=("$pkg"); fi
    done < <(leer_lista "$lista")
    [ ${#a_apagar[@]} -eq 0 ] && { echo "Nada que deshabilitar."; exit 0; }
    echo; echo "Se deshabilitarán ${#a_apagar[@]} apps:"; printf '  %s\n' "${a_apagar[@]}"
    read -r -p "¿Continuar? (s/N) " r
    [[ "$r" =~ ^[sS]$ ]] || { echo "Cancelado."; exit 0; }
    for pkg in "${a_apagar[@]}"; do
      adb shell pm disable-user --user 0 "$pkg" >/dev/null 2>&1 && echo "  deshabilitada: $pkg" || echo "  FALLÓ: $pkg"
    done
    echo "Para revertir:  ./tablet-adb.sh revertir $lista"
    ;;

  revertir)
    lista="${2:-$AQUI/lista-candidatos.txt}"
    [ -f "$lista" ] || { echo "No existe $lista"; exit 1; }
    while IFS= read -r pkg; do
      adb shell pm enable "$pkg" >/dev/null 2>&1 && echo "  habilitada: $pkg"
    done < <(leer_lista "$lista")
    ;;

  rapido)
    adb shell settings put global window_animation_scale 0.5
    adb shell settings put global transition_animation_scale 0.5
    adb shell settings put global animator_duration_scale 0.5
    adb shell settings put system screen_off_timeout 300000
    echo "Animaciones al 50 %. (Para volver a normal: poner 1.0 en los tres valores)."
    ;;

  instalar)
    apk="${2:?Falta la ruta de la APK}"; pkg="${3:?Falta el paquete de la APK (ej. com.ecovsa.conductor)}"
    adb install -r "$apk" || { echo "Falló la instalación."; exit 1; }
    for p in ACCESS_FINE_LOCATION ACCESS_COARSE_LOCATION ACCESS_BACKGROUND_LOCATION POST_NOTIFICATIONS CAMERA RECORD_AUDIO READ_EXTERNAL_STORAGE WRITE_EXTERNAL_STORAGE; do
      adb shell pm grant "$pkg" "android.permission.$p" >/dev/null 2>&1 || true
    done
    adb shell dumpsys deviceidle whitelist +"$pkg" >/dev/null 2>&1 || true
    echo "Instalada con permisos. Falta a mano en EMUI: Batería > Inicio de aplicaciones > Gestionar manualmente (las 3 opciones)."
    ;;

  quiosco)
    pkg="${2:?Falta el paquete de la APK}"
    # Sin actualizaciones automáticas del sistema Huawei (reversible)
    adb shell pm disable-user --user 0 com.huawei.android.hwouc >/dev/null 2>&1 && echo "  actualizador de sistema Huawei: deshabilitado"
    # Oculta barra de estado y de navegación SOLO para la APK (desliza desde el borde para verlas)
    adb shell settings put global policy_control "immersive.full=$pkg"
    # Pantalla siempre encendida mientras carga
    adb shell settings put global stay_on_while_plugged_in 3
    echo "Modo quiosco aplicado. Falta fijar la pantalla a mano (ver GUIA-TABLET.md, paso 6)."
    ;;

  quiosco-off)
    adb shell settings put global policy_control null
    adb shell settings put global stay_on_while_plugged_in 0
    adb shell pm enable com.huawei.android.hwouc >/dev/null 2>&1
    echo "Modo quiosco revertido."
    ;;

  estado)
    adb shell df -h /data | tail -1 | tr -d '\r'
    adb shell grep -E 'MemTotal|MemAvailable' /proc/meminfo | tr -d '\r'
    echo "Apps deshabilitadas:"; adb shell pm list packages -d | tr -d '\r' | sed 's/package:/  /'
    ;;

  *) sed -n '2,19p' "$0"; exit 1 ;;
esac
