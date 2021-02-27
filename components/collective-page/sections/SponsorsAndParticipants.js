import React from 'react';
import PropTypes from 'prop-types';
import { get, uniqBy } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { exportRSVPs } from '../../../lib/export_file';

import { Box } from '../../Grid';
import Responses from '../../Responses';
import Sponsors from '../../Sponsors';
import ContainerSectionContent from '../ContainerSectionContent';
import SectionTitle from '../SectionTitle';

const StyledAdminActions = styled.div`
  text-align: center;
  text-transform: uppercase;
  font-size: 1.3rem;
  font-weight: 600;
  letter-spacing: 0.05rem;
  ul {
    overflow: hidden;
    text-align: center;
    margin: 0 auto;
    padding: 0;
    display: flex;
    justify-content: center;
    flex-direction: row;
    list-style: none;

    li {
      margin: 0 2rem;
    }
  }
`;

const Participants = ({ collective: event, LoggedInUser, refetch }) => {
  const [isRefetched, setIsRefetched] = React.useState(false);

  // const ticketOrders = event.orders
  //   .filter(order => (order.tier && order.tier.type === TierTypes.TICKET))
  //   .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Logic from old Event component, (filter away tiers with 'sponsor in the name')
  // to handle orders where there is no tier to check for TICKET:
  const orders = [...event.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const guestOrders = [];
  const sponsorOrders = [];
  orders.forEach(order => {
    if (get(order, 'tier.name', '').match(/sponsor/i)) {
      sponsorOrders.push(order);
    } else {
      guestOrders.push(order);
    }
  });

  const responses = uniqBy(guestOrders, order => order.fromCollective && order.fromCollective.id).map(order => ({
    user: order.fromCollective,
    createdAt: order.createdAt,
    status: 'YES',
  }));

  const sponsors = sponsorOrders.map(order => {
    const sponsorCollective = Object.assign({}, order.fromCollective);
    sponsorCollective.tier = order.tier;
    sponsorCollective.createdAt = new Date(order.createdAt);
    return sponsorCollective;
  });

  const canEditEvent = LoggedInUser && LoggedInUser.canEditEvent(event);

  React.useEffect(() => {
    const refreshData = async () => {
      if (canEditEvent) {
        await refetch();
        setIsRefetched(true);
      }
    };

    refreshData();
  }, [LoggedInUser]);

  return (
    <Box pb={4}>
      {sponsors.length > 0 && (
        <ContainerSectionContent pt={[4, 5]}>
          <SectionTitle textAlign="center">
            <FormattedMessage id="event.sponsors.title" defaultMessage="Sponsors" />
          </SectionTitle>
          <Sponsors sponsors={sponsors} />
        </ContainerSectionContent>
      )}
      {responses.length > 0 && (
        <ContainerSectionContent pt={[4, 5]}>
          <SectionTitle textAlign="center">
            <FormattedMessage
              id="event.responses.title.going"
              values={{ n: responses.length }}
              defaultMessage="{n} {n, plural, one {person going} other {people going}}"
            />
          </SectionTitle>
          {canEditEvent && isRefetched && (
            <StyledAdminActions>
              <ul>
                <li>
                  <a href={`mailto:${event.slug}@${event.parentCollective.slug}.opencollective.com`}>
                    <FormattedMessage id="Event.SendEmail" defaultMessage="Send email" />
                  </a>
                </li>
                <li>
                  <a role="button" onClick={() => exportRSVPs(event)}>
                    <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
                  </a>
                </li>
              </ul>
            </StyledAdminActions>
          )}
          <Responses responses={responses} />
        </ContainerSectionContent>
      )}
    </Box>
  );
};

Participants.propTypes = {
  collective: PropTypes.shape({
    orders: PropTypes.array,
  }).isRequired,
  LoggedInUser: PropTypes.object,
  refetch: PropTypes.func,
};

export default Participants;
