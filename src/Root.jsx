import { useEffect, useState } from 'react';
import App from './App';
import { Sync } from './sync';
import { supabase, isAuthEnabled } from './supabase';
import AuthScreen from './screens/AuthScreen';
import { getRecoveryCode } from './auth/recovery';

const IS_SHARE_LINK = window.location.hash.startsWith('#share=');
const IS_RECOVERY_LINK = getRecoveryCode() !== null;

export function Splash() {
  return (
    <div className="app">
      <div className="auth-wrap">
        <div className="auth-logo">PB</div>
        <h1 className="auth-title">PocketBill</h1>
      </div>
    </div>
  );
}

export default function Root() {
  const [session, setSession] = useState(() => (
    isAuthEnabled && !IS_SHARE_LINK ? undefined : 'bypass'
  ));
  const [syncing, setSyncing] = useState(false);

  const adoptSession = (nextSession) => {
    if (IS_RECOVERY_LINK) return;
    setSession(nextSession);
    if (nextSession) {
      setSyncing(true);
      Sync.loginSync().finally(() => setSyncing(false));
    }
  };

  useEffect(() => {
    if (!isAuthEnabled || IS_SHARE_LINK) return undefined;

    supabase.auth.getSession().then(({ data }) => adoptSession(data.session));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      adoptSession(nextSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  if (session === 'bypass' || (session && !syncing)) {
    return <App />;
  }
  if (!session) {
    return <AuthScreen />;
  }
  return <Splash />;
}
