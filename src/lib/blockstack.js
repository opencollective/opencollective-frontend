import { UserSession, AppConfig } from 'blockstack';

export function createUserSession() {
  const appConfig = new AppConfig(['email'], window.location.origin);
  const userSession = new UserSession({ appConfig });
  return userSession;
}
