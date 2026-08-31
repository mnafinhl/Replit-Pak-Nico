import { type ReactNode, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Activity, Boxes, ChevronDown, CircleUserRound, Database, LogOut, Menu, Plus, Radio, ShieldCheck, X } from 'lucide-react';
import { useGetCurrentSession, useHealthCheck, useLogout } from '@workspace/api-client-react';
import { getGetCurrentSessionQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

import { AccessDenied } from '@/pages/access-denied';

type ShellProps = { children: ReactNode; adminOnly?: boolean };

export function RepositoryShell({ children, adminOnly = false }: ShellProps) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const queryClient = useQueryClient();
  const sessionQuery = useGetCurrentSession();
  const healthQuery = useHealthCheck();
  const logout = useLogout();

  const user = sessionQuery.data?.user;
  const isAdmin = user?.role === 'admin';
  const activePath = useMemo(() => location, [location]);

  const signOut = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.removeQueries({ queryKey: getGetCurrentSessionQueryKey() });
        setLocation('/login');
      },
    });
  };

  if (sessionQuery.isLoading) {
    return <ShellLoading />;
  }

  if (!user) {
    return <AccessDenied reason="Your session is not active. Sign in to inspect the repository." />;
  }

  if (adminOnly && !isAdmin) {
    return <AccessDenied reason="This console is restricted to repository maintainers." />;
  }

  const nav = (
    <>
      <Link
        href="/"
        data-testid="link-repository"
        onClick={() => setMobileOpen(false)}
        className={`nav-item ${activePath === '/' ? 'nav-item-active' : ''}`}
      >
        <Boxes size={17} strokeWidth={1.8} />
        <span>Repository</span>
        <span className="nav-count">01</span>
      </Link>
      {isAdmin && (
        <Link
          href="/distros/new"
          data-testid="link-add-distro"
          onClick={() => setMobileOpen(false)}
          className={`nav-item ${activePath === '/distros/new' ? 'nav-item-active' : ''}`}
        >
          <Plus size={17} strokeWidth={1.8} />
          <span>Register distro</span>
        </Link>
      )}
    </>
  );

  return (
    <div className="space-field min-h-[100dvh] bg-background text-foreground">
      <aside className={`repo-sidebar ${mobileOpen ? 'repo-sidebar-open' : ''}`}>
        <div className="flex items-center justify-between px-5 pt-6">
          <Link href="/" data-testid="link-brand" className="brand-lockup" onClick={() => setMobileOpen(false)}>
            <span className="brand-mark"><span>~/</span></span>
            <span>
              <strong>linux distro</strong>
              <small>repository</small>
            </span>
          </Link>
          <button className="mobile-close" data-testid="button-close-menu" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pt-9">
          <p className="sidebar-label">Workspace</p>
          <nav className="mt-3 space-y-1">{nav}</nav>
        </div>

        <div className="mt-auto px-5 pb-5">
          <div className="protocol-card">
            <div className="flex items-center justify-between">
              <span className="sidebar-label">Connection</span>
              <Radio size={14} className={healthQuery.data?.status === 'ok' ? 'text-primary' : 'text-muted-foreground'} />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className={`health-dot ${healthQuery.data?.status === 'ok' ? 'health-dot-live' : ''}`} />
              <span className="mono text-[11px] tracking-[.12em] text-foreground/70">
                {healthQuery.isLoading ? 'CHECKING' : healthQuery.data?.status === 'ok' ? 'API ONLINE' : 'API UNKNOWN'}
              </span>
            </div>
            <div className="mt-3 h-px bg-border/70" />
            <p className="mt-3 mono text-[10px] leading-relaxed text-muted-foreground">sync protocol / v0.1.0</p>
          </div>
          <button
            onClick={signOut}
            disabled={logout.isPending}
            data-testid="button-logout"
            className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          >
            <LogOut size={15} />
            {logout.isPending ? 'Ending session…' : 'End session'}
          </button>
        </div>
      </aside>

      {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close menu" data-testid="button-menu-scrim" />}

      <main className="repo-main">
        <header className="repo-topbar">
          <button className="mobile-menu" data-testid="button-open-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Menu size={19} />
          </button>
          <div className="hidden items-center gap-2 md:flex">
            <span className="mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">workspace</span>
            <span className="text-border">/</span>
            <span className="mono text-[10px] uppercase tracking-[.2em] text-primary">catalog</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="topbar-chip"><Activity size={13} /> live index</span>
            <div className="user-chip" data-testid="text-current-user">
              <span className="user-avatar"><CircleUserRound size={15} /></span>
              <span className="hidden text-xs sm:inline">{user.username}</span>
              {isAdmin && <span className="role-chip"><ShieldCheck size={11} /> admin</span>}
              <ChevronDown size={13} className="text-muted-foreground" />
            </div>
          </div>
        </header>
        <div className="repo-content">{children}</div>
      </main>
    </div>
  );
}

function ShellLoading() {
  return (
    <div className="space-field min-h-[100dvh] bg-background p-5 md:p-10">
      <div className="mx-auto max-w-[1400px] animate-pulse">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="mt-12 h-10 w-72 rounded bg-muted" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-muted" />
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-28 rounded-xl bg-card" />)}
        </div>
        <div className="mt-8 h-96 rounded-xl bg-card" />
      </div>
    </div>
  );
}