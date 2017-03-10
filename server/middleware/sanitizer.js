import sanitize from 'sanitize-html';
import lodashEach from 'lodash/collection/forEach';

 
export default (config) => {
  return (req, res, next) => {
    if (req.body) {
      req.body = sanitizeHelper(req.body);
    }
    return next();
  };
};

const sanitizeHelper = (value) => {
  if (typeof value === 'string') {
    //value = value.replace(/<script>.*<\/script>/); // remove all script tags and anything in the middle.
    //value = value.replace(/<.*?>/gi, ''); // for other tags, only remove the tags
    value = value.replace(/&gt;/gi, '>');
    value = value.replace(/&lt;/gi, '<');
    value = value.replace(/(&copy;|&quot;|&amp;)/gi, '');
    return sanitize(value, {
                        allowedTags: []
                    });

  } else if (typeof value === 'object') {
    lodashEach(value, (val, key) => {
      value[key] = sanitizeHelper(val);
    })
  }
  return value;
}

