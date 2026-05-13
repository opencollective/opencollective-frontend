import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Form, useFormikContext } from 'formik';
import { Info } from 'lucide-react';
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

import Avatar from '../../../Avatar';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { FormField } from '../../../FormField';
import { FormikZod } from '../../../FormikZod';
import Loading from '../../../Loading';
import MessageBox from '../../../MessageBox';
import type { BaseModalProps } from '../../../ModalContext';
import OrderStatusTag from '../../../orders/OrderStatusTag';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../ui/Dialog';
import { Switch } from '../../../ui/Switch';
import { Textarea } from '../../../ui/Textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../ui/Tooltip';
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
  <div className={`rounded-lg border border-border bg-background p-4 ${className ?? ''}`}>{children}</div>
);

const SectionTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`text-xs font-semibold tracking-wide text-muted-foreground uppercase ${className ?? ''}`}>
    {children}
  </div>
);

const DetailRow: React.FC<{
  label: React.ReactNode;
  value: React.ReactNode;
}> = ({ label, value }) => (
  <div className="flex items-center justify-between text-sm text-muted-foreground">
    <span>{label}</span>
    <span className="text-foreground">{value}</span>
  </div>
);

type HostCancelContributionFormProps = {
  order: OrderData;
  currency?: string;
  onClose: () => void;
};

const HostCancelContributionForm: React.FC<HostCancelContributionFormProps> = ({ order, currency, onClose }) => {
  const intl = useIntl();
  const { values, setFieldValue, isSubmitting } = useFormikContext<HostCancelContributionFormValues>();

  const summaryAmount = order.totalAmount?.valueInCents ?? order.amount?.valueInCents ?? 0;
  const fromAccountName = order.fromAccount?.name || order.fromAccount?.slug;
  const toAccountName = order.toAccount?.name || order.toAccount?.slug;
  const submitLabel = values.removeAsContributor ? (
    <FormattedMessage defaultMessage="Cancel & remove contributor" id="ssPeBO" />
  ) : (
    <FormattedMessage defaultMessage="Cancel recurring contribution" id="rvR3Fm" />
  );

  return (
    <Form className="flex flex-col gap-4">
      <Section>
        <div className="flex flex-col gap-3">
          {order.description && <div className="text-sm font-semibold">{order.description}</div>}
          {order.status && (
            <DetailRow
              label={<FormattedMessage defaultMessage="Status" id="order.status" />}
              value={<OrderStatusTag status={order.status} />}
            />
          )}
          {currency && (
            <DetailRow
              label={<FormattedMessage defaultMessage="Amount" id="Fields.amount" />}
              value={
                <FormattedMoneyAmount
                  amount={summaryAmount}
                  currency={currency}
                  frequency={order.frequency as unknown as TierFrequency}
                  showCurrencyCode
                  amountClassName="font-semibold"
                />
              }
            />
          )}
          {order.fromAccount && (
            <DetailRow
              label={<FormattedMessage defaultMessage="From" id="dM+p3/" />}
              value={
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar size={20} collective={order.fromAccount} displayTitle={false} />
                  <span className="truncate">{fromAccountName}</span>
                </span>
              }
            />
          )}
          {order.toAccount && (
            <DetailRow
              label={<FormattedMessage defaultMessage="To" id="To" />}
              value={
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar size={20} collective={order.toAccount} displayTitle={false} />
                  <span className="truncate">{toAccountName}</span>
                </span>
              }
            />
          )}
        </div>
      </Section>

      <Section>
        <SectionTitle className="mb-3">
          <FormattedMessage defaultMessage="Additional actions" id="vCd8DW" />
        </SectionTitle>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={values.removeAsContributor}
                onCheckedChange={checked => setFieldValue('removeAsContributor', checked === true)}
                disabled={isSubmitting}
              />
              <span className="font-medium">
                <FormattedMessage defaultMessage="Remove contributor from Collective" id="BkIpny" />
              </span>
            </label>
            <Tooltip>
              <TooltipTrigger className="inline-flex text-muted-foreground hover:text-foreground" tabIndex={-1}>
                <Info className="size-3.5" aria-hidden />
                <span className="sr-only">
                  <FormattedMessage defaultMessage="More info" id="moreInfo" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <FormattedMessage
                  defaultMessage="The contributor will be hidden from public profile and exports, but the contribution stays in the ledger."
                  id="qGlrSx"
                />
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </Section>

      <Section>
        <div className="flex items-center justify-between gap-4">
          <SectionTitle>
            <FormattedMessage defaultMessage="Send custom message to contributor" id="tLNi3x" />
          </SectionTitle>
          <Switch
            checked={values.sendMessage}
            onCheckedChange={checked => setFieldValue('sendMessage', checked === true)}
            disabled={isSubmitting}
          />
        </div>
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
      </Section>

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

  const { data, loading, error } = useQuery<
    HostCancelContributionModalQuery,
    HostCancelContributionModalQueryVariables
  >(hostCancelContributionModalQuery, {
    variables: { order: { id: orderRef.id } },
    skip: !open,
    fetchPolicy: 'cache-and-network',
  });

  const order = data?.order;
  const currency = order?.totalAmount?.currency ?? order?.amount?.currency;
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
          removeAsContributor: values.removeAsContributor,
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
        className="sm:max-w-md"
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
            <FormattedMessage
              defaultMessage="Cancel this recurring contribution and optionally remove the contributor from the Collective profile."
              id="fkHGdz"
            />
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
            key={open ? order.id : 'closed'}
            schema={HostCancelContributionFormSchema}
            initialValues={initialValues}
            onSubmit={handleSubmit}
          >
            <HostCancelContributionForm order={order} currency={currency} onClose={() => handleClose(false)} />
          </FormikZod>
        )}
      </DialogContent>
    </Dialog>
  );
};
