import { useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { friendlyAuthError } from '../authErrors';

function ErrorBox({ message }) {
  return message ? <div className="auth-error" role="alert">{message}</div> : null;
}

export default function AuthScreen({ onAuthed = () => {} }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const submittingRef = useRef(false);

  if (!isSupabaseConfigured) {
    return (
      <div className="app">
        <div className="auth-wrap">
          <div className="auth-logo">PB</div>
          <h1 className="auth-title">PocketBill</h1>
          <ErrorBox message="Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file." />
        </div>
      </div>
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;

    setError('');
    setInfo('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }

    submittingRef.current = true;
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (signUpError) {
          setError(friendlyAuthError(signUpError, 'signup'));
        } else if (data.session) {
          onAuthed();
        } else {
          setInfo('Account created! Check your inbox for a confirmation link, then sign in.');
          setMode('signin');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (signInError) {
          setError(friendlyAuthError(signInError, 'signin'));
        } else {
          onAuthed();
        }
      }
    } catch (authError) {
      setError(friendlyAuthError(authError, mode));
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  };

  const selectMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setInfo('');
  };

  return (
    <div className="app">
      <div className="auth-wrap">
        <div className="auth-logo">PB</div>
        <h1 className="auth-title">PocketBill</h1>
        <p className="auth-sub">Invoices that work on your phone, backed by the cloud.</p>

        <div className="auth-tabs" role="tablist">
          <button className={`auth-tab ${mode === 'signin' ? 'active' : ''}`} type="button" onClick={() => selectMode('signin')}>Sign In</button>
          <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} type="button" onClick={() => selectMode('signup')}>Create Account</button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <label className="section-label field-label" htmlFor="auth-email">Email</label>
          <input id="auth-email" className="input" type="email" inputMode="email" autoCapitalize="none" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />

          <label className="section-label field-label" htmlFor="auth-password">Password</label>
          <input id="auth-password" className="input" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength="6" placeholder="At least 6 characters" value={password} onChange={(event) => setPassword(event.target.value)} required />

          <ErrorBox message={error} />
          {info && <div className="auth-info" role="status">{info}</div>}

          <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p className="auth-footnote">Your data is saved on this device and synced to your account when you are online.</p>
      </div>
    </div>
  );
}
