#!/usr/bin/env bash
# Wedding Mood — Build APK Android via Bubblewrap (TWA)
# Usage: bash scripts/build-apk.sh [version]
# Exige : Node 20+, JDK 17, Android SDK, Bubblewrap, keystore configuré.
set -euo pipefail

VERSION="${1:-1.0.0}"
APP_URL="${NEXT_PUBLIC_APP_URL:-https://weddingmood.ci}"
OUT_DIR="public/downloads"
APK_NAME="wedding-mood-v${VERSION}.apk"

echo "==> Vérification des prérequis..."
command -v node >/dev/null || { echo "Node.js requis"; exit 1; }
command -v java >/dev/null || { echo "JDK 17 requis"; exit 1; }
command -v bubblewrap >/dev/null || { echo "Bubblewrap requis : npm i -g @bubblewrap/cli"; exit 1; }
[ -n "${ANDROID_HOME:-}" ] || { echo "ANDROID_HOME doit pointer vers le SDK Android"; exit 1; }

echo "==> Contrôle PWA sur ${APP_URL}..."
npx --yes @bubblewrap/cli doctor || true

echo "==> Build APK (version ${VERSION})..."
mkdir -p "${OUT_DIR}"
if [ ! -f "twa-manifest.json" ] && [ -f "android/twa-manifest.json" ]; then
  cp android/twa-manifest.json ./twa-manifest.json
fi
bubblewrap build --skipPwaValidation || bubblewrap build

APK_BUILT=$(ls -t app-release-signed.apk app-release.apk 2>/dev/null | head -n 1 || true)
if [ -z "${APK_BUILT}" ]; then
  echo "APK introuvable après le build."
  exit 1
fi

cp "${APK_BUILT}" "${OUT_DIR}/${APK_NAME}"
sha256sum "${OUT_DIR}/${APK_NAME}" > "${OUT_DIR}/${APK_NAME}.sha256"
ls -lh "${OUT_DIR}/${APK_NAME}"
cat "${OUT_DIR}/${APK_NAME}.sha256"
echo "==> APK prêt : ${OUT_DIR}/${APK_NAME}"
