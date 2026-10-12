/** หน้ารายละเอียดสินค้า */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/ProductDetail";
import { tx } from "@/i18n/config";
import { getProduct, getProducts, getSettings } from "@/lib/content";
import { alternates, currentLang } from "@/lib/page";

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ sku: p.sku.toLowerCase() }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/products/[sku]">): Promise<Metadata> {
  const lang = await currentLang();
  const p = await getProduct((await params).sku);
  if (!p) return {};
  return {
    title: tx(p.name, lang),
    description: tx(p.short, lang) || `${tx(p.name, lang)} (${p.sku})`,
    alternates: alternates(`/products/${p.sku.toLowerCase()}`, lang),
  };
}

export default async function ProductPage({ params }: PageProps<"/[lang]/products/[sku]">) {
  const lang = await currentLang();
  const p = await getProduct((await params).sku);
  if (!p) notFound();
  return <ProductDetail p={p} lang={lang} settings={await getSettings()} />;
}
