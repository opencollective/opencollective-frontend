import { expect } from 'chai';
import * as utils from '../test/utils';
import models from '../server/models';

const { Event, User, Group, Response } = models;

describe('event.model.test.js', () => {
  let collective, event, users;

  beforeEach('reset db', () => utils.resetTestDB());

  beforeEach('create collective', () => Group.create(utils.data('group1')).then(g => collective = g));
  beforeEach('create an event', () => Event.create(utils.data('event1')).then(e => event = e));

  beforeEach('create many users', () => {
    return User.createMany([utils.data('user1'), utils.data('user2'), utils.data('user3'), utils.data('user4')])
      .then(res => users = res)
  });

  beforeEach('creates many responses', () => {
    const responsesArray = [];
    users.forEach(u => responsesArray.push({ UserId: u.id }));
    return Response.createMany(responsesArray, { GroupId: collective.id, EventId: event.id, status: 'YES' })
      .catch(e => console.error("error creating response", e));
  });

  it('gets the list of users for an event and dedupe them', () => {
    const response = {
      GroupId: collective.id,
      EventId: event.id,
      status: 'INTERESTED'
    };
    return users[0].createResponse(response)
      .then(() => Response.count())
      .then(count => expect(count).to.equal(5))
      .then(() => event.getUsers())
      .then(users => expect(users.length).to.equal(4));
  })
});