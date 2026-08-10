"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Layers,
  List,
  PlayCircle,
  Plus,
  RefreshCw,
  Terminal,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import {
  EnvironmentGapNotice,
  cardClass,
  inputClass,
  labelClass,
  monoClass,
  panelClass,
  thClass,
} from "../api-automation-shared";

type Action =
  | "buy"
  | "sell"
  | "amend"
  | "cancel"
  | "check"
  | "bulk-buy"
  | "bulk-sell"
  | "bulk-replace"
  | "bulk-cancel"
  | "cancel-all";
type Env = "dev" | "qa";
type Platform = "inet" | "pspp";
type Board = "RG" | "TN";
type TIF = "Day" | "GTC" | "Session";
type PriceMode = "tick" | "manual";

interface BulkOrderRow {
  symbol: string;
  side: "buy" | "sell";
  lots: number;
  priceMode: PriceMode;
  tickOffset: number;
  price: number;
  board: Board;
  timeInForce: TIF;
}
interface BulkAmendRow {
  orderToken: number;
  newPrice: number;
  newLots: number;
  priceMode: PriceMode;
  tickOffset: number;
}
interface BulkCancelRow {
  orderToken: number;
  orderUUID: string;
}

const ENV_OPTIONS: { value: Env; label: string; url: string }[] = [
  { value: "qa", label: "QA", url: "api-qa.growin.id" },
  { value: "dev", label: "Dev", url: "api-dev.growin.id" },
];

const ACTION_TABS: { value: Action; label: string; Icon: typeof TrendingUp }[] = [
  { value: "buy", label: "Buy", Icon: TrendingUp },
  { value: "sell", label: "Sell", Icon: TrendingDown },
  { value: "amend", label: "Amend", Icon: RefreshCw },
  { value: "cancel", label: "Cancel", Icon: X },
  { value: "check", label: "Orders", Icon: List },
];

const BULK_ACTION_TABS: { value: Action; label: string; Icon: typeof Layers }[] = [
  { value: "bulk-buy", label: "B.Buy", Icon: Layers },
  { value: "bulk-sell", label: "B.Sell", Icon: Layers },
  { value: "bulk-replace", label: "B.Amend", Icon: RefreshCw },
  { value: "bulk-cancel", label: "B.Cancel", Icon: Trash2 },
  { value: "cancel-all", label: "All Off", Icon: X },
];

const ORDER_COLUMNS = ["Time", "Symbol", "Side", "Price", "Lots", "Status", "Token/TxID", "OrderRef", "BrokerRef"];

/** IDX tick ladder — kept verbatim from the reference so the price preview is real. */
function getTickSize(price: number): number {
  if (price < 200) return 1;
  if (price < 500) return 2;
  if (price < 2_000) return 5;
  if (price < 5_000) return 10;
  return 25;
}

function applyTickOffset(basePrice: number, offset: number): number {
  if (!basePrice) return 0;
  const tick = getTickSize(basePrice);
  const raw = basePrice + offset * tick;
  const newTick = getTickSize(raw);
  return Math.max(newTick, Math.round(raw / newTick) * newTick);
}

const cellInputClass =
  "w-full rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
const sectionTitleClass = "text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400";
const stepButtonClass =
  "size-7 shrink-0 rounded-md border border-zinc-200 bg-zinc-100 text-sm font-bold text-zinc-700 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700";

function TickStepper({ value, onChange, hint }: { value: number; onChange: (next: number) => void; hint: string }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={stepButtonClass} onClick={() => onChange(value - 1)} aria-label="Decrease tick offset">
        −
      </button>
      <input
        type="number"
        className={`${cellInputClass} w-16 text-center`}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <button type="button" className={stepButtonClass} onClick={() => onChange(value + 1)} aria-label="Increase tick offset">
        +
      </button>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>
    </div>
  );
}

function PriceModeToggle({ value, onChange }: { value: PriceMode; onChange: (next: PriceMode) => void }) {
  return (
    <div className="flex gap-1">
      {(["tick", "manual"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
            value === option
              ? "bg-blue-600 text-white"
              : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
          }`}
        >
          {option === "tick" ? "Tick offset" : "Manual"}
        </button>
      ))}
    </div>
  );
}

function RowShell({ index, onRemove, children }: { index: number; onRemove: () => void; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">#{index + 1}</span>
        <button type="button" onClick={onRemove} className="text-zinc-400 hover:text-rose-600" aria-label="Remove row">
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>
      {children}
    </div>
  );
}

function AddRowButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-300 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
    >
      <Plus className="size-3.5" aria-hidden="true" />
      Add item
    </button>
  );
}

function BulkOrderTable({
  rows,
  side,
  onChange,
}: {
  rows: BulkOrderRow[];
  side: "buy" | "sell";
  onChange: (rows: BulkOrderRow[]) => void;
}) {
  const last = rows[rows.length - 1];
  const update = <K extends keyof BulkOrderRow>(index: number, field: K, value: BulkOrderRow[K]) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  const valid = rows.filter((row) => row.symbol && row.lots > 0).length;

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, index) => (
        <RowShell key={index} index={index} onRemove={() => onChange(rows.filter((_, i) => i !== index))}>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Symbol</span>
              <input
                className={`${cellInputClass} font-mono uppercase`}
                value={row.symbol}
                onChange={(e) => update(index, "symbol", e.target.value.toUpperCase())}
                placeholder="BBCA"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Lots</span>
              <input
                type="number"
                min={1}
                className={cellInputClass}
                value={row.lots}
                onChange={(e) => update(index, "lots", Number(e.target.value))}
              />
            </label>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className={labelClass}>Price</span>
              <PriceModeToggle value={row.priceMode} onChange={(next) => update(index, "priceMode", next)} />
            </div>
            {row.priceMode === "tick" ? (
              <TickStepper
                value={row.tickOffset}
                onChange={(next) => update(index, "tickOffset", next)}
                hint={row.tickOffset === 0 ? "market" : `${row.tickOffset > 0 ? "+" : ""}${row.tickOffset} tick`}
              />
            ) : (
              <input
                type="number"
                min={0}
                className={cellInputClass}
                value={row.price}
                onChange={(e) => update(index, "price", Number(e.target.value))}
                placeholder="e.g. 13800"
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Board</span>
              <select
                className={cellInputClass}
                value={row.board}
                onChange={(e) => update(index, "board", e.target.value as Board)}
              >
                <option value="RG">RG</option>
                <option value="TN">TN</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>TIF</span>
              <select
                className={cellInputClass}
                value={row.timeInForce}
                onChange={(e) => update(index, "timeInForce", e.target.value as TIF)}
              >
                <option value="Day">Day</option>
                <option value="GTC">GTC</option>
                <option value="Session">Session</option>
              </select>
            </label>
          </div>
        </RowShell>
      ))}
      {rows.length > 0 && (
        <p className={`text-xs ${valid === rows.length ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
          {valid}/{rows.length} items valid
        </p>
      )}
      <AddRowButton
        onClick={() =>
          onChange([
            ...rows,
            {
              symbol: last?.symbol ?? "",
              side,
              lots: 1,
              priceMode: last?.priceMode ?? "tick",
              tickOffset: last?.tickOffset ?? -3,
              price: 0,
              board: last?.board ?? "RG",
              timeInForce: last?.timeInForce ?? "Day",
            },
          ])
        }
      />
    </div>
  );
}

function BulkAmendTable({ rows, onChange }: { rows: BulkAmendRow[]; onChange: (rows: BulkAmendRow[]) => void }) {
  const update = <K extends keyof BulkAmendRow>(index: number, field: K, value: BulkAmendRow[K]) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, index) => {
        const computed = row.priceMode === "tick" && row.newPrice > 0 ? applyTickOffset(row.newPrice, row.tickOffset) : row.newPrice;
        return (
          <RowShell key={index} index={index} onRemove={() => onChange(rows.filter((_, i) => i !== index))}>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className={labelClass}>Order token</span>
                <input
                  type="number"
                  className={`${cellInputClass} font-mono`}
                  value={row.orderToken}
                  onChange={(e) => update(index, "orderToken", Number(e.target.value))}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={labelClass}>New lots</span>
                <input
                  type="number"
                  min={1}
                  className={cellInputClass}
                  value={row.newLots}
                  onChange={(e) => update(index, "newLots", Number(e.target.value))}
                />
              </label>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className={labelClass}>New price</span>
                <PriceModeToggle value={row.priceMode} onChange={(next) => update(index, "priceMode", next)} />
              </div>
              <input
                type="number"
                className={cellInputClass}
                value={row.newPrice}
                onChange={(e) => update(index, "newPrice", Number(e.target.value))}
                placeholder={row.priceMode === "tick" ? "Base price" : "e.g. 13800"}
              />
              {row.priceMode === "tick" && (
                <>
                  <TickStepper
                    value={row.tickOffset}
                    onChange={(next) => update(index, "tickOffset", next)}
                    hint={row.tickOffset === 0 ? "same" : `${row.tickOffset > 0 ? "+" : ""}${row.tickOffset} tick`}
                  />
                  {row.newPrice > 0 && (
                    <p className={monoClass}>
                      Rp {row.newPrice.toLocaleString("id-ID")} → Rp {computed.toLocaleString("id-ID")} (tick{" "}
                      {getTickSize(row.newPrice)})
                    </p>
                  )}
                </>
              )}
            </div>
          </RowShell>
        );
      })}
      <AddRowButton onClick={() => onChange([...rows, { orderToken: 0, newPrice: 0, newLots: 1, priceMode: "manual", tickOffset: 0 }])} />
    </div>
  );
}

function BulkCancelTable({ rows, onChange }: { rows: BulkCancelRow[]; onChange: (rows: BulkCancelRow[]) => void }) {
  const update = <K extends keyof BulkCancelRow>(index: number, field: K, value: BulkCancelRow[K]) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, index) => (
        <RowShell key={index} index={index} onRemove={() => onChange(rows.filter((_, i) => i !== index))}>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Order token</span>
              <input
                type="number"
                className={`${cellInputClass} font-mono`}
                value={row.orderToken}
                onChange={(e) => update(index, "orderToken", Number(e.target.value))}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Order UUID (optional)</span>
              <input
                className={`${cellInputClass} font-mono`}
                value={row.orderUUID}
                onChange={(e) => update(index, "orderUUID", e.target.value)}
                placeholder="for PENDING"
              />
            </label>
          </div>
        </RowShell>
      ))}
      <AddRowButton onClick={() => onChange([...rows, { orderToken: 0, orderUUID: "" }])} />
    </div>
  );
}

export function TradingView() {
  const [action, setAction] = useState<Action>("buy");
  const [env, setEnv] = useState<Env>("qa");
  const [platform, setPlatform] = useState<Platform>("inet");

  const [useEnvCreds, setUseEnvCreds] = useState(true);
  const [showCreds, setShowCreds] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");

  const [symbol, setSymbol] = useState("BMRI");
  const [lots, setLots] = useState(1);
  const [board, setBoard] = useState<Board>("RG");
  const [timeInForce, setTimeInForce] = useState<TIF>("Day");
  const [priceMode, setPriceMode] = useState<PriceMode>("tick");
  const [tickOffset, setTickOffset] = useState(-3);
  const [price, setPrice] = useState<number | "">("");

  const [orderToken, setOrderToken] = useState<number | "">("");
  const [newPrice, setNewPrice] = useState<number | "">("");
  const [newLots, setNewLots] = useState(1);
  const [orderReference, setOrderReference] = useState<number | "">("");
  const [brokerRef, setBrokerRef] = useState("");
  const [amendPriceMode, setAmendPriceMode] = useState<PriceMode>("manual");
  const [amendTickOffset, setAmendTickOffset] = useState(0);

  const [cancelMode, setCancelMode] = useState<"open" | "pending">("open");
  const [cancelOrderToken, setCancelOrderToken] = useState<number | "">("");
  const [cancelOrderRef, setCancelOrderRef] = useState<number | "">("");
  const [cancelMarketOId, setCancelMarketOId] = useState<number | "">("");
  const [cancelBrokerRef, setCancelBrokerRef] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [mediaType, setMediaType] = useState(3);
  const [bulkOrders, setBulkOrders] = useState<BulkOrderRow[]>([
    { symbol: "BBCA", side: "buy", lots: 1, priceMode: "tick", tickOffset: -3, price: 0, board: "RG", timeInForce: "Day" },
  ]);
  const [bulkAmends, setBulkAmends] = useState<BulkAmendRow[]>([
    { orderToken: 0, newPrice: 0, newLots: 1, priceMode: "manual", tickOffset: 0 },
  ]);
  const [bulkCancels, setBulkCancels] = useState<BulkCancelRow[]>([{ orderToken: 0, orderUUID: "" }]);

  const amendBasePrice = typeof newPrice === "number" ? newPrice : 0;
  const amendComputedPrice =
    amendPriceMode === "tick" && amendBasePrice ? applyTickOffset(amendBasePrice, amendTickOffset) : amendBasePrice;
  const activeEnv = ENV_OPTIONS.find((option) => option.value === env)!;

  const paramsTitle =
    action === "amend"
      ? "Amend params"
      : action === "cancel"
        ? "Cancel params"
        : action === "check"
          ? "Order filter"
          : action === "bulk-buy"
            ? "Bulk buy items"
            : action === "bulk-sell"
              ? "Bulk sell items"
              : action === "bulk-replace"
                ? "Bulk amend items"
                : action === "bulk-cancel"
                  ? "Bulk cancel items"
                  : action === "cancel-all"
                    ? "Cancel all config"
                    : "Order params";

  const actionLabel = [...ACTION_TABS, ...BULK_ACTION_TABS].find((tab) => tab.value === action)?.label ?? action;
  const isBulk = action.startsWith("bulk-") || action === "cancel-all";

  const actionTabClass = (value: Action) =>
    `flex flex-col items-center justify-center gap-1 rounded-md border px-1 py-2 text-[11px] font-semibold transition-colors ${
      action === value
        ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-300"
        : "border-transparent text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
    }`;

  const segmentClass = (active: boolean) =>
    `flex-1 rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors ${
      active
        ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-300"
        : "border-transparent text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
    }`;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Order tester — compose Buy / Sell / Amend / Cancel requests and watch the result stream.
      </p>

      {/* Ceiling: every action here is executed by the AI Factory trading bridge
          (POST /api/factory/api/trading/run), which logs into a real brokerage
          gateway with .env credentials, places live orders on api-{qa,dev}.growin.id
          over INET/PSPP websockets and streams the result back as SSE. No such
          bridge, credential store, or gateway exists in this app, so Run is
          disabled — the form deliberately cannot submit anywhere. Upgrade path:
          stand up the trading bridge and point Run at it. */}
      <EnvironmentGapNotice title="Order execution is not available in this environment">
        Running an order needs the AI Factory trading bridge, which authenticates against a real brokerage gateway and places
        live orders on <code className={monoClass}>{activeEnv.url}</code> over the INET/PSPP websockets, streaming the log
        back over SSE. That bridge is not part of this app and no credentials are configured, so <strong>Run is disabled</strong>{" "}
        and this form submits nowhere. The controls, tick-price math and result layout are the real ones, so the page is ready
        to wire up once a bridge exists.
      </EnvironmentGapNotice>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* ── Left: form ─────────────────────────────────────────────────── */}
        <div className="flex w-full shrink-0 flex-col gap-3 lg:w-80">
          <div className={`${cardClass} flex flex-col gap-3`}>
            <p className={sectionTitleClass}>Platform</p>
            <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
              {(["inet", "pspp"] as Platform[]).map((option) => (
                <button key={option} type="button" onClick={() => setPlatform(option)} className={segmentClass(platform === option)}>
                  {option.toUpperCase()}
                </button>
              ))}
            </div>
            <p className={monoClass}>
              {platform === "pspp"
                ? "market: /marketws-mme/ws · order: /orderws/ws"
                : "market: /marketdata/ws · order: /order/middleware/ws"}
            </p>

            <p className={sectionTitleClass}>Environment</p>
            <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
              {ENV_OPTIONS.map((option) => (
                <button key={option.value} type="button" onClick={() => setEnv(option.value)} className={segmentClass(env === option.value)}>
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
              <span className={monoClass}>{activeEnv.url}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                ID: <span className={monoClass}>{useEnvCreds ? "—" : userId || "—"}</span>
              </span>
            </div>
          </div>

          <div className={`${cardClass} flex flex-col gap-3`}>
            <div className="flex items-center justify-between">
              <p className={sectionTitleClass}>Credentials</p>
              <button
                type="button"
                onClick={() => setShowCreds((prev) => !prev)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                aria-label={showCreds ? "Collapse credentials" : "Expand credentials"}
              >
                {showCreds ? <ChevronUp className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}
              </button>
            </div>
            {showCreds && (
              <>
                <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={useEnvCreds}
                    onChange={(e) => setUseEnvCreds(e.target.checked)}
                    className="size-3.5 accent-blue-600"
                  />
                  Use credentials from the runner&apos;s environment
                </label>
                {useEnvCreds ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    No runner environment is attached, so there are no stored credentials to read.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="flex flex-col gap-1">
                      <span className={labelClass}>User ID</span>
                      <input className={inputClass} value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="e.g. 4737328" />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className={labelClass}>Password</span>
                      <div className="relative">
                        <input
                          className={`${inputClass} pr-9`}
                          type={showPwd ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd((prev) => !prev)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                          aria-label={showPwd ? "Hide password" : "Show password"}
                        >
                          {showPwd ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                        </button>
                      </div>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className={labelClass}>PIN</span>
                      <input
                        className={inputClass}
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        maxLength={6}
                        placeholder="6 digit PIN"
                      />
                    </label>
                  </div>
                )}
              </>
            )}
          </div>

          <div className={`${cardClass} flex flex-col gap-3`}>
            <p className={sectionTitleClass}>Action</p>
            <div className="grid grid-cols-5 gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
              {ACTION_TABS.map(({ value, label, Icon }) => (
                <button key={value} type="button" onClick={() => setAction(value)} className={actionTabClass(value)}>
                  <Icon className="size-3.5" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            {platform === "pspp" && (
              <>
                <div className="flex items-center gap-2">
                  <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Bulk · PSPP
                  </span>
                  <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                </div>
                <div className="grid grid-cols-5 gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
                  {BULK_ACTION_TABS.map(({ value, label, Icon }) => (
                    <button key={value} type="button" onClick={() => setAction(value)} className={actionTabClass(value)}>
                      <Icon className="size-3.5" aria-hidden="true" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className={`${cardClass} flex flex-col gap-3`}>
            <p className={sectionTitleClass}>{paramsTitle}</p>

            {(action === "buy" || action === "sell") && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className={labelClass}>Symbol</span>
                    <input
                      className={`${inputClass} font-mono uppercase`}
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      placeholder="BMRI"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={labelClass}>Lots</span>
                    <input type="number" min={0} className={inputClass} value={lots} onChange={(e) => setLots(Number(e.target.value))} />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className={labelClass}>Board</span>
                    <select className={inputClass} value={board} onChange={(e) => setBoard(e.target.value as Board)}>
                      <option value="RG">RG (Regular)</option>
                      <option value="TN">TN (Tunai)</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={labelClass}>TIF</span>
                    <select className={inputClass} value={timeInForce} onChange={(e) => setTimeInForce(e.target.value as TIF)}>
                      <option value="Day">Day</option>
                      <option value="GTC">GTC</option>
                      <option value="Session">Session</option>
                    </select>
                  </label>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className={labelClass}>Price</span>
                    <PriceModeToggle value={priceMode} onChange={setPriceMode} />
                  </div>
                  {priceMode === "tick" ? (
                    <TickStepper
                      value={tickOffset}
                      onChange={setTickOffset}
                      hint={
                        tickOffset < 0
                          ? `${Math.abs(tickOffset)} tick below`
                          : tickOffset > 0
                            ? `${tickOffset} tick above`
                            : "market price"
                      }
                    />
                  ) : (
                    <input
                      type="number"
                      className={inputClass}
                      value={price}
                      onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="e.g. 5000"
                    />
                  )}
                </div>
              </div>
            )}

            {action === "amend" && (
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className={labelClass}>Order token (from a Buy result)</span>
                  <input
                    type="number"
                    className={`${inputClass} font-mono`}
                    value={orderToken}
                    onChange={(e) => setOrderToken(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 12345"
                  />
                </label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className={labelClass}>New price (Rp)</span>
                    <PriceModeToggle value={amendPriceMode} onChange={setAmendPriceMode} />
                  </div>
                  <input
                    type="number"
                    className={inputClass}
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder={amendPriceMode === "tick" ? "Base price" : "e.g. 5100"}
                  />
                  {amendPriceMode === "tick" && (
                    <>
                      <TickStepper
                        value={amendTickOffset}
                        onChange={setAmendTickOffset}
                        hint={amendTickOffset === 0 ? "same price" : `${amendTickOffset > 0 ? "+" : ""}${amendTickOffset} tick`}
                      />
                      {amendBasePrice > 0 && (
                        <p className={monoClass}>
                          Rp {amendBasePrice.toLocaleString("id-ID")} → Rp {amendComputedPrice.toLocaleString("id-ID")} (tick{" "}
                          {getTickSize(amendBasePrice)})
                        </p>
                      )}
                    </>
                  )}
                </div>
                <label className="flex flex-col gap-1">
                  <span className={labelClass}>New lots</span>
                  <input type="number" min={0} className={inputClass} value={newLots} onChange={(e) => setNewLots(Number(e.target.value))} />
                </label>
                <details>
                  <summary className="cursor-pointer text-xs text-zinc-500 dark:text-zinc-400">Optional fields</summary>
                  <div className="mt-2 flex flex-col gap-2">
                    <label className="flex flex-col gap-1">
                      <span className={labelClass}>Order reference</span>
                      <input
                        type="number"
                        className={`${inputClass} font-mono`}
                        value={orderReference}
                        onChange={(e) => setOrderReference(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="OrderReferenceNumber"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className={labelClass}>Broker reference</span>
                      <input
                        className={`${inputClass} font-mono`}
                        value={brokerRef}
                        onChange={(e) => setBrokerRef(e.target.value)}
                        placeholder="NewBrokerReferenceExt"
                      />
                    </label>
                  </div>
                </details>
              </div>
            )}

            {action === "cancel" && (
              <div className="flex flex-col gap-3">
                <div className="flex gap-1">
                  {(["open", "pending"] as const).map((option) => (
                    <button key={option} type="button" onClick={() => setCancelMode(option)} className={segmentClass(cancelMode === option)}>
                      {option === "open" ? "OPEN (accepted)" : "PENDING (submitted)"}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {cancelMode === "open"
                    ? "Order is already on the exchange — needs order token + order reference + broker reference."
                    : "Order is queued in the OMS — needs the market order ID or the broker reference."}
                </p>
                {cancelMode === "open" ? (
                  <>
                    <label className="flex flex-col gap-1">
                      <span className={labelClass}>Order token (user_order_id)</span>
                      <input
                        type="number"
                        className={`${inputClass} font-mono`}
                        value={cancelOrderToken}
                        onChange={(e) => setCancelOrderToken(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="e.g. 156"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className={labelClass}>Order reference (market_order_id)</span>
                      <input
                        type="number"
                        className={`${inputClass} font-mono`}
                        value={cancelOrderRef}
                        onChange={(e) => setCancelOrderRef(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="e.g. 8734"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className={labelClass}>Broker reference (market_client_order_id)</span>
                      <input
                        className={`${inputClass} font-mono uppercase`}
                        value={cancelBrokerRef}
                        onChange={(e) => setCancelBrokerRef(e.target.value)}
                        placeholder="e.g. MBBE43F3"
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label className="flex flex-col gap-1">
                      <span className={labelClass}>Market order ID</span>
                      <input
                        type="number"
                        className={`${inputClass} font-mono`}
                        value={cancelMarketOId}
                        onChange={(e) => setCancelMarketOId(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="OMS TransactionId"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className={labelClass}>Broker reference (full)</span>
                      <input
                        className={`${inputClass} font-mono`}
                        value={cancelBrokerRef}
                        onChange={(e) => setCancelBrokerRef(e.target.value)}
                        placeholder="e.g. GW7657549@MBBE43F3"
                      />
                    </label>
                  </>
                )}
              </div>
            )}

            {action === "check" && (
              <div className="flex flex-col gap-2">
                <label className="flex flex-col gap-1">
                  <span className={labelClass}>Filter status (optional)</span>
                  <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All</option>
                    <option value="OPEN">OPEN</option>
                    <option value="PENDING">PENDING</option>
                    <option value="DONE">DONE</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Fetches the 30 most recent orders via the REST API.</p>
              </div>
            )}

            {isBulk && (
              <label className="flex flex-col gap-1">
                <span className={labelClass}>Media type (3 = GW default · 2 = GP)</span>
                <input
                  type="number"
                  min={1}
                  max={9}
                  className={`${inputClass} w-24`}
                  value={mediaType}
                  onChange={(e) => setMediaType(Number(e.target.value))}
                />
              </label>
            )}

            {action === "bulk-buy" && (
              <BulkOrderTable
                rows={bulkOrders.filter((row) => row.side === "buy")}
                side="buy"
                onChange={(rows) => setBulkOrders((prev) => [...prev.filter((row) => row.side !== "buy"), ...rows])}
              />
            )}
            {action === "bulk-sell" && (
              <BulkOrderTable
                rows={bulkOrders.filter((row) => row.side === "sell")}
                side="sell"
                onChange={(rows) => setBulkOrders((prev) => [...prev.filter((row) => row.side !== "sell"), ...rows])}
              />
            )}
            {action === "bulk-replace" && <BulkAmendTable rows={bulkAmends} onChange={setBulkAmends} />}
            {action === "bulk-cancel" && <BulkCancelTable rows={bulkCancels} onChange={setBulkCancels} />}
            {action === "cancel-all" && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                This would cancel <strong>every</strong> active order for the current user.
              </p>
            )}
          </div>

          <button
            type="button"
            disabled
            title="The AI Factory trading bridge is not available in this environment"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-500"
          >
            <PlayCircle className="size-4" aria-hidden="true" />
            Run {actionLabel}
          </button>
        </div>

        {/* ── Right: log / order list ────────────────────────────────────── */}
        <div className={`flex min-h-80 min-w-0 flex-1 flex-col ${panelClass}`}>
          <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <Terminal className="size-4 text-zinc-400" aria-hidden="true" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {action === "check" ? "Order list" : "Log output"}
            </span>
            <span className="ml-auto rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
              idle
            </span>
          </div>

          {action === "check" ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {ORDER_COLUMNS.map((column) => (
                      <th key={column} className={thClass}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={ORDER_COLUMNS.length} className="px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                      No orders can be fetched — the trading bridge is not available in this environment.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <p className="max-w-sm text-center text-sm text-zinc-500 dark:text-zinc-400">
                The log stream is empty because no order can be submitted from this environment. Each line here would be one
                SSE frame from the trading bridge, colour-coded by PASS / FAIL / error.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
