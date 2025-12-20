import type { TransformCallback } from 'interweave';
import { Markup } from 'interweave';
import { QRCodeSVG } from 'qrcode.react';
import React from 'react';
import type { IntlShape } from 'react-intl';
import { useIntl } from 'react-intl';
import generateQrCode from 'sepa-payment-qr-code';

import { formatCurrency } from '@/lib/currency-utils';
import type { Amount } from '@/lib/graphql/types/v2/graphql';
import { Currency } from '@/lib/graphql/types/v2/schema';
import { cn } from '@/lib/utils';

import type { TEMPLATE_VARIABLES } from './constants';
import { formatAccountDetails } from './utils';

type CustomPaymentMethodInstructionsProps = {
  /** HTML instructions template with variables like {account}, {amount}, etc. */
  instructions: string;
  values: {
    amount: Amount;
    collectiveSlug: string;
    OrderId: number;
    accountDetails?: Record<string, unknown>;
  };
  /** Additional className for styling */
  className?: string;
};

const transform: TransformCallback = node => {
  if (node.tagName.toLowerCase() === 'ul') {
    node.classList.add('list-disc');
  } else if (node.tagName.toLowerCase() === 'ol') {
    node.classList.add('list-decimal');
  } else if (node.tagName.toLowerCase() === 'li') {
    node.classList.add('list-item', 'list-inside');
  }

  return undefined;
};

const ValueRenderers: Record<
  TEMPLATE_VARIABLES,
  (values: CustomPaymentMethodInstructionsProps['values'], intl: IntlShape) => string
> = {
  reference: (values: CustomPaymentMethodInstructionsProps['values']) => values.OrderId.toString(),
  OrderId: (values: CustomPaymentMethodInstructionsProps['values']) => values.OrderId.toString(),
  amount: (values: CustomPaymentMethodInstructionsProps['values'], intl: IntlShape) =>
    formatCurrency(values.amount.valueInCents, values.amount.currency, {
      locale: intl.locale,
      currencyDisplay: 'symbol',
    }),
  collective: (values: CustomPaymentMethodInstructionsProps['values']) => values.collectiveSlug,
  account: (values: CustomPaymentMethodInstructionsProps['values']) =>
    formatAccountDetails(values.accountDetails, { asSafeHTML: true }),
};

/**
 * Replaces variables in HTML instructions with formatted values.
 * Escapes HTML in variable values to prevent XSS and ensure they're displayed as text.
 */
const replaceVariablesInHTML = (
  instructions: string,
  values: CustomPaymentMethodInstructionsProps['values'],
  intl: IntlShape,
): string => {
  if (!instructions) {
    return '';
  }

  return instructions.replace(/{([^\s{}][\s\S]*?)}/g, (match, key) => {
    const renderer = ValueRenderers[key as TEMPLATE_VARIABLES];
    if (renderer) {
      return renderer(values, intl);
    } else {
      return match;
    }
  });
};

/** Creates an EPC QR-Code */
export const formatQrCode = (bankAccount, amount, reference) => {
  if (!bankAccount?.details?.IBAN || amount.currency !== Currency.EUR) {
    return;
  }
  const data = {
    name: bankAccount.accountHolderName,
    iban: bankAccount.details.IBAN,
    bic: bankAccount.details.BIC,
    amount: amount.valueInCents / 100,
    unstructuredReference: reference,
  };
  return generateQrCode(data);
};

/**
 * Component to render custom payment method instructions as HTML.
 * Supports variable replacement (e.g., {account}, {amount}, {reference}, {collective})
 * and renders the result using Interweave with a custom matcher for variable replacement.
 */
export const CustomPaymentMethodInstructions = ({
  instructions,
  className,
  values,
}: CustomPaymentMethodInstructionsProps) => {
  const intl = useIntl();
  const rendered = React.useMemo(
    () => replaceVariablesInHTML(instructions, values, intl),
    [instructions, values, intl],
  );
  if (!rendered) {
    return null;
  }

  const qrCodeData = formatQrCode(values.accountDetails, values.amount, values.OrderId.toString());

  return (
    <div className={cn('whitespace-pre-wrap [&_a]:text-blue-600 [&_a:hover]:underline', className)}>
      <Markup content={rendered} transform={transform} />
      {qrCodeData && (
        <div>
          <br />
          <span>If your banking app supports QR codes, scan the code below:</span>
          <QRCodeSVG value={qrCodeData} size={256} level="L" includeMargin data-cy="qr-code" />
        </div>
      )}
    </div>
  );
};
