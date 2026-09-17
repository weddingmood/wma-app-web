# Connexion Supabase pour Wedding Mood

Wedding Mood utilise Supabase uniquement comme hébergeur PostgreSQL. L'authentification métier, les sessions, la messagerie et les règles de confidentialité restent gérées par l'application et Drizzle ORM.

## 1. Créer le projet

1. Créer un projet sur Supabase.
2. Dans **Project Settings > Database**, récupérer le mot de passe de la base.
3. Pour l'application Vercel, utiliser l'URL **Transaction Pooler** avec le port `6543`.
4. Pour les migrations Drizzle, utiliser l'URL directe `5432` ou le Session Pooler.

## 2. Variables Vercel

Ajouter en Production, Preview et Development :

```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
SUPABASE_DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://weddingmood.ci
SESSION_SECRET=GENERER_AVEC_openssl_rand_-base64_32
```

`SUPABASE_DATABASE_URL` est prioritaire dans le client Drizzle. `DATABASE_URL` reste accepté pour le CLI et les environnements classiques.

## 3. Appliquer le schéma

Depuis une machine qui peut joindre le projet Supabase :

```bash
SUPABASE_DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres" npx drizzle-kit push
```

Pour un déploiement reproductible, générer des migrations avec Drizzle puis les appliquer à la base Supabase :

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Ne jamais lancer `drizzle-kit push` depuis une fonction Vercel. Les changements de schéma doivent être appliqués depuis la CI GitHub ou une machine d'administration.

## 4. Important pour le Pooler Supabase

Le client `src/db/index.ts` utilise `postgres-js` avec `prepare: false`, ce qui est nécessaire avec le Transaction Pooler Supabase. La connexion est chiffrée en production et le nombre de connexions est limité pour respecter le fonctionnement serverless de Vercel.

## 5. Sécurité

- Ne jamais publier `DATABASE_URL`, `SUPABASE_DATABASE_URL` ou le mot de passe Supabase dans GitHub.
- Ne pas utiliser `NEXT_PUBLIC_` pour une URL de base de données.
- Les clés Supabase publiques et les clés service ne sont pas nécessaires au fonctionnement actuel.
- La protection des données par couple est appliquée dans les Route Handlers avant chaque requête Drizzle.
