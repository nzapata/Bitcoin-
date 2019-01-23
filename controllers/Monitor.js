const config = require('../config/config');
const client = config.localNode;

const firebaseAdmin = require('../config/firebase').admin;
const db = firebaseAdmin.database();
const dbAuth = db.ref('Authorization');
const refMonitor = db.ref(config.firebase_dbname + '/SyncStatus');

exports.getMonitor = async (req, res) => {
  return res.status(200).send("Server is working now !");
};

exports.getMonitorDb = async (req, res) => {
  dbAuth.once('value')
    .then(function (snap) {
      res.status(200).send({ msg: 'success', data: 'firebase is working' });
    })
    .catch(function (err) {
      res.status(400).send({ msg: "error", data: 'firebase is not working' });
    })
};

exports.getMonitorRpc = async (req, res) => {
  try {
    client.call("getblockchaininfo", [], function (err, result) {
      if (err) {
        return res.status(400).send({ msg: "errors", data: err.toString() });
      }
      return res.status(200).send({ msg: "success", data: result });
    });
  } catch (err) {
    return res.status(400).send({ msg: "errors", data: err.toString() });
  }
};


exports.getMonitorSyncing = async (req, res) => {
  refMonitor.once('value', (snapshot) => {
    const data = snapshot.val();

    if (new Date(data.updateAt).getTime() < Date.now() - config.blockSyncTime) {
      return res.status(400).send('Node not synced to network');
    }

    return res.status(200).send('Syncing is good');
  });
};
