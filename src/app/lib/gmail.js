import nodemailer from "nodemailer";

export function getGmailTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.OWNER_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}


