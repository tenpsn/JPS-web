import { Icon } from "@/components/Icon";
import { LocalLink } from "@/components/LocalLink";
import { Media } from "@/components/Media";
import { tx } from "@/i18n/config";
import { getDict } from "@/i18n/dictionary";
import { gridCols, gridMax } from "@/lib/grid";
import type {
  CardsSection,
  CtaSection,
  GallerySection,
  IconName,
  Locale,
  LogosSection,
  PageHeaderSection,
  SiteSettings,
  StatsSection,
  StepsSection,
  TableSection,
  TextImageSection,
  TextSection,
  TimelineSection,
} from "@/types/site";
import { CatalogSearch } from "./CatalogSearch";
import { CountUp } from "./CountUp";
import { btn, cardCls, chipCls, delay, H2, ink2, PageIntro, plateCls, telHref } from "./shared";

type P<S> = { s: S; lang: Locale; dark: boolean };

export function PageHeader({ s, lang, crumb, settings, search }: P<PageHeaderSection> & { crumb: string; settings: SiteSettings; search?: boolean }) {
  const t = getDict(lang);
  const heading = tx(s.heading, lang);
  const aside =
    s.side === "contact" ? (
      <QuickContact settings={settings} lang={lang} />
    ) : s.side === "image" && s.img ? (
      // รูปวางบนการ์ดขาวแบบเดียวกับฮีโร่หน้าแรก
      <div className={`${plateCls} aspect-[16/11]`}>
        <div className="absolute inset-5 sm:inset-7">
          <Media img={s.img} alt={heading} fit="contain" priority sizes="(min-width: 1024px) 50vw, 100vw" />
        </div>
      </div>
    ) : null;
  return (
    <PageIntro crumbs={[{ label: t.home, href: "/" }, { label: crumb }]} heading={heading} sub={tx(s.sub, lang)} aside={aside}>
      {search && (
        <div className="pt-1.5">
          <CatalogSearch />
        </div>
      )}
    </PageIntro>
  );
}

/** การ์ดติดต่อด่วน ใช้เบอร์โทร เวลาทำการ และ LINE จากหน้าตั้งค่า */
function QuickContact({ settings, lang }: { settings: SiteSettings; lang: Locale }) {
  const t = getDict(lang);
  const c = settings.contact;
  const hours = tx(c.hours, lang);
  const line = settings.socials.find((x) => x.platform === "line");
  return (
    <div className="flex min-w-0 flex-col gap-3.5 rounded-card border border-line bg-card p-[clamp(20px,3vw,28px)] shadow-card">
      <span className={`${chipCls} bg-accent/10 text-accent`}>
        <Icon name="clock" size={14} />
        {t.quick}
      </span>
      <a href={telHref(c.phone)} className="w-fit font-head text-[clamp(28px,3.2vw,36px)] font-bold leading-[1.1] text-accent hover:text-accent">
        {c.phone}
      </a>
      {hours && (
        <span className="flex items-start gap-2.5 text-ink2">
          <Icon name="clock" />
          {hours}
        </span>
      )}
      {c.email && (
        <a href={`mailto:${c.email}`} className="flex w-fit items-center gap-2.5 text-ink2 [overflow-wrap:anywhere] hover:text-primary">
          <Icon name="mail" />
          {c.email}
        </a>
      )}
      <div className="flex flex-wrap gap-3 pt-1">
        <a href={telHref(c.phone)} className={`${btn.accent} min-h-12 flex-1 justify-center`}>
          <Icon name="phone" />
          {t.callUs}
        </a>
        {line && (
          <a
            href={line.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-btn bg-[#06c755] px-[22px] text-btn font-semibold text-white hover:text-white hover:brightness-105"
          >
            LINE
          </a>
        )}
      </div>
    </div>
  );
}

export function Text({ s, lang, dark }: P<TextSection>) {
  return (
    <div className="sec">
      <div className="flex max-w-[780px] flex-col gap-4">
        <H2>{tx(s.heading, lang)}</H2>
        <p className={`m-0 text-body leading-[1.85] text-pretty ${ink2(dark)}`}>{tx(s.body, lang)}</p>
      </div>
    </div>
  );
}

/** แยกเนื้อหาเป็นย่อหน้ากับรายการ บรรทัดที่ขึ้นต้นด้วยขีดหรือจุดจะแสดงเป็นรายการมีเครื่องหมายถูก */
function splitBody(body: string) {
  const paras: string[] = [];
  const points: string[] = [];
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^[-•*]\s*(.+)$/);
    if (m) points.push(m[1]);
    else paras.push(line);
  }
  return { paras, points };
}

export function TextImage({ s, lang, dark }: P<TextImageSection>) {
  const label = tx(s.btnLabel, lang);
  const { paras, points } = splitBody(tx(s.body, lang));
  const right = s.imgSide === "right";
  return (
    <div className="sec grid grid-cols-1 items-center gap-[clamp(40px,6vw,64px)] lg:grid-cols-2">
      <div className={`flex min-w-0 flex-col gap-4 ${right ? "lg:order-1" : "lg:order-2"}`}>
        <H2>{tx(s.heading, lang)}</H2>
        {paras.map((p, i) => (
          <p key={i} className={`m-0 text-body leading-[1.85] text-pretty ${ink2(dark)}`}>
            {p}
          </p>
        ))}
        {points.length > 0 && (
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {points.map((p, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 grid size-[22px] flex-none place-items-center rounded-full bg-primary-solid text-white">
                  <Icon name="check" size={14} />
                </span>
                <span className="leading-[1.7]">{p}</span>
              </li>
            ))}
          </ul>
        )}
        {label && s.btnUrl && (
          <LocalLink href={s.btnUrl} className={`${btn.primary} min-h-12`}>
            {label}
            <Icon name="arrowR" />
          </LocalLink>
        )}
      </div>
      {/* รูปมีกรอบเส้นแดงเยื้องอยู่ด้านหลัง */}
      <div className={`relative ${right ? "lg:order-2" : "lg:order-1"}`}>
        <span aria-hidden="true" className="absolute inset-[18px_-18px_-18px_18px] rounded-[20px] border-2 border-accent-solid/35 max-sm:inset-[12px_-10px_-12px_10px]" />
        <div className={`${plateCls} aspect-[4/3]`}>
          <Media img={s.img} alt={tx(s.heading, lang)} />
        </div>
      </div>
    </div>
  );
}

export function Cards({ s, lang, dark }: P<CardsSection>) {
  const sub = tx(s.sub, lang);
  return (
    <div className="sec flex flex-col gap-9">
      <div className="flex max-w-[720px] flex-col gap-2.5">
        <H2>{tx(s.heading, lang)}</H2>
        {sub && <p className={`m-0 text-body ${ink2(dark)}`}>{sub}</p>}
      </div>
      <div className={`grid w-full gap-[18px] ${gridCols(s.items.length, { cols: s.cols })} ${gridMax(s.items.length)}`}>
        {s.items.map((c, i) => (
          <article key={c.id} style={delay(i)} className={`${cardCls} gap-3.5 p-[26px]`}>
            {/* ไอคอนสลับสีน้ำเงินกับแดงทีละใบ */}
            <span className={`grid size-[52px] flex-none place-items-center rounded-xl ${i % 2 ? "bg-accent/10 text-accent" : "bg-soft text-primary"}`}>
              <Icon name={c.icon} size={24} />
            </span>
            <h3 className="clamp-2 m-0 pb-[.06em] font-head text-h3 font-semibold leading-normal [overflow-wrap:anywhere]">{tx(c.title, lang)}</h3>
            <p className="clamp-4 m-0 text-[calc(var(--fs-body)*.92)] leading-[1.7] text-ink2">{tx(c.desc, lang)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function Stats({ s, lang, dark }: P<StatsSection>) {
  const heading = tx(s.heading, lang);
  // เลือกรูปแบบได้เอง ถ้ายังไม่ได้เลือก ใช้แถบบนพื้นกรมท่าและการ์ดบนพื้นสว่างแบบเดิม
  const band = (s.style ?? (dark ? "band" : "card")) === "band";
  const value = dark ? "text-white" : "text-primary";
  if (!band) {
    return (
      <div className="mx-auto flex max-w-[1200px] flex-col gap-7 px-[var(--sec-px)] py-[calc(var(--sec-py)*.5)]">
        {heading && <H2 className="text-[calc(var(--fs-h2)*.8)]">{heading}</H2>}
        <div className={`grid overflow-hidden rounded-[16px] border ${dark ? "border-white/15 bg-white/5" : "border-line bg-card shadow-card"} ${gridCols(s.items.length, { m: 2 })}`}>
          {s.items.map((c, i) => (
            <div key={c.id} style={delay(i)} className={`anim-up flex min-w-0 flex-col gap-1 border-l border-t px-6 py-[22px] [margin:-1px_0_0_-1px] ${dark ? "border-white/15" : "border-line"}`}>
              <span className={`whitespace-nowrap font-head text-[calc(var(--fs-h2)*1.05)] font-bold leading-[1.15] tabular-nums ${value}`}>
                <CountUp value={tx(c.value, lang)} />
              </span>
              <span className={`text-[calc(var(--fs-body)*.88)] leading-normal text-balance ${ink2(dark)}`}>{tx(c.label, lang)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-[var(--sec-px)] py-[calc(var(--sec-py)*.65)]">
      {/* เว้นหัวข้อว่างไว้ได้ ถ้าอยากให้เหลือแค่แถบตัวเลข */}
      {heading && <H2 className="text-[calc(var(--fs-h2)*.8)]">{heading}</H2>}
      <div className={`grid w-full gap-x-6 gap-y-8 ${gridCols(s.items.length, { m: 2 })}`}>
        {s.items.map((c, i) => (
          <div key={c.id} style={delay(i)} className="anim-up flex min-w-0 flex-col gap-1 border-l-[3px] border-accent-solid pl-[18px]">
            <span className={`whitespace-nowrap font-head text-[calc(var(--fs-h2)*1.3)] font-bold leading-[1.15] tabular-nums ${value}`}>
              <CountUp value={tx(c.value, lang)} />
            </span>
            <span className={`text-[calc(var(--fs-body)*.9)] leading-normal text-balance ${ink2(dark)}`}>{tx(c.label, lang)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Logos({ s, lang }: P<LogosSection>) {
  const marquee = s.items.length >= 6;
  const box = "grid h-20 place-items-center rounded-card border border-line bg-card px-4 text-center text-[17px] font-bold text-ink2";
  // มีแค่รูปหรือแค่ชื่อ แสดงไว้ตรงกลาง ถ้ามีทั้งสองอย่าง วางรูปไว้หน้าชื่อ
  const logo = (x: LogosSection["items"][number]) => {
    const img = x.logo && x.logo !== "placeholder" ? x.logo : null;
    const name = x.name.trim();
    if (!img) return name;
    return (
      <span className="flex min-w-0 max-w-full items-center justify-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element -- โลโก้แต่ละอันขนาดไม่เท่ากัน ต้องคงสัดส่วนเดิมของรูป */}
        <img src={img} alt={name ? "" : x.name} className={`${name ? "max-h-10 max-w-[45%]" : "max-h-12 max-w-full"} flex-none object-contain`} />
        {name && <span className="clamp-2 min-w-0 text-left leading-tight [overflow-wrap:anywhere]">{name}</span>}
      </span>
    );
  };
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-7 px-[var(--sec-px)] py-[calc(var(--sec-py)*.75)]">
      <H2 className="text-center text-[calc(var(--fs-h2)*.8)]">{tx(s.heading, lang)}</H2>
      {marquee ? (
        <div className="group w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
          <div className="flex w-max gap-3.5 [animation:s-marq_32s_linear_infinite] group-hover:[animation-play-state:paused]">
            {[...s.items, ...s.items].map((x, i) => (
              <span key={`${x.id}-${i}`} aria-hidden={i >= s.items.length} className={`w-[190px] flex-none ${box}`}>
                {logo(x)}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-wrap justify-center gap-3.5">
          {s.items.map((x) => (
            <span key={x.id} className={`flex-[0_1_200px] ${box}`}>
              {logo(x)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function Timeline({ s, lang }: P<TimelineSection>) {
  const last = s.items.length - 1;
  return (
    <div className="sec flex flex-col gap-10">
      <H2>{tx(s.heading, lang)}</H2>
      {/* เส้นเวลาแนวนอนบนจอกว้าง แนวตั้งบนมือถือ เหตุการณ์ล่าสุดเป็นสีแดง */}
      <ol
        className={`relative m-0 grid list-none gap-x-5 gap-y-7 p-0 pl-8 before:absolute before:bottom-0 before:left-2 before:top-0 before:w-0.5 before:bg-line sm:pl-0 sm:pt-[30px] sm:before:inset-x-0 sm:before:bottom-auto sm:before:top-[9px] sm:before:h-0.5 sm:before:w-auto ${gridCols(s.items.length, { m: 1 })}`}
      >
        {s.items.map((c, i) => {
          const now = i === last;
          return (
            <li key={c.id} style={delay(i)} className="anim-up relative flex flex-col gap-1.5">
              <span
                aria-hidden="true"
                className={`absolute -left-8 top-2.5 size-[18px] rounded-full border-4 bg-bg sm:-top-[30px] sm:left-0 ${
                  now ? "border-accent-solid shadow-[0_0_0_6px_color-mix(in_srgb,var(--c-accent-solid)_18%,transparent)]" : "border-primary-solid"
                }`}
              />
              <span className={`font-mono text-[calc(var(--fs-h3)*1.35)] font-semibold ${now ? "text-accent" : "text-primary"}`}>{c.year}</span>
              <span className="text-[calc(var(--fs-body)*.95)] leading-[1.6] text-ink2">{tx(c.event, lang)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function Gallery({ s, lang }: P<GallerySection>) {
  // มี 4 รูปพอดี จัดเป็นเบนโต รูปแรกใหญ่ รูปสุดท้ายกว้าง ถ้าจำนวนอื่นเป็นตารางปกติ
  const bento = s.items.length === 4;
  const span = (i: number) => (!bento ? "aspect-[4/3]" : i === 0 ? "col-span-2 aspect-[4/3] lg:col-span-1 lg:row-span-2 lg:aspect-auto" : i === 3 ? "col-span-2 aspect-[2/1] lg:aspect-auto" : "aspect-[4/3] lg:aspect-auto");
  return (
    <div className="sec flex flex-col gap-8">
      <H2>{tx(s.heading, lang)}</H2>
      <div className={bento ? "grid grid-cols-2 gap-4 lg:grid-cols-[2fr_1fr_1fr] lg:grid-rows-[220px_220px]" : `grid gap-4 ${gridCols(s.items.length)} ${gridMax(s.items.length)}`}>
        {s.items.map((c, i) => {
          const cap = tx(c.caption, lang);
          return (
            <figure key={c.id} style={delay(i)} className={`anim-up relative m-0 min-w-0 overflow-hidden rounded-[16px] border border-line bg-bg2 ${span(i)}`}>
              <Media img={c.img} alt={cap} label={false} sizes="(min-width: 1024px) 40vw, 50vw" />
              {cap && (
                <figcaption className="absolute bottom-3 left-3 right-3 w-fit max-w-[calc(100%-24px)] rounded-full bg-[rgba(10,31,68,.85)] px-3 py-1.5 text-[14px] leading-snug text-white">
                  {cap}
                </figcaption>
              )}
            </figure>
          );
        })}
      </div>
    </div>
  );
}

/** แถบสิทธิประโยชน์ ไอคอนเลือกได้ทีละรายการ รายการที่ยังไม่ได้เลือกใช้ไอคอนตามลำดับนี้ */
const PERK_ICONS: IconName[] = ["factory", "users", "shield", "wrench", "clock", "check"];
export function Table({ s, lang }: P<TableSection>) {
  return (
    <div className="sec flex flex-col gap-8">
      <H2>{tx(s.heading, lang)}</H2>
      <dl className={`m-0 grid overflow-hidden rounded-[16px] border border-line bg-card ${gridCols(s.items.length, { t: 2 })}`}>
        {s.items.map((r, i) => (
          <div key={r.id} style={delay(i)} className="anim-up flex min-w-0 gap-3.5 border-l border-t border-line p-[22px] [margin:-1px_0_0_-1px]">
            <span className={`grid size-[52px] flex-none place-items-center rounded-xl ${i % 2 ? "bg-accent/10 text-accent" : "bg-soft text-primary"}`}>
              <Icon name={r.icon ?? PERK_ICONS[i % PERK_ICONS.length]} size={24} />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <dt className="font-semibold [overflow-wrap:anywhere]">{tx(r.c1, lang)}</dt>
              <dd className="m-0 text-[calc(var(--fs-body)*.88)] text-ink2">{tx(r.c2, lang)}</dd>
            </span>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function Cta({ s, lang, dark }: P<CtaSection>) {
  const b1 = tx(s.btnLabel, lang);
  const b2 = tx(s.btn2Label, lang);
  const sub = tx(s.sub, lang);
  const tel = (u: string) => (u.startsWith("tel:") ? <Icon name="phone" /> : null);
  return (
    <div className={`mx-auto max-w-[1200px] px-[var(--sec-px)] ${dark ? "py-[calc(var(--sec-py)*.8)]" : "py-[calc(var(--sec-py)*.6)]"}`}>
      {/* กล่องสีน้ำเงินมีวงแหวนสีแดงที่มุม ล้อกับวงกลมในโลโก้ บนพื้นกรมท่าใช้กล่องโปร่งมีเส้นขอบแทน จะได้ไม่กลืนกัน */}
      <div
        className={`relative grid grid-cols-1 items-center gap-7 overflow-hidden rounded-[20px] p-[clamp(28px,5vw,48px)] text-white [--c-heading:#fff] lg:grid-cols-[minmax(0,1fr)_auto] ${
          dark ? "border border-white/20 bg-white/5" : "bg-[linear-gradient(120deg,var(--c-panel),var(--c-primary-solid)_60%,var(--c-panel))]"
        }`}
      >
        <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 size-60 rounded-full border-[28px] border-accent-solid/35" />
        <div className="relative flex flex-col gap-2">
          <H2>{tx(s.heading, lang)}</H2>
          {sub && <p className="m-0 text-body text-on-dark">{sub}</p>}
        </div>
        <div className="relative flex flex-wrap gap-3">
          {b1 && s.btnUrl && (
            <LocalLink href={s.btnUrl} className={`${btn.accent} min-h-12 px-6`}>
              {tel(s.btnUrl)}
              {b1}
            </LocalLink>
          )}
          {b2 && s.btn2Url && (
            <LocalLink href={s.btn2Url} className={`${btn.outlineLight} min-h-12 gap-2`}>
              {tel(s.btn2Url)}
              {b2}
            </LocalLink>
          )}
        </div>
      </div>
    </div>
  );
}

export function Steps({ s, lang }: P<StepsSection>) {
  const last = s.items.length - 1;
  return (
    <div className="sec flex flex-col gap-10">
      <H2>{tx(s.heading, lang)}</H2>
      {/* เลขขั้นตอนอยู่บนขอบการ์ด มีเส้นเชื่อมระหว่างการ์ดบนจอกว้าง ขั้นสุดท้ายเป็นสีแดง */}
      <ol className={`m-0 grid list-none gap-x-5 gap-y-10 p-0 pt-4 ${gridCols(s.items.length)} ${gridMax(s.items.length)}`}>
        {s.items.map((c, i) => (
          <li
            key={c.id}
            style={delay(i)}
            className={`anim-up relative flex h-full min-w-0 flex-col gap-2.5 rounded-card border border-line bg-card px-[22px] pb-[22px] pt-[30px] text-ink ${
              i < last ? "lg:after:absolute lg:after:-right-[21px] lg:after:top-1/2 lg:after:h-0.5 lg:after:w-5 lg:after:bg-line" : ""
            }`}
          >
            <span
              className={`absolute -top-[17px] left-[22px] grid size-[34px] place-items-center rounded-full font-mono text-[14px] font-semibold text-white shadow-[0_0_0_5px_var(--c-bg)] ${
                i === last ? "bg-accent-solid" : "bg-primary-solid"
              }`}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="m-0 font-head text-h3 font-semibold leading-[1.4] [overflow-wrap:anywhere]">{tx(c.title, lang)}</h3>
            <p className="m-0 text-[calc(var(--fs-body)*.92)] leading-[1.65] text-ink2">{tx(c.desc, lang)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
