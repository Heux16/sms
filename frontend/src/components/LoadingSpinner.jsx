export default function LoadingSpinner({ label = 'Loading...', size = 'md' }) {
  const className = size === 'sm' ? 'spinner spinner-sm' : 'spinner';

  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <span className={className} />
      <span>{label}</span>
    </div>
  );
}
