import React from 'react';
import { TriangleAlert } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { OrderEditStrategy } from '../../lib/graphql/types/v2/graphql';

import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { Checkbox } from '../ui/Checkbox';
import { RadioGroup, RadioGroupCard } from '../ui/RadioGroup';

type OrderEditStrategyPickerProps = {
  strategy: OrderEditStrategy;
  onStrategyChange: (strategy: OrderEditStrategy) => void;
  /** Whether the admin acknowledged the consequences of the selected strategy */
  isConfirmed: boolean;
  onConfirmedChange: (isConfirmed: boolean) => void;
  /** Displays the confirmation as missing */
  hasConfirmationError?: boolean;
  disabled?: boolean;
  confirmCheckboxId?: string;
  'data-cy'?: string;
};

/**
 * Lets host admins pick how the ledger gets updated when they edit funds that they recorded manually
 * (added funds, manual contributions), and acknowledge what it implies for their own accounting.
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
    <div className="space-y-3 text-sm" data-cy={dataCy}>
      <div>
        <p className="font-bold text-foreground">
          <FormattedMessage defaultMessage="How should the ledger be updated?" id="OrderEditStrategy.title" />
        </p>
        <p className="text-xs text-muted-foreground">
          <FormattedMessage
            defaultMessage="This choice only affects how the change is recorded. The resulting balances are the same."
            id="OrderEditStrategy.subtitle"
          />
        </p>
      </div>
      <RadioGroup
        value={strategy}
        disabled={disabled}
        onValueChange={value => {
          // The acknowledgment is specific to a strategy
          onConfirmedChange(false);
          onStrategyChange(value as OrderEditStrategy);
        }}
        aria-label="Edit strategy"
      >
        <RadioGroupCard
          value={OrderEditStrategy.REVERSE}
          contentClassName="items-start"
          indicatorClassName="mt-0.5"
          data-cy={`${dataCy}-REVERSE`}
        >
          <div>
            <div className="flex flex-wrap items-center gap-2 font-medium">
              <FormattedMessage defaultMessage="Reverse and record again" id="OrderEditStrategy.reverse.title" />
              <Badge type="info" size="xs">
                <FormattedMessage defaultMessage="Recommended" id="VKfWR3" />
              </Badge>
            </div>
            <p className="mt-1 text-xs font-normal text-muted-foreground">
              <FormattedMessage
                defaultMessage="The existing transactions are reversed and new ones are created. The ledger keeps the full history, and the transactions you already exported or reconciled stay valid."
                id="OrderEditStrategy.reverse.description"
              />
            </p>
          </div>
        </RadioGroupCard>
        <RadioGroupCard
          value={OrderEditStrategy.IN_PLACE}
          contentClassName="items-start"
          indicatorClassName="mt-0.5"
          data-cy={`${dataCy}-IN_PLACE`}
        >
          <div>
            <div className="font-medium">
              <FormattedMessage defaultMessage="Edit in place" id="OrderEditStrategy.inPlace.title" />
            </div>
            <p className="mt-1 text-xs font-normal text-muted-foreground">
              <FormattedMessage
                defaultMessage="The existing transactions are replaced with the new values, as if they had been recorded this way in the first place. No reversal appears in the ledger."
                id="OrderEditStrategy.inPlace.description"
              />
            </p>
          </div>
        </RadioGroupCard>
      </RadioGroup>

      {isInPlace && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900" data-cy={`${dataCy}-warning`}>
          <TriangleAlert className="h-4 w-4 !text-amber-700" />
          <AlertTitle>
            <FormattedMessage
              defaultMessage="You are responsible for updating your books"
              id="OrderEditStrategy.inPlace.warning.title"
            />
          </AlertTitle>
          <AlertDescription className="text-xs">
            <ul className="list-outside list-disc space-y-1 pl-4">
              <li>
                <FormattedMessage
                  defaultMessage="Transactions that you already exported or reconciled will not match the ledger anymore. Past exports are not updated: you need to report this change in your own accounting."
                  id="OrderEditStrategy.inPlace.warning.books"
                />
              </li>
              <li>
                <FormattedMessage
                  defaultMessage="The edit remains visible in the activity log of the contribution, with the previous values."
                  id="OrderEditStrategy.inPlace.warning.log"
                />
              </li>
              <li>
                <FormattedMessage
                  defaultMessage="Balances and reports can take up to 24 hours to reflect the new values."
                  id="OrderEditStrategy.inPlace.warning.delay"
                />
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

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
          {isInPlace ? (
            <FormattedMessage
              defaultMessage="I understand that the existing transactions will be replaced, and that I am responsible for updating my books and past exports accordingly."
              id="OrderEditStrategy.inPlace.confirm"
            />
          ) : (
            <FormattedMessage
              defaultMessage="I understand that the existing transactions (including their fees) will be reversed, and that new ones will be created."
              id="OrderEditStrategy.reverse.confirm"
            />
          )}
        </label>
      </div>
      {hasConfirmationError && !isConfirmed && (
        <p className="text-xs text-red-600" role="alert">
          <FormattedMessage
            defaultMessage="Please confirm that you understand how the ledger will be updated."
            id="OrderEditStrategy.confirmRequired"
          />
        </p>
      )}
    </div>
  );
};
