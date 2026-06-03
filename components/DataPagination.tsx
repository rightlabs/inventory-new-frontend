"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface DataPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
}

// Build the list of page buttons. Shows every page when there are few; otherwise
// collapses with leading/trailing ellipses while always showing first, last and
// a window around the current page.
const buildPages = (
  current: number,
  total: number
): (number | "ellipsis")[] => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  if (left > 2) pages.push("ellipsis");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push("ellipsis");

  pages.push(total);
  return pages;
};

export default function DataPagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  className,
}: DataPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPages(currentPage, totalPages);

  const go = (page: number) => {
    if (disabled || page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    onPageChange(page);
  };

  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;
  const disabledCls = "pointer-events-none opacity-50";

  return (
    <Pagination className={cn("mx-0 w-auto justify-end", className)}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            size="sm"
            aria-disabled={isFirst || disabled}
            className={cn("cursor-pointer", (isFirst || disabled) && disabledCls)}
            onClick={(e) => {
              e.preventDefault();
              go(currentPage - 1);
            }}
          />
        </PaginationItem>

        {pages.map((p, idx) =>
          p === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                isActive={p === currentPage}
                aria-current={p === currentPage ? "page" : undefined}
                className={cn("cursor-pointer", disabled && disabledCls)}
                onClick={(e) => {
                  e.preventDefault();
                  go(p);
                }}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            size="sm"
            aria-disabled={isLast || disabled}
            className={cn("cursor-pointer", (isLast || disabled) && disabledCls)}
            onClick={(e) => {
              e.preventDefault();
              go(currentPage + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
