const INTERVALS = {
  oneTime: 'oneTime',
  week: 'week',
  month: 'month',
  year: 'year',
  flexible: 'flexible',
};

export const getGQLV2FrequencyFromInterval = interval => {
  switch (interval) {
    case INTERVALS.week:
      return 'WEEKLY';
    case INTERVALS.month:
      return 'MONTHLY';
    case INTERVALS.year:
      return 'YEARLY';
    default:
      return 'ONETIME';
  }
};

export default INTERVALS;
