const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PIXEL_ID = Deno.env.get("META_PIXEL_ID") ?? "";
const ACCESS_TOKEN = Deno.env.get("META_CAPI_ACCESS_TOKEN") ?? "";
const GRAPH_VERSION = "v21.0";

const sha256 = async (value: string): Promise<string> => {
  const data = new TextEncoder().encode(value.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

interface CapiPayload {
  event_name: string;
  event_id?: string;
  event_source_url?: string;
  action_source?: string;
  user_data?: {
    em?: string;
    ph?: string;
    fbp?: string;
    fbc?: string;
  };
  custom_data?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!PIXEL_ID || !ACCESS_TOKEN) {
      return new Response(
        JSON.stringify({ success: false, error: "Meta CAPI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as CapiPayload;
    if (!body?.event_name) {
      return new Response(
        JSON.stringify({ success: false, error: "event_name required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    console.log(`[meta-capi] received ${body.event_name} id=${body.event_id ?? "-"}`);

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const user_data: Record<string, unknown> = {};
    if (body.user_data?.em) user_data.em = [await sha256(body.user_data.em)];
    if (body.user_data?.ph) {
      const digits = body.user_data.ph.replace(/\D/g, "");
      user_data.ph = [await sha256(digits)];
    }
    if (body.user_data?.fbp) user_data.fbp = body.user_data.fbp;
    if (body.user_data?.fbc) user_data.fbc = body.user_data.fbc;
    if (ip) user_data.client_ip_address = ip;
    if (userAgent) user_data.client_user_agent = userAgent;

    const event = {
      event_name: body.event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: body.event_id,
      event_source_url: body.event_source_url,
      action_source: body.action_source ?? "website",
      user_data,
      custom_data: body.custom_data ?? {},
    };

    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [event] }),
    });

    const result = await res.json();
    if (!res.ok) {
      console.error("Meta CAPI error", result);
      return new Response(
        JSON.stringify({ success: false, error: result }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    console.log(
      `[meta-capi] sent ${body.event_name} received=${result?.events_received ?? "?"} fbtrace=${result?.fbtrace_id ?? "-"}`,
    );

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("meta-capi crash", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});