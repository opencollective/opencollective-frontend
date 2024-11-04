import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { useFormikContext } from 'formik';
import { get, isEmpty, omit, truncate } from 'lodash';
import { Eye, EyeOffIcon, Pencil, Trash2 } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT, gqlV1 } from '../../../lib/graphql/helpers';
import type {
  SavePayoutMethodMutation,
  SavePayoutMethodMutationVariables,
} from '../../../lib/graphql/types/v2/graphql';
import { PayoutMethodType } from '../../../lib/graphql/types/v2/graphql';
import { cn } from '../../../lib/utils';

import ConfirmationModal, { CONFIRMATION_MODAL_TERMINATE } from '../../ConfirmationModal';
import PayoutMethodForm, { validatePayoutMethod } from '../../expenses/PayoutMethodForm';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBox from '../../MessageBox';
import { I18nPayoutMethodLabels, PayoutMethodLabel } from '../../PayoutMethodLabel';
import StyledInput from '../../StyledInput';
import StyledInputFormikField from '../../StyledInputFormikField';
import StyledSelect from '../../StyledSelect';
import { Button } from '../../ui/Button';
import { Label } from '../../ui/Label';
import { RadioGroup, RadioGroupItem } from '../../ui/RadioGroup';
import { useToast } from '../../ui/useToast';
import { PayoutMethodDetails } from '../PayoutMethodDetails';
import { Step } from '../SubmitExpenseFlowSteps';
import { type ExpenseForm } from '../useExpenseForm';

import { FormSectionContainer } from './FormSectionContainer';

type PayoutMethodSectionProps = {
  form: ExpenseForm;
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
};

export function PayoutMethodSection(props: PayoutMethodSectionProps) {
  const [lastUsedPayoutMethod, setLastUsedPayoutMethod] =
    React.useState<ExpenseForm['options']['payoutMethods'][number]>(null);

  const isLoading =
    props.form.values.payeeSlug &&
    !props.form.values.payeeSlug.startsWith('__') &&
    props.form.options.payee?.slug !== props.form.values.payeeSlug;

  const isPickingProfileAdministered = props.form.values.payeeSlug === '__findAccountIAdminister';

  const payoutMethods = React.useMemo(() => {
    if (!props.form.options.payoutMethods) {
      return [];
    }

    if (!lastUsedPayoutMethod) {
      return props.form.options.payoutMethods;
    }

    return [
      lastUsedPayoutMethod,
      ...(props.form.options.payoutMethods?.filter(p => p.id !== lastUsedPayoutMethod.id) || []),
    ];
  }, [props.form.options.payoutMethods, lastUsedPayoutMethod]);

  const { setFieldValue, setFieldTouched } = props.form;
  React.useEffect(() => {
    if (isLoading) {
      return;
    }

    const lastSubmittedExpenseByPayee = props.form.options.recentlySubmittedExpenses?.nodes
      ?.filter(e => e.payee.slug === props.form.values.payeeSlug && e.payoutMethod?.id)
      ?.at(0);
    const lastUsedPayoutMethodId = lastSubmittedExpenseByPayee?.payoutMethod?.id;
    const lastUsed =
      lastUsedPayoutMethodId && props.form.options.payoutMethods?.find(p => p.id === lastUsedPayoutMethodId);

    if (lastUsed) {
      setLastUsedPayoutMethod(lastUsed);
    } else {
      setLastUsedPayoutMethod(null);
    }

    if (!props.form.values.payoutMethodId && lastUsed) {
      setFieldValue('payoutMethodId', lastUsed?.id);
    } else if (
      props.form.values.payoutMethodId !== '__newPayoutMethod' &&
      (!props.form.values.payoutMethodId || !payoutMethods.some(p => p.id === props.form.values.payoutMethodId))
    ) {
      setFieldValue('payoutMethodId', payoutMethods.at(0)?.id);
    }
  }, [
    isLoading,
    props.form.values.payeeSlug,
    props.form.options.recentlySubmittedExpenses,
    setFieldValue,
    props.form.values.payoutMethodId,
    props.form.options.payoutMethods,
    payoutMethods,
  ]);

  const isNewPayoutMethodSelected =
    !props.form.values.payoutMethodId || props.form.values.payoutMethodId === '__newPayoutMethod';

  return (
    <FormSectionContainer
      step={Step.PAYOUT_METHOD}
      form={props.form}
      inViewChange={props.inViewChange}
      title={<FormattedMessage defaultMessage="Select a payout method" id="Ri4REE" />}
    >
      {!props.form.initialLoading &&
      !isLoading &&
      !isPickingProfileAdministered &&
      !props.form.options.isAdminOfPayee ? (
        <MessageBox type="info">
          <FormattedMessage
            defaultMessage="The person you are inviting to submit this expense will be asked to provide payout method details."
            id="LHdznY"
          />
        </MessageBox>
      ) : (
        <RadioGroup
          id="payoutMethodId"
          value={props.form.values.payoutMethodId}
          onValueChange={payoutMethodId => {
            setFieldValue('payoutMethodId', payoutMethodId);
            setFieldTouched('payoutMethodId', true);
          }}
        >
          {!(isLoading || props.form.initialLoading) &&
            payoutMethods.map(p => (
              <PayoutMethodRadioGroupItem
                key={p.id}
                payoutMethod={p}
                isChecked={p.id === props.form.values.payoutMethodId}
                onPaymentMethodDeleted={async () => {
                  if (p.id === props.form.values.payoutMethodId) {
                    setFieldValue('payoutMethodId', null);
                  }
                  await props.form.refresh();
                }}
                onPaymentMethodEdited={async newPayoutMethodId => {
                  await props.form.refresh();
                  setFieldValue('payoutMethodId', newPayoutMethodId);
                }}
              />
            ))}

          {(isLoading || props.form.initialLoading) && (
            <div className="rounded-md border border-gray-200">
              <div className="flex items-center">
                <RadioGroupItem className="ml-4" value="" disabled></RadioGroupItem>
                <Label className={cn('flex min-h-16 flex-grow items-center p-4')} htmlFor="__newPayoutMethod">
                  <LoadingPlaceholder height={24} width={1} />
                </Label>
              </div>
            </div>
          )}

          <div className="rounded-md border border-gray-200 has-[:checked]:flex-col has-[:checked]:items-start has-[:checked]:gap-2 has-[:checked]:border-blue-300">
            <div className="flex items-center">
              <RadioGroupItem
                className="ml-4"
                value="__newPayoutMethod"
                checked={isNewPayoutMethodSelected}
                disabled={isLoading || props.form.initialLoading}
              ></RadioGroupItem>
              <Label className={cn('flex min-h-16 flex-grow items-center p-4')} htmlFor="__newPayoutMethod">
                <FormattedMessage defaultMessage="New payout method" id="vJEJ0J" />
              </Label>
            </div>
            <div
              className={cn({
                'p-4 pt-0': !props.form.initialLoading && isNewPayoutMethodSelected,
              })}
            >
              {!props.form.initialLoading && isNewPayoutMethodSelected && <NewPayoutMethodOption form={props.form} />}
            </div>
          </div>
        </RadioGroup>
      )}
    </FormSectionContainer>
  );
}

function generatePayoutMethodName(type, data) {
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

type NewPayoutMethodOptionProps = {
  form: ExpenseForm;
};

function NewPayoutMethodOption(props: NewPayoutMethodOptionProps) {
  const intl = useIntl();
  const { toast } = useToast();
  const [creatingPayoutMethod, setIsCreatingPayoutMethod] = React.useState(false);

  const { setFieldValue } = props.form;
  React.useEffect(() => {
    if (!props.form.touched.newPayoutMethod?.name) {
      setFieldValue(
        'newPayoutMethod.name',
        generatePayoutMethodName(props.form.values.newPayoutMethod.type, props.form.values.newPayoutMethod.data),
      );
    }
  }, [
    props.form.values.newPayoutMethod.name,
    props.form.values.newPayoutMethod.type,
    props.form.values.newPayoutMethod.data.email,
    props.form.values.newPayoutMethod.data.details,
    props.form.values.newPayoutMethod.data.currency,
    props.form.touched.newPayoutMethod?.name,
    props.form.values.newPayoutMethod.data,
    setFieldValue,
  ]);

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
        payoutMethod: props.form.values.newPayoutMethod,
        payeeSlug: props.form.values.payeeSlug,
      },
    },
  );

  const onSaveButtonClick = React.useCallback(async () => {
    try {
      props.form.setFieldTouched('newPayoutMethod.type');
      props.form.setFieldTouched('newPayoutMethod.data.currency');
      props.form.validateForm();
      const errors = validatePayoutMethod(props.form.values.newPayoutMethod);
      if (!isEmpty(errors)) {
        return;
      }
      setIsCreatingPayoutMethod(true);
      const response = await createPayoutMethod();
      const newPayoutMethodId = response.data.createPayoutMethod.id;
      await props.form.refresh();
      setFieldValue('payoutMethodId', newPayoutMethodId);
      setFieldValue('newPayoutMethod', { data: {} });
      toast({ variant: 'success', message: 'Payout method created' });
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    } finally {
      setIsCreatingPayoutMethod(false);
    }
  }, [createPayoutMethod, intl, props.form, setFieldValue, toast]);

  return (
    <div>
      {creatingPayoutMethod ? (
        <LoadingPlaceholder width={1} height={24} />
      ) : (
        <React.Fragment>
          <StyledInputFormikField
            label={intl.formatMessage({ defaultMessage: 'Choose a payout method', id: 'SlAq2H' })}
            isPrivate
            name="newPayoutMethod.type"
          >
            {({ field }) => (
              <StyledSelect
                inputId="payoutMethodType"
                value={
                  field.value
                    ? {
                        value: field.value,
                        label: intl.formatMessage(I18nPayoutMethodLabels[field.value]),
                      }
                    : null
                }
                options={props.form.options.supportedPayoutMethods.map(m => ({
                  value: m,
                  label: intl.formatMessage(I18nPayoutMethodLabels[m]),
                }))}
                onChange={(option: { value: string }) =>
                  props.form.setFieldValue('newPayoutMethod.type', option.value as PayoutMethodType)
                }
              />
            )}
          </StyledInputFormikField>

          {props.form.values.newPayoutMethod?.type && (
            <React.Fragment>
              <PayoutMethodForm
                required
                alwaysSave
                fieldsPrefix="newPayoutMethod"
                payoutMethod={props.form.values.newPayoutMethod}
                host={props.form.options.host}
              />
              <div>
                <StyledInputFormikField
                  mt={2}
                  label={intl.formatMessage({ defaultMessage: 'Name', id: 'Fields.name' })}
                  name="newPayoutMethod.name"
                >
                  {({ field }) => (
                    <StyledInput {...field} onFocus={() => props.form.setFieldTouched('newPayoutMethod.name', true)} />
                  )}
                </StyledInputFormikField>
                {props.form.values.newPayoutMethod.name !==
                  generatePayoutMethodName(
                    props.form.values.newPayoutMethod.type,
                    props.form.values.newPayoutMethod.data,
                  ) && (
                  <Button
                    size="xs"
                    variant="link"
                    className="p-0"
                    onClick={() => props.form.setFieldTouched('newPayoutMethod.name', false)}
                  >
                    <FormattedMessage defaultMessage="Use default generated name" id="+6P7pM" />
                  </Button>
                )}
              </div>
            </React.Fragment>
          )}
        </React.Fragment>
      )}

      <Button loading={creatingPayoutMethod} onClick={onSaveButtonClick} className="mt-2">
        Save
      </Button>
    </div>
  );
}

function PayoutMethodRadioGroupItem(props: {
  payoutMethod: ExpenseForm['options']['payoutMethods'][number];
  isChecked?: boolean;
  onPaymentMethodDeleted: () => void;
  onPaymentMethodEdited: (newPayoutMethodId: string) => void;
}) {
  const form = useFormikContext() as ExpenseForm;

  const intl = useIntl();
  const { toast } = useToast();

  const [isPayoutMethodDetailsOpen, setIsPayoutMethodDetailsOpen] = React.useState(false);
  const [isEditingPayoutMethod, setIsEditingPayoutMethod] = React.useState(false);
  const [isLoadingEditPayoutMethod, setIsLoadingEditPayoutMethod] = React.useState(false);

  const isMissingCurrency = isEmpty(props.payoutMethod.data?.currency);

  const hasLegalNameMismatch =
    props.payoutMethod.type === PayoutMethodType.BANK_ACCOUNT &&
    form.values.payeeSlug &&
    !form.values.payeeSlug.startsWith('__') &&
    form.values.payeeSlug === form.options.payee?.slug &&
    props.payoutMethod.data?.accountHolderName !== form.options.payee?.legalName;
  const isOpen =
    isEditingPayoutMethod ||
    isPayoutMethodDetailsOpen ||
    (props.isChecked && (isMissingCurrency || hasLegalNameMismatch));

  const [isDeletingPayoutMethod, setIsDeletingPayoutMethod] = React.useState(false);
  const [isDeleted, setIsDeleted] = React.useState(false);

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
          id: form.options.payee?.legacyId,
          legalName: props.payoutMethod.data?.accountHolderName,
        },
      },
      update(cache, result) {
        cache.writeFragment({
          id: `Individual:${form.options.payee?.legacyId}`,
          fragment: gql`
            fragment PayoutProfile on Account {
              legalName
            }
          `,
          data: {
            legalName: result.data.editCollective.legalName,
          },
        });
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
    {
      context: API_V2_CONTEXT,
      variables: {
        payoutMethodId: props.payoutMethod?.id,
      },
    },
  );

  const editPayoutMethodValue = omit(get(form.values, `editingPayoutMethod.${props.payoutMethod.id}`), [
    'id',
    '__typename',
  ]);
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
        payeeSlug: form.values.payeeSlug,
        payoutMethod: editPayoutMethodValue,
      },
    },
  );

  const onDeleteClick = React.useCallback(e => {
    e.stopPropagation();
    e.preventDefault();
    setIsDeletingPayoutMethod(true);
  }, []);

  const { setFieldValue, setFieldTouched } = form;
  const onEditClick = React.useCallback(
    e => {
      e.stopPropagation();
      e.preventDefault();
      setFieldValue(`editingPayoutMethod.${props.payoutMethod.id}`, {
        ...omit(props.payoutMethod, ['id', '__typename']),
        name: props.payoutMethod.name || generatePayoutMethodName(props.payoutMethod.type, props.payoutMethod.data),
      });
      setIsEditingPayoutMethod(!isEditingPayoutMethod);
    },
    [isEditingPayoutMethod, props.payoutMethod, setFieldValue],
  );

  const editNameTouched = get(form.touched, `editingPayoutMethod.${props.payoutMethod.id}.name`, false);
  React.useEffect(() => {
    if (!isEditingPayoutMethod) {
      return;
    }

    if (!editNameTouched) {
      setFieldValue(
        `editingPayoutMethod.${props.payoutMethod.id}.name`,
        generatePayoutMethodName(editPayoutMethodValue.type, editPayoutMethodValue.data),
      );
    }
  }, [
    editPayoutMethodValue.name,
    editPayoutMethodValue.type,
    editPayoutMethodValue.data?.email,
    editPayoutMethodValue.data?.details,
    editPayoutMethodValue.data?.currency,
    editPayoutMethodValue.data,
    setFieldValue,
    isEditingPayoutMethod,
    editNameTouched,
    props.payoutMethod.id,
  ]);

  const { onPaymentMethodEdited } = props;
  const onSaveClick = React.useCallback(async () => {
    try {
      setIsLoadingEditPayoutMethod(true);
      const newPayoutMethodResponse = await createPayoutMethod();
      await deletePayoutMethod();
      setIsDeleted(true);
      toast({
        variant: 'success',
        message: <FormattedMessage defaultMessage="Payout Method edit successfully" id="cFfn2l" />,
      });
      await onPaymentMethodEdited(newPayoutMethodResponse.data.createPayoutMethod.id);
      return CONFIRMATION_MODAL_TERMINATE;
    } catch (e) {
      toast({
        variant: 'error',
        message: i18nGraphqlException(intl, e),
      });
    } finally {
      setIsLoadingEditPayoutMethod(false);
    }
  }, [createPayoutMethod, deletePayoutMethod, intl, onPaymentMethodEdited, toast]);

  if (isDeleted) {
    return null;
  }

  return (
    <React.Fragment>
      <div className="rounded-md border border-gray-200 has-[:checked]:flex-col has-[:checked]:items-start has-[:checked]:gap-2 has-[:checked]:border-blue-300">
        <div className="flex items-center">
          <RadioGroupItem className="ml-4" value={props.payoutMethod.id}></RadioGroupItem>
          <Label
            className={cn('flex min-h-16 flex-grow items-center justify-between p-4')}
            htmlFor={props.payoutMethod.id}
          >
            <div>
              <PayoutMethodLabel showIcon payoutMethod={props.payoutMethod} />
            </div>
            {!isEditingPayoutMethod && (
              <div className="flex gap-2">
                <Button
                  onClick={e => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsPayoutMethodDetailsOpen(!isPayoutMethodDetailsOpen);
                  }}
                  size="icon-xs"
                  variant="ghost"
                >
                  {isPayoutMethodDetailsOpen ? <EyeOffIcon size={16} /> : <Eye size={16} />}
                </Button>
                <Button onClick={onEditClick} size="icon-xs" variant="ghost">
                  <Pencil size={16} />
                </Button>
                <Button onClick={onDeleteClick} size="icon-xs" variant="ghost">
                  <Trash2 size={16} />
                </Button>
              </div>
            )}
          </Label>
        </div>
        <div
          className={cn({
            'p-4 pt-0': isOpen,
          })}
        >
          {isOpen &&
            (isEditingPayoutMethod ? (
              <React.Fragment>
                {isLoadingEditPayoutMethod ? (
                  <LoadingPlaceholder width={1} height={24} />
                ) : (
                  <React.Fragment>
                    <PayoutMethodForm
                      required
                      alwaysSave
                      fieldsPrefix={`editingPayoutMethod.${props.payoutMethod.id}`}
                      payoutMethod={omit(props.payoutMethod, 'id')}
                      host={form.options.host}
                    />
                    <StyledInputFormikField
                      mt={2}
                      label={intl.formatMessage({ defaultMessage: 'Name', id: 'Fields.name' })}
                      name={`editingPayoutMethod.${props.payoutMethod.id}.name`}
                    >
                      {({ field }) => (
                        <StyledInput
                          {...field}
                          onFocus={() =>
                            form.setFieldTouched(`editingPayoutMethod.${props.payoutMethod.id}.name`, true)
                          }
                        />
                      )}
                    </StyledInputFormikField>
                    {editPayoutMethodValue?.name !==
                      generatePayoutMethodName(editPayoutMethodValue.type, editPayoutMethodValue.data) && (
                      <Button
                        size="xs"
                        variant="link"
                        className="p-0"
                        onClick={() => setFieldTouched(`editingPayoutMethod.${props.payoutMethod.id}.name`, false)}
                      >
                        <FormattedMessage defaultMessage="Use default generated name" id="+6P7pM" />
                      </Button>
                    )}
                  </React.Fragment>
                )}

                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    disabled={isLoadingEditPayoutMethod}
                    variant="secondary"
                    onClick={() => setIsEditingPayoutMethod(false)}
                  >
                    <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
                  </Button>
                  <Button loading={isLoadingEditPayoutMethod} onClick={onSaveClick}>
                    <FormattedMessage defaultMessage="Save" id="save" />
                  </Button>
                </div>
              </React.Fragment>
            ) : (
              <div className="flex flex-col gap-2">
                {isMissingCurrency && (
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
                {hasLegalNameMismatch && !legalNameUpdated && (
                  <MessageBox type="warning">
                    <div className="mb-2 font-bold">
                      <FormattedMessage defaultMessage="The names you provided do not match." id="XAPZa0" />
                    </div>
                    <div>
                      <FormattedMessage
                        defaultMessage="The legal name in the payee profile is: {legalName}."
                        id="NSammt"
                        values={{
                          legalName: form.options.payee?.legalName,
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
                        <div className="mb-2 mt-4 font-bold">
                          <FormattedMessage
                            defaultMessage=" Would you like to update your legal name to match your payout method contact name?"
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
                          <Button disabled={loading} variant="outline" onClick={() => setKeepNameDifferent(true)}>
                            <FormattedMessage defaultMessage="No, Keep Them Different" id="PCBOGA" />
                          </Button>
                        </div>
                      </React.Fragment>
                    )}
                    {keepNameDifferent && (
                      <StyledInputFormikField
                        mt={4}
                        label={intl.formatMessage({
                          defaultMessage: 'Please explain why they are different',
                          id: 'bzGbkJ',
                        })}
                        name="payoutMethodNameDiscrepancyReason"
                      />
                    )}
                  </MessageBox>
                )}
                {legalNameUpdated && (
                  <MessageBox type="warning">
                    <FormattedMessage
                      defaultMessage="Legal name is updated to match the payout method name."
                      id="TI6gwx"
                    />
                  </MessageBox>
                )}
                {isPayoutMethodDetailsOpen && (
                  <div className="grid grid-cols-3 gap-2 *:p-2 *:last:mb-0">
                    <PayoutMethodDetails payoutMethod={props.payoutMethod} />
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
      {isDeletingPayoutMethod && (
        <ConfirmationModal
          isDanger
          type="delete"
          onClose={() => setIsDeletingPayoutMethod(false)}
          header={<FormattedMessage defaultMessage="Delete Payout Method?" id="weGvmF" />}
          body={
            <div>
              <FormattedMessage defaultMessage="Are you sure you want to delete this payout method?" id="uR+TjD" />
              <div className="mt-4">
                <PayoutMethodLabel payoutMethod={props.payoutMethod} />
              </div>
            </div>
          }
          continueHandler={async () => {
            try {
              await deletePayoutMethod();
              await props.onPaymentMethodDeleted();
              toast({
                variant: 'success',
                message: <FormattedMessage defaultMessage="Payout Method deleted successfully" id="2sVunP" />,
              });
              setIsDeletingPayoutMethod(false);
              return CONFIRMATION_MODAL_TERMINATE;
            } catch (e) {
              toast({
                variant: 'error',
                message: i18nGraphqlException(intl, e),
              });
            }
          }}
        />
      )}
    </React.Fragment>
  );
}
