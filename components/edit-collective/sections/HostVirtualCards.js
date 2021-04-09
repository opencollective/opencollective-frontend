import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';

import { Box, Flex, Grid } from '../../Grid';
import Loading from '../../Loading';
import StyledButton from '../../StyledButton';
import { P } from '../../Text';
import { TOAST_TYPE, useToasts } from '../../ToastProvider';
import AssignVirtualCardModal from '../AssignVirtualCardModal';
import SettingsTitle from '../SettingsTitle';
import VirtualCard from '../VirtualCard';

const hostVirtualCardsQuery = gqlV2/* GraphQL */ `
  query HostedVirtualCards($slug: String) {
    host(slug: $slug) {
      id
      legacyId
      slug
      supportedPayoutMethods
      hostedVirtualCards {
        id
        name
        last4
        data
        privateData
        createdAt
        account {
          id
          name
          imageUrl
        }
      }
    }
  }
`;

const AddCardPlaceholder = styled(Flex)`
  border-radius: 20px;
  ${props => `border: 1px dashed ${props.theme.colors.primary[500]};`}
`;

const HostVirtualCards = props => {
  const { loading, data, refetch } = useQuery(hostVirtualCardsQuery, {
    context: API_V2_CONTEXT,
    variables: { slug: props.collective.slug },
  });
  const { addToast } = useToasts();
  const [displayAssignCardModal, setAssignCardModalDisplay] = React.useState(false);
  const handleSucess = () => {
    addToast({
      type: TOAST_TYPE.SUCCESS,
      message: <FormattedMessage id="Host.VirtualCards.AddNewCard.Success" defaultMessage="Card successfully added" />,
    });
    setAssignCardModalDisplay(false);
    refetch();
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <Fragment>
      <SettingsTitle>
        <FormattedMessage id="VirtualCards.Title" defaultMessage="Virtual Cards" />
      </SettingsTitle>

      <Box>
        <P>
          <FormattedMessage
            id="Host.VirtualCards.Description"
            defaultMessage="You can now manage and distribute Virtual Cards created on Privacy.com directly on Open Collective. You can assign multiple virtual cards to one collective. Virtual Cards enable quicker transactions, making disbursing money a lot easier! Learn more"
          />
        </P>
      </Box>
      <Grid mt={4} gridTemplateColumns={['100%', '366px 366px']} gridGap="32px 24px">
        <AddCardPlaceholder
          width="366px"
          height="248px"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
        >
          <StyledButton
            my={1}
            buttonStyle="primary"
            buttonSize="round"
            data-cy="confirmation-modal-continue"
            onClick={() => setAssignCardModalDisplay(true)}
          >
            +
          </StyledButton>
          <Box mt="10px">
            <FormattedMessage id="Host.VirtualCards.AddNewCard" defaultMessage="Add New Card" />
          </Box>
        </AddCardPlaceholder>
        {data.host.hostedVirtualCards.map(vc => (
          <VirtualCard key={vc.id} {...vc} onUpdate={refetch} hasActions />
        ))}
      </Grid>
      {displayAssignCardModal && (
        <AssignVirtualCardModal
          host={data.host}
          onSuccess={handleSucess}
          onClose={() => setAssignCardModalDisplay(false)}
          show
        />
      )}
    </Fragment>
  );
};

HostVirtualCards.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string,
  }),
  hideTopsection: PropTypes.func,
};

export default HostVirtualCards;
