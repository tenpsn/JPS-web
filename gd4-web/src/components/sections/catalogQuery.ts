"use client";

import { useSyncExternalStore } from "react";

/* คำค้นสินค้าที่ช่องค้นหาในส่วนหัวของหน้าและรายการสินค้าใช้ร่วมกัน
 * อ่านค่าแรกจากลิงก์ของหน้า แล้วอัปเดตทั้งสองที่พร้อมกันเมื่อพิมพ์ */
let query: string | null = null;
const subs = new Set<() => void>();

const read = () => (query ??= new URLSearchParams(window.location.search).get("q") ?? "");

export function setCatalogQuery(v: string) {
  query = v;
  subs.forEach((f) => f());
}

export function useCatalogQuery() {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    read,
    () => "",
  );
}

/** อัปเดตหมวดและคำค้นในลิงก์ของหน้า โดยไม่ต้องโหลดหน้าใหม่ ไม่ส่งหมวดมาแปลว่าคงหมวดเดิมไว้
 * หมวดที่ตรงกับหมวดตั้งต้นของหน้าไม่ต้องใส่ในลิงก์ หมวดอื่นรวมถึงทั้งหมดต้องใส่ไว้ เปิดลิงก์ซ้ำจะได้หน้าเดิม */
export function syncUrl(q: string, cat?: string, defaultCat = "all") {
  const sp = new URLSearchParams(window.location.search);
  if (cat !== undefined) {
    if (cat !== defaultCat) sp.set("cat", cat);
    else sp.delete("cat");
  }
  if (q) sp.set("q", q);
  else sp.delete("q");
  const qs = sp.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
}
