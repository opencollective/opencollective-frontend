import { get, some } from 'lodash';

/**
 * Returns true if the event is passed
 */
export const isPastEvent = event => {
  if (!event.endsAt) {
    return false;
  } else {
    const oneDay = 24 * 60 * 60 * 1000;
    const isOverSince = new Date().getTime() - new Date(event.endsAt).getTime();
    return isOverSince > oneDay;
  }
};

/**
 * Check if any tickets were created or if a given event is over. Ideally we would
 * just rely on the date, but as there can be timezones differences we add an
 * additional security by keeping tickets up to 24h after the event is over.
 */
export const canOrderTicketsFromEvent = event => {
  return !isPastEvent(event) && some(event.tiers, { type: 'TICKET' });
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
