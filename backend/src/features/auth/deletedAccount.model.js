const mongoose = require('mongoose');

// The personal details of a deleted account, held back (not shown anywhere in
// the app) for disputes or fraud checks, then wiped. The live Customer/User
// record is anonymised the moment the account is deleted; this is the only
// copy of who it was. Mongo's TTL monitor removes each document once purgeAt
// passes, so nothing outlives the retention window even if the app is down.
const RETENTION_DAYS = 183; // six months

const deletedAccountSchema = new mongoose.Schema({
  accountType: { type: String, enum: ['customer', 'user'], required: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  role: { type: String, enum: ['customer', 'store_owner'], required: true },
  personalDetails: {
    name: String,
    email: String,
    phone: String,
    googleId: String,
    avatarUrl: String,
    username: String,
    slug: String
  },
  storeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Store' }],
  deletedAt: { type: Date, required: true },
  purgeAt: { type: Date, required: true }
});

deletedAccountSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('DeletedAccount', deletedAccountSchema);
module.exports.RETENTION_DAYS = RETENTION_DAYS;
