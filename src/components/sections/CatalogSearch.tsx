"use client";

import { Icon } from "@/components/Icon";
import { useI18n } from "@/i18n/client";
import { setCatalogQuery, syncUrl, useCatalogQuery } from "./catalogQuery";

/** ช่องค้นหาสินค้า พิมพ์แล้วรายการสินค้าในหน้าเดียวกันกรองตามทันที */
export function CatalogSearch() {
  const { t } = useI18n();
  const q = useCatalogQuery();
  return (
    <label className="flex w-full max-w-[560px] flex-col gap-1.5">
      <span className="text-small font-semibold text-ink">{t.p.search}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-3.5 top-1/2 grid -translate-y-1/2 text-ink3">
          <Icon name="search" />
        </span>
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setCatalogQuery(e.target.value);
            syncUrl(e.target.value.trim());
          }}
          placeholder={t.p.searchPh}
          className="min-h-[52px] w-full rounded-input border border-line bg-card pl-11 pr-4 text-body text-ink outline-none focus:border-primary-solid focus:shadow-[0_0_0_3px_var(--c-soft)]"
        />
      </span>
    </label>
  );
}
