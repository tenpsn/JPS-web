"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { AIcon } from "@/admin/AIcon";
import { Avatar } from "@/admin/Avatar";
import { useAdmin } from "@/admin/context";
import { relDate } from "@/admin/i18n";
import { btn, Busy, FieldError, label, PageHead, Req, uploadFile, useToast } from "@/admin/ui";
import type { PublicUser } from "@/server/types";
import { changePassword, saveProfile, type PwErrors } from "../../actions/profile";

type Me = Pick<PublicUser, "id" | "name" | "ini" | "avatar" | "email" | "role" | "lastActive">;

/** ย่อรูปเป็นสี่เหลี่ยมจัตุรัสขนาด 256 พิกเซลก่อนอัปโหลด ตัดส่วนเกินตรงกลาง */
async function squareAvatar(file: File): Promise<File | null> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, fail) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = fail;
      i.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    c.getContext("2d")!.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, 256, 256);
    const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, "image/webp", 0.86));
    return blob ? new File([blob], "avatar.webp", { type: "image/webp" }) : null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function Profile({ user }: { user: Me }) {
  const { lang, t } = useAdmin();
  const th = lang === "th";
  const lastSeen = user.lastActive ? relDate(user.lastActive, lang) : "—";

  return (
    <div className="flex flex-col gap-[18px]">
      <PageHead title={th ? "โปรไฟล์ของฉัน" : "My profile"} sub={th ? "ชื่อ รูปโปรไฟล์ และรหัสผ่านของบัญชีคุณ" : "Your name, profile photo and password"} />
      <div className="grid grid-cols-1 items-start gap-[18px] lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* สรุปบัญชี ติดจอตอนเลื่อนบนคอมพิวเตอร์ */}
        <aside className="card flex flex-col items-center gap-3 px-5 py-6 text-center lg:sticky lg:top-2">
          <Avatar u={user} className="size-24 text-[30px] ring-4 ring-soft" />
          <span className="flex flex-col gap-0.5">
            <strong className="text-[17px] [overflow-wrap:anywhere]">{user.name}</strong>
            <span className="text-sm text-ink2 [overflow-wrap:anywhere]">{user.email}</span>
          </span>
          <span className="rounded-full bg-soft px-3 py-1 text-[13px] font-semibold text-blue">{t.roles[user.role]}</span>
          <span className="flex items-center gap-1.5 text-[13px] text-ink3">
            <AIcon name="clock" size={15} />
            {th ? "ใช้งานล่าสุด" : "Last active"} {lastSeen}
          </span>
        </aside>

        <div className="flex min-w-0 flex-col gap-[18px]">
          <Details user={user} />
          <Password />
        </div>
      </div>
    </div>
  );
}

function Details({ user }: { user: Me }) {
  const { lang, t } = useAdmin();
  const th = lang === "th";
  const toast = useToast();
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState<string | null>(user.avatar ?? null);
  const [err, setErr] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const dirty = name.trim() !== user.name || avatar !== (user.avatar ?? null);

  // รูปโปรไฟล์อัปโหลดแยกจากคลังรูปของเว็บ ไม่แสดงในคลัง
  const pick = async (f: File | undefined) => {
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return toast("err", th ? "ใช้ได้เฉพาะไฟล์ JPG PNG หรือ WebP" : "Use a JPG, PNG or WebP file");
    setUploading(true);
    const small = await squareAvatar(f);
    const r = small ? await uploadFile(small, "avatar") : { error: "type" };
    setUploading(false);
    if ("src" in r) setAvatar(r.src);
    else toast("err", th ? "อัปโหลดรูปไม่สำเร็จ ลองใช้รูปอื่น" : "Couldn't upload that photo. Try another one.");
  };

  const save = () =>
    start(async () => {
      const r = await saveProfile({ name, avatar });
      if (!r.ok) return setErr(true);
      setErr(false);
      toast("ok", th ? "บันทึกโปรไฟล์แล้ว" : "Profile saved");
      router.refresh();
    });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="card flex flex-col gap-5 px-[22px] pb-[22px] pt-5 [animation:a-up_.4s_both]"
    >
      <h2 className="m-0 flex items-center gap-3 text-[17px] font-semibold">
        <span className="grid size-10 flex-none place-items-center rounded-xl bg-soft text-blue">
          <AIcon name="users" />
        </span>
        {th ? "ข้อมูลส่วนตัว" : "Personal details"}
      </h2>

      <div className="flex flex-wrap items-center gap-4">
        <Avatar u={{ id: user.id, ini: user.ini, avatar }} className="size-[72px] text-[24px]" />
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className={`${btn.outline} min-h-10 text-sm`}>
              <AIcon name="upload" />
              <Busy busy={uploading}>{avatar ? (th ? "เปลี่ยนรูป" : "Change photo") : th ? "อัปโหลดรูป" : "Upload photo"}</Busy>
            </button>
            {avatar && (
              <button type="button" onClick={() => setAvatar(null)} className="min-h-10 cursor-pointer rounded-lg border-0 bg-transparent px-3 text-sm font-semibold text-red hover:bg-red-soft">
                {th ? "ลบรูป" : "Remove"}
              </button>
            )}
          </div>
          <span className="text-[13px] text-ink3">{th ? "JPG PNG หรือ WebP ระบบตัดเป็นสี่เหลี่ยมจัตุรัสให้เอง ถ้าไม่ใส่รูปจะแสดงตัวอักษรย่อ" : "JPG, PNG or WebP, cropped to a square for you. Without a photo your initials are shown."}</span>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => (pick(e.target.files?.[0]), (e.target.value = ""))} />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={label}>
          {th ? "ชื่อที่แสดง" : "Display name"} <Req />
        </span>
        <input value={name} onChange={(e) => (setName(e.target.value), setErr(false))} maxLength={80} autoComplete="name" aria-invalid={err} className="field min-h-11" />
        <FieldError text={err && (th ? "กรุณากรอกชื่อ" : "Enter your name")} />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={label}>{th ? "อีเมล" : "Email"}</span>
          <input value={user.email} readOnly className="field min-h-11 bg-surface2 text-ink2" />
          <span className="text-[13px] text-ink3">{th ? "เปลี่ยนอีเมลได้ที่หน้าจัดการผู้ใช้ โดยผู้มีสิทธิ์จัดการผู้ใช้" : "Changed in Users by someone who can manage users"}</span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={label}>{th ? "บทบาท" : "Role"}</span>
          <input value={t.roles[user.role]} readOnly className="field min-h-11 bg-surface2 text-ink2" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending || uploading || !dirty} className={`${btn.primary} min-h-[46px] w-fit px-5`}>
          <Busy busy={pending}>{th ? "บันทึกโปรไฟล์" : "Save profile"}</Busy>
        </button>
        {dirty && !pending && <span className="text-[13px] text-amber">{th ? "มีการแก้ไขที่ยังไม่ได้บันทึก" : "Unsaved changes"}</span>}
      </div>
    </form>
  );
}

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

/** เปลี่ยนรหัสผ่าน เครื่องอื่นที่เข้าระบบด้วยบัญชีนี้อยู่จะหลุดออก */
function Password() {
  const { t } = useAdmin();
  const toast = useToast();
  const [pw, setPw] = useState({ cur: "", nw: "", conf: "" });
  const [show, setShow] = useState(false);
  const [errs, setErrs] = useState<PwErrors>({});
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      const r = await changePassword(pw.cur, pw.nw, pw.conf);
      if (!r.ok) return setErrs(r.errors ?? {});
      setPw({ cur: "", nw: "", conf: "" });
      setErrs({});
      toast("ok", t.toast.pwSaved);
    });

  const s = strength(pw.nw);
  const segTone = ["bg-red-solid", "bg-red-solid", "bg-amber", "bg-green-solid", "bg-green-solid"][s];
  const inkTone = ["text-red", "text-red", "text-amber", "text-green", "text-green"][s];
  const field = (k: keyof typeof pw, ac: string) => (
    <input
      type={show ? "text" : "password"}
      value={pw[k]}
      onChange={(e) => (setPw({ ...pw, [k]: e.target.value }), setErrs({ ...errs, [k]: undefined }))}
      autoComplete={ac}
      aria-invalid={!!errs[k]}
      className="field min-h-11"
    />
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="card flex flex-col gap-4 px-[22px] pb-[22px] pt-5 [animation:a-up_.45s_both]"
    >
      <h2 className="m-0 flex items-center gap-3 text-[17px] font-semibold">
        <span className="grid size-10 flex-none place-items-center rounded-xl bg-red-soft text-red">
          <AIcon name="lock" />
        </span>
        {t.set.pw}
      </h2>
      <label className="flex flex-col gap-1.5">
        <span className={label}>{t.set.cur}</span>
        {field("cur", "current-password")}
        <FieldError text={errs.cur && t.set[errs.cur]} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={label}>{t.set.nw}</span>
        <span className="relative block">
          {field("nw", "new-password")}
          <button type="button" onClick={() => setShow((x) => !x)} aria-label={show ? t.login.hidePw : t.login.showPw} className="absolute right-0.5 top-0 grid size-11 cursor-pointer place-items-center border-0 bg-transparent text-ink2">
            <AIcon name={show ? "eyeOff" : "eye"} />
          </button>
        </span>
        {pw.nw && (
          <span className="flex items-center gap-2.5">
            <span className="grid flex-1 grid-cols-4 gap-1">
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className={`h-[5px] rounded-[3px] transition-colors ${i <= s ? segTone : "bg-line"}`} />
              ))}
            </span>
            <span className={`text-[12.5px] font-semibold ${inkTone}`}>{t.set.strength[s]}</span>
          </span>
        )}
        <FieldError text={errs.nw && t.set[errs.nw]} />
        <span className="text-[13px] text-ink3">{t.set.rule}</span>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={label}>{t.set.conf}</span>
        {field("conf", "new-password")}
        <FieldError text={errs.conf && t.set[errs.conf]} />
      </label>
      <button type="submit" disabled={pending} className={`${btn.primary} min-h-[46px] w-fit px-5`}>
        <Busy busy={pending}>{t.set.updatePw}</Busy>
      </button>
    </form>
  );
}
