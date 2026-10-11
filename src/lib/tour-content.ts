export type Lesson = { id: string; title: string; text: string; audioSrc: string };
export type Step = {
  id: string;
  title: string;
  body: string;
  lesson: string;
  target?: string[];
  goto?: { label: string; path: string };
  extra?: string[];
  demo?: "budget" | "tasks";
};

const L = (id: string, title: string, text: string): Lesson => ({ id, title, text, audioSrc: "/audio/fr/" + id + ".mp3" });

export const LESSONS: Lesson[] = [
  L("bienvenue", "Bienvenue dans Wedding Mood",
    "Bienvenue dans Wedding Mood. Cette application vous accompagne dans la pr\u00e9paration de votre mariage, de la dot jusqu'au grand jour. Vous y trouvez votre budget, vos t\u00e2ches, vos invit\u00e9s, des prestataires et un espace pour prier ensemble. Vous avancez \u00e0 votre rythme, seul ou avec votre partenaire. Rien n'est obligatoire : explorez ce qui vous int\u00e9resse. Vous pourrez r\u00e9\u00e9couter chaque explication quand vous le voulez."),
  L("tableau-de-bord", "Comprendre le tableau de bord",
    "Le tableau de bord est votre page d'accueil. Il r\u00e9sume l'avancement de votre pr\u00e9paration et vous indique les prochaines actions utiles. Le menu vous permet d'ouvrir chaque rubrique : profil, invit\u00e9s, budget, planning, calendrier, t\u00e2ches et jeux. Sur t\u00e9l\u00e9phone, le menu s'ouvre avec le bouton situ\u00e9 en haut de l'\u00e9cran. Revenez ici quand vous voulez faire le point."),
  L("espace-couple", "Cr\u00e9er son espace de couple",
    "Votre espace de couple est cr\u00e9\u00e9 d\u00e8s l'inscription. Il est prot\u00e9g\u00e9 par un code d'acc\u00e8s unique que vous avez re\u00e7u \u00e0 ce moment-l\u00e0. Gardez-le pr\u00e9cieusement. Dans la rubrique Profil, ajoutez seulement l'essentiel : vos pr\u00e9noms, une photo, la date pr\u00e9vue, la ville et un verset qui vous tient \u00e0 c\u0153ur. Rien d'autre n'est demand\u00e9. Vous pouvez compl\u00e9ter le reste plus tard."),
  L("inviter-partenaire", "Inviter son partenaire",
    "Wedding Mood se vit \u00e0 deux. Chaque partenaire se connecte avec sa propre adresse e-mail et avec le m\u00eame code d'acc\u00e8s unique du couple. Pour inviter votre partenaire, v\u00e9rifiez que son adresse e-mail est bien enregistr\u00e9e dans votre espace, puis transmettez-lui le code vous-m\u00eame, par exemple sur WhatsApp. Il ou elle ouvre le site, saisit son e-mail et le code, et rejoint votre espace partag\u00e9. Aucune invitation n'est envoy\u00e9e automatiquement. Ne partagez ce code qu'avec votre partenaire."),
  L("dot", "Organiser la dot",
    "La dot est une \u00e9tape importante dans de nombreuses traditions. Dans les rubriques T\u00e2ches et Planning, regroupez ce qui la concerne : la liste demand\u00e9e par la famille, le budget pr\u00e9vu, la date et les personnes \u00e0 contacter. D\u00e9coupez en petites t\u00e2ches et partagez-les entre vous deux. Chaque famille a ses coutumes : adaptez toujours l'organisation \u00e0 la v\u00f4tre."),
  L("mariage-civil", "Pr\u00e9parer le mariage civil",
    "Le mariage civil se pr\u00e9pare avec les documents demand\u00e9s par la mairie. Notez dans vos t\u00e2ches chaque pi\u00e8ce \u00e0 r\u00e9unir, la personne qui s'en occupe et la date limite. Ajoutez la date de la c\u00e9r\u00e9monie \u00e0 votre calendrier pour avoir un rep\u00e8re clair. Renseignez-vous toujours aupr\u00e8s de votre mairie : les pi\u00e8ces demand\u00e9es peuvent changer d'une commune \u00e0 l'autre."),
  L("benediction", "Organiser la b\u00e9n\u00e9diction nuptiale",
    "La b\u00e9n\u00e9diction nuptiale est le moment o\u00f9 vous placez votre union devant Dieu. Pr\u00e9parez-la avec votre pasteur ou votre responsable d'\u00e9glise : la date, les rencontres de pr\u00e9paration et le d\u00e9roulement de la c\u00e9r\u00e9monie. Ajoutez ces points \u00e0 vos t\u00e2ches et \u00e0 votre planning. Wedding Mood est ouvert \u00e0 toutes les confessions chr\u00e9tiennes : organisez cette \u00e9tape selon les habitudes de votre \u00e9glise."),
  L("budget", "G\u00e9rer son budget en FCFA",
    "La rubrique Budget vous aide \u00e0 suivre vos d\u00e9penses en francs CFA. Vous fixez votre budget total, puis vous ajoutez chaque d\u00e9pense avec son montant et la part d\u00e9j\u00e0 pay\u00e9e. L'application calcule ce qu'il vous reste. Parlez-en avec votre partenaire avant de d\u00e9cider. Vous seul choisissez ce que vous enregistrez : rien n'est ajout\u00e9 \u00e0 votre place."),
  L("taches", "R\u00e9partir les t\u00e2ches",
    "La rubrique T\u00e2ches sert \u00e0 organiser le travail \u00e0 deux. Cr\u00e9ez une t\u00e2che avec un nom clair, puis r\u00e9partissez le travail avec votre partenaire. Quand elle est faite, marquez-la comme termin\u00e9e : votre progression avance. Commencez par les grandes \u00e9tapes, comme la dot, la mairie, l'\u00e9glise et la salle, puis d\u00e9coupez-les en petites actions. Votre partenaire voit les m\u00eames t\u00e2ches que vous."),
  L("spirituel", "L'espace spirituel et la pri\u00e8re",
    "L'espace spirituel vous aide \u00e0 garder la foi au centre de votre projet. Vous y trouvez des d\u00e9votions, des th\u00e8mes d'\u00e9dification et un journal de pri\u00e8re. Prenez quelques minutes ensemble, quand cela vous convient. Aucune pratique n'est impos\u00e9e : chacun avance \u00e0 son rythme et selon sa confession chr\u00e9tienne."),
  L("jeux", "Les jeux et activit\u00e9s du couple",
    "La rubrique Jeux propose des activit\u00e9s \u00e0 partager en couple, comme le Ludo, l'Awal\u00e9, les Dames et le D\u00e9fi des mots. C'est un moment de d\u00e9tente pour mieux vous conna\u00eetre et rire ensemble. Jouer ne modifie pas les donn\u00e9es de votre mariage."),
  L("invites", "Invit\u00e9s et invitations",
    "Dans la rubrique Invit\u00e9s, vous ajoutez vos invit\u00e9s et suivez leurs r\u00e9ponses. La carte d'invitation num\u00e9rique vous permet de cr\u00e9er un faire-part avec votre photo, de choisir un style et de partager le lien sur WhatsApp. Vos invit\u00e9s peuvent confirmer leur pr\u00e9sence depuis ce lien. Vous gardez le contr\u00f4le : rien n'est envoy\u00e9 sans votre action."),
  L("prestataires", "D\u00e9couvrir les prestataires",
    "La rubrique Prestataires vous aide \u00e0 trouver des professionnels du mariage : traiteur, d\u00e9corateur, photographe et d'autres. Vous pouvez les contacter directement sur WhatsApp depuis leur fiche. Seules les fiches valid\u00e9es par l'\u00e9quipe Wedding Mood sont visibles. Comparez, posez vos questions, puis d\u00e9cidez avec votre partenaire."),
  L("paiement", "Formules et paiement",
    "Au d\u00e9part, vous profitez d'une p\u00e9riode d'essai gratuite. Ensuite, vous choisissez la formule qui vous convient, pour un seul partenaire ou pour le couple. Les prix sont affich\u00e9s sur la page Abonnement. Le paiement se fait par Wave. Apr\u00e8s avoir pay\u00e9, vous revenez sur le site, vous saisissez la r\u00e9f\u00e9rence de la transaction, puis l'\u00e9quipe v\u00e9rifie et active votre acc\u00e8s. D'autres moyens de paiement arriveront bient\u00f4t."),
  L("assistance", "Contacter l'assistance",
    "Une question, un blocage ? L'\u00e9quipe Wedding Mood vous r\u00e9pond sur WhatsApp. Utilisez le bouton WhatsApp du site ou celui de la page Abonnement. D\u00e9crivez simplement votre probl\u00e8me et indiquez l'adresse e-mail de votre compte. Ne partagez pas votre code d'acc\u00e8s publiquement."),
];

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export const STEPS: Step[] = [
  {
    id: "bienvenue", title: "Bienvenue dans Wedding Mood",
    body: "Cette visite dure environ trois minutes. Vous pouvez la fermer \u00e0 tout moment et la reprendre plus tard avec le bouton d'aide.",
    lesson: "bienvenue",
  },
  {
    id: "tableau", title: "Votre tableau de bord",
    body: "C'est votre page d'accueil : elle r\u00e9sume votre avancement et le menu vous m\u00e8ne vers chaque rubrique.",
    lesson: "tableau-de-bord", target: ["main h1", "main"],
  },
  {
    id: "profil", title: "Votre profil",
    body: "Ajoutez seulement l'essentiel : pr\u00e9noms, date pr\u00e9vue et ville. Le reste peut attendre.",
    lesson: "espace-couple", target: ['a[href="/dashboard/profile"]'],
    goto: { label: "Ouvrir mon profil", path: "/dashboard/profile" },
  },
  {
    id: "preparation", title: "Pr\u00e9parer le mariage",
    body: "Les t\u00e2ches, le planning et le calendrier regroupent la dot, la mairie, la b\u00e9n\u00e9diction, les prestataires et les invitations.",
    lesson: "taches", target: ['a[href="/dashboard/tasks"]'], extra: ["dot", "mariage-civil", "benediction"],
    goto: { label: "Ouvrir mes t\u00e2ches", path: "/dashboard/tasks" }, demo: "tasks",
  },
  {
    id: "budget", title: "Votre budget en FCFA",
    body: "Suivez vos d\u00e9penses et ce qu'il vous reste. Rien n'est enregistr\u00e9 sans votre action.",
    lesson: "budget", target: ['a[href="/dashboard/budget"]'],
    goto: { label: "Ouvrir mon budget", path: "/dashboard/budget" }, demo: "budget",
  },
  {
    id: "partenaire", title: "Inviter votre partenaire",
    body: "Votre partenaire se connecte avec son propre e-mail et le code d'acc\u00e8s unique du couple. Rien n'est envoy\u00e9 automatiquement : c'est vous qui lui transmettez le code.",
    lesson: "inviter-partenaire", target: ['a[href="/dashboard/notre-mariage"]', 'a[href="/dashboard/profile"]'],
  },
  {
    id: "spirituel", title: "L'espace spirituel",
    body: "D\u00e9votions, pri\u00e8re et ressources pour garder la foi au centre de votre projet, sans rien imposer.",
    lesson: "spirituel", target: ['a[href="/dashboard/devotions"]', 'a[href="/dashboard/prayers"]'],
    goto: { label: "Ouvrir l'espace spirituel", path: "/dashboard/devotions" },
  },
  {
    id: "activites", title: "Jeux, invit\u00e9s et prestataires",
    body: "Des jeux \u00e0 deux, la gestion de vos invit\u00e9s et des professionnels \u00e0 contacter. Certaines rubriques d\u00e9pendent de votre formule.",
    lesson: "jeux", target: ['a[href="/dashboard/jeux"]'], extra: ["invites", "prestataires"],
    goto: { label: "Ouvrir les jeux", path: "/dashboard/jeux" },
  },
  {
    id: "fin", title: "Vous connaissez les bases",
    body: "Bravo ! Vous connaissez maintenant les bases de Wedding Mood. Vous pouvez commencer \u00e0 organiser votre mariage \u00e0 votre rythme.",
    lesson: "assistance", extra: ["paiement"],
  },
];