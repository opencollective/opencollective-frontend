import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Form, useFormikContext } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '../../../../lib/errors';
import type {
  HostCancelContributionModalQuery,
  HostCancelContributionModalQueryVariables,
  HostCancelOrderMutation,
  HostCancelOrderMutationVariables,
  TierFrequency,
} from '../../../../lib/graphql/types/v2/graphql';
import formatCollectiveType from '../../../../lib/i18n/collective-type';
import { cn } from '../../../../lib/utils';

import Avatar from '../../../Avatar';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { FormField } from '../../../FormField';
import { FormikZod } from '../../../FormikZod';
import Loading from '../../../Loading';
import MessageBox from '../../../MessageBox';
import type { BaseModalProps } from '../../../ModalContext';
import OrderStatusTag from '../../../orders/OrderStatusTag';
import { Button } from '../../../ui/Button';
import { DataList, DataListItem, DataListItemLabel, DataListItemValue } from '../../../ui/DataList';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../ui/Dialog';
import { FormSectionTitle } from '../../../ui/FormSectionTitle';
import { Switch } from '../../../ui/Switch';
import { Textarea } from '../../../ui/Textarea';
import { useToast } from '../../../ui/useToast';

import { hostCancelContributionModalQuery, hostCancelOrderMutation } from './queries';

type OrderData = NonNullable<HostCancelContributionModalQuery['order']>;

type HostCancelContributionModalProps = BaseModalProps & {
  order: { id: string; legacyId?: number };
  onSuccess?: () => void;
};

const HostCancelContributionFormSchema = z.object({
  removeAsContributor: z.boolean(),
  sendMessage: z.boolean(),
  message: z.string().max(2000).optional(),
});

type HostCancelContributionFormValues = z.infer<typeof HostCancelContributionFormSchema>;

const Section: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn('rounded-lg border border-gray-200 bg-white p-4', className)}>{children}</div>
);

const ToggleOptionSection: React.FC<{
  title: React.ReactNode;
  description?: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}> = ({ title, description, checked, onCheckedChange, disabled, children }) => (
  <Section>
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="text-sm font-semibold">{title}</div>
        {description && <div className="text-sm text-muted-foreground">{description}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
    {children}
  </Section>
);

const AccountSummary: React.FC<{
  account: NonNullable<OrderData['fromAccount'] | OrderData['toAccount']>;
  name: string | undefined;
}> = ({ account, name }) => (
  <span className="flex min-w-0 items-center gap-2">
    <Avatar size={20} collective={account} displayTitle={false} />
    <span className="truncate text-sm font-medium">{name}</span>
  </span>
);

const ContributionDetail: React.FC<{
  order: OrderData;
  currency?: string;
  summaryAmount: number;
}> = ({ order, currency, summaryAmount }) => {
  const fromAccountName = order.fromAccount?.name || order.fromAccount?.slug;
  const toAccountName = order.toAccount?.name || order.toAccount?.slug;

  return (
    <Section>
      <FormSectionTitle>
        <FormattedMessage defaultMessage="Contribution detail" id="oJIBP2" />
      </FormSectionTitle>
      <DataList className="text-sm">
        {order.description && (
          <DataListItem>
            <DataListItemLabel>
              <FormattedMessage defaultMessage="Description" id="Fields.description" />
            </DataListItemLabel>
            <DataListItemValue>{order.description}</DataListItemValue>
          </DataListItem>
        )}
        {order.status && (
          <DataListItem>
            <DataListItemLabel>
              <FormattedMessage defaultMessage="Status" id="order.status" />
            </DataListItemLabel>
            <DataListItemValue>
              <OrderStatusTag status={order.status} />
            </DataListItemValue>
          </DataListItem>
        )}
        {currency && (
          <DataListItem>
            <DataListItemLabel>
              <FormattedMessage defaultMessage="Amount" id="Fields.amount" />
            </DataListItemLabel>
            <DataListItemValue className="tabular-nums">
              <FormattedMoneyAmount
                amount={summaryAmount}
                currency={currency}
                frequency={order.frequency as unknown as TierFrequency}
                showCurrencyCode
              />
            </DataListItemValue>
          </DataListItem>
        )}
        {order.fromAccount && (
          <DataListItem>
            <DataListItemLabel>
              <FormattedMessage defaultMessage="Contributed by" id="DdgpvU" />
            </DataListItemLabel>
            <DataListItemValue>
              <AccountSummary account={order.fromAccount} name={fromAccountName} />
            </DataListItemValue>
          </DataListItem>
        )}
        {order.toAccount && (
          <DataListItem>
            <DataListItemLabel>
              <FormattedMessage defaultMessage="Contribution to" id="kQwHjA" />
            </DataListItemLabel>
            <DataListItemValue>
              <AccountSummary account={order.toAccount} name={toAccountName} />
            </DataListItemValue>
          </DataListItem>
        )}
      </DataList>
    </Section>
  );
};

type HostCancelContributionFormProps = {
  order: OrderData;
  currency?: string;
  showRemoveAsContributor: boolean;
  onClose: () => void;
};

const HostCancelContributionForm: React.FC<HostCancelContributionFormProps> = ({
  order,
  currency,
  showRemoveAsContributor,
  onClose,
}) => {
  const intl = useIntl();
  const { values, setFieldValue, isSubmitting } = useFormikContext<HostCancelContributionFormValues>();

  const summaryAmount = order.totalAmount?.valueInCents ?? order.amount?.valueInCents ?? 0;
  const submitLabel =
    showRemoveAsContributor && values.removeAsContributor ? (
      <FormattedMessage defaultMessage="Cancel & remove contributor" id="ssPeBO" />
    ) : (
      <FormattedMessage defaultMessage="Cancel recurring contribution" id="rvR3Fm" />
    );

  return (
    <Form className="flex flex-col gap-4">
      <ContributionDetail order={order} currency={currency} summaryAmount={summaryAmount} />

      {showRemoveAsContributor && (
        <ToggleOptionSection
          title={
            <FormattedMessage
              defaultMessage="Remove contributor from {accountType}"
              id="7xqR2m"
              values={{ accountType: formatCollectiveType(intl, order.toAccount?.type) }}
            />
          }
          description={
            <FormattedMessage
              defaultMessage="The contributor will be hidden from public profile and exports, but the contribution stays in the ledger."
              id="qGlrSx"
            />
          }
          checked={values.removeAsContributor}
          onCheckedChange={checked => setFieldValue('removeAsContributor', checked === true)}
          disabled={isSubmitting}
        />
      )}

      <ToggleOptionSection
        title={<FormattedMessage defaultMessage="Send custom message to contributor" id="tLNi3x" />}
        checked={values.sendMessage}
        onCheckedChange={checked => setFieldValue('sendMessage', checked === true)}
        disabled={isSubmitting}
      >
        {values.sendMessage && (
          <FormField name="message" className="mt-4">
            {({ field }) => (
              <Textarea
                {...field}
                rows={3}
                className="h-auto min-h-20"
                placeholder={intl.formatMessage({
                  defaultMessage: 'Type your message here...',
                  id: 'Olq7Wf',
                })}
                disabled={isSubmitting}
                maxLength={2000}
              />
            )}
          </FormField>
        )}
      </ToggleOptionSection>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </Form>
  );
};

export const HostCancelContributionModal = ({
  order: orderRef,
  open,
  setOpen,
  onCloseFocusRef,
  onSuccess,
}: HostCancelContributionModalProps) => {
  const intl = useIntl();
  const { toast } = useToast();

  const { data, previousData, loading, error } = useQuery<
    HostCancelContributionModalQuery,
    HostCancelContributionModalQueryVariables
  >(hostCancelContributionModalQuery, {
    variables: { order: { id: orderRef.id } },
    skip: !open,
    fetchPolicy: 'cache-and-network',
  });

  const queriedOrder = data?.order ?? previousData?.order;
  const order = queriedOrder?.id === orderRef.id ? queriedOrder : undefined;
  const currency = order?.totalAmount?.currency ?? order?.amount?.currency;
  const showRemoveAsContributor = Boolean(order?.permissions?.canRemoveAsContributor);
  const [runCancelOrder] = useMutation<HostCancelOrderMutation, HostCancelOrderMutationVariables>(
    hostCancelOrderMutation,
  );

  const handleClose = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
    },
    [setOpen],
  );

  const initialValues = React.useMemo<HostCancelContributionFormValues>(
    () => ({
      removeAsContributor: false,
      sendMessage: false,
      message: '',
    }),
    [],
  );

  const handleSubmit = async (values: HostCancelContributionFormValues) => {
    if (!order) {
      return;
    }

    try {
      await runCancelOrder({
        variables: {
          order: { id: order.id },
          removeAsContributor: showRemoveAsContributor ? values.removeAsContributor : null,
          messageForContributor: values.sendMessage ? values.message?.trim() || null : null,
        },
      });

      toast({
        variant: 'success',
        message: intl.formatMessage({
          defaultMessage: 'Contribution updated',
          id: 'lkz2Rt',
        }),
      });
      onSuccess?.();
      handleClose(false);
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        onCloseAutoFocus={e => {
          if (onCloseFocusRef?.current) {
            e.preventDefault();
            onCloseFocusRef.current.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="Cancel recurring contribution" id="rvR3Fm" />
          </DialogTitle>
          <DialogDescription>
            {showRemoveAsContributor ? (
              <FormattedMessage
                defaultMessage="Cancel this recurring contribution and optionally remove the contributor from the Collective profile."
                id="fkHGdz"
              />
            ) : (
              <FormattedMessage defaultMessage="Cancel this recurring contribution." id="Hk6+J8" />
            )}
          </DialogDescription>
        </DialogHeader>

        {loading && !order ? (
          <Loading />
        ) : error || !order ? (
          <MessageBox type="error" withIcon>
            {error ? (
              i18nGraphqlException(intl, error)
            ) : (
              <FormattedMessage defaultMessage="Contribution not found" id="ECqvt3" />
            )}
          </MessageBox>
        ) : (
          <FormikZod<HostCancelContributionFormValues>
            key={order.id}
            schema={HostCancelContributionFormSchema}
            initialValues={initialValues}
            onSubmit={handleSubmit}
          >
            <HostCancelContributionForm
              order={order}
              currency={currency}
              showRemoveAsContributor={showRemoveAsContributor}
              onClose={() => handleClose(false)}
            />
          </FormikZod>
        )}
      </DialogContent>
    </Dialog>
  );
};
