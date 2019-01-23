# Bitcoin Sevices

## Install Bitcoin node
https://degreesofzero.com/article/building-bitcoind-from-source-on-ubuntu.html  
https://github.com/mmgen/mmgen/wiki/Install-Bitcoind-from-Source-on-Debian-or-Ubuntu-Linux  
https://degreesofzero.com/article/installing-bitcoind-on-ubuntu.html

### bitcoin.conf
```
rpcuser=test
rpcpassword=test
rpcport=8332
server=1
daemon=1
#regtest=1
#testnet=1
txindex=1
#dbcache=1024
#prune=1000
#walletnotify=/var/www/cron/receive.sh %s
#keypool=1000000
```

### run
>bitcoind

### checking rpc
>bitcoin-cli getnetworkinfo

## Run module-bitcoin

### Run bitcoin daemon
### Run mongod
### Run project
- configure project (config/index.js)  
- npm install  
- pm2 start index.js  
