"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SearchSelectOption {
  value: string;
  label: string;
  /** Small grey text on the right, e.g. a code. */
  hint?: string;
  /** Extra text that search also matches (code, phone, …). */
  keywords?: string;
}

interface SearchSelectProps {
  options: SearchSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  /** Show a "clear" row at the top with this label (e.g. "No customer"). */
  clearLabel?: string;
  emptyText?: string;
  id?: string;
  disabled?: boolean;
  /** How many matches to render at once (type to narrow). */
  maxShown?: number;
  testId?: string;
  /** Show the picked option's hint (e.g. code) inside the button. Default true. */
  hintInTrigger?: boolean;
}

/**
 * Dropdown with a search box: type part of a name or code, pick with mouse
 * or arrow keys + Enter. Searches the whole list passed in.
 */
export default function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Type to search…",
  clearLabel,
  emptyText = "No match",
  id,
  disabled,
  maxShown = 60,
  testId,
  hintInTrigger = true,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the row picked with the arrow keys in view.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-row="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const selected = options.find((o) => o.value === value);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? options.filter((o) =>
          `${o.label} ${o.hint || ""} ${o.keywords || ""}`
            .toLowerCase()
            .includes(q)
        )
      : options;
    return list;
  }, [options, query]);
  const shown = matches.slice(0, maxShown);

  // Rows = optional clear row (only while not searching, so Enter picks the
  // first match) + shown options (for keyboard navigation).
  const rows: (SearchSelectOption | null)[] = [
    ...(clearLabel && !query.trim() ? [null] : []),
    ...shown,
  ];

  const pick = (row: SearchSelectOption | null) => {
    onChange(row ? row.value : "");
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(rows.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (rows[active] !== undefined) pick(rows[active]);
    }
  };

  return (
    <Popover
      open={open}
      modal
      onOpenChange={(o) => {
        if (disabled) return;
        setOpen(o);
        if (o) {
          setQuery("");
          setActive(0);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          data-testid={testId}
          className={cn(
            "w-full justify-between font-normal",
            !selected && "text-muted-foreground"
          )}
        >
          <span className="min-w-0 truncate">
            {selected ? selected.label : placeholder}
          </span>
          {/* Code next to the picked name: tells apart two customers with the same name. */}
          {hintInTrigger && selected?.hint && (
            <span className="ml-auto pl-2 text-xs text-muted-foreground shrink-0" data-testid="search-select-hint">
              {selected.hint}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[260px]"
        align="start"
      >
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 shrink-0 opacity-50" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder={searchPlaceholder}
            className="flex h-10 w-full bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="opacity-50 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div
          ref={listRef}
          className="max-h-64 overflow-y-auto p-1"
          role="listbox"
        >
          {rows.map((row, i) => {
            const isSel = row ? row.value === value : !value;
            return (
              <div
                key={row ? row.value : "__clear"}
                role="option"
                data-row={i}
                aria-selected={isSel}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(row)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                  i === active && "bg-slate-100",
                  !row && "text-muted-foreground italic"
                )}
              >
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isSel ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="flex-1 truncate">
                  {row ? row.label : clearLabel}
                </span>
                {row?.hint && (
                  <span className="text-xs text-muted-foreground">
                    {row.hint}
                  </span>
                )}
              </div>
            );
          })}
          {shown.length === 0 && (
            <div className="px-2 py-3 text-center text-sm text-muted-foreground">
              {emptyText}
            </div>
          )}
          {matches.length > shown.length && (
            <div className="px-2 py-1.5 text-center text-xs text-muted-foreground">
              {matches.length - shown.length} more — type to narrow
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
