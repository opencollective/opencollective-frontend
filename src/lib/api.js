import fetch from 'isomorphic-fetch';
import { isValidEmail } from './utils';
// Webpack error: Cannot find module 'webpack/lib/RequestShortener'
// import queryString from 'query-string';

const queryString = (params) => {
  return Object.keys(params)
  .map(k => `${k}=${encodeURIComponent(params[k])}`)
  .join('&');  
}

/**
 * The Promise returned from fetch() won't reject on HTTP error status. We
 * need to throw an error ourselves.
 */
export function checkResponseStatus(response) {
  const { status } = response;
  if (status >= 200 && status < 300) {
    return response.json();
  } else {
    return response.json()
    .then((json) => {
      const error = new Error(json.error ? json.error.message : json.code);
      error.json = json;
      error.response = response;
      throw error;
    });
  }
}

function addAuthTokenToHeader(obj = {}) {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) return obj;
  return {
    Authorization: `Bearer ${accessToken}`,
    ...obj,
  };
}

export function upload(file) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  const formData = new FormData();
  formData.append('file', file);
  return fetch('/api/images', {
    method: 'post',
    headers: addAuthTokenToHeader(),
    body: formData,
  })
  .then(checkResponseStatus)
  .then(json => {
    console.log(">>> upload response", json);
    return json.url;
  })
}

export function connectAccount(CollectiveId, service) {

  const params = {
    redirect: window.location.href.replace(/\?.*/,''),
    CollectiveId
  };

  return fetch(`/api/connected-accounts/${service}/oauthUrl?${queryString(params)}`, {
      method: 'get',
      headers: addAuthTokenToHeader()
    })
    .then(checkResponseStatus);
}

export function checkUserExistence(email) {
  if (!isValidEmail(email)) return Promise.resolve(false);
  return fetch(`/api/users/exists?email=${encodeURIComponent(email)}`)
    .then(checkResponseStatus)
    .then(json => Boolean(json.exists));
}

export function getFxRate(fromCurrency, toCurrency, date = 'latest') {
  return fetch(`/api/fxrate/${fromCurrency}/${toCurrency}/${date}`)
    .then(checkResponseStatus)
    .then(json => Number(json.fxrate));
}

/**
 * Old api
 * Expecting order = { name, email, totalAmount, description, privateMessage }
 */
export function addFunds(CollectiveId, order) {
  return fetch(`/api/groups/${CollectiveId}/donations/manual`, {
    method: 'POST',
    headers: {
      ...addAuthTokenToHeader(),
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ order })
  })
  .then(checkResponseStatus);
}

export function signin(user, redirect) {
  return fetch('/api/users/signin', {
    method: 'POST',
    headers: {
      ...addAuthTokenToHeader(),
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ user, redirect })
  })
  .then(checkResponseStatus);
}

export function get(path, options) {
  if (path.substr(0,1) !== '/') throw new Error("Can only get resources with a relative path");

  return fetch(path, {
    method: 'get',
    headers: addAuthTokenToHeader()
  })
  .then(response => {
    if (options.format === 'csv') return response.text();
    return checkResponseStatus(response);
  })
}
