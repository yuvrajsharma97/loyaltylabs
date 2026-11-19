// Email content for billing notices. Same shape as auth.emailTemplates.js:
// plain functions returning { subject, html, text }, no network access.
const { renderShell } = require('../auth/auth.emailTemplates');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Sent the moment a store reaches its plan's active-customer limit, then at
 * 9:30 and 21:30 (UK time) for as long as it stays there.
 */
function planLimitReachedEmail({ ownerName, storeName, planName, customerLimit, activeCustomerCount, upgradeUrl }) {
  const subject = `${storeName} has reached its ${customerLimit} customer limit`;
  const heading = 'New customers are being turned away';
  const html = renderShell({
    preheader: `${activeCustomerCount} of ${customerLimit} active customers. Upgrade to keep adding new ones.`,
    heading,
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi ${escapeHtml(ownerName)},</p>
      <p style="margin:0 0 12px;"><strong>${escapeHtml(storeName)}</strong> has ${activeCustomerCount} active customers,
      the limit on your ${escapeHtml(planName)} plan.</p>
      <p style="margin:0;">Customers who already collect with you can keep earning. Anyone new, or anyone who hasn't
      visited in the last 90 days, will be refused at the till until you upgrade.</p>`,
    ctaText: 'Upgrade plan',
    ctaUrl: upgradeUrl,
    footerNote: "We'll remind you at 9:30am and 9:30pm each day until you upgrade."
  });
  const text = [
    `Hi ${ownerName},`,
    '',
    `${storeName} has ${activeCustomerCount} active customers, the limit on your ${planName} plan.`,
    "Customers who already collect with you can keep earning. Anyone new, or anyone who hasn't visited in the last 90 days, will be refused at the till until you upgrade.",
    '',
    `Upgrade your plan: ${upgradeUrl}`,
    '',
    "We'll remind you at 9:30am and 9:30pm each day until you upgrade."
  ].join('\n');

  return { subject, html, text };
}

module.exports = { planLimitReachedEmail };
