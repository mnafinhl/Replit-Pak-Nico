import { FormEvent, useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, KeyRound, LoaderCircle, LockKeyhole, TerminalSquare, UserRound } from 'lucide-react';
import { useLogin } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetCurrentSessionQueryKey } from '@workspace/api-client-react';

export default function Login() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const login = useLogin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    if (!username.trim() || !password) {
      setFormError('Enter both credentials to continue.');
      return;
    }
    login.mutate({ data: { username: username.trim(), password } }, {
      onSuccess: (session) => {
        queryClient.setQueryData(getGetCurrentSessionQueryKey(), session);
        setLocation('/');
      },
      onError: (error) => {
        const message = typeof error === 'object' && error && 'error' in error ? String(error.error) : 'Credentials were not accepted.';
        setFormError(message);
      },
    });
  };

  return (
    <div className="space-field grid min-h-[100dvh] bg-background lg:grid-cols-[1fr_0.82fr]">
      <section className="relative hidden overflow-hidden border-r border-border/70 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div className="relative z-10 flex items-center gap-3">
          <span className="brand-mark brand-mark-large"><span>~/</span></span>
          <div><strong className="block text-sm tracking-wide">linux distro</strong><small className="mono block text-[10px] uppercase tracking-[.24em] text-muted-foreground">repository</small></div>
        </div>
        <div className="relative z-10 max-w-xl">
          <p className="mono text-[11px] uppercase tracking-[.32em] text-primary">private index / 0x01</p>
          <h1 className="mt-6 text-6xl font-semibold leading-[1.03] tracking-[-.055em] text-foreground xl:text-7xl">
            A living map of <span className="text-primary text-glow">Linux.</span>
          </h1>
          <p className="mt-7 max-w-md text-base leading-8 text-muted-foreground">A precise workspace for the distributions shaping the next boot sequence.</p>
          <div className="mt-12 flex items-center gap-3 text-xs text-muted-foreground"><span className="health-dot health-dot-live" /> repository systems nominal <span className="mx-1 text-border">·</span> read/write node</div>
        </div>
        <div className="relative z-10 flex items-end justify-between">
          <span className="mono text-[10px] tracking-[.18em] text-muted-foreground">LDR / AUTH GATE</span>
          <TerminalSquare size={22} className="text-primary/50" />
        </div>
        <div className="login-orbit orbit-one" />
        <div className="login-orbit orbit-two" />
      </section>

      <section className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-[420px] animate-enter">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="brand-mark"><span>~/</span></span>
            <div><strong className="block text-sm">linux distro</strong><small className="mono block text-[10px] uppercase tracking-[.2em] text-muted-foreground">repository</small></div>
          </div>
          <div className="mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary"><LockKeyhole size={19} /></div>
            <p className="mono mt-7 text-[10px] uppercase tracking-[.28em] text-muted-foreground">maintainer portal</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Sign in to the index</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Your credentials open a monitored repository session.</p>
          </div>
          <form onSubmit={submit} className="glass-panel rounded-2xl p-5 sm:p-7">
            <label className="field-label" htmlFor="username"><UserRound size={13} /> username</label>
            <input id="username" data-testid="input-username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="maintainer" className="repo-input mt-2" />
            <label className="field-label mt-5" htmlFor="password"><KeyRound size={13} /> passphrase</label>
            <input id="password" data-testid="input-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••••••" className="repo-input mt-2" />
            {formError && <p data-testid="status-login-error" className="mt-4 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive">{formError}</p>}
            <button type="submit" data-testid="button-submit-login" disabled={login.isPending} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">
              {login.isPending ? <><LoaderCircle size={16} className="animate-spin" /> verifying session</> : <>Open workspace <ArrowRight size={16} /></>}
            </button>
            <p className="mt-5 text-center mono text-[10px] leading-5 text-muted-foreground">sessions are authenticated against the repository API</p>
          </form>
        </div>
      </section>
    </div>
  );
}