import React from 'react';
import { round } from 'lodash';
import { InfoIcon } from 'lucide-react';
import { useIntl } from 'react-intl';

import type { CurrencyExchangeRate, CurrencyExchangeRateInput } from '../lib/graphql/types/v2/graphql';
import { cn } from '../lib/utils';

import { Input } from './ui/Input';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';
import { formatFxRateInfo } from './AmountWithExchangeRateInfo';

/**
 * Displays an exchange rate in the format: 1 {fromCurrency} = {value} {toCurrency}
 * `onChange` can be passed to make the exchange rate editable.
 */
export const ExchangeRate = ({
  exchangeRate,
  className,
  approximateCustomMessage = null,
  warning = null,
  error = null,
  onChange = undefined,
  'data-cy': dataCy = 'exchange-rate',
}: {
  exchangeRate: CurrencyExchangeRate | CurrencyExchangeRateInput;
  approximateCustomMessage?: React.ReactNode;
  className?: string;
  onChange?: (CurrencyExchangeRateInput) => void;
  warning?: React.ReactNode;
  error?: React.ReactNode;
  'data-cy'?: string;
}) => {
  const [isEditing, setEditing] = React.useState(false);
  const intl = useIntl();

  return (
    <Tooltip>
      <TooltipTrigger data-cy={dataCy}>
        <div className={cn('flex items-center whitespace-nowrap text-xs text-neutral-700', className)}>
          <InfoIcon
            size={14}
            className={cn({
              'text-yellow-600': Boolean(warning),
              'text-red-600': Boolean(error),
            })}
          />
          <div
            className={cn('ml-1 flex items-center gap-1', {
              'text-yellow-700': Boolean(warning),
              'text-red-600': Boolean(error),
            })}
          >
            <span>1 {exchangeRate.fromCurrency}</span>
            <span> = </span>
            {isEditing ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="0.000001"
                  className="h-7 w-32 px-2 py-1 text-xs"
                  value={exchangeRate.value}
                  onChange={e =>
                    onChange({
                      ...exchangeRate,
                      isApproximate: false,
                      source: 'USER',
                      value: Number(e.target.value),
                      date: null,
                    })
                  }
                />
                <span>{exchangeRate.toCurrency}</span>
              </div>
            ) : (
              <span>
                {exchangeRate['isApproximate'] ? '~' : ''}
                {exchangeRate.value ? round(exchangeRate.value, 7) : '?'} {exchangeRate.toCurrency}
              </span>
            )}
          </div>
          {onChange && !isEditing && (
            <button className="ml-1 text-xs text-blue-700 hover:text-blue-900" onClick={() => setEditing(true)}>
              {intl.formatMessage({ id: 'Edit', defaultMessage: 'Edit' })}
            </button>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent data-cy={`${dataCy}-tooltip`}>
        {formatFxRateInfo(intl, exchangeRate, { approximateCustomMessage, warning, error })}
      </TooltipContent>
    </Tooltip>
  );
};
