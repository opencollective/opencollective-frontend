var fs = require('fs')
  , status = require('../lib/status.js')
  ;

module.exports = function(app) {

  /** 
   * Status.
   */
  app.get('/status', status);


  /**
   * Error handler.
   */
  app.use(function(err, req, res, next) {
    if (err.name === 'UnauthorizedError') // because of jwt-express
      err.code = err.status;
    res.header('Cache-Control', 'no-cache');
    if (!err.code) 
      err.code = err.status || 500;
    console.log('Error : ', err);
    res.send(err.code, {error: err});
  });

};
