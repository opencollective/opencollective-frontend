import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { Formik, useFormikContext } from 'formik';
import { get, isEmpty, omit, pick, truncate } from 'lodash';
import { Pencil, Trash2, Undo2 } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { CollectiveType } from '../../../lib/constants/collectives';
import { i18nGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT, gqlV1 } from '../../../lib/graphql/helpers';
import {
  type EditPayoutMethodMutation,
  type EditPayoutMethodMutationVariables,
  ExpenseStatus,
  type SavePayoutMethodMutation,
  type SavePayoutMethodMutationVariables,
} from '../../../lib/graphql/types/v2/graphql';
import { PayoutMethodType } from '../../../lib/graphql/types/v2/schema';
import { objectKeys } from '@/lib/utils';

import { ComboSelect } from '@/components/ComboSelect';
import { FormField } from '@/components/FormField';
import { useModal } from '@/components/ModalContext';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';

import { CONFIRMATION_MODAL_TERMINATE } from '../../ConfirmationModal';
import PayoutMethodForm, { validatePayoutMethod } from '../../expenses/PayoutMethodForm';
import MessageBox from '../../MessageBox';
import { I18nPayoutMethodLabels, PayoutMethodLabel } from '../../PayoutMethodLabel';
import { Button } from '../../ui/Button';
import { RadioGroup, RadioGroupCard } from '../../ui/RadioGroup';
import { useToast } from '../../ui/useToast';
import { PayoutMethodDetailsContainer } from '../PayoutMethodDetails';
import { Step } from '../SubmitExpenseFlowSteps';
import { type ExpenseForm } from '../useExpenseForm';

import { FormSectionContainer } from './FormSectionContainer';
import { memoWithGetFormProps } from './helper';

type PayoutMethodSectionProps = {
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
} & ReturnType<typeof getFormProps>;

function getFormProps(form: ExpenseForm) {
  return {
    ...pick(form, ['setFieldTouched', 'setFieldValue', 'initialLoading', 'refresh', 'isSubmitting']),
    ...pick(form.values, ['payeeSlug', 'payoutMethodId']),
    ...pick(form.options, [
      'payee',
      'payoutMethods',
      'recentlySubmittedExpenses',
      'isAdminOfPayee',
      'loggedInAccount',
      'expense',
    ]),
  };
}

// eslint-disable-next-line prefer-arrow-callback
export const PayoutMethodSection = memoWithGetFormProps(function PayoutMethodSection(props: PayoutMethodSectionProps) {
  const { inViewChange, ...rest } = props;
  return (
    <FormSectionContainer
      step={Step.PAYOUT_METHOD}
      inViewChange={inViewChange}
      title={<FormattedMessage defaultMessage="Select a payout method" id="Ri4REE" />}
    >
      <PayoutMethodFormContent {...rest} />
    </FormSectionContainer>
  );
}, getFormProps);

// eslint-disable-next-line prefer-arrow-callback
export const PayoutMethodFormContent = memoWithGetFormProps(function PayoutMethodFormContent(
  props: ReturnType<typeof getFormProps>,
) {
  const [lastUsedPayoutMethod, setLastUsedPayoutMethod] =
    React.useState<ExpenseForm['options']['payoutMethods'][number]>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const isLoadingPayee = props.payeeSlug && !props.payeeSlug.startsWith('__') && props.payee?.slug !== props.payeeSlug;
  const isPickingProfileAdministered = props.payeeSlug === '__findAccountIAdminister';

  const payoutMethods = React.useMemo(() => {
    if (!props.payoutMethods) {
      return [];
    }

    if (!lastUsedPayoutMethod) {
      return props.payoutMethods;
    }

    return [lastUsedPayoutMethod, ...(props.payoutMethods?.filter(p => p.id !== lastUsedPayoutMethod.id) || [])];
  }, [props.payoutMethods, lastUsedPayoutMethod]);

  const { setFieldValue, setFieldTouched, refresh } = props;
  React.useEffect(() => {
    const lastSubmittedExpenseByPayee = (props.recentlySubmittedExpenses?.nodes || [])
      .filter(e => e && e.payee.slug === props.payeeSlug && e.payoutMethod?.id)
      .find(() => true);
    const lastUsedPayoutMethodId = lastSubmittedExpenseByPayee?.payoutMethod?.id;
    const lastUsed = lastUsedPayoutMethodId && (props.payoutMethods || []).find(p => p.id === lastUsedPayoutMethodId);

    if (lastUsed) {
      setLastUsedPayoutMethod(lastUsed);
    } else {
      setLastUsedPayoutMethod(null);
    }

    if (!props.payoutMethodId && lastUsed) {
      setFieldValue('payoutMethodId', lastUsed?.id);
    } else if (
      props.payoutMethodId !== '__newPayoutMethod' &&
      (!props.payoutMethodId || !payoutMethods.some(p => p.id === props.payoutMethodId))
    ) {
      setFieldValue('payoutMethodId', payoutMethods.at(0)?.id ?? '');
    }

    if (!props.initialLoading) {
      setIsLoading(false);
    }
  }, [
    props.initialLoading,
    props.payeeSlug,
    props.recentlySubmittedExpenses,
    setFieldValue,
    props.payoutMethodId,
    props.payoutMethods,
    payoutMethods,
  ]);

  const isNewPayoutMethodSelected = !isLoadingPayee && props.payoutMethodId === '__newPayoutMethod';

  const isVendor = props.payee?.type === CollectiveType.VENDOR;

  const onPaymentMethodDeleted = React.useCallback(
    async deletedPayoutMethodId => {
      if (deletedPayoutMethodId === props.payoutMethodId) {
        setFieldValue('payoutMethodId', '');
      }
      await refresh();
    },
    [props.payoutMethodId, refresh, setFieldValue],
  );

  const onPaymentMethodEdited = React.useCallback(
    async newPayoutMethodId => {
      await refresh();
      setFieldValue('payoutMethodId', newPayoutMethodId);
    },
    [refresh, setFieldValue],
  );

  return (
    <div>
      {!isLoading &&
      !isLoadingPayee &&
      !isPickingProfileAdministered &&
      !isVendor &&
      !props.isAdminOfPayee &&
      !(props.expense?.status === ExpenseStatus.DRAFT && !props.loggedInAccount) ? (
        <MessageBox type="info">
          <FormattedMessage
            defaultMessage="The person you are inviting to submit this expense will be asked to provide payout method details."
            id="LHdznY"
          />
        </MessageBox>
      ) : (
        <RadioGroup
          id="payoutMethodId"
          disabled={props.isSubmitting}
          value={props.payoutMethodId}
          onValueChange={payoutMethodId => {
            setFieldValue('payoutMethodId', payoutMethodId);
            setFieldTouched('payoutMethodId', true);
          }}
        >
          {!(isLoading || isLoadingPayee) &&
            payoutMethods?.map(p => (
              <PayoutMethodRadioGroupItem
                key={p.id}
                payoutMethod={p}
                payeeSlug={props.payeeSlug}
                payee={props.payee}
                isChecked={p.id === props.payoutMethodId}
                isEditable={!isVendor}
                onPaymentMethodDeleted={onPaymentMethodDeleted}
                onPaymentMethodEdited={onPaymentMethodEdited}
                setNameMismatchReason={reason => setFieldValue('payoutMethodNameDiscrepancyReason', reason)}
              />
            ))}

          {(isLoading || isLoadingPayee) && (
            <RadioGroupCard value="" disabled>
              <Skeleton className="h-6 w-full" />
            </RadioGroupCard>
          )}

          {!(isLoading || isLoadingPayee) && !isVendor && (
            <RadioGroupCard
              value="__newPayoutMethod"
              checked={isNewPayoutMethodSelected}
              disabled={isLoading || props.initialLoading || props.isSubmitting}
              showSubcontent={!props.initialLoading && isNewPayoutMethodSelected}
              subContent={<NewPayoutMethodOptionWrapper />}
            >
              <FormattedMessage defaultMessage="New payout method" id="vJEJ0J" />
            </RadioGroupCard>
          )}
        </RadioGroup>
      )}
    </div>
  );
}, getFormProps);

export function generatePayoutMethodName(type, data) {
  switch (type) {
    case PayoutMethodType.PAYPAL:
      return data.email;
    case PayoutMethodType.BANK_ACCOUNT:
      if (data?.details?.IBAN) {
        return `IBAN ${data.details.IBAN}`;
      } else if (data?.details?.accountNumber) {
        return `A/N ${data.details.accountNumber}`;
      } else if (data?.details?.clabe) {
        return `Clabe ${data.details.clabe}`;
      } else if (data?.details?.bankgiroNumber) {
        return `BankGiro ${data.details.bankgiroNumber}`;
      } else if (data?.accountHolderName && data?.currency) {
        return `${data.accountHolderName} (${data.currency})`;
      }
      return `Bank Account`;
    case PayoutMethodType.OTHER:
      return truncate(data?.content, { length: 20 }).replace(/\n|\t/g, ' ');
    default:
      return type;
  }
}

export function NewPayoutMethodOptionWrapper(props) {
  const form = useFormikContext() as ExpenseForm;
  return <NewPayoutMethodOption {...props} {...NewPayoutMethodOption.getFormProps(form)} />;
}

type NewPayoutMethodOptionProps = ReturnType<typeof getNewPayoutMethodOptionFormProps>;

function getNewPayoutMethodOptionFormProps(form: ExpenseForm) {
  return {
    ...pick(form, ['setFieldValue', 'setFieldTouched', 'validateForm', 'refresh', 'isSubmitting']),
    ...pick(form.values, ['newPayoutMethod', 'payeeSlug']),
    ...pick(form.options, ['supportedPayoutMethods', 'host', 'loggedInAccount', 'payee']),
    touchedNewPayoutMethodName: form.touched.newPayoutMethod?.name,
  };
}

// eslint-disable-next-line prefer-arrow-callback
const NewPayoutMethodOption = memoWithGetFormProps(function NewPayoutMethodOption(props: NewPayoutMethodOptionProps) {
  const intl = useIntl();
  const { toast } = useToast();
  const [creatingPayoutMethod, setIsCreatingPayoutMethod] = React.useState(false);

  const { setFieldValue, setFieldTouched, validateForm, refresh } = props;

  const [createPayoutMethod] = useMutation<SavePayoutMethodMutation, SavePayoutMethodMutationVariables>(
    gql`
      mutation SavePayoutMethod($payoutMethod: PayoutMethodInput!, $payeeSlug: String!) {
        createPayoutMethod(payoutMethod: $payoutMethod, account: { slug: $payeeSlug }) {
          id
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        payoutMethod: { ...props.newPayoutMethod },
        payeeSlug: props.payeeSlug,
      },
    },
  );

  const onSaveButtonClick = React.useCallback(async () => {
    try {
      setFieldTouched('newPayoutMethod.type');
      setFieldTouched('newPayoutMethod.data.currency');
      const formErrors = await validateForm();
      if (!isEmpty(get(formErrors, 'newPayoutMethod')) || formErrors.payoutMethodNameDiscrepancyReason) {
        if (formErrors.payoutMethodNameDiscrepancyReason) {
          setFieldTouched('payoutMethodNameDiscrepancyReason');
        }

        for (const k of objectKeys(formErrors.newPayoutMethod)) {
          setFieldTouched(`newPayoutMethod.${k}`);
        }

        return;
      }
      const errors = validatePayoutMethod(props.newPayoutMethod);
      if (!isEmpty(errors)) {
        return;
      }
      setIsCreatingPayoutMethod(true);
      const response = await createPayoutMethod();
      const newPayoutMethodId = response.data.createPayoutMethod.id;
      await refresh();
      setFieldValue('payoutMethodId', newPayoutMethodId);
      setFieldValue('newPayoutMethod', { data: {} });
      toast({ variant: 'success', message: 'Payout method created' });
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    } finally {
      setIsCreatingPayoutMethod(false);
    }
  }, [createPayoutMethod, intl, props.newPayoutMethod, refresh, setFieldTouched, setFieldValue, toast, validateForm]);

  const suportedPayoutMethodComboOptions = React.useMemo(
    () =>
      props.supportedPayoutMethods.map(m => ({
        value: m,
        label: intl.formatMessage(I18nPayoutMethodLabels[m]),
      })),
    [intl, props.supportedPayoutMethods],
  );

  const onPayoutMethodTypeChange = React.useCallback(
    value => setFieldValue('newPayoutMethod.type', value as PayoutMethodType),
    [setFieldValue],
  );

  const isLegalNameFuzzyMatched = React.useMemo(() => {
    const accountHolderName: string = props.newPayoutMethod.data?.accountHolderName ?? '';
    const payeeLegalName: string = props.payee?.legalName ?? '';
    return accountHolderName.trim().toLowerCase() === payeeLegalName.trim().toLowerCase();
  }, [props.newPayoutMethod.data?.accountHolderName, props.payee?.legalName]);

  const hasLegalNameMismatch =
    props.newPayoutMethod.data?.accountHolderName?.length &&
    props.newPayoutMethod.type === PayoutMethodType.BANK_ACCOUNT &&
    props.payeeSlug &&
    !props.payeeSlug.startsWith('__') &&
    props.payeeSlug === props.payee?.slug &&
    !isLegalNameFuzzyMatched;

  return (
    <div className="space-y-3 p-2">
      {creatingPayoutMethod ? (
        <Skeleton className="h-6 w-full" />
      ) : (
        <React.Fragment>
          <FormField
            disabled={props.isSubmitting}
            label={intl.formatMessage({ defaultMessage: 'Choose a payout method', id: 'SlAq2H' })}
            isPrivate
            name="newPayoutMethod.type"
          >
            {({ field }) => (
              <ComboSelect
                {...field}
                disabled={props.isSubmitting}
                options={suportedPayoutMethodComboOptions}
                onChange={onPayoutMethodTypeChange}
              />
            )}
          </FormField>

          {props.newPayoutMethod?.type && (
            <PayoutMethodForm
              disabled={props.isSubmitting}
              required
              alwaysSave
              fieldsPrefix="newPayoutMethod"
              payoutMethod={props.newPayoutMethod}
              host={props.host}
            />
          )}
        </React.Fragment>
      )}

      {hasLegalNameMismatch && (
        <MessageBox type="warning">
          <div className="mb-2 font-bold">
            <FormattedMessage defaultMessage="The names you provided do not match." id="XAPZa0" />
          </div>
          <div>
            <FormattedMessage
              defaultMessage="The legal name in the payee profile is: {legalName}."
              id="NSammt"
              values={{
                legalName: props.payee?.legalName,
              }}
            />
          </div>
          <div>
            <FormattedMessage
              defaultMessage="The contact name in the payout method is: {accountHolderName}."
              id="XC+vMa"
              values={{
                accountHolderName: props.newPayoutMethod.data?.accountHolderName,
              }}
            />
          </div>

          <FormField
            className="mt-4"
            label={intl.formatMessage({
              defaultMessage: 'Please explain why they are different',
              id: 'bzGbkJ',
            })}
            name="payoutMethodNameDiscrepancyReason"
          />
        </MessageBox>
      )}

      {props.loggedInAccount && (
        <div className="flex justify-end">
          <Button
            loading={creatingPayoutMethod || props.isSubmitting}
            disabled={props.isSubmitting}
            onClick={onSaveButtonClick}
            className="mt-2"
          >
            <FormattedMessage defaultMessage="Save" id="save" />
          </Button>
        </div>
      )}
    </div>
  );
}, getNewPayoutMethodOptionFormProps);

type PayoutMethodRadioGroupItemProps = {
  payoutMethod: ExpenseForm['options']['payoutMethods'][number];
  payee: ExpenseForm['options']['payee'];
  payeeSlug: ExpenseForm['values']['payeeSlug'];
  host?: ExpenseForm['options']['host'];
  isChecked?: boolean;
  isEditable?: boolean;
  isSubmitting?: boolean;
  archived?: boolean;
  /** Hide quick actions to correct missing currency or mismatch name */
  disableWarningMessages?: boolean;
  onPaymentMethodDeleted: (deletedPayoutMethodId) => void;
  onPaymentMethodEdited: (newPayoutMethodId: string) => void;
  setNameMismatchReason?: (reason: string) => void;
  onRestore?: (payoutMethodId) => void;
  refresh?: () => void;
  Component?: React.ComponentType<{
    value?: string;
    showSubcontent?: boolean;
    asChild?: boolean;
    subContent: React.ReactNode;
  }>;
  moreActions?: React.ReactNode;
};

// eslint-disable-next-line prefer-arrow-callback
export const PayoutMethodRadioGroupItem = function PayoutMethodRadioGroupItem(props: PayoutMethodRadioGroupItemProps) {
  const CardComponent = props.Component || RadioGroupCard;
  const intl = useIntl();
  const { toast } = useToast();

  const isMissingCurrency = isEmpty(props.payoutMethod.data?.currency);
  const isLegalNameFuzzyMatched = React.useMemo(() => {
    const accountHolderName: string = props.payoutMethod.data?.accountHolderName ?? '';
    const payeeLegalName: string = props.payee?.legalName ?? '';
    return accountHolderName.trim().toLowerCase() === payeeLegalName.trim().toLowerCase();
  }, [props.payoutMethod.data?.accountHolderName, props.payee?.legalName]);

  const hasLegalNameMismatch =
    props.payoutMethod.type === PayoutMethodType.BANK_ACCOUNT &&
    props.payeeSlug &&
    !props.payeeSlug.startsWith('__') &&
    props.payeeSlug === props.payee?.slug &&
    !isLegalNameFuzzyMatched;
  const isOpen = props.isChecked;

  const [isEditingPayoutMethod, setIsEditingPayoutMethod] = React.useState(false);
  const [isLoadingEditPayoutMethod, setIsLoadingEditPayoutMethod] = React.useState(false);
  const [keepNameDifferent, setKeepNameDifferent] = React.useState(false);
  const [legalNameUpdated, setLegalNameUpdated] = React.useState(false);

  const [submitLegalNameMutation, { loading }] = useMutation(
    gqlV1`
    mutation UpdatePayoutProfileLegalName($input: CollectiveInputType!) {
      editCollective(collective: $input) {
        id
        legalName
      }
    }
  `,
    {
      variables: {
        input: {
          id: props.payee?.legacyId,
          legalName: props.payoutMethod.data?.accountHolderName,
        },
      },
      update(cache, result) {
        cache.writeFragment({
          id: `Individual:${props.payee?.id}`,
          fragment: gql`
            fragment PayoutProfile on Account {
              legalName
            }
          `,
          data: {
            legalName: result.data.editCollective.legalName,
          },
        });

        props.refresh();
      },
    },
  );

  const onUpdateLegalNameToMatch = React.useCallback(async () => {
    try {
      await submitLegalNameMutation();
      setLegalNameUpdated(true);
      toast({ variant: 'success', message: 'Updated' });
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  }, [submitLegalNameMutation, toast, intl]);

  const [deletePayoutMethod] = useMutation(
    gql`
      mutation DeletePayoutMethod($payoutMethodId: String!) {
        removePayoutMethod(payoutMethodId: $payoutMethodId) {
          id
        }
      }
    `,
    { context: API_V2_CONTEXT },
  );

  const [editPayoutMethod] = useMutation<EditPayoutMethodMutation, EditPayoutMethodMutationVariables>(
    gql`
      mutation EditPayoutMethod($payoutMethod: PayoutMethodInput!) {
        editPayoutMethod(payoutMethod: $payoutMethod) {
          id
          name
          data
          isSaved
          type
        }
      }
    `,
    { context: API_V2_CONTEXT },
  );

  const { showConfirmationModal } = useModal();

  const onDeleteClick = React.useCallback(
    e => {
      e.stopPropagation();
      e.preventDefault();
      showConfirmationModal({
        title: props.payoutMethod?.canBeEditedOrDeleted
          ? intl.formatMessage({
              defaultMessage: 'Delete Payout Method?',
              id: 'weGvmF',
            })
          : intl.formatMessage({
              defaultMessage: 'Archive Payout Method?',
              id: 'dX2XCG',
            }),
        description: props.payoutMethod?.canBeEditedOrDeleted
          ? intl.formatMessage({
              defaultMessage: 'Are you sure you want to delete this payout method?',
              id: 'uR+TjD',
            })
          : intl.formatMessage({
              defaultMessage:
                'This payout method was already used and now it can only be archived. Archiving is does not delete the payout method information and can be reversed if you want to.',
              id: 'Z9u0j3',
            }),
        children: <PayoutMethodLabel showIcon payoutMethod={props.payoutMethod} />,
        onConfirm: async () => {
          try {
            await deletePayoutMethod({
              variables: {
                payoutMethodId: props.payoutMethod?.id,
              },
            });
            await props.onPaymentMethodDeleted(props.payoutMethod.id);
            toast({
              variant: 'success',
              message: props.payoutMethod?.canBeEditedOrDeleted ? (
                <FormattedMessage defaultMessage="Payout Method deleted successfully" id="2sVunP" />
              ) : (
                <FormattedMessage defaultMessage="Payout Method archived successfully" id="njlj6i" />
              ),
            });
          } catch (e) {
            toast({
              variant: 'error',
              message: i18nGraphqlException(intl, e),
            });
          }
        },
        confirmLabel: props.payoutMethod?.canBeEditedOrDeleted
          ? intl.formatMessage({ defaultMessage: 'Delete Payout Method', id: 'Rs7g0Y' })
          : intl.formatMessage({ defaultMessage: 'Archive Payout Method', id: 'L0TUHP' }),
        variant: 'destructive',
      });
    },
    [intl, deletePayoutMethod, props, showConfirmationModal, toast],
  );

  const onEditClick = React.useCallback(
    e => {
      e.stopPropagation();
      e.preventDefault();
      setIsEditingPayoutMethod(true);
    },
    [isEditingPayoutMethod, props.payoutMethod],
  );

  const { onPaymentMethodEdited } = props;
  const onSaveClick = React.useCallback(
    async values => {
      try {
        setIsLoadingEditPayoutMethod(true);
        const response = await editPayoutMethod({
          variables: {
            payoutMethod: pick(values.editingPayoutMethod, ['id', 'isSaved', 'name', 'data', 'type']),
          },
        });
        toast({
          variant: 'success',
          message: <FormattedMessage defaultMessage="Payout Method edit successfully" id="cFfn2l" />,
        });
        await onPaymentMethodEdited(response.data.editPayoutMethod.id);
        setIsEditingPayoutMethod(false);
        return CONFIRMATION_MODAL_TERMINATE;
      } catch (e) {
        toast({
          variant: 'error',
          message: i18nGraphqlException(intl, e),
        });
      } finally {
        setIsLoadingEditPayoutMethod(false);
      }
    },
    [editPayoutMethod, intl, onPaymentMethodEdited, toast],
  );

  return (
    <Formik
      onSubmit={onSaveClick}
      initialValues={{
        editingPayoutMethod: {
          ...omit(props.payoutMethod, ['__typename']),
          name: props.payoutMethod.name || generatePayoutMethodName(props.payoutMethod.type, props.payoutMethod.data),
        },
      }}
    >
      {({ setFieldTouched, setFieldValue, values, submitForm }) => (
        <CardComponent
          value={props.payoutMethod.id}
          disabled={props.archived}
          showSubcontent={isOpen}
          asChild
          subContent={
            isEditingPayoutMethod ? (
              <React.Fragment>
                {isLoadingEditPayoutMethod ? (
                  <Skeleton className="h-6 w-full" />
                ) : (
                  <div className="space-y-2">
                    <PayoutMethodForm
                      required
                      alwaysSave
                      fieldsPrefix={`editingPayoutMethod`}
                      payoutMethod={omit(props.payoutMethod, 'id')}
                      host={props.host}
                    />
                    {values.editingPayoutMethod.name !==
                      generatePayoutMethodName(values.editingPayoutMethod.type, values.editingPayoutMethod.data) && (
                      <Button
                        disabled={props.isSubmitting}
                        loading={props.isSubmitting}
                        size="xs"
                        variant="link"
                        className="p-0"
                        onClick={() => {
                          setFieldValue(
                            `editingPayoutMethod.name`,
                            generatePayoutMethodName(values.editingPayoutMethod.type, values.editingPayoutMethod.data),
                          );
                          setFieldTouched(`editingPayoutMethod.name`, false);
                        }}
                      >
                        <FormattedMessage defaultMessage="Use default generated name" id="+6P7pM" />
                      </Button>
                    )}
                  </div>
                )}

                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    disabled={isLoadingEditPayoutMethod || props.isSubmitting}
                    loading={isLoadingEditPayoutMethod || props.isSubmitting}
                    variant="secondary"
                    onClick={() => {
                      setIsEditingPayoutMethod(false);
                    }}
                  >
                    <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
                  </Button>
                  <Button loading={isLoadingEditPayoutMethod} onClick={submitForm}>
                    <FormattedMessage defaultMessage="Save" id="save" />
                  </Button>
                </div>
              </React.Fragment>
            ) : (
              <div className="flex flex-col gap-4">
                <PayoutMethodDetailsContainer
                  payoutMethod={props.payoutMethod}
                  maxItems={3}
                  className={props.archived && 'text-gray-500!'}
                />
                {isMissingCurrency && !props.disableWarningMessages && (
                  <div className="mt-2">
                    <MessageBox type="warning">
                      <div className="mb-2 font-bold">
                        <FormattedMessage defaultMessage="Missing currency" id="dkeCt1" />
                      </div>
                      <div>
                        <FormattedMessage
                          defaultMessage="Your payout method is missing a currency. Please edit your payout method to update it."
                          id="nrG4vz"
                        />
                      </div>
                    </MessageBox>
                  </div>
                )}
                {hasLegalNameMismatch && !props.disableWarningMessages && (
                  <MessageBox type="warning">
                    <div className="mb-2 font-bold">
                      <FormattedMessage defaultMessage="The names you provided do not match." id="XAPZa0" />
                    </div>
                    <div>
                      <FormattedMessage
                        defaultMessage="The legal name in the payee profile is: {legalName}."
                        id="NSammt"
                        values={{
                          legalName: props.payee?.legalName,
                        }}
                      />
                    </div>
                    <div>
                      <FormattedMessage
                        defaultMessage="The contact name in the payout method is: {accountHolderName}."
                        id="XC+vMa"
                        values={{
                          accountHolderName: props.payoutMethod.data?.accountHolderName,
                        }}
                      />
                    </div>

                    {!keepNameDifferent && (
                      <React.Fragment>
                        <div className="mt-4 mb-2 font-bold">
                          <FormattedMessage
                            defaultMessage="Would you like to update your legal name to match your payout method contact name?"
                            id="fEYP7x"
                          />
                        </div>

                        <div className="flex gap-4">
                          <Button
                            disabled={loading}
                            loading={loading}
                            variant="outline"
                            onClick={onUpdateLegalNameToMatch}
                          >
                            <FormattedMessage defaultMessage="Yes, Update and Match" id="qjpM/f" />
                          </Button>
                          {props.setNameMismatchReason && (
                            <Button disabled={loading} variant="outline" onClick={() => setKeepNameDifferent(true)}>
                              <FormattedMessage defaultMessage="No, Keep Them Different" id="PCBOGA" />
                            </Button>
                          )}
                        </div>
                      </React.Fragment>
                    )}
                    {keepNameDifferent && (
                      <FormField
                        className="mt-4"
                        label={intl.formatMessage({
                          defaultMessage: 'Please explain why they are different',
                          id: 'bzGbkJ',
                        })}
                        name="payoutMethodNameDiscrepancyReason"
                      >
                        {({ field }) => (
                          <Input {...field} onChange={e => props.setNameMismatchReason(e.target.value)} />
                        )}
                      </FormField>
                    )}
                  </MessageBox>
                )}
                {legalNameUpdated && !hasLegalNameMismatch && (
                  <MessageBox type="warning">
                    <FormattedMessage
                      defaultMessage="Legal name is updated to match the payout method name."
                      id="TI6gwx"
                    />
                  </MessageBox>
                )}
              </div>
            )
          }
        >
          <div className="flex grow items-center gap-2">
            <PayoutMethodLabel showIcon payoutMethod={props.payoutMethod} />
            {props.archived && (
              <Badge type="outline" size="xs">
                <FormattedMessage defaultMessage="Archived" id="Archived" />
              </Badge>
            )}
          </div>
          {!isEditingPayoutMethod && props.isEditable && (
            <div className="flex gap-2">
              {!props.archived && props.isChecked && (
                <Button
                  disabled={props.isSubmitting}
                  onClick={onEditClick}
                  size="icon-xs"
                  variant="ghost"
                  title={intl.formatMessage({ defaultMessage: 'Edit payout method', id: 'EditPayoutMethod' })}
                >
                  <Pencil size={16} />
                </Button>
              )}
              {!props.archived && (
                <Button
                  disabled={props.isSubmitting}
                  onClick={onDeleteClick}
                  size="icon-xs"
                  variant="ghost"
                  title={intl.formatMessage({ defaultMessage: 'Remove payout method', id: 'RemovePayoutMethod' })}
                >
                  <Trash2 size={16} />
                </Button>
              )}
              {props.archived && (
                <Button
                  disabled={props.isSubmitting}
                  onClick={props.onRestore}
                  size="icon-xs"
                  variant="ghost"
                  title={intl.formatMessage({ defaultMessage: 'Restore payout method', id: 'RestorePayoutMethod' })}
                >
                  <Undo2 size={16} />
                </Button>
              )}
              {props.moreActions}
            </div>
          )}
        </CardComponent>
      )}
    </Formik>
  );
};
