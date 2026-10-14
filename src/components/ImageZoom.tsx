"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/Icon";
import { useI18n } from "@/i18n/client";
import type { GalleryImage } from "./ProductGallery";

const MAX = 5;
const clampScale = (s: number) => Math.min(MAX, Math.max(1, s));

/**
 * ดูรูปสินค้าเต็มจอ ซูมได้ด้วยลูกกลิ้งเมาส์ ปุ่มบวกลบ ดับเบิลคลิก หรือจีบนิ้วบนมือถือ
 * ตอนซูมอยู่ลากเพื่อเลื่อนดูส่วนอื่นของรูปได้ กด Esc หรือปุ่มปิดเพื่อออก
 */
export function ImageZoom({ images, index, onIndex, onClose }: {
  images: GalleryImage[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [view, setView] = useState({ s: 1, x: 0, y: 0 });
  const stage = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; s: number } | null>(null);
  const many = images.length > 1;
  const im = images[index];

  // เลื่อนรูปได้ไม่เกินขอบที่ขยายออกไป
  const fix = (s: number, x: number, y: number) => {
    const r = stage.current?.getBoundingClientRect();
    const mx = r ? ((s - 1) * r.width) / 2 : 0;
    const my = r ? ((s - 1) * r.height) / 2 : 0;
    return { s, x: Math.min(mx, Math.max(-mx, x)), y: Math.min(my, Math.max(-my, y)) };
  };

  // ซูมโดยให้จุดที่ชี้อยู่ค้างที่เดิม
  const zoomAt = (next: number, cx?: number, cy?: number) =>
    setView((v) => {
      const s = clampScale(next);
      const r = stage.current?.getBoundingClientRect();
      if (!r || cx === undefined || cy === undefined) return fix(s, (v.x * s) / v.s, (v.y * s) / v.s);
      const px = cx - r.left - r.width / 2;
      const py = cy - r.top - r.height / 2;
      return fix(s, px - ((px - v.x) * s) / v.s, py - ((py - v.y) * s) / v.s);
    });

  const go = (n: number) => {
    setView({ s: 1, x: 0, y: 0 });
    onIndex((n + images.length) % images.length);
  };

  useEffect(() => {
    closeBtn.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (many && e.key === "ArrowLeft") go(index - 1);
      if (many && e.key === "ArrowRight") go(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ลูกกลิ้งต้องผูกเองเพื่อกันหน้าเว็บเลื่อนตาม
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setView((v) => {
        const s = clampScale(v.s * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
        const r = el.getBoundingClientRect();
        const px = e.clientX - r.left - r.width / 2;
        const py = e.clientY - r.top - r.height / 2;
        return fix(s, px - ((px - v.x) * s) / v.s, py - ((py - v.y) * s) / v.s);
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const dist = () => {
    const [a, b] = [...pts.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const btn =
    "grid size-11 cursor-pointer place-items-center rounded-full border border-white/20 bg-black/50 text-white transition-colors hover:bg-white hover:text-ink disabled:cursor-default disabled:opacity-40 disabled:hover:bg-black/50 disabled:hover:text-white";

  // วางไว้ใต้ body โดยตรง เพราะส่วนที่มีภาพเคลื่อนไหวทำให้ fixed ไม่เต็มจอ
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={im.alt} className="fixed inset-0 z-[1000] flex flex-col bg-black/95">
      <div className="flex items-center justify-between gap-3 p-3 text-white">
        <span className="min-w-0 truncate pl-1 text-sm text-white/80">
          {many && `${index + 1} / ${images.length} · `}
          {t.zoomHint}
        </span>
        <span className="flex flex-none gap-2">
          <button type="button" onClick={() => zoomAt(view.s / 1.5)} disabled={view.s <= 1} aria-label={t.zoomOut} className={btn}>
            <Icon name="minus" />
          </button>
          <button type="button" onClick={() => zoomAt(view.s * 1.5)} disabled={view.s >= MAX} aria-label={t.zoomIn} className={btn}>
            <Icon name="plus" />
          </button>
          <button ref={closeBtn} type="button" onClick={onClose} aria-label={t.close} className={btn}>
            <Icon name="x" />
          </button>
        </span>
      </div>

      <div
        ref={stage}
        className={`relative min-h-0 flex-1 touch-none select-none overflow-hidden ${view.s > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
        onDoubleClick={(e) => zoomAt(view.s > 1 ? 1 : 2.5, e.clientX, e.clientY)}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pts.current.size === 2) pinch.current = { d: dist(), s: view.s };
        }}
        onPointerMove={(e) => {
          const last = pts.current.get(e.pointerId);
          if (!last) return;
          pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pts.current.size === 2 && pinch.current) {
            const [a, b] = [...pts.current.values()];
            zoomAt((pinch.current.s * dist()) / pinch.current.d, (a.x + b.x) / 2, (a.y + b.y) / 2);
          } else if (pts.current.size === 1) {
            setView((v) => (v.s > 1 ? fix(v.s, v.x + e.clientX - last.x, v.y + e.clientY - last.y) : v));
          }
        }}
        onPointerUp={(e) => {
          pts.current.delete(e.pointerId);
          if (pts.current.size < 2) pinch.current = null;
        }}
        onPointerCancel={(e) => {
          pts.current.delete(e.pointerId);
          pinch.current = null;
        }}
      >
        <div className="absolute inset-0 will-change-transform" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})` }}>
          {/* ใช้ไฟล์ต้นฉบับเพื่อให้ซูมแล้วยังเห็นรายละเอียดได้มากที่สุด */}
          {im.src && im.src !== "placeholder" && <Image src={im.src} alt={im.alt} fill unoptimized loading="eager" draggable={false} className="object-contain" />}
        </div>

        {many && (
          <>
            <button type="button" onClick={() => go(index - 1)} onPointerDown={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()} aria-label={t.prevImg} className={`${btn} absolute left-3 top-1/2 -translate-y-1/2`}>
              <Icon name="chevL" />
            </button>
            <button type="button" onClick={() => go(index + 1)} onPointerDown={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()} aria-label={t.nextImg} className={`${btn} absolute right-3 top-1/2 -translate-y-1/2`}>
              <Icon name="chevR" />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
