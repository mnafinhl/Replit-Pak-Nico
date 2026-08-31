import { Link } from 'wouter';
import { ArrowLeft, LockKeyhole } from 'lucide-react';

type AccessDeniedProps = { reason?: string };

export function AccessDenied({ reason = 'You do not have access to this workspace.' }: AccessDeniedProps) {
  return (
    <div className="space-field flex min-h-[100dvh] items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-lg animate-enter text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-[0_0_38px_rgba(92,231,255,.12)]">
          <LockKeyhole size={27} strokeWidth={1.5} />
        </div>
        <p className="mono mt-7 text-[11px] uppercase tracking-[.3em] text-primary">access / denied</p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground">The console is sealed.</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted-foreground">{reason}</p>
        <Link href="/login" data-testid="link-access-login" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">
          <ArrowLeft size={16} /> Return to sign in
        </Link>
      </div>
    </div>
  );
}