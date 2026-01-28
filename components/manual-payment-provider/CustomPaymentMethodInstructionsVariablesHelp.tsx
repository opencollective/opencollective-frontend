import React from 'react';
import { Check, Copy } from 'lucide-react';
import { useIntl } from 'react-intl';

import useClipboard from '../../lib/hooks/useClipboard';

import { Badge } from '../ui/Badge';

type VariableDefinition = {
  variable: string;
  description: React.ReactNode;
};

type CustomPaymentMethodInstructionsVariablesHelpProps = {
  /** List of variables to display */
  variables: VariableDefinition[];
};

const VariableListItem = ({ variable, description }: VariableDefinition) => {
  const { isCopied, copy } = useClipboard();
  const intl = useIntl();

  return (
    <li className="flex items-center gap-1.5">
      <div className="flex items-center gap-1">
        <Badge size="sm" className="font-mono font-semibold">
          &#123;{variable}&#125;
        </Badge>
        <button
          type="button"
          onClick={e => {
            e.preventDefault();
            copy(`{${variable}}`);
          }}
          className="inline-flex items-center justify-center rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:ring-2 focus:ring-gray-300 focus:outline-none"
          title={
            isCopied
              ? intl.formatMessage({ defaultMessage: 'Copied!', id: 'Clipboard.Copied' })
              : intl.formatMessage({ defaultMessage: 'Copy variable', id: 'CopyVariable' })
          }
        >
          {isCopied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
        </button>
      </div>
      <span className="text-gray-500">-</span>
      <span className="text-gray-600">{description}</span>
    </li>
  );
};

/**
 * Component that displays a list of available variables for custom payout method instructions.
 * Each variable can be copied to clipboard with a click.
 */
export const CustomPaymentMethodInstructionsVariablesHelp = ({
  variables,
}: CustomPaymentMethodInstructionsVariablesHelpProps) => {
  return (
    <div className="mb-2">
      <ul className="space-y-1.5 text-xs">
        {variables.map(({ variable, description }) => (
          <VariableListItem key={variable} variable={variable} description={description} />
        ))}
      </ul>
    </div>
  );
};
