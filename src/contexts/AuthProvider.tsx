import { useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import i18n from '../i18n';
import { supabase } from '../lib/supabase';
import { onAuthError } from '../core/auth-error';
import { AuthContext } from './auth-context';
import AuthErrorModal from '../components/AuthErrorModal';

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authErrorOpen, setAuthErrorOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      setSession(initial);
      setUser(initial?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_IN') {
        const email = newSession?.user?.email;
        toast.success(
          email ? i18n.t('auth.signedInAs', { email }) : i18n.t('auth.signedIn')
        );
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    return onAuthError(() => {
      setAuthErrorOpen(true);
    });
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(i18n.t('auth.signOutFailed', { message: error.message }));
      return;
    }
    queryClient.clear();
    navigate({ to: '/' });
  }, [queryClient, navigate]);

  const isAdmin =
    (user?.app_metadata as Record<string, unknown> | undefined)?.role ===
    'admin';

  return (
    <AuthContext.Provider value={{ session, user, loading, isAdmin, signOut }}>
      {children}
      <AuthErrorModal
        open={authErrorOpen}
        onDismiss={() => setAuthErrorOpen(false)}
      />
    </AuthContext.Provider>
  );
}
