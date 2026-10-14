import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { can, requireUser } from "@/server/auth";
import { readDb } from "@/server/store";
import { Settings } from "./Settings";

export const metadata: Metadata = { title: "Settings" };

/** หน้าตั้งค่าของเว็บ ต้องมีสิทธิ์ตั้งค่า ส่วนรหัสผ่านของตัวเองย้ายไปอยู่ที่หน้าโปรไฟล์ */
export default async function SettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  const tab = (await searchParams).tab;
  // ลิงก์เดิมของแท็บรหัสผ่าน และผู้ที่ไม่มีสิทธิ์ตั้งค่า ไปที่หน้าโปรไฟล์แทน
  const user = await requireUser();
  if (tab === "security" || !can(user, "settings", "view")) redirect("/admin/profile");
  const db = await readDb();
  return (
    <Settings
      initialTab={typeof tab === "string" ? tab : undefined}
      canEdit={can(user, "settings", "edit")}
      canDesign={can(user, "design", "view")}
      settings={db.settings}
      pages={db.pages.map((p) => ({ id: p.id, title: p.title, slug: p.slug, seo: p.seo }))}
      design={db.design}
    />
  );
}
