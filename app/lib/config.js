module.exports = function(app) {

  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  app.set('env', process.env.NODE_ENV);

}
