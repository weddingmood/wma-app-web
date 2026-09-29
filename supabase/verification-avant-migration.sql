-- ============================================================================
--  CONTRÔLE AVANT MIGRATION - Wedding Mood Africa
--  À coller dans Supabase : Dashboard puis SQL Editor, puis Run.
-- ============================================================================
--  Ce script ne modifie RIEN. Il ne contient que des SELECT.
--
--  Il répond à une seule question : votre base réelle correspond-elle au
--  src/db/schema.ts que vous m'avez envoyé ? Si le fichier de schéma est en
--  retard sur la base, la migration pourrait échouer, ou pire, poser une clé
--  étrangère d'un integer vers un bigint, ce que PostgreSQL refuse.
--
--  Lecture du résultat :
--    colonne verdict = OK            tout est conforme, la migration peut passer
--    colonne verdict = A VERIFIER    ne lancez pas la migration, envoyez-moi la ligne
--    colonne verdict = INFORMATION   simple comptage, rien à valider
--
--  LIMITATION À CONNAÎTRE : les lignes 28 à 35 comptent des lignes dans vos
--  tables couples, invitations, cagnotte_contributions, providers, payments et
--  guests. Si l'une de ces six tables n'existait pas du tout, PostgreSQL
--  refuserait le script entier dès l'analyse, au lieu de signaler la table
--  manquante : une garde dans un CASE ne protège pas d'une table absente.
--  D'après votre src/db/schema.ts, les six existent. Si le script échoue en
--  nommant une table, envoyez-moi le message.
-- ============================================================================

SELECT
  ordre,
  element,
  valeur,
  attendu,
  CASE
    WHEN attendu = 'information' THEN 'INFORMATION'
    WHEN COALESCE(valeur, '(introuvable)') = attendu THEN 'OK'
    ELSE 'A VERIFIER'
  END AS verdict
FROM (

  /* ── 1. Type des clés primaires : la migration pose des clés étrangères
        integer vers providers(id) et payments(id). Si l'une de ces deux
        colonnes est bigint chez vous, PostgreSQL refusera la contrainte. ── */
  SELECT 1 AS ordre, 'couples.id : type' AS element,
         (SELECT data_type FROM information_schema.columns
           WHERE table_schema='public' AND table_name='couples' AND column_name='id') AS valeur,
         'integer' AS attendu
  UNION ALL
  SELECT 2, 'providers.id : type',
         (SELECT data_type FROM information_schema.columns
           WHERE table_schema='public' AND table_name='providers' AND column_name='id'),
         'integer'
  UNION ALL
  SELECT 3, 'payments.id : type',
         (SELECT data_type FROM information_schema.columns
           WHERE table_schema='public' AND table_name='payments' AND column_name='id'),
         'integer'

  /* ── 2. Tables existantes dont le kit dépend : elles doivent être là ── */
  UNION ALL
  SELECT 4, 'table invitations',
         (SELECT CASE WHEN to_regclass('public.invitations') IS NULL THEN 'absente' ELSE 'présente' END),
         'présente'
  UNION ALL
  SELECT 5, 'table cagnotte_contributions',
         (SELECT CASE WHEN to_regclass('public.cagnotte_contributions') IS NULL THEN 'absente' ELSE 'présente' END),
         'présente'
  UNION ALL
  SELECT 6, 'table providers',
         (SELECT CASE WHEN to_regclass('public.providers') IS NULL THEN 'absente' ELSE 'présente' END),
         'présente'
  UNION ALL
  SELECT 7, 'table payments',
         (SELECT CASE WHEN to_regclass('public.payments') IS NULL THEN 'absente' ELSE 'présente' END),
         'présente'
  UNION ALL
  SELECT 8, 'table guests',
         (SELECT CASE WHEN to_regclass('public.guests') IS NULL THEN 'absente' ELSE 'présente' END),
         'présente'

  /* ── 3. Colonnes que le kit LIT dans vos tables : elles doivent exister,
        sinon les endpoints renverront une erreur 500 en production ── */
  UNION ALL
  SELECT 9, 'couples.status',
         (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema='public' AND table_name='couples' AND column_name='status')
           THEN 'présente' ELSE 'absente' END), 'présente'
  UNION ALL
  SELECT 10, 'couples.trial_ends_at',
         (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema='public' AND table_name='couples' AND column_name='trial_ends_at')
           THEN 'présente' ELSE 'absente' END), 'présente'
  UNION ALL
  SELECT 11, 'couples.plan_type',
         (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema='public' AND table_name='couples' AND column_name='plan_type')
           THEN 'présente' ELSE 'absente' END), 'présente'
  UNION ALL
  SELECT 12, 'invitations.show_cagnotte',
         (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema='public' AND table_name='invitations' AND column_name='show_cagnotte')
           THEN 'présente' ELSE 'absente' END), 'présente'
  UNION ALL
  SELECT 13, 'invitations.cagnotte_enabled',
         (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema='public' AND table_name='invitations' AND column_name='cagnotte_enabled')
           THEN 'présente' ELSE 'absente' END), 'présente'
  UNION ALL
  SELECT 14, 'cagnotte_contributions.is_verified',
         (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema='public' AND table_name='cagnotte_contributions' AND column_name='is_verified')
           THEN 'présente' ELSE 'absente' END), 'présente'
  UNION ALL
  SELECT 15, 'providers.service',
         (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema='public' AND table_name='providers' AND column_name='service')
           THEN 'présente' ELSE 'absente' END), 'présente'
  UNION ALL
  SELECT 16, 'payments.reference_number',
         (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema='public' AND table_name='payments' AND column_name='reference_number')
           THEN 'présente' ELSE 'absente' END), 'présente'
  UNION ALL
  SELECT 17, 'guests.rsvp_status',
         (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema='public' AND table_name='guests' AND column_name='rsvp_status')
           THEN 'présente' ELSE 'absente' END), 'présente'

  /* ── 4. Ce que la migration va AJOUTER : doit être absent.
        Si une de ces lignes dit "présente", la migration passera quand même
        (elle est idempotente), mais je veux le savoir. ── */
  UNION ALL
  SELECT 18, 'couples.country (à ajouter)',
         (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema='public' AND table_name='couples' AND column_name='country')
           THEN 'présente' ELSE 'absente' END), 'absente'
  UNION ALL
  SELECT 19, 'providers.country (à ajouter)',
         (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema='public' AND table_name='providers' AND column_name='country')
           THEN 'présente' ELSE 'absente' END), 'absente'
  UNION ALL
  SELECT 20, 'invitations.cagnotte_goal_amount (à ajouter)',
         (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema='public' AND table_name='invitations' AND column_name='cagnotte_goal_amount')
           THEN 'présente' ELSE 'absente' END), 'absente'

  /* ── 5. Les 6 tables nouvelles : doivent être absentes ── */
  UNION ALL
  SELECT 21, 'table ceremonies (à créer)',
         (SELECT CASE WHEN to_regclass('public.ceremonies') IS NULL THEN 'absente' ELSE 'présente' END), 'absente'
  UNION ALL
  SELECT 22, 'table couple_quiz_questions (à créer)',
         (SELECT CASE WHEN to_regclass('public.couple_quiz_questions') IS NULL THEN 'absente' ELSE 'présente' END), 'absente'
  UNION ALL
  SELECT 23, 'table couple_riddles (à créer)',
         (SELECT CASE WHEN to_regclass('public.couple_riddles') IS NULL THEN 'absente' ELSE 'présente' END), 'absente'
  UNION ALL
  SELECT 24, 'table couple_game_plays (à créer)',
         (SELECT CASE WHEN to_regclass('public.couple_game_plays') IS NULL THEN 'absente' ELSE 'présente' END), 'absente'
  UNION ALL
  SELECT 25, 'table provider_leads (à créer)',
         (SELECT CASE WHEN to_regclass('public.provider_leads') IS NULL THEN 'absente' ELSE 'présente' END), 'absente'
  UNION ALL
  SELECT 26, 'table provider_features (à créer)',
         (SELECT CASE WHEN to_regclass('public.provider_features') IS NULL THEN 'absente' ELSE 'présente' END), 'absente'

  /* ── 6. La table abandonnée : si une version antérieure du kit a déjà été
        exécutée chez vous, elle peut exister. Elle n'est plus utilisée. ── */
  UNION ALL
  SELECT 27, 'table gift_contributions (abandonnée)',
         (SELECT CASE WHEN to_regclass('public.gift_contributions') IS NULL THEN 'absente' ELSE 'présente' END), 'absente'

  /* ── 7. Volumétrie : pour savoir si des données réelles sont en jeu ── */
  UNION ALL
  SELECT 28, 'lignes dans couples',
         (SELECT CASE WHEN to_regclass('public.couples') IS NULL THEN 'table absente'
                      ELSE (SELECT COUNT(*)::text FROM couples) END), 'information'
  UNION ALL
  SELECT 29, 'lignes dans invitations',
         (SELECT CASE WHEN to_regclass('public.invitations') IS NULL THEN 'table absente'
                      ELSE (SELECT COUNT(*)::text FROM invitations) END), 'information'
  UNION ALL
  SELECT 30, 'lignes dans cagnotte_contributions',
         (SELECT CASE WHEN to_regclass('public.cagnotte_contributions') IS NULL THEN 'table absente'
                      ELSE (SELECT COUNT(*)::text FROM cagnotte_contributions) END), 'information'
  UNION ALL
  SELECT 31, 'lignes dans providers',
         (SELECT CASE WHEN to_regclass('public.providers') IS NULL THEN 'table absente'
                      ELSE (SELECT COUNT(*)::text FROM providers) END), 'information'
  UNION ALL
  SELECT 32, 'lignes dans payments',
         (SELECT CASE WHEN to_regclass('public.payments') IS NULL THEN 'table absente'
                      ELSE (SELECT COUNT(*)::text FROM payments) END), 'information'
  UNION ALL
  SELECT 33, 'lignes dans guests',
         (SELECT CASE WHEN to_regclass('public.guests') IS NULL THEN 'table absente'
                      ELSE (SELECT COUNT(*)::text FROM guests) END), 'information'

  /* ── 8. Valeurs de statut réellement présentes : le kit raisonne sur
        trial, pending_payment, verification, active, expired, suspended,
        blocked. Une valeur hors de cette liste replie sur le palier gratuit,
        jamais sur Premium, mais je préfère le savoir. ── */
  UNION ALL
  SELECT 34, 'statuts couples présents en base',
         (SELECT CASE WHEN to_regclass('public.couples') IS NULL THEN 'table absente'
                      ELSE (SELECT COALESCE(string_agg(DISTINCT COALESCE(status, '(nul)'), ', '), '(aucune ligne)')
                              FROM couples) END),
         'information'
  UNION ALL
  SELECT 35, 'services providers présents en base',
         (SELECT CASE WHEN to_regclass('public.providers') IS NULL THEN 'table absente'
                      ELSE (SELECT COALESCE(string_agg(DISTINCT COALESCE(service, '(nul)'), ', '), '(aucune ligne)')
                              FROM providers) END),
         'information'

) t
ORDER BY ordre;
