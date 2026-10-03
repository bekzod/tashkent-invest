"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/shared/i18n/language-provider";

export function ServerPagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  pageSizeOptions = [10, 20, 50],
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const { t } = useLanguage();
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const canPrev = safePage > 1;
  const canNext = safePage < safeTotalPages;
  const from = totalItems ? (safePage - 1) * pageSize + 1 : 0;
  const to = Math.min(totalItems, safePage * pageSize);

  return (
    <div className="server-pagination">
      <div className="server-pagination-meta">
        <span>
          {from}-{to} / {totalItems}
        </span>
        <div>
          <span>{t("rows")}</span>
          <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger aria-label={t("rows")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>{size}</SelectItem>
            ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="server-pagination-actions">
        <Button variant="ghost" size="icon" onClick={() => onPageChange(1)} disabled={!canPrev} aria-label={t("firstPage")}>
          <ChevronsLeft size={16} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onPageChange(safePage - 1)} disabled={!canPrev} aria-label={t("previousPage")}>
          <ChevronLeft size={16} />
        </Button>
        <span>
          {safePage} / {safeTotalPages}
        </span>
        <Button variant="ghost" size="icon" onClick={() => onPageChange(safePage + 1)} disabled={!canNext} aria-label={t("nextPage")}>
          <ChevronRight size={16} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onPageChange(safeTotalPages)} disabled={!canNext} aria-label={t("lastPage")}>
          <ChevronsRight size={16} />
        </Button>
      </div>
    </div>
  );
}
