const config = require('../config/config');
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(require(config.FirebaseCredential)),
  databaseURL: config.databaseUrl
});
module.exports.admin = admin;

const client = require('firebase');
client.initializeApp({
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  databaseURL: config.databaseUrl,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId
});
module.exports.client = client;

const db = admin.database();
const dbAuth = db.ref('Authorization');

function verifyAuth(req, res, next) {
  if (req.method == 'POST' && req.path == '/auth' || req.path == '/test/scaling') {
    return next();
  }

  if (!req.headers.authorization) {
    return res.status(401).send('Not authorized');
  }

  // TODO: Optimize this. It won't scale optimally, but it verifies the access token in the database is the one supplied
  dbAuth.once('value', snapshot => {
    var user = null;
    snapshot.forEach(function (data) {
      if (data.val().accessToken == req.headers.authorization) {
        user = data.key;
      }
    });
    if (!user) {
      return res.status(401).send('Not authorized');
    }

    client.auth().signInWithCustomToken(req.headers.authorization).then(() => {
      req.session = user;
      return next();
    }).catch(err => {
      console.error(err);
      return res.status(401).send('Error while authorizing');
    });
  });
}

module.exports.verifyAuth = verifyAuth;
