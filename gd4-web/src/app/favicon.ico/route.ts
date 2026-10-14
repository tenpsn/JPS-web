import { getSettings } from "@/lib/content";

// อ่านไอคอนจากหน้าตั้งค่าทุกครั้ง เปลี่ยนไอคอนแล้วจะได้เปลี่ยนตามทันที
export const dynamic = "force-dynamic";

/** เบราว์เซอร์ขอ favicon.ico เองเสมอ จึงส่งต่อไปที่ไอคอนที่ตั้งไว้ในหน้าตั้งค่า ถ้ายังไม่ได้ตั้งตอบว่าไม่มี */
export async function GET(req: Request) {
  const icon = (await getSettings()).favicon;
  if (!icon || icon === "placeholder") return new Response(null, { status: 404 });
  return new Response(null, {
    status: 307,
    headers: { Location: new URL(icon, req.url).toString(), "Cache-Control": "public, max-age=3600" },
  });
}
