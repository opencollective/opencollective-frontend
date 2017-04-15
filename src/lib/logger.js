import 'isomorphic-fetch'

const log = (type) => {
  return async function() {
    const message = Array.prototype.slice.call(arguments, 0).join(' ');
    const baseUrl = (typeof window !== 'undefined') ? `${window.location.protocol}//${window.location.host}` : 'http://localhost:3000';
    const url = `${baseUrl}/log/${type}?message=${encodeURIComponent(message)}`;
    return await fetch(url).catch(e => console.error("Unable to fetch", url, e));
  }
}

const logger = {
  info: log('info'),
  error: log('error')
};

export { logger }