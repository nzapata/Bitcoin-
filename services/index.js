const apiRouter = require('../routes');
module.exports = function (app) {
  app.use(apiRouter());
};
