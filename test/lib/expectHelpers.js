module.exports = {

  badRequest(req, message) {
    req.expect(400, {
      error: {
        code: 400,
        type: 'bad_request',
        message
      }
    })
  },

  missingRequired(req, field) {
    return req.expect(400, {
      error: {
        code: 400,
        type: 'missing_required',
        message: 'Missing required fields',
        fields: {
          [field]: `Required field ${field} missing`
        }
      }
    })
  }
};
