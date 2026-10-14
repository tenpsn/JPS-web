"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_LANG_COOKIE } from "@/admin/i18n";
import { hashPassword, verifyPassword } from "@/server/password";
import { getCurrentUser, startSession } from "@/server/auth";
import { clientIp, tryAttempt } from "@/server/limiter";
import { DEV_PASSWORD } from "@/server/seed";
import { SESSION_COOKIE } from "@/server/session";
import { mutate, nowStr, readDb } from "@/server/store";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type LoginState = { errors?: { email?: "errEmail" | "errCred"; pw?: "errPw" }; email?: string } | undefined;

// จำนวนครั้งที่ใส่ผิดได้ใน 15 นาที ล็อกตามอีเมลคู่กับเครื่องที่ส่งมา คนอื่นจึงล็อกบัญชีของเราจากเครื่องตัวเองไม่ได้
// รวมทุกเครื่องต่ออีเมลมีเพดานสูงไว้อีกชั้น กันการเดาจากหลายเครื่องพร้อมกัน
const LIMIT = { pair: 5, ip: 30, email: 100 };

// ใช้ตรวจรหัสผ่านเมื่อไม่พบอีเมล ให้ใช้เวลาเท่ากับกรณีพบ จะได้เดาไม่ได้ว่าอีเมลไหนมีบัญชี
let dummyHash: string | undefined;

export async function login(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase().slice(0, 160);
  const pw = String(fd.get("pw") ?? "").slice(0, 200);
  const remember = fd.get("remember") === "on";

  const errors: NonNullable<LoginState>["errors"] = {};
  if (!EMAIL.test(email)) errors.email = "errEmail";
  if (pw.length < 6) errors.pw = "errPw";
  if (errors.email || errors.pw) return { errors, email };

  const ip = await clientIp();
  const undo = tryAttempt({ [`p:${email}|${ip}`]: LIMIT.pair, [`i:${ip}`]: LIMIT.ip, [`e:${email}`]: LIMIT.email });
  if (!undo) return { errors: { email: "errCred" }, email };

  const user = (await readDb()).users.find((u) => u.email.toLowerCase() === email);
  dummyHash ??= hashPassword("not-a-real-password-1");
  const pwOk = verifyPassword(pw, user?.passwordHash ?? dummyHash) && !!user?.passwordHash;
  // เว็บจริงไม่รับรหัสผ่านของผู้ใช้ตัวอย่าง แม้ฐานข้อมูลถูกสร้างตอนพัฒนาแล้วนำมาใช้ต่อ
  const demoPw = process.env.NODE_ENV === "production" && pw === DEV_PASSWORD;
  const ok = !!user && user.status === "active" && pwOk && !demoPw;
  // แสดงข้อความเดียวกันทั้งกรณีไม่พบอีเมล รหัสผ่านผิด และบัญชีถูกระงับ
  if (!ok || !user) return { errors: { email: "errCred" }, email };
  undo();

  await startSession(user.id, user.sessionVer ?? 0, remember);
  await mutate((db) => {
    const u = db.users.find((x) => x.id === user.id);
    if (u) u.lastActive = nowStr();
  });
  redirect("/admin");
}

/** ออกจากระบบ และทำให้คุกกี้เดิมทุกเครื่องของผู้ใช้นี้ใช้ไม่ได้ทันที แม้มีคนแอบคัดลอกคุกกี้ไปแล้ว */
export async function logout() {
  const me = await getCurrentUser();
  if (me) {
    await mutate((db) => {
      const u = db.users.find((x) => x.id === me.id);
      if (u) u.sessionVer = (u.sessionVer ?? 0) + 1;
    });
  }
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

export async function setAdminLang(lang: "th" | "en") {
  (await cookies()).set(ADMIN_LANG_COOKIE, lang === "en" ? "en" : "th", { path: "/admin", maxAge: 365 * 86400, sameSite: "lax" });
}
