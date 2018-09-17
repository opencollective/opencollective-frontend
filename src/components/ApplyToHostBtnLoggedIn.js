import React from 'react';
import PropTypes from 'prop-types';
import { graphql, compose } from 'react-apollo';
import { FormattedMessage } from 'react-intl';
import gql from 'graphql-tag';

import withIntl from '../lib/withIntl';
import Button from './Button';
import Link from './Link';
import { get } from 'lodash';

class ApplyToHostBtnLoggedIn extends React.Component {
  static propTypes = {
    LoggedInUser: PropTypes.object.isRequired,
    host: PropTypes.object.isRequired,
    data: PropTypes.object,
    editCollective: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.state = {};
  }

  async onClick() {
    const { host } = this.props;
    const CollectiveInputType = {
      id: this.inactiveCollective.id,
      HostCollectiveId: host.id,
    };
    console.log('>>> editCollective', CollectiveInputType);
    const res = await this.props.editCollective(CollectiveInputType);
    console.log('>>> res', res);
  }

  render() {
    const { host, data } = this.props;
    if (data.loading) {
      return (
        <Button className="blue" disabled>
          <FormattedMessage
            id="host.apply.create.btn"
            defaultMessage="Apply to create a collective"
          />
        </Button>
      );
    }

    if (data.allCollectives.total > 0) {
      this.inactiveCollective = data.allCollectives.collectives[0];
    }

    return (
      <div className="ApplyToHostBtnLoggedIn">
        {!this.inactiveCollective && (
          <Button className="blue" href={`/${host.slug}/apply`}>
            <FormattedMessage
              id="host.apply.create.btn"
              defaultMessage="Apply to create a collective"
            />
          </Button>
        )}
        {this.inactiveCollective &&
          (!this.inactiveCollective.host ||
            get(this.inactiveCollective, 'host.id') !== host.id) && (
            <Button onClick={this.onClick} className="blue">
              <FormattedMessage
                id="host.apply.btn"
                defaultMessage="Apply to host your collective {collective}"
                values={{ collective: this.inactiveCollective.name }}
              />
            </Button>
          )}
        {get(this.inactiveCollective, 'host.id') === host.id && (
          <FormattedMessage
            id="host.apply.pending"
            defaultMessage="Application pending for {collective}"
            values={{
              collective: (
                <Link route={`/${this.inactiveCollective.slug}`}>
                  {this.inactiveCollective.name}
                </Link>
              ),
            }}
          />
        )}
      </div>
    );
  }
}

const getInactiveCollectivesQuery = gql`
  query allCollectives($memberOfCollectiveSlug: String) {
    allCollectives(
      memberOfCollectiveSlug: $memberOfCollectiveSlug
      role: "ADMIN"
      type: COLLECTIVE
      isActive: false
      orderBy: createdAt
      orderDirection: DESC
    ) {
      total
      collectives {
        id
        slug
        name
        host {
          id
          slug
        }
      }
    }
  }
`;

const editCollectiveMutation = gql`
  mutation editCollective($collective: CollectiveInputType!) {
    editCollective(collective: $collective) {
      id
      isActive
      host {
        id
        slug
      }
    }
  }
`;

const addQuery = graphql(getInactiveCollectivesQuery, {
  options(props) {
    return {
      variables: {
        memberOfCollectiveSlug: props.LoggedInUser.collective.slug,
      },
    };
  },
});

const addMutation = graphql(editCollectiveMutation, {
  props: ({ mutate }) => ({
    editCollective: async CollectiveInputType => {
      return await mutate({ variables: { collective: CollectiveInputType } });
    },
  }),
});

const addGraphQL = compose(
  addQuery,
  addMutation,
);

export default addGraphQL(withIntl(ApplyToHostBtnLoggedIn));
