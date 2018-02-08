import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { defineMessages } from 'react-intl';

class SectionTitle extends React.Component {

  static propTypes = {
    section: PropTypes.string.isRequired,
    title: PropTypes.node,
    subtitle: PropTypes.node,
    values: PropTypes.object
  }

  constructor(props) {
    super(props);
    console.log(">>> props", props);
    this.messages = defineMessages({
      'budget.title': { id: 'section.budget.title', defaultMessage: 'Budget' },
      'budget.subtitle': { id: 'section.budget.subtitle', defaultMessage: 'Find out how we are spending our money to achieve our goals.' },
      'contributors.title': { id: 'section.contributors.title', defaultMessage: 'Contributors' },
      'contributors.subtitle': { id: 'section.contributors.subtitle', defaultMessage: `{organizations, plural, one {{organizations} organization and} other {{organizations} organizations and}} {users} {users, plural, one {person is} other {people are}} supporting us.` }
    });
  }

  render() {
    const { section, intl, values } = this.props;

    const title = this.props.title || (this.messages[`${section}.title`] ? intl.formatMessage(this.messages[`${section}.title`]) : section);
    const subtitle = this.props.subtitle || (this.messages[`${section}.subtitle`] ? intl.formatMessage(this.messages[`${section}.subtitle`], values) : '');

    return (
      <div className="title">
        <style jsx>{`
          .title {
            margin-top: 4rem;
            overflow: hidden;
            border-left: 4px solid #3399FF;
            padding-left: 2.8rem;
            margin-bottom: 5rem;
          }
          h1 {
            color: #18191A;
            font-family: Rubik;
            font-size: 32px;
            font-weight: 500;
            line-height: 38px;
            margin-top: 0;
            margin-bottom: 0.8rem;
            text-align: left;
            text-align: left;
          }
          .subtitle {
            color: #666F80;
            font-family: Rubik;
            font-size: 16px;
            line-height: 19px;
            text-align: left;
          }
        `}</style>
        <h1>{title}</h1>
        <div className="subtitle">
          {subtitle}
        </div>
      </div>
    );    
  }
}

export default withIntl(SectionTitle);
