const { Chromeless } = require('chromeless')

const chromeless = new Chromeless()


describe("make a donation", () => {
  
  
  afterAll(async () => {
    await chromeless.end()    
  })
  
  it("makes a one time donation", async () => {
    
    jest.setTimeout(20000);
      
    const screenshot = await chromeless
      .goto('https://staging.opencollective.com/webpack/donate')
      .type("newuser@gmail.com", "input[name='email']")
      .type("Xavier", "input[name='firstName']")
      .type("Damman", "input[name='lastName']")
      .type("https://xdamman.com", "input[name='website']")
      .type("xdamman", "input[name='twitterHandle']")
      .type("short bio", "input[name='description']")
      .type("4242424242424242", "input[name='CCnumber']")
      .type("Full Name", "input[name='CCname']")
      .type("11/22", "input[name='CCexpiry']")
      .type("111", "input[name='CCcvc']")
      .click(".presetBtn")
      .type("Public message", "textarea[name='publicMessage']")
      .click('.submit button')
      .wait(15000)
      .screenshot()
      
      console.log(screenshot)
      const url = await chromeless.evaluate(url => window.location.href)
      expect(url).toMatch(/\/xdamman/);      

      // const result = await chromeless.exists('body')
      // expect(result).toBeTruthy();
  
  })
});