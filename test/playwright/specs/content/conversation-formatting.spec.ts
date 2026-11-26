import type { Page } from '@playwright/test';

import { expect, test } from '../../fixtures';

test.use({ recipe: 'account-conversation' });

const link = 'https://opencollective.com/opencollective';
const opening = `Hello from ${link} 👋👋👋`;
const rest =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. De hominibus dici non necesse est. Immo alio genere; Si longus, levis; Quicquid enim a sapientia proficiscitur, id continuo debet expletum esse omnibus suis partibus.';

/** Adds a tag through the tag picker that is open on the page. */
async function addTag(page: Page, tag: string) {
  await page.getByTestId('edit-tags-open').click();
  await page.getByTestId('edit-tags-input').fill(tag);
  // The picker offers the tag in lower case, as it stores it.
  await page.getByRole('option', { name: tag.toLowerCase(), exact: true }).click();
}

/**
 * Complements `account-conversation.spec.ts` (publishing, a persisted reply, the list): rich text with a link,
 * tags added on creation and later, several replies and the shortened preview in the list.
 */
test('Account admin publishes a formatted, tagged conversation and sees its preview', async ({ page, scenario }) => {
  const title = `Hello World 👋 ${scenario.account.slug}`;
  await page.goto(scenario.urls.newConversation);
  await page.getByTestId('conversation-title-input').fill(title);
  const editor = page.getByTestId('RichTextEditor').locator('trix-editor');
  // Typed, as a user would: links are made as the text is typed.
  await editor.pressSequentially(`${opening}\n`);
  await editor.press('End');
  await page.keyboard.insertText(rest);
  await expect(editor.getByRole('link', { name: link })).toHaveAttribute('href', link);
  await addTag(page, 'amazing stuff');
  await page.getByTestId('submit-new-conversation-btn').click();

  const conversation = page.getByTestId('conversation-page');
  await expect(conversation).toContainText(title);
  const body = page.getByTestId('comment-body').first();
  await expect(body.getByRole('link', { name: link })).toHaveAttribute('href', link);
  await expect(body).toContainText(rest);
  await expect(conversation).toContainText('amazing stuff');

  await page.getByTestId('InlineEditField-Trigger-tags').click();
  await addTag(page, 'Alot more amazing stuff');
  await expect(conversation.getByText('alot more amazing stuff')).toBeVisible();

  const replyEditor = page.getByTestId('comment-form').locator('trix-editor');
  for (const reply of ['I post a reply', 'And another one']) {
    await replyEditor.fill(reply);
    await page.getByTestId('submit-comment-btn').click();
    await expect(page.getByTestId('comment-body').filter({ hasText: reply })).toBeVisible();
  }

  await page.getByRole('link', { name: 'Back to conversations' }).click();
  await expect(page.getByTestId('page-conversations')).toContainText(title);
  await expect(page.getByTestId('replies-count')).toHaveText(/2/);
  const preview = page.getByTestId('conversation-preview');
  await expect(preview.getByRole('link', { name: link })).toHaveAttribute('href', link);
  // The preview stops after the first words of the second paragraph.
  await expect(preview).toContainText('Lorem ipsum dolor sit amet, consectetur adipiscing elit. De hominibus dici');
  await expect(preview).toContainText('...');
  await expect(preview).not.toContainText('Quicquid enim a sapientia proficiscitur');
});
