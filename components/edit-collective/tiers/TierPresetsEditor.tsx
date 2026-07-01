import React from 'react';
import { useFormikContext } from 'formik';
import { isNil } from 'lodash-es';
import { Pin, Plus, Trash2 } from 'lucide-react';
import { useIntl } from 'react-intl';

import { AmountTypes } from '../../../lib/constants/tiers-types';
import { getDefaultTierAmount } from '../../../lib/tier-utils';
import { cn } from '@/lib/utils';

import InputAmount from '@/components/InputAmount';

import { P } from '../../Text';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/Tooltip';

const MAX_TIER_PRESETS = 5;

export const getNextPresetAmount = (presets: number[], minAmountInCents: number) => {
  const min = minAmountInCents || 0;
  if (!presets.length) {
    return min || 1000;
  }

  const max = Math.max(...presets, min);
  const increment = presets.length >= 2 ? presets[presets.length - 1] - presets[presets.length - 2] : min || 1000;

  return max + Math.max(increment, min || 1000);
};

export const getDefaultAmountForPresets = (
  presets: number[],
  collective: { type: string; currency: string },
  minimumAmount: { valueInCents: number; currency?: string } | null = null,
) => {
  return getDefaultTierAmount(
    {
      amountType: AmountTypes.FLEXIBLE,
      minimumAmount: minimumAmount ?? { valueInCents: null },
      presets,
    },
    collective,
    collective.currency,
  );
};

type TierPresetsEditorProps = {
  presets: number[];
  defaultAmountInCents?: number | null;
  collective: { type: string; currency: string };
  minimumAmount?: { valueInCents: number; currency?: string } | null;
  minAmountInCents?: number;
  onPresetsChange: (presets: number[]) => void;
  onDefaultAmountChange: (amountInCents: number, options?: { userAction?: boolean }) => void;
};

export default function TierPresetsEditor({
  presets,
  defaultAmountInCents,
  collective,
  minimumAmount = null,
  minAmountInCents = 0,
  onPresetsChange,
  onDefaultAmountChange,
}: TierPresetsEditorProps) {
  const intl = useIntl();
  const { touched, submitCount, setFieldTouched } = useFormikContext<{
    presets?: number[];
  }>();
  const presetTouched = Array.isArray(touched.presets) ? touched.presets : undefined;
  const makeDefaultTooltip = intl.formatMessage({
    id: 'tier.presets.makeDefault.tooltip',
    defaultMessage: 'Make default',
  });
  const presetKeysRef = React.useRef(presets.map(() => crypto.randomUUID()));

  React.useLayoutEffect(() => {
    const keys = presetKeysRef.current;
    if (keys.length < presets.length) {
      presetKeysRef.current = [
        ...keys,
        ...Array.from({ length: presets.length - keys.length }, () => crypto.randomUUID()),
      ];
    } else if (keys.length > presets.length) {
      presetKeysRef.current = keys.slice(0, presets.length);
    }
  }, [presets.length]);

  React.useEffect(() => {
    if (!presets.length) {
      return;
    }

    if (isNil(defaultAmountInCents) || !presets.includes(defaultAmountInCents)) {
      onDefaultAmountChange(getDefaultAmountForPresets(presets, collective, minimumAmount), { userAction: false });
    }
  }, [presets, defaultAmountInCents, onDefaultAmountChange, collective, minimumAmount]);

  const handlePresetChange = (index: number, value: number) => {
    const previousValue = presets[index];
    const nextPresets = [...presets];
    nextPresets[index] = value;
    onPresetsChange(nextPresets);

    if (defaultAmountInCents === previousValue) {
      onDefaultAmountChange(value, { userAction: false });
    }
  };

  const handleDelete = (index: number) => {
    if (presets.length <= 1) {
      return;
    }

    const deletedValue = presets[index];
    presetKeysRef.current = presetKeysRef.current.filter((_, i) => i !== index);
    const nextPresets = presets.filter((_, i) => i !== index);
    onPresetsChange(nextPresets);

    if (defaultAmountInCents === deletedValue) {
      onDefaultAmountChange(getDefaultAmountForPresets(nextPresets, collective, minimumAmount), { userAction: false });
    }
  };

  const handleAdd = () => {
    if (presets.length >= MAX_TIER_PRESETS) {
      return;
    }

    presetKeysRef.current = [...presetKeysRef.current, crypto.randomUUID()];
    onPresetsChange([...presets, getNextPresetAmount(presets, minAmountInCents)]);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {presets.map((preset, index) => {
          const isDefault = defaultAmountInCents === preset;
          const isBelowMinimum = minAmountInCents > 0 && preset < minAmountInCents;
          const showError = Boolean(isBelowMinimum && (presetTouched?.[index] || submitCount));

          return (
            <div key={presetKeysRef.current[index]} className="grid grid-cols-[1fr_auto] items-start gap-x-2">
              <div>
                <div className="relative">
                  <InputAmount
                    id={`preset-amount-${index}`}
                    data-cy={`preset-amount-${index}`}
                    currency={collective.currency}
                    currencyDisplay="CODE"
                    value={preset}
                    maxWidth="100%"
                    error={showError}
                    className={cn(isDefault && '[&_input]:pr-[4.5rem]')}
                    onChange={value => {
                      if (!isNil(value) && !isNaN(value)) {
                        setFieldTouched(`presets.${index}`, true);
                        handlePresetChange(index, value);
                      }
                    }}
                    onBlur={() => setFieldTouched(`presets.${index}`, true)}
                  />
                  {isDefault && (
                    <Badge
                      type="info"
                      size="xs"
                      className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
                    >
                      {intl.formatMessage({ defaultMessage: 'Default', id: 'lKv8ex' })}
                    </Badge>
                  )}
                </div>
                {showError && (
                  <P display="block" color="red.500" pt={2} fontSize="11px">
                    {intl.formatMessage({
                      id: 'tier.presets.belowMinimum',
                      defaultMessage: 'Suggested amount must be at least the minimum amount',
                    })}
                  </P>
                )}
              </div>
              <div className="flex items-center">
                {isDefault ? (
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center text-primary"
                    data-cy={`preset-default-${index}`}
                    aria-hidden
                  >
                    <Pin className="h-4 w-4 fill-current" />
                  </span>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground"
                        aria-label={makeDefaultTooltip}
                        data-cy={`preset-make-default-${index}`}
                        onClick={() => onDefaultAmountChange(preset, { userAction: true })}
                      >
                        <Pin className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">{makeDefaultTooltip}</TooltipContent>
                  </Tooltip>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={presets.length <= 1}
                  aria-label={intl.formatMessage({
                    id: 'tier.presets.remove',
                    defaultMessage: 'Remove suggested amount',
                  })}
                  data-cy={`preset-remove-${index}`}
                  onClick={() => handleDelete(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {presets.length < MAX_TIER_PRESETS && (
        <Button type="button" variant="outline" size="sm" data-cy="preset-add" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          {intl.formatMessage({ id: 'tier.presets.add', defaultMessage: 'Add suggested amount' })}
        </Button>
      )}
    </div>
  );
}
