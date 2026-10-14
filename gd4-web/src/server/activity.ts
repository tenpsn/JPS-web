import "server-only";
import { TT } from "@/admin/tt.generated";
import type { LText } from "@/types/site";
import { newId, nowStr } from "./store";
import { freezeActivity } from "./tables";
import type { DB } from "./types";

export type ActKey = keyof typeof TT.act;

/** บันทึกประวัติการใช้งาน ต้องเรียกใน mutate ไม่จำกัดจำนวน ผู้มีสิทธิ์ลบเองได้
 * เป้าหมายที่เป็นข้อความเดียว เช่นชื่อผู้ใช้ ใช้ข้อความเดียวกันทั้งสองภาษา */
export function logActivity(db: DB, userId: number, act: ActKey | LText, target: LText | string) {
  const action = typeof act === "string" ? { th: TT.act[act].th, en: TT.act[act].en } : act;
  const what = typeof target === "string" ? { th: target, en: target } : target;
  db.activity.unshift(freezeActivity({ id: newId(db, "activity"), userId, action, target: what, when: nowStr() }));
}
