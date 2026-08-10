"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Play, Plus, RefreshCw, TriangleAlert, X } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
// Mirrors the field set collected by the reference k6 burst-order screens
// (qa-central-dashboard/src/pages/BurstOrder.tsx + LoopingBurstOrder.tsx):
// environment, account templating, stock list, and either a "burst" load
// profile (VUs/iterations/runtime/interval, with per-script depth/side
// options) or a "looping" profile (lot/loop/price/side/order-type per stock).

export type Env = "QA" | "DEV";
/** The five parameterized `script` values the reference passes to <BurstOrder />. */
export type BurstScript = "burst" | "fill-bid" | "fill-offer" | "fill-both" | "at-price";
/** Persisted in `config.mode` so saved orders stay attributable to one page. */
export type OrderMode = BurstScript | "looping";
export type OrderSide = "buy" | "sell" | "both";
export type PriceMode = "tick" | "manual";
export type OrderType = "RG" | "TN";

export interface BurstOrderConfig {
  looping: boolean;
  env: Env;
  mode: OrderMode;
  side: OrderSide;
  orderType: OrderType;
  username: string;
  mailDomain: string;
  numStart: number;
  padDigits: number;
  relayUrl: string;
  stocks: string[];
  virtualUsers: number;
  iterations: number;
  runtimeSec: number;
  intervalMs: number;
  depthMin: number;
  depthMax: number;
  lot: number;
  loop: number;
  priceMode: PriceMode;
  priceTick: number;
  priceManual: number | null;
}

export interface BurstOrderRecord {
  id: string;
  name: string;
  config: Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_STOCKS = ["BBRI", "BMRI", "TLKM", "ADRO"];

export const DEFAULT_CONFIG: BurstOrderConfig = {
  looping: false,
  env: "QA",
  mode: "burst",
  side: "both",
  orderType: "RG",
  username: "mostng",
  mailDomain: "guysmail.com",
  numStart: 50,
  padDigits: 3,
  relayUrl: "http://localhost:3777",
  stocks: DEFAULT_STOCKS,
  virtualUsers: 5,
  iterations: 1,
  runtimeSec: 60,
  intervalMs: 500,
  depthMin: 1,
  depthMax: 5,
  lot: 1,
  loop: 1,
  priceMode: "tick",
  priceTick: 0,
  priceManual: null,
};

export const MODE_LABELS: Record<OrderMode, string> = {
  burst: "Random Burst",
  "fill-bid": "Fill Bid",
  "fill-offer": "Fill Offer",
  "fill-both": "Fill Both Sides",
  "at-price": "At Price",
  looping: "Looping Order",
};

/** Per-menu subtitles, copied from the reference's page-subtitle strings. */
export const MODE_SUBTITLES: Record<OrderMode, string> = {
  burst: "Random buy/sell burst at tradeable price.",
  "fill-bid": "Fill bid orderbook with buy orders below tradeable price.",
  "fill-offer": "Fill offer orderbook with sell orders above tradeable price.",
  "fill-both": "Fill both bid and offer sides simultaneously.",
  "at-price": "Buy and/or sell at the current market price.",
  looping: "Place repeated lot orders per account across selected stocks.",
};

/** Stock-list hint per script, as the reference shows above its tag input. */
export const STOCK_HINTS: Record<OrderMode, string> = {
  burst: "Orders placed randomly across these stocks each interval",
  "fill-bid": "Buy orders below tradeable price for each stock",
  "fill-offer": "Sell orders above tradeable — user must hold these stocks",
  "fill-both": "Bid & offer for each stock — offer side requires portfolio",
  "at-price": "Orders at current tradeable price for each stock",
  looping: "Orders placed across these stocks each loop",
};

/** The k6 script each mode runs, shown in the command preview. */
export const SCRIPT_FILES: Record<OrderMode, string> = {
  burst: "Growin_BurstOrder_V4_Enhanced.js",
  "fill-bid": "Growin_FillBidOrderbook.js",
  "fill-offer": "Growin_FillOfferOrderbook.js",
  "fill-both": "Growin_FillBothSides.js",
  "at-price": "Growin_BurstAtPrice.js",
  looping: "Growin_LoopingOrder.js",
};

// ── Tailwind class constants ───────────────────────────────────────────────

export const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
export const cardClass =
  "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50";
export const cardHeaderClass =
  "flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800";
export const gridClass = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";
export const hintClass = "text-xs text-zinc-500 dark:text-zinc-400";
export const primaryButtonClass =
  "inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const STATUS_STYLES: Record<string, string> = {
  draft: "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
  queued: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
};

export function statusStyle(status: string): string {
  return STATUS_STYLES[status] ?? STATUS_STYLES.draft;
}

// ── Helpers ───────────────────────────────────────────────────────────────

export function paddedNum(n: number, pad: number): string {
  return String(Math.max(0, n)).padStart(pad, "0");
}

export function fmtDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Account list preview, matching the reference's "…and N more" behavior. */
export function previewAccounts(config: BurstOrderConfig, count: number): string[] {
  if (!config.username) return [];
  const start = Math.max(0, config.numStart);
  const total = Math.max(0, count);
  const suffix = (n: number) => (config.padDigits > 0 ? paddedNum(n, config.padDigits) : String(n));
  const domain = config.mailDomain ? `@${config.mailDomain}` : "";
  const shown = Math.min(total, 3);
  const items: string[] = [];
  for (let i = 0; i < shown; i += 1) items.push(`${config.username}${suffix(start + i)}${domain}`);
  if (total > 3) items.push(`…and ${total - 3} more (up to ${config.username}${suffix(start + total - 1)})`);
  return items;
}

async function responseError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as { error?: unknown } | null;
  return typeof body?.error === "string" ? body.error : `Request failed (${res.status})`;
}

/** Which page a stored order belongs to. Rows saved before the split carried
 *  `looping: boolean` + `mode`, so both shapes are honored. */
export function orderMode(config: Record<string, unknown>): OrderMode {
  const c = config as Partial<BurstOrderConfig>;
  if (c.looping === true || c.mode === "looping") return "looping";
  return (c.mode as BurstScript) ?? "burst";
}

// ── Data hook ─────────────────────────────────────────────────────────────

/**
 * Loads every saved burst order and narrows the list to one mode, so the Fill
 * Bid page never lists At Price rows. Create/run hit the same endpoints the
 * single-page version used.
 */
export function useBurstOrders(mode: OrderMode) {
  const [allOrders, setAllOrders] = useState<BurstOrderRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/burst-orders");
      if (!res.ok) throw new Error(await responseError(res));
      const data = (await res.json()) as { orders: BurstOrderRecord[] };
      setAllOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load orders");
      setAllOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const orders = useMemo(
    () => (allOrders === null ? null : allOrders.filter((order) => orderMode(order.config) === mode)),
    [allOrders, mode],
  );

  const create = useCallback(async (name: string, config: BurstOrderConfig): Promise<boolean> => {
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/burst-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, config }),
      });
      if (!res.ok) throw new Error(await responseError(res));
      const data = (await res.json()) as { order: BurstOrderRecord };
      setAllOrders((prev) => [data.order, ...(prev ?? [])]);
      return true;
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create burst order");
      return false;
    } finally {
      setCreating(false);
    }
  }, []);

  // Stub execution ceiling: k6 needs on-prem SSH access (ONPREM_SSH_USER/
  // PASSWORD in the reference app), which this environment doesn't have.
  // "Run" only advances the record to "queued". Upgrade path: once SSH access
  // exists, a worker polls for status="queued" rows and actually executes k6
  // against them, flipping status onward — this UI/API stays as-is.
  const run = useCallback(async (id: string) => {
    setRunningId(id);
    try {
      const res = await fetch(`/api/burst-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "queued" }),
      });
      if (!res.ok) throw new Error(await responseError(res));
      const data = (await res.json()) as { order: BurstOrderRecord };
      setAllOrders((prev) => (prev ?? []).map((order) => (order.id === id ? data.order : order)));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to queue order");
    } finally {
      setRunningId(null);
    }
  }, []);

  return { orders, loading, loadError, reload, create, creating, createError, run, runningId };
}

// ── Field primitives ──────────────────────────────────────────────────────

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-zinc-400 dark:text-zinc-500">{hint}</span> : null}
    </label>
  );
}

export function ToggleRow<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Partial<Record<T, string>>;
}) {
  return (
    <div className="inline-flex rounded-md border border-zinc-300 p-0.5 dark:border-zinc-700">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${
            value === opt
              ? "bg-blue-600 text-white"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          {labels?.[opt] ?? opt}
        </button>
      ))}
    </div>
  );
}

export function NumberField({
  label,
  hint,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={inputClass}
      />
    </Field>
  );
}

export function WarnBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export function StockTags({ stocks, onChange }: { stocks: string[]; onChange: (s: string[]) => void }) {
  const [input, setInput] = useState("");

  const add = () => {
    const sym = input.toUpperCase().replace(/[^A-Z0-9-]/g, "").trim();
    if (sym && !stocks.includes(sym)) onChange([...stocks, sym]);
    setInput("");
  };
  const remove = (sym: string) => onChange(stocks.filter((s) => s !== sym));

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {stocks.map((sym) => (
          <span
            key={sym}
            className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300"
          >
            {sym}
            <button
              type="button"
              onClick={() => remove(sym)}
              aria-label={`Remove ${sym}`}
              className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-100"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        {stocks.length === 0 && <span className={hintClass}>At least one stock required</span>}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
            if (e.key === "Backspace" && !input && stocks.length) remove(stocks[stocks.length - 1]);
          }}
          placeholder="e.g. TLKM"
          maxLength={10}
          className={`${inputClass} flex-1 font-mono uppercase placeholder:text-zinc-400`}
        />
        <button
          type="button"
          onClick={add}
          disabled={!input.trim()}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </div>
      <div className="mt-1.5 flex gap-3 text-xs">
        <button
          type="button"
          onClick={() => onChange(DEFAULT_STOCKS)}
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Reset defaults
        </button>
        <button
          type="button"
          onClick={() => onChange([])}
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Clear all
        </button>
      </div>
    </div>
  );
}

// ── Shared field groups ───────────────────────────────────────────────────

export type SetField = <K extends keyof BurstOrderConfig>(key: K, value: BurstOrderConfig[K]) => void;

/** Username/domain/start/pad + account preview — identical on every screen. */
export function AccountSetupFields({
  config,
  setField,
  accountCount,
}: {
  config: BurstOrderConfig;
  setField: SetField;
  accountCount: number;
}) {
  const accounts = previewAccounts(config, accountCount);
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Username prefix" hint="Numbers appended automatically">
          <input
            value={config.username}
            onChange={(e) => setField("username", e.target.value)}
            className={`${inputClass} font-mono`}
          />
        </Field>
        <Field label="Email domain">
          <input
            value={config.mailDomain}
            onChange={(e) => setField("mailDomain", e.target.value)}
            className={`${inputClass} font-mono`}
          />
        </Field>
        <NumberField label="Start #" hint="First suffix" value={config.numStart} onChange={(v) => setField("numStart", v)} min={0} />
        <NumberField
          label="Pad digits"
          hint={config.padDigits > 0 ? `e.g. ${paddedNum(config.numStart, config.padDigits)}` : "No padding"}
          value={config.padDigits}
          onChange={(v) => setField("padDigits", v)}
          min={0}
          max={6}
        />
      </div>
      {accounts.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/60">
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Account preview</p>
          {accounts.map((account) => (
            <p
              key={account}
              className={`font-mono text-xs ${account.startsWith("…") ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"}`}
            >
              {account}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function RelayField({ config, setField }: { config: BurstOrderConfig; setField: SetField }) {
  return (
    <Field label="Market data relay URL" hint="k6 reads live tradeable prices from this relay">
      <input
        value={config.relayUrl}
        onChange={(e) => setField("relayUrl", e.target.value)}
        className={`${inputClass} font-mono`}
      />
    </Field>
  );
}

export function StockListField({ config, setField, hint }: { config: BurstOrderConfig; setField: SetField; hint: string }) {
  return (
    <Field label={`Stock list (${config.stocks.length} symbol${config.stocks.length !== 1 ? "s" : ""})`} >
      <p className={`mb-2 ${hintClass}`}>{hint}</p>
      <StockTags stocks={config.stocks} onChange={(stocks) => setField("stocks", stocks)} />
    </Field>
  );
}

export function SummaryRow({ breakdown, totalOrders }: { breakdown: React.ReactNode; totalOrders: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <span className="text-zinc-600 dark:text-zinc-400">{breakdown}</span>
      <span className="font-semibold text-amber-600 dark:text-amber-400">{totalOrders} orders</span>
    </div>
  );
}

/** Collapsible `k6 run …` preview, mirroring the reference's command preview. */
export function CommandPreview({ lines }: { lines: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`overflow-hidden ${cardClass}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-2.5 font-mono text-xs text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
      >
        Command preview
        <span aria-hidden="true">{open ? "↑" : "↓"}</span>
      </button>
      {open && (
        <pre className="overflow-x-auto border-t border-zinc-200 bg-zinc-50 px-5 py-3 font-mono text-xs leading-5 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          {lines.join(" \\\n  ")}
        </pre>
      )}
    </div>
  );
}

// ── Create form shell ─────────────────────────────────────────────────────

export function CreateOrderCard({
  title,
  name,
  onNameChange,
  config,
  setField,
  children,
  createError,
  creating,
  canSave,
  onSave,
}: {
  title: string;
  name: string;
  onNameChange: (v: string) => void;
  config: BurstOrderConfig;
  setField: SetField;
  children: React.ReactNode;
  createError: string | null;
  creating: boolean;
  canSave: boolean;
  onSave: () => void;
}) {
  return (
    <section className={cardClass}>
      <div className={cardHeaderClass}>
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{MODE_LABELS[config.mode]}</span>
      </div>
      <div className="flex flex-col gap-5 p-5">
        <Field label="Order name">
          <input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. QA smoke burst — BBRI/TLKM"
            className={inputClass}
          />
        </Field>

        <div>
          <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Environment</span>
          <ToggleRow options={["QA", "DEV"] as const} value={config.env} onChange={(v) => setField("env", v)} />
        </div>

        {children}

        {createError && <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>}

        <div>
          <button type="button" onClick={onSave} disabled={creating || !canSave} className={primaryButtonClass}>
            <Plus className="size-4" aria-hidden="true" />
            {creating ? "Saving…" : "Save as draft"}
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Saved orders list ─────────────────────────────────────────────────────

export function SavedOrders({
  heading,
  detailHeader,
  renderDetail,
  orders,
  loading,
  loadError,
  onReload,
  onRun,
  runningId,
  emptyText,
}: {
  heading: string;
  detailHeader: string;
  renderDetail: (config: Partial<BurstOrderConfig>) => React.ReactNode;
  orders: BurstOrderRecord[] | null;
  loading: boolean;
  loadError: string | null;
  onReload: () => void;
  onRun: (id: string) => void;
  runningId: string | null;
  emptyText: string;
}) {
  return (
    <section className={cardClass}>
      <div className={cardHeaderClass}>
        <h2 className="text-sm font-semibold">{heading}</h2>
        <button
          type="button"
          onClick={onReload}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline disabled:opacity-50 dark:text-blue-400"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {loadError && <p className="px-5 pt-4 text-sm text-red-600 dark:text-red-400">{loadError}</p>}

      {loading && orders === null ? (
        <p className="px-5 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      ) : orders && orders.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <th className="px-5 py-2 font-medium">Name</th>
                <th className="px-5 py-2 font-medium">Env</th>
                <th className="px-5 py-2 font-medium">{detailHeader}</th>
                <th className="px-5 py-2 font-medium">Stocks</th>
                <th className="px-5 py-2 font-medium">Status</th>
                <th className="px-5 py-2 font-medium">Updated</th>
                <th className="px-5 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders?.map((order) => {
                const config = order.config as Partial<BurstOrderConfig>;
                return (
                  <tr key={order.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60">
                    <td className="px-5 py-3 font-medium text-zinc-900 dark:text-zinc-100">{order.name}</td>
                    <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">{config.env ?? "—"}</td>
                    <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">{renderDetail(config)}</td>
                    <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">
                      {Array.isArray(config.stocks) ? config.stocks.length : 0}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyle(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">{fmtDate(order.updatedAt)}</td>
                    <td className="px-5 py-3">
                      {order.status === "draft" ? (
                        <button
                          type="button"
                          onClick={() => onRun(order.id)}
                          disabled={runningId === order.id}
                          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Play className="size-3.5" aria-hidden="true" />
                          {runningId === order.id ? "Queuing…" : "Run"}
                        </button>
                      ) : order.status === "queued" ? (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">Queued</span>
                      ) : (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {orders?.some((order) => order.status === "queued") && (
        <p className="border-t border-zinc-200 px-5 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Execution requires on-prem SSH access to the trading test environment, which isn&apos;t available here. Queued
          orders are recorded but will not run automatically.
        </p>
      )}
    </section>
  );
}
