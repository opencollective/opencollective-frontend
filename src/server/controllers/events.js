import { logger } from '../logger';
import { fetchEvent, fetchEvents } from '../lib/graphql';


export async function list(req, res, next) {
  // Keeping the resulting info for 10m in the CDN cache
  res.setHeader('Cache-Control', `public, max-age=${60*10}`);
  let allEvents;
  try {
    logger.debug('>>> events.list fetching: %s', req.params.collectiveSlug);
    allEvents = await fetchEvents(req.params.collectiveSlug);
    allEvents = allEvents.map(e => {
      e.url = `https://opencollective.com/${req.params.collectiveSlug}/events/${e.slug}`;
      e.info = `https://opencollective.com/${req.params.collectiveSlug}/events/${e.slug}.json`;
      return e;
    })
    logger.debug('>>> events.list allEvents: %j', allEvents);
    res.send(allEvents);
  } catch (e) {
    if (e.message.match(/No collective found/)) {
      return res.status(404).send("Not found");
    }
    logger.debug('>>> events.list error', e);
    return next(e);
  }
}

export async function info(req, res, next) {
  // Keeping the resulting info for 10m in the CDN cache
  res.setHeader('Cache-Control', `public, max-age=${60*10}`);
  let event;
  try {
    logger.debug('>>> events.info fetching: %s', req.params.eventSlug);
    event = await fetchEvent(req.params.eventSlug);
    event.url = `https://opencollective.com/${req.params.collectiveSlug}/events/${event.slug}`;
    event.attendees = `https://opencollective.com/${req.params.collectiveSlug}/events/${event.slug}/attendees.json`;
    logger.debug('>>> events.info event: %j', event);
    res.send(event);
  } catch (e) {
    if (e.message.match(/No collective found/)) {
      return res.status(404).send("Not found");
    }
    logger.debug('>>> events.info error', e);
    return next(e);
  }

}
