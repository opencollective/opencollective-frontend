/**
 * Used to make sure the value stays memoized (because [] !== [])
 * See https://codesandbox.io/s/long-flower-mzsqx?file=/src/App.js
 */
export const EMPTY_ARRAY = Object.freeze([]);

export const sleep = async (timeout = 200) =>
  new Promise(resolve => {
    setTimeout(resolve, timeout);
  });
