/**
 * โครงสร้างตารางในฐานข้อมูล ค่าเดี่ยวเก็บเป็นคอลัมน์ รายการที่แก้พร้อมกันทั้งชุดเก็บเป็น json
 * มีวิธีแปลงข้อมูลเป็นแถวและแปลงแถวกลับเป็นข้อมูล ใช้ทั้งตอนอ่านและบันทึก
 */
import type { Design, Page, Product, SiteSettings } from "@/types/site";
import type { Activity, AdminUser, DB, Perms, Role } from "./types";

export type ColType = "text" | "integer" | "bigint" | "float8" | "boolean" | "jsonb" | "timestamp" | "timestamptz" | "bytea";
/** ชื่อคอลัมน์ ชนิด ใส่ค่าว่างได้หรือไม่ และค่าตั้งต้นแบบ SQL ใช้ตอนเพิ่มคอลัมน์ให้ตารางที่มีแถวอยู่แล้ว */
export type Col = [name: string, type: ColType, nullable?: boolean, def?: string];
export type Row = Record<string, unknown>;


/** โครงสร้างของตารางหนึ่งตาราง ใช้สร้างตารางและเพิ่มคอลัมน์ที่ยังไม่มี */
export type TableDef = {
  name: string;
  cols: Col[];
  key: string[];
  /** คอลัมน์ที่ไม่ได้มาจากข้อมูล เช่นเลขรุ่นข้อมูล */
  extra?: Col[];
};

export type Table = TableDef & {
  order: string;
  /** แถวที่เขียนแล้วไม่เคยแก้ และรหัสไม่ถูกใช้ซ้ำ รหัสเดิมจึงหมายถึงแถวเดิม ไม่ต้องเทียบข้อมูลทั้งแถว
   * รายการของตารางนี้ต้องถูกล็อกไว้ไม่ให้แก้ ถ้าเผลอแก้จะเกิดข้อผิดพลาดทันที */
  appendOnly?: boolean;
  rows: (db: DB) => Row[];
};

/** ข้อมูลที่ยังมีค่าว่างใส่ได้ แปลงเป็น null ก่อนเก็บ */
const n = <T>(v: T | undefined) => v ?? null;

export const TABLES: Table[] = [
  {
    // ค่าของทั้งเว็บมีแถวเดียว ค่าเดี่ยวเป็นคอลัมน์ ส่วนรายการเมนู สี สิทธิ์ และฉบับร่างเก็บเป็น json
    // rev คือเลขรุ่นข้อมูล ใช้ดูว่ามีคนบันทึกไปแล้วหรือยัง จัดการแยกใน store.ts
    name: "site",
    cols: [
      ["id", "integer"], ["site_name_th", "text"], ["site_name_en", "text"], ["logo", "text", true], ["logo_dark", "text", true], ["favicon", "text", true],
      ["seo_title_th", "text"], ["seo_title_en", "text"], ["seo_desc_th", "text"], ["seo_desc_en", "text"], ["seo_image", "text", true],
      ["address_th", "text"], ["address_en", "text"], ["phone", "text"], ["email", "text"], ["hours_th", "text"], ["hours_en", "text"], ["map_embed", "text"],
      ["footer_body_th", "text"], ["footer_body_en", "text"], ["copyright_th", "text"], ["copyright_en", "text"],
      ["menu", "jsonb"], ["socials", "jsonb"], ["product_tiles", "jsonb"],
      ["font_heading", "text"], ["font_body", "text"], ["weight_heading", "integer"], ["weight_body", "integer"],
      ["line_height_heading", "float8"], ["line_height_body", "float8"], ["letter_spacing_heading", "float8"], ["letter_spacing_body", "float8"],
      ["radius", "integer"], ["btn_radius", "integer"], ["img_radius", "integer"], ["input_radius", "integer"], ["spacing", "float8"],
      ["sizes", "jsonb"], ["colors", "jsonb"], ["custom_fonts", "jsonb"],
      ["perms", "jsonb"],
      ["last_edit_page", "text"], ["last_edit_user_id", "integer"], ["last_edit_at", "timestamp"], ["draft_rev", "integer"],
      ["next_user_id", "integer"], ["next_activity_id", "integer"],
      ["draft_user_id", "integer", true], ["draft_at", "timestamp", true], ["draft", "jsonb", true],
    ],
    key: ["id"],
    order: "id",
    extra: [["rev", "integer", false, "0"]],
    rows: (db) => {
      const { settings: s, design: d } = db;
      const { userId, when, ...draft } = db.draft ?? {};
      return [{
        id: 1, site_name_th: s.siteName.th, site_name_en: s.siteName.en, logo: s.logo, logo_dark: s.logoDark, favicon: s.favicon,
        seo_title_th: s.seo.title.th, seo_title_en: s.seo.title.en, seo_desc_th: s.seo.description.th, seo_desc_en: s.seo.description.en, seo_image: n(s.seo.image),
        address_th: s.contact.address.th, address_en: s.contact.address.en, phone: s.contact.phone, email: s.contact.email,
        hours_th: s.contact.hours.th, hours_en: s.contact.hours.en, map_embed: s.contact.mapEmbed,
        footer_body_th: s.footer.body.th, footer_body_en: s.footer.body.en, copyright_th: s.footer.copyright.th, copyright_en: s.footer.copyright.en,
        menu: s.menu, socials: s.socials, product_tiles: s.productTiles,
        font_heading: d.fonts.heading, font_body: d.fonts.body, weight_heading: d.weight.heading, weight_body: d.weight.body,
        line_height_heading: d.lh.heading, line_height_body: d.lh.body, letter_spacing_heading: d.ls.heading, letter_spacing_body: d.ls.body,
        radius: d.radius, btn_radius: d.btnRadius, img_radius: d.imgRadius, input_radius: d.inputRadius, spacing: d.spacing,
        sizes: d.sizes, colors: d.colors, custom_fonts: d.customFonts,
        perms: db.perms,
        last_edit_page: db.lastEdit.page, last_edit_user_id: db.lastEdit.userId, last_edit_at: db.lastEdit.when, draft_rev: db.draftRev,
        next_user_id: db.nextIds.user, next_activity_id: db.nextIds.activity,
        draft_user_id: n(userId), draft_at: n(when), draft: db.draft ? draft : null,
      }];
    },
  },
  {
    name: "users",
    cols: [
      ["id", "integer"], ["pos", "integer"], ["name", "text"], ["ini", "text"],
      ["avatar", "text", true], ["email", "text"], ["role", "text"], ["status", "text"], ["last_active", "timestamp", true],
      ["password_hash", "text", true], ["invite_hash", "text", true], ["invite_expires", "bigint", true], ["session_ver", "integer", true],
    ],
    key: ["id"],
    order: "pos",
    rows: (db) =>
      db.users.map((u, pos) => ({
        id: u.id, pos, name: u.name, ini: u.ini, avatar: n(u.avatar), email: u.email,
        role: u.role, status: u.status, last_active: u.lastActive, password_hash: u.passwordHash, invite_hash: n(u.inviteHash),
        invite_expires: n(u.inviteExpires), session_ver: n(u.sessionVer),
      })),
  },
  {
    name: "categories",
    cols: [["id", "text"], ["pos", "integer"], ["name_th", "text"], ["name_en", "text"]],
    key: ["id"],
    order: "pos",
    rows: (db) => db.categories.map((c, pos) => ({ id: c.id, pos, name_th: c.name.th, name_en: c.name.en })),
  },
  {
    // รูปทั้งหมดของสินค้าเก็บเป็น json เรียงตามลำดับที่แสดง
    name: "products",
    cols: [
      ["id", "text"], ["pos", "integer"], ["sku", "text"], ["name_th", "text"], ["name_en", "text"], ["short_th", "text", true], ["short_en", "text", true],
      ["detail_th", "text", true], ["detail_en", "text", true], ["category", "text"], ["status", "text"], ["img", "text", true],
      ["updated_at", "timestamp", true], ["updated_by", "integer", true], ["images", "jsonb", true],
    ],
    key: ["id"],
    order: "pos",
    rows: (db) =>
      db.products.map((p, pos) => ({
        id: p.id, pos, sku: p.sku, name_th: p.name.th, name_en: p.name.en, short_th: n(p.short?.th), short_en: n(p.short?.en),
        detail_th: n(p.detail?.th), detail_en: n(p.detail?.en), category: p.category, status: p.status, img: p.img,
        updated_at: n(p.updatedAt), updated_by: n(p.updatedBy), images: n(p.images),
      })),
  },
  {
    // ส่วนต่าง ๆ ของหน้าเก็บเป็น json เรียงตามลำดับในหน้า เพราะแต่ละประเภทมีช่องไม่เหมือนกัน
    name: "pages",
    cols: [["id", "text"], ["pos", "integer"], ["slug", "text"], ["title_th", "text"], ["title_en", "text"], ["in_menu", "boolean"], ["system", "boolean"],
      ["seo_title_th", "text", true], ["seo_title_en", "text", true], ["seo_desc_th", "text", true], ["seo_desc_en", "text", true], ["seo_image", "text", true],
      ["sections", "jsonb"],
    ],
    key: ["id"],
    order: "pos",
    rows: (db) =>
      db.pages.map((p, pos) => ({ id: p.id, pos, slug: p.slug, title_th: p.title.th, title_en: p.title.en, in_menu: !!p.inMenu, system: !!p.system,
        seo_title_th: n(p.seo?.title?.th), seo_title_en: n(p.seo?.title?.en), seo_desc_th: n(p.seo?.description?.th), seo_desc_en: n(p.seo?.description?.en), seo_image: n(p.seo?.image),
        sections: p.sections,
      })),
  },
  {
    // seq คือลำดับที่อัปโหลด รูปใหม่ได้เลขมากกว่า รูปเดิมจึงไม่ต้องบันทึกใหม่ทุกครั้งที่อัปโหลด
    name: "media",
    cols: [["src", "text"], ["seq", "integer"], ["name", "text"], ["size", "integer"]],
    key: ["src"],
    order: "seq desc, src",
    rows: (db) => db.media.map((m) => ({ src: m.src, seq: m.seq, name: m.name, size: m.size })),
  },
  {
    // ประวัติใหม่สุดอยู่บนสุด จึงเรียงตามรหัสโดยไม่ต้องเก็บลำดับ
    name: "activity",
    cols: [["id", "integer"], ["user_id", "integer"], ["action_th", "text"], ["action_en", "text"], ["target_th", "text"], ["target_en", "text"], ["created_at", "timestamp"]],
    key: ["id"],
    order: "id desc",
    appendOnly: true,
    rows: (db) =>
      db.activity.map((a) => ({
        id: a.id, user_id: a.userId, action_th: a.action.th, action_en: a.action.en, target_th: a.target.th, target_en: a.target.en, created_at: a.when,
      })),
  },
];

/** ตารางไฟล์ที่อัปโหลด อ่านเขียนตรงใน files.ts ไม่ได้อยู่ในข้อมูลหลัก hash คือรหัสจากเนื้อไฟล์ ใช้หาไฟล์ซ้ำ
 * owner คือผู้ใช้ที่อัปโหลดรูปโปรไฟล์ ใช้ลบรูปโปรไฟล์เก่าที่ไม่ได้ใช้แล้ว */
export const UPLOADS: TableDef = {
  name: "uploads",
  cols: [["name", "text"], ["type", "text"], ["size", "integer"], ["body", "bytea"], ["created_at", "timestamptz", false, "now()"], ["hash", "text", true], ["owner", "integer", true]],
  key: ["name"],
};

// ค่าตั้งต้นของแต่ละชนิด ใช้กับคอลัมน์ที่ห้ามว่างซึ่งเพิ่มทีหลัง ชนิด json ต้องกำหนดเองเพราะเดาไม่ได้
const TYPE_DEFAULT: Partial<Record<ColType, string>> = { text: "''", integer: "0", bigint: "0", float8: "0", boolean: "false", timestamp: "now()", timestamptz: "now()" };

const colSql = ([c, type, nullable, def]: Col) => `${c} ${type}${nullable ? "" : " not null"}${def ? ` default ${def}` : ""}`;

/** คอลัมน์ที่มีอยู่แล้วในฐานข้อมูล แยกตามตาราง บอกว่าห้ามว่างหรือไม่ และเป็นคีย์หลักหรือไม่ */
export type Existing = Map<string, Map<string, { notNull: boolean; pk: boolean }>>;

/** คำสั่งสร้างตารางที่ยังไม่มี และเพิ่มเฉพาะคอลัมน์ที่ยังไม่มี แถวเดิมได้ค่าตั้งต้นของคอลัมน์ที่ห้ามว่าง
 * คอลัมน์เก่าที่โค้ดเลิกใช้แล้วจะถูกปล่อยให้ว่างได้ การบันทึกแถวใหม่จะได้ไม่ติด */
export function schemaSql(defs: TableDef[], existing: Existing): string[] {
  const out: string[] = [];
  for (const t of defs) {
    const cols = [...t.cols, ...(t.extra ?? [])];
    const have = existing.get(t.name);
    if (!have) {
      out.push(`create table ${t.name} (${[...cols.map(colSql), `primary key (${t.key.join(", ")})`].join(", ")});`);
      continue;
    }
    for (const col of cols.filter(([c]) => !have.has(c))) {
      const [c, type, nullable, def] = col;
      const fill = def ?? TYPE_DEFAULT[type];
      if (!nullable && !fill) throw new Error(`Column ${t.name}.${c} needs a default value before it can be added to an existing table`);
      out.push(`alter table ${t.name} add column ${colSql([c, type, nullable, nullable ? def : fill])};`);
    }
    // คีย์หลักเปลี่ยนไม่ได้ด้วยวิธีนี้ ต้องย้ายข้อมูลเอง จึงแจ้งตั้งแต่ตอนเปิดแทนที่จะไปพังตอนบันทึก
    const pk = [...have].filter(([, v]) => v.pk).map(([c]) => c);
    if ([...pk].sort().join() !== [...t.key].sort().join()) throw new Error(`Primary key of ${t.name} changed from (${pk}) to (${t.key}). Migrate this table by hand with SQL.`);
    for (const [c, v] of have) {
      if (v.notNull && !cols.some(([x]) => x === c)) out.push(`alter table ${t.name} alter column ${c} drop not null;`);
    }
  }
  return out;
}

/** คำสั่งอ่านทั้งตาราง เวลาอ่านออกมาเป็นข้อความรูปแบบเดียวกับที่ใช้ในระบบ */
export const selectSql = (t: Table) =>
  `select ${t.cols
    .map(([c, type]) => (type === "timestamp" ? `to_char(${c}, 'YYYY-MM-DD HH24:MI') as ${c}` : type === "bigint" ? `${c}::float8 as ${c}` : c))
    .join(", ")} from ${t.name} order by ${t.order}`;

/** ตัดค่าที่เป็น null ออก เพื่อให้ช่องที่ไม่มีค่าหายไปเหมือนข้อมูลเดิม */
const opt = <T>(v: T | null): T | undefined => (v === null ? undefined : v);
const lt = (th: unknown, en: unknown) => ({ th: String(th ?? ""), en: String(en ?? "") });
const optLt = (th: unknown, en: unknown) => (th === null && en === null ? undefined : lt(th, en));

/** ประกอบแถวจากทุกตารางกลับเป็นข้อมูลที่โค้ดส่วนอื่นใช้ */
export function fromRows(r: Record<string, Row[]>): DB {
  const s = r.site[0];
  return {
    settings: {
      siteName: lt(s.site_name_th, s.site_name_en), logo: s.logo as string | null, logoDark: s.logo_dark as string | null, favicon: s.favicon as string | null,
      seo: clean({ title: lt(s.seo_title_th, s.seo_title_en), description: lt(s.seo_desc_th, s.seo_desc_en), image: opt(s.seo_image as string | null) }),
      contact: {
        address: lt(s.address_th, s.address_en), phone: s.phone as string, email: s.email as string, hours: lt(s.hours_th, s.hours_en), mapEmbed: s.map_embed as string,
      },
      menu: s.menu as SiteSettings["menu"], socials: s.socials as SiteSettings["socials"],
      footer: { body: lt(s.footer_body_th, s.footer_body_en), copyright: lt(s.copyright_th, s.copyright_en) },
      productTiles: s.product_tiles as SiteSettings["productTiles"],
    },
    design: {
      fonts: { heading: s.font_heading as string, body: s.font_body as string }, customFonts: s.custom_fonts as Design["customFonts"], sizes: s.sizes as Design["sizes"],
      weight: { heading: s.weight_heading as number, body: s.weight_body as number },
      lh: { heading: s.line_height_heading as number, body: s.line_height_body as number },
      ls: { heading: s.letter_spacing_heading as number, body: s.letter_spacing_body as number },
      colors: s.colors as Design["colors"], radius: s.radius as number, btnRadius: s.btn_radius as number, imgRadius: s.img_radius as number,
      inputRadius: s.input_radius as number, spacing: s.spacing as number,
    },
    perms: s.perms as Perms,
    lastEdit: { page: s.last_edit_page as string, userId: s.last_edit_user_id as number, when: s.last_edit_at as string },
    draft: s.draft ? { ...(s.draft as Omit<NonNullable<DB["draft"]>, "userId" | "when">), userId: s.draft_user_id as number, when: s.draft_at as string } : null,
    draftRev: s.draft_rev as number,
    nextIds: { user: s.next_user_id as number, activity: s.next_activity_id as number },
    users: r.users.map(
      (x): AdminUser => clean({
        id: x.id as number, name: x.name as string, ini: x.ini as string, avatar: opt(x.avatar as string | null), email: x.email as string,
        role: x.role as Role, status: x.status as AdminUser["status"], lastActive: x.last_active as string | null, passwordHash: x.password_hash as string | null,
        inviteHash: opt(x.invite_hash as string | null), inviteExpires: opt(x.invite_expires as number | null), sessionVer: opt(x.session_ver as number | null),
      }),
    ),
    categories: r.categories.map((x) => ({ id: x.id as string, name: lt(x.name_th, x.name_en) })),
    products: r.products.map(
      (x): Product => clean({
        id: x.id as string, sku: x.sku as string, name: lt(x.name_th, x.name_en), short: optLt(x.short_th, x.short_en), detail: optLt(x.detail_th, x.detail_en),
        category: x.category as string, status: x.status as Product["status"], img: x.img as string | null, images: opt(x.images as Product["images"] | null),
        updatedAt: opt(x.updated_at as string | null), updatedBy: opt(x.updated_by as number | null),
      }),
    ),
    pages: r.pages.map(
      (x): Page => clean({
        id: x.id as string, title: lt(x.title_th, x.title_en), slug: x.slug as string, inMenu: x.in_menu as boolean, system: x.system as boolean,
        seo: pageSeo(x), sections: x.sections as Page["sections"],
      }),
    ),
    media: r.media.map((x) => ({ src: x.src as string, seq: x.seq as number, name: x.name as string, size: x.size as number })),
    activity: r.activity.map((x) =>
      freezeActivity({ id: x.id as number, userId: x.user_id as number, action: lt(x.action_th, x.action_en), target: lt(x.target_th, x.target_en), when: x.created_at as string }),
    ),
  };
}

/** ล็อกรายการประวัติไม่ให้แก้ เพราะตารางประวัติบันทึกเฉพาะแถวใหม่ การแก้รายการเดิมจะไม่ถูกบันทึก */
export function freezeActivity(a: Activity): Activity {
  Object.freeze(a.action);
  Object.freeze(a.target);
  return Object.freeze(a);
}

/** SEO ของหน้า ถ้าทุกช่องว่างถือว่ายังไม่ได้ตั้ง */
function pageSeo(x: Row): Page["seo"] {
  const seo = clean({ title: optLt(x.seo_title_th, x.seo_title_en), description: optLt(x.seo_desc_th, x.seo_desc_en), image: opt(x.seo_image as string | null) });
  return Object.keys(seo).length ? seo : undefined;
}

/** ลบช่องที่ไม่มีค่าออกจากข้อมูล */
function clean<T extends object>(o: T): T {
  for (const k of Object.keys(o) as (keyof T)[]) if (o[k] === undefined) delete o[k];
  return o;
}
