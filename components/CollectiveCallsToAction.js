import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import dynamic from 'next/dynamic';
import { FormattedMessage } from 'react-intl';

import { getCollectiveTypeForUrl } from '../lib/collective.lib';

import ApplyToHostBtn from './ApplyToHostBtn';
import Container from './Container';
import { Box } from './Grid';
import Link from './Link';
import StyledButton from './StyledButton';

// Dynamic imports
const AddFundsToOrganizationModal = dynamic(() => import('./AddFundsToOrganizationModal'));
const AddFundsModal = dynamic(() => import('./host-dashboard/AddFundsModal'));

/**
 * Show call to actions as buttons for the collective.
 */
const CollectiveCallsToAction = ({
  collective,
  buttonsMinWidth,
  callsToAction: {
    hasContribute,
    hasSubmitExpense,
    hasContact,
    hasApply,
    hasDashboard,
    hasManageSubscriptions,
    addFundsToOrganization,
    addFunds,
  },
  ...props
}) => {
  const [hasAddFundsToOrganizationModal, showAddFundsToOrganizationModal] = React.useState(false);
  const [hasAddFundsModal, showAddFundsModal] = React.useState(false);
  const hostedCollectivesLimit = get(collective, 'plan.hostedCollectivesLimit');
  const hostWithinLimit = hostedCollectivesLimit
    ? get(collective, 'plan.hostedCollectives') < hostedCollectivesLimit === true
    : true;

  let contributeRoute = 'orderCollectiveNew';
  let contributeRouteParams = { collectiveSlug: collective.slug, verb: 'donate' };
  if (collective.settings?.disableCustomContributions) {
    if (collective.tiers && collective.tiers.length > 0) {
      const tier = collective.tiers[0];
      contributeRoute = 'orderCollectiveTierNew';
      contributeRouteParams = {
        collectiveSlug: collective.slug,
        verb: 'contribute',
        tierSlug: tier.slug,
        tierId: tier.id,
      };
    } else {
      hasContribute = false;
    }
  }

  return (
    <Container display="flex" justifyContent="center" alignItems="center" whiteSpace="nowrap" {...props}>
      {hasContact && (
        <Link route="collective-contact" params={{ collectiveSlug: collective.slug }}>
          <StyledButton buttonSize="small" mx={2} my={1} minWidth={buttonsMinWidth}>
            <FormattedMessage id="Contact" defaultMessage="Contact" />
          </StyledButton>
        </Link>
      )}
      {hasContribute && (
        <Link route={contributeRoute} params={contributeRouteParams}>
          <StyledButton
            buttonSize="small"
            mx={2}
            my={1}
            minWidth={buttonsMinWidth}
            buttonStyle="secondary"
            data-cy="donate-btn"
          >
            <FormattedMessage id="menu.contributeMoney" defaultMessage="Contribute Money" />
          </StyledButton>
        </Link>
      )}
      {hasSubmitExpense && (
        <Link
          route="create-expense"
          params={{
            parentCollectiveSlug: collective.parentCollective?.slug,
            type: collective.parentCollective ? getCollectiveTypeForUrl(collective) : undefined,
            collectiveSlug: collective.slug,
          }}
        >
          <StyledButton
            buttonSize="small"
            mx={2}
            my={1}
            minWidth={buttonsMinWidth}
            buttonStyle="secondary"
            data-cy="submit-expense-btn"
          >
            <FormattedMessage id="menu.submitExpense" defaultMessage="Submit Expense" />
          </StyledButton>
        </Link>
      )}
      {hasManageSubscriptions && (
        <Link route="recurring-contributions" params={{ slug: collective.slug }}>
          <StyledButton buttonSize="small" mx={2} my={1} minWidth={buttonsMinWidth}>
            <FormattedMessage id="menu.subscriptions" defaultMessage="Manage Contributions" />
          </StyledButton>
        </Link>
      )}
      {hasDashboard && collective.plan.hostDashboard && (
        <Link route="host.dashboard" params={{ hostCollectiveSlug: collective.slug }}>
          <StyledButton buttonSize="small" mx={2} my={1} minWidth={buttonsMinWidth}>
            <FormattedMessage id="host.dashboard" defaultMessage="Dashboard" />
          </StyledButton>
        </Link>
      )}
      {hasApply && (
        <Box mx={2} my={1}>
          <ApplyToHostBtn
            hostSlug={collective.slug}
            disabled={!hostWithinLimit}
            minWidth={buttonsMinWidth}
            withoutIcon
          />
        </Box>
      )}
      {addFundsToOrganization && (
        <Fragment>
          <StyledButton
            buttonSize="small"
            mx={2}
            my={1}
            minWidth={buttonsMinWidth}
            onClick={() => showAddFundsToOrganizationModal(true)}
          >
            <FormattedMessage id="menu.addFunds" defaultMessage="Add funds" />
          </StyledButton>
          <AddFundsToOrganizationModal
            collective={collective}
            show={hasAddFundsToOrganizationModal}
            setShow={showAddFundsToOrganizationModal}
          />
        </Fragment>
      )}
      {addFunds && (
        <Fragment>
          <StyledButton
            buttonSize="small"
            mx={2}
            my={1}
            minWidth={buttonsMinWidth}
            onClick={() => showAddFundsModal(true)}
          >
            <FormattedMessage id="menu.addFunds" defaultMessage="Add funds" />
          </StyledButton>
          <AddFundsModal
            show={hasAddFundsModal}
            collective={collective}
            host={collective}
            onClose={() => showAddFundsModal(null)}
          />
        </Fragment>
      )}
    </Container>
  );
};

CollectiveCallsToAction.propTypes = {
  collective: PropTypes.shape({
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    plan: PropTypes.object,
    host: PropTypes.object,
    settings: PropTypes.object,
    tiers: PropTypes.arrayOf(PropTypes.object),
    parentCollective: PropTypes.shape({
      slug: PropTypes.string,
    }),
  }),
  callsToAction: PropTypes.shape({
    /** Button to contact the collective */
    hasContact: PropTypes.bool,
    /** Donate / Send Money button */
    hasContribute: PropTypes.bool,
    /** Submit new expense button */
    hasSubmitExpense: PropTypes.bool,
    /** Hosts "Apply" button */
    hasApply: PropTypes.bool,
    /** Hosts "Dashboard" button */
    hasDashboard: PropTypes.bool,
    /** Link to edit subscriptions */
    hasManageSubscriptions: PropTypes.bool,
    /** Link to add funds */
    addFundsToOrganization: PropTypes.bool,
    /** Link to add funds */
    addFunds: PropTypes.bool,
  }).isRequired,
  /** Will apply a min-width to all buttons */
  buttonsMinWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

CollectiveCallsToAction.defaultProps = {
  callsToAction: {},
  buttonsMinWidth: 100,
};

export default CollectiveCallsToAction;
