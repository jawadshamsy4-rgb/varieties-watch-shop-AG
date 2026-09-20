import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type OrderItem = {
  productName: string;
  variant: string;
  quantity: number;
  price: number;
  selectedWatches?: string[];
};

type OrderRequest = {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryCharge: number;
  items: OrderItem[];
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function validateBody(body: unknown): { ok: true; data: OrderRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid order request" };

  const data = body as Partial<OrderRequest>;
  const customerName = String(data.customerName ?? "").trim();
  const customerPhone = String(data.customerPhone ?? "").trim();
  const customerAddress = String(data.customerAddress ?? "").trim();
  const deliveryCharge = Number(data.deliveryCharge);

  if (!customerName || customerName.length > 120) return { ok: false, error: "Customer name is required" };
  if (!/^01\d{9}$/.test(customerPhone)) return { ok: false, error: "Valid Bangladeshi phone number is required" };
  if (!customerAddress || customerAddress.length > 1000) return { ok: false, error: "Customer address is required" };
  if (!Number.isFinite(deliveryCharge) || deliveryCharge < 0 || deliveryCharge > 10000) return { ok: false, error: "Invalid delivery charge" };
  if (!Array.isArray(data.items) || data.items.length < 1 || data.items.length > 20) return { ok: false, error: "At least one order item is required" };

  const items: OrderItem[] = [];
  for (const item of data.items) {
    const raw = item as Partial<OrderItem>;
    const productName = String(raw.productName ?? "").trim();
    const variant = String(raw.variant ?? "").trim();
    const quantity = Number(raw.quantity);
    const price = Number(raw.price);
    const selectedWatches = Array.isArray(raw.selectedWatches)
      ? raw.selectedWatches.map((watch) => String(watch).trim()).filter(Boolean).slice(0, 20)
      : undefined;

    if (!productName || productName.length > 255) return { ok: false, error: "Product name is required" };
    if (!variant || variant.length > 120) return { ok: false, error: "Product variant is required" };
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) return { ok: false, error: "Invalid quantity" };
    if (!Number.isFinite(price) || price < 0 || price > 10000000) return { ok: false, error: "Invalid item price" };

    items.push({ productName, variant, quantity, price, selectedWatches });
  }

  return { ok: true, data: { customerName, customerPhone, customerAddress, deliveryCharge, items } };
}

async function sendEmailNotification(order: OrderRequest, orderNumbers: string[], resendApiKey: string) {
  try {
    const orderIds = orderNumbers.map((id) => `#${id}`).join(", ") || "New Order";
    const totalOrderPrice = order.items.reduce((sum, it) => sum + it.price * it.quantity, 0) + order.deliveryCharge;
    const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
            <strong style="color: #111; font-size: 14px;">${item.productName}</strong><br/>
            <span style="color: #777; font-size: 12px;">Variant: ${item.variant} &times; ${item.quantity}</span>
            ${item.selectedWatches?.length ? `<br/><span style="color: #999; font-size: 11px;">Selected: ${item.selectedWatches.join(", ")}</span>` : ""}
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: bold; color: #111; font-size: 14px;">
            ৳${(item.price * item.quantity).toLocaleString()}
          </td>
        </tr>`
      )
      .join("");

    const emailHtml = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
        <div style="background: #111111; padding: 24px; text-align: center; border-bottom: 3px solid #d4af37;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase;">Varieties Watch Shop</h1>
          <p style="color: #d4af37; margin: 6px 0 0; font-size: 13px; letter-spacing: 1px;">NEW ORDER RECEIVED</p>
        </div>

        <div style="padding: 24px;">
          <div style="background: #fdfaf3; border: 1px solid #f3e8c9; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="color: #666;">Order ID:</td>
                <td style="text-align: right; font-weight: bold; color: #d4af37; font-size: 16px;">${orderIds}</td>
              </tr>
              <tr>
                <td style="color: #666;">Order Time:</td>
                <td style="text-align: right; color: #333;">${now}</td>
              </tr>
              <tr>
                <td style="color: #666;">Total Amount:</td>
                <td style="text-align: right; font-weight: bold; color: #111; font-size: 18px;">৳${totalOrderPrice.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <h3 style="color: #111; margin: 0 0 12px; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #111; padding-bottom: 6px;">Customer Information</h3>
          <table style="width: 100%; margin-bottom: 24px; font-size: 14px; line-height: 1.6;">
            <tr>
              <td style="width: 100px; color: #666;">Name:</td>
              <td style="font-weight: bold; color: #111;">${order.customerName}</td>
            </tr>
            <tr>
              <td style="color: #666;">Phone:</td>
              <td><a href="tel:${order.customerPhone}" style="color: #d4af37; font-weight: bold; text-decoration: none;">${order.customerPhone}</a></td>
            </tr>
            <tr>
              <td style="color: #666; vertical-align: top;">Address:</td>
              <td style="color: #333;">${order.customerAddress}</td>
            </tr>
            <tr>
              <td style="color: #666;">Delivery:</td>
              <td style="color: #333;">৳${order.deliveryCharge.toLocaleString()}</td>
            </tr>
          </table>

          <h3 style="color: #111; margin: 0 0 12px; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #111; padding-bottom: 6px;">Ordered Watches</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            ${itemsHtml}
            <tr>
              <td style="padding: 12px 0; font-size: 14px; color: #666;">Delivery Charge</td>
              <td style="padding: 12px 0; text-align: right; font-size: 14px; color: #333;">৳${order.deliveryCharge.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-size: 16px; font-weight: bold; color: #111; border-top: 2px solid #111;">Grand Total</td>
              <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #d4af37; border-top: 2px solid #111;">৳${totalOrderPrice.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <div style="background: #f7f7f7; padding: 16px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eeeeee;">
          This automated notification was generated by Varieties Watch Shop.
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Varieties Watch Shop <onboarding@resend.dev>",
        to: ["varietieswatchshop@gmail.com"],
        subject: `New Order ${orderIds} — ${order.customerName} (৳${totalOrderPrice.toLocaleString()})`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend API error:", res.status, errText);
    } else {
      const okData = await res.json();
      console.log("Resend notification delivered successfully! ID:", okData.id);
    }
  } catch (err) {
    console.error("Failed to send Resend email:", err);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ success: false, error: "Method not allowed" }, 405);

  let orderNumbers: string[] = [];

  try {
    const parsed = validateBody(await req.json().catch(() => null));
    if (!parsed.ok) return jsonResponse({ success: false, error: parsed.error }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Backend database is not configured");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const order = parsed.data;

    const orderRows = order.items.map((item) => ({
      name: order.customerName,
      phone: order.customerPhone,
      address: order.customerAddress,
      product: item.productName,
      variant: item.variant,
      quantity: item.quantity,
      total_price: item.price * item.quantity + order.deliveryCharge,
      delivery_charge: order.deliveryCharge,
      ...(item.selectedWatches?.length ? { selected_perfumes: item.selectedWatches } : {}),
    }));

    const { data: insertedOrders, error: insertError } = await supabase
      .from("orders")
      .insert(orderRows)
      .select("order_number");

    if (insertError) throw new Error(`Order save failed: ${insertError.message}`);
    orderNumbers = (insertedOrders ?? []).map((row) => row.order_number).filter(Boolean) as string[];

    // Send email notification via Resend (server-side, zero CORS)
    if (resendApiKey) {
      await sendEmailNotification(order, orderNumbers, resendApiKey);
    } else {
      console.warn("RESEND_API_KEY not configured on server.");
    }

    return jsonResponse({ success: true, orderNumbers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("place-order-gmail error", { message, orderNumbers });
    return jsonResponse({ success: false, error: message, orderNumbers }, orderNumbers.length ? 200 : 500);
  }
});