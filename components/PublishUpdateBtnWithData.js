import React from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { i18nGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import UpdateAudienceBreakdown from './updates/UpdateAudienceBreakdown';
import ConfirmationModal from './ConfirmationModal';
import Container from './Container';
import { Box } from './Grid';
import StyledButton from './StyledButton';
import StyledSelect from './StyledSelect';
import { Label } from './Text';
import { TOAST_TYPE, useToasts } from './ToastProvider';

const publishUpdateMutation = gqlV2/* GraphQL */ `
  mutation PublishUpdate($id: String!, $audience: UpdateAudience!) {
    publishUpdate(id: $id, notificationAudience: $audience) {
      id
      publishedAt
      notificationAudience
      userCanPublishUpdate
    }
  }
`;

const updateQuery = gqlV2/* GraphQL */ `
  query Update($id: String!, $audience: UpdateAudience!) {
    update(id: $id) {
      id
      userCanPublishUpdate
      publishedAt
      audienceStats(audience: $audience) {
        id
        total
        hosted
        individuals
        organizations
        collectives
      }
      account {
        id
        isHost
      }
    }
  }
`;

const Notice = styled.div`
  color: ${props => props.theme.colors.black[700]};
  font-size: 13px;
  margin-top: 8px;
`;

const StyledPublishUpdateBtn = styled.div`
  display: flex;
  align-items: center;
  border-top: 1px solid #e8e9eb;
  margin-top: 32px;
`;

const selectOptions = [
  {
    label: <FormattedMessage id="Update.notify.everyone" defaultMessage="Everyone" />,
    value: 'ALL',
  },
  {
    label: <FormattedMessage id="ContributorsFilter.Financial" defaultMessage="Financial contributors" />,
    value: 'FINANCIAL_CONTRIBUTORS',
  },
  {
    label: <FormattedMessage id="Update.notify.hostedCollectiveAdmins" defaultMessage="Hosted collective's admins" />,
    value: 'COLLECTIVE_ADMINS',
  },
];

const PublishUpdateBtn = ({ id, isHost }) => {
  const intl = useIntl();
  const [audience, setAudience] = React.useState('ALL');
  const [showModal, setShowModal] = React.useState(false);
  const { addToast } = useToasts();
  const { data, loading } = useQuery(updateQuery, { context: API_V2_CONTEXT, variables: { id, audience } });
  const [callPublishUpdate, { loading: isSubmitting }] = useMutation(publishUpdateMutation, {
    context: API_V2_CONTEXT,
  });
  const update = get(data, 'update');
  return (
    <StyledPublishUpdateBtn data-cy="PublishUpdateBtn">
      <Container mt="4" mb="5" display="flex" flexDirection="column" alignItems="left" width="100%" maxWidth={400}>
        {(isHost || get(update, 'account.isHost')) && (
          <Box mb={2}>
            <Label htmlFor="whoToNotify" mb={2}>
              <FormattedMessage id="update.publish.notify.selection" defaultMessage="Select who should be notified" />
            </Label>
            <StyledSelect
              inputId="whoToNotify"
              options={selectOptions}
              value={selectOptions.find(({ value }) => value === audience)}
              onChange={({ value }) => setAudience(value)}
              isSearchable={false}
              maxWidth={300}
            />
          </Box>
        )}
        <Notice>
          <UpdateAudienceBreakdown audienceStats={update?.audienceStats} isLoading={loading} />
        </Notice>
        {showModal ? (
          <ConfirmationModal
            show
            onClose={() => setShowModal(false)}
            continueLabel={<FormattedMessage id="update.publish.btn" defaultMessage="Publish" />}
            header={<FormattedMessage id="update.publish.modal.header" defaultMessage="Publish update" />}
            body={<UpdateAudienceBreakdown audienceStats={update?.audienceStats} isLoading={loading} />}
            continueHandler={async () => {
              try {
                await callPublishUpdate({ variables: { id, audience } });
              } catch (e) {
                addToast({ type: TOAST_TYPE.ERROR, message: i18nGraphqlException(intl, e) });
              } finally {
                setShowModal(false);
              }
            }}
          />
        ) : (
          <Container mt="3" display="flex" alignItems="center">
            <StyledButton
              buttonStyle="primary"
              onClick={() => setShowModal(true)}
              disabled={loading}
              loading={isSubmitting}
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
};

PublishUpdateBtn.propTypes = {
  id: PropTypes.string.isRequired,
  isHost: PropTypes.bool,
};

export default PublishUpdateBtn;
