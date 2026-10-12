import { Fragment } from "react";
import { Icon } from "@/components/Icon";
import { LocalLink } from "@/components/LocalLink";
import type { SectionBg } from "@/types/site";

export const BG: Record<SectionBg, string> = {
  white: "bg-bg text-ink heading-ink",
  gray: "bg-bg2 text-ink heading-ink",
  blue: "bg-soft text-ink heading-ink",
  navy: "bg-panel text-white",
};

export function SectionShell({ bg = "white", anchor, label, previewId, children }: {
  bg?: SectionBg;
  anchor?: string;
  label?: string;
  /** ใช้ตอนดูตัวอย่างในหลังบ้าน คลิกแล้วเลือกส่วนนี้ในหน้าแก้ไขได้ */
  previewId?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={anchor} aria-label={label} data-sec="" data-sec-id={previewId} className={`relative overflow-hidden ${BG[bg]}`}>
      {children}
    </section>
  );
}

export function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`m-0 font-head text-h2 font-bold leading-[1.3] text-balance ${className}`}>{children}</h2>;
}

/** สีข้อความรอง เป็นสีเทาบนพื้นสว่าง และสีฟ้าอ่อนบนพื้นกรมท่า */
export const ink2 = (dark: boolean) => (dark ? "text-on-dark" : "text-ink2");

/** หน่วงเวลาให้แต่ละชิ้นค่อย ๆ ปรากฏทีละชิ้น ชิ้นละ 60 มิลลิวินาที สูงสุด 8 ชิ้น */
export const delay = (i: number) => ({ animationDelay: `${(Math.min(i, 8) * 0.06).toFixed(2)}s` });

export const btn = {
  accent:
    "inline-flex items-center gap-2.5 whitespace-nowrap rounded-btn bg-accent-solid px-[22px] py-3.5 text-btn font-semibold text-white hover:text-white hover:brightness-110",
  primary:
    "inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-btn bg-primary-solid px-5 py-3 text-btn font-semibold text-white hover:bg-primary-h hover:text-white",
  outlineLight:
    "inline-flex items-center whitespace-nowrap rounded-btn border-[1.5px] border-white/50 px-[22px] py-[13px] text-btn font-semibold text-white hover:bg-white/10 hover:text-white",
  outline:
    "inline-flex items-center whitespace-nowrap rounded-btn border-[1.5px] border-line px-5 py-3 font-semibold text-ink hover:text-primary",
};

/** กรอบการ์ดที่กดได้ ลอยขึ้นเล็กน้อยเมื่อชี้ ใช้กับการ์ดสินค้าและการ์ดหมวดสินค้า */
export const cardCls =
  "anim-up group flex h-full min-w-0 flex-col overflow-hidden rounded-card border border-line bg-card text-ink transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(.2,.7,.2,1)] hover:-translate-y-1 hover:shadow-card";

/** หัวข้อของส่วน มีข้อความรองด้านล่าง และลิงก์ดูทั้งหมดชิดขวา */
export function SecHead({ heading, sub, more, href = "/products" }: { heading: string; sub?: string; more?: string; href?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-2">
      <div className="flex max-w-[720px] flex-col gap-2">
        <H2>{heading}</H2>
        {sub && <p className="m-0 text-body text-ink2">{sub}</p>}
      </div>
      {more && (
        <LocalLink href={href} className="group inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary hover:text-primary">
          {more}
          <ArrowNudge />
        </LocalLink>
      )}
    </div>
  );
}

/** ลูกศรที่ขยับไปทางขวาเมื่อชี้ที่ลิงก์หรือการ์ดที่ครอบอยู่ */
export function ArrowNudge() {
  return (
    <span className="grid transition-transform duration-200 group-hover:translate-x-1">
      <Icon name="arrowR" />
    </span>
  );
}

/** ลายตารางจาง ๆ ด้านหลังส่วนหัว ค่อย ๆ ชัดขึ้นทางขวา */
export function GridBg() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(var(--c-line)_1px,transparent_1px),linear-gradient(90deg,var(--c-line)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(90deg,transparent,#000_60%)]"
    />
  );
}

/** ส่วนหัวของหน้าย่อย มีเส้นทางของหน้า หัวข้อ และคำโปรย ถ้าไม่ใส่หัวข้อจะเหลือแค่เส้นทาง
 * ใส่ของด้านขวาได้ เช่นรูปหรือการ์ดติดต่อด่วน จะแบ่งเป็นสองคอลัมน์บนจอใหญ่ */
export function PageIntro({ crumbs, heading, sub, aside, children }: {
  crumbs: { label: string; href?: string }[];
  heading?: string;
  sub?: string;
  aside?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const pad = heading ? (aside ? "pb-[calc(var(--sec-py)*.8)] pt-[calc(var(--sec-py)*.5)]" : "py-[calc(var(--sec-py)*.6)]") : "py-5";
  return (
    <>
      <GridBg />
      <div className={`relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-x-12 gap-y-8 px-[var(--sec-px)] ${pad} ${aside ? "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]" : ""}`}>
        <div className="flex min-w-0 flex-col gap-3.5">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-small text-ink2">
            {crumbs.map((c, i) => (
              <Fragment key={i}>
                {i > 0 && <Icon name="chevR" />}
                {c.href ? (
                  <LocalLink href={c.href} className="text-ink2 hover:text-primary">
                    {c.label}
                  </LocalLink>
                ) : (
                  <span className="font-medium text-ink" aria-current="page">
                    {c.label}
                  </span>
                )}
              </Fragment>
            ))}
          </nav>
          {heading && (
            <>
              <span className="mt-1 h-1 w-11 rounded-sm bg-accent-solid" />
              <h1 className="m-0 max-w-[820px] font-head text-h1 font-bold leading-[1.25] text-balance">{heading}</h1>
            </>
          )}
          {sub && <p className="m-0 max-w-[720px] text-[calc(var(--fs-body)*1.06)] text-pretty text-ink2">{sub}</p>}
          {children}
        </div>
        {aside}
      </div>
    </>
  );
}

/** การ์ดรูปพื้นขาวมุมโค้งมีเงา ใช้วางรูปเครื่องจักรหรือรูปทั่วไป */
export const plateCls = "relative overflow-hidden rounded-[20px] border border-line bg-white shadow-card";

/** ป้ายเล็กมุมมน ใส่สีพื้นและสีตัวอักษรเพิ่มเอง */
export const chipCls = "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold";

/** ลิงก์โทรออก เหลือแค่ตัวเลขกับเครื่องหมายบวก */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
