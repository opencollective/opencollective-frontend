import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { defineMessages } from 'react-intl';
import Link from './Link';

class SectionTitle extends React.Component {

  static propTypes = {
    section: PropTypes.string,
    title: PropTypes.node,
    subtitle: PropTypes.node,
    values: PropTypes.object,
    action: PropTypes.object // { label, href }
  }

  constructor(props) {
    super(props);

    this.messages = defineMessages({
      'memberships.title': { id: 'section.memberships.title', defaultMessage: 'Memberships' },
      'updates.title': { id: 'section.updates.title', defaultMessage: 'Updates' },
      'updates.subtitle': { id: 'section.updates.subtitle', defaultMessage: 'Stay up to dates with our latest activities and progress.' },
      'events.title': { id: 'section.events.title', defaultMessage: 'Events' },
      'events.subtitle': { id: 'section.events.subtitle', defaultMessage: 'Meet the community!' },
      'budget.title': { id: 'section.budget.title', defaultMessage: 'Budget' },
      'budget.subtitle': { id: 'section.budget.subtitle', defaultMessage: 'Current balance: {balance}' },
      'expenses.title': { id: 'section.expenses.title', defaultMessage: 'Expenses' },
      'expenses.subtitle': { id: 'section.expenses.subtitle', defaultMessage: 'All expenses' },
      'contributors.title': { id: 'section.contributors.title', defaultMessage: 'Contributors' },
      'contributors.subtitle': { id: 'section.contributors.subtitle', defaultMessage: `{organizations, plural, one {{organizations} organization and} other {{organizations} organizations and}} {users} {users, plural, one {person is} other {people are}} supporting us.` },
      'contributionDetails.title': { id: 'tier.order.contributionDetails', defaultMessage: 'Contribution details' },
      'contributionDetails.subtitle': { id: 'tier.order.contributionDetails.description', defaultMessage: 'Thank you for contributing to our budget! 🙏' },
      'ticketDetails.title': { id: 'tier.order.ticketDetails', defaultMessage: 'Ticket details' },
      'userDetails.title': { id: 'tier.order.userDetails', defaultMessage: 'Personal details' },
      'organizationDetails.title': { id: 'tier.order.organizationDetails', defaultMessage: 'Organization details' },
      'organizationDetails.subtitle': { id: 'tier.order.organizationDetails.description', defaultMessage: 'Create an organization. You can edit it later to add other members.' },
      'paymentDetails.title': { id: 'tier.order.paymentDetails', defaultMessage: 'Payment details' }
    });
  }

  render() {
    const { section, intl, values, action } = this.props;

    const title = this.props.title || (this.messages[`${section}.title`] ? intl.formatMessage(this.messages[`${section}.title`]) : section);
    const subtitle = this.props.subtitle || (this.messages[`${section}.subtitle`] ? intl.formatMessage(this.messages[`${section}.subtitle`], values) : '');

    return (
      <div className="SectionTitle">
        <style jsx>{`
          .SectionTitle {
            margin-top: 4rem;
            overflow: hidden;
            border-left: 4px solid #3399FF;
            padding-left: 2.8rem;
            margin-bottom: 5rem;
          }
          .title {
            display: flex;
            align-items: baseline;
          }
          .SectionTitle .title :global(.action) {
            font-size: 1.4rem;
          }
          h1 {
            color: #18191A;
            font-family: Rubik;
            font-size: 32px;
            font-weight: 500;
            line-height: 38px;
            margin: 0;
            text-align: left;
            text-align: left;
            margin-right: 0.5rem;
          }
          .subtitle {
            margin-top: 0.8rem;
            color: #666F80;
            font-family: Rubik;
            font-size: 16px;
            line-height: 19px;
            text-align: left;
          }
          .content {
            padding: 0.8rem 0;
          }
          @media(max-width: 420px) {
            .SectionTitle {
              padding-left: 1.5rem;
            }
          }
        `}</style>
        <div className="content">
          <div className="title">
            <h1>{title}</h1>
            { action &&
              <Link route={action.href} className="action">{action.label}</Link>
            }
          </div>
          { subtitle && <div className="subtitle">{subtitle}</div> }
        </div>
      </div>
    );    
  }
}

export default withIntl(SectionTitle);
