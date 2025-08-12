// MongoDB connection utility for price list controller
const { MongoClient } = require('mongodb');

let dbInstance = null;

async function connectDB() {
  if (dbInstance) return dbInstance;
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  dbInstance = client.db('cleaning_service');
  return dbInstance;
}

function getDB() {
  if (!dbInstance) {
    throw new Error('MongoDB not connected. Call connectDB() first.');
  }
  return dbInstance;
}

module.exports = { connectDB, getDB };
