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
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  const [jump, setJump] = useState("");
  const [jumpHint, setJumpHint] = useState("");

  if (totalPages <= 1) return null;

  // "Go to page": whole numbers 1..totalPages only; anything else shows a
  // short hint and sends no request. The list keeps its search / filters
  // (onPageChange is the list's own page loader).
  const submitJump = () => {
    const raw = jump.trim();
    const n = Number(raw);
    if (!raw || !Number.isInteger(n) || n < 1 || n > totalPages) {
      setJumpHint(`Enter 1–${totalPages}`);
      return;
    }
    setJumpHint("");
    setJump("");
    go(n);
  };

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
    <div
      className={cn("flex flex-wrap items-center justify-end gap-x-3 gap-y-2", className)}
      data-testid="data-pagination"
    >
    <Pagination className="mx-0 w-auto justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            size="sm"
            aria-disabled={isFirst || disabled}
            className={cn("cursor-pointer [&>span]:hidden sm:[&>span]:inline", (isFirst || disabled) && disabledCls)}
            onClick={(e) => {
              e.preventDefault();
              go(currentPage - 1);
            }}
          />
        </PaginationItem>

        {pages.map((p, idx) =>
          p === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${idx}`} className="hidden sm:block">
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p} className={p === currentPage ? undefined : "hidden sm:block"}>
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
            className={cn("cursor-pointer [&>span]:hidden sm:[&>span]:inline", (isLast || disabled) && disabledCls)}
            onClick={(e) => {
              e.preventDefault();
              go(currentPage + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
      <form
        className="flex items-center gap-1.5 text-sm"
        onSubmit={(e) => {
          e.preventDefault();
          submitJump();
        }}
        data-testid="page-jump"
      >
        <span className="text-muted-foreground whitespace-nowrap">
          Go to page
        </span>
        <Input
          aria-label={`Go to page (1 to ${totalPages})`}
          inputMode="numeric"
          value={jump}
          onChange={(e) => {
            setJump(e.target.value.replace(/[^0-9]/g, "").slice(0, 5));
            setJumpHint("");
          }}
          placeholder={String(currentPage)}
          className="h-8 w-16 px-2 text-center"
          disabled={disabled}
          data-testid="page-jump-input"
        />
        <Button type="submit" variant="outline" size="sm" className="h-8 px-3" disabled={disabled}>
          Go
        </Button>
        {jumpHint && (
          <span className="text-xs text-red-600 whitespace-nowrap" role="alert" data-testid="page-jump-hint">
            {jumpHint}
          </span>
        )}
      </form>
    </div>
  );
}
