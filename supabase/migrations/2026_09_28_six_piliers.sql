-- ============================================================================
--  Wedding Mood Africa : les six piliers du cahier des charges
--  Migration Supabase (PostgreSQL) - idempotente, uniquement additive
-- ============================================================================
--  VERSION CALÉE sur votre schéma réel complet (src/db/schema.ts, 32 tables,
--  lu le 29/09/2026). Plus aucune colonne supposée : chaque nom a été vérifié.
--
--  Ce que cette migration fait :
--    1. ajoute TROIS colonnes à des tables existantes, toutes avec défaut :
--         couples.country              varchar(4)  DEFAULT 'CI'
--         providers.country            varchar(4)  DEFAULT 'CI'
--         invitations.cagnotte_goal_amount  integer  DEFAULT 0
--    2. crée 6 tables nouvelles, en integer comme vos clés `serial`
--    3. pose les clés étrangères réelles vers providers(id) et payments(id)
--    4. crée 2 vues publiques
--
--  Ce qu'elle NE fait PAS :
--    - aucune table existante n'est modifiée, renommée ni supprimée ;
--    - aucune colonne n'est ajoutée à cagnotte_contributions, payments,
--      guests, quiz_questions ni game_sessions ;
--    - aucune donnée existante n'est transformée ni déplacée.
--
--  Décisions prises après lecture de votre schéma :
--    A) La table gift_contributions du kit est ABANDONNÉE. Vous avez déjà
--       cagnotte_contributions pour l'argent des invités. Deux tables pour le
--       même argent auraient fait deux vérités contradictoires.
--    B) Aucune colonne is_featured, featured_until ni views n'est ajoutée à
--       providers. La mise en avant est portée par la nouvelle table
--       provider_features, et il n'y a pas de compteur de vues.
--    C) Le réglage de la cagnotte vit déjà dans invitations (show_cagnotte,
--       cagnotte_enabled, cagnotte_title, cagnotte_payment_url...). Seul
--       l'objectif manquait : c'est la colonne cagnotte_goal_amount.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Colonnes ajoutées à vos tables existantes
--    Chacune a un défaut, donc vos INSERT actuels continuent de fonctionner
--    sans être modifiés. Les blocs DO vérifient que la table existe.
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  IF to_regclass('public.couples') IS NOT NULL THEN
    ALTER TABLE couples ADD COLUMN IF NOT EXISTS country varchar(4) DEFAULT 'CI';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.providers') IS NOT NULL THEN
    ALTER TABLE providers ADD COLUMN IF NOT EXISTS country varchar(4) DEFAULT 'CI';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.invitations') IS NOT NULL THEN
    ALTER TABLE invitations ADD COLUMN IF NOT EXISTS cagnotte_goal_amount integer DEFAULT 0;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Pilier 1 : cérémonies configurables par pays
--    Types alignés sur votre style : integer pour les clés et les montants,
--    varchar(50) pour les dates (comme couples.wedding_date et
--    calendar_events.event_date).
--
--    COEXISTENCE avec vos colonnes invitations.ceremonies_selected et
--    invitations.ceremonies_details : votre page d'invitation actuelle continue
--    de lire ces deux colonnes JSON, rien ne change pour elle. Cette table
--    porte la nouvelle configuration par pays exposée par /api/ceremonies.
--    Correspondance des clés, pour un futur rapprochement :
--      dot            <-> traditionnelle
--      church         <-> religieuse
--      benediction    <-> religieuse
--      civil          <-> civil
--      reception      <-> reception
--      (fiancailles est une étape nouvelle, sans équivalent chez vous)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ceremonies (
  id           serial      PRIMARY KEY,
  couple_id    integer     NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  key          varchar(40) NOT NULL,        -- fiancailles | civil | religieuse | traditionnelle | reception
  label        varchar(120) NOT NULL,       -- intitulé choisi par le couple
  is_enabled   boolean     NOT NULL DEFAULT false,
  position     integer     NOT NULL DEFAULT 0,
  event_date   varchar(50),                 -- YYYY-MM-DD, comme chez vous
  event_time   varchar(20),
  location     varchar(200),
  note         text,
  created_at   timestamp   NOT NULL DEFAULT now(),
  updated_at   timestamp   NOT NULL DEFAULT now(),
  UNIQUE (couple_id, key)
);
CREATE INDEX IF NOT EXISTS ceremonies_couple_idx ON ceremonies (couple_id);

-- ----------------------------------------------------------------------------
-- 3. Piliers 2 et 3 : l'argent des invités
--    Aucune table créée ici. Le kit écrit dans VOTRE cagnotte_contributions
--    (donor_name, donor_phone, amount, message, payment_reference,
--    is_verified) et lit les réglages dans VOTRE table invitations.
--
--    Seule différence de comportement, assumée : un geste déclaré depuis
--    l'invitation publique est inséré avec is_verified = false et attend la
--    confirmation du couple, alors que votre /api/cagnotte insère à true.
--    Le compteur public ne somme que les gestes vérifiés.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- 4. Pilier 4 : animations jouables depuis le lien d'invitation
--    Tables distinctes de vos quiz_questions (global) et quiz_attempts (par
--    couple) : ici les questions sont écrites par le couple pour ses invités.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS couple_quiz_questions (
  id           serial      PRIMARY KEY,
  couple_id    integer     NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  question     text        NOT NULL,
  option_a     text        NOT NULL,
  option_b     text        NOT NULL,
  option_c     text,
  option_d     text,
  good_answer  varchar(2)  NOT NULL DEFAULT 'a',   -- a | b | c | d
  explanation  text,
  position     integer     NOT NULL DEFAULT 0,
  is_public    boolean     NOT NULL DEFAULT true,
  created_at   timestamp   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quiz_couple_idx ON couple_quiz_questions (couple_id);

CREATE TABLE IF NOT EXISTS couple_riddles (
  id           serial      PRIMARY KEY,
  couple_id    integer     NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  riddle       text        NOT NULL,
  answer       text        NOT NULL,
  hint         text,
  position     integer     NOT NULL DEFAULT 0,
  is_public    boolean     NOT NULL DEFAULT true,
  created_at   timestamp   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS riddle_couple_idx ON couple_riddles (couple_id);

CREATE TABLE IF NOT EXISTS couple_game_plays (
  id           serial      PRIMARY KEY,
  couple_id    integer     NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  guest_name   varchar(120),
  kind         varchar(20) NOT NULL DEFAULT 'quiz',   -- quiz | devinette
  score        integer     NOT NULL DEFAULT 0,
  total        integer     NOT NULL DEFAULT 0,
  played_at    timestamp   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS play_couple_idx ON couple_game_plays (couple_id);

-- ----------------------------------------------------------------------------
-- 5. Pilier 5 : marketplace des prestataires
--    providers.id et payments.id sont des `serial`, donc des integer : les
--    clés étrangères sont possibles et sont posées ici.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS provider_leads (
  id            serial      PRIMARY KEY,
  provider_id   integer     NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  couple_id     integer     REFERENCES couples(id) ON DELETE SET NULL,
  couple_name   varchar(160),
  couple_phone  varchar(30),
  wedding_date  varchar(50),
  message       varchar(400),
  whatsapp_link text,
  status        varchar(20) NOT NULL DEFAULT 'envoye',   -- envoye | lu | traite
  created_at    timestamp   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lead_provider_idx ON provider_leads (provider_id);

CREATE TABLE IF NOT EXISTS provider_features (
  id            serial      PRIMARY KEY,
  provider_id   integer     NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  payment_id    integer     REFERENCES payments(id) ON DELETE SET NULL,
  days          integer     NOT NULL DEFAULT 30,
  amount        integer     NOT NULL DEFAULT 10000,
  starts_at     timestamp   NOT NULL DEFAULT now(),
  ends_at       timestamp   NOT NULL,
  created_at    timestamp   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS feature_provider_idx ON provider_features (provider_id);
CREATE INDEX IF NOT EXISTS feature_active_idx   ON provider_features (ends_at);

-- ----------------------------------------------------------------------------
-- 6. Vues publiques
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_public_ceremonies AS
SELECT ce.couple_id, ce.key, ce.label, ce.is_enabled, ce.position,
       ce.event_date, ce.event_time, ce.location
FROM ceremonies ce
WHERE ce.is_enabled = true;

/* Compteur de la collecte, calculé depuis votre table cagnotte_contributions
   et filtré par les deux drapeaux de visibilité de votre table invitations. */
CREATE OR REPLACE VIEW v_public_gifts AS
SELECT i.couple_id,
       COALESCE(SUM(c.amount) FILTER (WHERE c.is_verified = true), 0) AS collecte,
       COUNT(*) FILTER (WHERE c.is_verified = true)                   AS gestes,
       COUNT(*) FILTER (WHERE c.is_verified = false)                  AS en_attente,
       COALESCE(i.cagnotte_goal_amount, 0)                            AS objectif,
       (i.show_cagnotte AND i.cagnotte_enabled)                       AS visible
FROM invitations i
LEFT JOIN cagnotte_contributions c ON c.couple_id = i.couple_id
GROUP BY i.couple_id, i.show_cagnotte, i.cagnotte_enabled, i.cagnotte_goal_amount;

-- ----------------------------------------------------------------------------
-- 7. Sécurité au niveau des lignes
--    Vos Route Handlers passent par la clé service (src/db/index.ts), donc RLS
--    n'est pas nécessaire. À activer seulement si vous exposez la clé anon
--    côté navigateur.
-- ----------------------------------------------------------------------------
-- ALTER TABLE ceremonies            ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE couple_quiz_questions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE couple_riddles        ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE couple_game_plays     ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE provider_leads        ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE provider_features     ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 8. Vérifications après exécution
-- ----------------------------------------------------------------------------
-- Les 6 nouvelles tables :
-- SELECT table_name FROM information_schema.tables
--  WHERE table_schema = 'public'
--    AND table_name IN ('ceremonies','couple_quiz_questions','couple_riddles',
--                       'couple_game_plays','provider_leads','provider_features')
--  ORDER BY table_name;                                  -- attendu : 6 lignes
--
-- Les 3 colonnes ajoutées :
-- SELECT table_name, column_name, data_type, column_default
--   FROM information_schema.columns
--  WHERE (table_name = 'couples'     AND column_name = 'country')
--     OR (table_name = 'providers'   AND column_name = 'country')
--     OR (table_name = 'invitations' AND column_name = 'cagnotte_goal_amount')
--  ORDER BY table_name;                                  -- attendu : 3 lignes
--
-- Les clés étrangères posées :
-- SELECT conname FROM pg_constraint
--  WHERE conname IN ('provider_leads_provider_id_fkey',
--                    'provider_features_provider_id_fkey',
--                    'provider_features_payment_id_fkey')
--  ORDER BY conname;                                     -- attendu : 3 lignes
--
-- Le compteur, sur un couple réel :
-- SELECT * FROM v_public_gifts LIMIT 5;
-- SELECT * FROM v_public_ceremonies LIMIT 5;
--
-- ----------------------------------------------------------------------------
-- Retour arrière (aucune donnée existante n'est transformée) :
--   DROP VIEW IF EXISTS v_public_gifts, v_public_ceremonies;
--   DROP TABLE IF EXISTS provider_features, provider_leads, couple_game_plays,
--                      couple_riddles, couple_quiz_questions, ceremonies;
--   ALTER TABLE invitations DROP COLUMN IF EXISTS cagnotte_goal_amount;
--   ALTER TABLE providers   DROP COLUMN IF EXISTS country;
--   ALTER TABLE couples     DROP COLUMN IF EXISTS country;
--
-- Si vous aviez déjà exécuté une version antérieure de ce fichier, celle qui
-- créait gift_contributions, supprimez-la : elle n'est plus utilisée.
--   DROP VIEW IF EXISTS v_public_gifts;
--   DROP TABLE IF EXISTS gift_contributions;
-- ============================================================================
