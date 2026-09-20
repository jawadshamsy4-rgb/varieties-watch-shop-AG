import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resetClientSession, isSessionError } from "@/lib/supabase-resilience";

interface AuthReadyState {
  isReady: boolean;
  authKey: string;
}

const AuthReadyContext = createContext<AuthReadyState>({ isReady: false, authKey: "boot" });

export const AuthReadyProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthReadyState>({ isReady: false, authKey: "boot" });

  useEffect(() => {
    let isMounted = true;

    // Mark ready immediately. Public queries (products, hero, brands) do not
    // need auth and were getting stuck behind a hanging getSession() call on
    // browsers with stale tokens. The SDK still attaches the persisted token
    // to outgoing requests, and onAuthStateChange below updates authKey once
    // the real session resolves.
    setState({ isReady: true, authKey: "anon" });
    const readyFallback = setTimeout(() => {}, 0);

    const restoreSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          // Network/transient errors should not sign the user out.
          if (isSessionError(error)) {
            await resetClientSession();
            if (!isMounted) return;
            setState({ isReady: true, authKey: "anon" });
            return;
          }
          if (!isMounted) return;
          setState({ isReady: true, authKey: "anon" });
          return;
        }

        if (session) {
          // Trust the persisted session. Avoid an extra /user round-trip
          // because a transient failure here was logging admins out.
          if (!isMounted) return;
          setState({ isReady: true, authKey: session.user?.id ?? "anon" });
          return;
        }

        if (!isMounted) return;
        setState({ isReady: true, authKey: "anon" });
      } catch {
        // Transient/unknown failure — keep any persisted session, just mark ready.
        if (!isMounted) return;
        setState({ isReady: true, authKey: "anon" });
      }
    };

    void restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setState({ isReady: true, authKey: session?.user?.id ?? "anon" });
    });

    return () => {
      isMounted = false;
      clearTimeout(readyFallback);
      subscription.unsubscribe();
    };
  }, []);

  return <AuthReadyContext.Provider value={state}>{children}</AuthReadyContext.Provider>;
};

export const useAuthReady = () => useContext(AuthReadyContext);
