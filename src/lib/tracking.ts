/**
 * Meta Pixel & GTM tracking helpers.
 * All calls are safe to invoke even if fbq / dataLayer are not loaded.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    dataLayer?: Record<string, unknown>[];
  }
}

import { supabase } from "@/integrations/supabase/client";

/* ── helpers ─────────────────────────────────────────────────── */

const fbq = (...args: unknown[]) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq(...args);
    if (typeof console !== "undefined") {
      console.debug("[meta-pixel] fbq", ...args);
    }
  }
};

const pushDataLayer = (event: Record<string, unknown>) => {
  if (typeof window !== "undefined") {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(event);
  }
};

const getCookie = (name: string): string | undefined => {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : undefined;
};

const newEventId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const EXTERNAL_ID_KEY = "vws_meta_external_id";
const getExternalId = (): string | undefined => {
  if (typeof localStorage === "undefined") return undefined;
  try {
    let id = localStorage.getItem(EXTERNAL_ID_KEY);
    if (!id) {
      id = newEventId();
      localStorage.setItem(EXTERNAL_ID_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
};

const sendCapi = (
  event_name: string,
  event_id: string,
  custom_data: Record<string, unknown>,
  user_data?: { em?: string; ph?: string },
) => {
  try {
    const payload = {
      event_name,
      event_id,
      event_source_url: typeof window !== "undefined" ? window.location.href : undefined,
      action_source: "website",
      user_data: {
        ...(user_data ?? {}),
        fbp: getCookie("_fbp"),
        fbc: getCookie("_fbc"),
        external_id: getExternalId(),
      },
      custom_data,
    };
    void supabase.functions.invoke("meta-capi", { body: payload }).catch(() => {});
  } catch {
    /* noop — tracking must never break the app */
  }
};

export const trackPageView = () => {
  const event_id = newEventId();
  fbq("track", "PageView", {}, { eventID: event_id });
  sendCapi("PageView", event_id, {});
};

/* ── deduplication ───────────────────────────────────────────── */

const firedEvents = new Set<string>();

const dedupeKey = (event: string, id?: string) =>
  id ? `${event}:${id}` : event;

const shouldFire = (event: string, id?: string): boolean => {
  const key = dedupeKey(event, id);
  if (firedEvents.has(key)) return false;
  firedEvents.add(key);
  return true;
};

/* ── public API ──────────────────────────────────────────────── */

export const trackViewContent = (params: {
  product_name: string;
  price: number;
  product_id: string;
}) => {
  if (!shouldFire("ViewContent", params.product_id)) return;

  const event_id = newEventId();
  const custom_data = {
    content_name: params.product_name,
    content_ids: [params.product_id],
    content_type: "product",
    value: params.price,
    currency: "BDT",
  };

  fbq("track", "ViewContent", custom_data, { eventID: event_id });
  sendCapi("ViewContent", event_id, custom_data);

  pushDataLayer({
    event: "view_content",
    product_name: params.product_name,
    price: params.price,
    product_id: params.product_id,
  });
};

export const trackAddToCart = (params: {
  product_name: string;
  price: number;
  quantity: number;
  product_id: string;
}) => {
  const event_id = newEventId();
  const custom_data = {
    content_name: params.product_name,
    content_ids: [params.product_id],
    content_type: "product",
    value: params.price * params.quantity,
    currency: "BDT",
    num_items: params.quantity,
  };

  fbq("track", "AddToCart", custom_data, { eventID: event_id });
  sendCapi("AddToCart", event_id, custom_data);

  pushDataLayer({
    event: "add_to_cart",
    product_name: params.product_name,
    price: params.price,
    quantity: params.quantity,
    product_id: params.product_id,
  });
};

export const trackInitiateCheckout = (params: {
  value: number;
  num_items: number;
  content_ids?: string[];
}) => {
  if (!shouldFire("InitiateCheckout")) return;

  const event_id = newEventId();
  const custom_data = {
    value: params.value,
    currency: "BDT",
    num_items: params.num_items,
    ...(params.content_ids ? { content_ids: params.content_ids, content_type: "product" } : {}),
  };

  fbq("track", "InitiateCheckout", custom_data, { eventID: event_id });
  sendCapi("InitiateCheckout", event_id, custom_data);

  pushDataLayer({
    event: "initiate_checkout",
    value: params.value,
    num_items: params.num_items,
  });
};

export const trackAddPaymentInfo = (params: {
  value: number;
  email?: string;
  phone?: string;
}) => {
  if (!shouldFire("AddPaymentInfo")) return;

  const event_id = newEventId();
  const custom_data = { value: params.value, currency: "BDT" };

  fbq("track", "AddPaymentInfo", custom_data, { eventID: event_id });
  sendCapi("AddPaymentInfo", event_id, custom_data, {
    em: params.email,
    ph: params.phone,
  });

  pushDataLayer({
    event: "add_payment_info",
    value: params.value,
  });
};

export const trackPurchase = (params: {
  product_name: string;
  quantity: number;
  total_price: number;
  currency?: string;
  order_id?: string;
  content_ids?: string[];
  num_items?: number;
  email?: string;
  phone?: string;
}) => {
  const id = params.order_id;
  if (id && !shouldFire("Purchase", id)) return;

  const event_id = id ?? newEventId();
  const custom_data = {
    content_name: params.product_name,
    value: params.total_price,
    currency: params.currency || "BDT",
    num_items: params.num_items ?? params.quantity,
    ...(params.content_ids ? { content_ids: params.content_ids, content_type: "product" } : {}),
    ...(id ? { order_id: id } : {}),
  };

  fbq("track", "Purchase", custom_data, { eventID: event_id });
  sendCapi("Purchase", event_id, custom_data, {
    em: params.email,
    ph: params.phone,
  });

  pushDataLayer({
    event: "purchase",
    product_name: params.product_name,
    quantity: params.quantity,
    total_price: params.total_price,
    currency: params.currency || "BDT",
    order_id: id,
  });
};
