import "server-only";
import { Pool, type PoolClient } from "pg";
import { schemaSql, TABLES, UPLOADS, type Existing } from "./tables";

// เลขล็อกตอนเตรียมตาราง แยกจากล็อกของการบันทึก ให้เซิร์ฟเวอร์ที่เปิดพร้อมกันเตรียมตารางทีละตัว
const SCHEMA_LOCK = 4204002;

// ฐานข้อมูลแบบเก่ามีตาราง meta หรือเก็บรายการเป็นช่อง data ใช้กับโครงสร้างใหม่ไม่ได้
const OLD_LAYOUT = `
select 1 from information_schema.tables where table_schema = current_schema() and table_name = 'meta'
union all
select 1 from information_schema.columns where table_schema = current_schema() and table_name = 'users' and column_name = 'data'
limit 1`;

/** อ่านคอลัมน์ที่มีอยู่แล้วของทุกตาราง ใช้หาว่าต้องสร้างหรือแก้อะไร */
async function readExisting(c: Pick<PoolClient, "query">): Promise<Existing> {
  const { rows } = await c.query<{ table_name: string; column_name: string; not_null: boolean; pk: boolean }>(`
    select c.table_name, c.column_name, c.is_nullable = 'NO' as not_null, exists (
      select 1 from information_schema.table_constraints t
      join information_schema.key_column_usage k on k.constraint_name = t.constraint_name and k.table_schema = t.table_schema and k.table_name = t.table_name
      where t.constraint_type = 'PRIMARY KEY' and t.table_schema = c.table_schema and t.table_name = c.table_name and k.column_name = c.column_name
    ) as pk
    from information_schema.columns c where c.table_schema = current_schema() order by c.table_name, c.ordinal_position`);
  const existing: Existing = new Map();
  for (const r of rows) existing.set(r.table_name, (existing.get(r.table_name) ?? new Map()).set(r.column_name, { notNull: r.not_null, pk: r.pk }));
  return existing;
}

/** สร้างตารางและคอลัมน์ที่ยังไม่มี ถ้าครบแล้วจะไม่แก้ตารางเลย จึงไม่ล็อกตารางที่ใช้งานอยู่ */
async function setupSchema(): Promise<void> {
  const c = await pool().connect();
  let failed: Error | undefined;
  try {
    await c.query("select pg_advisory_lock($1)", [SCHEMA_LOCK]);
    if ((await c.query(OLD_LAYOUT)).rows.length) {
      throw new Error("This database uses the old table layout. Point DATABASE_URL to a new empty database, the system will create the tables and seed data itself.");
    }
    const sql = schemaSql([...TABLES, UPLOADS], await readExisting(c));
    const hasIndex = (await c.query("select 1 from pg_indexes where schemaname = current_schema() and indexname = 'uploads_hash'")).rows.length > 0;
    if (!hasIndex) sql.push("create index uploads_hash on uploads (hash);");
    if (!sql.length) return;
    await c.query("begin");
    try {
      await c.query(sql.join("\n"));
      await c.query("commit");
    } catch (e) {
      await c.query("rollback").catch(() => {});
      throw e;
    }
  } finally {
    // ถ้าปลดล็อกไม่ได้แสดงว่าการเชื่อมต่อเสีย จึงทิ้งการเชื่อมต่อนี้แทนการคืนให้ใช้ต่อ
    await c.query("select pg_advisory_unlock($1)", [SCHEMA_LOCK]).catch((e: Error) => (failed = e));
    c.release(failed);
  }
}

// ใช้การเชื่อมต่อชุดเดิมต่อไปเมื่อโค้ดโหลดใหม่ระหว่างพัฒนา
const g = globalThis as unknown as { __jpspool?: Pool; __jpsschema?: Promise<void> };

export function pool(): Pool {
  if (!g.__jpspool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    g.__jpspool = new Pool({ connectionString: url, max: 10 });
    // การเชื่อมต่อที่รออยู่หลุดเอง เช่นฐานข้อมูลรีสตาร์ต ถ้าไม่รับไว้เซิร์ฟเวอร์เว็บจะดับทั้งตัว
    g.__jpspool.on("error", (e) => console.error("[db] idle connection error:", e.message));
  }
  return g.__jpspool;
}

/** สร้างตารางที่ยังไม่มี ทำครั้งเดียวต่อการเปิดเซิร์ฟเวอร์ */
export function ensureSchema(): Promise<void> {
  g.__jpsschema ??= setupSchema().catch((e) => {
      g.__jpsschema = undefined;
      throw e;
    });
  return g.__jpsschema;
}

/** ทำงานในธุรกรรมเดียว ถ้ามีข้อผิดพลาดจะยกเลิกทั้งหมด */
export async function tx<T>(fn: (c: PoolClient) => Promise<T>, mode = ""): Promise<T> {
  await ensureSchema();
  const c = await pool().connect();
  let broken: Error | undefined;
  try {
    await c.query(`begin ${mode}`);
    const result = await fn(c);
    await c.query("commit");
    return result;
  } catch (e) {
    // ถ้ายกเลิกไม่ได้แสดงว่าการเชื่อมต่อเสีย จึงทิ้งการเชื่อมต่อนี้แทนการคืนให้ใช้ต่อ
    await c.query("rollback").catch((err: Error) => (broken = err));
    throw e;
  } finally {
    c.release(broken);
  }
}
