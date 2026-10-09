"use client";

// ============================================================================
// DEV ONLY — MIS UI kit demo. Not linked from the sidebar. Delete this folder
// (app/(dashboard)/mis-ui-demo) before release; nothing imports it.
// Real-data sections only make GET calls to the backend in .env.local.
// ============================================================================

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, subDays } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, Scale, Undo2, Package, TrendingUp, IndianRupee, Inbox } from "lucide-react";
import { useUser } from "@/contexts/userContext";
import { getCashBook, getCustomerProfit, getCustomerProfitDetail, type CashBook, type CashBookRow, type CustomerProfit, type CustomerProfitDetail } from "@/api/mis";
import { getCustomerById } from "@/api/customer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  StatCard,
  ModeSplit,
  NetSentence,
  InfoTip,
  LabelWithInfo,
  MIS_TERMS,
  type MisTermKey,
  DayGroupRow,
  DayGroupHeader,
  SignedAmount,
  TypeTag,
  TYPE_META,
  DailyInOutChart,
  MarginBadge,
  HighlightCard,
  CodeBadge,
  DateCell,
  PeriodFilter,
  periodToApiRange,
  EmptyState,
  EmptyRow,
  PartyTitle,
  ProfitSummaryChips,
  ProfitEntryRow,
  ProfitTotalRow,
  ProfitEntryHead,
  groupRowsByDay,
  dailyInOutSeries,
  cashRowType,
  customerHighlights,
  type PeriodValue,
  type TagType,
  type ProfitEntryLike,
  type DayGroup,
} from "@/components/mis/ui";

// ---------------------------------------------------------------- sample data
// Money in 82,960 = Cash 51,540 + Online 14,320 + Cheque 17,100
// Money out 84,102.12; Net −1,142.12 (Cash +24,000, Online −25,381, Cheque +238.88)
const S_IN = { total: 82960, cash: 51540, online: 14320, cheque: 17100, other: 0, count: 14 };
const S_OUT = { total: 84102.12, cash: 27540, online: 39701, cheque: 16861.12, other: 0, count: 6 };
const S_NET = { total: -1142.12, cash: 24000, online: -25381, cheque: 238.88, other: 0, count: 20 };

const today = new Date();
const ymd = (d: Date) => format(d, "yyyy-MM-dd");
// Deterministic "organic" daily numbers for 30 days (Sundays quiet).
const SAMPLE_SERIES = Array.from({ length: 30 }, (_, i) => {
  const d = subDays(today, 29 - i);
  const quiet = d.getDay() === 0;
  const a = ((i * 7919) % 97) / 97;
  const b = ((i * 104729) % 89) / 89;
  return {
    date: ymd(d),
    in: quiet ? 0 : Math.round((40000 + a * 260000) / 10) * 10,
    out: quiet ? 0 : i % 4 === 1 ? Math.round((120000 + b * 300000) / 10) * 10 : Math.round(b * 45000),
  };
});

const SAMPLE_ENTRIES: ProfitEntryLike[] = [
  { type: "bill", number: "SO883", date: subDays(today, 0).toISOString(), sales: 46620, cost: 42576.6, returns: 0, profit: 4043.4 },
  { type: "bill", number: "SO871", date: subDays(today, 1).toISOString(), sales: 9902, cost: 8664.86, returns: 0, profit: 1237.14 },
  { type: "sale-return", number: "SO840", date: subDays(today, 3).toISOString(), sales: 0, cost: -615, returns: 800, profit: -185 },
  { type: "bill", number: "SO840", date: subDays(today, 6).toISOString(), sales: 17730, cost: 15618.48, returns: 0, profit: 2111.52 },
  { type: "customer-return", number: "RET004", date: subDays(today, 9).toISOString(), sales: 0, cost: -1275, returns: 1500, profit: -225 },
  { type: "bill", number: "SO812", date: subDays(today, 12).toISOString(), sales: 5416.2, cost: 5583.4, returns: 0, profit: -167.2 },
];
const SAMPLE_TOTALS = {
  bills: 4,
  sales: 79668.2,
  returns: 2300,
  cost: 70553.34,
  returnsCost: 1890,
  profit: 6814.86,
  margin: 8.81,
};

const presetLast30 = () => ({ startDate: ymd(subDays(today, 29)), endDate: ymd(today) });

// ---------------------------------------------------------------- page
export default function MisUiDemoPage() {
  const router = useRouter();
  const { user } = useUser();
  useEffect(() => {
    if (user && user.role !== "admin") router.replace("/sales");
  }, [user, router]);
  if (user?.role !== "admin") return null;
  return <Demo />;
}

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4 space-y-4 border-t border-slate-200 pt-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {note && <p className="mt-0.5 max-w-3xl text-sm text-slate-500">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Demo() {
  const range = useMemo(presetLast30, []);
  const [cash, setCash] = useState<CashBook | null>(null);
  const [cashErr, setCashErr] = useState(false);
  const [cp, setCp] = useState<CustomerProfit | null>(null);

  useEffect(() => {
    getCashBook({ ...range, all: true })
      .then(setCash)
      .catch(() => setCashErr(true));
    getCustomerProfit(range.startDate, range.endDate)
      .then(setCp)
      .catch(() => setCp(null));
  }, [range]);

  const groups = useMemo(() => (cash ? groupRowsByDay(cash.rows) : []), [cash]);
  const realSeries = useMemo(() => dailyInOutSeries(groups, range), [groups, range]);
  const hl = useMemo(() => (cp ? customerHighlights(cp.rows) : null), [cp]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 pb-16">
      <header className="space-y-3">
        <p className="inline-flex items-center rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900 ring-1 ring-inset ring-amber-300">
          DEV ONLY · delete app/(dashboard)/mis-ui-demo before release
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">MIS UI kit</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          New pieces for the MIS screens. Sample data first, then real data from the local backend
          ({format(new Date(`${range.startDate}T00:00:00`), "d MMM")} – {format(today, "d MMM yyyy")}).
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {[
            ["cash", "Cash Book cards"],
            ["overview", "Overview KPIs"],
            ["split", "ModeSplit"],
            ["bits", "Small pieces"],
            ["chart", "Daily chart"],
            ["real", "Real cash book"],
            ["profit", "Customer Profit"],
            ["modal", "Profit modal"],
            ["terms", "Terms"],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline">
              {label}
            </a>
          ))}
        </nav>
      </header>

      {/* ------------------------------------------------ Cash book cards */}
      <Section id="cash" title="Cash Book totals — StatCard + ModeSplit + NetSentence" note="Replaces the 3 cards whose mode split was one long '= Cash ₹… + Online ₹…' line. Sample numbers.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard title="Money in" info="moneyIn" amount={S_IN.total} tone="in" icon={ArrowDownLeft} meta={`${S_IN.count} payments`} sub="Received from customers">
            <ModeSplit split={S_IN} />
          </StatCard>
          <StatCard title="Money out" info="moneyOut" amount={S_OUT.total} tone="out" icon={ArrowUpRight} meta={`${S_OUT.count} payments`} sub="Paid to vendors, freight, refunds">
            <ModeSplit split={S_OUT} />
          </StatCard>
          <StatCard className="md:col-span-2 xl:col-span-1" title="Net (In − Out)" info="net" amount={S_NET.total} tone="auto" icon={Scale} sub={<NetSentence net={S_NET.total} />}>
            <ModeSplit split={S_NET} />
          </StatCard>
        </div>
        <p className="text-sm font-medium text-slate-700">Real totals, last 30 days</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard title="Money in" info="moneyIn" amount={cash?.totals.in.total} tone="in" icon={ArrowDownLeft} loading={!cash && !cashErr} meta={cash && `${cash.totals.in.count} payments`} sub="Received from customers">
            {cash ? <ModeSplit split={cash.totals.in} /> : <span />}
          </StatCard>
          <StatCard title="Money out" info="moneyOut" amount={cash?.totals.out.total} tone="out" icon={ArrowUpRight} loading={!cash && !cashErr} meta={cash && `${cash.totals.out.count} payments`} sub="Paid to vendors, freight, refunds">
            {cash ? <ModeSplit split={cash.totals.out} /> : <span />}
          </StatCard>
          <StatCard className="md:col-span-2 xl:col-span-1" title="Net (In − Out)" info="net" amount={cash?.totals.net.total} tone="auto" icon={Scale} loading={!cash && !cashErr} sub={cash ? <NetSentence net={cash.totals.net.total} /> : ""}>
            {cash ? <ModeSplit split={cash.totals.net} /> : <span />}
          </StatCard>
        </div>
        <p className="text-sm font-medium text-slate-700">Loading state</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard title="Money in" info="moneyIn" loading tone="in" icon={ArrowDownLeft} sub="">
            <span />
          </StatCard>
        </div>
      </Section>

      {/* ------------------------------------------------ Overview */}
      <Section id="overview" title="Overview KPIs — StatCard size md" note="4 in a row on wide screens. Every label has an ⓘ.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard size="md" title="Sales" info="sales" amount={2153334.65} icon={IndianRupee} meta="855 bills" sub="After returns" />
          <StatCard size="md" title="Cost (COGS)" info="cost" amount={2020285.92} icon={Package} sub="Freight included" />
          <StatCard
            size="md"
            title="Gross profit"
            info="grossProfit"
            amount={114154.59}
            tone="auto"
            icon={TrendingUp}
            sub={
              <span className="inline-flex items-center gap-1.5">
                Margin <MarginBadge margin={5.35} />
              </span>
            }
          />
          <StatCard size="md" title="Returns" info="returns" amount={18895.14} icon={Undo2} meta="22 returns" sub="Cost ₹17,477 back in stock" />
        </div>
      </Section>

      {/* ------------------------------------------------ ModeSplit variants */}
      <Section id="split" title="ModeSplit — every case">
        <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
          {[
            { label: "All three modes", split: S_IN },
            { label: "With 'Not recorded' (old entries)", split: { cash: 125000, online: 38250, cheque: 0, other: 9800 } },
            { label: "One mode only (zeros hidden)", split: { cash: 0, online: 25000, cheque: 0, other: 0 } },
            { label: "Share %", split: S_IN, showShare: true },
            { label: "Net: mixed signs → signed chips, no bar", split: S_NET },
            { label: "All zero", split: { cash: 0, online: 0, cheque: 0, other: 0 } },
          ].map((c) => (
            <div key={c.label} className="space-y-2">
              <p className="text-xs font-medium text-slate-500">{c.label}</p>
              <div className="max-w-md rounded-lg border border-slate-200 bg-white p-4">
                <ModeSplit split={c.split} showShare={c.showShare} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------ Small pieces */}
      <Section id="bits" title="Small pieces">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Demo2 title="NetSentence">
            <div className="space-y-2">
              <NetSentence net={-1142} />
              <NetSentence net={5000} />
              <NetSentence net={0} />
            </div>
          </Demo2>
          <Demo2 title="SignedAmount (right aligned, tabular)">
            <div className="ml-auto w-40 space-y-1 text-right">
              <div><SignedAmount value={500} /></div>
              <div><SignedAmount value={300} direction="out" /></div>
              <div><SignedAmount value={128450.5} direction="in" /></div>
              <div><SignedAmount value={0} /></div>
            </div>
          </Demo2>
          <Demo2 title="TypeTag">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TYPE_META) as TagType[]).map((k) => (
                <TypeTag key={k} type={k} />
              ))}
            </div>
          </Demo2>
          <Demo2 title="MarginBadge (low < 5%, loss < 0%)">
            <div className="flex flex-wrap items-center gap-2">
              <MarginBadge margin={12.49} />
              <MarginBadge margin={5.35} />
              <MarginBadge margin={3.2} />
              <MarginBadge margin={0} />
              <MarginBadge margin={-3.09} />
              <MarginBadge margin={null} />
            </div>
          </Demo2>
          <Demo2 title="CodeBadge (kind from prefix)">
            <div className="space-y-2 text-sm">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-900">Suhel Ahamad</span> <CodeBadge code="C153" />
              </p>
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-900">Jindal Pipes Pvt Ltd</span> <CodeBadge code="V006" />
              </p>
              <div className="flex flex-wrap gap-2">
                {["SO883", "RET004", "PO032", "VPAY-0001", "X-17"].map((c) => (
                  <CodeBadge key={c} code={c} />
                ))}
              </div>
            </div>
          </Demo2>
          <Demo2 title="DateCell (column of dates lines up)">
            <div className="flex flex-wrap gap-8">
              <div className="space-y-2">
                <div><DateCell date={today} /></div>
                <div><DateCell date={subDays(today, 1)} /></div>
                <div><DateCell date={subDays(today, 13)} /></div>
                <div><DateCell date={new Date(2026, 4, 19)} /></div>
              </div>
              <div className="space-y-2">
                <div><DateCell date={new Date(new Date().setHours(10, 3, 0, 0))} time /></div>
                <div><DateCell date={subDays(today, 4)} time hint="weekday" /></div>
              </div>
            </div>
          </Demo2>
          <Demo2 title="InfoTip (hover, tap, Enter / Esc)">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
              <LabelWithInfo term="margin">Margin</LabelWithInfo>
              <LabelWithInfo term="cost">Cost (COGS)</LabelWithInfo>
              <LabelWithInfo term="advance">Advance</LabelWithInfo>
              <LabelWithInfo term="cashBook">Cash Book</LabelWithInfo>
            </div>
          </Demo2>
          <Demo2 title="EmptyState">
            <EmptyState
              size="sm"
              icon={Inbox}
              title="No bills in this period"
              description="Try 'All time' or a longer period."
              action={{ label: "Show all time", onClick: () => {} }}
            />
          </Demo2>
        </div>
      </Section>

      {/* ------------------------------------------------ Chart */}
      <Section id="chart" title="DailyInOutChart" note="In goes up, out goes down from the line, so direction never depends on colour alone. Hover / tap a day for full amounts.">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ChartBox title="Sample — 30 days">
            <DailyInOutChart data={SAMPLE_SERIES} />
          </ChartBox>
          <ChartBox title="Real — last 30 days (local backend)">
            <DailyInOutChart data={realSeries} loading={!cash && !cashErr} />
          </ChartBox>
          <ChartBox title="Empty">
            <DailyInOutChart data={SAMPLE_SERIES.map((p) => ({ ...p, in: 0, out: 0 }))} height={200} />
          </ChartBox>
          <ChartBox title="Loading">
            <DailyInOutChart data={[]} loading height={200} />
          </ChartBox>
        </div>
      </Section>

      {/* ------------------------------------------------ Real cash book */}
      <Section id="real" title="Cash book grouped by day — real data" note="groupRowsByDay + DayGroupRow (sticks under the table header while you scroll) + DateCell + TypeTag + CodeBadge + SignedAmount.">
        <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-white" data-testid="demo-cash-table">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-slate-100">
              <tr className="border-b border-slate-200">
                <th className="h-[45px] px-3 text-left text-xs font-medium text-slate-600">Time</th>
                <th className="px-3 text-left text-xs font-medium text-slate-600">Party</th>
                <th className="px-3 text-left text-xs font-medium text-slate-600">Type</th>
                <th className="px-3 text-left text-xs font-medium text-slate-600">Mode</th>
                <th className="px-3 text-right text-xs font-medium text-slate-600">Amount</th>
                <th className="px-3 text-left text-xs font-medium text-slate-600">Bill / Ref</th>
              </tr>
            </thead>
            <tbody>
              {!cash && !cashErr &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-4 animate-pulse rounded bg-slate-100" style={{ width: `${50 + ((i + j) * 13) % 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))}
              {cashErr && <EmptyRow colSpan={6} title="Could not load the cash book" description="Is the local backend running on :9010?" />}
              {cash && groups.length === 0 && <EmptyRow colSpan={6} title="No money in or out on these dates" description="Pick a longer date range." />}
              {groups.map((g) => (
                <DayRows key={g.key} g={g} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="mb-2 text-xs font-medium text-slate-500">DayGroupHeader on its own (e.g. for a mobile card list), and the "partial page" wording</p>
          <DayGroupHeader date={today} in={82960} out={84102.12} net={-1142.12} count={11} />
          <DayGroupHeader className="mt-3 border-t border-slate-100 pt-3" date={subDays(today, 1)} in={45000} out={0} net={45000} count={25} partial />
        </div>
      </Section>

      {/* ------------------------------------------------ Customer profit */}
      <Section id="profit" title="Customer Profit — HighlightCard" note="Top of the Customer Profit tab. customerHighlights(rows) picks the numbers.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <HighlightCard
            label="Most profitable customer"
            info="grossProfit"
            tone="good"
            loading={!cp}
            isEmpty={!!cp && !hl?.top}
            emptyText="No customer made a profit in these dates"
            primary={hl?.top?.name}
            secondary={hl?.top && <CodeBadge code={hl.top.code} kind="customer" />}
            amount={hl?.top?.profit}
            amountLabel="profit"
            sub={
              hl?.top && (
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  <MarginBadge margin={hl.top.margin} /> on {hl.top.bills} bills worth ₹
                  {Math.round(hl.top.sales).toLocaleString("en-IN")}
                </span>
              )
            }
            onClick={() => {}}
          />
          <HighlightCard
            label="Customers with a loss"
            tone="bad"
            loading={!cp}
            isEmpty={!!cp && hl?.losers.count === 0}
            emptyText="No customer gave a loss in these dates"
            primary={hl && `${hl.losers.count} ${hl.losers.count === 1 ? "customer" : "customers"}`}
            amount={hl?.losers.total}
            amountLabel="total loss"
            sub={
              hl?.losers.worst && (
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  Biggest: {hl.losers.worst.name} <CodeBadge code={hl.losers.worst.code} kind="customer" />
                  <SignedAmount value={hl.losers.worst.profit} plus={false} />
                </span>
              )
            }
          />
          <HighlightCard label="Customers with a loss" tone="bad" isEmpty emptyText="No customer gave a loss in these dates" />
          <HighlightCard label="Most profitable customer" tone="good" loading />
        </div>
      </Section>

      {/* ------------------------------------------------ Modal mock */}
      <Section id="modal" title="Customer Profit modal — mock" note="Header (name + code + phone), PeriodFilter, summary chips, bill / return rows, total. Sample rows first; the button opens a real dialog with live data.">
        <ProfitModalBody
          name="Suhel Ahamad"
          code="C023"
          phone="8808211442"
          entries={SAMPLE_ENTRIES}
          totals={SAMPLE_TOTALS}
          returnsCount={2}
          frame
        />
        <RealProfitDialog customerId={cp?.rows.find((r) => r.returnsCount > 0)?.customerId ?? cp?.rows[0]?.customerId} />
      </Section>

      {/* ------------------------------------------------ Terms */}
      <Section id="terms" title="MIS_TERMS — every explanation">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
          {(Object.keys(MIS_TERMS) as MisTermKey[]).map((k) => {
            const t = MIS_TERMS[k];
            return (
              <div key={k} className="border-b border-slate-100 pb-3">
                <dt className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                  {t.title} <span className="font-normal text-slate-500">· {t.hiTitle}</span>
                  <InfoTip term={k} />
                </dt>
                <dd lang="hi" className="mt-1 text-sm text-slate-700">{t.hi}</dd>
                <dd className="mt-0.5 text-xs text-slate-500">{t.en}</dd>
              </div>
            );
          })}
        </dl>
      </Section>
    </div>
  );
}

function Demo2({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <div className="rounded-lg border border-slate-200 bg-white p-4">{children}</div>
    </div>
  );
}

function ChartBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <p className="mb-3 text-sm font-medium text-slate-700">{title}</p>
      {children}
    </div>
  );
}

const MODE_LABEL = { cash: "Cash", online: "Online", cheque: "Cheque", other: "Not recorded" } as const;

function DayRows({ g }: { g: DayGroup<CashBookRow> }) {
  return (
    <>
      <DayGroupRow colSpan={6} date={g.date} in={g.in} out={g.out} net={g.net} count={g.count} />
      {g.rows.map((r) => {
        const type = cashRowType(r);
        const bill = ["Sale", "Purchase", "Payment", "Freight"].includes(r.documentRef) ? r.documentNumber : "";
        return (
          <tr key={r._id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
            <td className="whitespace-nowrap px-3 py-2.5 text-[13px] tabular-nums text-slate-500">{format(new Date(r.date), "h:mm a").toLowerCase()}</td>
            <td className="px-3 py-2.5">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-slate-900">{r.party || "—"}</span>
                {r.partyCode && <CodeBadge code={r.partyCode} />}
              </span>
            </td>
            <td className="px-3 py-2.5">
              <TypeTag type={type} />
            </td>
            <td className="px-3 py-2.5 text-slate-600">{MODE_LABEL[r.mode]}</td>
            <td className="px-3 py-2.5 text-right">
              <SignedAmount value={r.amount} direction={r.direction} />
            </td>
            <td className="px-3 py-2.5">
              {bill ? <CodeBadge code={bill} /> : <span className="text-slate-400">—</span>}
              {r.reference && r.reference !== bill && <span className="ml-1.5 text-xs text-slate-500">Ref {r.reference}</span>}
            </td>
          </tr>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------- modal body
function ProfitModalBody({
  name,
  code,
  phone,
  entries,
  totals,
  returnsCount,
  period,
  onPeriod,
  loading,
  frame,
}: {
  name: string;
  code?: string;
  phone?: string;
  entries: ProfitEntryLike[];
  totals: React.ComponentProps<typeof ProfitSummaryChips>["totals"];
  returnsCount?: number;
  period?: PeriodValue;
  onPeriod?: (v: PeriodValue) => void;
  loading?: boolean;
  frame?: boolean;
}) {
  const [localPeriod, setLocalPeriod] = useState<PeriodValue>({ preset: "all" });
  const p = period ?? localPeriod;
  const setP = onPeriod ?? setLocalPeriod;
  const shown = frame && p.preset !== "all" ? entries.filter((e) => (!p.from || ymd(new Date(e.date)) >= p.from) && (!p.to || ymd(new Date(e.date)) <= p.to)) : entries;

  return (
    <div className={frame ? "mx-auto min-w-0 max-w-4xl rounded-xl border border-slate-200 bg-white p-4 shadow-lg sm:p-6" : "min-w-0"}>
      {frame && (
        <div className="mb-4">
          <PartyTitle name={name} code={code} phone={phone} />
          <p className="mt-1 text-sm text-slate-500">Bills and returns, with the profit on each.</p>
        </div>
      )}
      <div className="space-y-4">
        <PeriodFilter value={p} onChange={setP} />
        {loading ? (
          <div className="flex flex-wrap gap-1.5">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-8 w-28 animate-pulse rounded-md bg-slate-100" />)}</div>
        ) : (
          <ProfitSummaryChips totals={totals} />
        )}
        <div className="max-h-[60vh] overflow-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-slate-100">
              <ProfitEntryHead />
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-4 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))}
              {!loading && shown.length === 0 && (
                <EmptyRow
                  colSpan={6}
                  icon={Inbox}
                  title="No bills in this period"
                  description="Try 'All time' or a longer period."
                  action={{ label: "Show all time", onClick: () => setP({ preset: "all" }) }}
                />
              )}
              {!loading && shown.map((e, i) => <ProfitEntryRow key={i} entry={e} />)}
            </tbody>
            {!loading && shown.length > 0 && (
              <tfoot>
                <ProfitTotalRow totals={totals} returnsCount={returnsCount} />
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

function RealProfitDialog({ customerId }: { customerId?: string }) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<PeriodValue>({ preset: "all" });
  const [detail, setDetail] = useState<CustomerProfitDetail | null>(null);
  const [phone, setPhone] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !customerId) return;
    let off = false;
    setLoading(true);
    const r = periodToApiRange(period);
    getCustomerProfitDetail(customerId, r.startDate, r.endDate)
      .then((d) => !off && setDetail(d))
      .catch(() => !off && setDetail(null))
      .finally(() => !off && setLoading(false));
    return () => {
      off = true;
    };
  }, [open, customerId, period]);

  useEffect(() => {
    if (!open || !customerId || phone) return;
    getCustomerById(customerId)
      .then((res: any) => setPhone(res?.data?.phone || res?.data?.data?.phone))
      .catch(() => {});
  }, [open, customerId, phone]);

  const returnsCount = detail?.entries.filter((e) => e.type !== "bill").length ?? 0;

  return (
    <>
      <button
        type="button"
        disabled={!customerId}
        onClick={() => setOpen(true)}
        className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50"
        data-testid="open-real-profit"
      >
        Open real dialog (live data)
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-4xl" data-testid="cp-detail-demo">
          <DialogHeader>
            <DialogTitle asChild>
              <div>
                <PartyTitle name={detail?.customer.name ?? "Loading…"} code={detail?.customer.code} phone={phone} />
              </div>
            </DialogTitle>
            <DialogDescription>Bills and returns, with the profit on each.</DialogDescription>
          </DialogHeader>
          <ProfitModalBody
            name={detail?.customer.name ?? ""}
            entries={detail?.entries ?? []}
            totals={detail?.totals ?? { bills: 0, sales: 0, returns: 0, cost: 0, profit: 0, margin: null }}
            returnsCount={returnsCount}
            period={period}
            onPeriod={setPeriod}
            loading={loading && !detail}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
