// NOTE: it seems we need it otherwise Cypress mocks (cy.route) will not work
import fetch from 'cross-fetch';

import { ApiError, createError, ERROR } from './errors';
import { exportFile } from './export_file';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from './local-storage';
import { isRelativeHref } from './url-helpers';
import { isValidEmail, repeatWithInterval } from './utils';

const queryString = params => {
  return Object.keys(params)
    .map(k => `${k}=${encodeURIComponent(params[k])}`)
    .join('&');
};

/**
 * The Promise returned from fetch() won't reject on HTTP error status. We
 * need to throw an error ourselves.
 */
function checkResponseStatus(response) {
  const { status } = response;
  if (status >= 200 && status < 300) {
    return response.json();
  } else {
    return (
      response
        .json()
        // Text errors
        .catch(() => {
          const error = new Error(response.statusText);
          error.response = response;
          throw error;
        })
        // JSON errors
        .then(json => {
          const error = new ApiError(json.error);
          error.json = json;
          error.response = response;
          throw error;
        })
    );
  }
}

export function addAuthTokenToHeader(obj = {}) {
  const accessToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
  if (!accessToken) {
    return obj;
  }
  return {
    Authorization: `Bearer ${accessToken}`,
    ...obj,
  };
}

const getFormDataForFile = (file, kind) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('Content-Type', file.type);
  formData.append('kind', kind);
  formData.append('fileName', file.name);
  return formData;
};

/**
 * Uploads the given image.
 */
export function upload(file, kind) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  const formData = getFormDataForFile(file, kind);
  return fetch('/api/images', {
    method: 'post',
    headers: addAuthTokenToHeader(),
    body: formData,
  })
    .then(checkResponseStatus)
    .then(json => {
      return json.url;
    });
}

/**
 * Similar to `upload` but uses XHR, which gives us the ability
 * to watch for upload progress (not yet supported by fetch).
 *
 * @param `onProgress` - function called with upload progress as a number [0-100]
 * @param mockImage - An image to return in test environments
 */
export function uploadImageWithXHR(file, kind, { onProgress, onSuccess, onFailure, mockImage }) {
  return new Promise((resolve, reject) => {
    if (window.location.hostname === 'localhost' && mockImage) {
      if (mockImage === true) {
        mockImage = 'https://d.pr/free/i/OlQVIb+';
      }

      const timeToWait = 2500;
      const nbIterations = 10; // 10%
      const interval = timeToWait / nbIterations;
      setTimeout(() => resolve(mockImage), timeToWait);
      repeatWithInterval(nbIterations, interval, nbIterationsLeft => {
        onProgress(((nbIterations - nbIterationsLeft) / nbIterations) * 100);
      });
      return;
    }

    // Get file content into FileData
    const formData = getFormDataForFile(file, kind);

    // Build request
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/images', true);
    xhr.setRequestHeader('Authorization', addAuthTokenToHeader().Authorization);

    if (onProgress) {
      const minProgress = 5;
      onProgress(minProgress);
      xhr.upload.onprogress = event => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(Math.max(progress, minProgress));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) {
          onProgress(100);
        }
        if (onSuccess) {
          onSuccess(JSON.parse(xhr.responseText).url);
        }

        resolve(JSON.parse(xhr.responseText).url);
      } else {
        reject();
        if (onFailure) {
          onFailure();
        }
      }
    };

    xhr.send(formData);
  });
}

export function connectAccount(CollectiveId, service, options = {}) {
  const params = {
    redirect: options.redirect || window.location.href.replace(/\?.*/, ''),
    CollectiveId,
    ...options,
  };

  return fetch(`/api/connected-accounts/${service}/oauthUrl?${queryString(params)}`, {
    method: 'get',
    headers: addAuthTokenToHeader(),
  }).then(checkResponseStatus);
}

export function disconnectAccount(collectiveId, service) {
  return fetch(`/api/connected-accounts/${service}/disconnect/${collectiveId}`, {
    method: 'delete',
    headers: addAuthTokenToHeader(),
  }).then(checkResponseStatus);
}

export function checkUserExistence(email) {
  if (!isValidEmail(email)) {
    return Promise.resolve(false);
  }
  return fetch(`/api/users/exists?email=${encodeURIComponent(email)}`)
    .then(checkResponseStatus)
    .then(json => Boolean(json.exists));
}

export function signin(parameters) {
  return fetch('/api/users/signin', {
    method: 'POST',
    headers: {
      ...addAuthTokenToHeader(),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(parameters),
  }).then(checkResponseStatus);
}

/* Exchange signin token against session token */
export async function exchangeLoginToken(currentToken) {
  const response = await fetch('/api/users/exchange-login-token', {
    method: 'POST',
    headers: { Authorization: `Bearer ${currentToken}` },
  });
  try {
    return await response.json();
  } catch (error) {
    return { error: response.statusText };
  }
}

/* Exchange session token against newer session token */
export async function refreshToken(currentToken) {
  const response = await fetch('/api/users/refresh-token', {
    method: 'POST',
    headers: { Authorization: `Bearer ${currentToken}` },
  });
  try {
    return await response.json();
  } catch (error) {
    return { error: response.statusText };
  }
}

export async function refreshTokenWithTwoFactorCode(
  currentToken,
  { twoFactorAuthenticatorCode, twoFactorAuthenticationType },
) {
  return fetch('/api/users/two-factor-auth', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${currentToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ twoFactorAuthenticatorCode, twoFactorAuthenticationType }),
  })
    .then(checkResponseStatus)
    .then(result => result.token);
}

/**
 * Fetch the given file from `path`. Must be a local path, otherwise
 * `options.allowExternal` must be explicitely set. You should be **extremely**
 * careful when using this as an attacker abusing from this option could
 * be able to fetch arbitrary files to our servers.
 *
 * @param options {Object}
 *  - format {string} Format of the file to get (currently supports csv and blob)
 *  - allowExtenal {string} An external URL from which get is allowed to fetch
 */
export function get(path, options = {}) {
  const { allowExternal, format } = options;
  if (!isRelativeHref(path) && (!allowExternal || !path.startsWith(allowExternal))) {
    throw new Error('Can only get resources with a relative path');
  }

  return fetch(path, {
    method: 'get',
    headers: addAuthTokenToHeader(),
  }).then(response => {
    if (format === 'csv') {
      return response.text();
    }
    if (format === 'blob') {
      return response.blob();
    }
    return checkResponseStatus(response);
  });
}
/**
 * Fetch a file from PDF service.
 */
export async function fetchFromPDFService(url) {
  if (!url.startsWith(process.env.PDF_SERVICE_URL)) {
    throw new Error('PDF service URL is not properly set');
  }

  return fetch(url, { method: 'get', headers: addAuthTokenToHeader() }).then(response => {
    const { status } = response;
    if (status >= 200 && status < 300) {
      return response.blob();
    } else {
      return response.json().then(json => {
        const error = new Error();
        throw Object.assign(error, json);
      });
    }
  });
}

/**
 * Fetch a CSV file, usually from the REST service
 */
export async function fetchCSVFileFromRESTService(url, filename, { isAuthenticated = true } = {}) {
  const fetchParams = { method: 'GET' };
  if (isAuthenticated) {
    const accessToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    fetchParams.headers = { Authorization: `Bearer ${accessToken}` };
  }

  let response;
  try {
    response = await fetch(url, fetchParams);
  } catch {
    throw createError(ERROR.NETWORK);
  }

  const content = response && (await response.text());
  if (!response?.ok) {
    throw new createError(ERROR.UNKNOWN, { message: content });
  }

  return exportFile('text/csv;charset=utf-8', `${filename}.csv`, content);
}

export function getGithubRepos(accessToken) {
  // NOTE: it's tempting to move the access token to the Authorization HTTP header
  // But we need to make sure it works well with Cypress ci.intercept
  return fetch(`/api/github-repositories?access_token=${accessToken}`).then(checkResponseStatus);
}

export function sendContactMessage(body) {
  return fetch('/contact/send-message', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }).then(checkResponseStatus);
}
