const env = require('../../config/env');
const sendEmail = require('../../shared/services/sendEmail');
const { pointsEarnedEmail } = require('./scan.emailTemplates');

/**
 * Email the customer after a till scan credits points. Called without await
 * so the till isn't kept waiting on Resend, and never throws - a failed email
 * must not fail the scan that triggered it.
 * Skips: customers who turned these emails off, unverified addresses (we
 * don't email an address nobody has confirmed), deleted accounts (their
 * email is anonymised), and scans that awarded nothing.
 */
async function notifyPointsEarned({ customer, store, pointsAwarded, newBalance }) {
  try {
    if (!customer?.email || customer.deletedAt || !customer.emailVerified) return;
    if (customer.pointsEarnedEmails === false || !pointsAwarded) return;

    await sendEmail({
      to: customer.email,
      ...pointsEarnedEmail({
        customerName: customer.name,
        storeName: store.name,
        pointsAwarded,
        newBalance,
        walletUrl: `${env.appUrl}/customer/wallet`,
        settingsUrl: `${env.appUrl}/customer/account`
      })
    });
  } catch (err) {
    console.error('notifyPointsEarned failed:', { customerId: String(customer?._id), storeId: String(store?._id) }, err);
  }
}

module.exports = { notifyPointsEarned };
