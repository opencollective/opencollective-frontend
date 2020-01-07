import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

const Capitalized = styled.span`
  text-transform: capitalize;
`;

class EditHostSettings extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { collective } = this.props;

    return (
      <div className="ExportData">
        <h2>
          <FormattedMessage id="collective.hostSettings.title" defaultMessage="Host Settings" />
        </h2>

        <h3>
          <FormattedMessage id="collective.hostSettings.plan.title" defaultMessage="Plan" />
        </h3>

        <ul>
          <li>
            <strong>Name</strong>: <Capitalized>{collective.plan.name}</Capitalized>
          </li>
          <li>
            <strong>Collective Limit</strong>: {collective.plan.hostedCollectives} of{' '}
            {collective.plan.hostedCollectivesLimit}
          </li>
          <li>
            <strong>Add Funds Limit</strong>: ${collective.plan.addedFunds / 100} of $
            {collective.plan.addedFundsLimit / 100}
          </li>
          <li>
            <strong>Host Dashboard</strong>: {collective.plan.hostDashboard ? 'Yes' : 'No'}
          </li>
        </ul>
      </div>
    );
  }
}

export default EditHostSettings;
