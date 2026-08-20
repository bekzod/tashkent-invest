"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

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
        <label>
          <span>Qatorlar</span>
          <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="server-pagination-actions">
        <button type="button" onClick={() => onPageChange(1)} disabled={!canPrev} aria-label="Birinchi sahifa">
          <ChevronsLeft size={16} />
        </button>
        <button type="button" onClick={() => onPageChange(safePage - 1)} disabled={!canPrev} aria-label="Oldingi sahifa">
          <ChevronLeft size={16} />
        </button>
        <span>
          {safePage} / {safeTotalPages}
        </span>
        <button type="button" onClick={() => onPageChange(safePage + 1)} disabled={!canNext} aria-label="Keyingi sahifa">
          <ChevronRight size={16} />
        </button>
        <button type="button" onClick={() => onPageChange(safeTotalPages)} disabled={!canNext} aria-label="Oxirgi sahifa">
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
