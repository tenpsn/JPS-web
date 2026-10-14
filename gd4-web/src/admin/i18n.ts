/** ข้อความหน้าจอหลังบ้านภาษาไทยและอังกฤษ มาจากไฟล์ tt.generated.ts รวมกับส่วนเพิ่มด้านล่าง */
import type { LText, Locale } from "@/types/site";
import { TT } from "./tt.generated";

const L = (th: string, en: string): LText => ({ th, en });

/** ข้อความที่เพิ่มหรือแก้ทับจากข้อความในไฟล์ดีไซน์ */
const EXTRA = {
  nav: {
    design: L("ธีมและตัวอักษร", "Theme & type"), activity: L("ประวัติการแก้ไข", "Activity log"), viewSite: L("ดูหน้าเว็บไซต์", "View website"),
    gOverview: L("ภาพรวม", "Overview"), gContent: L("เนื้อหา", "Content"), gSystem: L("ระบบ", "System"),
  },
  top: { language: L("ภาษา", "Language") },
  login: {
    errCred: L("อีเมลหรือรหัสผ่านไม่ถูกต้อง", "Incorrect email or password"),
    sub: L("จัดการสินค้าและเนื้อหาเว็บไซต์ {name}", "Manage {name} products and website content"),
    panelText: L("อัปเดตสินค้าและเนื้อหาหน้าเว็บได้จากที่เดียว", "Update products and page content in one place."),
    showPw: L("แสดงรหัสผ่าน", "Show password"), hidePw: L("ซ่อนรหัสผ่าน", "Hide password"),
  },
  dash: {
    hello: L("สวัสดี คุณ ", "Hello, "), latest: L("ล่าสุด", "Latest"),
    sPub: L("เผยแพร่แล้ว", "Published"), sDraft: L("ฉบับร่าง", "Drafts"), sPages: L("หน้าเว็บ", "Pages"),
    todo: L("งานที่ควรทำ", "To do"),
    tDraft: L("สินค้าฉบับร่าง {n} รายการ", "{n} draft products"), tDraftD: L("ตรวจแล้วเผยแพร่เพื่อให้ขึ้นบนเว็บ", "Review and publish them to show on the website"),
    tNoImg: L("สินค้าที่ยังไม่มีรูป {n} รายการ", "{n} products without a photo"), tNoImgD: L("ใส่รูปเครื่องเพื่อให้การ์ดสินค้าดูครบ", "Add a machine photo so the product card looks complete"),
    tNoShort: L("สินค้าที่ยังไม่มีคำอธิบายสั้น {n} รายการ", "{n} products without a short description"), tNoShortD: L("คำอธิบายสั้นขึ้นบนการ์ดและในผลค้นหา Google", "It shows on product cards and in Google results"),
    tHero: L("สไลด์หน้าแรกที่ยังไม่มีรูป {n} สไลด์", "{n} homepage slides without a photo"), tHeroD: L("ใส่รูปให้ครบทุกสไลด์", "Add a photo to every slide"),
    tUnfinished: L("หน้าที่ยังกรอกไม่ครบ {n} หน้า", "{n} pages are not finished"),
    tPhone: L("ยังไม่ได้ใส่เบอร์โทร", "No phone number yet"),
    tPhoneD: L("เบอร์นี้ขึ้นบนปุ่มโทรทุกหน้า ใส่ได้ที่ข้อมูลติดต่อ", "It shows on the call button on every page. Add it in Contact details"),
    tPageDraft: L("มีฉบับร่างหน้าเว็บที่ยังไม่เผยแพร่", "Unpublished page changes"),
    tPageDraftD: L("แก้ล่าสุดโดย {who} · {when}", "Last edited by {who} · {when}"),
    tSeo: L("SEO ทั้งเว็บยังไม่ถูกต้อง", "Site SEO needs attention"),
    tSeoD: L("ชื่อหรือคำอธิบายที่ขึ้นใน Google ยังว่างอยู่ หรือไม่ตรงกับชื่อเว็บ", "The Google title or description is empty or does not match the site name"),
    tPartial: L("สินค้าที่ข้อมูลยังไม่ครบสองภาษา {n} รายการ", "{n} products are missing details or English text"),
    tPartialD: L("ขาดรายละเอียด หรือขาดชื่อหรือคำอธิบายภาษาอังกฤษ หน้าภาษาอังกฤษจะว่าง", "Missing details, or the English name or description, so the English page looks empty"),
    tEmptyCat: L("หมวดที่ยังไม่มีสินค้าเผยแพร่ {n} หมวด", "{n} categories have no published products"),
    tEmptyCatD: L("{names} จะไม่ขึ้นบนเว็บจนกว่าจะมีสินค้า", "{names} will not show on the website until they have products"),
    tInvited: L("ผู้ใช้ที่ยังไม่ตอบรับคำเชิญ {n} คน", "{n} invited users have not joined yet"),
    tInvitedD: L("สร้างลิงก์เชิญใหม่ได้ที่หน้าจัดการผู้ใช้", "Create a new invite link on the Users page"),
    allDone: L("ไม่มีงานค้าง", "All caught up"), allDoneD: L("สินค้าและหน้าเว็บข้อมูลครบแล้ว", "Products and pages are complete"),
    ctaT: L("ตรวจหน้าเว็บก่อนเผยแพร่ทุกครั้ง", "Check the website before you publish"),
    ctaD: L("แก้ล่าสุด {page} โดย {who} · {when}", "Last edit: {page} by {who} · {when}"),
    denied: L("บัญชีของคุณไม่มีสิทธิ์เข้าส่วนนั้น", "Your account doesn't have access to that area"),
  },
  roles: {
    super: L("ผู้ดูแลสูงสุด", "Super admin"), editor: L("แก้ไขเนื้อหา", "Content editor"),
    products: L("จัดการสินค้า", "Product manager"), viewer: L("ดูอย่างเดียว", "View only"),
  },
  c: { saving: L("กำลังบันทึก", "Saving") },
  set: {
    t_security: L("รหัสผ่าน", "Password"),
    errCurWrong: L("รหัสผ่านปัจจุบันไม่ถูกต้อง", "Current password is incorrect"),
  },
  dz: {
    radius: L("มุมโค้งการ์ดและกล่อง", "Card and box corners"),
    btnRadius: L("มุมโค้งปุ่ม", "Button corners"),
    imgRadius: L("มุมโค้งรูปภาพ", "Image corners"),
    inputRadius: L("มุมโค้งช่องค้นหาและช่องกรอก", "Search and input corners"),
    pill: L("แคปซูล", "Pill"),
  },
  pg: {
    label: L("เปลี่ยนหน้า", "Pages"),
    first: L("หน้าแรก", "First"), prev: L("ก่อนหน้า", "Previous"), next: L("ถัดไป", "Next"), last: L("หน้าสุดท้าย", "Last"),
    showing: L("แสดง {from} ถึง {to} จาก {total} รายการ", "Showing {from} to {to} of {total}"),
  },
  prod: {
    sub: L("{n} รายการ · เผยแพร่ {p} · ฉบับร่าง {d}", "{n} items · {p} published · {d} drafts"),
    filters: L("ตัวกรอง", "Filters"),
    bulkPub: L("เผยแพร่", "Publish"), bulkDraft: L("เป็นฉบับร่าง", "Make draft"), bulkMove: L("ย้ายหมวด", "Move to"),
    pubDone: L("เปลี่ยนสถานะแล้ว {n} รายการ", "Status changed for {n} items"),
    skipped: L("อีก {n} รายการข้อมูลยังไม่ครบ จึงยังไม่เผยแพร่", "{n} more are incomplete and were not published"),
    moved: L("ย้ายหมวดแล้ว {n} รายการ", "Moved {n} items"),
  },
  users: {
    sumAll: L("ผู้ใช้ทั้งหมด", "All users"),
    revert: L("ยกเลิกการแก้ไข", "Discard changes"),
    // ระบบไม่ได้ส่งอีเมล จึงบอกตามจริงว่าจะได้ลิงก์เชิญให้คัดลอกไปส่งเอง
    invite: L("บันทึกแล้วจะได้ลิงก์เชิญ คัดลอกไปส่งให้ผู้ใช้เพื่อตั้งรหัสผ่านเอง", "After saving you get an invite link. Copy it to the user so they can set their own password"),
    resend: L("สร้างลิงก์เชิญใหม่", "New invite link"),
    editorD: L("แก้ไขสินค้าและเนื้อหาหน้าเว็บ", "Edit products and pages"),
    productsD: L("เพิ่ม แก้ไข และเผยแพร่สินค้า", "Add, edit and publish products"),
    added: L("เพิ่มผู้ดูแลแล้ว", "Admin added"), superOnly: L("เฉพาะผู้ดูแลสูงสุด", "Super admin only"), linkReady: L("สร้างลิงก์เชิญใหม่แล้ว", "New invite link created"),
    linkTitle: L("ลิงก์เชิญ", "Invite link"),
    linkText: L(
      "คัดลอกลิงก์นี้ไปส่งให้ผู้ใช้ เพื่อให้ตั้งรหัสผ่านและเริ่มใช้งาน ลิงก์ใช้ได้ 7 วัน",
      "Copy this link and send it to the user so they can set a password. It is valid for 7 days.",
    ),
  },
  form: {
    imgMax: L("ใส่รูปได้สูงสุด {max} รูปต่อสินค้า", "Up to {max} images per product"),
    imgDup: L("รูปนี้มีในสินค้านี้แล้ว", "This image is already in this product"),
  },
  media: {
    delTitle: L("ลบรูปนี้ออกจากคลัง?", "Delete this image from the library?"),
    delText: L("ไฟล์รูปจะถูกลบถาวรและกู้คืนไม่ได้", "The image file will be permanently deleted and can't be restored."),
    deleted: L("ลบรูปแล้ว", "Image deleted"),
    inUse: L("รูปนี้ยังใช้อยู่ในเว็บ ต้องเอาออกจากหน้าที่ใช้ก่อนจึงจะลบได้", "This image is still used on the site. Remove it from where it's used first."),
    title: L("คลังรูป", "Media library"),
    used: L("ใช้อยู่", "In use"),
  },
  soon: { title: L("กำลังพัฒนา", "Coming soon"), text: L("หน้านี้จะเปิดใช้ในขั้นตอนถัดไปของการพัฒนา", "This screen is part of the next development phase.") },
};

/** ตรวจว่าเป็นคู่ข้อความไทยกับอังกฤษจริง มีแค่ th และ en เท่านั้น ไม่ใช่กลุ่มที่บังเอิญมีสองคีย์นี้ */
function isLText(x: unknown): x is LText {
  if (!x || typeof x !== "object") return false;
  const k = Object.keys(x);
  return k.length === 2 && typeof (x as LText).th === "string" && typeof (x as LText).en === "string";
}

function merge(a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const cur = out[k];
    const isText = isLText;
    out[k] = cur && typeof cur === "object" && v && typeof v === "object" && !isText(v) ? merge(cur as Record<string, unknown>, v as Record<string, unknown>) : v;
  }
  return out;
}

const DICT = merge(TT as unknown as Record<string, unknown>, EXTRA);

type Resolve<T> = T extends LText ? string : { [K in keyof T]: Resolve<T[K]> };
type DeepWiden<T> = T extends LText ? LText : { [K in keyof T]: DeepWiden<T[K]> };
export type AdminDict = Resolve<DeepWiden<typeof TT>> & Resolve<typeof EXTRA>;

function resolve(o: unknown, lang: Locale): unknown {
  if (Array.isArray(o)) return o.map((x) => resolve(x, lang));
  if (o && typeof o === "object") {
    if (isLText(o)) return o[lang];
    return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, resolve(v, lang)]));
  }
  return o;
}

const cache: Partial<Record<Locale, AdminDict>> = {};
export const getAdminDict = (lang: Locale): AdminDict => (cache[lang] ??= resolve(DICT, lang) as AdminDict);

export const ADMIN_LANG_COOKIE = "gd4_admin_lang";

const MTH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const MEN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** แปลงวันเวลาเป็นรูปแบบที่อ่านง่ายตามภาษา ภาษาไทยใช้ปี พ ศ */
export function fmtDate(d: string, lang: Locale, time = true): string {
  const [day, t] = d.split(" ");
  const [y, m, dd] = day.split("-").map(Number);
  return lang === "th"
    ? `${dd} ${MTH[m - 1]} ${y + 543}${time && t ? ` · ${t} น.` : ""}`
    : `${dd} ${MEN[m - 1]} ${y}${time && t ? `, ${t}` : ""}`;
}

/** บอกว่าผ่านมานานเท่าไรแล้วนับจากตอนนี้ ใช้เวลาประเทศไทย */
export function relDate(d: string, lang: Locale, now = Date.now()): string {
  const t = Date.parse(`${d.replace(" ", "T")}:00+07:00`);
  const min = Math.round((now - t) / 60000);
  if (min < 1) return lang === "th" ? "เมื่อสักครู่" : "just now";
  if (min < 60) return lang === "th" ? `${min} นาทีที่แล้ว` : `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return lang === "th" ? `${h} ชม.ที่แล้ว` : `${h} h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return lang === "th" ? `${days} วันที่แล้ว` : `${days} d ago`;
  return fmtDate(d, lang, false);
}

/** วันที่ของวันนี้ที่แสดงบนหน้าแดชบอร์ด ใช้เวลาประเทศไทย */
export function todayLine(lang: Locale, now = new Date()): string {
  return new Intl.DateTimeFormat(lang === "th" ? "th-TH-u-ca-buddhist" : "en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bangkok",
  }).format(now);
}
