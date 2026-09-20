// Order notification email dispatcher using Resend API
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || "";

export interface NotificationItem {
  productName: string;
  variant: string;
  quantity: number;
  price: number;
  selectedWatches?: string[];
}

export interface OrderNotificationPayload {
  orderNumbers: string[];
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryCharge: number;
  totalPrice: number;
  items: NotificationItem[];
}

export const sendOrderNotificationEmail = async (payload: OrderNotificationPayload): Promise<boolean> => {
  try {
    const orderIds = payload.orderNumbers.map((id) => `#${id}`).join(", ") || "New Order";
    const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

    const itemsHtml = payload.items
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
                <td style="text-align: right; font-weight: bold; color: #111; font-size: 18px;">৳${payload.totalPrice.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <h3 style="color: #111; margin: 0 0 12px; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #111; padding-bottom: 6px;">Customer Information</h3>
          <table style="width: 100%; margin-bottom: 24px; font-size: 14px; line-height: 1.6;">
            <tr>
              <td style="width: 100px; color: #666;">Name:</td>
              <td style="font-weight: bold; color: #111;">${payload.customerName}</td>
            </tr>
            <tr>
              <td style="color: #666;">Phone:</td>
              <td><a href="tel:${payload.customerPhone}" style="color: #d4af37; font-weight: bold; text-decoration: none;">${payload.customerPhone}</a></td>
            </tr>
            <tr>
              <td style="color: #666; vertical-align: top;">Address:</td>
              <td style="color: #333;">${payload.customerAddress}</td>
            </tr>
            <tr>
              <td style="color: #666;">Delivery:</td>
              <td style="color: #333;">৳${payload.deliveryCharge.toLocaleString()}</td>
            </tr>
          </table>

          <h3 style="color: #111; margin: 0 0 12px; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #111; padding-bottom: 6px;">Ordered Watches</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            ${itemsHtml}
            <tr>
              <td style="padding: 12px 0; font-size: 14px; color: #666;">Delivery Charge</td>
              <td style="padding: 12px 0; text-align: right; font-size: 14px; color: #333;">৳${payload.deliveryCharge.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-size: 16px; font-weight: bold; color: #111; border-top: 2px solid #111;">Grand Total</td>
              <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #d4af37; border-top: 2px solid #111;">৳${payload.totalPrice.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <div style="background: #f7f7f7; padding: 16px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eeeeee;">
          This automated notification was generated by Varieties Watch Shop.
        </div>
      </div>
    `;

    // Attempt sending to primary notification emails:
    // In Resend sandbox, onboarding@resend.dev can send to the account email (jawadshamsy4@gmail.com).
    if (!RESEND_API_KEY) {
      console.warn("VITE_RESEND_API_KEY not configured. Notification email skipped.");
      return false;
    }

    const recipient = "varietieswatchshop@gmail.com";
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Varieties Watch Shop <onboarding@resend.dev>",
          to: [recipient],
          subject: `New Order ${orderIds} — ${payload.customerName} (৳${payload.totalPrice.toLocaleString()})`,
          html: emailHtml,
        }),
      });

      if (res.ok) {
        const resData = await res.json();
        console.log(`Order notification sent to ${recipient} (ID: ${resData.id})`);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn(`Resend delivery to ${recipient} failed:`, errData?.message || res.statusText);
      }
    } catch (sendErr) {
      console.warn(`Failed to dispatch notification to ${recipient}:`, sendErr);
    }

    return true;
  } catch (err) {
    console.error("sendOrderNotificationEmail error:", err);
    return false;
  }
};
