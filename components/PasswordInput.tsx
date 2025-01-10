import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useIntl } from 'react-intl';

import { cn } from '../lib/utils';

import { Button } from './ui/Button';
import { Input } from './ui/Input';

export function PasswordInput(inputProps: Omit<React.ComponentProps<typeof Input>, 'type'>) {
  const intl = useIntl();
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative">
      <Input
        type={showPassword ? 'text' : 'password'}
        placeholder={intl.formatMessage({ defaultMessage: 'Enter password', id: '2LbrkB' })}
        className={cn('pr-10', inputProps.className)}
        {...inputProps}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={togglePasswordVisibility}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? (
          <EyeOffIcon className="h-4 w-4 text-gray-500" />
        ) : (
          <EyeIcon className="h-4 w-4 text-gray-500" />
        )}
      </Button>
    </div>
  );
}
