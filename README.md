# WEDDING MOOD
**Application Premium de Préparation au Mariage pour Jeunes Couples Chrétiens en Côte d’Ivoire**

---

## 1. Présentation du Projet

Wedding Mood est une application web et PWA haut de gamme conçue pour accompagner les jeunes couples chrétiens (19 ans et plus) en Côte d’Ivoire tout au long de leurs préparatifs de mariage, depuis le début des démarches jusqu'au Jour J et au-delà.

L'application réunit dans un même espace sécurisé et élégant :
- **Notre Mariage** : Gestion des 4 piliers (Dot traditionnelle, Mariage civil, Bénédiction nuptiale et Réception), tâches, budget en FCFA (avec validation conjointe dès 50 000 FCFA), chronogramme J-90, calendrier partagé et décisions du couple.
- **Nous Deux & Dieu** : 7 thèmes bibliques fondateurs avec enseignements et prières, journal de prière privé, les 10 commandements d'alliance du foyer et quiz de complicité.
- **Jeux de Table** : Ludo nuptial, Awalé ivoirien traditionnel avec IA à 6 niveaux, jeu de dames 8x8 et défi des mots en couple.
- **Faire-Part Numérique & RSVP** : Véritable mini-site interactif avec 20 familles de modèles, 20 cadres photo, options avec ou sans photo, compte à rebours, programme, formulaire RSVP et lien de cagnotte personnalisable.
- **Bon à Savoir & Ressources** : Législation ivoirienne (loi n° 2019-570), guides administratifs pour les mairies, bibliothèque pastorale et gestion des invités avec badges QR.
- **Espace Administrateur (`/admin`)** : Modération des couples, vérification manuelle des paiements Wave CI (2 000 FCFA sans API externe) et statistiques d'utilisation.

---

## 2. Identité Visuelle & Expérience

- **Fonds** : Blanc glacé lumineux (`#F8FAFC`), surfaces en verre blanc translucide (*White Glass / Ice Glass*), touches terracotta (`#C05638`) et or noble (`#D4AF37`).
- **Typographie** : Cormorant Garamond, Playfair Display, Cinzel, Montserrat, Plus Jakarta Sans.
- **Logo Officiel** : Emblème circulaire or et ivoire aux motifs géométriques africains sur fond blanc pur.
- **Accessibilité & PWA** : Compatible mobile first, tablette et ordinateur de bureau avec synchronisation et mode hors connexion.

---

## 3. Architecture Technique

- **Frontend** : Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React, Canvas Confetti.
- **Backend & API** : Route Handlers Next.js / Node.js, Drizzle ORM, sessions sécurisées.
- **Base de Données** : PostgreSQL via Drizzle ORM.
- **Audio & Média** : Moteur audio natif Web Audio API (synthèse sonore sans latence, 100% hors connexion).

---

## 4. Lancement en Développement Local

### Prérequis
- Node.js 18+ ou 20+ LTS
- PostgreSQL installé et en cours d'exécution

### Étapes
1. Cloner le projet et installer les dépendances :
   ```bash
   npm install
   ```

2. Configurer les variables d'environnement dans `.env` :
   ```env
   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
   NODE_ENV=development
   PORT=3000
   ```

3. Appliquer le schéma de base de données :
   ```bash
   npx drizzle-kit push
   ```

4. Lancer le serveur de développement :
   ```bash
   npm run dev
   ```
   L'application sera accessible sur `http://localhost:3000`.

---

## 5. Procédure de Déploiement sur VPS Contabo (Ubuntu Linux)

### Caractéristiques Recommandées du Serveur
- **VPS Contabo Cloud VPS S ou M** (Ubuntu 22.04 LTS ou 24.04 LTS)
- 4 à 6 cœurs vCPU, 8 à 16 Go de RAM, SSD / NVMe
- Domaine configuré (ex: `weddingmood.ci`) pointant vers l'adresse IP de votre VPS.

### Déploiement Automatisé
1. Connectez-vous en SSH à votre VPS Contabo :
   ```bash
   ssh root@VOTRE_IP_CONTABO
   ```

2. Clonez le dépôt dans `/var/www/wedding-mood` :
   ```bash
   git clone <URL_DU_DEPOT> /var/www/wedding-mood
   cd /var/www/wedding-mood
   ```

3. Exécutez le script d'installation automatisé :
   ```bash
   chmod +x scripts/*.sh
   ./scripts/deploy-contabo.sh
   ```

### Déploiement Manuel Étape par Étape

1. **Mise à jour et installation des paquets système** :
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y curl wget git unzip ufw nginx postgresql postgresql-contrib certbot python3-certbot-nginx
   ```

2. **Installation de Node.js 20 LTS & PM2** :
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   sudo npm install -g pm2
   ```

3. **Création de la base de données PostgreSQL** :
   ```bash
   sudo -u postgres psql
   CREATE DATABASE wedding_mood_db;
   CREATE USER weddingmood_user WITH ENCRYPTED PASSWORD 'VotreMotDePasseFort';
   GRANT ALL PRIVILEGES ON DATABASE wedding_mood_db TO weddingmood_user;
   \q
   ```

4. **Configuration du fichier `.env`** :
   Copiez `.env.example` en `.env` et ajustez `DATABASE_URL` et les clés secrètes.

5. **Compilation du projet** :
   ```bash
   npm ci
   npx drizzle-kit push
   npm run build
   ```

6. **Lancement du service avec PM2** :
   ```bash
   pm2 start npm --name "wedding-mood" -- start
   pm2 save
   pm2 startup
   ```

7. **Configuration Nginx & Certificat SSL** :
   ```bash
   sudo cp nginx/wedding-mood.conf /etc/nginx/sites-available/weddingmood.ci
   sudo ln -s /etc/nginx/sites-available/weddingmood.ci /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   sudo certbot --nginx -d weddingmood.ci -d www.weddingmood.ci
   ```

8. **Pare-feu UFW** :
   ```bash
   sudo ufw allow OpenSSH
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   ```

---

## 6. Sauvegarde et Restauration

### Sauvegarde Quotidienne
Le script `scripts/backup.sh` sauvegarde la base PostgreSQL et les fichiers statiques dans `/var/backups/wedding-mood`.  
Pour automatiser chaque nuit à 03h00 dans `crontab -e` :
```cron
0 3 * * * /var/www/wedding-mood/scripts/backup.sh >> /var/log/wedding-mood-backup.log 2>&1
```

### Restauration d'une Sauvegarde
Pour restaurer une sauvegarde précédente :
```bash
./scripts/restore.sh /var/backups/wedding-mood/db_wedding_mood_db_YYYYMMDD_HHMMSS.sql.gz
```

---

## 7. Formules d'Abonnement & Accès Partagé

Le règlement s'effectue **manuellement** via Wave Côte d'Ivoire (aucune API de paiement n'est intégrée).

| Formule | Montant | Accès | Lien de paiement Wave |
|---|---|---|---|
| **Formule Couple** (recommandée) | **3 000 FCFA** | Accès complet pour **les deux partenaires** | https://pay.wave.com/m/M_W9fOyOGfFiNN/c/ci/?amount=3000 |
| **Formule Individuelle** | **2 000 FCFA** | Accès personnel pour **un seul partenaire** | https://pay.wave.com/m/M_W9fOyOGfFiNN/c/ci/?amount=2000 |

### Code d'Accès Unique
Dès la création de l'espace, un **code d'accès court et simple** est généré automatiquement (par exemple `WM-4821`).

- Chaque partenaire se connecte depuis **son propre téléphone**.
- Identifiants requis : **son adresse email personnelle** et **le code d'accès unique du couple**.
- Le code peut être copié, régénéré ou transmis directement par WhatsApp depuis l'espace Abonnement.
- L'administrateur visualise les emails et les codes d'accès depuis la console `/admin`.

### Accès de démonstration
- Emails : `david@weddingmood.ci` ou `ruth@weddingmood.ci`
- Code d'accès : `WM-2025`

---

## 8. Déploiement Vercel + Supabase + GitHub

Le projet est prêt pour un déploiement serverless sur Vercel avec Supabase comme PostgreSQL managé et GitHub comme dépôt/CI.

### Connexion GitHub à Vercel

1. Pousser le projet dans un dépôt GitHub privé.
2. Importer le dépôt dans Vercel avec **Framework Preset: Next.js**.
3. Vercel détecte automatiquement `vercel.json`.
4. Configurer les variables d'environnement dans **Project Settings > Environment Variables** pour `Production`, `Preview` et `Development`.
5. Déclencher un redéploiement après toute modification de variable.

### Variables Vercel obligatoires

```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
SUPABASE_DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app
SESSION_SECRET=UNE_CLE_LONGUE_GENEREE_AVEC_openssl_rand_-base64_32
```

Le port `6543` correspond au Transaction Pooler Supabase adapté aux fonctions Vercel. Le client Drizzle utilise `prepare: false` pour cette connexion.

### Migrations Supabase

Depuis un poste d'administration ou un job GitHub sécurisé, utiliser une URL directe ou Session Pooler en port `5432` :

```bash
SUPABASE_DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres" npx drizzle-kit push
```

La documentation détaillée se trouve dans `supabase/README.md`.

### CI GitHub

Le workflow `.github/workflows/ci.yml` exécute à chaque push et Pull Request :
- installation propre des dépendances ;
- génération des types Next.js ;
- vérification TypeScript ;
- application du schéma sur Postgres de test ;
- build de production ;
- contrôle des artefacts PWA (`manifest.webmanifest`, `sw.js`, icônes) et APK.

Les secrets Supabase ne doivent pas être commités dans GitHub. Pour une migration automatique, ajouter `SUPABASE_DATABASE_URL` dans les secrets GitHub Actions et créer un workflow séparé avec approbation manuelle.

## 9. Web App (PWA) et Application Android (APK)

- **Extension Web App** : manifeste `public/manifest.webmanifest`, service worker `public/sw.js` (cache + page `/offline.html`), icônes 72→512 px, écran d'installation automatique et page `/telechargement`.
- **Fichier APK téléchargeable** : `public/downloads/wedding-mood-v1.0.0.apk` (+ checksum `.sha256`), servi par `GET /api/download/apk`, métadonnées via `GET /api/download/info`.
- **APK signée de production** : projet TWA dans `android/` + script `bash scripts/build-apk.sh 1.0.0` (Bubblewrap, keystore hors Git).
- **Liaison TWA** : `public/.well-known/assetlinks.json` à compléter avec l'empreinte SHA-256 du keystore.

## 10. Administration et Pack Premium

- Console : `/admin` (connexion par `ADMIN_EMAIL` / `ADMIN_PASSWORD`, session `wm_admin_session`).
- Validation des règlements Wave Couple (3 000 FCFA) et Individuel (2 000 FCFA) avec activation immédiate du Pack Premium complet.
- Contrôles par couple : changement de formule, régénération du code d'accès, prolongation d'essai, suspension/blocage/activation, export CSV.
- Journal d'audit (`audit_logs`) consultable dans l'onglet dédié ; paramètres du compte admin modifiables sans redéploiement.

## 11. Contacts Officiels

- **Assistance WhatsApp** : https://wa.me/22570501356 (+225 70 50 13 56)
- **Règlement Wave CI Couple (3 000 FCFA)** : https://pay.wave.com/m/M_W9fOyOGfFiNN/c/ci/?amount=3000
- **Règlement Wave CI Individuel (2 000 FCFA)** : https://pay.wave.com/m/M_W9fOyOGfFiNN/c/ci/?amount=2000
