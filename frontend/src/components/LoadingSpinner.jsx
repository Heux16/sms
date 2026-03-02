export default function LoadingSpinner({ label = 'Loading...', size = 'md' }) {
  const spinnerSize = size === 'sm' ? 'h-4 w-4 border-2' : 'h-5 w-5 border-2';

  return (
    <div className="inline-flex items-center gap-2 text-sm text-slate-700" role="status" aria-live="polite">
      <span className={`${spinnerSize} animate-spin rounded-full border-slate-300 border-t-brand-600`} />
      {label ? <span>{label}</span> : null}
    </div>
  );
}
