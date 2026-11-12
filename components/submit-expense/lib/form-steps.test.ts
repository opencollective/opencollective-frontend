/* eslint-disable @typescript-eslint/no-explicit-any */
import { set } from 'lodash-es';
import { createIntl } from 'react-intl';

import { CollectiveType } from '../../../lib/constants/collectives';
import { ExpenseType } from '../../../lib/graphql/types/v2/graphql';

import { buildFormSchema, getFormSchemaKeys } from './form-schema';
import {
  EDIT_EXPENSE_STEPS,
  EXPENSE_FLOW_STEPS,
  ExpenseStep,
  type FormStep,
  getFirstIncompleteStep,
  getValidatedValueKeys,
  GRANT_FLOW_STEPS,
  GrantStep,
  isStepComplete,
  isStepTouched,
} from './form-steps';
import { EXPENSE_FORM_VALUE_KEYS, InviteeAccountType, RecurrenceFrequencyOption, YesNoOption } from './types';

const intl = createIntl({ locale: 'en' });

const topLevelKeys = (steps: readonly FormStep[]) => steps.flatMap(step => getValidatedValueKeys(step.fields));

const errorsFor = (values, options) => {
  const result = buildFormSchema(options, intl).safeParse(values);
  const errors = {};
  if (!result.success) {
    result.error.issues.forEach(issue => set(errors, issue.path, issue.message));
  }
  return errors;
};

describe('form steps', () => {
  it('only reference form values', () => {
    const flows = [EXPENSE_FLOW_STEPS, GRANT_FLOW_STEPS, Object.values(EDIT_EXPENSE_STEPS)];
    for (const steps of flows) {
      expect(EXPENSE_FORM_VALUE_KEYS).toEqual(expect.arrayContaining(topLevelKeys(steps)));
    }
  });

  it('only validate form values', () => {
    expect(EXPENSE_FORM_VALUE_KEYS).toEqual(expect.arrayContaining(getFormSchemaKeys()));
  });

  it('assign every validated value to exactly one Expense step', () => {
    for (const key of getFormSchemaKeys()) {
      const steps = EXPENSE_FLOW_STEPS.filter(step => getValidatedValueKeys(step.fields).includes(key));
      expect({ key, steps: steps.map(s => s.id) }).toEqual({ key, steps: [expect.any(String)] });
    }
  });

  it('own each form value in a single Expense step', () => {
    const keys = topLevelKeys(EXPENSE_FLOW_STEPS);
    expect(keys).toHaveLength(new Set(keys).size);
  });

  it('assign every error of an empty Grant to a Grant step', () => {
    const values = {
      expenseTypeOption: ExpenseType.GRANT,
      inviteeAccountType: InviteeAccountType.INDIVIDUAL,
      inviteeNewIndividual: {},
      inviteeNewOrganization: { organization: {} },
      newPayoutMethod: { data: {} },
      recurrenceFrequency: RecurrenceFrequencyOption.NONE,
      hasInvoiceOption: YesNoOption.NO,
      additionalAttachments: ['not-a-url'],
      expenseItems: [{ amount: { valueInCents: 0, currency: 'EUR', exchangeRate: null } }],
    };
    const options = {
      account: {
        slug: 'collective',
        type: CollectiveType.COLLECTIVE,
        policies: { EXPENSE_POLICIES: { grantPolicy: 'Read me' } },
      },
      supportedExpenseTypes: [ExpenseType.GRANT],
      availableReferenceCurrencies: ['USD', 'EUR'],
      expenseCurrency: 'USD',
      loggedInAccount: { slug: 'jane' },
    } as any;
    const errorKeys = Object.keys(errorsFor(values, options));
    expect(errorKeys.length).toBeGreaterThan(3);
    expect(topLevelKeys(GRANT_FLOW_STEPS)).toEqual(expect.arrayContaining(errorKeys));
  });

  describe('attribution', () => {
    const form = (errors = {}, overrides = {}) =>
      ({ initialLoading: false, errors, touched: {}, options: {}, ...overrides }) as any;

    it('reports the step that owns an error', () => {
      const step = EXPENSE_FLOW_STEPS.find(s => s.id === ExpenseStep.EXPENSE_ITEMS);
      expect(isStepComplete(step, form({ expenseItems: [{ description: 'Required' }] }))).toBe(false);
      expect(isStepComplete(step, form({ title: 'Required' }))).toBe(true);
    });

    it('reports no step as complete while loading', () => {
      const step = EXPENSE_FLOW_STEPS.find(s => s.id === ExpenseStep.EXPENSE_ITEMS);
      expect(isStepComplete(step, form({}, { initialLoading: true }))).toBe(false);
    });

    it('scrolls to the first incomplete visible step', () => {
      const errors = { accountingCategoryId: 'Required', title: 'Required', recurrenceEndAt: 'Invalid' };
      expect(getFirstIncompleteStep(EXPENSE_FLOW_STEPS, form(errors)).id).toBe(ExpenseStep.ADDITIONAL_DETAILS);
      const withCategories = { isAccountingCategoryRequired: true, accountingCategories: [{ id: 'cat' }] };
      expect(getFirstIncompleteStep(EXPENSE_FLOW_STEPS, form(errors, { options: withCategories })).id).toBe(
        ExpenseStep.EXPENSE_CATEGORY,
      );
      expect(getFirstIncompleteStep(EXPENSE_FLOW_STEPS, form({ recurrenceEndAt: 'Invalid' })).id).toBe(
        ExpenseStep.SUMMARY,
      );
    });

    it('scrolls to the Grant step that owns the error', () => {
      expect(
        getFirstIncompleteStep(GRANT_FLOW_STEPS, form({ acknowledgedHostGrantExpensePolicy: 'Required' })).id,
      ).toBe(GrantStep.INSTRUCTIONS);
      expect(getFirstIncompleteStep(GRANT_FLOW_STEPS, form({ additionalAttachments: ['Invalid url'] })).id).toBe(
        GrantStep.DESCRIPTION,
      );
    });

    it('reports touched steps', () => {
      const step = EXPENSE_FLOW_STEPS.find(s => s.id === ExpenseStep.PAYOUT_METHOD);
      expect(isStepTouched(step, form({}, { touched: { newPayoutMethod: { type: true } } }))).toBe(true);
      expect(isStepTouched(step, form({}, { touched: { title: true } }))).toBe(false);
    });
  });

  it('validates the top-level values an edit sub-form owns', () => {
    expect(getValidatedValueKeys(EDIT_EXPENSE_STEPS.attachReceipts.fields)).toEqual(['expenseItems']);
    expect(getValidatedValueKeys(['newPayoutMethod.data', 'newPayoutMethod.type', 'payoutMethodId'])).toEqual([
      'newPayoutMethod',
      'payoutMethodId',
    ]);
  });
});
