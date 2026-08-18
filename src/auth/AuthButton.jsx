export default function PrimaryAuthButton({ busy, busyLabel, children, type = 'submit', className = '', onClick }) {
  return (
    <button className={`auth-button ${className}`.trim()} type={type} disabled={busy} aria-busy={busy} onClick={onClick}>
      {busy && <span className="spinner" aria-hidden="true" />}
      <span>{busy ? busyLabel : children}</span>
    </button>
  );
}