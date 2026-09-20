import { db } from "@/db";
import {
  admins,
  couples,
  couplePreferences,
  tasks,
  timelineEvents,
  budgetCategories,
  expenses,
  decisions,
  prayers,
  devotions,
  coupleCommandments,
  quizQuestions,
  libraryBooks,
  articles,
  courses,
  guests,
  invitations,
  cagnotteContributions,
  dayJItems,
  dayJBlessings,
  payments,
} from "@/db/schema";
import { DEVOTIONAL_THEMES, DEFAULT_COMMANDMENTS } from "@/lib/constants";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export function hashPassword(plainText: string): string {
  return crypto.createHash("sha256").update(plainText).digest("hex");
}

export async function seedDatabaseIfEmpty() {
  try {
    // 1. Seed Admin (identifiants configurables via variables d'environnement)
    const existingAdmins = await db.select().from(admins).limit(1);
    if (existingAdmins.length === 0) {
      await db.insert(admins).values({
        email: (process.env.ADMIN_EMAIL || "admin@weddingmood.ci").trim().toLowerCase(),
        passwordHash: hashPassword(process.env.ADMIN_PASSWORD || "Admin@2025!WM"),
        name: process.env.ADMIN_NAME || "Direction Pastorale & Technique WM",
        role: "superadmin",
      });
    }

    // 2. Seed Devotions (7 themes)
    const existingDevotions = await db.select().from(devotions).limit(1);
    if (existingDevotions.length === 0) {
      for (const dev of DEVOTIONAL_THEMES) {
        await db.insert(devotions).values({
          themeNumber: dev.themeNumber,
          title: dev.title,
          scriptureRef: dev.scriptureRef,
          scriptureText: dev.scriptureText,
          teaching: dev.teaching,
          reflection: dev.reflection,
          coupleQuestion: dev.coupleQuestion,
          prayerModel: dev.prayerModel,
          pastorName: dev.pastorName,
          timelinePhase: dev.timelinePhase,
        });
      }
    }

    // 3. Seed Articles (Bon à savoir CI)
    const existingArticles = await db.select().from(articles).limit(1);
    if (existingArticles.length === 0) {
      await db.insert(articles).values([
        {
          title: "Guide complet du Mariage Civil en Côte d'Ivoire (Loi n° 2019-570)",
          slug: "mariage-civil-cote-divoire-loi-2019",
          category: "civil",
          organism: "Ministère de la Justice et des Droits de l'Homme de Côte d'Ivoire",
          source: "Journal Officiel de la République de Côte d'Ivoire",
          sourceUrl: "http://justice.gouv.ci",
          verifiedAt: "15 Janvier 2025",
          content: `Le mariage civil en Côte d'Ivoire est régi par la loi n° 2019-570 du 26 juin 2019. Voici les points capitaux :

1. Âge légal : L'âge minimum requis pour contracter mariage est de 18 ans révolus pour l'homme et la femme.
2. Compétence territoriale : La célébration se fait devant l'Officier de l'État Civil (Maire ou adjoint) de la commune où l'un des futurs époux a son domicile ou sa résidence établie par un mois d'habitation continue.
3. Publication des bans : Obligatoire au moins dix (10) jours avant la célébration à la mairie du lieu de célébration et à celle du domicile de chaque époux.
4. Régimes matrimoniaux en Côte d'Ivoire :
   - Régime légal : La Communauté de biens réduite aux acquêts (les biens acquis pendant le mariage sont communs, les biens d'avant mariage restent propres).
   - Régime conventionnel : La Séparation de biens (établi par contrat notarié avant la célébration).
5. Gestion de la famille : La loi ivoirienne de 2019 consacre la codirection de la famille par les deux époux dans l'intérêt moral et matériel du ménage.`,
        },
        {
          title: "La Dot Traditionnelle en Côte d'Ivoire : Rites, Sens et Pratiques Chrétiennes",
          slug: "dot-traditionnelle-cote-divoire-rites-foi",
          category: "dot",
          organism: "Conseil National des Rois et Chefs Traditionnels & Églises Évangéliques de CI",
          source: "Étude Pastorale & Anthropologique de Côte d'Ivoire",
          sourceUrl: "https://eglises.ci/dot-chretienne",
          verifiedAt: "20 Janvier 2025",
          content: `En Côte d'Ivoire, la dot est l'alliance entre deux familles avant le mariage civil et religieux.

- Chez les Akan (Baoulé, Agni, Ebrié, Attié) : Rites de 'Kôkôkô' (demande de consentement), remise de la liqueur d'ouverture, pagnes kita, bijoux en or, enveloppes d'honneur pour les parents et oncles maternels.
- Chez les Krou (Bété, Guéré, Wê, Dida) : Présentation de la boisson de route, discussions d'anciens, symbolique de protection et d'hospitalité.
- Chez les Mandé et Gour (Malinké, Sénoufo, Yacouba) : Prières des patriarches, kola, bétail et bénédictions des sages.

Conseils Pastoraux pour le Couple Chrétien :
1. Rendre le Christ suprême : Ne pratiquer aucun sacrifice d'animaux occulte ni libation d'adoration des ancêtres.
2. Négocier avec amour et respect : Établir un budget de dot réaliste et refuser la surenchère.
3. Prière de sanctification : Consacrer chaque don et présent à Dieu.`,
        },
        {
          title: "Les Pièces Administratives Obligatoires pour le Dossier de Mairie",
          slug: "pieces-administratives-mairie-abidjan",
          category: "documents",
          organism: "Mairie de Cocody / Plateau / Marcory / Yopougon",
          source: "Service d'État Civil des Communes de Côte d'Ivoire",
          sourceUrl: "https://mairie.ci",
          verifiedAt: "05 Février 2025",
          content: `Pour déposer votre dossier de mariage civil dans les mairies ivoiriennes, réunissez :

1. Pour chacun des futurs époux :
   - Un extrait d'acte de naissance délivré depuis moins de 3 mois (ou certificat tenant lieu d'acte).
   - Un certificat de résidence attestant d'au moins 30 jours dans la commune.
   - Un certificat prénuptial médical (délivré par un médecin agréé).
   - Une photocopie légalisée de la CNI ou du Passeport en cours de validité.
   - Deux photos d'identité de même tirage.
   - Un certificat de célibat ou de non-remariage.
2. Pour les témoins (2 témoins majeurs, un pour chaque époux) :
   - Photocopie lisible de la CNI ou du Passeport.
   - Mention de leur profession et domicile.
3. En cas de contrat de mariage :
   - Le certificat du notaire attestant du contrat de séparation de biens.`,
        },
        {
          title: "La Bénédiction Nuptiale : Exigences Spirituelles et Pastorales",
          slug: "benediction-nuptiale-eglise-pastoral",
          category: "eglise",
          organism: "Fédération Évangélique et Protestante de Côte d'Ivoire",
          source: "Commission Pastorale du Mariage Chrétien",
          sourceUrl: "https://fepci.org",
          verifiedAt: "10 Janvier 2025",
          content: `La bénédiction nuptiale scelle l'alliance du couple devant Dieu et son assemblée sainte.

Étapes clés recommandées :
1. Déclaration d'intention auprès du Pasteur au moins 6 mois avant la date.
2. Suivi des cours prénuptiaux pastoraux (8 à 12 séances obligatoires sur la communication, la sexualité sainte, les finances et la prière).
3. Obtention du certificat pastoral de fin de préparation prénuptiale.
4. Répétition générale du culte de mariage (échange des alliances, vœux, chants de la chorale, procession).`,
        },
      ]);
    }

    // 4. Seed Courses & Guides
    const existingCourses = await db.select().from(courses).limit(1);
    if (existingCourses.length === 0) {
      await db.insert(courses).values([
        {
          title: "Parcours Officiel Mairie : De la constitution du dossier au OUI civil",
          slug: "parcours-mairie-ivoirienne",
          category: "civil",
          description: "Guide méthodologique pas-à-pas pour réussir vos démarches administratives dans toutes les mairies de Côte d'Ivoire sans stress.",
          momentIdeal: "Entre J-90 et J-45",
          orderIndex: 1,
          requiredDocuments: [
            "Extraits d'acte de naissance (- de 3 mois)",
            "Certificats de résidence récents",
            "Certificats médicaux prénuptiaux",
            "Photocopies CNI certifiées",
            "CNI des deux témoins",
          ],
          steps: [
            { stepNumber: 1, title: "Retrait de la fiche de mariage", detail: "Rendez-vous au service état civil de votre mairie choisie pour retirer la pochette officielle." },
            { stepNumber: 2, title: "Bilan médical prénuptial", detail: "Effectuez vos bilans sanguins (groupe, rhésus, électrophorèse d'hémoglobine AS/SS/AA, sérologies)." },
            { stepNumber: 3, title: "Dépôt et Publication des Bans", detail: "Déposez le dossier complet au moins 15 jours avant la date pour affichage public légal de 10 jours." },
            { stepNumber: 4, title: "Entretien pré-mariage", detail: "Rencontre avec l'officier d'état civil pour valider le régime matrimonial (communauté ou séparation)." },
          ],
          practicalTips: [
            "Faites au moins 3 photocopies certifiées de chaque document.",
            "Réservez l'heure exacte de passage à la mairie tôt, surtout les samedis très demandés.",
            "Désignez un coordonnateur logistique dédié aux livrets de famille et bagues le Jour J.",
          ],
          legalSources: [
            "Loi ivoirienne n° 2019-570 du 26 juin 2019 sur le mariage",
            "Code de procédure d'état civil de Côte d'Ivoire",
          ],
        },
        {
          title: "Parcours Dot Traditionnelle Chrétienne : Honneur et Sanctification",
          slug: "parcours-dot-traditionnelle",
          category: "dot",
          description: "Comment organiser une dot honorable dans le respect des coutumes familiales ivoiriennes et dans la totale sanctification de l'Évangile.",
          momentIdeal: "Entre J-120 et J-60",
          orderIndex: 2,
          requiredDocuments: [
            "Liste officielle de dot remise par les patriarches",
            "Accord préalable sur le lieu (domicile familial de la fiancée)",
            "Choix du porte-parole chrétien de chaque délégation",
          ],
          steps: [
            { stepNumber: 1, title: "La première démarche (Kôkôkô)", detail: "Présentation des intentions du jeune homme par son père ou oncle auprès de la famille de la fiancée." },
            { stepNumber: 2, title: "Harmonisation pastorale de la liste", detail: "Revue conjointe avec les parents pour remplacer les éléments occultes ou excessifs par des présents honorables." },
            { stepNumber: 3, title: "Célébration de l'alliance familiale", detail: "Cérémonie conviviale avec prière d'ouverture, remise des dons, repas et bénédiction des aînés." },
          ],
          practicalTips: [
            "Prévoyez un service traiteur ou des plats ivoiriens conviviaux (Attiéké poisson braisé, Alloco, sauces traditionnelles).",
            "Restez serein face aux négociations amicales des oncles.",
            "Consacrez la journée par un temps de prière avant l'arrivée des délégations.",
          ],
          legalSources: [
            "Coutumiers traditionnels de Côte d'Ivoire",
            "Recommandations de l'Alliance Évangélique de Côte d'Ivoire",
          ],
        },
      ]);
    }

    // 5. Seed Library Books
    const existingBooks = await db.select().from(libraryBooks).limit(1);
    if (existingBooks.length === 0) {
      await db.insert(libraryBooks).values([
        {
          title: "Les 5 Langages de l'Amour dans le Foyer Chrétien",
          author: "Gary Chapman (Adaptation Pastorale Afrique de l'Ouest)",
          pastor: "Éditions Foyer Chrétien Abidjan",
          category: "communication",
          description: "Découvrez les clés indispensables pour combler le réservoir émotionnel de votre conjoint : Paroles valorisantes, Moments de qualité, Cadeaux sincères, Services rendus et Toucher physique.",
          bibleVerse: "1 Corinthiens 13:4-7",
          accessLevel: "all",
          readTimeMin: 20,
          chapters: [
            { title: "Chapitre 1 : Remplir le réservoir d'amour", content: "Chaque être humain a un besoin vital de se sentir aimé. Dans le mariage, ce réservoir se vide avec le rythme effréné du quotidien si nous ne connaissons pas la langue maternelle affective de notre conjoint..." },
            { title: "Chapitre 2 : Les Paroles de Bénédiction", content: "Les proverbes nous rappellent que la mort et la vie sont au pouvoir de la langue. Les compliments sincères, les encouragements dans les projets professionnels et spirituels bâtissent l'assurance..." },
            { title: "Chapitre 3 : Les Moments de Qualité en Couple", content: "Passer du temps de qualité ne signifie pas simplement être assis devant le même écran, mais s'accorder une attention exclusive sans distraction téléphonique..." },
          ],
        },
        {
          title: "L'Argent, la Foi et la Prospérité du Foyer",
          author: "Pasteur Stéphane Bamba & Dr Épouse Bamba",
          pastor: "Centre Chrétien de la Grâce - Cocody",
          category: "finances",
          description: "Un guide pratique pour les jeunes couples ivoiriens : comment bâtir un budget transparent en FCFA, épargner pour le premier logement, honorer Dieu par la dîme et éviter l'endettement pour la noce.",
          bibleVerse: "Proverbes 21:20",
          accessLevel: "all",
          readTimeMin: 25,
          chapters: [
            { title: "Chapitre 1 : L'unité financière en Christ", content: "Dieu ne bénit pas la dissimulation. L'homme et la femme forment une seule chair, ce qui implique une transparence totale sur les revenus, les charges de famille et les projets d'investissement..." },
            { title: "Chapitre 2 : La gestion prudente du budget de mariage", content: "Ne commencez pas votre vie conjugale sous le poids de dettes écrasantes contractées pour épater une foule d'un jour. Un mariage réussi est celui où la paix du lendemain est préservée..." },
            { title: "Chapitre 3 : La Cagnotte Premier Loyer et Investissement", content: "Anticipez immédiatement les 3 à 6 mois de caution et loyer d'avance à Abidjan, ainsi que le fonds d'urgence de santé et de foyer..." },
          ],
        },
        {
          title: "La Sainteté et la Joie de l'Intimité dans le Mariage",
          author: "Pasteure Grace N'Guessan",
          pastor: "Ministère Foi & Espérance Abidjan",
          category: "purete",
          description: "La vision biblique de la sexualité et de la pureté : se préserver dans la sainteté jusqu'à la nuit de noces et vivre une intimité épanouie et sans culpabilité selon le dessein de Dieu.",
          bibleVerse: "Hébreux 13:4",
          accessLevel: "all",
          readTimeMin: 30,
          chapters: [
            { title: "Chapitre 1 : Le mariage est honorable en tout", content: "La sexualité n'a pas été inventée par le péché mais par Dieu Lui-même pour célébrer l'unité d'alliance entre un homme et une femme dans le mariage..." },
            { title: "Chapitre 2 : Garder son cœur et son corps jusqu'au Jour J", content: "Les fiançailles sont un temps de sanctification et d'apprentissage émotionnel. Poser des garde-fous clairs évite les regrets et décuple la joie du jour de noces..." },
          ],
        },
      ]);
    }

    // 6. Seed Quiz Questions (Connaissance, Situations Réelles CI, Discussion Couple)
    const existingQuiz = await db.select().from(quizQuestions).limit(1);
    if (existingQuiz.length === 0) {
      await db.insert(quizQuestions).values([
        // Connaissance Biblique
        {
          category: "connaissance",
          question: "Selon Genèse 2:24, que doit faire l'homme avant de devenir une seule chair avec sa femme ?",
          options: ["Construire une grande maison", "Quitter son père et sa mère et s'attacher à sa femme", "Demander la dot à son village", "Écrire un contrat d'alliance"],
          correctOptionIndex: 1,
          explanation: "La Parole de Dieu pose le double principe fondamental : quitter avec respect son foyer d'origine pour s'attacher et bâtir un nouveau foyer autonome.",
          bibleRef: "Genèse 2:24",
          dayNumber: 1,
        },
        {
          category: "connaissance",
          question: "Dans Éphésiens 5, à quoi Paul compare-t-il l'amour d'un mari pour son épouse ?",
          options: ["À l'amitié de Époux et Jonathan", "À l'amour de Christ qui s'est livré pour Son Église", "À la sagesse du Roi Salomon", "À la puissance d'Élie sur le Mont Carmel"],
          correctOptionIndex: 1,
          explanation: "Christ a donné Sa vie pour Son Église : c'est un amour sacrificiel, protecteur et sanctificateur.",
          bibleRef: "Éphésiens 5:25",
          dayNumber: 1,
        },
        {
          category: "connaissance",
          question: "Que déclare Proverbes 18:22 au sujet de celui qui trouve une femme ?",
          options: ["Il trouve le repos de son âme", "Il trouve le bonheur et obtient une faveur de l'Éternel", "Il trouve une conseillère pour sa maison", "Il s'assure une postérité nombreuse"],
          correctOptionIndex: 1,
          explanation: "Trouver son conjoint selon le cœur de Dieu est une grâce et une faveur de l'Éternel.",
          bibleRef: "Proverbes 18:22",
          dayNumber: 2,
        },
        {
          category: "connaissance",
          question: "Selon 1 Corinthiens 13:4-7, quel est le premier attribut de l'amour véritable ?",
          options: ["L'amour est impatient", "L'amour est plein de bonté et patient", "L'amour exige la perfection", "L'amour cherche son intérêt"],
          correctOptionIndex: 1,
          explanation: "L'amour divin (Agapé) est patient, plein de bonté, ne soupçonne point le mal et excuse tout.",
          bibleRef: "1 Corinthiens 13:4",
          dayNumber: 2,
        },
        {
          category: "connaissance",
          question: "Quelle recommandation Paul donne-t-il dans Éphésiens 4:26 concernant la colère dans le couple ?",
          options: ["Gardez le silence pendant trois jours", "Que le soleil ne se couche pas sur votre colère", "Racontez votre différend à vos beaux-parents", "Attendez le culte du dimanche"],
          correctOptionIndex: 1,
          explanation: "Résoudre les tensions le jour même évite que l'ennemi ne prenne pied dans le cœur et le foyer.",
          bibleRef: "Éphésiens 4:26",
          dayNumber: 3,
        },

        // Situations Réelles en Côte d'Ivoire
        {
          category: "situation_reelle",
          question: "Situation CI : Un oncle influent exige d'imposer 100 personnes de plus à la liste des invités de la réception sans participation financière. Comment réagit le couple chrétien avec sagesse ?",
          options: [
            "Lui crier dessus publiquement pour lui rappeler le budget",
            "S'endetter lourdement à la banque pour éviter toute gêne",
            "Faire une visite respectueuse avec des présents pour expliquer calmement la limite stricte de la salle tout en proposant une diffusion vidéo ou une visite post-mariage",
            "Annuler le mariage pour protester",
          ],
          correctOptionIndex: 2,
          explanation: "La sagesse ivoirienne chrétienne allie l'honneur filial (démarche en personne avec respect) et la fermeté budgétaire indispensable pour ne pas couler le ménage.",
          ivorianContext: "Conflits de liste d'invités avec la famille élargie à Abidjan",
          bibleRef: "Proverbes 15:1",
          dayNumber: 1,
        },
        {
          category: "situation_reelle",
          question: "Situation CI : Deux semaines avant le mariage civil, le propriétaire de la maison convoitée à Cocody augmente soudain la caution de 3 mois de loyer. Quelle est la démarche prioritaire du couple ?",
          options: [
            "Prier ensemble, faire un point de trésorerie transparent et chercher une alternative sécurisée sans paniquer ni s'accuser",
            "Accuser son futur conjoint de mauvaise gestion et bouder",
            "Prendre l'argent alloué à la dot pour payer",
            "Signer sans lire ni réfléchir",
          ],
          correctOptionIndex: 0,
          explanation: "Face aux imprévus de logement à Abidjan, l'union dans la prière et la lucidité financière renforcent le couple au lieu de le diviser.",
          ivorianContext: "Immobilier et premier loyer à Abidjan",
          bibleRef: "Philippiens 4:6-7",
          dayNumber: 2,
        },
        {
          category: "situation_reelle",
          question: "Situation CI : La belle-famille propose d'ajouter une cérémonie ésotérique traditionnelle la veille de la bénédiction nuptiale pour 'protéger la fertilité'. Que fait le couple ?",
          options: [
            "Accepter en cachette pour ne vexer personne",
            "Refuser avec violence et couper les ponts avec la famille",
            "Affirmer avec amour et douceur leur foi exclusive en Jésus-Christ comme seul protecteur et demander au pasteur d'intercéder avec eux",
            "Consulter un marabout",
          ],
          correctOptionIndex: 2,
          explanation: "Le chrétien ne transige pas sur son allégeance à Jésus-Christ tout en répondant avec douceur et respect selon 1 Pierre 3:15.",
          ivorianContext: "Syncrétisme et traditions lors des mariages coutumiers",
          bibleRef: "Josué 24:15",
          dayNumber: 3,
        },

        // Discussion de Couple (QCD)
        {
          category: "discussion_couple",
          question: "Question de complicité : Quel est le moment de notre journée que tu aimerais que nous consacrions exclusivement l'un à l'autre une fois mariés ?",
          options: ["Le café du matin", "La prière du soir au coucher", "Le dîner sans téléphone", "Une balade du weekend"],
          correctOptionIndex: 0,
          explanation: "Cette question ouvre un dialogue précieux pour planifier vos rituels d'intimité quotidienne.",
          dayNumber: 1,
        },
        {
          category: "discussion_couple",
          question: "Question financière : En cas de prime ou d'entrée d'argent inattendue, quelle est notre priorité commune ?",
          options: ["Épargne de secours pour le foyer", "Donner une offrande d'action de grâce à l'église", "Investir dans un projet commun", "Faire un voyage de noces inoubliable"],
          correctOptionIndex: 0,
          explanation: "Harmoniser vos visions financières renforce votre unité d'action.",
          dayNumber: 2,
        },
        {
          category: "discussion_couple",
          question: "Question de vision : Dans 5 ans, quel témoignage principal souhaites-tu que notre foyer chrétien rende à notre entourage ?",
          options: ["Un couple d'accueil et d'amour pour les nécessiteux", "Un modèle de foi et d'éducation pour nos enfants", "Une réussite professionnelle et spirituelle équilibrée", "Un pilier solide dans notre église locale"],
          correctOptionIndex: 0,
          explanation: "Bâtir ensemble la vision de votre sanctuaire conjugal.",
          dayNumber: 3,
        },
      ]);
    }

    // 7. Seed Demo Couple: Époux & Épouse
    const demoCoupleSlug = "Époux-Épouse";
    const existingCouple = await db.select().from(couples).where(eq(couples.slug, demoCoupleSlug)).limit(1);

    let coupleId: number;

    if (existingCouple.length === 0) {
      const trialExpiry = new Date();
      trialExpiry.setDate(trialExpiry.getDate() + 3); // 3-day trial

      const [newCouple] = await db
        .insert(couples)
        .values({
          slug: demoCoupleSlug,
          partner1Name: "Époux Kouassi",
          partner2Name: "Épouse Yao",
          partner1Email: "Époux@weddingmood.ci",
          partner2Email: "Épouse@weddingmood.ci",
          partner1Role: "groom",
          partner2Role: "bride",
          partner1Photo: "https://images.pexels.com/photos/34887758/pexels-photo-34887758.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400",
          partner2Photo: "https://images.pexels.com/photos/37828098/pexels-photo-37828098.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400",
          weddingDate: "2025-11-15",
          city: "Abidjan (Cocody & Riviera)",
          venue: "Palais de la Grâce & Espace Nuptial Riviera Golf",
          totalBudget: 6500000, // 6.5M FCFA
          estimatedGuests: 250,
          ceremonyTypes: ["dot", "civil", "benediction", "reception"],
          church: "Église Évangélique Grâce et Vie - Riviera",
          pastorName: "Pasteur Jean-Marc Kouadio",
          ethnicity: "Baoulé & Bété",
          traditions: "Dot coutumière akan avec pagnes kita traditionnels et présents honorifiques.",
          bibleVerse: "Ecclésiaste 4:12 - La corde à trois fils ne se rompt pas facilement.",
          status: "trial",
          trialEndsAt: trialExpiry,
          passwordHash: hashPassword("Amour@2025!"),
          sharedPasscode: "7777",
          accessCode: "WM-2025",
          planType: "couple",
          planAmount: 3000,
          partner1AccessActive: true,
          partner2AccessActive: true,
        })
        .returning();

      coupleId = newCouple.id;

      // Seed Preferences
      await db.insert(couplePreferences).values({
        coupleId: coupleId,
        themeId: 1, // Terracotta Royal
        fontFamily: "cormorant",
        displayMode: "standard",
        density: "normal",
        fontSize: "md",
        coverPhotoUrl: "https://images.pexels.com/photos/34887758/pexels-photo-34887758.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
        countdownStyle: "romantic",
      });

      // Seed 10 Commandments for couple
      for (const cmd of DEFAULT_COMMANDMENTS) {
        await db.insert(coupleCommandments).values({
          coupleId: coupleId,
          orderIndex: cmd.id,
          text: cmd.text,
          importanceWhy: cmd.importanceWhy,
          commitmentText: cmd.commitmentText,
          partner1Confirmed: true,
          partner2Confirmed: cmd.id <= 7, // partially confirmed to show progress
        });
      }

      // Seed Budget Categories
      const catResults = await db
        .insert(budgetCategories)
        .values([
          { coupleId, name: "Cérémonie & Dot Traditionnelle", allocatedAmount: 1200000, iconKey: "gift", colorKey: "terracotta", orderIndex: 1 },
          { coupleId, name: "Mairie & Frais d'État Civil", allocatedAmount: 250000, iconKey: "file-text", colorKey: "gold", orderIndex: 2 },
          { coupleId, name: "Tenues & Alliances Nuptiales", allocatedAmount: 1500000, iconKey: "sparkles", colorKey: "emerald", orderIndex: 3 },
          { coupleId, name: "Salle de Réception & Décoration", allocatedAmount: 1800000, iconKey: "home", colorKey: "navy", orderIndex: 4 },
          { coupleId, name: "Service Traiteur & Boissons", allocatedAmount: 1200000, iconKey: "utensils", colorKey: "sage", orderIndex: 5 },
          { coupleId, name: "Photo, Vidéo & Drone", allocatedAmount: 400000, iconKey: "camera", colorKey: "bronze", orderIndex: 6 },
          { coupleId, name: "Sonorisation, Chantre & Musique", allocatedAmount: 250000, iconKey: "music", colorKey: "coral", orderIndex: 7 },
        ])
        .returning();

      const dotCatId = catResults[0]?.id;
      const mairieCatId = catResults[1]?.id;
      const tenuesCatId = catResults[2]?.id;
      const salleCatId = catResults[3]?.id;

      // Seed Expenses (With Dual Validation test case > 50,000 FCFA)
      await db.insert(expenses).values([
        {
          coupleId,
          categoryId: salleCatId,
          title: "Acompte Réservation Espace Riviera Golf",
          amount: 800000,
          advancePaid: 800000,
          remainingAmount: 0,
          dueDate: "2025-08-01",
          paymentStatus: "paid",
          recipient: "Direction Espace Riviera",
          requiresDualValidation: true,
          validationStatus: "approved_by_both",
          partner1Approved: true,
          partner2Approved: true,
          notes: "Reçu de versement conservé. Salle climatisée 300 places assises.",
        },
        {
          coupleId,
          categoryId: tenuesCatId,
          title: "Acompte Alliances Or 18K chez Bijouterie du Plateau",
          amount: 450000,
          advancePaid: 250000,
          remainingAmount: 200000,
          dueDate: "2025-09-15",
          paymentStatus: "partial",
          recipient: "Bijouterie Royale Plateau",
          requiresDualValidation: true,
          validationStatus: "approved_by_both",
          partner1Approved: true,
          partner2Approved: true,
          notes: "Gravure personnalisée avec verset Ecclésiaste 4:12.",
        },
        {
          coupleId,
          categoryId: dotCatId,
          title: "Achat des Pagnes Kita traditionnels et présents",
          amount: 350000,
          advancePaid: 150000,
          remainingAmount: 200000,
          dueDate: "2025-09-30",
          paymentStatus: "partial",
          recipient: "Maître Tisserand Bomizambo",
          requiresDualValidation: true,
          validationStatus: "pending", // Pending Épouse's validation!
          partner1Approved: true,
          partner2Approved: false,
          notes: "En attente de validation conjointe pour le choix des motifs.",
        },
        {
          coupleId,
          categoryId: mairieCatId,
          title: "Frais de dossier et timbres fiscaux Mairie de Cocody",
          amount: 45000,
          advancePaid: 45000,
          remainingAmount: 0,
          dueDate: "2025-08-10",
          paymentStatus: "paid",
          recipient: "Régie État Civil Cocody",
          requiresDualValidation: false, // < 50 000 FCFA
          validationStatus: "approved_by_both",
          partner1Approved: true,
          partner2Approved: true,
        },
      ]);

      // Seed Tasks
      await db.insert(tasks).values([
        {
          coupleId,
          title: "Déposer le dossier complet à la Mairie de Cocody",
          description: "Vérifier la validité des extraits d'acte de naissance (- de 3 mois) et les certificats médicaux.",
          category: "civil",
          assignee: "him",
          dueDate: "2025-08-15",
          priority: "high",
          status: "completed",
          budgetEstimated: 50000,
          budgetActual: 45000,
        },
        {
          coupleId,
          title: "Confirmer le menu dégustation avec le Traiteur",
          description: "Sélectionner 3 entrées, buffet chaud (Tchep ivoirien, Foutou banane, Mérou braisé) et gâteau de noce.",
          category: "traiteur",
          assignee: "her",
          dueDate: "2025-09-20",
          priority: "high",
          status: "in_progress",
          budgetEstimated: 1200000,
          budgetActual: 0,
        },
        {
          coupleId,
          title: "Session 4 d'entretien prénuptial avec le Pasteur Jean-Marc",
          description: "Thème de la séance : La gestion financière du foyer et la communication dans les épreuves.",
          category: "spirituel",
          assignee: "both",
          dueDate: "2025-09-25",
          priority: "urgent",
          status: "todo",
          budgetEstimated: 0,
          budgetActual: 0,
        },
        {
          coupleId,
          title: "Finaliser la liste des 250 invités et envoyer les liens d'invitation",
          description: "Attribuer les groupes (Famille, Jeunesse, Chorale, Amis, VIP) et activer le suivi RSVP en direct.",
          category: "reception",
          assignee: "both",
          dueDate: "2025-10-01",
          priority: "high",
          status: "in_progress",
        },
        {
          coupleId,
          title: "Essayage final de la robe de mariée et du costume sur-mesure",
          description: "Prendre les dernières retouches avec le couturier à Treichville.",
          category: "tenues",
          assignee: "both",
          dueDate: "2025-10-15",
          priority: "medium",
          status: "todo",
        },
      ]);

      // Seed Timeline Events (J-90 to Jour J)
      await db.insert(timelineEvents).values([
        { coupleId, phase: "J-90", title: "Entretien initial avec le Pasteur & Début des cours", description: "Lancer le parcours des 7 thèmes d'édification spirituelle.", category: "spirituel", isCompleted: true, orderIndex: 1 },
        { coupleId, phase: "J-90", title: "Fixation définitive de la date et réservation de la salle", description: "Versement de l'acompte pour bloquer l'Espace Riviera Golf.", category: "reception", isCompleted: true, orderIndex: 2 },
        { coupleId, phase: "J-60", title: "Célébration de la Dot Traditionnelle au domicile familial", description: "Union des deux grandes familles selon les valeurs de l'Évangile.", category: "dot", isCompleted: true, orderIndex: 3 },
        { coupleId, phase: "J-60", title: "Dépôt officiel du dossier à la Mairie et publication des bans", description: "Affichage des bans légaux pendant 10 jours à la mairie.", category: "civil", isCompleted: true, orderIndex: 4 },
        { coupleId, phase: "J-30", title: "Envoi des invitations digitales et suivi des RSVP en direct", description: "Transmission du lien personnalisé aux 250 invités.", category: "invitations", isCompleted: false, orderIndex: 5 },
        { coupleId, phase: "J-30", title: "Validation finale du traiteur, de la décoration et du photographe", description: "Confirmer le protocole, le chronogramme et les acomptes restants.", category: "logistique", isCompleted: false, orderIndex: 6 },
        { coupleId, phase: "J-14", title: "Répétition générale du culte de mariage à l'église", description: "Répétition avec les témoins, demoiselles d'honneur, garçons d'honneur et la chorale.", category: "spirituel", isCompleted: false, orderIndex: 7 },
        { coupleId, phase: "J-7", title: "Dernier point de coordination et remise des livrets de messe", description: "Vérifier le chronogramme minute par minute avec le comité de pilotage.", category: "logistique", isCompleted: false, orderIndex: 8 },
        { coupleId, phase: "J-1", title: "Veille du Jour J : Repos, recueillement et prière intime du couple", description: "Remettre la journée entre les mains de l'Éternel dans la paix du cœur.", category: "spirituel", isCompleted: false, orderIndex: 9 },
        { coupleId, phase: "JOUR_J", title: "Le Grand Jour : Célébration Civile, Bénédiction Nuptiale et Réception", description: "Que Dieu soit loué pour cette alliance éternelle !", category: "reception", isCompleted: false, orderIndex: 10 },
      ]);

      // Seed Decisions
      await db.insert(decisions).values([
        {
          coupleId,
          title: "Choix de l'Orchestre Gospel pour la Réception",
          description: "Deux propositions reçues : Groupe Louange Divine (350 000 FCFA) vs Chorale Céleste Live (450 000 FCFA avec cuivres).",
          amount: 450000,
          proposalDetails: "Épouse préfère la Chorale Céleste Live pour leur répertoire de louange ivoirienne et contemporaine.",
          status: "approved",
          partner1Decision: "approved",
          partner2Decision: "approved",
          partner1Comment: "Je valide, leur prestation au mariage de Jean était remarquable.",
          partner2Comment: "Parfait mon amour, ils vont vraiment honorer Dieu pendant le banquet !",
        },
        {
          coupleId,
          title: "Option Photobooth & Borne à Selfie interactive pour les invités",
          description: "Proposition d'un prestataire pour installer une borne à selfie personnalisée avec le logo Wedding Mood et nos prénoms.",
          amount: 120000,
          proposalDetails: "Coût : 120 000 FCFA pour 4 heures d'impression illimitée.",
          status: "pending",
          partner1Decision: "pending",
          partner2Decision: "approved",
          partner1Comment: "Je vérifie si le budget traiteur ne dépasse pas avant de confirmer.",
          partner2Comment: "Ce serait un magnifique souvenir pour la jeunesse et nos amis !",
        },
      ]);

      // Seed Prayer Journal
      await db.insert(prayers).values([
        {
          coupleId,
          title: "Prière pour la paix et l'harmonie entre nos deux familles",
          prayerText: "Seigneur Jésus, nous Te prions d'apaiser chaque cœur lors des discussions de dot. Que l'amour, la compréhension et le respect règnent en maîtres.",
          category: "famille",
          prayerDate: "2025-07-10",
          isAnswered: true,
          testimony: "Gloire à Dieu ! La rencontre entre nos parents s'est déroulée dans une joie et une fraternité extraordinaires.",
          status: "active",
          partner1Prayed: true,
          partner2Prayed: true,
        },
        {
          coupleId,
          title: "Prière pour la provision financière de notre premier loyer",
          prayerText: "Père Céleste, Toi qui es notre pourvoyeur, bénis le travail de nos mains. Accorde-nous la provision nécessaire pour la caution et l'aménagement de notre maison.",
          category: "finances",
          prayerDate: "2025-08-01",
          isAnswered: false,
          status: "active",
          partner1Prayed: true,
          partner2Prayed: true,
        },
        {
          coupleId,
          title: "Prière pour la consécration spirituelle de notre nuit de noces",
          prayerText: "Seigneur, nous Te confions notre intimité. Sanctifie nos pensées, donne-nous la douceur, la tendresse et la paix pour entrer dans cette alliance sacrée.",
          category: "intimite",
          prayerDate: "2025-08-15",
          isAnswered: false,
          status: "active",
          partner1Prayed: true,
          partner2Prayed: true,
        },
      ]);

      // Seed Guests
      const guestList = [
        { firstName: "Pasteur Jean-Marc", lastName: "Kouadio", groupName: "vip", phone: "+225 07 01 02 03 04", email: "pasteur@eglisegrace.ci", plusOnesAllowed: 1, plusOnesConfirmed: 1, rsvpStatus: "confirmed", tableNumber: "Table d'Honneur", qrCodeToken: "WM-VIP-001", isCheckedIn: false },
        { firstName: "Koffi", lastName: "Kouassi (Oncle)", groupName: "famille", phone: "+225 05 11 22 33 44", plusOnesAllowed: 2, plusOnesConfirmed: 2, rsvpStatus: "confirmed", tableNumber: "Table Famille Akan", qrCodeToken: "WM-FAM-002", isCheckedIn: false },
        { firstName: "Ablan", lastName: "Yao (Maman)", groupName: "famille", phone: "+225 01 22 33 44 55", plusOnesAllowed: 2, plusOnesConfirmed: 2, rsvpStatus: "confirmed", tableNumber: "Table Famille Akan", qrCodeToken: "WM-FAM-003", isCheckedIn: false },
        { firstName: "Serge", lastName: "Dago (Témoin Marié)", groupName: "amis", phone: "+225 07 44 55 66 77", email: "serge.dago@gmail.com", plusOnesAllowed: 1, plusOnesConfirmed: 1, rsvpStatus: "confirmed", tableNumber: "Table des Témoins", qrCodeToken: "WM-TEM-004", isCheckedIn: false },
        { firstName: "Esther", lastName: "Kouamé (Témoin Mariée)", groupName: "amis", phone: "+225 05 66 77 88 99", email: "esther.k@gmail.com", plusOnesAllowed: 1, plusOnesConfirmed: 1, rsvpStatus: "confirmed", tableNumber: "Table des Témoins", qrCodeToken: "WM-TEM-005", isCheckedIn: false },
        { firstName: "Chorale", lastName: "Grâce Céleste", groupName: "chorale", phone: "+225 07 88 99 00 11", plusOnesAllowed: 15, plusOnesConfirmed: 12, rsvpStatus: "confirmed", tableNumber: "Table Chorale", qrCodeToken: "WM-CHO-006", isCheckedIn: false },
        { firstName: "Marc", lastName: "Boni", groupName: "collegues", phone: "+225 01 99 88 77 66", plusOnesAllowed: 1, plusOnesConfirmed: 0, rsvpStatus: "pending", tableNumber: "Table Entreprise", qrCodeToken: "WM-COL-007", isCheckedIn: false },
        { firstName: "Priscille", lastName: "N'Dri", groupName: "jeunesse", phone: "+225 07 12 34 56 78", plusOnesAllowed: 0, plusOnesConfirmed: 0, rsvpStatus: "confirmed", tableNumber: "Table Jeunesse", qrCodeToken: "WM-JEU-008", isCheckedIn: false },
      ];

      for (const g of guestList) {
        await db.insert(guests).values({
          coupleId,
          ...g,
        });
      }

      // Seed Public Invitation Website
      await db.insert(invitations).values({
        coupleId,
        slug: demoCoupleSlug,
        heroTitle: "Époux & Épouse – Unis par la Grâce de Dieu",
        loveStory: "Notre histoire a débuté au sein du groupe de jeunesse de l'église en 2021. À travers les temps de prière, les partages fraternels et les projets communs, Dieu a révélé Son dessein bienveillant pour nos vies. Aujourd'hui, avec la bénédiction de nos parents et de nos pasteurs, nous nous engageons pour l'éternité !",
        testimony: "« Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu » (Romains 8:28). Malgré les défis, la fidélité de l'Éternel a guidé chaque pas de notre cheminement.",
        weddingDate: "15 Novembre 2025",
        dotDate: "13 Septembre 2025 à 10h00 (Domicile Familial Yao - Cocody)",
        civilDate: "15 Novembre 2025 à 09h30 (Mairie de Cocody)",
        churchDate: "15 Novembre 2025 à 11h30 (Église Évangélique Grâce et Vie)",
        receptionDate: "15 Novembre 2025 à 14h00 (Espace Nuptial Riviera Golf)",
        venueName: "Espace Nuptial Riviera Golf",
        venueAddress: "Boulevard François Mitterrand, Riviera Golf, Abidjan",
        venueMapUrl: "https://maps.google.com/?q=Riviera+Golf+Abidjan",
        heroImageUrl: "https://images.pexels.com/photos/34887758/pexels-photo-34887758.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
        galleryPhotos: [
          "https://images.pexels.com/photos/37828098/pexels-photo-37828098.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=800",
          "https://images.pexels.com/photos/37828100/pexels-photo-37828100.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=800",
          "https://images.pexels.com/photos/17770297/pexels-photo-17770297.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=800",
        ],
        pastorWord: "« Que ce couple soit une maison bâtie sur le roc. Que la lumière de Christ brille à travers leur alliance. » - Pasteur Jean-Marc Kouadio",
        blessingMessage: "Votre présence et vos prières sont notre plus beau cadeau pour sceller ce grand jour.",
        customVerse: "Ecclésiaste 4:12 - La corde à trois fils ne se rompt pas facilement.",
        isPublished: true,
        rsvpDeadline: "31 Octobre 2025",
      });

      // Seed Cagnotte Foyer
      await db.insert(cagnotteContributions).values([
        { coupleId, donorName: "Tante Marie-Paule Kouassi", donorPhone: "+225 07 08 09 10 11", amount: 100000, message: "Que le Seigneur pourvoie abondamment pour votre installation !", paymentReference: "WAVE-CI-7788991" },
        { coupleId, donorName: "Frère Emmanuel & Famille", donorPhone: "+225 05 44 33 22 11", amount: 50000, message: "Félicitations aux futurs mariés ! Que votre foyer soit béni.", paymentReference: "WAVE-CI-8899002" },
        { coupleId, donorName: "Groupe Jeunesse Chrétienne", donorPhone: "+225 01 23 45 67 89", amount: 75000, message: "Nos prières vous accompagnent dans cette magnifique aventure.", paymentReference: "WAVE-CI-9900113" },
      ]);

      // Seed Day J items
      await db.insert(dayJItems).values([
        { coupleId, timeSlot: "06:30 - 08:30", activityTitle: "Mise en beauté de la mariée & Préparation du marié", location: "Résidence Cocody & Riviera", personInCharge: "Esther & Serge", contactPhone: "+225 05 66 77 88 99", orderIndex: 1 },
        { coupleId, timeSlot: "09:00 - 10:30", activityTitle: "Célébration du Mariage Civil", location: "Mairie de Cocody - Salle des Mariages", personInCharge: "Protocole Mairie & Témoins", contactPhone: "+225 07 44 55 66 77", orderIndex: 2 },
        { coupleId, timeSlot: "11:00 - 13:00", activityTitle: "Culte de Bénédiction Nuptiale", location: "Église Évangélique Grâce et Vie", personInCharge: "Pasteur Jean-Marc & Comité d'Ordre", contactPhone: "+225 07 01 02 03 04", orderIndex: 3 },
        { coupleId, timeSlot: "13:15 - 14:15", activityTitle: "Séance Photo Officielle des Mariés & Familles", location: "Jardins de l'Espace Riviera Golf", personInCharge: "Photographe Principal", contactPhone: "+225 01 23 45 67 89", orderIndex: 4 },
        { coupleId, timeSlot: "14:30 - 18:00", activityTitle: "Grande Réception, Banquet & Mur de Bénédictions", location: "Grande Salle Nuptiale Riviera Golf", personInCharge: "Maître de Cérémonie & Traiteur", contactPhone: "+225 07 88 99 00 11", orderIndex: 5 },
      ]);

      // Seed Day J Blessings
      await db.insert(dayJBlessings).values([
        { coupleId, senderName: "Papy Yao & Mémé Yao", senderRelation: "Grands-Parents", blessingText: "Que l'Éternel fasse briller Sa face sur vous et qu'Il vous accorde Sa paix tout au long de votre vie.", isApprovedForScreen: true },
        { coupleId, senderName: "Jeunesse Grâce et Vie", senderRelation: "Amis de Foi", blessingText: "Époux et Épouse, vous êtes une source d'inspiration pour nous tous. Gloire à Dieu pour votre amour pur !", isApprovedForScreen: true },
        { coupleId, senderName: "Famille Bamba", senderRelation: "Voisins et Amis", blessingText: "Plein de bonheur, de prospérité et une abondance de grâces divines sur votre nouveau foyer !", isApprovedForScreen: true },
      ]);

      // Seed Sample Payment Record (Formule Couple 3 000 FCFA)
      await db.insert(payments).values({
        coupleId,
        amount: 3000,
        planType: "couple",
        payerEmail: "Époux@weddingmood.ci",
        payerPartner: "partner1",
        paymentDate: "2025-08-01",
        referenceNumber: "WAVE-M_W9fOyOGfFiNN-20250801",
        status: "verified",
        adminNotes: "Règlement Wave de 3 000 FCFA validé manuellement. Accès actif pour les deux partenaires avec le code WM-2025.",
        reviewedAt: new Date(),
      });
    }
  } catch (err) {
    console.error("Error during database seed:", err);
  }
}

