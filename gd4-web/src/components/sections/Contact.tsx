import { Icon } from "@/components/Icon";
import { LocalLink } from "@/components/LocalLink";
import { SocialGlyph, socialBg, socialName } from "@/components/SocialIcon";
import { tx } from "@/i18n/config";
import { gridCols } from "@/lib/grid";
import { getDict } from "@/i18n/dictionary";
import type { ContactSection, IconName, Locale, SiteSettings } from "@/types/site";
import { ArrowNudge, cardCls, H2, telHref } from "./shared";

export function Contact({ s, lang, settings }: { s: ContactSection; lang: Locale; settings: SiteSettings }) {
  const t = getDict(lang);
  const c = settings.contact;
  const heading = tx(s.heading, lang);
  // เลือกเรื่องก่อน แล้วไปหาทีมที่ดูแลเรื่องนั้น
  const paths = s.items ?? [];
  const lines: [IconName, string, React.ReactNode, string?][] = [
    ["mail", t.c.email, c.email, `mailto:${c.email}`],
    ["pin", t.c.address, tx(c.address, lang)],
    ["clock", t.c.hours, tx(c.hours, lang)],
  ];
  const line = "flex gap-3.5 rounded-card border border-line bg-card p-[18px] text-ink";

  return (
    <div className="sec flex flex-col gap-10">
      {heading && <H2>{heading}</H2>}
      {paths.length > 0 && (
        <div className={`grid gap-4 ${gridCols(paths.length)}`}>
          {paths.map((x, i) => {
            const go = tx(x.btnLabel, lang);
            const body = (
              <>
                <span className={`grid size-[52px] place-items-center rounded-xl ${i === 1 ? "bg-accent/10 text-accent" : "bg-soft text-primary"}`}>
                  <Icon name={x.icon} size={24} />
                </span>
                <h3 className="m-0 font-head text-h3 font-semibold">{tx(x.title, lang)}</h3>
                <p className="m-0 text-[calc(var(--fs-body)*.92)] text-ink2">{tx(x.desc, lang)}</p>
                {x.btnUrl && go && (
                  <span className="mt-auto flex min-h-11 items-center gap-1.5 font-semibold text-primary">
                    {go}
                    <ArrowNudge />
                  </span>
                )}
              </>
            );
            // การ์ดที่ไม่มีลิงก์แสดงเป็นกล่องข้อความธรรมดา
            return x.btnUrl ? (
              <LocalLink key={x.id} href={x.btnUrl} className={`${cardCls} gap-2.5 p-[22px] hover:border-primary hover:text-ink`}>
                {body}
              </LocalLink>
            ) : (
              <div key={x.id} className={`${cardCls} gap-2.5 p-[22px]`}>
                {body}
              </div>
            );
          })}
        </div>
      )}

      <div id="reach" className="grid scroll-mt-28 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          {/* เบอร์โทรเด่นที่สุด เพราะเป็นช่องทางที่ลูกค้าใช้มากที่สุด */}
          <a href={telHref(c.phone)} className={`${line} hover:border-primary hover:text-ink`}>
            <span className="grid size-[52px] flex-none place-items-center rounded-xl bg-accent/10 text-accent">
              <Icon name="phone" size={24} />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[13px] text-ink2">{t.c.phone}</span>
              <span className="font-head text-[clamp(22px,2.6vw,28px)] font-bold leading-tight text-accent">{c.phone}</span>
            </span>
          </a>
          {lines.map(([icon, label, value, href]) => {
            if (!value) return null;
            const body = (
              <>
                <span className="grid size-[52px] flex-none place-items-center rounded-xl bg-soft text-primary">
                  <Icon name={icon} size={24} />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[13px] text-ink2">{label}</span>
                  <span className="font-semibold leading-[1.6] [overflow-wrap:anywhere]">{value}</span>
                </span>
              </>
            );
            return href ? (
              <a key={label} href={href} className={`${line} hover:border-primary hover:text-ink`}>
                {body}
              </a>
            ) : (
              <div key={label} className={line}>
                {body}
              </div>
            );
          })}
          {settings.socials.length > 0 && (
            <div className="flex flex-wrap gap-2.5 pt-1">
              {settings.socials.map((so) => (
                <a
                  key={so.id}
                  href={so.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full pl-1.5 pr-[18px] text-[15px] font-semibold text-white hover:text-white hover:brightness-110"
                  style={{ background: socialBg(so) }}
                >
                  <span className="grid size-8 place-items-center overflow-hidden rounded-full">
                    <SocialGlyph social={so} size={18} />
                  </span>
                  {socialName(so)}
                </a>
              ))}
            </div>
          )}
        </div>

        {c.mapEmbed ? (
          // แผนที่จากโค้ดฝังแผนที่ของ Google Maps มีการ์ดชื่อบริษัทและลิงก์ดูแผนที่ขนาดใหญ่ในตัว
          <iframe
            src={c.mapEmbed}
            title={t.openMap}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block min-h-[clamp(320px,45vw,520px)] w-full rounded-[16px] border border-line bg-soft"
          />
        ) : (
          // ยังไม่ได้ใส่โค้ดฝังแผนที่ แสดงภาพแผนที่ตัวอย่าง
          <div
            aria-hidden="true"
            className="grid min-h-[clamp(320px,45vw,520px)] place-items-center rounded-[16px] border border-line"
            style={{
              background:
                "repeating-linear-gradient(0deg,var(--c-line) 0 1px,transparent 1px 36px),repeating-linear-gradient(90deg,var(--c-line) 0 1px,var(--c-bg2) 1px 36px)",
            }}
          >
            <span className="grid size-[52px] place-items-center rounded-full bg-accent-solid text-white shadow-[0_10px_24px_rgba(200,49,42,.4)]">
              <Icon name="pin" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
