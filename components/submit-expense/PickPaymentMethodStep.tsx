import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import clsx from 'clsx';
import { FormikProvider, useFormik } from 'formik';
import { debounce, uniqBy } from 'lodash';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';
import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import {
  Host,
  PaymentMethodType,
  PayoutMethod,
  PayoutMethodType,
  SavePayoutMethodMutation,
  SavePayoutMethodMutationVariables,
} from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';

import Avatar from '../Avatar';
import CollectivePicker from '../CollectivePicker';
import CollectivePickerAsync from '../CollectivePickerAsync';
import ConfirmationModal, { CONFIRMATION_MODAL_TERMINATE } from '../ConfirmationModal';
import ExpenseFormPayeeInviteNewStep from '../expenses/ExpenseFormPayeeInviteNewStep';
import PayoutMethodData from '../expenses/PayoutMethodData';
import PayoutMethodForm, { validatePayoutMethod } from '../expenses/PayoutMethodForm';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import Loading from '../Loading';
import { PayoutMethodIcon } from '../PayoutMethodIcon';
import { I18nPayoutMethodLabels, PayoutMethodLabel } from '../PayoutMethodLabel';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledSelect from '../StyledSelect';
import { Button } from '../ui/Button';
import { useToast } from '../ui/useToast';

import { InvitedPayeeLabel } from './InvitedPayeeLabel';
import { RadioCardButton } from './RadioCardButton';
import { ExpenseForm } from './useExpenseForm';

type PickPaymentMethodFormProps = {
  form: ExpenseForm;
};

export function PickPaymentMethodForm(props: PickPaymentMethodFormProps) {
  const { LoggedInUser } = useLoggedInUser();
  const [isChangingPayee, setIsChangingPayee] = React.useState(false);

  const payeeProfile = props.form.options.payee;

  const pickedLastSubmitedPayee = React.useMemo(
    () =>
      payeeProfile &&
      props.form.options.recentlySubmittedExpenses?.nodes?.length > 0 &&
      props.form.options.recentlySubmittedExpenses.nodes[0].payee.slug === payeeProfile.slug,
    [payeeProfile, props.form.options.recentlySubmittedExpenses],
  );

  const isPersonalProfile = payeeProfile && payeeProfile.slug === LoggedInUser?.collective?.slug;

  const invitePayee = props.form.values.invitePayee;

  const pickedPayee = invitePayee || payeeProfile;
  const hasPayoutPicker =
    pickedPayee && !isChangingPayee && payeeProfile?.type !== CollectiveType.VENDOR && !invitePayee?.['legacyId'];

  return (
    <div className="flex-grow pr-2">
      <h1 className="mb-4 text-lg font-bold leading-[26px] text-dark-900">
        <FormattedMessage defaultMessage="Who is getting paid?" />
      </h1>

      <React.Fragment>
        {isChangingPayee || !pickedPayee ? (
          <PayeePicker
            form={props.form}
            isChangingPayee={isChangingPayee}
            onPayeePicked={() => setIsChangingPayee(false)}
          />
        ) : (
          <RadioCardButton
            className="w-full"
            onClick={() => {}}
            checked
            title={
              <div className="flex items-center gap-4">
                {isPersonalProfile && <FormattedMessage defaultMessage="Myself" />}
                {!invitePayee && <Avatar collective={payeeProfile} radius={24} />}

                <span className="flex-grow">
                  {pickedLastSubmitedPayee ? (
                    <FormattedMessage
                      defaultMessage="{label} (Last used)"
                      values={{
                        label: payeeProfile.name,
                      }}
                    />
                  ) : invitePayee ? (
                    <InvitedPayeeLabel invitePayee={invitePayee} />
                  ) : (
                    payeeProfile.name
                  )}
                </span>

                <Button
                  size="xs"
                  variant="link"
                  onClick={() => {
                    props.form.setFieldValue('payeeSlug', null);
                    props.form.setFieldValue('invitePayee', null);
                    props.form.setFieldValue('inviteNote', null);
                    setIsChangingPayee(true);
                  }}
                >
                  <FormattedMessage defaultMessage="Change" />
                </Button>
              </div>
            }
          />
        )}

        {hasPayoutPicker && <PayoutMethodPicker form={props.form} />}
      </React.Fragment>
    </div>
  );
}

type PayeePickerProps = {
  form: ExpenseForm;
  isChangingPayee?: boolean;
  onPayeePicked: () => void;
};

function PayeePicker(props: PayeePickerProps) {
  const [isPickingVendor, setIsPickingVendor] = React.useState(false);
  const [isPickingOtherPayee, setIsPickingOtherPayee] = React.useState(false);
  const [isInvitingOtherPayee, setIsInvitingOtherPayee] = React.useState(props.form.startOptions.preselectInvitePayee);
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
  }, [props.form.options.payoutProfiles, recentPayeesSlugs, loggedInAccount]);

  const setFieldValue = props.form.setFieldValue;
  const onPayeePicked = props.onPayeePicked;
  React.useEffect(() => {
    if (
      !props.isChangingPayee &&
      !isPickingOtherPayee &&
      !isPickingVendor &&
      !isInvitingOtherPayee &&
      recentPayeesSlugs.length > 0 &&
      !props.form.values.payeeSlug &&
      !props.form.startOptions.preselectInvitePayee
    ) {
      setFieldValue('payeeSlug', recentPayeesSlugs[0]);
      onPayeePicked();
    }
  }, [
    onPayeePicked,
    props.isChangingPayee,
    isPickingOtherPayee,
    isPickingVendor,
    isInvitingOtherPayee,
    recentPayeesSlugs,
    loggedInAccount,
    props.form.values.payeeSlug,
    setFieldValue,
    props.form.startOptions.preselectInvitePayee,
  ]);

  if (LoggedInUser && !loggedInAccount) {
    return <Loading />;
  }

  return (
    <React.Fragment>
      <div className="flex flex-col gap-4">
        {recentPayeesSlugs.map((payeeSlug, i) => (
          <RadioCardButton
            className="order-2"
            checked={payeeSlug === props.form.values.payeeSlug}
            key={payeeSlug}
            onClick={() => {
              props.form.setFieldValue('payeeSlug', payeeSlug);
              onPayeePicked();
              setIsPickingOtherPayee(false);
              setIsPickingVendor(false);
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
            className="order-2"
            checked={loggedInAccount.slug === props.form.values.payeeSlug}
            onClick={() => {
              setFieldValue('payeeSlug', loggedInAccount.slug);
              onPayeePicked();
              setIsPickingOtherPayee(false);
              setIsInvitingOtherPayee(false);
              setIsPickingVendor(false);
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
            className="order-2"
            checked={isPickingOtherPayee || otherPayees.some(p => p.slug === props.form.values.payeeSlug)}
            onClick={() => {
              setIsPickingOtherPayee(true);
              setIsInvitingOtherPayee(false);
              setIsPickingVendor(false);
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
                      onPayeePicked();
                      setIsPickingOtherPayee(false);
                      setIsInvitingOtherPayee(false);
                      setIsPickingVendor(false);
                    }}
                  />
                </div>
              )
            }
          />
        )}
        <RadioCardButton
          className="order-2"
          checked={isPickingVendor}
          title={<FormattedMessage defaultMessage="A vendor" />}
          content={
            isPickingVendor && (
              <div className="mt-2">
                <VendorPicker
                  collectiveSlug={props.form.values.collectiveSlug}
                  hostSlug={props.form.options.host.slug}
                  onChange={vendor => {
                    setFieldValue('payeeSlug', vendor.slug);
                    onPayeePicked();
                  }}
                />
              </div>
            )
          }
          onClick={() => {
            setIsPickingVendor(true);
            setIsPickingOtherPayee(false);
            setIsInvitingOtherPayee(false);
          }}
        />
        <RadioCardButton
          className={clsx({
            'order-1': props.form.startOptions.preselectInvitePayee,
            'order-2': !props.form.startOptions.preselectInvitePayee,
          })}
          checked={
            (isInvitingOtherPayee &&
              !(isPickingOtherPayee && otherPayees.some(p => p.slug === props.form.values.payeeSlug))) ||
            (!!props.form.values.invitePayee && !isPickingOtherPayee)
          }
          onClick={() => {
            setIsInvitingOtherPayee(true);
            setIsPickingOtherPayee(false);
            setIsPickingVendor(false);
          }}
          title={
            <FormattedMessage
              id="CollectivePicker.InviteMenu.ButtonLabel"
              defaultMessage="Invite someone to submit an expense"
            />
          }
          content={
            (isInvitingOtherPayee &&
              !(isPickingOtherPayee && otherPayees.some(p => p.slug === props.form.values.payeeSlug))) ||
            (props.form.values.invitePayee && !isPickingOtherPayee) ? (
              <InvitePayeePicker
                form={props.form}
                onPick={() => {
                  onPayeePicked();
                }}
              />
            ) : null
          }
        />
      </div>
    </React.Fragment>
  );
}

type InvitePayeePickerProps = {
  form: ExpenseForm;
  onPick: () => void;
};

function InvitePayeePicker(props: InvitePayeePickerProps) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isNewInvitePayee, setIsNewInvitePayee] = React.useState(
    props.form.values.invitePayee && !('legacyId' in props.form.values.invitePayee) ? true : false,
  );

  const formik = useFormik({
    initialValues: {
      payee: props.form.values.invitePayee,
      recipientNote: props.form.values.inviteNote,
    },
    async onSubmit(values, formikHelpers) {
      if (!formRef.current?.reportValidity()) {
        return;
      }
      await formikHelpers.validateForm();
      props.form.setFieldValue('invitePayee', values.payee);
      props.form.setFieldValue('inviteNote', values.recipientNote);
      props.onPick();
    },
    validateOnBlur: false,
    validateOnMount: false,
  });

  return (
    <div className="mt-2">
      <CollectivePickerAsync
        inputId="payee-invite-picker"
        onFocus={() => setIsNewInvitePayee(null)}
        invitable
        collective={
          props.form.values.invitePayee && 'legacyId' in props.form.values.invitePayee
            ? { ...props.form.values.invitePayee, id: props.form.values.invitePayee.legacyId }
            : null
        }
        types={[
          CollectiveType.COLLECTIVE,
          CollectiveType.EVENT,
          CollectiveType.FUND,
          CollectiveType.ORGANIZATION,
          CollectiveType.PROJECT,
          CollectiveType.USER,
        ]}
        onChange={option => {
          if (option?.value?.id) {
            setIsNewInvitePayee(false);
            props.form.setFieldValue('invitePayee', { ...option.value, legacyId: option.value.id });
            props.form.setFieldValue('inviteNote', '');
            props.onPick();
          }
        }}
        onInvite={() => {
          if (props.form.values.invitePayee && 'legacyId' in props.form.values.invitePayee) {
            props.form.setFieldValue('invitePayee', { name: '', email: '' });
          }
          setIsNewInvitePayee(true);
        }}
      />
      {isNewInvitePayee && (
        <div>
          <FormikProvider value={formik}>
            <form ref={formRef}>
              <ExpenseFormPayeeInviteNewStep hidePayoutDetails formik={formik} />
            </form>
          </FormikProvider>
          <Button className="mt-2" onClick={formik.submitForm}>
            <FormattedMessage defaultMessage="Confirm" />
          </Button>
        </div>
      )}
    </div>
  );
}

type PayoutMethodOptionButtonProps = {
  payoutMethod: PayoutMethod | Omit<PayoutMethod, 'id'>;
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
        payoutMethodId: props.payoutMethod['id'],
      },
    },
  );

  const hasDetails = props.payoutMethod.type !== PayoutMethodType.PAYPAL;

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
            {hasDetails && (
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
                    if ('id' in props.payoutMethod) {
                      setIsDeletingPayoutMethod(true);
                    } else {
                      props.onDelete();
                    }
                  }}
                  size="icon"
                  variant="ghost"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            )}
          </div>
        }
        content={
          isOpen && hasDetails ? (
            <div className="flex flex-col gap-1 *:first:mt-2">
              <PayoutMethodData showLabel={false} payoutMethod={props.payoutMethod} />
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

    return lastExpenseFromThisPayee.payoutMethod?.id;
  }, [payeeProfile, props.form.options.recentlySubmittedExpenses]);

  const payeePaymentMethods = React.useMemo(() => {
    if (!payeeProfile || !payeeProfile.payoutMethods) {
      return [];
    }

    return [
      payeeProfile.payoutMethods.find(p => p.id === lastUsedPaymentMethodIdByPayee),
      ...payeeProfile.payoutMethods.filter(p => p.id !== lastUsedPaymentMethodIdByPayee),
    ].filter(Boolean);
  }, [payeeProfile, lastUsedPaymentMethodIdByPayee]);

  const setFieldValue = props.form.setFieldValue;
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
      setFieldValue('payoutMethodId', lastUsedPaymentMethodIdByPayee);
    }
  }, [
    isCreatingNewPayoutMethod,
    lastUsedPaymentMethodIdByPayee,
    payeePaymentMethods,
    setFieldValue,
    props.form.values.payoutMethodId,
    props.form.values.payeeSlug,
    props.form.options.supportedPayoutMethods,
  ]);

  const isInvite = !!props.form.values.invitePayee;
  const invitePayoutMethod =
    isInvite && 'payoutMethod' in props.form.values.invitePayee ? props.form.values.invitePayee.payoutMethod : null;

  return (
    <React.Fragment>
      <h1 className="mb-4 mt-8 text-lg font-bold leading-[26px] text-dark-900">
        <FormattedMessage id="Fields.paymentMethod" defaultMessage="Payment method" /> <PrivateInfoIcon />
        {isInvite ? (
          <span className="text-sm font-normal italic">
            &nbsp;
            <FormattedMessage id="tier.order.organization.twitterHandle.description" defaultMessage="optional" />
          </span>
        ) : null}
      </h1>
      {invitePayoutMethod ? (
        <div className="flex flex-col gap-4">
          <PayoutMethodOptionButton
            payoutMethod={invitePayoutMethod}
            checked
            onClick={() => {}}
            onDelete={() => {
              props.form.setFieldValue('invitePayee.payoutMethod', null);
            }}
            onEdit={() => {}}
          />
        </div>
      ) : (
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
                    onCreate={async paymentMethod => {
                      if ('id' in paymentMethod && paymentMethod.id) {
                        props.form.setFieldValue('payoutMethodId', paymentMethod.id);
                        await props.form.refresh();
                      } else {
                        props.form.setFieldValue('invitePayee.payoutMethod', paymentMethod);
                      }
                    }}
                  />
                </div>
              ) : null
            }
          />
        </div>
      )}
    </React.Fragment>
  );
}

type CreatePayoutMethodFormProps = {
  supportedPayoutMethods?: PayoutMethodType[];
  payeeSlug?: string;
  onCreate: (paymentMethod: { id?: string } | { data: any; type: PaymentMethodType }) => void;
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
      type: null,
    },
    validate(values) {
      const payoutMethodErrors = validatePayoutMethod(values);
      return payoutMethodErrors;
    },
    async onSubmit(values) {
      if (!props.payeeSlug) {
        props.onCreate({
          type: values.type,
          data: values.data,
        });
        return;
      }

      try {
        const res = await createPayoutMethod({
          variables: {
            payeeSlug: props.payeeSlug,
            payoutMethod: {
              type: values.type,
              data: values.data,
              isSaved: true,
            },
          },
        });
        toast({
          variant: 'success',
          message: <FormattedMessage defaultMessage="Payout Method saved successfully" />,
        });
        props.onCreate({ id: res.data.createPayoutMethod.id });
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

  const payoutMethod = React.useMemo(
    () => ({ type: formik.values.type, data: formik.values.data }),
    [formik.values.type, formik.values.data],
  );
  return (
    <FormikProvider value={formik}>
      <div>
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
                      label: intl.formatMessage(I18nPayoutMethodLabels[formik.values.type]),
                    }
                  : null
              }
              options={props.supportedPayoutMethods.map(m => ({
                value: m,
                label: intl.formatMessage(I18nPayoutMethodLabels[m]),
              }))}
              onChange={option => formik.setFieldValue('type', option.value)}
            />
          )}
        </StyledInputFormikField>

        {formik.values.type && <PayoutMethodForm required alwaysSave payoutMethod={payoutMethod} host={props.host} />}
      </div>
      <Button className="mt-2" onClick={onSubmit}>
        <FormattedMessage id="save" defaultMessage="Save" />
      </Button>
    </FormikProvider>
  );
}

type VendorPickerProps = {
  hostSlug: string;
  collectiveSlug: string;
  onChange: (vendor: { slug: string }) => void;
};

function VendorPicker(props: VendorPickerProps) {
  const [term, setTerm] = React.useState(null);

  const query = useQuery(
    gql`
      query VendorPickerSearch($searchTerm: String, $hostSlug: String!, $collectiveSlug: String!) {
        host(slug: $hostSlug) {
          vendors(forAccount: { slug: $collectiveSlug }, searchTerm: $searchTerm) {
            nodes {
              id
              slug
              name
              imageUrl
              type
            }
          }
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        searchTerm: term,
        collectiveSlug: props.collectiveSlug,
        hostSlug: props.hostSlug,
      },
    },
  );

  const onSearch = React.useMemo(
    () =>
      debounce(newTerm => {
        setTerm(newTerm);
      }, 2000),
    [],
  );

  return (
    <CollectivePicker
      isLoading={query.loading}
      collectives={query.data?.host?.vendors?.nodes ?? []}
      useSearchIcon={true}
      isSearchable
      onInputChange={onSearch}
      onChange={e => {
        props.onChange(e.value);
      }}
    />
  );
}
