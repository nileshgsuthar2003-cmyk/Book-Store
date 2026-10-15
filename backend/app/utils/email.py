import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_otp_email(to_email, otp_code, user_name="Book Lover", purpose="register"):
    """
    Send a 6-digit verification code to the recipient's email.
    Uses SMTP credentials from environment variables if provided.
    Always logs code to server console for testing and verification.
    """
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    sender_email = os.getenv("SMTP_FROM", smtp_user or "noreply@booknest.com")

    is_forgot = purpose == "forgot_password"
    action_title = "Password Reset Code" if is_forgot else "Email Verification Code"

    # Beautiful console logging for easy local testing
    print("\n" + "=" * 65)
    print(f"📧 [BOOKNEST {action_title.upper()} SERVICE]")
    print(f"   Purpose:    {purpose}")
    print(f"   Recipient:  {to_email}")
    print(f"   User Name:  {user_name}")
    print(f"   OTP Code:   👉  {otp_code}  👈")
    print(f"   Expires:    In 10 minutes")
    print("=" * 65 + "\n", flush=True)

    if not smtp_host or not smtp_user or not smtp_pass:
        # SMTP credentials not configured, console log serves as simulated email
        return True

    try:
        msg = MIMEMultipart("alternative")
        if is_forgot:
            msg["Subject"] = f"{otp_code} is your BookNest password reset code"
            content_title = "Reset your password"
            content_desc = "We received a request to reset your password for your <strong>BookNest</strong> account. Please use the 6-digit verification code below to set your new password:"
            security_note = "⏱️ This code is valid for <strong>10 minutes</strong>. If you did not request a password reset, you can safely ignore this email and your password will remain unchanged."
        else:
            msg["Subject"] = f"{otp_code} is your BookNest email verification code"
            content_title = "Verify your email address"
            content_desc = "Welcome to <strong>BookNest</strong>! To complete creating your account, please enter the 6-digit verification code below:"
            security_note = "⏱️ This verification code is valid for <strong>10 minutes</strong>. If you did not attempt to create an account on BookNest, please disregard this email."

        msg["From"] = f"BookNest <{sender_email}>"
        msg["To"] = to_email

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }}
            .container {{ max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
            .header {{ background: #0f172a; padding: 28px 24px; text-align: center; }}
            .brand {{ font-size: 24px; font-weight: 800; color: #ffffff; margin: 0; text-decoration: none; }}
            .brand span {{ color: #f59e0b; }}
            .content {{ padding: 32px 28px; }}
            .title {{ font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; }}
            .text {{ font-size: 14px; line-height: 1.6; color: #475569; }}
            .otp-box {{ margin: 28px 0; text-align: center; }}
            .otp-code {{ display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e3a8a; background: #f1f5f9; border: 2px dashed #cbd5e1; padding: 14px 28px; border-radius: 10px; font-family: monospace; }}
            .footer {{ padding: 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="brand">book<span>nest</span></h1>
              <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0;">FIND YOUR NEXT CHAPTER</p>
            </div>
            <div class="content">
              <h2 class="title">{content_title}</h2>
              <p class="text">Hello {user_name},</p>
              <p class="text">
                {content_desc}
              </p>
              <div class="otp-box">
                <span class="otp-code">{otp_code}</span>
              </div>
              <p class="text" style="font-size: 12px; color: #64748b;">
                {security_note}
              </p>
            </div>
            <div class="footer">
              © 2026 BookNest Inc. Crafted with care for the love of reading.
            </div>
          </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(sender_email, to_email, msg.as_string())

        print(f"✅ Real email successfully sent via SMTP to {to_email}")
        return True
    except Exception as e:
        print(f"⚠️ SMTP delivery notice: {str(e)} (Code is logged above)")
        return True
