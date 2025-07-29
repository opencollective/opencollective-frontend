const debug = require('debug')('duplicateHandler');

function duplicateHandler({ skip, timeout } = {}) {
  timeout = Number(timeout) || 30;

  const requests = new Map();

  // Garbage collection (not necessary under normal operation)
  const gc = () => {
    const ids = Array.from(requests.keys());
    if (ids.length > 0) {
      debug(`${ids.length} current registered requests`);
    }
    for (const id of ids) {
      const request = requests.get(id);
      if (request.registeredAt < new Date().getTime() - timeout * 1000) {
        requests.delete(id);
      }
    }
  };

  setInterval(gc, 1000);

  return function handleDuplicate(req, res, next) {
    if (skip && skip(req)) {
      next();
      return;
    }

    const id = req.url;
    if (requests.has(id)) {
      debug(`Duplicate request detected '${id}'`);
      const origin = requests.get(id).origin;

      // Prepare for duplicates
      // We're lazily doing it only when the first duplicate arrives
      if (!requests.get(id).duplicates) {
        requests.get(id).duplicates = [];

        const originResMethods = {};
        for (const method of ['setHeader', 'end']) {
          // Copy original methods
          originResMethods[method] = origin.res[method];

          origin.res[method] = function () {
            // Apply on the origin method
            originResMethods[method].apply(origin.res, arguments);

            // Apply on duplicates method
            const request = requests.get(id);
            if (request) {
              for (const duplicate of request.duplicates) {
                // Copy properties because we don't listen when they're set
                if (method === 'send') {
                  duplicate.res.statusCode = origin.res.statusCode;
                  duplicate.res.statusMessage = origin.res.statusMessage;
                }

                duplicate.res[method].apply(duplicate.res, arguments);
              }
            }
          };
        }
      }

      // Make sure to copy headers from origin response
      for (const [key, value] of Object.entries(origin.res.getHeaders())) {
        res.setHeader(key, value);
      }

      // Registering duplicate
      requests.get(id).duplicates.push({ req, res, next });

      // That's all, wait on origin response to complete
      return;
    }

    // Registering origin request
    requests.set(id, {
      registeredAt: new Date().getTime(),
      origin: { req, res, next },
    });

    // Release origin request
    req.on('close', () => requests.delete(id));
    res.on('end', () => requests.delete(id));
    res.on('finish', () => requests.delete(id));

    return next();
  };
}

module.exports = duplicateHandler;
