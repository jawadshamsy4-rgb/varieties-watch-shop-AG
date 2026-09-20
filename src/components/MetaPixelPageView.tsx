import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/tracking";

const PAGE_VIEW_RETRY_DELAY = 300;
const PAGE_VIEW_MAX_ATTEMPTS = 10;

const firePageView = () => {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return false;
  }

  trackPageView();
  return true;
};

/**
 * Fires PageView after React mounts and on every client-side navigation.
 * The pixel bootstrap script remains defined once globally in index.html.
 */
const MetaPixelPageView = () => {
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;
    let attempts = 0;

    const triggerPageView = () => {
      if (cancelled) return;

      attempts += 1;

      if (firePageView() || attempts >= PAGE_VIEW_MAX_ATTEMPTS) {
        return;
      }

      timeoutId = window.setTimeout(triggerPageView, PAGE_VIEW_RETRY_DELAY);
    };

    triggerPageView();

    return () => {
      cancelled = true;

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [location.key, location.pathname, location.search, location.hash]);

  return null;
};

export default MetaPixelPageView;
