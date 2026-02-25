import { useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import i18n from '../i18n';
import { supabase } from '../lib/supabase';
import { onAuthError } from '../core/auth-error';
import { claimInvite } from '../core/api';
import { getPendingInvite, clearPendingInvite } from '../core/pending-invite';
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
    supabase.auth
      .getSession()
      .then(({ data: { session: initial } }) => {
        setSession(initial);
        setUser(initial?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        console.error(
          `[AuthProvider] getSession failed on mount — app may be stuck in loading state. Error: ${err instanceof Error ? err.message : String(err)}`
        );
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

        const pending = getPendingInvite();
        if (pending) {
          console.info(
            `[AuthProvider] SIGNED_IN detected with pending invite — planId="${pending.planId}", token="${pending.inviteToken.slice(0, 8)}…". Calling claimInvite (OAuth fallback)…`
          );
          clearPendingInvite();
          claimInvite(pending.planId, pending.inviteToken)
            .then(() => {
              console.info(
                `[AuthProvider] claimInvite succeeded for planId="${pending.planId}". Invalidating query cache.`
              );
              queryClient.invalidateQueries();
            })
            .catch((err) => {
              console.warn(
                `[AuthProvider] claimInvite failed for planId="${pending.planId}", token="${pending.inviteToken.slice(0, 8)}…". ` +
                  `This can happen if already claimed or token is invalid. Error: ${err instanceof Error ? err.message : String(err)}`
              );
            });
        } else {
          console.debug(
            '[AuthProvider] SIGNED_IN detected — no pending invite in localStorage.'
          );
        }
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  useEffect(() => {
    return onAuthError(() => {
      setAuthErrorOpen(true);
    });
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(
        `[AuthProvider] signOut failed. Error: ${error.message} (status: ${error.status})`
      );
      toast.error(i18n.t('auth.signOutFailed', { message: error.message }));
      return;
    }
    console.info(
      '[AuthProvider] signOut succeeded — clearing cache, navigating to home.'
    );
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
