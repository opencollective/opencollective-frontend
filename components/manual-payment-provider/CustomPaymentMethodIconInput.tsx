import React from 'react';
import { startCase } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';

import { CUSTOM_PAYMEMENT_ICON_MAP } from './constants';

type CustomPaymentMethodIconInputProps = {
  icon?: string;
  onIconChange: (icon: string) => void;
};

export const CustomPaymentMethodIconInput = ({ icon, onIconChange }: CustomPaymentMethodIconInputProps) => {
  const IconComponent = CUSTOM_PAYMEMENT_ICON_MAP[icon || ''];
  return (
    <div>
      <Label className="block text-sm font-bold">
        <FormattedMessage defaultMessage="Icon" id="CustomPaymentMethod.Icon" />
      </Label>
      <p className="mt-1 mb-2 text-xs text-gray-600">
        <FormattedMessage defaultMessage="Optional" id="forms.optional" />
      </p>

      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-start" data-cy="icon-selector-trigger">
            {IconComponent ? (
              <React.Fragment>
                <IconComponent className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{startCase(icon)}</span>
              </React.Fragment>
            ) : (
              <FormattedMessage defaultMessage="Select icon" id="CustomPaymentMethod.SelectIcon" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2" align="start">
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(CUSTOM_PAYMEMENT_ICON_MAP).map(([name, IconComp]) => {
              return (
                <Button
                  key={name}
                  type="button"
                  variant={icon === name ? 'default' : 'ghost'}
                  size="sm"
                  className="h-auto flex-col gap-1 p-2"
                  onClick={() => onIconChange(name)}
                  data-cy={`icon-selector-${name}`}
                >
                  <IconComp className="h-6 w-6" />
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
