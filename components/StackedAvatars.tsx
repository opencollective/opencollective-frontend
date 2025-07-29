import React from 'react';

import type { Account } from '../lib/graphql/types/v2/schema';

import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';
import Avatar from './Avatar';
import LinkCollective from './LinkCollective';

const StackedAvatars = ({
  accounts = [],
  imageSize,
  maxDisplayedAvatars = 3,
  maxHiddenToDisplayInTooltip = 15,
  withHoverCard,
}: {
  accounts: Partial<Account>[];
  imageSize: number;
  maxDisplayedAvatars?: number;
  maxHiddenToDisplayInTooltip?: number;
  withHoverCard?: boolean | { includeAdminMembership: boolean };
}) => {
  const [hasMoreTooltip, setHasMoreTooltip] = React.useState(false);
  const width = `${imageSize}px`;
  const marginLeft = `-${imageSize / 3}px`;
  const displayed = accounts.length > maxDisplayedAvatars ? accounts.slice(0, maxDisplayedAvatars - 1) : accounts;
  const hidden = accounts.slice(displayed.length);
  const hiddenToDisplay = hidden.slice(0, maxHiddenToDisplayInTooltip);
  return (
    <div className="flex items-center">
      {displayed.map(account => (
        <div key={account.id || account.slug} className="flex items-center first:ml-0!" style={{ marginLeft }}>
          <LinkCollective
            collective={account}
            withHoverCard={Boolean(withHoverCard)}
            hoverCardProps={{
              includeAdminMembership:
                typeof withHoverCard === 'object' && withHoverCard.includeAdminMembership ? account.slug : false,
            }}
          >
            <Avatar
              collective={account}
              radius={imageSize}
              displayTitle={true}
              className="border border-solid border-white"
            />
          </LinkCollective>
        </div>
      ))}
      {hidden.length ? (
        <Tooltip open={hasMoreTooltip} onOpenChange={setHasMoreTooltip}>
          <TooltipTrigger>
            <div
              className="flex items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-400 first:ml-0"
              style={{ width, height: width, marginLeft }}
            >
              +{hidden.length}
            </div>
          </TooltipTrigger>
          {hasMoreTooltip && (
            <TooltipContent>
              <div className="flex max-w-2xs flex-wrap items-center gap-2 py-2">
                {hiddenToDisplay.map((account, idx) => {
                  return (
                    <div key={account.id || account.slug} className="flex items-center">
                      <Avatar collective={account} radius={12} className="mr-1" />
                      <LinkCollective collective={account} noTitle />
                      {idx < hiddenToDisplay.length - 1
                        ? ','
                        : idx === hidden.length - 1
                          ? '.'
                          : `, ...${hidden.length - hiddenToDisplay.length} more.`}
                    </div>
                  );
                })}
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      ) : null}
    </div>
  );
};

export default StackedAvatars;
