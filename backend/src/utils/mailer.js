import nodemailer from "nodemailer";
import { Setting } from "../modules/Setting/Setting.model.js";

/**
 * Get a dynamic nodemailer transporter from DB smtp settings.
 * Falls back to env vars if DB settings are not configured.
 */
async function getTransporter() {
  let smtpConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  };

  try {
    const settings = await Setting.findOne().lean();
    if (settings?.smtp?.user && settings?.smtp?.pass) {
      smtpConfig = {
        host: settings.smtp.host || "smtp.gmail.com",
        port: settings.smtp.port || 587,
        secure: settings.smtp.secure || false,
        auth: {
          user: settings.smtp.user,
          pass: settings.smtp.pass,
        },
      };
    }
  } catch (e) {
    // fall back to env
  }

  return nodemailer.createTransport(smtpConfig);
}

/**
 * Get the "from" display name from DB settings.
 */
async function getFromAddress() {
  try {
    const settings = await Setting.findOne().lean();
    const name = settings?.smtp?.fromName || settings?.storeName || "NovaStore";
    const email = settings?.smtp?.fromEmail || settings?.smtp?.user || process.env.SMTP_USER || "noreply@novastore.com";
    return `"${name}" <${email}>`;
  } catch {
    return `"NovaStore" <${process.env.SMTP_USER || "noreply@novastore.com"}>`;
  }
}

/**
 * Send OTP email for forgot-password flow.
 * @param {string} to - Recipient email
 * @param {string} otp - 6-digit OTP
 * @param {string} name - Recipient name (optional)
 * @param {string} type - 'customer' | 'admin'
 */
export async function sendOtpEmail(to, otp, name = "User", type = "customer") {
  const transporter = await getTransporter();
  const from = await getFromAddress();
  const storeName = from.match(/"([^"]+)"/)?.[1] || "NovaStore";

  const subject = `${storeName} � Password Reset OTP`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#4f46e5;padding:32px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px;">${storeName}</h1>
            <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;">Password Reset Request</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="color:#1e293b;font-size:15px;margin:0 0 8px;">Hello, <strong>${name}</strong> ??</p>
            <p style="color:#64748b;font-size:13px;margin:0 0 28px;line-height:1.6;">
              We received a request to reset your ${type === "admin" ? "admin" : "account"} password. 
              Use the OTP below � it is valid for <strong>10 minutes</strong>.
            </p>
            <!-- OTP Box -->
            <div style="background:#f8fafc;border:2px dashed #c7d2fe;border-radius:16px;padding:28px;text-align:center;margin:0 0 28px;">
              <p style="color:#6366f1;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Your OTP Code</p>
              <span style="font-size:42px;font-weight:900;letter-spacing:10px;color:#1e293b;font-family:monospace;">${otp}</span>
              <p style="color:#94a3b8;font-size:11px;margin:12px 0 0;">Expires in 10 minutes</p>
            </div>
            <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0;">
              If you did not request a password reset, please ignore this email. Your account is safe.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:11px;margin:0;">&copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({ from, to, subject, html });
}

/**
 * Send a test email to verify SMTP config is working.
 */
export async function sendTestEmail(to) {
  const transporter = await getTransporter();
  const from = await getFromAddress();
  const storeName = from.match(/"([^"]+)"/)?.[1] || "NovaStore";

  await transporter.sendMail({
    from,
    to,
    subject: `${storeName} • SMTP Test Successful ✅`,
    html: `<p>Your SMTP configuration for <strong>${storeName}</strong> is working correctly! 🎉</p>`,
  });
}

/**
 * Send VIP Welcome Email to a new newsletter subscriber.
 * @param {string} to - Subscriber email address
 * @param {string} couponCode - Welcome discount code (e.g. "WELCOME15")
 * @param {number} discountPercent - Discount percent (e.g. 15)
 */
export async function sendSubscriberWelcomeEmail(to, couponCode = "WELCOME15", discountPercent = 15) {
  const transporter = await getTransporter();
  const from = await getFromAddress();
  const storeName = from.match(/"([^"]+)"/)?.[1] || "NovaStore";

  const subject = `🎉 Welcome to VIP Club! Here is your ${discountPercent}% OFF coupon code`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#090d16;font-family:'Segoe UI',Roboto,-apple-system,BlinkMacSystemFont,sans-serif;color:#f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#090d16;padding:40px 12px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.5);border:1px solid #1e293b;">
        <!-- Header Banner -->
        <tr>
          <td style="background:linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);padding:36px 40px;text-align:center;">
            <div style="display:inline-block;padding:6px 14px;background:rgba(255,255,255,0.2);border-radius:30px;font-size:11px;font-weight:800;color:#ffffff;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">
              VIP MEMBER INVITATION
            </div>
            <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:900;letter-spacing:-0.5px;">${storeName}</h1>
            <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;font-weight:500;">Welcome to our Exclusive Shopping Club! ✨</p>
          </td>
        </tr>

        <!-- Main Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="color:#ffffff;font-size:16px;margin:0 0 10px;font-weight:700;">Hello Shopper! 👋</p>
            <p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 28px;">
              Thank you for subscribing to the <strong>${storeName}</strong> VIP Insider Newsletter. As promised, here is your exclusive welcome coupon for <strong>flat ${discountPercent}% OFF</strong> on your first order!
            </p>

            <!-- Coupon Box -->
            <div style="background:linear-gradient(135deg, #1e1b4b 0%, #1e293b 100%);border:2px dashed #6366f1;border-radius:20px;padding:26px;text-align:center;margin:0 0 28px;">
              <span style="display:inline-block;color:#a5b4fc;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">
                YOUR PERSONAL COUPON CODE
              </span>
              <div style="font-size:36px;font-weight:900;letter-spacing:6px;color:#fbbf24;font-family:monospace;margin:4px 0 8px;">
                ${couponCode}
              </div>
              <p style="color:#cbd5e1;font-size:12px;margin:0;font-weight:600;">
                🎁 Get Flat ${discountPercent}% Discount at Checkout • No Minimum Spend Required
              </p>
            </div>

            <!-- Perks Summary -->
            <div style="background:#1e293b;border-radius:16px;padding:20px;margin:0 0 30px;">
              <p style="color:#ffffff;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin:0 0 14px;">
                Your VIP Benefits:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;font-size:12px;color:#cbd5e1;">⚡ <strong>Flash Sale Early Access:</strong> Secret drop alerts 1 hour before public</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:12px;color:#cbd5e1;">🚚 <strong>Free Fast Shipping:</strong> Delivered safely with express couriers</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:12px;color:#cbd5e1;">🛡️ <strong>100% Authentic Quality:</strong> Genuine manufacturer warranty</td>
                </tr>
              </table>
            </div>

            <!-- CTA Button -->
            <div style="text-align:center;margin:0 0 20px;">
              <a href="http://localhost:5173/shop" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;padding:14px 36px;border-radius:14px;box-shadow:0 8px 20px rgba(79,70,229,0.4);">
                Start Shopping Now &rarr;
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0b0f19;padding:22px 40px;text-align:center;border-top:1px solid #1e293b;">
            <p style="color:#64748b;font-size:11px;margin:0 0 4px;">
              You received this email because you subscribed to VIP updates on ${storeName}.
            </p>
            <p style="color:#475569;font-size:10px;margin:0;">
              &copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({ from, to, subject, html });
}

/**
 * Notify the store admin when a new user subscribes to the newsletter.
 */
export async function sendAdminNewSubscriberNotification(subscriberEmail, totalCount = 1) {
  try {
    const transporter = await getTransporter();
    const from = await getFromAddress();
    const storeName = from.match(/"([^"]+)"/)?.[1] || "NovaStore";
    const settings = await Setting.findOne().lean();

    const adminEmail = settings?.contact?.email || settings?.smtp?.user || process.env.SMTP_USER;
    if (!adminEmail) return;

    const subject = `🚀 New Newsletter Subscriber: ${subscriberEmail} | ${storeName}`;
    const html = `
      <div style="font-family:'Segoe UI',sans-serif;background:#0f172a;color:#ffffff;padding:24px;border-radius:16px;max-width:480px;">
        <h2 style="margin:0 0 12px;color:#a5b4fc;font-size:18px;">New Subscriber Alert! 📬</h2>
        <p style="color:#cbd5e1;font-size:13px;line-height:1.6;margin:0 0 16px;">
          A new customer just joined your <strong>${storeName}</strong> VIP mailing list:
        </p>
        <div style="background:#1e293b;padding:14px;border-radius:10px;border-left:4px solid #6366f1;margin-bottom:16px;">
          <p style="margin:0;font-size:14px;font-weight:700;color:#ffffff;">${subscriberEmail}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">Coupon Sent: WELCOME15 (15% OFF)</p>
          <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">Date: ${new Date().toLocaleString("en-IN")}</p>
        </div>
        <p style="color:#64748b;font-size:11px;margin:0;">
          Total Subscribers: <strong>${totalCount}</strong> • View full list in your Admin Panel at <code>/subscribers</code>.
        </p>
      </div>
    `;

    await transporter.sendMail({ from, to: adminEmail, subject, html });
  } catch (err) {
    console.warn("Admin notification email skipped or failed:", err.message);
  }
}

/**
 * Send email when order is shipped with Courier Partner and AWB tracking link.
 */
export async function sendOrderShippedEmail(order) {
  try {
    const transporter = await getTransporter();
    const from = await getFromAddress();
    const storeName = from.match(/"([^"]+)"/)?.[1] || "NovaStore";
    const to = order.customerInfo?.email;
    if (!to) return;

    const carrier = order.tracking?.carrier || "Express Courier";
    const trackingNumber = order.tracking?.trackingNumber || "Assigned";
    const trackingUrl = order.tracking?.trackingUrl || `http://localhost:5173/orders/${order._id}`;

    const subject = `🚚 Your Order #${order.orderNumber} Has Been Shipped! | ${storeName}`;
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#0b0f19;font-family:'Segoe UI',sans-serif;color:#f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f19;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:20px;overflow:hidden;border:1px solid #1f2937;">
        <tr>
          <td style="background:linear-gradient(135deg,#3b82f6,#4f46e5);padding:32px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:800;">${storeName}</h1>
            <p style="color:#e0e7ff;margin:8px 0 0;font-size:14px;font-weight:600;">Package on the Way! 📦</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="font-size:15px;color:#f3f4f6;margin:0 0 12px;">Hi <strong>${order.customerInfo?.name || "Customer"}</strong>,</p>
            <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0 0 24px;">
              Great news! Your order <strong>#${order.orderNumber}</strong> has been handed over to our courier partner and is en route to your doorstep.
            </p>
            <!-- Tracking Card -->
            <div style="background:#1e293b;border-radius:16px;padding:20px;border:1px solid #374151;margin-bottom:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px;color:#94a3b8;padding-bottom:6px;">Courier Partner:</td>
                  <td style="font-size:13px;color:#ffffff;font-weight:700;text-align:right;padding-bottom:6px;">${carrier}</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#94a3b8;padding-bottom:6px;">AWB / Tracking No:</td>
                  <td style="font-size:13px;color:#38bdf8;font-weight:700;font-family:monospace;text-align:right;padding-bottom:6px;">${trackingNumber}</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#94a3b8;">Destination:</td>
                  <td style="font-size:12px;color:#e2e8f0;text-align:right;">${order.shippingAddress?.city}, ${order.shippingAddress?.pincode}</td>
                </tr>
              </table>
            </div>
            <!-- Action Button -->
            <div style="text-align:center;margin:0 0 24px;">
              <a href="${trackingUrl}" target="_blank" style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:12px 30px;border-radius:12px;">
                Track Live Shipment &rarr;
              </a>
            </div>
            <p style="font-size:11px;color:#6b7280;text-align:center;margin:0;">
              Or view your invoice anytime at: <a href="http://localhost:5173/orders/${order._id}" style="color:#60a5fa;">Order Details Page</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await transporter.sendMail({ from, to, subject, html });
  } catch (err) {
    console.warn("sendOrderShippedEmail failed:", err.message);
  }
}

/**
 * Send email when order is delivered with review request.
 */
export async function sendOrderDeliveredEmail(order) {
  try {
    const transporter = await getTransporter();
    const from = await getFromAddress();
    const storeName = from.match(/"([^"]+)"/)?.[1] || "NovaStore";
    const to = order.customerInfo?.email;
    if (!to) return;

    const firstProduct = order.items?.[0];
    const reviewUrl = firstProduct ? `http://localhost:5173/product/${firstProduct.product}` : `http://localhost:5173/orders/${order._id}`;

    const subject = `🎉 Order Delivered Successfully! | ${storeName}`;
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#0b0f19;font-family:'Segoe UI',sans-serif;color:#f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f19;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:20px;overflow:hidden;border:1px solid #1f2937;">
        <tr>
          <td style="background:linear-gradient(135deg,#059669,#10b981);padding:32px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:800;">${storeName}</h1>
            <p style="color:#d1fae5;margin:8px 0 0;font-size:14px;font-weight:600;">Package Delivered! 🎁</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="font-size:15px;color:#f3f4f6;margin:0 0 12px;">Hi <strong>${order.customerInfo?.name || "Customer"}</strong>,</p>
            <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0 0 24px;">
              Your order <strong>#${order.orderNumber}</strong> has been safely delivered to your address. We hope you love your purchase!
            </p>
            <div style="background:#1e293b;border-radius:16px;padding:20px;border:1px solid #374151;margin-bottom:24px;text-align:center;">
              <p style="font-size:13px;color:#e2e8f0;font-weight:700;margin:0 0 8px;">How was your experience?</p>
              <p style="font-size:12px;color:#94a3b8;margin:0 0 16px;">Take 30 seconds to rate and review the product to help fellow shoppers.</p>
              <a href="${reviewUrl}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:12px 28px;border-radius:12px;">
                ⭐ Rate & Review Products
              </a>
            </div>
            <p style="font-size:11px;color:#6b7280;text-align:center;margin:0;">
              Need a return or exchange? You have 7 days of doorstep return protection from your <a href="http://localhost:5173/orders/${order._id}" style="color:#34d399;">Order Details Page</a>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await transporter.sendMail({ from, to, subject, html });
  } catch (err) {
    console.warn("sendOrderDeliveredEmail failed:", err.message);
  }
}

/**
 * Send email when back-in-stock alert fires.
 */
export async function sendBackInStockEmail(productName, productSlug, toEmail) {
  try {
    const transporter = await getTransporter();
    const from = await getFromAddress();
    const storeName = from.match(/"([^"]+)"/)?.[1] || "NovaStore";

    const productUrl = `http://localhost:5173/product/${productSlug}`;
    const subject = `🔥 Good News! "${productName}" is Back in Stock! | ${storeName}`;
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#0b0f19;font-family:'Segoe UI',sans-serif;color:#f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f19;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:20px;overflow:hidden;border:1px solid #1f2937;">
        <tr>
          <td style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:800;">${storeName}</h1>
            <p style="color:#fef3c7;margin:8px 0 0;font-size:14px;font-weight:700;">Restock Alert! 🔔</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="font-size:14px;color:#f3f4f6;margin:0 0 12px;">Hello Shopper,</p>
            <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0 0 24px;">
              You requested an alert when <strong>${productName}</strong> became available. Fresh inventory has just arrived at our warehouse!
            </p>
            <div style="text-align:center;margin:0 0 24px;">
              <a href="${productUrl}" style="display:inline-block;background:#f59e0b;color:#111827;text-decoration:none;font-size:14px;font-weight:800;padding:14px 32px;border-radius:12px;">
                Grab Yours Before It Sells Out &rarr;
              </a>
            </div>
            <p style="font-size:11px;color:#6b7280;text-align:center;margin:0;">
              High-demand item. Availability subject to first-come, first-served inventory.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await transporter.sendMail({ from, to: toEmail, subject, html });
  } catch (err) {
    console.warn("sendBackInStockEmail failed:", err.message);
  }
}
