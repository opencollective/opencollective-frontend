import React from 'react';
import { ChevronDown, CircleHelp } from 'lucide-react';
import type { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { Amount } from '@/lib/graphql/types/v2/graphql';
import { cn } from '@/lib/utils';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/Collapsible';

import { resolvePaymentReferenceFromTemplate } from './CustomPaymentMethodInstructions';
import { CustomPaymentMethodInstructionsVariablesHelp } from './CustomPaymentMethodInstructionsVariablesHelp';

type VariableRow = { variable: string; description: ReactNode };

type ManualPaymentDialogTemplateVariablesCollapsibleProps = {
  variables: VariableRow[];
  className?: string;
};

/**
 * Collapsible list of template variables (collapsed by default), shared above payment reference + instructions.
 */
export function ManualPaymentDialogTemplateVariablesCollapsible({
  variables,
  className,
}: ManualPaymentDialogTemplateVariablesCollapsibleProps) {
  return (
    <Collapsible
      defaultOpen={true}
      className={cn('group rounded-md border border-slate-200 bg-slate-50/60', className)}
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full flex-col gap-2 px-3 py-2.5 text-left text-sm font-medium text-gray-800 hover:bg-slate-100/80"
        >
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CircleHelp className="h-4 w-4 shrink-0 text-gray-500" />
              <FormattedMessage
                defaultMessage="Available template variables"
                id="CustomPaymentMethod.Variables.CollapsibleLabel"
              />
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </div>
          <div className="text-xs text-gray-500">
            <FormattedMessage
              defaultMessage="A list of variables that can be used in the fields below."
              id="CustomPaymentMethod.Variables.Description"
            />
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-slate-200 px-3 pt-1 pb-3">
          <CustomPaymentMethodInstructionsVariablesHelp variables={variables} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

type PreviewValues = {
  amount: Amount;
  collectiveSlug: string;
  OrderId: number;
  accountDetails?: Record<string, unknown>;
};

type PaymentReferenceTemplatePreviewHintProps = {
  referenceTemplate: string;
  previewValues: PreviewValues;
};

/**
 * Example resolved text for the payment reference template (same sample values as the instructions preview).
 */
export function PaymentReferenceTemplatePreviewHint({
  referenceTemplate,
  previewValues,
}: PaymentReferenceTemplatePreviewHintProps) {
  const intl = useIntl();
  const preview = resolvePaymentReferenceFromTemplate(referenceTemplate, previewValues, intl);

  return (
    <div className="mt-2 text-xs text-gray-700" data-cy="payment-reference-template-preview">
      <span className="font-medium text-gray-600">
        <FormattedMessage defaultMessage="Preview" id="TJo5E6" />
        {': '}
      </span>
      <span className="font-mono break-all text-gray-900 italic">{preview}</span>
    </div>
  );
}
