import React from 'react';
import { MoreHorizontal, Share } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { Button } from '../ui/Button';

import { triggerPrototypeToast } from './helpers';

export function ProfileActionButtons() {
  return (
    <div className="flex gap-2">
      <Button onClick={triggerPrototypeToast}>
        <FormattedMessage defaultMessage="Contribute" id="Contribute" />
      </Button>

      <Button
        onClick={triggerPrototypeToast}
        variant="secondary"
        size="icon"
        className="bg-primary/10 hover:bg-primary/20"
      >
        <Share size={16} />
      </Button>
      <Button
        onClick={triggerPrototypeToast}
        variant="secondary"
        size="icon"
        className="bg-primary/10 hover:bg-primary/20"
      >
        <MoreHorizontal size={16} />
      </Button>
    </div>
  );
}
