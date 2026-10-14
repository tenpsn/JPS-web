"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/server/activity";
import { assertCan } from "@/server/auth";
import { mutateAndPrune } from "@/server/cleanup";
import { mutate } from "@/server/store";
import { str } from "@/server/content";
import type { Img, LText } from "@/types/site";

const lt = (v: Partial<LText> | undefined, max: number): LText => ({ th: str(v?.th, max).trim(), en: str(v?.en, max).trim() });
const img = (s: unknown): Img => (typeof s === "string" && /^\/media\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(s) ? s : null);
/** favicon รับไฟล์ ICO ได้ด้วย */
const icon = (s: unknown): Img => (typeof s === "string" && /^\/media\/[0-9a-f-]{36}\.(jpg|png|webp|ico)$/.test(s) ? s : null);
const refresh = () => revalidatePath("/", "layout");
const SET = { th: "แก้ตั้งค่า", en: "updated settings" };

export async function saveGeneral(input: { siteName: LText; logo: Img; logoDark: Img; favicon: Img }) {
  const me = await assertCan("settings", "edit");
  const siteName = lt(input.siteName, 80);
  if (!siteName.th || !siteName.en) return { ok: false as const, error: "errName" as const };
  // รูปเดิมที่ไม่อยู่ในคลังและไม่มีที่ไหนใช้แล้วจะถูกลบ รูปในคลังยังอยู่
  await mutateAndPrune((db) => {
    Object.assign(db.settings, { siteName, logo: img(input.logo), logoDark: img(input.logoDark), favicon: icon(input.favicon) });
    logActivity(db, me.id, SET, { th: "ทั่วไป", en: "general" });
  });
  refresh();
  return { ok: true as const };
}

/** บันทึก SEO ของทั้งเว็บหรือของหน้าใดหน้าหนึ่ง */
export async function saveSeo(target: string, input: { title: LText; description: LText; image: Img }) {
  const me = await assertCan("settings", "edit");
  const seo = { title: lt(input.title, 120), description: lt(input.description, 320), image: img(input.image) };
  const ok = await mutate((db) => {
    if (target === "site") {
      db.settings.seo = seo;
      logActivity(db, me.id, SET, { th: "SEO ทั้งเว็บ", en: "site SEO" });
      return true;
    }
    const p = db.pages.find((x) => x.id === target);
    if (!p) return false;
    p.seo = seo;
    logActivity(db, me.id, SET, { th: `SEO หน้า ${p.title.th}`, en: `SEO of ${p.title.en}` });
    return true;
  });
  refresh();
  return { ok };
}
