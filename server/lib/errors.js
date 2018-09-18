const errors = {
  BadRequest(msg) {
    this.code = 400;
    this.type = 'bad_request';
    this.message = msg;
    Error.call(this, msg);
  },

  ValidationFailed(type, fields, msg) {
    this.code = 400;
    this.type = type || 'validation_failed';
    this.message = msg || 'Missing required fields';
    this.fields = fields;
  },

  Unauthorized(msg) {
    this.code = 401;
    this.type = 'unauthorized';
    this.message = msg;
    Error.call(this, msg);
  },

  Forbidden(msg) {
    this.code = 403;
    this.type = 'forbidden';
    this.message = msg;
    Error.call(this, msg);
  },

  SpamDetected(msg) {
    this.code = 403;
    this.type = 'spam_detected';
    this.message = msg;
    Error.call(this, msg);
  },

  NotFound(msg) {
    this.code = 404;
    this.type = 'not_found';
    this.message = msg;
    Error.call(this, msg);
  },

  ServerError(msg) {
    this.code = 500;
    this.type = 'server_error';
    this.message = msg;
    Error.call(this, msg);
  },

  Timeout(url, ms) {
    this.code = 408;
    this.timeout = ms;
    this.type = 'timeout';
    this.message = `Request to ${url} timed out after ${ms} ms.`;
    Error.call(this, this.message);
  },

  ConflictError(msg, data) {
    this.code = 409;
    this.type = 'conflict';
    this.message = msg;
    if (data) this.data = data;
    Error.call(this, msg);
  },

  NotImplemented(msg) {
    this.code = 501;
    this.type = 'not_implemented';
    this.message = msg || 'This is not implemented.';
    Error.call(this, msg);
  },

  CustomError(code, type, msg) {
    this.code = code;
    this.type = type;
    this.message = msg;
    Error.call(this, msg);
  },
};

Object.keys(errors).forEach(error => {
  errors[error].prototype.__proto__ = Error.prototype;
});

Error.prototype.info = function() {
  const result = {
    type: this.type,
    message: this.message || '',
    fields: this.fields,
    data: this.data,
  };

  if (!this.code || this.code >= 500) {
    result.type = 'internal_error';
    result.message += ' Something went wrong.';
  }

  return result;
};

export default errors;
