var os         = require('os');
var exec       = require('child_process').exec;
var async      = require('async');
var started_at = new Date();

module.exports = function(req, res, next) {

  var server = req.app;
  var errors = server.errors;

  if (req.query.info) {
    var connections = {};
    var swap;

    async.parallel([
      function(done) {
        exec('netstat -an | grep :80 | wc -l', function(e, res) {
          connections['80'] = parseInt(res, 10);
          done();
        });
      },
      function(done) {
        exec('netstat -an | grep :' + server.set('port') + ' | wc -l', function(e, res) {
          connections[server.set('port')] = parseInt(res, 10);
          done();
        });
      },
      function(done) {
        exec('vmstat -SM -s | grep "used swap" | sed -E "s/[^0-9]*([0-9]{1,8}).*/\1/"', function(e, res) {
          swap = res;
          done();
        });
      }], function(e) {
        res.send({
          status: 'up',
          version: server.set('version'),

          // sha        : server.set('git sha'),
          started_at: started_at,
          node: {
            version: process.version,
            memoryUsage: Math.round(process.memoryUsage().rss / 1024 / 1024) + "M",
            uptime: process.uptime()
          },
          system: {
            loadavg: os.loadavg(),
            freeMemory: Math.round(os.freemem() / 1024 / 1024) + "M"
          },
          env: process.env.NODE_ENV,
          hostname: os.hostname(),
          connections: connections,
          swap: swap
        });
      });
  }
  else {
    res.json({status:'up'});
  }
}
