import "server-only";
import { headers } from "next/headers";

/**
 * นับครั้งที่ใส่รหัสผ่านผิดภายใน 15 นาที เก็บไว้ในหน่วยความจำของเซิร์ฟเวอร์
 * นับทันทีก่อนตรวจรหัสผ่าน คำขอที่ส่งมาพร้อมกันจำนวนมากจึงหลุดเกินจำนวนที่กำหนดไม่ได้
 */
const fails = new Map<string, { n: number; until: number }>();
const WINDOW = 15 * 60_000;

/** ลบรายการที่หมดเวลาแล้ว ไม่ให้เก็บไว้เรื่อย ๆ */
function prune() {
  const now = Date.now();
  for (const [k, f] of fails) if (f.until <= now) fails.delete(k);
}

/**
 * ขอลองหนึ่งครั้งกับทุกคีย์ ถ้าคีย์ใดเกินจำนวนแล้วจะได้ null และไม่นับเพิ่ม
 * ถ้าผ่านจะนับไว้ก่อนเลย แล้วคืนฟังก์ชันไว้เรียกคืนการนับเมื่อรหัสผ่านถูก
 */
export function tryAttempt(limits: Record<string, number>): (() => void) | null {
  prune();
  const now = Date.now();
  for (const [key, limit] of Object.entries(limits)) {
    const f = fails.get(key);
    if (f && f.n >= limit && f.until > now) return null;
  }
  for (const key of Object.keys(limits)) {
    const f = fails.get(key);
    fails.set(key, f && f.until > now ? { n: f.n + 1, until: f.until } : { n: 1, until: now + WINDOW });
  }
  return () => {
    for (const key of Object.keys(limits)) {
      const f = fails.get(key);
      if (f) fails.set(key, { ...f, n: Math.max(0, f.n - 1) });
    }
  };
}

/**
 * ที่อยู่เครื่องที่ส่งมา ใช้ค่าท้ายสุดของ x-forwarded-for ซึ่งเซิร์ฟเวอร์หน้าบ้านเติมเอง ผู้ใช้ปลอมไม่ได้
 * เว็บจริงต้องอยู่หลังเซิร์ฟเวอร์หน้าบ้านหนึ่งชั้น ถ้าไม่มีส่วนหัวนี้ถือเป็นเครื่องเดียวกันหมด
 */
export async function clientIp(): Promise<string> {
  const xff = (await headers()).get("x-forwarded-for");
  return xff?.split(",").pop()?.trim() || "unknown";
}
