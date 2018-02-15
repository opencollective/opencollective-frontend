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

    test("return /:collectiveSlug.json", async () => {
      const collective = await r2(`${WEBSITE_URL}/railsgirlsatl.json${cacheBurst}`).json;
      expect(collective.slug).toEqual('railsgirlsatl');
      expect(collective.currency).toEqual('USD');
      expect(collective.balance).toBeGreaterThan(100);
      expect(collective.yearlyIncome).toBeGreaterThan(100);
      expect(collective.backersCount).toBeGreaterThan(1);
      expect(collective.contributorsCount).toEqual(0);
    });

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

    test("return /:collectiveSlug/events.json", async () => {
      const res = await r2(`${WEBSITE_URL}/veganizerbxl/events.json${cacheBurst}`).json;
      expect(res).toHaveLength(6);
      expect(res[0]).toEqual({ id: 8722,
        name: 'Vegan Dining Week',
        description: null,
        slug: 'vegandiningweek-407ev',
        image: null,
        startsAt: 'Fri Nov 10 2017 23:00:00 GMT+0100 (CET)',
        endsAt: 'Sat Nov 18 2017 23:00:00 GMT+0100 (CET)',
        location:
         { name: 'Brussels',
           address: 'Brussels, Belgium',
           lat: 50.8503396,
           long: 4.351710300000036 },
        url: 'https://opencollective.com/veganizerbxl/events/vegandiningweek-407ev',
        info: 'https://opencollective.com/veganizerbxl/events/vegandiningweek-407ev.json' });
    });
 
    test("return /:collectiveSlug/events/:eventSlug.json", async () => {
      const res = await r2(`${WEBSITE_URL}/veganizerbxl/events/superfilles.json${cacheBurst}`).json;
      expect(res).toEqual({"id":8716,"name":"Les Super Filles du Tram: Officially Veganized","description":null,"longDescription":"It is finally happening: Veganizer BXL is launching an incredibly tasty vegan burger, 100% plant-based and, in true Brussels style, infused with the bold flavor of Brussels Beer Project's Babylone beer! The seitan base is provided by a basis of Bertyn seitan. The hamburger bun prepared by Agribio's Laurent Pedrotti. For now, it will be exclusively available at the famous burger place Les Super Filles du Tram at Flagey. \n\n<center><img src=\"https://cl.ly/1M2f0N2K1W1I/veganizerbxl.jpg\" style=\"max-width:100%\" /></center>\n\nThe night of the event, orders can also be made through Deliveroo to have your burgers delivered at home in the Brussels area. ","slug":"superfilles","image":null,"startsAt":"Mon Apr 24 2017 19:00:00 GMT+0200 (CEST)","endsAt":"Mon Apr 24 2017 21:00:00 GMT+0200 (CEST)","location":{"name":"Les Super Filles du Tram","address":"Rue Lesbroussart 22, 1050 Bruxelles","lat":50.827697,"long":4.370636},"currency":"EUR","tiers":[{"id":13,"name":"free ticket","description":"note: this is not an official reservation! First come, first serve. It is however a great way for us to get an idea of how many people will be attending. Plus, we will send you a little reminder before the event!","amount":0},{"id":19,"name":"supporter ticket","description":"Support the VeganizerBXL collective. Your donations matter.","amount":500}],"url":"https://opencollective.com/veganizerbxl/events/superfilles","attendees":"https://opencollective.com/veganizerbxl/events/superfilles/attendees.json"});
    });

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