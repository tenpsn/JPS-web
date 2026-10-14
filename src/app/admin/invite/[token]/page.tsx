import type { Metadata } from "next";
import { BrandMark } from "@/admin/Brand";
import { getBrand } from "@/admin/brand.server";
import { AdminLangSwitch, AdminThemeToggle } from "@/admin/controls";
import { InviteForm } from "./InviteForm";

export const metadata: Metadata = { title: "Set your password" };

/** หน้าลิงก์เชิญ ผู้ดูแลคนใหม่ตั้งรหัสผ่านแล้วเข้าสู่ระบบ */
export default async function InvitePage({ params }: PageProps<"/admin/invite/[token]">) {
  const { token } = await params;
  const brand = await getBrand();
  return (
    <div className="relative flex min-h-full flex-col overflow-hidden bg-bg">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(90deg,transparent,#000_60%)]"
      />
      <div className="relative flex items-center gap-2.5 px-5 py-4">
        <BrandMark brand={brand} size="size-10" />
        <strong className="text-base">{brand.name}</strong>
        <span className="flex-1" />
        <AdminLangSwitch size="lg" />
        <AdminThemeToggle />
      </div>
      <div className="relative grid flex-1 place-items-center px-5 pb-14 pt-4">
        <div className="card anim-up flex w-full max-w-[440px] flex-col gap-[26px] border-t-4 border-t-red-solid p-7 shadow-lift">
          <InviteForm token={token} />
        </div>
      </div>
    </div>
  );
}
