"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/Icon";
import { LocalLink } from "@/components/LocalLink";
import { tx } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { FaqSection } from "@/types/site";
import { btn, delay, H2 } from "./shared";

export function Faq({ s }: { s: FaqSection }) {
  const { lang } = useI18n();
  const uid = useId();
  // คำถามแรกเปิดไว้ตั้งแต่ต้นตามแบบดีไซน์
  const help = tx(s.help, lang);
  const btnLabel = tx(s.btnLabel, lang);
  const [open, setOpen] = useState<Record<string, boolean>>(() => (s.items[0] ? { [s.items[0].id]: true } : {}));

  return (
    // หัวข้อและปุ่มติดต่ออยู่ซ้ายและติดจอตอนเลื่อน คำถามอยู่ขวา บนมือถือเรียงต่อกัน
    <div className="sec grid grid-cols-1 items-start gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
      <div className="flex flex-col gap-3.5 lg:sticky lg:top-24">
        <H2>{tx(s.heading, lang)}</H2>
        {help && <p className="m-0 text-ink2">{help}</p>}
        {btnLabel && s.btnUrl && (
          <LocalLink href={s.btnUrl} className={`${btn.outline} min-h-11 w-fit gap-2`}>
            {/* ลิงก์ไปหน้าติดต่อหรือเบอร์โทรใช้ไอคอนโทรศัพท์ */}
            {(s.btnUrl.startsWith("tel:") || s.btnUrl.startsWith("/contact")) && <Icon name="phone" />}
            {btnLabel}
          </LocalLink>
        )}
      </div>
      <div className="flex flex-col">
        {s.items.map((q, i) => {
          const isOpen = !!open[q.id];
          const panel = `${uid}-${q.id}`;
          return (
            <div key={q.id} style={delay(i)} className="border-b border-line text-ink [animation:s-up_.45s_both]">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panel}
                onClick={() => setOpen((o) => ({ ...o, [q.id]: !o[q.id] }))}
                className="flex min-h-11 w-full cursor-pointer items-center gap-4 border-0 bg-transparent py-5 text-left font-head text-[calc(var(--fs-body)*1.04)] font-semibold leading-[1.45] text-ink hover:text-primary"
              >
                <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{tx(q.q, lang)}</span>
                <span
                  className={`grid size-8 flex-none place-items-center rounded-full bg-soft text-accent transition-transform duration-[350ms] ease-[cubic-bezier(.2,.7,.2,1)] ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  <Icon name="plus" />
                </span>
              </button>
              <div
                id={panel}
                role="region"
                className="grid transition-[grid-template-rows] duration-[400ms] ease-[cubic-bezier(.2,.7,.2,1)]"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                inert={!isOpen}
              >
                <div className="overflow-hidden">
                  <p className="m-0 pb-5 text-[calc(var(--fs-body)*.95)] leading-[1.75] text-ink2">{tx(q.a, lang)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
