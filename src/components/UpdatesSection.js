import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { FormattedMessage } from 'react-intl'
import SectionTitle from './SectionTitle';
import UpdatesWithData from './UpdatesWithData';

class UpdatesSection extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired, // collective.id
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
  }

  render() {
    const { collective, LoggedInUser } = this.props;

    let action;
    if (LoggedInUser && LoggedInUser.canEditCollective(collective)) {
      action = {
        href: `/${collective.slug}/updates/new`,
        label: <FormattedMessage id="sections.update.new" defaultMessage="Create an Update" />
      }
    }

    return (
      <section id="updates">
        <SectionTitle section="updates" action={action} />
        <UpdatesWithData
          collective={collective}
          compact={true}
          limit={3}
          LoggedInUser={LoggedInUser}
          />
      </section>
    );
  }

}

export default withIntl(UpdatesSection);
