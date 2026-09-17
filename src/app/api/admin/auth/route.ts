import { cookies } from "next/headers";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { eq } from "drizzle-orm";
import { seedDatabaseIfEmpty, hashPassword } from "@/lib/seed";

export async function GET() {
  await seedDatabaseIfEmpty();
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("wm_admin_session")?.value;

  if (!adminToken) {
    return Response.json({ authenticated: false }, { status: 401 });
  }

  try {
    const decoded = JSON.parse(Buffer.from(adminToken, "base64").toString("utf8"));
    const [admin] = await db.select().from(admins).where(eq(admins.id, decoded.adminId)).limit(1);
    if (!admin) {
      return Response.json({ authenticated: false }, { status: 401 });
    }
    const { passwordHash: _, ...safeAdmin } = admin;
    return Response.json({ authenticated: true, admin: safeAdmin });
  } catch {
    return Response.json({ authenticated: false }, { status: 401 });
  }
}

export async function POST(req: Request) {
  await seedDatabaseIfEmpty();
  const body = await req.json();
  const { action, email, password } = body;
  const cookieStore = await cookies();

  if (action === "logout") {
    cookieStore.delete("wm_admin_session");
    return Response.json({ success: true, message: "Déconnexion admin réussie" });
  }

  if (!email || !password) {
    return Response.json({ success: false, message: "Email et mot de passe requis." }, { status: 400 });
  }

  const hashed = hashPassword(password);
  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.email, email.trim().toLowerCase()))
    .limit(1);

  if (!admin || admin.passwordHash !== hashed) {
    return Response.json({ success: false, message: "Identifiants administrateur incorrects." }, { status: 401 });
  }

  const payload = Buffer.from(JSON.stringify({ adminId: admin.id, role: admin.role })).toString("base64");
  cookieStore.set("wm_admin_session", payload, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });

  const { passwordHash: _, ...safeAdmin } = admin;
  return Response.json({
    success: true,
    message: "Authentification Administrateur réussie",
    admin: safeAdmin,
  });
}

export async function PATCH(req: Request) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("wm_admin_session")?.value;
  if (!adminToken) {
    return Response.json({ success: false, message: "Session administrateur requise." }, { status: 401 });
  }

  let adminId: number | null = null;
  try {
    const decoded = JSON.parse(Buffer.from(adminToken, "base64").toString("utf8"));
    adminId = decoded.adminId;
  } catch {
    return Response.json({ success: false, message: "Session invalide." }, { status: 401 });
  }

  const body = await req.json();
  const { currentPassword, newPassword, name } = body;

  const [admin] = await db.select().from(admins).where(eq(admins.id, Number(adminId))).limit(1);
  if (!admin) {
    return Response.json({ success: false, message: "Administrateur introuvable." }, { status: 404 });
  }

  if (newPassword) {
    if (!currentPassword || admin.passwordHash !== hashPassword(currentPassword)) {
      return Response.json({ success: false, message: "Mot de passe actuel incorrect." }, { status: 401 });
    }
    if (String(newPassword).length < 8) {
      return Response.json({ success: false, message: "Le nouveau mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
    }
  }

  const [updated] = await db
    .update(admins)
    .set({
      ...(newPassword ? { passwordHash: hashPassword(newPassword) } : {}),
      ...(name ? { name: String(name).slice(0, 100) } : {}),
    })
    .where(eq(admins.id, Number(adminId)))
    .returning();

  const { passwordHash: _, ...safeAdmin } = updated;
  return Response.json({ success: true, message: "Paramètres administrateur mis à jour.", admin: safeAdmin });
}
