// Email content for till notices sent to customers. Same shape as
// auth.emailTemplates.js: plain functions returning { subject, html, text },
// no network access.
const { renderShell } = require('../auth/auth.emailTemplates');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pointsLabel(count) {
  return `${count.toLocaleString('en-GB')} ${count === 1 ? 'point' : 'points'}`;
}

/**
 * Sent to the customer every time a till scan credits points to their
 * FuseCard (unless they've turned these emails off).
 */
function pointsEarnedEmail({ customerName, storeName, pointsAwarded, newBalance, walletUrl, settingsUrl }) {
  const earned = pointsLabel(pointsAwarded);
  const balance = pointsLabel(newBalance);
  const subject = `You earned ${earned} at ${storeName}`;
  const optOut = "Don't want these emails? Turn off \"Points earned emails\" in your account settings";

  const html = renderShell({
    preheader: `Your balance at ${escapeHtml(storeName)} is now ${balance}.`,
    heading: `+${earned}`,
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi ${escapeHtml(customerName)},</p>
      <p style="margin:0 0 12px;">You just earned <strong>${earned}</strong> at <strong>${escapeHtml(storeName)}</strong>
      with your FuseCard.</p>
      <p style="margin:0;">Your balance there is now <strong>${balance}</strong>.</p>`,
    ctaText: 'View your rewards',
    ctaUrl: walletUrl,
    footerNote: `Didn't make this purchase? Reply to this email or contact the shop.<br />
      ${optOut}: <a href="${settingsUrl}">${settingsUrl}</a>`
  });

  const text = [
    `Hi ${customerName},`,
    '',
    `You just earned ${earned} at ${storeName} with your FuseCard.`,
    `Your balance there is now ${balance}.`,
    '',
    `View your rewards: ${walletUrl}`,
    '',
    "Didn't make this purchase? Reply to this email or contact the shop.",
    `${optOut}: ${settingsUrl}`
  ].join('\n');

  return { subject, html, text };
}

module.exports = { pointsEarnedEmail };
