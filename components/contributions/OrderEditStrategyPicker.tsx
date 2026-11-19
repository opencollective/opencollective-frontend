import React from 'react';
import { FormattedMessage } from 'react-intl';

import { OrderEditStrategy } from '../../lib/graphql/types/v2/graphql';

import { Badge } from '../ui/Badge';
import { Checkbox } from '../ui/Checkbox';
import { RadioGroup, RadioGroupCard } from '../ui/RadioGroup';

type OrderEditStrategyPickerProps = {
  strategy: OrderEditStrategy;
  onStrategyChange: (strategy: OrderEditStrategy) => void;
  /** Whether the admin acknowledged the consequences of editing in place. Not needed for reversals. */
  isConfirmed: boolean;
  onConfirmedChange: (isConfirmed: boolean) => void;
  /** Displays the confirmation as missing */
  hasConfirmationError?: boolean;
  disabled?: boolean;
  confirmCheckboxId?: string;
  'data-cy'?: string;
};

/** Whether the admin must acknowledge the consequences of the strategy before submitting */
export const isOrderEditStrategyConfirmationRequired = (strategy: OrderEditStrategy) =>
  strategy === OrderEditStrategy.IN_PLACE;

/**
 * Lets host admins pick how the ledger gets updated when they edit funds that they recorded manually
 * (added funds, manual contributions). Editing in place requires an acknowledgment.
 */
export const OrderEditStrategyPicker = ({
  strategy,
  onStrategyChange,
  isConfirmed,
  onConfirmedChange,
  hasConfirmationError = false,
  disabled = false,
  confirmCheckboxId = 'order-edit-strategy-confirm',
  'data-cy': dataCy = 'order-edit-strategy',
}: OrderEditStrategyPickerProps) => {
  const isInPlace = strategy === OrderEditStrategy.IN_PLACE;
  return (
    <fieldset className="text-sm" data-cy={dataCy}>
      <legend className="mb-2 font-medium text-foreground">
        <FormattedMessage defaultMessage="How should the ledger be updated?" id="OrderEditStrategy.title" />
      </legend>
      <RadioGroup
        value={strategy}
        disabled={disabled}
        onValueChange={value => {
          // The acknowledgment is specific to a strategy
          onConfirmedChange(false);
          onStrategyChange(value as OrderEditStrategy);
        }}
      >
        <RadioGroupCard
          value={OrderEditStrategy.REVERSE}
          contentClassName="items-start gap-3"
          indicatorClassName="mt-0.5"
          data-cy={`${dataCy}-REVERSE`}
        >
          <div>
            <div className="flex flex-wrap items-center gap-2 font-medium">
              <FormattedMessage defaultMessage="Reverse and record again" id="OrderEditStrategy.reverse.title" />
              <Badge type="neutral" size="xs">
                <FormattedMessage defaultMessage="Recommended" id="VKfWR3" />
              </Badge>
            </div>
            <p className="mt-0.5 text-xs font-normal text-muted-foreground">
              <FormattedMessage
                defaultMessage="Adds a reversal, so past exports and reconciliations stay valid."
                id="OrderEditStrategy.reverse.description"
              />
            </p>
          </div>
        </RadioGroupCard>
        <RadioGroupCard
          value={OrderEditStrategy.IN_PLACE}
          contentClassName="items-start gap-3"
          indicatorClassName="mt-0.5"
          data-cy={`${dataCy}-IN_PLACE`}
          showSubcontent={isInPlace}
          subContent={
            <div className="ml-7 border-t border-border pt-3">
              <div className="flex items-start gap-2">
                <Checkbox
                  id={confirmCheckboxId}
                  className="mt-0.5"
                  checked={isConfirmed}
                  disabled={disabled}
                  aria-invalid={hasConfirmationError}
                  onCheckedChange={checked => onConfirmedChange(checked === true)}
                  data-cy={`${dataCy}-confirm-checkbox`}
                />
                <label htmlFor={confirmCheckboxId} className="cursor-pointer text-xs leading-5 select-none">
                  <FormattedMessage
                    defaultMessage="I'll report this change in my own books and past exports."
                    id="OrderEditStrategy.inPlace.confirm"
                  />
                </label>
              </div>
              {hasConfirmationError && !isConfirmed && (
                <p className="mt-1 ml-6 text-xs text-destructive" role="alert">
                  <FormattedMessage
                    defaultMessage="Please confirm to edit in place."
                    id="OrderEditStrategy.confirmRequired"
                  />
                </p>
              )}
            </div>
          }
        >
          <div>
            <div className="font-medium">
              <FormattedMessage defaultMessage="Edit in place" id="OrderEditStrategy.inPlace.title" />
            </div>
            <p className="mt-0.5 text-xs font-normal text-muted-foreground">
              <FormattedMessage
                defaultMessage="Overwrites the original transactions. Past exports won't match, and reports can take up to 24 hours to update."
                id="OrderEditStrategy.inPlace.description"
              />
            </p>
          </div>
        </RadioGroupCard>
      </RadioGroup>
    </fieldset>
  );
};
