import nodemailer from "nodemailer";

// ──────────────────────────────────────────────────────────────────────────
// Mailer (Gmail SMTP)
// ──────────────────────────────────────────────────────────────────────────
// Free option that works on Render's free tier over STARTTLS (port 587).
// Required environment variables:
//   SMTP_USER       -> your full Gmail address (e.g. you@gmail.com)
//   SMTP_PASS       -> a Gmail "App Password" (needs 2-Step Verification on)
// Optional:
//   SMTP_HOST       -> defaults to smtp.gmail.com
//   SMTP_PORT       -> defaults to 587
//   MAIL_FROM       -> the "from" address (defaults to SMTP_USER)
//   MAIL_FROM_NAME  -> the sender display name (defaults to "Khedmati")

let cachedTransporter = null;

export const isMailConfigured = () =>
    Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
    if (cachedTransporter) return cachedTransporter;
    if (!isMailConfigured()) return null;

    cachedTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false, // use STARTTLS on port 587
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
    return cachedTransporter;
};

// Sends the password-reset link to the given address. Throws if the mail
// service is not configured or the send fails, so the caller can decide how
// to react (e.g. fall back to returning the link in development).
export const sendPasswordResetEmail = async ({ to, resetUrl }) => {
    const transporter = getTransporter();
    if (!transporter) {
        throw new Error(
            "Mail service is not configured (missing SMTP_USER / SMTP_PASS)"
        );
    }

    const fromName = process.env.MAIL_FROM_NAME || "Khedmati";
    const fromAddress = process.env.MAIL_FROM || process.env.SMTP_USER;

    const subject = "إعادة تعيين كلمة المرور - خدمتي";

    const text =
        "لقد طلبت إعادة تعيين كلمة المرور الخاصة بحسابك في منصة خدمتي.\n\n" +
        "افتح الرابط التالي لتعيين كلمة مرور جديدة (صالح لمدة ساعة واحدة):\n" +
        resetUrl +
        "\n\nإذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة بأمان.";

    const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; background:#f4f6fb; padding:24px; color:#0f172a;">
      <div style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e2e8f0;">
        <div style="background:#1d4ed8; padding:20px 24px;">
          <h1 style="margin:0; color:#ffffff; font-size:20px;">خدمتي</h1>
        </div>
        <div style="padding:24px;">
          <h2 style="margin:0 0 12px; font-size:18px;">إعادة تعيين كلمة المرور</h2>
          <p style="margin:0 0 16px; line-height:1.7; color:#475569;">
            لقد طلبت إعادة تعيين كلمة المرور الخاصة بحسابك. اضغط على الزر التالي لتعيين كلمة مرور جديدة. هذا الرابط صالح لمدة ساعة واحدة فقط.
          </p>
          <div style="text-align:center; margin:24px 0;">
            <a href="${resetUrl}" style="display:inline-block; background:#1d4ed8; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:10px; font-weight:bold;">
              إعادة تعيين كلمة المرور
            </a>
          </div>
          <p style="margin:0 0 8px; line-height:1.7; color:#475569; font-size:13px;">
            أو انسخ الرابط التالي والصقه في المتصفح:
          </p>
          <p style="margin:0; word-break:break-all; font-size:13px;">
            <a href="${resetUrl}" style="color:#1d4ed8;">${resetUrl}</a>
          </p>
          <hr style="border:none; border-top:1px solid #e2e8f0; margin:24px 0;" />
          <p style="margin:0; color:#94a3b8; font-size:12px; line-height:1.7;">
            إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان ولن يتغيّر شيء في حسابك.
          </p>
        </div>
      </div>
    </div>`;

    await transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to,
        subject,
        text,
        html,
    });
};
