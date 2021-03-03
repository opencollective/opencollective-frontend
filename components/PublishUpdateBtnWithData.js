import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import { compose } from '../lib/utils';

import ConfirmationModal from './ConfirmationModal';
import Container from './Container';
import StyledButton from './StyledButton';
import StyledSelect from './StyledSelect';
import { Label, Span } from './Text';

const Notice = styled.div`
  color: #525866;
  font-size: 12px;
  margin-top: 8px;
`;

const StyledPublishUpdateBtn = styled.div`
  display: flex;
  align-items: center;
  border-top: 1px solid #e8e9eb;
  margin-top: 32px;
`;

class PublishUpdateBtn extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    publishUpdate: PropTypes.func,
    data: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.state = {
      notificationAudience: 'FINANCIAL_CONTRIBUTORS',
      showModal: false,
    };
  }

  async onClick() {
    const { id } = this.props;
    const { notificationAudience } = this.state;
    await this.props.publishUpdate({ variables: { id, notificationAudience } });
  }

  handleShowModalChange(value) {
    this.setState({ showModal: value });
  }

  handleNotificationChange(selected) {
    this.setState({ notificationAudience: selected.value });
  }

  render() {
    const update = this.props.data.update;
    const isLoading = this.props.data.loading;
    const isHost = get(update, 'account.isHost');
    const backers = get(update, 'account.totalFinancialContributors');
    const hostedCollectives = get(update, 'account.host.totalHostedCollectives');

    const options = [
      {
        label: (
          <FormattedMessage id="update.notify.financialContributors" defaultMessage="Notify financial contributors" />
        ),
        value: 'FINANCIAL_CONTRIBUTORS',
      },
      {
        label: <FormattedMessage id="update.notify.hostedCollectiveAdmins" defaultMessage="Notify Collective admins" />,
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
            id="update.publish.notify.financialContributors"
            defaultMessage="Your Update will be sent to {n} financial contributors"
            values={{ n: backers }}
          />
        );
        break;

      case 'COLLECTIVE_ADMINS':
        notice = (
          <FormattedMessage
            id="update.publish.notify.hostedCollectiveAdmins"
            defaultMessage="Your Update will be sent to the admins of {m} hosted Collectives"
            values={{ m: hostedCollectives }}
          />
        );
        break;

      case 'ALL':
        notice = (
          <FormattedMessage
            id="update.publish.notify.Everyone"
            defaultMessage="Your Update will be sent to the admins of {m} hosted Collectives and {n} financial contributors"
            values={{ m: hostedCollectives, n: backers }}
          />
        );
        break;
    }

    return (
      <StyledPublishUpdateBtn data-cy="PublishUpdateBtn">
        <Container mt="4" mb="5" display="flex" flexDirection="column" alignItems="left" width="100%" maxWidth={400}>
          {isHost && (
            <Span>
              <Label htmlFor="whoToNotify" mb={2}>
                <FormattedMessage id="update.publish.notify.selection" defaultMessage="Select who should be notified" />
              </Label>
              <StyledSelect
                inputId="whoToNotify"
                options={options}
                defaultValue={options[0]}
                onChange={selected => this.handleNotificationChange(selected)}
                isSearchable={false}
                maxWidth={300}
              />
            </Span>
          )}
          {!isLoading && <Notice>{notice}</Notice>}
          {this.state.showModal ? (
            <ConfirmationModal
              show
              header={<FormattedMessage id="update.publish.modal.header" defaultMessage="Publish update" />}
              body={
                <FormattedMessage
                  id="update.publish.modal.body"
                  defaultMessage="Are you sure you want to publish this update?"
                />
              }
              onClose={() => this.handleShowModalChange(false)}
              cancelLabel={<FormattedMessage id="no" defaultMessage="No" />}
              cancelHandler={() => this.handleShowModalChange(false)}
              continueLabel={<FormattedMessage id="yes" defaultMessage="Yes" />}
              continueHandler={this.onClick}
            />
          ) : (
            <Container mt="3" display="flex" alignItems="center">
              <StyledButton
                buttonStyle="primary"
                onClick={() => this.handleShowModalChange(true)}
                loading={isLoading}
                minWidth={100}
                data-cy="btn-publish"
              >
                <FormattedMessage id="update.publish.btn" defaultMessage="Publish" />
              </StyledButton>
            </Container>
          )}
        </Container>
      </StyledPublishUpdateBtn>
    );
  }
}

const publishUpdateMutation = gqlV2/* GraphQL */ `
  mutation PublishUpdate($id: String!, $notificationAudience: UpdateAudienceType!) {
    publishUpdate(id: $id, notificationAudience: $notificationAudience) {
      id
      publishedAt
      notificationAudience
    }
  }
`;

const updateQuery = gqlV2/* GraphQL */ `
  query Update($id: String!) {
    update(id: $id) {
      id
      account {
        id
        isHost
        ... on AccountWithContributions {
          totalFinancialContributors
        }
        ... on Organization {
          totalFinancialContributors
          host {
            id
            totalHostedCollectives
          }
        }
        ... on Individual {
          host {
            id
            totalHostedCollectives
          }
        }
      }
    }
  }
`;

const addUpdateData = graphql(updateQuery, {
  options: {
    context: API_V2_CONTEXT,
  },
});

const addPublishUpdateMutation = graphql(publishUpdateMutation, {
  name: 'publishUpdate',
  options: {
    context: API_V2_CONTEXT,
  },
});

const addGraphql = compose(addPublishUpdateMutation, addUpdateData);

export default addGraphql(PublishUpdateBtn);
