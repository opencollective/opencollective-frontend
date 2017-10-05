import fetch from 'isomorphic-fetch';
import { isValidEmail } from './utils';

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

export function fetchConnectedAccount(CollectiveId, service) {
  return fetch(`/api/connected-accounts/${service}?CollectiveId=${CollectiveId}`, {
      method: 'get',
      headers: addAuthTokenToHeader()
    })
    .then(checkResponseStatus);
}

export function checkUserExistence(email) {
  if (!isValidEmail(email)) return Promise.resolve(false);
  return fetch(`/api/users/exists?email=${email}`)
    .then(checkResponseStatus)
    .then(json => Boolean(json.exists));
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