"use server";

import { logActivity } from "@/server/activity";
import { can, getCurrentUser, type CurrentUser } from "@/server/auth";
import { deleteUnused, usedText } from "@/server/cleanup";
import { mutate, readDb } from "@/server/store";

/** ใช้สิทธิ์ชุดเดียวกับการอัปโหลด */
const canManage = (user: CurrentUser | null): user is CurrentUser =>
  !!user && (can(user, "products", "edit") || can(user, "content", "edit") || can(user, "design", "edit") || can(user, "settings", "edit"));

/** รายการรูปในคลังสื่อ เรียงจากใหม่ไปเก่า พร้อมบอกว่าใช้อยู่ที่ไหนในเว็บหรือไม่ */
export async function listMedia() {
  if (!(await getCurrentUser())) throw new Error("Forbidden");
  const db = await readDb();
  const used = usedText(db);
  return db.media.map(({ src, name, size }) => ({ src, name, size, used: used.includes(src) }));
}

/** ลบรูปออกจากคลังและลบไฟล์ทิ้ง ถ้ารูปยังถูกใช้อยู่ที่ไหนจะไม่ลบ */
export async function deleteMedia(src: string): Promise<{ ok: true } | { ok: false; error: "inUse" | "forbidden" }> {
  const user = await getCurrentUser();
  if (!canManage(user)) return { ok: false, error: "forbidden" };
  const result = await mutate((db) => {
    const item = db.media.find((m) => m.src === src);
    if (!item) return "gone" as const;
    // หาลิงก์รูปในข้อมูลทุกส่วนที่แสดงบนเว็บ รวมถึงฉบับร่างที่ยังไม่เผยแพร่
    const used = usedText(db).includes(src);
    if (used) return "inUse" as const;
    db.media = db.media.filter((m) => m.src !== src);
    logActivity(db, user.id, { th: "ลบรูปจากคลัง", en: "deleted image" }, { th: item.name, en: item.name });
    return "ok" as const;
  });
  if (result === "inUse") return { ok: false, error: "inUse" };
  if (result === "ok") await deleteUnused([src]);
  return { ok: true };
}

