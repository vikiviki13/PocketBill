import { useId, useState } from 'react';
import { Icon } from '../components';

export function AuthError({ id, message }) {
  if (!message) return null;
  return (
    <p className="auth-field-error" id={id} role="alert">
      <Icon name="alert" size={14} />
      <span>{message}</span>
    </p>
  );
}

export function EmailField({ value, onChange, error, autoFocus, placeholder = 'you@example.com' }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="auth-field">
      <label className="auth-label" htmlFor={id}>Email</label>
      <input
        id={id}
        className={`auth-input${error ? ' invalid' : ''}`}
        type="email"
        inputMode="email"
        autoCapitalize="none"
        autoComplete="email"
        spellCheck="false"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoFocus={autoFocus}
        enterKeyHint="next"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      <AuthError id={errorId} message={error} />
    </div>
  );
}

export function PasswordField({
  value,
  onChange,
  error,
  autoComplete,
  placeholder = 'Create a password',
  hint,
  forgotAction,
  autoFocus,
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const [visible, setVisible] = useState(false);
  const toggleLabel = visible ? 'Hide password' : 'Show password';

  return (
    <div className="auth-field">
      <div className="auth-label-row">
        <label className="auth-label" htmlFor={id}>Password</label>
        {forgotAction && (
          <button className="auth-forgot" type="button" onClick={forgotAction}>Forgot password?</button>
        )}
      </div>
      <div className="auth-input-wrap">
        <input
          id={id}
          className={`auth-input suffix${error ? ' invalid' : ''}`}
          type={visible ? 'text' : 'password'}
          autoCapitalize="none"
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoFocus={autoFocus}
          enterKeyHint="go"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <button
          className="auth-toggle"
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={toggleLabel}
          aria-pressed={visible}
        >
          <Icon name={visible ? 'eyeOff' : 'eye'} size={19} />
        </button>
      </div>
      {hint && <p className="auth-hint">{hint}</p>}
      <AuthError id={errorId} message={error} />
    </div>
  );
}

export function FormError({ message, action }) {
  if (!message) return null;
  return (
    <div className="auth-form-error" role="alert">
      <Icon name="alert" size={16} />
      <span className="auth-form-error-text">
        {message}
        {action}
      </span>
    </div>
  );
}