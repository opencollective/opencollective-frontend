export default function getDashboardObjectIdURL(objectId: string, accountId?: string) {
  const url = new URL(
    process.env.OC_ENV === 'production'
      ? `https://dashboard.stripe.com/id/${objectId}`
      : `https://dashboard.stripe.com/test/id/${objectId}`,
  );

  if (accountId) {
    url.searchParams.set('account', accountId);
  }

  return url.toString();
}
