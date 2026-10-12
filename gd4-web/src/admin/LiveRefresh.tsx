"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { isDirty } from "./ui";

// หน้าที่ใช้ดูข้อมูลอย่างเดียว อัปเดตเนื้อหาในหน้าได้โดยไม่กระทบสิ่งที่ผู้ใช้กำลังทำ
const VIEW_PAGES = ["/admin"];
const EVERY = 60_000;

/**
 * โหลดข้อมูลในหน้าแดชบอร์ดใหม่ทุก 1 นาที และทันทีที่กลับมาที่แท็บนี้
 * ไม่ทำตอนแท็บถูกซ่อนหรือมีงานที่ยังไม่บันทึก
 */
export function LiveRefresh() {
  const router = useRouter();
  const path = usePathname();
  const tick = useRef<() => void>(() => {});

  // ใช้ค่าล่าสุดของหน้าเสมอ โดยไม่ต้องตั้งเวลาใหม่ทุกครั้งที่เปลี่ยนหน้า
  useEffect(() => {
    tick.current = () => {
      if (document.visibilityState !== "visible") return;
      if (VIEW_PAGES.includes(path) && !isDirty()) router.refresh();
    };
  });

  useEffect(() => {
    const run = () => tick.current();
    const timer = window.setInterval(run, EVERY);
    document.addEventListener("visibilitychange", run);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", run);
    };
  }, []);

  return null;
}
