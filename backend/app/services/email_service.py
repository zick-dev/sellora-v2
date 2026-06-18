"""
app/services/email_service.py
──────────────────────────────
Email sending service using Resend API.

Currently handles:
- Password reset emails with branded HTML template

Why Resend?
- Simple API, excellent deliverability
- Free tier: 3,000 emails/month
- Better than raw SMTP (no Gmail limits, better spam scores)

To add new email types:
1. Create a new async function following the same pattern
2. Design the HTML template
3. Call resend.Emails.send() with the new template
"""

import resend
from app.core.config import settings

# Initialize Resend with our API key
# This must be set before any email sending calls
resend.api_key = settings.RESEND_API_KEY


async def send_password_reset_email(email: str, reset_token: str) -> bool:
    """
    Send a branded password reset email to the user.

    Args:
        email: The recipient's email address
        reset_token: The JWT reset token (embedded in the reset URL)

    Returns:
        True if email was sent successfully
        False if sending failed (logged to console, not raised)

    The reset URL points to the frontend reset password page.
    The frontend extracts the token from the URL and sends it
    to POST /api/auth/reset-password with the new password.
    """

    # Build the full reset URL that will be in the email button
    # In production, replace localhost:3000 with the real domain
    reset_url = f"http://localhost:3000/reset-password?token={reset_token}"

    try:
        resend.Emails.send({
            "from": settings.FROM_EMAIL,
            "to": email,
            "subject": "Reset your Sellora password",
            "html": f"""
<!DOCTYPE html>
<html>
<head></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 0;">
        <!-- Email container with dark Sellora branding -->
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#0a0a0f;border-radius:16px;overflow:hidden;">

          <!-- Header with Sellora logo -->
          <tr>
            <td style="background:#0a0a0f;padding:32px;text-align:center;
                       border-bottom:1px solid rgba(255,255,255,0.1);">
              <span style="color:#7c3aed;font-size:28px;font-weight:900;">
                ⚡ Sellora
              </span>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding:40px 32px;text-align:center;">
              <h1 style="color:#ffffff;font-size:24px;
                         font-weight:700;margin:0 0 12px;">
                Password Reset Request
              </h1>
              <p style="color:#9ca3af;font-size:15px;
                        line-height:1.6;margin:0 0 32px;">
                We received a request to reset the password for your
                Sellora account. If you didn't make this request,
                you can safely ignore this email.
              </p>

              <!-- Reset button — links to frontend reset page with token -->
              <a href="{reset_url}"
                 style="display:inline-block;background:#7c3aed;
                        color:#ffffff;text-decoration:none;
                        padding:14px 32px;border-radius:12px;
                        font-weight:700;font-size:15px;">
                Reset Password
              </a>

              <!-- Security notice -->
              <div style="margin:32px 0;padding:20px;
                          background:rgba(124,58,237,0.1);
                          border-radius:12px;
                          border:1px solid rgba(124,58,237,0.2);">
                <p style="color:#7c3aed;font-size:12px;font-weight:600;
                          margin:0 0 4px;text-transform:uppercase;
                          letter-spacing:1px;">
                  SECURE LINK
                </p>
                <p style="color:#9ca3af;font-size:13px;margin:0;">
                  This link will expire in 60 minutes and
                  can only be used once.
                </p>
              </div>

              <p style="color:#6b7280;font-size:13px;margin:0;">
                Best regards,<br>
                <strong style="color:#9ca3af;">The Sellora Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;
                       border-top:1px solid rgba(255,255,255,0.06);
                       text-align:center;">
              <p style="color:#4b5563;font-size:12px;margin:0;">
                © 2024 Sellora Inc. Lagos, Nigeria.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
            """,
        })
        return True  # Email sent successfully

    except Exception as e:
        # Log the error but don't crash the app
        # The forgot-password endpoint handles this gracefully
        print(f"❌ Email sending failed: {e}")
        return False

async def send_order_status_reminder(
    merchant_email: str,
    merchant_name: str,
    pending_orders: list,
    store_name: str,
) -> bool:
    """
    Send a reminder to merchant to update pending order statuses.
    Triggered 24hrs after orders are placed and still pending.

    Args:
        merchant_email: Merchant email address
        merchant_name: Merchant name for personalization
        pending_orders: List of dicts with order info
        store_name: The merchant store name
    """

    order_rows = ""
    for order in pending_orders:
        order_rows += f"""
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);color:#9ca3af;font-size:13px;">
            #{order.get('order_number') or order.get('id','')[:8].upper()}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);color:#ffffff;font-size:13px;">
            {order.get('customer_name','')}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);color:#7c3aed;font-size:13px;font-weight:700;">
            N{float(order.get('total_price',0)):,.0f}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <span style="background:rgba(245,158,11,0.15);color:#f59e0b;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;">
              {order.get('status','pending').upper()}
            </span>
          </td>
        </tr>"""

    count = len(pending_orders)
    dashboard_url = "https://sellora-v2-blue.vercel.app/orders"

    try:
        resend.Emails.send({
            "from": settings.FROM_EMAIL,
            "to": merchant_email,
            "subject": f"Action needed: {count} order{'s' if count > 1 else ''} waiting for status update",
            "html": f"""
<!DOCTYPE html>
<html>
<head></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#0a0a0f;border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#0a0a0f;padding:28px 32px;
                       border-bottom:1px solid rgba(255,255,255,0.08);">
              <span style="color:#7c3aed;font-size:24px;font-weight:900;">⚡ Sellora</span>
              <span style="color:#6b7280;font-size:13px;margin-left:10px;">Order Reminder</span>
            </td>
          </tr>

          <!-- Main -->
          <tr>
            <td style="padding:36px 32px;">
              <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 8px;">
                Hey {merchant_name}! 👋
              </h1>
              <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 24px;">
                You have <strong style="color:#f59e0b;">{count} order{'s' if count > 1 else ''}</strong> from 
                <strong style="color:#ffffff;">{store_name}</strong> that {'are' if count > 1 else 'is'} still 
                waiting for a status update. Once you deliver, mark {'them' if count > 1 else 'it'} as 
                <strong style="color:#10b981;">Delivered</strong> so your revenue gets recorded. 💰
              </p>

              <!-- Orders table -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:rgba(255,255,255,0.04);border-radius:12px;overflow:hidden;margin-bottom:28px;">
                <tr style="background:rgba(124,58,237,0.15);">
                  <th style="padding:10px 14px;text-align:left;color:#7c3aed;font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;">Order</th>
                  <th style="padding:10px 14px;text-align:left;color:#7c3aed;font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;">Customer</th>
                  <th style="padding:10px 14px;text-align:left;color:#7c3aed;font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;">Amount</th>
                  <th style="padding:10px 14px;text-align:left;color:#7c3aed;font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;">Status</th>
                </tr>
                {order_rows}
              </table>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:24px;">
                <a href="{dashboard_url}"
                   style="display:inline-block;background:#7c3aed;color:#ffffff;
                          text-decoration:none;padding:14px 36px;border-radius:12px;
                          font-weight:700;font-size:15px;">
                  Update Order Status →
                </a>
              </div>

              <!-- Tip -->
              <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);
                          border-radius:12px;padding:16px 20px;">
                <p style="color:#10b981;font-size:12px;font-weight:700;
                          text-transform:uppercase;letter-spacing:0.8px;margin:0 0 4px;">
                  💡 PRO TIP
                </p>
                <p style="color:#9ca3af;font-size:13px;line-height:1.5;margin:0;">
                  Only <strong style="color:#10b981;">Delivered</strong> orders count towards your revenue. 
                  Keeping your order statuses updated gives you an accurate picture of your earnings.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="color:#4b5563;font-size:12px;margin:0;">
                © 2025 Sellora · You're receiving this because you have a Sellora store.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
            """,
        })
        return True
    except Exception as e:
        print(f"❌ Order reminder email failed: {e}")
        return False
