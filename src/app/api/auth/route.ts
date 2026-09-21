import { cookies } from "next/headers";
import { signToken, verifyToken } from "@/lib/session-token";
import { db } from "@/db";
import { couples, couplePreferences, coupleCommandments } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { seedDatabaseIfEmpty, hashPassword } from "@/lib/seed";
import { DEFAULT_COMMANDMENTS } from "@/lib/constants";

// Génère un code d'accès unique simple et mémorisable (Ex: WM-4821)
async function generateUniqueAccessCode(): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const candidate = `WM-${Math.floor(1000 + Math.random() * 9000)}`;
    const [existing] = await db
      .select()
      .from(couples)
      .where(eq(couples.accessCode, candidate))
      .limit(1);
    if (!existing) return candidate;
  }
  return `WM-${Date.now().toString().slice(-6)}`;
}

export async function GET() {
  // seedDatabaseIfEmpty() désactivé sur POST pour éviter timeout 504
  const cookieStore = await cookies();
  const decoded = verifyToken<{ coupleId: number; activePartner?: string }>(
    cookieStore.get("wm_session")?.value,
    "couple"
  );

  // Plus de couple par défaut : sans session valide, rien n'est renvoyé.
  if (!decoded?.coupleId) {
    return Response.json({ success: false, message: "Non connecté" }, { status: 401 });
  }

  const activePartner: "partner1" | "partner2" =
    decoded.activePartner === "partner2" ? "partner2" : "partner1";

  const [couple] = await db.select().from(couples).where(eq(couples.id, decoded.coupleId)).limit(1);
  if (!couple) {
    return Response.json({ success: false, message: "Session invalide" }, { status: 401 });
  }

  let [prefs] = await db.select().from(couplePreferences).where(eq(couplePreferences.coupleId, couple.id)).limit(1);
  if (!prefs) {
    const [newPref] = await db.insert(couplePreferences).values({ coupleId: couple.id }).returning();
    prefs = newPref;
  }

  const { passwordHash: _, ...safeCouple } = couple;

  return Response.json({
    success: true,
    couple: safeCouple,
    preferences: prefs,
    activePartner,
    partnerName: activePartner === "partner2" ? couple.partner2Name : couple.partner1Name,
  });
}

export async function POST(req: Request) {
  // seedDatabaseIfEmpty() désactivé sur POST pour éviter timeout 504
  const body = await req.json();
  const { action } = body;
  const cookieStore = await cookies();

  // ============================================================
  // CONNEXION : par email personnel + code d'accès unique du couple
  // ============================================================
  if (action === "login") {
    const { identifier, password, accessCode, selectedPartner } = body;

    if (!identifier) {
      return Response.json(
        { success: false, message: "Veuillez saisir votre adresse email." },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    const [couple] = await db
      .select()
      .from(couples)
      .where(
        or(
          eq(couples.slug, cleanIdentifier),
          eq(couples.partner1Email, cleanIdentifier),
          eq(couples.partner2Email, cleanIdentifier)
        )
      )
      .limit(1);

    if (!couple) {
      return Response.json(
        { success: false, message: "Aucun espace ne correspond à cette adresse email." },
        { status: 401 }
      );
    }

    // Authentification par code d'accès unique OU par mot de passe
    const cleanCode = accessCode ? accessCode.trim().toUpperCase() : "";
    const codeMatches = cleanCode && couple.accessCode && couple.accessCode.toUpperCase() === cleanCode;
    const passwordMatches = password && couple.passwordHash === hashPassword(password);

    if (!codeMatches && !passwordMatches) {
      return Response.json(
        {
          success: false,
          message: "Code d'accès ou mot de passe incorrect. Vérifiez le code unique reçu lors de votre inscription.",
        },
        { status: 401 }
      );
    }

    if (couple.status === "blocked" || couple.status === "suspended") {
      return Response.json(
        {
          success: false,
          message: `Votre compte est actuellement ${couple.status === "blocked" ? "bloqué" : "suspendu"}. Veuillez contacter l'assistance WhatsApp.`,
        },
        { status: 403 }
      );
    }

    // Détection automatique du partenaire à partir de l'email saisi
    let partner: "partner1" | "partner2" = "partner1";
    if (couple.partner2Email && couple.partner2Email.toLowerCase() === cleanIdentifier) {
      partner = "partner2";
    } else if (couple.partner1Email.toLowerCase() === cleanIdentifier) {
      partner = "partner1";
    } else if (selectedPartner === "partner2") {
      partner = "partner2";
    }

    // Formule Individuelle : seul le partenaire principal dispose d'un accès actif
    if (couple.planType === "individual" && partner === "partner2" && !couple.partner2AccessActive) {
      return Response.json(
        {
          success: false,
          message:
            "La Formule Individuelle ouvre l'accès à un seul partenaire. Passez à la Formule Couple (3 000 FCFA) pour connecter les deux conjoints.",
        },
        { status: 403 }
      );
    }

    const sessionPayload = signToken(
      { typ: "couple", coupleId: couple.id, coupleSlug: couple.slug, activePartner: partner },
      60 * 60 * 24 * 30
    );

    cookieStore.set("wm_session", sessionPayload, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });

    return Response.json({
      success: true,
      message: `Bienvenue ${partner === "partner1" ? couple.partner1Name : couple.partner2Name} !`,
      couple: {
        id: couple.id,
        slug: couple.slug,
        partner1Name: couple.partner1Name,
        partner2Name: couple.partner2Name,
        accessCode: couple.accessCode,
        planType: couple.planType,
      },
      activePartner: partner,
    });
  }

  // ============================================================
  // INSCRIPTION : création de l'espace et du code d'accès unique
  // ============================================================
  if (action === "register") {
    const {
      partner1Name,
      partner2Name,
      partner1Email,
      partner2Email,
      partner1Role,
      partner2Role,
      weddingDate,
      city,
      venue,
      totalBudget,
      estimatedGuests,
      ceremonyTypes,
      church,
      pastorName,
      ethnicity,
      traditions,
      bibleVerse,
      password,
      planType,
    } = body;

    if (!partner1Name || !partner2Name || !partner1Email) {
      return Response.json(
        { success: false, message: "Les prénoms des deux partenaires et l'email principal sont obligatoires." },
        { status: 400 }
      );
    }

    const cleanP1Email = partner1Email.trim().toLowerCase();
    const cleanP2Email = partner2Email ? partner2Email.trim().toLowerCase() : null;

    // Vérification d'unicité des emails
    const [emailExists] = await db
      .select()
      .from(couples)
      .where(or(eq(couples.partner1Email, cleanP1Email), eq(couples.partner2Email, cleanP1Email)))
      .limit(1);

    if (emailExists) {
      return Response.json(
        { success: false, message: "Cette adresse email est déjà rattachée à un espace Wedding Mood." },
        { status: 409 }
      );
    }

    const cleanP1 = partner1Name.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanP2 = partner2Name.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    let baseSlug = `${cleanP1}-${cleanP2}`;
    if (!baseSlug || baseSlug === "-") baseSlug = `couple-${Date.now().toString().slice(-4)}`;

    let uniqueSlug = baseSlug;
    let counter = 1;
    while (true) {
      const [existing] = await db.select().from(couples).where(eq(couples.slug, uniqueSlug)).limit(1);
      if (!existing) break;
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 3);

    // Génération automatique du code d'accès unique et simple
    const accessCode = await generateUniqueAccessCode();

    const resolvedPlan = planType === "individual" ? "individual" : "couple";
    const resolvedAmount = resolvedPlan === "individual" ? 2000 : 3000;

    const [newCouple] = await db
      .insert(couples)
      .values({
        slug: uniqueSlug,
        partner1Name,
        partner2Name,
        partner1Email: cleanP1Email,
        partner2Email: cleanP2Email,
        partner1Role: partner1Role || "groom",
        partner2Role: partner2Role || "bride",
        weddingDate: weddingDate || "2025-12-20",
        city: city || "Abidjan",
        venue: venue || "",
        totalBudget: Number(totalBudget) || 5000000,
        estimatedGuests: Number(estimatedGuests) || 200,
        ceremonyTypes: ceremonyTypes || ["dot", "civil", "benediction", "reception"],
        church: church || "",
        pastorName: pastorName || "",
        ethnicity: ethnicity || "",
        traditions: traditions || "",
        bibleVerse: bibleVerse || "Ecclésiaste 4:12 - La corde à trois fils ne se rompt pas facilement.",
        status: "trial",
        trialEndsAt,
        passwordHash: hashPassword(password || accessCode),
        accessCode,
        planType: resolvedPlan,
        planAmount: resolvedAmount,
        partner1AccessActive: true,
        partner2AccessActive: resolvedPlan === "couple",
      })
      .returning();

    await db.insert(couplePreferences).values({
      coupleId: newCouple.id,
      themeId: 1,
      fontFamily: "cormorant",
      displayMode: "standard",
    });

    for (const cmd of DEFAULT_COMMANDMENTS) {
      await db.insert(coupleCommandments).values({
        coupleId: newCouple.id,
        orderIndex: cmd.id,
        text: cmd.text,
        importanceWhy: cmd.importanceWhy,
        commitmentText: cmd.commitmentText,
        partner1Confirmed: true,
        partner2Confirmed: false,
      });
    }

    const sessionPayload = signToken(
      { typ: "couple", coupleId: newCouple.id, coupleSlug: newCouple.slug, activePartner: "partner1" },
      60 * 60 * 24 * 30
    );

    cookieStore.set("wm_session", sessionPayload, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });

    const { passwordHash: _, ...safeCouple } = newCouple;

    return Response.json({
      success: true,
      message: `Votre espace est créé avec une période d'essai de 3 jours. Votre code d'accès unique est ${accessCode}.`,
      accessCode,
      couple: safeCouple,
    });
  }

  // ============================================================
  // BASCULE DE PARTENAIRE ACTIF
  // ============================================================
  if (action === "switch-partner") {
    const { partner } = body;
    const sessionToken = cookieStore.get("wm_session")?.value;
    if (!sessionToken) {
      return Response.json({ success: false, message: "Non connecté" }, { status: 401 });
    }

    const decoded = verifyToken<{ coupleId: number; coupleSlug?: string; activePartner?: string }>(
      sessionToken,
      "couple"
    );
    if (!decoded) {
      return Response.json({ success: false, message: "Session invalide" }, { status: 401 });
    }
    decoded.activePartner = partner === "partner2" ? "partner2" : "partner1";

    const newPayload = signToken(
      {
        typ: "couple",
        coupleId: decoded.coupleId,
        coupleSlug: decoded.coupleSlug,
        activePartner: decoded.activePartner,
      },
      60 * 60 * 24 * 30
    );
    cookieStore.set("wm_session", newPayload, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });

    return Response.json({ success: true, activePartner: decoded.activePartner });
  }

  // ============================================================
  // RÉCUPÉRATION DU CODE D'ACCÈS PAR EMAIL
  // ============================================================
  if (action === "recover-code") {
    const { email } = body;
    if (!email) {
      return Response.json({ success: false, message: "Adresse email requise." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [couple] = await db
      .select()
      .from(couples)
      .where(or(eq(couples.partner1Email, cleanEmail), eq(couples.partner2Email, cleanEmail)))
      .limit(1);

    if (!couple) {
      return Response.json(
        { success: false, message: "Aucun espace n'est rattaché à cette adresse email." },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: `Le code d'accès de l'espace de ${couple.partner1Name} et ${couple.partner2Name} est : ${couple.accessCode}`,
      accessCode: couple.accessCode,
      coupleNames: `${couple.partner1Name} & ${couple.partner2Name}`,
    });
  }

  if (action === "logout") {
    cookieStore.delete("wm_session");
    return Response.json({ success: true, message: "Déconnexion réussie" });
  }

  return Response.json({ success: false, message: "Action invalide" }, { status: 400 });
}


