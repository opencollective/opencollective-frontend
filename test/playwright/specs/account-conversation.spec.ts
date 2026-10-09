import { expect, test } from '../fixtures';

test.use({ recipe: 'account-conversation' });

test('Account admin publishes a conversation and persists its reply', async ({ page, scenario }) => {
  await page.goto(scenario.urls.newConversation);
  const title = `Conversation ${scenario.account.slug}`;
  const body = `Community news for ${scenario.account.name}`;
  const reply = `Reply from ${scenario.user.slug}`;
  await page.getByTestId('conversation-title-input').fill(title);
  await page.getByTestId('RichTextEditor').locator('trix-editor').fill(body);
  await page.getByTestId('submit-new-conversation-btn').click();
  await expect(page.getByTestId('conversation-page')).toBeVisible();
  await expect(page.getByTestId('comment-body')).toHaveText(body);
  await page.getByTestId('comment-form').locator('trix-editor').fill(reply);
  await page.getByTestId('submit-comment-btn').click();
  await expect(page.getByTestId('comment-body').filter({ hasText: reply })).toBeVisible();
  await page.getByRole('link', { name: 'Back to conversations' }).click();
  await expect(page.getByTestId('page-conversations')).toBeVisible();
  await expect(page.getByTestId('conversation-preview')).toHaveCount(1);
  await expect(page.getByTestId('replies-count')).toHaveText(/1/);
  await page.getByRole('link', { name: title, exact: true }).click();
  await page.reload();
  await expect(page.getByTestId('comment-body').filter({ hasText: reply })).toBeVisible();
});
