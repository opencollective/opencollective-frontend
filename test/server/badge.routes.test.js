import r2 from 'r2';
import fetch from 'node-fetch';

const WEBSITE_URL = process.env.WEBSITE_URL || "https://staging.opencollective.com";

const cacheBurst = `?cacheBurst=${Math.round(Math.random()*100000)}`;

describe("badge.routes.test.js", () => {
  describe("backerType (backers|sponsors)", () => {

    test("returns a 404 if slug doesn't exist", async () => {
      const res = await r2(`${WEBSITE_URL}/webpack222/backers/badge.svg${cacheBurst}`).response;
      expect(res.status).toEqual(404);
    });

    test("loads the backers badge", async () => {
      const res = await r2(`${WEBSITE_URL}/apex/backers/badge.svg${cacheBurst}`).text;
      expect(res).toMatch(/backers<\/text>/);
    });
    
    test("loads the sponsors badge", async () => {
      const res = await r2(`${WEBSITE_URL}/apex/sponsors/badge.svg${cacheBurst}`).text;
      expect(res).toMatch(/sponsors<\/text>/);
    });

    test("returns a 404 if slug doesn't exist", async () => {
      const res = await r2(`${WEBSITE_URL}/apex222/backers/0/avatar.svg${cacheBurst}`).response;
      expect(res.status).toEqual(404);
    });
    
    test("loads the first backer avatar.svg", async () => {
      const res = await r2(`${WEBSITE_URL}/apex/backers/0/avatar.svg${cacheBurst}`).text;
      expect(res).toMatch(/<image width="64" height="64"/);
    });
    
    test("loads the first sponsor avatar.svg", async () => {
      const res = await r2(`${WEBSITE_URL}/apex/sponsors/0/avatar.svg${cacheBurst}`).text;
      expect(res).toMatch(/height="64"/);
    });
    
    test("redirects to the website of the second backer", async () => {
      const res = await r2(`${WEBSITE_URL}/apex/backers/1/website${cacheBurst}`).response;
      expect(res.status).toEqual(200);
      expect(res.url).toMatch(/utm_campaign=apex/);
      expect(res.url).toMatch(/utm_medium=github/);
      expect(res.url).toMatch(/utm_source=opencollective/);
    });
  });

  describe("custom tiers", () => {
    test("loads the badge", async () => {
      const res = await r2(`${WEBSITE_URL}/apex/tiers/sponsors/badge.svg${cacheBurst}`).text;
      expect(res).toMatch(/Sponsors<\/text>/);
    });

    test("loads the first member avatar.svg", async () => {
      const res = await r2(`${WEBSITE_URL}/apex/tiers/sponsors/0/avatar.svg${cacheBurst}`).text;
      expect(res).toMatch(/<image width="140" height="64"/);
    });

  });

  describe("contributors.svg", () => {
    test("loads the mosaic", async () => {
      const res = await fetch(`${WEBSITE_URL}/apex/contributors.svg?width=500${cacheBurst}`);
      expect(res.status).toEqual(200);
      expect(res.headers.get('content-type')).toEqual('image/svg+xml; charset=utf-8');
      expect(res.headers.get('cache-control')).toMatch(/public, max-age=[1-9][0-9]{2,5}/);
      const text = await res.text();
      expect(text.length).toBeGreaterThan(890000);
    });
  })

  describe("collective logo", () => {
    test("loads the logo in ascii", async () => {
      jest.setTimeout(10000);
      const res = await fetch(`${WEBSITE_URL}/railsgirlsatl/logo.txt${cacheBurst}`);
      expect(res.status).toEqual(200);
      expect(res.headers.get('content-type')).toEqual('text/plain; charset=utf-8');
      expect(res.headers.get('cache-control')).toMatch(/public, max-age=[1-9][0-9]{3,7}/);
      const text = await res.text();
      expect(text.length).toBeGreaterThan(600);
      expect(text.length).toBeLessThan(1000);
    });
  })

});