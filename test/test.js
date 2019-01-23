let chai = require('chai');
var should = require('chai').should();
let chaiHttp = require('chai-http');
let server = require('../app');
chai.use(chaiHttp);
config = require('../config/config');
let tokens = {};


describe('Access Token and assign it to a token', () => {
  before((done) => {
    chai.request(server)
      .post('auth')
      .set('Authorization', tokens.accessToken)
      .send({
        uid: config.db.uid
      }).end((err, res) => {
        tokens.accessToken = res.body.accessToken;
        done();
      });
  });
});

describe('Login API - /auth/login', () => {
  it('should get accessToken', (done) => {
    chai.request(server)
      .post('/auth')
      .send({
        uid: config.db.uid
      })
      .end((err, res) => {
        tokens.accessToken = res.body.accessToken;
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('accessToken');
        done();
      });
  });
});

describe('Login API fail - /auth/login', () => {
  it('should get accessToken', (done) => {
    chai.request(server)
      .post('/auth')
      .send({
        uid: 'abc12123'
      })
      .end((err, res) => {
        should.not.exist(err);
        done();
      });
  });
});

 //Information about the module
describe('/Bitcoin Information', () => {
  it('it should get public information about Bitcoin module', (done) => {
    chai.request(server)
      .get('/')
      .set('Authorization', tokens.accessToken)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.should.be.json;
        res.body.should.have.property('name');
        res.body.should.have.property('symbol');
        res.body.should.have.property('decimal');
        res.body.should.have.property('url');
        done();
      });
  });
});
describe('/It should Fail of getting the Bitcoin Module', () => {
  it('it should fail about getting Information', (done) => {
    chai.request(server)
      .post('/')
      .set('Authorization', tokens.accessToken)
      .end((err, res) => {
        should.not.exist(err);
        res.should.have.status(404);
        done();
      });
  });
});
describe('/Put Bitcoin Information', () => {
  it('it should fail updating  Information', (done) => {
    chai.request(server)
      .put('/')
      .set('Authorization', tokens.accessToken)
      .end((err, res) => {
        should.not.exist(err);
        res.should.have.status(404);
        done();
      });
  });
});

describe('/Bitcoin Information', () => {
  it('it should get public information about Bitcoin module', (done) => {
    chai.request(server)
      .get('/')
      .end((err, res) => {
        res.should.have.status(401);
        done();
      });
  });
});

//Deposit create account testing
describe('/POST Bitcoin deposit/address', () => {
  it('it should return an deposit address', (done) => {
    let obj = { callback_url: 'https://www.strokentokens.com' };
    chai.request(server)
      .post('/deposit/address')
      .set('Authorization', tokens.accessToken)
      .send(obj)
      .end((err, res) => {
        account = res.body.data.should.have.property('address_guid');
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.data.should.have.property('address_guid');
        res.body.data.should.have.property('public_key');
        res.body.data.should.have.property('expiration_date');
        res.body.data.should.have.property('balance');
        res.body.data.should.have.property('callback_url');
        done();
      })
      .timeout(40000);
  });
});

describe('/POST fail Bitcoin deposit/address', () => {
  it('it should fail on returning deposit address', (done) => {
    let obj = {
      callback_url: ''
    };
    chai.request(server)
      .post('/deposit/address')
      .set('Authorization', tokens.accessToken)
      .send(obj)
      .end((err, res) => {
        should.not.exist(err);
        done();
      })
      .timeout(40000);
  });
});

describe('/Unauthorized Should fail to update', () => {
  it('it should get status 401', (done) => {
    let obj = {
      callback_url: ''
    };
    chai.request(server)
      .put('/deposit/address')
      .send(obj)
      .end((err, res) => {
        should.not.exist(err);
        res.should.have.status(401);
        done();
      });
  });
});


// Deposit history
describe('/POST Should return deposit history', () => {
  it('it should return an deposit address', (done) => {
    chai.request(server)
      .get('/deposit')
      .set('Authorization', tokens.accessToken)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
  })
    .timeout(40000);
});

describe('/POST Should return deposit history', () => {
  it('it should return an deposit address', (done) => {
    chai.request(server)
      .post('/deposit')
      .set('Authorization', tokens.accessToken)
      .end((err, res) => {
        should.not.exist(err);
        done();
      });
  });
});

describe('Unauthorized Should Fail ', () => {
  it('should get status 401', (done) => {
    chai.request(server)
      .get('/deposit')
      .end((err, res) => {
        should.not.exist(err);
        res.should.have.status(401);
        done();
      });
  });
});

describe('Get deposit transaction - /Deposit{transaction_guid}', () => {
  it('should get status 400 with object', (done) => {
    chai.request(server)
      .get('/deposit/testfail')
      .set('Authorization', tokens.accessToken)
      .send()
      .end((err, res) => {
        should.not.exist(err);
        done();
      });
  });
});

describe('Post deposit transaction - /Deposit{transaction_guid}', () => {
  it('should get status 404 with object', (done) => {
    chai.request(server)
      .post('/deposi/cb66d959-c037-43f7-9878-c162934868a3')
      .set('Authorization', tokens.accessToken)
      .send()
      .end((err, res) => {
        res.should.have.status(404);
        done();
      })
      .timeout(40000);
  });
});



describe('Unauthorized deposit transaction', () => {
  it('should get status 401', (done) => {
    chai.request(server)
      .post('/deposit/cb66d959-c037-43f7-9878-c162934868a3')
      .send()
      .end((err, res) => {
        should.not.exist(err);
        res.should.have.status(401);
        done();
      });
  });
});

//Transactions Address History By guid
 /* Todo Need to look up on transaction or Deposit history to get transaction history and current account backup  No Uid*/

describe('put- /Deposit/address{transaction_guid}', () => {
  it('should get status of 400', (done) => {
    chai.request(server)
      .put('/deposit/address/as')
      .set('Authorization', tokens.accessToken)
      .send()
      .end((err, res) => {
        should.not.exist(err);
        res.should.have.status(404);
        done();
      });
  });
});

describe('Unauthorized- /Deposit/address{transaction_guid}', () => {
  it('should get status of 401', (done) => {
    chai.request(server)
      .put('/deposit/address/as')
      .send()
      .end((err, res) => {
        should.not.exist(err);
        res.should.have.status(401);
        done();
      });
  });
});

describe('/GET /Withdrawal', () => {
  it('View all withdrawal transactions under the current authorized user', (done) => {
    chai.request(server)
      .get('/withdrawal')
      .set('Authorization', tokens.accessToken)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
  });
});

describe('/Unauthorized Get /Withdrawal', () => {
  it('Should get Status 401', (done) => {
    chai.request(server)
      .put('/withdrawal')
      .end((err, res) => {
        should.not.exist(err);
        res.should.have.status(401);
        done();
      });
  });
});


describe('Unauthorized Post/Withdrawal', () => {
  it('It should return status 401', (done) => {
    let obj = {
      receiver: '2N4J4JrnekjHT2SxFREvzbhcHUnUjZDd2iw',
      amount: 0.01,
      callback_url: 'https://strokentokens.com',
      wallet_id: 0121,
      token: 'btc'
    };
    chai.request(server)
      .post('/withdrawal')
      .send(obj)
      .end((err, res) => {
        console.log(obj);
        res.should.have.status(401);
        done();
      });
  });
});

describe('Transfer by guid ', () => {
  it('It should return status 200', (done) => {
    chai.request(server)
      .get('/transfer/537bc668-320b-4f4f-bf81-c8cea9eebec9')
      .set('Authorization', tokens.accessToken)
      .send()
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('amount');
        res.body.should.have.property('created_date');
        res.body.should.have.property('deposit_address');
        res.body.should.have.property('master_wallet');
        res.body.should.have.property('status');
        res.body.should.have.property('transaction_guid');
        done();
      });
  });
});

describe('Transfer by guid ', () => {
  it('It should return status 200 found', (done) => {
    chai.request(server)
      .put('/transfer/c4fe6926-1596-4459-b7b1-627dc21b9485')
      .set('Authorization', tokens.accessToken)
      .send()
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });
});

describe('Transfer by guid ', () => {
  it('It should return status 401 not found', (done) => {
    chai.request(server)
      .post('/transfer/537bc668-320b-4f4f-bf81-c8cea9eebec9s')
      .send()
      .end((err, res) => {
        res.should.have.status(401);
        done();
      });
  });
});
//Validate Address
describe('validate Address ', () => {
  it('It should return status 200', (done) => {
    let obj = {
      account:'2MvQ1W3dZzjjpKzvGQo7sNykXctXUK8jvTa' };
    chai.request(server)
      .post('/validate-address')
      .set('Authorization', tokens.accessToken)
      .send(obj)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('isvalid');
        res.body.should.have.property('address');
        res.body.should.have.property('scriptPubKey');
        res.body.should.have.property('ismine');
        res.body.should.have.property('iswatchonly');
        res.body.should.have.property('isscript');
        res.body.should.have.property('iswitness');
        res.body.should.have.property('hex');
        res.body.should.have.property('pubkey');
        res.body.should.have.property('addresses');
        res.body.should.have.property('account');
        res.body.should.have.property('timestamp');
        res.body.should.have.property('hdkeypath');
        res.body.should.have.property('hdmasterkeyid');
        done();
      })
  });
});

describe('Unauthorized validate Address ', () => {
  it('It should return status 401', (done) => {
    let obj = {
      account:'2MvQ1W3dZzjjpKzvGQo7sNykXctXUK8jvTa'
    };
    chai.request(server)
      .post('/validate-address')
      .send(obj)

      .end((err, res) => {
        res.should.have.status(401);
        done();
      })
  });
});

describe('No found Address ', () => {
  it('It should return status 404', (done) => {
    let obj = {
      account:'2MvQ1W3dZzjjpKzvGQo7sNykXctXUK8jvTa'
    };
    chai.request(server)
      .get('/validate-address')
      .set('Authorization', tokens.accessToken)
      .send(obj)
      .end((err, res) => {
        res.should.have.status(404);
        done();
      })
  });
});
//Callback callback address

describe('Authorize callback Address ', () => {
  it('It should return status 200', (done) => {
    let obj = {
      postData:'http://pornhub/.com'
    };
    chai.request(server)
      .post('/callback-withdraw')
      .set('Authorization', tokens.accessToken)
      .send(obj)
      .end((err, res) => {
        res.should.have.status(200);
        done();
      })
  });
});

describe('Authorize callback Address ', () => {
  it('It should return status 404', (done) => {
    let obj = {
      postData:'http://pornhub/.com'
    };
    chai.request(server)
      .get('/callback-withdraw')
      .set('Authorization', tokens.accessToken)
      .send(obj)
      .end((err, res) => {
        res.should.have.status(404);
        done();
      })
  });
});

describe('uathorize callback Address ', () => {
  it('It should return status 401', (done) => {
    let obj = {
      postData:'http://pornhub/.com'
    };
    chai.request(server)
      .post('/callback-withdraw')
      .send(obj)
      .end((err, res) => {
        res.should.have.status(401);
        done();
      })
  });
});

//Get Wallet balance
describe('Master Wallet Balance', () => {
  it('It return status 200', (done) => {
    chai.request(server)
      .get('/master/wallet/balance')
      .set('Authorization', tokens.accessToken)
      .send()
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('data');
        res.body.should.have.property('balance');
        done();
      });
  });
});

describe('Post Master Wallet Balance', () => {
  it('It return status 404', (done) => {
    chai.request(server)
      .put('/master/wallet/balances')
      .set('Authorization', tokens.accessToken)
      .send()
      .end((err, res) => {
        res.should.have.status(404);
        done();
      });
  });
});

describe('Put Master Wallet Balance', () => {
  it('It return status 404', (done) => {
    chai.request(server)
      .put('/master/wallet/balances')
      .set('Authorization', tokens.accessToken)
      .send()
      .end((err, res) => {
        res.should.have.status(404);
        done();
      });
  });
});

describe('Master Wallet Balance', () => {
  it('It return status 401', (done) => {
    chai.request(server)
      .get('/master/wallet/balance')
      .send()
      .end((err, res) => {
        res.should.have.status(401);
        done();
      });
  });
});

/* Monitors for Monitor Server, Monitor Rpc, Monitor Syncing, Monitor Db */
describe('MonitorServer', () => {
  it('It return status 200', (done) => {
    chai.request(server)
      .get('/monitor')
      .set('Authorization', tokens.accessToken)
      .send()
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });
});

describe('Unauthorized MonitorServer', () => {
  it('It  return status 401', (done) => {
    chai.request(server)
      .get('/monitor')
      .send()
      .end((err, res) => {
        res.should.have.status(401);
        done();
      });
  });
});

describe('Put MonitorServer', () => {
  it('It return status 404', (done) => {
    chai.request(server)
      .put('/monitor')
      .set('Authorization', tokens.accessToken)
      .send()
      .end((err, res) => {
        res.should.have.status(404);
        done();
      });
  });
});

describe('Post MonitorServer', () => {
  it('It return status 404', (done) => {
    chai.request(server)
      .post('/monitor')
      .set('Authorization', tokens.accessToken)
      .send()
      .end((err, res) => {
        res.should.have.status(404);
        done();
      });
  });
});

describe('Monitor Syncing', () => {
  it('It return status 200', (done) => {
    chai.request(server)
      .get('/monitor/syncing')
      .set('Authorization', tokens.accessToken)
      .send()
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });
});

describe('Unauthorized Monitor Syncing', () => {
  it('It  return status 401', (done) => {
    chai.request(server)
      .get('/monitor/syncing')
      .send()
      .end((err, res) => {
        res.should.have.status(401);
        done();
      });
  });
});

describe('Put Monitor Syncing', () => {
  it('It return status 404', (done) => {
    chai.request(server)
      .get('/monitor/syncing')
      .set('Authorization', tokens.accessToken)
      .send()
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });
});

describe('Post Monitor Syncing', () => {
  it('It return status 404', (done) => {
    chai.request(server)
      .post('/monitor/syncing')
      .set('Authorization', tokens.accessToken)
      .send()
      .end((err, res) => {
        res.should.have.status(404);
        done();
      });
  });
});

describe('Monitor Db', () => {
  it('It return status 200', (done) => {
    chai.request(server)
      .get('/monitor/db')
      .set('Authorization', tokens.accessToken)
      .send()
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });
});

describe('Unauthorized Monitor Db', () => {
  it('It  return status 401', (done) => {
    chai.request(server)
      .get('/monitor/db')
      .send()
      .end((err, res) => {
        res.should.have.status(401);
        done();
      });
  });
});

describe('Put Monitor Db', () => {
  it('It return status 404', (done) => {
    chai.request(server)
      .get('/monitor/db')
      .set('Authorization', tokens.accessToken)
      .send()
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });
});

describe('Post Monitor Db', () => {
  it('It return status 404', (done) => {
    chai.request(server)
      .post('/monitor/db')
      .set('Authorization', tokens.accessToken)
      .send()
      .end((err, res) => {
        res.should.have.status(404);
        done();
      });
  });
});

describe('/post /Withdrawal', () => {
  it('View all withdrawal transactions under the current authorized user', (done) => {
    chai.request(server)
      .put('/withdrawal')
      .set('Authorization', tokens.accessToken)
      .end((err, res) => {
        should.not.exist(err);
        res.should.have.status(404);
        done();
      });
  });
});

describe('/Post /Withdrawal', () => {
  it('It should withdrawal from master wallet', (done) => {
    let obj = {
      receiver: '2N4J4JrnekjHT2SxFREvzbhcHUnUjZDd2iw',
      amount: 0.01,
      callback_url: 'https://strokentokens.com',
      wallet_id: 0121,
      token: 'btc'
    };
    chai.request(server)
      .post('/withdrawal')
      .set('Authorization', tokens.accessToken)
      .send(obj)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('to');
        res.body.should.have.property('value');
        res.body.should.have.property('currency');
        res.body.should.have.property('explorer');
        res.body.should.have.property('txhash');
        res.body.should.have.property('time');
        done();
      });
  });
});


describe('Unauthorized Put/Withdrawal', () => {
  it('It should return status 401', (done) => {
    let obj = {
      receiver: '2N4J4JrnekjHT2SxFREvzbhcHUnUjZDd2iw',
      amount: 0.01,
      callback_url: 'https://strokentokens.com',
      wallet_id: 0121,
      token: 'btc'
    };
    chai.request(server)
      .post('/withdraws')
      .send(obj)
      .end((err, res) => {
        res.should.have.status(401);
        done();
      });
  });


  describe('Get transfer history Infomation  ', () => {
    it('It should return status 401', (done) => {
      chai.request(server)
        .get('/transfer')
        .send()
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });


    Next
    One
    !
      describe('Get transfer history Infomation  ', () => {
        it('It should return status 404', (done) => {
          chai.request(server)
            .put('/transfers')
            .set('Authorization', tokens.accessToken)
            .send()
            .end((err, res) => {
              res.should.have.status(404);
              done();
            });
        });
      });

    describe('/PUT Should fail to update', () => {
      it('it should fail on updating deposit address', (done) => {
        let obj = {
          callback_url: 'www.pornhub.com'
        };
        chai.request(server)
          .put('/deposit/address')
          .set('Authorization', tokens.accessToken)
          .send(obj)
          .end((err, res) => {
            should.not.exist(err);
            done();
          })
          .timeout(40000);
      });
    });

    describe('/PUT Should fail to update', () => {
      it('it should fail on updating deposit address', (done) => {
        let obj = {
          callback_url: 'www.pornhub.com'
        };
        chai.request(server)
          .put('/deposit/address')
          .set('Authorization', tokens.accessToken)
          .send(obj)
          .end((err, res) => {
            should.not.exist(err);
            done();
          })
          .timeout(40000);
      });
    });

    describe('/put fail Should return deposit history', () => {
      it('should get status 404', (done) => {
        chai.request(server)
          .put('/deposit')
          .set('Authorization', tokens.accessToken)
          .end((err, res) => {
            res.should.have.status(404);
            done();
          })
          .timeout(40000);
      });
    });


//Deposit{transaction_guid}
    describe('Get deposit transaction - /Deposit{transaction_guid}', () => {
      it('should get status 200 with object', (done) => {
        chai.request(server)
          .get('/deposit/09cddd6d-8277-4fec-bc5a-b3c5ffc8990b')
          .set('Authorization', tokens.accessToken)
          .send()
          .end((err, res) => {
            res.should.have.status(200);
            done();
          });
      });
    });

    describe('Put deposit transaction - /Deposit{transaction_guid}', () => {
      it('should get status 404 with object', (done) => {
        chai.request(server)
          .put('/deposit/09cddd6d-8277-4fec-bc5a-b3c5ffc8990b')
          .set('Authorization', tokens.accessToken)
          .send()
          .end((err, res) => {
            should.not.exist(err);
            res.should.have.status(404);
            done();
          })
          .timeout(40000);
      });
    });

  })
})

