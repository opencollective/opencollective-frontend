export const getActiveYearsOptions = host => {
  const currentYear = new Date().getFullYear();
  const firstYear = host ? parseInt(host.createdAt.split('-')[0]) : currentYear;
  const activeYears = [...Array(currentYear - firstYear + 1).keys()].map(year => year + firstYear);
  return activeYears.map(year => ({ value: year, label: year })).reverse();
};

export const formatAmountForLegend = (value, currency, locale) => {
  return new Intl.NumberFormat(locale, {
    currency,
    style: 'currency',
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
};
