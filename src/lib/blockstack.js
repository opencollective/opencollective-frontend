import { UserSession, AppConfig } from 'blockstack';

export const appConfig = new AppConfig(['email'], 'http://127.0.0.1:3000', null, '/static/manifest.json');

export function createUserSession() {
  const userSession = new UserSession({ appConfig });
  return userSession;
}
