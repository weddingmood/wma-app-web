# Wedding Mood — Structure officielle du dossier

```
wedding-mood/
├── .github/workflows/ci.yml     # CI GitHub : typegen + tsc + drizzle push + build + artefacts PWA/APK
├── android/                     # Projet TWA Android (manifeste Bubblewrap + guide keystore)
│   ├── twa-manifest.json
│   └── README.md
├── docs/
│   └── STRUCTURE.md             # Ce fichier
├── drizzle/                     # Migrations générées (drizzle-kit generate)
├── nginx/
│   └── wedding-mood.conf        # Reverse-proxy VPS Contabo
├── public/
│   ├── .well-known/assetlinks.json
│   ├── downloads/               # APK téléchargeable + checksum SHA-256
│   ├── icons/                   # Icônes PWA 72→512, maskable, apple-touch, captures
│   ├── manifest.json
│   ├── manifest.webmanifest
│   ├── offline.html
│   └── sw.js
├── scripts/
│   ├── build-apk.sh             # Build APK signé via Bubblewrap
│   ├── backup.sh
│   └── restore.sh
├── src/
│   ├── app/
│   │   ├── admin/               # Console administrateur + validation Premium
│   │   ├── api/
│   │   │   ├── admin/           # auth, couples, payments, stats, games, audit
│   │   │   ├── download/        # apk (binaire) + info (métadonnées)
│   │   │   └── ...              # auth, tasks, budget, calendar, games, invitations...
│   │   ├── dashboard/           # 21 modules couple
│   │   ├── invitation/[slug]/   # Mini-site public + RSVP
│   │   ├── telechargement/      # Page PWA + APK + QR
│   │   ├── layout.tsx           # Métadonnées PWA globales
│   │   └── page.tsx             # Accueil publique
│   ├── components/
│   │   ├── games/               # Ludo, Awalé, Dames, Mots, profils joueurs
│   │   ├── PwaInstallPrompt.tsx # Bannière d'installation PWA
│   │   ├── PwaRegister.tsx      # Enregistrement du service worker
│   │   └── ...                  # Header, Sidebar, ThemeContext, Logo...
│   ├── db/
│   │   ├── index.ts             # Client postgres-js Supabase Pooler (prepare:false)
│   │   └── schema.ts            # 31 tables Drizzle (couples → audit_logs)
│   └── lib/
│       ├── auth-helpers.ts      # Sessions couple + admin
│       ├── seed.ts              # Données initiales + admin depuis ENV
│       ├── *-engine.ts          # Moteurs Ludo, Awalé, Dames, Mots
│       └── ...
├── supabase/
│   ├── config.toml              # Projet local Supabase
│   └── README.md                # Procédure Supabase managé
├── .env.example                 # Modèle complet des variables
├── .gitignore / .dockerignore / .vercelignore / .nvmrc
├── DEPLOYMENT.md                # Guide GitHub + Vercel + Supabase + Node + APK
├── Dockerfile                   # Image Node 20 multi-stage
├── docker-compose.yml           # App + Postgres 16
├── drizzle.config.ts            # CLI Drizzle (Supabase direct/pooler)
├── next.config.ts               # Images distantes + MIME APK + SW
├── package.json                 # Scripts dev/build/start/db
├── README.md                    # Présentation produit + lancement
└── vercel.json                  # Headers sécurité + cache + régions
```

## Conventions

- **Secrets** : uniquement via variables d'environnement, jamais dans Git.
- **Base** : Supabase Transaction Pooler (`6543`) en production Vercel, URL directe (`5432`) pour les migrations.
- **Auth** : sessions applicatives (`wm_session`, `wm_admin_session`), Supabase Auth désactivé.
- **Paiements** : Wave manuel uniquement, validation humaine dans `/admin`, journalisé dans `audit_logs`.
- **Mobile** : PWA first (`/telechargement`), APK TWA généré depuis la PWA validée.
