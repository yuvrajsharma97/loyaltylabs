const { Resend } = require('resend');
const env = require('../../config/env');

let resend;
function getResendClient() {
  if (!resend) {
    resend = new Resend(env.resend.apiKey);
  }
  return resend;
}

const MAX_ATTEMPTS = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendDirect({ to, subject, html, text }) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const result = await getResendClient().emails.send({
        from: env.resend.emailFrom,
        to,
        subject,
        html,
        text
      });
      // The Resend SDK resolves (doesn't throw) even on failure, returning
      // { data: null, error: {...} } - without this check every send looked
      // successful to the caller regardless of what Resend actually did.
      if (result.error) {
        throw new Error(`Resend error (${result.error.name}): ${result.error.message}`);
      }
      return result;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_ATTEMPTS) {
        await sleep(2 ** attempt * 100);
      }
    }
  }
  throw lastError;
}

/**
 * Only Resend import in the codebase.
 * `text` is an optional plain-text fallback alongside `html` (better
 * deliverability/accessibility) - see auth.emailTemplates.js for content.
 * { queue: false } (default) sends directly with retry - used for critical auth emails.
 * { queue: true } is wired up in A4 once BullMQ exists.
 */
async function sendEmail({ to, subject, html, text, queue = false }) {
  if (queue) {
    throw new Error('sendEmail({ queue: true }) is not available until BullMQ is added in A4');
  }
  return sendDirect({ to, subject, html, text });
}

module.exports = sendEmail;
