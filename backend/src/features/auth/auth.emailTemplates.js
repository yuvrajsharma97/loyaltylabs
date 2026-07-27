// Email content for every Resend email the auth feature sends. Kept as plain
// functions returning { subject, html, text } - sendEmail.js stays the only
// Resend import in the codebase, this module never touches the network.

const BRAND = 'LoyaltyLabs';
const ACCENT = '#2563EB';
const TEXT_DARK = '#0F172A';
const TEXT_MUTED = '#64748B';
const BORDER = '#E2E8F0';

// Inline CSS only - most email clients strip <style> blocks or external CSS.
function renderShell({ preheader, heading, bodyHtml, ctaText, ctaUrl, footerNote }) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${heading}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#F8FAFC; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none; max-height:0; overflow:hidden;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF; border:1px solid ${BORDER}; border-radius:12px; overflow:hidden;">
            <tr>
              <td style="padding:24px 32px; border-bottom:1px solid ${BORDER};">
                <span style="font-size:18px; font-weight:700; color:${TEXT_DARK};">${BRAND}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px; font-size:20px; color:${TEXT_DARK};">${heading}</h1>
                <div style="font-size:15px; line-height:1.6; color:${TEXT_DARK};">${bodyHtml}</div>
                ${
                  ctaUrl
                    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                        <tr>
                          <td style="border-radius:8px; background-color:${ACCENT};">
                            <a href="${ctaUrl}" style="display:inline-block; padding:12px 24px; font-size:15px; font-weight:600; color:#FFFFFF; text-decoration:none; border-radius:8px;">${ctaText}</a>
                          </td>
                        </tr>
                      </table>
                      <p style="font-size:13px; color:${TEXT_MUTED}; word-break:break-all;">Or paste this link into your browser:<br /><a href="${ctaUrl}" style="color:${ACCENT};">${ctaUrl}</a></p>`
                    : ''
                }
                ${footerNote ? `<p style="margin-top:24px; font-size:13px; color:${TEXT_MUTED};">${footerNote}</p>` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px; background-color:#F8FAFC; border-top:1px solid ${BORDER};">
                <p style="margin:0; font-size:12px; color:${TEXT_MUTED};">${BRAND} - this is an automated message, please don't reply directly to this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

function verificationEmail({ name, url, expiresInHours = 24 }) {
  const subject = `Verify your email - ${BRAND}`;
  const html = renderShell({
    preheader: 'Confirm your email to start earning points.',
    heading: 'Verify your email address',
    bodyHtml: `
      <p>Hi ${name},</p>
      <p>Thanks for signing up for ${BRAND}. Confirm your email address to activate your account and get your loyalty QR code.</p>
    `,
    ctaText: 'Verify email',
    ctaUrl: url,
    footerNote: `This link expires in ${expiresInHours} hours. If you didn't create this account, you can safely ignore this email.`
  });
  const text = `Hi ${name},\n\nConfirm your email to activate your ${BRAND} account:\n${url}\n\nThis link expires in ${expiresInHours} hours. If you didn't create this account, ignore this email.`;
  return { subject, html, text };
}

function passwordResetEmail({ name, url, expiresInHours = 1 }) {
  const subject = `Reset your password - ${BRAND}`;
  const html = renderShell({
    preheader: 'Reset your password to get back into your account.',
    heading: 'Reset your password',
    bodyHtml: `
      <p>Hi ${name},</p>
      <p>We received a request to reset the password on your ${BRAND} account. Click below to choose a new one.</p>
    `,
    ctaText: 'Reset password',
    ctaUrl: url,
    footerNote: `This link expires in ${expiresInHours} hour${expiresInHours === 1 ? '' : 's'}. If you didn't request a password reset, you can safely ignore this email - your password will not be changed.`
  });
  const text = `Hi ${name},\n\nReset your ${BRAND} password:\n${url}\n\nThis link expires in ${expiresInHours} hour${expiresInHours === 1 ? '' : 's'}. If you didn't request this, ignore this email.`;
  return { subject, html, text };
}

function recoverAccountEmail({ name, url }) {
  const subject = `Recover your account access - ${BRAND}`;
  const html = renderShell({
    preheader: 'Get back into your account and refresh your loyalty QR code.',
    heading: 'Recover your account access',
    bodyHtml: `
      <p>Hi ${name},</p>
      <p>Click below to sign back in to ${BRAND}. Once you're in, your loyalty QR code will refresh automatically.</p>
    `,
    ctaText: 'Sign back in',
    ctaUrl: url,
    footerNote: `If you didn't request this, you can safely ignore this email. Consider updating your email address once you're back in if you think someone else has access to it.`
  });
  const text = `Hi ${name},\n\nSign back in to ${BRAND}:\n${url}\n\nIf you didn't request this, ignore this email.`;
  return { subject, html, text };
}

function loginNotificationEmail({ name, timestamp }) {
  const when = timestamp.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  const subject = `New login to your ${BRAND} account`;
  const html = renderShell({
    preheader: `New sign-in on ${when}.`,
    heading: 'New login to your account',
    bodyHtml: `
      <p>Hi ${name},</p>
      <p>Your ${BRAND} account was just signed in to on ${when}.</p>
    `,
    footerNote: `If this was you, you can ignore this email. If it wasn't, reset your password right away.`
  });
  const text = `Hi ${name},\n\nYour ${BRAND} account was just signed in to on ${when}.\n\nIf this wasn't you, reset your password right away.`;
  return { subject, html, text };
}

function welcomeEmail({ name }) {
  const subject = `Welcome to ${BRAND}!`;
  const html = renderShell({
    preheader: 'Your account is ready.',
    heading: `Welcome to ${BRAND}`,
    bodyHtml: `
      <p>Hi ${name},</p>
      <p>Your account is set up and ready to go.</p>
    `
  });
  const text = `Hi ${name},\n\nYour ${BRAND} account is set up and ready to go.`;
  return { subject, html, text };
}

module.exports = { verificationEmail, passwordResetEmail, recoverAccountEmail, loginNotificationEmail, welcomeEmail };
