const mongoose = require('mongoose');
require('dotenv').config();

const resolvedHost = 'ac-hhfuwhu-shard-00-00.4nnr0cm.mongodb.net';

console.log('Testing DIRECT MongoDB connection...');

if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing!');
    process.exit(1);
}

try {
    const originalUri = process.env.MONGO_URI;
    // Basic parse to get creds
    // Format: mongodb+srv://<user>:<pass>@...
    const match = originalUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@/);
    if (!match) {
        console.error('Could not parse user/pass from URI');
        process.exit(1);
    }
    const user = match[1];
    const pass = match[2];

    // Construct direct URI
    // Note: This connects to a single shard, good for testing connectivity, bad for production (no failover)
    const directUri = `mongodb://${user}:${pass}@${resolvedHost}:27017/?ssl=true&authSource=admin`;

    console.log('Attempting to connect with direct URI (masked):', directUri.replace(pass, '****'));

    mongoose.connect(directUri)
        .then(() => {
            console.log('SUCCESS: Direct MongoDB Connected!');
            process.exit(0);
        })
        .catch((err) => {
            console.error('FAILURE: Direct connection failed!');
            console.error(err);
            process.exit(1);
        });

} catch (e) {
    console.error('Script error:', e);
}
