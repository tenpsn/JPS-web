import { LocalLink } from "@/components/LocalLink";
import { Media, realImg } from "@/components/Media";
import { tx } from "@/i18n/config";
import { getDict } from "@/i18n/dictionary";
import { getCategories, getProducts } from "@/lib/content";
import { gridCols } from "@/lib/grid";
import type { CategoriesSection, Locale } from "@/types/site";
import { catUrl } from "./ProductCard";
import { ArrowNudge, cardCls, delay, SecHead } from "./shared";

/** การ์ดหมวดสินค้า ใช้รูปของสินค้าชิ้นแรกในหมวดที่มีรูป และนับเฉพาะสินค้าที่เผยแพร่แล้ว */
export async function Categories({ s, lang, preview }: { s: CategoriesSection; lang: Locale; preview?: boolean }) {
  const t = getDict(lang);
  const [cats, products] = await Promise.all([getCategories(), getProducts()]);
  const other: Locale = lang === "th" ? "en" : "th";
  // นับสินค้าและหารูปแรกของทุกหมวดในรอบเดียว
  const stat = new Map<string, { count: number; img: string | null }>();
  for (const p of products) {
    const x = stat.get(p.category) ?? { count: 0, img: null };
    x.count++;
    if (!x.img && realImg(p.img)) x.img = p.img;
    stat.set(p.category, x);
  }
  const list = cats.flatMap((c) => {
    const x = stat.get(c.id);
    return x ? [{ c, ...x, alt: tx(c.name, other) }] : [];
  });

  return (
    <div className="sec flex flex-col gap-9">
      <SecHead heading={tx(s.heading, lang)} sub={tx(s.sub, lang)} more={list.length ? t.viewAll : undefined} />
      {/* บนเว็บจริงส่วนนี้ถูกซ่อนไปก่อนแล้วถ้าไม่มีหมวด ข้อความนี้จึงเห็นเฉพาะตอนดูตัวอย่าง */}
      {!list.length && preview && <p className="m-0 rounded-card border border-dashed border-line px-5 py-8 text-center text-ink2">{t.noCats}</p>}
      {list.length > 0 && (
        <div className={`grid gap-5 ${gridCols(list.length, { m: 1 })} min-[420px]:max-sm:grid-cols-2`}>
          {list.map(({ c, count, img, alt }, i) => (
            <LocalLink key={c.id} href={catUrl(c.id)} style={delay(i)} className={`${cardCls} hover:border-primary hover:text-ink`}>
              <div className={`relative aspect-[4/3] border-b border-line ${img ? "bg-white" : "stripe"}`}>
                {img && (
                  <div className="absolute inset-[18px]">
                    <Media img={img} alt="" fit="contain" sizes="(min-width: 1024px) 25vw, 50vw" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 px-5 pb-5 pt-[18px]">
                <h3 className="clamp-2 m-0 font-head text-h3 font-semibold leading-[1.4] [overflow-wrap:anywhere]">{tx(c.name, lang)}</h3>
                {alt && <span className="text-small text-ink2">{alt}</span>}
                <span className="mt-auto flex items-center justify-between pt-3 text-[14.5px] font-semibold text-primary">
                  {count} {t.models}
                  <ArrowNudge />
                </span>
              </div>
            </LocalLink>
          ))}
        </div>
      )}
    </div>
  );
}
