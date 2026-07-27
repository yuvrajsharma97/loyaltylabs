const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./src/config/env');
const { isConnected } = require('./src/config/db');
const authRoutes = require('./src/features/auth/auth.routes');
const customerRoutes = require('./src/features/customers/customer.routes');
const { customerRouter: storeCustomerRoutes, ownerRouter: storeOwnerRoutes } = require('./src/features/stores/store.routes');
const rewardRoutes = require('./src/features/rewards/reward.routes');
const {
  customerRouter: redemptionCustomerRoutes,
  ownerRouter: redemptionOwnerRoutes
} = require('./src/features/redemptions/redemption.routes');
const scanRoutes = require('./src/features/scan/scan.routes');
const disputeRoutes = require('./src/features/disputes/dispute.routes');
const billingRoutes = require('./src/features/billing/billing.routes');
const adminRoutes = require('./src/features/admin/admin.routes');
const { notFoundHandler, errorHandler } = require('./src/shared/middleware/errorHandler.middleware');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsAllowedOrigins,
    credentials: true
  })
);
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    db: isConnected() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1/auth', authRoutes);

// Customer dashboard - profile, QR, own transactions/disputes, store
// directory/join, redeem-initiate.
app.use('/api/v1/dashboard/customer/me', customerRoutes);
app.use('/api/v1/dashboard/customer/stores', storeCustomerRoutes);
app.use('/api/v1/dashboard/customer/redeem', redemptionCustomerRoutes);

// Store-owner dashboard - store/loyalty/till-pin/rewards management, till
// scan operations, dispute resolution, billing, redemption cancellation.
app.use('/api/v1/dashboard/store', storeOwnerRoutes);
app.use('/api/v1/dashboard/store', rewardRoutes);
app.use('/api/v1/dashboard/store/scan', scanRoutes);
app.use('/api/v1/dashboard/store/disputes', disputeRoutes);
app.use('/api/v1/dashboard/store/billing', billingRoutes);
app.use('/api/v1/dashboard/store/redeem', redemptionOwnerRoutes);

// Super-admin dashboard.
app.use('/api/v1/dashboard/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
