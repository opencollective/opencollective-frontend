// eslint-disable-next-line node/no-unpublished-import
import { CustomProjectConfig } from 'lost-pixel';

export const config: Partial<CustomProjectConfig> = {
  storybookShots: {
    storybookUrl: './storybook-static',
  },
  lostPixelProjectId: process.env.LOST_PIXEL_PROJECT_ID,
  apiKey: process.env.LOST_PIXEL_API_KEY,
  beforeScreenshot: async page => {
    await page.addStyleTag({
      content: `
        * {
          animation-play-state: paused !important;
          animation: none !important;
        }
      `,
    });
  },
};
