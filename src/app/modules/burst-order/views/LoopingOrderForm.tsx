"use client";

import { useState } from "react";
import {
  AccountSetupFields,
  CommandPreview,
  CreateOrderCard,
  DEFAULT_CONFIG,
  Field,
  NumberField,
  RelayField,
  SCRIPT_FILES,
  STOCK_HINTS,
  SavedOrders,
  StockListField,
  SummaryRow,
  ToggleRow,
  WarnBox,
  gridClass,
  useBurstOrders,
  type BurstOrderConfig,
} from "../burst-order-shared";

const ORDER_TYPE_HINTS = {
  RG: "Regular — standard T+2 settlement",
  TN: "Tunai — cash settlement T+0",
} as const;

/** Looping Burst Order: its own field set (lot / loop / price / side / type). */
const LOOPING_DEFAULTS: BurstOrderConfig = {
  ...DEFAULT_CONFIG,
  mode: "looping",
  looping: true,
  side: "buy",
  priceMode: "tick",
  priceTick: 0,
  priceManual: null,
  orderType: "RG",
};

function tickHint(tick: number): string {
  if (tick === 0) return "At tradeable price (0 offset)";
  if (tick > 0) return `${tick} tick(s) above tradeable price`;
  return `${Math.abs(tick)} tick(s) below tradeable price`;
}

export function LoopingOrderForm() {
  const { orders, loading, loadError, reload, create, creating, createError, run, runningId } = useBurstOrders("looping");

  const [name, setName] = useState("");
  const [config, setConfig] = useState<BurstOrderConfig>(LOOPING_DEFAULTS);

  const setField = <K extends keyof BurstOrderConfig>(key: K, value: BurstOrderConfig[K]) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  const totalOrders = Math.max(0, config.lot) * Math.max(0, config.loop) * config.stocks.length;
  const canSave = name.trim().length > 0 && config.stocks.length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    const ok = await create(name.trim(), config);
    if (!ok) return;
    setName("");
    setConfig(LOOPING_DEFAULTS);
  };

  const priceValue = config.priceMode === "manual" ? config.priceManual ?? 0 : config.priceTick;

  const commandLines = [
    `../k6 run ${SCRIPT_FILES.looping}`,
    `-e ENV=${config.env}`,
    `-e USERNAME=${config.username}`,
    `-e MAIL=${config.mailDomain}`,
    `-e PAD=${config.padDigits}`,
    `-e NUMSTART=${config.numStart}`,
    `-e RELAY_URL=${config.relayUrl}`,
    `-e STOCKS=${config.stocks.join(",")}`,
    `-e LOT=${config.lot}`,
    `-e LOOP=${config.loop}`,
    `-e PRICE_MODE=${config.priceMode.toUpperCase()}`,
    `-e PRICE=${priceValue}`,
    `-e SIDE=${config.side.toUpperCase()}`,
    `-e ORDER_TYPE=${config.orderType}`,
  ];

  return (
    <div className="flex flex-col gap-6">
      <CreateOrderCard
        title="New Looping Order"
        name={name}
        onNameChange={setName}
        config={config}
        setField={setField}
        createError={createError}
        creating={creating}
        canSave={canSave}
        onSave={handleSave}
      >
        <div className={gridClass}>
          <NumberField label="Jumlah lot" hint="Lot per order" value={config.lot} onChange={(v) => setField("lot", v)} min={1} />
          <NumberField label="Looping" hint="Repeat count" value={config.loop} onChange={(v) => setField("loop", v)} min={1} />

          <Field label="Order side" hint={config.side === "sell" ? "Sell orders only" : "Buy orders only"}>
            <ToggleRow
              options={["buy", "sell"] as const}
              value={config.side === "sell" ? "sell" : "buy"}
              onChange={(v) => setField("side", v)}
            />
          </Field>

          <Field label="Order type" hint={ORDER_TYPE_HINTS[config.orderType]}>
            <ToggleRow
              options={["RG", "TN"] as const}
              value={config.orderType}
              onChange={(v) => setField("orderType", v)}
              labels={{ RG: "RG", TN: "TN" }}
            />
          </Field>

          <Field label="Price mode">
            <ToggleRow
              options={["tick", "manual"] as const}
              value={config.priceMode}
              onChange={(v) => setField("priceMode", v)}
              labels={{ tick: "Tick offset", manual: "Manual" }}
            />
          </Field>

          {config.priceMode === "tick" ? (
            <NumberField
              label="Tick offset"
              hint={tickHint(config.priceTick)}
              value={config.priceTick}
              onChange={(v) => setField("priceTick", v)}
              min={-20}
              max={20}
            />
          ) : (
            <Field label="Exact price (Rp)" hint="Fixed price — bypasses market price lookup">
              <input
                type="number"
                min={1}
                placeholder="e.g. 3500"
                value={config.priceManual ?? ""}
                onChange={(e) => setField("priceManual", e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 font-mono text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </Field>
          )}
        </div>

        {config.side === "sell" && <WarnBox>Sell orders require portfolio holdings on the generated account.</WarnBox>}

        <AccountSetupFields config={config} setField={setField} accountCount={1} />
        <RelayField config={config} setField={setField} />
        <StockListField config={config} setField={setField} hint={STOCK_HINTS.looping} />

        <SummaryRow
          breakdown={
            <>
              <strong>{config.lot}</strong> lot × <strong>{config.loop}</strong> loop ×{" "}
              <strong>{config.stocks.length}</strong> stock
            </>
          }
          totalOrders={totalOrders}
        />
      </CreateOrderCard>

      <CommandPreview lines={commandLines} />

      <SavedOrders
        heading="Saved Looping Orders"
        detailHeader="Lots"
        renderDetail={(saved) => `${saved.lot ?? 0} lot × ${saved.loop ?? 0} loop`}
        orders={orders}
        loading={loading}
        loadError={loadError}
        onReload={reload}
        onRun={run}
        runningId={runningId}
        emptyText="No looping orders yet. Create one above."
      />
    </div>
  );
}
