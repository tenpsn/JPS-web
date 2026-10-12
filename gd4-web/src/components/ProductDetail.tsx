/**
 * หน้ารายละเอียดสินค้า ใช้ทั้งหน้าเว็บจริงและหน้าดูตัวอย่างในหลังบ้าน
 * กล่องใต้ปุ่มติดต่อแก้ได้ที่หน้าจัดการเนื้อหาหน้าเว็บ แท็บหน้ารายละเอียดสินค้า
 */
import { LocalLink } from "@/components/LocalLink";
import { ProductGallery, type GalleryImage } from "@/components/ProductGallery";
import { Icon } from "@/components/Icon";
import { catUrl, ProductCard } from "@/components/sections/ProductCard";
import { ArrowNudge, chipCls, H2, PageIntro } from "@/components/sections/shared";
import { tx } from "@/i18n/config";
import { getDict } from "@/i18n/dictionary";
import { getCategories, getProducts } from "@/lib/content";
import type { Img, Locale, Product, SiteSettings } from "@/types/site";

export async function ProductDetail({ p, lang, settings }: { p: Product; lang: Locale; settings: SiteSettings }) {
  const t = getDict(lang);
  const [cats, sameCat] = await Promise.all([getCategories(), getProducts({ category: p.category })]);
  const cat = cats.find((c) => c.id === p.category);
  // เครื่องอื่นในหมวดเดียวกัน ไม่รวมตัวที่เปิดอยู่
  const related = sameCat.filter((x) => x.id !== p.id).slice(0, 4);
  const other = tx(p.name, lang === "th" ? "en" : "th");
  const tiles = settings.productTiles.map((x) => ({ ...x, text: tx(x.label, lang) })).filter((x) => x.text);
  const name = tx(p.name, lang);
  // รูปทั้งหมดของสินค้าที่มีไฟล์แล้ว ถ้าข้อมูลเก่ายังไม่มีรายการรูป ใช้รูปหลักรูปเดียว
  const alt = (src: Img, label?: string) => (src === "placeholder" ? `${t.p.img} · ${p.sku}` : label || name);
  const gallery: GalleryImage[] = (p.images ?? []).filter((im) => im.src).map((im) => ({ id: im.id, src: im.src, alt: alt(im.src, tx(im.label, lang)) }));
  if (!gallery.length && p.img) gallery.push({ id: "main", src: p.img, alt: alt(p.img) });
  const short = tx(p.short, lang);
  const detail = tx(p.detail, lang);

  return (
    <>
      <section className="relative overflow-hidden bg-bg2">
        <PageIntro
          crumbs={[
            { label: t.home, href: "/" },
            { label: t.p.products, href: "/products" },
            ...(cat ? [{ label: tx(cat.name, lang), href: catUrl(cat.id) }] : []),
            { label: p.sku },
          ]}
        />
      </section>

      <section className="bg-bg">
        {/* รูปซ้าย ข้อมูลและปุ่มติดต่อขวา ข้อมูลติดจอตอนเลื่อนดูรูป */}
        <div className="sec grid grid-cols-1 items-start gap-[clamp(28px,5vw,48px)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <ProductGallery images={gallery} start={Math.max(0, gallery.findIndex((g) => g.src === p.img))} noImg={t.p.noImg} />

          <div className="flex min-w-0 flex-col gap-3.5 lg:sticky lg:top-24">
            {cat && (
              <LocalLink href={catUrl(cat.id)} className={`${chipCls} bg-soft text-primary hover:text-primary`}>
                {tx(cat.name, lang)}
              </LocalLink>
            )}
            <h1 className="m-0 font-head text-h1 font-bold leading-[1.25] text-balance [overflow-wrap:anywhere]">{name}</h1>
            {other && other !== name && <span className="-mt-1.5 text-[calc(var(--fs-body)*1.02)] text-ink2">{other}</span>}
            <span className="font-mono text-sm font-medium text-ink2">
              {t.p.sku}: {p.sku}
            </span>
            {short && <p className="m-0 text-body leading-[1.85] text-ink2">{short}</p>}
            {/* สิ่งที่ได้พร้อมเครื่อง ช่วยให้ตัดสินใจได้ในหน้าเดียว */}
            {tiles.length > 0 && (
              <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2.5 p-0 pt-1.5">
                {tiles.map((x) => (
                  <li key={x.id} className="flex flex-col gap-1.5 rounded-xl bg-bg2 p-3.5 text-[14px] font-semibold leading-snug">
                    <span className="text-primary">
                      <Icon name={x.icon} size={22} />
                    </span>
                    {x.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {detail && (
        <section className="bg-bg2">
          <div className="sec flex flex-col gap-7">
            <H2>{t.p.specs}</H2>
            {/* ล้างโค้ดอันตรายออกแล้วตอนบันทึกในหลังบ้าน แบ่งสองคอลัมน์บนจอใหญ่ โดยไม่ตัดรายการกลางคอลัมน์ */}
            <div
              className="rich rounded-[16px] border border-line bg-card p-[clamp(20px,3vw,32px)] text-body leading-[1.8] lg:columns-2 lg:gap-12 [&>*]:break-inside-avoid"
              dangerouslySetInnerHTML={{ __html: detail }}
            />
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="bg-bg">
          <div className="sec flex flex-col gap-8">
            <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-2">
              <H2>{t.p.related}</H2>
              <LocalLink href={catUrl(p.category)} className="group inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary hover:text-primary">
                {t.seeAll}
                <ArrowNudge />
              </LocalLink>
            </div>
            <div className="grid grid-cols-1 gap-[18px] min-[360px]:grid-cols-2 lg:grid-cols-4">
              {related.map((x, i) => (
                <ProductCard key={x.id} p={x} cat={tx(cat?.name, lang)} lang={lang} t={t} i={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
