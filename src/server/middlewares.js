import expressSession from 'express-session';
import ua from 'universal-analytics';

const { GOOGLE_ANALYTICS_ACCOUNT } = process.env;
/**
 * Google Analytics middleware
 * This exposes the following methods to record events:
 * req.ga.pageview();
 * req.ga.event(EventCategory, EventName, EventLabel, EventValue);
 */
export const ga = (req, res, next) => {

  if (!GOOGLE_ANALYTICS_ACCOUNT) {
    req.ga = {
      pageview: () => {
        console.log(">>> ga: recording page view event for ", req.url);
      },
      event: (EventCategory, EventName, EventLabel, EventValue) => {
        console.log(">>> ga: recording event", { EventCategory, EventName, EventLabel, EventValue });
      }
    }
    return next();
  }
  // We generate a session to be able to keep track of requests coming from the same visitor
  const session = expressSession({
    httpOnly: true,
    secret: 'b4;jP(cUqPaf8TuG@U',
    cookie: {
      secure: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging',
      maxAge: 60*60*24*30*1000 // 1 month
    }
  });

  const mw = ua.middleware(GOOGLE_ANALYTICS_ACCOUNT, { cookieName: '_ga' });

  session(req, res, () => {
    mw(req, res, next);
    req.ga = {
      pageview: () => req.visitor.pageview(req.url).send(),
      event: (EventCategory, EventName, EventLabel, EventValue) => req.visitor.event(EventCategory, EventName, EventLabel, EventValue, {p: req.url}).send()
    }
  });
};