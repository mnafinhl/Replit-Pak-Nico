import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { ArrowLeft, Check, CircleAlert, Image as ImageIcon, LoaderCircle, Save, Terminal } from 'lucide-react';
import { getGetDistroQueryKey, getGetDashboardSummaryQueryKey, getListDistrosQueryKey, useCreateDistro, useGetDistro, useUpdateDistro } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

type FormState = { name: string; base: string; kernel: string; status: 'Development' | 'Active' | 'Legacy'; image: string; notes: string };
const blank: FormState = { name: '', base: '', kernel: '', status: 'Development', image: '', notes: '' };

export default function DistroEditor() {
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const isNew = !params.id;
  const id = Number(params.id);
  const detail = useGetDistro(id, { query: { enabled: !isNew && Number.isFinite(id), queryKey: getGetDistroQueryKey(id) } });
  const create = useCreateDistro();
  const update = useUpdateDistro();
  const [form, setForm] = useState<FormState>(blank);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    if (detail.data && !isNew) {
      setForm({ name: detail.data.name, base: detail.data.base, kernel: detail.data.kernel, status: detail.data.status, image: detail.data.image ?? '', notes: detail.data.notes });
    }
  }, [detail.data, isNew]);

  const change = (field: keyof FormState, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    if (!validType || file.size > 2 * 1024 * 1024) {
      setImageError('Use a JPG, PNG, or WEBP image up to 2 MB.');
      event.target.value = '';
      return;
    }
    setImageError('');
    const reader = new FileReader();
    reader.onload = () => change('image', typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!form.name.trim() || !form.base.trim() || !form.kernel.trim()) {
      setError('Name, base, and kernel are required fields.');
      return;
    }
    const payload = { name: form.name.trim(), base: form.base.trim(), kernel: form.kernel.trim(), status: form.status, image: form.image.trim() || null, notes: form.notes.trim() };
    const onSuccess = () => {
      void queryClient.invalidateQueries({ queryKey: getListDistrosQueryKey() });
      void queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      if (!isNew) void queryClient.invalidateQueries({ queryKey: getGetDistroQueryKey(id) });
      setLocation('/');
    };
    if (isNew) create.mutate({ data: payload }, { onSuccess, onError: () => setError('The distro could not be registered. Check the API and try again.') });
    else update.mutate({ id, data: payload }, { onSuccess, onError: () => setError('The distro could not be updated. Check the API and try again.') });
  };

  const pending = create.isPending || update.isPending;
  if (!isNew && detail.isLoading) return <EditorLoading />;
  if (!isNew && (detail.isError || !detail.data)) return <div className="glass-panel rounded-xl p-10 text-center"><CircleAlert className="mx-auto text-destructive" /><p className="mt-4 text-sm">This distribution record could not be loaded.</p><Link href="/" data-testid="link-editor-error-back" className="mt-5 inline-flex rounded-lg border border-border px-3 py-2 text-xs hover:border-primary/50">back to repository</Link></div>;

  return <div className="mx-auto max-w-4xl animate-enter">
    <Link href="/" data-testid="link-editor-back" className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-primary"><ArrowLeft size={14} /> back to repository</Link>
    <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mono text-[10px] uppercase tracking-[.3em] text-primary">maintainer action / {isNew ? 'new record' : 'edit record'}</p><h1 className="mt-3 text-4xl font-semibold tracking-[-.045em]">{isNew ? 'Register a distro' : 'Edit distribution'}</h1><p className="mt-3 text-sm text-muted-foreground">{isNew ? 'Add a system to the living repository index.' : 'Update the system signature and maintainer notes.'}</p></div><div className="mono text-[10px] text-muted-foreground">schema / distro.v1</div></div>
    <form onSubmit={submit} className="mt-10">
      <div className="glass-panel rounded-xl p-5 sm:p-8">
        <div className="flex items-center gap-3 border-b border-border/70 pb-5"><span className="icon-square"><Terminal size={16} /></span><div><h2 className="text-sm font-medium">System signature</h2><p className="mt-1 text-xs text-muted-foreground">The identifiers used to locate this distribution.</p></div></div>
        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <Field label="distribution name" value={form.name} onChange={(value) => change('name', value)} placeholder="e.g. Fedora Workstation" testId="input-distro-name" />
          <Field label="base system" value={form.base} onChange={(value) => change('base', value)} placeholder="e.g. Red Hat Linux" testId="input-distro-base" />
          <Field label="kernel line" value={form.kernel} onChange={(value) => change('kernel', value)} placeholder="e.g. Linux 6.12" testId="input-distro-kernel" />
          <div><label className="field-label" htmlFor="status"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> lifecycle status</label><select id="status" data-testid="select-distro-status" value={form.status} onChange={(event) => change('status', event.target.value)} className="repo-input mt-2"><option value="Development">Development</option><option value="Active">Active</option><option value="Legacy">Legacy</option></select></div>
          <div className="md:col-span-2">
            <label className="field-label" htmlFor="image"><ImageIcon size={13} /> image reference <span className="font-normal normal-case tracking-normal text-muted-foreground">(optional)</span></label>
            <input id="image" data-testid="input-distro-image" value={form.image.startsWith('data:') ? '' : form.image} onChange={(event) => change('image', event.target.value)} placeholder="https://example.org/distro-mark.svg" className="repo-input mt-2" />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label htmlFor="image-file" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/80 bg-background/30 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"><ImageIcon size={14} /> upload image</label>
              <input id="image-file" data-testid="input-distro-image-file" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={selectImage} className="sr-only" />
              <span className="mono text-[10px] text-muted-foreground">JPG / PNG / WEBP · max 2 MB</span>
            </div>
            {imageError && <p className="mt-2 text-xs text-destructive">{imageError}</p>}
            {form.image && <div className="mt-4 flex items-center gap-3 rounded-lg border border-border/70 bg-background/30 p-3"><img src={form.image} alt="Distribution preview" className="h-12 w-12 rounded-md object-cover" /><span className="text-xs text-muted-foreground">{form.image.startsWith('data:') ? 'Local image ready to save' : 'Remote image reference'}</span></div>}
          </div>
          <div className="md:col-span-2"><label className="field-label" htmlFor="notes"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> maintainer notes</label><textarea id="notes" data-testid="input-distro-notes" value={form.notes} onChange={(event) => change('notes', event.target.value)} placeholder="What should operators know about this system?" rows={5} className="repo-input mt-2 resize-y leading-6" /></div>
        </div>
      </div>
      {error && <div data-testid="status-editor-error" className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-xs leading-5 text-destructive"><CircleAlert size={15} className="mt-0.5 shrink-0" />{error}</div>}
      <div className="mt-5 flex flex-col-reverse justify-end gap-3 sm:flex-row"><Link href="/" data-testid="button-cancel-editor" className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground">Cancel</Link><button type="submit" data-testid="button-save-distro" disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">{pending ? <><LoaderCircle size={16} className="animate-spin" /> saving record</> : <><Check size={16} /> <Save size={15} /> {isNew ? 'Register distro' : 'Save changes'}</>}</button></div>
    </form>
  </div>;
}

function Field({ label, value, onChange, placeholder, testId }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; testId: string }) {
  return <div><label className="field-label" htmlFor={testId}><span className="h-1.5 w-1.5 rounded-full bg-primary" /> {label}</label><input id={testId} data-testid={testId} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="repo-input mt-2" /></div>;
}
function EditorLoading() { return <div className="animate-pulse"><div className="h-4 w-32 rounded bg-muted" /><div className="mt-10 h-12 w-80 rounded bg-muted" /><div className="mt-3 h-4 w-96 max-w-full rounded bg-muted" /><div className="glass-panel mt-10 h-[500px] rounded-xl bg-card" /></div>; }