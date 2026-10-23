#!/usr/bin/env bash
# Limpieza y ajuste de la tablet del conductor (Huawei AGS2-L03) por ADB.
# Requisitos: PC con adb (platform-tools), cable USB, y en la tablet:
#   Ajustes > Acerca de la tablet > tocar 7 veces "Número de compilación"
#   Ajustes > Sistema > Opciones de desarrollador > Depuración USB (activar)
# Uso:
#   ./tablet-adb.sh diagnostico              Espacio, RAM y apps por peso (no cambia nada)
#   ./tablet-adb.sh limpiar-cache            Borra la caché de todas las apps
#   ./tablet-adb.sh deshabilitar lista.txt   Deshabilita (reversible) los paquetes de lista.txt
#   ./tablet-adb.sh rapido                   Animaciones a 0.5x
#   ./tablet-adb.sh instalar app.apk com.paquete.de.la.app
#                                            Instala la APK, da permisos y la saca del ahorro de batería
set -euo pipefail

command -v adb >/dev/null || { echo "Falta adb. Instale Android platform-tools."; exit 1; }
adb get-state >/dev/null 2>&1 || { echo "No veo la tablet. Revise el cable y acepte 'Permitir depuración USB' en la pantalla."; exit 1; }

cmd="${1:-}"

case "$cmd" in
  diagnostico)
    echo "== Modelo =="; adb shell getprop ro.product.model
    echo "== Android =="; adb shell getprop ro.build.version.release
    echo "== Almacenamiento =="; adb shell df -h /data
    echo "== Memoria RAM =="; adb shell grep -E 'MemTotal|MemAvailable' /proc/meminfo
    echo "== Apps de usuario (instaladas por el usuario) =="; adb shell pm list packages -3 | sed 's/package://' | sort
    echo "== Apps deshabilitables del sistema (referencia) =="; adb shell pm list packages -s | sed 's/package://' | sort | head -200
    echo
    echo "Para ver el peso de una app:  adb shell dumpsys diskstats | head -40"
    ;;
  limpiar-cache)
    # Pide a Android liberar caché hasta dejar un bloque grande libre.
    adb shell pm trim-caches 999G || adb shell pm trim-caches 4G
    echo "Caché limpiada."
    ;;
  deshabilitar)
    lista="${2:?Indique el archivo con un paquete por linea}"
    while IFS= read -r pkg; do
      pkg="${pkg%%#*}"; pkg="$(echo "$pkg" | tr -d '[:space:]')"
      [ -z "$pkg" ] && continue
      echo "Deshabilitando $pkg"
      adb shell pm disable-user --user 0 "$pkg" || echo "  (no se pudo: $pkg)"
    done < "$lista"
    echo "Para revertir uno:  adb shell pm enable <paquete>"
    ;;
  rapido)
    adb shell settings put global window_animation_scale 0.5
    adb shell settings put global transition_animation_scale 0.5
    adb shell settings put global animator_duration_scale 0.5
    adb shell settings put system screen_off_timeout 300000
    echo "Animaciones al 50 %."
    ;;
  instalar)
    apk="${2:?Falta la ruta de la APK}"
    pkg="${3:?Falta el nombre de paquete (ej. com.ecovsa.conductor)}"
    adb install -r "$apk"
    for p in android.permission.ACCESS_FINE_LOCATION android.permission.ACCESS_COARSE_LOCATION \
             android.permission.ACCESS_BACKGROUND_LOCATION android.permission.POST_NOTIFICATIONS \
             android.permission.CAMERA android.permission.RECORD_AUDIO; do
      adb shell pm grant "$pkg" "$p" 2>/dev/null || true
    done
    adb shell dumpsys deviceidle whitelist +"$pkg" || true
    echo "Instalada. Falta a mano en EMUI: Batería > Inicio de aplicaciones > $pkg > Gestionar manualmente (las 3 opciones)."
    ;;
  *)
    sed -n '2,15p' "$0"; exit 1 ;;
esac
