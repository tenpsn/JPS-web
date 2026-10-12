import type { Metadata } from "next";
import { Editor } from "@/admin/editor/Editor";
import { can, requireUser } from "@/server/auth";
import { working } from "@/server/content";
import { readDb } from "@/server/store";

export const metadata: Metadata = { title: "Website content" };

export default async function ContentPage({ searchParams }: PageProps<"/admin/content">) {
  const user = await requireUser("content");
  const sp = await searchParams;
  const db = await readDb();
  // สินค้าที่ใช้แสดงตัวอย่างหน้ารายละเอียดสินค้า เลือกตัวที่มีรายละเอียดครบก่อน
  const live = db.products.filter((p) => p.status === "pub");
  const sample = live.find((p) => p.detail?.th && p.short?.th && live.some((x) => x.id !== p.id && x.category === p.category)) ?? live[0];
  return (
    <Editor
      mode="content"
      initial={working(db)}
      hasDraft={!!db.draft}
      initialRev={db.draftRev}
      categories={db.categories}
      sampleSku={sample?.sku.toLowerCase() ?? ""}
      initialPage={typeof sp.page === "string" ? sp.page : "home"}
      perms={{
        contentEdit: can(user, "content", "edit"),
        contentPublish: can(user, "content", "publish"),
        contentDel: can(user, "content", "del"),
        designView: can(user, "design"),
        designEdit: can(user, "design", "edit"),
        designPublish: can(user, "design", "publish") || can(user, "content", "publish"),
      }}
    />
  );
}
