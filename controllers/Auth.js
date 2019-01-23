const admin = require('../config/firebase').admin;
const db = admin.database();
const dbAuth = db.ref('Authorization');
const moment = require('moment');
const logger = require('../utils/logUtils').logger;
var auth_token = "";

exports.create = (req, res) => {
  admin.auth().getUser(req.body.uid).then(() => {
    admin.auth().createCustomToken(req.body.uid).then(customToken => {
      dbAuth.child(req.body.uid).set({ accessToken: customToken, createdAt: moment().format('YYYY-MM-DD HH:mm:ss') }, err => {
        if (err) {
          return res.status(500).json(err);
        }
        auth_token = customToken;
        logger.info('auth_token : ', auth_token);
        return res.status(200).json({ accessToken: customToken });
      });
    })
    .catch(err => {
      logger.error(err);
      return res.status(500).json('Failed to generate access token');
    });
  })
  .catch(err => {
    logger.error(err);
    return res.status(400).send('User does not exist');
  });
};

exports.refreshAccessToken = () => {
  dbAuth.once('value', (snapshot) => {
    const data = snapshot.val();
    if (data.length > 0) {
      auth_token = data[0].accessToken;
    }

    auth_token = "";
  });
}

exports.getAccessToken = () => {
  return auth_token;
}
