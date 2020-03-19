import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/react-hoc';
import { FormattedMessage } from 'react-intl';
import gql from 'graphql-tag';

import { get } from 'lodash';

import { compose } from '../lib/utils';

import SmallButton from './SmallButton';

class PublishUpdateBtn extends React.Component {
  static propTypes = {
    id: PropTypes.number.isRequired,
    publishUpdate: PropTypes.func,
    data: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  async onClick() {
    const { id } = this.props;
    await this.props.publishUpdate(id);
  }

  render() {
    const update = this.props.data.Update;

    return (
      <div data-cy="PublishUpdateBtn" className="PublishUpdateBtn">
        <style jsx>
          {`
            .PublishUpdateBtn {
              display: flex;
              align-items: center;
            }
            .notice {
              color: #525866;
              font-size: 12px;
              margin-left: 1rem;
            }
          `}
        </style>
        <SmallButton className="publish" onClick={this.onClick}>
          <FormattedMessage id="update.publish.btn" defaultMessage="publish" />
        </SmallButton>
        <div className="notice">
          <FormattedMessage
            id="update.publish.backers"
            defaultMessage={'Your update will be sent to {n} backers'}
            values={{ n: get(update, 'collective.stats.backers.all') }}
          />
        </div>
      </div>
    );
  }
}

const publishUpdateQuery = gql`
  mutation publishUpdate($id: Int!) {
    publishUpdate(id: $id) {
      id
      publishedAt
    }
  }
`;

const getUpdateQuery = gql`
  query Update($id: Int!) {
    Update(id: $id) {
      id
      collective {
        id
        stats {
          id
          backers {
            all
          }
        }
      }
    }
  }
`;

export const addGetUpdate = graphql(getUpdateQuery);

const addMutation = graphql(publishUpdateQuery, {
  props: ({ mutate }) => ({
    publishUpdate: async id => {
      return await mutate({ variables: { id } });
    },
  }),
});

const addGraphQL = compose(addMutation, addGetUpdate);

export default addGraphQL(PublishUpdateBtn);
