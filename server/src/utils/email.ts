import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

if (!smtpUser || !smtpPass) {
  console.warn(
    "SMTP_USER or SMTP_PASS is missing. Email sending will not work.",
  );
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
  code: string,
): Promise<void> => {
  await transporter.sendMail({
    from: smtpUser,
    to,
    subject: "PowerBidz Email Verification Code",
    text: `Your PowerBidz verification code is: ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>PowerBidz Email Verification</h2>
        <p>Your verification code is:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${code}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  });
};
