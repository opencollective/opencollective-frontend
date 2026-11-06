/**
 * Form schema: the validation rules of the Expense form.
 *
 * The schema is built from the form options only. Rules that depend on other values read them from
 * the value being validated, so validation always matches the current values.
 */
import { checkVATNumberFormat, TaxType } from '@opencollective/taxes';
import dayjs from 'dayjs';
import { isEmpty, isNull } from 'lodash-es';
import type { IntlShape } from 'react-intl';
import { z } from 'zod';

import { CollectiveType } from '../../../lib/constants/collectives';
import { Currency, ExpenseStatus, ExpenseType, PayoutMethodType } from '../../../lib/graphql/types/v2/graphql';
import { isValidEmail } from '../../../lib/utils';
import {
  NEW_ACCOUNT_BALANCE_PAYOUT_METHOD_ID,
  NEW_PAYOUT_METHOD_ID,
  PAYEE_SLUG_INVITE,
  PAYEE_SLUG_INVITE_EXISTING_USER,
  PAYEE_SLUG_INVITE_SOMEONE,
} from '../../expenses/lib/constants';

import { getCustomZodErrorMap } from '../../FormikZod';
import { isEmptyHTMLValue } from '../../HTMLContent';
import { supportsBaseExpenseTypes } from '../form/helper';

import type { ExpenseFormOptions, ExpenseFormValues, RecursivePartial } from './types';
import { InviteeAccountType, RecurrenceFrequencyOption, YesNoOption } from './types';

/**
 * A recurrence end date is optional (leaving it empty means an open-ended recurrence), but when set
 * it must be a valid date in the future.
 */
export function isValidRecurrenceEndAt(
  recurrenceFrequency?: RecurrenceFrequencyOption | null,
  recurrenceEndAt?: string | null,
): boolean {
  if (!recurrenceFrequency || recurrenceFrequency === RecurrenceFrequencyOption.NONE) {
    return true;
  }
  if (!recurrenceEndAt) {
    return true; // No end date means open-ended recurrence
  }
  const endsAt = dayjs(recurrenceEndAt);
  return endsAt.isValid() && endsAt.isAfter(dayjs().startOf('day'));
}

/**
 * Builds dynamic Zod validation schema based on form options and context.
 *
 * This function creates different validation rules depending on:
 * - Expense type (INVOICE vs RECEIPT vs GRANT)
 * - Account settings (VAT/GST requirements, accounting categories)
 * - Form state (invite vs direct submission)
 *
 * @param values Current form values
 * @param options Form configuration options
 * @param intl Internationalization context for error messages
 * @param pickSchemaFields Optional field filtering for partial validation
 * @returns Zod schema for form validation
 */
function buildSchemaForValues(
  values: ExpenseFormValues,
  options: Omit<ExpenseFormOptions, 'schema'>,
  intl: IntlShape,
  pickSchemaFields?: Record<string, boolean>,
): z.ZodType<RecursivePartial<ExpenseFormValues>, z.ZodObjectDef, RecursivePartial<ExpenseFormValues>> {
  const requiredMessage = { message: intl.formatMessage({ defaultMessage: 'Required', id: 'Seanpx' }) };
  const schema = z.object({
    accountSlug: z
      .string()
      .nullish()
      .refine(slug => {
        return slug && !slug.startsWith('__');
      }, requiredMessage)
      .refine(
        accountSlug => {
          if (!accountSlug) {
            return false;
          }
          if (!options.supportedExpenseTypes) {
            return true;
          }

          if (
            values.expenseTypeOption === ExpenseType.GRANT &&
            !options.supportedExpenseTypes.includes(ExpenseType.GRANT)
          ) {
            return false;
          }

          if (
            values.expenseTypeOption !== ExpenseType.GRANT &&
            !supportsBaseExpenseTypes(options.supportedExpenseTypes)
          ) {
            return false;
          }

          return true;
        },
        () => ({
          message: intl.formatMessage({
            defaultMessage: 'The selected account does not support expense submissions.',
            id: '6dZw2w',
          }),
        }),
      ),
    payeeSlug: z
      .string()
      .nullish()
      .refine(slug => {
        if (slug === PAYEE_SLUG_INVITE || slug === PAYEE_SLUG_INVITE_EXISTING_USER) {
          return true;
        }

        return options.expense?.status === ExpenseStatus.DRAFT && !options.loggedInAccount
          ? true
          : slug && !slug.startsWith('__');
      }, requiredMessage),
    expenseId: z.number().nullish(),
    expenseTypeOption: z.nativeEnum(ExpenseType).refine(v => {
      if (v === ExpenseType.GRANT && options.account?.type === CollectiveType.FUND) {
        return true;
      }

      if (options.account?.supportedExpenseTypes?.length > 0) {
        return options.account.supportedExpenseTypes.includes(v);
      }

      return true;
    }, requiredMessage),
    payoutMethodId: z
      .string()
      .nullish()
      .refine(v => {
        if (
          [PAYEE_SLUG_INVITE, PAYEE_SLUG_INVITE_SOMEONE, PAYEE_SLUG_INVITE_EXISTING_USER].includes(values.payeeSlug)
        ) {
          return true;
        }
        if (
          v === NEW_ACCOUNT_BALANCE_PAYOUT_METHOD_ID &&
          options.payoutMethods?.some(pm => pm.type === PayoutMethodType.ACCOUNT_BALANCE)
        ) {
          return true;
        }

        if (options.payee?.type === CollectiveType.VENDOR && !options.payee?.['hasPayoutMethod']) {
          return false;
        }

        // If the payee has a host and the payer account is under a different one, show the host's payout method (cross-host expense)
        if (v && v !== NEW_PAYOUT_METHOD_ID) {
          const payee = options.payee;
          const account = options.account;
          const host = account && 'host' in account ? account.host : null;
          if (payee?.['host'] && host && payee['host'].id !== host.id) {
            if (!payee['host'].payoutMethods?.some(pm => pm.id === v)) {
              return false;
            }
          } else if (!options.payee?.payoutMethods?.some(pm => pm.id === v)) {
            return false;
          }
        }

        return true;
      }, requiredMessage),
    accountingCategoryId: z
      .string()
      .nullish()
      .refine(v => {
        if (
          options.isAccountingCategoryRequired &&
          options.accountingCategories?.length > 0 &&
          !options.accountingCategories.some(ac => ac.id === v) &&
          !isNull(v) && // null represents "I don't know" and is a valid option
          values.expenseTypeOption !== ExpenseType.GRANT
        ) {
          return false;
        }

        return true;
      }, requiredMessage),
    title: z
      .string()
      .nullish()
      .refine(v => {
        if (
          [PAYEE_SLUG_INVITE, PAYEE_SLUG_INVITE_SOMEONE, PAYEE_SLUG_INVITE_EXISTING_USER].includes(values.payeeSlug) ||
          values.expenseTypeOption === ExpenseType.GRANT
        ) {
          return true;
        }

        return v.length > 0;
      }, requiredMessage)
      .refine(v => !v || v.length <= 255, {
        message: 'Expense description is too long (max 255 characters).',
      }),
    reference: z.string().optional(),
    tags: z.array(z.string()).optional(),
    privateMessage: z.string().optional().nullable(),
    recurrenceFrequency: z.nativeEnum(RecurrenceFrequencyOption).optional(),
    recurrenceEndAt: z
      .string()
      .nullish()
      .refine(recurrenceEndAt => isValidRecurrenceEndAt(values.recurrenceFrequency, recurrenceEndAt), {
        message: intl.formatMessage({ defaultMessage: 'End date must be in the future', id: 'd1V3ET' }),
      }),
    referenceCurrency: z
      .nativeEnum(Currency)
      .optional()
      .nullable()
      .refine(
        v => {
          // If multiple currencies are supported, the reference currency must be set
          if (options.availableReferenceCurrencies.length > 1) {
            return v && options.availableReferenceCurrencies.includes(v);
          } else {
            return !v || v === options.availableReferenceCurrencies[0];
          }
        },
        value => ({
          message: value
            ? intl.formatMessage({ defaultMessage: 'Invalid value', id: 'FormError.InvalidValue' })
            : intl.formatMessage({ defaultMessage: 'Required', id: 'Seanpx' }),
        }),
      ),
    expenseAttachedFiles: z
      .array(
        z.object({
          url: z.string().url(),
        }),
      )
      .optional()
      .nullable(),
    invoiceFile: z
      .union([
        z.string().url().nullish(),
        z.object({
          url: z.string().url().nullish(),
        }),
      ])
      .refine(attachment => {
        if (
          [PAYEE_SLUG_INVITE, PAYEE_SLUG_INVITE_SOMEONE, PAYEE_SLUG_INVITE_EXISTING_USER].includes(values.payeeSlug)
        ) {
          return true;
        }

        if (values.expenseTypeOption === ExpenseType.INVOICE && values.hasInvoiceOption === YesNoOption.YES) {
          return typeof attachment === 'string' ? !!attachment : !!attachment?.url;
        }
        return true;
      }, requiredMessage),
    invoiceNumber: z.string().nullish(),
    invoiceInfo: z.string().optional(),
    expenseItems: z.array(
      z
        .object({
          description: z
            .string()
            .nullish()
            .refine(v => {
              if (
                options.expense?.status !== ExpenseStatus.DRAFT &&
                !options.loggedInAccount &&
                !options.isAdminOfPayee &&
                options.payee?.type !== CollectiveType.VENDOR
              ) {
                return true;
              }

              return !isEmptyHTMLValue(v);
            }, requiredMessage),
          attachment: z
            .union([
              z.string().nullish(),
              z.object({
                url: z.string().nullish(),
              }),
            ])
            .nullish()
            .refine(attachment => {
              if (
                [ExpenseType.GRANT, ExpenseType.INVOICE, ExpenseType.SETTLEMENT, ExpenseType.PLATFORM_BILLING].includes(
                  values.expenseTypeOption,
                )
              ) {
                return true;
              }

              return typeof attachment === 'string' ? !!attachment : !!attachment?.url;
            }, requiredMessage),
          incurredAt: z
            .string()
            .nullish()
            .refine(incurredAt => {
              if (
                options.expense?.status !== ExpenseStatus.DRAFT &&
                !options.isAdminOfPayee &&
                options.payee?.type !== CollectiveType.VENDOR
              ) {
                return true; // For invites
              } else if (values.expenseTypeOption === ExpenseType.GRANT) {
                return true;
              }

              return !!incurredAt;
            }, requiredMessage),
          amount: z.object({
            valueInCents: z.number().min(1),
            currency: z.string().refine(
              v => Object.values(Currency).includes(v as Currency),
              () => ({
                message: intl.formatMessage(
                  {
                    id: 'FormError.enum',
                    defaultMessage: 'Must be one of: {options}',
                  },
                  {
                    options: Object.values(Currency).join(','),
                  },
                ),
              }),
            ),
            exchangeRate: z
              .object({
                value: z.number(),
                source: z.string(),
                fromCurrency: z.string(),
                toCurrency: z.string(),
                date: z.string().nullable(),
              })
              .nullable(),
          }),
        })
        .refine(
          item => {
            if (item.amount.currency && item.amount.currency !== options.expenseCurrency) {
              return (
                item.amount.exchangeRate?.value &&
                item.amount.exchangeRate?.source &&
                item.amount.exchangeRate?.toCurrency === options.expenseCurrency
              );
            }
            return true;
          },
          () => ({
            message: intl.formatMessage({ defaultMessage: 'Missing exchange rate', id: 'UXE8lX' }),
            path: ['amount', 'exchangeRate', 'value'],
          }),
        ),
    ),
    hasTax: z.boolean().nullable(),
    tax: z
      .object({
        rate: z
          .number()
          .refine(
            v => {
              if (options.taxType !== TaxType.GST) {
                return true;
              }
              return [0, 0.15].includes(v);
            },
            () => ({
              message: intl.formatMessage(
                {
                  id: 'FormError.enum',
                  defaultMessage: 'Must be one of: {options}',
                },
                {
                  options: '0%, 15%',
                },
              ),
            }),
          )
          .refine(
            v => {
              if (options.taxType !== TaxType.VAT) {
                return true;
              }

              return v >= 0 && v < 1;
            },
            () => ({
              message: intl.formatMessage(
                { defaultMessage: 'Value must be between {min} and {max}', id: 'f5QMcL' },
                { min: '0%', max: '100%' },
              ),
            }),
          ),
        idNumber: z
          .string()
          .nullable()
          .refine(
            v => {
              if (options.taxType !== TaxType.VAT) {
                return true;
              }

              return checkVATNumberFormat(v).isValid;
            },
            () => ({
              message: intl.formatMessage({ defaultMessage: 'Invalid VAT Number', id: 'zL/Rl8' }),
            }),
          ),
      })
      .nullable()
      .refine(v => {
        if (!values.hasTax) {
          return true;
        }

        return !!v;
      }),
    acknowledgedCollectiveInvoiceExpensePolicy: z
      .boolean()
      .nullish()
      .refine(
        v =>
          values.expenseTypeOption === ExpenseType.INVOICE && options.account?.policies?.EXPENSE_POLICIES?.invoicePolicy
            ? v
            : true,
        requiredMessage,
      ),
    acknowledgedCollectiveReceiptExpensePolicy: z
      .boolean()
      .nullish()
      .refine(
        v =>
          values.expenseTypeOption === ExpenseType.RECEIPT && options.account?.policies?.EXPENSE_POLICIES?.receiptPolicy
            ? v
            : true,
        requiredMessage,
      ),
    acknowledgedCollectiveTitleExpensePolicy: z
      .boolean()
      .nullish()
      .refine(v => {
        if (values.expenseTypeOption === ExpenseType.GRANT) {
          return true;
        }
        return options.account?.policies?.EXPENSE_POLICIES?.titlePolicy ? v : true;
      }, requiredMessage),
    acknowledgedCollectiveGrantExpensePolicy: z
      .boolean()
      .nullish()
      .refine(
        v =>
          values.expenseTypeOption === ExpenseType.GRANT && options.account?.policies?.EXPENSE_POLICIES?.grantPolicy
            ? v
            : true,
        requiredMessage,
      ),
    acknowledgedHostInvoiceExpensePolicy: z
      .boolean()
      .nullish()
      .refine(
        v =>
          values.expenseTypeOption === ExpenseType.INVOICE &&
          options.host?.policies?.EXPENSE_POLICIES?.invoicePolicy &&
          options.host?.slug !== options.account?.slug
            ? v
            : true,
        requiredMessage,
      ),
    acknowledgedHostReceiptExpensePolicy: z
      .boolean()
      .nullish()
      .refine(
        v =>
          values.expenseTypeOption === ExpenseType.RECEIPT &&
          options.host?.policies?.EXPENSE_POLICIES?.receiptPolicy &&
          options.host?.slug !== options.account?.slug
            ? v
            : true,
        requiredMessage,
      ),
    acknowledgedHostTitleExpensePolicy: z
      .boolean()
      .nullish()
      .refine(v => {
        if (values.expenseTypeOption === ExpenseType.GRANT) {
          return true;
        }
        return options.host?.policies?.EXPENSE_POLICIES?.titlePolicy && options.host?.slug !== options.account?.slug
          ? v
          : true;
      }, requiredMessage),
    acknowledgedHostGrantExpensePolicy: z
      .boolean()
      .nullish()
      .refine(
        v =>
          values.expenseTypeOption === ExpenseType.GRANT &&
          options.host?.policies?.EXPENSE_POLICIES?.grantPolicy &&
          options.host?.slug !== options.account?.slug
            ? v
            : true,
        requiredMessage,
      ),
    payoutMethodNameDiscrepancyReason: z.string().nullish().optional(),
    // See https://github.com/opencollective/opencollective/issues/8306
    // .refine(v => {
    //   if (options.payoutMethod?.type === PayoutMethodType.BANK_ACCOUNT) {
    //     const accountHolderName: string = options.payoutMethod?.data?.accountHolderName ?? '';
    //     const payeeLegalName: string = options.payee?.legalName ?? options.payee?.name ?? '';
    //     if (accountHolderName.trim().toLowerCase() !== payeeLegalName.trim().toLowerCase()) {
    //       return !!v;
    //     }
    //   }

    //   return true;
    // }, requiredMessage)
    newPayoutMethod: z.object({
      type: z
        .nativeEnum(PayoutMethodType)
        .nullish()
        .refine(type => {
          if (
            [PAYEE_SLUG_INVITE, PAYEE_SLUG_INVITE_SOMEONE, PAYEE_SLUG_INVITE_EXISTING_USER].includes(values.payeeSlug)
          ) {
            return true;
          }

          if (options.payee?.type === CollectiveType.VENDOR && !options.isHostAdmin) {
            return true;
          }

          if (options.expense?.status === ExpenseStatus.DRAFT && !options.loggedInAccount) {
            return !!type;
          }

          if (!values.payoutMethodId || values.payoutMethodId === NEW_PAYOUT_METHOD_ID) {
            return !!type;
          }

          return true;
        }, requiredMessage),
      name: z.string().nullish(),
      data: z
        .object({
          currency: z
            .string()
            .nullish()
            .refine(currency => {
              if (
                [PAYEE_SLUG_INVITE, PAYEE_SLUG_INVITE_SOMEONE, PAYEE_SLUG_INVITE_EXISTING_USER].includes(
                  values.payeeSlug,
                )
              ) {
                return true;
              }

              if (options.payee?.type === CollectiveType.VENDOR && !options.isHostAdmin) {
                return true;
              }

              if (values.payoutMethodId === NEW_ACCOUNT_BALANCE_PAYOUT_METHOD_ID) {
                return true;
              }

              if (values.payoutMethodId === NEW_PAYOUT_METHOD_ID) {
                return !!currency;
              }

              return true;
            }, requiredMessage),
        })
        .nullish(),
    }),
    inviteNote: z.string().nullish(),
    inviteeExistingAccount: z
      .string()
      .nullish()
      .refine(inviteeExistingAccount => {
        if (values.payeeSlug === PAYEE_SLUG_INVITE_EXISTING_USER) {
          return !!inviteeExistingAccount;
        }

        return true;
      }, requiredMessage),
    inviteeNewIndividual: z.object({
      name: z
        .string()
        .nullish()
        .refine(name => {
          if (values.payeeSlug === PAYEE_SLUG_INVITE && values.inviteeAccountType === InviteeAccountType.INDIVIDUAL) {
            return !isEmpty(name);
          }

          return true;
        }, requiredMessage),
      email: z
        .string()
        .nullish()
        .refine(email => {
          if (values.payeeSlug === PAYEE_SLUG_INVITE && values.inviteeAccountType === InviteeAccountType.INDIVIDUAL) {
            return isValidEmail(email);
          }

          return true;
        }, requiredMessage)
        .refine(
          email => {
            if (email) {
              return isValidEmail(email);
            }

            return true;
          },
          () => ({
            message: intl.formatMessage({
              defaultMessage: 'This email address is not valid',
              id: 'FormError.InvalidEmail',
            }),
          }),
        ),
    }),
    inviteeNewOrganization: z.object({
      name: z
        .string()
        .nullish()
        .refine(name => {
          if (values.payeeSlug === PAYEE_SLUG_INVITE && values.inviteeAccountType === InviteeAccountType.ORGANIZATION) {
            return !isEmpty(name);
          }

          return true;
        }, requiredMessage),
      email: z
        .string()
        .nullish()
        .refine(email => {
          if (values.payeeSlug === PAYEE_SLUG_INVITE && values.inviteeAccountType === InviteeAccountType.ORGANIZATION) {
            return !!email;
          }

          return true;
        }, requiredMessage)
        .refine(
          email => {
            if (email) {
              return isValidEmail(email);
            }

            return true;
          },
          () => ({
            message: intl.formatMessage({
              defaultMessage: 'This email address is not valid',
              id: 'FormError.InvalidEmail',
            }),
          }),
        ),
      organization: z
        .object({
          name: z
            .string()
            .nullish()
            .refine(name => {
              if (
                values.payeeSlug === PAYEE_SLUG_INVITE &&
                values.inviteeAccountType === InviteeAccountType.ORGANIZATION
              ) {
                return !isEmpty(name);
              }

              return true;
            }, requiredMessage),
          slug: z
            .string()
            .nullish()
            .refine(slug => {
              if (
                values.payeeSlug === PAYEE_SLUG_INVITE &&
                values.inviteeAccountType === InviteeAccountType.ORGANIZATION
              ) {
                return !isEmpty(slug);
              }

              return true;
            }, requiredMessage),
          website: z.string().nullish(),
          description: z
            .string()
            .nullish()
            .refine(description => {
              if (
                values.payeeSlug === PAYEE_SLUG_INVITE &&
                values.inviteeAccountType === InviteeAccountType.ORGANIZATION
              ) {
                return !isEmpty(description);
              }

              return true;
            }, requiredMessage),
        })
        .nullish()
        .refine(organization => {
          if (values.payeeSlug === PAYEE_SLUG_INVITE && values.inviteeAccountType === InviteeAccountType.ORGANIZATION) {
            return !!organization;
          }

          return true;
        }, requiredMessage),
    }),
  });

  const addRefine = (schema, pickSchemaFields) => {
    return schema.superRefine((value, ctx) => {
      if (!pickSchemaFields || (pickSchemaFields['accountSlug'] && pickSchemaFields['payeeSlug'])) {
        if (value.accountSlug && value.payeeSlug && value.accountSlug === value.payeeSlug) {
          const issue = {
            code: z.ZodIssueCode.custom,
            message: intl.formatMessage({
              id: 'ExpenseForm.PayerPayeeMustDiffer',
              defaultMessage: 'The account paying and the account getting paid must be different.',
            }),
          };

          ctx.addIssue({ ...issue, path: ['accountSlug'] });
          ctx.addIssue({ ...issue, path: ['payeeSlug'] });
        }
      }
    });
  };

  return addRefine(
    pickSchemaFields ? schema.pick(pickSchemaFields as { [K in keyof z.infer<typeof schema>]?: true }) : schema,
    pickSchemaFields,
  );
}

type ExpenseFormSchema = z.ZodType<RecursivePartial<ExpenseFormValues>>;

/**
 * Builds the validation schema of the Expense form from its options.
 *
 * @param pickSchemaFields Optional field filtering for partial validation
 */
export function buildFormSchema(
  options: Omit<ExpenseFormOptions, 'schema'>,
  intl: IntlShape,
  pickSchemaFields?: Record<string, boolean>,
): ExpenseFormSchema {
  const errorMap = getCustomZodErrorMap(intl);
  return z.custom<RecursivePartial<ExpenseFormValues>>().superRefine((values, ctx) => {
    const result = buildSchemaForValues(values as ExpenseFormValues, options, intl, pickSchemaFields).safeParse(
      values,
      {
        errorMap,
      },
    );
    if (!result.success) {
      result.error.issues.forEach(issue => ctx.addIssue({ ...issue, code: z.ZodIssueCode.custom }));
    }
  });
}
