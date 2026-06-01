import React from 'react';

import { getCollectivePageRoute } from '../lib/url-helpers';

import Link from './Link';

const getSubmitExpenseRoute = collective => `${getCollectivePageRoute(collective)}/expenses/new`;

/**
 * Handles the submit expense CTA for both authenticated and unauthenticated users.
 * Logged-in users open the expense flow modal; logged-out users are redirected to the
 * create expense page, which displays the sign-in overlay.
 */
const SubmitExpenseBtn = ({ collective, LoggedInUser, onOpenSubmitExpenseModalClick, children }) => {
  const expenseUrl = getSubmitExpenseRoute(collective);

  if (!LoggedInUser) {
    return children({ href: expenseUrl });
  }

  return children({ onClick: onOpenSubmitExpenseModalClick });
};

export const SubmitExpenseLink = ({
  collective,
  LoggedInUser,
  onOpenSubmitExpenseModalClick,
  linkComponent: LinkComponent,
  children,
}) => {
  const expenseUrl = getSubmitExpenseRoute(collective);

  if (!LoggedInUser) {
    return (
      <LinkComponent as={Link} href={expenseUrl}>
        {children}
      </LinkComponent>
    );
  }

  return <LinkComponent onClick={onOpenSubmitExpenseModalClick}>{children}</LinkComponent>;
};

export default SubmitExpenseBtn;
