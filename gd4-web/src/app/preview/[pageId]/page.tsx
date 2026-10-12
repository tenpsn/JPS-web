import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ProductDetail } from "@/components/ProductDetail";
import { Sections } from "@/components/sections/SectionRenderer";
import { LangProvider } from "@/i18n/client";
import { tx } from "@/i18n/config";
import { visible } from "@/lib/content";
import { designCss, googleFontsHref } from "@/lib/designCss";
import { can, getCurrentUser } from "@/server/auth";
import { working } from "@/server/content";
import { readDb } from "@/server/store";
import { PreviewBridge } from "./PreviewBridge";

export const dynamic = "force-dynamic";

/** หน้าดูตัวอย่างงานร่าง ใช้หน้าตาเว็บจริงกับเนื้อหาที่กำลังแก้ไขอยู่ */
export default async function PreviewPage({ params, searchParams }: PageProps<"/preview/[pageId]">) {
  const user = await getCurrentUser();
  if (!user || !(can(user, "content") || can(user, "design"))) notFound();
  const { pageId } = await params;
  const sp = await searchParams;
  const lang = sp.lang === "en" ? "en" : "th";
  const theme = sp.theme === "dark" ? "dark" : "light";

  const db = await readDb();
  const w = working(db);
  const settings = { ...db.settings, ...w.global };
  // หน้ารายละเอียดสินค้า แสดงด้วยสินค้าตัวอย่างที่หน้าแก้ไขเลือกมา
  const product = pageId === "__product" ? (db.products.find((p) => p.status === "pub" && p.sku.toLowerCase() === sp.sku) ?? db.products.find((p) => p.status === "pub")) : undefined;
  const page = w.pages.find((p) => p.id === pageId) ?? w.pages.find((p) => p.id === "home");
  if (!page) notFound();
  const css = designCss(w.design);
  const fonts = googleFontsHref(w.design);

  return (
    <>
      {fonts && <link rel="stylesheet" href={fonts} />}
      {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
      <PreviewBridge theme={theme} lang={lang} />
      <LangProvider lang={lang}>
        <Header menu={settings.menu} siteName={tx(settings.siteName, lang)} logo={settings.logo} logoDark={settings.logoDark} phone={settings.contact.phone} />
        <main id="main">
          {product ? <ProductDetail p={product} lang={lang} settings={settings} /> : <Sections page={visible(page)} lang={lang} settings={settings} preview />}
        </main>
        <Footer settings={settings} lang={lang} />
      </LangProvider>
    </>
  );
}
