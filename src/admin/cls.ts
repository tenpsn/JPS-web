/** คลาสหน้าตาที่ใช้ซ้ำในหลังบ้าน ไม่มีโค้ดฝั่งเบราว์เซอร์ จึงใช้ได้ทั้งหน้าฝั่งเซิร์ฟเวอร์และฝั่งเบราว์เซอร์ */

/* รูปแบบปุ่ม */
export const btn = {
  primary:
    "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border-0 bg-blue-solid px-[18px] text-[15px] font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-blue-h hover:text-white active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60",
  outline:
    "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 text-[15px] font-medium text-ink transition-[border-color,color,transform] duration-200 hover:border-blue-solid hover:text-blue active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60",
  danger:
    "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border-0 bg-red-solid px-[18px] text-[15px] font-semibold text-white active:scale-[.98] disabled:opacity-60",
  icon: "grid size-[38px] cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-ink2 transition-colors hover:bg-soft hover:text-blue",
  iconDanger: "grid size-[38px] cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-ink2 transition-colors hover:bg-red-soft hover:text-red",
  link: "inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[14.5px] font-medium text-blue hover:text-red",
};

/** กล่องไอคอนสีอ่อน สลับน้ำเงินกับแดงแบบการ์ดของหน้าเว็บ */
export const iconTile = (red?: boolean) => `grid size-12 flex-none place-items-center rounded-xl ${red ? "bg-red-soft text-red" : "bg-soft text-blue"}`;
