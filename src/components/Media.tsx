import Image from "next/image";
import type { Img } from "@/types/site";

/** มีไฟล์รูปจริงแล้ว ไม่ใช่ค่าว่างหรือรูปตัวอย่าง */
export const realImg = (img: Img | undefined): img is string => !!img && img !== "placeholder";

/** แสดงรูปเต็มกรอบที่ครอบอยู่ ถ้ายังไม่มีรูปจริงจะแสดงกล่องลายทางแทน */
export function Media({ img, alt, sizes = "(min-width: 1024px) 50vw, 100vw", label = true, priority = false, fit = "cover" }: {
  img: Img;
  alt: string;
  sizes?: string;
  label?: boolean;
  priority?: boolean;
  /** contain แสดงรูปทั้งรูปโดยไม่ตัดขอบ ใช้กับรูปสินค้า */
  fit?: "cover" | "contain";
}) {
  if (realImg(img)) {
    return <Image src={img} alt={alt} fill sizes={sizes} priority={priority} className={fit === "contain" ? "object-contain" : "object-cover"} />;
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className="stripe absolute inset-0 grid place-items-center p-3 text-center font-mono text-[13px] font-medium text-ph-ink"
    >
      {label && img === "placeholder" ? alt : null}
    </div>
  );
}
