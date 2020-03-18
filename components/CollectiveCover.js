import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { withUser } from './UserProvider';
import CollectiveNavbar from './CollectiveNavbar';
import Container from './Container';
import { AllSectionsNames } from './collective-page/_constants';

class CollectiveCover extends React.Component {
  static propTypes = {
    collective: PropTypes.shape({
      id: PropTypes.number,
      type: PropTypes.string,
      path: PropTypes.string,
      slug: PropTypes.string,
      name: PropTypes.string,
      currency: PropTypes.string,
      backgroundImage: PropTypes.string,
      isHost: PropTypes.bool,
      isActive: PropTypes.bool,
      isArchived: PropTypes.bool,
      startsAt: PropTypes.string,
      endsAt: PropTypes.string,
      timezone: PropTypes.string,
      company: PropTypes.string,
      website: PropTypes.string,
      twitterHandle: PropTypes.string,
      githubHandle: PropTypes.string,
      description: PropTypes.string,
      stats: PropTypes.shape({
        totalAmountSpent: PropTypes.number,
      }),
      host: PropTypes.shape({
        slug: PropTypes.string,
        name: PropTypes.string,
      }),
      parentCollective: PropTypes.shape({
        slug: PropTypes.string,
        name: PropTypes.string,
      }),
    }).isRequired,
    /** Defines the calls to action displayed next to the NavBar items. Match PropTypes of `CollectiveCallsToAction` */
    callsToAction: PropTypes.shape({
      hasContact: PropTypes.bool,
      hasSubmitExpense: PropTypes.bool,
      hasApply: PropTypes.bool,
      hasDashboard: PropTypes.bool,
    }),
    href: PropTypes.string,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    style: PropTypes.object,
    LoggedInUser: PropTypes.object,
    cta: PropTypes.object, // { href, label }
    displayContributeLink: PropTypes.bool,
    selectedSection: PropTypes.oneOf(AllSectionsNames),
  };

  render() {
    const { collective, LoggedInUser } = this.props;
    const canEdit = LoggedInUser && LoggedInUser.canEditCollective(collective);

    return (
      <Container mb={4}>
        <CollectiveNavbar
          collective={collective}
          isAdmin={canEdit}
          showEdit
          callsToAction={this.props.callsToAction}
          selected={this.props.selectedSection}
        />
      </Container>
    );
  }
}

export default injectIntl(withUser(CollectiveCover));
