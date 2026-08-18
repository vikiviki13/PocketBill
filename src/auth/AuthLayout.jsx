export function AuthBrand() {
  return (
    <div className="auth-brand">
      <div className="auth-logo" aria-hidden="true">PB</div>
      <h1 className="auth-title">PocketBill</h1>
      <p className="auth-tagline">Simple invoicing, wherever business happens.</p>
    </div>
  );
}

export default function AuthLayout({ children }) {
  return (
    <div className="app">
      <div className="auth-shell">
        <AuthBrand />
        {children}
      </div>
    </div>
  );
}