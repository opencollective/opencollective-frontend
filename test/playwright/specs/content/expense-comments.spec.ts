import { expect, scenarioTest } from '../../fixtures';
import { isolationProbe } from '../../helpers/attempt';

// `admin` administers the Collective and submitted its pending expense; nobody has commented on it yet.
const test = scenarioTest('expense-management', {
  inputs: { expense: { description: 'Expense with comments', items: [{ description: 'Some stuff', amount: 1000 }] } },
  actor: 'admin',
});

test('expense submitter adds, edits and deletes a comment', async ({ page, scenario }, testInfo) => {
  await page.goto(scenario.expenses.pending.url);
  const comments = page.getByTestId('comment');
  await expect(page.getByTestId('comment-form')).toBeVisible();
  await expect(comments).toHaveCount(0);

  await page.getByTestId('comment-form').locator('trix-editor').fill('I am typing a comment');
  await page.getByTestId('submit-comment-btn').click();
  await expect(page.getByTestId('comment-body')).toHaveText('I am typing a comment');
  isolationProbe(testInfo, 'leave a commented expense behind and retry with a fresh one.');
  await page.reload();
  await expect(page.getByTestId('comment-body')).toHaveText('I am typing a comment');

  const comment = comments.first();
  await comment.getByTestId('commnent-actions-trigger').click();
  await page.getByTestId('edit-comment-btn').click();
  await comment.locator('trix-editor').fill('Modifying my first comment');
  await comment.getByTestId('InlineEditField-Btn-Save').click();
  await expect(comment.getByTestId('comment-body')).toHaveText('Modifying my first comment');
  await page.reload();
  await expect(page.getByTestId('comment-body')).toHaveText('Modifying my first comment');

  await comments.first().getByTestId('commnent-actions-trigger').click();
  await page.getByTestId('delete-comment-btn').click();
  await page.getByTestId('confirmation-modal-continue').click();
  await expect(comments).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId('comment-form')).toBeVisible();
  await expect(page.getByTestId('comment-body')).toHaveCount(0);
});

test('expense submitter reacts to a comment', async ({ page, scenario }) => {
  await page.goto(scenario.expenses.pending.url);
  await page.getByTestId('comment-form').locator('trix-editor').fill('Add emojis here ⬇️⬇️⬇️');
  await page.getByTestId('submit-comment-btn').click();
  await expect(page.getByTestId('comment-body')).toHaveText('Add emojis here ⬇️⬇️⬇️');

  await page.getByTestId('comment-reaction-picker-trigger').click();
  await page.getByTestId('comment-reaction-picker-popper').getByRole('button', { name: '👍️' }).click();
  await expect(page.getByTestId('comment-reactions')).toContainText('👍️ 1');
  await page.reload();
  await expect(page.getByTestId('comment-reactions')).toContainText('👍️ 1');
});
