import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

if (!smtpUser || !smtpPass) {
  console.warn("SMTP_USER or SMTP_PASS is missing. Email sending will not work.");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendVerificationEmail = async (
  to: string,
  code: string
): Promise<void> => {
  await transporter.sendMail({
    from: smtpUser,
    to,
    subject: "Let's Ride Canada Email Verification Code",
    text: `Your Let's Ride Canada verification code is: ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f9fafb; padding: 40px 20px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
          
          <div style="background: #111827; padding: 20px 24px;">
            <h2 style="color: white; margin: 0; font-size: 20px; letter-spacing: 0.5px;">
              LET'S RIDE CANADA
            </h2>
          </div>

          <div style="padding: 28px 24px;">
            <h3 style="margin-top: 0; margin-bottom: 12px; color: #111827; font-size: 22px;">
              Email Verification
            </h3>

            <p style="color: #374151; font-size: 14px; margin-bottom: 16px;">
              Welcome to Let's Ride Canada. Use the verification code below to verify your email address.
            </p>

            <div style="
              margin: 24px 0;
              padding: 18px;
              background: #f3f4f6;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              text-align: center;
            ">
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">
                Verification Code
              </div>
              <div style="font-size: 32px; font-weight: 700; color: #111827; letter-spacing: 6px;">
                ${code}
              </div>
            </div>

            <p style="color: #6b7280; font-size: 13px; margin-bottom: 0;">
              This code expires in <strong>10 minutes</strong>.
            </p>
          </div>

          <div style="padding: 16px 24px; background: #f9fafb; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
              © 2026 Let’s Ride Canada. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `,
  });
};

export const sendUserDeletionEmail = async (
  to: string,
  name: string,
  reason: string
): Promise<void> => {
  await transporter.sendMail({
    from: smtpUser,
    to,
    subject: "Your Let's Ride Canada account has been removed",
    text: `Hello ${name}, your Let's Ride Canada account has been removed by an administrator. Reason: ${reason}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f9fafb; padding: 40px 20px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">

          <div style="background: #111827; padding: 20px 24px;">
            <h2 style="color: white; margin: 0; font-size: 20px; letter-spacing: 0.5px;">
              LET'S RIDE CANADA
            </h2>
          </div>

          <div style="padding: 28px 24px;">
            <h3 style="margin-top: 0; margin-bottom: 12px; color: #111827; font-size: 22px;">
              Account Removal Notice
            </h3>

            <p style="color: #374151; font-size: 14px; margin-bottom: 12px;">
              Hello <strong>${name}</strong>,
            </p>

            <p style="color: #374151; font-size: 14px; margin-bottom: 18px;">
              Your Let's Ride Canada account has been removed by an administrator.
            </p>

            <div style="
              margin: 20px 0;
              padding: 16px;
              background: #fef2f2;
              border-left: 4px solid #dc2626;
              border-radius: 10px;
              color: #111827;
              font-size: 14px;
            ">
              <div style="font-weight: 600; margin-bottom: 8px;">Reason provided:</div>
              <div>${reason}</div>
            </div>

            <p style="color: #6b7280; font-size: 13px; margin-bottom: 0;">
              If you believe this was done in error, please contact support.
            </p>
          </div>

          <div style="padding: 16px 24px; background: #f9fafb; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
              © 2026 Let’s Ride Canada. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `,
  });
};