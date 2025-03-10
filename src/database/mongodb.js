const { MongoClient } = require('mongodb');

class MongoDBClient {
  constructor(url, dbName) {
    this.url = url;
    this.dbName = dbName;
    this.db = null;
  }

  async connect() {
    const client = await MongoClient.connect(this.url);
    this.db = client.db(this.dbName);
  }
}

module.exports = MongoDBClient;