import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/react-hoc';
import gql from 'graphql-tag';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { compose } from '../lib/utils';

import Container from './Container';
import SmallButton from './SmallButton';
import StyledSelect from './StyledSelect';
import { H5, Span } from './Text';

class PublishUpdateBtn extends React.Component {
  static propTypes = {
    id: PropTypes.number.isRequired,
    publishUpdate: PropTypes.func,
    data: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.state = {
      notificationAudience: 'FINANCIAL_CONTRIBUTORS',
    };
  }

  async onClick() {
    const { id } = this.props;
    const { notificationAudience } = this.state;
    await this.props.publishUpdate(id, notificationAudience);
  }

  handleNotificationChange(selected) {
    this.setState({ notificationAudience: selected.value });
  }

  render() {
    const update = this.props.data.Update;
    const isHost = get(update, 'collective.isHost');
    const backers = get(update, 'collective.stats.backers.all');
    const hostedCollectives = get(update, 'collective.stats.collectives.hosted');

    const options = [
      {
        label: (
          <FormattedMessage id="update.notify.financialContributors" defaultMessage="Notify financial contributors" />
        ),
        value: 'FINANCIAL_CONTRIBUTORS',
      },
      {
        label: (
          <FormattedMessage
            id="update.notify.hostedCollectiveAdmins"
            defaultMessage="Notify hosted collective's admins"
          />
        ),
        value: 'COLLECTIVE_ADMINS',
      },
      {
        label: <FormattedMessage id="update.notify.everyone" defaultMessage="Notify everyone" />,
        value: 'ALL',
      },
    ];

    let notice;
    switch (this.state.notificationAudience) {
      case 'FINANCIAL_CONTRIBUTORS':
        notice = (
          <FormattedMessage
            id="update.publish.notify.financialContributors."
            defaultMessage="Your update will be sent to {n} backers"
            values={{ n: backers }}
          />
        );
        break;

      case 'COLLECTIVE_ADMINS':
        notice = (
          <FormattedMessage
            id="update.publish.notify.hostedCollectiveAdmins"
            defaultMessage="Your update will be sent to {m} hosted collective's admins"
            values={{
              m: hostedCollectives,
            }}
          />
        );
        break;

      case 'ALL':
        notice = (
          <FormattedMessage
            id="update.publish.notify.Everyone"
            defaultMessage="Your update will be sent to {n} backers and {m} hosted collective's admins"
            values={{
              n: backers,
              m: hostedCollectives,
            }}
          />
        );
        break;
    }

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
        <Container mt="4" mb="5" display="flex" flexDirection="column" alignItems="left">
          {isHost && (
            <Span>
              <H5>
                <FormattedMessage id="update.publish.notify.selection" defaultMessage="Select who should be notified" />
              </H5>
              <StyledSelect
                options={options}
                defaultValue={options[0]}
                onChange={selected => this.handleNotificationChange(selected)}
              />
            </Span>
          )}
          <Container mt="3" display="flex" alignItems="center">
            <SmallButton className="publish" onClick={this.onClick}>
              <FormattedMessage id="update.publish.btn" defaultMessage="publish" />
            </SmallButton>
            <div className="notice">
              {isHost ? (
                notice
              ) : (
                <FormattedMessage
                  id="update.publish.backers"
                  defaultMessage={'Your update will be sent to {n} backers'}
                  values={{
                    n: backers,
                  }}
                />
              )}
            </div>
          </Container>
        </Container>
      </div>
    );
  }
}

const publishUpdateQuery = gql`
  mutation publishUpdate($id: Int!, $notificationAudience: UpdateAudienceTypeEnum!) {
    publishUpdate(id: $id, notificationAudience: $notificationAudience) {
      id
      publishedAt
      notificationAudience
    }
  }
`;

const getUpdateQuery = gql`
  query Update($id: Int!) {
    Update(id: $id) {
      id
      collective {
        id
        isHost
        stats {
          id
          backers {
            all
          }
          collectives {
            hosted
          }
        }
      }
    }
  }
`;

export const addGetUpdate = graphql(getUpdateQuery);

const addMutation = graphql(publishUpdateQuery, {
  props: ({ mutate }) => ({
    publishUpdate: async (id, notificationAudience) => {
      return await mutate({ variables: { id, notificationAudience } });
    },
  }),
});

const addGraphQL = compose(addMutation, addGetUpdate);

export default addGraphQL(PublishUpdateBtn);
