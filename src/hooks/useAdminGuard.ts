import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks localStorage directly to see if an auth session token exists.
 * This prevents false-negative session checks while the client is initializing or refreshing.
 */
export const hasPersistedToken = (): boolean => {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const session = parsed?.currentSession ?? parsed?.session ?? parsed;
          if (session?.access_token || session?.user) return true;
        }
      }
    }
  } catch {
    // ignore
  }
  return false;
};

/**
 * Hook to guard admin routes.
 * Ensures the admin stays logged in persistently until they explicitly click "Logout".
 * Automatically handles token refresh in the background without kicking the admin out.
 */
export const useAdminGuard = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(() => hasPersistedToken());
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          if (mounted) {
            setIsAdmin(true);
            setLoading(false);
          }
          return;
        }

        // If getSession didn't return a session, check persisted storage
        if (hasPersistedToken()) {
          if (mounted) {
            setIsAdmin(true);
            setLoading(false);
          }
          return;
        }

        // Definitely not logged in
        if (mounted) {
          setIsAdmin(false);
          setLoading(false);
          navigate("/admin", { replace: true });
        }
      } catch (err) {
        console.error("Admin guard verification error:", err);
        if (hasPersistedToken()) {
          if (mounted) {
            setIsAdmin(true);
            setLoading(false);
          }
        } else if (mounted) {
          setIsAdmin(false);
          setLoading(false);
          navigate("/admin", { replace: true });
        }
      }
    };

    void checkSession();

    // Listen to auth events (explicit sign-out or background token renewal)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        if (mounted) {
          setIsAdmin(false);
          setLoading(false);
          navigate("/admin", { replace: true });
        }
      } else if (session?.user) {
        if (mounted) {
          setIsAdmin(true);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return { loading, isAdmin };
};
