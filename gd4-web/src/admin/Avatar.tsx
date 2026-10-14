import type { PublicUser } from "@/server/types";

const AV = ["#1a4fa0", "#c8312a", "#1f7a6c", "#7a4fb0", "#a0621a"];

/** สีพื้นหลังรูปโปรไฟล์ของผู้ใช้แต่ละคน ตามต้นแบบหลังบ้าน */
const avatarColor = (id: number) => AV[(id - 1) % AV.length];

/** รูปโปรไฟล์ของผู้ใช้ ถ้ายังไม่ได้ใส่รูปแสดงตัวอักษรย่อบนสีประจำตัว */
export function Avatar({ u, className = "size-9 text-[12.5px]" }: { u?: Pick<PublicUser, "id" | "ini" | "avatar">; className?: string }) {
  if (u?.avatar) {
    // eslint-disable-next-line @next/next/no-img-element -- รูปที่ย่อขนาดไว้แล้วตอนอัปโหลด
    return <img src={u.avatar} alt="" className={`flex-none rounded-full object-cover ${className}`} />;
  }
  return (
    <span className={`grid flex-none place-items-center rounded-full font-bold text-white ${className}`} style={{ background: u ? avatarColor(u.id) : "#6b778a" }}>
      {u?.ini ?? "?"}
    </span>
  );
}
