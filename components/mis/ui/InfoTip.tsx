"use client";

import { useEffect, useRef, useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { MIS_TERMS, MisTerm, MisTermKey } from "./terms";

export interface InfoTipProps {
  /** A word from MIS_TERMS … */
  term?: MisTermKey;
  /** … or your own text. */
  content?: MisTerm;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
}

/**
 * Small ⓘ next to a label. Mouse: opens on hover. Touch: opens on tap,
 * closes on a tap outside. Keyboard: Tab to it, Enter / Space opens,
 * Esc closes. Hindi first, English below.
 *
 * Built on Popover (not Tooltip): a Radix Tooltip never opens on a phone tap.
 */
export function InfoTip({ term, content, side = "top", align = "center", className }: InfoTipProps) {
  const t: MisTerm | undefined = content ?? (term ? MIS_TERMS[term] : undefined);
  const [open, setOpen] = useState(false);
  const openedByHover = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(closeTimer.current), []);
  if (!t) return null;

  const hoverIn = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(closeTimer.current);
    if (!open) {
      openedByHover.current = true;
      setOpen(true);
    }
  };
  const hoverOut = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !openedByHover.current) return;
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        openedByHover.current = false;
        setOpen(o);
      }}
    >
      <PopoverPrimitive.Trigger
        type="button"
        aria-label={`What is "${t.title}"?`}
        onPointerEnter={hoverIn}
        onPointerLeave={hoverOut}
        onClick={(e) => {
          // Mouse already opened it on hover: a click "pins" it instead of closing.
          if (openedByHover.current && open) {
            e.preventDefault();
            openedByHover.current = false;
          }
        }}
        className={cn(
          // 28px box around a 14px glyph (negative margin keeps the label tight);
          // the ::before extends the touch area to 44px.
          "relative -m-1.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors",
          "before:absolute before:-inset-2 before:content-['']",
          "hover:text-slate-600 data-[state=open]:text-slate-700",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
          className
        )}
      >
        <Info className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={12}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onPointerEnter={hoverIn}
          onPointerLeave={hoverOut}
          className={cn(
            "z-50 w-[min(18rem,calc(100vw-24px))] rounded-lg border border-slate-200 bg-white p-3 text-left shadow-lg outline-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          )}
        >
          <p className="text-[13px] font-semibold text-slate-900">
            {t.hiTitle}
            <span className="font-normal text-slate-500"> · {t.title}</span>
          </p>
          <p lang="hi" className="mt-1 text-[13px] leading-5 text-slate-700">
            {t.hi}
          </p>
          <p className="mt-1.5 border-t border-slate-100 pt-1.5 text-xs leading-[18px] text-slate-500">
            {t.en}
          </p>
          <PopoverPrimitive.Arrow className="fill-white" width={10} height={5} />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/** Label text + its ⓘ, kept on one line. */
export function LabelWithInfo({
  children,
  term,
  content,
  className,
}: {
  children: React.ReactNode;
  term?: MisTermKey;
  content?: MisTerm;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span>{children}</span>
      {(term || content) && <InfoTip term={term} content={content} />}
    </span>
  );
}
