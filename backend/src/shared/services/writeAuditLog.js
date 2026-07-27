const AuditLog = require('../models/auditLog.model');

// Always synchronous and always self-contained try/catch - a logging failure
// must never roll back or block the operation it's describing (per plan
// section 3.2: "failure -> dead-letter log, never rolls back parent").
async function writeAuditLog({ actorUserId, storeId, tillPin = null, action, target = null, metadata = {} }) {
  try {
    await AuditLog.create({ actorUserId, storeId, tillPin, action, target, metadata });
  } catch (err) {
    console.error('writeAuditLog failed (dead-letter):', { action, target, storeId: String(storeId) }, err);
  }
}

module.exports = writeAuditLog;
