const admin = require('../config/firebase').admin;
const db = admin.database();
const dbAuth = db.ref('Authorization');
const config = require('/config/config');
const { depositTransactionCallback } = config;

exports.create = (req, res) => {
  admin.auth().getUser(req.body.uid).then(() => {
    admin.auth().createCustomToken(req.body.uid).then(customToken => {
      dbAuth.child(req.body.uid).set({ accessToken: customToken, createdAt: moment().format('YYYY-MM-DD HH:mm:ss') }, err => {
        if (err) {
          return res.status(500).json(err);
        }
        return res.status(200).json({ accessToken: customToken });
      });
    })
    .catch(err => {
      console.log(err);
      return res.status(500).json('Failed to generate access token');
    });
  })
  .catch(err => {
    console.log(err);
    return res.status(400).send('User does not exist');
  });
};

