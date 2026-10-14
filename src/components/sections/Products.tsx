import { Suspense } from "react";
import { tx } from "@/i18n/config";
import { getDict } from "@/i18n/dictionary";
import { getCategories, getProducts } from "@/lib/content";
import { gridCols } from "@/lib/grid";
import type { Locale, ProductsSection } from "@/types/site";
import { Catalog } from "./Catalog";
import { catUrl, ProductCard } from "./ProductCard";
import { SecHead } from "./shared";

export async function Products({ s, lang, phone, searchInHeader }: { s: ProductsSection; lang: Locale; phone?: string; searchInHeader?: boolean }) {
  const t = getDict(lang);
  const categories = await getCategories();
  // กล่องปรึกษาแสดงเมื่อมีหัวข้อ
  const helpTitle = tx(s.helpTitle, lang);
  const help = helpTitle ? { title: helpTitle, desc: tx(s.helpDesc, lang), btn: tx(s.helpBtn, lang) } : undefined;

  if (s.catalog) {
    const products = await getProducts();
    // การอ่านคำค้นและหมวดจากลิงก์ต้องครอบด้วย Suspense ระหว่างรอจะแสดงสินค้าทั้งหมดไปก่อน
    const catalog = (initial: boolean) => (
      <Catalog
        heading={tx(s.heading, lang)}
        sub={tx(s.sub, lang)}
        defaultCat={s.category || "all"}
        products={products}
        categories={categories}
        phone={phone}
        help={help}
        searchInHeader={searchInHeader}
        serverRender={initial}
      />
    );
    return <Suspense fallback={catalog(true)}>{catalog(false)}</Suspense>;
  }

  const products = await getProducts({ category: s.category, limit: s.count || 4 });
  const catName = (id: string) => tx(categories.find((c) => c.id === id)?.name, lang);
  const sub = tx(s.sub, lang);

  return (
    <div className="sec flex flex-col gap-9">
      <SecHead heading={tx(s.heading, lang)} sub={sub} more={t.seeAll} href={s.category && s.category !== "all" ? catUrl(s.category) : undefined} />
      <div className={`grid gap-[18px] ${gridCols(Math.max(products.length, 1))} min-[360px]:max-sm:grid-cols-2`}>
        {products.map((p, i) => (
          <ProductCard key={p.id} p={p} cat={catName(p.category)} lang={lang} t={t} i={i} />
        ))}
      </div>
    </div>
  );
}
