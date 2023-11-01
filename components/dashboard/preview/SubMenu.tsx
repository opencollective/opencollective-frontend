import React from 'react';
import clsx from 'clsx';
import { useIntl } from 'react-intl';

import { getDashboardRoute } from '../../../lib/url-helpers';

import Link from '../../Link';
import { SECTION_LABELS } from '../constants';

export default function SubMenu({ className, subMenu, account, selectedSection }) {
  const intl = useIntl();
  return (
    <div className={className}>
      <div className="space-y-2 border-l text-sm">
        {subMenu.map(item => (
          <Link
            key={item.label}
            href={getDashboardRoute(account, item.section)}
            className={clsx(
              '-ml-px flex items-center justify-start gap-2 overflow-hidden border-l-2 px-4 py-0.5 font-medium  transition-colors',
              selectedSection === item.section
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-slate-500 ',
            )}
          >
            <span className="truncate">{item.label || intl.formatMessage(SECTION_LABELS[item.section])}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
