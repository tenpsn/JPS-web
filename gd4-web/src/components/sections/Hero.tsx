"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { LocalLink } from "@/components/LocalLink";
import { Media, realImg } from "@/components/Media";
import { tx } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { HeroSection } from "@/types/site";
import { btn, GridBg } from "./shared";

export function Hero({ s }: { s: HeroSection }) {
  const { lang, t } = useI18n();
  const slides = s.items;
  const count = slides.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // เลื่อนสไลด์อัตโนมัติ แต่หยุดเมื่อไม่ได้เปิดหน้านี้อยู่ ผู้ใช้ชี้เมาส์ค้างไว้
  // หรือผู้ใช้ตั้งเครื่องให้ลดภาพเคลื่อนไหว
  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive((a) => (a + 1) % count);
    }, Math.max(3, s.autoplay) * 1000);
    return () => window.clearInterval(timer);
  }, [count, paused, s.autoplay]);

  if (!count) return null;
  const cur = slides[active];
  const go = (i: number) => setActive((i + count) % count);

  return (
    <div
      className="relative"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <GridBg />
      <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-[var(--sec-px)] py-[calc(var(--sec-py)*.85)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-7">
          <div className="grid" aria-live={paused ? "polite" : "off"}>
            {slides.map((sl, i) => {
              const on = i === active;
              // เฉพาะสไลด์ที่แสดงอยู่เท่านั้นที่เป็นหัวข้อหลักของหน้า
              const Title = on ? "h1" : "p";
              return (
                <div
                  key={sl.id}
                  aria-hidden={!on}
                  className={`[grid-area:1/1] flex flex-col gap-4 transition-[opacity,transform,visibility] duration-[600ms] ease-[cubic-bezier(.2,.7,.2,1)] ${
                    on ? "visible opacity-100" : "invisible translate-y-2.5 opacity-0"
                  }`}
                >
                  <span className="h-1 w-11 rounded-sm bg-accent-solid" />
                  <Title className="clamp-3 m-0 pb-[.08em] font-head text-h1 font-bold leading-[1.3] text-balance [overflow-wrap:anywhere]">
                    {tx(sl.title, lang)}
                  </Title>
                  <p className="clamp-3 m-0 max-w-[34em] text-[calc(var(--fs-body)*1.06)] text-pretty text-ink2">{tx(sl.sub, lang)}</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            <LocalLink href={cur.btnUrl || "/products"} className={`${btn.primary} min-h-12 px-[22px]`}>
              {tx(cur.btnLabel, lang) || t.viewAll}
              <Icon name="arrowR" />
            </LocalLink>
          </div>
        </div>

        <div className="relative min-w-0">
          {/* เส้นชีพจรสีแดงแบบเดียวกับในโลโก้ */}
          <svg aria-hidden="true" width="120" height="40" viewBox="0 0 120 40" fill="none" className="absolute -top-6 right-5 z-[1] text-accent-solid">
            <path d="M0 22h40l8-16 10 30 8-24 6 10h48" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {/* รูปวางบนการ์ดขาวทั้งสองโหมด เพราะรูปเครื่องจักรถ่ายบนพื้นขาว */}
          <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] border border-line bg-bg2 shadow-card">
            {/* พื้นของแต่ละสไลด์จางไปพร้อมรูป สไลด์ที่ยังไม่มีรูปจริงใช้พื้นเทาแทนพื้นขาว */}
            {slides.map((sl, i) => (
              <div
                key={sl.id}
                className={`absolute inset-0 p-5 transition-opacity duration-700 sm:p-7 ${realImg(sl.img) ? "bg-white" : "bg-bg2"} ${i === active ? "opacity-100" : "opacity-0"}`}
                aria-hidden={i !== active}
              >
                <div className="relative size-full">
                  <Media img={sl.img} alt={tx(sl.title, lang)} priority={i === 0} fit="contain" />
                </div>
              </div>
            ))}
          </div>

          {count > 1 && (
            <div className="mt-4 flex items-center justify-center gap-1">
              <button type="button" onClick={() => go(active - 1)} aria-label={t.prev} className={ctrl}>
                <Icon name="chevL" />
              </button>
              {slides.map((sl, i) => (
                <button
                  key={sl.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`${t.slide} ${i + 1}`}
                  aria-current={i === active}
                  className="grid h-11 cursor-pointer place-items-center border-0 bg-transparent px-1"
                >
                  <span
                    className="block h-1.5 rounded-full transition-[width,background-color] duration-[400ms] ease-[cubic-bezier(.2,.7,.2,1)]"
                    style={{ width: i === active ? 44 : 28, background: i === active ? "var(--c-primary-solid)" : "var(--c-line)" }}
                  />
                </button>
              ))}
              <button type="button" onClick={() => go(active + 1)} aria-label={t.next} className={ctrl}>
                <Icon name="chevR" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ctrl = "grid size-11 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-ink2 hover:bg-soft hover:text-primary";
