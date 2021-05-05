import { getFromLocalStorage, removeFromLocalStorage, setLocalStorage } from './local-storage';

function set(key, value, ttl = 1000 * 60 * 60) {
  if (!value) {
    return removeFromLocalStorage(key);
  }
  const expire = new Date(Date.now() + ttl).getTime();
  setLocalStorage(key, JSON.stringify({ timestamp: new Date().getTime(), expire, value }));
}

function get(key) {
  const entry = getFromLocalStorage(key);
  if (!entry) {
    return;
  }
  try {
    const obj = JSON.parse(entry);
    if (Number(obj.expire) < Date.now()) {
      // eslint-disable-next-line no-console
      console.error('>>> entry for ', key, 'has expired');
      return;
    }
    return obj.value;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('>>> unable to parse entry for ', key, 'entry: ', entry);
    return;
  }
}

export default {
  set,
  get,
};
