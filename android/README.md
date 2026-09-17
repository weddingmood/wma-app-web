# Wedding Mood — Application Android (TWA / APK)

L'application Android officielle est générée depuis la PWA avec **Bubblewrap (Trusted Web Activity)**.
Aucun code natif dupliqué : l'APK encapsule le site déployé (`https://weddingmood.ci`).

## Prérequis

- Node.js 20+
- JDK 17 (`java -version`)
- Android SDK Command Line Tools (`ANDROID_HOME` configuré)
- Bubblewrap : `npm i -g @bubblewrap/cli`

## Build de l'APK signé (production)

```bash
# 1. Vérifier la PWA publique (score PWA requis)
npx @bubblewrap/cli doctor

# 2. Initialiser le projet TWA (une seule fois)
bubblewrap init --manifest https://weddingmood.ci/manifest.webmanifest

# 3. Générer le keystore de signature (à conserver précieusement, hors Git)
keytool -genkey -v -keystore android/wedding-mood.keystore \
  -alias weddingmood -keyalg RSA -keysize 2048 -validity 10000

# 4. Construire l'APK signé
bubblewrap build

# 5. Copier l'APK signé vers le dossier de téléchargement
cp app-release-signed.apk public/downloads/wedding-mood-v1.0.0.apk
sha256sum public/downloads/wedding-mood-v1.0.0.apk > public/downloads/wedding-mood-v1.0.0.apk.sha256
```

Ou en une commande (après configuration du keystore) :

```bash
bash scripts/build-apk.sh
```

## Vérifications avant publication

- `https://weddingmood.ci/.well-known/assetlinks.json` accessible et empreinte SHA-256 du keystore renseignée.
- `manifest.webmanifest` valide (outil : PWABuilder / Lighthouse).
- Service worker actif (`/sw.js`).
- Test d'installation sur au moins 2 appareils Android (Android 9+).
