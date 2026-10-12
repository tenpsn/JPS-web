/** ข้อมูลตั้งต้นที่ใช้ตอนฐานข้อมูลยังว่างและไม่มีไฟล์ mock-db.json ในโฟลเดอร์ .data
 * ผู้ใช้ตัวอย่างเข้าระบบด้วยรหัสผ่านด้านล่าง ใช้ตอนพัฒนาเท่านั้น และเก็บลงฐานข้อมูลแบบเข้ารหัสแล้ว */
import { DEFAULT_DESIGN } from "@/content/design";
import { CATEGORIES, PRODUCTS } from "@/content/products";
import { PAGES, SETTINGS } from "@/content/site";
import type { LText } from "@/types/site";
import { hashPassword } from "./password";
import { AREAS, type Action, type Area, type DB, type Perms, type Role } from "./types";

const DEV_PASSWORD = "gd4-demo-2026";

const L = (th: string, en: string): LText => ({ th, en });
const P = (view: number, edit: number, del: number, publish: number): Record<Action, boolean> => ({
  view: !!view,
  edit: !!edit,
  del: !!del,
  publish: !!publish,
});
const all = (p: Record<Action, boolean>) => Object.fromEntries(AREAS.map((a) => [a, p])) as Record<Area, Record<Action, boolean>>;

export const DEFAULT_PERMS: Perms = {
  super: all(P(1, 1, 1, 1)),
  editor: { dashboard: P(1, 0, 0, 0), products: P(1, 1, 0, 0), content: P(1, 1, 1, 1), design: P(1, 1, 0, 0), users: P(0, 0, 0, 0), activity: P(1, 0, 0, 0), settings: P(0, 0, 0, 0) },
  products: { dashboard: P(1, 0, 0, 0), products: P(1, 1, 1, 1), content: P(1, 0, 0, 0), design: P(0, 0, 0, 0), users: P(0, 0, 0, 0), activity: P(1, 0, 0, 0), settings: P(0, 0, 0, 0) },
  viewer: { dashboard: P(1, 0, 0, 0), products: P(1, 0, 0, 0), content: P(1, 0, 0, 0), design: P(1, 0, 0, 0), users: P(0, 0, 0, 0), activity: P(1, 0, 0, 0), settings: P(0, 0, 0, 0) },
};

/** เวลาที่แก้ล่าสุดและผู้แก้ของสินค้าแต่ละรหัส */
const UPDATED: Record<string, [string, number]> = {
  "PM-12": ["2026-10-02 09:42", 1], "VS-3": ["2026-10-01 16:10", 2], "UX-80": ["2026-09-30 11:05", 1], "DR-M": ["2026-09-29 14:22", 3],
  "AED-7": ["2026-09-27 10:30", 2], "SP-200": ["2026-09-25 13:48", 2], "ECG-12": ["2026-09-24 09:15", 1], "ESU-400": ["2026-09-22 15:02", 3],
  "OL-5": ["2026-09-20 11:40", 3], "IP-60": ["2026-09-18 10:12", 2], "CF-24": ["2026-09-15 14:55", 1], "AC-50": ["2026-09-12 09:30", 3],
  "HB-5F": ["2026-09-10 16:20", 2], "TN-2": ["2026-09-05 13:00", 1],
};


export function createSeed(): DB {
  const hash = hashPassword(DEV_PASSWORD);
  const user = (id: number, th: string, en: string, iniTh: string, iniEn: string, email: string, role: Role, lastActive: string | null, status: "active" | "suspended" | "invited" = "active") => ({
    id, name: L(th, en), ini: L(iniTh, iniEn), email, role, status, lastActive, passwordHash: status === "invited" ? null : hash,
  });

  let a = 0;
  const act = (userId: number, actTh: string, actEn: string, xTh: string, xEn: string, when: string) => ({ id: ++a, userId, action: L(actTh, actEn), target: L(xTh, xEn), when });

  return {
    version: 1,
    settings: structuredClone(SETTINGS),
    pages: structuredClone(PAGES),
    categories: structuredClone(CATEGORIES),
    products: PRODUCTS.map((p) => ({ ...structuredClone(p), updatedAt: UPDATED[p.sku]?.[0], updatedBy: UPDATED[p.sku]?.[1] })),
    users: [
      user(1, "สมชาย วงศ์ใหญ่", "Somchai Wongyai", "สว", "SW", "somchai@gdfourmedical.com", "super", "2026-10-02 11:30"),
      user(2, "นภา ศรีสุข", "Napa Srisuk", "นศ", "NS", "napa@gdfourmedical.com", "editor", "2026-10-02 08:15"),
      user(3, "ธนา รุ่งเรือง", "Thana Rungruang", "ธร", "TR", "thana@gdfourmedical.com", "products", "2026-09-29 14:22"),
      user(4, "พิมพ์ชนก แก้วมณี", "Pimchanok Kaewmanee", "พก", "PK", "pimchanok@gdfourmedical.com", "viewer", "2026-09-20 10:05", "suspended"),
      user(5, "กฤต ศักดิ์ดี", "Krit Sakdee", "กศ", "KS", "krit@gdfourmedical.com", "editor", null, "invited"),
    ],
    perms: structuredClone(DEFAULT_PERMS),
    activity: [
      act(1, "แก้ไขสินค้า", "edited product", "เครื่องติดตามสัญญาณชีพ PM-12", "PM-12 Patient Monitor", "2026-10-02 09:42"),
      act(2, "เผยแพร่หน้า", "published page", "หน้าแรก · สไลด์ Hero", "Home · Hero slides", "2026-10-02 08:15"),
      act(2, "ตอบข้อความจาก", "replied to", "โรงพยาบาลส่งเสริมสุขภาพตำบลหนองบัว", "Nong Bua Health Promoting Hospital", "2026-10-01 17:05"),
      act(3, "เพิ่มสินค้าใหม่ (ฉบับร่าง)", "added a new product (draft)", "เอกซเรย์ดิจิทัลเคลื่อนที่ DR-M", "DR-M Mobile Digital X-ray", "2026-09-29 14:22"),
      act(1, "อัปเดตข้อมูลติดต่อใน", "updated contact details on", "หน้าติดต่อเรา", "Contact page", "2026-09-28 11:00"),
      act(3, "แก้ไขสินค้า", "edited product", "โคมไฟผ่าตัด LED OL-5", "OL-5 LED Surgical Light", "2026-09-20 11:40"),
      act(1, "เพิ่มผู้ดูแล", "added admin", "พิมพ์ชนก แก้วมณี", "Pimchanok Kaewmanee", "2026-09-20 10:05"),
    ].sort((x, y) => y.when.localeCompare(x.when)),
    lastEdit: { page: "home", userId: 2, when: "2026-10-02 08:15" },
    design: structuredClone(DEFAULT_DESIGN),
    draft: null,
    draftRev: 0,
    media: [],
  };
}
