const firebaseAdmin = require('../config/firebase').admin;
const client = require('../config/firebase').client;
const db = firebaseAdmin.database();
const dbAuth = db.ref('Authorization');
const _ = require('lodash');
const blacklist = [
  '/auth',
  '/callback-deposit',
  'callback-withdraw'
];

exports.verifyAuth = (req, res, next) => {
  if (_.includes(blacklist, req.path)) {
    return next();
  }
  dbAuth.orderByValue().on('value', async(snapshot) => {
    const datas = snapshot.val();
    const accessTokens = [];
    for (const data in datas) {
      accessTokens.push(datas[data]);
    }
    for (const data of accessTokens) {
      if (data.accessToken === req.headers.authorization) {
        try {
          await client.auth().signInWithCustomToken(req.headers.authorization);
          req.session = data.key;
          return next();
        } catch (error) {
          console.log(error);
          return res.status(401).send('Not authorized');
        }
      }
    }
    return res.status(401).send('Not authorized');
  });
};
