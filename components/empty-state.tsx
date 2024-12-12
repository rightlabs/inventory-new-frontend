import { PackageX } from "lucide-react";

export function EmptyState({
  title = "No data found",
  description = "Start by creating your first entry.",
}) {
  return (
    <div className="flex h-[450px] w-full flex-col items-center justify-center">
      <PackageX className="h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-medium text-muted-foreground">
        {title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
