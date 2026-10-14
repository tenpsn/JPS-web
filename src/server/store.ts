import "server-only";
import type { PoolClient } from "pg";
import { pool, tx } from "./db";
import { createSeed } from "./seed";
import { fromRows, selectSql, TABLES, type Row } from "./tables";
import type { DB } from "./types";

/** ข้อมูลทั้งหมดอยู่ใน PostgreSQL ทุกการอ่านเขียนผ่าน readDb และ mutate
 * จำข้อมูลชุดล่าสุดไว้ในหน่วยความจำ และโหลดใหม่เมื่อเลขรุ่นในฐานข้อมูลเปลี่ยน */

// เลขล็อกของฐานข้อมูล ใช้ให้การบันทึกทำทีละครั้งแม้เปิดเซิร์ฟเวอร์หลายตัว
const LOCK = 4204001;

/** แถวที่อ่านหรือบันทึกครั้งล่าสุด แยกตามชื่อตาราง เก็บคีย์ไว้ใช้ลบ และข้อความของทั้งแถวไว้ใช้ดูว่าเปลี่ยนหรือไม่
 * ค่าของแถวมีเฉพาะระหว่างบันทึก ตารางที่แถวไม่เคยถูกแก้ไม่ต้องเก็บข้อความ */
type SnapRow = { key: unknown[]; values?: unknown[]; json: string };
type Snap = Map<string, Map<string, SnapRow>>;
type Cache = { db: DB; rev: number; snap: Snap };

const g = globalThis as unknown as { __jpscache?: Cache; __jpsloading?: Promise<Cache>; __jpsready?: Promise<void> };

/** แปลงข้อมูลทั้งหมดเป็นแถวของทุกตาราง พร้อมคีย์ที่ใช้เทียบกับครั้งก่อน
 * withValues เก็บค่าของแถวไว้ด้วย ใช้ตอนบันทึก */
function snapshot(db: DB, withValues = false): Snap {
  const snap: Snap = new Map();
  for (const t of TABLES) {
    const rows = new Map<string, SnapRow>();
    for (const row of t.rows(db)) {
      // เวลาที่ว่างเก็บเป็น null เพราะคอลัมน์เวลารับข้อความว่างไม่ได้
      const values = t.cols.map(([c, type]) => (type === "timestamp" && row[c] === "" ? null : (row[c] ?? null)));
      const key = t.key.map((k) => row[k]);
      const id = JSON.stringify(key);
      if (rows.has(id)) throw new Error(`Duplicate key ${id} in ${t.name}`);
      rows.set(id, { key, values: withValues ? values : undefined, json: t.appendOnly ? "" : JSON.stringify(values) });
    }
    snap.set(t.name, rows);
  }
  return snap;
}

async function load(c: PoolClient): Promise<Cache> {
  const rows: Record<string, Row[]> = {};
  for (const t of TABLES) rows[t.name] = (await c.query(selectSql(t))).rows;
  const db = fromRows(rows);
  return { db, rev: await getRev(c), snap: snapshot(db) };
}

/** เขียนเฉพาะแถวที่เปลี่ยนจากครั้งก่อน คืนค่าว่ามีการเปลี่ยนหรือไม่ */
async function persist(c: PoolClient, cache: Cache): Promise<boolean> {
  const next = snapshot(cache.db, true);
  let any = false;

  for (const t of TABLES) {
    const before = cache.snap.get(t.name) ?? new Map();
    const after = next.get(t.name)!;
    const del = [...before].filter(([id]) => !after.has(id)).map(([, v]) => v.key);
    const up = [...after].filter(([id, v]) => before.get(id)?.json !== v.json).map(([, v]) => v);
    if (del.length) {
      const types = t.key.map((k) => t.cols.find(([c]) => c === k)![1]);
      await c.query(
        `delete from ${t.name} using unnest(${types.map((type, i) => `$${i + 1}::${type}[]`).join(", ")}) as d(${t.key.join(", ")}) where ${t.key.map((k) => `${t.name}.${k} = d.${k}`).join(" and ")}`,
        t.key.map((_, i) => del.map((key) => key[i])),
      );
    }
    if (up.length) {
      const values = up.map((v) => v.values!);
      const rest = t.cols.filter(([c]) => !t.key.includes(c));
      await c.query(
        `insert into ${t.name} (${t.cols.map(([c]) => c).join(", ")}) select * from unnest(${t.cols.map(([, type], i) => `$${i + 1}::${type}[]`).join(", ")})
         on conflict (${t.key.join(", ")}) do update set ${rest.map(([c]) => `${c} = excluded.${c}`).join(", ")}`,
        t.cols.map(([, type], i) => values.map((v) => (type === "jsonb" && v[i] !== null ? JSON.stringify(v[i]) : v[i]))),
      );
    }
    if (del.length || up.length) any = true;
  }

  // ค่าของแถวใช้แค่ตอนบันทึก จึงทิ้งไป ไม่เก็บไว้ในหน่วยความจำ
  for (const rows of next.values()) for (const r of rows.values()) delete r.values;
  cache.snap = next;
  return any;
}

/** เลขรุ่นของข้อมูล เพิ่มทุกครั้งที่บันทึก เครื่องอื่นจะได้รู้ว่าต้องโหลดใหม่ */
const getRev = async (c: Pick<PoolClient, "query">) => Number((await c.query<{ rev: number }>("select rev from site where id = 1")).rows[0]?.rev ?? 0);
const setRev = (c: PoolClient, rev: number) => c.query("update site set rev = $1 where id = 1", [rev]);

/** ฐานข้อมูลที่ยังว่างจะใส่ข้อมูลตั้งต้นให้ครั้งแรก */
async function init() {
  await tx(async (c) => {
    await c.query("select pg_advisory_xact_lock($1)", [LOCK]);
    const { rows } = await c.query("select 1 from site");
    if (rows.length) return;
    await persist(c, { db: createSeed(), rev: 0, snap: new Map() });
    await setRev(c, 1);
  });
}

function ready(): Promise<void> {
  g.__jpsready ??= init().catch((e) => {
    g.__jpsready = undefined;
    throw e;
  });
  return g.__jpsready;
}

export async function readDb(): Promise<DB> {
  await ready();
  const rev = await getRev(pool());
  if (g.__jpscache?.rev !== rev) {
    g.__jpsloading ??= tx(load, "isolation level repeatable read read only").finally(() => (g.__jpsloading = undefined));
    g.__jpscache = await g.__jpsloading;
  }
  return g.__jpscache.db;
}

/** อ่านข้อมูลล่าสุดและทำงานกับฐานข้อมูลในล็อกเดียวกับการบันทึก ห้ามแก้ข้อมูลที่ได้มา
 * ใช้กับงานที่ต้องตรวจข้อมูลก่อนทำ เช่นลบไฟล์เฉพาะเมื่อไม่มีที่ไหนใช้แล้ว */
export async function withLock<T>(fn: (db: DB, c: PoolClient) => Promise<T>): Promise<T> {
  await ready();
  return tx(async (c) => {
    await c.query("select pg_advisory_xact_lock($1)", [LOCK]);
    const rev = await getRev(c);
    if (g.__jpscache?.rev !== rev) g.__jpscache = await load(c);
    return fn(g.__jpscache.db, c);
  });
}

/** แก้ข้อมูลแล้วบันทึกลงฐานข้อมูลทันที ทำทีละครั้งจึงไม่ทับกัน ถ้าบันทึกไม่สำเร็จจะไม่มีอะไรเปลี่ยน */
export async function mutate<T>(fn: (db: DB) => T): Promise<T> {
  await ready();
  try {
    return await tx(async (c) => {
      await c.query("select pg_advisory_xact_lock($1)", [LOCK]);
      const rev = await getRev(c);
      let cache = g.__jpscache;
      if (cache?.rev !== rev) cache = g.__jpscache = await load(c);
      const result = fn(cache.db);
      if (await persist(c, cache)) {
        cache.rev = rev + 1;
        await setRev(c, cache.rev);
      }
      return result;
    });
  } catch (e) {
    // ข้อมูลในหน่วยความจำอาจถูกแก้ไปบางส่วนแล้ว จึงทิ้งไปและโหลดใหม่รอบหน้า
    g.__jpscache = undefined;
    throw e;
  }
}

/** วันที่และเวลาปัจจุบันตามเวลาประเทศไทย ในรูปแบบเดียวกับข้อมูลตั้งต้น */
export function nowStr(): string {
  const d = new Date(Date.now() + 7 * 3600_000);
  return d.toISOString().slice(0, 16).replace("T", " ");
}

const maxId = (list: { id: number }[]) => list.reduce((m, x) => Math.max(m, x.id), 0);

/** รหัสใหม่ที่ไม่ซ้ำกับรหัสที่เคยใช้มาก่อน แม้รายการนั้นถูกลบไปแล้ว
 * รหัสผู้ใช้ที่ซ้ำจะทำให้คุกกี้ของคนที่ถูกลบเข้าระบบเป็นคนใหม่ได้ */
export function newId(db: DB, kind: keyof DB["nextIds"]): number {
  const id = Math.max(db.nextIds[kind], maxId(kind === "user" ? db.users : db.activity) + 1);
  db.nextIds[kind] = id + 1;
  return id;
}
