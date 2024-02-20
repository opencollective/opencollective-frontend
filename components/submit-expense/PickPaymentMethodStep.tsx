import React from 'react';
import { MoneyCheck } from '@styled-icons/fa-solid/MoneyCheck';
import { Paypal } from '@styled-icons/remix-line/Paypal';
import { truncate } from 'lodash';
import { ChevronDown, ChevronUp, Landmark, Pencil, Plus, Trash2 } from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { getPayoutProfiles } from '../../lib/expenses';
import { PayoutMethod, PayoutMethodType } from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';

import Avatar from '../Avatar';
import CollectivePicker from '../CollectivePicker';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import Image from '../Image';
import Loading from '../Loading';
import { Button } from '../ui/Button';
import { StepListItem } from '../ui/StepList';

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

  const [otherPayoutProfileId, setOtherPayoutProfileId] = React.useState(null);

  const loggedInAccount = React.useMemo(
    () => (props.form.options.payoutProfiles ?? []).find(p => p.slug === LoggedInUser.collective.slug),
    [LoggedInUser.collective.slug, props.form.options.payoutProfiles],
  );

  const otherPayoutProfiles = React.useMemo(() => {
    return getPayoutProfiles(loggedInAccount).filter(p => p.id !== loggedInAccount.id);
  }, [loggedInAccount]);

  const selectedPayoutProfile = otherPayoutProfileId
    ? otherPayoutProfiles.find(p => p.id === otherPayoutProfileId)
    : loggedInAccount;

  const setFieldValue = props.form.setFieldValue;
  React.useEffect(() => {
    if (selectedPayoutProfile?.slug && selectedPayoutProfile?.slug !== props.form.values.payeeSlug) {
      setFieldValue('payeeSlug', selectedPayoutProfile.slug);
    }
  }, [setFieldValue, props.form.values.payeeSlug, selectedPayoutProfile?.slug]);

  if (!loggedInAccount) {
    return <Loading />;
  }

  return (
    <div className="flex-grow pr-2">
      <h1 className="mb-4 text-lg font-bold leading-[26px] text-dark-900">
        <FormattedMessage defaultMessage="How should the payment be made?" />
      </h1>
      <div className="flex flex-col gap-4">
        <RadioCardButton
          onClick={() => {
            setOtherPayoutProfileId(null);
            props.form.setFieldValue('payeeSlug', selectedPayoutProfile.slug);
            props.form.setFieldValue('payoutMethodId', null);
          }}
          checked={!otherPayoutProfileId}
          title={
            <div className="flex gap-2">
              <span>
                <FormattedMessage defaultMessage="Through my personal profile" />
              </span>
              <Avatar radius={24} collective={loggedInAccount} displayTitle />
              <span>{loggedInAccount.name}</span>
            </div>
          }
        />
        {otherPayoutProfiles.length > 0 && (
          <RadioCardButton
            onClick={() => {
              setOtherPayoutProfileId(otherPayoutProfiles[0].id);
              props.form.setFieldValue('payeeSlug', selectedPayoutProfile.slug);
              props.form.setFieldValue('payoutMethodId', null);
            }}
            checked={otherPayoutProfileId}
            title={<FormattedMessage defaultMessage="Through accounts that I administer" />}
          />
        )}
        {otherPayoutProfileId && (
          <CollectivePicker
            collective={selectedPayoutProfile}
            collectives={otherPayoutProfiles}
            onChange={e => {
              setOtherPayoutProfileId(e.value.id);
              props.form.setFieldValue('payeeSlug', selectedPayoutProfile.slug);
              props.form.setFieldValue('payoutMethodId', null);
            }}
          />
        )}
      </div>
      <h1 className="mb-4 mt-8 text-lg font-bold leading-[26px] text-dark-900">
        <FormattedMessage id="Fields.paymentMethod" defaultMessage="Payment method" /> <PrivateInfoIcon />
      </h1>
      <div className="flex flex-col gap-4">
        {selectedPayoutProfile.payoutMethods.map(payoutMethod => (
          <PayoutMethodOptionButton
            payoutMethod={payoutMethod}
            checked={payoutMethod.id === props.form.values.payoutMethodId}
            onClick={() => {
              props.form.setFieldValue('payeeSlug', selectedPayoutProfile.slug);
              props.form.setFieldValue('payoutMethodId', payoutMethod.id);
            }}
            key={payoutMethod.id}
          />
        ))}
        <div className="flex cursor-pointer flex-col items-center justify-center rounded border border-slate-100 p-4 text-slate-300">
          <Plus />
          <span>
            <FormattedMessage defaultMessage="Add new" />
          </span>
        </div>
      </div>
    </div>
  );
}

const payoutMethodLabels = defineMessages({
  [PayoutMethodType.ACCOUNT_BALANCE]: {
    id: 'PayoutMethod.AccountBalance',
    defaultMessage: 'Open Collective (Account Balance)',
  },
  [PayoutMethodType.OTHER]: {
    id: 'PayoutMethod.Type.Other',
    defaultMessage: 'Other',
  },
});

function PickPaymentMethodStepListItem(props: { className?: string; form: ExpenseForm; current: boolean }) {
  return (
    <StepListItem
      className={props.className}
      title={<FormattedMessage id="paymentmethod.label" defaultMessage="Payment Method" />}
      subtitle={props.form.values.payoutMethodId}
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
  const intl = useIntl();

  if (!props.payoutMethod) {
    return null;
  }

  if (props.payoutMethod.name) {
    return props.payoutMethod.name;
  }

  switch (props.payoutMethod.type) {
    case PayoutMethodType.ACCOUNT_BALANCE:
      return <FormattedMessage {...payoutMethodLabels[PayoutMethodType.ACCOUNT_BALANCE]} />;
    case PayoutMethodType.BANK_ACCOUNT:
      if (props.payoutMethod.data.details?.IBAN) {
        return `IBAN ${props.payoutMethod.data.details.IBAN}`;
      } else if (props.payoutMethod.data.details?.accountNumber) {
        return `A/N ${props.payoutMethod.data.details.accountNumber}`;
      } else if (props.payoutMethod.data.details?.clabe) {
        return `Clabe ${props.payoutMethod.data.details.clabe}`;
      } else if (props.payoutMethod.data.details?.bankgiroNumber) {
        return `BankGiro ${props.payoutMethod.data.details.bankgiroNumber}`;
      } else {
        return `${props.payoutMethod.data.accountHolderName} (${props.payoutMethod.data.currency})`;
      }
    case PayoutMethodType.OTHER: {
      const typeLabel = intl.formatMessage(payoutMethodLabels[PayoutMethodType.OTHER]);
      const content = props.payoutMethod.data?.content?.replace(/\n|\t/g, ' ');
      return content ? `${typeLabel} - ${truncate(content, { length: 20 })}` : typeLabel;
    }
    case PayoutMethodType.PAYPAL:
      return `PayPal - ${props.payoutMethod.data?.email}`;
  }

  return props.payoutMethod.type;
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
  onClick: () => void;
};

function PayoutMethodOptionButton(props: PayoutMethodOptionButtonProps) {
  const [isOpen, setIsOpen] = React.useState(props.checked);

  return (
    <RadioCardButton
      checked={props.checked}
      onClick={props.onClick}
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PayoutMethodIcon payoutMethod={props.payoutMethod} />
            <PayoutMethodLabel payoutMethod={props.payoutMethod} />
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

            <Button size="icon" variant="ghost">
              <Pencil size={16} />
            </Button>

            <Button size="icon" variant="ghost">
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
  );
}
