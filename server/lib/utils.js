export const queryString = {
  stringify: obj => {
    let str = '';
    for (const key in obj) {
      if (str != '') {
        str += '&';
      }
      str += `${key}=${encodeURIComponent(obj[key])}`;
    }
    return str;
  },
  parse: query => {
    if (!query) return {};
    const vars = query.split('&');
    const res = {};
    for (let i = 0; i < vars.length; i++) {
      const pair = vars[i].split('=');
      res[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    return res;
  },
};
