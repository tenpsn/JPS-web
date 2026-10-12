"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { LocalLink } from "@/components/LocalLink";
import { tx } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { Category, Product } from "@/types/site";
import { setCatalogQuery, syncUrl, useCatalogQuery } from "./catalogQuery";
import { CatalogSearch } from "./CatalogSearch";
import { ProductCard } from "./ProductCard";
import { btn, H2, telHref } from "./shared";

type Props = {
  heading: string;
  sub?: string;
  /** หมวดที่เลือกไว้ตอนเปิดหน้า ตั้งจากหลังบ้าน ถ้าลิงก์ระบุหมวดมาจะใช้หมวดจากลิงก์แทน */
  defaultCat?: string;
  products: Product[];
  categories: Category[];
  phone?: string;
  /** ข้อความในกล่องปรึกษาใต้แถบหมวด */
  help?: { title: string; desc: string; btn: string };
  /** ช่องค้นหาอยู่ในส่วนหัวของหน้าแล้ว รายการนี้จึงไม่ต้องมีช่องค้นหาของตัวเอง */
  searchInHeader?: boolean;
};

export function Catalog(props: Props & { serverRender?: boolean }) {
  if (props.serverRender) return <CatalogView {...props} initialCat={props.defaultCat ?? "all"} />;
  return <CatalogWithParams {...props} />;
}

function CatalogWithParams(props: Props) {
  const sp = useSearchParams();
  const cat = sp.get("cat") ?? props.defaultCat ?? "all";
  // เริ่มรายการใหม่เมื่อเปลี่ยนหมวด คำค้นเก็บแยกไว้ที่เดียว จึงไม่หายตอนเปลี่ยนหมวด
  return <CatalogView key={cat} {...props} initialCat={cat} />;
}

function CatalogView({ heading, sub, defaultCat = "all", products, categories, phone, help, searchInHeader, initialCat }: Props & { initialCat: string }) {
  const { lang, t } = useI18n();
  const [cat, setCat] = useState(categories.some((c) => c.id === initialCat) ? initialCat : "all");
  const q = useCatalogQuery();

  const update = (nextCat: string, nextQ: string) => {
    setCat(nextCat);
    setCatalogQuery(nextQ);
    syncUrl(nextQ.trim(), nextCat, defaultCat);
  };

  const term = q.trim().toLowerCase();
  const list = products.filter(
    (p) =>
      (cat === "all" || p.category === cat) &&
      (!term || p.sku.toLowerCase().includes(term) || p.name.th.toLowerCase().includes(term) || p.name.en.toLowerCase().includes(term)),
  );
  const catName = (id: string) => tx(categories.find((c) => c.id === id)?.name, lang);
  // คำค้นแนะนำใช้รหัสของสินค้าที่มีอยู่จริง
  const tryList = products.slice(0, 3).map((p) => p.sku);
  // จำนวนสินค้าในแต่ละหมวด ไม่ขึ้นกับคำค้น
  const counts = new Map<string, number>();
  for (const p of products) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  const chips: [string, string, number][] = [
    ["all", t.p.all, products.length],
    ...categories.map((c): [string, string, number] => [c.id, tx(c.name, lang), counts.get(c.id) ?? 0]),
  ];
  const title = cat === "all" ? heading : catName(cat);

  return (
    <div className="sec flex flex-col gap-8">
      {!searchInHeader && <CatalogSearch />}

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        {/* แถบหมวดด้านซ้ายบนจอใหญ่ ติดจอตอนเลื่อน มีกล่องปรึกษาอยู่ด้านล่าง */}
        <aside className="hidden flex-col gap-1 lg:sticky lg:top-24 lg:flex">
          <span className="mb-1.5 ml-3 text-small font-semibold text-ink2">{t.p.category}</span>
          {chips.map(([id, label, n]) => {
            const on = cat === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => update(id, q)}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-[10px] border-0 px-3 text-left font-medium transition-colors ${
                  on ? "bg-primary-solid text-white" : "bg-transparent text-ink hover:bg-soft hover:text-primary"
                }`}
              >
                <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
                <span className={`flex-none rounded-full px-2 text-[13px] ${on ? "bg-white/20 text-white" : "bg-bg2 text-ink2"}`}>{n}</span>
              </button>
            );
          })}
          {phone && help && (
            <div className="mt-4 flex flex-col gap-1.5 rounded-card bg-soft p-[18px]">
              <strong className="leading-snug">{help.title}</strong>
              <span className="text-[14.5px] text-ink2">{help.desc}</span>
              <a href={telHref(phone)} className={`${btn.accent} mt-2 min-h-11 justify-center px-4`}>
                <Icon name="phone" />
                {help.btn}
              </a>
            </div>
          )}
        </aside>

        <div className="flex min-w-0 flex-col gap-5">
          {/* บนจอเล็กหมวดเป็นปุ่มเรียงขึ้นบรรทัดใหม่ได้ ไม่ซ่อนปุ่มไว้นอกจอ */}
          <div className="flex flex-wrap gap-2 lg:hidden" role="group" aria-label={t.p.category}>
            {chips.map(([id, label, n]) => {
              const on = cat === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update(id, q)}
                  className={`min-h-11 cursor-pointer rounded-full border px-4 text-[14.5px] font-medium transition-colors duration-[250ms] ${
                    on ? "border-primary-solid bg-primary-solid text-white" : "border-line bg-card text-ink2 hover:border-primary hover:text-primary"
                  }`}
                >
                  {label} {n}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <H2 className="text-[calc(var(--fs-h2)*.75)]">{title}</H2>
              {sub && <p className="m-0 text-ink2">{sub}</p>}
            </div>
            <span className="text-small text-ink2" aria-live="polite">
              {list.length} {t.p.count}
            </span>
          </div>

          {list.length > 0 ? (
            <div className="grid grid-cols-1 gap-[18px] min-[360px]:grid-cols-2 xl:grid-cols-3">
              {list.map((p, i) => (
                <ProductCard key={p.id} p={p} cat={catName(p.category)} lang={lang} t={t} i={i} />
              ))}
            </div>
          ) : term ? (
            <Empty icon="search" title={`${t.p.noResT} “${q.trim()}”`} desc={t.p.noResD}>
              {tryList.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="text-sm text-ink3">{t.p.try}</span>
                  {tryList.map((x) => (
                    <button
                      key={x}
                      type="button"
                      onClick={() => update("all", x)}
                      className="min-h-9 cursor-pointer rounded-full border border-line bg-card px-3 font-mono text-[13px] font-semibold text-ink hover:border-primary-solid hover:text-primary"
                    >
                      {x}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => update("all", "")}
                className="min-h-11 cursor-pointer rounded-btn border border-line bg-transparent px-[18px] text-btn font-semibold text-ink"
              >
                {t.p.clear}
              </button>
            </Empty>
          ) : (
            <Empty icon="box" title={t.p.emptyT} desc={t.p.emptyD}>
              <LocalLink href="/contact" className={btn.primary}>
                {t.p.askSales}
              </LocalLink>
            </Empty>
          )}
        </div>
      </div>
    </div>
  );
}

function Empty({ icon, title, desc, children }: { icon: "search" | "box"; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="anim-up flex flex-col items-center gap-3.5 rounded-card border-[1.5px] border-dashed border-line px-5 py-14 text-center">
      <span className="grid size-[72px] place-items-center rounded-[20px] bg-soft text-primary">
        <Icon name={icon} />
      </span>
      <h3 className="m-0 font-head text-h3 font-semibold [overflow-wrap:anywhere]">{title}</h3>
      <p className="m-0 max-w-[480px] text-[calc(var(--fs-body)*.94)] text-ink2">{desc}</p>
      {children}
    </div>
  );
}
