const debug = require('debug')('duplicateHandler');

function duplicateHandler({ keyGenerator, skip, timeout } = {}) {
  timeout = Number(timeout) || 30;

  const requests = {};

  // Garbage collection (not necessary under normal operation)
  const gc = () => {
    const ids = Object.keys(requests);
    if (ids.length > 0) {
      debug(`${ids.length} current registered requests`);
    }
    for (const id of ids) {
      if (requests[id].registeredAt < new Date().getTime() - timeout * 1000) {
        delete requests[id];
      }
    }
  };

  setInterval(gc, 1000);

  return function handleDuplicate(req, res, next) {
    if (skip && skip(req)) {
      next();
      return;
    }

    const id = keyGenerator ? keyGenerator(req) : req.url;

    if (requests[id]) {
      debug(`Duplicate request detected '${id}'`);
      const origin = requests[id].origin;

      // Prepare for duplicates
      // We're lazily doing it only when the first duplicate arrives
      if (!requests[id].duplicates) {
        requests[id].duplicates = [];

        const originResMethods = {};
        for (const method of ['setHeader', 'end']) {
          // Copy original methods
          originResMethods[method] = origin.res[method];

          origin.res[method] = function () {
            // Apply on the origin method
            originResMethods[method].apply(origin.res, arguments);

            // Apply on duplicates method
            for (const duplicate of requests[id].duplicates) {
              // Copy properties because we don't listen when their set
              if (method === 'send') {
                duplicate.res.statusCode = origin.res.statusCode;
                duplicate.res.statusMessage = origin.res.statusMessage;
              }

              duplicate.res[method].apply(duplicate.res, arguments);
            }
          };
        }
      }

      // Make sure to copy headers from origin response
      for (const [key, value] of Object.entries(origin.res.getHeaders())) {
        res.setHeader(key, value);
      }

      // Registering duplicate
      requests[id].duplicates.push({ req, res, next });

      // That's all, wait on origin response to complete
      return;
    }

    // Registering origin request
    requests[id] = {
      registeredAt: new Date().getTime(),
      origin: { req, res, next },
    };

    // Release origin request
    req.on('close', () => delete requests[id]);
    res.on('end', () => delete requests[id]);
    res.on('finish', () => delete requests[id]);

    return next();
  };
}

module.exports = duplicateHandler;
