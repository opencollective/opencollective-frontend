import { expect, type Locator, type Page } from '@playwright/test';

import { dropFiles, expectStoredUpload, imageFile } from './uploads';

type ExpenseKind = 'invoice' | 'reimbursement';

type NewPayoutMethod = {
  /** Alias shown in the payout method list and the summary. */
  name: string;
  currency: string;
  details: string;
  /** Save it to the payee profile, which also selects it. */
  save: boolean;
};

type Payee =
  /** A profile offered directly as an option: the user or an Organization they administer. */
  | { profile: { slug: string }; payoutMethod: NewPayoutMethod }
  /** Create an Organization inline and get paid through it. */
  | { legalEntity: { legalName: string; name: string; slug: string }; payoutMethod: NewPayoutMethod }
  /** Invite an existing profile, who will provide the payout details. */
  | { invitee: { slug: string } };

type ExpenseSubmission = {
  kind: ExpenseKind;
  /** The Collective paying the expense. */
  account: { slug: string; name: string };
  payee: Payee;
  title: string;
  /** Apply 20% VAT (the paying Account must be subject to VAT). */
  vat?: boolean;
};

const INVITEE_PAYOUT_NOTICE =
  'The person you are inviting to submit this expense will be asked to provide payout method details.';

const section = (page: Page, id: string) => page.locator(`#${id}`);

const toast = (page: Page, message: string) => page.getByTestId('toast-notification').filter({ hasText: message });

/**
 * Picks a profile in a searchable picker by its exact handle. Options render in
 * a portal outside the form section, and one slug may be the prefix of another.
 */
const pickProfile = (page: Page, slug: string) =>
  page
    .getByRole('option')
    .filter({ has: page.getByText(`@${slug}`, { exact: true }) })
    // The picker nests a second element with the option role inside each option.
    .first()
    .click();

/** Adds a payout method for the selected payee in the Payout Method section. */
export async function addPayoutMethod(page: Page, payoutMethod: NewPayoutMethod) {
  const payout = section(page, 'PAYOUT_METHOD');
  // Enabled once the payee and its existing payout methods have loaded.
  const addNew = payout.getByTestId('add-new-payout-method');
  await expect(addNew).toBeEnabled();
  await addNew.click();
  await expect(addNew).toHaveAttribute('data-state', 'checked');
  await payout.getByTestId('payout-method-type-select').click();
  await page.getByTestId('select-option').filter({ hasText: 'Other' }).click();
  await payout.getByTestId('currency-picker').click();
  await page
    .getByTestId('select-content')
    .getByTestId('select-option')
    .filter({ hasText: payoutMethod.currency })
    .click();
  await expect(payout.getByTestId('currency-picker')).toContainText(payoutMethod.currency);
  await payout.getByLabel('Info', { exact: true }).fill(payoutMethod.details);
  const alias = payout.locator('[id="input-newPayoutMethod.name"]');
  await alias.fill(payoutMethod.name);
  await expect(alias).toHaveValue(payoutMethod.name);
  if (payoutMethod.save) {
    await payout.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(toast(page, 'Payout method created')).toBeVisible();
    await expect(payout.getByRole('radio').filter({ hasText: payoutMethod.name })).toBeChecked();
  }
}

/** Picks invoice or reimbursement; an invoice either attaches the payee's own invoice file or asks for a generated one. */
export async function chooseExpenseType(page: Page, kind: ExpenseKind, { attachInvoice }: { attachInvoice: boolean }) {
  const type = section(page, 'TYPE_OF_EXPENSE');
  const label = kind === 'invoice' ? 'Invoice' : 'Reimbursement';
  await type.getByRole('radio', { name: label }).click();
  await expect(type.getByRole('radio', { name: label })).toBeChecked();
  if (kind === 'invoice' && attachInvoice) {
    await type.getByText('Yes, I have an invoice').click();
    await type.getByText('Attach your invoice file').setInputFiles(imageFile('invoice0.jpg'));
    await expect(type.getByText('Clear')).toBeVisible();
    await expectStoredUpload(type.getByRole('link', { name: 'Uploaded file preview' }));
    await type.getByLabel('Invoice reference').fill('INV0001');
  } else if (kind === 'invoice') {
    await type.getByText('No, generate an invoice for me').click();
  }
}

async function choosePayee(page: Page, payee: Payee) {
  const gettingPaid = section(page, 'WHO_IS_GETTING_PAID');
  if ('legalEntity' in payee) {
    // Only offered to a user who administers no other profile.
    await expect(gettingPaid.getByText('An account I administer')).toHaveCount(0);
    await gettingPaid.getByText('I would like to get paid through a legal entity').click();
    await gettingPaid.getByText('Country of Incorporation').locator('..').getByRole('combobox').click();
    await page.getByPlaceholder('Search countries...').fill('United States');
    await page.getByPlaceholder('Search countries...').press('Enter');
    await gettingPaid.locator('#input-legalName').fill(payee.legalEntity.legalName);
    await gettingPaid.locator('#input-name').fill(payee.legalEntity.name);
    await gettingPaid.locator('#input-slug').fill(payee.legalEntity.slug);
    await gettingPaid.getByText('I am legally registered as an administrator').click();
    await gettingPaid.getByRole('button', { name: 'Create Organization Account' }).click();
    await expect(toast(page, 'Organization account created')).toBeVisible();
    await expect(gettingPaid.locator(`button[role="radio"][value="${payee.legalEntity.slug}"]`)).toBeChecked();
    await expect(gettingPaid.getByText('I would like to get paid through a legal entity')).toHaveCount(0);
  } else if ('profile' in payee) {
    const option = gettingPaid.locator(`button[role="radio"][value="${payee.profile.slug}"]`);
    await option.click();
    await expect(option).toBeChecked();
  } else {
    await gettingPaid.getByText('Invite someone').click();
    await gettingPaid.getByRole('combobox').click();
    await page.keyboard.type(payee.invitee.slug);
    await pickProfile(page, payee.invitee.slug);
  }
}

async function fillItem(
  item: Locator,
  kind: ExpenseKind,
  values: { description: string; date: string; amount: string; receipt: string },
) {
  await item.getByLabel('Item Description').fill(values.description);
  await item.getByLabel('Date').fill(values.date);
  await item.getByLabel('Amount').fill(values.amount);
  if (kind === 'reimbursement') {
    await dropFiles(item.getByText('Drag & drop'), [imageFile(values.receipt)]);
    await expect(item.getByText('Clear')).toBeVisible();
    await expectStoredUpload(item.getByRole('link', { name: 'Uploaded file preview' }));
  }
}

/**
 * Completes the new-expense form the way a submitter does and submits it:
 * two items (the second in BRL, converted to the USD reference currency),
 * genuine uploads, and a check of every figure on the summary before sending.
 * Starts on the open form and ends back on the page the form was opened from.
 */
export async function submitExpense(page: Page, submission: ExpenseSubmission) {
  const { kind, account, payee } = submission;
  const paidDirectly = !('invitee' in payee);

  const paying = section(page, 'WHO_IS_PAYING');
  await paying.getByText('Find account').click();
  await paying.getByRole('combobox').click();
  await page.keyboard.type(account.slug);
  await pickProfile(page, account.slug);

  await choosePayee(page, payee);

  if ('payoutMethod' in payee) {
    await addPayoutMethod(page, payee.payoutMethod);
  } else {
    await expect(section(page, 'PAYOUT_METHOD').getByText(INVITEE_PAYOUT_NOTICE)).toBeVisible();
  }

  await chooseExpenseType(page, kind, { attachInvoice: paidDirectly });

  const items = section(page, 'EXPENSE_ITEMS');
  const listed = items.getByRole('listitem');
  await fillItem(listed.nth(0), kind, {
    description: 'First item description',
    date: '2025-09-29',
    amount: '125',
    receipt: 'receipt0.jpg',
  });
  await items.getByText('Add item').click();
  await fillItem(listed.nth(1), kind, {
    description: 'Second item description',
    date: '2024-09-29',
    amount: '500',
    receipt: 'receipt1.jpg',
  });
  await listed.nth(1).getByText('USD').click();
  await page.getByPlaceholder('Search...').fill('BRL');
  await page.getByPlaceholder('Search...').press('Enter');
  // Two currencies are involved: the submitter picks the one the expense is expressed in.
  await items.getByTestId('reference-currency-option-USD').click();
  await items
    .getByText('Additional Attachments')
    .setInputFiles([imageFile('attachment0.jpg'), imageFile('attachment1.jpg')]);
  if (submission.vat) {
    await items.getByText('Apply Value-added tax').click();
    await items.getByLabel('VAT identifier').fill('EU000011111');
    await items.getByLabel('VAT rate').fill('20');
    await expect(items.getByText('$135.00 USD')).toBeVisible();
    await expect(items.getByText('$810.00 USD')).toBeVisible();
  }

  const details = section(page, 'ADDITIONAL_DETAILS');
  // The title defaults to the first item's description.
  await details.locator('input[value="First item description"]').fill(submission.title);
  await details.getByText('Add tag').click();
  await page.getByPlaceholder('Add tag').fill('A tag');
  await page.getByPlaceholder('Add tag').press('Enter');

  const summary = section(page, 'SUMMARY');
  await expect(summary.getByText(submission.title)).toBeVisible();
  await expect(summary.getByText('a tag', { exact: true })).toBeVisible();
  const summaryItems = summary.locator('label', { hasText: 'Items' }).locator('..');
  const firstItem = summaryItems.getByRole('listitem').filter({ hasText: 'First item description' });
  const secondItem = summaryItems.getByRole('listitem').filter({ hasText: 'Second item description' });
  await expect(firstItem).toContainText('$125.00 USD');
  // Converted at the environment's fixed exchange rate (1.1) to the reference currency.
  await expect(secondItem).toContainText('$550.00 USD');
  await expect(secondItem).toContainText('R$500.00 BRL');
  if (kind === 'reimbursement') {
    await expect(firstItem.getByRole('link')).toHaveCount(1);
    await expect(secondItem.getByRole('link')).toHaveCount(1);
  }
  await expect(summaryItems).toContainText('$675.00 USD');
  if (submission.vat) {
    await expect(summaryItems).toContainText('$135.00 USD');
    await expect(summaryItems).toContainText('$810.00 USD');
  }
  if (kind === 'invoice') {
    const invoice = summary.locator('label', { hasText: 'Invoice' }).locator('..');
    if (paidDirectly) {
      await expect(invoice).toContainText('INV0001');
      await expect(invoice.getByRole('link')).toHaveCount(1);
    } else {
      await expect(invoice).toContainText('Invoice will be generated once you submit the expense');
    }
  }
  await expect(summary.getByText('Requesting money from').locator('..')).toContainText(account.name);
  if ('profile' in payee) {
    await expect(summary.getByText('Recipient').locator('..')).toContainText(payee.profile.slug);
  } else if ('legalEntity' in payee) {
    await expect(summary.getByText('Recipient').locator('..')).toContainText(payee.legalEntity.name);
  }
  await expect(summary.getByText('Payout Method', { exact: true }).first().locator('..')).toContainText(
    'payoutMethod' in payee ? payee.payoutMethod.name : INVITEE_PAYOUT_NOTICE,
  );

  await page.locator('form').getByRole('button', { name: 'Submit Expense' }).click();
  await expect(page.getByText('has been submitted successfully!')).toBeVisible();
  await page.getByRole('button', { name: 'View all expenses' }).click();
}
