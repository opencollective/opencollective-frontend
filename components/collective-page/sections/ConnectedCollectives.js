import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { get } from 'lodash';
import memoizeOne from 'memoize-one';
import dynamic from 'next/dynamic';
import { FormattedMessage, injectIntl } from 'react-intl';

import { CONNECTED_COLLECTIVES_ORDER_KEY } from '../../../lib/constants/collectives';
import { getErrorFromGraphqlException } from '../../../lib/errors';
import { sortConnectedCollectives, updateCollectiveInGraphQLV1Cache } from '@/lib/collective';
import { EMPTY_ARRAY } from '@/lib/constants/utils';

import Container from '../../Container';
import { CONTRIBUTE_CARD_WIDTH } from '../../contribute-cards/constants';
import { CONTRIBUTE_CARD_PADDING_X } from '../../contribute-cards/ContributeCardContainer';
import ContributeCollective from '../../contribute-cards/ContributeCollective';
import { Box } from '../../Grid';
import HorizontalScroller from '../../HorizontalScroller';
import Link from '../../Link';
import StyledButton from '../../StyledButton';
import { H3 } from '../../Text';
import ContainerSectionContent from '../ContainerSectionContent';
import ContributeCardsContainer from '../ContributeCardsContainer';
import { editAccountSettingMutation } from '../graphql/mutations';

// Dynamic imports
const AdminContributeCardsContainer = dynamic(() => import('../../contribute-cards/AdminContributeCardsContainer'), {
  ssr: false,
});

class ConnectedCollectives extends React.PureComponent {
  static propTypes = {
    /** Collective */
    collective: PropTypes.shape({
      id: PropTypes.number.isRequired,
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      isActive: PropTypes.bool,
      settings: PropTypes.object,
    }).isRequired,
    connectedCollectives: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        contributors: PropTypes.arrayOf(PropTypes.object),
        collective: PropTypes.object.isRequired,
      }),
    ),
    isAdmin: PropTypes.bool,
    editAccountSettings: PropTypes.func.isRequired,
  };

  state = {
    showConnectedCollectivesAdmin: false,
    isSaving: false,
    draggingId: null,
  };

  onConnectedCollectivesAdminReady = () => {
    this.setState({ showConnectedCollectivesAdmin: true });
  };

  getContributeCardsScrollDistance = width => {
    const oneCardScrollDistance = CONTRIBUTE_CARD_WIDTH + CONTRIBUTE_CARD_PADDING_X[0] * 2;
    if (width <= oneCardScrollDistance * 2) {
      return oneCardScrollDistance;
    } else if (width <= oneCardScrollDistance * 4) {
      return oneCardScrollDistance * 2;
    } else {
      return oneCardScrollDistance * 3;
    }
  };

  onConnectedCollectivesReorder = async cards => {
    const { collective, editAccountSettings } = this.props;
    const cardKeys = cards.map(c => c.key);

    // Save the new positions
    this.setState({ isSaving: true });
    try {
      const mutationVariables = { collectiveId: collective.id, key: CONNECTED_COLLECTIVES_ORDER_KEY, value: cardKeys };
      await editAccountSettings({
        variables: mutationVariables,
        update: (store, response) => {
          // We need to update the store manually because the response comes from API V2
          updateCollectiveInGraphQLV1Cache(store, collective.id, {
            settings: response.data.editAccountSetting.settings,
          });
        },
      });
      this.setState({ isSaving: false });
    } catch (e) {
      this.setState({ error: getErrorFromGraphqlException(e), isSaving: false });
    }
  };

  getConnectedCollectiveCards = memoizeOne(connectedCollectives => {
    return connectedCollectives.map(({ id, collective }) => ({
      key: id,
      Component: ContributeCollective,
      componentProps: {
        collective,
      },
    }));
  });

  sortConnectedCollectives = memoizeOne((connectedCollectives, orderKeys) => {
    return sortConnectedCollectives(connectedCollectives, orderKeys);
  });

  render() {
    const { collective, connectedCollectives, isAdmin } = this.props;
    const { showConnectedCollectivesAdmin, isSaving, draggingId } = this.state;

    if (!connectedCollectives?.length) {
      return null;
    }

    // Get order keys and sort connected collectives
    const orderKeys = get(collective.settings, CONNECTED_COLLECTIVES_ORDER_KEY, EMPTY_ARRAY);
    const sortedConnectedCollectives = this.sortConnectedCollectives(connectedCollectives, orderKeys);
    const connectedCollectiveCards = this.getConnectedCollectiveCards(sortedConnectedCollectives);

    return (
      <Box pb={4}>
        <ContainerSectionContent>
          <H3 fontSize={['20px', '24px', '32px']} fontWeight="normal" color="black.700">
            <FormattedMessage id="ConnectedCollectives" defaultMessage="Connected Collectives" />
          </H3>
        </ContainerSectionContent>
        <HorizontalScroller
          container={ContributeCardsContainer}
          getScrollDistance={this.getContributeCardsScrollDistance}
          containerProps={{ disableScrollSnapping: !!draggingId }}
        >
          <Fragment>
            {!(isAdmin && showConnectedCollectivesAdmin) &&
              sortedConnectedCollectives.map(({ id, collective }) => (
                <Box key={id} px={CONTRIBUTE_CARD_PADDING_X}>
                  <ContributeCollective collective={collective} />
                </Box>
              ))}
            {isAdmin && (
              <Container
                display={showConnectedCollectivesAdmin ? 'block' : 'none'}
                data-cy="admin-connected-collectives-cards"
              >
                <AdminContributeCardsContainer
                  collective={collective}
                  cards={connectedCollectiveCards}
                  onReorder={this.onConnectedCollectivesReorder}
                  isSaving={isSaving}
                  setDraggingId={draggingId => this.setState({ draggingId })}
                  draggingId={draggingId}
                  onMount={this.onConnectedCollectivesAdminReady}
                  enableReordering={true}
                />
              </Container>
            )}
          </Fragment>
        </HorizontalScroller>
        {Boolean(connectedCollectives.length > 6) && (
          <ContainerSectionContent>
            <Link href={`/${collective.slug}/connected-collectives`}>
              <StyledButton mt={4} width={1} buttonSize="small" fontSize="14px">
                <FormattedMessage id="ConnectedCollectives.ViewAll" defaultMessage="View all connected collectives" /> →
              </StyledButton>
            </Link>
          </ContainerSectionContent>
        )}
      </Box>
    );
  }
}

const addEditAccountSettingMutation = graphql(editAccountSettingMutation, {
  name: 'editAccountSettings',
});

export default injectIntl(addEditAccountSettingMutation(ConnectedCollectives));
