/**
 * Dev-only seed script: wipes and recreates a full demo dataset covering
 * every feature built so far - 11 stores (with owners, till PINs, rewards in
 * every state, billing + usage history, one brand-new store), 22 customers
 * (with real QR tokens, plus one un-onboarded and one unverified), memberships,
 * a point-transaction ledger (earn/redeem/reversal/adjust/expiry), redemptions
 * in every status, disputes, and one super admin account.
 *
 * Safe to re-run: only ever deletes records tied to an @loyaltylabs.test
 * email address, so it can't touch real accounts sharing the same database.
 *
 * Usage (run from backend/):
 *   npm run seed                          -> targets .env.development's MONGODB_URI
 *   NODE_ENV=production npm run seed      -> targets .env.production's MONGODB_URI (e.g. an Atlas cluster)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { connectDB } = require('../src/config/db');
const { generateSlug } = require('../src/shared/utils/slugGenerator');
const { generateQrCodeToken, generateQrSalt } = require('../src/shared/utils/qrSigning');
const { calculatePoints, applyPointsCap } = require('../src/shared/services/calculatePoints');

const User = require('../src/features/auth/auth.model');
const Customer = require('../src/features/customers/customer.model');
const Store = require('../src/features/stores/store.model');
const Membership = require('../src/features/memberships/membership.model');
const Reward = require('../src/features/rewards/reward.model');
const PointTransaction = require('../src/features/transactions/transaction.model');
const Redemption = require('../src/features/redemptions/redemption.model');
const Dispute = require('../src/features/disputes/dispute.model');
const { StoreBilling, UsageSnapshot } = require('../src/features/billing/billing.model');
const ReconciliationLog = require('../src/features/admin/reconciliationLog.model');
const RefreshToken = require('../src/features/auth/refreshToken.model');

const EMAIL_DOMAIN = 'loyaltylabs.test';
const SEED_PASSWORD = 'Password123';
const BCRYPT_ROUNDS = 10;
const TILL_PIN = '1234';

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function sample(arr, count) {
  const copy = [...arr];
  const out = [];
  while (out.length < count && copy.length) {
    out.push(copy.splice(randomInt(0, copy.length - 1), 1)[0]);
  }
  return out;
}

// Optional per-store flags, each there to exercise a specific screen/state:
//   pointsExpiryDays / maxPointsBalance - earning rules with expiry + cap (and 'expiry' ledger rows)
//   freeUserLimit - low limit so /billing/usage shows a non-zero billable count
//   isNew - brand-new store: onboarding incomplete, no rewards/PINs/billing (BILLING_NOT_SETUP), no members
const STORE_DEFS = [
  { name: 'The Daily Grind Cafe', category: 'cafe', mode: 'per_currency', pointsPerUnit: 2, minPurchase: 3, pointsExpiryDays: 180, freeUserLimit: 5 },
  { name: 'Urban Cuts Barber', category: 'services', mode: 'per_visit', fixedPointsPerVisit: 10, minPurchase: 0 },
  { name: 'Green Leaf Grocers', category: 'retail', mode: 'per_currency', pointsPerUnit: 1, minPurchase: 5, maxPointsBalance: 500 },
  { name: 'Bloom & Petal Florist', category: 'retail', mode: 'per_currency', pointsPerUnit: 1.5, minPurchase: 0 },
  { name: 'The Book Nook', category: 'retail', mode: 'per_currency', pointsPerUnit: 1, minPurchase: 0 },
  { name: 'Sunset Yoga Studio', category: 'services', mode: 'per_visit', fixedPointsPerVisit: 15, minPurchase: 0 },
  { name: 'Pixel Perfect Print Shop', category: 'services', mode: 'per_currency', pointsPerUnit: 1, minPurchase: 2 },
  { name: 'The Corner Bakery', category: 'cafe', mode: 'per_currency', pointsPerUnit: 2, minPurchase: 2 },
  { name: 'Fresh Fit Gym', category: 'services', mode: 'per_visit', fixedPointsPerVisit: 8, minPurchase: 0 },
  { name: 'Sparkle Clean Laundromat', category: 'other', mode: 'per_visit', fixedPointsPerVisit: 5, minPurchase: 0 },
  { name: 'Fresh Start Deli', category: 'cafe', mode: 'per_currency', pointsPerUnit: 1, minPurchase: 0, isNew: true }
];

// Suspended store - kept as the 10th store so owner1-owner9 stay stable across re-seeds.
const SUSPENDED_STORE_INDEX = 9;

const CUSTOMER_DEFS = [
  { name: 'Alice Johnson', interests: ['cafe', 'retail'] },
  { name: 'Bob Smith', interests: ['services'] },
  { name: 'Carol Davis', interests: ['retail', 'other'] },
  { name: 'David Wilson', interests: ['cafe'] },
  { name: 'Emma Brown', interests: ['services', 'retail'] },
  { name: 'Frank Miller', interests: ['cafe', 'services'] },
  { name: 'Grace Lee', interests: ['retail'] },
  { name: 'Henry Clark', interests: ['other'] },
  { name: 'Isabel Martinez', interests: ['cafe', 'retail', 'services'] },
  { name: 'Jack Turner', interests: ['services'] },
  { name: 'Karen Walsh', interests: ['cafe'] },
  { name: 'Liam Patel', interests: ['retail', 'services'] },
  { name: 'Mia Robinson', interests: ['cafe', 'other'] },
  { name: 'Noah Evans', interests: ['services'] },
  { name: 'Olivia Hughes', interests: ['retail'] },
  { name: 'Priya Shah', interests: ['cafe', 'retail'] },
  { name: 'Quinn Foster', interests: ['other'] },
  { name: 'Ruby Collins', interests: ['cafe', 'services'] },
  { name: 'Sam Okafor', interests: ['retail'] },
  { name: 'Tara Nguyen', interests: ['cafe', 'retail', 'other'] },
  // Edge-case accounts - no memberships or activity.
  { name: 'Uma New', interests: [], notOnboarded: true },
  { name: 'Victor Unverified', interests: ['cafe'], unverified: true }
];

// Redeemable rewards - buildActivity only ever redeems these.
const REWARD_DEFS = [
  { title: '10% off your order', rewardType: 'discount_percent', value: 10, points: 50 },
  { title: '£5 off your order', rewardType: 'discount_fixed', value: 5, points: 100 },
  { title: 'Free item on us', rewardType: 'free_item', value: null, points: 150 }
];

// Non-redeemable variants so the reward list/editor shows every state.
const EXTRA_REWARD_DEFS = [
  { title: 'Seasonal special (paused)', rewardType: 'free_item', value: null, points: 80, active: false },
  { title: 'Limited run: tote bag', rewardType: 'free_item', value: null, points: 300, stockLimit: 25 },
  { title: 'Summer promo (ended)', rewardType: 'discount_percent', value: 20, points: 120, validTo: daysAgo(30) },
  { title: 'Retired reward', rewardType: 'discount_fixed', value: 2, points: 40, deleted: true, active: false }
];

async function wipeExistingSeedData() {
  const emailPattern = new RegExp(`@${EMAIL_DOMAIN}$`);
  const userIds = (await User.find({ email: emailPattern }, '_id')).map((d) => d._id);
  const customerIds = (await Customer.find({ email: emailPattern }, '_id')).map((d) => d._id);
  const storeIds = (await Store.find({ ownerUserId: { $in: userIds } }, '_id')).map((d) => d._id);

  await Promise.all([
    Membership.deleteMany({ storeId: { $in: storeIds } }),
    Reward.deleteMany({ storeId: { $in: storeIds } }),
    PointTransaction.deleteMany({ storeId: { $in: storeIds } }),
    Redemption.deleteMany({ storeId: { $in: storeIds } }),
    Dispute.deleteMany({ storeId: { $in: storeIds } }),
    StoreBilling.deleteMany({ storeId: { $in: storeIds } }),
    UsageSnapshot.deleteMany({ storeId: { $in: storeIds } }),
    ReconciliationLog.deleteMany({ storeId: { $in: storeIds } }),
    RefreshToken.deleteMany({ userId: { $in: [...userIds, ...customerIds] } })
  ]);

  await Promise.all([
    Store.deleteMany({ _id: { $in: storeIds } }),
    User.deleteMany({ _id: { $in: userIds } }),
    Customer.deleteMany({ _id: { $in: customerIds } })
  ]);

  console.log(
    `Cleared previous seed data: ${storeIds.length} stores, ${userIds.length} users, ${customerIds.length} customers.`
  );
}

async function createSuperAdmin() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS);
  return User.create({
    email: `admin@${EMAIL_DOMAIN}`,
    passwordHash,
    name: 'Platform Admin',
    role: 'super_admin',
    emailVerified: true
  });
}

async function createStoresWithOwners() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS);
  const stores = [];

  for (let i = 0; i < STORE_DEFS.length; i++) {
    const def = STORE_DEFS[i];
    const isSuspended = i === SUSPENDED_STORE_INDEX; // exercises admin suspend/reactivate

    const owner = await User.create({
      email: `owner${i + 1}@${EMAIL_DOMAIN}`,
      passwordHash,
      name: `${def.name} Owner`,
      role: 'store_owner',
      emailVerified: true
    });

    const store = await Store.create({
      name: def.name,
      ownerUserId: owner._id,
      address: `${randomInt(1, 200)} Market Street`,
      category: def.category,
      status: isSuspended ? 'suspended' : 'active',
      discoverable: true,
      loyaltyProgram: {
        mode: def.mode,
        pointsPerUnit: def.pointsPerUnit || 1,
        fixedPointsPerVisit: def.fixedPointsPerVisit || 0,
        minPurchase: def.minPurchase || 0,
        pointsExpiryDays: def.pointsExpiryDays || null,
        maxPointsBalance: def.maxPointsBalance || null
      },
      tillPins: def.isNew
        ? []
        : [
            { pin: TILL_PIN, label: 'Front till', active: true },
            { pin: '5678', label: 'Back office', active: true },
            { pin: '2468', label: 'Former staff', active: false }
          ],
      onboardingCompleted: def.isNew
        ? { loyaltyRuleSet: true, firstRewardAdded: false, tillModeTested: false }
        : { loyaltyRuleSet: true, firstRewardAdded: true, tillModeTested: true }
    });

    if (def.isNew) {
      stores.push({ store, owner, rewards: [], billing: null, isNew: true });
      continue;
    }

    const periodStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const billing = await StoreBilling.create({
      storeId: store._id,
      freeUserLimit: def.freeUserLimit || 100,
      currentBillingPeriodStart: periodStart,
      currentBillingPeriodEnd: new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 1),
      status: isSuspended ? 'past_due' : 'active'
    });

    const rewards = await Reward.insertMany(
      REWARD_DEFS.map((r) => ({
        storeId: store._id,
        title: r.title,
        description: `${r.title} at ${def.name}`,
        pointsRequired: r.points,
        rewardType: r.rewardType,
        value: r.value,
        active: true
      }))
    );

    await Reward.insertMany(
      EXTRA_REWARD_DEFS.map((r) => ({
        storeId: store._id,
        title: r.title,
        description: `${r.title} at ${def.name}`,
        pointsRequired: r.points,
        rewardType: r.rewardType,
        value: r.value,
        active: r.active !== false,
        deleted: Boolean(r.deleted),
        stockLimit: r.stockLimit || null,
        validFrom: daysAgo(120),
        validTo: r.validTo || null
      }))
    );

    stores.push({ store, owner, rewards, billing });
  }

  return stores;
}

async function createCustomers() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS);
  const customers = [];

  for (let i = 0; i < CUSTOMER_DEFS.length; i++) {
    const def = CUSTOMER_DEFS[i];
    const _id = new mongoose.Types.ObjectId();
    const qrSalt = generateQrSalt();
    const qrCodeToken = generateQrCodeToken(_id.toString(), qrSalt);
    const email = `customer${i + 1}@${EMAIL_DOMAIN}`;

    const customer = await Customer.create({
      _id,
      name: def.name,
      email,
      phone: `07700 900${String(100 + i).slice(-3)}`,
      passwordHash,
      username: generateSlug(email.split('@')[0]),
      slug: generateSlug(def.name),
      qrCodeToken,
      qrSalt,
      emailVerified: !def.unverified,
      interests: def.interests,
      onboardingCompleted: !def.notOnboarded
    });

    // Edge-case accounts stay empty - no memberships or activity.
    if (!def.notOnboarded && !def.unverified) customers.push(customer);
  }

  return customers;
}

// Builds memberships, a point-transaction ledger, redemptions (pending/
// fulfilled/cancelled), and a handful of disputes - mirroring exactly what
// /scan/earn, /redeem/initiate, /scan/redeem and /redeem/:id/cancel do to
// these collections, so the data is internally consistent (ledger sums match
// membership balances) everywhere except one deliberate exception below.
async function buildActivity(storeRecords, customers) {
  const backdatedTransactions = [];
  const backdatedRedemptions = [];
  const disputeCandidates = []; // { storeId, customerId, transactionId, transactionType }
  let deliberateDiscrepancyStoreId = null;

  for (const customer of customers) {
    const joinedStores = sample(
      storeRecords.filter((s) => s.store.status === 'active' && !s.isNew),
      randomInt(4, 7)
    );

    for (const { store, owner, rewards } of joinedStores) {
      const joinedAt = daysAgo(randomInt(45, 90));
      const membership = await Membership.create({
        customerId: customer._id,
        storeId: store._id,
        pointsBalance: 0,
        joinedAt
      });

      let balance = 0;
      let lastActivityAt = joinedAt;

      const visitCount = randomInt(3, 8);
      for (let v = 0; v < visitCount; v++) {
        const purchaseAmount = randomInt(5, 60);
        const rawPoints = calculatePoints(purchaseAmount, store.loyaltyProgram);
        const { pointsAwarded, pointsCapApplied, newBalance } = applyPointsCap(
          balance,
          rawPoints,
          store.loyaltyProgram.maxPointsBalance
        );
        balance = newBalance;
        const createdAt = daysAgo(randomInt(0, 44));
        if (createdAt > lastActivityAt) lastActivityAt = createdAt;

        const txn = await PointTransaction.create({
          storeId: store._id,
          customerId: customer._id,
          performedByUserId: owner._id,
          tillPin: TILL_PIN,
          verificationMethod: pick(['qr_scan', 'slug_manual']),
          type: 'earn',
          points: pointsAwarded,
          purchaseAmount,
          pointsCapApplied
        });
        backdatedTransactions.push({ id: txn._id, createdAt });

        if (Math.random() < 0.1) {
          disputeCandidates.push({
            storeId: store._id,
            customerId: customer._id,
            transactionId: txn._id,
            transactionType: 'earn'
          });
        }
      }

      // Redeem a reward when there's enough balance, in a random outcome
      // status - exercises pending/fulfilled/cancelled all three.
      const affordable = rewards.filter((r) => r.pointsRequired <= balance);
      if (affordable.length && Math.random() < 0.6) {
        const reward = pick(affordable);
        const outcome = pick(['pending', 'fulfilled', 'cancelled', 'expired']);
        // Expired redemptions need a creation date old enough for expiresAt to be in the past.
        const createdAt = outcome === 'expired' ? daysAgo(randomInt(35, 44)) : daysAgo(randomInt(0, 20));

        balance -= reward.pointsRequired;
        const redeemTxn = await PointTransaction.create({
          storeId: store._id,
          customerId: customer._id,
          type: 'redeem',
          points: -reward.pointsRequired
        });
        backdatedTransactions.push({ id: redeemTxn._id, createdAt });

        const redemption = await Redemption.create({
          storeId: store._id,
          customerId: customer._id,
          rewardId: reward._id,
          pointsSpent: reward.pointsRequired,
          redemptionCode: crypto.randomBytes(16).toString('hex'),
          status: outcome,
          validityLockedAt: createdAt,
          expiresAt:
            outcome === 'expired'
              ? new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000)
              : new Date(createdAt.getTime() + 365 * 24 * 60 * 60 * 1000),
          fulfilledByUserId: outcome === 'fulfilled' ? owner._id : null,
          tillPin: outcome === 'fulfilled' ? TILL_PIN : null,
          fulfilledAt: outcome === 'fulfilled' ? daysAgo(randomInt(0, 19)) : null
        });
        backdatedRedemptions.push({ id: redemption._id, createdAt });
        redeemTxn.relatedRedemptionId = redemption._id;
        await redeemTxn.save();

        if (outcome === 'cancelled') {
          // Mirrors what /redeem/:id/cancel actually does: restore the
          // points via a 'reversal' ledger entry, same as a real cancel.
          balance += reward.pointsRequired;
          const reversalTxn = await PointTransaction.create({
            storeId: store._id,
            customerId: customer._id,
            performedByUserId: owner._id,
            type: 'reversal',
            points: reward.pointsRequired,
            relatedRedemptionId: redemption._id
          });
          backdatedTransactions.push({ id: reversalTxn._id, createdAt: daysAgo(randomInt(0, 19)) });

          if (Math.random() < 0.3) {
            disputeCandidates.push({
              storeId: store._id,
              customerId: customer._id,
              transactionId: reversalTxn._id,
              transactionType: 'reversal'
            });
          }
        }

        if (createdAt > lastActivityAt) lastActivityAt = createdAt;
        if (Math.random() < 0.3) {
          disputeCandidates.push({
            storeId: store._id,
            customerId: customer._id,
            transactionId: redeemTxn._id,
            transactionType: 'redemption'
          });
        }
      }

      // Occasional manual goodwill adjustment by the owner.
      if (Math.random() < 0.15) {
        const points = randomInt(5, 25);
        balance += points;
        const adjustTxn = await PointTransaction.create({
          storeId: store._id,
          customerId: customer._id,
          performedByUserId: owner._id,
          type: 'adjust',
          points
        });
        backdatedTransactions.push({ id: adjustTxn._id, createdAt: daysAgo(randomInt(0, 30)) });
      }

      // Stores with an expiry rule get the odd expired-points ledger entry.
      if (store.loyaltyProgram.pointsExpiryDays && balance > 10 && Math.random() < 0.3) {
        const points = Math.min(balance, randomInt(5, 15));
        balance -= points;
        const expiryTxn = await PointTransaction.create({
          storeId: store._id,
          customerId: customer._id,
          type: 'expiry',
          points: -points
        });
        backdatedTransactions.push({ id: expiryTxn._id, createdAt: daysAgo(randomInt(0, 10)) });
      }

      await Membership.updateOne({ _id: membership._id }, { $set: { pointsBalance: balance, lastActivityAt } });

      // One deliberate ledger/balance mismatch, on the first store with real
      // activity, purely to give the admin "Reconcile" button (AdminStores)
      // something real to find and fix.
      if (!deliberateDiscrepancyStoreId && balance > 20) {
        await Membership.updateOne({ _id: membership._id }, { $inc: { pointsBalance: 15 } });
        deliberateDiscrepancyStoreId = store._id;
      }
    }
  }

  if (backdatedTransactions.length) {
    await PointTransaction.bulkWrite(
      backdatedTransactions.map(({ id, createdAt }) => ({
        updateOne: { filter: { _id: id }, update: { $set: { createdAt } } }
      }))
    );
  }
  if (backdatedRedemptions.length) {
    await Redemption.bulkWrite(
      backdatedRedemptions.map(({ id, createdAt }) => ({
        updateOne: { filter: { _id: id }, update: { $set: { createdAt } } }
      }))
    );
  }

  const disputes = sample(disputeCandidates, Math.min(10, disputeCandidates.length));
  for (const [index, d] of disputes.entries()) {
    const resolved = index % 2 === 0;
    await Dispute.create({
      storeId: d.storeId,
      customerId: d.customerId,
      transactionId: d.transactionId,
      transactionType: d.transactionType,
      customerNote: pick([
        "I don't recognise this transaction.",
        'The points awarded look too low for what I spent.',
        'I was charged but never got my points.'
      ]),
      ownerNote: resolved ? 'Checked the till log and corrected the balance.' : null,
      status: resolved ? 'resolved' : 'open',
      resolvedAt: resolved ? daysAgo(randomInt(0, 10)) : null
    });
  }

  return { disputeCount: disputes.length, deliberateDiscrepancyStoreId };
}

// Past billing periods for /billing/history - normally written by the
// (not-yet-built) metering job. Three closed months per billed store.
async function createUsageHistory(storeRecords) {
  const snapshots = [];
  const now = new Date();

  for (const { store, billing } of storeRecords) {
    if (!billing) continue;
    for (let monthsBack = 3; monthsBack >= 1; monthsBack--) {
      const periodStart = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);
      const activeCustomerCount = randomInt(3, 14);
      const billableCount = Math.max(activeCustomerCount - billing.freeUserLimit, 0);
      snapshots.push({
        storeId: store._id,
        periodStart,
        periodEnd,
        activeCustomerCount,
        billableCount,
        amountDue: billableCount * billing.pricePerExtraUser,
        status: monthsBack === 1 ? 'invoiced' : 'paid'
      });
    }
  }

  await UsageSnapshot.insertMany(snapshots);
  return snapshots.length;
}

async function main() {
  await connectDB();
  console.log('Connected. Seeding LoyaltyLabs demo data...\n');

  await wipeExistingSeedData();

  const admin = await createSuperAdmin();
  const storeRecords = await createStoresWithOwners();
  const customers = await createCustomers();
  const { disputeCount, deliberateDiscrepancyStoreId } = await buildActivity(storeRecords, customers);
  const snapshotCount = await createUsageHistory(storeRecords);

  const allCustomers = await Customer.find({ email: new RegExp(`@${EMAIL_DOMAIN}$`) }).sort({ createdAt: 1 });
  console.log(
    `\nCreated ${storeRecords.length} stores, ${allCustomers.length} customers, ${disputeCount} disputes, ` +
      `${snapshotCount} billing snapshots.`
  );
  console.log(`\nAll seed accounts use the password: ${SEED_PASSWORD}   Till PINs: ${TILL_PIN} / 5678\n`);
  console.log(`Super admin  -> ${admin.email}`);
  storeRecords.forEach(({ owner, store, isNew }) => {
    const notes = [];
    if (store.status === 'suspended') notes.push('SUSPENDED');
    if (isNew) notes.push('new: onboarding incomplete, no billing');
    console.log(`Store owner  -> ${owner.email}  (${store.name}${notes.length ? `, ${notes.join(', ')}` : ''})`);
  });
  allCustomers.forEach((c) => {
    const notes = [];
    if (!c.emailVerified) notes.push('email NOT verified');
    if (!c.onboardingCompleted) notes.push('onboarding NOT completed');
    console.log(`Customer     -> ${c.email}${notes.length ? `  (${notes.join(', ')})` : ''}`);
  });

  const discrepancyStore = storeRecords.find((s) => String(s.store._id) === String(deliberateDiscrepancyStoreId));
  if (discrepancyStore) {
    console.log(
      `\nNote: "${discrepancyStore.store.name}" has one deliberately-mismatched membership balance, ` +
        'so /admin/stores -> Reconcile has something real to find and fix.'
    );
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
