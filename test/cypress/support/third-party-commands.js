/**
 * From https://github.com/NoriSte/cypress-wait-until/blob/master/src/index.js
 */

const logCommand = ({ options, originalOptions }) => {
  if (options.log) {
    options.logger({
      name: options.description,
      message: options.customMessage,
      consoleProps: () => originalOptions,
    });
  }
};

const logCommandCheck = ({ result, options, originalOptions }) => {
  if (!options.log || !options.verbose) {
    return;
  }

  const message = [result];
  if (options.customCheckMessage) {
    message.unshift(options.customCheckMessage);
  }
  options.logger({
    name: options.description,
    message,
    consoleProps: () => originalOptions,
  });
};

const waitUntil = (subject, checkFunction, originalOptions = {}) => {
  if (!(checkFunction instanceof Function)) {
    throw new Error(`"checkFunction" parameter should be a function. Found: ${checkFunction}`);
  }

  const defaultOptions = {
    // base options
    interval: 200,
    timeout: 5000,
    errorMsg: 'Timed out retrying',

    // log options
    description: 'waitUntil',
    log: true,
    customMessage: undefined,
    logger: Cypress.log,
    verbose: false,
    customCheckMessage: undefined,
  };
  const options = { ...defaultOptions, ...originalOptions };

  // filter out a falsy passed "customMessage" value
  options.customMessage = [options.customMessage, originalOptions].filter(Boolean);

  let retries = Math.floor(options.timeout / options.interval);

  logCommand({ options, originalOptions });

  const check = result => {
    logCommandCheck({ result, options, originalOptions });
    if (result) {
      return result;
    }
    if (retries < 1) {
      const msg = options.errorMsg instanceof Function ? options.errorMsg(result, options) : options.errorMsg;
      throw new Error(msg);
    }
    cy.wait(options.interval, { log: false }).then(() => {
      retries--;
      return resolveValue();
    });
  };

  const resolveValue = () => {
    const result = checkFunction(subject);

    const isAPromise = Boolean(result && result.then);
    if (isAPromise) {
      return result.then(check);
    } else {
      return check(result);
    }
  };

  return resolveValue();
};

Cypress.Commands.add('waitUntil', { prevSubject: 'optional' }, waitUntil);
