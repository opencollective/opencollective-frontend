import type { Page } from '@playwright/test';

/** The notification the product pops up to confirm (or refuse) an action, by its message. */
export const toast = (page: Page, message: string) =>
  page.getByTestId('toast-notification').filter({ hasText: message });
