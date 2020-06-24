const parseToBooleanDefaultFalse = value => {
  if (value === null || value === undefined || value === '') {
    return false;
  }
  const string = value.toString().trim().toLowerCase();
  return ['on', 'enabled', '1', 'true', 'yes'].includes(string);
};

module.exports = { parseToBooleanDefaultFalse };
