const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const config = require('./config/config');

app.set('config', config);
app.use(require('cors')());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(require('./config/firebase').verifyAuth);
app.use('', require('./routes'));
app.server = require('http').createServer(app);
app.listen(config.server.port,() =>{
  console.log(`Server started on ${config.server.port}`);
});
module.exports = app.server;
