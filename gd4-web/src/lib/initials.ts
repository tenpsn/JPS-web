/** ชื่อย่อ ใช้อักษรตัวแรกของสองคำแรกในชื่อ ไม่นับคำนำหน้า */
export function initials(name: string) {
  const parts = name.replace(/^(นาย|นาง|นางสาว|ดร\.|Dr\.?)\s*/, "").trim().split(/\s+/);
  return (parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "");
}
