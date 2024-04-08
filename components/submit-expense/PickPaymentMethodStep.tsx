import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { FormikProvider, useFormik } from 'formik';
import { debounce } from 'lodash';
import { Pencil, Trash2 } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';
import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import {
  Account,
  Host,
  PaymentMethodType,
  PayoutMethodType,
  SavePayoutMethodMutation,
  SavePayoutMethodMutationVariables,
} from '../../lib/graphql/types/v2/graphql';

import CollectivePicker from '../CollectivePicker';
import CollectivePickerAsync from '../CollectivePickerAsync';
import ConfirmationModal, { CONFIRMATION_MODAL_TERMINATE } from '../ConfirmationModal';
import ExpenseFormPayeeInviteNewStep from '../expenses/ExpenseFormPayeeInviteNewStep';
import PayoutMethodData from '../expenses/PayoutMethodData';
import PayoutMethodForm, { validatePayoutMethod } from '../expenses/PayoutMethodForm';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import { I18nPayoutMethodLabels, PayoutMethodLabel } from '../PayoutMethodLabel';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledSelect from '../StyledSelect';
import { Button } from '../ui/Button';
import { useToast } from '../ui/useToast';

import { RadioCardButton } from './RadioCardButton';
import { ExpenseForm } from './useExpenseForm';

type PickPaymentMethodFormProps = {
  form: ExpenseForm;
};

export function PickPaymentMethodForm(props: PickPaymentMethodFormProps) {
  const payeeProfile = props.form.values.payeeSlug ? props.form.options.payee : null;
  const hasVendor = !!props.form.options.host;

  const [isPickingVendor, setIsPickingVendor] = React.useState(
    hasVendor && payeeProfile?.type === CollectiveType.VENDOR,
  );
  const [isInvitingOtherPayee, setIsInvitingOtherPayee] = React.useState(!!props.form.values.invitePayee);

  return (
    <div className="flex-grow pr-2">
      <h1 className="mb-4 text-lg font-bold leading-[26px] text-dark-900">
        <FormattedMessage defaultMessage="Who is getting paid?" id="W5Z+Fm" />
      </h1>

      <div className="flex flex-col gap-4">
        <RadioCardButton
          title={<FormattedMessage defaultMessage="Profiles I administer" id="bRgWXW" />}
          className="w-full"
          onClick={() => {
            props.form.setFieldValue('payeeSlug', null);
            props.form.setFieldValue('payoutMethodId', null);
            props.form.setFieldValue('invitePayee', null);
            props.form.setFieldValue('inviteNote', null);
            props.form.setFieldValue('payeeLocation', null);
            setIsInvitingOtherPayee(false);
            setIsPickingVendor(false);
          }}
          checked={!isPickingVendor && !isInvitingOtherPayee}
          content={
            !isPickingVendor && !isInvitingOtherPayee ? (
              <div className="mt-4">
                <ProfilesIAdministerPicker form={props.form} />
              </div>
            ) : null
          }
        />

        <RadioCardButton
          title={
            <FormattedMessage
              id="CollectivePicker.InviteMenu.ButtonLabel"
              defaultMessage="Invite someone to submit an expense"
            />
          }
          checked={isInvitingOtherPayee}
          onClick={() => {
            setIsInvitingOtherPayee(true);
            setIsPickingVendor(false);
            props.form.setFieldValue('payeeSlug', null);
            props.form.setFieldValue('payoutMethodId', null);
            props.form.setFieldValue('invitePayee', null);
            props.form.setFieldValue('inviteNote', null);
            props.form.setFieldValue('payeeLocation', null);
          }}
          content={
            isInvitingOtherPayee ? (
              <InvitePayeePicker
                form={props.form}
                onPick={() => {
                  // onPayeePicked();
                }}
              />
            ) : null
          }
        />

        {hasVendor && (
          <RadioCardButton
            title={<FormattedMessage defaultMessage="A vendor" id="rth3eX" />}
            className="order-2"
            checked={isPickingVendor}
            content={
              isPickingVendor && (
                <div className="mt-2">
                  <VendorPicker
                    collectiveSlug={props.form.values.collectiveSlug}
                    hostSlug={props.form.options.host.slug}
                    vendor={payeeProfile}
                    onChange={vendor => {
                      props.form.setFieldValue('payeeSlug', vendor.slug);
                      props.form.setFieldValue('payoutMethodId', null);
                      props.form.setFieldValue('invitePayee', null);
                      props.form.setFieldValue('inviteNote', null);
                      props.form.setFieldValue('payeeLocation', null);
                    }}
                  />
                </div>
              )
            }
            onClick={() => {
              props.form.setFieldValue('payeeSlug', null);
              props.form.setFieldValue('payoutMethodId', null);
              props.form.setFieldValue('invitePayee', null);
              props.form.setFieldValue('inviteNote', null);
              setIsPickingVendor(true);
              setIsInvitingOtherPayee(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

type InvitePayeePickerProps = {
  form: ExpenseForm;
  onPick: () => void;
};

function InvitePayeePicker(props: InvitePayeePickerProps) {
  const [isNewInvitePayee, setIsNewInvitePayee] = React.useState(
    props.form.values.invitePayee && !('legacyId' in props.form.values.invitePayee) ? true : false,
  );

  return (
    <div
      className="mt-2"
      role="searchbox"
      tabIndex={0}
      onClick={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
    >
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
          <FormikProvider value={props.form}>
            <ExpenseFormPayeeInviteNewStep
              payeeFieldName="invitePayee"
              recipientNoteFieldName="inviteNote"
              payoutMethodFieldName="invitePayee.payoutMethod"
              formik={props.form}
              collective={{
                ...props.form.options.account,
                host: props.form.options.host,
              }}
              optionalPayoutMethod
            />
          </FormikProvider>
        </div>
      )}
    </div>
  );
}

type CreatePayoutMethodFormProps = {
  supportedPayoutMethods?: PayoutMethodType[];
  payeeSlug?: string;
  onCreate: (paymentMethod: { id?: string } | { data: any; type: PaymentMethodType }) => void;
  onCancel?: () => void;
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
          message: <FormattedMessage defaultMessage="Payout Method saved successfully" id="Iuu83b" />,
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
          label={<FormattedMessage defaultMessage="Method" id="W+1MOm" />}
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
      <div className="mt-4 flex gap-4">
        {props.onCancel && (
          <Button variant="outline" onClick={props.onCancel} disabled={formik.isSubmitting}>
            <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
          </Button>
        )}
        <Button onClick={onSubmit} disabled={!formik.isValid || !formik.values.type} loading={formik.isSubmitting}>
          <FormattedMessage id="save" defaultMessage="Save" />
        </Button>
      </div>
    </FormikProvider>
  );
}

type VendorPickerProps = {
  hostSlug: string;
  collectiveSlug: string;
  vendor: Partial<Account>;
  onChange: (vendor: { slug: string }) => void;
};

function VendorPicker(props: VendorPickerProps) {
  const [term, setTerm] = React.useState(null);
  const [value, setValue] = React.useState(props.vendor);

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
    <div tabIndex={0} role="searchbox" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
      <CollectivePicker
        autoFocus
        isLoading={query.loading}
        collectives={query.data?.host?.vendors?.nodes ?? []}
        useSearchIcon={true}
        isSearchable
        onInputChange={onSearch}
        collective={value || props.vendor}
        onChange={e => {
          setValue(e.value);
          props.onChange(e.value);
        }}
      />
    </div>
  );
}

type ProfilesIAdministerPickerProps = {
  form: ExpenseForm;
};

function ProfilesIAdministerPicker(props: ProfilesIAdministerPickerProps) {
  const payeeProfile = (props.form.options.payoutProfiles ?? []).find(p => p.slug === props.form.values.payeeSlug);

  const pickedLastSubmitedPayee = React.useMemo(
    () =>
      payeeProfile &&
      props.form.options.recentlySubmittedExpenses?.nodes?.length > 0 &&
      props.form.options.recentlySubmittedExpenses.nodes[0].payee.slug === payeeProfile.slug,
    [payeeProfile, props.form.options.recentlySubmittedExpenses],
  );

  const setFieldValue = props.form.setFieldValue;
  React.useEffect(() => {
    const lastUsedPayee = props.form.options.recentlySubmittedExpenses?.nodes?.[0]?.payee?.slug;
    if (payeeProfile || !lastUsedPayee) {
      return;
    }

    setFieldValue('payeeSlug', lastUsedPayee);
  }, [payeeProfile, props.form.options.recentlySubmittedExpenses, setFieldValue]);

  return (
    <div
      className="flex flex-col gap-2"
      tabIndex={0}
      role="button"
      onClick={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
    >
      <div>
        <FormattedMessage defaultMessage="Choose a profile" id="BT5QRL" />
      </div>
      <CollectivePicker
        collectives={props.form.options.payoutProfiles || []}
        collective={payeeProfile ?? null}
        onChange={e => {
          props.form.setFieldValue('payeeSlug', e.value.slug);
        }}
      />
      {pickedLastSubmitedPayee && (
        <div className="text-xs text-neutral-500">
          <FormattedMessage defaultMessage="Last used profile" id="GEi+9y" />
        </div>
      )}
      <PayoutMethodPicker form={props.form} />
    </div>
  );
}

type PayoutMethodPickerProps = {
  form: ExpenseForm;
};

function PayoutMethodPicker(props: PayoutMethodPickerProps) {
  const [isCreatingNewPayoutMethod, setIsCreatingNewPayoutMethod] = React.useState(false);
  const intl = useIntl();
  const { toast } = useToast();
  const payeeProfile = (props.form.options.payoutProfiles ?? []).find(p => p.slug === props.form.values.payeeSlug);

  const [isPayoutMethodDetailsOpen, setIsPayoutMethodDetailsOpen] = React.useState(false);

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

  const payeePayoutMethods = React.useMemo(() => {
    if (!payeeProfile || !payeeProfile.payoutMethods) {
      return [];
    }

    return [
      payeeProfile.payoutMethods.find(p => p.id === lastUsedPaymentMethodIdByPayee),
      ...payeeProfile.payoutMethods.filter(p => p.id !== lastUsedPaymentMethodIdByPayee),
    ].filter(Boolean);
  }, [payeeProfile, lastUsedPaymentMethodIdByPayee]);

  const payeePayoutMethodOptions = React.useMemo(
    () =>
      payeePayoutMethods.map(pm => ({
        value: pm.id,
        label: <PayoutMethodLabel showIcon payoutMethod={pm} />,
      })),
    [payeePayoutMethods],
  );

  React.useEffect(() => {
    if (payeePayoutMethods.length === 0) {
      setIsCreatingNewPayoutMethod(true);
    } else {
      setIsCreatingNewPayoutMethod(false);
    }
  }, [payeePayoutMethods]);

  const selectedPayoutMethodOption =
    payeePayoutMethodOptions.find(pm => pm.value === props.form.values.payoutMethodId) ?? null;

  const selectedPayoutMethod = payeePayoutMethods.find(pm => pm.id === props.form.values.payoutMethodId);

  React.useEffect(() => {
    setIsPayoutMethodDetailsOpen(false);
  }, [selectedPayoutMethodOption]);

  const setFieldValue = props.form.setFieldValue;
  React.useEffect(() => {
    if (selectedPayoutMethodOption || !payeeProfile || isCreatingNewPayoutMethod) {
      return;
    }

    setFieldValue('payoutMethodId', lastUsedPaymentMethodIdByPayee);
  }, [
    selectedPayoutMethodOption,
    payeeProfile,
    lastUsedPaymentMethodIdByPayee,
    isCreatingNewPayoutMethod,
    setFieldValue,
  ]);

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
        payoutMethodId: selectedPayoutMethod?.id,
      },
    },
  );

  const hasDetails = selectedPayoutMethod && selectedPayoutMethod.type !== PayoutMethodType.PAYPAL;

  const newPayoutMethodOption = {
    value: '__new__',
    label: <FormattedMessage defaultMessage="New payout method..." id="DjKENH" />,
  };

  if (isCreatingNewPayoutMethod) {
    return (
      <div>
        <div className="my-2 flex gap-2">
          <FormattedMessage defaultMessage="Create a new payout method" id="z/88i0" /> <PrivateInfoIcon />
        </div>
        <div className="rounded-md border p-3">
          <CreatePayoutMethodForm
            supportedPayoutMethods={props.form.options.supportedPayoutMethods}
            payeeSlug={props.form.values.payeeSlug}
            host={props.form.options.host}
            onCreate={async paymentMethod => {
              if ('id' in paymentMethod && paymentMethod.id) {
                props.form.setFieldValue('payoutMethodId', paymentMethod.id);
                await props.form.refresh();
                setIsCreatingNewPayoutMethod(false);
              } else {
                props.form.setFieldValue('invitePayee.payoutMethod', paymentMethod);
              }
            }}
            onCancel={payeePayoutMethods.length > 0 ? () => setIsCreatingNewPayoutMethod(false) : null}
          />
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div>
        <div className="my-2 flex gap-2">
          <FormattedMessage defaultMessage="Choose a payout method" id="SlAq2H" /> <PrivateInfoIcon />
        </div>
        <div className="flex gap-3">
          <div className="flex flex-grow flex-col">
            <StyledSelect
              disabled={!payeeProfile}
              inputId="payout-method"
              options={[newPayoutMethodOption, ...payeePayoutMethodOptions]}
              value={selectedPayoutMethodOption}
              onChange={e => {
                if (e.value === newPayoutMethodOption.value) {
                  setIsCreatingNewPayoutMethod(true);
                  props.form.setFieldValue('payoutMethodId', null);
                } else {
                  props.form.setFieldValue('payoutMethodId', e.value);
                }
              }}
            />

            <div className="mt-2 grid grid-cols-[1fr_auto]  grid-rows-1">
              <span className="text-xs text-neutral-500">
                {lastUsedPaymentMethodIdByPayee &&
                  lastUsedPaymentMethodIdByPayee === props.form.values.payoutMethodId && (
                    <FormattedMessage defaultMessage="Last used payout method for the selected profile" id="QxsFYY" />
                  )}
              </span>
              {hasDetails && (
                <Button
                  className="h-5 items-start p-0 text-xs"
                  variant="link"
                  size="xs"
                  onClick={() => setIsPayoutMethodDetailsOpen(!isPayoutMethodDetailsOpen)}
                >
                  {isPayoutMethodDetailsOpen ? (
                    <FormattedMessage defaultMessage="Hide full details" id="Ohd6v0" />
                  ) : (
                    <FormattedMessage defaultMessage="Show full details" id="9WBas+" />
                  )}
                </Button>
              )}
            </div>
          </div>
          <Button className="hidden" size="icon" variant="ghost">
            <Pencil size={16} />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            disabled={!selectedPayoutMethodOption}
            onClick={() => setIsDeletingPayoutMethod(true)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
        {isPayoutMethodDetailsOpen && hasDetails && <PayoutMethodData payoutMethod={selectedPayoutMethod} />}
      </div>
      {isDeletingPayoutMethod && (
        <ConfirmationModal
          isDanger
          type="delete"
          onClose={() => setIsDeletingPayoutMethod(false)}
          header={<FormattedMessage defaultMessage="Delete Payout Method?" id="weGvmF" />}
          body={<FormattedMessage defaultMessage="Are you sure you want to delete this payout method?" id="uR+TjD" />}
          continueHandler={async () => {
            try {
              await deletePayoutMethod();
              toast({
                variant: 'success',
                message: <FormattedMessage defaultMessage="Payout Method deleted successfully" id="2sVunP" />,
              });
              setIsDeletingPayoutMethod(false);
              props.form.setFieldValue('payoutMethodId', null);
              props.form.refresh();
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
