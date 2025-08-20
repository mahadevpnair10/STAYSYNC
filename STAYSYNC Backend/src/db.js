const { MongoClient } = require('mongodb');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const uri = process.env.MongoDB_connection_string;
const client = new MongoClient(uri, { useUnifiedTopology: true });

let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db('staysync'); // You can change the db name if needed
  }
  return db;
}

module.exports = { connectDB };
