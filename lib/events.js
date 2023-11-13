import { get, orderBy, partition } from 'lodash';

/**
 * Returns true if the event is passed.
 * @param {object} event
 * @param {object} options
 * @param {number} options.gracePeriodInDays - the number of days after the event ends that it's still considered as "current"
 */
export const isPastEvent = (event, { gracePeriodInDays = 1 } = {}) => {
  if (!event.endsAt) {
    return false;
  } else {
    const oneDay = gracePeriodInDays * 24 * 60 * 60 * 1000;
    const isOverSince = new Date().getTime() - new Date(event.endsAt).getTime();
    return isOverSince > oneDay;
  }
};

/**
 * Can only withraw the money from event if it's over.
 */
export const moneyCanMoveFromEvent = event => {
  if (get(event, 'stats.balance', 0) <= 0) {
    return false;
  }

  return new Date().getTime() >= new Date(event.endsAt).getTime();
};

export const sortEvents = events => {
  // eslint-disable-next-line react/display-name
  const getDate = column => event => (!event[column] ? null : new Date(event[column]));
  const [pastEvents, presentEvents] = partition(events, isPastEvent);
  const iteratees = [getDate('startsAt'), getDate('endsAt'), 'id'];
  return [
    ...orderBy(presentEvents, iteratees, ['asc', 'asc', 'asc']),
    ...orderBy(pastEvents, iteratees, ['desc', 'desc', 'desc']),
  ];
};
