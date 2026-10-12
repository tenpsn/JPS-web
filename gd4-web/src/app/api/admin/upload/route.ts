import { logActivity } from "@/server/activity";
import { can, getCurrentUser } from "@/server/auth";
import { saveUpload, type UploadKind } from "@/server/files";
import { mutate, nowStr } from "@/server/store";

/**
 * รับไฟล์ที่แอดมินอัปโหลด ได้แก่รูปภาพ ไอคอนเว็บ ฟอนต์ และรูปโปรไฟล์
 * แยกเป็นเส้นทางนี้เพื่อให้อัปโหลดไฟล์ขนาดใหญ่ได้โดยไม่ต้องขยายขีดจำกัดของทั้งระบบ
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "forbidden" }, { status: 403 });
  // รับเฉพาะคำขอที่มาจากเว็บของเราเอง เพื่อกันเว็บอื่นแอบส่งฟอร์มเข้ามา
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return Response.json({ error: "forbidden" }, { status: 403 });

  const fd = await req.formData();
  const file = fd.get("file");
  const kind = String(fd.get("kind")) as UploadKind;
  if (!(file instanceof File) || !["image", "icon", "font", "avatar"].includes(kind)) return Response.json({ error: "bad" }, { status: 400 });
  // รูปโปรไฟล์ทุกคนอัปโหลดได้ ไฟล์อื่นต้องมีสิทธิ์แก้ไขส่วนใดส่วนหนึ่ง
  if (kind !== "avatar" && !(can(user, "products", "edit") || can(user, "content", "edit") || can(user, "design", "edit") || can(user, "settings", "edit"))) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const saved = await saveUpload(file, kind);
  if ("error" in saved) return Response.json(saved, { status: 400 });
  // รูปโปรไฟล์ไม่เก็บในคลังรูปของเว็บ และบันทึกประวัติตอนบันทึกโปรไฟล์แทน
  if (kind === "avatar") return Response.json(saved);
  // เก็บรูปไว้ในคลังสื่อเพื่อให้นำไปใช้ซ้ำได้
  await mutate((db) => {
    // รูปและไอคอนเว็บเก็บไว้ในคลังรูป
    if (kind === "image" || kind === "icon") {
      // รูปที่มีในคลังแล้วย้ายขึ้นไปไว้บนสุดแทนการเพิ่มซ้ำ และคงชื่อเดิมไว้
      const old = db.media.find((m) => m.src === saved.src);
      db.media = db.media.filter((m) => m.src !== saved.src);
      db.media.unshift({ ...saved, name: old?.name ?? saved.name, when: nowStr(), userId: user.id });
      db.media = db.media.slice(0, 1000);
    }
    const what = { image: { th: "รูป", en: "image" }, icon: { th: "ไอคอนเว็บ", en: "site icon" }, font: { th: "ฟอนต์", en: "font" } }[kind];
    logActivity(db, user.id, { th: `อัปโหลด${what.th}`, en: `uploaded ${what.en}` }, { th: saved.name, en: saved.name });
  });
  return Response.json(saved);
}
