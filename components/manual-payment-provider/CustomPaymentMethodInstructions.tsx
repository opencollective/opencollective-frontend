import React from 'react';
import type { TransformCallback } from 'interweave';
import { Markup } from 'interweave';
import { truncate } from 'lodash';
import { CircleHelp, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { IntlShape } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';

import { centsAmountToFloat, formatCurrency } from '@/lib/currency-utils';
import type { Amount } from '@/lib/graphql/types/v2/graphql';
import { Currency } from '@/lib/graphql/types/v2/schema';
import { cn } from '@/lib/utils';

import type { TEMPLATE_VARIABLES } from './constants';
import { formatAccountDetails } from './utils';

const EPC_QR_WIKI = 'https://wikipedia.org/wiki/EPC_QR_code';

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
const formatQrCode = (bankAccount, amount, reference) => {
  if (!bankAccount?.details?.IBAN || !bankAccount.details.BIC || amount.currency !== Currency.EUR || amount < 1) {
    return;
  }

  // See https://en.wikipedia.org/wiki/EPC_QR_code / https://www.europeanpaymentscouncil.eu/document-library/guidance-documents/standardisation-qr-codes-mscts for format specification
  return [
    'BCD', // Service Tag - Bank Customer Data
    '002', // Version
    '1', // Character Set
    'SCT', // Identification Code - SEPA Credit Transfer
    bankAccount.details.BIC, // BIC of the Beneficiary Bank
    truncate(bankAccount.accountHolderName, { length: 70 }), // Name of the Beneficiary
    bankAccount.details.IBAN, // Account number of the Beneficiary
    `EUR${centsAmountToFloat(amount.valueInCents).toFixed(2)}`, // Amount of the Credit Transfer in Euro
    '', // Reason (4 chars max)
    '', // Remittance Information (structured)
    truncate(reference, { length: 140 }), // Remittance Information (unstructured)
    '', // Beneficiary to originator information
  ].join('\n');
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
    <div>
      <div
        className={cn(
          'rounded border-l-4 border-blue-400 bg-gray-50 px-5 py-5 text-sm whitespace-pre-wrap shadow lg:text-base [&_a]:text-blue-600 [&_a:hover]:underline',
          className,
        )}
      >
        <Markup content={rendered} transform={transform} />
      </div>
      {qrCodeData && (
        <div
          className={cn(
            'relative mt-6 overflow-hidden rounded-xl border border-oc-blue-tints-050 bg-oc-blue-tints-050 p-4 sm:p-5',
          )}
        >
          <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-8">
            <div className="min-w-0 py-3 text-start">
              <div className="mb-3 flex items-start gap-2.5">
                <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-oc-blue-tints-700" aria-hidden />
                <h3 className="text-base font-semibold text-gray-900">
                  <FormattedMessage defaultMessage="Scan to pay" id="eE6omW" />
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-gray-600">
                <FormattedMessage
                  defaultMessage="This QR code carries the data for a SEPA credit transfer. Many banking apps in Europe let you scan it to fill in the payee, amount, and reference."
                  id="CustomPaymentMethod.QRCodeDescription"
                />
              </p>
              <p className="mt-2">
                <a
                  href={EPC_QR_WIKI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1.5 text-xs text-gray-500 underline decoration-gray-400/50 underline-offset-2 transition-colors hover:text-oc-blue-tints-700 hover:decoration-oc-blue-tints-700/40"
                >
                  <CircleHelp className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                  <FormattedMessage defaultMessage="Learn more about EPC QR" id="7SKbnh" />
                </a>
              </p>
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="rounded-lg border border-gray-200/80 bg-white p-4 shadow-sm">
                <QRCodeSVG value={qrCodeData} size={192} level="L" data-cy="qr-code" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
