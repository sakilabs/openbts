import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const MAIL_FROM = process.env.RESEND_FROM ?? "noreply@openbts.sakilabs.com";

export async function sendVerificationEmail(to: string, url: string) {
  await resend.emails.send({
    from: MAIL_FROM,
    to,
    subject: "Zweryfikuj adres e-mail",
    html: `<p>Kliknij poniższy link, aby zweryfikować swój adres e-mail:</p><p><a href="${url}">${url}</a></p><p>Link wygaśnie za 24 godziny.</p>`,
  });
}

export async function sendPasswordResetEmail(to: string, url: string) {
  await resend.emails.send({
    from: MAIL_FROM,
    to,
    subject: "Resetowanie hasła",
    html: `<p>Kliknij poniższy link, aby zresetować swoje hasło:</p><p><a href="${url}">${url}</a></p><p>Link wygaśnie za 1 godzinę. Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.</p>`,
  });
}
