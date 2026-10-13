export type DocKey = "mentions" | "cgu" | "cgv" | "confidentialite";
export type Section = { title: string; body: string[] };
export type Doc = { title: string; intro: string; sections: Section[] };

export function fill(text: string, vars: Record<string, string>): string | null {
  let drop = false;
  const out = text.replace(/\{\{([A-Z]+)\}\}/g, (_m, k: string) => {
    const v = vars[k] || "";
    if (!v) drop = true;
    return v;
  });
  return drop ? null : out;
}

export const DOCS: Record<DocKey, Doc> = {
  mentions: {
    title: "Mentions légales",
    intro: `Conformément à la réglementation applicable aux services en ligne, voici les informations relatives à l'éditeur et à l'hébergement du site.`,
    sections: [
      {
        title: "Éditeur du site",
        body: [
          `Le site {{SITE}} et le service WeddingMood sont édités par :`,
          `- Dénomination : {{ENTREPRISE}}, entreprise individuelle (personne physique exerçant en nom propre)`,
          `- Exploitant et responsable de la publication : N'CHO CHAWA YVES ACHY`,
          `- Siège : {{ADRESSE}}`,
          `- Registre du commerce et du crédit mobilier (RCCM) : {{RCCM}}`,
          `- Déclaration fiscale d'existence (DFE) : {{DFE}}`,
          `- Activités : commerce général, commerce électronique, prestations numériques, développement web et services informatiques, services événementiels`,
          `- E-mail : {{EMAIL}}`,
          `- Téléphone : {{TEL}}`,
          `- WhatsApp : {{WHATSAPP}}`,
        ],
      },
      {
        title: "Le service WeddingMood",
        body: [
          `WeddingMood est un service en ligne d'aide à l'organisation du mariage : suivi des tâches, budget en francs CFA, gestion des invités, carte d'invitation numérique, planning, espace spirituel, jeux de couple et mise en relation avec des prestataires.`,
        ],
      },
      {
        title: "Hébergement et services techniques",
        body: [
          `- Hébergement du site : Vercel Inc. (États-Unis)`,
          `- Base de données : Supabase (États-Unis), hébergée chez ses fournisseurs d'infrastructure`,
          `- Nom de domaine et messagerie : LWS (France)`,
        ],
      },
      {
        title: "Propriété intellectuelle",
        body: [
          `La marque WeddingMood, le logo, le design, les textes, les images, les logiciels et les bases de données du site sont protégés. Toute reproduction, représentation ou réutilisation, totale ou partielle, sans autorisation écrite de l'éditeur est interdite.`,
        ],
      },
      {
        title: "Responsabilité et liens externes",
        body: [
          `L'éditeur s'efforce de publier des informations exactes et à jour, sans garantir l'absence d'erreur. Le site peut contenir des liens vers des sites tiers (par exemple Wave, WhatsApp ou les pages des prestataires) dont l'éditeur ne contrôle pas le contenu.`,
        ],
      },
      {
        title: "Données personnelles",
        body: [
          `Le traitement des données personnelles est décrit dans la politique de confidentialité. Vous pouvez exercer vos droits en écrivant à {{EMAIL}}.`,
        ],
      },
      {
        title: "Droit applicable",
        body: [
          `Le présent site est soumis au droit ivoirien et, en matière commerciale, aux actes uniformes de l'OHADA. À défaut d'accord amiable, les juridictions ivoiriennes sont compétentes.`,
        ],
      },
    ],
  },

  cgu: {
    title: "Conditions générales d'utilisation",
    intro: `Les présentes conditions générales d'utilisation (CGU) encadrent l'accès et l'utilisation du service WeddingMood, édité par {{ENTREPRISE}}. Elles sont complétées par les conditions générales de vente (CGV), les mentions légales et la politique de confidentialité.`,
    sections: [
      {
        title: "Objet et acceptation",
        body: [
          `WeddingMood est un service en ligne d'aide à l'organisation du mariage : suivi des tâches, budget en francs CFA, gestion des invités, carte d'invitation numérique, planning et calendrier, espace spirituel, jeux de couple et mise en relation avec des prestataires.`,
          `En créant un espace, en se connectant ou en utilisant le service, l'utilisateur déclare avoir lu les présentes CGU et les accepter. Cette acceptation est demandée à la création de l'espace, au moyen d'une case à cocher.`,
        ],
      },
      {
        title: "Accès au service",
        body: [
          `Le service est réservé aux personnes âgées d'au moins 18 ans, capables de s'engager juridiquement.`,
          `L'utilisateur fait son affaire de sa connexion internet et de son appareil. L'éditeur peut faire évoluer les fonctionnalités à tout moment.`,
        ],
      },
      {
        title: "Espace de couple et code d'accès",
        body: [
          `Chaque couple dispose d'un espace partagé, protégé par un code d'accès unique. Chaque partenaire se connecte avec sa propre adresse e-mail et le code du couple.`,
          `L'utilisateur garde son code confidentiel et ne le communique qu'à son partenaire. Toute action réalisée avec ce code est présumée faite par le couple. En cas de perte ou de suspicion d'utilisation frauduleuse, il prévient l'éditeur sans délai pour obtenir un nouveau code.`,
          `Les informations fournies à l'inscription doivent être exactes et tenues à jour.`,
        ],
      },
      {
        title: "Période d'essai et abonnement",
        body: [
          `À l'inscription, le couple bénéficie d'une période d'essai gratuite dont la durée est indiquée sur le site. À la fin de l'essai, la consultation des données reste possible, mais leur modification est suspendue tant qu'un abonnement n'est pas activé. Les modalités de l'abonnement et du paiement figurent dans les CGV.`,
        ],
      },
      {
        title: "Règles d'utilisation",
        body: [
          `L'utilisateur s'engage à utiliser le service de manière loyale et conforme à la loi. Il est notamment interdit de :`,
          `- publier un contenu illicite, diffamatoire, injurieux, discriminatoire ou violent ;`,
          `- usurper l'identité d'une autre personne ou fournir de fausses informations ;`,
          `- tenter d'accéder à des espaces, des données ou des fonctions qui ne lui sont pas destinés ;`,
          `- perturber le fonctionnement du service, l'attaquer ou le copier de manière automatisée ;`,
          `- revendre, sous-licencier ou exploiter commercialement le service sans accord écrit de l'éditeur.`,
        ],
      },
      {
        title: "Contenus de l'utilisateur",
        body: [
          `L'utilisateur reste propriétaire des contenus qu'il enregistre (photos, textes, listes d'invités, messages, budget). Il garantit disposer des droits nécessaires et ne porter atteinte à aucun tiers.`,
          `Il accorde à l'éditeur le droit limité d'héberger, de reproduire et d'afficher ces contenus, uniquement pour fournir le service.`,
          `Lorsque l'utilisateur enregistre les coordonnées de ses invités, il lui appartient de les informer et de s'assurer de leur accord. Il utilise ces informations uniquement pour l'organisation du mariage.`,
          `Un lien d'invitation numérique est accessible à toute personne qui le possède. L'utilisateur ne doit pas y publier d'informations qu'il ne souhaite pas rendre publiques.`,
        ],
      },
      {
        title: "Messagerie, jeux et activités",
        body: [
          `La messagerie du couple est réservée à un usage privé entre partenaires. Les jeux proposés sont des activités de détente : ils ne donnent lieu à aucun gain d'argent et ne modifient pas les données du mariage.`,
        ],
      },
      {
        title: "Prestataires de la marketplace",
        body: [
          `L'éditeur met en relation les couples et des prestataires du mariage (traiteurs, photographes, décorateurs, DJ et autres). Il n'est pas partie aux contrats conclus entre un couple et un prestataire et ne garantit ni leur prix ni leur bonne exécution.`,
          `Les fiches publiées ont fait l'objet d'un contrôle limité aux informations fournies par le prestataire. L'utilisateur est invité à demander un devis et un contrat écrit avant tout engagement.`,
        ],
      },
      {
        title: "Programme ambassadeur",
        body: [
          `Les ambassadeurs sont soumis, en plus des présentes CGU, aux dispositions des CGV qui les concernent.`,
        ],
      },
      {
        title: "Disponibilité du service",
        body: [
          `L'éditeur fait ses meilleurs efforts pour assurer la disponibilité du service, sans garantir un accès ininterrompu. Des interruptions peuvent survenir pour maintenance ou en cas de force majeure. L'utilisateur est invité à conserver une copie des informations essentielles à son mariage.`,
        ],
      },
      {
        title: "Suspension et fin d'accès",
        body: [
          `L'éditeur peut suspendre ou bloquer un espace en cas de manquement aux présentes, de fraude, de paiement contesté ou de demande d'une autorité compétente. L'utilisateur en est informé par tout moyen utile lorsque cela est possible.`,
          `L'utilisateur peut demander la suppression de son espace à tout moment en écrivant à {{EMAIL}}.`,
        ],
      },
      {
        title: "Propriété intellectuelle",
        body: [
          `Le service, sa marque, son design, ses textes, ses logiciels et ses bases de données sont protégés. Toute reproduction ou réutilisation sans autorisation écrite de l'éditeur est interdite.`,
        ],
      },
      {
        title: "Responsabilité",
        body: [
          `Les conseils, modèles et explications fournis par le service sont une aide à l'organisation. Ils ne remplacent ni les démarches officielles (mairie, église, administration) ni les conseils d'un professionnel. Dans les limites permises par la loi, l'éditeur ne répond pas des dommages indirects, ni de l'usage que l'utilisateur fait des informations obtenues.`,
        ],
      },
      {
        title: "Données personnelles",
        body: [
          `Le traitement des données personnelles est décrit dans la politique de confidentialité.`,
        ],
      },
      {
        title: "Modification des CGU",
        body: [
          `L'éditeur peut modifier les présentes CGU. La version en vigueur est celle publiée sur le site avec sa date. La poursuite de l'utilisation après modification vaut acceptation de la nouvelle version, et une nouvelle acceptation peut être demandée.`,
        ],
      },
      {
        title: "Droit applicable et litiges",
        body: [
          `Les présentes CGU sont soumises au droit ivoirien et, en matière commerciale, aux actes uniformes de l'OHADA. En cas de différend, les parties recherchent d'abord une solution amiable. À défaut, les juridictions ivoiriennes sont compétentes.`,
        ],
      },
      {
        title: "Contact",
        body: [
          `{{ENTREPRISE}} : {{EMAIL}}`,
          `WhatsApp : {{WHATSAPP}}`,
        ],
      },
    ],
  },

  cgv: {
    title: "Conditions générales de vente",
    intro: `Les présentes conditions générales de vente (CGV) régissent toute souscription d'un abonnement ou d'un pack payant au service WeddingMood, proposé par {{ENTREPRISE}}.`,
    sections: [
      {
        title: "Vendeur",
        body: [
          `- Dénomination : {{ENTREPRISE}}, entreprise individuelle`,
          `- Exploitant : N'CHO CHAWA YVES ACHY`,
          `- Siège : {{ADRESSE}}`,
          `- RCCM : {{RCCM}}`,
          `- DFE : {{DFE}}`,
          `- E-mail : {{EMAIL}}`,
          `- Téléphone : {{TEL}}`,
          `- WhatsApp : {{WHATSAPP}}`,
        ],
      },
      {
        title: "Champ d'application et acceptation",
        body: [
          `Le client déclare avoir pris connaissance des CGV avant tout paiement et les accepter en cochant la case prévue à cet effet. L'éditeur conserve la date et la version acceptées.`,
        ],
      },
      {
        title: "Services proposés",
        body: [
          `L'éditeur vend un accès payant aux fonctionnalités du service WeddingMood, selon les formules présentées sur la page Abonnement : une formule individuelle (accès d'un seul partenaire) et des formules couple (accès simultané des deux partenaires). Le contenu, le prix et la durée de chaque formule sont ceux affichés sur la page Abonnement au moment de la commande.`,
        ],
      },
      {
        title: "Essai gratuit",
        body: [
          `Chaque nouvel espace bénéficie d'une période d'essai gratuite, sans engagement et sans paiement, dont la durée est indiquée sur le site. À son terme, la consultation reste possible et la modification des données est suspendue jusqu'à l'activation d'un abonnement.`,
        ],
      },
      {
        title: "Prix",
        body: [
          `Les prix sont indiqués en francs CFA (FCFA), toutes taxes applicables comprises le cas échéant. Le prix applicable est celui affiché au moment du paiement. L'éditeur peut modifier ses prix à tout moment, sans effet sur les abonnements déjà payés.`,
        ],
      },
      {
        title: "Commande et paiement",
        body: [
          `Le paiement s'effectue par Wave, vers le compte de l'éditeur, depuis le lien de paiement proposé sur le site.`,
          `Après le paiement, le client déclare son règlement sur le site en indiquant la référence de la transaction et la date, et peut joindre une preuve. Il est responsable de l'exactitude de ces informations.`,
          `D'autres moyens de paiement (Orange Money, MTN Money, Moov Money) pourront être proposés. Tant qu'ils sont signalés comme bientôt disponibles, ils ne peuvent pas être utilisés.`,
        ],
      },
      {
        title: "Validation et activation",
        body: [
          `L'équipe vérifie chaque paiement déclaré. L'abonnement est activé après cette vérification, dans les meilleurs délais. Si la référence est introuvable, si le montant est insuffisant ou si le paiement n'a pas été reçu, l'éditeur peut demander des précisions ou refuser l'activation. Le client est informé par le site ou par WhatsApp.`,
        ],
      },
      {
        title: "Durée de l'abonnement",
        body: [
          `La durée de validité de chaque formule, et son éventuel renouvellement, sont indiqués sur la page Abonnement avant le paiement.`,
        ],
      },
      {
        title: "Rétractation et remboursement",
        body: [
          `Le service numérique est mis à disposition dès la validation du paiement. Le client demande expressément cette exécution immédiate.`,
          `Sous réserve des dispositions légales impératives applicables au consommateur, aucun remboursement n'est dû après l'activation de l'abonnement.`,
          `Un remboursement est effectué, après vérification, en cas de paiement en double, de paiement erroné ou de service non fourni par la faute de l'éditeur. Il est versé par Wave dans un délai raisonnable.`,
        ],
      },
      {
        title: "Prestataires de la marketplace",
        body: [
          `L'éditeur agit comme intermédiaire de mise en relation. Les contrats de prestation sont conclus directement entre le couple et le prestataire, qui en est seul responsable. L'éditeur n'encaisse pas le prix de ces prestations.`,
        ],
      },
      {
        title: "Produits physiques",
        body: [
          `À la date des présentes, aucun produit physique n'est vendu directement par le site. Si des produits (tenues, décorations, faire-part imprimés ou autres) sont proposés, leurs prix, leurs conditions de livraison sur le territoire ivoirien et leurs conditions de retour seront précisés avant toute commande et compléteront les présentes CGV.`,
        ],
      },
      {
        title: "Programme ambassadeur",
        body: [
          `Un ambassadeur est un partenaire indépendant. Il n'est ni salarié, ni mandataire, ni représentant de l'éditeur.`,
          `Il perçoit une commission, au taux indiqué dans son espace ambassadeur, sur chaque abonnement payé par un couple venu avec son lien ou son code, après validation du paiement par l'éditeur. Le solde est versé par mobile money, selon le jour et le seuil minimum communiqués dans son espace.`,
          `Aucune commission n'est due en cas de fraude, d'auto-parrainage, de paiement non validé ou remboursé. L'éditeur peut suspendre un compte ambassadeur en cas de manquement.`,
        ],
      },
      {
        title: "Responsabilité",
        body: [
          `L'éditeur est tenu d'une obligation de moyens. Il n'est pas responsable des retards ou des échecs de paiement imputables à l'opérateur de paiement, au réseau mobile ou à l'utilisateur, ni des cas de force majeure.`,
        ],
      },
      {
        title: "Réclamations",
        body: [
          `Toute réclamation peut être adressée à {{EMAIL}} ou par WhatsApp au {{WHATSAPP}}, avec l'adresse e-mail du compte et la référence du paiement. L'éditeur répond dans un délai raisonnable.`,
        ],
      },
      {
        title: "Données personnelles",
        body: [
          `Les données personnelles sont traitées conformément à la politique de confidentialité.`,
        ],
      },
      {
        title: "Droit applicable et litiges",
        body: [
          `Les présentes CGV sont soumises au droit ivoirien et, en matière commerciale, aux actes uniformes de l'OHADA. En cas de différend, les parties recherchent d'abord une solution amiable. À défaut, les juridictions ivoiriennes sont compétentes.`,
        ],
      },
    ],
  },

  confidentialite: {
    title: "Politique de confidentialité",
    intro: `La présente politique explique comment {{ENTREPRISE}}, éditeur de WeddingMood, collecte et utilise vos données personnelles, conformément à la loi n° 2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel.`,
    sections: [
      {
        title: "Responsable du traitement",
        body: [
          `- {{ENTREPRISE}}, entreprise individuelle, exploitée par N'CHO CHAWA YVES ACHY`,
          `- Siège : {{ADRESSE}}`,
          `- Contact : {{EMAIL}}`,
        ],
      },
      {
        title: "Données collectées",
        body: [
          `- Compte du couple : prénoms et noms des partenaires, adresses e-mail, photos, date et lieu du mariage, ville, nombre d'invités estimé, verset choisi.`,
          `- Organisation du mariage : tâches, budget et dépenses, invités et leurs coordonnées, planning, calendrier, messages entre partenaires, prières et préférences d'affichage.`,
          `- Paiement : formule choisie, montant, date, référence de la transaction Wave, numéro Wave indiqué, preuve de paiement éventuelle. Le site ne conserve aucune donnée bancaire ni code secret : le paiement est traité par Wave.`,
          `- Ambassadeurs et prestataires : nom, ville, photo, numéros de contact et de paiement, texte de présentation.`,
          `- Données techniques : pages consultées, pays, région et ville approximatifs déduits de la connexion, identifiant de session aléatoire. L'adresse IP n'est pas enregistrée par le site.`,
        ],
      },
      {
        title: "Finalités et bases légales",
        body: [
          `- Fournir le service et gérer votre compte (exécution du contrat).`,
          `- Gérer les paiements, les abonnements et les commissions des ambassadeurs (exécution du contrat et obligations légales).`,
          `- Assurer la sécurité du service et prévenir la fraude (intérêt légitime).`,
          `- Mesurer l'audience du site de façon anonyme pour l'améliorer (intérêt légitime).`,
          `- Répondre à vos demandes par e-mail ou WhatsApp (exécution du contrat et intérêt légitime).`,
        ],
      },
      {
        title: "Destinataires",
        body: [
          `- L'équipe de l'éditeur, dans la limite de ce qui est nécessaire à sa mission.`,
          `- Des prestataires techniques : Vercel (hébergement du site et des fichiers) et Supabase (base de données), qui agissent pour le compte de l'éditeur.`,
          `- Wave, pour le traitement des paiements.`,
          `- Les autorités compétentes, sur demande légale.`,
          `Les données ne sont ni vendues ni cédées à des fins publicitaires.`,
        ],
      },
      {
        title: "Transferts hors de Côte d'Ivoire",
        body: [
          `Les prestataires techniques sont établis hors de Côte d'Ivoire : vos données peuvent donc être hébergées et traitées à l'étranger, avec des mesures de sécurité adaptées. L'éditeur s'engage à accomplir auprès de l'ARTCI les formalités exigées par la loi pour ces traitements et ces transferts.`,
        ],
      },
      {
        title: "Durée de conservation",
        body: [
          `Les données du compte sont conservées tant que l'espace est actif, puis supprimées ou anonymisées dans un délai raisonnable après la suppression de l'espace ou la demande de l'utilisateur. Les données de paiement et de facturation sont conservées pendant la durée exigée par les obligations comptables et fiscales. Les données de mesure d'audience sont conservées sous forme non nominative.`,
        ],
      },
      {
        title: "Sécurité",
        body: [
          `Les échanges sont chiffrés par HTTPS, les mots de passe et les codes PIN sont stockés sous forme hachée (non lisible) et l'accès à l'administration est réservé à l'équipe habilitée. Aucun système n'est totalement infaillible : en cas d'incident grave touchant vos données, l'éditeur vous informe et prévient l'autorité compétente selon la loi.`,
        ],
      },
      {
        title: "Cookies et stockage local",
        body: [
          `Le site utilise uniquement des cookies et un stockage local nécessaires à son fonctionnement : maintien de la connexion (couple, ambassadeur, administration), préférences d'affichage, progression du parcours de découverte et acceptation des conditions. Aucun cookie publicitaire ni de suivi par un tiers n'est utilisé.`,
        ],
      },
      {
        title: "Mesure d'audience",
        body: [
          `Le site enregistre de façon anonyme les pages consultées, avec un identifiant de session aléatoire et une localisation approximative (pays, région, ville). Aucun profil individuel n'est constitué. Vous pouvez désactiver cette mesure sur votre appareil en ouvrant l'adresse du site suivie de /?notrack=1.`,
        ],
      },
      {
        title: "Vos droits",
        body: [
          `Vous disposez d'un droit d'accès, de rectification, d'opposition et de suppression de vos données. Pour l'exercer, écrivez à {{EMAIL}} en précisant l'adresse e-mail de votre compte : une réponse vous est apportée dans un délai raisonnable.`,
          `Vous pouvez aussi saisir l'Autorité de régulation des télécommunications/TIC de Côte d'Ivoire (ARTCI), autorité de protection des données personnelles.`,
        ],
      },
      {
        title: "Mineurs",
        body: [`Le service n'est pas destiné aux personnes de moins de 18 ans.`],
      },
      {
        title: "Données de tiers",
        body: [
          `Les couples qui enregistrent les coordonnées de leurs invités ou de leur partenaire sont responsables de cet usage. Ils s'engagent à utiliser ces informations uniquement pour l'organisation du mariage.`,
        ],
      },
      {
        title: "Modification de la politique",
        body: [
          `L'éditeur peut modifier la présente politique. La version en vigueur est celle publiée sur le site avec sa date.`,
        ],
      },
      {
        title: "Contact",
        body: [`{{ENTREPRISE}} : {{EMAIL}}`],
      },
    ],
  },
};