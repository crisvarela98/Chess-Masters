import nodemailer from "nodemailer";

let transporter;
let initialized = false;

function getTransporter() {
  if (initialized) return transporter;
  initialized = true;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  return transporter;
}

export async function sendWelcomeEmail({ to, username }) {
  const emailTransporter = getTransporter();
  if (!emailTransporter || !to) return { sent: false, reason: "smtp_not_configured" };

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await emailTransporter.sendMail({
    from,
    to,
    subject: "Bienvenido a Chess Masters",
    text: `Hola ${username || "jugador"}, felicitaciones por registrarte en Chess Masters. Ya puedes comenzar tu progreso.`,
    html: `<p>Hola <strong>${username || "jugador"}</strong>,</p><p>Felicitaciones por registrarte en <strong>Chess Masters</strong>. Ya puedes comenzar tu progreso.</p>`
  });

  return { sent: true };
}
