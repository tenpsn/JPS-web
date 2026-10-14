import "server-only";
import { UPLOAD_NAME } from "./files";
import { mutate, withLock } from "./store";
import type { DB } from "./types";

/** ข้อมูลทุกส่วนที่อาจอ้างถึงไฟล์อัปโหลด รวมถึงฉบับร่างที่ยังไม่เผยแพร่ */
export const usedText = (db: DB) => JSON.stringify([db.pages, db.products, db.categories, db.settings, db.design, db.draft, db.users.map((u) => u.avatar)]);

const srcsIn = (text: string) => new Set(text.match(/\/media\/[0-9a-f-]{36}\.[a-z0-9]+/g) ?? []);

/**
 * บันทึกข้อมูลเหมือน mutate แล้วลบไฟล์ที่ไม่มีที่ไหนใช้แล้วหลังการเปลี่ยนครั้งนี้ เช่น ฟอนต์ที่ถูกเปลี่ยน
 * ดูเฉพาะไฟล์ที่เคยถูกอ้างถึงก่อนเปลี่ยน ไฟล์ที่เพิ่งอัปโหลดแต่ฟอร์มยังไม่บันทึกจึงไม่ถูกลบ
 * รูปในคลังไม่ลบ เพราะเก็บไว้ในคลังให้เลือกใช้ซ้ำ ต้องลบเองจากคลัง
 */
export async function mutateAndPrune<T>(fn: (db: DB) => T): Promise<T> {
  let unused: string[] = [];
  const result = await mutate((db) => {
    const before = srcsIn(usedText(db));
    const out = fn(db);
    const after = usedText(db);
    const library = new Set(db.media.map((m) => m.src));
    unused = [...before].filter((s) => !after.includes(s) && !library.has(s));
    return out;
  });
  await deleteUnused(unused);
  return result;
}

/** ลบไฟล์ที่ไม่มีที่ไหนใช้และไม่อยู่ในคลังรูป ตรวจซ้ำในล็อก
 * ถ้าระหว่างนั้นมีคนอัปโหลดไฟล์เดียวกันแล้วนำไปใช้ ไฟล์นั้นจะไม่ถูกลบ */
export async function deleteUnused(srcs: string[]): Promise<void> {
  if (!srcs.length) return;
  await withLock(async (db, c) => {
    const used = usedText(db);
    const library = new Set(db.media.map((m) => m.src));
    const names = srcs.filter((s) => !used.includes(s) && !library.has(s)).map((s) => s.replace(/^\/media\//, "")).filter((n) => UPLOAD_NAME.test(n));
    if (names.length) await c.query("delete from uploads where name = any($1::text[])", [names]);
  });
}
