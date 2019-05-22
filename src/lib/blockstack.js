import { UserSession, AppConfig, SessionDataStore } from 'blockstack';
import { parseCookies, setCookie, destroyCookie } from 'nookies';

export const appConfig = new AppConfig(['email'], 'http://127.0.0.1:3000', null, '/static/manifest.json');

class NookieSessionStore extends SessionDataStore {
  constructor() {
    super();
  }

  getSessionData() {
    console.log(parseCookies({}));
    return parseCookies({}).sessionData;
  }

  setSessionData(sessionData) {
    setCookie({}, 'sessionData', sessionData, {
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });
  }

  deleteSessionData() {
    destroyCookie({}, 'sessionData');
    return true;
  }
}

export function createUserSession() {
  const sessionStore = new NookieSessionStore();
  return new UserSession({ appConfig, sessionStore });
}

export function redirectToSignIn(userSession, next) {
  userSession.redirectToSignIn(`${appConfig.appDomain}/signin/blockstack?${next}`);
}

export function handlePendingSignIn(userSession, authResponse) {
  return userSession.handlePendingSignIn(authResponse);
}
