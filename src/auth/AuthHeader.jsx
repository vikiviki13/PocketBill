export default function AuthHeader({ title, sub }) {
  return (
    <div className="auth-head">
      <h2 className="auth-head-title">{title}</h2>
      {sub && <p className="auth-head-sub">{sub}</p>}
    </div>
  );
}