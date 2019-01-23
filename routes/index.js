const express = require('express');
const router = express.Router();

const btcNodeController = require('../controllers/BTC');
const configController = require('../controllers/Config');
const authController = require('../controllers/Auth');
const monitorController = require('../controllers/Monitor');

router.get('/', configController.get);
router.route('/deposit').get(btcNodeController.getDeposits);
router.route('/deposit/:guid').get(btcNodeController.getDeposit);
router.route('/deposit/address').post(btcNodeController.generateAddress);
router.route('/deposit/address/:a_guid').get(btcNodeController.getBalance);
router.route('/withdrawal').post(btcNodeController.withdrawal);
router.route('/withdrawal').get(btcNodeController.getWithdrawals);
router.route('/transfer').post(btcNodeController.transfer);
router.route('/transfer').get(btcNodeController.getTransfers);
router.route('/transfer/:guid').get(btcNodeController.getTransfer);
router.route('/validate-address').post(btcNodeController.validateAddress);
router.route('/callback-deposit').post(btcNodeController.callbackDeposit);
router.route('/callback-withdraw').post(btcNodeController.callbackWithdraw);
router.route('/master/wallet/balance').get(btcNodeController.getMasterWalletStatus);

router.route('/auth').post(authController.create);
router.route('/monitor/rpc').get(monitorController.getMonitorRpc);
router.route('/monitor/syncing').get(monitorController.getMonitorSyncing);
router.route('/monitor/db').get(monitorController.getMonitorDb);

router.route('/test/scaling').get(btcNodeController.testScaling);

module.exports = router;
