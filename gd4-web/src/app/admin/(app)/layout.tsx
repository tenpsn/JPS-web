import { AdminShell } from "@/admin/AdminShell";
import { getBrand } from "@/admin/brand.server";
import { can, requireUser } from "@/server/auth";
import { AREAS } from "@/server/types";

/** โครงของทุกหน้าหลังบ้าน ตรวจการเข้าระบบก่อน แล้วแสดงเมนูข้างและแถบด้านบน */
export default async function AdminAppLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser();
  const areas = AREAS.filter((a) => can(user, a, "view"));
  return (
    <AdminShell user={user} areas={areas} brand={await getBrand()}>
      {children}
    </AdminShell>
  );
}
