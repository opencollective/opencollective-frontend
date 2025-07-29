import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { DialogClose } from '@radix-ui/react-dialog';
import { Form, FormikProvider, useFormikContext } from 'formik';
import { pick } from 'lodash';
import { Pen } from 'lucide-react';
import type { IntlShape } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import {
  type Currency,
  type CurrencyExchangeRateInput,
  ExpenseType,
  PayoutMethodType,
} from '../../lib/graphql/types/v2/graphql';
import { cn } from '../../lib/utils';
import { getAccountReferenceInput } from '@/lib/collective';
import { type Expense, ExpenseLockableFields } from '@/lib/graphql/types/v2/schema';

import CollectivePicker from '../CollectivePicker';
import { accountsQuery } from '../dashboard/sections/accounts/queries';
import { FormField } from '../FormField';
import { FormikZod } from '../FormikZod';
import MessageBox from '../MessageBox';
import {
  AdditionalAttachments,
  ExpenseItemsForm,
  ExpenseItemWrapper,
} from '../submit-expense/form/ExpenseItemsSection';
import { PayoutMethodFormContent } from '../submit-expense/form/PayoutMethodSection';
import { InvoiceFormOption } from '../submit-expense/form/TypeOfExpenseSection';
import { WhoIsGettingPaidForm } from '../submit-expense/form/WhoIsGettingPaidSection';
import { InviteeAccountType, useExpenseForm, YesNoOption } from '../submit-expense/useExpenseForm';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Collapsible, CollapsibleContent } from '../ui/Collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/Dialog';
import { Label } from '../ui/Label';
import { RadioGroup, RadioGroupCard } from '../ui/RadioGroup';
import { Skeleton } from '../ui/Skeleton';
import type { StepItem } from '../ui/Stepper';
import { Step, Stepper, useStepper } from '../ui/Stepper';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';
import { toast } from '../ui/useToast';

import { editExpenseMutation, moveExpenseMutation } from './graphql/mutations';

const RenderFormFields = ({ field, onSubmit, expense, handleClose }) => {
  switch (field) {
    case 'title':
      return <EditExpenseTitle onSubmit={onSubmit} expense={expense} />;
    case 'type':
      return <EditExpenseType onSubmit={onSubmit} expense={expense} />;
    case 'attachReceipts':
      return <AttachReceipts onSubmit={onSubmit} expense={expense} />;
    case 'expenseDetails':
      return <EditExpenseDetails onSubmit={onSubmit} expense={expense} />;
    case 'payoutMethod':
      return <EditPayoutMethod onSubmit={onSubmit} expense={expense} />;
    case 'payee':
      return <EditPayee onSubmit={onSubmit} expense={expense} />;
    case 'paidBy':
      return <EditPaidBy expense={expense} handleClose={handleClose} />;
  }
};

const EditPaidBy = ({ expense, handleClose }) => {
  const schema = z.object({
    destinationAccount: z.object({
      id: z.string().optional(),
      slug: z.string().optional(),
      name: z.string().optional(),
    }),
  });

  const { data, loading } = useQuery(accountsQuery, {
    variables: {
      accountSlug: expense.account.parent?.slug ?? expense.account.slug,
      limit: 100, // TODO: This is the max limit of childrenAccounts, when refactoring the Collective Picker Async to work with GQL v2, this limitation can be worked around
    },
    context: API_V2_CONTEXT,
  });

  const activeAccounts = React.useMemo(
    () =>
      data?.account ? [data?.account, ...(data?.account?.childrenAccounts?.nodes.filter(a => a.isActive) || [])] : [],
    [data?.account],
  );

  const intl = useIntl();
  const [moveExpense, { loading: submitting }] = useMutation(moveExpenseMutation, {
    context: API_V2_CONTEXT,
  });

  const onSubmit = React.useCallback(
    async values => {
      try {
        const { data } = await moveExpense({
          variables: {
            expense: { id: expense.id },
            destinationAccount: getAccountReferenceInput(values.destinationAccount),
          },
        });
        handleClose();
        toast({
          variant: 'success',
          message: (
            <FormattedMessage
              defaultMessage="Expense moved to {accountName}"
              id="v+/yA3"
              values={{ accountName: data.moveExpense.account.name }}
            />
          ),
        });
      } catch (err) {
        toast({ variant: 'error', message: i18nGraphqlException(intl, err) });
      }
    },
    [moveExpense, handleClose, intl, expense.id],
  );
  const isLoading = loading || submitting;

  const initialValues = {
    destinationAccount: {
      id: expense.account.id,
      name: expense.account.name,
      slug: expense.account.slug,
    },
  };

  return (
    <FormikZod<z.infer<typeof schema>>
      schema={schema}
      initialValues={initialValues}
      onSubmit={values => onSubmit(schema.parse(values))}
    >
      {({ setFieldValue, values }) => {
        // Check if the selected account is the same as the current expense account
        const isSameAccount = values.destinationAccount?.id === expense.account.id;

        return (
          <Form className="space-y-4">
            <FormField name="destinationAccount">
              {({ field }) => (
                <CollectivePicker
                  inputId={field.id}
                  collective={field.value}
                  collectives={activeAccounts}
                  onChange={({ value }) => {
                    setFieldValue('destinationAccount', value);
                  }}
                />
              )}
            </FormField>
            <EditExpenseActionButtons disabled={isSameAccount || isLoading} loading={submitting} />
          </Form>
        );
      }}
    </FormikZod>
  );
};

const EditPayee = ({ expense, onSubmit }) => {
  const formRef = React.useRef<HTMLFormElement>(undefined);
  const startOptions = React.useRef({
    expenseId: expense.legacyId,
    isInlineEdit: true,
    pickSchemaFields: { expenseItems: true, hasTax: true, tax: true, payoutMethodId: true, payeeSlug: true },
  });
  const transformedOnSubmit = React.useCallback(
    async (values, h, formOptions) => {
      const editValues = {
        payee: {
          slug: formOptions.payee?.slug,
        },
        ...(formOptions.payee?.slug !== expense.payee.slug && {
          payeeLocation: values.payeeLocation,
          currency: formOptions.expenseCurrency,
          items: values.expenseItems.map(ei => ({
            id: ei.id,
            description: ei.description,
            amountV2: {
              valueInCents: ei.amount.valueInCents,
              currency: ei.amount.currency as Currency,
              exchangeRate: ei.amount.exchangeRate
                ? ({
                    ...pick(ei.amount.exchangeRate, ['source', 'rate', 'value', 'fromCurrency', 'toCurrency']),
                    date: new Date(ei.amount.exchangeRate.date || ei.incurredAt),
                  } as CurrencyExchangeRateInput)
                : null,
            },
            incurredAt: new Date(ei.incurredAt),
            url: typeof ei.attachment === 'string' ? ei.attachment : ei.attachment?.url,
          })),
          payoutMethod:
            !values.payoutMethodId || values.payoutMethodId === '__newPayoutMethod'
              ? { ...values.newPayoutMethod, isSaved: false }
              : values.payoutMethodId === '__newAccountBalancePayoutMethod'
                ? {
                    type: PayoutMethodType.ACCOUNT_BALANCE,
                    data: {},
                  }
                : {
                    id: values.payoutMethodId,
                  },
        }),
      };
      return onSubmit(editValues);
    },
    [expense.payee.slug, onSubmit],
  );

  const expenseForm = useExpenseForm({
    formRef,
    initialValues: {
      inviteeAccountType: InviteeAccountType.INDIVIDUAL,
      expenseItems: [
        {
          amount: {
            valueInCents: 0,
            currency: 'USD',
          },
          description: '',
        },
      ],
      hasInvoiceOption: YesNoOption.YES,
      inviteeNewIndividual: {},
      inviteeNewOrganization: {
        organization: {},
      },
      newPayoutMethod: {
        data: {},
      },
    },
    startOptions: startOptions.current,
    onSubmit: transformedOnSubmit,
  });

  const hasChangedPayee =
    expenseForm.values.payeeSlug &&
    expenseForm.values.payeeSlug !== expense.payee.slug &&
    !expenseForm.values.payeeSlug.startsWith('__');
  return (
    <FormikProvider value={expenseForm}>
      <form className="space-y-6" ref={formRef} onSubmit={e => e.preventDefault()}>
        <WhoIsGettingPaidForm {...WhoIsGettingPaidForm.getFormProps(expenseForm)} />
        <Collapsible open={hasChangedPayee}>
          <CollapsibleContent>
            <div className="space-y-3">
              <Label>
                <FormattedMessage defaultMessage="Pick new payout method" id="expense.pickPayoutMethod" />
              </Label>
              <PayoutMethodFormContent {...PayoutMethodFormContent.getFormProps(expenseForm)} />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <EditExpenseActionButtons
          disabled={!hasChangedPayee || expenseForm.initialLoading}
          handleSubmit={expenseForm.handleSubmit}
        />
      </form>
    </FormikProvider>
  );
};

const EditPayoutMethod = ({ expense, onSubmit }) => {
  const formRef = React.useRef<HTMLFormElement>(undefined);
  const startOptions = React.useRef({
    expenseId: expense.legacyId,
    isInlineEdit: true,
    pickSchemaFields: {
      expenseItems: true,
      hasTax: true,
      tax: true,
      payoutMethodId: true,
      payee: true,
      payeeLocation: true,
    },
  });
  const transformedOnSubmit = React.useCallback(
    async (values, h, formOptions) => {
      const editValues = {
        payoutMethod:
          !values.payoutMethodId || values.payoutMethodId === '__newPayoutMethod'
            ? { ...values.newPayoutMethod, isSaved: false }
            : values.payoutMethodId === '__newAccountBalancePayoutMethod'
              ? {
                  type: PayoutMethodType.ACCOUNT_BALANCE,
                  data: {},
                }
              : {
                  id: values.payoutMethodId,
                },
        payee: {
          slug: formOptions.payee?.slug,
        },
        payeeLocation: values.payeeLocation,
        currency: formOptions.expenseCurrency,
        items: values.expenseItems.map(ei => ({
          id: ei.id,
          description: ei.description,
          amountV2: {
            valueInCents: ei.amount.valueInCents,
            currency: ei.amount.currency as Currency,
            exchangeRate: ei.amount.exchangeRate
              ? ({
                  ...pick(ei.amount.exchangeRate, ['source', 'rate', 'value', 'fromCurrency', 'toCurrency']),
                  date: ei.amount.exchangeRate.date || ei.incurredAt,
                } as CurrencyExchangeRateInput)
              : null,
          },
          incurredAt: new Date(ei.incurredAt),
          url: typeof ei.attachment === 'string' ? ei.attachment : ei.attachment?.url,
        })),
      };
      return onSubmit(editValues);
    },
    [onSubmit],
  );

  const expenseForm = useExpenseForm({
    formRef,
    initialValues: {
      inviteeAccountType: InviteeAccountType.INDIVIDUAL,
      expenseItems: [
        {
          amount: {
            valueInCents: 0,
            currency: 'USD',
          },
          description: '',
        },
      ],
      inviteeNewIndividual: {},
      inviteeNewOrganization: {
        organization: {},
      },
      newPayoutMethod: {
        data: {},
      },
    },
    startOptions: startOptions.current,
    onSubmit: transformedOnSubmit,
  });

  return (
    <FormikProvider value={expenseForm}>
      <form className="space-y-4" ref={formRef} onSubmit={e => e.preventDefault()}>
        <PayoutMethodFormContent {...PayoutMethodFormContent.getFormProps(expenseForm)} />
        <EditExpenseActionButtons disabled={expenseForm.initialLoading} handleSubmit={expenseForm.handleSubmit} />
      </form>
    </FormikProvider>
  );
};

const EditExpenseDetails = ({ expense, onSubmit }) => {
  const formRef = React.useRef<HTMLFormElement>(undefined);
  const startOptions = React.useRef({
    expenseId: expense.legacyId,
    isInlineEdit: true,
    pickSchemaFields: {
      expenseItems: true,
      hasTax: true,
      tax: true,
      expenseAttachedFiles: true,
      invoiceFile: true,
      invoiceNumber: true,
    },
  });
  const transformedOnSubmit = values => {
    let invoiceFile;
    if (values.hasInvoiceOption === YesNoOption.YES && values.invoiceFile) {
      invoiceFile = { url: typeof values.invoiceFile === 'string' ? values.invoiceFile : values.invoiceFile.url };
    } else if (values.hasInvoiceOption === YesNoOption.NO) {
      invoiceFile = null;
    }

    const editValues = {
      items: values.expenseItems.map(ei => ({
        id: ei.id,
        description: ei.description,
        amountV2: {
          valueInCents: ei.amount.valueInCents,
          currency: ei.amount.currency as Currency,
          exchangeRate: ei.amount.exchangeRate
            ? ({
                ...pick(ei.amount.exchangeRate, ['source', 'rate', 'value', 'fromCurrency', 'toCurrency']),
                date: ei.amount.exchangeRate.date || ei.incurredAt,
              } as CurrencyExchangeRateInput)
            : null,
        },
        incurredAt: new Date(ei.incurredAt),
        url: typeof ei.attachment === 'string' ? ei.attachment : (ei.attachment?.url ?? null),
      })),
      attachedFiles: values.additionalAttachments.map(a => ({
        url: typeof a === 'string' ? a : a?.url,
      })),
      invoiceFile,
      reference: values.invoiceNumber,
    };
    return onSubmit(editValues);
  };

  const expenseForm = useExpenseForm({
    formRef,
    initialValues: {
      inviteeAccountType: InviteeAccountType.INDIVIDUAL,
      expenseItems: [
        {
          amount: {
            valueInCents: 0,
            currency: 'USD',
          },
          description: '',
        },
      ],
      additionalAttachments: [],
      hasInvoiceOption: YesNoOption.YES,
      inviteeNewIndividual: {},
      inviteeNewOrganization: {
        organization: {},
      },
      newPayoutMethod: {
        data: {},
      },
    },
    startOptions: startOptions.current,
    onSubmit: transformedOnSubmit,
  });

  return (
    <FormikProvider value={expenseForm}>
      <form className="space-y-4" ref={formRef} onSubmit={e => e.preventDefault()}>
        <ExpenseItemsForm {...ExpenseItemsForm.getFormProps(expenseForm)} />
        {expenseForm.values.expenseTypeOption === ExpenseType.INVOICE && (
          <InvoiceFormOption {...InvoiceFormOption.getFormProps(expenseForm)} />
        )}
        <AdditionalAttachments {...AdditionalAttachments.getFormProps(expenseForm)} />
        <EditExpenseActionButtons disabled={expenseForm.initialLoading} handleSubmit={expenseForm.handleSubmit} />
      </form>
    </FormikProvider>
  );
};

const AttachReceipts = ({ expense, onSubmit }) => {
  const formRef = React.useRef<HTMLFormElement>(undefined);
  const startOptions = React.useRef({
    expenseId: expense.legacyId,
    isInlineEdit: true,
    pickSchemaFields: {
      expenseItems: true,
    },
  });
  const transformedOnSubmit = values => {
    const editValues = {
      items: values.expenseItems.map(ei => ({
        id: ei.id,
        description: ei.description,
        amountV2: {
          valueInCents: ei.amount.valueInCents,
          currency: ei.amount.currency as Currency,
          exchangeRate: ei.amount.exchangeRate
            ? ({
                ...pick(ei.amount.exchangeRate, ['source', 'rate', 'value', 'fromCurrency', 'toCurrency']),
                date: ei.amount.exchangeRate.date || ei.incurredAt,
              } as CurrencyExchangeRateInput)
            : null,
        },
        incurredAt: new Date(ei.incurredAt),
        url: typeof ei.attachment === 'string' ? ei.attachment : (ei.attachment?.url ?? null),
      })),
      attachedFiles: values.additionalAttachments.map(a => ({
        url: typeof a === 'string' ? a : a?.url,
      })),
    };
    return onSubmit(editValues);
  };

  const expenseForm = useExpenseForm({
    formRef,
    initialValues: {
      inviteeAccountType: InviteeAccountType.INDIVIDUAL,
      expenseItems: [
        {
          amount: {
            valueInCents: 0,
            currency: 'USD',
          },
          description: '',
        },
      ],
      additionalAttachments: [],
      hasInvoiceOption: YesNoOption.YES,
      inviteeNewIndividual: {},
      inviteeNewOrganization: {
        organization: {},
      },
      newPayoutMethod: {
        data: {},
      },
      expenseTypeOption: ExpenseType.CHARGE,
    },
    startOptions: startOptions.current,
    onSubmit: transformedOnSubmit,
  });

  return (
    <FormikProvider value={expenseForm}>
      <form className="space-y-4" ref={formRef} onSubmit={e => e.preventDefault()}>
        {expenseForm.initialLoading ? (
          <Skeleton className="h-42 w-full" />
        ) : (
          <div className="space-y-4">
            {expenseForm.values.expenseItems.map((item, i) => (
              <ExpenseItemWrapper
                key={item.id}
                index={i}
                isAmountLocked={true}
                isDateLocked={true}
                isSubjectToTax={Boolean(expenseForm.options.taxType)}
              />
            ))}
          </div>
        )}

        <EditExpenseActionButtons disabled={expenseForm.initialLoading} handleSubmit={expenseForm.handleSubmit} />
      </form>
    </FormikProvider>
  );
};

const getEditExpenseTypeSteps = (intl: IntlShape): StepItem[] => {
  return [
    {
      id: 'type',
      label: intl.formatMessage({ defaultMessage: 'Change type', id: '+KQjHt' }),
    },
    {
      id: 'details',
      label: intl.formatMessage({ defaultMessage: 'Update details', id: '9HFIjd' }),
    },
  ];
};

const EditExpenseType = ({ expense, onSubmit }) => {
  const intl = useIntl();

  const formRef = React.useRef<HTMLFormElement>(undefined);
  const startOptions = React.useRef({
    expenseId: expense.legacyId,
    isInlineEdit: true,
    pickSchemaFields: {
      expenseItems: true,
      hasTax: true,
      tax: true,
      expenseAttachedFiles: true,
      invoiceFile: true,
      invoiceNumber: true,
      expenseTypeOption: true,
    },
  });
  const transformedOnSubmit = values => {
    const editValues = {
      items: values.expenseItems.map(ei => ({
        id: ei.id,
        description: ei.description,
        amountV2: {
          valueInCents: ei.amount.valueInCents,
          currency: ei.amount.currency as Currency,
          exchangeRate: ei.amount.exchangeRate
            ? ({
                ...pick(ei.amount.exchangeRate, ['source', 'rate', 'value', 'fromCurrency', 'toCurrency']),
                date: ei.amount.exchangeRate.date || ei.incurredAt,
              } as CurrencyExchangeRateInput)
            : null,
        },
        incurredAt: new Date(ei.incurredAt),
        url: typeof ei.attachment === 'string' ? ei.attachment : (ei.attachment?.url ?? null),
      })),
      attachedFiles: values.additionalAttachments.map(a => ({
        url: typeof a === 'string' ? a : a?.url,
      })),
      invoiceFile:
        values.hasInvoiceOption === YesNoOption.NO
          ? null
          : values.invoiceFile
            ? { url: typeof values.invoiceFile === 'string' ? values.invoiceFile : values.invoiceFile.url }
            : undefined,
      reference: values.invoiceNumber,
      type: values.expenseTypeOption,
    };
    return onSubmit(editValues);
  };

  const expenseForm = useExpenseForm({
    formRef,
    initialValues: {
      inviteeAccountType: InviteeAccountType.INDIVIDUAL,
      expenseItems: [
        {
          amount: {
            valueInCents: 0,
            currency: 'USD',
          },
          description: '',
        },
      ],
      additionalAttachments: [],
      hasInvoiceOption: YesNoOption.YES,
      inviteeNewIndividual: {},
      inviteeNewOrganization: {
        organization: {},
      },
      newPayoutMethod: {
        data: {},
      },
    },
    startOptions: startOptions.current,
    onSubmit: transformedOnSubmit,
  });

  const steps = React.useMemo(() => getEditExpenseTypeSteps(intl), [intl]);

  return (
    <FormikProvider value={expenseForm}>
      <form className="space-y-4" ref={formRef} onSubmit={e => e.preventDefault()}>
        <Stepper initialStep={0} steps={steps} orientation="horizontal" className="mb-4">
          {steps.map(stepProps => {
            return (
              <Step key={stepProps.id} {...stepProps}>
                {stepProps.id === 'type' ? (
                  <React.Fragment>
                    {expenseForm.initialLoading ? (
                      <Skeleton className="h-20 w-full" />
                    ) : (
                      <ExpenseTypeStep expenseForm={expenseForm} />
                    )}
                  </React.Fragment>
                ) : stepProps.id === 'details' ? (
                  <EditTypeDetailsStep expenseForm={expenseForm} />
                ) : null}
              </Step>
            );
          })}
        </Stepper>
      </form>
    </FormikProvider>
  );
};

const ExpenseTypeStep = ({ expenseForm }) => {
  const { nextStep } = useStepper();

  return (
    <React.Fragment>
      <RadioGroup
        disabled={expenseForm.options.lockedFields?.includes?.(ExpenseLockableFields.TYPE) || expenseForm.isSubmitting}
        value={expenseForm.values.expenseTypeOption}
        onValueChange={newValue => expenseForm.setFieldValue('expenseTypeOption', newValue as ExpenseType)}
        className="flex"
      >
        <RadioGroupCard
          className="grow basis-0"
          value={ExpenseType.INVOICE}
          disabled={expenseForm.initialLoading || expenseForm.isSubmitting}
        >
          <div>
            <div className="mb-1 flex items-center justify-between gap-1">
              <div className="font-bold">
                <FormattedMessage defaultMessage="Invoice" id="Expense.Type.Invoice" />
              </div>
              {expenseForm.options.expense?.type === ExpenseType.INVOICE && (
                <Badge type="info" size="sm">
                  <FormattedMessage id="Expense.Type.current" defaultMessage="Current" />
                </Badge>
              )}
            </div>
            <div className="text-muted-foreground">
              <FormattedMessage defaultMessage="I am submitting an invoice to get paid" id="plK07+" />
            </div>
          </div>
        </RadioGroupCard>

        <RadioGroupCard
          className="grow basis-0"
          value={ExpenseType.RECEIPT}
          disabled={expenseForm.initialLoading || expenseForm.isSubmitting}
        >
          <div>
            <div className="mb-1 flex items-center justify-between gap-1">
              <div className="font-bold">
                <FormattedMessage defaultMessage="Reimbursement" id="ExpenseForm.ReceiptLabel" />
              </div>
              {expenseForm.options.expense?.type === ExpenseType.RECEIPT && (
                <Badge type="info" size="sm">
                  <FormattedMessage id="Expense.Type.current" defaultMessage="Current" />
                </Badge>
              )}
            </div>

            <div className="text-muted-foreground">
              <FormattedMessage defaultMessage="I want a reimbursement for something I've paid for" id="ZQSnky" />
            </div>
          </div>
        </RadioGroupCard>
      </RadioGroup>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">
            <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
          </Button>
        </DialogClose>

        <Button
          disabled={
            expenseForm.initialLoading || expenseForm.options.expense?.type === expenseForm.values.expenseTypeOption
          }
          loading={expenseForm.isSubmitting}
          onClick={nextStep}
        >
          <FormattedMessage defaultMessage="Proceed" id="VNX4fn" />
        </Button>
      </DialogFooter>
    </React.Fragment>
  );
};

const EditTypeDetailsStep = ({ expenseForm }) => {
  const { prevStep } = useStepper();

  return (
    <React.Fragment>
      {expenseForm.values.expenseTypeOption === ExpenseType.RECEIPT && (
        <div className="space-y-4">
          {expenseForm.values.expenseItems[0].attachment ? (
            <MessageBox type="info">
              <FormattedMessage
                defaultMessage="The invoice file was moved to be the expense {count, plural, one {item} other {items}} attachment."
                id="EditExpense.InvoiceFileMovedToAttachment"
                values={{ count: expenseForm.values.expenseItems.length }}
              />
            </MessageBox>
          ) : (
            <MessageBox type="info">
              <FormattedMessage
                defaultMessage="You need to attach {count, plural, one {a receipt to the expense item} other {receipts to the expense items}}."
                id="EditExpense.AttachReceiptRequired"
                values={{ count: expenseForm.values.expenseItems.length }}
              />
            </MessageBox>
          )}

          {expenseForm.values.expenseItems.map((item, i) => (
            <ExpenseItemWrapper
              key={item.id}
              index={i}
              isAmountLocked={true}
              isDateLocked={true}
              isDescriptionLocked={true}
              isSubjectToTax={Boolean(expenseForm.options.taxType)}
            />
          ))}
        </div>
      )}
      {expenseForm.values.expenseTypeOption === ExpenseType.INVOICE && (
        <div className="space-y-4">
          <MessageBox type="info">
            <FormattedMessage
              defaultMessage="The expense {count, plural, one {item attachment was moved to become the invoice file} other {item attachments were moved to additional attachments, you need to pick a single invoice file or generate one automatically}}."
              id="EditExpense.ExpenseItemAttachmentMoved"
              values={{ count: expenseForm.values.expenseItems.length }}
            />
          </MessageBox>
          <InvoiceFormOption {...InvoiceFormOption.getFormProps(expenseForm)} />
        </div>
      )}

      <AdditionalAttachments {...AdditionalAttachments.getFormProps(expenseForm)} />
      <DialogFooter>
        <Button variant="outline" onClick={prevStep}>
          <FormattedMessage defaultMessage="Back" id="Back" />
        </Button>

        <Button
          disabled={expenseForm.initialLoading}
          type="submit"
          loading={expenseForm.isSubmitting}
          onClick={expenseForm.handleSubmit}
        >
          <FormattedMessage defaultMessage="Save" id="save" />
        </Button>
      </DialogFooter>
    </React.Fragment>
  );
};

const EditExpenseTitle = ({ expense, onSubmit }) => {
  const schema = z.object({
    description: z.string().min(1),
  });

  return (
    <FormikZod schema={schema} initialValues={expense} onSubmit={values => onSubmit(schema.parse(values))}>
      <Form className="space-y-4">
        <FormField name="description" label="Title" />
        <EditExpenseActionButtons />
      </Form>
    </FormikZod>
  );
};

function EditExpenseActionButtons({
  handleSubmit,
  disabled,
  loading,
}: {
  handleSubmit?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const formik = useFormikContext();

  return (
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">
          <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
        </Button>
      </DialogClose>

      <Button disabled={disabled || loading} type="submit" loading={formik.isSubmitting} onClick={handleSubmit}>
        <FormattedMessage defaultMessage="Save" id="save" />
      </Button>
    </DialogFooter>
  );
}

export default function EditExpenseDialog({
  expense,
  field,
  title,
  description,
  dialogContentClassName,
  triggerClassName,
  trigger,
}: {
  expense: Expense;
  field:
    | 'title'
    | 'expenseDetails'
    | 'expenseItems'
    | 'payoutMethod'
    | 'payee'
    | 'paidBy'
    | 'type'
    | 'attachments'
    | 'invoiceFile';
  title: string;
  description?: string;
  dialogContentClassName?: string;
  triggerClassName?: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const intl = useIntl();
  const [editExpense] = useMutation(editExpenseMutation, {
    context: API_V2_CONTEXT,
  });

  const handleClose = () => setOpen(false);

  const onSubmit = React.useCallback(
    async values => {
      try {
        const editInput = {
          ...values,
          id: expense.id,
        };
        await editExpense({
          variables: {
            expense: editInput,
          },
        });
        setOpen(false);
        toast({
          variant: 'success',
          message: <FormattedMessage defaultMessage="Expense edited" id="yTblGN" />,
        });
      } catch (err) {
        // track(AnalyticsEvent.EXPENSE_SUBMISSION_SUBMITTED_ERROR);
        toast({ variant: 'error', message: i18nGraphqlException(intl, err) });
      }
    },
    [editExpense, intl, expense.id],
  );
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            {trigger || (
              <Button size="icon-xs" variant="outline" className={cn('h-7 w-7', triggerClassName)}>
                <Pen size={16} />
              </Button>
            )}
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{title}</TooltipContent>
      </Tooltip>

      <DialogContent className={dialogContentClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <RenderFormFields expense={expense} field={field} onSubmit={onSubmit} handleClose={handleClose} />
      </DialogContent>
    </Dialog>
  );
}
