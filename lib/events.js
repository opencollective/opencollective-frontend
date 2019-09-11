import { get } from 'lodash';

/**
 * Check if the given event is over. Ideally we would just rely on the date, but
 * as there can be timezones differences we add an additional security by keeping
 * tickets up to 24h after the event is over.
 */
export const canOrderTicketsFromEvent = event => {
  if (!event.endsAt) {
    return true;
  }

  const oneDay = 24 * 60 * 60 * 1000;
  const isOverSince = new Date().getTime() - new Date(event.endsAt).getTime();
  return isOverSince < oneDay;
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
