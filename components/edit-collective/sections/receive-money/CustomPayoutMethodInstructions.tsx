import React from 'react';
import type { TransformCallback } from 'interweave';
import { Markup } from 'interweave';
import { escape, isNil } from 'lodash';

type CustomPayoutMethodInstructionsProps = {
  /** HTML instructions template with variables like {account}, {amount}, etc. */
  instructions: string;
  /** Object containing values to replace variables in the instructions */
  formattedValues: {
    account?: string;
    reference?: string;
    OrderId?: string;
    amount?: string;
    collective?: string;
    [key: string]: string | undefined;
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

/**
 * Replaces variables in HTML instructions with formatted values.
 * Uses the same logic as formatManualInstructions but preserves HTML structure.
 * Escapes HTML in variable values to prevent XSS and ensure they're displayed as text.
 */
const replaceVariablesInHTML = (
  instructions: string,
  values: CustomPayoutMethodInstructionsProps['formattedValues'],
): string => {
  if (!instructions) {
    return '';
  }

  return instructions.replace(/{([^\s{}][\s\S]*?)}/g, (match, key) => {
    // Trim whitespace from the key
    if (key && !isNil(values[key])) {
      return escape(values[key] || '');
    } else {
      return match;
    }
  });
};

/**
 * Component to render custom payment method instructions as HTML.
 * Supports variable replacement (e.g., {account}, {amount}, {reference}, {collective})
 * and renders the result using Interweave with a custom matcher for variable replacement.
 */
export const CustomPayoutMethodInstructions = ({
  instructions,
  formattedValues,
  className,
}: CustomPayoutMethodInstructionsProps) => {
  const rendered = React.useMemo(
    () => replaceVariablesInHTML(instructions, formattedValues),
    [instructions, formattedValues],
  );
  if (!rendered) {
    return null;
  }

  return (
    <div className={className}>
      <Markup content={rendered} transform={transform} />
    </div>
  );
};
