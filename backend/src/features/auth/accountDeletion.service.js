const crypto = require('crypto');
const mongoose = require('mongoose');

const Customer = require('../customers/customer.model');
const User = require('./auth.model');
const RefreshToken = require('./refreshToken.model');
const DeletedAccount = require('./deletedAccount.model');
const Store = require('../stores/store.model');
const Membership = require('../memberships/membership.model');
const { StoreBilling } = require('../billing/billing.model');
const { cancelPendingRedemptions } = require('../redemptions/redemption.service');

const { RETENTION_DAYS } = DeletedAccount;
const DAY_MS = 24 * 60 * 60 * 1000;

// Unique, never-deliverable placeholders. Several fields carry non-sparse
// unique indexes, so they can't simply be unset on more than one account.
const placeholder = (id) => `deleted-${id}`;
const placeholderEmail = (id) => `deleted-${id}@deleted.invalid`;
const randomToken = () => crypto.randomBytes(32).toString('hex');

function retentionRecord({ accountType, account, role, storeIds = [], now }) {
  return {
    accountType,
    accountId: account._id,
    role,
    personalDetails: {
      name: account.name,
      email: account.email,
      phone: account.phone,
      googleId: account.googleId,
      avatarUrl: account.avatarUrl,
      username: account.username,
      slug: account.slug
    },
    storeIds,
    deletedAt: now,
    purgeAt: new Date(now.getTime() + RETENTION_DAYS * DAY_MS)
  };
}

/**
 * Customer deletes their account. Personal details are moved to a
 * DeletedAccount record (wiped after six months) and the live record is
 * anonymised. Their points history stays, now pointing at "Deleted customer",
 * so every shop's totals still add up. Pending reward codes are cancelled and
 * they stop counting towards any shop's active-customer limit.
 */
async function deleteCustomerAccount(customer, now = new Date()) {
  const id = customer._id;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await DeletedAccount.create([retentionRecord({ accountType: 'customer', account: customer, role: 'customer', now })], {
        session
      });

      await Customer.updateOne(
        { _id: id },
        {
          $set: {
            name: 'Deleted customer',
            email: placeholderEmail(id),
            username: placeholder(id),
            slug: placeholder(id),
            qrCodeToken: randomToken(),
            qrSalt: randomToken(),
            authProvider: 'local',
            emailVerified: false,
            interests: [],
            deletedAt: now
          },
          $unset: {
            phone: '',
            passwordHash: '',
            googleId: '',
            avatarUrl: '',
            emailVerificationToken: '',
            emailVerificationExpiresAt: '',
            passwordResetToken: '',
            passwordResetExpiresAt: ''
          }
        },
        { session }
      );

      // No refund: the points belong to an account that no longer exists.
      await cancelPendingRedemptions({ customerId: id }, { session, refund: false });

      // Balances stay (the ledger still has to reconcile), but the customer is
      // no longer active anywhere, which frees their slot on the shop's plan.
      await Membership.updateMany({ customerId: id }, { $set: { lastActivityAt: null } }, { session });

      await RefreshToken.updateMany({ userId: id, userType: 'customer' }, { $set: { revoked: true } }, { session });
    });
  } finally {
    session.endSession();
  }
}

/**
 * Store owner deletes their account. Their shop closes for good: it leaves
 * the directory, the till stops working, billing is cancelled, and customers'
 * pending reward codes are cancelled with the points given back. The owner's
 * personal details are held for six months, then wiped.
 */
async function deleteStoreOwnerAccount(user, now = new Date()) {
  const id = user._id;
  const stores = await Store.find({ ownerUserId: id }).select('_id');
  const storeIds = stores.map((store) => store._id);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await DeletedAccount.create(
        [retentionRecord({ accountType: 'user', account: user, role: 'store_owner', storeIds, now })],
        { session }
      );

      await User.updateOne(
        { _id: id },
        {
          $set: {
            name: 'Deleted shop owner',
            email: placeholderEmail(id),
            // Required by the schema; not a bcrypt hash, so nothing can ever match it.
            passwordHash: 'account-deleted',
            emailVerified: false,
            deletedAt: now
          },
          $unset: {
            phone: '',
            emailVerificationToken: '',
            emailVerificationExpiresAt: '',
            passwordResetToken: '',
            passwordResetExpiresAt: ''
          }
        },
        { session }
      );

      if (storeIds.length > 0) {
        await cancelPendingRedemptions({ storeId: { $in: storeIds } }, { session, refund: true });

        await Store.updateMany(
          { _id: { $in: storeIds } },
          { $set: { status: 'closed', closedAt: now, discoverable: false, 'tillPins.$[].active': false } },
          { session }
        );

        await StoreBilling.updateMany(
          { storeId: { $in: storeIds } },
          { $set: { status: 'cancelled', limitReachedAt: null } },
          { session }
        );
      }

      await RefreshToken.updateMany({ userId: id, userType: 'user' }, { $set: { revoked: true } }, { session });
    });
  } finally {
    session.endSession();
  }

  return { closedStoreIds: storeIds };
}

module.exports = { deleteCustomerAccount, deleteStoreOwnerAccount, RETENTION_DAYS };
