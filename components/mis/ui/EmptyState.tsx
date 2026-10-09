import { FileSearch, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  /** e.g. "No bills in this period" */
  title: string;
  /** What to do next, e.g. "Try All time or a longer period." */
  description?: React.ReactNode;
  icon?: LucideIcon;
  /** A button / link, or { label, onClick } for a plain outline button. */
  action?: React.ReactNode | { label: string; onClick: () => void };
  /** "md" for a page block, "sm" for inside a table or modal. */
  size?: "sm" | "md";
  className?: string;
}

const isActionObj = (a: unknown): a is { label: string; onClick: () => void } =>
  !!a && typeof a === "object" && "label" in a && "onClick" in a;

/** Friendly empty state: says what is missing and what to try next. */
export function EmptyState({ title, description, icon: Icon = FileSearch, action, size = "md", className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "md" ? "px-6 py-10" : "px-4 py-7",
        className
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-slate-100 text-slate-400",
          size === "md" ? "h-11 w-11" : "h-9 w-9"
        )}
        aria-hidden
      >
        <Icon className={size === "md" ? "h-5 w-5" : "h-[18px] w-[18px]"} />
      </span>
      <p className={cn("mt-3 font-medium text-slate-800", size === "md" ? "text-base" : "text-sm")}>{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] leading-5 text-slate-500">{description}</p>}
      {action && (
        <div className="mt-3">
          {isActionObj(action) ? (
            <button
              type="button"
              onClick={action.onClick}
              className="h-9 rounded-md border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 active:scale-[0.98]"
            >
              {action.label}
            </button>
          ) : (
            action
          )}
        </div>
      )}
    </div>
  );
}

/** The same, as a full-width table row. */
export function EmptyRow({ colSpan, ...props }: EmptyStateProps & { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        <EmptyState size="sm" {...props} />
      </td>
    </tr>
  );
}
