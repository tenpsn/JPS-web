import type { Metadata } from "next";
import Link from "next/link";
import { AIcon } from "@/admin/AIcon";
import { ActivityList } from "@/admin/ActivityList";
import { getAdminDict, relDate, todayLine } from "@/admin/i18n";
import { getAdminLang } from "@/admin/server";
import { btn, iconTile } from "@/admin/cls";
import { PageHead } from "@/admin/ui";
import { can, requireUser } from "@/server/auth";
import { readDb } from "@/server/store";
import { getTodos } from "./todos";

export const metadata: Metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: PageProps<"/admin">) {
  const user = await requireUser("dashboard");
  const lang = await getAdminLang();
  const t = getAdminDict(lang);
  const db = await readDb();
  const denied = (await searchParams).denied === "1";

  const userBy = (id: number) => db.users.find((u) => u.id === id);
  const products = db.products;
  const pub = products.filter((p) => p.status === "pub").length;
  const lastPage = db.pages.find((p) => p.id === db.lastEdit.page) ?? db.pages[0];
  const lastBy = userBy(db.lastEdit.userId);

  // ตัวเลขบนแถบสีน้ำเงินเข้ม แสดงเฉพาะส่วนที่ผู้ใช้มีสิทธิ์ดู
  const stats = [
    { value: products.length, label: t.dash.cProducts, show: can(user, "products") },
    { value: pub, label: t.dash.sPub, show: can(user, "products") },
    { value: products.length - pub, label: t.dash.sDraft, show: can(user, "products") },
    { value: db.pages.length, label: t.dash.sPages, show: can(user, "content") },
  ].filter((s) => s.show);

  const todos = getTodos(db, user, lang, t);

  const ctaSub = t.dash.ctaD
    .replace("{page}", lastPage.title[lang])
    .replace("{who}", lastBy?.name[lang] ?? "—")
    .replace("{when}", relDate(db.lastEdit.when, lang));

  return (
    <div className="flex flex-col gap-[22px]">
      <PageHead
        title={`${t.dash.hello}${user.name[lang].split(" ")[0]}`}
        sub={todayLine(lang)}
        actions={
          <>
            {can(user, "content", "edit") && (
              <Link href="/admin/content?page=home" className={btn.outline}>
                <AIcon name="page" />
                {t.dash.editHome}
              </Link>
            )}
            {can(user, "products", "edit") && (
              <Link href="/admin/products/new" className={btn.primary}>
                <AIcon name="plus" />
                {t.dash.addProduct}
              </Link>
            )}
          </>
        }
      />

      {denied && (
        <div role="alert" className="flex items-center gap-2.5 rounded-lg bg-amber-soft px-4 py-3 text-[14.5px] text-amber">
          <AIcon name="lock" />
          {t.dash.denied}
        </div>
      )}

      {stats.length > 0 && (
        <div className="anim-up grid grid-cols-2 gap-x-5 gap-y-6 rounded-2xl bg-navy px-6 py-6 text-white [animation-delay:.05s] lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex min-w-0 flex-col gap-0.5 border-l-[3px] border-brand-red pl-4">
              <span className="text-[clamp(28px,3vw,36px)] font-bold leading-[1.15] tabular-nums">{s.value}</span>
              <span className="text-sm text-[#c4d3ec]">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-[22px] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-3.5">
          <h2 className="m-0 text-lg font-bold">{t.dash.todo}</h2>
          {todos.length ? (
            todos.map((x, i) => (
              <Link
                key={x.title}
                href={x.href}
                style={{ animationDelay: `${0.08 + i * 0.05}s` }}
                className="anim-up card flex items-center gap-4 p-[18px] text-ink transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-[3px] hover:border-blue-solid hover:text-ink hover:shadow-lift"
              >
                <span className={iconTile(x.red)}>
                  <AIcon name={x.icon} size={22} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <strong className="text-[15.5px]">{x.title}</strong>
                  <span className="text-sm text-ink2">{x.desc}</span>
                </span>
                <span className="grid text-blue">
                  <AIcon name="chevR" />
                </span>
              </Link>
            ))
          ) : (
            <div className="card flex items-center gap-4 p-[18px]">
              <span className="grid size-12 flex-none place-items-center rounded-xl bg-green-soft text-green">
                <AIcon name="check" size={22} />
              </span>
              <span className="flex flex-col gap-0.5">
                <strong className="text-[15.5px]">{t.dash.allDone}</strong>
                <span className="text-sm text-ink2">{t.dash.allDoneD}</span>
              </span>
            </div>
          )}
        </section>

        <section className="flex min-w-0 flex-col gap-[22px]">
          {/* กล่องทางลัดสีน้ำเงิน มีวงแหวนแดงที่มุมแบบแบนเนอร์ของหน้าเว็บ */}
          <div className="anim-up relative overflow-hidden rounded-2xl bg-[linear-gradient(120deg,var(--panel),var(--blue-solid)_60%,var(--panel))] p-6 text-white [animation-delay:.1s]">
            <span aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full border-[22px] border-brand-red/35" />
            <h2 className="relative m-0 text-lg font-bold">{t.dash.ctaT}</h2>
            <p className="relative mb-4 mt-1 text-[14.5px] text-[#cddaf1]">{ctaSub}</p>
            <div className="relative flex flex-wrap gap-2.5">
              {can(user, "content") && (
                <Link href={`/admin/content?page=${lastPage.id}`} className={`${btn.danger} hover:text-white`}>
                  <AIcon name="page" />
                  {t.nav.content}
                </Link>
              )}
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/50 px-4 text-[15px] font-semibold text-white hover:bg-white/10 hover:text-white"
              >
                <AIcon name="external" />
                {t.nav.viewSite}
              </a>
            </div>
          </div>

          {can(user, "activity") && (
            <section className="card anim-up overflow-hidden [animation-delay:.15s]">
              <div className="flex items-center justify-between gap-3 px-[22px] py-[18px]">
                <h2 className="m-0 text-lg font-bold">{t.dash.activity}</h2>
              </div>
              <ActivityList
                activity={db.activity.slice(0, 50)}
                users={db.users.map(({ id, name, ini, avatar }) => ({ id, name, ini, avatar }))}
                empty={t.dash.noAct}
                rowClass="px-[22px]"
                per={5}
              />
            </section>
          )}
        </section>
      </div>
    </div>
  );
}
