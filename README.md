# OpenCollective frontend for Events

We are developing this new frontend for OpenCollective.com using [create-react-app](https://github.com/facebookincubator/create-react-app).
Our goal is to speed up development time thanks to Webpack and hot-module-reloading.

We also want to simplify the stack by removing Redux which seems overkill for our use (at least for now).

We are starting by implementing the new Events feature, as described in https://github.com/OpenCollective/OpenCollective/issues/177

As we were brainstorming about the architecture ([whiteboard](https://cl.ly/3j160b3j203C/DB%20schema%20for%20events.jpg)), we realized that an Event is actually a collective on its own. Like a collective, an Event can have revenue and expenses. And tickets are the equivalent of the different membership/sponsorship Tiers of a collective. 
Likewise, a campaign to raise money for a certain feature is also an "Event" where the tickets are the equivalent of the different "rewards" that you can find on crowdfunding platforms.
So we have a path towards progressively move the entire frontend to this new architecture.

But, let's go step by step and for now the goal is to release the ability for a collective to create an event, issue tickets at different prices (including free and discounted prices for existing members), and check in the guests.

## TODO

- [x] Implement the EventPage (including Google Maps)
- [x] Implement the flow to show your interest for an event
- [x] Implement the flow to register to a free event
- [ ] Implement the flow to register to a paid event
- [ ] Implement the flow to register for a password protected ticket
- [ ] Implement the flow for creating/editing an event
- [ ] Find a solution for Server Side Rendering (SSR)
