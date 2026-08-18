import { useEffect, useId, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { friendlyAuthError } from '../authErrors';
import { Icon } from '../components';
import AuthLayout from '../auth/AuthLayout';
import AuthTabs from '../auth/AuthTabs';
import AuthHeader from '../auth/AuthHeader';
import { EmailField, PasswordField, FormError } from '../auth/AuthFields';
import PrimaryAuthButton from '../auth/AuthButton';
import AuthFooter from '../auth/AuthFooter';
import { getRecoveryCode, clearRecoveryParams } from '../auth/recovery';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_SECONDS = 60;

function validateEmail(value) {
  const email = value.trim();
  if (!email) return 'Email is required.';
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address.';
  return null;
}

function validatePassword(value, minimum = 8) {
  if (!value) return 'Password is required.';
  if (value.length < minimum) return `Password must contain at least ${minimum} characters.`;
  return null;
}

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

function isOnline() {
  return typeof navigator === 'undefined' || navigator.onLine;
}

const initialRecoveryCode = getRecoveryCode();

export default function AuthScreen({ onAuthed = () => {} }) {
  const panelId = useId();
  const recoveryCode = useRef(initialRecoveryCode);
  const exchangedRef = useRef(false);

  const [mode, setMode] = useState('signin');
  const [view, setView] = useState(initialRecoveryCode ? 'reset' : 'form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [formError, setFormError] = useState('');
  const [linkInvalid, setLinkInvalid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setTimeout(() => setCooldown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  if (!isSupabaseConfigured) {
    return (
      <AuthLayout>
        <FormError message="Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file." />
      </AuthLayout>
    );
  }

  const patchFieldError = (field, message) => {
    setFieldErrors((current) => ({ ...current, [field]: message }));
  };

  const selectMode = (nextMode) => {
    if (busy || nextMode === mode) return;
    setMode(nextMode);
    setView('form');
    setPassword('');
    setFieldErrors({ email: '', password: '' });
    setFormError('');
  };

  const goToSignIn = () => {
    setMode('signin');
    setView('form');
    setPassword('');
    setFieldErrors({ email: '', password: '' });
    setFormError('');
  };

  const offlineErrorFor = (viewName) => {
    if (viewName === 'forgot') return 'You\'re offline. Connect to the internet to request a recovery link.';
    if (viewName === 'reset') return 'You\'re offline. Connect to the internet to update your password.';
    return mode === 'signup'
      ? 'You\'re offline. Connect to the internet to create an account.'
      : 'You\'re offline. Connect to the internet to sign in.';
  };

  const startCooldown = () => setCooldown(RESEND_COOLDOWN_SECONDS);

  const submitAuth = async (event) => {
    event.preventDefault();
    if (busy) return;

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password, mode === 'signup' ? 8 : 1);
    if (emailError || passwordError) {
      setFieldErrors({ email: emailError, password: passwordError });
      setFormError('');
      return;
    }
    if (!online) {
      setFieldErrors({ email: '', password: '' });
      setFormError(offlineErrorFor('form'));
      return;
    }

    setFieldErrors({ email: '', password: '' });
    setFormError('');
    setBusy(true);

    const normalizedEmail = normalizeEmail(email);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) {
          setFormError(friendlyAuthError(error, 'signup'));
        } else if (data.session) {
          onAuthed();
        } else {
          setView('verify');
          startCooldown();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) {
          setFormError(friendlyAuthError(error, 'signin'));
        } else {
          onAuthed();
        }
      }
    } catch (authError) {
      setFormError(friendlyAuthError(authError, mode));
    } finally {
      setBusy(false);
    }
  };

  const resendVerification = async () => {
    if (busy || cooldown > 0) return;
    setFormError('');
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizeEmail(email),
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) setFormError(friendlyAuthError(error, 'signup'));
      else startCooldown();
    } catch (authError) {
      setFormError(friendlyAuthError(authError, 'signup'));
    } finally {
      setBusy(false);
    }
  };

  const submitForgot = async (event) => {
    event.preventDefault();
    if (busy) return;

    const emailError = validateEmail(forgotEmail);
    if (emailError) {
      setFieldErrors({ email: emailError, password: '' });
      setFormError('');
      return;
    }
    if (!online) {
      setFieldErrors({ email: '', password: '' });
      setFormError(offlineErrorFor('forgot'));
      return;
    }

    setFieldErrors({ email: '', password: '' });
    setFormError('');
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(forgotEmail), {
        redirectTo: window.location.origin,
      });
      if (error) {
        setFormError(friendlyAuthError(error, 'forgot'));
      } else {
        setView('forgotSent');
        startCooldown();
      }
    } catch (authError) {
      setFormError(friendlyAuthError(authError, 'forgot'));
    } finally {
      setBusy(false);
    }
  };

  const resendRecoveryLink = async () => {
    if (busy || cooldown > 0) return;
    setFormError('');
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(forgotEmail), {
        redirectTo: window.location.origin,
      });
      if (error) setFormError(friendlyAuthError(error, 'forgot'));
      else startCooldown();
    } catch (authError) {
      setFormError(friendlyAuthError(authError, 'forgot'));
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async (event) => {
    event.preventDefault();
    if (busy) return;

    const passwordError = validatePassword(resetPassword, 8);
    if (passwordError) {
      setFieldErrors({ email: '', password: passwordError });
      setFormError('');
      return;
    }
    if (!online) {
      setFieldErrors({ email: '', password: '' });
      setFormError(offlineErrorFor('reset'));
      return;
    }

    setFieldErrors({ email: '', password: '' });
    setFormError('');
    setBusy(true);
    try {
      if (!exchangedRef.current) {
        const { error } = await supabase.auth.exchangeCodeForSession(recoveryCode.current);
        if (error) {
          setLinkInvalid(true);
          setFormError('This recovery link is invalid or has expired. Please request a new one.');
          return;
        }
        exchangedRef.current = true;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: resetPassword });
      if (updateError) {
        setFormError(friendlyAuthError(updateError, 'reset'));
        return;
      }
      await supabase.auth.signOut();
      clearRecoveryParams();
      setResetPassword('');
      setView('resetDone');
    } catch (authError) {
      setFormError(friendlyAuthError(authError, 'reset'));
    } finally {
      setBusy(false);
    }
  };

  const requestNewLink = () => {
    setView('forgot');
    setLinkInvalid(false);
    setFormError('');
  };

  const renderVerify = () => (
    <div className="auth-center">
      <div className="auth-view-icon"><Icon name="mail" size={24} /></div>
      <AuthHeader title="Check your email" sub={`We've sent a verification link to ${email}.`} />
      <div className="auth-actions">
        <FormError message={formError} />
        <PrimaryAuthButton
          busy={busy}
          busyLabel="Sending…"
          type="button"
          onClick={resendVerification}
          className="auth-button-outline"
        >
          {cooldown > 0 ? `Resend verification email (${cooldown}s)` : 'Resend verification email'}
        </PrimaryAuthButton>
        <button className="auth-link-btn" type="button" onClick={() => setView('form')}>Change email</button>
        <button className="auth-link-btn" type="button" onClick={goToSignIn}>Return to Sign In</button>
      </div>
    </div>
  );

  const renderForgotSent = () => (
    <div className="auth-center">
      <div className="auth-view-icon"><Icon name="mail" size={24} /></div>
      <AuthHeader title="Check your email" sub={`We've sent a password recovery link to ${forgotEmail}.`} />
      <div className="auth-actions">
        <FormError message={formError} />
        <PrimaryAuthButton
          busy={busy}
          busyLabel="Sending…"
          type="button"
          onClick={resendRecoveryLink}
          className="auth-button-outline"
        >
          {cooldown > 0 ? `Resend link (${cooldown}s)` : 'Resend link'}
        </PrimaryAuthButton>
        <button className="auth-link-btn" type="button" onClick={goToSignIn}>Return to Sign In</button>
      </div>
    </div>
  );

  const renderResetDone = () => (
    <div className="auth-center">
      <div className="auth-view-icon success"><Icon name="check" size={24} /></div>
      <AuthHeader title="Password updated" sub="Your password has been changed. Sign in with your new password." />
      <div className="auth-actions">
        <PrimaryAuthButton type="button" onClick={goToSignIn}>Return to Sign In</PrimaryAuthButton>
      </div>
    </div>
  );

  const renderReset = () => (
    <div className="auth-center">
      <div className="auth-view-icon"><Icon name="key" size={24} /></div>
      <AuthHeader title="Reset your password" sub="Choose a new password for your account." />
      <form className="auth-form" onSubmit={submitReset} noValidate>
        <PasswordField
          value={resetPassword}
          onChange={(value) => {
            setResetPassword(value);
            patchFieldError('password', '');
          }}
          error={fieldErrors.password}
          autoComplete="new-password"
          placeholder="Create a password"
          hint="Use at least 8 characters"
          autoFocus
        />
        <FormError
          message={formError}
          action={linkInvalid && (
            <button className="auth-error-link" type="button" onClick={requestNewLink}>Request a new link</button>
          )}
        />
        <PrimaryAuthButton busy={busy} busyLabel="Updating…">Update Password</PrimaryAuthButton>
      </form>
    </div>
  );

  const renderForgot = () => (
    <div className="auth-center">
      <div className="auth-view-icon"><Icon name="key" size={24} /></div>
      <AuthHeader title="Forgot password?" sub="Enter your email and we'll send you a recovery link." />
      {!online && (
        <div className="auth-offline" role="status">You're offline. Connect to the internet to request a recovery link.</div>
      )}
      <form className="auth-form" onSubmit={submitForgot} noValidate>
        <EmailField
          value={forgotEmail}
          onChange={(value) => {
            setForgotEmail(value);
            patchFieldError('email', '');
          }}
          error={fieldErrors.email}
          autoFocus
        />
        <FormError message={formError} />
        <PrimaryAuthButton busy={busy} busyLabel="Sending…">Send Recovery Link</PrimaryAuthButton>
      </form>
      <AuthFooter>
        Remember your password? <button type="button" onClick={goToSignIn}>Sign in</button>
      </AuthFooter>
    </div>
  );

  const renderForm = () => {
    const isSignup = mode === 'signup';
    return (
      <>
        <AuthHeader
          title={isSignup ? 'Create your account' : 'Welcome back'}
          sub={isSignup ? 'Start creating professional invoices in minutes.' : 'Sign in to continue to PocketBill.'}
        />
        {!online && (
          <div className="auth-offline" role="status">
            You're offline. Connect to the internet to {isSignup ? 'create an account.' : 'sign in.'}
          </div>
        )}
        <form className="auth-form" onSubmit={submitAuth} noValidate>
          <EmailField
            value={email}
            onChange={(value) => {
              setEmail(value);
              patchFieldError('email', '');
            }}
            error={fieldErrors.email}
          />
          <PasswordField
            value={password}
            onChange={(value) => {
              setPassword(value);
              patchFieldError('password', '');
            }}
            error={fieldErrors.password}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            placeholder={isSignup ? 'Create a password' : 'Enter your password'}
            hint={isSignup ? 'Use at least 8 characters' : undefined}
            forgotAction={isSignup ? undefined : () => {
              setForgotEmail(email || '');
              setView('forgot');
              setFormError('');
              setFieldErrors({ email: '', password: '' });
            }}
          />
          <FormError
            message={formError}
            action={formError && formError.includes('already exists') && (
              <button className="auth-error-link" type="button" onClick={goToSignIn}>Sign in instead</button>
            )}
          />
          <PrimaryAuthButton busy={busy} busyLabel={isSignup ? 'Creating account…' : 'Signing in…'}>
            {isSignup ? 'Create Account' : 'Sign In'}
          </PrimaryAuthButton>
        </form>
        {isSignup && (
          <p className="auth-terms">
            By creating an account, you agree to our <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.
          </p>
        )}
        <AuthFooter>
          {isSignup ? (
            <>Already have an account? <button type="button" onClick={goToSignIn}>Sign in</button></>
          ) : (
            <>New to PocketBill? <button type="button" onClick={() => selectMode('signup')}>Create account</button></>
          )}
        </AuthFooter>
        <p className="auth-note">Your data is saved on this device and synced to your account when you're online.</p>
      </>
    );
  };

  return (
    <AuthLayout>
      {(view === 'form' || view === 'verify') && (
        <AuthTabs active={mode} onChange={selectMode} disabled={busy} panelId={panelId} />
      )}
      <div
        className={`auth-panel ${view === 'form' || view === 'verify' ? 'tabbed' : ''}`}
        id={panelId}
        role="tabpanel"
        aria-labelledby={view === 'form' || view === 'verify' ? `auth-tab-${mode}` : undefined}
      >
        {view === 'form' && renderForm()}
        {view === 'verify' && renderVerify()}
        {view === 'forgot' && renderForgot()}
        {view === 'forgotSent' && renderForgotSent()}
        {view === 'reset' && renderReset()}
        {view === 'resetDone' && renderResetDone()}
      </div>
    </AuthLayout>
  );
}