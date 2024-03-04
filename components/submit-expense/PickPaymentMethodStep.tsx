import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { MoneyCheck } from '@styled-icons/fa-solid/MoneyCheck';
import { Paypal } from '@styled-icons/remix-line/Paypal';
import { FormikProvider, useFormik } from 'formik';
import { uniqBy } from 'lodash';
import { ChevronDown, ChevronUp, Landmark, Trash2 } from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import {
  Host,
  PayoutMethod,
  PayoutMethodType,
  SavePayoutMethodMutation,
  SavePayoutMethodMutationVariables,
} from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';

import Avatar from '../Avatar';
import CollectivePicker from '../CollectivePicker';
import ConfirmationModal, { CONFIRMATION_MODAL_TERMINATE } from '../ConfirmationModal';
import PayoutMethodForm, { validatePayoutMethod } from '../expenses/PayoutMethodForm';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import Image from '../Image';
import Loading from '../Loading';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledSelect from '../StyledSelect';
import { Button } from '../ui/Button';
import { StepListItem } from '../ui/StepList';
import { useToast } from '../ui/useToast';

import { RadioCardButton } from './RadioCardButton';
import { ExpenseStepDefinition } from './Steps';
import { ExpenseForm } from './useExpenseForm';

type PickPaymentMethodFormProps = {
  form: ExpenseForm;
};

export const PickPaymentMethodStep: ExpenseStepDefinition = {
  Form: PickPaymentMethodForm,
  StepListItem: PickPaymentMethodStepListItem,
  hasError(form) {
    return !!form.errors.payeeSlug || !!form.errors.payoutMethodId;
  },
};

function PickPaymentMethodForm(props: PickPaymentMethodFormProps) {
  const { LoggedInUser } = useLoggedInUser();
  const [isChangingPayee, setIsChangingPayee] = React.useState(false);

  const payeeProfile = React.useMemo(
    () => props.form.options.payoutProfiles?.find(p => p.slug === props.form.values.payeeSlug),
    [props.form.values.payeeSlug, props.form.options.payoutProfiles],
  );

  const pickedLastSubmitedPayee = React.useMemo(
    () =>
      payeeProfile &&
      props.form.options.recentlySubmittedExpenses?.nodes?.length > 0 &&
      props.form.options.recentlySubmittedExpenses.nodes[0].payee.slug === payeeProfile.slug,
    [payeeProfile, props.form.options.recentlySubmittedExpenses],
  );

  const isPersonalProfile = payeeProfile && payeeProfile.slug === LoggedInUser?.collective?.slug;

  return (
    <div className="flex-grow pr-2">
      <h1 className="mb-4 text-lg font-bold leading-[26px] text-dark-900">
        <FormattedMessage defaultMessage="Who is getting paid?" />
      </h1>
      {payeeProfile ? (
        <RadioCardButton
          className="w-full"
          onClick={() => {}}
          checked
          title={
            <div className="flex items-center gap-4">
              {isPersonalProfile && <FormattedMessage defaultMessage="Myself" />}
              <Avatar collective={payeeProfile} radius={24} />

              <span className="flex-grow">
                {pickedLastSubmitedPayee ? (
                  <FormattedMessage
                    defaultMessage="{label} (Last used)"
                    values={{
                      label: payeeProfile.name,
                    }}
                  />
                ) : (
                  payeeProfile.name
                )}
              </span>

              <Button
                size="xs"
                variant="link"
                onClick={() => {
                  props.form.setFieldValue('payeeSlug', null);
                  setIsChangingPayee(true);
                }}
              >
                <FormattedMessage defaultMessage="Change" />
              </Button>
            </div>
          }
        />
      ) : (
        <PayeePicker form={props.form} isChangingPayee={isChangingPayee} />
      )}

      {payeeProfile && <PayoutMethodPicker form={props.form} />}
    </div>
  );
}

type PayeePickerProps = {
  form: ExpenseForm;
  isChangingPayee?: boolean;
};

function PayeePicker(props: PayeePickerProps) {
  const [isPickingOtherPayee, setIsPickingOtherPayee] = React.useState(false);
  const { LoggedInUser } = useLoggedInUser();

  const loggedInAccount = React.useMemo(
    () => (props.form.options.payoutProfiles ?? []).find(p => p.slug === LoggedInUser?.collective?.slug),
    [LoggedInUser?.collective?.slug, props.form.options.payoutProfiles],
  );

  const profilesBySlug = React.useMemo(() => {
    return (props.form.options.payoutProfiles ?? []).reduce(
      (acc, profile) => ({ ...acc, [profile.slug]: profile }),
      {},
    );
  }, [props.form.options.payoutProfiles]);

  const recentlySubmittedExpenses = props.form.options.recentlySubmittedExpenses;
  const recentPayeesSlugs = React.useMemo(() => {
    const uniquePayees = uniqBy(recentlySubmittedExpenses?.nodes || [], e => e.payee.slug)
      .map(e => e.payee.slug)
      .filter(recentSlug => profilesBySlug[recentSlug]);
    return uniquePayees;
  }, [recentlySubmittedExpenses, profilesBySlug]);

  const otherPayees = React.useMemo(() => {
    return (props.form.options.payoutProfiles ?? []).filter(
      p => !recentPayeesSlugs.includes(p.slug) && p.slug !== loggedInAccount?.slug,
    );
  }, [recentPayeesSlugs, loggedInAccount]);

  const setFieldValue = props.form.setFieldValue;
  React.useEffect(() => {
    if (
      !props.isChangingPayee &&
      !isPickingOtherPayee &&
      recentPayeesSlugs.length > 0 &&
      !props.form.values.payeeSlug
    ) {
      setFieldValue('payeeSlug', recentPayeesSlugs[0]);
    }
  }, [isPickingOtherPayee, recentPayeesSlugs, loggedInAccount, props.form.values.payeeSlug, setFieldValue]);

  if (LoggedInUser && !loggedInAccount) {
    return <Loading />;
  }

  return (
    <React.Fragment>
      <div className="flex flex-col gap-4">
        {recentPayeesSlugs.map((payeeSlug, i) => (
          <RadioCardButton
            checked={payeeSlug === props.form.values.payeeSlug}
            key={payeeSlug}
            onClick={() => {
              props.form.setFieldValue('payeeSlug', payeeSlug);
              setIsPickingOtherPayee(false);
            }}
            title={
              <div className="flex gap-2">
                {payeeSlug === loggedInAccount?.slug && <FormattedMessage defaultMessage="Myself" />}
                <Avatar radius={24} collective={profilesBySlug[payeeSlug]} displayTitle />
                {i === 0 ? (
                  <FormattedMessage
                    defaultMessage="{label} (Last used)"
                    values={{
                      label: profilesBySlug[payeeSlug].name,
                    }}
                  />
                ) : (
                  <span>{profilesBySlug[payeeSlug].name}</span>
                )}
              </div>
            }
          />
        ))}
        {loggedInAccount && !recentPayeesSlugs.includes(loggedInAccount.slug) && (
          <RadioCardButton
            checked={loggedInAccount.slug === props.form.values.payeeSlug}
            onClick={() => {
              props.form.setFieldValue('payeeSlug', loggedInAccount.slug);
              setIsPickingOtherPayee(false);
            }}
            title={
              <div className="flex gap-2">
                <Avatar radius={24} collective={loggedInAccount} displayTitle />
                <span>{loggedInAccount.name}</span>
              </div>
            }
          />
        )}
        {otherPayees.length > 0 && (
          <RadioCardButton
            checked={isPickingOtherPayee || otherPayees.some(p => p.slug === props.form.values.payeeSlug)}
            onClick={() => {
              setIsPickingOtherPayee(true);
            }}
            title={<FormattedMessage defaultMessage="A profile I administer" />}
            content={
              (isPickingOtherPayee || otherPayees.find(p => p.slug === props.form.values.payeeSlug)) && (
                <div className="mt-2">
                  <CollectivePicker
                    collectives={otherPayees}
                    collective={otherPayees.find(p => p.slug === props.form.values.payeeSlug)}
                    onChange={e => {
                      setIsPickingOtherPayee(true);
                      setFieldValue('payeeSlug', e.value.slug);
                    }}
                  />
                </div>
              )
            }
          />
        )}
      </div>
    </React.Fragment>
  );
}

const payoutMethodLabels = defineMessages({
  [PayoutMethodType.ACCOUNT_BALANCE]: {
    id: 'PayoutMethod.AccountBalance',
    defaultMessage: 'Open Collective (Account Balance)',
  },
  [PayoutMethodType.BANK_ACCOUNT]: {
    id: 'BankAccount',
    defaultMessage: 'Bank account',
  },
  [PayoutMethodType.PAYPAL]: {
    id: 'PayoutMethod.Type.Paypal',
    defaultMessage: 'PayPal',
  },
  [PayoutMethodType.OTHER]: {
    id: 'PayoutMethod.Type.Other',
    defaultMessage: 'Other',
  },
});

function PickPaymentMethodStepListItem(props: { className?: string; form: ExpenseForm; current: boolean }) {
  const payee = React.useMemo(
    () => props.form.options.payoutProfiles?.find(p => p.slug === props.form.values.payeeSlug),
    [props.form.options.payoutProfiles, props.form.values.payeeSlug],
  );
  const payoutMethod = React.useMemo(
    () => payee && payee.payoutMethods.find(p => p.id === props.form.values.payoutMethodId),
    [payee, props.form.values.payoutMethodId],
  );

  return (
    <StepListItem
      className={props.className}
      title={<FormattedMessage defaultMessage="Who is getting paid?" />}
      subtitle={
        payee && payoutMethod ? (
          <span>
            {payee.name} (
            <span>
              <PayoutMethodLabel payoutMethod={payoutMethod} />
            </span>
            )
          </span>
        ) : (
          payee?.name
        )
      }
      completed={!PickPaymentMethodStep.hasError(props.form)}
      current={props.current}
    />
  );
}

function PayoutMethodIcon(props: { payoutMethod: PayoutMethod }) {
  switch (props.payoutMethod.type) {
    case PayoutMethodType.ACCOUNT_BALANCE:
      return <Image alt="Open Collective" src="/static/images/oc-logo-watercolor-256.png" height={16} width={16} />;
    case PayoutMethodType.BANK_ACCOUNT:
      return <Landmark size={16} />;
    case PayoutMethodType.OTHER:
      return <MoneyCheck size={16} />;
    case PayoutMethodType.PAYPAL:
      return <Paypal size={16} />;
  }
}

export function PayoutMethodLabel(props: { payoutMethod?: PayoutMethod }) {
  if (!props.payoutMethod) {
    return null;
  }

  if (props.payoutMethod.name) {
    return props.payoutMethod.name;
  }

  return <FormattedMessage {...payoutMethodLabels[props.payoutMethod.type]} />;
}

export function PaymentMethodDetails(props: { payoutMethod?: PayoutMethod }) {
  if (!props.payoutMethod) {
    return null;
  }

  return (
    <React.Fragment>
      {props.payoutMethod?.name && (
        <div className="text-sm text-slate-700">
          <div className="font-bold">
            <FormattedMessage id="Fields.name" defaultMessage="Name" />
          </div>
          <div className="overflow-hidden text-ellipsis">{props.payoutMethod?.name}</div>
        </div>
      )}

      {props.payoutMethod?.data?.currency && (
        <div className="text-sm text-slate-700">
          <div className="font-bold">
            <FormattedMessage id="Currency" defaultMessage="Currency" />
          </div>
          <div className="overflow-hidden text-ellipsis">{props.payoutMethod?.data?.currency}</div>
        </div>
      )}

      {props.payoutMethod?.data?.accountHolderName && (
        <div className="text-sm text-slate-700">
          <div className="font-bold">
            <FormattedMessage defaultMessage="Account holder" />
          </div>
          <div className="overflow-hidden text-ellipsis">{props.payoutMethod?.data?.accountHolderName}</div>
        </div>
      )}

      {props.payoutMethod?.data?.details?.accountNumber && (
        <div className="text-sm text-slate-700">
          <div className="font-bold">
            <FormattedMessage defaultMessage="Account number" />
          </div>
          <div className="overflow-hidden text-ellipsis">{props.payoutMethod?.data?.details?.accountNumber}</div>
        </div>
      )}

      {props.payoutMethod?.data?.email && (
        <div className="text-sm text-slate-700">
          <div className="font-bold">
            <FormattedMessage id="Email" defaultMessage="Email" />
          </div>
          <div className="overflow-hidden text-ellipsis">{props.payoutMethod?.data?.email}</div>
        </div>
      )}

      {props.payoutMethod?.data?.content && (
        <div className="text-sm text-slate-700">
          <div className="overflow-hidden text-ellipsis">{props.payoutMethod?.data?.content}</div>
        </div>
      )}
    </React.Fragment>
  );
}

type PayoutMethodOptionButtonProps = {
  payoutMethod: PayoutMethod;
  checked?: boolean;
  isLastUsedPaymentMethod?: boolean;
  onClick: () => void;
  onDelete: () => void;
  onEdit: () => void;
  disabled?: boolean;
};

function PayoutMethodOptionButton(props: PayoutMethodOptionButtonProps) {
  const intl = useIntl();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(props.checked);
  const [isDeletingPayoutMethod, setIsDeletingPayoutMethod] = React.useState(false);

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
        payoutMethodId: props.payoutMethod.id,
      },
    },
  );

  return (
    <React.Fragment>
      <RadioCardButton
        checked={props.checked}
        onClick={props.onClick}
        disabled={props.disabled}
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PayoutMethodIcon payoutMethod={props.payoutMethod} />
              {props.isLastUsedPaymentMethod ? (
                <FormattedMessage
                  defaultMessage="{label} (Last used)"
                  values={{
                    label: (
                      <b>
                        <PayoutMethodLabel payoutMethod={props.payoutMethod} />
                      </b>
                    ),
                  }}
                />
              ) : (
                <b>
                  <PayoutMethodLabel payoutMethod={props.payoutMethod} />
                </b>
              )}
            </div>
            <div className="flex">
              <Button
                size="icon"
                variant="ghost"
                onClick={e => {
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                }}
              >
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>

              <Button
                onClick={e => {
                  e.stopPropagation();
                  setIsDeletingPayoutMethod(true);
                }}
                size="icon"
                variant="ghost"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        }
        content={
          isOpen ? (
            <div className="flex flex-col gap-1 *:first:mt-2">
              <PaymentMethodDetails payoutMethod={props.payoutMethod} />
            </div>
          ) : null
        }
      />
      {isDeletingPayoutMethod && (
        <ConfirmationModal
          isDanger
          type="delete"
          onClose={() => setIsDeletingPayoutMethod(false)}
          header={<FormattedMessage defaultMessage="Delete Payment Method?" />}
          body={<FormattedMessage defaultMessage="Are you sure you want to delete this payment method?" />}
          continueHandler={async () => {
            try {
              await deletePayoutMethod();
              toast({
                variant: 'success',
                message: <FormattedMessage defaultMessage="Payment Method deleted successfully" />,
              });
              setIsDeletingPayoutMethod(false);
              props.onDelete();
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

type PayoutMethodPickerProps = {
  form: ExpenseForm;
};

function PayoutMethodPicker(props: PayoutMethodPickerProps) {
  const [isCreatingNewPayoutMethod, setIsCreatingNewPayoutMethod] = React.useState(false);
  const payeeProfile = React.useMemo(
    () => props.form.options.payoutProfiles?.find(p => p.slug === props.form.values.payeeSlug),
    [props.form.values.payeeSlug, props.form.options.payoutProfiles],
  );

  const lastUsedPaymentMethodIdByPayee = React.useMemo(() => {
    if (!payeeProfile || (props.form.options.recentlySubmittedExpenses?.nodes ?? []).length === 0) {
      return null;
    }

    const lastExpenseFromThisPayee = props.form.options.recentlySubmittedExpenses.nodes.find(
      e => e.payee.slug === payeeProfile.slug,
    );
    if (!lastExpenseFromThisPayee) {
      return null;
    }

    return lastExpenseFromThisPayee.payoutMethod.id;
  }, [payeeProfile, props.form.options.recentlySubmittedExpenses]);

  const payeePaymentMethods = React.useMemo(() => {
    if (!payeeProfile) {
      return [];
    }

    return [
      payeeProfile.payoutMethods.find(p => p.id === lastUsedPaymentMethodIdByPayee),
      ...payeeProfile.payoutMethods.filter(p => p.id !== lastUsedPaymentMethodIdByPayee),
    ].filter(Boolean);
  }, [payeeProfile, lastUsedPaymentMethodIdByPayee]);

  React.useEffect(() => {
    if (
      !isCreatingNewPayoutMethod &&
      lastUsedPaymentMethodIdByPayee &&
      payeePaymentMethods.length > 0 &&
      props.form.values.payeeSlug &&
      !props.form.values.payoutMethodId &&
      (!props.form.options.supportedPayoutMethods ||
        props.form.options.supportedPayoutMethods.includes(
          payeePaymentMethods.find(pm => pm.id === lastUsedPaymentMethodIdByPayee)?.type,
        ))
    ) {
      props.form.setFieldValue('payoutMethodId', lastUsedPaymentMethodIdByPayee);
    }
  }, [lastUsedPaymentMethodIdByPayee, props.form.values.payoutMethodId, props.form.values.payeeSlug]);

  return (
    <React.Fragment>
      <h1 className="mb-4 mt-8 text-lg font-bold leading-[26px] text-dark-900">
        <FormattedMessage id="Fields.paymentMethod" defaultMessage="Payment method" /> <PrivateInfoIcon />
      </h1>
      <div className="flex flex-col gap-4">
        {payeePaymentMethods.map(payoutMethod => (
          <PayoutMethodOptionButton
            disabled={
              props.form.options.supportedPayoutMethods &&
              !props.form.options.supportedPayoutMethods.includes(payoutMethod.type)
            }
            isLastUsedPaymentMethod={lastUsedPaymentMethodIdByPayee === payoutMethod.id}
            payoutMethod={payoutMethod}
            checked={payoutMethod.id === props.form.values.payoutMethodId}
            onClick={() => {
              props.form.setFieldValue('payeeSlug', payeeProfile.slug);
              props.form.setFieldValue('payoutMethodId', payoutMethod.id);
              setIsCreatingNewPayoutMethod(false);
            }}
            onDelete={() => {
              if (props.form.values.payoutMethodId === payoutMethod.id) {
                props.form.setFieldValue('payoutMethodId', null);
              }
              props.form.refresh();
            }}
            onEdit={() => {
              props.form.refresh();
            }}
            key={payoutMethod.id}
          />
        ))}

        <RadioCardButton
          title={
            <b>
              <FormattedMessage defaultMessage="New Payment Method" />
            </b>
          }
          onClick={() => {
            props.form.setFieldValue('payoutMethodId', null);
            setIsCreatingNewPayoutMethod(true);
          }}
          checked={!props.form.values.payoutMethodId}
          content={
            !props.form.values.payoutMethodId ? (
              <div className="mt-2">
                <CreatePayoutMethodForm
                  supportedPayoutMethods={props.form.options.supportedPayoutMethods}
                  payeeSlug={props.form.values.payeeSlug}
                  host={props.form.options.host}
                  onCreate={id => {
                    props.form.refresh();
                    props.form.setFieldValue('payoutMethodId', id);
                  }}
                />
              </div>
            ) : null
          }
        />
      </div>
    </React.Fragment>
  );
}

type CreatePayoutMethodFormProps = {
  supportedPayoutMethods?: PayoutMethodType[];
  payeeSlug: string;
  onCreate: (id: string) => void;
  host: Pick<Host, 'transferwise'>;
};

function CreatePayoutMethodForm(props: CreatePayoutMethodFormProps) {
  const { toast } = useToast();
  const intl = useIntl();

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
    },
  );

  const formik = useFormik({
    initialValues: {
      data: {},
      name: '',
      type: null,
    },
    validate(values) {
      const payoutMethodErrors = validatePayoutMethod(values);
      if (!values.name) {
        payoutMethodErrors.name = 'Required';
      }
      return payoutMethodErrors;
    },
    async onSubmit(values) {
      try {
        const res = await createPayoutMethod({
          variables: {
            payeeSlug: props.payeeSlug,
            payoutMethod: {
              type: values.type,
              data: values.data,
              name: values.name,
              isSaved: true,
            },
          },
        });
        toast({
          variant: 'success',
          message: <FormattedMessage defaultMessage="Payout Method saved successfully" />,
        });
        props.onCreate(res.data.createPayoutMethod.id);
      } catch (e) {
        toast({
          variant: 'error',
          message: i18nGraphqlException(intl, e),
        });
      }
    },
    validateOnBlur: false,
  });

  const onSubmit = React.useCallback(async () => {
    await formik.submitForm();
  }, [formik]);

  return (
    <FormikProvider value={formik}>
      <div>
        <StyledInputFormikField
          name="name"
          label={<FormattedMessage id="Fields.name" defaultMessage="Name" />}
          labelFontSize="13px"
        />

        <StyledInputFormikField
          my={2}
          name="type"
          label={<FormattedMessage defaultMessage="Method" />}
          labelFontSize="13px"
        >
          {() => (
            <StyledSelect
              inputId="payoutMethodType"
              value={
                formik.values.type
                  ? {
                      value: formik.values.type,
                      label: intl.formatMessage(payoutMethodLabels[formik.values.type]),
                    }
                  : null
              }
              options={props.supportedPayoutMethods.map(m => ({
                value: m,
                label: intl.formatMessage(payoutMethodLabels[m]),
              }))}
              onChange={option => formik.setFieldValue('type', option.value)}
            />
          )}
        </StyledInputFormikField>

        {formik.values.type && (
          <PayoutMethodForm
            required
            alwaysSave
            payoutMethod={{ type: formik.values.type, data: formik.values.data }}
            host={props.host}
          />
        )}
      </div>
      <Button className="mt-2" onClick={onSubmit}>
        Save
      </Button>
    </FormikProvider>
  );
}
