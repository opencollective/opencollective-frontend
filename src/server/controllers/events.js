import { fetchEvent, fetchEvents } from '../lib/graphql';

export async function list(req, res, next) {
  // Keeping the resulting info for 10m in the CDN cache
  res.setHeader('Cache-Control', `public, max-age=${60*10}`);
  let allEvents;
  try {
    allEvents = await fetchEvents(req.params.collectiveSlug);
    allEvents = allEvents.map(e => {
      e.url = `https://opencollective.com/${req.params.collectiveSlug}/events/${e.slug}`;
      e.info = `https://opencollective.com/${req.params.collectiveSlug}/events/${e.slug}.json`;
      return e;
    })
    console.log(allEvents);
    res.send(allEvents);
  } catch (e) {
    if (e.message.match(/No collective found/)) {
      return res.status(404).send("Not found");
    }
    console.log(">>> error message", e.message);
    return next(e);
  }
}

export async function info(req, res, next) {
  // Keeping the resulting info for 10m in the CDN cache
  res.setHeader('Cache-Control', `public, max-age=${60*10}`);
  let event;
  try {
    console.log(">>> fetching", req.params.eventSlug);
    event = await fetchEvent(req.params.eventSlug);
    event.url = `https://opencollective.com/${req.params.collectiveSlug}/events/${event.slug}`;
    event.attendees = `https://opencollective.com/${req.params.collectiveSlug}/events/${event.slug}/attendees.json`;
    console.log(event);
    res.send(event);
  } catch (e) {
    if (e.message.match(/No collective found/)) {
      return res.status(404).send("Not found");
    }
    console.log(">>> error message", e.message);
    return next(e);
  }

}