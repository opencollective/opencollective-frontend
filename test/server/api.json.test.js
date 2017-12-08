import r2 from 'r2';
import fetch from 'node-fetch';

const WEBSITE_URL = process.env.WEBSITE_URL || "https://staging.opencollective.com";

const cacheBurst = `?cacheBurst=${Math.round(Math.random()*100000)}`;

const validateMember = (member) => {
  expect(member).toHaveProperty('email', null);
  expect(member).toHaveProperty('MemberId');
  expect(member).toHaveProperty('name');
  expect(member).toHaveProperty('image');
  expect(member).toHaveProperty('twitter');
  expect(member).toHaveProperty('github');
  expect(member).toHaveProperty('website');
  expect(member).toHaveProperty('profile');
  expect(member).toHaveProperty('isActive');
  expect(member).toHaveProperty('lastTransactionAt');
  expect(member).toHaveProperty('lastTransactionAmount');
  expect(member).toHaveProperty('totalAmountDonated');
}

describe("api.json.test.js", () => {

  describe("collective", () => {

    test("return /:collectiveSlug/members.json", async () => {
      const res = await r2(`${WEBSITE_URL}/railsgirlsatl/members.json${cacheBurst}`).json;
      expect(res.length).toBeGreaterThan(5);
      validateMember(res[0]);
    });

    test("return /:collectiveSlug/members/organizations.json", async () => {
      const res = await r2(`${WEBSITE_URL}/railsgirlsatl/members/organizations.json${cacheBurst}`).json;
      expect(res.length).toBeGreaterThan(2);
      validateMember(res[0]);
      expect(res[0].type).toEqual('ORGANIZATION');
      expect(res[1].type).toEqual('ORGANIZATION');
    });
  });

  describe("event", () => {

    test("return /:collectiveSlug/events/:eventSlug/attendees.json", async () => {
      const res = await r2(`${WEBSITE_URL}/veganizerbxl/events/superfilles/attendees.json${cacheBurst}`).json;
      validateMember(res[0]);
      expect(res[0].role).toEqual('ATTENDEE');
      expect(res[1].role).toEqual('ATTENDEE');
    });

    test("return /:collectiveSlug/events/:eventSlug/followers.json", async () => {
      const res = await r2(`${WEBSITE_URL}/veganizerbxl/events/superfilles/followers.json${cacheBurst}`).json;
      validateMember(res[0]);
      expect(res[0].role).toEqual('FOLLOWER');
      expect(res[1].role).toEqual('FOLLOWER');
    });

    test("return /:collectiveSlug/events/:eventSlug/organizers.json", async () => {
      const res = await r2(`${WEBSITE_URL}/veganizerbxl/events/superfilles/organizers.json${cacheBurst}`).json;
      validateMember(res[0]);
      expect(res[0].role).toEqual('ADMIN');
      expect(res[1].role).toEqual('ADMIN');
    });

  });


});