import { Link } from 'wouter';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="space-field flex min-h-[100dvh] items-center justify-center bg-background px-5">
      <div className="glass-panel w-full max-w-md rounded-2xl p-8 text-center">
        <AlertCircle className="mx-auto text-primary" size={28} strokeWidth={1.5} />
        <p className="mono mt-6 text-[10px] uppercase tracking-[.3em] text-primary">signal / not found</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Unknown route</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">This address is outside the repository map.</p>
        <Link href="/" data-testid="link-not-found-home" className="mt-7 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
          <ArrowLeft size={15} /> return to repository
        </Link>
      </div>
    </div>
  );
}
