/**
 * งานที่ควรทำในหน้าแดชบอร์ด ตรวจจากข้อมูลจริงทั้งหมด
 * แต่ละข้อขึ้นเฉพาะเมื่อยังมีงานค้าง และเฉพาะผู้ใช้ที่มีสิทธิ์จัดการเรื่องนั้น
 */
import type { AIconName } from "@/admin/AIcon";
import { relDate, type AdminDict } from "@/admin/i18n";
import { realImg } from "@/components/Media";
import { CATALOG_HELP, CONTACT_PATHS, FAQ_HELP, PAGES, SETTINGS } from "@/content/site";
import { can, type CurrentUser } from "@/server/auth";
import type { DB } from "@/server/types";
import type { Locale } from "@/types/site";

export type Todo = { icon: AIconName; red?: boolean; title: string; desc: string; href: string };

/** เก็บข้อความภาษาไทยทุกช่องในส่วนนั้น */
function thTexts(v: unknown, out: string[] = []): string[] {
  if (!v || typeof v !== "object") return out;
  if ("th" in v && "en" in v && typeof (v as { th: unknown }).th === "string") {
    out.push((v as { th: string }).th.trim());
    return out;
  }
  for (const x of Object.values(v)) thTexts(x, out);
  return out;
}

// ข้อความตัวอย่างจากข้อมูลตั้งต้น ใช้เฉพาะประโยคยาว เพื่อไม่ให้หัวข้อทั่วไปเช่นคำถามที่พบบ่อยถูกนับ
// ไม่นับข้อความประกอบที่ใช้ได้จริง เช่นกล่องปรึกษา ข้อความใต้คำถามที่พบบ่อย และการ์ดเลือกเรื่อง
const READY = new Set(thTexts([FAQ_HELP, CATALOG_HELP, CONTACT_PATHS()]));
const SAMPLE = new Set(
  PAGES.flatMap((p) => p.sections.filter((s) => s.type !== "categories").flatMap((s) => thTexts(s))).filter((x) => x.length >= 20 && !READY.has(x)),
);

export function getTodos(db: DB, user: CurrentUser, lang: Locale, t: AdminDict): Todo[] {
  const n = (s: string, v: number | string) => s.replace("{n}", String(v));
  const products = db.products;
  const live = products.filter((p) => p.status === "pub");
  const list: (Todo & { show: boolean; count: number })[] = [];
  const push = (show: boolean, count: number, todo: Todo) => list.push({ ...todo, show, count });

  // หน้าเว็บ
  const samplePages = db.pages.filter((p) => p.sections.some((s) => !s.hidden && thTexts(s).some((x) => SAMPLE.has(x))));
  push(can(user, "content"), samplePages.length, {
    icon: "alert", red: true, title: n(t.dash.tSample, samplePages.length), desc: samplePages.map((p) => p.title[lang]).join(" · "),
    href: `/admin/content?page=${samplePages[0]?.id ?? "home"}`,
  });
  const phone = db.settings.contact.phone.trim();
  push(can(user, "content"), !phone || phone === SETTINGS.contact.phone ? 1 : 0, {
    icon: "phone", red: true, title: t.dash.tPhone, desc: t.dash.tPhoneD.replace("{phone}", phone || "—"), href: "/admin/content?page=contact",
  });
  const draft = db.draft;
  push(can(user, "content", "publish"), draft ? 1 : 0, {
    icon: "page", title: t.dash.tPageDraft,
    desc: draft ? t.dash.tPageDraftD.replace("{who}", db.users.find((u) => u.id === draft.userId)?.name[lang] ?? "—").replace("{when}", relDate(draft.when, lang)) : "",
    href: "/admin/content",
  });
  const hero = db.pages.find((p) => p.id === "home")?.sections.find((s) => s.type === "hero");
  const heroNoImg = hero && hero.type === "hero" ? hero.items.filter((x) => !realImg(x.img)).length : 0;
  push(can(user, "content"), heroNoImg, { icon: "image", red: true, title: n(t.dash.tHero, heroNoImg), desc: t.dash.tHeroD, href: "/admin/content?page=home" });

  // ชื่อเว็บใน Google ว่าง ยังเป็นข้อความตั้งต้น หรือไม่มีชื่อเว็บอยู่ในชื่อ เช่นพิมพ์ชื่อเว็บผิด
  const seo = db.settings.seo;
  const seoBad = (["th", "en"] as const).some(
    (l) =>
      !seo.title[l].trim() ||
      !seo.description[l].trim() ||
      seo.title[l] === SETTINGS.seo.title[l] ||
      seo.description[l] === SETTINGS.seo.description[l] ||
      !seo.title[l].includes(db.settings.siteName[l].trim()),
  );
  push(can(user, "settings", "edit"), seoBad ? 1 : 0, { icon: "search", title: t.dash.tSeo, desc: t.dash.tSeoD, href: "/admin/settings?tab=seo" });

  // สินค้า
  const drafts = products.length - live.length;
  push(can(user, "products"), drafts, { icon: "edit", title: n(t.dash.tDraft, drafts), desc: t.dash.tDraftD, href: "/admin/products?status=draft" });
  const noImg = products.filter((p) => !realImg(p.img)).length;
  push(can(user, "products"), noImg, { icon: "image", red: true, title: n(t.dash.tNoImg, noImg), desc: t.dash.tNoImgD, href: "/admin/products" });
  const noShort = products.filter((p) => !p.short?.[lang]?.trim()).length;
  push(can(user, "products"), noShort, { icon: "file", title: n(t.dash.tNoShort, noShort), desc: t.dash.tNoShortD, href: "/admin/products" });
  const strip = (h?: string) => (h ?? "").replace(/<[^>]*>/g, "").trim();
  const partial = products.filter((p) => !strip(p.detail?.th) || !strip(p.detail?.en) || !p.name.en.trim() || !p.short?.en?.trim()).length;
  push(can(user, "products"), partial, { icon: "globe", title: n(t.dash.tPartial, partial), desc: t.dash.tPartialD, href: "/admin/products" });
  const emptyCats = db.categories.filter((c) => !live.some((p) => p.category === c.id));
  push(can(user, "products"), emptyCats.length, {
    icon: "grid", red: true, title: n(t.dash.tEmptyCat, emptyCats.length), desc: t.dash.tEmptyCatD.replace("{names}", emptyCats.map((c) => c.name[lang]).join(" · ")),
    href: "/admin/products",
  });

  // ผู้ใช้
  const invited = db.users.filter((u) => u.status === "invited").length;
  push(can(user, "users"), invited, { icon: "mail", title: n(t.dash.tInvited, invited), desc: t.dash.tInvitedD, href: "/admin/users" });

  return list.filter((x) => x.show && x.count > 0);
}
