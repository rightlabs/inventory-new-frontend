import { cn } from "@/lib/utils";
import {
  BalanceEntity,
  balanceLabel,
  formatBalance,
  isAdvanceBalance,
} from "@/utils/format";

// Account balance for lists: "₹X" or green "₹X Adv". With `entity`, shows the
// worded form ("Customer owes ₹X" / "Advance received ₹X" / "You owe ₹X" /
// "Advance with vendor ₹X").
export default function BalanceAmount({
  value,
  entity,
  className,
}: {
  value: number | null | undefined;
  entity?: BalanceEntity;
  className?: string;
}) {
  const adv = isAdvanceBalance(value);
  return (
    <span
      className={cn(adv && "text-green-600 font-medium", className)}
      data-advance={adv ? "true" : undefined}
    >
      {entity ? balanceLabel(entity, value) : formatBalance(value)}
    </span>
  );
}
