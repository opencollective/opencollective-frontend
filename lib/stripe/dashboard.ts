export function getDashboardObjectIdURL(objectId: string, accountId?: string) {
  return getDashboardUrl(`id/${objectId}`, accountId);
}

export function getDashboardUrl(path: string, accountId?: string) {
  const url = new URL(
    process.env.OC_ENV === 'production'
      ? `https://dashboard.stripe.com/${path}`
      : `https://dashboard.stripe.com/test/${path}`,
  );

  if (accountId) {
    url.searchParams.set('account', accountId);
  }

  return url.toString();
}
