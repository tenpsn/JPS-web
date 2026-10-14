import type { Metadata } from "next";
import { requireUser } from "@/server/auth";
import { Profile } from "./Profile";

export const metadata: Metadata = { title: "My profile" };

/** โปรไฟล์ของตัวเอง ทุกคนที่เข้าสู่ระบบแก้ชื่อ รูป และรหัสผ่านของตัวเองได้ */
export default async function ProfilePage() {
  const user = await requireUser();
  const { id, name, ini, avatar, email, role, lastActive } = user;
  return <Profile user={{ id, name, ini, avatar: avatar ?? null, email, role, lastActive }} />;
}
