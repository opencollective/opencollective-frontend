export const TwoFactorAuthenticationHeader = 'x-two-factor-authentication';

export function setPreferredTwoFactorMethod(method: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('preferredTwoFactorMethod', method);
  }
}

export function getPreferredTwoFactorMethod(): string {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('preferredTwoFactorMethod');
  }

  return null;
}
