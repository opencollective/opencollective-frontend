import { Page } from 'playwright/test';

export const mockNow = async (page: Page, now: number) => {
  await page.addInitScript(`{
    // Extend Date constructor to default to now
    Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          super(${now});
        } else {
          super(...args);
        }
      }
    }
    // Override Date.now() to start from now
    const __DateNowOffset = ${now} - Date.now();
    const __DateNow = Date.now;
    Date.now = () => __DateNow() + __DateNowOffset;
  }`);
};
