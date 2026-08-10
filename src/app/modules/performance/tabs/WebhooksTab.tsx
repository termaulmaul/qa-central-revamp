"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Pencil, Plus, RefreshCw, Trash2, Webhook, Zap } from 'lucide-react';
import { getProjectId, PROJECT_CONTEXT_EVENT } from '../utils/project-context';

type WebhookChannel = 'teams' | 'discord' | 'telegram' | 'brrr';
type DeliveryStatus = 'pending' | 'delivered' | 'failed';

interface WebhookForm {
  channel: WebhookChannel;
  targetRef: string;
  enabled: boolean;
}

interface WebhookEntry extends WebhookForm {
  id: string;
  projectId: string;
  configured: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  projectId: string;
  status: DeliveryStatus;
  attempts: number;
  lastStatusCode: number | null;
  createdAt: string;
  updatedAt: string;
}

const TARGET_REFS: Record<WebhookChannel, readonly string[]> = {
  teams: ['TEAMS_WEBHOOK', 'NOTIFY_TEAMS'],
  discord: ['DISCORD_WEBHOOK'],
  telegram: ['TELEGRAM_WEBHOOK'],
  brrr: ['BRRR_WEBHOOK'],
};

const EMPTY_FORM: WebhookForm = { channel: 'teams', targetRef: 'TEAMS_WEBHOOK', enabled: true };

function query(projectId: string): string {
  return `?projectId=${encodeURIComponent(projectId)}`;
}

function timestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleString();
}

async function responseJson<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;
  const body = await response.json().catch(() => null) as { error?: unknown } | null;
  throw new Error(typeof body?.error === 'string' ? body.error : 'Unable to update webhooks');
}

export const Webhooks = () => {
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [form, setForm] = useState<WebhookForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingWebhooks, setLoadingWebhooks] = useState(true);
  const [loadingDeliveries, setLoadingDeliveries] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const webhooksRequestId = useRef(0);
  const deliveriesRequestId = useRef(0);

  const loadWebhooks = useCallback(async () => {
    const id = ++webhooksRequestId.current;
    const projectId = getProjectId();
    if (!projectId) {
      setWebhooks([]);
      setLoadingWebhooks(false);
      setError('');
      return;
    }

    setLoadingWebhooks(true);
    setError('');
    try {
      const body = await fetch(`/api/webhooks${query(projectId)}`, { credentials: 'include' })
        .then(responseJson<{ webhooks: WebhookEntry[] }>);
      if (id === webhooksRequestId.current) setWebhooks(Array.isArray(body.webhooks) ? body.webhooks : []);
    } catch (cause) {
      if (id !== webhooksRequestId.current) return;
      setWebhooks([]);
      setError((current) => current || (cause instanceof Error ? cause.message : 'Unable to load webhooks'));
    } finally {
      if (id === webhooksRequestId.current) setLoadingWebhooks(false);
    }
  }, []);

  const loadDeliveries = useCallback(async () => {
    const id = ++deliveriesRequestId.current;
    const projectId = getProjectId();
    if (!projectId) {
      setDeliveries([]);
      setLoadingDeliveries(false);
      setError('');
      return;
    }

    setLoadingDeliveries(true);
    setError('');
    try {
      const body = await fetch(`/api/webhooks/deliveries${query(projectId)}&limit=50`, { credentials: 'include' })
        .then(responseJson<{ deliveries: WebhookDelivery[] }>);
      if (id === deliveriesRequestId.current) setDeliveries(Array.isArray(body.deliveries) ? body.deliveries : []);
    } catch (cause) {
      if (id !== deliveriesRequestId.current) return;
      setDeliveries([]);
      setError((current) => current || (cause instanceof Error ? cause.message : 'Unable to load deliveries'));
    } finally {
      if (id === deliveriesRequestId.current) setLoadingDeliveries(false);
    }
  }, []);

  const load = useCallback(() => {
    void loadWebhooks();
    void loadDeliveries();
  }, [loadDeliveries, loadWebhooks]);

  useEffect(() => {
    load();
    window.addEventListener(PROJECT_CONTEXT_EVENT, load);
    return () => {
      window.removeEventListener(PROJECT_CONTEXT_EVENT, load);
      ++webhooksRequestId.current;
      ++deliveriesRequestId.current;
    };
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const selectChannel = (channel: WebhookChannel) => {
    setForm((current) => ({ ...current, channel, targetRef: TARGET_REFS[channel][0] }));
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const projectId = getProjectId();
    if (!projectId) {
      setError('Select a project before saving a webhook');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const path = editingId ? `/api/webhooks/${encodeURIComponent(editingId)}${query(projectId)}` : `/api/webhooks${query(projectId)}`;
      await fetch(path, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      }).then(responseJson<{ webhook: WebhookEntry }>);
      if (projectId !== getProjectId()) return;
      resetForm();
      await loadWebhooks();
    } catch (cause) {
      if (projectId === getProjectId()) setError(cause instanceof Error ? cause.message : 'Unable to save webhook');
    } finally {
      if (projectId === getProjectId()) setSaving(false);
    }
  };

  const remove = async (webhook: WebhookEntry) => {
    if (!window.confirm(`Delete ${webhook.channel.toUpperCase()} webhook? This cannot be undone.`)) return;
    const projectId = getProjectId();
    if (!projectId) return;

    setSaving(true);
    setError('');
    try {
      await fetch(`/api/webhooks/${encodeURIComponent(webhook.id)}${query(projectId)}`, {
        method: 'DELETE',
        credentials: 'include',
      }).then(responseJson<{ ok: true }>);
      if (projectId !== getProjectId()) return;
      if (editingId === webhook.id) resetForm();
      await loadWebhooks();
    } catch (cause) {
      if (projectId === getProjectId()) setError(cause instanceof Error ? cause.message : 'Unable to delete webhook');
    } finally {
      if (projectId === getProjectId()) setSaving(false);
    }
  };

  const test = async (webhook: WebhookEntry) => {
    const projectId = getProjectId();
    if (!projectId) return;

    setSaving(true);
    setError('');
    try {
      await fetch(`/api/webhooks/${encodeURIComponent(webhook.id)}/test${query(projectId)}`, {
        method: 'POST',
        credentials: 'include',
      }).then(responseJson<{ delivery: WebhookDelivery }>);
      if (projectId === getProjectId()) await loadDeliveries();
    } catch (cause) {
      if (projectId === getProjectId()) setError(cause instanceof Error ? cause.message : 'Unable to test webhook');
    } finally {
      if (projectId === getProjectId()) setSaving(false);
    }
  };

  const retry = async (delivery: WebhookDelivery) => {
    const projectId = getProjectId();
    if (!projectId) return;

    setSaving(true);
    setError('');
    try {
      await fetch(`/api/webhooks/deliveries/${encodeURIComponent(delivery.id)}/retry${query(projectId)}`, {
        method: 'POST',
        credentials: 'include',
      }).then(responseJson<{ delivery: WebhookDelivery }>);
      if (projectId === getProjectId()) await loadDeliveries();
    } catch (cause) {
      if (projectId === getProjectId()) setError(cause instanceof Error ? cause.message : 'Unable to retry delivery');
    } finally {
      if (projectId === getProjectId()) setSaving(false);
    }
  };

  const projectId = getProjectId();

  return (
    <div className="pt-page-stack">
      <div className="page-kicker">
        <div>
          <p className="eyebrow">Performance Test Dashboard</p>
          <h1 className="page-title">Webhook Manager</h1>
          <p className="page-subtitle">Project-scoped notification aliases. Endpoint secrets remain server-side.</p>
        </div>
        <div className="action-row">
          <button className="pt-primary-btn" type="button" onClick={resetForm} disabled={!projectId || saving}><Plus size={14} /> New Webhook</button>
          <button className="pt-ghost-btn" type="button" onClick={() => void load()} disabled={loadingWebhooks || loadingDeliveries || saving}><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      {!projectId ? (
        <section className="panel"><div className="empty-state"><p>SELECT A PROJECT TO MANAGE WEBHOOKS</p></div></section>
      ) : (
        <>
          <form className="panel" onSubmit={save}>
            <div className="ph">{editingId ? 'Edit Webhook' : 'New Webhook'}</div>
            <div className="panel-body pt-page-stack">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="block"><span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Channel</span><select className="pt-input" value={form.channel} onChange={(event) => selectChannel(event.target.value as WebhookChannel)} disabled={saving}><option value="teams">Teams</option><option value="discord">Discord</option><option value="telegram">Telegram</option><option value="brrr">BRRR</option></select></label>
                <label className="block"><span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Server configuration alias</span><select className="pt-input font-mono" value={form.targetRef} onChange={(event) => setForm((current) => ({ ...current, targetRef: event.target.value }))} disabled={saving}>{TARGET_REFS[form.channel].map((targetRef) => <option key={targetRef} value={targetRef}>{targetRef}</option>)}</select></label>
                <label className="block"><span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Enabled</span><select className="pt-input" value={String(form.enabled)} onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.value === 'true' }))} disabled={saving}><option value="true">Enabled</option><option value="false">Disabled</option></select></label>
              </div>
              <div className="action-row">
                {editingId && <button className="pt-ghost-btn" type="button" onClick={resetForm} disabled={saving}>Cancel</button>}
                <button className="pt-primary-btn" type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Webhook'}</button>
              </div>
            </div>
          </form>

          {error && <p role="alert" className="text-red-500 text-sm mt-2">{error}</p>}

          <section className="panel" aria-busy={loadingWebhooks}>
            <div className="ph"><span>Webhooks</span><span className="ph-meta">{loadingWebhooks ? 'LOADING' : `${webhooks.length} TOTAL`}</span></div>
            {webhooks.length > 0 ? (
              <div className="tbl-scroll"><table className="mock"><thead><tr><th>Channel</th><th>Configuration</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>
                {webhooks.map((webhook) => <tr key={webhook.id}>
                  <td><strong className="table-primary">{webhook.channel.toUpperCase()}</strong></td>
                  <td><span className="table-primary font-mono">{webhook.targetRef}</span><span className="table-secondary">{webhook.configured ? 'SERVER CONFIGURED' : 'SERVER NOT CONFIGURED'}</span></td>
                  <td><span className={`px-2 py-1 rounded text-xs font-medium ${webhook.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-700'}`}>{webhook.enabled ? 'ENABLED' : 'DISABLED'}</span></td>
                  <td className="fs-xs text-ink-3 nowrap">{timestamp(webhook.updatedAt)}</td>
                  <td><div className="flex gap-s-1"><button className="table-action-btn" type="button" disabled={saving || !webhook.enabled || !webhook.configured} onClick={() => void test(webhook)} aria-label={`Test ${webhook.channel} webhook`}><Zap size={14} /> Test</button><button className="table-action-btn icon-btn" type="button" disabled={saving} onClick={() => { setEditingId(webhook.id); setForm({ channel: webhook.channel, targetRef: webhook.targetRef, enabled: webhook.enabled }); setError(''); }} aria-label={`Edit ${webhook.channel} webhook`}><Pencil size={14} /></button><button className="table-action-btn icon-btn" type="button" disabled={saving} onClick={() => void remove(webhook)} aria-label={`Delete ${webhook.channel} webhook`}><Trash2 size={14} /></button></div></td>
                </tr>)}
              </tbody></table></div>
            ) : <div className="empty-state"><p>{loadingWebhooks ? 'LOADING WEBHOOKS' : 'NO WEBHOOKS CONFIGURED'}</p></div>}
          </section>

          <section className="panel" aria-busy={loadingDeliveries}>
            <div className="ph"><span>Delivery History</span><span className="ph-meta">LAST 50</span></div>
            {deliveries.length > 0 ? (
              <div className="tbl-scroll"><table className="mock"><thead><tr><th>Status</th><th>Webhook ID</th><th>Attempts</th><th>Response</th><th>Updated</th><th>Action</th></tr></thead><tbody>
                {deliveries.map((delivery) => <tr key={delivery.id}>
                  <td><span className={`px-2 py-1 rounded text-xs font-medium ${delivery.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : delivery.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-700'}`}>{delivery.status.toUpperCase()}</span></td>
                  <td className="font-mono fs-xs">{delivery.webhookId}</td><td>{delivery.attempts}</td><td>{delivery.lastStatusCode ?? 'Unavailable'}</td><td className="fs-xs text-ink-3 nowrap">{timestamp(delivery.updatedAt)}</td>
                  <td>{delivery.status === 'failed' && <button className="table-action-btn" type="button" disabled={saving} onClick={() => void retry(delivery)}>Retry</button>}</td>
                </tr>)}
              </tbody></table></div>
            ) : <div className="empty-state"><p>{loadingDeliveries ? 'LOADING HISTORY' : 'NO DELIVERY HISTORY'}</p></div>}
          </section>
        </>
      )}
    </div>
  );
};
