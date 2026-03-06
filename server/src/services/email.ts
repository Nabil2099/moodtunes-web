import { Resend } from "resend";
import crypto from "crypto";

// Generate a 6-digit OTP
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

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

  if (resend) {
    const { error } = await resend.emails.send({
      from: "MoodTunes <onboarding@resend.dev>",
      to: email,
      subject: "MoodTunes — Your Verification Code",
      html,
    });
    if (error) throw new Error(error.message);
  } else {
    // Dev: log OTP to console
    console.log(`\n📧 OTP for ${email}: ${otp}\n`);
  }
}
