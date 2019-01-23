// define local node object
const config = require('../config/config');
const reduceErrorMessage = require('../utils/reduceErrorMessage').reduceError;
const client = config.localNode;
const moment = require('moment');
const timer = require('moment-timer');
const _ = require('lodash');
const http = require('http');
const querystring = require('querystring');
const osu = require('node-os-utils');
const request = require('request');

const auth = require('./Auth');

const logger = require('../utils/logUtils').logger;

logger.info('Authorization : ', auth.getAccessToken());

// Firebase Section
const firebaseAdmin = require('../config/firebase').admin;
const db = firebaseAdmin.database();
const refDeposit = db.ref(config.firebase_dbname + '/Deposit');
const refPendingDeposit = db.ref(config.firebase_dbname + '/PendingDeposit');
const refWithdrawal = db.ref(config.firebase_dbname + '/Withdrawal');
const refAccount = db.ref(config.firebase_dbname + '/CurrentAccount');
const refExpireAccount = db.ref(config.firebase_dbname + '/ExpireAccount');
const refTransfer = db.ref(config.firebase_dbname + '/Transfer');
const refDepositBackup = db.ref(config.firebase_dbname + '/DepositBackup');
const refWithdrawBackup = db.ref(config.firebase_dbname + '/refWithdrawBackup');
const refAccountBackup = db.ref(config.firebase_dbname + '/AccountBackup');
const refMonitor = db.ref(config.firebase_dbname + '/SyncStatus');
const { BLOCK_EXPLORER_URL } = config;
const { MASTER_WALLET } = config;
const { depositTransactionCallback, withdrawTransactionCallback, depositConfirmCallbackUrl } = config;

var AccountData = {};
var ExpireAccountData = {};

function initAccountSnapshot() {
  refAccount.once('value', (snapshot) => {
    AccountData = snapshot.val();
  });

  refExpireAccount.once('value', (snapshot) => {
    ExpireAccountData = snapshot.val();
  });
}

// Generate Random Guid
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Time
const serverTime = () => (
  {
    current: () => moment().format('YYYY-MM-DD HH:mm:ss'),
    future: () => moment().add(10, 'm').format('YYYY-MM-DD HH:mm:ss')
  }
);

// Get last block
const getLaskBlock = (callback) => {
  try {
    return client.call('getblockcount', [], (error, blockNumber) => {
      if (error) {
        return callback(error, null);
      }

      return callback(null, blockNumber);
    });
  } catch (err) {
    callback(err, null);
  }
}

// Get account from address
const getAccountFromAddress = (address, callback) => {
  try {
    return client.call('getaccount', [address], (errorAcc, account) => {
      if (errorAcc) {
        return callback(errorAcc);
      }
      return callback(null, account);
    });
  } catch (error) {
    return callback(error);
  }
};

// Get balance from address
const getBalanceFromAddress = (address, callback) => {
  try {
    return client.call('getaccount', [address], (errorAcc, account) => {
      if (errorAcc) {
        return callback(errorAcc);
      }
      return client.call('getbalance', [account], (errBalance, balance) => {
        if (errBalance) {
          return callback(errBalance);
        }
        return callback(null, balance);
      });
    });
  } catch (error) {
    return callback(error);
  }
};

// Get balance from account
const getBalanceFromAccount = (account, callback) => {
  try {
    return client.call('getbalance', [account], (errBalance, balance) => {
      if (errBalance) {
        return callback(errBalance);
      }
      return callback(null, balance);
    });
  } catch (error) {
    return callback(error);
  }
};

// Get transactions by address
const getTransactionsFromAddress = (address, callback) => {
  try {
    return client.call('getaccount', [address], (errorAcc, account) => {
      if (errorAcc) {
        return callback(errorAcc);
      }
      return client.call('listtransactions', [account], (errTransaction, transactions) => {
        if (errTransaction) {
          return callback(errTransaction);
        }
        return callback(null, transactions);
      });
    });
  } catch (error) {
    return callback(error);
  }
};

// Get transaction detail by hash
const getTransactionDetail = (txid, callback) => {
  try {
    return client.call('gettransaction', [txid], (errTransaction, transactions) => {
      if (errTransaction) {
        return callback(errTransaction);
      }
      return callback(null, transactions);
    });
  } catch (error) {
    return callback(error);
  }
};


// Transfer

const transfer = (fromWallet, fromAddress, amount, account_key) => {
  getBalanceFromAccount(fromWallet, (err, balance) => {
    if (!err && balance > 0) {
      client.call('move', [fromWallet, MASTER_WALLET, amount], (errTransfer, result) => {
        // If success transfer, save into dB
        if (!errTransfer && result) {
          const key = uuidv4();
          const transferInfo = {
            associated_deposit_id: account_key,
            transaction_guid: key,
            amount,
            to: MASTER_WALLET,
            from: fromAddress,
            status: true,
            token: 'BTC',
            transaction_type: 'DEPOSIT_TRANSACTION',
            transaction_hash: result,
            created_date: serverTime().current()
          };
          refTransfer.child(key).set(transferInfo);
        }
      });
    }
  });
};

// Manage Account
const manageAccount = () => {
  const future = serverTime().future();
  const currentTime = serverTime().current();
  return {
    // Create new entry for account in firebase
    createAccount: (pubKey, callbackUrl) => {
      const key = uuidv4();
      const accountInfo = {
        address_guid: key,
        public_key: pubKey,
        expiration_date: future,
        created_date: currentTime,
        balance: 0,
        callback_url: callbackUrl
      };
      refAccount.child(key).set(accountInfo);
      return accountInfo;
    },

    // check expire date of account and move expired accounts.
    // move current account balance to master wallet and call callback api of core app for updating wallet
    currentAccounts: (data) => {
      if (data) {
        Object.keys(data).forEach((key) => {
          const address = data[key].public_key;
          const callbackUrl = data[key].callback_url;

          const expirationDate = data[key].expiration_date;
          if (expirationDate <= currentTime) {
            refExpireAccount.child(key).set(data[key]);
            refAccount.child(key).set(null);
          } else if (typeof data[key].public_key == 'undefined') {
            refAccount.child(key).set(null);
          } else {
            getAccountFromAddress(address, (err, account) => {
              if (account) {
                getBalanceFromAccount(account, (errBalance, balance) => {
                  if (balance > 0 && account !== MASTER_WALLET) {
                    transfer(account, address, balance, key);
                  }
                });
              }
            });
          }
        });
      }
    },
    // Check the expired accounts and move his balance to master wallet
    // call callback api of core module for updating wallet and notification
    expiredAccounts: (data) => {
      if (data) {
        Object.keys(data).forEach((key) => {
          const address = data[key].public_key;
          const callbackUrl = data[key].callback_url;
          getAccountFromAddress(address, (err, account) => {
            if (account) {
              const expirationDate = data[key].expiration_date;
              getBalanceFromAccount(account, (errBalance, balance) => {
                if (balance > 0 && account !== MASTER_WALLET) {
                  transfer(account, address, balance, key);
                } else if (new Date(expirationDate).getTime() <= new Date(currentTime).getTime() - 21600000) {
                  refAccountBackup.child(key).set(data[key]);
                  refExpireAccount.child(key).set(null);
                }
              });
            }
          });
        });
      }
    }
  };
};

// Check Watch Dog
const checkWatchdog = () => {
  // Executing function before current time
  const currentTime = serverTime().current();
  return {
    // Checking for expiration transaction
    checkRecipt: (data) => {
      if (!data) {
        return;
      }

      Object.keys(data).forEach((key) => {
        const expirationDate = data[key].expiration_date;
        const address = data[key].public_key;
        const callbackUrl = data[key].callback_url;
        if (expirationDate > currentTime && data[key]) {
          getTransactionsFromAddress(address, (err, transactions) => {

            if (!err && transactions && transactions.length > 0) {
              transactions.forEach((transaction) => {
                if (transaction && transaction.address === address && transaction.amount > 0 && transaction.category === 'receive') {
                  refDeposit.orderByChild('chain_transaction_key').equalTo(transaction.txid).once('value', (depSnap) => {
                    const dataDep = depSnap.val();
                    if (!dataDep) {
                      const transactionInfo = {
                        transaction_guid: key,
                        chain_transaction_key: transaction.txid,
                        chain_explorer_url: `${BLOCK_EXPLORER_URL}${transaction.txid}`,
                        amount: transaction.amount,
                        deposit_address: address,
                        external_address: transaction.account,
                        status: true,
                        callback_url: callbackUrl,
                        confirmations: transaction.confirmations,
                        created_date: transaction.time
                      };
                      logger.info('found transaction new in check receipt', transactionInfo);
                      refDeposit.child(uuidv4()).set(transactionInfo);

                      getTransactionDetail(transaction.txid, (errDetail, trans) => {
                        let from = '';
                        if (!errDetail && trans && trans.details && trans.details.length > 0) {
                          const sentTransactionId = trans.details.findIndex(t => t.category === 'send');
                          from = trans.details[sentTransactionId]? trans.details[sentTransactionId].address: 0;
                        }

                        logger.info('checkWatchdog ------------------- current');
                        request.post(depositTransactionCallback,
                          {
                            headers: {
                              'Authorization': auth.getAccessToken(),
                              'Content-Type': 'application/json'
                            },
                            json: {
                              symbol: 'BTC',
                              from,
                              to: address,
                              value: transaction.amount,
                              explorer: transactionInfo.chain_explorer_url,
                              txhash: transactionInfo.chain_transaction_key,
                              confirmations: transactionInfo.confirmations,
                              confirm: false
                            }
                          }, (err, response, data) => {
                            logger.error('err: ', err);
                          })
                          .on('error', (err) => {
                            logger.error(err);
                          });
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    },

    checkExpireReceipt: (data) => {
      if (!data) {
        return;
      }
      Object.keys(data).forEach((key) => {
        const expirationDate = data[key].expiration_date;
        const address = data[key].public_key;
        const callbackUrl = data[key].callback_url;
        if (data[key]) {
          getTransactionsFromAddress(address, (err, transactions) => {

            if (!err && transactions && transactions.length > 0) {
              transactions.forEach((transaction) => {
                if (transaction && transaction.address === address && transaction.amount > 0 && transaction.category === 'receive') {
                  refDeposit.orderByChild('chain_transaction_key').equalTo(transaction.txid).once('value', (depSnap) => {
                    const dataDep = depSnap.val();
                    if (!dataDep) {
                      const transactionInfo = {
                        transaction_guid: key,
                        chain_transaction_key: transaction.txid,
                        chain_explorer_url: `${BLOCK_EXPLORER_URL}${transaction.txid}`,
                        amount: transaction.amount,
                        deposit_address: address,
                        external_address: transaction.account,
                        status: true,
                        callback_url: callbackUrl,
                        confirmations: transaction.confirmations,
                        created_date: transaction.time
                      };
                      logger.info('found transaction new in check receipt', transactionInfo);
                      refDeposit.child(uuidv4()).set(transactionInfo);

                      getTransactionDetail(transaction.txid, (errDetail, trans) => {
                        let from = '';
                        if (!errDetail && trans && trans.details && trans.details.length > 0) {
                          const sentTransactionId = trans.details.findIndex(t => t.category === 'send');
                          from = trans.details[sentTransactionId]? trans.details[sentTransactionId].address: 0;
                        }
                        logger.info("Access token: ", auth.getAccessToken(), depositTransactionCallback);
                        logger.info('checkWatchdog ------------------- expired');
                        request.post(depositTransactionCallback, {
                          headers: {
                            'Authorization': auth.getAccessToken(),
                            'Content-Type': 'application/json'
                          },
                          json: {
                            symbol: 'BTC',
                            from,
                            to: address,
                            value: transaction.amount,
                            explorer: transactionInfo.chain_explorer_url,
                            txhash: transactionInfo.chain_transaction_key,
                            confirmations: transactionInfo.confirmations,
                            confirm: false
                          }
                        }, (err, response, data) => {
                          logger.error('err: ', err);
                        })
                          .on('error', (err) => {
                            logger.error(err);
                          });
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    },
    checkPendingConfirmations: () => {
      refPendingDeposit.once('value', (snapshot) => {
        logger.info('start check pending deposit confirmation');
        const data = snapshot.val();
        if (data) {
          Object.keys(data).forEach((key) => {
            const depositInfo = data[key];
            request.put(depositInfo.callback_url, {
              headers: {
                'Authorization': auth.getAccessToken(),
                'Content-Type': 'application/json'
              },
              json: {
                amount: depositInfo.amount
              }
            }, (err, response, body) => {
              logger.error('err: ', err);
              if (!err && response.body) {
                refDepositBackup.child(key).set(data[key]);
                refPendingDeposit.child(key).set(null);
              }
            })
            .on('error', (err) => {
              logger.error(err);
            });

            request.post(depositTransactionCallback, {
              headers: {
                'Authorization': auth.getAccessToken(),
                'Content-Type': 'application/json'
              },
              json: {
                symbol: 'BTC',
                from: depositInfo.external_address,
                to: depositInfo.deposit_address,
                value: depositInfo.amount,
                explorer: depositInfo.chain_explorer_url,
                txhash: depositInfo.chain_transaction_key,
                confirmations: depositInfo.confirmations,
                confirm: depositInfo.confirmations >= 2 ? true : false
              }
            }, (err, response, body) => {
              logger.error('depositTransactionCallback error: ', err);
            })
            .on('error', (err) => {
              looger.error('depositTransactionCallback : ', err);
            });

            const confirmPercent = 1;
            // Todo should send confirmation percent via callback hook.
            request.post(depositConfirmCallbackUrl, {
              headers: {
                'Authorization': auth.getAccessToken(),
                'Content-Type': 'application/json'
              },
              json: {
                symbol: 'BTC',
                address: depositInfo.deposit_address,
                txhash: depositInfo.chain_transaction_key,
                confirmPercent: confirmPercent >= 1 ? 100 : confirmPercent * 100
              }
            }, (err, response, data) => {
              logger.error('depositConfirmCallbackUrl error: ', err);
            })
            .on('error', (err) => {
              logger.error('depositConfirmCallbackUrl : ', err);
            });
          });
        }
      });
    },
    checkConfirmations: () => {
      refDeposit.once('value', (snapshot) => {
        console.log('start check deposit confirmation');
        const data = snapshot.val();
        if (data) {
          Object.keys(data).forEach((key) => {
            const depositInfo = data[key];
            if (depositInfo.confirmations < 2) {
              getTransactionDetail(depositInfo.chain_transaction_key, (errDetail, trans) => {
                if (!errDetail) {
                  if (depositInfo.confirmations < trans.confirmations) {
                    depositInfo.confirmations = trans.confirmations;
                    refDeposit.child(key).update({confirmations: trans.confirmations});

                    if (trans.confirmations >= 2) {
                      request.put(depositInfo.callback_url, {
                        headers: {
                          'Authorization': auth.getAccessToken(),
                          'Content-Type': 'application/json'
                        },
                        json: {
                          amount: depositInfo.amount
                        }
                      }, (err, response, data) => {
                        logger.error('err: ', err);
                        if (err) {
                          refDeposit.child(key).update({
                            pending: true
                          });
                        } else {
                          refDeposit.child(key).update({
                            pending: false
                          });
                        }
                      })
                      .on('error', (err) => {
                        logger.error(err);
                      });

                      request.post(depositTransactionCallback, {
                        headers: {
                          'Authorization': auth.getAccessToken(),
                          'Content-Type': 'application/json'
                        },
                        json: {
                          symbol: 'BTC',
                          from: depositInfo.external_address,
                          to: depositInfo.deposit_address,
                          value: depositInfo.amount,
                          explorer: depositInfo.chain_explorer_url,
                          txhash: depositInfo.chain_transaction_key,
                          confirmations: depositInfo.confirmations,
                          confirm: depositInfo.confirmations >= 2 ? true : false
                        }
                      }, (err, response, data) => {
                        logger.error('depositTransactionCallback error: ', err);
                      })
                      .on('error', (err) => {
                        looger.error('depositTransactionCallback : ', err);
                      });
                    }

                    const confirmPercent = Number(parseFloat(trans.confirmations / 2).toFixed(2));
                    // Todo should send confirmation percent via callback hook.
                    request.post(depositConfirmCallbackUrl, {
                      headers: {
                        'Authorization': auth.getAccessToken(),
                        'Content-Type': 'application/json'
                      },
                      json: {
                        symbol: 'BTC',
                        address: depositInfo.deposit_address,
                        txhash: depositInfo.chain_transaction_key,
                        confirmPercent: confirmPercent >= 2 ? 100 : confirmPercent * 100
                      }
                    }, (err, response, data) => {
                      logger.error('depositConfirmCallbackUrl error: ', err);
                    })
                    .on('error', (err) => {
                      logger.error('depositConfirmCallbackUrl : ', err);
                    });
                  }
                }
              });
            } else {
              if (data[key].pending) {
                refPendingDeposit.child(key).once('value', (snapshot) => {
                  const pending = snapshot.val();
                  if (!pending) {
                    refPendingDeposit.child(key).set(data[key]);
                  }
                  if (depositInfo.created_date < Date.now() / 1000 - 22200) {
                    refDeposit.child(key).set(null);
                  }
                });
              } else {
                if (depositInfo.created_date < Date.now() / 1000 - 22200) {
                  refDeposit.child(key).set(null);
                  refDepositBackup.child(key).set(depositInfo);
                }
              }
            }
          });
        }
      });

      refWithdrawal.once('value', (snapshot) => {
        logger.info('start check withdraw confirmation!!!!!!!!!!')
        const data = snapshot.val();
        if (data) {
          Object.keys(data).forEach((key) => {
            const withdrawInfo = data[key];
            if (withdrawInfo.confirmations < 3) {
              getTransactionDetail(withdrawInfo.chain_transaction_key, (errDetail, trans) => {
                if (!errDetail) {
                  logger.info('trans: ', trans);
                  if (withdrawInfo.confirmations < trans.confirmations && trans.confirmations >= 2) {
                    withdrawInfo.confirmations = trans.confirmations;
                    refWithdrawal.child(key).update({confirmations: trans.confirmations});
                    request.post(withdrawTransactionCallback, {
                      headers: {
                        'Authorization': auth.getAccessToken(),
                        'Content-Type': 'application/json'
                      },
                      json: {
                        uuid: withdrawInfo.uuid,
                        to: withdrawInfo.receiver,
                        value: withdrawInfo.amount,
                        explorer: withdrawInfo.chain_explorer_url,
                        txhash: withdrawInfo.chain_transaction_key,
                        confirmations: withdrawInfo.confirmations,
                        confirm: withdrawInfo.confirmations >= 2 ? true : false
                      }
                    }, (err, response, data) => {
                      logger.info('withdrawTransactionCallback error: ', err, data);
                    })
                    .on('error', (err) => {
                      logger.error('withdrawTransactionCallback : ', err);
                    });
                  }
                }
              });
            } else {
              refWithdrawal.child(key).set(null);
              refWithdrawBackup.child(key).set(withdrawInfo);
            }
          });
        }
      });
    }
  };
};

// Getting authorization part
auth.refreshAccessToken();

// Cron for checking expired accounts
moment.duration(10000).timer({ loop: true }, () => {
  refExpireAccount.once('value', (snapshot) => {
    const data = snapshot.val();
    manageAccount().expiredAccounts(data);
    checkWatchdog().checkExpireReceipt(data);
  });
});

// Cron for checking current active accounts
moment.duration(5000).timer({ loop: true }, () => {
  refAccount.once('value', (snapshot) => {
    const data = snapshot.val();
    manageAccount().currentAccounts(data);
    checkWatchdog().checkRecipt(data);
  });
});

// Cron for checking deposit confirmations
moment.duration(60000).timer({ loop: true }, () => {
  checkWatchdog().checkConfirmations();
});

// Cron for checking pending deposit confirmations
moment.duration(120000).timer({ loop: true }, () => {
  checkWatchdog().checkPendingConfirmations();
});

// Cron for rpc sync monitor
moment.duration(60000).timer({ loop: true }, () => {
  logger.info('start rpc monitor cron');
  const current = serverTime().current();

  getLaskBlock((error, blockNumber) => {
    refMonitor.once('value', (snapshot) => {
      const data = snapshot.val();
      if (data == null || (data && data.blockNumber < blockNumber)) {
        refMonitor.set({blockNumber: blockNumber, updatedAt: current});
      }
    });
  });
});

/**
 RPC Call APIs
 */

exports.testScaling = async (req, res) => {
  const count = req.query.count || 10;
  const totalUsages = [];
  const master_wallet_account = config.MASTER_WALLET;

  for (let i = 0; i < count; i++) {
    const account = uuidv4();

    try {
      await new Promise((resolve, reject) => {
        client.call('getnewaddress', [account], (error, depositAddress) => {
          if (error) {
            return reject(err);
          }

          const generateAccount = manageAccount().createAccount(depositAddress, 'test');
          console.log('generateAccount : ', generateAccount);
          if (generateAccount) {
            delete generateAccount.created_date;

            client.call('sendfrom', [master_wallet_account, depositAddress, 0.001], (error, result) => {
              if (error) {
                return reject(err);
              }

              return resolve(result);
            });
          }
          return reject('error');
        });
      });
    } catch (error) {
      logger.error(error);
    }

    const cpuInfo = osu.cpu.average();
    const cpuUsage = await osu.cpu.usage();
    const cpuFree = await osu.cpu.free();
    const cpuCount = osu.cpu.count();

    const memInfo = await osu.mem.info();

    const netInfo = await osu.netstat.stats();
    const netInout = await osu.netstat.inOut();

    totalUsages.push({
      cpuCount,
      cpuInfo,
      cpuUsage,
      cpuFree,
      memInfo,
      netInfo,
      netInout
    });
  }

  return res.status(200).send(totalUsages);
}

/*  *
 * Generate BTC deposit address
 */

exports.generateAddress = (req, res) => {
  const { callback_url } = req.body;
  const account = uuidv4();
  logger.info('create btc addresss', callback_url);
  if (!callback_url) {
    return res.status(400).send('Need callback url');
  }
  try {
    return client.call('getnewaddress', [account], (error, result) => {
      if (error) {
        logger.error('error', error);
        return res.status(404).send(reduceErrorMessage(error));
      }
      logger.info('generate addres00000000', result);
      const generateAccount = manageAccount().createAccount(result, callback_url);
      if (generateAccount) {
        delete generateAccount.created_date;

        return res.status(200).send({
          data: {
            ...generateAccount,
            callback_url
          }
        });
      }
      return res.status(404).send('We have some technical issue');

    });
  } catch (error) {
    return res.status(400).send(reduceErrorMessage(error));
  }
};
/**
 * Validate BTC deposit address
 */
exports.validateAddress = (req, res) => {
  const { account } = req.body;
  if (!account) {
    return res.status(400).send('Invalid address');
  }
  try {
    return client.call('validateaddress', [account], (error, result) => {
      if (error) {
        return res.status(400).send(reduceErrorMessage(error));
      }
      return res.status(200).send(result);
    });
  } catch (error) {
    return res.status(400).send(reduceErrorMessage(error));
  }
};
/**
 * Transfer from Account to address
 */

exports.transfer = (req, res) => {
  const { amount, deposit_address, master_wallet } = req.body;
  let errorMessage = null;
  if (!amount) {
    errorMessage = 'Invalid amount';
  }
  if (!deposit_address) {
    errorMessage = 'Invalid desposit address';
  }
  if (!master_wallet) {
    errorMessage = 'Invalid master account';
  }
  if (errorMessage) {
    return res.status(400).send(errorMessage);
  }
  try {
    return client.call('sendfrom', [master_wallet, deposit_address, amount], (error, result) => {
      if (error) {
        return res.status(400).send('Account has insufficient funds');
      }
      return res.status(200).send(result);
    });
  } catch (error) {
    return res.status(400).send(reduceErrorMessage(error));
  }
};

/**
 * Get all deposit transactions
 */
exports.getDeposits = (req, res) => {
  refDeposit.once('value', (snapshot) => {
    // const data = snapshot.val();
    const result = _.values(snapshot.val());
    return res.status(200).send(result);
  });
};

/**
 * Get a deposit transaction from transaction guid
 */
exports.getDeposit = (req, res) => {
  const { guid } = req.params;
  refDeposit.orderByChild('transaction_guid')
    .equalTo(guid)
    .once('value', (snapshot) => {
      let result = _.values(snapshot.val());
      if (result.length <= 0) {
        refDepositBackup.orderByChild('transaction_guid')
          .equalTo(guid)
          .once('value', (snapshot) => {
            let result = _.values(snapshot.val());
            result = result.length > 0 ? result[0] : null;
            return res.status(200)
              .send(result);
          });
      } else {
        return res.status(200)
          .send(result);
      }
    })
    .catch(err => {
      logger.error(err);
    });
};

/**
 * Get a balance and  transactions from address guid
 */
exports.getBalance = (req, res) => {
  const { a_guid } = req.params;
  refAccount.orderByKey().equalTo(a_guid).once('value', (snapshot) => {
    const address = _.values(snapshot.val());
    if (address && address.length > 0) {
      refDeposit.orderByKey('deposit_address').equalTo(address[0].public_key).once('value', (tsnapshot) => {
        const transactions = _.values(tsnapshot.val());
        if (transactions.length <= 0) {
          refDepositBackup.orderByKey('deposit_address')
            .equalTo(address[0].public_key)
            .once('value', (snapshot) => {
              let result = _.values(snapshot.val());
              result = result.length > 0 ? result[0] : null;
              return res.status(200)
                .send({
                  balance: address[0].balance,
                  public_key: address[0].public_key,
                  transactions: result
                });
            });
        } else {
          return res.status(200).send({
            balance: address[0].balance,
            public_key: address[0].public_key,
            transactions
          });
        }
      });
    } else {
      refExpireAccount.orderByKey().equalTo(a_guid).once('value', (snapshot) => {
        const address = _.values(snapshot.val());
        if (address && address.length > 0) {
          refDeposit.orderByKey('deposit_address').equalTo(address[0].public_key).once('value', (tsnapshot) => {
            const transactions = _.values(tsnapshot.val());
            if (transactions.length <= 0) {
              refDepositBackup.orderByKey('deposit_address')
                .equalTo(address[0].public_key)
                .once('value', (snapshot) => {
                  let result = _.values(snapshot.val());
                  result = result.length > 0 ? result[0] : null;
                  return res.status(200)
                    .send({
                      balance: address[0].balance,
                      public_key: address[0].public_key,
                      transactions: result
                    });
                });
            } else {
              return res.status(200).send({
                balance: address[0].balance,
                public_key: address[0].public_key,
                transactions
              });
            }
          });
        } else {
          res.status(400)
            .send('Invalid address guid');
        }
      });
    }
  });
};


/**
 * Withdrawal
 */

exports.withdrawal = (req, res) => {
  const { amount, receiver, wallet_id, token } = req.body;
  let errorMessage = null;
  if (!amount) {
    errorMessage = 'Invalid amount';
  }
  if (!receiver) {
    errorMessage = 'Invalid receiver address';
  }
  if (errorMessage) {
    return res.status(400).send(errorMessage);
  }
  try {
    getBalanceFromAccount(MASTER_WALLET, (err, balance) => {
      if (!err && balance > amount) {
        return client.call('sendfrom', [MASTER_WALLET, receiver, amount], (errTransfer, result) => {
          const key = uuidv4();
          if (!errTransfer) {
            const transactionInfo = {
              transaction_guid: key,
              chain_transaction_key: result,
              chain_explorer_url: `${BLOCK_EXPLORER_URL}${result}`,
              amount,
              master_wallet: MASTER_WALLET,
              receiver,
              status: true,
              active: false,
              confirmations: 0,
              uuid: wallet_id,
              token: token,
              created_date: serverTime().current(),
            };
            refWithdrawal.child(key).set(transactionInfo);
            return res.status(200).send({
              to: receiver,
              value: amount,
              currency: 'BTC',
              explorer: `${BLOCK_EXPLORER_URL}${result}`,
              txhash: result,
              time: serverTime().current()
            });
          }
          return res.status(400).send('Withdrawal faild. Please try again');
        });
      } else {
        logger.info(err, balance);
        return res.status(400).send('Master wallet balance is not enough');
      }
    });
  } catch (error) {
    logger.error(error);
    return res.status(400).send(reduceErrorMessage(error));
  }
};

/**
 * Get all withdraw transactions
 */
exports.getWithdrawals = (req, res) => {
  refWithdrawal.once('value', (snapshot) => {
    // const data = snapshot.val();
    const result = _.values(snapshot.val());
    return res.status(200).send(result);
  });
};


/**
 * Get all deposit transactions
 */
exports.getTransfers = (req, res) => {
  refTransfer.once('value', (snapshot) => {
    // const data = snapshot.val();
    const result = _.values(snapshot.val());

    return res.status(200).send(result);
  });
};

/**
 * Get a deposit transaction from transaction guid
 */
exports.getTransfer = (req, res) => {
  const { guid } = req.params;
  refTransfer.orderByKey('transaction_guid').equalTo(guid).once('value', (snapshot) => {
    let result = _.values(snapshot.val());
    result = result.length > 0 ? result[0] : null;
    return res.status(200).send(result);
  });
};

exports.callbackWithdraw = (req, res) => {
  logger.info('withdraw Callback');
  return res.status(200).send(req.body.postData);
};

exports.callbackDeposit = (req, res) => {
  logger.info('deposit Callback');
  return res.status(200).send(req.body.postData);
};

exports.getMasterWalletStatus = (req, res) => {
  const master_wallet_account = config.MASTER_WALLET;

  getBalanceFromAccount(master_wallet_account, (err, balance) => {
    if (err) {
      return res.status(400).json({error: err, message: 'Failed to get master wallet balance' });
    }
    return res.status(200).json({ data: balance, balance: 'Account Balances' });
  });
}
