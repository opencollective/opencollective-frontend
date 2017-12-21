function set(key, value, ttl) {
  const expire = new Date(Date.now() + ttl).getTime();
  localStorage.setItem(key, JSON.stringify({ timestamp: new Date().getTime(), expire, value }));
}

function get(key) {
  const entry = localStorage.getItem(key);
  if (!entry) return;
  try {
    const obj = JSON.parse(entry);
    console.log(">>> storage: object found for ", key, obj);
    if (Number(obj.expire) < Date.now()) {
      console.error(">>> entry for ", key, "has expired");
      return;
    }
    return obj.value;
  } catch (e) {
    console.error(">>> unable to parse entry for ", key, "entry: ", entry);
    return;
  }
}

export default {
  set,
  get
}