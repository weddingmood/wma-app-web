import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { verifyToken } from "@/lib/session-token";
import { makeHash, checkHash } from "@/lib/admin-hash";
import { loginLockMinutes, recordLoginFailure, clearLoginFailures } from "@/lib/login-guard";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PW = 10;
const bad = (message: string, status = 400) => Response.json({ success: false, message }, { status });
const noSession = () => bad("Session administrateur requise.", 401);
const superOnly = () => bad("R\u00e9serv\u00e9 au super administrateur.", 403);
const tooShort = () => bad("Mot de passe trop court (" + MIN_PW + " caract\u00e8res minimum).");

async function currentAdmin() {
  const token = (await cookies()).get("wm_admin_session")?.value;
  if (!token) return null;
  const d = verifyToken<{ adminId: number }>(token, "admin");
  if (!d || !d.adminId) return null;
  const [a] = await db.select().from(admins).where(eq(admins.id, Number(d.adminId))).limit(1);
  return a ?? null;
}

const isSuper = (a: { role: string | null }) => a.role === "superadmin";

export async function GET() {
  const me = await currentAdmin();
  if (!me) return noSession();
  const list = isSuper(me) ? await db.select().from(admins) : [];
  return Response.json({
    success: true,
    me: { id: me.id, email: me.email, name: me.name, role: me.role },
    admins: list
      .map((a) => ({ id: a.id, email: a.email, name: a.name, role: a.role, createdAt: a.createdAt ? new Date(a.createdAt as unknown as string).toISOString() : null }))
      .sort((x, y) => x.id - y.id),
  });
}

export async function POST(req: Request) {
  const me = await currentAdmin();
  if (!me) return noSession();
  if (!isSuper(me)) return superOnly();
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = String(b.email || "").trim().toLowerCase();
  const name = String(b.name || "").trim().slice(0, 80);
  const password = String(b.password || "");
  const role = b.role === "superadmin" ? "superadmin" : "admin";
  if (!EMAIL.test(email)) return bad("Adresse e-mail invalide.");
  if (name.length < 2) return bad("Le nom est obligatoire.");
  if (password.length < MIN_PW) return tooShort();
  const [dup] = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
  if (dup) return bad("Cette adresse est d\u00e9j\u00e0 utilis\u00e9e par un administrateur.", 409);
  try {
    const row = { email, name, role, passwordHash: makeHash(password) } as typeof admins.$inferInsert;
    await db.insert(admins).values(row);
    return Response.json({ success: true });
  } catch (e) {
    console.error("Creation administrateur:", e);
    return bad("Erreur serveur", 500);
  }
}

export async function PATCH(req: Request) {
  const me = await currentAdmin();
  if (!me) return noSession();
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(b.action || "");

  try {
    if (action === "update-self") {
      const key = "adminpw:" + me.id;
      const wait = await loginLockMinutes(key);
      if (wait > 0) return bad("Trop d'essais. R\u00e9essayez dans " + wait + " minutes.", 429);
      if (!checkHash(String(b.currentPassword || ""), me.passwordHash)) {
        await recordLoginFailure(key, 60);
        return bad("Mot de passe actuel incorrect.", 401);
      }
      await clearLoginFailures(key);

      const patch: { email?: string; name?: string; passwordHash?: string } = {};
      if (typeof b.newEmail === "string" && b.newEmail.trim()) {
        const e = b.newEmail.trim().toLowerCase();
        if (!EMAIL.test(e)) return bad("Adresse e-mail invalide.");
        if (e !== me.email) {
          const [dup] = await db.select().from(admins).where(eq(admins.email, e)).limit(1);
          if (dup) return bad("Cette adresse est d\u00e9j\u00e0 utilis\u00e9e.", 409);
          patch.email = e;
        }
      }
      if (typeof b.name === "string" && b.name.trim()) patch.name = b.name.trim().slice(0, 80);
      if (typeof b.newPassword === "string" && b.newPassword) {
        if (b.newPassword.length < MIN_PW) return tooShort();
        patch.passwordHash = makeHash(b.newPassword);
      }
      if (Object.keys(patch).length === 0) return bad("Aucune modification \u00e0 enregistrer.");
      await db.update(admins).set(patch).where(eq(admins.id, me.id));
      return Response.json({ success: true });
    }

    if (action === "reset-password") {
      if (!isSuper(me)) return superOnly();
      const id = Number(b.id);
      if (!Number.isInteger(id)) return bad("Identifiant invalide.");
      if (id === me.id) return bad("Utilisez la section Mon compte pour changer votre propre mot de passe.");
      const pw = String(b.newPassword || "");
      if (pw.length < MIN_PW) return tooShort();
      const [t] = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
      if (!t) return bad("Administrateur introuvable.", 404);
      await db.update(admins).set({ passwordHash: makeHash(pw) }).where(eq(admins.id, id));
      await clearLoginFailures("admin:" + String(t.email).toLowerCase());
      return Response.json({ success: true });
    }

    return bad("Action inconnue.");
  } catch (e) {
    console.error("Modification administrateur:", e);
    return bad("Erreur serveur", 500);
  }
}

export async function DELETE(req: Request) {
  const me = await currentAdmin();
  if (!me) return noSession();
  if (!isSuper(me)) return superOnly();
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return bad("Identifiant invalide.");
  if (id === me.id) return bad("Vous ne pouvez pas supprimer votre propre compte.");
  const [t] = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
  if (!t) return bad("Administrateur introuvable.", 404);
  try {
    await db.delete(admins).where(eq(admins.id, id));
    return Response.json({ success: true });
  } catch {
    return bad("Suppression impossible : ce compte a des actions dans le journal. Changez plut\u00f4t son mot de passe.", 409);
  }
}