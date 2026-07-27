const app = require('./app');
const env = require('./src/config/env');
const { connectDB } = require('./src/config/db');

async function start() {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port} (${env.nodeEnv})`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
