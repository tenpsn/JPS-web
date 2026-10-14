/**
 * ทำความสะอาดข้อความจัดรูปแบบจากหลังบ้าน เก็บไว้เฉพาะแท็กพื้นฐานกับลิงก์ที่ปลอดภัย
 * ใช้ตัวอ่าน HTML จริง แท็กที่เขียนไม่ครบหรือซ่อนคำสั่งไว้จึงหลุดผ่านไปไม่ได้
 */
import sanitize from "sanitize-html";

function safeHref(raw: string): string | null {
  const v = raw.trim().replace(/[\u0000-\u001f\s]+/g, "");
  if (/^(https?:|mailto:|tel:)/i.test(v) || (v.startsWith("/") && !v.startsWith("//"))) return v;
  return null;
}

const OPTIONS: sanitize.IOptions = {
  allowedTags: ["p", "br", "strong", "b", "em", "i", "ul", "ol", "li", "a"],
  allowedAttributes: { a: ["href", "rel"] },
  // ข้อความในแท็กอันตรายทิ้งไปทั้งก้อน แท็กอื่นที่ไม่อนุญาตเก็บไว้แค่ข้อความ
  nonTextTags: ["script", "style", "iframe", "object", "embed", "template", "noscript", "textarea", "option"],
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowProtocolRelative: false,
  transformTags: {
    a: (_tag, attribs) => {
      const href = safeHref(attribs.href ?? "");
      const attrs: sanitize.Attributes = href ? { href, rel: "noopener noreferrer" } : {};
      return { tagName: "a", attribs: attrs };
    },
  },
};

/** ความยาวใหญ่สุดตอนกรองซ้ำข้อความที่บันทึกไว้แล้ว ตัวกรองเติมข้อความในลิงก์ได้ จึงต้องเผื่อไว้ ไม่ให้ท้ายข้อความหาย */
export const STORED_MAX = 100_000;

export function sanitizeHtml(input: string, maxLen = 20000): string {
  return sanitize(input.slice(0, maxLen), OPTIONS);
}
