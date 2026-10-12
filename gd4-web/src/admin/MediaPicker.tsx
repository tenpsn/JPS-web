"use client";

import { useEffect, useRef, useState } from "react";
import { deleteMedia, listMedia } from "@/app/admin/actions/media";
import type { Img } from "@/types/site";
import { AIcon } from "./AIcon";
import { useAdmin } from "./context";
import { Confirm, Modal, uploadFile, useToast } from "./ui";

type Item = { src: string; name: string; size: number; when: string; used: boolean };

/**
 * หน้าต่างคลังรูป รวมไอคอนเว็บด้วย
 * kind บอกว่าช่องที่เปิดคลังต้องการอะไร คลิกเลือกได้เฉพาะชนิดนั้น ไฟล์ ICO เลือกได้เฉพาะช่องไอคอนเว็บ
 * keep คือไฟล์ที่ฟอร์มที่เปิดอยู่ใช้แต่อาจยังไม่ได้บันทึก จะไม่มีปุ่มลบ
 */
export function MediaPicker({ open, current, keep, onPick, onClose, kind = "image" }: {
  open: boolean;
  current: Img;
  keep?: string[];
  onPick: (src: string, name: string, size: number) => void;
  onClose: () => void;
  kind?: "image" | "icon";
}) {
  const { t } = useAdmin();
  const toast = useToast();
  const [items, setItems] = useState<Item[] | null>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const [del, setDel] = useState<{ src: string; name: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    let live = true;
    listMedia().then((x) => live && setItems(x));
    return () => {
      live = false;
    };
  }, [open]);

  const canPickImg = (src: string) => kind === "icon" || (kind === "image" && !src.endsWith(".ico"));
  const pick = (src: string, name: string, size: number) => (onPick(src, name, size), onClose());
  // ไฟล์ที่ช่องนี้หรือฟอร์มนี้ใช้อยู่ลบไม่ได้
  const locked = (src: string) => src === current || !!keep?.includes(src);

  const uploadImages = async (list: FileList) => {
    for (const f of Array.from(list)) {
      // ไฟล์ ICO บางเครื่องไม่บอกประเภทไฟล์ จึงดูจากนามสกุลด้วย
      const ico = kind === "icon" && /\.ico$/i.test(f.name);
      if ((!/^image\/(jpeg|png|webp)$/.test(f.type) && !ico) || f.size > 5 * 1024 * 1024) {
        toast("err", t.toast.imgOnly);
        continue;
      }
      const r = await uploadFile(f, kind === "icon" ? "icon" : "image");
      if ("src" in r) {
        setItems((x) => {
          // รูปที่มีอยู่แล้วคงชื่อและสถานะใช้อยู่เดิมไว้ ให้ตรงกับที่เซิร์ฟเวอร์เก็บ
          const old = x?.find((i) => i.src === r.src);
          return [{ ...r, name: old?.name ?? r.name, when: "", used: !!old?.used }, ...(x ?? []).filter((i) => i.src !== r.src)];
        });
        toast("ok", t.toast.imgAdded);
      } else toast("err", t.toast.imgOnly);
    }
  };

  const remove = async () => {
    if (!del) return;
    const target = del;
    setDel(null);
    const r = await deleteMedia(target.src);
    if (r.ok) {
      setItems((x) => (x ?? []).filter((i) => i.src !== target.src));
      toast("ok", t.media.deleted);
    } else toast("err", r.error === "inUse" ? t.media.inUse : t.toast.fix);
  };


  return (
    <Modal open={open} onClose={onClose} width={860} title={t.media.title} sub={t.content.mediaSub}>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 px-6 pb-6 pt-[18px]">
        <button
          type="button"
          onClick={() => imgInput.current?.click()}
          className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-line bg-surface2 text-sm font-semibold text-blue hover:border-blue-solid hover:bg-soft"
        >
          <AIcon name="upload" />
          {t.content.mediaUpload}
        </button>
        <input ref={imgInput} type="file" accept={kind === "icon" ? "image/jpeg,image/png,image/webp,image/x-icon,.ico" : "image/jpeg,image/png,image/webp"} multiple hidden onChange={(e) => (e.target.files && uploadImages(e.target.files), (e.target.value = ""))} />
        {items === null && Array.from({ length: 5 }, (_, i) => <span key={i} className="shimmer aspect-[4/3] rounded-[10px]" />)}
        {items?.map((m) => (
          <div key={m.src} className="group relative">
            <button
              type="button"
              disabled={!canPickImg(m.src)}
              onClick={() => pick(m.src, m.name, m.size)}
              className="flex w-full cursor-pointer flex-col gap-1.5 border-0 bg-transparent p-0 text-left text-ink disabled:cursor-default"
            >
              <span
                className={`relative aspect-[4/3] w-full rounded-[10px] border-2 bg-cover bg-center transition-[transform,box-shadow] duration-[250ms] ${canPickImg(m.src) ? "hover:-translate-y-0.5 hover:shadow-lift" : "opacity-50"} ${
                  m.src === current ? "border-red-solid" : "border-line"
                }`}
                style={{ backgroundImage: `url(${m.src})` }}
              >
                {m.src === current ? (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-[#c8312a] px-2 py-0.5 text-[11.5px] font-semibold text-white">{t.content.inUse}</span>
                ) : (
                  m.used && <span className="absolute left-1.5 top-1.5 rounded-full bg-green-soft px-2 py-0.5 text-[11.5px] font-semibold text-green">{t.media.used}</span>
                )}
              </span>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] leading-[1.35] text-ink2">{m.name}</span>
            </button>
            {!m.used && !locked(m.src) && (
              <button
                type="button"
                onClick={() => setDel({ src: m.src, name: m.name })}
                aria-label={`${t.c.del} ${m.name}`}
                className="absolute right-1.5 top-1.5 grid size-8 cursor-pointer place-items-center rounded-lg border-0 bg-surface/90 text-ink2 opacity-0 shadow-sm transition-opacity hover:text-red focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
              >
                <AIcon name="trash" size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      <Confirm
        open={!!del}
        onClose={() => setDel(null)}
        onOk={remove}
        title={t.media.delTitle}
        text={t.media.delText}
        items={del ? [del.name] : undefined}
        okLabel={t.c.del}
      />
    </Modal>
  );
}
