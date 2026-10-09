// Unit checks for the MIS UI pure helpers + display formatters.
// Run: TZ=Asia/Kolkata bun scripts/test-mis-ui.ts
import assert from "node:assert/strict";
import {
  groupRowsByDay,
  dailyInOutSeries,
  cashRowType,
  customerHighlights,
  modeParts,
} from "../components/mis/ui/helpers";
import { formatINRSmart, formatINRShort } from "../utils/formatSmart";
import { netSentenceText } from "../components/mis/ui/NetSentence";

let n = 0;
const t = (name: string, fn: () => void) => {
  fn();
  n++;
  console.log("  ok", name);
};

// --------------------------------------------------------- groupRowsByDay
t("groups by local (IST) day, keeps API order, adds up in/out/net", () => {
  const rows = [
    // 9 Oct IST (03:58Z = 09:28 IST)
    { date: "2026-10-09T03:58:55.663Z", direction: "in" as const, amount: 50000 },
    { date: "2026-10-09T04:33:43.237Z", direction: "out" as const, amount: 51142 },
    { date: "2026-10-09T05:00:00.000Z", direction: "in" as const, amount: 32960 },
    { date: "2026-10-09T06:00:00.000Z", direction: "out" as const, amount: 32960 },
    // 20:00Z on 8 Oct = 01:30 IST on 9 Oct -> belongs to 9 Oct
    { date: "2026-10-08T20:00:00.000Z", direction: "in" as const, amount: 0.1 },
    // 8 Oct IST
    { date: "2026-10-08T10:00:00.000Z", direction: "in" as const, amount: 0.2 },
    { date: "2026-10-08T11:00:00.000Z", direction: "in" as const, amount: 0.1 },
  ];
  const g = groupRowsByDay(rows);
  assert.equal(g.length, 2);
  assert.equal(g[0].key, "2026-10-09");
  assert.equal(g[0].count, 5);
  assert.equal(g[0].in, 82960.1);
  assert.equal(g[0].out, 84102);
  assert.equal(g[0].net, -1141.9);
  assert.equal(g[1].key, "2026-10-08");
  assert.equal(g[1].in, 0.3); // 0.2 + 0.1 float drift rounded to paise
  assert.equal(g[1].out, 0);
  assert.equal(g[1].net, 0.3);
  assert.equal(g[1].date.getDate(), 8);
  assert.equal(g[0].rows[0], rows[0]); // same objects, same order
});

t("empty input -> no groups", () => {
  assert.deepEqual(groupRowsByDay([]), []);
});

t("group totals add up to the whole", () => {
  const rows = Array.from({ length: 200 }, (_, i) => ({
    date: new Date(Date.UTC(2026, 8, 1 + (i % 17), 6)).toISOString(),
    direction: (i % 3 ? "in" : "out") as "in" | "out",
    amount: Math.round((i * 1234.567) % 99999) / 100,
  }));
  const g = groupRowsByDay(rows);
  const sum = (k: "in" | "out") => Math.round(g.reduce((a, x) => a + x[k], 0) * 100);
  const raw = (d: string) => Math.round(rows.filter((r) => r.direction === d).reduce((a, r) => a + r.amount, 0) * 100);
  assert.equal(sum("in"), raw("in"));
  assert.equal(sum("out"), raw("out"));
  assert.equal(g.length, 17);
});

// --------------------------------------------------------- dailyInOutSeries
t("series fills quiet days with 0, oldest first", () => {
  const s = dailyInOutSeries(
    [
      { key: "2026-10-09", in: 5, out: 1 },
      { key: "2026-10-07", in: 2, out: 0 },
    ],
    { startDate: "2026-10-06", endDate: "2026-10-09" }
  );
  assert.deepEqual(s.map((p) => p.date), ["2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09"]);
  assert.deepEqual(s.map((p) => p.in), [0, 2, 0, 5]);
});

// --------------------------------------------------------- cashRowType
t("row type from documentRef / kind", () => {
  assert.equal(cashRowType({ documentRef: "Sale", kind: "Sale payment" }), "sale");
  assert.equal(cashRowType({ documentRef: "Sale", kind: "Refund – SO890 cancelled" }), "refund");
  assert.equal(cashRowType({ documentRef: "Freight", kind: "Freight – PO071" }), "freight");
  assert.equal(cashRowType({ documentRef: "Receipt" }), "receipt");
  assert.equal(cashRowType({ documentRef: "Advance" }), "advance");
  assert.equal(cashRowType({ documentRef: "Payment" }), "vendor");
  assert.equal(cashRowType({ documentRef: "Purchase" }), "purchase");
  assert.equal(cashRowType({ documentRef: "X" }), "other");
});

// --------------------------------------------------------- customerHighlights
t("top customer + loss count/total/worst", () => {
  const h = customerHighlights([
    { name: "A", profit: 1200, margin: 8 },
    { name: "B", profit: -300, margin: -2 },
    { name: "C", profit: 5000, margin: 11 },
    { name: "D", profit: -700.25, margin: -9 },
    { name: "E", profit: 0, margin: 0 },
  ]);
  assert.equal(h.top?.name, "C");
  assert.equal(h.losers.count, 2);
  assert.equal(h.losers.total, -1000.25);
  assert.equal(h.losers.worst?.name, "D");
  const none = customerHighlights([{ name: "Z", profit: -1, margin: null }]);
  assert.equal(none.top, null);
});

// --------------------------------------------------------- modeParts
t("mode parts hide zeros; shares only when all positive", () => {
  const a = modeParts({ cash: 51540, online: 14320, cheque: 17100, other: 0 });
  assert.deepEqual(a.parts.map((p) => p.mode), ["cash", "online", "cheque"]);
  assert.equal(a.allPositive, true);
  assert.ok(Math.abs(a.parts.reduce((x, p) => x + p.share, 0) - 1) < 1e-9);
  const b = modeParts({ cash: 24000, online: -25381, cheque: 0, other: 0 });
  assert.equal(b.allPositive, false);
  assert.deepEqual(b.parts.map((p) => p.share), [0, 0]);
});

// --------------------------------------------------------- formatters
t("formatINRSmart drops .00, keeps real paise, Indian commas", () => {
  assert.equal(formatINRSmart(82960), "₹82,960");
  assert.equal(formatINRSmart(84102.12), "₹84,102.12");
  assert.equal(formatINRSmart(84102.1), "₹84,102.10");
  assert.equal(formatINRSmart(6371415.33), "₹63,71,415.33");
  assert.equal(formatINRSmart(-1142), "−₹1,142");
  assert.equal(formatINRSmart(500, { signed: true }), "+₹500");
  assert.equal(formatINRSmart(0, { signed: true }), "₹0");
  assert.equal(formatINRSmart(-0.001), "₹0");
  assert.equal(formatINRSmart(1.005), "₹1.01");
});

t("formatINRShort uses K / L / Cr", () => {
  assert.equal(formatINRShort(950), "₹950");
  assert.equal(formatINRShort(4500), "₹4.5K");
  assert.equal(formatINRShort(45000), "₹45K");
  assert.equal(formatINRShort(350000), "₹3.5L");
  assert.equal(formatINRShort(3500000), "₹35L");
  assert.equal(formatINRShort(12000000), "₹1.2Cr");
  assert.equal(formatINRShort(-750000), "−₹7.5L");
  assert.equal(formatINRShort(0), "₹0");
});

t("net sentence", () => {
  assert.equal(netSentenceText(-1142), "₹1,142 more went out than came in");
  assert.equal(netSentenceText(5000), "₹5,000 more came in than went out");
  assert.equal(netSentenceText(0), "Money in and out are equal");
});

console.log(`\n${n} checks passed`);
