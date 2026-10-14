/**
 * งานที่ควรทำในหน้าแดชบอร์ด ตรวจจากข้อมูลจริงทั้งหมด
 * แต่ละข้อขึ้นเฉพาะเมื่อยังมีงานค้าง และเฉพาะผู้ใช้ที่มีสิทธิ์จัดการเรื่องนั้น
 */
import type { AIconName } from "@/admin/AIcon";
import { relDate, type AdminDict } from "@/admin/i18n";
import { TYPES, type Field } from "@/admin/sectionSchema";
import { realImg } from "@/components/Media";
import { can, type CurrentUser } from "@/server/auth";
import type { DB } from "@/server/types";
import type { LText, Locale, Section } from "@/types/site";

export type Todo = { icon: AIconName; red?: boolean; title: string; desc: string; href: string };

const blank = (v?: LText) => !v?.th?.trim() || !v?.en?.trim();

/** ช่องที่ต้องกรอกช่องนี้ยังว่างหรือไม่ ช่องสองภาษาต้องมีครบทั้งไทยและอังกฤษ */
const missing = (o: Record<string, unknown>, f: Field) => (f.i18n ? blank(o[f.key] as LText | undefined) : !String(o[f.key] ?? "").trim());

/** ส่วนนี้ยังกรอกไม่ครบหรือไม่ ใช้ช่องที่ต้องกรอกตามที่ตั้งไว้ในหน้าแก้ไข */
function unfinished(s: Section): boolean {
  const def = TYPES[s.type];
  const o = s as unknown as Record<string, unknown>;
  if (def.fields.some((f) => f.req && missing(o, f))) return true;
  const req = def.item?.fields.filter((f) => f.req) ?? [];
  if (!req.length) return false;
  const items = ((o.items ?? []) as Record<string, unknown>[]).filter((x) => !x.hidden);
  return !items.length || items.some((x) => req.some((f) => missing(x, f)));
}

export function getTodos(db: DB, user: CurrentUser, lang: Locale, t: AdminDict): Todo[] {
  const n = (s: string, v: number | string) => s.replace("{n}", String(v));
  const products = db.products;
  const live = products.filter((p) => p.status === "pub");
  const list: (Todo & { show: boolean; count: number })[] = [];
  const push = (show: boolean, count: number, todo: Todo) => list.push({ ...todo, show, count });

  // หน้าเว็บ
  const todoPages = db.pages.filter((p) => p.sections.some((s) => !s.hidden && unfinished(s)));
  push(can(user, "content"), todoPages.length, {
    icon: "alert", red: true, title: n(t.dash.tUnfinished, todoPages.length), desc: todoPages.map((p) => p.title[lang]).join(" · "),
    href: `/admin/content?page=${todoPages[0]?.id ?? "home"}`,
  });
  push(can(user, "content"), db.settings.contact.phone.trim() ? 0 : 1, {
    icon: "phone", red: true, title: t.dash.tPhone, desc: t.dash.tPhoneD, href: "/admin/content?page=contact",
  });
  const draft = db.draft;
  push(can(user, "content", "publish"), draft ? 1 : 0, {
    icon: "page", title: t.dash.tPageDraft,
    desc: draft ? t.dash.tPageDraftD.replace("{who}", db.users.find((u) => u.id === draft.userId)?.name ?? "—").replace("{when}", relDate(draft.when, lang)) : "",
    href: "/admin/content",
  });
  const hero = db.pages.find((p) => p.id === "home")?.sections.find((s) => s.type === "hero");
  const heroNoImg = hero && hero.type === "hero" ? hero.items.filter((x) => !realImg(x.img)).length : 0;
  push(can(user, "content"), heroNoImg, { icon: "image", red: true, title: n(t.dash.tHero, heroNoImg), desc: t.dash.tHeroD, href: "/admin/content?page=home" });

  // ชื่อหรือคำอธิบายใน Google ยังว่าง หรือไม่มีชื่อเว็บอยู่ในชื่อ เช่นพิมพ์ชื่อเว็บผิด
  const seo = db.settings.seo;
  const seoBad = (["th", "en"] as const).some(
    (l) => !seo.title[l].trim() || !seo.description[l].trim() || !seo.title[l].includes(db.settings.siteName[l].trim()),
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
