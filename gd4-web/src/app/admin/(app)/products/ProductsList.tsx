"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition } from "react";
import { AIcon } from "@/admin/AIcon";
import { useAdmin } from "@/admin/context";
import { fmtDate, relDate } from "@/admin/i18n";
import { btn, Confirm, PAGE_SIZE, PageHead, Pager, Pill, useToast } from "@/admin/ui";
import type { Category, Product } from "@/types/site";
import { deleteProducts, moveProducts, setProductsStatus } from "../../actions/products";
import { CategoriesModal } from "./CategoriesModal";

type Row = Pick<Product, "id" | "sku" | "name" | "category" | "status" | "img" | "updatedAt" | "updatedBy">;
const PER = PAGE_SIZE;
const VIEW_KEY = "admin-products-view";

const viewSubs = new Set<() => void>();
const readView = (): "table" | "cards" => {
  try {
    return localStorage.getItem(VIEW_KEY) === "table" ? "table" : "cards";
  } catch {
    return "cards";
  }
};
const setView = (v: "table" | "cards") => {
  try {
    localStorage.setItem(VIEW_KEY, v);
  } catch {}
  viewSubs.forEach((f) => f());
};

/** รูปย่อสินค้า แสดงเครื่องเต็มรูปบนพื้นขาวแบบการ์ดหน้าเว็บ ถ้ายังไม่มีรูปเป็นภาพลายทางพร้อมรหัสสินค้า */
export function Thumb({ img, sku, className, text = "text-[10px]" }: { img: Product["img"]; sku: string; className: string; text?: string }) {
  const real = img && img !== "placeholder";
  return (
    <span
      className={`grid place-items-center border border-line bg-center bg-no-repeat font-mono font-medium text-ph-ink ${real ? "bg-white bg-contain bg-origin-content p-1.5" : ""} ${text} ${className}`}
      style={{ backgroundImage: real ? `url(${img})` : "repeating-linear-gradient(135deg,var(--ph1) 0 6px,var(--ph2) 6px 12px)" }}
    >
      {!real && sku}
    </span>
  );
}

export function ProductsList({ products, categories, users, initialQ, initialStatus = "all", canEdit, canPub, canDel }: {
  products: Row[];
  categories: Category[];
  users: Record<number, string>;
  initialQ: string;
  initialStatus?: string;
  canEdit: boolean;
  canPub: boolean;
  canDel: boolean;
}) {
  const { lang, t } = useAdmin();
  const ol = lang === "th" ? "en" : "th";
  const router = useRouter();
  const toast = useToast();
  const [q, setQ] = useState(initialQ);
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<string[] | null>(null);
  const [catsOpen, setCatsOpen] = useState(false);
  const [pending, start] = useTransition();
  const view = useSyncExternalStore((f) => (viewSubs.add(f), () => viewSubs.delete(f)), readView, () => "table" as const);

  // เมื่อค้นหาจากแถบด้านบน ให้ใช้คำค้นนั้นในหน้านี้ด้วย
  const [lastQ, setLastQ] = useState(initialQ);
  if (initialQ !== lastQ) {
    setLastQ(initialQ);
    setQ(initialQ);
    setPage(1);
  }

  const catName = (id: string) => categories.find((c) => c.id === id)?.name[lang] ?? "—";
  const term = q.trim().toLowerCase();
  const filtered = products.filter(
    (p) =>
      (cat === "all" || p.category === cat) &&
      (status === "all" || p.status === status) &&
      (!term || p.name.th.toLowerCase().includes(term) || p.name.en.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PER));
  const cur = Math.min(page, pages);
  const items = filtered.slice((cur - 1) * PER, cur * PER);
  const isFiltered = !!term || cat !== "all" || status !== "all";
  const allChecked = items.length > 0 && items.every((p) => sel.includes(p.id));
  // เลือกข้ามหน้าและข้ามตัวกรองได้ นับสินค้าที่เลือกไว้แต่ไม่ได้แสดงในหน้านี้
  const offPage = sel.filter((id) => !items.some((p) => p.id === id)).length;

  // เลือกหลายรายการได้เมื่อมีสิทธิ์ทำอย่างใดอย่างหนึ่งกับสินค้าที่เลือก
  const canSel = canDel || canEdit || canPub;
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const clearFilters = () => {
    setQ("");
    setCat("all");
    setStatus("all");
    setPage(1);
  };

  // ทำกับสินค้าที่เลือกไว้ทั้งหมดพร้อมกัน แล้วล้างการเลือก
  const doStatus = (st: "pub" | "draft") =>
    start(async () => {
      const res = await setProductsStatus(sel, st);
      setSel([]);
      const skipped = res.skipped ? " · " + t.prod.skipped.replace("{n}", String(res.skipped)) : "";
      toast("ok", t.prod.pubDone.replace("{n}", String(res.count)) + skipped);
      router.refresh();
    });
  const doMove = (to: string) => {
    if (!to) return;
    start(async () => {
      const res = await moveProducts(sel, to);
      setSel([]);
      if (res.ok) toast("ok", t.prod.moved.replace("{n}", String(res.count)));
      else toast("err", t.toast.fix);
      router.refresh();
    });
  };

  const doDelete = (ids: string[]) =>
    start(async () => {
      try {
        const res = await deleteProducts(ids);
        setSel((s) => s.filter((x) => !ids.includes(x)));
        setConfirm(null);
        toast("ok", `${t.toast.deleted} (${res.count})`);
        router.refresh();
      } catch {
        toast("err", t.toast.fix);
      }
    });

  const st = (s: Row["status"]) => (s === "pub" ? <Pill tone="green">{t.prod.pub}</Pill> : <Pill tone="amber">{t.prod.draft}</Pill>);
  const by = (id?: number) => (id ? users[id] ?? "—" : "—");
  const editHref = (p: Row) => `/admin/products/${p.id}`;
  const check = (p: Row, size = "size-[18px]") =>
    canSel && (
      <input
        type="checkbox"
        checked={sel.includes(p.id)}
        onChange={() => toggle(p.id)}
        aria-label={p.name[lang]}
        className={`${size} block cursor-pointer accent-[var(--blue-solid)]`}
      />
    );
  const actions = (p: Row) => (
    <>
      <Link href={editHref(p)} aria-label={t.c.edit} title={t.c.edit} className={btn.icon}>
        <AIcon name="edit" />
      </Link>
      {canDel && (
        <button type="button" onClick={() => setConfirm([p.id])} aria-label={t.c.del} title={t.c.del} className={btn.iconDanger}>
          <AIcon name="trash" />
        </button>
      )}
    </>
  );

  const counts = {
    pub: products.filter((p) => p.status === "pub").length,
    draft: products.filter((p) => p.status === "draft").length,
    cat: products.reduce<Record<string, number>>((m, p) => ((m[p.category] = (m[p.category] ?? 0) + 1), m), {}),
  };
  const sideBtn = (on: boolean) =>
    "flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-[10px] border-0 px-3 text-left text-[15px] font-medium transition-colors " +
    (on ? "bg-blue-solid text-white" : "bg-transparent text-ink hover:bg-soft hover:text-blue");
  const sideCnt = (on: boolean) => "flex-none rounded-full px-2 text-[13px] " + (on ? "bg-white/20 text-white" : "bg-surface2 text-ink2");
  const bulkBtn =
    "inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-white/35 bg-transparent px-3.5 text-[14.5px] font-semibold text-white hover:bg-white/10 disabled:opacity-60";
  const selectCls = "min-h-11 cursor-pointer rounded-lg border border-line bg-field px-3 text-[15px] text-ink outline-none focus:border-blue-solid";

  return (
    <div className="flex flex-col gap-[18px]">
      <PageHead
        title={t.prod.title}
        sub={t.prod.sub.replace("{n}", String(products.length)).replace("{p}", String(counts.pub)).replace("{d}", String(counts.draft))}
        actions={
        <>
          {canEdit && (
            <button type="button" onClick={() => setCatsOpen(true)} className={btn.outline}>
              <AIcon name="grid" />
              {t.prod.cats}
            </button>
          )}
          {canEdit && (
            <Link href="/admin/products/new" className={btn.primary}>
              <AIcon name="plus" />
              {t.prod.add}
            </Link>
          )}
        </>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
      {/* แถบตัวกรองด้านซ้ายบนจอใหญ่ แบบแถบหมวดของหน้าสินค้าบนเว็บ */}
      <aside className="hidden flex-col gap-1 lg:sticky lg:top-2 lg:flex" aria-label={t.prod.filters}>
        <span className="mb-1 ml-3 text-sm font-semibold text-ink2">{t.prod.colCat}</span>
        {[["all", t.prod.allCats, products.length] as const, ...categories.map((c) => [c.id, c.name[lang], counts.cat[c.id] ?? 0] as const)].map(([id, name, n]) => (
          <button key={id} type="button" aria-pressed={cat === id} onClick={() => (setCat(id), setPage(1))} className={sideBtn(cat === id)}>
            <span className="min-w-0 [overflow-wrap:anywhere]">{name}</span>
            <span className={sideCnt(cat === id)}>{n}</span>
          </button>
        ))}
        <span className="mb-1 ml-3 mt-4 text-sm font-semibold text-ink2">{t.prod.colStatus}</span>
        {([["all", t.prod.allStatus, products.length], ["pub", t.prod.pub, counts.pub], ["draft", t.prod.draft, counts.draft]] as const).map(([id, name, n]) => (
          <button key={id} type="button" aria-pressed={status === id} onClick={() => (setStatus(id), setPage(1))} className={sideBtn(status === id)}>
            <span>{name}</span>
            <span className={sideCnt(status === id)}>{n}</span>
          </button>
        ))}
      </aside>

      <div className="flex min-w-0 flex-col gap-[18px]">
      <div className="flex flex-wrap items-end gap-2.5">
        <label className="flex flex-[1_1_240px] flex-col gap-1.5">
          <span className="text-sm font-semibold">{t.prod.search}</span>
          <span className="relative block">
          <span className="pointer-events-none absolute left-3 top-1/2 grid -translate-y-1/2 text-ink3">
            <AIcon name="search" />
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder={t.prod.search}
            className="field min-h-11 pl-10"
          />
          </span>
        </label>
        <select value={cat} onChange={(e) => (setCat(e.target.value), setPage(1))} aria-label={t.prod.colCat} className={`${selectCls} flex-[1_1_180px] lg:hidden`}>
          <option value="all">{t.prod.allCats}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name[lang]}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))} aria-label={t.prod.colStatus} className={`${selectCls} flex-[1_1_150px] lg:hidden`}>
          <option value="all">{t.prod.allStatus}</option>
          <option value="pub">{t.prod.pub}</option>
          <option value="draft">{t.prod.draft}</option>
        </select>
        <div className="hidden gap-0.5 rounded-[10px] border border-line bg-surface p-[3px] md2:flex" role="group">
          {(["table", "cards"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-label={t.prod[v]}
              aria-pressed={view === v}
              title={t.prod[v]}
              className={`grid h-9 w-[38px] cursor-pointer place-items-center rounded-md border-0 transition-colors duration-[250ms] ${
                view === v ? "bg-soft text-blue" : "bg-transparent text-ink2"
              }`}
            >
              <AIcon name={v === "table" ? "list" : "grid"} />
            </button>
          ))}
        </div>
      </div>

      {sel.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl bg-navy py-2.5 pl-4 pr-3 text-white [animation:a-up_.3s_cubic-bezier(.2,.7,.2,1)_both]">
          <span className="flex flex-[1_1_160px] flex-col gap-0.5">
            <strong className="text-[14.5px]">
              {t.c.selected} {sel.length} {t.c.items}
            </strong>
            {offPage > 0 && (
              <span className="text-[13px] text-[#c4d3ec]">{lang === "th" ? `ในนี้มี ${offPage} รายการที่เลือกไว้จากหน้าอื่น` : `${offPage} of them selected on other pages`}</span>
            )}
          </span>
          {canPub && (
            <button type="button" disabled={pending} onClick={() => doStatus("pub")} className={bulkBtn}>
              <AIcon name="check" />
              {t.prod.bulkPub}
            </button>
          )}
          {canEdit && (
            <button type="button" disabled={pending} onClick={() => doStatus("draft")} className={bulkBtn}>
              {t.prod.bulkDraft}
            </button>
          )}
          {canEdit && (
            <select value="" disabled={pending} onChange={(e) => doMove(e.target.value)} aria-label={t.prod.bulkMove} className={bulkBtn}>
              <option value="">{t.prod.bulkMove}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="text-ink">
                  {c.name[lang]}
                </option>
              ))}
            </select>
          )}
          {canDel && (
          <button type="button" onClick={() => setConfirm(sel)} className={`${btn.danger} min-h-10 px-3.5 text-[14.5px]`}>
            <AIcon name="trash" />
            {t.c.delSel}
          </button>
          )}
          <button type="button" onClick={() => setSel([])} aria-label={t.c.clear} title={t.c.clear} className="grid size-10 cursor-pointer place-items-center rounded-full border-0 bg-white/10 text-white hover:bg-white/20">
            <AIcon name="x" />
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="card flex flex-col items-center gap-3.5 px-6 py-16 text-center [animation:a-up_.5s_both]">
          <span className="grid size-[68px] place-items-center rounded-[18px] bg-soft text-blue">
            <AIcon name={isFiltered && products.length ? "search" : "box"} size={28} />
          </span>
          <strong className="text-[19px]">{isFiltered && products.length ? t.prod.emptyT : t.prod.noneT}</strong>
          <p className="m-0 max-w-[400px] text-[15px] leading-[1.6] text-ink2">{isFiltered && products.length ? t.prod.emptyD : t.prod.noneD}</p>
          {isFiltered && products.length ? (
            <button type="button" onClick={clearFilters} className={`${btn.primary} mt-1`}>
              {t.prod.clearF}
            </button>
          ) : (
            canEdit && (
              <Link href="/admin/products/new" className={`${btn.primary} mt-1`}>
                {t.prod.add}
              </Link>
            )
          )}
        </div>
      ) : (
        <>
          {/* แบบตาราง สำหรับแท็บเล็ตและคอมพิวเตอร์ */}
          <div className={`card overflow-auto ${view === "table" ? "hidden md2:block" : "hidden"}`}>
            <table className="w-full min-w-[780px] border-collapse">
              <thead>
                <tr className="bg-surface2 text-left">
                  <th className="w-[52px] py-3 pl-[18px]">
                    {canSel && (
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={() => setSel((s) => (allChecked ? s.filter((x) => !items.some((p) => p.id === x)) : [...new Set([...s, ...items.map((p) => p.id)])]))}
                        aria-label={t.prod.selAll}
                        className="block size-[18px] cursor-pointer accent-[var(--blue-solid)]"
                      />
                    )}
                  </th>
                  {[t.prod.colName, t.prod.colCat, t.prod.colStatus, t.prod.colUpd].map((h) => (
                    <th key={h} className="px-4 py-3 text-[13px] font-semibold text-ink2">
                      {h}
                    </th>
                  ))}
                  <th className="px-[18px] py-3 text-right text-[13px] font-semibold text-ink2">{t.prod.colAct}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p, i) => (
                  <tr
                    key={p.id}
                    style={{ animationDelay: `${i * 0.03}s` }}
                    className={`border-t border-line transition-colors [animation:a-up_.4s_cubic-bezier(.2,.7,.2,1)_both] hover:bg-surface2 ${sel.includes(p.id) ? "bg-soft" : ""}`}
                  >
                    <td className="py-3 pl-[18px]">{check(p)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3.5">
                        <Thumb img={p.img} sku={p.sku} className="size-[52px] flex-none rounded-lg" />
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <Link href={editHref(p)} className="text-left text-[15px] font-semibold text-ink hover:text-blue">
                            {p.name[lang] || p.name[ol]}
                          </Link>
                          <span className="text-[13.5px] text-ink2">{p.name[ol]}</span>
                          <span className="font-mono text-xs font-medium text-ink3">{p.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[14.5px] text-ink2">{catName(p.category)}</td>
                    <td className="px-4 py-3">{st(p.status)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink2">
                      <span className="flex flex-col gap-0.5">
                        <span>{p.updatedAt ? fmtDate(p.updatedAt, lang, false) : "—"}</span>
                        <span className="text-[12.5px] text-ink3">{by(p.updatedBy)}</span>
                      </span>
                    </td>
                    <td className="px-[18px] py-3">
                      <div className="flex justify-end gap-1">{actions(p)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* แบบการ์ด สำหรับแท็บเล็ตและคอมพิวเตอร์ */}
          <div className={`grid-cols-[repeat(auto-fill,minmax(min(100%,230px),1fr))] gap-4 ${view === "cards" ? "hidden md2:grid" : "hidden"}`}>
            {items.map((p, i) => (
              <div
                key={p.id}
                style={{ animationDelay: `${i * 0.04}s` }}
                className={`flex flex-col overflow-hidden rounded-[14px] border bg-surface transition-[transform,box-shadow] duration-300 [animation:a-up_.45s_cubic-bezier(.2,.7,.2,1)_both] hover:-translate-y-1 hover:shadow-lift ${
                  sel.includes(p.id) ? "border-blue-solid shadow-[0_0_0_2px_var(--blue-solid)]" : "border-line"
                }`}
              >
                <div className="relative m-2.5 mb-0">
                  <Thumb img={p.img} sku={p.sku} className="aspect-[4/3] w-full rounded-xl" text="text-[13px]" />
                  {canSel && <label className="absolute left-1.5 top-1.5 grid size-10 cursor-pointer place-items-center">{check(p)}</label>}
                  <span className="absolute right-2.5 top-2.5">{st(p.status)}</span>
                </div>
                <div className="flex flex-1 flex-col gap-1 px-4 pb-4 pt-3.5">
                  <span className="text-[12.5px] font-semibold tracking-[.03em] text-blue">{catName(p.category)}</span>
                  <Link href={editHref(p)} className="text-[15.5px] font-semibold leading-[1.4] text-ink hover:text-blue">
                    {p.name[lang] || p.name[ol]}
                  </Link>
                  <span className="text-[13.5px] text-ink2">{p.name[ol]}</span>
                  <span className="mt-auto flex items-center justify-between gap-2 pt-2.5">
                    <span className="min-w-0 truncate font-mono text-xs font-medium text-ink2" title={p.updatedAt ? relDate(p.updatedAt, lang) : undefined}>
                      {p.sku}
                    </span>
                    <span className="flex flex-none gap-1">{actions(p)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* แบบรายการ สำหรับมือถือ */}
          <div className="flex flex-col gap-2.5 md2:hidden">
            {items.map((p, i) => (
              <div
                key={p.id}
                style={{ animationDelay: `${i * 0.03}s` }}
                className={`flex items-start gap-2 rounded-xl border bg-surface py-3 pl-1 pr-2 [animation:a-up_.4s_cubic-bezier(.2,.7,.2,1)_both] ${sel.includes(p.id) ? "border-blue-solid" : "border-line"}`}
              >
                <label className="grid h-14 w-11 flex-none cursor-pointer place-items-center">{check(p, "size-5")}</label>
                <Thumb img={p.img} sku={p.sku} className="size-14 flex-none rounded-lg" text="text-[9.5px]" />
                <Link href={editHref(p)} className="flex min-w-0 flex-1 flex-col gap-[3px] text-ink hover:text-ink">
                  <strong className="text-[15px] leading-[1.4]">{p.name[lang] || p.name[ol]}</strong>
                  <span className="text-[13px] text-ink2">{p.name[ol]}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                    {st(p.status)}
                    <span className="text-[12.5px] text-ink3">{catName(p.category)}</span>
                  </span>
                </Link>
                <div className="flex flex-col">{actions(p)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <Pager page={cur} total={filtered.length} onPage={setPage} />
      </div>
      </div>

      <Confirm
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onOk={() => confirm && !pending && doDelete(confirm)}
        title={confirm && confirm.length > 1 ? t.cf.delManyTitle : t.cf.delTitle}
        text={`${lang === "th" ? `จะลบสินค้า ${confirm?.length ?? 0} รายการ` : `${confirm?.length ?? 0} products will be deleted.`} ${t.cf.delText}`}
        okLabel={t.cf.delOk}
      />
      {catsOpen && (
        <CategoriesModal
          categories={categories}
          counts={Object.fromEntries(categories.map((c) => [c.id, products.filter((p) => p.category === c.id).length]))}
          onClose={() => setCatsOpen(false)}
        />
      )}
    </div>
  );
}

