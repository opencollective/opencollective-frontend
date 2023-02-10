import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

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

class ConnectedCollectives extends React.PureComponent {
  static propTypes = {
    /** Collective */
    collective: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      isActive: PropTypes.bool,
    }).isRequired,
    connectedCollectives: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        contributors: PropTypes.arrayOf(PropTypes.object),
      }),
    ),
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

  render() {
    const { collective, connectedCollectives } = this.props;

    if (!connectedCollectives?.length) {
      return null;
    }

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
        >
          {connectedCollectives.map(({ id, collective }) => (
            <Box key={id} px={CONTRIBUTE_CARD_PADDING_X}>
              <ContributeCollective collective={collective} />
            </Box>
          ))}
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

export default injectIntl(ConnectedCollectives);
