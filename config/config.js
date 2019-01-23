const env = process.env.NODE_ENV || 'development';

const rpc = require('json-rpc2');
const localNode = rpc.Client.$create(
  '8332', // RPC_PORT
  // '52.23.202.13', // RPC_HOST
  '34.234.225.93',
  'stoken', // RPC_USER
  'stoken' // RPC_PASS
);

const development = {
  db: {
    host: 'localhost',
    port: 27017,
    name: 'bitcoin-db',
    uid:'2yPxVL4IOLgimBSBpMUMLcVYhoF2'
  },
  cron: {
    duration: 100
  },
  server: {
    name: 'bitcoin',
    symbol: 'BTC',
    decimal: 8,
    url: 'http://localhost',
    port: 3030,
    test:3031
  },
  localNode,
  BLOCK_EXPLORER_URL: 'https://blockexplorer.com/tx/',
  MASTER_WALLET: 'master_wallet',
  // Firebase Information
  firebase_dbname: 'BTC-WANG',
  FirebaseCredential: '../firebaseJson/dev/dev-strokenapi-firebase-adminsdk-0fnr3-b164c79a59.json',
  apiKey: 'AIzaSyBnoIvkhYxz9vKzNytfCfs54rwap0H-0jA',
  authDomain: 'dev-strokenapi.firebaseapp.com',
  databaseUrl: 'https://dev-strokenapi.firebaseio.com',
  projectId: 'dev-strokenapi',
  storageBucket: 'dev-strokenapi.appspot.com',
  messagingSenderId: '514038380243',
  companyAccount: '0x86E4C07B189F0F42002F4622E91c136C105FaB68',
  companySecret: 'bf1c4e37ebca36153e79336d8424c6d787ae9c6b2c74edbf2aae11bf8a0e91e7',
  depositTransactionCallback: 'http://localhost:3000/api/v1/users/deposit_transactions',
  updateBalanceCallback: 'http://localhost:3000/api/v1/users/wallets',
  withdrawTransactionCallback: 'http://localhost:3000/api/v1/users/withdrawal_transactions',
  depositConfirmCallbackUrl: 'http://localhost:3000/api/v1/users/deposit_confirmation_percent',
  blockSyncTime: 3600000
};
const staging = {
  db: {
    host: 'localhost',
    port: 27017,
    name: 'bitcoin-db',
    uid: '2yPxVL4IOLgimBSBpMUMLcVYhoF2'
  },
  cron: {
    duration: 100,
  },
  server: {
    url: 'http://localhost',
    name: 'bitcoin',
    symbol: 'BTC',
    decimal: '8',
    port: 3030,
    test:3031
  },
  localNode,
  BLOCK_EXPLORER_URL: 'https://blockexplorer.com/tx/',
  MASTER_WALLET: 'master_wallet',
  firebase_dbname: 'BTC-STAGING',
  FirebaseCredential: '../firebaseJson/stating/staging-b32eb-firebase-adminsdk-48fw8-850cbcef23.json',
  apiKey: 'AIzaSyADWqqSL4VUh0LRqXvuWPNrL4jajUqHYEc',
  authDomain: 'staging-b32eb.firebaseapp.com',
  databaseUrl: 'https://staging-b32eb.firebaseio.com',
  projectId: 'staging-b32eb',
  storageBucket: 'staging-b32eb.appspot.com',
  messagingSenderId: '73515148465',
  companyAccount: '0x86E4C07B189F0F42002F4622E91c136C105FaB68',
  companySecret: 'bf1c4e37ebca36153e79336d8424c6d787ae9c6b2c74edbf2aae11bf8a0e91e7',
  depositTransactionCallback: 'http://staging.app.strokentokens.com/api/v1/users/deposit_transactions',
  updateBalanceCallback: 'http://staging.app.strokentokens.com/api/v1/users/wallets',
  withdrawTransactionCallback: 'http://staging.app.strokentokens.com/api/v1/users/withdrawal_transactions',
  depositConfirmCallbackUrl: 'http://staging.app.strokentokens.com/api/v1/users/deposit_confirmation_percent',
  blockSyncTime: 3600000
};

const onprem = {
  db: {
    host: 'localhost',
    port: 27017,
    name: 'bitcoin-db',
    uid: '9NreP7KGaQOuur4LIF8M8S7ytNN2'
  },
  cron: {
    duration: 100,
  },
  server: {
    url: 'http://localhost',
    name: 'bitcoin',
    symbol: 'BTC',
    decimal: '8',
    port: 3030,
    test:3031
  },
  localNode,
  BLOCK_EXPLORER_URL: 'https://blockexplorer.com/tx/',
  MASTER_WALLET: 'master_wallet',
  firebase_dbname: 'BTC-ONPREM',
  FirebaseCredential: '../firebaseJson/prem/onprem-strokenapi-firebase-adminsdk-nv4dj-0a7014dc31.json',
  apiKey: 'AIzaSyA_DT90QwSOLr5KPm8aeYA7YokSNIZDi3I',
  authDomain: 'onprem-strokenapi.firebaseapp.com',
  databaseUrl: 'https://onprem-strokenapi.firebaseio.com',
  projectId: 'onprem-strokenapi',
  storageBucket: 'onprem-strokenapi.appspot.com',
  messagingSenderId: '1050541423908',
  companyAccount: '0x86E4C07B189F0F42002F4622E91c136C105FaB68',
  companySecret: 'bf1c4e37ebca36153e79336d8424c6d787ae9c6b2c74edbf2aae11bf8a0e91e7',
  depositTransactionCallback: 'http://onprem.app.strokentokens.com/api/v1/users/deposit_transactions',
  updateBalanceCallback: 'http://onprem.app.strokentokens.com/api/v1/users/wallets',
  withdrawTransactionCallback: 'http://onprem.app.strokentokens.com/api/v1/users/withdrawal_transactions',
  depositConfirmCallbackUrl: 'http://onprem.app.strokentokens.com/api/v1/users/deposit_confirmation_percent',
  blockSyncTime: 3600000
};

const production = {
  db: {
    host: 'localhost',
    port: 27017,
    name: 'bitcoin-db',
    uid:'lMBnoHQ3PxQSpMwiHGrh6gfeUJ23'
  },
  cron: {
    duration: 100,
  },
  server: {
    url: 'http://module-bitcoin.strokentokens.com',
    name: 'bitcoin',
    symbol: 'BTC',
    decimal: '8',
    port: 3030,
    test:3031
  },
  localNode: rpc.Client.$create(
    '8332', // RPC_PORT
    '54.234.250.255',
    'stroken', // RPC_USER
    'StrokenTokens.com' // RPC_PASS
  ),
  BLOCK_EXPLORER_URL: 'https://blockexplorer.com/tx/',
  MASTER_WALLET: 'master_wallet',
  firebase_dbname: 'BTC-PROD',
  FirebaseCredential: '../firebaseJson/prod/pro-strokenapi-firebase-adminsdk-ko9bd-da92bcd6cd.json',
  apiKey: 'AIzaSyDOfpCwfrYU0fQRuTgoFN1hhRea6kaQysE',
  authDomain: 'pro-strokenapi.firebaseapp.com',
  databaseUrl: 'https://pro-strokenapi.firebaseio.com',
  projectId: 'pro-strokenapi',
  storageBucket: 'pro-strokenapi.appspot.com',
  messagingSenderId: '1046736823152',
  companyAccount: '0x86E4C07B189F0F42002F4622E91c136C105FaB68',
  companySecret: 'bf1c4e37ebca36153e79336d8424c6d787ae9c6b2c74edbf2aae11bf8a0e91e7',
  depositTransactionCallback: 'http://app.strokentokens.com/api/v1/users/deposit_transactions',
  updateBalanceCallback: 'http://app.strokentokens.com/api/v1/users/wallets',
  withdrawTransactionCallback: 'http://app.strokentokens.com/api/v1/users/withdrawal_transactions',
  depositConfirmCallbackUrl: 'http://app.strokentokens.com/api/v1/users/deposit_confirmation_percent',
  blockSyncTime: 3600000
};

const config = {
  development,
  onprem,
  staging,
  production
};
module.exports = config[env];
