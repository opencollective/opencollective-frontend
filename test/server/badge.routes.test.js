import r2 from 'r2';

const WEBSITE_URL = process.env.WEBSITE_URL || "https://staging.opencollective.com";

describe("badge.routes.test.js", () => {
  describe("backerType (backers|sponsors)", () => {

    test("returns a 404 if slug doesn't exist", async () => {
      const res = await r2(`${WEBSITE_URL}/webpack222/backers/badge.svg`).response;
      expect(res.status).toEqual(404);
    });

    test("loads the backers badge", async () => {
      const res = await r2(`${WEBSITE_URL}/webpack/backers/badge.svg`).text;
      expect(res).toMatch(/backers<\/text>/);
    });
    
    test("loads the sponsors badge", async () => {
      const res = await r2(`${WEBSITE_URL}/webpack/sponsors/badge.svg`).text;
      expect(res).toMatch(/sponsors<\/text>/);
    });

    test("returns a 404 if slug doesn't exist", async () => {
      const res = await r2(`${WEBSITE_URL}/webpack222/backers/0/avatar.svg`).response;
      expect(res.status).toEqual(404);
    });
    
    test("loads the first backer avatar.svg", async () => {
      const res = await r2(`${WEBSITE_URL}/webpack/backers/0/avatar.svg`).text;
      expect(res).toMatch(/<image width="64" height="64"/);
    });
    
    test("loads the first sponsor avatar.svg", async () => {
      const res = await r2(`${WEBSITE_URL}/webpack/sponsors/0/avatar.svg`).text;
      expect(res).toMatch(/<image width="[0-9]+" height="64"/);
    });
    
    test("redirects to the website of the second backer", async () => {
      const res = await r2(`${WEBSITE_URL}/webpack/backers/1/website`).response;
      expect(res.status).toEqual(200);
      expect(res.url).toMatch(/utm_campaign=webpack&utm_medium=github&utm_source=opencollective/);
    });
  });

  describe("custom tiers", () => {
    test("loads the badge", async () => {
      const res = await r2(`${WEBSITE_URL}/gulpjs/tiers/individual/badge.svg`).text;
      expect(res).toMatch(/Individual<\/text>/);
    });
        
    test("loads the first member avatar.svg", async () => {
      const res = await r2(`${WEBSITE_URL}/gulpjs/tiers/individual/0/avatar.svg`).text;
      expect(res).toMatch(/<image width="64" height="64"/);
    });
    
  })
});