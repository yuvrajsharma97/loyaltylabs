const dns = require('dns');
const mongoose = require('mongoose');
const env = require('./env');

// mongodb+srv:// needs a DNS SRV lookup to discover the replica set hosts.
// Some networks/ISP resolvers don't support SRV queries and fail with
// "querySrv ECONNREFUSED" even though the cluster itself is reachable -
// pointing Node at a public resolver works around it. Not gated to
// production: the failure shows up locally too, wherever the network's
// default DNS server is the problem.
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function connectDB() {
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  await mongoose.connect(env.mongodbUri);
  return mongoose.connection;
}

function isConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, isConnected };
