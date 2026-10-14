"use server";

import { revalidatePath } from "next/cache";
import { alignMenu } from "@/lib/menu";
import { same } from "@/lib/same";
import { logActivity } from "@/server/activity";
import { assertCan, can, getCurrentUser } from "@/server/auth";
import { mutateAndPrune } from "@/server/cleanup";
import { cleanDesign, cleanGlobal, cleanPage, globalOf, working } from "@/server/content";
import { mutate, nowStr, readDb } from "@/server/store";
import type { Working } from "@/server/types";
import type { Page } from "@/types/site";


/**
 * บันทึกงานที่กำลังแก้เป็นฉบับร่าง ใช้กับการดูตัวอย่างและปุ่มบันทึกร่าง
 * แก้เนื้อหาต้องมีสิทธิ์แก้เนื้อหา แก้ธีมต้องมีสิทธิ์แก้ดีไซน์
 */
export type SaveDraftResult = { ok: true; rev: number } | { ok: false; conflict: true; who: string; when: string };

export async function saveDraft(input: Working, baseRev: number): Promise<SaveDraftResult> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Forbidden");
  const db = await readDb();
  // จำเลขรุ่นร่างตอนอ่านไว้ เพราะข้อมูลที่อ่านได้เป็นชุดเดียวกับที่ mutate แก้ ค่าจะเปลี่ยนตามกัน
  const readRev = db.draftRev;
  const cur = working(db);

  const cleaned = (Array.isArray(input?.pages) ? input.pages : cur.pages).slice(0, 40).map((p) => cleanPage(p, cur.pages.find((x) => x.id === p?.id))).filter(Boolean) as Working["pages"];
  // หน้าที่รหัสซ้ำเก็บไว้หน้าเดียว ไม่อย่างนั้นจะบันทึกร่างได้แต่เผยแพร่ไม่ได้
  const pages = cleaned.filter((p, i) => cleaned.findIndex((x) => x.id === p.id) === i);
  // หน้าระบบจะไม่ถูกลบทิ้งเด็ดขาด
  for (const sp of cur.pages.filter((p) => p.system)) if (!pages.some((p) => p.id === sp.id)) pages.push(sp);
  const next: Working = { pages, design: cleanDesign(input?.design), global: cleanGlobal(input?.global, cur.global) };

  const contentChanged = !same(next.pages, cur.pages) || !same(next.global, cur.global);
  const designChanged = !same(next.design, cur.design);
  if (contentChanged && !can(user, "content", "edit")) throw new Error("Forbidden");
  if (designChanged && !can(user, "design", "edit")) throw new Error("Forbidden");

  // ตรวจในล็อก ถ้ามีคนอื่นหรือแท็บอื่นแก้ร่างไปแล้วหลังจากเปิดหน้านี้ จะไม่บันทึกทับ
  // ร่างที่ยังไม่เปลี่ยนแปลว่าข้อมูลที่ใช้ตรวจสิทธิ์ด้านบนยังเป็นชุดเดียวกัน
  return mutate((d): SaveDraftResult => {
    if (Number(baseRev) !== d.draftRev || d.draftRev !== readRev) {
      const by = d.users.find((u) => u.id === d.draft?.userId);
      return { ok: false, conflict: true, who: by?.name ?? "—", when: d.draft?.when ?? "" };
    }
    d.draft = { ...next, userId: user.id, when: nowStr() };
    return { ok: true, rev: ++d.draftRev };
  });
}

export async function discardDraft() {
  const me = await assertCan("content", "edit");
  // ไฟล์ที่ใช้แค่ในฉบับร่าง เช่น ฟอนต์ที่อัปโหลดแล้วไม่ได้เผยแพร่ จะถูกลบไปพร้อมร่าง
  await mutateAndPrune((d) => {
    if (d.draft) logActivity(d, me.id, { th: "ทิ้งฉบับร่าง", en: "discarded draft" }, { th: "ฉบับร่างทั้งหมด", en: "all drafts" });
    d.draft = null;
    d.draftRev++;
  });
  return { ok: true };
}

/** เผยแพร่ฉบับร่างขึ้นเว็บจริง และรีเฟรชหน้าเว็บ */
export async function publish(): Promise<{ ok: boolean; error?: "forbidden"; rev?: number }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Forbidden");

  // ไฟล์ที่ฉบับเผยแพร่ใหม่ไม่ได้ใช้แล้ว เช่น ฟอนต์ที่ถูกเปลี่ยน จะถูกลบ ไม่ลบระหว่างบันทึกร่างเพราะยังกดเลิกทำได้
  // ตรวจร่างและสิทธิ์ในล็อก จะได้เผยแพร่ร่างชุดเดียวกับที่ตรวจสิทธิ์
  const result = await mutateAndPrune((d): "ok" | "none" | "forbidden" => {
    const draft = d.draft;
    if (!draft) return "none";
    // SEO ของแต่ละหน้าแก้ที่หน้าตั้งค่าและเก็บในฉบับเผยแพร่เท่านั้น จึงใช้ค่าล่าสุดแทนค่าที่ติดมากับร่าง
    const draftPages = withLiveSeo(draft.pages, d.pages);
    const contentChanged = !same(draftPages, d.pages) || !same(draft.global, globalOf(d.settings));
    const designChanged = !same(draft.design, d.design);
    if ((contentChanged && !can(user, "content", "publish")) || (designChanged && !can(user, "design", "publish") && !can(user, "content", "publish"))) {
      return "forbidden";
    }
    const { pages, menu } = alignMenu(draftPages, draft.global.menu);
    const global = { ...draft.global, menu };
    // เทียบกับฉบับที่เผยแพร่อยู่ซึ่งจัดสวิตช์กับเมนูแบบเดียวกัน จะได้ไม่นับหน้าที่ไม่ได้แก้จริง
    const live = alignMenu(d.pages, d.settings.menu);
    const edited = pages.filter((p) => !same(p, live.pages.find((x) => x.id === p.id)));
    const removed = d.pages.filter((p) => !pages.some((x) => x.id === p.id));
    const changed = edited[0] ?? pages[0];
    // บันทึกแยกทีละเรื่องที่เปลี่ยน เพื่อให้รู้ว่าเผยแพร่อะไรไปบ้าง
    for (const p of edited) logActivity(d, user.id, "pubPage", p.title);
    for (const p of removed) logActivity(d, user.id, { th: "ลบหน้า", en: "deleted page" }, p.title);
    if (!same(draft.design, d.design)) logActivity(d, user.id, { th: "เผยแพร่การออกแบบ", en: "published design" }, { th: "ทั้งเว็บ", en: "whole site" });
    if (!same(global, { ...globalOf(d.settings), menu: live.menu })) logActivity(d, user.id, { th: "เผยแพร่ส่วนหัวและท้ายเว็บ", en: "published header and footer" }, { th: "ทั้งเว็บ", en: "whole site" });

    d.pages = pages;
    d.design = draft.design;
    Object.assign(d.settings, global);
    d.lastEdit = { page: changed.id, userId: user.id, when: nowStr() };
    d.draft = null;
    d.draftRev++;
    return "ok";
  });
  if (result === "forbidden") return { ok: false, error: "forbidden" };
  if (result === "ok") revalidatePath("/", "layout");
  return { ok: true, rev: (await readDb()).draftRev };
}

/** ใส่ SEO ของหน้าจากฉบับเผยแพร่ หน้าที่มีแค่ในร่างจะไม่มี SEO */
function withLiveSeo(pages: Page[], live: Page[]): Page[] {
  return pages.map((p) => {
    const out: Page = { ...p };
    delete out.seo;
    const seo = live.find((x) => x.id === p.id)?.seo;
    return seo ? { ...out, seo } : out;
  });
}
