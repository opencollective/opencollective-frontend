import React from 'react';
import { Button } from '../ui/Button';
import { FormattedMessage } from 'react-intl';
import { triggerPrototypeToast } from './helpers';
import { MoreHorizontal, Share } from 'lucide-react';
import Link from '../Link';

export function ProfileActionButtons({ account, collective }) {
  return (
    <div className="flex gap-2">
      <Button asChild>
        <Link href={`/preview/${collective?.slug}/contribute`}>
          <FormattedMessage defaultMessage="Contribute" id="Contribute" />
        </Link>
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
