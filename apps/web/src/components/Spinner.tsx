interface SpinnerProps {
  label?: string;
  compact?: boolean;
}

export function Spinner({ label, compact = false }: SpinnerProps) {
  if (compact) {
    return <span className="spinner spinner-compact" role="status" aria-label={label ?? 'Loading'} />;
  }

  return (
    <div className="loading-container" role="status">
      <div className="spinner" />
      {label && <p>{label}</p>}
    </div>
  );
}
