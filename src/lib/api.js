import fetch from 'isomorphic-fetch';
import { isValidEmail } from './utils';

/**
 * The Promise returned from fetch() won't reject on HTTP error status. We
 * need to throw an error ourselves.
 */
export function checkFetchResponseStatus(response) {
  console.log(">>> checkStatus", response);
  const { status } = response;
  if (status >= 200 && status < 300) {
    return response.json();
  } else {
    return response.json()
    .then((json) => {
      const error = new Error(json.error.message);
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
    .then(checkFetchResponseStatus);
}

export function checkUserExistence(email) {
  if (!isValidEmail(email)) return Promise.resolve(false);
  return fetch(`/api/users/exists?email=${email}`)
    .then(checkFetchResponseStatus)
    .then(json => Boolean(json.exists));  
}

