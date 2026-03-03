import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getGmailTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.OWNER_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export async function sendBookingEmail(htmlContent, toEmail) {
  const transporter = getGmailTransporter();

  await transporter.sendMail({
    from: `"Landscape Craftsmen" <${process.env.OWNER_EMAIL}>`,
    to: toEmail,
    subject: "Appointment Confirmation",
    html: htmlContent,

    attachments: [
      {
        filename: "logo.jpg",
        path: path.join(process.cwd(), "public/icons/Landscapecraftsmen_logo.jpg"),
        cid: "companylogo",
      },
    ],
  });
}