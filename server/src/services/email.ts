import nodemailer from "nodemailer";
import crypto from "crypto";

// Generate a 6-digit OTP
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Create transporter — uses SMTP env vars in production, logs to console in dev
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
    });
  }

  // Dev fallback: log to console
  return null;
}

const transporter = createTransporter();

export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0a0a14; color: #f0f0f5; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 24px; background: linear-gradient(to right, #7c6af7, #4fd6a0, #f7836a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">
          🎵 MoodTunes
        </h1>
      </div>
      <p style="font-size: 16px; color: #a0a0b5; margin-bottom: 8px;">Your verification code is:</p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #7c6af7; font-family: 'JetBrains Mono', monospace;">
          ${otp}
        </span>
      </div>
      <p style="font-size: 13px; color: #666; text-align: center;">This code expires in 10 minutes. Don't share it with anyone.</p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "MoodTunes — Your Verification Code",
      html,
    });
  } else {
    // Dev: log OTP to console
    console.log(`\n📧 OTP for ${email}: ${otp}\n`);
  }
}
