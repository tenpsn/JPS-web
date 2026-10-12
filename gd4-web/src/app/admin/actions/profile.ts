"use server";

import { revalidatePath } from "next/cache";
import { initials } from "@/lib/initials";
import { logActivity } from "@/server/activity";
import { getCurrentUser, renewSession } from "@/server/auth";
import { mutateAndPrune } from "@/server/cleanup";
import { hashPassword, verifyPassword } from "@/server/password";
import { mutate, readDb } from "@/server/store";

/* โปรไฟล์ของตัวเอง ผู้ใช้ทุกคนแก้บัญชีของตัวเองได้โดยไม่ต้องมีสิทธิ์ใด */

const avatarSrc = (s: unknown) => (typeof s === "string" && /^\/media\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(s) ? s : null);

export async function saveProfile(input: { name: string; avatar: string | null }): Promise<{ ok: true } | { ok: false; error: "errName" }> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Forbidden");
  const name = String(input.name ?? "").trim().slice(0, 80);
  if (!name) return { ok: false, error: "errName" };
  const avatar = avatarSrc(input.avatar);
  // รูปโปรไฟล์เดิมที่ไม่มีใครใช้แล้วจะถูกลบออกจากระบบ
  await mutateAndPrune((db) => {
    const u = db.users.find((x) => x.id === me.id)!;
    if (u.name.th === name && (u.avatar ?? null) === avatar) return;
    const ini = initials(name);
    Object.assign(u, { name: { th: name, en: name }, ini: { th: ini, en: ini }, avatar });
    logActivity(db, me.id, { th: "แก้โปรไฟล์", en: "updated profile" }, { th: "บัญชีตัวเอง", en: "own account" });
  });
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export type PwErrors = Partial<Record<"cur" | "nw" | "conf", "errCur" | "errCurWrong" | "errNw" | "errConf">>;

export async function changePassword(cur: string, nw: string, conf: string): Promise<{ ok: boolean; errors?: PwErrors }> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Forbidden");
  const u = (await readDb()).users.find((x) => x.id === me.id)!;
  const errors: PwErrors = {};
  // ช่องว่างกับรหัสไม่ถูกต้องแจ้งคนละข้อความ ผู้ใช้จะได้รู้ว่าต้องแก้อะไร
  if (!cur) errors.cur = "errCur";
  else if (!verifyPassword(cur, u.passwordHash)) errors.cur = "errCurWrong";
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(nw)) errors.nw = "errNw";
  if (nw !== conf) errors.conf = "errConf";
  if (Object.keys(errors).length) return { ok: false, errors };
  const ver = await mutate((db) => {
    const u = db.users.find((x) => x.id === me.id)!;
    u.passwordHash = hashPassword(nw);
    // เครื่องอื่นที่เข้าระบบอยู่จะหลุดออก ส่วนเครื่องนี้ได้คุกกี้ใหม่ด้านล่าง
    u.sessionVer = (u.sessionVer ?? 0) + 1;
    logActivity(db, me.id, { th: "เปลี่ยนรหัสผ่าน", en: "changed password" }, { th: "บัญชีตัวเอง", en: "own account" });
    return u.sessionVer;
  });
  await renewSession(me.id, ver);
  return { ok: true };
}
