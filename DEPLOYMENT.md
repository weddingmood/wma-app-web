# Wedding Mood — Guide de déploiement officiel

Objectif : déployer la même base de code, sans erreur, sur **GitHub**, **Vercel**, **Supabase** et **Node.js** (Docker ou VPS), avec l'extension **Web App (PWA)** et le **fichier APK Android** téléchargeable.

---

## 1. Prérequis

| Outil | Version minimale |
|---|---|
| Node.js | 20 LTS (voir `.nvmrc`) |
| npm | 10+ |
| PostgreSQL | 15+ (local, Docker ou Supabase) |
| Git | 2.40+ |
| Docker (optionnel) | 24+ avec Compose v2 |
| JDK 17 + Android SDK (APK signé uniquement) | Bubblewrap |

---

## 2. GitHub — Dépôt officiel

```bash
git init
git add .
git commit -m "Wedding Mood v1.0.0 — release production"
git branch -M main
git remote add origin https://github.com/<organisation>/wedding-mood.git
git push -u origin main
```

La CI `.github/workflows/ci.yml` exécute automatiquement à chaque push/PR :
1. `npm ci`
2. `npx next typegen`
3. `tsc --noEmit`
4. `drizzle-kit push` (base Postgres de test)
5. `npm run build`
6. Contrôle des artefacts PWA + APK

Aucun secret n'est versionné : `.env` est ignoré, seul `.env.example` sert de modèle.

---

## 3. Supabase — Base PostgreSQL managée

### 3.1 Créer le projet
1. Créer un projet Supabase (région la plus proche, ex. `eu-west-3`).
2. Noter le mot de passe de la base dans **Project Settings → Database**.
3. Récupérer l'URL **Transaction Pooler** (port `6543`) pour Vercel.

### 3.2 Variables à renseigner
```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:MOT_DE_PASSE@aws-0-REGION.pooler.supabase.com:6543/postgres
SUPABASE_DATABASE_URL=postgresql://postgres.PROJECT_REF:MOT_DE_PASSE@aws-0-REGION.pooler.supabase.com:6543/postgres
```

### 3.3 Appliquer le schéma (31 tables)
Depuis un poste d'administration avec l'URL directe (`5432`) :
```bash
npm ci
SUPABASE_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" npx drizzle-kit push
# ou, en production :
# DATABASE_URL="<URL_DIRECTE_SUPABASE_5432>" npx drizzle-kit push
# Puis vérifier : npx drizzle-kit check
```

Le client `src/db/index.ts` utilise `postgres-js` avec `prepare: false`, obligatoire pour le Transaction Pooler Supabase, avec SSL exigé et pool réduit sur Vercel.

---

## 4. Vercel — Hébergement web officiel

1. Importer le dépôt GitHub dans Vercel (Framework : Next.js, détecté via `vercel.json`).
2. Renseigner les variables d'environnement **Production + Preview** :
   - `DATABASE_URL` ou `SUPABASE_DATABASE_URL` (pooler `6543`)
   - `SESSION_SECRET` (32+ caractères aléatoires)
   - `NEXT_PUBLIC_APP_URL` (ex. `https://weddingmood.ci`)
   - `NEXT_PUBLIC_ANDROID_PACKAGE=ci.weddingmood.app`
   - `NEXT_PUBLIC_APK_VERSION=1.0.0`
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`
3. Déployer : chaque push sur `main` redéploie automatiquement.
4. Vérifier après déploiement :
   - `https://<domaine>/api/health` → `{ "ok": true }`
   - `https://<domaine>/manifest.webmanifest` → manifeste PWA
   - `https://<domaine>/telechargement` → page APK + QR

---

## 5. Node.js — Serveur classique, Docker et VPS

### 5.1 Node.js direct
```bash
npm ci
cp .env.example .env   # puis renseigner DATABASE_URL et SESSION_SECRET
npx drizzle-kit push
npm run build
npm start              # écoute sur PORT (3000 par défaut)
```

### 5.2 Docker Compose (recommandé VPS)
```bash
docker compose up --build -d
docker compose exec app npx drizzle-kit push
curl http://localhost:3000/api/health
```

### 5.3 VPS Contabo (Ubuntu + Nginx + PM2)
La procédure complète historique reste disponible dans `README.md` (section Contabo) et `nginx/wedding-mood.conf`.

---

## 6. Web App (PWA) — Extension officielle

Fichiers livrés :
- `public/manifest.webmanifest` + `public/manifest.json`
- `public/sw.js` (cache statique + runtime + page `/offline.html`)
- `public/offline.html`
- `public/icons/` (72 → 512 px, maskable, apple-touch-icon, captures)
- `src/components/PwaRegister.tsx` + `PwaInstallPrompt.tsx` (branchés dans `src/app/layout.tsx`)

Contrôle qualité PWA :
```bash
npm run build && npm start
# Ouvrir Chrome DevTools → Application → Manifest + Service Workers
# Lighthouse → catégorie PWA (manifeste, SW, icônes, offline)
```

---

## 7. APK Android — Fichier téléchargeable

### 7.1 Fichier fourni immédiatement
- `public/downloads/wedding-mood-v1.0.0.apk` (+ `.sha256`)
- API : `GET /api/download/apk` (MIME `application/vnd.android.package-archive`)
- Page publique : `/telechargement` (bouton PWA, bouton APK, QR code, guides)

### 7.2 APK signée de production (Bubblewrap / TWA)
```bash
npm i -g @bubblewrap/cli
keytool -genkey -v -keystore android/wedding-mood.keystore -alias weddingmood -keyalg RSA -keysize 2048 -validity 10000
bash scripts/build-apk.sh 1.0.0
```

Puis :
1. Remplacer le fichier dans `public/downloads/`.
2. Mettre à jour `NEXT_PUBLIC_APK_VERSION`.
3. Renseigner l'empreinte SHA-256 dans `public/.well-known/assetlinks.json`.
4. Tester l'installation sur 2 appareils Android 9+ avant publication.

---

## 8. Administration & Pack Premium

- Console : `/admin`
- Compte initial : `ADMIN_EMAIL` / `ADMIN_PASSWORD` (seed automatique).
- Contrôles disponibles : validation Wave, activation Pack Premium Couple/Individuel, changement de formule, régénération du code d'accès, prolongation d'essai, suspension/blocage, export CSV, journal d'audit, paramètres du compte admin.
- Toute action sensible écrit une entrée dans `audit_logs` consultable dans l'onglet « Journal d'audit ».

---

## 9. Check-list officielle avant mise en ligne

- [ ] `npx next typegen` OK
- [ ] `tsc --noEmit` OK
- [ ] `npm run build` OK
- [ ] `/api/health` → 200
- [ ] Connexion couple + code d'accès OK
- [ ] Connexion admin + validation premium OK
- [ ] PWA installable + mode hors connexion OK
- [ ] Téléchargement APK + QR OK
- [ ] Sauvegarde Supabase/Postgres planifiée
