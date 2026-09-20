import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { checkAndInvalidateCache } from "./lib/version-check";
import { purgeStaleAuthTokens } from "./lib/supabase-resilience";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");

const bootstrap = async () => {
  // Fail-fast guard: on Vercel/custom domains, missing env vars cause
  // Supabase requests to hang silently (createClient with undefined URL).
  // Surface this immediately instead of leaving users stuck on "Signing in…".
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    // eslint-disable-next-line no-console
    console.error("[Config] Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY", {
      host: window.location.hostname,
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
    });
    if (rootElement) {
      rootElement.innerHTML =
        '<div style="font-family:system-ui;padding:32px;max-width:640px;margin:40px auto;color:#111;">' +
        '<h1 style="font-size:20px;margin-bottom:12px;">Configuration error</h1>' +
        '<p>This deployment is missing <code>VITE_SUPABASE_URL</code> and/or <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>. ' +
        'Add them in your hosting provider\'s Environment Variables settings (Production + Preview + Development) and redeploy.</p>' +
        '</div>';
    }
    return;
  }

  // Drop any expired Supabase auth tokens before the SDK initializes.
  // A stale token in localStorage was causing the app to hang on load
  // for some browsers (worked fine in incognito where no token exists).
  purgeStaleAuthTokens();

  const shouldRender = await checkAndInvalidateCache();

  if (!shouldRender || !rootElement) return;

  createRoot(rootElement).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
};

void bootstrap();
