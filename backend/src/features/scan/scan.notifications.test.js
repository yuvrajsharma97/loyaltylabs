jest.mock('../../config/env', () => ({ appUrl: 'https://app.test' }));
jest.mock('../../shared/services/sendEmail', () => jest.fn());

const sendEmail = require('../../shared/services/sendEmail');
const { notifyPointsEarned } = require('./scan.notifications');

const customer = {
  _id: 'customer-1',
  name: 'Alex',
  email: 'alex@example.com',
  emailVerified: true,
  pointsEarnedEmails: true,
  deletedAt: null
};
const store = { _id: 'store-1', name: 'Bean & Leaf' };
const earned = { pointsAwarded: 7, newBalance: 17 };

beforeEach(() => {
  jest.resetAllMocks();
  sendEmail.mockResolvedValue({});
});

describe('notifyPointsEarned', () => {
  it('emails the customer the points earned, their new balance and how to opt out', async () => {
    await notifyPointsEarned({ customer, store, ...earned });

    expect(sendEmail).toHaveBeenCalledTimes(1);
    const email = sendEmail.mock.calls[0][0];
    expect(email.to).toBe('alex@example.com');
    expect(email.subject).toBe('You earned 7 points at Bean & Leaf');
    expect(email.text).toContain('Your balance there is now 17 points.');
    expect(email.text).toContain('https://app.test/customer/wallet');
    expect(email.text).toContain('https://app.test/customer/account');
    expect(email.html).toContain('Bean &amp; Leaf');
  });

  it('respects the opt-out', async () => {
    await notifyPointsEarned({ customer: { ...customer, pointsEarnedEmails: false }, store, ...earned });

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('does not email an unverified address', async () => {
    await notifyPointsEarned({ customer: { ...customer, emailVerified: false }, store, ...earned });

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('sends nothing to deleted accounts or when no points were awarded', async () => {
    await notifyPointsEarned({ customer: { ...customer, deletedAt: new Date() }, store, ...earned });
    await notifyPointsEarned({ customer, store, ...earned, pointsAwarded: 0 });

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('treats customers created before the preference existed as opted in', async () => {
    const { pointsEarnedEmails, ...legacyCustomer } = customer;
    await notifyPointsEarned({ customer: legacyCustomer, store, ...earned });

    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('never throws when the email fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    sendEmail.mockRejectedValue(new Error('Resend down'));

    await expect(notifyPointsEarned({ customer, store, ...earned })).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });
});
