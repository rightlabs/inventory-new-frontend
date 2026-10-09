"use client";

import { Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// One table row for a server-searched list that has no rows to show:
//   loading → "Searching…" (search active) / "Loading…"
//   error   → "Could not load." + Retry
//   empty   → "No results for “X”." (search active) / emptyText
// Lists render it instead of their rows, and hide the page footer unless
// rows from the SAME response are on screen.
export type ListStatus = "loading" | "error" | "empty";

export default function ListStatusRow({
  status,
  colSpan,
  search = "",
  emptyText = "Nothing here yet.",
  onRetry,
}: {
  status: ListStatus;
  colSpan: number;
  search?: string;
  emptyText?: string;
  onRetry?: () => void;
}) {
  const q = search.trim();
  return (
    <tr data-testid={`list-status-${status}`}>
      {/* Left-aligned on phones: a wide table scrolls sideways and a centred
          message (and its Retry button) would sit off-screen. */}
      <td colSpan={colSpan} className="p-6 text-left sm:text-center text-sm text-muted-foreground">
        {status === "loading" && (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {q ? "Searching…" : "Loading…"}
          </span>
        )}
        {status === "error" && (
          <span className="inline-flex flex-wrap items-center gap-3 text-red-700">
            Could not load.
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry} data-testid="list-retry">
                <RotateCw className="h-3.5 w-3.5 mr-1.5" /> Retry
              </Button>
            )}
          </span>
        )}
        {status === "empty" && (q ? `No results for “${q}”.` : emptyText)}
      </td>
    </tr>
  );
}

// Same states outside a table (e.g. inventory tabs): a centred block.
export function ListStatusBlock(props: {
  status: ListStatus;
  search?: string;
  emptyText?: string;
  onRetry?: () => void;
}) {
  return (
    <table className="w-full">
      <tbody>
        <ListStatusRow colSpan={1} {...props} />
      </tbody>
    </table>
  );
}
