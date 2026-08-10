"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Network, RefreshCw, Plus, Search, X } from 'lucide-react';
import { getProjectId, PROJECT_CONTEXT_EVENT } from '../utils/project-context';

interface Endpoint {
  id: string;
  name: string;
  method: string;
  path: string;
  service: string;
  platforms: string[];
}

// Group endpoints by service, sorted by service name — mirrors pt-framework's
// Catalog byService reduce. Service is read from endpoint.service (derived by
// the scan from the path); empty is bucketed as 'other'. Pure + exported so the
// grouping is unit-tested independently of the component.
export function groupEndpointsByService<T extends { service: string }>(items: T[]): Array<[string, T[]]> {
  const byService: Record<string, T[]> = {};
  for (const item of items) {
    const service = item.service || 'other';
    (byService[service] ??= []).push(item);
  }
  return Object.entries(byService).sort(([a], [b]) => a.localeCompare(b));
}

interface Flow {
  id: string;
  name: string;
  service: string;
  platform: string;
  bp_name?: string;
  source_file?: string | null;
  step_count?: number;
}

interface EndpointForm {
  method: string;
  path: string;
  service: string;
  platforms: string[];
  description: string;
}

const EMPTY_ENDPOINT_FORM: EndpointForm = {
  method: 'GET',
  path: '',
  service: '',
  platforms: ['WEB'],
  description: '',
};

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const isBpFlow = (flow: Flow) => {
  if (flow.bp_name && /^BP/i.test(flow.bp_name)) return true;
  const file = flow.source_file?.split('/').pop() ?? '';
  return /^BP/i.test(file) || /(^|\s|\/)BP\d/i.test(flow.name);
};

interface ModalProps {
  title: string;
  meta?: string;
  onClose: () => void;
  children: ReactNode;
}

const CatalogModal = ({ title, meta, onClose, children }: ModalProps) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="pt-modal-overlay" role="presentation" onClick={onClose}>
      <section
        className="panel pt-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ph">
          <span>{title}{meta ? <span className="ph-meta"> {meta}</span> : null}</span>
          <button type="button" className="pt-ghost-btn icon-btn" aria-label={`Close ${title}`} onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
};

const platformCode = (platform: string) => {
  if (platform === 'ANDROID') return 'A';
  if (platform === 'IOS') return 'I';
  return 'W';
};

export const ApiCatalog = () => {
  const [activePlatform, setActivePlatform] = useState('WEB');
  const [activeType, setActiveType] = useState('ENDPOINTS');
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const projectId = () => getProjectId() ?? 'default';
  const load = useCallback(() => {
    const id = ++requestId.current;
    let pending = 2;
    setLoading(true);
    setError(null);
    const projectIdParam = encodeURIComponent(projectId());
    const complete = () => {
      pending -= 1;
      if (id === requestId.current && pending === 0) setLoading(false);
    };
    const unavailable = (clear: () => void) => {
      if (id !== requestId.current) return;
      clear();
      setError((current) => current ?? 'Catalog data unavailable. Try again later.');
    };

    void fetch(`/api/catalog/endpoints?projectId=${projectIdParam}`, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('catalog unavailable');
        return response.json() as Promise<Endpoint[]>;
      })
      .then((nextEndpoints) => {
        if (id === requestId.current) setEndpoints(Array.isArray(nextEndpoints) ? nextEndpoints : []);
      })
      .catch(() => unavailable(() => setEndpoints([])))
      .finally(complete);
    void fetch(`/api/catalog/flows?projectId=${projectIdParam}`, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('catalog unavailable');
        return response.json() as Promise<Flow[]>;
      })
      .then((nextFlows) => {
        if (id === requestId.current) setFlows(Array.isArray(nextFlows) ? nextFlows : []);
      })
      .catch(() => unavailable(() => setFlows([])))
      .finally(complete);
  }, []);

  useEffect(() => {
    void load();
    window.addEventListener(PROJECT_CONTEXT_EVENT, load);
    return () => {
      window.removeEventListener(PROJECT_CONTEXT_EVENT, load);
      ++requestId.current;
    };
  }, [load]);

  const scan = async () => {
    const id = ++requestId.current;
    setScanning(true);
    setError(null);
    try {
      const response = await fetch('/api/catalog/scan', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: projectId() }),
      });
      if (id !== requestId.current) return;
      if (!response.ok) throw new Error('scan failed');
      setScanning(false);
      void load();
    } catch {
      if (id !== requestId.current) return;
      setError('Scan failed. Try again later.');
    } finally {
      if (id === requestId.current) setScanning(false);
    }
  };

  const [showEndpointForm, setShowEndpointForm] = useState(false);
  const [endpointForm, setEndpointForm] = useState<EndpointForm>(EMPTY_ENDPOINT_FORM);
  const [savingEndpoint, setSavingEndpoint] = useState(false);
  const [endpointError, setEndpointError] = useState('');

  const [showBpPicker, setShowBpPicker] = useState(false);
  const [masterFlows, setMasterFlows] = useState<Flow[] | null>(null);
  const [selectedBpIds, setSelectedBpIds] = useState<Set<string>>(new Set());
  const [removedNames, setRemovedNames] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [pickerError, setPickerError] = useState('');
  const [bpFilter, setBpFilter] = useState('');

  const openEndpointForm = () => {
    setActiveType('ENDPOINTS');
    setShowBpPicker(false);
    setEndpointError('');
    setShowEndpointForm((open) => !open);
  };

  const submitEndpoint = async () => {
    setSavingEndpoint(true);
    setEndpointError('');
    try {
      const response = await fetch('/api/catalog/endpoints', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectId(),
          method: endpointForm.method,
          path: endpointForm.path.trim(),
          service: endpointForm.service.trim(),
          platforms: endpointForm.platforms,
          ...(endpointForm.description.trim() ? { description: endpointForm.description.trim() } : {}),
        }),
      });
      const body = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(body?.error === 'CATALOG_ENDPOINT_EXISTS'
          ? 'This method and path already exist in the catalog'
          : body?.error ?? 'Unable to create endpoint');
      }
      setEndpointForm(EMPTY_ENDPOINT_FORM);
      setShowEndpointForm(false);
      void load();
    } catch (cause) {
      setEndpointError(cause instanceof Error ? cause.message : 'Unable to create endpoint');
    } finally {
      setSavingEndpoint(false);
    }
  };

  const openBpPicker = async () => {
    setActiveType('FLOWS');
    setShowEndpointForm(false);
    setPickerError('');
    const next = !showBpPicker;
    setShowBpPicker(next);
    if (!next) return;
    setMasterFlows(null);
    setSelectedBpIds(new Set());
    setRemovedNames(new Set());
    setBpFilter('');
    try {
      const response = await fetch('/api/catalog/flows?projectId=default', { credentials: 'include' });
      if (!response.ok) throw new Error('Unable to load the master catalog');
      const body = await response.json() as Flow[];
      setMasterFlows(Array.isArray(body) ? body.filter(isBpFlow) : []);
    } catch (cause) {
      setMasterFlows([]);
      setPickerError(cause instanceof Error ? cause.message : 'Unable to load the master catalog');
    }
  };

  const toggleBpId = (id: string) => {
    setSelectedBpIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleRemovedName = (name: string) => {
    setRemovedNames((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // Select All / Deselect All operate on the filtered rows only: unassigned
  // rows toggle the pending selection; assigned rows toggle their removal mark.
  const selectAllVisible = (visible: Flow[], assignedNames: Set<string>) => {
    setSelectedBpIds((current) => {
      const next = new Set(current);
      for (const flow of visible) if (!assignedNames.has(flow.name)) next.add(flow.id);
      return next;
    });
    setRemovedNames((current) => {
      const next = new Set(current);
      for (const flow of visible) next.delete(flow.name);
      return next;
    });
  };

  const deselectAllVisible = (visible: Flow[], assignedNames: Set<string>) => {
    setSelectedBpIds((current) => {
      const next = new Set(current);
      for (const flow of visible) next.delete(flow.id);
      return next;
    });
    setRemovedNames((current) => {
      const next = new Set(current);
      for (const flow of visible) if (assignedNames.has(flow.name)) next.add(flow.name);
      return next;
    });
  };

  const applyBpChanges = async () => {
    setImporting(true);
    setPickerError('');
    try {
      const project = encodeURIComponent(projectId());
      if (selectedBpIds.size > 0) {
        const response = await fetch(`/api/catalog/projects/${project}/flows/import`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flow_ids: [...selectedBpIds] }),
        });
        const body = await response.json().catch(() => null) as { error?: string } | null;
        if (!response.ok) throw new Error(body?.error ?? 'Unable to add BP scripts');
      }
      const removeIds = flows
        .filter((flow) => removedNames.has(flow.name))
        .map((flow) => flow.id);
      if (removeIds.length > 0) {
        const response = await fetch(`/api/catalog/projects/${project}/flows/remove`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flow_ids: removeIds }),
        });
        const body = await response.json().catch(() => null) as { error?: string } | null;
        if (!response.ok) throw new Error(body?.error ?? 'Unable to remove BP scripts');
      }
      setShowBpPicker(false);
      setSelectedBpIds(new Set());
      setRemovedNames(new Set());
      void load();
    } catch (cause) {
      setPickerError(cause instanceof Error ? cause.message : 'Unable to update BP scripts');
    } finally {
      setImporting(false);
    }
  };

  const currentFlowNames = new Set(flows.map((flow) => flow.name));
  const activeProjectId = projectId();

  const needle = filter.trim().toLowerCase();
  const visibleEndpoints = useMemo(() => endpoints.filter((endpoint) => {
    const platformMatch = activePlatform === 'WEB'
      ? endpoint.platforms.includes('WEB')
      : endpoint.platforms.includes(activePlatform);
    return platformMatch && [endpoint.method, endpoint.path, endpoint.service, endpoint.name]
      .some((value) => value.toLowerCase().includes(needle));
  }), [activePlatform, endpoints, needle]);
  const visibleFlows = useMemo(() => flows.filter((flow) => {
    const platformMatch = activePlatform === 'WEB'
      ? flow.platform === 'WEB'
      : flow.platform === activePlatform;
    return platformMatch && [flow.name, flow.service, flow.platform]
      .some((value) => value.toLowerCase().includes(needle));
  }), [activePlatform, flows, needle]);
  const items = activeType === 'ENDPOINTS' ? visibleEndpoints : visibleFlows;

  // Group the (already platform- and search-filtered) endpoints by service, then
  // sort the groups by service name — mirrors pt-framework's Catalog byService
  // reduce (filter first, then group; empty groups never appear). The service is
  // taken from endpoint.service, which the scan already derives from the path;
  // nothing is hardcoded. Project scope is handled upstream by the fetch: the
  // Default project returns every endpoint, other projects only their FLOWS'
  // referenced endpoints, so grouping is a pure presentation layer over that.
  const groupedEndpoints = useMemo(() => groupEndpointsByService(visibleEndpoints), [visibleEndpoints]);

  // Collapsed service groups (a service in the set is collapsed). Default is
  // expanded — matching pt-framework, where every group is shown; clicking a
  // service header toggles just that group.
  const [collapsedServices, setCollapsedServices] = useState<Set<string>>(new Set());
  const toggleService = (service: string) => setCollapsedServices((current) => {
    const next = new Set(current);
    if (next.has(service)) next.delete(service);
    else next.add(service);
    return next;
  });

  return (
    <div className="pt-page-stack">
      <div className="page-kicker">
        <div>
          <p className="eyebrow">Performance Test Dashboard</p>
          <h1 className="page-title">API Catalog</h1>
          <p className="page-subtitle">Endpoint reference across Web, Android, and iOS.</p>
        </div>
        <div className="action-row">
          <button className="pt-ghost-btn" type="button" onClick={() => void scan()} disabled={scanning}>
            <RefreshCw size={14} /> {scanning ? 'Scanning…' : 'Scan Scripts'}
          </button>
          {activeProjectId !== 'default' && (
            <button className="pt-ghost-btn" type="button" onClick={() => void openBpPicker()}>
              <Plus size={14} /> BP Scripts
            </button>
          )}
          <button className="pt-primary-btn" type="button" onClick={openEndpointForm}>
            <Plus size={14} /> Endpoint
          </button>
        </div>
      </div>

      <section className="panel catalog-toolbar">
        <div className="panel-body catalog-toolbar-inner">
          <div className="segmented" aria-label="Platform filter">
            {['WEB', 'ANDROID', 'IOS'].map((platform) => <button type="button" key={platform} className={activePlatform === platform ? 'active' : ''} onClick={() => setActivePlatform(platform)}>{platform}</button>)}
          </div>
          <div className="segmented" aria-label="Catalog type">
            {['ENDPOINTS', 'FLOWS'].map((type) => <button type="button" key={type} className={activeType === type ? 'active' : ''} onClick={() => setActiveType(type)}>{type}</button>)}
          </div>
          <label className="catalog-search"><Search size={14} aria-hidden="true" /><span className="visually-hidden">Filter API catalog</span><input type="search" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter path / service / method" /></label>
        </div>
      </section>

      {showEndpointForm && (
        <CatalogModal title="Add Endpoint" onClose={() => setShowEndpointForm(false)}>
          <div className="panel-body pt-page-stack">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <label className="block"><span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Method</span>
                <select className="pt-input" value={endpointForm.method} onChange={(event) => setEndpointForm((f) => ({ ...f, method: event.target.value }))}>
                  {METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
                </select>
              </label>
              <label className="block"><span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Path</span>
                <input type="text" className="pt-input" value={endpointForm.path} placeholder="/service/api/v1/resource" onChange={(event) => setEndpointForm((f) => ({ ...f, path: event.target.value }))} />
              </label>
              <label className="block"><span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Service</span>
                <input type="text" className="pt-input" value={endpointForm.service} placeholder="auth" onChange={(event) => setEndpointForm((f) => ({ ...f, service: event.target.value }))} />
              </label>
              <label className="block"><span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Description (optional)</span>
                <input type="text" className="pt-input" value={endpointForm.description} onChange={(event) => setEndpointForm((f) => ({ ...f, description: event.target.value }))} />
              </label>
            </div>
            <div className="action-row" role="group" aria-label="Platforms">
              {['WEB', 'ANDROID', 'IOS'].map((platform) => (
                <label key={platform} className="checkbox-inline">
                  <input
                    type="checkbox"
                    checked={endpointForm.platforms.includes(platform)}
                    onChange={() => setEndpointForm((f) => ({
                      ...f,
                      platforms: f.platforms.includes(platform)
                        ? f.platforms.filter((value) => value !== platform)
                        : [...f.platforms, platform],
                    }))}
                  /> {platform}
                </label>
              ))}
            </div>
            {endpointError && <p role="alert" className="text-red-500 text-sm mt-2">{endpointError}</p>}
            <div className="action-row">
              <button className="pt-ghost-btn" type="button" onClick={() => setShowEndpointForm(false)}>Cancel</button>
              <button
                className="pt-primary-btn"
                type="button"
                disabled={savingEndpoint || !endpointForm.path.trim() || !endpointForm.service.trim() || endpointForm.platforms.length === 0}
                onClick={() => void submitEndpoint()}
              >
                {savingEndpoint ? 'Saving…' : 'Save Endpoint'}
              </button>
            </div>
          </div>
        </CatalogModal>
      )}

      {showBpPicker && (
        <CatalogModal title="Add BP Scripts" meta="from the Default project catalog" onClose={() => setShowBpPicker(false)}>
          <div className="panel-body pt-page-stack">
            {masterFlows === null && <p>Loading master catalog…</p>}
            {masterFlows !== null && masterFlows.length === 0 && !pickerError && (
              <p>No BP scripts in the master catalog yet. Switch to the Default project and run Scan Scripts first.</p>
            )}
            {masterFlows !== null && masterFlows.length > 0 && (() => {
              // Every flow currently ASSIGNED to the project must be visible so
              // it can be deselected — including ones the BP-name filter would
              // hide (e.g. flows a pre-fix SYNC assigned from other repos).
              // Otherwise Apply could never remove them and the assignment
              // would never match the user's selection.
              const masterNames = new Set(masterFlows.map((flow) => flow.name));
              const pickerFlows = [
                ...masterFlows,
                ...flows.filter((flow) => !masterNames.has(flow.name)),
              ];
              const bpNeedle = bpFilter.trim().toLowerCase();
              const visibleMasterFlows = bpNeedle
                ? pickerFlows.filter((flow) =>
                  [flow.name, flow.bp_name ?? '', flow.service, flow.platform, flow.source_file ?? '']
                    .some((value) => value.toLowerCase().includes(bpNeedle)))
                : pickerFlows;
              return (
                <>
                  <div className="pt-modal-toolbar">
                    <label className="catalog-search pt-modal-search">
                      <Search size={14} aria-hidden="true" />
                      <span className="visually-hidden">Search BP scripts</span>
                      <input
                        type="search"
                        value={bpFilter}
                        onChange={(event) => setBpFilter(event.target.value)}
                        placeholder="Search by name, service, platform, or file"
                        autoFocus
                      />
                    </label>
                    <button
                      type="button"
                      className="pt-ghost-btn"
                      disabled={visibleMasterFlows.length === 0}
                      onClick={() => selectAllVisible(visibleMasterFlows, currentFlowNames)}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      className="pt-ghost-btn"
                      disabled={visibleMasterFlows.length === 0}
                      onClick={() => deselectAllVisible(visibleMasterFlows, currentFlowNames)}
                    >
                      Deselect All
                    </button>
                  </div>
                  {visibleMasterFlows.length === 0 && <p>No BP scripts match “{bpFilter.trim()}”.</p>}
                  {visibleMasterFlows.length > 0 && (
                    <div className="endpoint-list">
                      {visibleMasterFlows.map((flow) => {
                        const added = currentFlowNames.has(flow.name);
                        const marked = removedNames.has(flow.name);
                        return (
                          <label key={flow.id} className="endpoint-row">
                            <input
                              type="checkbox"
                              checked={added ? !marked : selectedBpIds.has(flow.id)}
                              onChange={() => added ? toggleRemovedName(flow.name) : toggleBpId(flow.id)}
                            />
                            <code>{flow.name}</code>
                            <span className={`platform-badge${added && marked ? ' text-red-500' : ''}`}>
                              {added ? (marked ? 'REMOVE' : 'ADDED') : platformCode(flow.platform)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
            {pickerError && <p role="alert" className="text-red-500 text-sm mt-2">{pickerError}</p>}
            <div className="action-row">
              <button className="pt-ghost-btn" type="button" onClick={() => setShowBpPicker(false)}>Cancel</button>
              <button
                className="pt-primary-btn"
                type="button"
                disabled={importing || (selectedBpIds.size === 0 && removedNames.size === 0)}
                onClick={() => void applyBpChanges()}
              >
                {importing
                  ? 'Applying…'
                  : `Apply Changes${selectedBpIds.size ? ` (+${selectedBpIds.size}` : ''}${removedNames.size ? `${selectedBpIds.size ? ', ' : ' ('}−${removedNames.size}` : ''}${selectedBpIds.size || removedNames.size ? ')' : ''}`}
              </button>
            </div>
          </div>
        </CatalogModal>
      )}

      {(loading || error || items.length === 0 || activeType === 'FLOWS') && (
        <section className="panel">
          <div className="ph"><span>{activeType}</span><span className="ph-meta">{items.length} {activeType.toLowerCase()}</span></div>
          {loading ? <div className="panel-body">Loading catalog…</div> : null}
          {error ? <div className="panel-body" role="alert">{error}</div> : null}
          {!loading && !error && items.length === 0 ? <div className="panel-body">No {activeType.toLowerCase()} found.</div> : null}
          {!loading && !error && activeType === 'FLOWS' ? <div className="endpoint-list">
            {visibleFlows.map((flow) => <div key={flow.id} className="endpoint-row">
              <span className="method-badge">FLOW</span>
              <code>{flow.name}</code>
              <span className="platform-badge">{platformCode(flow.platform)}</span>
            </div>)}
          </div> : null}
        </section>
      )}
      {/* ENDPOINTS grouped by service (pt-framework's Catalog): one collapsible
          panel per service, header shows the service name + endpoint count. */}
      {!loading && !error && activeType === 'ENDPOINTS' && groupedEndpoints.map(([service, serviceEndpoints]) => {
        const collapsed = collapsedServices.has(service);
        return (
          <section className="panel catalog-svc" key={service}>
            <button
              type="button"
              className="ph catalog-svc-head"
              aria-expanded={!collapsed}
              onClick={() => toggleService(service)}
            >
              <span className="catalog-svc-name">{service.toUpperCase()}</span>
              <span className="ph-meta">{serviceEndpoints.length} endpoint{serviceEndpoints.length === 1 ? '' : 's'}</span>
            </button>
            {!collapsed && (
              <div className="endpoint-list">
                {serviceEndpoints.map((endpoint) => <div key={endpoint.id} className="endpoint-row">
                  <span className="method-badge">{endpoint.method}</span>
                  <code>{endpoint.path}</code>
                  <span className="platform-badge">{endpoint.platforms.map(platformCode).join(' / ') || 'W'}</span>
                </div>)}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};
