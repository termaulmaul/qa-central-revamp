"use client";

import { useState } from "react";
import {
  AccountSetupFields,
  CommandPreview,
  CreateOrderCard,
  DEFAULT_CONFIG,
  Field,
  MODE_LABELS,
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
  type BurstScript,
} from "../burst-order-shared";

const DEPTH_SCRIPTS: BurstScript[] = ["fill-bid", "fill-offer", "fill-both"];

const SIDE_HINTS = {
  buy: "Buy orders only at tradeable price",
  sell: "Sell orders only — portfolio required",
  both: "Randomly buys or sells; falls back to buy if no qty",
} as const;

/**
 * The five load-profile burst pages. The reference renders one <BurstOrder />
 * parameterized by `script`; the only field differences are the depth range
 * (fill-bid / fill-offer / fill-both) and the order side (at-price).
 */
export function BurstOrderForm({ script }: { script: BurstScript }) {
  const { orders, loading, loadError, reload, create, creating, createError, run, runningId } = useBurstOrders(script);

  const [name, setName] = useState("");
  const [config, setConfig] = useState<BurstOrderConfig>({ ...DEFAULT_CONFIG, mode: script, looping: false });

  const setField = <K extends keyof BurstOrderConfig>(key: K, value: BurstOrderConfig[K]) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  const usesDepth = DEPTH_SCRIPTS.includes(script);
  const isAtPrice = script === "at-price";
  // Same condition the reference uses to warn about sell-side orders.
  const needsPortfolio =
    script === "fill-offer" || script === "fill-both" || (isAtPrice && (config.side === "sell" || config.side === "both"));

  const totalOrders = Math.max(0, config.virtualUsers) * Math.max(0, config.iterations);
  const canSave = name.trim().length > 0 && config.stocks.length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    const ok = await create(name.trim(), config);
    if (!ok) return;
    setName("");
    setConfig({ ...DEFAULT_CONFIG, mode: script, looping: false });
  };

  const commandLines = [
    `../k6 run ${SCRIPT_FILES[script]}`,
    `-e ENV=${config.env}`,
    `-e USERNAME=${config.username}`,
    `-e MAIL=${config.mailDomain}`,
    `-e PAD=${config.padDigits}`,
    `-e NUMSTART=${config.numStart}`,
    `-e USER=${config.virtualUsers}`,
    `-e ITER=${config.iterations}`,
    `-e RUNTIME=${config.runtimeSec}`,
    `-e INTERVAL=${config.intervalMs}`,
    `-e RELAY_URL=${config.relayUrl}`,
    `-e STOCKS=${config.stocks.join(",")}`,
    ...(usesDepth ? [`-e DEPTH_MIN=${config.depthMin}`, `-e DEPTH_MAX=${config.depthMax}`] : []),
    ...(isAtPrice ? [`-e SIDE=${config.side}`] : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <CreateOrderCard
        title={`New ${MODE_LABELS[script]} Order`}
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
          <NumberField
            label="Virtual users"
            hint="Parallel accounts"
            value={config.virtualUsers}
            onChange={(v) => setField("virtualUsers", v)}
            min={1}
          />
          <NumberField
            label="Iterations"
            hint="Orders per user"
            value={config.iterations}
            onChange={(v) => setField("iterations", v)}
            min={1}
          />
          <NumberField
            label="Test duration (s)"
            hint="k6 stops all VUs when reached"
            value={config.runtimeSec}
            onChange={(v) => setField("runtimeSec", v)}
            min={1}
          />
          <NumberField
            label="Order interval (ms)"
            hint="Wait between each order"
            value={config.intervalMs}
            onChange={(v) => setField("intervalMs", v)}
            min={1}
          />

          {usesDepth && (
            <>
              <NumberField
                label="Depth min (ticks)"
                hint="Closest step from tradeable"
                value={config.depthMin}
                onChange={(v) => setField("depthMin", v)}
                min={1}
                max={config.depthMax}
              />
              <NumberField
                label="Depth max (ticks)"
                hint={
                  config.depthMin === config.depthMax
                    ? `Each order placed ${config.depthMin} tick(s) from tradeable`
                    : `Each order placed ${config.depthMin}–${config.depthMax} ticks from tradeable`
                }
                value={config.depthMax}
                onChange={(v) => setField("depthMax", v)}
                min={config.depthMin}
                max={20}
              />
            </>
          )}

          {isAtPrice && (
            <Field label="Order side" hint={SIDE_HINTS[config.side]}>
              <ToggleRow
                options={["buy", "sell", "both"] as const}
                value={config.side}
                onChange={(v) => setField("side", v)}
              />
            </Field>
          )}
        </div>

        {needsPortfolio && <WarnBox>Sell orders require portfolio holdings on the generated accounts.</WarnBox>}

        <AccountSetupFields config={config} setField={setField} accountCount={config.virtualUsers} />
        <RelayField config={config} setField={setField} />
        <StockListField config={config} setField={setField} hint={STOCK_HINTS[script]} />

        <SummaryRow
          breakdown={
            <>
              <strong>{config.virtualUsers}</strong> VU × <strong>{config.iterations}</strong> iter · stops after{" "}
              <strong>{config.runtimeSec}s</strong>
            </>
          }
          totalOrders={totalOrders}
        />
      </CreateOrderCard>

      <CommandPreview lines={commandLines} />

      <SavedOrders
        heading={`Saved ${MODE_LABELS[script]} Orders`}
        detailHeader="Load"
        renderDetail={(saved) => `${saved.virtualUsers ?? 0} VU × ${saved.iterations ?? 0} iter`}
        orders={orders}
        loading={loading}
        loadError={loadError}
        onReload={reload}
        onRun={run}
        runningId={runningId}
        emptyText={`No ${MODE_LABELS[script]} orders yet. Create one above.`}
      />
    </div>
  );
}
