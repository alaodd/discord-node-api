const express = require('express');
const { registerUser } = require('../../services/registration.service');  
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const collection = req.mongo.db.collection(process.env.MONGO_USERS_DB);
    const result = await registerUser(collection, req.body);
    res.end(JSON.stringify(result));
  } catch (err) {
    console.error(err);
    res.status(500).end(err.toString());
  }
});
module.exports = router;