import type { Locator } from '@playwright/test';

/** Types `text` in a rich-text editor and makes it bold with the keyboard shortcut, as a user would. */
export async function typeInBold(editor: Locator, text: string) {
  await editor.click();
  await editor.pressSequentially(text);
  await editor.selectText();
  await editor.press('ControlOrMeta+b');
}
