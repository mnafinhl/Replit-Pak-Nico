import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowUpRight, CalendarDays, ChevronRight, CircleAlert, Edit3, Filter, HardDrive, Plus, RefreshCw, Search, Server, Trash2 } from 'lucide-react';
import { useDeleteDistro, useGetDashboardSummary, useGetCurrentSession, useListDistros, getListDistrosQueryKey, getGetDashboardSummaryQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

const statuses = ['All', 'Active', 'Development', 'Legacy'] as const;
type StatusFilter = typeof statuses[number];

export default function Home() {
  const queryClient = useQueryClient();
  const session = useGetCurrentSession();
  const isAdmin = session.data?.user.role === 'admin';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('All');
  const params = useMemo(() => ({ ...(search.trim() ? { search: search.trim() } : {}), ...(status !== 'All' ? { status } : {}) }), [search, status]);
  const listQuery = useListDistros(params, { query: { queryKey: getListDistrosQueryKey(params), staleTime: 20_000 } });
  const summaryQuery = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey(), staleTime: 20_000 } });
  const remove = useDeleteDistro();
  const [notice, setNotice] = useState('');

  const distros = listQuery.data ?? [];
  const summary = summaryQuery.data;

  const retry = () => {
    void listQuery.refetch();
    void summaryQuery.refetch();
  };

  const deleteDistro = (id: number, name: string) => {
    if (!window.confirm(`Remove ${name} from the repository? This cannot be undone.`)) return;
    setNotice('');
    remove.mutate({ id }, {
      onSuccess: () => {
        setNotice(`${name} removed from the index.`);
        void queryClient.invalidateQueries({ queryKey: getListDistrosQueryKey(params) });
        void queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      },
      onError: () => setNotice('The record could not be removed. Try again.'),
    });
  };

  return (
    <div className="animate-enter">
      <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div>
          <div className="flex items-center gap-2"><span className="mono text-[10px] uppercase tracking-[.3em] text-primary">repository / overview</span><span className="h-px w-9 bg-primary/40" /></div>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-.045em] text-glow sm:text-5xl">Linux distributions</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">A maintained catalog of systems, bases, and kernels. Query the index, then go deeper.</p>
        </div>
        {isAdmin && <Link href="/distros/new" data-testid="button-new-distro" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"><Plus size={16} /> Register distro</Link>}
      </div>

      <section className="summary-grid mt-10">
        <div className="glass-panel summary-primary rounded-xl p-5 sm:p-6">
          <div className="flex items-start justify-between"><div><p className="mono text-[10px] uppercase tracking-[.24em] text-muted-foreground">catalog health</p><p data-testid="text-summary-total" className="mt-4 text-4xl font-semibold tracking-tight">{summary?.total ?? '—'} <span className="text-base font-normal text-muted-foreground">records</span></p></div><span className="icon-square"><Server size={18} /></span></div>
          <div className="mt-7 flex items-center gap-3"><span className="health-dot health-dot-live" /><span className="mono text-[10px] tracking-[.12em] text-primary">INDEX OPERATIONAL</span><span className="ml-auto mono text-[10px] text-muted-foreground">v0.1.0</span></div>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-primary/10"><div className="animate-pulse-line h-full w-[78%] rounded-full bg-primary/70" /></div>
        </div>
        <StatCard label="active" value={summary?.active} tint="cyan" />
        <StatCard label="in development" value={summary?.development} tint="amber" />
        <StatCard label="legacy" value={summary?.legacy} tint="rose" />
      </section>

      <section className="mt-10">
        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div><p className="mono text-[10px] uppercase tracking-[.25em] text-muted-foreground">distribution index</p><h2 className="mt-2 text-xl font-medium">All registered systems <span className="mono ml-2 text-xs text-muted-foreground">{summary?.total !== undefined ? String(summary.total).padStart(2, '0') : '--'}</span></h2></div>
          <button onClick={retry} data-testid="button-refresh-distros" className="inline-flex items-center gap-2 self-start rounded-md border border-border/70 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"><RefreshCw size={14} className={listQuery.isFetching ? 'animate-spin' : ''} /> refresh index</button>
        </div>
        <div className="glass-panel overflow-hidden rounded-xl">
          <div className="flex flex-col gap-3 border-b border-border/70 p-4 lg:flex-row">
            <div className="relative min-w-0 flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="search" data-testid="input-search-distros" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, base, or kernel…" className="repo-input pl-9" /></div>
            <div className="flex shrink-0 items-center gap-1 overflow-x-auto rounded-lg border border-border/80 bg-background/40 p-1">
              <Filter size={14} className="ml-2 mr-1 shrink-0 text-muted-foreground" />
              {statuses.map((item) => <button key={item} onClick={() => setStatus(item)} data-testid={`button-filter-${item.toLowerCase()}`} className={`filter-button ${status === item ? 'filter-button-active' : ''}`}>{item}</button>)}
            </div>
          </div>

          {listQuery.isLoading ? <DistroTableSkeleton /> : listQuery.isError ? <ErrorState onRetry={retry} /> : distros.length === 0 ? <EmptyState hasFilters={Boolean(search || status !== 'All')} onReset={() => { setSearch(''); setStatus('All'); }} /> : (
            <>
              <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_120px] gap-4 border-b border-border/60 px-5 py-3 lg:grid"><TableHeading>distribution</TableHeading><TableHeading>base</TableHeading><TableHeading>kernel</TableHeading><TableHeading>status</TableHeading><TableHeading>registered</TableHeading></div>
              <div className="divide-y divide-border/60">
                {distros.map((distro) => <DistroRow key={distro.id} distro={distro} isAdmin={isAdmin} isDeleting={remove.isPending} onDelete={deleteDistro} />)}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-[1.45fr_1fr]">
        <div className="glass-panel rounded-xl p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="mono text-[10px] uppercase tracking-[.25em] text-muted-foreground">latest signal</p><h2 className="mt-2 text-lg font-medium">Recently registered</h2></div><CalendarDays size={18} className="text-primary/70" /></div><div className="mt-5 space-y-3">{summaryQuery.isLoading ? <div className="h-16 animate-pulse rounded-lg bg-muted/60" /> : summary?.latest?.length ? summary.latest.slice(0, 3).map((item) => <div key={item.id} data-testid={`text-latest-${item.id}`} className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/20 px-3 py-3"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 mono text-xs text-primary">{item.name.slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-sm">{item.name}</p><p className="mono mt-0.5 text-[10px] text-muted-foreground">{item.base} · {item.kernel}</p></div><span className={`status-dot status-${item.status.toLowerCase()}`} /></div>) : <p className="py-4 text-sm text-muted-foreground">No recent records available.</p>}</div></div>
        <div className="glass-panel rounded-xl p-5 sm:p-6"><p className="mono text-[10px] uppercase tracking-[.25em] text-muted-foreground">operator note</p><div className="mt-5 border-l-2 border-primary/50 pl-4"><p className="text-sm leading-7 text-foreground/80">“The best distro catalog is boring in the right ways: current, attributable, and easy to interrogate.”</p><p className="mono mt-4 text-[10px] text-muted-foreground">— repository protocol</p></div><div className="mt-8 flex items-center gap-2 text-xs text-primary"><HardDrive size={14} /> schema stable <ArrowUpRight size={14} /></div></div>
      </section>
      {notice && <p data-testid="status-delete-notice" className="fixed bottom-5 right-5 z-20 rounded-lg border border-primary/25 bg-card px-4 py-3 text-xs text-primary shadow-2xl">{notice}</p>}
    </div>
  );
}

function StatCard({ label, value, tint }: { label: string; value?: number; tint: 'cyan' | 'amber' | 'rose' }) {
  return <div className={`glass-panel stat-card stat-${tint} rounded-xl p-5`}><div className="flex items-center justify-between"><p className="mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">{label}</p><span className="status-dot" /></div><p data-testid={`text-summary-${label.replaceAll(' ', '-')}`} className="mt-5 text-3xl font-semibold">{value ?? '—'}</p></div>;
}
function TableHeading({ children }: { children: React.ReactNode }) { return <span className="mono text-[10px] uppercase tracking-[.17em] text-muted-foreground">{children}</span>; }
function DistroRow({ distro, isAdmin, isDeleting, onDelete }: { distro: { id: number; name: string; base: string; kernel: string; status: string; notes: string; image?: string | null; createdAt: string }; isAdmin: boolean; isDeleting: boolean; onDelete: (id: number, name: string) => void }) {
  return <div className="distro-row group grid gap-3 px-5 py-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_120px] lg:items-center" data-testid={`row-distro-${distro.id}`}>
    <div className="min-w-0"><div className="flex items-center gap-3">{distro.image ? <img src={distro.image} alt="" className="distro-glyph object-cover" /> : <span className="distro-glyph">{distro.name.slice(0, 2).toUpperCase()}</span>}<div className="min-w-0"><p data-testid={`text-distro-name-${distro.id}`} className="truncate text-sm font-medium text-foreground">{distro.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{distro.notes || 'No maintainer notes attached.'}</p></div></div><div className="mt-3 flex items-center gap-4 text-xs lg:hidden"><span className="mono text-muted-foreground">{distro.base}</span><span className="mono text-muted-foreground">{distro.kernel}</span><StatusBadge status={distro.status} /></div></div>
    <span className="hidden mono text-xs text-foreground/75 lg:block">{distro.base}</span><span className="hidden mono text-xs text-foreground/75 lg:block">{distro.kernel}</span><span className="hidden lg:block"><StatusBadge status={distro.status} /></span><span className="hidden text-xs text-muted-foreground lg:block">{new Date(distro.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
    <div className="flex items-center gap-1 lg:justify-end"><Link href={`/distros/${distro.id}/edit`} data-testid={`button-edit-distro-${distro.id}`} className={`row-action ${!isAdmin ? 'pointer-events-none opacity-30' : ''}`} aria-label={`Edit ${distro.name}`}><Edit3 size={14} /></Link><button disabled={!isAdmin || isDeleting} onClick={() => onDelete(distro.id, distro.name)} data-testid={`button-delete-distro-${distro.id}`} className={`row-action row-action-danger ${!isAdmin ? 'opacity-30' : ''}`} aria-label={`Delete ${distro.name}`}><Trash2 size={14} /></button><ChevronRight size={15} className="ml-1 text-muted-foreground/30 transition-transform group-hover:translate-x-1 group-hover:text-primary" /></div>
  </div>;
}
function StatusBadge({ status }: { status: string }) { return <span className={`status-badge status-badge-${status.toLowerCase()}`}><span className="status-dot" />{status}</span>; }
function DistroTableSkeleton() { return <div className="space-y-px p-4">{[1, 2, 3, 4].map((item) => <div key={item} className="grid animate-pulse gap-4 border-b border-border/50 py-5 lg:grid-cols-5"><div className="h-8 rounded bg-muted/70" /><div className="hidden h-4 rounded bg-muted/50 lg:block" /><div className="hidden h-4 rounded bg-muted/50 lg:block" /><div className="hidden h-4 rounded bg-muted/50 lg:block" /><div className="hidden h-4 rounded bg-muted/50 lg:block" /></div>)}</div>; }
function ErrorState({ onRetry }: { onRetry: () => void }) { return <div className="flex flex-col items-center justify-center px-5 py-20 text-center"><CircleAlert size={24} className="text-destructive" /><h3 className="mt-4 text-sm font-medium">The index did not respond</h3><p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">We could not read the distribution catalog. The API may be restarting.</p><button onClick={onRetry} data-testid="button-retry-distros" className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs hover:border-primary/50 hover:text-primary"><RefreshCw size={13} /> retry request</button></div>; }
function EmptyState({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) { return <div className="flex flex-col items-center justify-center px-5 py-20 text-center"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background/40 text-muted-foreground"><Search size={18} /></div><h3 className="mt-4 text-sm font-medium">{hasFilters ? 'No matching distributions' : 'The catalog is empty'}</h3><p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">{hasFilters ? 'Try another search term or clear the active filter.' : 'Register the first system to give this repository a signal.'}</p>{hasFilters && <button onClick={onReset} data-testid="button-clear-filters" className="mt-5 rounded-lg border border-border px-3 py-2 text-xs hover:border-primary/50 hover:text-primary">clear filters</button>}</div>; }